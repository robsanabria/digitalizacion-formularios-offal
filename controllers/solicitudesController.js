const { poolPromise, sql } = require('../config/db');
const storageService = require('../services/storageService');

const getSolicitudes = async (req, res) => {
    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');
        const result = await pool.request().query('SELECT * FROM Solicitudes ORDER BY FechaCreacion DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener solicitudes', detalle: err.message });
    }
};

const getSolicitudById = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query(`
                SELECT s.*, u.NombreUsuario AS SolicitanteNombre
                FROM Solicitudes s
                LEFT JOIN Usuarios u ON s.SolicitadoPor = u.UsuarioId
                WHERE s.SolicitudId = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
        }
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener la solicitud', detalle: err.message });
    }
};

const createSolicitud = async (req, res) => {
    const {
        fechaSolicitud, sectorSolicitante, motivo, nombreProducto, codigoProducto,
        destino, vidaUtil, codigoSenasa, impresoras, tara, pesoMinimo, pesoMaximo,
        pesoEstandar, numCaja, faja, codigoExterno, comentariosSolicitante, cambioSolicitado
    } = req.body;

    const solicitadoPor = req.user.UsuarioId;
    const rolSolicitante = req.user.Rol;

    // Validación: todos los campos del REG-11 son obligatorios.
    const tieneTexto = (v) => v != null && String(v).trim() !== '';
    const tieneItems = (v) => {
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'string') { try { const a = JSON.parse(v); return Array.isArray(a) ? a.length > 0 : v.trim() !== ''; } catch { return v.trim() !== ''; } }
        return false;
    };
    const requeridosTexto = {
        fechaSolicitud, sectorSolicitante, nombreProducto, codigoProducto, destino,
        vidaUtil, codigoSenasa, tara, pesoMinimo, pesoMaximo, pesoEstandar,
        numCaja, faja, codigoExterno, comentariosSolicitante, cambioSolicitado
    };
    const faltantes = Object.entries(requeridosTexto)
        .filter(([, v]) => !tieneTexto(v))
        .map(([k]) => k);
    if (!tieneItems(motivo)) faltantes.push('motivo');
    if (!tieneItems(impresoras)) faltantes.push('impresoras');
    if (faltantes.length > 0) {
        return res.status(400).json({ error: 'Campos obligatorios incompletos', detalle: `Faltan: ${faltantes.join(', ')}` });
    }

    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        // Estado inicial: el REG-SIS-011 creado por Calidad queda pendiente de
        // aprobación por parte de Sistemas (nueva compuerta previa al REG-007).
        const estadoInicial = 'REG-011-PENDIENTE-APROBACION';

        const result = await pool.request()
            .input('solicitadoPor', sql.UniqueIdentifier, solicitadoPor)
            .input('rolSolicitante', sql.NVarChar, rolSolicitante)
            .input('fechaSolicitud', sql.Date, fechaSolicitud)
            .input('sectorSolicitante', sql.NVarChar, sectorSolicitante)
            .input('motivo', sql.NVarChar, typeof motivo === 'string' ? motivo : JSON.stringify(motivo))
            .input('nombreProducto', sql.NVarChar, nombreProducto)
            .input('codigoProducto', sql.NVarChar, codigoProducto)
            .input('destino', sql.NVarChar, destino)
            .input('vidaUtil', sql.NVarChar, vidaUtil)
            .input('codigoSenasa', sql.NVarChar, codigoSenasa)
            .input('impresoras', sql.NVarChar, typeof impresoras === 'string' ? impresoras : JSON.stringify(impresoras))
            .input('tara', sql.NVarChar, tara)
            .input('pesoMinimo', sql.NVarChar, pesoMinimo)
            .input('pesoMaximo', sql.NVarChar, pesoMaximo)
            .input('pesoEstandar', sql.NVarChar, pesoEstandar)
            .input('numCaja', sql.NVarChar, numCaja)
            .input('faja', sql.NVarChar, faja)
            .input('codigoExterno', sql.NVarChar, codigoExterno)
            .input('comentariosSolicitante', sql.NVarChar, comentariosSolicitante)
            .input('cambioSolicitado', sql.NVarChar, cambioSolicitado)
            .input('estado', sql.NVarChar, estadoInicial)
            .query(`
                INSERT INTO Solicitudes (
                    SolicitadoPor, RolSolicitante, FechaSolicitud, SectorSolicitante, Motivo, 
                    NombreProducto, CodigoProducto, Destino, VidaUtil, CodigoSenasa, 
                    Impresoras, Tara, PesoMinimo, PesoMaximo, PesoEstandar, 
                    NumCaja, Faja, CodigoExterno, ComentariosSolicitante, CambioSolicitado, Estado
                ) 
                OUTPUT INSERTED.SolicitudId
                VALUES (
                    @solicitadoPor, @rolSolicitante, @fechaSolicitud, @sectorSolicitante, @motivo, 
                    @nombreProducto, @codigoProducto, @destino, @vidaUtil, @codigoSenasa, 
                    @impresoras, @tara, @pesoMinimo, @pesoMaximo, @pesoEstandar, 
                    @numCaja, @faja, @codigoExterno, @comentariosSolicitante, @cambioSolicitado, @estado
                )
            `);

        const solicitudId = result.recordset[0].SolicitudId;

        // Registrar en historial
        await pool.request()
            .input('solicitudId', sql.UniqueIdentifier, solicitudId)
            .input('usuarioId', sql.UniqueIdentifier, solicitadoPor)
            .input('estadoNuevo', sql.NVarChar, estadoInicial)
            .input('accion', sql.NVarChar, 'Creación de REG-SIS-011')
            .query(`
                INSERT INTO Historial (SolicitudId, UsuarioId, EstadoAnterior, EstadoNuevo, Accion)
                VALUES (@solicitudId, @usuarioId, 'Nuevo', @estadoNuevo, @accion)
            `);

        res.status(201).json({ mensaje: 'REG-SIS-011 creado con éxito', solicitudId });
    } catch (err) {
        console.error('Error en createSolicitud:', err);
        res.status(500).json({ error: 'Error al crear la solicitud', detalle: err.message });
    }
};

// Estados en los que Sistemas tiene habilitado completar el REG-007.
// Incluye el legacy 'REG-011-PENDIENTE' por retrocompatibilidad con registros previos.
const ESTADOS_REG011_APROBADO = ['REG-011-APROBADO', 'REG-011-PENDIENTE'];

const updateSolicitud = async (req, res) => {
    const { id } = req.params;
    const b = req.body;
    const { UsuarioId, Rol } = req.user;

    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        // Estado actual para validar la transición
        const solRes = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT Estado FROM Solicitudes WHERE SolicitudId = @id');

        if (solRes.recordset.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }
        const estadoActual = solRes.recordset[0].Estado;

        // ── Caso A: Calidad corrige y reenvía un REG-11 observado ──────────────
        if (b.intent === 'reenviar_reg11' || estadoActual === 'REG-011-OBSERVADO') {
            if (!['CALIDAD', 'ADMIN'].includes(Rol)) {
                return res.status(403).json({ error: 'No autorizado', detalle: 'Solo Calidad puede corregir y reenviar el REG-11.' });
            }
            if (estadoActual !== 'REG-011-OBSERVADO') {
                return res.status(400).json({ error: 'Operación no permitida', detalle: 'El REG-11 no está observado, no puede reenviarse.' });
            }

            const nuevoEstado = 'REG-011-PENDIENTE-APROBACION';
            await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('fechaSolicitud', sql.Date, b.fechaSolicitud)
                .input('sectorSolicitante', sql.NVarChar, b.sectorSolicitante)
                .input('motivo', sql.NVarChar, b.motivo == null ? null : (typeof b.motivo === 'string' ? b.motivo : JSON.stringify(b.motivo)))
                .input('nombreProducto', sql.NVarChar, b.nombreProducto)
                .input('codigoProducto', sql.NVarChar, b.codigoProducto)
                .input('destino', sql.NVarChar, b.destino)
                .input('vidaUtil', sql.NVarChar, b.vidaUtil)
                .input('codigoSenasa', sql.NVarChar, b.codigoSenasa)
                .input('impresoras', sql.NVarChar, b.impresoras == null ? null : (typeof b.impresoras === 'string' ? b.impresoras : JSON.stringify(b.impresoras)))
                .input('tara', sql.NVarChar, b.tara)
                .input('pesoMinimo', sql.NVarChar, b.pesoMinimo)
                .input('pesoMaximo', sql.NVarChar, b.pesoMaximo)
                .input('pesoEstandar', sql.NVarChar, b.pesoEstandar)
                .input('numCaja', sql.NVarChar, b.numCaja)
                .input('faja', sql.NVarChar, b.faja)
                .input('codigoExterno', sql.NVarChar, b.codigoExterno)
                .input('comentariosSolicitante', sql.NVarChar, b.comentariosSolicitante)
                .input('cambioSolicitado', sql.NVarChar, b.cambioSolicitado)
                .input('estado', sql.NVarChar, nuevoEstado)
                .query(`
                    UPDATE Solicitudes
                    SET FechaSolicitud = ISNULL(@fechaSolicitud, FechaSolicitud),
                        SectorSolicitante = ISNULL(@sectorSolicitante, SectorSolicitante),
                        Motivo = ISNULL(@motivo, Motivo),
                        NombreProducto = ISNULL(@nombreProducto, NombreProducto),
                        CodigoProducto = ISNULL(@codigoProducto, CodigoProducto),
                        Destino = ISNULL(@destino, Destino),
                        VidaUtil = ISNULL(@vidaUtil, VidaUtil),
                        CodigoSenasa = ISNULL(@codigoSenasa, CodigoSenasa),
                        Impresoras = ISNULL(@impresoras, Impresoras),
                        Tara = ISNULL(@tara, Tara),
                        PesoMinimo = ISNULL(@pesoMinimo, PesoMinimo),
                        PesoMaximo = ISNULL(@pesoMaximo, PesoMaximo),
                        PesoEstandar = ISNULL(@pesoEstandar, PesoEstandar),
                        NumCaja = ISNULL(@numCaja, NumCaja),
                        Faja = ISNULL(@faja, Faja),
                        CodigoExterno = ISNULL(@codigoExterno, CodigoExterno),
                        ComentariosSolicitante = ISNULL(@comentariosSolicitante, ComentariosSolicitante),
                        CambioSolicitado = ISNULL(@cambioSolicitado, CambioSolicitado),
                        Estado = @estado
                    WHERE SolicitudId = @id
                `);

            await pool.request()
                .input('solicitudId', sql.UniqueIdentifier, id)
                .input('usuarioId', sql.UniqueIdentifier, UsuarioId)
                .input('estadoAnterior', sql.NVarChar, estadoActual)
                .input('estadoNuevo', sql.NVarChar, nuevoEstado)
                .input('accion', sql.NVarChar, 'REG-11 corregido y reenviado a Sistemas')
                .input('comentario', sql.NVarChar, b.comentario || null)
                .query(`
                    INSERT INTO Historial (SolicitudId, UsuarioId, EstadoAnterior, EstadoNuevo, Accion, Comentario)
                    VALUES (@solicitudId, @usuarioId, @estadoAnterior, @estadoNuevo, @accion, @comentario)
                `);

            return res.json({ mensaje: 'REG-11 corregido y reenviado a Sistemas', nuevoEstado });
        }

        // ── Caso B: Sistemas completa el REG-007 ───────────────────────────────
        if (!['SISTEMAS', 'ADMIN'].includes(Rol)) {
            return res.status(403).json({ error: 'No autorizado', detalle: 'Solo Sistemas puede completar el REG-007.' });
        }
        if (!ESTADOS_REG011_APROBADO.includes(estadoActual)) {
            return res.status(400).json({
                error: 'Operación no permitida',
                detalle: 'El REG-11 debe estar aprobado por Sistemas antes de completar el REG-007.'
            });
        }

        // Validación: campos del REG-007 obligatorios + al menos una etiqueta propuesta.
        const reg07Texto = (v) => v != null && String(v).trim() !== '';
        const faltan07 = [];
        if (!reg07Texto(b.fechaPresentacion)) faltan07.push('fechaPresentacion');
        if (!reg07Texto(b.codigoTwins)) faltan07.push('codigoTwins');
        if (!reg07Texto(b.correspondeSolicitud)) faltan07.push('correspondeSolicitud');

        const propuestos = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query("SELECT COUNT(*) AS Total FROM Adjuntos WHERE SolicitudId = @id AND TipoAdjunto = 'PROPUESTO'");
        if ((propuestos.recordset[0]?.Total || 0) === 0) {
            faltan07.push('al menos una etiqueta técnica (Formato Propuesto)');
        }
        if (faltan07.length > 0) {
            return res.status(400).json({ error: 'REG-007 incompleto', detalle: `Faltan: ${faltan07.join(', ')}` });
        }

        const nuevoEstado = b.estado || 'REG-007-PENDIENTE-APROBACION';
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('fechaPresentacion', sql.Date, b.fechaPresentacion)
            .input('codigoTwins', sql.NVarChar, b.codigoTwins)
            .input('correspondeSolicitud', sql.NVarChar, b.correspondeSolicitud)
            .input('estado', sql.NVarChar, nuevoEstado)
            .query(`
                UPDATE Solicitudes
                SET FechaPresentacion = ISNULL(@fechaPresentacion, FechaPresentacion),
                    CodigoTwins = ISNULL(@codigoTwins, CodigoTwins),
                    CorrespondeSolicitud = ISNULL(@correspondeSolicitud, CorrespondeSolicitud),
                    Estado = ISNULL(@estado, Estado)
                WHERE SolicitudId = @id
            `);

        await pool.request()
            .input('solicitudId', sql.UniqueIdentifier, id)
            .input('usuarioId', sql.UniqueIdentifier, UsuarioId)
            .input('estadoAnterior', sql.NVarChar, estadoActual)
            .input('estadoNuevo', sql.NVarChar, nuevoEstado)
            .input('accion', sql.NVarChar, 'Respuesta Sistemas (REG-SIS-007)')
            .query(`
                INSERT INTO Historial (SolicitudId, UsuarioId, EstadoAnterior, EstadoNuevo, Accion)
                VALUES (@solicitudId, @usuarioId, @estadoAnterior, @estadoNuevo, @accion)
            `);

        res.json({ mensaje: 'Solicitud actualizada (REG-007 completado)' });
    } catch (err) {
        console.error('[Controller] Error en updateSolicitud:', err);
        res.status(500).json({ error: 'Error al actualizar la solicitud', detalle: err.message });
    }
};

const addAdjunto = async (req, res) => {
    const { id } = req.params;
    const file = req.file;
    const { tipo } = req.query; // 'ORIGINAL' o 'PROPUESTO'
    const { Rol } = req.user;

    if (!file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    // Validación de roles de acuerdo al tipo de adjunto
    if (tipo === 'ORIGINAL' && !['CALIDAD', 'ADMIN'].includes(Rol)) {
        return res.status(403).json({ error: 'No autorizado', detalle: 'Solo personal de Calidad o Administradores pueden subir archivos originales.' });
    }
    if (tipo === 'PROPUESTO' && !['SISTEMAS', 'ADMIN'].includes(Rol)) {
        return res.status(403).json({ error: 'No autorizado', detalle: 'Solo personal de Sistemas o Administradores pueden subir archivos propuestos.' });
    }

    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        // Verificar el estado de la solicitud
        const solRes = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT Estado FROM Solicitudes WHERE SolicitudId = @id');

        if (solRes.recordset.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        const estado = solRes.recordset[0].Estado;
        if (estado === 'APROBADO' || estado === 'RECHAZADO') {
            return res.status(400).json({ error: 'Operación no permitida', detalle: 'No se pueden añadir archivos a una solicitud finalizada (Aprobada o Rechazada).' });
        }

        // 1. Subir a Azure Blob Storage
        const { url, blobName } = await storageService.uploadFile(id, file);

        // 2. Guardar metadatos en la base de datos
        await pool.request()
            .input('solicitudId', sql.UniqueIdentifier, id)
            .input('nombreArchivo', sql.NVarChar, file.originalname)
            .input('rutaArchivo', sql.NVarChar, url)
            .input('tipoContenido', sql.NVarChar, file.mimetype)
            .input('tamano', sql.BigInt, file.size)
            .input('tipoAdjunto', sql.NVarChar, tipo || 'PROPUESTO')
            .query(`
                INSERT INTO Adjuntos (SolicitudId, NombreArchivo, RutaArchivo, TipoContenido, TamanoArchivo, TipoAdjunto)
                VALUES (@solicitudId, @nombreArchivo, @rutaArchivo, @tipoContenido, @tamano, @tipoAdjunto)
            `);

        res.status(201).json({
            mensaje: 'Archivo subido con éxito',
            url: url
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al procesar el adjunto', detalle: err.message });
    }
};

const getAdjuntosBySolicitud = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');
        const result = await pool.request()
            .input('solicitudId', sql.UniqueIdentifier, id)
            .query('SELECT * FROM Adjuntos WHERE SolicitudId = @solicitudId');

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener adjuntos', detalle: err.message });
    }
};

const downloadAdjunto = async (req, res) => {
    const { id, adjuntoId } = req.params;
    console.log(`[Controller] Petición de descarga para AdjuntoId: ${adjuntoId}`);
    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        const result = await pool.request()
            .input('adjuntoId', sql.UniqueIdentifier, adjuntoId)
            .query('SELECT RutaArchivo, NombreArchivo, TipoContenido FROM Adjuntos WHERE AdjuntoId = @adjuntoId');

        if (result.recordset.length === 0) {
            console.warn(`[Controller] Adjunto no encontrado en DB: ${adjuntoId}`);
            return res.status(404).json({ mensaje: 'Archivo no encontrado' });
        }

        const { RutaArchivo, NombreArchivo, TipoContenido } = result.recordset[0];
        console.log(`[Controller] URL recuperada de DB: ${RutaArchivo}`);

        // Extraer el blobName de la URL
        const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'regsis-attachments';
        const urlParts = RutaArchivo.split(`/${containerName}/`);

        if (urlParts.length < 2) {
            console.error(`[Controller] Error al parsear URL. No se encontró /${containerName}/ en ${RutaArchivo}`);
            return res.status(500).json({ error: 'Error interno al procesar la ruta del archivo' });
        }

        const blobName = decodeURIComponent(urlParts[1]);
        console.log(`[Controller] Nombre de blob identificado: ${blobName}`);

        const { readableStream, contentType, contentLength } = await storageService.downloadFile(blobName);

        res.set({
            'Content-Type': contentType || TipoContenido,
            'Content-Length': contentLength,
            'Content-Disposition': `attachment; filename="${NombreArchivo}"`
        });

        readableStream.on('error', (streamErr) => {
            console.error('[Controller] Error en el stream de descarga:', streamErr);
            if (!res.headersSent) {
                res.status(500).send('Error durante la transmisión del archivo');
            }
        });

        readableStream.pipe(res);
    } catch (err) {
        console.error('[Controller] Error general en downloadAdjunto:', err);
        res.status(500).json({ error: 'Error al descargar el archivo', detalle: err.message });
    }
};

// ─── Máquina de estados ────────────────────────────────────────────────────────
/**
 * POST /api/solicitudes/:id/transition
 * Body: { action, comentario?: string }
 *
 * Acciones y circuito:
 *   aprobar_reg11  (SISTEMAS/ADMIN): REG-011-PENDIENTE-APROBACION → REG-011-APROBADO
 *   rechazar_reg11 (SISTEMAS/ADMIN): REG-011-PENDIENTE-APROBACION → REG-011-OBSERVADO (vuelve a Calidad)
 *   approve        (CALIDAD/ADMIN) : REG-007-PENDIENTE-APROBACION → APROBADO (aprobación final)
 *   reject         (CALIDAD/ADMIN) : REG-007-PENDIENTE-APROBACION → RECHAZADO
 */
const transitionSolicitud = async (req, res) => {
    const { id } = req.params;
    const { action, comentario } = req.body;
    const { UsuarioId, Rol } = req.user;

    // 'approve'/'reject' se mantienen como la aprobación final de Calidad (compatibilidad).
    const ACCIONES_VALIDAS = ['aprobar_reg11', 'rechazar_reg11', 'approve', 'reject'];
    if (!ACCIONES_VALIDAS.includes(action)) {
        return res.status(400).json({ error: `Acción inválida. Use una de: ${ACCIONES_VALIDAS.join(', ')}` });
    }

    const esSistemas = Rol === 'SISTEMAS' || Rol === 'ADMIN';
    const esCalidad = Rol === 'CALIDAD' || Rol === 'ADMIN';
    // Estados desde los que Sistemas puede aprobar/rechazar el REG-11.
    // El legacy 'REG-011-PENDIENTE' NO entra aquí: predata la compuerta y se trata
    // como ya aprobado (listo para completar el REG-07).
    const PENDIENTE_REG11 = ['REG-011-PENDIENTE-APROBACION'];

    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        // 1. Obtener estado actual
        const solRes = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT Estado FROM Solicitudes WHERE SolicitudId = @id');

        if (solRes.recordset.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        const estadoActual = solRes.recordset[0].Estado;

        // 2. Calcular nuevo estado según la acción
        let nuevoEstado;
        let accionDescripcion;

        switch (action) {
            case 'aprobar_reg11':
                if (!esSistemas) return res.status(403).json({ error: 'Solo Sistemas puede aprobar el REG-11' });
                if (!PENDIENTE_REG11.includes(estadoActual)) {
                    return res.status(400).json({ error: 'El REG-11 no está pendiente de aprobación de Sistemas' });
                }
                nuevoEstado = 'REG-011-APROBADO';
                accionDescripcion = 'REG-11 aprobado por Sistemas';
                break;

            case 'rechazar_reg11':
                if (!esSistemas) return res.status(403).json({ error: 'Solo Sistemas puede observar el REG-11' });
                if (!PENDIENTE_REG11.includes(estadoActual)) {
                    return res.status(400).json({ error: 'El REG-11 no está pendiente de aprobación de Sistemas' });
                }
                nuevoEstado = 'REG-011-OBSERVADO';
                accionDescripcion = 'REG-11 observado por Sistemas (devuelto a Calidad)';
                break;

            case 'approve':
                if (!esCalidad) return res.status(403).json({ error: 'Solo Calidad puede dar la aprobación final' });
                if (estadoActual !== 'REG-007-PENDIENTE-APROBACION') {
                    return res.status(400).json({ error: 'El REG-07 no está pendiente de aprobación de Calidad' });
                }
                nuevoEstado = 'APROBADO';
                accionDescripcion = 'Aprobado por Calidad → Finalizado';
                break;

            case 'reject':
                if (!esCalidad) return res.status(403).json({ error: 'Solo Calidad puede rechazar el REG-07' });
                if (estadoActual !== 'REG-007-PENDIENTE-APROBACION') {
                    return res.status(400).json({ error: 'El REG-07 no está pendiente de aprobación de Calidad' });
                }
                nuevoEstado = 'RECHAZADO';
                accionDescripcion = 'Rechazado por Calidad';
                break;
        }

        // 3. Actualizar estado en Solicitudes
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('estado', sql.NVarChar, nuevoEstado)
            .query('UPDATE Solicitudes SET Estado = @estado WHERE SolicitudId = @id');

        // 4. Registrar en Historial
        await pool.request()
            .input('solicitudId', sql.UniqueIdentifier, id)
            .input('usuarioId', sql.UniqueIdentifier, UsuarioId)
            .input('estadoAnterior', sql.NVarChar, estadoActual)
            .input('estadoNuevo', sql.NVarChar, nuevoEstado)
            .input('accion', sql.NVarChar, accionDescripcion)
            .input('comentario', sql.NVarChar, comentario || null)
            .query(`
                INSERT INTO Historial (SolicitudId, UsuarioId, EstadoAnterior, EstadoNuevo, Accion, Comentario)
                VALUES (@solicitudId, @usuarioId, @estadoAnterior, @estadoNuevo, @accion, @comentario)
            `);

        res.json({ mensaje: 'Transición registrada', nuevoEstado });
    } catch (err) {
        console.error('[Controller] Error en transitionSolicitud:', err);
        res.status(500).json({ error: 'Error al procesar la transición', detalle: err.message });
    }
};

// ─── Historial ────────────────────────────────────────────────────────────────
const getHistorial = async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        const result = await pool.request()
            .input('solicitudId', sql.UniqueIdentifier, id)
            .query(`
                SELECT h.*, u.NombreUsuario
                FROM Historial h
                LEFT JOIN Usuarios u ON h.UsuarioId = u.UsuarioId
                WHERE h.SolicitudId = @solicitudId
                ORDER BY h.FechaEvento ASC
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener historial', detalle: err.message });
    }
};

/* exportSolicitud removed — keeping backend minimal per user's request */

const deleteAdjunto = async (req, res) => {
    const { id, adjuntoId } = req.params;
    const { Rol } = req.user;
    console.log(`[Controller] Petición de eliminación para AdjuntoId: ${adjuntoId}`);
    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        // 1. Buscar el adjunto y verificar tipo
        const result = await pool.request()
            .input('adjuntoId', sql.UniqueIdentifier, adjuntoId)
            .query('SELECT RutaArchivo, TipoAdjunto FROM Adjuntos WHERE AdjuntoId = @adjuntoId');

        if (result.recordset.length === 0) {
            console.warn(`[Controller] Adjunto no encontrado en DB: ${adjuntoId}`);
            return res.status(404).json({ mensaje: 'Archivo no encontrado' });
        }

        const { RutaArchivo, TipoAdjunto } = result.recordset[0];

        // Validación de roles de acuerdo al tipo de adjunto a eliminar
        if (TipoAdjunto === 'ORIGINAL' && !['CALIDAD', 'ADMIN'].includes(Rol)) {
            return res.status(403).json({ error: 'No autorizado', detalle: 'Solo Calidad o Administradores pueden eliminar archivos originales.' });
        }
        if (TipoAdjunto === 'PROPUESTO' && !['SISTEMAS', 'ADMIN'].includes(Rol)) {
            return res.status(403).json({ error: 'No autorizado', detalle: 'Solo Sistemas o Administradores pueden eliminar archivos propuestos.' });
        }

        // Verificar el estado de la solicitud
        const solRes = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT Estado FROM Solicitudes WHERE SolicitudId = @id');

        if (solRes.recordset.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        const estado = solRes.recordset[0].Estado;
        if (estado === 'APROBADO' || estado === 'RECHAZADO') {
            return res.status(400).json({ error: 'Operación no permitida', detalle: 'No se pueden eliminar archivos de una solicitud finalizada.' });
        }

        // 2. Intentar eliminar de Azure Blob Storage (si tiene ruta)
        if (RutaArchivo) {
            const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'regsis-attachments';
            const urlParts = RutaArchivo.split(`/${containerName}/`);
            if (urlParts.length >= 2) {
                const blobName = decodeURIComponent(urlParts[1]);
                try {
                    await storageService.deleteFile(blobName);
                } catch (storageErr) {
                    console.error('[Controller] Error al borrar de storage, procediendo con borrado DB igualmente:', storageErr);
                }
            }
        }

        // 3. Eliminar de la base de datos
        await pool.request()
            .input('adjuntoId', sql.UniqueIdentifier, adjuntoId)
            .query('DELETE FROM Adjuntos WHERE AdjuntoId = @adjuntoId');

        res.json({ mensaje: 'Archivo eliminado con éxito' });
    } catch (err) {
        console.error('[Controller] Error general en deleteAdjunto:', err);
        res.status(500).json({ error: 'Error al eliminar el archivo', detalle: err.message });
    }
};

module.exports = {
    getSolicitudes,
    getSolicitudById,
    createSolicitud,
    updateSolicitud,
    addAdjunto,
    getAdjuntosBySolicitud,
    downloadAdjunto,
    deleteAdjunto,
    transitionSolicitud,
    getHistorial
};


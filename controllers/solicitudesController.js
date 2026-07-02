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
        pesoEstandar, numCaja, faja, codigoExterno, comentariosSolicitante, cambioSolicitado,
        tipoEtiqueta
    } = req.body;

    const solicitadoPor = req.user.UsuarioId;
    const rolSolicitante = req.user.Rol;

    // Validación: todos los campos del REG-SIS-011 son obligatorios.
    const tieneTexto = (v) => v != null && String(v).trim() !== '';
    const tieneItems = (v) => {
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'string') { try { const a = JSON.parse(v); return Array.isArray(a) ? a.length > 0 : v.trim() !== ''; } catch { return v.trim() !== ''; } }
        return false;
    };
    const requeridosTexto = {
        fechaSolicitud, sectorSolicitante, nombreProducto, codigoProducto, destino,
        vidaUtil, codigoSenasa, tara, pesoMinimo, pesoMaximo, pesoEstandar,
        numCaja, faja, codigoExterno, cambioSolicitado
    };
    const faltantes = Object.entries(requeridosTexto)
        .filter(([, v]) => !tieneTexto(v))
        .map(([k]) => k);
    if (!tieneItems(motivo)) faltantes.push('motivo');
    if (!tieneItems(impresoras)) faltantes.push('impresoras');
    if (!tieneItems(tipoEtiqueta)) faltantes.push('tipo de etiqueta a modificar');
    if (faltantes.length > 0) {
        return res.status(400).json({ error: 'Campos obligatorios incompletos', detalle: `Faltan: ${faltantes.join(', ')}` });
    }

    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        // Estado inicial: el REG-SIS-011 creado por Calidad queda pendiente de
        // aprobación por parte de Sistemas (nueva compuerta previa al REG-SIS-007).
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
            .input('tipoEtiqueta', sql.NVarChar, typeof tipoEtiqueta === 'string' ? tipoEtiqueta : JSON.stringify(tipoEtiqueta))
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
                    Impresoras, TipoEtiqueta, Tara, PesoMinimo, PesoMaximo, PesoEstandar,
                    NumCaja, Faja, CodigoExterno, ComentariosSolicitante, CambioSolicitado, Estado
                )
                OUTPUT INSERTED.SolicitudId
                VALUES (
                    @solicitadoPor, @rolSolicitante, @fechaSolicitud, @sectorSolicitante, @motivo,
                    @nombreProducto, @codigoProducto, @destino, @vidaUtil, @codigoSenasa,
                    @impresoras, @tipoEtiqueta, @tara, @pesoMinimo, @pesoMaximo, @pesoEstandar,
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

// Estados en los que Sistemas tiene habilitado completar el REG-SIS-007.
// Incluye el legacy 'REG-011-PENDIENTE' por retrocompatibilidad con registros previos.
// Se incluye 'REG-007-PARCIAL': cuando Calidad aprueba parcialmente, el REG-SIS-007
// vuelve a Sistemas para que corrija y lo reenvíe.
const ESTADOS_REG011_APROBADO = ['REG-011-APROBADO', 'REG-011-PENDIENTE', 'REG-007-PARCIAL'];

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

        // ── Caso A: Calidad corrige y reenvía un REG-SIS-011 observado ──────────────
        if (b.intent === 'reenviar_reg11' || estadoActual === 'REG-011-OBSERVADO') {
            if (!['CALIDAD', 'ADMIN'].includes(Rol)) {
                return res.status(403).json({ error: 'No autorizado', detalle: 'Solo Calidad puede corregir y reenviar el REG-SIS-011.' });
            }
            if (estadoActual !== 'REG-011-OBSERVADO') {
                return res.status(400).json({ error: 'Operación no permitida', detalle: 'El REG-SIS-011 no está observado, no puede reenviarse.' });
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
                .input('tipoEtiqueta', sql.NVarChar, b.tipoEtiqueta == null ? null : (typeof b.tipoEtiqueta === 'string' ? b.tipoEtiqueta : JSON.stringify(b.tipoEtiqueta)))
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
                        TipoEtiqueta = ISNULL(@tipoEtiqueta, TipoEtiqueta),
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
                .input('accion', sql.NVarChar, 'REG-SIS-011 corregido y reenviado a Sistemas')
                .input('comentario', sql.NVarChar, b.comentario || null)
                .query(`
                    INSERT INTO Historial (SolicitudId, UsuarioId, EstadoAnterior, EstadoNuevo, Accion, Comentario)
                    VALUES (@solicitudId, @usuarioId, @estadoAnterior, @estadoNuevo, @accion, @comentario)
                `);

            return res.json({ mensaje: 'REG-SIS-011 corregido y reenviado a Sistemas', nuevoEstado });
        }

        // ── Caso B: Sistemas completa el REG-SIS-007 ───────────────────────────────
        if (!['SISTEMAS', 'ADMIN'].includes(Rol)) {
            return res.status(403).json({ error: 'No autorizado', detalle: 'Solo Sistemas puede completar el REG-SIS-007.' });
        }
        if (!ESTADOS_REG011_APROBADO.includes(estadoActual)) {
            return res.status(400).json({
                error: 'Operación no permitida',
                detalle: 'El REG-SIS-011 debe estar aprobado por Sistemas antes de completar el REG-SIS-007.'
            });
        }

        // Validación: campos del REG-SIS-007 obligatorios + al menos una etiqueta propuesta.
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
            return res.status(400).json({ error: 'REG-SIS-007 incompleto', detalle: `Faltan: ${faltan07.join(', ')}` });
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

        res.json({ mensaje: 'Solicitud actualizada (REG-SIS-007 completado)' });
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
    // 'PROPUESTO' (etiquetas resultantes) y 'ORIGINAL_07' (formato original del
    // REG-SIS-007) los sube Sistemas.
    if ((tipo === 'PROPUESTO' || tipo === 'ORIGINAL_07') && !['SISTEMAS', 'ADMIN'].includes(Rol)) {
        return res.status(403).json({ error: 'No autorizado', detalle: 'Solo personal de Sistemas o Administradores pueden subir estos archivos.' });
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
    // 'aprobar_parcial' = Calidad aprueba parcialmente el REG-SIS-007 (vuelve a Sistemas).
    // 'aprobar_propuesto' / 'aprobar_impresion' = los dos chequeos independientes de Calidad;
    // recién con ambos hechos el REG-SIS-007 queda APROBADO.
    const ACCIONES_VALIDAS = ['aprobar_reg11', 'rechazar_reg11', 'approve', 'reject', 'aprobar_parcial', 'aprobar_propuesto', 'aprobar_impresion'];
    if (!ACCIONES_VALIDAS.includes(action)) {
        return res.status(400).json({ error: `Acción inválida. Use una de: ${ACCIONES_VALIDAS.join(', ')}` });
    }

    // Acciones que exigen un motivo escrito.
    const REQUIERE_MOTIVO = ['rechazar_reg11', 'reject', 'aprobar_parcial'];
    if (REQUIERE_MOTIVO.includes(action) && !(comentario && String(comentario).trim())) {
        return res.status(400).json({ error: 'Falta el motivo', detalle: 'Esta acción requiere indicar un motivo.' });
    }

    const esSistemas = Rol === 'SISTEMAS' || Rol === 'ADMIN';
    const esCalidad = Rol === 'CALIDAD' || Rol === 'ADMIN';
    // Estados desde los que Sistemas puede aprobar/rechazar el REG-SIS-011.
    // El legacy 'REG-011-PENDIENTE' NO entra aquí: predata la compuerta y se trata
    // como ya aprobado (listo para completar el REG-SIS-007).
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
                if (!esSistemas) return res.status(403).json({ error: 'Solo Sistemas puede aprobar el REG-SIS-011' });
                if (!PENDIENTE_REG11.includes(estadoActual)) {
                    return res.status(400).json({ error: 'El REG-SIS-011 no está pendiente de aprobación de Sistemas' });
                }
                nuevoEstado = 'REG-011-APROBADO';
                accionDescripcion = 'REG-SIS-011 aprobado por Sistemas';
                break;

            case 'rechazar_reg11':
                if (!esSistemas) return res.status(403).json({ error: 'Solo Sistemas puede observar el REG-SIS-011' });
                if (!PENDIENTE_REG11.includes(estadoActual)) {
                    return res.status(400).json({ error: 'El REG-SIS-011 no está pendiente de aprobación de Sistemas' });
                }
                nuevoEstado = 'REG-011-OBSERVADO';
                accionDescripcion = 'REG-SIS-011 observado por Sistemas (devuelto a Calidad)';
                break;

            case 'approve':
                if (!esCalidad) return res.status(403).json({ error: 'Solo Calidad puede dar la aprobación final' });
                if (estadoActual !== 'REG-007-PENDIENTE-APROBACION') {
                    return res.status(400).json({ error: 'El REG-SIS-007 no está pendiente de aprobación de Calidad' });
                }
                nuevoEstado = 'APROBADO';
                accionDescripcion = 'Aprobado por Calidad → Finalizado';
                break;

            case 'reject':
                if (!esCalidad) return res.status(403).json({ error: 'Solo Calidad puede rechazar el REG-SIS-007' });
                if (estadoActual !== 'REG-007-PENDIENTE-APROBACION') {
                    return res.status(400).json({ error: 'El REG-SIS-007 no está pendiente de aprobación de Calidad' });
                }
                nuevoEstado = 'RECHAZADO';
                accionDescripcion = 'Rechazado por Calidad';
                break;

            case 'aprobar_parcial':
                if (!esCalidad) return res.status(403).json({ error: 'Solo Calidad puede aprobar parcialmente el REG-SIS-007' });
                if (estadoActual !== 'REG-007-PENDIENTE-APROBACION') {
                    return res.status(400).json({ error: 'El REG-SIS-007 no está pendiente de aprobación de Calidad' });
                }
                nuevoEstado = 'REG-007-PARCIAL';
                accionDescripcion = 'Aprobado parcialmente por Calidad (devuelto a Sistemas para corregir)';
                break;

            case 'aprobar_propuesto':
            case 'aprobar_impresion': {
                if (!esCalidad) return res.status(403).json({ error: 'Solo Calidad puede aprobar los chequeos del REG-SIS-007' });
                if (estadoActual !== 'REG-007-PENDIENTE-APROBACION') {
                    return res.status(400).json({ error: 'El REG-SIS-007 no está pendiente de aprobación de Calidad' });
                }
                const etiquetaEste = action === 'aprobar_propuesto' ? 'Chequeo con formato propuesto' : 'Chequeo en punto de impresión';
                const etiquetaOtro = action === 'aprobar_propuesto' ? 'Chequeo en punto de impresión' : 'Chequeo con formato propuesto';
                const histChk = await pool.request().input('id', sql.UniqueIdentifier, id)
                    .query('SELECT Accion FROM Historial WHERE SolicitudId = @id');
                const yaEste = histChk.recordset.some(h => (h.Accion || '').includes(`${etiquetaEste} aprobado`));
                if (yaEste) return res.status(400).json({ error: 'Ese chequeo ya fue aprobado por Calidad' });
                const otroHecho = histChk.recordset.some(h => (h.Accion || '').includes(`${etiquetaOtro} aprobado`));
                // Recién con los DOS chequeos hechos el REG-SIS-007 queda finalizado.
                nuevoEstado = otroHecho ? 'APROBADO' : 'REG-007-PENDIENTE-APROBACION';
                accionDescripcion = `${etiquetaEste} aprobado por Calidad${otroHecho ? ' → Finalizado' : ''}`;
                break;
            }
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

// ─── Exportar PDF (DESHABILITADO) ──────────────────────────────────────────────
/**
 * La generación de PDF en el servidor (Puppeteer/Chromium) fue retirada: la
 * impresión se hace desde el diálogo del navegador (window.print()) tanto para
 * el REG-SIS-011 como para el REG-SIS-007. Se quitaron las dependencias pesadas
 * (puppeteer, puppeteer-core, @sparticuz/chromium) para acelerar deploy y arranque.
 * Este endpoint queda como stub por compatibilidad.
 */
const exportPdf = async (req, res) => {
    return res.status(410).json({
        error: 'Generación de PDF en servidor deshabilitada',
        detalle: 'La impresión se realiza desde el navegador (Imprimir / Guardar como PDF).'
    });
};

const _exportPdfLegacy = async (req, res) => {
    const { id } = req.params;
    const doc = req.query.doc === 'REG007' ? 'REG007' : 'REG011';
    const PRINT_SECRET = process.env.PRINT_SECRET;

    if (!PRINT_SECRET) {
        return res.status(503).json({
            error: 'Generación de PDF no configurada',
            detalle: 'Falta la variable de entorno PRINT_SECRET.'
        });
    }

    const port = process.env.PORT || 3001;
    const url = `http://127.0.0.1:${port}/print/${id}?doc=${doc}&k=${encodeURIComponent(PRINT_SECRET)}`;

    let browser;
    try {
        // Producción (Azure App Service Linux): Chromium empaquetado por
        // @sparticuz/chromium, sin necesidad de instalar librerías por apt.
        try {
            const chromium = require('@sparticuz/chromium').default || require('@sparticuz/chromium');
            const pcore = require('puppeteer-core');
            browser = await pcore.launch({
                args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                executablePath: await chromium.executablePath(),
                headless: chromium.headless
            });
        } catch (eSparticuz) {
            console.error('[PDF] @sparticuz/chromium falló, intentando puppeteer:', eSparticuz.message);
            // Fallback local (dev): puppeteer completo si está instalado.
            const puppeteer = require('puppeteer');
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
        }
        const page = await browser.newPage();
        await page.emulateMediaType('print');

        if (doc === 'REG007') {
            // Template HTML autocontenido (layout oficial fijo, imágenes en base64).
            console.log('[PDF] armando REG-SIS-007 desde template');
            const { buildReg007Html } = require('../services/pdfTemplate');
            const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'regsis-attachments';
            const toDataUri = async (ruta) => {
                try {
                    const parts = String(ruta).split(`/${containerName}/`);
                    if (parts.length < 2) return null;
                    return await storageService.downloadBase64(decodeURIComponent(parts[1]));
                } catch (e) { console.error('[PDF] no se pudo embeber imagen:', e.message); return null; }
            };

            const pool = await poolPromise;
            const solRes = await pool.request().input('id', sql.UniqueIdentifier, id)
                .query('SELECT s.*, u.NombreUsuario AS SolicitanteNombre FROM Solicitudes s LEFT JOIN Usuarios u ON s.SolicitadoPor = u.UsuarioId WHERE s.SolicitudId = @id');
            if (!solRes.recordset.length) { return res.status(404).json({ error: 'Solicitud no encontrada' }); }
            const d = solRes.recordset[0];

            const adjRes = await pool.request().input('id', sql.UniqueIdentifier, id)
                .query('SELECT * FROM Adjuntos WHERE SolicitudId = @id');
            const adjuntos = adjRes.recordset;

            const histRes = await pool.request().input('id', sql.UniqueIdentifier, id)
                .query('SELECT h.*, u.NombreUsuario FROM Historial h LEFT JOIN Usuarios u ON h.UsuarioId = u.UsuarioId WHERE h.SolicitudId = @id ORDER BY h.FechaEvento ASC');
            const historial = histRes.recordset;
            const findHist = (estados) => historial.find(h => estados.includes(h.EstadoNuevo));
            const sisHist = findHist(['REG-011-APROBADO']);
            const calHist = findHist(['APROBADO']);
            const firmas = {
                sistemas: sisHist ? { user: sisHist.NombreUsuario, date: sisHist.FechaEvento } : null,
                calidad: calHist ? { user: calHist.NombreUsuario, date: calHist.FechaEvento } : null,
            };

            const isImg = (a) => String(a.TipoContenido || '').startsWith('image/');
            const origAdj = adjuntos.find(a => a.TipoAdjunto === 'ORIGINAL' && isImg(a));
            const originalImg = origAdj ? await toDataUri(origAdj.RutaArchivo) : null;
            const etiquetas = [];
            for (const a of adjuntos.filter(a => a.TipoAdjunto !== 'ORIGINAL' && isImg(a))) {
                const src = await toDataUri(a.RutaArchivo);
                if (src) etiquetas.push({ src, name: a.NombreArchivo });
            }

            const html = buildReg007Html(d, originalImg, etiquetas, firmas);
            await page.setContent(html, { waitUntil: 'load', timeout: 45000 });
        } else {
            // REG-SIS-011: por ahora se renderiza navegando a la página /print.
            console.log('[PDF] navegando a', url);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
            await page.waitForSelector('#print-ready', { timeout: 30000 }).catch(() => console.warn('[PDF] sin #print-ready, genero igual'));
        }
        console.log('[PDF] generando pdf...');

        const pdf = await page.pdf({
            format: 'Legal',
            printBackground: true,
            preferCSSPageSize: false,
            timeout: 45000,
            margin: { top: '6mm', bottom: '6mm', left: '6mm', right: '6mm' }
        });
        console.log('[PDF] pdf generado, bytes:', pdf.length);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${doc}-${String(id).slice(0, 8)}.pdf"`,
            'Content-Length': Buffer.byteLength(pdf)
        });
        res.send(Buffer.from(pdf));
    } catch (err) {
        console.error('[PDF] Error generando PDF:', err.message);
        res.status(500).json({ error: 'No se pudo generar el PDF', detalle: err.message });
    } finally {
        if (browser) { try { await browser.close(); } catch {} }
    }
};

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
        if ((TipoAdjunto === 'PROPUESTO' || TipoAdjunto === 'ORIGINAL_07') && !['SISTEMAS', 'ADMIN'].includes(Rol)) {
            return res.status(403).json({ error: 'No autorizado', detalle: 'Solo Sistemas o Administradores pueden eliminar estos archivos.' });
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
    getHistorial,
    exportPdf
};


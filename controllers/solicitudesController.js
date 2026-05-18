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
            .query('SELECT * FROM Solicitudes WHERE SolicitudId = @id');

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

    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');
        
        // Estado inicial para el REG-SIS-011 creado por Calidad
        const estadoInicial = 'REG-011-PENDIENTE';

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

const updateSolicitud = async (req, res) => {
    const { id } = req.params;
    const b = req.body;

    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        // Esta función se usará principalmente para que Sistemas complete el REG-007
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('fechaPresentacion', sql.Date, b.fechaPresentacion)
            .input('codigoTwins', sql.NVarChar, b.codigoTwins)
            .input('correspondeSolicitud', sql.NVarChar, b.correspondeSolicitud)
            .input('estado', sql.NVarChar, b.estado || 'REG-007-PENDIENTE-APROBACION')
            .query(`
                UPDATE Solicitudes 
                SET FechaPresentacion = ISNULL(@fechaPresentacion, FechaPresentacion),
                    CodigoTwins = ISNULL(@codigoTwins, CodigoTwins),
                    CorrespondeSolicitud = ISNULL(@correspondeSolicitud, CorrespondeSolicitud),
                    Estado = ISNULL(@estado, Estado)
                WHERE SolicitudId = @id
            `);

        // Registrar en historial si hubo cambio de estado
        if (b.estado) {
            await pool.request()
                .input('solicitudId', sql.UniqueIdentifier, id)
                .input('usuarioId', sql.UniqueIdentifier, req.user.UsuarioId)
                .input('estadoNuevo', sql.NVarChar, b.estado)
                .input('accion', sql.NVarChar, 'Respuesta Sistemas (REG-SIS-007)')
                .query(`
                    INSERT INTO Historial (SolicitudId, UsuarioId, EstadoAnterior, EstadoNuevo, Accion)
                    VALUES (@solicitudId, @usuarioId, 'REG-011-PENDIENTE', @estadoNuevo, @accion)
                `);
        }

        res.json({ mensaje: 'Solicitud actualizada (REG-007 completado)' });
    } catch (err) {
        console.error('[Controller] Error en updateSolicitud:', err);
        res.status(500).json({ error: 'Error al actualizar la solicitud', detalle: err.message });
    }
};

const addAdjunto = async (req, res) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }

    try {
        // 1. Subir a Azure Blob Storage
        const { url, blobName } = await storageService.uploadFile(id, file);

        // 2. Guardar metadatos en la base de datos
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');
        await pool.request()
            .input('solicitudId', sql.UniqueIdentifier, id)
            .input('nombreArchivo', sql.NVarChar, file.originalname)
            .input('rutaArchivo', sql.NVarChar, url)
            .input('tipoContenido', sql.NVarChar, file.mimetype)
            .input('tamano', sql.BigInt, file.size)
            .query(`
                INSERT INTO Adjuntos (SolicitudId, NombreArchivo, RutaArchivo, TipoContenido, TamanoArchivo)
                VALUES (@solicitudId, @nombreArchivo, @rutaArchivo, @tipoContenido, @tamano)
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
 * Body: { action: 'approve' | 'reject', comentario?: string }
 *
 * Lógica de transición de estados con validación de rol:
 *   approve (CALIDAD/ADMIN) + Pendiente/En revisión → 'Aprobado por calidad'
 *   approve (SISTEMAS/ADMIN) + Pendiente/En revisión → 'Aprobado por sistemas'
 *   approve (CALIDAD/ADMIN)  + 'Aprobado por sistemas' → 'Aprobado por Sistemas y Calidad'
 *   approve (SISTEMAS/ADMIN) + 'Aprobado por calidad'  → 'Aprobado por Sistemas y Calidad'
 *   reject  (cualquier rol)                            → 'rechazado'
 */
const transitionSolicitud = async (req, res) => {
    const { id } = req.params;
    const { action, comentario } = req.body;
    const { UsuarioId, Rol } = req.user;

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: "La acción debe ser 'approve' o 'reject'" });
    }

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

        // 2. Calcular nuevo estado
        let nuevoEstado;
        let accionDescripcion;

        if (action === 'reject') {
            nuevoEstado = 'RECHAZADO';
            accionDescripcion = `Rechazado por ${Rol}`;
        } else {
            // approve — validar que no haya aprobado ya
            const yaAprobadoCalidad   = estadoActual === 'Aprobado por calidad' || estadoActual === 'APROBADO';
            const yaAprobadoSistemas  = estadoActual === 'Aprobado por sistemas' || estadoActual === 'REG-007-PENDIENTE-APROBACION';
            const aprobacionFinal     = estadoActual === 'APROBADO';

            if (aprobacionFinal) {
                return res.status(400).json({ error: 'La solicitud ya tiene aprobación final' });
            }

            if ((Rol === 'CALIDAD' || Rol === 'ADMIN') && yaAprobadoCalidad && Rol !== 'ADMIN') {
                return res.status(400).json({ error: 'Calidad ya aprobó esta solicitud' });
            }
            if (Rol === 'SISTEMAS' && yaAprobadoSistemas) {
                return res.status(400).json({ error: 'Sistemas ya aprobó esta solicitud' });
            }

            if (Rol === 'CALIDAD') {
                nuevoEstado = yaAprobadoSistemas
                    ? 'APROBADO'
                    : 'Aprobado por calidad';
                accionDescripcion = nuevoEstado === 'APROBADO'
                    ? 'Aprobado por Calidad → Finalizado'
                    : `Aprobado por Calidad → ${nuevoEstado}`;
            } else if (Rol === 'SISTEMAS') {
                nuevoEstado = yaAprobadoCalidad
                    ? 'APROBADO'
                    : 'Aprobado por sistemas';
                accionDescripcion = nuevoEstado === 'APROBADO'
                    ? 'Aprobado por Sistemas → Finalizado'
                    : `Aprobado por Sistemas → ${nuevoEstado}`;
            } else if (Rol === 'ADMIN') {
                // ADMIN puede aprobar en nombre de cualquiera
                if (yaAprobadoCalidad || yaAprobadoSistemas) {
                    nuevoEstado = 'APROBADO';
                } else {
                    nuevoEstado = 'Aprobado por calidad'; // Admin aprueba como Calidad primero
                }
                accionDescripcion = nuevoEstado === 'APROBADO'
                    ? 'Aprobado por Admin → Finalizado'
                    : `Aprobado por Admin → ${nuevoEstado}`;
            } else {
                return res.status(403).json({ error: 'Tu rol no tiene permisos para aprobar solicitudes' });
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

module.exports = {
    getSolicitudes,
    getSolicitudById,
    createSolicitud,
    updateSolicitud,
    addAdjunto,
    getAdjuntosBySolicitud,
    downloadAdjunto,
    transitionSolicitud,
    getHistorial,
};

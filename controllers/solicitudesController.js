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
        fechaPresentacion, motivo,
        tipoSenasa, nombreProducto, destino, codigo, codigoSenasa,
        impresoras, descripcionCorta
    } = req.body;

    const solicitadoPor = req.user.UsuarioId;
    const rolSolicitante = req.user.Rol;

    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');
        const result = await pool.request()
            .input('solicitadoPor', sql.UniqueIdentifier, solicitadoPor)
            .input('rolSolicitante', sql.NVarChar, rolSolicitante)
            .input('fechaPresentacion', sql.Date, fechaPresentacion)
            .input('motivo', sql.NVarChar, motivo)
            .input('tipoSenasa', sql.NVarChar, tipoSenasa)
            .input('nombreProducto', sql.NVarChar, nombreProducto)
            .input('destino', sql.NVarChar, destino)
            .input('codigo', sql.NVarChar, codigo)
            .input('codigoSenasa', sql.NVarChar, codigoSenasa)
            .input('impresoras', sql.NVarChar, JSON.stringify(impresoras))
            .input('descripcionCorta', sql.NVarChar, descripcionCorta)
            .query(`
                INSERT INTO Solicitudes (
                    SolicitadoPor, RolSolicitante, FechaPresentacion, Motivo, 
                    TipoSenasa, NombreProducto, Destino, Codigo, CodigoSenasa, 
                    Impresoras, DescripcionCorta, Estado
                ) 
                OUTPUT INSERTED.SolicitudId
                VALUES (
                    @solicitadoPor, @rolSolicitante, @fechaPresentacion, @motivo, 
                    @tipoSenasa, @nombreProducto, @destino, @codigo, @codigoSenasa, 
                    @impresoras, @descripcionCorta, 'Pendiente'
                )
            `);

        const solicitudId = result.recordset[0].SolicitudId;
        res.status(201).json({ mensaje: 'Solicitud creada con éxito', solicitudId });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear la solicitud', detalle: err.message });
    }
};

const updateSolicitud = async (req, res) => {
    const { id } = req.params;

    // Extraemos los campos intentando ambos casings (Mayúsculas y minúsculas)
    const b = req.body;
    const solicitadoPor = b.SolicitadoPor || b.solicitadoPor;
    const rolSolicitante = b.RolSolicitante || b.rolSolicitante;
    const fechaPresentacion = b.FechaPresentacion || b.fechaPresentacion;
    const motivo = b.Motivo || b.motivo;
    const tipoSenasa = b.TipoSenasa || b.tipoSenasa;
    const nombreProducto = b.NombreProducto || b.nombreProducto;
    const destino = b.Destino || b.destino;
    const codigo = b.Codigo || b.codigo;
    const codigoSenasa = b.CodigoSenasa || b.codigoSenasa;
    const impresoras = b.Impresoras || b.impresoras;
    const descripcionCorta = b.DescripcionCorta || b.descripcionCorta;
    const estado = b.Estado || b.estado;

    try {
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('solicitadoPor', sql.UniqueIdentifier, solicitadoPor)
            .input('rolSolicitante', sql.NVarChar, rolSolicitante)
            .input('fechaPresentacion', sql.Date, fechaPresentacion)
            .input('motivo', sql.NVarChar, motivo)
            .input('tipoSenasa', sql.NVarChar, tipoSenasa)
            .input('nombreProducto', sql.NVarChar, nombreProducto)
            .input('destino', sql.NVarChar, destino)
            .input('codigo', sql.NVarChar, codigo)
            .input('codigoSenasa', sql.NVarChar, codigoSenasa)
            .input('impresoras', sql.NVarChar, typeof impresoras === 'string' ? impresoras : JSON.stringify(impresoras))
            .input('descripcionCorta', sql.NVarChar, descripcionCorta)
            .input('estado', sql.NVarChar, estado)
            .query(`
                UPDATE Solicitudes 
                SET SolicitadoPor = ISNULL(@solicitadoPor, SolicitadoPor),
                    RolSolicitante = ISNULL(@rolSolicitante, RolSolicitante),
                    FechaPresentacion = ISNULL(@fechaPresentacion, FechaPresentacion),
                    Motivo = ISNULL(@motivo, Motivo),
                    TipoSenasa = ISNULL(@tipoSenasa, TipoSenasa),
                    NombreProducto = ISNULL(@nombreProducto, NombreProducto),
                    Destino = ISNULL(@destino, Destino),
                    Codigo = ISNULL(@codigo, Codigo),
                    CodigoSenasa = ISNULL(@codigoSenasa, CodigoSenasa),
                    Impresoras = ISNULL(@impresoras, Impresoras),
                    DescripcionCorta = ISNULL(@descripcionCorta, DescripcionCorta),
                    Estado = ISNULL(@estado, Estado)
                WHERE SolicitudId = @id
            `);

        res.json({ mensaje: 'Solicitud actualizada con éxito' });
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

        const blobName = urlParts[1];
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
            nuevoEstado = 'rechazado';
            accionDescripcion = `Rechazado por ${Rol}`;
        } else {
            // approve — validar que no haya aprobado ya
            const yaAprobadoCalidad   = estadoActual === 'Aprobado por calidad';
            const yaAprobadoSistemas  = estadoActual === 'Aprobado por sistemas';
            const aprobacionFinal     = estadoActual === 'Aprobado por Sistemas y Calidad';

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
                    ? 'Aprobado por Sistemas y Calidad'
                    : 'Aprobado por calidad';
                accionDescripcion = `Aprobado por Calidad → ${nuevoEstado}`;
            } else if (Rol === 'SISTEMAS') {
                nuevoEstado = yaAprobadoCalidad
                    ? 'Aprobado por Sistemas y Calidad'
                    : 'Aprobado por sistemas';
                accionDescripcion = `Aprobado por Sistemas → ${nuevoEstado}`;
            } else if (Rol === 'ADMIN') {
                // ADMIN puede aprobar en nombre de cualquiera
                if (yaAprobadoCalidad) {
                    nuevoEstado = 'Aprobado por Sistemas y Calidad';
                } else if (yaAprobadoSistemas) {
                    nuevoEstado = 'Aprobado por Sistemas y Calidad';
                } else {
                    nuevoEstado = 'Aprobado por calidad'; // Admin aprueba como Calidad primero
                }
                accionDescripcion = `Aprobado por Admin → ${nuevoEstado}`;
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

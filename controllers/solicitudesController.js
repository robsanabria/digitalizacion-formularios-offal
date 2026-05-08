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
                    @impresoras, @descripcionCorta, 'borrador'
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

module.exports = {
    getSolicitudes,
    getSolicitudById,
    createSolicitud,
    updateSolicitud,
    addAdjunto,
    getAdjuntosBySolicitud,
    downloadAdjunto
};

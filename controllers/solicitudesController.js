const { poolPromise, sql } = require('../config/db');

const getSolicitudes = async (req, res) => {
    try {
        const pool = await poolPromise;
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
        solicitadoPor, rolSolicitante, fechaPresentacion, motivo, 
        tipoSenasa, nombreProducto, destino, codigo, codigoSenasa, 
        impresoras, descripcionCorta 
    } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
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
                ) VALUES (
                    @solicitadoPor, @rolSolicitante, @fechaPresentacion, @motivo, 
                    @tipoSenasa, @nombreProducto, @destino, @codigo, @codigoSenasa, 
                    @impresoras, @descripcionCorta, 'borrador'
                )
            `);
        
        res.status(201).json({ mensaje: 'Solicitud creada con éxito' });
    } catch (err) {
        res.status(500).json({ error: 'Error al crear la solicitud', detalle: err.message });
    }
};

const updateSolicitud = async (req, res) => {
    const { id } = req.params;
    const { 
        solicitadoPor, rolSolicitante, fechaPresentacion, motivo, 
        tipoSenasa, nombreProducto, destino, codigo, codigoSenasa, 
        impresoras, descripcionCorta, estado 
    } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
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
            .input('impresoras', sql.NVarChar, JSON.stringify(impresoras))
            .input('descripcionCorta', sql.NVarChar, descripcionCorta)
            .input('estado', sql.NVarChar, estado)
            .query(`
                UPDATE Solicitudes 
                SET SolicitadoPor = @solicitadoPor,
                    RolSolicitante = @rolSolicitante,
                    FechaPresentacion = @fechaPresentacion,
                    Motivo = @motivo,
                    TipoSenasa = @tipoSenasa,
                    NombreProducto = @nombreProducto,
                    Destino = @destino,
                    Codigo = @codigo,
                    CodigoSenasa = @codigoSenasa,
                    Impresoras = @impresoras,
                    DescripcionCorta = @descripcionCorta,
                    Estado = @estado
                WHERE SolicitudId = @id
            `);
        
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
        }
        res.json({ mensaje: 'Solicitud actualizada con éxito' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar la solicitud', detalle: err.message });
    }
};

module.exports = {
    getSolicitudes,
    getSolicitudById,
    createSolicitud,
    updateSolicitud
};

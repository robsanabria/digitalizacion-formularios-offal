const { poolPromise, sql } = require('../config/db');

const getUsers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Usuarios ORDER BY NombreUsuario ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios', detalle: err.message });
    }
};

const ROLES_VALIDOS = ['CALIDAD', 'SISTEMAS', 'ADMIN'];

const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;

    if (!ROLES_VALIDOS.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido', detalle: `Debe ser uno de: ${ROLES_VALIDOS.join(', ')}` });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('rol', sql.NVarChar, rol)
            .query('UPDATE Usuarios SET Rol = @rol WHERE UsuarioId = @id');
        
        res.json({ mensaje: 'Rol actualizado con éxito' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar el rol', detalle: err.message });
    }
};

module.exports = {
    getUsers,
    updateUserRole
};

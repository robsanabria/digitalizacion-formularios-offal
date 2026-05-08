const { poolPromise, sql } = require('../config/db');

const getUsers = async (req, res) => {
    try {
        // Solo ADMIN puede ver la lista de usuarios
        if (req.user.Rol !== 'ADMIN') {
            return res.status(403).json({ error: 'No tienes permisos para ver usuarios' });
        }

        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Usuarios ORDER BY NombreUsuario ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuarios', detalle: err.message });
    }
};

const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;

    try {
        if (req.user.Rol !== 'ADMIN') {
            return res.status(403).json({ error: 'No tienes permisos para cambiar roles' });
        }

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

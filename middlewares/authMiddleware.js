const { poolPromise, sql } = require('../config/db');

const authMiddleware = async (req, res, next) => {
    // En Azure, EasyAuth inyecta estas cabeceras
    const userEmail = req.headers['x-ms-client-principal-name'];
    const userIdMs = req.headers['x-ms-client-principal-id'];
    
    // Si no estamos en Azure (local), podemos simular un usuario para desarrollo
    if (!userEmail && process.env.NODE_ENV !== 'production') {
        req.user = {
            UsuarioId: '00000000-0000-0000-0000-000000000000',
            NombreUsuario: 'Usuario Local (Dev)',
            Email: 'dev@local.com',
            Rol: 'SISTEMAS' // Puedes cambiar esto para probar vistas
        };
        return next();
    }

    if (!userEmail) {
        return res.status(401).json({ error: 'No autenticado por Azure EasyAuth' });
    }

    try {
        const pool = await poolPromise;
        
        // 1. Buscar si el usuario ya existe
        let result = await pool.request()
            .input('email', sql.NVarChar, userEmail)
            .query('SELECT * FROM Usuarios WHERE Email = @email');

        let user = result.recordset[0];

        // 2. Si no existe, lo creamos automáticamente (JIT Provisioning)
        if (!user) {
            console.log(`[Auth] Creando nuevo usuario: ${userEmail}`);
            const nombreSugerido = userEmail.split('@')[0];
            
            const insertResult = await pool.request()
                .input('nombre', sql.NVarChar, nombreSugerido)
                .input('email', sql.NVarChar, userEmail)
                .input('rol', sql.NVarChar, 'SOLICITANTE') // Rol por defecto
                .query(`
                    INSERT INTO Usuarios (NombreUsuario, Email, Rol)
                    OUTPUT INSERTED.*
                    VALUES (@nombre, @email, @rol)
                `);
            user = insertResult.recordset[0];
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('[Auth Middleware] Error:', err);
        res.status(500).json({ error: 'Error en la verificación de identidad' });
    }
};

module.exports = authMiddleware;

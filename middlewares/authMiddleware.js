const { poolPromise, sql } = require('../config/db');

const ROLES_VALIDOS = ['CALIDAD', 'SISTEMAS', 'ADMIN'];

// Allowlist de administradores por configuración (emails exactos, separados por coma).
// Ej.: ADMIN_EMAILS="roberto.sanabria@offalexpsa.ar,otro.admin@offalexpsa.ar"
const ADMIN_EMAILS = new Set(
    (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean)
);

// Rol por defecto para usuarios nuevos (JIT) que no estén en la allowlist.
const DEFAULT_USER_ROLE = ROLES_VALIDOS.includes((process.env.DEFAULT_USER_ROLE || '').toUpperCase())
    ? process.env.DEFAULT_USER_ROLE.toUpperCase()
    : 'CALIDAD';

// Rol del usuario simulado en desarrollo (solo fuera de producción).
const DEV_USER_ROLE = ROLES_VALIDOS.includes((process.env.DEV_USER_ROLE || '').toUpperCase())
    ? process.env.DEV_USER_ROLE.toUpperCase()
    : 'SISTEMAS';

const esAdminPorConfig = (email) => ADMIN_EMAILS.has(String(email || '').trim().toLowerCase());

// Token interno para la generación de PDF (Puppeteer accede a la app desde
// localhost, sin las cabeceras de EasyAuth). Solo se acepta si PRINT_SECRET está
// configurado y coincide; otorga un usuario "sistema" de solo lectura para render.
const PRINT_SECRET = process.env.PRINT_SECRET;

const authMiddleware = async (req, res, next) => {
    // Bypass de impresión: requests internos de Puppeteer con ?k=PRINT_SECRET
    if (PRINT_SECRET && req.query.k && req.query.k === PRINT_SECRET) {
        req.user = {
            UsuarioId: '00000000-0000-0000-0000-000000000000',
            NombreUsuario: 'PDF Renderer',
            Email: 'pdf@system',
            Rol: 'ADMIN'
        };
        return next();
    }

    // En Azure, EasyAuth inyecta estas cabeceras
    const userEmail = req.headers['x-ms-client-principal-name'];

    // Si no estamos en Azure (local), simulamos un usuario para desarrollo
    if (!userEmail && process.env.NODE_ENV !== 'production') {
        req.user = {
            UsuarioId: '00000000-0000-0000-0000-000000000000',
            NombreUsuario: 'Usuario Local (Dev)',
            Email: 'dev@local.com',
            Rol: DEV_USER_ROLE // configurable con DEV_USER_ROLE
        };
        return next();
    }

    if (!userEmail) {
        return res.status(401).json({ error: 'No autenticado por Azure EasyAuth' });
    }

    try {
        const pool = await poolPromise;

        // 1. Buscar si el usuario ya existe
        const result = await pool.request()
            .input('email', sql.NVarChar, userEmail)
            .query('SELECT * FROM Usuarios WHERE Email = @email');

        let user = result.recordset[0];

        // 2. Bootstrap de admins por allowlist (config): si el email está en
        //    ADMIN_EMAILS y todavía no es ADMIN, se promueve. Solo afecta a los
        //    emails explícitamente configurados (no por substring).
        if (user && esAdminPorConfig(userEmail) && user.Rol !== 'ADMIN') {
            await pool.request()
                .input('id', sql.UniqueIdentifier, user.UsuarioId)
                .query("UPDATE Usuarios SET Rol = 'ADMIN' WHERE UsuarioId = @id");
            user.Rol = 'ADMIN';
        }

        // 3. Si no existe, lo creamos (JIT Provisioning) con el rol según allowlist/default
        if (!user) {
            const nombreSugerido = userEmail.split('@')[0];
            const rolInicial = esAdminPorConfig(userEmail) ? 'ADMIN' : DEFAULT_USER_ROLE;

            const insertResult = await pool.request()
                .input('nombre', sql.NVarChar, nombreSugerido)
                .input('email', sql.NVarChar, userEmail)
                .input('rol', sql.NVarChar, rolInicial)
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
        console.error('[Auth Middleware] Error:', err.message);
        res.status(500).json({ error: 'Error en la verificación de identidad' });
    }
};

module.exports = authMiddleware;

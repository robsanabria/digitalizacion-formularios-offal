const express = require('express');
const cors = require('cors');
const path = require('path');
const { poolPromise } = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rutas
const solicitudesRoutes = require('./routes/solicitudesRoutes');
const usersController = require('./controllers/usersController');

// Middlewares
const authMiddleware = require('./middlewares/authMiddleware');
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://etiquetas.offalexpsa.ar'] 
        : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-ms-client-principal-name', 'x-ms-client-principal-id'],
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

// Endpoint de identidad (debe ir antes del middleware global si quieres que sea público, pero aquí lo protegemos)
app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json(req.user);
});

// Proteger todas las rutas de la API con el middleware
const { checkRole } = require('./middlewares/roleMiddleware');
app.use('/api', authMiddleware);

// Registro de rutas API
app.use('/api/solicitudes', solicitudesRoutes);
app.get('/api/users', checkRole(['ADMIN']), usersController.getUsers);
app.put('/api/users/:id/role', checkRole(['ADMIN']), usersController.updateUserRole);


// Endpoint de prueba de conexión y tablas
app.get('/api/test-db', async (req, res) => {
    const sql = require('mssql');
    // Leemos la config directamente para el reintento
    const { poolPromise } = require('./config/db');
    
    try {
        const pool = await poolPromise;
        if (!pool) {
            // Si el pool inicial falló, intentamos uno nuevo para ver el error real
            // Nota: El config/db.js ya exporta 'sql', pero necesitamos ver por qué falla
            return res.status(500).json({ 
                error: 'La conexión inicial falló', 
                ayuda: 'Revisa el Log Stream de Azure para ver el error de mssql.connect' 
            });
        }
        const result = await pool.request().query("SELECT TOP 5 * FROM Usuarios");
        res.json({ mensaje: 'Conexión exitosa', usuarios: result.recordset });
    } catch (err) {
        res.status(500).json({ 
            error: 'Fallo técnico en la consulta', 
            detalle: err.message,
            stack: err.stack 
        });
    }
});

// Servir el frontend en producción (React)
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'client/dist/index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Fallback si no hay build (útil para el primer despliegue o debug)
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});


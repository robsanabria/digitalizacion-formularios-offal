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

// Health check público y liviano (para el probe del App Service). No expone detalles internos.
app.get('/health', async (req, res) => {
    try {
        const pool = await poolPromise;
        res.status(pool ? 200 : 503).json({ status: pool ? 'ok' : 'degraded', db: !!pool });
    } catch {
        res.status(503).json({ status: 'degraded', db: false });
    }
});

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


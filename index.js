const express = require('express');
const cors = require('cors');
const path = require('path');
const { poolPromise } = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rutas
const solicitudesRoutes = require('./routes/solicitudesRoutes');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

// Registro de rutas API
app.use('/api/solicitudes', solicitudesRoutes);


// Endpoint de prueba de conexión y tablas
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT TOP 5 * FROM Usuarios");
        res.json({ 
            mensaje: 'Conexión exitosa', 
            usuarios: result.recordset 
        });
    } catch (err) {
        res.status(500).json({ 
            error: 'Error al consultar la base de datos', 
            detalle: err.message 
        });
    }
});

// Servir el frontend en producción (React)
app.get('*', (req, res) => {
    // Si el archivo no existe (porque no hemos construido el frontend aún), enviamos el index.html base
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});


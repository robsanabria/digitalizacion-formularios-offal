require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

const path = require('path');
const staticPath = path.join(__dirname, '../client/dist');

console.log(`Iniciando servidor en puerto: ${PORT}`);
console.log(`Ruta de archivos estáticos: ${staticPath}`);

if (!process.env.DB_SERVER) {
    console.warn('ADVERTENCIA: DB_SERVER no está definido en las variables de entorno.');
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Salud del Servicio
app.get('/api/salud', (req, res) => {
    res.json({
        estado: 'ok',
        timestamp: new Date().toISOString(),
        servicio: 'api-regsis-007'
    });
});

// Rutas (se agregarán más adelante)
// app.use('/api/solicitudes', require('./routes/solicitudes'));

const fs = require('fs');

// Servir archivos estáticos del Frontend (React)
app.use(express.static(staticPath));

// Manejar cualquier otra ruta con el index.html de React
app.get(/.*/, (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend no compilado. Por favor, ejecute el build.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

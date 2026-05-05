require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

const path = require('path');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'regsis-007-api'
    });
});

// Rutas (se agregarán más adelante)
// app.use('/api/requests', require('./routes/requests'));

// Servir archivos estáticos del Frontend (React)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Manejar cualquier otra ruta con el index.html de React
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Servir archivo estático
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta de salud para Azure
app.get('/api/salud', (req, res) => {
    res.json({ estado: 'ok', servicio: 'regsis-007-base' });
});

app.listen(PORT, () => {
    console.log(`Servidor base corriendo en puerto ${PORT}`);
});

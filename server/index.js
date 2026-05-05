require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

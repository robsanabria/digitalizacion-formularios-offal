const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || process.env.AZURE_SQL_USERNAME,
    password: process.env.DB_PASS || process.env.AZURE_SQL_PASSWORD,
    server: process.env.DB_SERVER || process.env.AZURE_SQL_SERVER,
    database: process.env.DB_NAME || process.env.AZURE_SQL_DATABASE,
    port: parseInt(process.env.DB_PORT || process.env.AZURE_SQL_PORT || '1433'),
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true' || !!process.env.AZURE_SQL_SERVER, // true para Azure
        trustServerCertificate: true // útil para desarrollo local
    }
};

const poolPromise = sql.connect(dbConfig)
    .then(pool => {
        console.log('✅ Conectado a SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error de conexión a SQL Server:', err.message);
        // No lanzamos el error para evitar que la app crashee, 
        // pero devolvemos null para que el controlador pueda manejarlo.
        return null; 
    });

module.exports = {
    sql,
    poolPromise
};

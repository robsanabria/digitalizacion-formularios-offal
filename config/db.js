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

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('✅ Conectado a SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error de conexión a la base de datos:', err);
        // No cerramos el proceso para que Azure pueda mantener la app viva y ver logs
    });

module.exports = {
    sql,
    poolPromise
};

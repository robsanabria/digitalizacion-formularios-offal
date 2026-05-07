const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // true para Azure
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
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};

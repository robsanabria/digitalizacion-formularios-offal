const sql = require('mssql');
const { DefaultAzureCredential } = require('@azure/identity');

const config = {
    server: process.env.AZURE_SQL_SERVER || process.env.DB_SERVER,
    database: process.env.AZURE_SQL_DATABASE || process.env.DB_NAME,
    port: parseInt(process.env.AZURE_SQL_PORT) || 1433,
    options: {
        encrypt: true,
        trustServerCertificate: false
    },
    authentication: {
        type: 'azure-active-directory-msi-app-service'
    }
};

// Si hay usuario y password, los usamos (fallback o local)
const dbUser = process.env.AZURE_SQL_USERNAME || process.env.DB_USER;
const dbPass = process.env.AZURE_SQL_PASSWORD || process.env.DB_PASS;

if (dbUser && dbPass) {
    console.log('Usando autenticación por usuario/password para SQL');
    delete config.authentication;
    config.user = dbUser;
    config.password = dbPass;
} else {
    console.log('Usando Managed Identity para SQL');
}

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed! Bad Config: ', err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};

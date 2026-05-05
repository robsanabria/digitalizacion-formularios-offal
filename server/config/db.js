const sql = require('mssql');
const { DefaultAzureCredential } = require('@azure/identity');

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false
    },
    authentication: {
        type: 'azure-active-directory-msi-app-service' // Para Managed Identity en Azure
    }
};

// Si estamos en local sin MSI, podemos usar usuario/contraseña si se proporcionan
if (process.env.DB_USER && process.env.DB_PASS) {
    delete config.authentication;
    config.user = process.env.DB_USER;
    config.password = process.env.DB_PASS;
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

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
    .then(async pool => {
        console.log('✅ Conectado a SQL Server');
        try {
            // Verificar y crear la columna TipoAdjunto si no existe
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID(N'[dbo].[Adjuntos]') 
                    AND name = 'TipoAdjunto'
                )
                BEGIN
                    ALTER TABLE Adjuntos ADD TipoAdjunto NVARCHAR(50) DEFAULT 'PROPUESTO';
                END
            `);
            console.log('✅ Columna TipoAdjunto verificada/creada en la tabla Adjuntos');

            // Verificar y crear la columna TipoEtiqueta (tipo de etiqueta a modificar) si no existe
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'[dbo].[Solicitudes]')
                    AND name = 'TipoEtiqueta'
                )
                BEGIN
                    ALTER TABLE Solicitudes ADD TipoEtiqueta NVARCHAR(MAX) NULL;
                END
            `);
            console.log('✅ Columna TipoEtiqueta verificada/creada en la tabla Solicitudes');

            // Observaciones que escribe Sistemas al completar el REG-SIS-007.
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'[dbo].[Solicitudes]')
                    AND name = 'ObservacionesSistemas'
                )
                BEGIN
                    ALTER TABLE Solicitudes ADD ObservacionesSistemas NVARCHAR(MAX) NULL;
                END
            `);
            console.log('✅ Columna ObservacionesSistemas verificada/creada en la tabla Solicitudes');

            // Prioridad de la solicitud (1=Alta, 2=Media, 3=Baja). Default Media.
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'[dbo].[Solicitudes]')
                    AND name = 'Prioridad'
                )
                BEGIN
                    ALTER TABLE Solicitudes ADD Prioridad INT NOT NULL DEFAULT 2;
                END
            `);
            console.log('✅ Columna Prioridad verificada/creada en la tabla Solicitudes');
        } catch (err) {
            console.error('⚠️ Error al verificar columnas:', err.message);
        }
        return pool;
    })
    .catch(err => {
        console.error('❌ Error de conexión a SQL Server:', err.message);
        return null; 
    });

module.exports = {
    sql,
    poolPromise
};

const { poolPromise } = require('../config/db');

async function run() {
    try {
        console.log("Conectando a la base de datos...");
        const pool = await poolPromise;
        if (!pool) throw new Error("No hay conexión con la base de datos");

        console.log("Ejecutando ALTER TABLE...");
        await pool.request().query(`
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID(N'[dbo].[Solicitudes]') 
                AND name = 'CorrespondeSolicitud'
            )
            BEGIN
                ALTER TABLE Solicitudes ADD CorrespondeSolicitud NVARCHAR(100);
            END
        `);
        console.log("Columna 'CorrespondeSolicitud' agregada exitosamente o ya existía.");

        process.exit(0);
    } catch (error) {
        console.error("Error al modificar la tabla:", error);
        process.exit(1);
    }
}

run();

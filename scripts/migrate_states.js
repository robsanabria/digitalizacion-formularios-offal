const { poolPromise, sql } = require('../config/db');

async function run() {
    try {
        const pool = await poolPromise;
        if (!pool) {
            console.error('No se pudo conectar a la base de datos');
            process.exit(1);
        }

        console.log('Conectado a la base de datos.');

        // 1. Obtener solicitudes con estado 'Aprobado por calidad'
        const result = await pool.request().query("SELECT SolicitudId, Estado, NombreProducto FROM Solicitudes WHERE Estado = 'Aprobado por calidad'");
        const rows = result.recordset;

        if (rows.length === 0) {
            console.log('No hay solicitudes con estado "Aprobado por calidad" para migrar.');
            process.exit(0);
        }

        console.log(`Encontradas ${rows.length} solicitudes para migrar.`);

        for (const row of rows) {
            console.log(`Migrando solicitud: ${row.NombreProducto} (${row.SolicitudId})`);

            // Actualizar estado a APROBADO
            await pool.request()
                .input('id', sql.UniqueIdentifier, row.SolicitudId)
                .query("UPDATE Solicitudes SET Estado = 'APROBADO' WHERE SolicitudId = @id");
                
            console.log(`✅ Estado de la solicitud "${row.NombreProducto}" actualizado a APROBADO.`);
        }

        console.log('Migración de estados completada correctamente.');
        process.exit(0);
    } catch (err) {
        console.error('Error en la migración:', err);
        process.exit(1);
    }
}

run();

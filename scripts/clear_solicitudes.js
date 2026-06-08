/**
 * Limpia TODOS los registros de solicitudes para empezar una prueba desde cero.
 *
 * Borra: Adjuntos, Historial y Solicitudes (en orden por las FK).
 * NO toca la tabla Usuarios (seguís pudiendo loguearte como Calidad/Sistemas/Admin)
 * ni modifica el esquema (a diferencia de reset_db_v2.js, que hace DROP/CREATE).
 *
 * Uso:  node scripts/clear_solicitudes.js
 *
 * Nota: los archivos ya subidos a Azure Blob Storage NO se eliminan desde aquí;
 * sólo se borran sus metadatos en la DB. Para una prueba limpia de UI esto alcanza.
 */
const { poolPromise } = require('../config/db');

async function clear() {
    try {
        console.log('Conectando a la base de datos para LIMPIAR registros...');
        const pool = await poolPromise;
        if (!pool) throw new Error('No hay conexión con la base de datos');

        // Conteo previo (informativo)
        const antes = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM Solicitudes) AS Solicitudes,
                (SELECT COUNT(*) FROM Adjuntos)    AS Adjuntos,
                (SELECT COUNT(*) FROM Historial)   AS Historial
        `);
        console.log('Registros antes:', antes.recordset[0]);

        // Borrado en orden por las claves foráneas
        console.log('Borrando Adjuntos...');
        await pool.request().query('DELETE FROM Adjuntos');

        console.log('Borrando Historial...');
        await pool.request().query('DELETE FROM Historial');

        console.log('Borrando Solicitudes...');
        await pool.request().query('DELETE FROM Solicitudes');

        // Conteo final
        const despues = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM Solicitudes) AS Solicitudes,
                (SELECT COUNT(*) FROM Adjuntos)    AS Adjuntos,
                (SELECT COUNT(*) FROM Historial)   AS Historial,
                (SELECT COUNT(*) FROM Usuarios)    AS Usuarios
        `);
        console.log('Registros después:', despues.recordset[0]);

        console.log('✅ Listo: 0 solicitudes. Los usuarios se conservaron.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error al limpiar registros:', err);
        process.exit(1);
    }
}

clear();

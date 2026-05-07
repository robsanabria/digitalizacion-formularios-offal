const { poolPromise } = require('../config/db');

async function check() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        console.log('Tablas encontradas:', result.recordset.map(t => t.TABLE_NAME));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

check();

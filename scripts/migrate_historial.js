/**
 * migrate_historial.js
 * Crea la tabla Historial si no existe.
 * Ejecutar con: node scripts/migrate_historial.js
 */
const { poolPromise } = require('../config/db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log('[Migrate] Conectado a la base de datos.');

        // Verificar si la tabla ya existe
        const check = await pool.request().query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'Historial'
        `);

        if (check.recordset.length > 0) {
            console.log('[Migrate] La tabla Historial ya existe. No se realizaron cambios.');
            process.exit(0);
        }

        // Crear la tabla
        await pool.request().query(`
            CREATE TABLE Historial (
                HistorialId     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
                SolicitudId     UNIQUEIDENTIFIER NOT NULL,
                UsuarioId       UNIQUEIDENTIFIER NOT NULL,
                EstadoAnterior  NVARCHAR(100)    NOT NULL,
                EstadoNuevo     NVARCHAR(100)    NOT NULL,
                Accion          NVARCHAR(255)    NOT NULL,
                Comentario      NVARCHAR(1000)   NULL,
                FechaEvento     DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

                CONSTRAINT FK_Historial_Solicitudes
                    FOREIGN KEY (SolicitudId) REFERENCES Solicitudes(SolicitudId),
                CONSTRAINT FK_Historial_Usuarios
                    FOREIGN KEY (UsuarioId)   REFERENCES Usuarios(UsuarioId)
            )
        `);

        console.log('[Migrate] ✅ Tabla Historial creada correctamente.');
        process.exit(0);
    } catch (err) {
        console.error('[Migrate] ❌ Error:', err.message);
        process.exit(1);
    }
}

migrate();

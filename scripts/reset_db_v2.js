const { poolPromise } = require('../config/db');

async function resetDB() {
    try {
        console.log("Conectando a la base de datos para RESET...");
        const pool = await poolPromise;
        if (!pool) throw new Error("No hay conexión");

        // 1. Borrar datos existentes (en orden por FK)
        console.log("Limpiando datos actuales...");
        await pool.request().query('DELETE FROM Adjuntos');
        await pool.request().query('DELETE FROM Historial');
        await pool.request().query('DELETE FROM Solicitudes');

        // 2. Modificar/Recrear tabla Solicitudes con todos los campos del REG-011 y 007
        console.log("Actualizando esquema de tabla Solicitudes...");
        
        // Eliminamos la tabla si queremos un fresh start total, o solo agregamos columnas.
        // Dado que pides limpiar, vamos a asegurar que la estructura sea la correcta.
        // NOTA: Si prefieres no borrar la tabla, usamos ALTER TABLE. Pero para limpiar 100%, DROP/CREATE es más seguro.
        
        await pool.request().query(`
            IF OBJECT_ID('dbo.Historial', 'U') IS NOT NULL DROP TABLE dbo.Historial;
            IF OBJECT_ID('dbo.Adjuntos', 'U') IS NOT NULL DROP TABLE dbo.Adjuntos;
            IF OBJECT_ID('dbo.Solicitudes', 'U') IS NOT NULL DROP TABLE dbo.Solicitudes;
            
            CREATE TABLE Solicitudes (
                SolicitudId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                FechaCreacion DATETIME2 DEFAULT GETDATE(),
                SolicitadoPor UNIQUEIDENTIFIER NOT NULL, -- FK a Usuarios
                RolSolicitante NVARCHAR(50),
                Estado NVARCHAR(50) DEFAULT 'REG-011-PENDIENTE', -- REG-011-PENDIENTE, REG-007-PROCESO, APROBADO, RECHAZADO
                
                -- CAMPOS REG-SIS-011 (Calidad)
                FechaSolicitud DATE,
                SectorSolicitante NVARCHAR(100),
                Motivo NVARCHAR(MAX), -- JSON string de opciones
                NombreProducto NVARCHAR(300),
                CodigoProducto NVARCHAR(100),
                Destino NVARCHAR(200),
                VidaUtil NVARCHAR(50),
                CodigoSenasa NVARCHAR(100),
                Impresoras NVARCHAR(MAX), -- JSON string de opciones
                Tara NVARCHAR(50),
                PesoMinimo NVARCHAR(50),
                PesoMaximo NVARCHAR(50),
                PesoEstandar NVARCHAR(50),
                NumCaja NVARCHAR(50),
                Faja NVARCHAR(50),
                CodigoExterno NVARCHAR(50),
                ComentariosSolicitante NVARCHAR(MAX),
                CambioSolicitado NVARCHAR(MAX),
                
                -- CAMPOS REG-SIS-007 (Sistemas)
                FechaPresentacion DATE,
                CodigoTwins NVARCHAR(100),
                CorrespondeSolicitud NVARCHAR(100)
            );

            -- Re-crear tablas dependientes
            CREATE TABLE Adjuntos (
                AdjuntoId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                SolicitudId UNIQUEIDENTIFIER NOT NULL REFERENCES Solicitudes(SolicitudId),
                NombreArchivo NVARCHAR(260),
                RutaArchivo NVARCHAR(1024),
                TipoContenido NVARCHAR(100),
                TamanoArchivo BIGINT,
                FechaCarga DATETIME2 DEFAULT GETDATE()
            );

            CREATE TABLE Historial (
                HistorialId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                SolicitudId UNIQUEIDENTIFIER NOT NULL REFERENCES Solicitudes(SolicitudId),
                UsuarioId UNIQUEIDENTIFIER NOT NULL,
                EstadoAnterior NVARCHAR(50),
                EstadoNuevo NVARCHAR(50),
                Accion NVARCHAR(200),
                Comentario NVARCHAR(MAX),
                FechaEvento DATETIME2 DEFAULT GETDATE()
            );
        `);

        console.log("✅ Base de datos reseteada y esquema REG-011 / REG-007 implementado.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error en el reset:", err);
        process.exit(1);
    }
}

resetDB();

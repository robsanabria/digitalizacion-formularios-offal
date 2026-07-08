/* ============================================================================
   Control de Etiquetas (REG-SIS-011 / REG-SIS-007)
   Esquema de base de datos — SQL Server / Azure SQL
   ----------------------------------------------------------------------------
   Ejecutar UNA vez sobre una base vacía (idempotente: se puede volver a correr).
   Genera las 4 tablas del sistema y un usuario local de desarrollo.
   ============================================================================ */

/* ── Usuarios ─────────────────────────────────────────────────────────────── */
IF OBJECT_ID('dbo.Usuarios', 'U') IS NULL
CREATE TABLE dbo.Usuarios (
    UsuarioId     UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Usuarios PRIMARY KEY DEFAULT NEWID(),
    NombreUsuario NVARCHAR(150)    NOT NULL,
    Email         NVARCHAR(256)    NULL,
    Rol           NVARCHAR(50)     NOT NULL DEFAULT 'CALIDAD',   -- ADMIN | CALIDAD | SISTEMAS
    Activo        BIT              NOT NULL DEFAULT 1,
    FechaCreacion DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME()
);

/* ── Solicitudes (REG-SIS-011 + datos del REG-SIS-007) ────────────────────── */
IF OBJECT_ID('dbo.Solicitudes', 'U') IS NULL
CREATE TABLE dbo.Solicitudes (
    SolicitudId            UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Solicitudes PRIMARY KEY DEFAULT NEWID(),
    FechaCreacion          DATETIME2        NULL DEFAULT GETDATE(),
    SolicitadoPor          UNIQUEIDENTIFIER NOT NULL,            -- -> Usuarios.UsuarioId (creador, Calidad)
    RolSolicitante         NVARCHAR(50)     NULL,
    Estado                 NVARCHAR(50)     NULL DEFAULT 'REG-011-PENDIENTE-APROBACION',
    FechaSolicitud         DATE             NULL,
    SectorSolicitante      NVARCHAR(100)    NULL,                -- "Solicitado por"
    Motivo                 NVARCHAR(MAX)    NULL,                -- JSON: ["SENASA", ...]
    NombreProducto         NVARCHAR(300)    NULL,
    CodigoProducto         NVARCHAR(100)    NULL,
    Destino                NVARCHAR(200)    NULL,
    VidaUtil               NVARCHAR(50)     NULL,
    CodigoSenasa           NVARCHAR(100)    NULL,
    Impresoras             NVARCHAR(MAX)    NULL,                -- JSON: ["ZEBRA", ...]
    Tara                   NVARCHAR(50)     NULL,
    PesoMinimo             NVARCHAR(50)     NULL,
    PesoMaximo             NVARCHAR(50)     NULL,
    PesoEstandar           NVARCHAR(50)     NULL,
    NumCaja                NVARCHAR(50)     NULL,
    Faja                   NVARCHAR(50)     NULL,
    CodigoExterno          NVARCHAR(50)     NULL,
    ComentariosSolicitante NVARCHAR(MAX)    NULL,
    CambioSolicitado       NVARCHAR(MAX)    NULL,
    -- Campos del REG-SIS-007 (respuesta de Sistemas / aprobación de Calidad)
    FechaPresentacion      DATE             NULL,
    CodigoTwins            NVARCHAR(100)    NULL,
    CorrespondeSolicitud   NVARCHAR(100)    NULL,
    TipoEtiqueta           NVARCHAR(MAX)    NULL                 -- JSON: ["Etiqueta Final", ...]
);

/* ── Adjuntos (imágenes: formato original/propuesto, etiquetas resultantes) ── */
IF OBJECT_ID('dbo.Adjuntos', 'U') IS NULL
CREATE TABLE dbo.Adjuntos (
    AdjuntoId     UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Adjuntos PRIMARY KEY DEFAULT NEWID(),
    SolicitudId   UNIQUEIDENTIFIER NOT NULL,
    NombreArchivo NVARCHAR(260)    NULL,
    RutaArchivo   NVARCHAR(1024)   NULL,                          -- URL del blob en Azure Storage
    TipoContenido NVARCHAR(100)    NULL,                          -- MIME (image/jpeg, ...)
    TamanoArchivo BIGINT           NULL,
    FechaCarga    DATETIME2        NULL DEFAULT GETDATE(),
    TipoAdjunto   NVARCHAR(50)     NULL DEFAULT 'PROPUESTO',      -- ORIGINAL | ORIGINAL_07 | PROPUESTO
    CONSTRAINT FK_Adjuntos_Solicitudes FOREIGN KEY (SolicitudId) REFERENCES dbo.Solicitudes(SolicitudId)
);

/* ── Historial (trazabilidad del circuito) ────────────────────────────────── */
IF OBJECT_ID('dbo.Historial', 'U') IS NULL
CREATE TABLE dbo.Historial (
    HistorialId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Historial PRIMARY KEY DEFAULT NEWID(),
    SolicitudId    UNIQUEIDENTIFIER NOT NULL,
    UsuarioId      UNIQUEIDENTIFIER NOT NULL,
    EstadoAnterior NVARCHAR(50)     NULL,
    EstadoNuevo    NVARCHAR(50)     NULL,
    Accion         NVARCHAR(200)    NULL,
    Comentario     NVARCHAR(MAX)    NULL,                         -- motivos, observaciones, etc.
    FechaEvento    DATETIME2        NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Historial_Solicitudes FOREIGN KEY (SolicitudId) REFERENCES dbo.Solicitudes(SolicitudId)
);

/* ── Índices útiles ───────────────────────────────────────────────────────── */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Adjuntos_SolicitudId')
    CREATE INDEX IX_Adjuntos_SolicitudId ON dbo.Adjuntos(SolicitudId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Historial_SolicitudId')
    CREATE INDEX IX_Historial_SolicitudId ON dbo.Historial(SolicitudId);

/* ── Usuario local de desarrollo ──────────────────────────────────────────────
   El backend, en modo NO producción y sin login de Azure, usa este UsuarioId
   fijo (ver middlewares/authMiddleware.js). Sembrarlo evita nombres vacíos. */
IF NOT EXISTS (SELECT 1 FROM dbo.Usuarios WHERE UsuarioId = '00000000-0000-0000-0000-000000000000')
    INSERT INTO dbo.Usuarios (UsuarioId, NombreUsuario, Email, Rol)
    VALUES ('00000000-0000-0000-0000-000000000000', 'Usuario Local (Dev)', 'dev@local.com', 'ADMIN');

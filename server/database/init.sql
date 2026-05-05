-- SCRIPT DE INICIALIZACIÓN EN ESPAÑOL
-- Base de Datos: controletiquetas

-- Borrado de tablas anteriores (si existen)
DROP TABLE IF EXISTS HistorialSolicitudes;
DROP TABLE IF EXISTS Firmas;
DROP TABLE IF EXISTS Adjuntos;
DROP TABLE IF EXISTS Solicitudes;
DROP TABLE IF EXISTS Usuarios;

-- 1. Tabla de Usuarios
CREATE TABLE Usuarios (
  UsuarioId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  NombreUsuario NVARCHAR(150) NOT NULL,
  Email NVARCHAR(256) NULL,
  Rol NVARCHAR(50) NOT NULL, -- Ej: 'Calidad', 'Sistemas', 'Administrador'
  FechaCreacion DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- 2. Tabla de Solicitudes (REG-SIS-007)
CREATE TABLE Solicitudes (
  SolicitudId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  FechaCreacion DATETIME2 DEFAULT SYSUTCDATETIME(),
  FechaEnvio DATETIME2 NULL,
  SolicitadoPor UNIQUEIDENTIFIER NOT NULL REFERENCES Usuarios(UsuarioId),
  RolSolicitante NVARCHAR(50),
  FechaPresentacion DATE NULL,
  Motivo NVARCHAR(MAX),
  TipoSenasa NVARCHAR(100), -- SENASA, Nuevo producto, Modificación, etc.
  NombreProducto NVARCHAR(300),
  Destino NVARCHAR(200),
  Codigo NVARCHAR(100),
  CodigoSenasa NVARCHAR(100),
  Impresoras NVARCHAR(200), -- CSV o JSON con las impresoras
  DescripcionCorta NVARCHAR(MAX),
  ChequeoFormato BIT DEFAULT 0,
  ChequeoPuntoImpresion BIT DEFAULT 0,
  Estado NVARCHAR(50) DEFAULT 'borrador' -- borrador, pendiente, aprobado, parcial, rechazado
);

-- 3. Tabla de Adjuntos
CREATE TABLE Adjuntos (
  AdjuntoId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  SolicitudId UNIQUEIDENTIFIER NOT NULL REFERENCES Solicitudes(SolicitudId),
  NombreArchivo NVARCHAR(260),
  RutaArchivo NVARCHAR(1024),
  TipoContenido NVARCHAR(100),
  TamanoArchivo BIGINT,
  SubidoPor UNIQUEIDENTIFIER REFERENCES Usuarios(UsuarioId),
  FechaSubida DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- 4. Tabla de Firmas / Aprobaciones
CREATE TABLE Firmas (
  FirmaId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  SolicitudId UNIQUEIDENTIFIER NOT NULL REFERENCES Solicitudes(SolicitudId),
  UsuarioId UNIQUEIDENTIFIER REFERENCES Usuarios(UsuarioId),
  Rol NVARCHAR(50),
  RutaFirma NVARCHAR(1024), -- Ruta al PNG de la firma
  DatosFirma VARBINARY(MAX) NULL,
  Comentario NVARCHAR(MAX) NULL,
  Resultado NVARCHAR(50) NULL, -- Aprobado / Parcial / Rechazado
  FechaFirma DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- 5. Historial de Auditoría
CREATE TABLE HistorialSolicitudes (
  HistorialId BIGINT IDENTITY(1,1) PRIMARY KEY,
  SolicitudId UNIQUEIDENTIFIER NOT NULL REFERENCES Solicitudes(SolicitudId),
  TipoEvento NVARCHAR(100),
  EventoPor UNIQUEIDENTIFIER NULL REFERENCES Usuarios(UsuarioId),
  FechaEvento DATETIME2 DEFAULT SYSUTCDATETIME(),
  Detalles NVARCHAR(MAX)
);

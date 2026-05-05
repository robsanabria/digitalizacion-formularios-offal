-- Script de inicialización de Base de Datos para REG-SIS-007
-- Base de Datos: controletiquetas

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
      UserId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      UserName NVARCHAR(150) NOT NULL,
      Email NVARCHAR(256) NULL,
      Role NVARCHAR(50) NOT NULL,
      CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Requests')
BEGIN
    CREATE TABLE Requests (
      RequestId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
      SubmittedAt DATETIME2 NULL,
      RequestedBy UNIQUEIDENTIFIER NOT NULL REFERENCES Users(UserId),
      RequestedByRole NVARCHAR(50),
      PresentationDate DATE NULL,
      Reason NVARCHAR(MAX),
      SenasaType NVARCHAR(100), -- valores: SENASA, Nuevo producto, Modificación de existente, Reactivación
      ProductName NVARCHAR(300),
      Destination NVARCHAR(200),
      Code NVARCHAR(100),
      SenasaCode NVARCHAR(100),
      Printers NVARCHAR(200), -- csv o JSON
      ShortDescription NVARCHAR(MAX),
      CheckFormat BIT DEFAULT 0,
      CheckPrintPoint BIT DEFAULT 0,
      Status NVARCHAR(50) DEFAULT 'draft' -- draft, pending, approved, partial, rejected
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Attachments')
BEGIN
    CREATE TABLE Attachments (
      AttachmentId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      RequestId UNIQUEIDENTIFIER NOT NULL REFERENCES Requests(RequestId),
      FileName NVARCHAR(260),
      FilePath NVARCHAR(1024),
      ContentType NVARCHAR(100),
      FileSize BIGINT,
      UploadedBy UNIQUEIDENTIFIER REFERENCES Users(UserId),
      UploadedAt DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Signatures')
BEGIN
    CREATE TABLE Signatures (
      SignatureId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      RequestId UNIQUEIDENTIFIER NOT NULL REFERENCES Requests(RequestId),
      UserId UNIQUEIDENTIFIER REFERENCES Users(UserId),
      Role NVARCHAR(50),
      SignaturePath NVARCHAR(1024), -- ruta PNG
      SignatureData VARBINARY(MAX) NULL, -- opcional: almacenar binario
      Comment NVARCHAR(MAX) NULL,
      Result NVARCHAR(50) NULL, -- Approved / Partial / Rejected
      SignedAt DATETIME2 DEFAULT SYSUTCDATETIME()
    );
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RequestHistory')
BEGIN
    CREATE TABLE RequestHistory (
      HistoryId BIGINT IDENTITY(1,1) PRIMARY KEY,
      RequestId UNIQUEIDENTIFIER NOT NULL REFERENCES Requests(RequestId),
      EventType NVARCHAR(100),
      EventBy UNIQUEIDENTIFIER NULL REFERENCES Users(UserId),
      EventAt DATETIME2 DEFAULT SYSUTCDATETIME(),
      Details NVARCHAR(MAX)
    );
END

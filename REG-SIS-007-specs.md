# Especificación técnica — Formulario REG-SIS-007 (Carga Online)

Fecha: 2026-04-23

Propósito: definir de forma completa los requisitos técnicos, modelos de datos, endpoints, validaciones, despliegue on‑prem y operaciones para la versión web del formulario REG‑SIS‑007. Stack acordado: Node.js (Backend) y React (Frontend); Base de datos SQL Server; sin contenedores (no Docker). Accesible sólo desde la red interna de la empresa.

---

## 1. Resumen funcional
- Interfaz web para crear solicitudes de cambio de producto, adjuntar fotos de etiquetas, gestionar aprobaciones y exportar/print; roles principales: `Solicitante/Calidad` (mismo rol), `Sistemas`, `Administrador`.
- Flujo: Crear (p.ej. PDF escaneado) → Adjuntar evidencia → Sistemas sube fotos técnicas → Registrar aprobaciones (Sistemas + Calidad) → Exportar/Imprimir → Historial auditable.

## 2. Requisitos clave
- Acceso: solo LAN/VPN interna.
- Autenticación: integrar con Microsoft 365 (Microsoft Identity Platform / OAuth2 / OpenID Connect) preferente; si no es posible, usar JWT con usuarios sincronizados.
- Almacenamiento de archivos: PRIMARIO: Azure Blob Storage (Blob Container: `regsis-attachments`).
  - Naming convention: `/requests/{RequestId}/{filename}` (ej: `regsis-attachments/requests/3f2a.../etiqueta.pdf`).
  - Alternativa on‑prem: share SMB (`//fileserver/regsis/`) solo si no es posible usar Azure; en ese caso mantener la misma convención de rutas.
- Formato de firmas: imagen PNG (base64 al backend) o archivo PNG almacenado junto con metadatos.
- Restricciones de archivos: máximo 5 archivos por solicitud, 5 MB por archivo (configurable). Tipos permitidos: `image/jpeg`, `image/png`, `application/pdf`.

- Herramientas de IA: `Claude` (uso general). `Azure Document Intelligence` (Document Intelligence) será de uso exclusivo para extracción y validación semántica de formularios/etiquetas durante la carga.

-## 2.1 Autenticación, roles y autorización (detallado)
- Login: la aplicación debe exigir autenticación antes de acceder al índice o al formulario. Preferible: inicio de sesión único mediante Microsoft 365 / Microsoft Identity Platform (OAuth2 / OpenID Connect). Alternativa: formulario de login que emite JWT tras validar contra el servicio de identidades corporativo.
 - Roles y comportamientos (simplificado):
  - `Solicitante/Calidad`: crea y sube solicitudes (tanto de creación como de modificación). Registra aprobaciones o transiciones de estado (`aprobar`/`parcial`/`rechazar`), exporta e imprime en PDF, y revisa historiales. En el MVP la aprobación puede representarse con un tilde (`aprobado`/`no aprobado`) en lugar de una firma digital.
  - `Sistemas`: Inicia el circuito completando el formulario digital (que refleja el REG-SIS-007), adjunta las fotos técnicas de las etiquetas. Al guardarlo, se aprueba automáticamente por Sistemas.
  - `Solicitante/Calidad`: Recibe el formulario completado por Sistemas. Revisa la carga, las imágenes adjuntas, y registra su aprobación. La aprobación final requiere que Calidad confirme la solicitud (ya que Sistemas la auto-aprueba al crearla).
- Autorización: middleware en backend que verifica rol y permisos por endpoint y por acción.
- Session management: si se usa JWT, tokens con expiración corta (p.ej. 1h) y refresh tokens almacenados con revocación posible; si se usa AD/Kerberos, delegar sesión al proxy/IIS.
Mapping Microsoft 365 → Roles: sincronizar usuarios de Microsoft 365 (grupos/claims) con la tabla `Users` al primer login, almacenando `UserId`, `UserName`, `Email` y `Role`.

## 2.2 Índice de solicitudes (UI + API)
- UI: página `Index` con tabla de todas las solicitudes visible por permisos. Columnas mínimas: `RequestId`, `PresentationDate`, `RequestedBy`, `ProductName`, `Status`, `Última acción` (timestamp), `Acciones` (ver, editar, transicionar).
- Filtros: por `Status`, `RequestedBy`, `ProductName`, `PresentationDate` (rango), `SenasaType` y `Impresora`.
- Búsqueda: texto libre que filtre por `ProductName`, `Code`, `SenasaCode`.
- Paginación y orden: paginación server-side y orden por `CreatedAt` o `PresentationDate`.
- API endpoint: `GET /api/requests` soporta query params: `?status=&requestedBy=&product=&from=&to=&printer=&search=&page=&pageSize=&sort=`.
- Seguridad: el resultado debe respetar permisos (p.ej. un `Solicitante` ve solo sus solicitudes, `Calidad` ve todas o las del área dependiendo política).

## 3. Modelo de datos (SQL Server)
DDL de tablas principales (T-SQL):

```sql
CREATE TABLE Users (
  UserId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  UserName NVARCHAR(150) NOT NULL,
  Email NVARCHAR(256) NULL,
  Role NVARCHAR(50) NOT NULL,
  CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);

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
  CorrespondeSolicitud NVARCHAR(100),
  Printers NVARCHAR(200), -- csv o JSON
  ShortDescription NVARCHAR(MAX),
  CheckFormat BIT DEFAULT 0,
  CheckPrintPoint BIT DEFAULT 0,
  Status NVARCHAR(50) DEFAULT 'draft' -- draft, pending, approved, partial, rejected
);

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

CREATE TABLE RequestHistory (
  HistoryId BIGINT IDENTITY(1,1) PRIMARY KEY,
  RequestId UNIQUEIDENTIFIER NOT NULL REFERENCES Requests(RequestId),
  EventType NVARCHAR(100),
  EventBy UNIQUEIDENTIFIER NULL REFERENCES Users(UserId),
  EventAt DATETIME2 DEFAULT SYSUTCDATETIME(),
  Details NVARCHAR(MAX)
);
```

Notas: `FilePath` almacena la ruta o URL al almacenamiento de archivos. Por defecto debe apuntar al Blob Container `regsis-attachments` con la convención `/requests/{RequestId}/{filename}` (ej: `https://<storename>.blob.core.windows.net/regsis-attachments/requests/{RequestId}/etiqueta.pdf`). Alternativa on‑prem: share SMB.

## 4. Endpoints API (REST) — ejemplos
Autenticación: Microsoft 365 / OAuth2 (Bearer token) o JWT. Todos los endpoints requieren autenticación y autorización por rol.

- POST /api/requests
  - Descripción: crea una solicitud en estado `draft` o `pending`.
  - Body JSON (ejemplo):
    ```json
    {
      "presentationDate":"2026-04-23",
      "requestedBy":"{userId}",
      "requestedByRole":"PRODUCCION",
      "reason":"Cambio X",
      "senasaType":"Nuevo producto",
      "productName":"Producto A",
      "destination":"Mercado interno",
      "code":"PRD-001",
      "senasaCode":"S-123",
      "printers":["BIZERBA","ZEBRA"],
      "shortDescription":"Descripción breve"
    }
    ```

- GET /api/requests/:id
  - Obtener solicitud + archivos + firmas + historial.

- PUT /api/requests/:id
  - Actualizar campos permitidos (solo en estados `draft` o `pending` por permisos).

- POST /api/requests/:id/attachments
  - Subir archivo (multipart/form-data). Respuesta: metadata del attachment.

- POST /api/requests/:id/signature
  - Capturar firma: body: { "userId": "...", "role": "Solicitante", "pngBase64":"data:image/png;base64,...", "comment":"...", "result":"Pending" }
  - El backend debe decodificar y guardar PNG y crear registro en `Signatures`.

- POST /api/requests/:id/transition
  - Cambiar estado con validaciones y guardando en `RequestHistory`.
  - Body: { "action": "submit|approve|partial|reject", "userId":"...", "comment":"..." }

## 5. Especificaciones de validación y reglas de negocio
- Campos obligatorios para `submit`: `requestedBy`, `productName`, `reason`, `senasaType` y al menos 1 attachment (configurable).
- Para la aprobación final se requiere la conformidad tanto de `Sistemas` como de `Calidad` (ambos deben registrar decisión `aprobado`/`no aprobado`).
- Cuando se produce una transición se inserta un registro en `RequestHistory` con detalle y timestamp.
- Firma del solicitante debe existir para `submit` (captura PNG con trazo mínimo de X píxeles). Para el MVP no es obligatorio usar firmas digitales: el sistema puede usar una columna de decisión/tilde (`aprobado` boolean) y comentario. El almacenamiento de imágenes de firmas queda como opción (campo `SignaturePath` / `SignatureData`) si se desea conservar la imagen.
- `Attachments` / `Adjuntos`: archivos subidos asociados a una solicitud; validados por `Azure Document Intelligence` antes de aceptarse. Se soportan PDFs escaneados (formato habitual para solicitudes de creación/modificación), imágenes y otros formatos permitidos.

Impactos específicos:
- Attachments: dependencia primaria en Azure Blob Storage (`regsis-attachments`). El flujo de aceptación pasa por Document Intelligence y la ruta final se normaliza a `/requests/{RequestId}/{filename}`.
- Requests: Document Intelligence puede proporcionar campos extraídos que el backend usará para autocompletar o proponer valores en la entidad `Requests` (ej: `ProductName`, `Code`, `SenasaCode`, `PresentationDate`), sujetos a validación por reglas de negocio.

## 6. Lógica de archivos y firmas
- Recepción: usar `multer` (o `busboy`) para multipart uploads; el backend recibe el archivo y asigna o valida el `RequestId` asociado.

- Pipeline con `Azure Document Intelligence` (nuevo flujo):
  1. El usuario sube el archivo (PDF escaneado o imagen) a `POST /api/requests/:id/attachments`.
  2. El backend envía el archivo a `Azure Document Intelligence` para extracción de campos y reconocimiento (OCR).
  3. Document Intelligence devuelve campos extraídos y confianza; el backend aplica validación semántica (reglas de negocio: campos obligatorios, formatos, consistencia).
  4. Si la validación es satisfactoria: el backend almacena el archivo en Azure Blob Container `regsis-attachments` bajo la ruta `/requests/{RequestId}/{filename}`, crea el registro en `Attachments` (incluyendo `FilePath` con la URL al blob) y, si procede, autocompleta o sugiere valores en el registro `Requests` usando los campos extraídos.
  5. Si la validación falla: el attachment se marca como `invalid` (o se devuelve al usuario para corrección) y se registra el evento en `RequestHistory` con detalle de fallos.

- Validaciones adicionales: MIME, tamaño (5 MB por defecto), escaneo antivirus. `Azure Document Intelligence` aporta OCR y validación semántica adicional.
- Almacenamiento: persistir `FilePath` como URL al blob (ej: `https://<storename>.blob.core.windows.net/regsis-attachments/requests/{RequestId}/{filename}`). No almacenar binarios en la DB.
- Firma / Aprobación: para el MVP la aprobación es una decisión (`aprobado`/`no aprobado`) almacenada en `Signatures` (puede incluir `SignaturePath` si se guarda imagen). Las aprobaciones requeridas: tanto `Sistemas` como `Calidad` deben registrar `aprobado` para completar la aprobación final.

## 7. Seguridad
- Forzar TLS en el proxy interno (IIS o nginx). No exponer puertos HTTP fuera de la red interna.
- Validar y sanear todas las entradas; usar prepared statements / parameterized queries al interactuar con SQL Server.
- Restringir tipos de archivo y tamaño; usar listas blancas MIME.
- Control de acceso: comprobar role en cada endpoint.
- Registrar eventos críticos (ingresos, transiciones de estado, subidas, firmas) en `RequestHistory` y en logs del servidor.

## 8. Recomendaciones de implementación (Node.js)
- Node.js LTS (p.ej. 18+). Proyecto con `express` o `fastify`.
- Paquetes recomendados:
  - `express`, `mssql` (driver oficial), `tedious` opcional
  - `multer` para uploads
  - `sharp` para previsualización/compress de imágenes (opcional)
  - `express-validator` para validaciones
  - `winston` o `pino` para logging
  - `passport-ldapauth` o `activedirectory2` para integración AD
  - `jsonwebtoken` si se usa JWT

Estructura de carpetas sugerida:

```
app/
  controllers/
  services/
  models/   -- consultas SQL o repositorios
  routes/
  middlewares/
  uploads/  -- path hacia SMB montado (no guardar en repo)
config/
scripts/
package.json
README.md
```

Ejemplo de conexión a SQL Server (usando `mssql`):

```js
const sql = require('mssql');
const pool = new sql.ConnectionPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true }
});
await pool.connect();
```

## 9. Despliegue on‑prem (sin Docker)
Opciones de servidor: Windows Server o Linux (Ubuntu). Recomendaciones generales:

- Preparación del servidor:
  - Crear cuenta de servicio para la app (`svc-regsis`) con permisos mínimos.
  - Instalar Node.js LTS en servidor.
  - Montar share SMB donde se guardarán archivos (p.ej. `//fileserver/regsis/`), asegurar permisos de escritura para la cuenta de servicio.

- Ejecutar la app como servicio:
  - Windows: usar `nssm` o `pm2-windows-startup` para correr la app como servicio.
  - Linux: crear unit systemd (`/etc/systemd/system/regsis.service`) que ejecute `node dist/index.js` y configure restart on-fail.

- Reverse proxy y TLS:
  - Recomendado: IIS (con Windows Auth) o `nginx` en Linux como proxy inverso; TLS con certificado interno.

- Variables de entorno (ejemplo en archivo `.env` fuera del repo):
  - DB_HOST, DB_NAME, DB_USER, DB_PASS
  - FILES_BASE_PATH (p.ej. \\fileserver\regsis o /mnt/regsis)
  - AD_URL, AD_BASEDN, JWT_SECRET

- Backups:
  - SQL Server: programar backups completos diarios y diferenciales según política. Usar `sqlcmd` o tareas de SQL Server Agent.
  - Archivos: backups nightly del share; retention configurada (p.ej. 30 días).

## 10. Pruebas y criterios de aceptación
- Automatizadas:
  - Unit tests: validaciones de inputs, conversión de firmas, manejo de attachments.
  - Integration tests: endpoints CRUD, subida y descarga de attachments.

- Manuales / QA:
  - Crear solicitud con 0, 1 y 10 attachments.
  - Capturar firma y verificar almacenado y asociación.
  - Flujo de aprobación: aprobar, devolver (parcialmente), rechazar; comprobar historial.
  - Escenario permisos: Calidad no puede ejecutar acciones de Sistemas; Sistemas no puede aprobar formalmente; Calidad sí puede aprobar.

- Criterios de aceptación mínimos:
  - Crear y enviar solicitud funciona y genera `RequestId`.
  - Archivo subido accesible desde la vista detalle y su metadato almacenado en DB.
  - Firma del solicitante se guarda como PNG y referencia en `Signatures`.
  - Historial contiene transición de estados con usuario y timestamp.

## 11. UI / Wireframe (resumen)
- Página Crear: campos agrupados por secciones (Datos generales, Detalle del cambio, Impresoras afectadas, Archivos, Firmas).
- Botones: `Guardar borrador`, `Enviar para revisión`.
- Modal firma: canvas con `Limpiar` y `Guardar`.
- Vista detalle: timeline de aprobaciones, lista de attachments con previsualización, botones para descargar.

### 11.1 Exportar / Imprimir en PDF
- UI: añadir botón `Exportar PDF` y `Imprimir` en la vista detalle de la solicitud y en la línea de acciones del `Index` (para exportar la solicitud seleccionada). El botón `Exportar PDF` abre una opción modal con: `Incluir attachments (sí/no)`, `Incluir historial (sí/no)` y `Generar y descargar`.
- Comportamiento: `Imprimir` puede abrir la vista web formateada (`/requests/:id/print`) y llamar a `window.print()` en el navegador; `Exportar PDF` solicita al backend generar y retornar el PDF.
- API endpoint recomendado: `GET /api/requests/:id/export?format=pdf&includeAttachments=true&includeHistory=true`.
  - Respuesta: `application/pdf` con stream del archivo generado.
  - Seguridad: validar permisos antes de generar; registrar la acción de export (usuario, timestamp) en `RequestHistory`.
- Almacenamiento: opción A) generar on‑demand y no almacenar, B) generar y guardar copia en disco (share) y crear un registro en `Attachments` o en una tabla `GeneratedFiles` con `FileType='exported_pdf'` y `GeneratedBy/GeneratedAt`.
- Implementación recomendada (Node.js):
  - Opción preferida: usar `puppeteer` (headless Chromium) para renderizar una vista HTML bien formateada del formulario (`/requests/:id/print`) y exportar a PDF. Ventaja: alta fidelidad WYSIWYG.
  - Alternativas: `wkhtmltopdf` (binario), `html-pdf` (menos mantenimiento), o bibliotecas programáticas como `pdfkit` / `pdf-lib` si se quiere construir PDF desde datos.
  - Manejo de attachments: si se incluyen, incrustar miniaturas o anexar páginas al PDF (usar `pdf-lib` para merge si se generan PDFs adicionales).
  - Consideraciones on‑prem: `puppeteer` requiere dependencias del sistema (libasound2, libx11, etc.) en Linux; en Windows puede funcionar con el binario de Chromium. Si hay restricciones, usar `wkhtmltopdf` como binario instalado en el servidor.
- Caching y rendimiento: para solicitudes grandes (attachments) generar asíncronamente y notificar al usuario por respuesta inmediata con `202 Accepted` y luego almacenar el PDF y notificar su disponibilidad; para peticiones rápidas, generar sincrónicamente.
- Pruebas: verificar que firmas e imágenes se imprimen legibles; comprobar tamaño del PDF; validar que solo usuarios autorizados pueden exportar.

## 12. Operaciones y mantenimiento
- Logs rotados diariamente; conservar 30 días localmente.
- Monitor: script que valide espacio en disco del share y la disponibilidad de SQL (email alert si falla).
- Procedimiento de restauración documentado en `scripts/restore.md`.

## Resumen reunión (04/05) — Document Intelligence y despliegue
- Reunión con Nico y Roberto: decisiones y avances operativos.
- Se decidió usar Azure Document Intelligence (Document Intelligence) y entrenar un modelo para reconocer campos de los formularios/etiquetas.
- WebApp hospedada en Azure con SSO de Microsoft 365 (Azure AD) para autenticación.
- Las imágenes/adjuntos se guardarán en un Blob Container (Azure Storage). La base de datos Azure SQL almacenará sólo metadatos y rutas, no los binarios.
- Recursos provisionales ya creados: instancia de Document Intelligence y la App Web en Azure; se dieron permisos a Roberto y pudo acceder.
- CI/CD: repo vinculado a GitHub y pipeline con GitHub Actions para despliegues.
- Pendientes operativos: crear el contenedor (Blob), asignar permisos (usuarios/servicio), y verificar accesos a la base de datos para Roberto.


## 13. Plan de implementación (sprint mínimo viable)
1. Scaffold de proyecto Node.js + conexión a SQL Server + scripts de DDL.
2. Endpoints básicos: crear, obtener, actualizar, listar.
3. Upload attachments y almacenar en share.
4. Captura y almacenamiento de firmas.
5. Transiciones de estado y reglas de autorización (AD).
6. UI básico React (formulario, uploads, modal de firma, detalle y timeline).
7. Pruebas, hardening y despliegue en servidor de pruebas.

---


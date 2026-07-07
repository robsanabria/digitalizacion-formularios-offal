# Sistema de Digitalización de Formularios — OFFAL EXP SA (v2.0)

> **REG-SIS-011 & REG-SIS-007**
> Solución web de nivel corporativo para la digitalización del flujo de aprobación y trazabilidad de etiquetas técnicas, emulando con fidelidad la experiencia del papel físico ("Papel Digital") mediante interfaces de alta precisión.

---

> 📋 **Novedades recientes:** ver [CHANGELOG.md](CHANGELOG.md) — tema claro, doble aprobación de Calidad, hasta 18 etiquetas por circuito, trazabilidad de eliminaciones y más.

---

## 🎯 Objetivos del Proyecto

El objetivo principal es **eliminar el uso de formularios de papel físicos** para el circuito de solicitud y modificación de etiquetas en la planta, centralizando el proceso en una plataforma web accesible internamente.

El sistema digitaliza de forma estricta un workflow encadenado:

1. **Fase A — Solicitud (REG-SIS-011)**: El departamento de **Calidad** crea una solicitud completando los datos técnicos del producto (tara, pesos mínimos/máximos, impresoras afectadas, etc.) y adjunta el formato original. **Todos los campos son obligatorios.** Queda registrado el usuario que la generó. *Estado: `REG-011-PENDIENTE-APROBACION`*.

2. **Fase B — Aprobación del REG-11 por Sistemas** *(compuerta previa)*: El departamento de **Sistemas** revisa la solicitud y decide:
   * **Aprobar**: habilita la carga del REG-007 y su firma queda registrada en el REG-11. *Estado: `REG-011-APROBADO`*.
   * **Observar**: devuelve la solicitud a Calidad para corrección. *Estado: `REG-011-OBSERVADO`*. Calidad corrige y reenvía, volviendo a `REG-011-PENDIENTE-APROBACION`.

3. **Fase C — Respuesta Técnica (REG-SIS-007)**: Sistemas visualiza los datos del REG-011 como referencia y completa el REG-007, subiendo las capturas y muestras digitales de las etiquetas modificadas en planta. *Estado: `REG-007-PENDIENTE-APROBACION`*.

4. **Fase D — Aprobación Final**: **Calidad** inspecciona visualmente el REG-007 finalizado por Sistemas y valida los cambios.
   * **Aprobar**: El circuito se cierra con éxito. *Estado: `APROBADO` (Finalizado)*.
   * **Rechazar**: El circuito se cancela y se registra el evento. *Estado: `RECHAZADO`*.

### Diagrama de estados

```
                          ┌──────────────────────────────┐
   Calidad crea  ───────► │  REG-011-PENDIENTE-APROBACION │ ◄────┐ (reenvío Calidad)
                          └──────────────┬───────────────┘      │
                          Sistemas       │                      │
                ┌── Observar ────────────┼──────────────────────┤
                ▼                        │ Aprobar              │
        ┌───────────────────┐           ▼              ┌────────┴─────────┐
        │ REG-011-OBSERVADO │     ┌────────────────┐   │  (Calidad corrige │
        └───────────────────┘     │ REG-011-APROBADO│   │   y reenvía)      │
                                  └───────┬────────┘   └──────────────────┘
                          Sistemas completa│ REG-07
                                           ▼
                          ┌────────────────────────────────┐
                          │ REG-007-PENDIENTE-APROBACION    │
                          └───────┬───────────────┬────────┘
                       Calidad    │               │  Calidad
                       Aprobar    ▼               ▼  Rechazar
                          ┌──────────┐      ┌────────────┐
                          │ APROBADO │      │ RECHAZADO  │
                          └──────────┘      └────────────┘
```

---

## ✨ Características clave

### Circuito y negocio
* **Circuito de aprobación con compuerta**: Sistemas debe aprobar el REG-11 antes de completar el REG-07; si lo observa, vuelve a Calidad para corrección y reenvío.
* **Firmas digitales en el papel**: el REG-11 muestra al **usuario solicitante** que lo creó y la **firma de Sistemas** al aprobarlo; el REG-07 refleja las firmas de Sistemas y Calidad según el historial.
* **Validaciones estrictas** (frontend + backend): todos los campos obligatorios al crear un REG-11, al completar un REG-07 (incluida al menos una etiqueta técnica) y al reenviar un REG-11 observado.
* **Trazabilidad**: cada transición de estado se registra en `Historial` con usuario, fecha y comentario.

### Experiencia de usuario (UI/UX tipo CRM)
* **Topbar global** con buscador de solicitudes en vivo, campana de notificaciones ("pendientes de tu acción" según rol) y menú de usuario (Configuración, Gestión de usuarios, Cerrar sesión).
* **Data grid** (TanStack Table) en las listas REG-11 / REG-07: orden por columna, búsqueda, filtros integrados (facet de estado con contadores, rango de fechas, chips removibles), paginación, selección de filas y fechas relativas.
* **Vistas separadas REG-11 / REG-07**: el menú *Solicitudes* se desglosa en dos submenús. La vista **REG-07 solo lista los registros que ya tienen respuesta de Sistemas**.
* **Selector de documento e impresión independiente**: dentro del detalle se alterna entre REG-11 y REG-07; la descarga genera el **PDF del documento seleccionado por separado**.
* **Stepper visual del circuito** (Solicitud → Aprob. Sistemas → REG-07 → Aprob. Calidad) que resalta la etapa actual.
* **Dashboard por rol** con tarjetas de *"Pendientes de tu acción"* y acceso directo a la lista filtrada.
* **Mobile-friendly**: data grid como tarjetas apiladas, bottom-nav y layouts responsivos.

---

## 🛠️ Tecnologías Utilizadas

### Frontend (`/client`)
| Tecnología | Uso |
| :--- | :--- |
| **React 19** + **Vite** | SPA y tooling de build/dev. |
| **Tailwind CSS 3** | Sistema de utilidades y diseño. |
| **shadcn/ui** (sobre **Radix UI**) | Componentes accesibles (Button, Table, Dropdown, Popover, Checkbox…). Tokens namespaced `--sh-*`. |
| **TanStack Table** | Data grid (orden, filtros, paginación, faceting). |
| **Framer Motion** | Micro-animaciones y transiciones. |
| **Lucide React** | Iconografía vectorial. |
| **DaisyUI** | *(legacy)* componentes previos, en proceso de migración a shadcn/ui. |
| **Axios** | Cliente HTTP hacia la API. |

### Backend (raíz)
| Tecnología | Uso |
| :--- | :--- |
| **Node.js** + **Express** | Servidor HTTP y API REST; sirve el frontend compilado (`client/dist`). |
| **mssql** | Driver oficial de Microsoft SQL Server / Azure SQL (consultas parametrizadas). |
| **Multer** | Carga de archivos `multipart/form-data` (en memoria). |
| **@azure/storage-blob** | SDK de Azure Blob Storage para adjuntos. |
| **cors**, **dotenv** | CORS y variables de entorno. |
| **express-validator** | *(instalado; validación adicional pendiente de adopción uniforme)*. |

### Servicios y almacenamiento (Azure)
* **Microsoft Entra ID (EasyAuth)**: SSO corporativo. El App Service inyecta las cabeceras `x-ms-client-principal-*`; el backend hace **JIT provisioning** del usuario en la tabla `Usuarios` al primer login.
* **Azure Blob Storage**: contenedor `regsis-attachments`, convención `requests/{SolicitudId}/{archivo}`. La DB guarda solo metadatos/URLs.
* **Azure AI Document Intelligence**: *previsto en la especificación para OCR/autocompletado de etiquetas; **aún no implementado** en el código.*

---

## 🧱 Arquitectura

```
Navegador (React SPA)
   │  HTTPS  (Axios → /api)
   ▼
Azure App Service  ──────────────────────────────────────────┐
   │  Express (index.js)                                       │
   │   ├─ authMiddleware  → identidad (EasyAuth) + JIT user    │
   │   ├─ roleMiddleware  → autorización por rol               │
   │   ├─ routes/ → controllers/ → services/                   │
   │   └─ static: client/dist (frontend compilado)             │
   ▼                         ▼                                 ▼
Azure SQL Database     Azure Blob Storage              Microsoft Entra ID
(Usuarios, Solicitudes, (regsis-attachments)            (SSO / roles)
 Adjuntos, Historial)
```

---

## 🗄️ Modelo de datos (SQL Server)

| Tabla | Descripción |
| :--- | :--- |
| **Usuarios** | `UsuarioId`, `NombreUsuario`, `Email`, `Rol` (`CALIDAD` / `SISTEMAS` / `ADMIN`). |
| **Solicitudes** | Registro unificado REG-011 + REG-007: datos del producto, pesos, impresoras, estado del circuito, campos de respuesta de Sistemas (`FechaPresentacion`, `CodigoTwins`, `CorrespondeSolicitud`), y `SolicitadoPor` (FK a Usuarios). |
| **Adjuntos** | Archivos por solicitud: `RutaArchivo` (URL del blob), `TipoContenido`, `TamanoArchivo`, `TipoAdjunto` (`ORIGINAL` de Calidad / `PROPUESTO` de Sistemas). |
| **Historial** | Trazabilidad: `EstadoAnterior`, `EstadoNuevo`, `Accion`, `Comentario`, `UsuarioId`, `FechaEvento`. |

---

## 🔌 API REST (principales endpoints)

> Todas las rutas `/api/*` requieren autenticación; la autorización por rol se aplica por endpoint/acción.

| Método | Endpoint | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/me` | * | Identidad del usuario autenticado. |
| `GET` | `/api/solicitudes` | * | Lista de solicitudes. |
| `GET` | `/api/solicitudes/:id` | * | Detalle + nombre del solicitante. |
| `POST` | `/api/solicitudes` | CALIDAD/ADMIN | Crea un REG-11 (valida campos obligatorios). |
| `PUT` | `/api/solicitudes/:id` | CALIDAD/SISTEMAS/ADMIN | Sistemas completa el REG-07 **o** Calidad corrige/reenvía un REG-11 observado. |
| `POST` | `/api/solicitudes/:id/transition` | CALIDAD/SISTEMAS/ADMIN | Máquina de estados (`aprobar_reg11`, `rechazar_reg11`, `approve`, `reject`). |
| `GET` | `/api/solicitudes/:id/historial` | * | Trazabilidad. |
| `GET/POST/DELETE` | `/api/solicitudes/:id/adjuntos[...]` | según tipo | Listar / subir / descargar / eliminar adjuntos. |
| `GET` | `/api/users` | ADMIN | Gestión de usuarios. |
| `PUT` | `/api/users/:id/role` | ADMIN | Cambia el rol de un usuario. |

---

## 👤 Roles y autorización

* **CALIDAD**: crea REG-11, corrige observados, aprueba/rechaza el REG-07 final.
* **SISTEMAS**: aprueba/observa el REG-11, completa el REG-07.
* **ADMIN**: todo lo anterior + gestión de usuarios.

La autorización vive en `middlewares/roleMiddleware.js` (`checkRole([...])`) por endpoint, y se refuerza con validaciones de estado/rol dentro de cada controlador.

---

## ☁️ Infraestructura y Hosting

| Componente | Recurso | Configuración |
| :--- | :--- | :--- |
| **Hosting Web** | Azure App Service (`controlEtiquetas`) | Node.js + frontend compilado. Dominio: `https://etiquetas.offalexpsa.ar` |
| **Base de Datos** | Azure SQL Database | `controletiquetas-server.database.windows.net` / `controletiquetas` |
| **Almacenamiento** | Azure Storage Account | `datos4etiquetas` / contenedor `regsis-attachments` |
| **SSO & Auth** | Microsoft Entra ID (App Registration) | Client ID: `0b35d62f-ea21-4ec0-b904-a885ac16bf7a` |

---

## 🚀 CI/CD

* **GitHub Actions** (`.github/workflows/main_controletiquetas.yml`).
* **Trigger**: `push` a `main` (o ejecución manual).
* **Job**: instala dependencias del server, compila el cliente (`cd client && npm run build`), empaqueta y despliega al **Azure App Service** con `azure/webapps-deploy`.

---

## 💻 Desarrollo local

```bash
# 1) Backend (raíz)
npm install
node index.js          # API en http://localhost:3001

# 2) Frontend (otra terminal)
cd client
npm install
npm run dev            # Vite en http://localhost:5173 (proxy /api → 3001)
```

**Variables de entorno** (`.env` en la raíz, fuera del repo):

```
PORT=3001
NODE_ENV=development
DB_SERVER=...        DB_NAME=...        DB_USER=...        DB_PASS=...
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER_NAME=regsis-attachments
```

> En desarrollo (sin EasyAuth), `authMiddleware` inyecta un usuario simulado para poder probar las vistas. Cambiá su `Rol` en `middlewares/authMiddleware.js` para emular CALIDAD / SISTEMAS / ADMIN.

---

## 🧰 Scripts útiles (`/scripts`)

| Script | Acción |
| :--- | :--- |
| `clear_solicitudes.js` | Borra Solicitudes/Adjuntos/Historial **conservando usuarios y esquema** (reset de pruebas). |
| `reset_db_v2.js` | Recrea el esquema completo *(⚠️ DROP/CREATE; revisar columnas antes de usar)*. |
| `migrate_*.js`, `check_*.js` | Migraciones/diagnósticos puntuales. |

---

## ✅ Buenas prácticas aplicadas

* **Consultas parametrizadas** con `mssql` (mitigación de SQL injection).
* **Autorización por rol** centralizada en middleware + validación de estado en controladores.
* **Secrets fuera del repo**: `.env` ignorado; credenciales en *App Settings* de Azure.
* **Separación de capas**: `routes` → `controllers` → `services` (Blob) / `config` (DB).
* **Design system**: tokens shadcn namespaced `--sh-*` para convivir sin romper estilos legacy; componentes accesibles (Radix).
* **Validación doble** (cliente para UX, servidor como fuente de verdad).
* **Flujo de trabajo Git**: una rama por feature, PR con descripción, build verde como gate, deploy automático en `main`.
* **Trazabilidad** de todas las transiciones de estado.

> 🔭 Mejoras y deuda técnica priorizada: ver **[SUGGESTIONS.md](SUGGESTIONS.md)**.

---

## 📁 Estructura del Repositorio

```bash
├── client/                      # Frontend (React 19 + Vite + Tailwind + shadcn/ui)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Primitivas shadcn/ui (button, table, popover, ...)
│   │   │   ├── App.jsx          # (en src/) orquestador principal
│   │   │   ├── Topbar.jsx       # Topbar global (buscador, notificaciones, menú usuario)
│   │   │   ├── SolicitudesDataTable.jsx  # Data grid (TanStack Table)
│   │   │   ├── DetalleSolicitud.jsx       # Panel de detalle + stepper + impresión
│   │   │   ├── REG011PaperForm.jsx / REG007PaperForm.jsx  # "Papel digital"
│   │   │   ├── NuevaSolicitud.jsx / GestionUsuarios.jsx / Toast.jsx
│   │   ├── lib/utils.js         # helper cn() (clsx + tailwind-merge)
│   │   └── index.css            # design tokens + estilos de impresión (@media print)
│   ├── tailwind.config.js / vite.config.js / jsconfig.json
├── config/                      # Conexión a SQL Server (pool mssql)
├── controllers/                 # Lógica de solicitudes, usuarios y máquina de estados
├── middlewares/                 # authMiddleware (EasyAuth + JIT) y roleMiddleware
├── routes/                      # Endpoints REST
├── services/                    # storageService (Azure Blob)
├── scripts/                     # Utilidades y migraciones
├── index.js                     # Punto de entrada Express
├── REG-SIS-007-specs.md         # Especificación técnica
├── WALKTHROUGH_V2.md            # Recorrido de flujos / UX
└── SUGGESTIONS.md               # Roadmap de mejoras y deuda técnica
```

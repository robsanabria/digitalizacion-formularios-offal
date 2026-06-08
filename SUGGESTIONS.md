# 🔭 Revisión del proyecto — Sugerencias y deuda técnica

Revisión integral (backend, frontend, seguridad, DevOps) con prioridad sugerida.
**🔴 Alta · 🟡 Media · 🟢 Baja / roadmap.**

---

## 🔒 Seguridad

| Pri | Tema | Detalle / Acción |
| :-- | :-- | :-- |
| 🔴 | **Escalada de ADMIN hardcodeada** | `middlewares/authMiddleware.js` asciende a ADMIN a cualquier email que contenga `roberto.sanabria` y provisiona usuarios nuevos como `CALIDAD`. Reemplazar por roles derivados de **grupos/claims de Entra ID** o una allowlist en variables de entorno. |
| 🔴 | **Validación de archivos en uploads** | `multer` usa `memoryStorage()` sin límites ni filtro. Agregar `limits: { fileSize: 5MB }` y `fileFilter` con whitelist (`image/jpeg`, `image/png`, `application/pdf`), como pide la especificación. |
| 🔴 | **Endpoint `/api/test-db`** | Devuelve `err.message` y `err.stack`. Quitarlo en producción o protegerlo (ADMIN) y nunca exponer el stack. |
| 🟡 | **`updateUserRole` sin validar `rol`** | Validar contra el set `['CALIDAD','SISTEMAS','ADMIN']` antes de persistir. |
| 🟡 | **`NODE_ENV=production` en Azure** | Garantizar que esté seteado para que el *bypass* de auth de desarrollo nunca se active en prod. |
| 🟡 | **Hardening HTTP** | Agregar `helmet` (cabeceras seguras) y `express-rate-limit` en endpoints sensibles. |

---

## 🧩 Backend / calidad de código

| Pri | Tema | Detalle / Acción |
| :-- | :-- | :-- |
| 🟡 | **Validación uniforme** | `express-validator` está instalado pero no se usa. Centralizar validaciones (o migrar a `zod`) en una capa, en vez de chequeos manuales por controlador. |
| 🟡 | **Logging** | Reemplazar los muchos `console.log` por un logger con niveles (`pino`/`winston`); reducir ruido en `storageService`/`authMiddleware`. |
| 🟡 | **Listado sin paginación ni scope** | `getSolicitudes` devuelve todo. Agregar **paginación server-side** y, según política, filtrar por permisos (un solicitante ve lo suyo). |
| 🟡 | **Constantes de estado compartidas** | Los strings de estado (`REG-011-...`) están repetidos en front y back. Centralizar en un módulo único para evitar typos/desalineación. |
| 🟡 | **Migraciones** | Adoptar un esquema de migraciones versionadas/idempotentes. `reset_db_v2.js` quedó desactualizado (recrea `Adjuntos` sin `TipoAdjunto`); marcarlo o corregirlo. |
| 🟢 | **Health check** | Endpoint `/health` para el monitoreo del App Service. |

---

## 🎨 Frontend / UX

| Pri | Tema | Detalle / Acción |
| :-- | :-- | :-- |
| 🟡 | **Terminar migración a shadcn/ui** | Reemplazar gradualmente DaisyUI (modales/botones legacy) y **eliminar DaisyUI** para no mantener dos sistemas de diseño y reducir CSS. |
| 🟡 | **Code-splitting** | Bundle ~630 kB. `React.lazy` para `DetalleSolicitud`, `NuevaSolicitud`, `SolicitudesDataTable`, `GestionUsuarios`. |
| 🟡 | **`ESTADO_META` duplicado** | El mapa de estados/colores está repetido en `App.jsx`, `SolicitudesDataTable.jsx` y `DetalleSolicitud.jsx`. Extraer a `lib/estados.js`. |
| 🟢 | **Toasts** | Migrar el `Toast` custom a **sonner** (consistencia y mejor UX). |
| 🟢 | **Data fetching** | Adoptar **TanStack Query** (caché, estados de carga sin flicker, optimistic updates). |
| 🟢 | **Accesibilidad** | Focus-trap en modales, `aria-label`s, cierre con `Esc`, contraste AA. |

---

## 🧪 Testing / DevOps

| Pri | Tema | Detalle / Acción |
| :-- | :-- | :-- |
| 🔴 | **Sin pruebas automatizadas** | Agregar **unit tests** (validaciones, máquina de estados) e **integration tests** (endpoints) con Vitest/Jest + supertest. |
| 🟡 | **PR checks en CI** | Hoy CI solo despliega en `main`. Agregar un workflow de **lint + build** que corra en cada PR como gate. |
| 🟡 | **Versión de Node** | CI usa `24.x`; agregar `.nvmrc` y alinear local para reproducibilidad. |
| 🟢 | **`npm audit`** | Resolver la vulnerabilidad moderada reportada al instalar dependencias. |

---

## 🚀 Roadmap de producto (UI/UX)

Continuación del rediseño tipo CRM (slices ya entregados: data grid, filtros, topbar):

| Pri | Slice | Detalle |
| :-- | :-- | :-- |
| 🟡 | **Detalle con tabs + bottom-sheet** | `Resumen · Documento · Adjuntos · Trazabilidad`; en mobile, hoja inferior (vaul) y resumen apilado del papel. |
| 🟢 | **Command palette (⌘K)** | Buscar/saltar/crear desde el teclado (cmdk). |
| 🟢 | **Vista Kanban del circuito** | Tablero por estado con tarjetas. |
| 🟢 | **Dashboard con charts** | KPIs y tendencias con **Tremor** (tiempo por etapa, embudo). |
| 🟢 | **Azure Document Intelligence** | OCR/autocompletado de etiquetas (previsto en la spec, aún no implementado). |
| 🟢 | **Export PDF server-side** | `puppeteer`/`wkhtmltopdf` para alta fidelidad además del `window.print()` actual. |
| 🟢 | **Notificaciones por email** | Avisar a Sistemas/Calidad cuando hay pendientes. |

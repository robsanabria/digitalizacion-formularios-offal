# Instalación local — Control de Etiquetas (REG-SIS-011 / REG-SIS-007)

Guía para levantar el proyecto en una máquina local (sin Azure).

## 1. Requisitos

- **Node.js 20+** (probado con 24).
- **SQL Server** (cualquiera sirve):
  - SQL Server Express local, o
  - SQL Server en Docker: `docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=CambiarEstaClave1!" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest`
  - Azure SQL (usar `DB_ENCRYPT=true`).
- **(Opcional)** Una cuenta de **Azure Blob Storage** para las imágenes/adjuntos. Sin ella el sistema funciona, pero no se pueden subir ni ver adjuntos.

## 2. Base de datos

1. Crear una base vacía, por ejemplo `ControlEtiquetas`.
2. Ejecutar el script de esquema sobre esa base:
   ```
   db/schema.sql
   ```
   Crea las 4 tablas (`Usuarios`, `Solicitudes`, `Adjuntos`, `Historial`) y un usuario local de desarrollo. Es idempotente (se puede volver a correr sin romper nada).

## 3. Configuración

1. Copiar `.env.example` a `.env`.
2. Completar la conexión a la base (`DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_PORT`).
3. Dejar `NODE_ENV=development` y `DEV_USER_ROLE=ADMIN` para entrar sin login (usuario local).
4. (Opcional) Completar `AZURE_STORAGE_CONNECTION_STRING` para habilitar adjuntos.

## 4. Instalar dependencias

```bash
npm install            # backend (raíz)
cd client && npm install && cd ..
```

## 5. Ejecutar

**Opción A — todo junto (recomendado):**
```bash
cd client && npm run build && cd ..   # compila el front a client/dist
node index.js                          # el server sirve el front + la API
```
Abrir: **http://localhost:3001**

**Opción B — modo desarrollo (2 terminales):**
```bash
# Terminal 1 (API)
node index.js
# Terminal 2 (front con hot-reload)
cd client && npm run dev
```
Abrir la URL que muestra Vite (normalmente http://localhost:5173).

## 6. Notas

- **Login local:** en `NODE_ENV=development` no hace falta autenticación de Azure; se usa un usuario local con el rol de `DEV_USER_ROLE`. En producción se usa **Azure App Service EasyAuth** (Entra ID).
- **Adjuntos:** requieren Azure Blob Storage (o un emulador como *Azurite*). El contenedor debe existir (`AZURE_STORAGE_CONTAINER_NAME`).
- **Impresión / PDF:** se genera desde el **diálogo de impresión del navegador** (Imprimir → Guardar como PDF), tamaño Legal. No requiere dependencias extra.
- **Roles:** `ADMIN`, `CALIDAD` (crea REG-011 y aprueba REG-007), `SISTEMAS` (aprueba REG-011 y completa REG-007).

## 7. Estructura

```
/                  API Node/Express (index.js, controllers, routes, services, config)
/db/schema.sql     Esquema de la base
/client            Front React + Vite + Tailwind
```

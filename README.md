# Sistema de Digitalización de Formularios — OFFAL EXP SA (v2.0)

> **REG-SIS-011 & REG-SIS-007**
> Solución web de nivel corporativo para la digitalización del flujo de aprobación y trazabilidad de etiquetas técnicas, emulando con fidelidad la experiencia del papel físico ("Papel Digital") mediante interfaces de alta precisión.

---

## 🎯 Objetivos del Proyecto

El objetivo principal es **eliminar el uso de formularios de papel físicos** para el circuito de solicitud y modificación de etiquetas en la planta, centralizando el proceso en una plataforma web accesible internamente.

El sistema digitaliza de forma estricta un workflow encadenado:
1. **Fase A (Solicitud - REG-SIS-011)**: El departamento de **Calidad** inicia una solicitud completando datos técnicos del producto (tara, pesos mínimos/máximos, impresoras afectadas, etc.). *Estado: `REG-011-PENDIENTE`*.
2. **Fase B (Respuesta Técnica - REG-SIS-007)**: El departamento de **Sistemas** toma la solicitud, visualiza los datos del REG-011 como referencia y completa el REG-007, subiendo las capturas y muestras digitales de las etiquetas modificadas en planta. *Estado: `REG-007-PENDIENTE-APROBACION`*.
3. **Fase C (Aprobación Final)**: **Calidad** inspecciona visualmente el REG-007 finalizado por Sistemas y valida los cambios.
   * **Aprobar**: El circuito se cierra con éxito. *Estado: `APROBADO` (Finalizado)*.
   * **Rechazar**: El circuito se cancela y se registra el evento. *Estado: `RECHAZADO`*.

---

## 🛠️ Tecnologías Utilizadas

El stack tecnológico ha sido seleccionado para garantizar un rendimiento óptimo, compatibilidad on-premise/cloud y cumplimiento de políticas de seguridad corporativas:

### Frontend (Cliente)
* **React 18** (scaffolding rápido mediante Vite).
* **Tailwind CSS & DaisyUI**: Diseño premium en modo oscuro "Pro Slate" combinado con componentes realistas de alta precisión que imitan el papel impreso técnico.
* **Framer Motion**: Micro-animaciones fluidas para transiciones y modales.
* **Lucide React**: Biblioteca de iconos vectoriales modernos.

### Backend (Servidor)
* **Node.js** con el framework de alto rendimiento **Express**.
* **Microsoft SQL Server Client (`mssql`)**: Driver oficial optimizado para Azure SQL.
* **Multer**: Middleware para la gestión eficiente de flujos de archivos (`multipart/form-data`).

### Servicios de Inteligencia y Almacenamiento (Azure)
* **Azure AI Document Intelligence**: Procesamiento OCR inteligente para la lectura, validación y autocompletado automático de datos a partir de etiquetas y archivos PDF subidos.
* **Azure Blob Storage**: Almacenamiento seguro en la nube de evidencias físicas en el contenedor `regsis-attachments` usando el SDK oficial de Azure.
* **Microsoft Entra ID (Azure AD / EasyAuth)**: Sistema de autenticación Single Sign-On (SSO) corporativo de Microsoft 365, con sincronización automática de roles (`CALIDAD`, `SISTEMAS`, `ADMIN`) al primer login.

---

## ☁️ Infraestructura y Hosting

El sistema está diseñado para operar en un entorno de nube administrado en **Microsoft Azure**:

| Componente | Tipo de Recurso | Identificador / Configuración |
| :--- | :--- | :--- |
| **Hosting Web** | **Azure App Service** | Aloja el backend de Node.js y sirve el frontend compilado. Integrado bajo el dominio corporativo personalizado: `https://etiquetas.offalexpsa.ar` |
| **Base de Datos** | **Azure SQL Database** | Servidor administrado: `controletiquetas-server.database.windows.net` <br> Base de datos relacional: `controletiquetas` |
| **Almacenamiento** | **Azure Storage Account** | Cuenta de almacenamiento: `datos4etiquetas` <br> Contenedor dedicado: `regsis-attachments` |
| **SSO & Auth** | **App Registration** | Microsoft Entra ID. Cliente ID: `0b35d62f-ea21-4ec0-b904-a885ac16bf7a` |

---

## 🚀 Pipeline de Despliegue (Deploy)

El despliegue está **100% automatizado** bajo un enfoque de **Integración y Entrega Continua (CI/CD)**:

* **Herramienta**: **GitHub Actions** (`.github/workflows/`).
* **Trigger**: Cualquier `git push` a la rama principal `main` ejecuta el pipeline automáticamente.
* **Flujo del Job**:
  1. Descarga el repositorio y realiza la compilación de producción del cliente React (`npm run build`).
  2. Empaqueta el backend y el frontend compilado.
  3. Despliega la aplicación hacia el **Azure App Service** utilizando perfiles de publicación seguros (`AZURE_WEBAPP_PUBLISH_PROFILE`).

---

## 📁 Estructura del Repositorio

```bash
├── client/                 # Aplicación Frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/     # Componentes visuales (Formularios REG-007, REG-011, modales)
│   │   ├── App.jsx         # Orquestador del Dashboard principal
│   │   └── index.css       # Sistema de diseño y estilos CSS de impresión
├── config/                 # Configuraciones del sistema (Conexión a Base de Datos SQL)
├── controllers/            # Controladores del Backend (Lógica de solicitudes y estados)
├── middlewares/            # Middlewares de Express (Autenticación y autorización por rol)
├── routes/                 # Definición de Endpoints de la API REST
├── services/               # Conectores y servicios externos (Azure Blob Storage)
├── scripts/                # Scripts de automatización y migraciones de DB
├── index.js                # Punto de entrada de la aplicación Node.js
├── REG-SIS-007-specs.md    # Especificaciones técnicas completas
└── WALKTHROUGH_V2.md       # Recorrido de flujos y UX v2.0

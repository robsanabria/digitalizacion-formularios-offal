# Sistema de Digitalización de Formularios — OFFAL EXP SA (v2.0)

> **REG-SIS-011 & REG-SIS-007**
> Solución web de nivel corporativo para la digitalización del flujo de aprobación y trazabilidad de etiquetas técnicas, emulando con fidelidad la experiencia del papel físico ("Papel Digital") mediante interfaces de alta precisión.

---

## 🎯 Objetivos del Proyecto

El objetivo principal es **eliminar el uso de formularios de papel físicos** para el circuito de solicitud y modificación de etiquetas en la planta, centralizando el proceso en una plataforma web accesible internamente.

El sistema digitaliza de forma estricta un workflow encadenado:

1. **Fase A  Solicitud (REG-SIS-011)**: El departamento de **Calidad** crea una solicitud completando los datos técnicos del producto (tara, pesos mínimos/máximos, impresoras afectadas, etc.) y adjunta el formato original. **Todos los campos son obligatorios.** Queda registrado el usuario que la generó. *Estado: `REG-011-PENDIENTE-APROBACION`*.

2. **Fase B Aprobación del REG-11 por Sistemas** *(compuerta previa)*: El departamento de **Sistemas** revisa la solicitud y decide:
   * **Aprobar**: habilita la carga del REG-007 y su firma queda registrada en el REG-11. *Estado: `REG-011-APROBADO`*.
   * **Observar**: devuelve la solicitud a Calidad para corrección. *Estado: `REG-011-OBSERVADO`*. Calidad corrige y reenvía, volviendo a `REG-011-PENDIENTE-APROBACION`.

3. **Fase C Respuesta Técnica (REG-SIS-007)**: Sistemas visualiza los datos del REG-011 como referencia y completa el REG-007, subiendo las capturas y muestras digitales de las etiquetas modificadas en planta. *Estado: `REG-007-PENDIENTE-APROBACION`*.

4. **Fase D Aprobación Final**: **Calidad** inspecciona visualmente el REG-007 finalizado por Sistemas y valida los cambios.
   * **Aprobar**: El circuito se cierra con éxito. *Estado: `APROBADO` (Finalizado)*.
   * **Rechazar**: El circuito se cancela y se registra el evento. *Estado: `RECHAZADO`*.

---

## ✨ Características clave

* **Vistas separadas REG-11 / REG-07**: el menú *Solicitudes* se desglosa en dos submenús. La vista **REG-07 solo lista los registros que ya tienen respuesta de Sistemas**; un REG-11 recién creado aparece únicamente en la vista REG-11.
* **Selector de documento e impresión independiente**: dentro del detalle se puede alternar entre REG-11 y REG-07; la descarga genera el **PDF del documento seleccionado por separado** (no mezcla ambos).
* **Circuito de aprobación con compuerta**: Sistemas debe aprobar el REG-11 antes de poder completar el REG-07; si lo observa, vuelve a Calidad para corrección y reenvío.
* **Firmas digitales en el papel**: el REG-11 muestra al **usuario solicitante** que lo creó y la **firma de Sistemas** al aprobarlo; el REG-07 refleja las firmas de Sistemas y Calidad según el historial.
* **Stepper visual del circuito**: indicador de progreso (Solicitud → Aprob. Sistemas → REG-07 → Aprob. Calidad) que resalta la etapa actual.
* **Dashboard por rol**: tarjetas de *“Pendientes de tu acción”* según el rol (Sistemas / Calidad) con acceso directo a la lista filtrada.
* **Validaciones estrictas**: todos los campos son obligatorios al crear un REG-11, al completar un REG-07 (incluida al menos una etiqueta técnica) y al reenviar un REG-11 observado; validado en frontend y backend.
* **Trazabilidad**: cada transición de estado se registra en el historial con usuario, fecha y comentario.

> 🧰 **Utilidad de pruebas**: `scripts/clear_solicitudes.js` borra todas las solicitudes (Solicitudes / Adjuntos / Historial) **conservando los usuarios y el esquema**, para reiniciar un escenario de prueba desde cero (`node scripts/clear_solicitudes.js`).

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

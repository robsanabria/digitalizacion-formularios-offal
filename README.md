# digitalizacion-formularios-offal

Repositorio inicial para el proyecto de digitalización de formularios (REG-SIS-007).

Repositorio remoto: https://github.com/robsanabria/digitalizacion-formularios-offal

Objetivo: webapp Node.js + React que permite subir formularios/adjuntos (PDFs escaneados), extraer campos con Azure Document Intelligence, almacenar attachments en Azure Blob (`regsis-attachments`) y guardar metadatos en Azure SQL.

Estado inicial:
- Especificación técnica en `REG-SIS-007-specs.md` (en el repo local `regsis07`).
- Diagramas en `docs/diagrams/` (ER, arquitectura, tablas).

Primeros pasos recomendados:
1. Clonar este repo localmente.
2. Añadir el scaffold (backend + frontend) 
3. Crear recursos en Azure (Storage account + container `regsis-attachments`, Document Intelligence, App Service/App Registration si aplica). <- En curso
4. Configurar secretos en GitHub (AZURE_WEBAPP_PUBLISH_PROFILE, AZURE_CREDENTIALS si se usa service principal). <- En curso
5. Habilitar CI/CD (archivo `.github/workflows/ci-cd.yml` incluido como plantilla). <- En curso


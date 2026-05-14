# Walkthrough: Sistema de Digitalización de Formularios REG-SIS (v2.0)

Este documento detalla la implementación del nuevo flujo de trabajo digital para la gestión de etiquetas en **OFFAL EXP SA**, migrando de formularios genéricos a una experiencia de "Papel Digital" fiel a los registros físicos **REG-SIS-011** y **REG-SIS-007**.

---

## 1. El Concepto: "Papel Digital"
A diferencia de un sistema de carga de datos convencional, esta versión utiliza componentes React diseñados con **CSS Grid y Flexbox** para imitar exactamente la cuadrícula, tipografía y disposición de los formularios físicos.
- **Identidad Visual**: Bordes de 3px, fuentes serif técnicas, y disposición de celdas idéntica a los originales.
- **Exportación**: Implementación de `@media print` para generar PDFs limpios directamente desde el navegador.

---

## 2. El Flujo de Trabajo (Workflow)

El ciclo de vida de una etiqueta ahora sigue un camino estrictamente encadenado:

### Fase A: Solicitud (REG-SIS-011)
- **Actor**: Rol `CALIDAD`.
- **Acción**: Crea una "Nueva Solicitud".
- **Datos**: Completa datos técnicos (Tara, Pesos, Motivo, Impresoras, etc.).
- **Estado Inicial**: `REG-011-PENDIENTE`.
- **Destino**: El sistema notifica visualmente a Sistemas que hay un registro pendiente.

### Fase B: Respuesta Técnica (REG-SIS-007)
- **Actor**: Rol `SISTEMAS`.
- **Acción**: "Responder con REG-SIS-007".
- **Datos**: Sistemas visualiza el REG-011 original como referencia y completa el REG-007. 
- **Adjuntos**: Sistemas sube las fotos de las etiquetas ya modificadas/creadas directamente en el espacio de "Formato Original" del REG-007.
- **Estado Intermedio**: `REG-007-PENDIENTE-APROBACION`.

### Fase C: Aprobación Final
- **Actor**: Rol `CALIDAD`.
- **Acción**: Revisa el REG-007 generado por Sistemas.
- **Resultado**: 
    - **Aprobar**: El estado pasa a `APROBADO`. El ciclo se cierra.
    - **Rechazar**: El estado pasa a `RECHAZADO`. Se debe iniciar un nuevo ciclo.

---

## 3. Arquitectura Técnica

### Base de Datos (SQL Server)
Se unificó la tabla `Solicitudes` para contener los campos de ambos formularios, permitiendo la trazabilidad en un solo registro:
- **Campos Técnicos**: `Tara`, `PesoMinimo`, `PesoMaximo`, `PesoEstandar`, `NumCaja`, `Faja`, `CodigoExterno`.
- **Relación**: `SolicitudId` actúa como la llave única que une el REG-011 con su respuesta REG-007.

### Componentes Clave (React)
- `REG011PaperForm.jsx`: Componente visual del formulario de solicitud.
- `REG007PaperForm.jsx`: Componente visual del formulario de sistemas con zona de previsualización de imágenes.
- `DetalleSolicitud.jsx`: Orquestador que decide qué formulario mostrar y qué acciones permitir según el rol y el estado.

---

## 4. Funcionalidades de Acción
- **Previsualizar (`Eye`)**: Abre el modal de detalle para inspección visual.
- **Descargar (`Download`)**: Dispara el diálogo de impresión con estilos que fuerzan el formato A4 y ocultan la interfaz de usuario de la web, permitiendo "Guardar como PDF".

---

**Nota**: Este documento es la guía oficial de la v2.0 del sistema.

# Changelog — Control de Etiquetas (REG-SIS-011 / REG-SIS-007)

Todas las novedades relevantes del sistema, ordenadas de más nueva a más antigua.

---

## 2026-07-02

### Interfaz
- **Tema claro azul**: se adoptó la paleta del proyecto *Control de Ingreso de Proveedores* (fondo `#eceff1`, tarjetas blancas, primary `#1565c0`).
- La barra lateral ahora muestra **"Control de Etiquetas"**.
- **Widget flotante de ayuda / soporte**: botón "¿Necesitás ayuda?" que arma un ticket por correo a soporte con el usuario y la pantalla actual.

### REG-SIS-007
- La grilla de **Etiquetas Técnicas Resultantes** admite hasta **18 imágenes**: 1–9 en la página 2 y 10–18 en la página 3, con carga en ambas hojas (antes cortaba en 9 y la página 3 no permitía subir).

### Trazabilidad
- **Toda eliminación de adjunto queda registrada en el Historial** (quién, qué archivo y de qué tipo: Formato Original / Propuesto / Etiqueta resultante).

### Fechas
- Corrección del corrimiento de fecha en la **firma del solicitante** (se mostraba el día anterior por zona horaria UTC).

---

## 2026-07-01

### Circuito y aprobaciones (REG-SIS-007)
- **Aprobación parcial** de Calidad (con motivo) que devuelve el registro a Sistemas para corregir.
- **Rechazo** del REG-007: ahora exige indicar **motivo**.
- **Dos aprobaciones independientes** de Calidad: *Chequeo con formato propuesto* y *Chequeo en punto de impresión*. El registro queda **Finalizado** solo cuando ambas están aprobadas.
- Las **firmas** del REG-007 reflejan la decisión real (quién firmó, fecha y la casilla correcta: Aprobado / Parcialmente / Desaprobado), con el motivo cuando corresponde.
- **Aviso visible** del motivo de la devolución (observación del 011 / rechazo o parcial del 007) en la pantalla de gestión.
- **Formato Original** del REG-007 pasó a ser un adjunto propio de **Sistemas**, independiente del "Formato Propuesto" del REG-011 (antes se cruzaban).
- Fix: una etiqueta resultante ya no se muestra por error como "Formato Original".

### REG-SIS-011
- **Motivo del cambio**: selección **múltiple** (permite SENASA junto a otros).
- **"Solicitado por"**: campo de texto libre (sin "Calidad" por defecto).
- **"Comentarios Usuario Solicitante"** pasó a ser el título de la sección de *Cambio Solicitado*.
- **"Formato Propuesto"** con **galería de varias imágenes** (cada una eliminable).

### Fechas
- Corrección del corrimiento −1 día por UTC: al crear y al mostrar se usa la **fecha local** del navegador.

### Encabezados y formato
- **Emisión 01/07/2026**; **Revisión** en formato `XX-YY` (REG-011 → `11-26`, REG-007 → `05-26`).
- **Tipografía Times New Roman** uniforme en los formularios.

---

## Anterior (impresión / PDF)

- Se rehízo la **generación del documento imprimible**: se descartó el PDF por servidor (Puppeteer) y se adoptó la **impresión del navegador**, clonando el formulario a la raíz del documento para que funcionen los **saltos de página**.
- Cada hoja ocupa una **página Legal completa**; las imágenes se acotan para no desbordar; firmas al pie en la hoja 4.
- Se quitaron las dependencias pesadas de Puppeteer/Chromium (deploy y arranque más livianos).

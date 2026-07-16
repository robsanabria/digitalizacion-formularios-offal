const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');
const { checkRole } = require('../middlewares/roleMiddleware');

const multer = require('multer');

// ── Validación de archivos ──
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPG, PNG o PDF.'));
    },
});

// Wrapper para que los errores de multer (tamaño/tipo) devuelvan 400 limpio.
const uploadSingle = (req, res, next) => {
    upload.single('archivo')(req, res, (err) => {
        if (err) {
            const detalle = err.code === 'LIMIT_FILE_SIZE'
                ? `El archivo supera el máximo de ${MAX_FILE_SIZE_MB} MB.`
                : err.message;
            return res.status(400).json({ error: 'Archivo inválido', detalle });
        }
        next();
    });
};

// Rutas para solicitudes
router.get('/', solicitudesController.getSolicitudes);
router.get('/:id', solicitudesController.getSolicitudById);
router.post('/', checkRole(['CALIDAD', 'ADMIN']), solicitudesController.createSolicitud);
// PUT lo usan: Sistemas (completar REG-007) y Calidad (corregir/reenviar REG-11 observado).
// La autorización fina por caso se resuelve dentro del controlador.
router.put('/:id', checkRole(['CALIDAD', 'SISTEMAS', 'ADMIN']), solicitudesController.updateSolicitud);

// Transición de estados (máquina de estados con validación de rol)
router.post('/:id/transition', checkRole(['CALIDAD', 'SISTEMAS', 'ADMIN']), solicitudesController.transitionSolicitud);

// Cambiar la prioridad de la solicitud (solo Calidad/Admin). Queda en el historial.
router.post('/:id/prioridad', checkRole(['CALIDAD', 'ADMIN']), solicitudesController.cambiarPrioridad);

// Historial de cambios de una solicitud
router.get('/:id/historial', solicitudesController.getHistorial);

// Exportar PDF (Puppeteer / Chrome headless)
router.get('/:id/pdf', solicitudesController.exportPdf);

// Rutas para adjuntos
router.get('/:id/adjuntos', solicitudesController.getAdjuntosBySolicitud);
router.post('/:id/adjuntos', uploadSingle, solicitudesController.addAdjunto);
router.get('/:id/adjuntos/:adjuntoId/descargar', solicitudesController.downloadAdjunto);
router.delete('/:id/adjuntos/:adjuntoId', solicitudesController.deleteAdjunto);

module.exports = router;


const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');
const { checkRole } = require('../middlewares/roleMiddleware');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Rutas para solicitudes
router.get('/', solicitudesController.getSolicitudes);
router.get('/:id', solicitudesController.getSolicitudById);
router.post('/', checkRole(['CALIDAD', 'ADMIN']), solicitudesController.createSolicitud);
router.put('/:id', checkRole(['SISTEMAS', 'ADMIN']), solicitudesController.updateSolicitud);

// Transición de estados (máquina de estados con validación de rol)
router.post('/:id/transition', checkRole(['CALIDAD', 'SISTEMAS', 'ADMIN']), solicitudesController.transitionSolicitud);

// Historial de cambios de una solicitud
router.get('/:id/historial', solicitudesController.getHistorial);

// Rutas para adjuntos
router.get('/:id/adjuntos', solicitudesController.getAdjuntosBySolicitud);
router.post('/:id/adjuntos', upload.single('archivo'), solicitudesController.addAdjunto);
router.get('/:id/adjuntos/:adjuntoId/descargar', solicitudesController.downloadAdjunto);
router.delete('/:id/adjuntos/:adjuntoId', solicitudesController.deleteAdjunto);

module.exports = router;


const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Rutas para solicitudes
router.get('/', solicitudesController.getSolicitudes);
router.get('/:id', solicitudesController.getSolicitudById);
router.post('/', solicitudesController.createSolicitud);
router.put('/:id', solicitudesController.updateSolicitud);

// Transición de estados (máquina de estados con validación de rol)
router.post('/:id/transition', solicitudesController.transitionSolicitud);

// Historial de cambios de una solicitud
router.get('/:id/historial', solicitudesController.getHistorial);

// Rutas para adjuntos
router.get('/:id/adjuntos', solicitudesController.getAdjuntosBySolicitud);
router.post('/:id/adjuntos', upload.single('archivo'), solicitudesController.addAdjunto);
router.get('/:id/adjuntos/:adjuntoId/descargar', solicitudesController.downloadAdjunto);

module.exports = router;


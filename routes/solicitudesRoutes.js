const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');

// Rutas para solicitudes
router.get('/', solicitudesController.getSolicitudes);
router.get('/:id', solicitudesController.getSolicitudById);
router.post('/', solicitudesController.createSolicitud);
router.put('/:id', solicitudesController.updateSolicitud);

module.exports = router;

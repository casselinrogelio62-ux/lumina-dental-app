const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');

// Ruta para guardar una nueva cita (La que usa tu página principal)
router.post('/', reservasController.crearReserva);

// NUEVA RUTA: Para obtener todas las citas (La que usará el panel de admin)
router.get('/', reservasController.obtenerReservas);

module.exports = router;


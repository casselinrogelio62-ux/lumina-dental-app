const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');

router.get('/', reservasController.obtenerReservas);

router.get('/admin', reservasController.obtenerTodasLasReservas);

router.post('/', reservasController.crearReserva);

module.exports = router;
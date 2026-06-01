const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');

router.get('/', reservasController.obtenerReservas);

router.post('/', reservasController.crearReserva);

module.exports = router;

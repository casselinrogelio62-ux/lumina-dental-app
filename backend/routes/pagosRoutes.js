const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');

// Cuando alguien haga POST a esta ruta, creamos la sesión de pago
router.post('/crear-sesion', pagosController.crearSesionPago);

module.exports = router;

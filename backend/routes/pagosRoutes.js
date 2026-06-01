const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');

router.post('/crear-sesion', pagosController.crearSesionPago);

module.exports = router;

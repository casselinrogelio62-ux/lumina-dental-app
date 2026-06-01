const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const reservasRoutes = require('./routes/reservasRoutes');
const pagosRoutes = require('./routes/pagosRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ÉSTA ES LA LÍNEA CRÍTICA: Le dice a Express que sirva los estilos e imágenes
app.use(express.static(path.join(__dirname, '../frontend')));

// Tus rutas de API
app.use('/api/reservas', reservasRoutes);
app.use('/api/pagos', pagosRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor funcionando perfectamente en http://localhost:${PORT}`);
});

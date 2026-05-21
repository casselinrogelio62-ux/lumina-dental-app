// 1. IMPORTACIONES BÁSICAS
require('dotenv').config(); // Carga nuestros secretos del archivo .env
const express = require('express');
const path = require('path');
const cors = require('cors');

// 2. IMPORTAR NUESTRAS RUTAS
const reservasRoutes = require('./routes/reservasRoutes'); // Rutas de Supabase
const pagosRoutes = require('./routes/pagosRoutes');       // NUEVO: Rutas de Stripe 💳

const app = express();
const PORT = process.env.PORT || 3000; // Lee el puerto del .env

app.use(cors()); 
app.use(express.json());
// 4. SERVIR EL FRONTEND (Archivos estáticos)
app.use(express.static(path.join(__dirname, '../frontend')));

// 5. NUESTRAS RUTAS DE LA API (Las puertas de entrada)
app.use('/api/reservas', reservasRoutes);
app.use('/api/pagos', pagosRoutes); 

// Ruta principal que devuelve tu index.html limpio de Lumina Dental
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 6. ARRANCAR EL SERVIDOR
app.listen(PORT, () => {
    console.log(`✅ Servidor funcionando perfectamente en http://localhost:${PORT}`);
});

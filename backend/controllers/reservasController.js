const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Conexión a tu base de datos
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. LEER RESERVAS (Para decirle a la página qué ocultar)
exports.obtenerReservas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('fecha, hora'); 

        if (error) throw error;

        res.status(200).json({ reservas: data });
    } catch (error) {
        console.error("Error al obtener reservas:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. GUARDAR NUEVA RESERVA
exports.crearReserva = async (req, res) => {
    try {
        const { patientName, patientPhone, patientEmail, treatmentType, appointmentDate, appointmentTime, status } = req.body;

        // Doble seguridad: Verificar en el backend que nadie más acaba de tomar la cita
        const { data: existente } = await supabase
            .from('reservas')
            .select('*')
            .eq('fecha', appointmentDate)
            .eq('hora', appointmentTime);

        if (existente && existente.length > 0) {
            return res.status(400).json({ error: "Ese horario acaba de ser ocupado por otra persona." });
        }

        // Si está libre, la guardamos
        const { data, error } = await supabase
            .from('reservas')
            .insert([
                {
                    nombre: patientName,
                    telefono: patientPhone,
                    correo: patientEmail,
                    servicio: treatmentType,
                    fecha: appointmentDate,
                    hora: appointmentTime,
                    estado: status || 'confirmada'
                }
            ]);

        if (error) throw error;
        
        res.status(201).json({ mensaje: "Reserva guardada con éxito", data });
    } catch (error) {
        console.error("Error al crear reserva:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.obtenerTodasLasReservas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('*')
            .order('fecha', { ascending: false }); 

        if (error) throw error;
        res.status(200).json({ reservas: data });
    } catch (error) {
        console.error("Error al obtener reservas completas:", error);
        res.status(500).json({ error: error.message });
    }
};
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Función auxiliar para convertir "07:30 PM" a "19:30:00" para PostgreSQL
function formatearHoraParaDB(horaStr) {
    if (!horaStr) return null;
    const partes = horaStr.split(' ');
    if (partes.length !== 2) return horaStr; // Por si acaso
    
    let [horas, minutos] = partes[0].split(':');
    const modificador = partes[1];

    if (horas === '12') horas = '00';
    if (modificador === 'PM') horas = parseInt(horas, 10) + 12;
    
    return `${horas.toString().padStart(2, '0')}:${minutos}:00`;
}

// 1. LEER RESERVAS (Para ocultar botones en el frontend)
exports.obtenerReservas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('fecha, hora');

        if (error) throw error;

        // Postgres devuelve "19:30:00". Lo cortamos a "19:30" para que el frontend lo bloquee bien.
        const reservasFormateadas = data.map(reserva => ({
            fecha: reserva.fecha,
            hora: reserva.hora ? reserva.hora.substring(0, 5) : null
        }));

        res.status(200).json({ reservas: reservasFormateadas });
    } catch (error) {
        console.error("Error al obtener reservas:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. CREAR RESERVA
exports.crearReserva = async (req, res) => {
    try {
        const { patientName, patientPhone, patientEmail, treatmentType, appointmentDate, appointmentTime, status } = req.body;
        
        const horaFormateada = formatearHoraParaDB(appointmentTime);

        // Doble validación en la base de datos
        const { data: existente } = await supabase
            .from('reservas')
            .select('*')
            .eq('fecha', appointmentDate)
            .eq('hora', horaFormateada);

        if (existente && existente.length > 0) {
            return res.status(400).json({ error: "Ese horario acaba de ser ocupado por otra persona." });
        }

        // Inserción con los NOMBRES EXACTOS de tu tabla SQL
        const { data, error } = await supabase
            .from('reservas')
            .insert([
                {
                    nombre: patientName,
                    email: patientEmail,         // <-- Match exacto
                    telefono: patientPhone,
                    tratamiento: treatmentType,  // <-- Match exacto
                    fecha: appointmentDate,
                    hora: horaFormateada,        // Formato 24h
                    estado: status || 'Pendiente'
                }
            ]);

        if (error) throw error;
        
        res.status(201).json({ mensaje: "Reserva guardada con éxito", data });
    } catch (error) {
        console.error("Error al crear reserva:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. LEER TODAS LAS RESERVAS (Para el panel de Admin)
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

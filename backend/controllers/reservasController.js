const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function formatearHoraParaDB(horaStr) {
    if (!horaStr) return null;
    const partes = horaStr.split(' ');
    if (partes.length !== 2) return horaStr; 
    
    let [horas, minutos] = partes[0].split(':');
    const modificador = partes[1];

    if (horas === '12') horas = '00';
    if (modificador === 'PM') horas = parseInt(horas, 10) + 12;
    
    return `${horas.toString().padStart(2, '0')}:${minutos}:00`;
}

exports.obtenerReservas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('fecha, hora');

        if (error) throw error;

        
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

exports.crearReserva = async (req, res) => {
    try {
        const { patientName, patientPhone, patientEmail, treatmentType, appointmentDate, appointmentTime, status } = req.body;
        
        const horaFormateada = formatearHoraParaDB(appointmentTime);

       
        const { data: existente } = await supabase
            .from('reservas')
            .select('*')
            .eq('fecha', appointmentDate)
            .eq('hora', horaFormateada);

        if (existente && existente.length > 0) {
            return res.status(400).json({ error: "Ese horario acaba de ser ocupado por otra persona." });
        }

        const { data, error } = await supabase
            .from('reservas')
            .insert([
                {
                    nombre: patientName,
                    email: patientEmail,         
                    telefono: patientPhone,
                    tratamiento: treatmentType,  
                    fecha: appointmentDate,
                    hora: horaFormateada,        
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

// 1. Importamos la herramienta de Supabase
const { createClient } = require('@supabase/supabase-js');

// 2. Le pasamos nuestras llaves secretas del archivo .env
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const obtenerReservas = async (req, res) => {
    // Le pedimos a Supabase TODAS las filas de la tabla 'reservas'
    const { data, error } = await supabase.from('reservas').select('*');
    
    if (error) {
        return res.status(500).json({ error: "No se pudieron obtener las reservas." });
    }
    
    res.json({ reservas: data });
};

const crearReserva = async (req, res) => {
    const { patientName, patientEmail, patientPhone, treatmentType, appointmentDate, appointmentTime, additionalNotes } = req.body;

    if (!patientName || !patientEmail || !patientPhone || !treatmentType || !appointmentDate || !appointmentTime) {
        return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    // 3. Enviamos el "paquete" directo a nuestra tabla de Supabase en la nube
    const { data, error } = await supabase
        .from('reservas')
        .insert([
            { 
                nombre: patientName, 
                email: patientEmail, 
                telefono: patientPhone, 
                tratamiento: treatmentType, 
                fecha: appointmentDate, 
                hora: appointmentTime,
                notas: additionalNotes || ""
            }
        ])
        .select(); 

    if (error) {
        console.error("Error de Supabase:", error);
        return res.status(500).json({ error: "Error al guardar en la base de datos." });
    }

    console.log("¡Cita guardada EN LA NUBE de Supabase! ☁️🎉", data);

    res.json({ 
        mensaje: "¡Cita confirmada con éxito!",
        reservaGuardada: data 
    });
};

// ¡Esta es la parte que probablemente se borró!
module.exports = {
    obtenerReservas,
    crearReserva
};

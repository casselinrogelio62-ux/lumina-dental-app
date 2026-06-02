const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Asegúrate de tener tu clave secreta en el archivo .env

exports.crearSesionPago = async (req, res) => {
    try {
        // MAGIA AQUÍ: Detecta automáticamente si estás en localhost o en Render
        const DOMAIN = req.headers.origin || 'https://lumina-dental-app.onrender.com';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'mxn', // Puedes cambiarlo a usd si prefieres
                        product_data: {
                            name: 'Reserva de Cita - Lumina Dental Studio',
                            description: 'Valoración inicial y apartado de agenda.',
                        },
                        unit_amount: 50000, // Esto equivale a $500.00 MXN (Stripe usa centavos)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Usamos el DOMAIN dinámico para que Stripe sepa exactamente a dónde regresar
            success_url: `${DOMAIN}/?pago=exito`,
            cancel_url: `${DOMAIN}/?pago=cancelado`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Error al crear sesión de Stripe:", error);
        res.status(500).json({ error: error.message });
    }
};

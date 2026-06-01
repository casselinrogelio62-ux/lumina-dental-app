const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const crearSesionPago = async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'mxn',
                        product_data: {
                            name: 'Valoración Inicial - Lumina Dental',
                            description: 'Pago por reserva de cita odontológica',
                        },
                        unit_amount: 50000, 
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:3000/?pago=exito',
            cancel_url: 'http://localhost:3000/?pago=cancelado',
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error("Error en Stripe:", error);
        res.status(500).json({ error: "Error al crear la sesión de pago." });
    }
};

module.exports = { crearSesionPago };

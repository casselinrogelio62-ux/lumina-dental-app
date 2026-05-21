// Importamos Stripe y le pasamos nuestra llave secreta
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const crearSesionPago = async (req, res) => {
    try {
        // Le pedimos a Stripe que nos cree una "pantalla de cobro"
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'mxn', // Moneda: Pesos Mexicanos
                        product_data: {
                            name: 'Valoración Inicial - Lumina Dental',
                            description: 'Pago por reserva de cita odontológica',
                        },
                        // Importante: Stripe maneja los precios en centavos. 
                        // 50000 centavos = 500.00 MXN
                        unit_amount: 50000, 
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // ¿A dónde lo mandamos si paga con éxito o si cancela?
            success_url: 'http://localhost:3000/?pago=exito',
            cancel_url: 'http://localhost:3000/?pago=cancelado',
        });

        // Le enviamos al frontend la URL de la pantalla de cobro
        res.json({ url: session.url });
    } catch (error) {
        console.error("Error en Stripe:", error);
        res.status(500).json({ error: "Error al crear la sesión de pago." });
    }
};

module.exports = { crearSesionPago };

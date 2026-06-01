document.addEventListener('DOMContentLoaded', () => {
    initBookingSystem();
    checkPaymentStatus();
});

function initBookingSystem() {
    const btnNext1 = document.getElementById('btn-next-1');
    const btnPrev1 = document.getElementById('btn-prev-1');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const ind1 = document.getElementById('step-indicator-1');
    const ind2 = document.getElementById('step-indicator-2');
    const dateInput = document.getElementById('appointmentDate');
    const timeContainer = document.getElementById('time-slots-container');
    const selectedTimeInput = document.getElementById('selectedTime');
    const form = document.getElementById('appointment-form');

    // Configurar fecha mínima
    const today = new Date();
    dateInput.min = today.toISOString().split('T')[0];

    // Navegación
    btnNext1.addEventListener('click', () => {
        if(document.getElementById('fullName').value && document.getElementById('phone').value) {
            step1.classList.remove('active'); ind1.classList.remove('active');
            step2.classList.add('active'); ind2.classList.add('active');
        } else {
            showToast('Completa los campos obligatorios', 'error');
        }
    });

    btnPrev1.addEventListener('click', () => {
        step2.classList.remove('active'); ind2.classList.remove('active');
        step1.classList.add('active'); ind1.classList.add('active');
    });

    // Generar horarios
    dateInput.addEventListener('change', () => {
        timeContainer.innerHTML = '';
        selectedTimeInput.value = '';
        for (let hour = 9; hour <= 18; hour++) {
            ['00', '30'].forEach(min => {
                const timeString = `${hour > 12 ? hour - 12 : hour}:${min} ${hour >= 12 ? 'PM' : 'AM'}`;
                const slot = document.createElement('div');
                slot.className = 'time-slot';
                slot.textContent = timeString;
                slot.onclick = () => {
                    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                    slot.classList.add('selected');
                    selectedTimeInput.value = timeString;
                };
                timeContainer.appendChild(slot);
            });
        }
    });

    // Enviar formulario (Conexión Supabase + Stripe)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedTimeInput.value) return showToast('Selecciona un horario', 'error');

        const btnSubmit = document.getElementById('btn-submit');
        btnSubmit.textContent = 'Procesando...';
        btnSubmit.disabled = true;

        const data = {
            patientName: document.getElementById('fullName').value,
            patientPhone: document.getElementById('phone').value,
            patientEmail: document.getElementById('email').value,
            treatmentType: document.getElementById('treatment').value,
            appointmentDate: dateInput.value,
            appointmentTime: selectedTimeInput.value
        };

        try {
            const res = await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Error al guardar');

            const pagoRes = await fetch('/api/pagos/crear-sesion', { method: 'POST' });
            const pagoData = await pagoRes.json();
            
            if (pagoData.url) {
                window.location.href = pagoData.url;
            } else {
                throw new Error('Error en pasarela');
            }
        } catch (error) {
            showToast(error.message, 'error');
            btnSubmit.textContent = 'Confirmar y Pagar';
            btnSubmit.disabled = false;
        }
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    document.getElementById('toast-message').textContent = message;
    toast.className = `active ${type === 'error' ? 'error' : ''}`;
    setTimeout(() => toast.classList.remove('active'), 3000);
}

function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pago') === 'exito') {
        document.getElementById('step-1').classList.remove('active');
        document.getElementById('step-3').classList.add('active');
        showToast('¡Pago exitoso!', 'success');
    }
}

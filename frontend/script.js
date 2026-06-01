/**
 * Lumina Dental Studio - Arquitectura Frontend v3.0
 * Integra la lógica estricta de validación, ocultamiento de horarios y errores reales.
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initSmoothNavigation();
    initBookingSystem();
    checkPaymentStatus();
});

// 1. Navegación SPA y Scroll
function initSmoothNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const y = targetElement.getBoundingClientRect().top + window.pageYOffset - 80;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }
        });
    });
}

// 2. Animaciones de aparición
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(reveal => observer.observe(reveal));
}

// 3. SISTEMA DE RESERVAS CRÍTICO (Bloqueo y Ocultamiento)
function initBookingSystem() {
    const dateInput = document.getElementById('appointmentDate');
    const timePanel = document.getElementById('time-panel');
    const timeContainer = document.getElementById('time-slots-container');
    const selectedTimeInput = document.getElementById('selectedTime');
    const form = document.getElementById('appointment-form');
    const loadingSlots = document.getElementById('loading-slots');
    const dateHelper = document.getElementById('date-helper');

    // Deshabilitar fechas pasadas
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;

    dateInput.addEventListener('change', async (e) => {
        const selectedDateStr = e.target.value;
        if (!selectedDateStr) return;

        selectedTimeInput.value = '';
        timeContainer.innerHTML = '';
        timePanel.style.display = 'block';
        loadingSlots.style.display = 'block';
        dateHelper.textContent = "Buscando disponibilidad...";
        dateHelper.className = "text-xs mt-1 text-primary";

        try {
            const response = await fetch('/api/reservas');
            const data = await response.json();
            
            const horariosOcupados = data.reservas
                .filter(reserva => reserva.fecha === selectedDateStr)
                .map(reserva => reserva.hora);

            generateStrictTimeSlots(selectedDateStr, horariosOcupados);
            
            dateHelper.textContent = "Disponibilidad actualizada.";
            dateHelper.className = "text-xs mt-1 text-success";
        } catch (error) {
            console.error("Error consultando DB:", error);
            dateHelper.textContent = "Error al conectar. Intenta recargar la página.";
            dateHelper.className = "text-xs mt-1 text-error";
        } finally {
            loadingSlots.style.display = 'none';
        }
    });

    function generateStrictTimeSlots(dateString, ocupadosDB) {
        const [year, month, day] = dateString.split('-');
        const selectedDate = new Date(year, month - 1, day);
        const dayOfWeek = selectedDate.getDay(); 

        // Regla 1: Domingos cerrado
        if (dayOfWeek === 0) {
            timeContainer.innerHTML = '<p class="placeholder-text" style="grid-column: 1/-1;">El consultorio permanece cerrado los domingos.</p>';
            return;
        }

        const openHour = 9; 
        const closeHour = (dayOfWeek === 6) ? 15 : 21; 

        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        let slotsGenerados = 0;

        for (let hour = openHour; hour < closeHour; hour++) {
            ['00', '30'].forEach(min => {
                let displayHour = hour > 12 ? hour - 12 : hour;
                if (displayHour === 0) displayHour = 12; 
                let amPm = hour >= 12 ? 'PM' : 'AM';
                const timeString = `${displayHour < 10 ? '0'+displayHour : displayHour}:${min} ${amPm}`;
                
                let isPast = isToday && (hour < currentHour || (hour === currentHour && parseInt(min) <= currentMinute));
                
                const timeStringForDB = `${hour < 10 ? '0'+hour : hour}:${min}`;
                let isBooked = ocupadosDB.includes(timeStringForDB) || ocupadosDB.includes(timeString);

                // LÓGICA DE OCULTAMIENTO: Si ya pasó o está reservado, NO dibujamos el botón
                if (isPast || isBooked) {
                    return; 
                }

                // Si está libre, lo creamos
                const slotDiv = document.createElement('div');
                slotDiv.textContent = timeString;
                slotDiv.className = 'time-slot available';
                
                slotDiv.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
                    slotDiv.classList.add('selected');
                    selectedTimeInput.value = timeString; 
                });

                timeContainer.appendChild(slotDiv);
                slotsGenerados++;
            });
        }

        if (slotsGenerados === 0) {
            timeContainer.innerHTML = '<p class="placeholder-text" style="grid-column: 1/-1;">Agenda completamente llena para este día.</p>';
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedTimeInput.value) {
            showToast('Por favor, selecciona un horario disponible.', 'error');
            return;
        }

        const btnSubmit = document.getElementById('btn-submit');
        const originalText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="ph ph-spinner-gap spin"></i> Procesando reserva...';
        btnSubmit.disabled = true;

        const formData = {
            patientName: document.getElementById('fullName').value,
            patientPhone: document.getElementById('phone').value,
            patientEmail: document.getElementById('email').value,
            treatmentType: document.getElementById('treatment').value,
            appointmentDate: dateInput.value,
            appointmentTime: selectedTimeInput.value,
            status: "confirmada"
        };

        try {
            const reservaRes = await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            // NUEVA LÓGICA: Leer el error real del backend (Supabase)
            if (!reservaRes.ok) {
                const errorData = await reservaRes.json();
                throw new Error(errorData.error || 'Error en la base de datos Supabase');
            }

            const pagoRes = await fetch('/api/pagos/crear-sesion', { method: 'POST' });
            const pagoData = await pagoRes.json();

            if (pagoData.url) {
                window.location.href = pagoData.url;
            } else {
                throw new Error('Error al conectar con la pasarela de pago.');
            }

        } catch (error) {
            // Aquí mostrará el error exacto en la alerta roja (ej. Could not find column...)
            showToast(error.message, 'error');
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
            
            const event = new Event('change');
            dateInput.dispatchEvent(event);
        }
    });
}

// 4. Sistema de Notificaciones Globales
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    const icon = toast.querySelector('i');
    
    document.getElementById('toast-message').textContent = message;
    
    if (type === 'success') {
        toast.className = 'success active';
        icon.className = 'ph-fill ph-check-circle toast-icon';
    } else {
        toast.className = 'error active';
        icon.className = 'ph-fill ph-warning toast-icon';
    }
    
    setTimeout(() => toast.classList.remove('active'), 4500);
}

// 5. Feedback de Stripe
function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pago') === 'exito') {
        showToast('¡Pago procesado exitosamente! Tu cita ha sido agendada.', 'success');
        window.history.replaceState(null, '', window.location.pathname);
    } else if (urlParams.get('pago') === 'cancelado') {
        showToast('El pago no se completó. La cita no fue agendada.', 'error');
        window.history.replaceState(null, '', window.location.pathname);
    }
}

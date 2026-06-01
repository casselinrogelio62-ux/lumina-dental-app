/**
 * Lumina Dental Studio - Arquitectura Frontend v3.0
 * Integra la lógica estricta de validación de agenda conectada a Supabase
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
                    // Ajuste por la altura del navbar sticky (aprox 80px)
                    const y = targetElement.getBoundingClientRect().top + window.pageYOffset - 80;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }
        });
    });
}

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

// 2. SISTEMA DE RESERVAS CRÍTICO (Bloqueo de Horarios)
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

    // Escuchador cuando el usuario selecciona un día
    dateInput.addEventListener('change', async (e) => {
        const selectedDateStr = e.target.value;
        if (!selectedDateStr) return;

        // Resetear selecciones
        selectedTimeInput.value = '';
        timeContainer.innerHTML = '';
        timePanel.style.display = 'block';
        loadingSlots.style.display = 'block';
        dateHelper.textContent = "Buscando disponibilidad...";
        dateHelper.className = "text-xs mt-1 text-primary";

        try {
            // PASO CRÍTICO 1: Consultar a tu base de datos actual (Supabase vía Node)
            const response = await fetch('/api/reservas');
            const data = await response.json();
            
            // Extraer solo los horarios ocupados para el día seleccionado
            const horariosOcupados = data.reservas
                .filter(reserva => reserva.fecha === selectedDateStr)
                .map(reserva => reserva.hora);

            // Generar la cuadrícula aplicando las reglas de negocio
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

    // Función principal de lógica de negocio (Reglas del consultorio)
    function generateStrictTimeSlots(dateString, ocupadosDB) {
        const [year, month, day] = dateString.split('-');
        const selectedDate = new Date(year, month - 1, day);
        const dayOfWeek = selectedDate.getDay(); // 0 = Domingo, 1 = Lunes, 6 = Sábado

        // Regla 1: Domingos cerrado
        if (dayOfWeek === 0) {
            timeContainer.innerHTML = '<p class="placeholder-text" style="grid-column: 1/-1;">El consultorio permanece cerrado los domingos.</p>';
            return;
        }

        // Regla 2: Definir apertura y cierre según el día
        const openHour = 9; // 09:00 AM
        const closeHour = (dayOfWeek === 6) ? 15 : 21; // 3:00 PM los Sábados, 9:00 PM Lun-Vie

        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        let slotsGenerados = 0;

        // Generar intervalos de 1 hora (o 30 mins) para la agenda
        for (let hour = openHour; hour < closeHour; hour++) {
            ['00', '30'].forEach(min => {
                let displayHour = hour > 12 ? hour - 12 : hour;
                if (displayHour === 0) displayHour = 12; // Formato 12 hrs
                let amPm = hour >= 12 ? 'PM' : 'AM';
                const timeString = `${displayHour < 10 ? '0'+displayHour : displayHour}:${min} ${amPm}`;
                
                const slotDiv = document.createElement('div');
                slotDiv.textContent = timeString;

                // VALIDACIONES DE BLOQUEO
                let isPast = isToday && (hour < currentHour || (hour === currentHour && parseInt(min) <= currentMinute));
                
                // Formateamos para igualar como guarda tu base de datos (Asumiendo formato "09:00")
                const timeStringForDB = `${hour < 10 ? '0'+hour : hour}:${min}`;
                let isBooked = ocupadosDB.includes(timeStringForDB) || ocupadosDB.includes(timeString);

                if (isPast) {
                    // Hora ya pasó hoy
                    slotDiv.className = 'time-slot occupied';
                    slotDiv.title = 'Horario pasado';
                } else if (isBooked) {
                    // Hora ocupada en Supabase
                    slotDiv.className = 'time-slot occupied';
                    slotDiv.title = 'Horario no disponible';
                } else {
                    // Hora libre
                    slotDiv.className = 'time-slot available';
                    slotDiv.addEventListener('click', () => {
                        document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
                        slotDiv.classList.add('selected');
                        
                        // Guardamos el string exacto para mandarlo al servidor
                        selectedTimeInput.value = timeString; 
                    });
                }

                timeContainer.appendChild(slotDiv);
                slotsGenerados++;
            });
        }

        if (slotsGenerados === 0) {
            timeContainer.innerHTML = '<p class="placeholder-text" style="grid-column: 1/-1;">No hay horarios disponibles.</p>';
        }
    }

    // Procesamiento de Formulario e Integración con Stripe
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

        // Estructura lista para tu tabla actual de Supabase
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
            // 1. Guardar en Supabase (Esto bloqueará el horario para los demás)
            const reservaRes = await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!reservaRes.ok) throw new Error('El horario acaba de ser ocupado por alguien más.');

            // 2. Conectar con Stripe
            const pagoRes = await fetch('/api/pagos/crear-sesion', { method: 'POST' });
            const pagoData = await pagoRes.json();

            if (pagoData.url) {
                window.location.href = pagoData.url; // Redirigir al cobro seguro
            } else {
                throw new Error('Error al conectar con la pasarela de pago.');
            }

        } catch (error) {
            showToast(error.message, 'error');
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
            
            // Recargar disponibilidad por si hubo choque de agenda
            const event = new Event('change');
            dateInput.dispatchEvent(event);
        }
    });
}

// 3. Sistema de Notificaciones Globales
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

// Feedback de Stripe
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

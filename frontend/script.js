document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initScrollReveal();
    initAccordion();
    initBookingSystem();
    checkPaymentStatus(); 
});

/* =========================================
   1. NAVBAR STICKY & MOBILE MENU
========================================= */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    
    menuBtn.addEventListener('click', () => {
        const isHidden = window.getComputedStyle(navLinks).display === 'none';
        navLinks.style.display = isHidden ? 'flex' : 'none';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'white';
        navLinks.style.padding = '20px';
        navLinks.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
    });
}

/* =========================================
   2. SCROLL REVEAL ANIMATIONS
========================================= */
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');
            observer.unobserve(entry.target); 
        });
    }, revealOptions);

    reveals.forEach(reveal => revealOnScroll.observe(reveal));
}

/* =========================================
   3. FAQ ACCORDION
========================================= */
function initAccordion() {
    const accordions = document.querySelectorAll('.accordion-item');

    accordions.forEach(item => {
        const header = item.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            accordions.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.accordion-content').style.maxHeight = null;
                }
            });

            item.classList.toggle('active');
            const content = item.querySelector('.accordion-content');
            if (item.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
        });
    });
}

/* =========================================
   4. SISTEMA DE RESERVACIÓN DE CITAS (FULL-STACK)
========================================= */
function initBookingSystem() {
    const btnNext1 = document.getElementById('btn-next-1');
    const btnPrev1 = document.getElementById('btn-prev-1');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const form = document.getElementById('appointment-form');
    
    const ind1 = document.getElementById('step-indicator-1');
    const ind2 = document.getElementById('step-indicator-2');
    const ind3 = document.getElementById('step-indicator-3');

    const dateInput = document.getElementById('appointmentDate');
    const timeContainer = document.getElementById('time-slots-container');
    const selectedTimeInput = document.getElementById('selectedTime');
    const timeError = document.getElementById('time-error');

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;

    // --- Navegación de Pasos ---
    btnNext1.addEventListener('click', () => {
        if (validateStep1()) {
            step1.classList.remove('active');
            step2.classList.add('active');
            ind1.classList.remove('active');
            ind2.classList.add('active');
        }
    });

    btnPrev1.addEventListener('click', () => {
        step2.classList.remove('active');
        step1.classList.add('active');
        ind2.classList.remove('active');
        ind1.classList.add('active');
    });

    // --- Generación Dinámica de Horarios ---
    dateInput.addEventListener('change', (e) => {
        generateTimeSlots(e.target.value);
        selectedTimeInput.value = ''; 
        timeError.style.display = 'none';
    });

    function generateTimeSlots(selectedDateString) {
        timeContainer.innerHTML = ''; 
        
        if (!selectedDateString) {
            timeContainer.innerHTML = '<p class="placeholder-text">Selecciona una fecha válida.</p>';
            return;
        }

        const [year, month, day] = selectedDateString.split('-');
        const selectedDate = new Date(year, month - 1, day);
        
        const now = new Date();
        const isToday = selectedDate.toDateString() === now.toDateString();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        let slotsGenerados = 0;

        for (let hour = 9; hour < 24; hour++) {
            for (let min = 0; min < 60; min += 30) {
                if (hour === 24 && min > 0) continue; 

                let displayHour = hour % 12 || 12; 
                let amPm = hour < 12 || hour === 24 ? 'AM' : 'PM';
                let displayMin = min === 0 ? '00' : '30';
                
                if (hour === 24) { displayHour = 12; amPm = 'AM'; }

                const timeString = `${displayHour}:${displayMin} ${amPm}`;
                const slotDiv = document.createElement('div');
                slotDiv.className = 'time-slot available';
                slotDiv.textContent = timeString;

                let isPast = false;
                if (isToday) {
                    if (hour < currentHour || (hour === currentHour && min <= currentMinute)) {
                        isPast = true;
                    }
                }

                const isRandomlyOccupied = Math.random() < 0.25; 

                if (isPast) {
                    slotDiv.className = 'time-slot disabled';
                    slotDiv.title = 'Horario pasado';
                } else if (isRandomlyOccupied) {
                    slotDiv.className = 'time-slot occupied';
                    slotDiv.title = 'Horario no disponible';
                } else {
                    slotDiv.addEventListener('click', () => {
                        document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
                        slotDiv.classList.add('selected');
                        selectedTimeInput.value = timeString;
                        timeError.style.display = 'none';
                    });
                }

                timeContainer.appendChild(slotDiv);
                slotsGenerados++;
            }
        }

        if (slotsGenerados === 0) {
            timeContainer.innerHTML = '<p class="placeholder-text">No hay horarios disponibles para esta fecha.</p>';
        }
    }

    // =======================================================
    // --- INTEGRACIÓN BACKEND: SUBMIT FINAL (Paso 2) ---
    // =======================================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!selectedTimeInput.value) {
            timeError.style.display = 'block';
            return;
        }

        const btnSubmit = document.getElementById('btn-submit');
        const originalText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="ph ph-spinner-gap" style="animation: spin 1s linear infinite; margin-right: 5px;"></i> Conectando banco...';
        btnSubmit.disabled = true;

        // Formateamos los datos exactamente como los pide tu backend en reservasController.js
        const datosDelPaciente = {
            patientName: document.getElementById('fullName').value,
            patientPhone: document.getElementById('phone').value,
            patientEmail: document.getElementById('email').value,
            treatmentType: document.getElementById('treatment').value,
            appointmentDate: document.getElementById('appointmentDate').value,
            appointmentTime: selectedTimeInput.value,
            additionalNotes: "" // Dejamos notas vacías porque el nuevo diseño no las tiene
        };

        try {
            // PASO A: Guardar cita en Supabase
            const respuestaReserva = await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosDelPaciente)
            });

            const resultadoReserva = await respuestaReserva.json();

            if (!respuestaReserva.ok) {
                showToast('Problema al guardar tu cita: ' + (resultadoReserva.error || ''), 'error');
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
                return; 
            }

            // PASO B: Si la cita se guardó, pedir a Stripe la pasarela de pago
            const respuestaPago = await fetch('/api/pagos/crear-sesion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const resultadoPago = await respuestaPago.json();

            if (respuestaPago.ok && resultadoPago.url) {
                // REDIRECCIÓN A STRIPE
                window.location.href = resultadoPago.url;
            } else {
                showToast('Error al generar el link de pago.', 'error');
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
            }

        } catch (error) {
            console.error("Error de conexión:", error);
            showToast('Ocurrió un error de red. Intenta nuevamente.', 'error');
            btnSubmit.innerHTML = originalText;
            btnSubmit.disabled = false;
        }
    });

    // Validaciones del paso 1
    function validateStep1() {
        let isValid = true;
        const inputs = [
            document.getElementById('fullName'),
            document.getElementById('phone'),
            document.getElementById('email'),
            document.getElementById('treatment')
        ];

        inputs.forEach(input => {
            const group = input.parentElement;
            if (!input.checkValidity()) {
                group.classList.add('invalid');
                isValid = false;
            } else {
                group.classList.remove('invalid');
            }
            input.addEventListener('input', () => {
                if (input.checkValidity()) {
                    group.classList.remove('invalid');
                }
            });
        });

        return isValid;
    }
}

/* =========================================
   5. NOTIFICACIONES & RETORNO DE STRIPE
========================================= */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    const toastMsg = document.getElementById('toast-message');
    const icon = toast.querySelector('i');
    
    toastMsg.textContent = message;
    
    if (type === 'success') {
        toast.className = 'success active';
        icon.className = 'ph-fill ph-check-circle toast-icon';
    } else {
        toast.className = 'error active';
        icon.className = 'ph-fill ph-warning toast-icon';
    }
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 4000);
}

// Lógica de Retorno cuando el usuario vuelve de Stripe
function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const pagoStatus = urlParams.get('pago');

    if (pagoStatus === 'exito') {
        // Navegamos directamente al Paso 3 visualmente
        document.getElementById('step-1').classList.remove('active');
        document.getElementById('step-2').classList.remove('active');
        document.getElementById('step-3').classList.add('active');

        document.getElementById('step-indicator-1').classList.remove('active');
        document.getElementById('step-indicator-2').classList.remove('active');
        document.getElementById('step-indicator-3').classList.add('active');
        
        showToast('¡Pago completado! Tu cita está confirmada.', 'success');
        
        // Hacemos scroll suave hasta la sección de reserva
        setTimeout(() => { document.getElementById('reserva').scrollIntoView(); }, 500);

        // Limpiamos la URL
        window.history.replaceState(null, '', window.location.pathname);
    } else if (pagoStatus === 'cancelado') {
        showToast('El pago no se completó. Intenta de nuevo.', 'error');
        setTimeout(() => { document.getElementById('reserva').scrollIntoView(); }, 500);
        window.history.replaceState(null, '', window.location.pathname);
    }
}
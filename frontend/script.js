/**
 * Arquitectura Frontend: Lumina Dental (Optimización CRO & UX)
 * PRECAUCIÓN: Lógica de negocio (Líneas 95 en adelante) INTACTA.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización de Iconografía
    lucide.createIcons();

    // 2. Manejo de Estado UI: Loader Premium
    const removeLoader = () => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 400);
        }
    };
    window.addEventListener('load', removeLoader);

    // 3. Sistema de Enrutamiento (SPA) Conservado
    const setupRouter = () => {
        const triggers = document.querySelectorAll('[data-target]');
        const sections = document.querySelectorAll('.page-section');
        const navBtns = document.querySelectorAll('.nav-btn');

        const navigateTo = (targetId) => {
            sections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');

            navBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.target === targetId);
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        triggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const target = trigger.dataset.target;
                if(target) navigateTo(target);
            });
        });
    };

    // 4. Interacciones UX / UI Premium
    const setupUIInteractions = () => {
        
        // Header Sticky (CRO: Mantiene la navegación siempre disponible)
        const header = document.getElementById('header-nav');
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 10);
        }, { passive: true });

        // Menú Móvil con Accesibilidad (ARIA)
        const mobileBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        const navButtons = document.querySelectorAll('.nav-btn');

        if (mobileBtn && navLinks) {
            mobileBtn.addEventListener('click', () => {
                const isOpen = navLinks.classList.contains('menu-open');
                navLinks.classList.toggle('menu-open');
                mobileBtn.setAttribute('aria-expanded', !isOpen);
            });

            navButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    navLinks.classList.remove('menu-open');
                    mobileBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }
        
        // Scroll Animations Mejorado (Intersection Observer - Mejor SEO/Performance)
        const reveals = document.querySelectorAll('.reveal');
        const revealOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
        
        const revealOnScroll = new IntersectionObserver(function(entries, observer) {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Solo anima una vez para mejor performance
            });
        }, revealOptions);

        reveals.forEach(reveal => revealOnScroll.observe(reveal));

        // Año Dinámico Footer
        const yearSpan = document.getElementById('currentYear');
        if(yearSpan) yearSpan.textContent = new Date().getFullYear();
    };

    // =========================================================
    // 5. MANEJO DE FORMULARIO: SUPABASE + STRIPE (INTACTO)
    // =========================================================
    const setupForm = () => {
        const form = document.getElementById('bookingForm');
        if (!form) return;

        const validateField = (input) => {
            let isValid = true;
            if (input.required && !input.value.trim()) {
                isValid = false;
            } else if (input.type === 'email') {
                const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = regex.test(input.value);
            } else if (input.type === 'tel') {
                const regex = /^\+?[\d\s-]{8,15}$/;
                isValid = regex.test(input.value);
            }

            if (!isValid) {
                input.classList.add('invalid');
                input.setAttribute('aria-invalid', 'true');
            } else {
                input.classList.remove('invalid');
                input.setAttribute('aria-invalid', 'false');
            }
            return isValid;
        };

        form.querySelectorAll('.form-control[required]').forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => {
                if (input.classList.contains('invalid')) validateField(input);
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            let formIsValid = true;

            form.querySelectorAll('.form-control[required]').forEach(input => {
                if (!validateField(input)) formIsValid = false;
            });

            if (!formIsValid) {
                showToast('Por favor, revisa los campos marcados en rojo.', 'error');
                return;
            }

            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            
            // UX: Feedback de conexión segura
            submitBtn.innerHTML = '<span style="display:inline-block; width:18px; height:18px; border:2px solid white; border-top-color:transparent; border-radius:50%; animation:spin 1s linear infinite; vertical-align:middle; margin-right:8px;"></span> Conectando pasarela...';
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const datosDelPaciente = Object.fromEntries(formData.entries());

            try {
                // PASO A: Guardar en Supabase
                const respuestaReserva = await fetch('/api/reservas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosDelPaciente)
                });

                const resultadoReserva = await respuestaReserva.json();

                if (!respuestaReserva.ok) {
                    showToast('Hubo un problema al guardar tu cita: ' + (resultadoReserva.error || ''), 'error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    return; 
                }

                // PASO B: Conectar con Stripe
                const respuestaPago = await fetch('/api/pagos/crear-sesion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const resultadoPago = await respuestaPago.json();

                if (respuestaPago.ok && resultadoPago.url) {
                    // Redirección exitosa
                    window.location.href = resultadoPago.url;
                } else {
                    showToast('Error al generar el link de pago seguro.', 'error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }

            } catch (error) {
                console.error("Error de red:", error);
                showToast('Problema de conexión. Verifica tu internet.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    };

    // 6. Sistema de Notificaciones (Toasts UX Premium)
    const showToast = (message, type = 'success') => {
        const toast = document.getElementById('toast-notification');
        const toastMsg = document.getElementById('toast-message');
        const icon = toast.querySelector('i');
        
        toastMsg.textContent = message;
        
        if (type === 'success') {
            toast.classList.add('success');
            icon.setAttribute('data-lucide', 'check-circle');
            icon.style.color = 'var(--success)';
        } else {
            toast.classList.remove('success');
            icon.setAttribute('data-lucide', 'alert-triangle');
            icon.style.color = 'var(--error)';
        }
        
        lucide.createIcons();
        toast.classList.add('active');

        setTimeout(() => toast.classList.remove('active'), 4500);
    };

    // 7. Manejo de Respuesta de Stripe (INTACTO)
    const checkPaymentStatus = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const pagoStatus = urlParams.get('pago');

        if (pagoStatus === 'exito') {
            showToast('¡Pago exitoso! Tu valoración está confirmada.', 'success');
            document.querySelector('[data-target="inicio"]').click();
            window.history.replaceState(null, '', window.location.pathname);
        } else if (pagoStatus === 'cancelado') {
            showToast('El pago fue cancelado. Tu cita no fue confirmada.', 'error');
            document.querySelector('[data-target="reservar"]').click();
            window.history.replaceState(null, '', window.location.pathname);
        }
    };

    // Arranque
    setupRouter();
    setupUIInteractions();
    setupForm();
    checkPaymentStatus();
});

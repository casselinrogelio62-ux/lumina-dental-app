// Reemplaza toda esta función en tu script.js
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
                
                // Buscar si la hora exacta está en la base de datos
                const timeStringForDB = `${hour < 10 ? '0'+hour : hour}:${min}`;
                let isBooked = ocupadosDB.includes(timeStringForDB) || ocupadosDB.includes(timeString);

                // LÓGICA DE OCULTAMIENTO: Si ya pasó o ya está reservado, lo saltamos y NO lo mostramos
                if (isPast || isBooked) {
                    return; // Esto detiene la creación de este botón específico
                }

                // Si sobrevive a los filtros, es porque está 100% libre, entonces lo creamos
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
    
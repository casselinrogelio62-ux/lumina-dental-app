document.addEventListener('DOMContentLoaded', cargarAgenda);

async function cargarAgenda() {
    const tbody = document.getElementById('tabla-reservas');

    try {
        const respuesta = await fetch('/api/reservas/admin');
        const data = await respuesta.json();

        if (data.reservas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay citas agendadas aún.</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        data.reservas.forEach(reserva => {
            const tr = document.createElement('tr');
            
            const [year, month, day] = reserva.fecha.split('-');
            const fechaFormateada = `${day}/${month}/${year}`;
            
            // Cortamos los segundos de la hora para que se vea "19:30" en vez de "19:30:00"
            const horaAmigable = reserva.hora ? reserva.hora.substring(0, 5) : 'N/A';

            tr.innerHTML = `
                <td style="font-weight: 600;">${fechaFormateada}</td>
                <td style="color: var(--primary); font-weight: 600;">${horaAmigable}</td>
                <td>${reserva.nombre}</td>
                <td>
                    ${reserva.telefono}<br>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${reserva.email}</span>
                </td>
                <td style="text-transform: capitalize;">${reserva.tratamiento}</td>
                <td><span class="status-badge">${reserva.estado}</span></td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error al cargar la agenda:", error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error al conectar con la base de datos.</td></tr>';
    }
}


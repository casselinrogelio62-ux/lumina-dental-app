document.addEventListener('DOMContentLoaded', obtenerCitas);

async function obtenerCitas() {
    const tabla = document.getElementById('tabla-citas');

    try {
        const respuesta = await fetch('/api/reservas');
        const datos = await respuesta.json();

        if (datos.reservas && datos.reservas.length > 0) {
            tabla.innerHTML = '';

            const citasRecientes = datos.reservas.reverse();

            citasRecientes.forEach(cita => {
                const fila = document.createElement('tr');
                
                const fechaFormateada = new Date(cita.fecha).toLocaleDateString('es-MX', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });

                fila.innerHTML = `
                    <td>
                        <strong>${cita.nombre}</strong><br>
                        <small style="color: #64748b;">ID: ${cita.id}</small>
                    </td>
                    <td>
                        <div><i data-lucide="mail" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${cita.email}</div>
                        <div><i data-lucide="phone" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${cita.telefono}</div>
                    </td>
                    <td><span style="text-transform: capitalize;">${cita.tratamiento}</span></td>
                    <td>
                        <div style="font-weight: 600;">${fechaFormateada}</div>
                        <div style="color: #64748b;">${cita.hora} hrs</div>
                    </td>
                    <td><span class="badge">${cita.estado || 'Confirmada'}</span></td>
                `;
                tabla.appendChild(fila);
            });
            
            lucide.createIcons();
            
        } else {
            tabla.innerHTML = '<tr><td colspan="5" class="empty-state">No hay citas registradas en la base de datos.</td></tr>';
        }
    } catch (error) {
        console.error("Error al cargar citas:", error);
        tabla.innerHTML = '<tr><td colspan="5" class="empty-state" style="color: red;">Error al conectar con la base de datos.</td></tr>';
    }
}

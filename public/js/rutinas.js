// Módulo de Gestión de Rutinas y Asignación de Ejercicios

let rutinasData = [];

async function cargarRutinas() {
  const res = await Auth.fetchApi('/rutinas');
  if (res.ok) {
    rutinasData = res.rutinas;
    renderizarRutinas(rutinasData);
  }
}

function renderizarRutinas(lista) {
  const tbody = document.getElementById('tableRutinas');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay rutinas asignadas.</td></tr>';
    return;
  }

  lista.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${r.nombre_rutina}</strong></td>
      <td>${r.cliente_nombre || 'Cliente'}</td>
      <td>${r.entrenador_nombre || 'Entrenador'}</td>
      <td>${r.nivel}</td>
      <td><span class="badge badge-${r.estado}">${r.estado}</span></td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="verDetalleRutina(${r.id_rutina})">💪 Ejercicios</button>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalRutina(${r.id_rutina})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarRutina(${r.id_rutina})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function abrirModalRutina(id = null) {
  const rutina = id ? rutinasData.find(r => r.id_rutina === id) : null;
  const esEdicion = !!rutina;

  const [resClientes, resEntrenadores] = await Promise.all([
    Auth.fetchApi('/clientes'),
    Auth.fetchApi('/entrenadores')
  ]);

  const clientes = resClientes.ok ? resClientes.clientes : [];
  const entrenadores = resEntrenadores.ok ? resEntrenadores.entrenadores : [];

  const optClientes = clientes.map(c => 
    `<option value="${c.id_cliente}" ${rutina && rutina.id_cliente === c.id_cliente ? 'selected' : ''}>${c.nombre} ${c.apellido}</option>`
  ).join('');

  const user = Auth.getUser();
  const idEntrenadorSeleccionado = rutina 
    ? rutina.id_entrenador 
    : (user && user.id_entrenador ? user.id_entrenador : null);

  const optEntrenadores = entrenadores.map(e => 
    `<option value="${e.id_entrenador}" ${idEntrenadorSeleccionado === e.id_entrenador ? 'selected' : ''}>${e.nombre} ${e.apellido}</option>`
  ).join('');

  document.getElementById('modalTitle').innerText = esEdicion ? 'Editar Rutina' : 'Nueva Rutina';
  document.getElementById('modalBody').innerHTML = `
    <form id="formRutina" onsubmit="guardarRutina(event, ${id})">
      <div class="form-group">
        <label>Nombre de la Rutina *</label>
        <input type="text" id="rutNombre" class="form-control" placeholder="Ej: Rutina Hipertrofia Pecho/Triceps" value="${rutina ? rutina.nombre_rutina : ''}" required>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Cliente Asignado *</label>
          <select id="rutCliente" class="form-control" required>
            <option value="">Seleccionar cliente...</option>
            ${optClientes}
          </select>
        </div>
        <div class="form-group">
          <label>Entrenador *</label>
          <select id="rutEntrenador" class="form-control" required>
            <option value="">Seleccionar entrenador...</option>
            ${optEntrenadores}
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Nivel de Dificultad</label>
          <select id="rutNivel" class="form-control">
            <option value="Principiante" ${rutina && rutina.nivel === 'Principiante' ? 'selected' : ''}>Principiante</option>
            <option value="Intermedio" ${rutina && rutina.nivel === 'Intermedio' ? 'selected' : ''}>Intermedio</option>
            <option value="Avanzado" ${rutina && rutina.nivel === 'Avanzado' ? 'selected' : ''}>Avanzado</option>
          </select>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="rutEstado" class="form-control">
            <option value="activa" ${rutina && rutina.estado === 'activa' ? 'selected' : ''}>Activa</option>
            <option value="inactiva" ${rutina && rutina.estado === 'inactiva' ? 'selected' : ''}>Inactiva</option>
            <option value="completada" ${rutina && rutina.estado === 'completada' ? 'selected' : ''}>Completada</option>
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Fecha Inicio</label>
          <input type="date" id="rutFechaInicio" class="form-control" value="${rutina && rutina.fecha_inicio ? rutina.fecha_inicio.substring(0,10) : new Date().toISOString().substring(0,10)}">
        </div>
        <div class="form-group">
          <label>Fecha Fin</label>
          <input type="date" id="rutFechaFin" class="form-control" value="${rutina && rutina.fecha_fin ? rutina.fecha_fin.substring(0,10) : ''}">
        </div>
      </div>
      <div class="form-group">
        <label>Objetivo</label>
        <textarea id="rutObjetivo" class="form-control" rows="2" placeholder="Ej: Pérdida de grasa / Ganancia de fuerza">${rutina ? rutina.objetivo || '' : ''}</textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top:1rem; width:100%;">
        ${esEdicion ? 'Actualizar Rutina' : 'Guardar Rutina'}
      </button>
    </form>
  `;
  abrirModal();
}

async function guardarRutina(e, id) {
  e.preventDefault();
  const datos = {
    nombre_rutina: document.getElementById('rutNombre').value,
    id_cliente: parseInt(document.getElementById('rutCliente').value),
    id_entrenador: parseInt(document.getElementById('rutEntrenador').value),
    nivel: document.getElementById('rutNivel').value,
    estado: document.getElementById('rutEstado').value,
    fecha_inicio: document.getElementById('rutFechaInicio').value,
    fecha_fin: document.getElementById('rutFechaFin').value,
    objetivo: document.getElementById('rutObjetivo').value
  };

  const url = id ? `/rutinas/${id}` : '/rutinas';
  const method = id ? 'PUT' : 'POST';

  const res = await Auth.fetchApi(url, {
    method,
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    alert(res.mensaje);
    cerrarModal();
    cargarRutinas();
  } else {
    alert(res.mensaje || 'Error al guardar rutina.');
  }
}

async function verDetalleRutina(idRutina) {
  const res = await Auth.fetchApi(`/rutinas/${idRutina}`);
  if (!res.ok) {
    alert('No se pudo cargar la rutina.');
    return;
  }

  const rutina = res.rutina;
  const resEjercicios = await Auth.fetchApi('/ejercicios');
  const listaEjerciciosBD = resEjercicios.ok ? resEjercicios.ejercicios : [];

  const optEjercicios = listaEjerciciosBD.map(e => 
    `<option value="${e.id_ejercicio}">${e.nombre} (${e.grupo_muscular})</option>`
  ).join('');

  let listaHTML = '';
  if (rutina.ejercicios && rutina.ejercicios.length > 0) {
    listaHTML = rutina.ejercicios.map(re => `
      <tr>
        <td><strong>${re.ejercicio_nombre}</strong></td>
        <td>${re.series} x ${re.repeticiones}</td>
        <td>${re.peso} kg</td>
        <td>${re.descanso || '-'}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="eliminarEjercicioDeRutina(${idRutina}, ${re.id_rutina_ejercicio})">🗑️</button>
        </td>
      </tr>
    `).join('');
  } else {
    listaHTML = '<tr><td colspan="5" style="text-align:center;">No hay ejercicios agregados a esta rutina aún.</td></tr>';
  }

  document.getElementById('modalTitle').innerText = `Ejercicios de: ${rutina.nombre_rutina}`;
  document.getElementById('modalBody').innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <p><strong>Cliente:</strong> ${rutina.cliente_nombre}</p>
      <p><strong>Entrenador:</strong> ${rutina.entrenador_nombre}</p>
      <p><strong>Objetivo:</strong> ${rutina.objetivo || 'Sin definir'}</p>
    </div>

    <h4>Agregar Nuevo Ejercicio a la Rutina</h4>
    <form onsubmit="agregarEjercicioARutina(event, ${idRutina})" style="margin-bottom: 1.5rem; background:var(--section-alt); padding:1rem; border-radius:6px;">
      <div class="form-group">
        <label>Ejercicio</label>
        <select id="addEjId" class="form-control" required>
          <option value="">Seleccione ejercicio...</option>
          ${optEjercicios}
        </select>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Series</label>
          <input type="number" id="addEjSeries" class="form-control" value="4" required>
        </div>
        <div class="form-group">
          <label>Repeticiones</label>
          <input type="number" id="addEjReps" class="form-control" value="12" required>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Peso (Kg)</label>
          <input type="number" step="0.5" id="addEjPeso" class="form-control" value="0">
        </div>
        <div class="form-group">
          <label>Descanso</label>
          <input type="text" id="addEjDescanso" class="form-control" value="60 segundos">
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-sm" style="width:100%;">+ Agregar a Rutina</button>
    </form>

    <h4>Lista de Ejercicios en la Rutina</h4>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Ejercicio</th>
            <th>Series x Reps</th>
            <th>Peso</th>
            <th>Descanso</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${listaHTML}
        </tbody>
      </table>
    </div>
  `;
  abrirModal();
}

async function agregarEjercicioARutina(e, idRutina) {
  e.preventDefault();
  const datos = {
    id_ejercicio: parseInt(document.getElementById('addEjId').value),
    series: parseInt(document.getElementById('addEjSeries').value),
    repeticiones: parseInt(document.getElementById('addEjReps').value),
    peso: parseFloat(document.getElementById('addEjPeso').value),
    descanso: document.getElementById('addEjDescanso').value
  };

  const res = await Auth.fetchApi(`/rutinas/${idRutina}/ejercicios`, {
    method: 'POST',
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    verDetalleRutina(idRutina);
  } else {
    alert(res.mensaje || 'Error al agregar ejercicio a la rutina.');
  }
}

async function eliminarEjercicioDeRutina(idRutina, idRutinaEjercicio) {
  if (confirm('¿Remover este ejercicio de la rutina?')) {
    const res = await Auth.fetchApi(`/rutinas/ejercicios/${idRutinaEjercicio}`, { method: 'DELETE' });
    if (res.ok) {
      verDetalleRutina(idRutina);
    } else {
      alert(res.mensaje || 'Error al eliminar ejercicio de la rutina.');
    }
  }
}

async function eliminarRutina(id) {
  if (confirm('¿Eliminar esta rutina?')) {
    const res = await Auth.fetchApi(`/rutinas/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert(res.mensaje);
      cargarRutinas();
    } else {
      alert(res.mensaje || 'Error al eliminar rutina.');
    }
  }
}

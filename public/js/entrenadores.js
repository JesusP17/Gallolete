// Módulo de Gestión de Entrenadores

let entrenadoresData = [];

async function cargarEntrenadores() {
  const res = await Auth.fetchApi('/entrenadores');
  if (res.ok) {
    entrenadoresData = res.entrenadores;
    renderizarEntrenadores(entrenadoresData);
  }
}

function renderizarEntrenadores(lista) {
  const tbody = document.getElementById('tableEntrenadores');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay entrenadores registrados.</td></tr>';
    return;
  }

  lista.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${e.id_entrenador}</td>
      <td><strong>${e.documento}</strong></td>
      <td>${e.nombre} ${e.apellido}</td>
      <td>${e.especialidad || 'General'}</td>
      <td>${e.horario || '-'}</td>
      <td><span class="badge badge-${e.estado}">${e.estado}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalEntrenador(${e.id_entrenador})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarEntrenador(${e.id_entrenador})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalEntrenador(id = null) {
  const entrenador = id ? entrenadoresData.find(e => e.id_entrenador === id) : null;
  const esEdicion = !!entrenador;

  document.getElementById('modalTitle').innerText = esEdicion ? 'Editar Entrenador' : 'Nuevo Entrenador';
  document.getElementById('modalBody').innerHTML = `
    <form id="formEntrenador" onsubmit="guardarEntrenador(event, ${id})">
      <div class="grid-2">
        <div class="form-group">
          <label>Documento *</label>
          <input type="text" id="entDocumento" class="form-control" value="${entrenador ? entrenador.documento : ''}" required>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="entEstado" class="form-control">
            <option value="activo" ${entrenador && entrenador.estado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="inactivo" ${entrenador && entrenador.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Nombre *</label>
          <input type="text" id="entNombre" class="form-control" value="${entrenador ? entrenador.nombre : ''}" required>
        </div>
        <div class="form-group">
          <label>Apellido *</label>
          <input type="text" id="entApellido" class="form-control" value="${entrenador ? entrenador.apellido : ''}" required>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Teléfono</label>
          <input type="text" id="entTelefono" class="form-control" value="${entrenador ? entrenador.telefono || '' : ''}">
        </div>
        <div class="form-group">
          <label>Correo Electrónico</label>
          <input type="email" id="entCorreo" class="form-control" value="${entrenador ? entrenador.correo || '' : ''}">
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Especialidad</label>
          <input type="text" id="entEspecialidad" class="form-control" placeholder="Ej: Musculación, Crossfit" value="${entrenador ? entrenador.especialidad || '' : ''}">
        </div>
        <div class="form-group">
          <label>Horario</label>
          <input type="text" id="entHorario" class="form-control" placeholder="Ej: Mañana (6:00 AM - 2:00 PM)" value="${entrenador ? entrenador.horario || '' : ''}">
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top:1rem; width:100%;">
        ${esEdicion ? 'Actualizar Entrenador' : 'Guardar Entrenador'}
      </button>
    </form>
  `;
  abrirModal();
}

async function guardarEntrenador(e, id) {
  e.preventDefault();
  const datos = {
    documento: document.getElementById('entDocumento').value,
    nombre: document.getElementById('entNombre').value,
    apellido: document.getElementById('entApellido').value,
    telefono: document.getElementById('entTelefono').value,
    correo: document.getElementById('entCorreo').value,
    especialidad: document.getElementById('entEspecialidad').value,
    horario: document.getElementById('entHorario').value,
    estado: document.getElementById('entEstado').value
  };

  const url = id ? `/entrenadores/${id}` : '/entrenadores';
  const method = id ? 'PUT' : 'POST';

  const res = await Auth.fetchApi(url, {
    method,
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    alert(res.mensaje);
    cerrarModal();
    cargarEntrenadores();
  } else {
    alert(res.mensaje || 'Error al guardar entrenador.');
  }
}

async function eliminarEntrenador(id) {
  if (confirm('¿Está seguro de eliminar este entrenador?')) {
    const res = await Auth.fetchApi(`/entrenadores/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert(res.mensaje);
      cargarEntrenadores();
    } else {
      alert(res.mensaje || 'Error al eliminar entrenador.');
    }
  }
}

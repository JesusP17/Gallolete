// Módulo de Gestión de Ejercicios

let ejerciciosData = [];

async function cargarEjercicios() {
  const res = await Auth.fetchApi('/ejercicios');
  if (res.ok) {
    ejerciciosData = res.ejercicios;
    renderizarEjercicios(ejerciciosData);
  }
}

function renderizarEjercicios(lista) {
  const tbody = document.getElementById('tableEjercicios');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay ejercicios registrados.</td></tr>';
    return;
  }

  lista.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${e.nombre}</strong></td>
      <td><span class="badge" style="background:#e3f2fd; color:#1565c0;">${e.grupo_muscular}</span></td>
      <td>${e.nivel}</td>
      <td>${e.descripcion || '-'}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalEjercicio(${e.id_ejercicio})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarEjercicio(${e.id_ejercicio})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalEjercicio(id = null) {
  const ejercicio = id ? ejerciciosData.find(e => e.id_ejercicio === id) : null;
  const esEdicion = !!ejercicio;

  document.getElementById('modalTitle').innerText = esEdicion ? 'Editar Ejercicio' : 'Nuevo Ejercicio';
  document.getElementById('modalBody').innerHTML = `
    <form id="formEjercicio" onsubmit="guardarEjercicio(event, ${id})">
      <div class="form-group">
        <label>Nombre del Ejercicio *</label>
        <input type="text" id="ejNombre" class="form-control" value="${ejercicio ? ejercicio.nombre : ''}" required>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Grupo Muscular *</label>
          <select id="ejGrupo" class="form-control" required>
            <option value="Pecho" ${ejercicio && ejercicio.grupo_muscular === 'Pecho' ? 'selected' : ''}>Pecho</option>
            <option value="Espalda" ${ejercicio && ejercicio.grupo_muscular === 'Espalda' ? 'selected' : ''}>Espalda</option>
            <option value="Pierna" ${ejercicio && ejercicio.grupo_muscular === 'Pierna' ? 'selected' : ''}>Pierna</option>
            <option value="Hombros" ${ejercicio && ejercicio.grupo_muscular === 'Hombros' ? 'selected' : ''}>Hombros</option>
            <option value="Brazos" ${ejercicio && ejercicio.grupo_muscular === 'Brazos' ? 'selected' : ''}>Brazos</option>
            <option value="Abdomen" ${ejercicio && ejercicio.grupo_muscular === 'Abdomen' ? 'selected' : ''}>Abdomen</option>
            <option value="Full Body" ${ejercicio && ejercicio.grupo_muscular === 'Full Body' ? 'selected' : ''}>Full Body</option>
          </select>
        </div>
        <div class="form-group">
          <label>Nivel de Dificultad</label>
          <select id="ejNivel" class="form-control">
            <option value="Principiante" ${ejercicio && ejercicio.nivel === 'Principiante' ? 'selected' : ''}>Principiante</option>
            <option value="Intermedio" ${ejercicio && ejercicio.nivel === 'Intermedio' ? 'selected' : ''}>Intermedio</option>
            <option value="Avanzado" ${ejercicio && ejercicio.nivel === 'Avanzado' ? 'selected' : ''}>Avanzado</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Descripción / Técnica</label>
        <textarea id="ejDescripcion" class="form-control" rows="3">${ejercicio ? ejercicio.descripcion || '' : ''}</textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top:1rem; width:100%;">
        ${esEdicion ? 'Actualizar Ejercicio' : 'Guardar Ejercicio'}
      </button>
    </form>
  `;
  abrirModal();
}

async function guardarEjercicio(e, id) {
  e.preventDefault();
  const datos = {
    nombre: document.getElementById('ejNombre').value,
    grupo_muscular: document.getElementById('ejGrupo').value,
    nivel: document.getElementById('ejNivel').value,
    descripcion: document.getElementById('ejDescripcion').value
  };

  const url = id ? `/ejercicios/${id}` : '/ejercicios';
  const method = id ? 'PUT' : 'POST';

  const res = await Auth.fetchApi(url, {
    method,
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    alert(res.mensaje);
    cerrarModal();
    cargarEjercicios();
  } else {
    alert(res.mensaje || 'Error al guardar ejercicio.');
  }
}

async function eliminarEjercicio(id) {
  if (confirm('¿Está seguro de eliminar este ejercicio?')) {
    const res = await Auth.fetchApi(`/ejercicios/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert(res.mensaje);
      cargarEjercicios();
    } else {
      alert(res.mensaje || 'Error al eliminar ejercicio.');
    }
  }
}

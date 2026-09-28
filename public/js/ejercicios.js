// Módulo de Gestión de Ejercicios - Mejorado para Fase 2

let ejerciciosData = [];
let filtrosActivos = {
  grupo: 'todos',
  nivel: 'todos',
  busqueda: ''
};

async function cargarEjercicios() {
  const res = await Auth.fetchApi('/ejercicios');
  if (res.ok) {
    ejerciciosData = res.ejercicios;
    renderizarEjercicios(ejerciciosData);
    actualizarContadoresFiltros();
  }
}

function aplicarFiltros() {
  let resultados = [...ejerciciosData];

  // Filtro por grupo muscular
  if (filtrosActivos.grupo !== 'todos') {
    resultados = resultados.filter(e => e.grupo_muscular === filtrosActivos.grupo);
  }

  // Filtro por nivel
  if (filtrosActivos.nivel !== 'todos') {
    resultados = resultados.filter(e => e.nivel === filtrosActivos.nivel);
  }

  // Búsqueda por nombre o descripción
  if (filtrosActivos.busqueda) {
    const busqueda = filtrosActivos.busqueda.toLowerCase();
    resultados = resultados.filter(e => 
      e.nombre.toLowerCase().includes(busqueda) ||
      (e.descripcion && e.descripcion.toLowerCase().includes(busqueda))
    );
  }

  renderizarEjercicios(resultados);
}

function filtrarPorGrupo(grupo) {
  filtrosActivos.grupo = grupo;
  aplicarFiltros();
  actualizarBotonesFiltros();
}

function filtrarPorNivel(nivel) {
  filtrosActivos.nivel = nivel;
  aplicarFiltros();
  actualizarBotonesFiltros();
}

function buscarEjercicio(termino) {
  filtrosActivos.busqueda = termino;
  aplicarFiltros();
}

function limpiarFiltros() {
  filtrosActivos = { grupo: 'todos', nivel: 'todos', busqueda: '' };
  document.getElementById('searchEjercicio').value = '';
  aplicarFiltros();
  actualizarBotonesFiltros();
}

function actualizarBotonesFiltros() {
  // Actualizar botones de grupo muscular
  document.querySelectorAll('.filtro-grupo').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.grupo === filtrosActivos.grupo) {
      btn.classList.add('active');
    }
  });

  // Actualizar botones de nivel
  document.querySelectorAll('.filtro-nivel').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.nivel === filtrosActivos.nivel) {
      btn.classList.add('active');
    }
  });
}

function actualizarContadoresFiltros() {
  const grupos = {};
  const niveles = {};

  ejerciciosData.forEach(e => {
    grupos[e.grupo_muscular] = (grupos[e.grupo_muscular] || 0) + 1;
    niveles[e.nivel] = (niveles[e.nivel] || 0) + 1;
  });

  // Actualizar contadores en los botones si existen
  document.querySelectorAll('.filtro-grupo').forEach(btn => {
    const grupo = btn.dataset.grupo;
    if (grupo !== 'todos' && grupos[grupo]) {
      const badge = btn.querySelector('.contador-badge');
      if (badge) badge.textContent = grupos[grupo];
    }
  });
}

function renderizarEjercicios(lista) {
  const tbody = document.getElementById('tableEjercicios');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-muted);">No se encontraron ejercicios con los filtros seleccionados.</td></tr>';
    return;
  }

  lista.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${e.id_ejercicio}</td>
      <td><strong>${e.nombre}</strong></td>
      <td><span class="badge" style="background:#e3f2fd; color:#1565c0;">${e.grupo_muscular}</span></td>
      <td><span class="badge badge-nivel-${e.nivel.toLowerCase()}">${e.nivel}</span></td>
      <td style="max-width: 300px;">
        ${e.descripcion ? 
          `<span style="cursor: help;" title="${e.descripcion}">
            ${e.descripcion.length > 50 ? e.descripcion.substring(0, 50) + '...' : e.descripcion}
          </span>` 
          : '-'}
      </td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="verDetalleEjercicio(${e.id_ejercicio})" title="Ver detalle completo">
          👁️ Ver
        </button>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalEjercicio(${e.id_ejercicio})" title="Editar ejercicio">
          ✏️
        </button>
        <button class="btn btn-danger btn-sm" onclick="eliminarEjercicio(${e.id_ejercicio})" title="Eliminar ejercicio">
          🗑️
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Actualizar contador de resultados
  const contador = document.getElementById('contadorEjercicios');
  if (contador) {
    contador.textContent = `Mostrando ${lista.length} de ${ejerciciosData.length} ejercicios`;
  }
}

function verDetalleEjercicio(id) {
  const ejercicio = ejerciciosData.find(e => e.id_ejercicio === id);
  if (!ejercicio) return;

  const modalBody = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
      <div>
        <strong>Nombre:</strong><br>
        <span style="font-size: 1.2rem; color: var(--primary-color);">${ejercicio.nombre}</span>
      </div>
      <div>
        <strong>ID:</strong><br>
        #${ejercicio.id_ejercicio}
      </div>
      <div>
        <strong>Grupo Muscular:</strong><br>
        <span class="badge" style="background:#e3f2fd; color:#1565c0; font-size: 1rem;">${ejercicio.grupo_muscular}</span>
      </div>
      <div>
        <strong>Nivel de Dificultad:</strong><br>
        <span class="badge badge-nivel-${ejercicio.nivel.toLowerCase()}" style="font-size: 1rem;">${ejercicio.nivel}</span>
      </div>
    </div>

    ${ejercicio.descripcion ? `
      <div style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border-left: 4px solid var(--primary-color);">
        <strong style="display: block; margin-bottom: 0.5rem;">📝 Descripción / Técnica:</strong>
        <p style="margin: 0; line-height: 1.6;">${ejercicio.descripcion}</p>
      </div>
    ` : `
      <div style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; text-align: center; color: var(--text-muted);">
        <p style="margin: 0;">Sin descripción disponible</p>
      </div>
    `}

    <div style="margin-top: 2rem; padding: 1rem; background: #e3f2fd; border-radius: 8px;">
      <strong style="display: block; margin-bottom: 0.5rem;">💡 Consejos de uso:</strong>
      <ul style="margin: 0.5rem 0 0 1.2rem; line-height: 1.8;">
        <li>Puedes agregar este ejercicio a cualquier rutina</li>
        <li>Ajusta las series, repeticiones y peso según el nivel del cliente</li>
        <li>Recuerda siempre enfatizar la técnica correcta</li>
      </ul>
    </div>

    <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
      <button class="btn btn-primary" onclick="cerrarModal(); abrirModalEjercicio(${id})">
        ✏️ Editar Ejercicio
      </button>
      <button class="btn btn-secondary" onclick="cerrarModal()">
        Cerrar
      </button>
    </div>
  `;

  abrirModalGenerico(`Detalle del Ejercicio`, modalBody);
}

function abrirModalEjercicio(id = null) {
  const ejercicio = id ? ejerciciosData.find(e => e.id_ejercicio === id) : null;
  const esEdicion = !!ejercicio;

  document.getElementById('modalTitle').innerText = esEdicion ? 'Editar Ejercicio' : 'Nuevo Ejercicio';
  document.getElementById('modalBody').innerHTML = `
    <form id="formEjercicio" onsubmit="guardarEjercicio(event, ${id})">
      <div class="form-group">
        <label>Nombre del Ejercicio *</label>
        <input type="text" id="ejNombre" class="form-control" value="${ejercicio ? ejercicio.nombre : ''}" placeholder="Ej: Press de banca con barra" required>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Grupo Muscular *</label>
          <select id="ejGrupo" class="form-control" required>
            <option value="">-- Seleccionar --</option>
            <option value="Pecho" ${ejercicio && ejercicio.grupo_muscular === 'Pecho' ? 'selected' : ''}>🫀 Pecho</option>
            <option value="Espalda" ${ejercicio && ejercicio.grupo_muscular === 'Espalda' ? 'selected' : ''}>🔙 Espalda</option>
            <option value="Pierna" ${ejercicio && ejercicio.grupo_muscular === 'Pierna' ? 'selected' : ''}>🦵 Pierna</option>
            <option value="Hombros" ${ejercicio && ejercicio.grupo_muscular === 'Hombros' ? 'selected' : ''}>💪 Hombros</option>
            <option value="Brazos" ${ejercicio && ejercicio.grupo_muscular === 'Brazos' ? 'selected' : ''}>💪 Brazos</option>
            <option value="Abdomen" ${ejercicio && ejercicio.grupo_muscular === 'Abdomen' ? 'selected' : ''}>🏋️ Abdomen</option>
            <option value="Cardio" ${ejercicio && ejercicio.grupo_muscular === 'Cardio' ? 'selected' : ''}>🏃 Cardio</option>
            <option value="Full Body" ${ejercicio && ejercicio.grupo_muscular === 'Full Body' ? 'selected' : ''}>🔥 Full Body</option>
          </select>
        </div>
        <div class="form-group">
          <label>Nivel de Dificultad *</label>
          <select id="ejNivel" class="form-control" required>
            <option value="Principiante" ${ejercicio && ejercicio.nivel === 'Principiante' ? 'selected' : ''}>⭐ Principiante</option>
            <option value="Intermedio" ${ejercicio && ejercicio.nivel === 'Intermedio' ? 'selected' : ''}>⭐⭐ Intermedio</option>
            <option value="Avanzado" ${ejercicio && ejercicio.nivel === 'Avanzado' ? 'selected' : ''}>⭐⭐⭐ Avanzado</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Descripción / Técnica de Ejecución</label>
        <textarea id="ejDescripcion" class="form-control" rows="4" placeholder="Describe la técnica correcta, músculos trabajados, consejos de seguridad...">${ejercicio ? ejercicio.descripcion || '' : ''}</textarea>
        <small style="color: var(--text-muted);">Una buena descripción ayuda a los clientes a ejecutar el ejercicio correctamente</small>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
        <button type="submit" class="btn btn-primary" style="flex: 1;">
          ${esEdicion ? '✓ Actualizar Ejercicio' : '+ Guardar Ejercicio'}
        </button>
        <button type="button" class="btn btn-secondary" onclick="cerrarModal()">
          Cancelar
        </button>
      </div>
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
    mostrarAlerta('success', res.mensaje || 'Ejercicio guardado correctamente');
    cerrarModal();
    cargarEjercicios();
  } else {
    mostrarAlerta('error', res.mensaje || 'Error al guardar ejercicio');
  }
}

async function eliminarEjercicio(id) {
  const ejercicio = ejerciciosData.find(e => e.id_ejercicio === id);
  
  if (confirm(`¿Está seguro de eliminar el ejercicio "${ejercicio.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
    const res = await Auth.fetchApi(`/ejercicios/${id}`, { method: 'DELETE' });
    if (res.ok) {
      mostrarAlerta('success', res.mensaje || 'Ejercicio eliminado correctamente');
      cargarEjercicios();
    } else {
      mostrarAlerta('error', res.mensaje || 'Error al eliminar ejercicio');
    }
  }
}

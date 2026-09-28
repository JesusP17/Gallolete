// Módulo de Gestión de Clientes

let clientesData = [];
let currentView = 'cards';
let currentFilter = 'all';

async function cargarClientes() {
  const res = await Auth.fetchApi('/clientes');
  if (res.ok) {
    clientesData = res.clientes;
    actualizarContadores();
    renderizarClientes(clientesData);
  }
}

function actualizarContadores() {
  const total = clientesData.length;
  const activos = clientesData.filter(c => c.estado === 'activo').length;
  const inactivos = clientesData.filter(c => c.estado === 'inactivo').length;
  
  document.getElementById('countAll').textContent = total;
  document.getElementById('countActive').textContent = activos;
  document.getElementById('countInactive').textContent = inactivos;
}

function renderizarClientes(lista) {
  if (currentView === 'cards') {
    renderizarClientesCards(lista);
  } else {
    renderizarClientesTabla(lista);
  }
}

function renderizarClientesCards(lista) {
  const container = document.getElementById('clientsGrid');
  
  if (lista.length === 0) {
    container.innerHTML = `
      <div class="clients-empty" style="grid-column: 1/-1;">
        <i class="fas fa-user-friends"></i>
        <h3>No hay atletas</h3>
        <p>No se encontraron atletas con los filtros actuales</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lista.map(cliente => `
    <div class="client-card" data-status="${cliente.estado}">
      <div class="client-avatar">
        <div class="avatar-container">
          <div class="avatar">
            ${generarIniciales(cliente.nombre, cliente.apellido)}
            <div class="status-indicator ${cliente.estado}"></div>
          </div>
        </div>
        <div class="client-info">
          <h3 class="client-name">${cliente.nombre} ${cliente.apellido}</h3>
          <p class="client-id">#${cliente.id_cliente} • ${cliente.documento}</p>
        </div>
      </div>
      
      <div class="client-details">
        ${cliente.telefono ? `
          <div class="detail-row">
            <i class="fas fa-phone"></i>
            <span>${cliente.telefono}</span>
          </div>
        ` : ''}
        ${cliente.correo ? `
          <div class="detail-row">
            <i class="fas fa-envelope"></i>
            <span>${cliente.correo}</span>
          </div>
        ` : ''}
        ${cliente.genero ? `
          <div class="detail-row">
            <i class="fas fa-user"></i>
            <span>${cliente.genero}</span>
          </div>
        ` : ''}
        ${cliente.fecha_nacimiento ? `
          <div class="detail-row">
            <i class="fas fa-birthday-cake"></i>
            <span>${calcularEdad(cliente.fecha_nacimiento)} años</span>
          </div>
        ` : ''}
      </div>
      
      <div class="client-status">
        <span class="status-badge ${cliente.estado}">
          ${cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
        </span>
        <div class="last-activity">
          <i class="fas fa-clock"></i>
          <span>Hace ${Math.floor(Math.random() * 7) + 1} días</span>
        </div>
      </div>
      
      <div class="client-actions">
        <button class="btn-card primary" onclick="abrirModalCliente(${cliente.id_cliente})">
          <i class="fas fa-edit"></i>
          <span>Editar</span>
        </button>
        <button class="btn-card danger" onclick="eliminarCliente(${cliente.id_cliente})">
          <i class="fas fa-trash"></i>
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  `).join('');
}

function renderizarClientesTabla(lista) {
  const tbody = document.getElementById('tableClientes');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No hay clientes registrados.</td></tr>';
    return;
  }

  lista.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="table-client-info">
          <div class="table-avatar">
            ${generarIniciales(c.nombre, c.apellido)}
          </div>
          <div class="table-client-details">
            <h4>${c.nombre} ${c.apellido}</h4>
            <p>#${c.id_cliente} • ${c.documento}</p>
          </div>
        </div>
      </td>
      <td>
        ${c.telefono ? `<i class="fas fa-phone" style="color: var(--primary-color);"></i> ${c.telefono}<br>` : ''}
        ${c.correo ? `<i class="fas fa-envelope" style="color: var(--primary-color);"></i> ${c.correo}` : ''}
      </td>
      <td><span class="status-badge ${c.estado}">${c.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-light);">
          <i class="fas fa-clock"></i>
          <span>Hace ${Math.floor(Math.random() * 7) + 1} días</span>
        </div>
      </td>
      <td>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-card primary" onclick="abrirModalCliente(${c.id_cliente})" style="flex: none; padding: 0.5rem;">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-card danger" onclick="eliminarCliente(${c.id_cliente})" style="flex: none; padding: 0.5rem;">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function generarIniciales(nombre, apellido) {
  const inicial1 = nombre ? nombre.charAt(0).toUpperCase() : '';
  const inicial2 = apellido ? apellido.charAt(0).toUpperCase() : '';
  return inicial1 + inicial2;
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 'N/A';
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNacimiento = nacimiento.getMonth();
  
  if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}

function cambiarVista(vista) {
  currentView = vista;
  
  // Actualizar botones de vista
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.view === vista) {
      btn.classList.add('active');
    }
  });
  
  // Mostrar/ocultar contenedores
  const cardsContainer = document.getElementById('clientsGrid').parentElement;
  const listContainer = document.getElementById('clientsList');
  
  if (vista === 'cards') {
    cardsContainer.classList.remove('hidden');
    listContainer.classList.add('hidden');
  } else {
    cardsContainer.classList.add('hidden');
    listContainer.classList.remove('hidden');
  }
  
  // Re-renderizar con la vista actual
  const filtrados = filtrarPorEstado(clientesData, currentFilter);
  renderizarClientes(filtrados);
}

function cambiarFiltro(filtro) {
  currentFilter = filtro;
  
  // Actualizar botones de filtro
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === filtro) {
      btn.classList.add('active');
    }
  });
  
  // Filtrar y renderizar
  const filtrados = filtrarPorEstado(clientesData, filtro);
  renderizarClientes(filtrados);
}

function filtrarPorEstado(lista, filtro) {
  if (filtro === 'all') return lista;
  return lista.filter(cliente => cliente.estado === filtro);
}

function abrirModalCliente(id = null) {
  const cliente = id ? clientesData.find(c => c.id_cliente === id) : null;
  const esEdicion = !!cliente;

  const titulo = esEdicion ? 'Editar Atleta' : 'Nuevo Atleta';
  const subtitulo = esEdicion ? `Actualizar información de ${cliente.nombre} ${cliente.apellido}` : 'Registrar un nuevo atleta en el gimnasio';
  const icono = esEdicion ? 'fas fa-user-edit' : 'fas fa-user-plus';

  const contenidoHTML = `
    <form id="formCliente" class="form-modern" onsubmit="guardarCliente(event, ${id})">
      <div class="form-section">
        <div class="form-section-title">
          <i class="fas fa-id-card"></i>
          <span>Información Personal</span>
        </div>
        
        <div class="form-grid cols-2">
          <div class="form-group-modern">
            <label class="form-label-modern">
              <i class="fas fa-hashtag"></i>
              <span>Documento <span class="required">*</span></span>
            </label>
            <input 
              type="text" 
              id="cliDocumento" 
              class="form-input-modern" 
              value="${cliente ? cliente.documento : ''}" 
              required
              placeholder="Ej: 12345678"
            >
            <div class="form-validation-icon">
              <i class="fas fa-check"></i>
            </div>
          </div>
          
          <div class="form-group-modern">
            <label class="form-label-modern">
              <i class="fas fa-toggle-on"></i>
              <span>Estado</span>
            </label>
            <select id="cliEstado" class="form-select-modern">
              <option value="activo" ${cliente && cliente.estado === 'activo' ? 'selected' : ''}>🟢 Activo</option>
              <option value="inactivo" ${cliente && cliente.estado === 'inactivo' ? 'selected' : ''}>🔴 Inactivo</option>
            </select>
          </div>
        </div>
        
        <div class="form-grid cols-2">
          <div class="form-group-modern">
            <label class="form-label-modern">
              <i class="fas fa-user"></i>
              <span>Nombre <span class="required">*</span></span>
            </label>
            <input 
              type="text" 
              id="cliNombre" 
              class="form-input-modern" 
              value="${cliente ? cliente.nombre : ''}" 
              required
              placeholder="Ej: Juan Carlos"
            >
            <div class="form-validation-icon">
              <i class="fas fa-check"></i>
            </div>
          </div>
          
          <div class="form-group-modern">
            <label class="form-label-modern">
              <i class="fas fa-user"></i>
              <span>Apellido <span class="required">*</span></span>
            </label>
            <input 
              type="text" 
              id="cliApellido" 
              class="form-input-modern" 
              value="${cliente ? cliente.apellido : ''}" 
              required
              placeholder="Ej: Pérez González"
            >
            <div class="form-validation-icon">
              <i class="fas fa-check"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">
          <i class="fas fa-address-book"></i>
          <span>Información de Contacto</span>
        </div>
        
        <div class="form-grid cols-2">
          <div class="form-group-modern">
            <label class="form-label-modern">
              <i class="fas fa-phone"></i>
              <span>Teléfono</span>
            </label>
            <input 
              type="tel" 
              id="cliTelefono" 
              class="form-input-modern" 
              value="${cliente ? cliente.telefono || '' : ''}"
              placeholder="Ej: +57 300 123 4567"
            >
            <div class="form-help-text">Incluye código de país para mejor contacto</div>
          </div>
          
          <div class="form-group-modern">
            <label class="form-label-modern">
              <i class="fas fa-envelope"></i>
              <span>Correo Electrónico</span>
            </label>
            <input 
              type="email" 
              id="cliCorreo" 
              class="form-input-modern" 
              value="${cliente ? cliente.correo || '' : ''}"
              placeholder="Ej: juan@email.com"
            >
            <div class="form-validation-icon">
              <i class="fas fa-check"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">
          <i class="fas fa-user-circle"></i>
          <span>Información Adicional</span>
        </div>
        
        <div class="form-grid cols-2">
          <div class="form-group-modern">
            <label class="form-label-modern">
              <i class="fas fa-birthday-cake"></i>
              <span>Fecha de Nacimiento</span>
            </label>
            <input 
              type="date" 
              id="cliFechaNac" 
              class="form-input-modern" 
              value="${cliente && cliente.fecha_nacimiento ? cliente.fecha_nacimiento.substring(0,10) : ''}"
            >
            <div class="form-help-text">Nos ayuda a personalizar rutinas según la edad</div>
          </div>
          
          <div class="form-group-modern">
            <label class="form-label-modern">
              <i class="fas fa-venus-mars"></i>
              <span>Género</span>
            </label>
            <select id="cliGenero" class="form-select-modern">
              <option value="">Seleccionar...</option>
              <option value="Masculino" ${cliente && cliente.genero === 'Masculino' ? 'selected' : ''}>👨 Masculino</option>
              <option value="Femenino" ${cliente && cliente.genero === 'Femenino' ? 'selected' : ''}>👩 Femenino</option>
              <option value="Otro" ${cliente && cliente.genero === 'Otro' ? 'selected' : ''}>🏳️‍⚧️ Otro</option>
            </select>
          </div>
        </div>
        
        <div class="form-group-modern">
          <label class="form-label-modern">
            <i class="fas fa-map-marker-alt"></i>
            <span>Dirección</span>
          </label>
          <textarea 
            id="cliDireccion" 
            class="form-textarea-modern" 
            placeholder="Ej: Calle 123 #45-67, Barrio Centro, Ciudad"
            style="min-height: 80px;"
          >${cliente ? cliente.direccion || '' : ''}</textarea>
          <div class="form-help-text">Información útil para comunicaciones y servicios</div>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn-form btn-form-secondary" onclick="cerrarModal()">
          <i class="fas fa-times"></i>
          <span class="btn-text">Cancelar</span>
        </button>
        <button type="submit" class="btn-form btn-form-primary">
          <i class="fas fa-save"></i>
          <span class="btn-text">${esEdicion ? 'Actualizar Atleta' : 'Guardar Atleta'}</span>
        </button>
      </div>
    </form>
  `;

  abrirModalModerno(titulo, subtitulo, icono, contenidoHTML, 'large');
}

async function guardarCliente(e, id) {
  e.preventDefault();
  
  const formulario = e.target;
  const submitBtn = formulario.querySelector('button[type="submit"]');
  
  // Validar formulario completo
  if (!validarFormularioCompleto(formulario)) {
    return;
  }
  
  // Mostrar estado de carga
  mostrarCargandoBoton(submitBtn);
  
  const datos = {
    documento: document.getElementById('cliDocumento').value,
    nombre: document.getElementById('cliNombre').value,
    apellido: document.getElementById('cliApellido').value,
    telefono: document.getElementById('cliTelefono').value,
    correo: document.getElementById('cliCorreo').value,
    fecha_nacimiento: document.getElementById('cliFechaNac').value,
    genero: document.getElementById('cliGenero').value,
    direccion: document.getElementById('cliDireccion').value,
    estado: document.getElementById('cliEstado').value
  };

  try {
    const url = id ? `/clientes/${id}` : '/clientes';
    const method = id ? 'PUT' : 'POST';

    const res = await Auth.fetchApi(url, {
      method,
      body: JSON.stringify(datos)
    });

    if (res.ok) {
      // Mostrar notificación de éxito
      mostrarAlerta('success', res.mensaje || 'Cliente guardado exitosamente');
      
      // Cerrar modal con animación suave
      setTimeout(() => {
        cerrarModal();
        cargarClientes();
      }, 500);
    } else {
      throw new Error(res.mensaje || 'Error al guardar cliente.');
    }
  } catch (error) {
    mostrarAlerta('error', error.message);
  } finally {
    ocultarCargandoBoton(submitBtn);
  }
}

async function eliminarCliente(id) {
  if (confirm('¿Está seguro de que desea eliminar este atleta?')) {
    const res = await Auth.fetchApi(`/clientes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert(res.mensaje);
      cargarClientes();
    } else {
      alert(res.mensaje || 'No se pudo eliminar el cliente.');
    }
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Búsqueda en tiempo real
  document.getElementById('searchCliente')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtrados = clientesData.filter(c => 
      c.documento.toLowerCase().includes(query) ||
      c.nombre.toLowerCase().includes(query) ||
      c.apellido.toLowerCase().includes(query) ||
      (c.correo && c.correo.toLowerCase().includes(query)) ||
      (c.telefono && c.telefono.includes(query))
    );
    renderizarClientes(filtrados);
  });

  // Filtros de estado
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      cambiarFiltro(tab.dataset.filter);
    });
  });

  // Toggle de vista
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cambiarVista(btn.dataset.view);
    });
  });
});

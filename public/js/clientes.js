// Módulo de Gestión de Clientes

let clientesData = [];

async function cargarClientes() {
  const res = await Auth.fetchApi('/clientes');
  if (res.ok) {
    clientesData = res.clientes;
    renderizarClientes(clientesData);
  }
}

function renderizarClientes(lista) {
  const tbody = document.getElementById('tableClientes');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay clientes registrados.</td></tr>';
    return;
  }

  lista.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${c.id_cliente}</td>
      <td><strong>${c.documento}</strong></td>
      <td>${c.nombre} ${c.apellido}</td>
      <td>${c.telefono || '-'}</td>
      <td>${c.correo || '-'}</td>
      <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalCliente(${c.id_cliente})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarCliente(${c.id_cliente})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalCliente(id = null) {
  const cliente = id ? clientesData.find(c => c.id_cliente === id) : null;
  const esEdicion = !!cliente;

  document.getElementById('modalTitle').innerText = esEdicion ? 'Editar Cliente' : 'Nuevo Cliente';
  document.getElementById('modalBody').innerHTML = `
    <form id="formCliente" onsubmit="guardarCliente(event, ${id})">
      <div class="grid-2">
        <div class="form-group">
          <label>Documento *</label>
          <input type="text" id="cliDocumento" class="form-control" value="${cliente ? cliente.documento : ''}" required>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="cliEstado" class="form-control">
            <option value="activo" ${cliente && cliente.estado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="inactivo" ${cliente && cliente.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Nombre *</label>
          <input type="text" id="cliNombre" class="form-control" value="${cliente ? cliente.nombre : ''}" required>
        </div>
        <div class="form-group">
          <label>Apellido *</label>
          <input type="text" id="cliApellido" class="form-control" value="${cliente ? cliente.apellido : ''}" required>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Teléfono</label>
          <input type="text" id="cliTelefono" class="form-control" value="${cliente ? cliente.telefono || '' : ''}">
        </div>
        <div class="form-group">
          <label>Correo Electrónico</label>
          <input type="email" id="cliCorreo" class="form-control" value="${cliente ? cliente.correo || '' : ''}">
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Fecha Nacimiento</label>
          <input type="date" id="cliFechaNac" class="form-control" value="${cliente && cliente.fecha_nacimiento ? cliente.fecha_nacimiento.substring(0,10) : ''}">
        </div>
        <div class="form-group">
          <label>Género</label>
          <select id="cliGenero" class="form-control">
            <option value="Masculino" ${cliente && cliente.genero === 'Masculino' ? 'selected' : ''}>Masculino</option>
            <option value="Femenino" ${cliente && cliente.genero === 'Femenino' ? 'selected' : ''}>Femenino</option>
            <option value="Otro" ${cliente && cliente.genero === 'Otro' ? 'selected' : ''}>Otro</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Dirección</label>
        <input type="text" id="cliDireccion" class="form-control" value="${cliente ? cliente.direccion || '' : ''}">
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top:1rem; width:100%;">
        ${esEdicion ? 'Actualizar Cliente' : 'Guardar Cliente'}
      </button>
    </form>
  `;
  abrirModal();
}

async function guardarCliente(e, id) {
  e.preventDefault();
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

  const url = id ? `/clientes/${id}` : '/clientes';
  const method = id ? 'PUT' : 'POST';

  const res = await Auth.fetchApi(url, {
    method,
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    alert(res.mensaje);
    cerrarModal();
    cargarClientes();
  } else {
    alert(res.mensaje || 'Error al guardar cliente.');
  }
}

async function eliminarCliente(id) {
  if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
    const res = await Auth.fetchApi(`/clientes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert(res.mensaje);
      cargarClientes();
    } else {
      alert(res.mensaje || 'No se pudo eliminar el cliente.');
    }
  }
}

// Búsqueda en tiempo real
document.getElementById('searchCliente')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtrados = clientesData.filter(c => 
    c.documento.toLowerCase().includes(query) ||
    c.nombre.toLowerCase().includes(query) ||
    c.apellido.toLowerCase().includes(query)
  );
  renderizarClientes(filtrados);
});

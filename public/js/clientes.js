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
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay clientes registrados.</td></tr>';
    return;
  }

  lista.forEach(c => {
    const esActivo = c.estado === 'activo';
    const btnEstadoText = esActivo ? '🚫 Deshabilitar' : '✅ Activar';
    const btnEstadoClass = esActivo ? 'btn-secondary' : 'btn-primary';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${c.nombre} ${c.apellido}</strong></td>
      <td>${c.telefono || '-'}</td>
      <td>${c.correo || '-'}</td>
      <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
      <td>
        <button class="btn ${btnEstadoClass} btn-sm" onclick="cambiarEstadoCliente(${c.id_cliente}, '${c.estado}', '${c.nombre} ${c.apellido}')">${btnEstadoText}</button>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalCliente(${c.id_cliente})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarCliente(${c.id_cliente}, '${c.nombre} ${c.apellido}')">🗑️ Quitar</button>
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
      <div class="grid-2">
        <div class="form-group">
          <label>Dirección</label>
          <input type="text" id="cliDireccion" class="form-control" value="${cliente ? cliente.direccion || '' : ''}">
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="cliEstado" class="form-control">
            <option value="activo" ${cliente && cliente.estado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="inactivo" ${cliente && cliente.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
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
  const clienteExistente = id ? clientesData.find(c => c.id_cliente === id) : null;
  const datos = {
    documento: clienteExistente ? clienteExistente.documento : 'DOC-' + Date.now(),
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
    cerrarModal();
    mostrarModalNotificacion({
      titulo: id ? 'Cliente Actualizado' : 'Cliente Guardado',
      mensaje: res.mensaje || 'Información del cliente guardada con éxito.',
      tipo: 'exito'
    });
    cargarClientes();
  } else {
    mostrarModalNotificacion({
      titulo: 'Error',
      mensaje: res.mensaje || 'Error al guardar cliente.',
      tipo: 'error'
    });
  }
}

function cambiarEstadoCliente(id, estadoActual, nombreCliente) {
  const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
  const accion = nuevoEstado === 'inactivo' ? 'deshabilitar' : 'activar';

  mostrarModalConfirmacion({
    titulo: `Confirmar ${accion.toUpperCase()}`,
    mensaje: `¿Está seguro de que desea ${accion} al cliente "${nombreCliente}"?`,
    textoBoton: `Sí, ${accion}`,
    claseBoton: nuevoEstado === 'inactivo' ? 'btn-danger' : 'btn-primary',
    onConfirm: async () => {
      const cli = clientesData.find(c => c.id_cliente === id);
      if (!cli) return;

      const res = await Auth.fetchApi(`/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...cli, estado: nuevoEstado })
      });

      if (res.ok) {
        mostrarModalNotificacion({
          titulo: 'Estado Actualizado',
          mensaje: `El cliente "${nombreCliente}" ha sido ${nuevoEstado === 'inactivo' ? 'deshabilitado' : 'activado'} correctamente.`,
          tipo: 'exito'
        });
        cargarClientes();
      } else {
        mostrarModalNotificacion({
          titulo: 'Error',
          mensaje: res.mensaje || 'No se pudo cambiar el estado del cliente.',
          tipo: 'error'
        });
      }
    }
  });
}

function eliminarCliente(id, nombreCliente) {
  mostrarModalConfirmacion({
    titulo: 'Quitar Registro de Cliente',
    mensaje: `¿Está seguro de que desea quitar permanentemente al cliente "${nombreCliente}" del sistema?`,
    textoBoton: 'Sí, quitar cliente',
    claseBoton: 'btn-danger',
    onConfirm: async () => {
      const res = await Auth.fetchApi(`/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarModalNotificacion({
          titulo: 'Cliente Eliminado',
          mensaje: `El cliente "${nombreCliente}" ha sido retirado con éxito.`,
          tipo: 'exito'
        });
        cargarClientes();
      } else {
        mostrarModalNotificacion({
          titulo: 'Error',
          mensaje: res.mensaje || 'No se pudo eliminar el cliente.',
          tipo: 'error'
        });
      }
    }
  });
}

// Búsqueda en tiempo real
document.getElementById('searchCliente')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtrados = clientesData.filter(c => 
    (c.nombre && c.nombre.toLowerCase().includes(query)) ||
    (c.apellido && c.apellido.toLowerCase().includes(query))
  );
  renderizarClientes(filtrados);
});

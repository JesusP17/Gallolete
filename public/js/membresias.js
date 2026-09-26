// Módulo de Gestión de Membresías

let membresiasData = [];

async function cargarMembresias() {
  const res = await Auth.fetchApi('/membresias');
  if (res.ok) {
    membresiasData = res.membresias;
    renderizarMembresias(membresiasData);
  }
}

function renderizarMembresias(lista) {
  const tbody = document.getElementById('tableMembresias');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay membresías registradas.</td></tr>';
    return;
  }

  lista.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${m.id_membresia}</td>
      <td><strong>${m.cliente_nombre || 'Cliente #' + m.id_cliente}</strong><br><small>${m.cliente_documento || ''}</small></td>
      <td>${m.tipo}</td>
      <td>${m.fecha_inicio ? m.fecha_inicio.substring(0,10) : ''}</td>
      <td>${m.fecha_fin ? m.fecha_fin.substring(0,10) : ''}</td>
      <td>$${parseFloat(m.precio).toLocaleString('es-CO')}</td>
      <td><span class="badge badge-${m.estado}">${m.estado}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalMembresia(${m.id_membresia})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarMembresia(${m.id_membresia})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filtrarMembresias(filtro) {
  if (filtro === 'todas') {
    renderizarMembresias(membresiasData);
  } else {
    const filtradas = membresiasData.filter(m => m.estado === filtro);
    renderizarMembresias(filtradas);
  }
}

async function abrirModalMembresia(id = null) {
  const membresia = id ? membresiasData.find(m => m.id_membresia === id) : null;
  const esEdicion = !!membresia;

  // Cargar lista de clientes para la selección
  const resClientes = await Auth.fetchApi('/clientes');
  const clientes = resClientes.ok ? resClientes.clientes : [];

  let opcionesClientes = clientes.map(c => 
    `<option value="${c.id_cliente}" ${membresia && membresia.id_cliente === c.id_cliente ? 'selected' : ''}>
      ${c.nombre} ${c.apellido} (${c.documento})
     </option>`
  ).join('');

  document.getElementById('modalTitle').innerText = esEdicion ? 'Editar Membresía' : 'Nueva Membresía';
  document.getElementById('modalBody').innerHTML = `
    <form id="formMembresia" onsubmit="guardarMembresia(event, ${id})">
      <div class="form-group">
        <label>Cliente *</label>
        <select id="memCliente" class="form-control" required>
          <option value="">Seleccione un cliente...</option>
          ${opcionesClientes}
        </select>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Tipo de Membresía *</label>
          <select id="memTipo" class="form-control" required>
            <option value="Mensual General" ${membresia && membresia.tipo === 'Mensual General' ? 'selected' : ''}>Mensual General</option>
            <option value="Mensual VIP" ${membresia && membresia.tipo === 'Mensual VIP' ? 'selected' : ''}>Mensual VIP</option>
            <option value="Trimestral" ${membresia && membresia.tipo === 'Trimestral' ? 'selected' : ''}>Trimestral</option>
            <option value="Semestral" ${membresia && membresia.tipo === 'Semestral' ? 'selected' : ''}>Semestral</option>
            <option value="Anual" ${membresia && membresia.tipo === 'Anual' ? 'selected' : ''}>Anual</option>
          </select>
        </div>
        <div class="form-group">
          <label>Precio ($) *</label>
          <input type="number" id="memPrecio" class="form-control" value="${membresia ? membresia.precio : '100000'}" required>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Fecha Inicio *</label>
          <input type="date" id="memFechaInicio" class="form-control" value="${membresia && membresia.fecha_inicio ? membresia.fecha_inicio.substring(0,10) : new Date().toISOString().substring(0,10)}" required>
        </div>
        <div class="form-group">
          <label>Fecha Fin *</label>
          <input type="date" id="memFechaFin" class="form-control" value="${membresia && membresia.fecha_fin ? membresia.fecha_fin.substring(0,10) : ''}" required>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Método de Pago</label>
          <select id="memMetodoPago" class="form-control">
            <option value="Efectivo" ${membresia && membresia.metodo_pago === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
            <option value="Tarjeta" ${membresia && membresia.metodo_pago === 'Tarjeta' ? 'selected' : ''}>Tarjeta Débito/Crédito</option>
            <option value="Transferencia" ${membresia && membresia.metodo_pago === 'Transferencia' ? 'selected' : ''}>Transferencia / Nequi / Daviplata</option>
          </select>
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="memEstado" class="form-control">
            <option value="activa" ${membresia && membresia.estado === 'activa' ? 'selected' : ''}>Activa</option>
            <option value="vencida" ${membresia && membresia.estado === 'vencida' ? 'selected' : ''}>Vencida</option>
            <option value="cancelada" ${membresia && membresia.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
          </select>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top:1rem; width:100%;">
        ${esEdicion ? 'Actualizar Membresía' : 'Guardar Membresía'}
      </button>
    </form>
  `;
  abrirModal();
}

async function guardarMembresia(e, id) {
  e.preventDefault();
  const datos = {
    id_cliente: parseInt(document.getElementById('memCliente').value),
    tipo: document.getElementById('memTipo').value,
    precio: parseFloat(document.getElementById('memPrecio').value),
    fecha_inicio: document.getElementById('memFechaInicio').value,
    fecha_fin: document.getElementById('memFechaFin').value,
    metodo_pago: document.getElementById('memMetodoPago').value,
    estado: document.getElementById('memEstado').value
  };

  const url = id ? `/membresias/${id}` : '/membresias';
  const method = id ? 'PUT' : 'POST';

  const res = await Auth.fetchApi(url, {
    method,
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    alert(res.mensaje);
    cerrarModal();
    cargarMembresias();
  } else {
    alert(res.mensaje || 'Error al guardar membresía.');
  }
}

async function eliminarMembresia(id) {
  if (confirm('¿Está seguro de eliminar esta membresía?')) {
    const res = await Auth.fetchApi(`/membresias/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert(res.mensaje);
      cargarMembresias();
    } else {
      alert(res.mensaje || 'Error al eliminar membresía.');
    }
  }
}

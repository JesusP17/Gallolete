// Módulo de Gestión de Pagos

let pagosData = [];

async function cargarPagos() {
  const res = await Auth.fetchApi('/pagos');
  if (res.ok) {
    pagosData = res.pagos;
    renderizarPagos(pagosData);
  }
}

function renderizarPagos(lista) {
  const tbody = document.getElementById('tablePagos');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay pagos registrados.</td></tr>';
    return;
  }

  lista.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.cliente_nombre || 'Cliente'}</strong></td>
      <td>${p.membresia_tipo || 'General'}</td>
      <td>${p.fecha_pago ? p.fecha_pago.replace('T', ' ').substring(0, 16) : ''}</td>
      <td style="color:var(--success); font-weight:bold;">$${parseFloat(p.valor).toLocaleString('es-CO')}</td>
      <td>${p.metodo_pago}</td>
      <td><small>${p.referencia || '-'}</small></td>
    `;
    tbody.appendChild(tr);
  });
}

async function abrirModalPago() {
  const [resClientes, resMembresias] = await Promise.all([
    Auth.fetchApi('/clientes'),
    Auth.fetchApi('/membresias')
  ]);

  const clientes = resClientes.ok ? resClientes.clientes : [];
  const membresias = resMembresias.ok ? resMembresias.membresias : [];

  const optClientes = clientes.map(c => 
    `<option value="${c.id_cliente}">${c.nombre} ${c.apellido}</option>`
  ).join('');

  const optMembresias = membresias.map(m => 
    `<option value="${m.id_membresia}">${m.cliente_nombre} - ${m.tipo} ($${m.precio})</option>`
  ).join('');

  document.getElementById('modalTitle').innerText = 'Registrar Nuevo Pago';
  document.getElementById('modalBody').innerHTML = `
    <form id="formPago" onsubmit="guardarPago(event)">
      <div class="form-group">
        <label>Cliente *</label>
        <select id="pagCliente" class="form-control" required>
          <option value="">Seleccione un cliente...</option>
          ${optClientes}
        </select>
      </div>
      <div class="form-group">
        <label>Membresía Asociada (Opcional)</label>
        <select id="pagMembresia" class="form-control">
          <option value="">Ninguna / Pago Varios</option>
          ${optMembresias}
        </select>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Valor ($) *</label>
          <input type="number" id="pagValor" class="form-control" placeholder="100000" required>
        </div>
        <div class="form-group">
          <label>Método de Pago *</label>
          <select id="pagMetodo" class="form-control" required>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta Débito/Crédito</option>
            <option value="Transferencia">Transferencia / Nequi / Daviplata</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Número de Referencia / Comprobante</label>
        <input type="text" id="pagReferencia" class="form-control" placeholder="Ej: REF-987654">
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top:1rem; width:100%;">Registrar Pago</button>
    </form>
  `;
  abrirModal();
}

async function guardarPago(e) {
  e.preventDefault();
  const idMembresiaVal = document.getElementById('pagMembresia').value;
  const datos = {
    id_cliente: parseInt(document.getElementById('pagCliente').value),
    id_membresia: idMembresiaVal ? parseInt(idMembresiaVal) : null,
    valor: parseFloat(document.getElementById('pagValor').value),
    metodo_pago: document.getElementById('pagMetodo').value,
    referencia: document.getElementById('pagReferencia').value
  };

  const res = await Auth.fetchApi('/pagos', {
    method: 'POST',
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    alert(res.mensaje);
    cerrarModal();
    cargarPagos();
  } else {
    alert(res.mensaje || 'Error al registrar pago.');
  }
}

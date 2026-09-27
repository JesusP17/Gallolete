// Módulo de Gestión de Membresías

let membresiasData = [];
let currentImagenBase64 = null;

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
    
    const imgHtml = m.imagen 
      ? `<img src="${m.imagen}" alt="${m.tipo}" style="width:48px; height:48px; object-fit:cover; border-radius:8px; border:1px solid #ddd; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">` 
      : `<div style="width:48px; height:48px; border-radius:8px; background:linear-gradient(135deg, #e63946, #457b9d); display:flex; align-items:center; justify-content:center; color:white; font-size:1.3rem;">🏋️‍♂️</div>`;

    const clienteInfo = m.cliente_nombre 
      ? `<strong>${m.cliente_nombre}</strong>`
      : `<span style="color:#777; font-style:italic;">General / Sin Cliente</span>`;

    const metodoPagoBadge = m.metodo_pago && m.metodo_pago !== 'Pendiente'
      ? `<span class="badge" style="background:#e8f5e9; color:#2e7d32; font-size:0.75rem;">${m.metodo_pago}</span>`
      : `<span class="badge" style="background:#fff3e0; color:#e65100; font-size:0.75rem;">Pendiente</span>`;

    tr.innerHTML = `
      <td>${imgHtml}</td>
      <td>${clienteInfo}</td>
      <td><strong>${m.tipo}</strong></td>
      <td>${m.fecha_inicio ? m.fecha_inicio.substring(0,10) : ''}</td>
      <td>${m.fecha_fin ? m.fecha_fin.substring(0,10) : ''}</td>
      <td><strong style="color:var(--primary-color);">$${parseFloat(m.precio).toLocaleString('es-CO')}</strong><br>${metodoPagoBadge}</td>
      <td><span class="badge badge-${m.estado}">${m.estado}</span></td>
      <td>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
          <button class="btn btn-success btn-sm" onclick="abrirModalPagarMembresia(${m.id_membresia})" title="Pagar Membresía">💳 Pagar</button>
          <button class="btn btn-secondary btn-sm" onclick="abrirModalMembresia(${m.id_membresia})" title="Editar Membresía">✏️ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarMembresia(${m.id_membresia})" title="Eliminar Membresía">🗑️</button>
        </div>
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

function previewImagenMembresia(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    currentImagenBase64 = evt.target.result;
    const imgPreview = document.getElementById('memImagenPreview');
    if (imgPreview) {
      imgPreview.src = currentImagenBase64;
      imgPreview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

async function abrirModalMembresia(id = null) {
  const membresia = id ? membresiasData.find(m => m.id_membresia === id) : null;
  const esEdicion = !!membresia;
  currentImagenBase64 = membresia ? (membresia.imagen || null) : null;

  // Fecha fin por defecto (1 mes después)
  const hoy = new Date();
  const unMesDespues = new Date();
  unMesDespues.setMonth(hoy.getMonth() + 1);

  const fechaInicioDefault = hoy.toISOString().substring(0, 10);
  const fechaFinDefault = unMesDespues.toISOString().substring(0, 10);

  document.getElementById('modalTitle').innerText = esEdicion ? 'Editar Membresía' : 'Crear Nueva Membresía';
  document.getElementById('modalBody').innerHTML = `
    <form id="formMembresia" onsubmit="guardarMembresia(event, ${id})">
      
      <!-- Carga de Imagen de Membresía -->
      <div class="form-group">
        <label>Imagen Ilustrativa de la Membresía</label>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <input type="file" id="memImagenFile" class="form-control" accept="image/*" onchange="previewImagenMembresia(event)">
          <img id="memImagenPreview" src="${currentImagenBase64 || ''}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; ${currentImagenBase64 ? '' : 'display:none;'}">
        </div>
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
          <input type="date" id="memFechaInicio" class="form-control" value="${membresia && membresia.fecha_inicio ? membresia.fecha_inicio.substring(0,10) : fechaInicioDefault}" required>
        </div>
        <div class="form-group">
          <label>Fecha Fin *</label>
          <input type="date" id="memFechaFin" class="form-control" value="${membresia && membresia.fecha_fin ? membresia.fecha_fin.substring(0,10) : fechaFinDefault}" required>
        </div>
      </div>

      <div class="form-group">
        <label>Estado</label>
        <select id="memEstado" class="form-control">
          <option value="activa" ${membresia && membresia.estado === 'activa' ? 'selected' : ''}>Activa</option>
          <option value="vencida" ${membresia && membresia.estado === 'vencida' ? 'selected' : ''}>Vencida</option>
          <option value="cancelada" ${membresia && membresia.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
        </select>
      </div>

      <button type="submit" class="btn btn-primary" style="margin-top:1rem; width:100%;">
        ${esEdicion ? 'Actualizar Membresía' : 'Crear Membresía'}
      </button>
    </form>
  `;
  abrirModal();
}

async function guardarMembresia(e, id) {
  e.preventDefault();
  
  const user = Auth.getUser();
  const idClienteAuto = (user && user.id_cliente) ? user.id_cliente : null;

  const datos = {
    id_cliente: idClienteAuto,
    tipo: document.getElementById('memTipo').value,
    precio: parseFloat(document.getElementById('memPrecio').value),
    fecha_inicio: document.getElementById('memFechaInicio').value,
    fecha_fin: document.getElementById('memFechaFin').value,
    estado: document.getElementById('memEstado').value,
    imagen: currentImagenBase64
  };

  const url = id ? `/membresias/${id}` : '/membresias';
  const method = id ? 'PUT' : 'POST';

  const res = await Auth.fetchApi(url, {
    method,
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    cerrarModal();
    await cargarMembresias();

    const idMembresiaCreada = id || (res.membresia ? res.membresia.id_membresia : null);

    if (!id && idMembresiaCreada) {
      // Inmediatamente dar opción de pago para la nueva membresía creada
      mostrarModalNotificacion({
        titulo: '¡Membresía Creada!',
        mensaje: 'La nueva membresía se ha registrado exitosamente. A continuación se abre la opción para realizar el pago.',
        tipo: 'exito'
      });
      setTimeout(() => {
        abrirModalPagarMembresia(idMembresiaCreada);
      }, 600);
    } else {
      mostrarModalNotificacion({
        titulo: 'Membresía Guardada',
        mensaje: res.mensaje || 'Información de la membresía actualizada con éxito.',
        tipo: 'exito'
      });
    }
  } else {
    mostrarModalNotificacion({
      titulo: 'Error',
      mensaje: res.mensaje || 'Error al guardar la membresía.',
      tipo: 'error'
    });
  }
}

function abrirModalPagarMembresia(id_membresia) {
  const m = membresiasData.find(item => item.id_membresia === id_membresia);
  if (!m) return alert('Membresía no encontrada.');

  const imgHtml = m.imagen 
    ? `<img src="${m.imagen}" style="width:70px; height:70px; object-fit:cover; border-radius:10px; border:2px solid var(--primary-color);">`
    : `<div style="width:70px; height:70px; border-radius:10px; background:linear-gradient(135deg, #e63946, #457b9d); display:flex; align-items:center; justify-content:center; color:white; font-size:2rem;">🏋️‍♂️</div>`;

  document.getElementById('modalTitle').innerText = '💳 Realizar Pago de Membresía';
  document.getElementById('modalBody').innerHTML = `
    <div style="background:#f8f9fa; border-radius:10px; padding:1rem; display:flex; gap:1rem; align-items:center; margin-bottom:1.2rem; border:1px solid #e9ecef;">
      ${imgHtml}
      <div>
        <h4 style="margin:0; color:var(--dark-bg); font-size:1.1rem;">${m.tipo}</h4>
        <p style="margin:0.2rem 0; font-size:0.9rem; color:#555;">Cliente: <strong>${m.cliente_nombre || 'Cliente General'}</strong></p>
        <span style="font-size:1.2rem; font-weight:bold; color:var(--primary-color);">$${parseFloat(m.precio).toLocaleString('es-CO')}</span>
      </div>
    </div>

    <form id="formPagarMembresia" onsubmit="confirmarPagoMembresia(event, ${m.id_membresia}, ${m.id_cliente || 'null'}, ${m.precio})">
      <div class="form-group">
        <label>Seleccione el Método de Pago *</label>
        <select id="pagMetodoSeleccionado" class="form-control" required>
          <option value="Efectivo">💵 Efectivo</option>
          <option value="Tarjeta">💳 Tarjeta Débito / Crédito</option>
          <option value="Transferencia">📲 Transferencia / Nequi / Daviplata</option>
        </select>
      </div>

      <div class="form-group">
        <label>Número de Referencia / Comprobante (Opcional)</label>
        <input type="text" id="pagReferenciaPago" class="form-control" placeholder="Ej: REF-987654321">
      </div>

      <div style="display:flex; gap:1rem; margin-top:1.5rem;">
        <button type="button" class="btn btn-secondary" style="flex:1;" onclick="cerrarModal()">Cancelar</button>
        <button type="submit" class="btn btn-success" style="flex:2; padding:0.7rem;">💰 Confirmar Pago ($${parseFloat(m.precio).toLocaleString('es-CO')})</button>
      </div>
    </form>
  `;
  abrirModal();
}

async function confirmarPagoMembresia(e, id_membresia, id_cliente, valor) {
  e.preventDefault();
  
  const metodo_pago = document.getElementById('pagMetodoSeleccionado').value;
  const referencia = document.getElementById('pagReferenciaPago').value;

  const user = Auth.getUser();
  const idClienteFinal = id_cliente || (user ? user.id_cliente : null) || 1;

  // 1. Registrar el Pago en la tabla de pagos
  const resPago = await Auth.fetchApi('/pagos', {
    method: 'POST',
    body: JSON.stringify({
      id_cliente: idClienteFinal,
      id_membresia: id_membresia,
      valor: valor,
      metodo_pago: metodo_pago,
      referencia: referencia || 'PAGO-DIRECTO'
    })
  });

  if (resPago.ok) {
    // 2. Actualizar el Método de Pago y Estado en la membresía
    const mActual = membresiasData.find(item => item.id_membresia === id_membresia);
    if (mActual) {
      await Auth.fetchApi(`/membresias/${id_membresia}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...mActual,
          metodo_pago: metodo_pago,
          estado: 'activa'
        })
      });
    }

    cerrarModal();
    await cargarMembresias();

    mostrarModalNotificacion({
      titulo: '¡Pago Exitoso!',
      mensaje: `Se ha registrado el pago de $${parseFloat(valor).toLocaleString('es-CO')} vía ${metodo_pago} correctamente.`,
      tipo: 'exito'
    });
  } else {
    mostrarModalNotificacion({
      titulo: 'Error',
      mensaje: resPago.mensaje || 'Error al procesar el pago de la membresía.',
      tipo: 'error'
    });
  }
}

async function eliminarMembresia(id) {
  mostrarModalConfirmacion({
    titulo: 'Eliminar Membresía',
    mensaje: '¿Está seguro de eliminar permanentemente esta membresía?',
    textoBoton: 'Sí, eliminar',
    claseBoton: 'btn-danger',
    onConfirm: async () => {
      const res = await Auth.fetchApi(`/membresias/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarModalNotificacion({
          titulo: 'Membresía Eliminada',
          mensaje: res.mensaje || 'La membresía ha sido eliminada correctamente.',
          tipo: 'exito'
        });
        cargarMembresias();
      } else {
        mostrarModalNotificacion({
          titulo: 'Error',
          mensaje: res.mensaje || 'Error al eliminar membresía.',
          tipo: 'error'
        });
      }
    }
  });
}

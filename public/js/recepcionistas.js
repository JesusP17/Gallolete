// Módulo de Gestión de Recepcionistas (Administrador)

let recepcionistasData = [];

async function cargarRecepcionistas() {
  const res = await Auth.fetchApi('/usuarios');
  if (res.ok) {
    recepcionistasData = res.usuarios.filter(u => u.rol === 'Recepcionista');
    renderizarRecepcionistas(recepcionistasData);
  } else {
    document.getElementById('tableRecepcionistas').innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">${res.mensaje || 'Error al cargar recepcionistas.'}</td></tr>`;
  }
}

function renderizarRecepcionistas(lista) {
  const tbody = document.getElementById('tableRecepcionistas');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay recepcionistas registrados.</td></tr>';
    return;
  }

  lista.forEach(u => {
    const esActivo = u.estado === 'activo';
    const btnEstadoText = esActivo ? '🚫 Deshabilitar' : '✅ Activar';
    const btnEstadoClass = esActivo ? 'btn-secondary' : 'btn-primary';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.nombre_usuario}</strong></td>
      <td>${u.correo}</td>
      <td><span class="badge" style="background:#e8eaf6; color:#283593;">${u.rol}</span></td>
      <td><span class="badge badge-${u.estado}">${u.estado}</span></td>
      <td>
        <button class="btn ${btnEstadoClass} btn-sm" onclick="cambiarEstadoRecepcionista(${u.id_usuario}, '${u.estado}', '${u.nombre_usuario}')">${btnEstadoText}</button>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalRecepcionista(${u.id_usuario})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarRecepcionista(${u.id_usuario}, '${u.nombre_usuario}')">🗑️ Quitar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalRecepcionista(id = null) {
  const recep = id ? recepcionistasData.find(u => u.id_usuario === id) : null;
  const esEdicion = !!recep;

  document.getElementById('modalTitle').innerText = esEdicion ? 'Editar Recepcionista' : 'Nuevo Recepcionista';
  document.getElementById('modalBody').innerHTML = `
    <form id="formRecepcionista" onsubmit="guardarRecepcionista(event, ${id})">
      <div class="grid-2">
        <div class="form-group">
          <label>Nombre de Usuario *</label>
          <input type="text" id="recUsuario" class="form-control" value="${recep ? recep.nombre_usuario : ''}" required>
        </div>
        <div class="form-group">
          <label>Correo Electrónico *</label>
          <input type="email" id="recCorreo" class="form-control" value="${recep ? recep.correo : ''}" required>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Contraseña ${esEdicion ? '(Opcional)' : '*'}</label>
          <input type="password" id="recPassword" class="form-control" ${esEdicion ? '' : 'required'} minlength="8" placeholder="••••••••">
        </div>
        <div class="form-group">
          <label>Estado</label>
          <select id="recEstado" class="form-control">
            <option value="activo" ${recep && recep.estado === 'activo' ? 'selected' : ''}>Activo</option>
            <option value="inactivo" ${recep && recep.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
          </select>
        </div>
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top:1rem; width:100%;">
        ${esEdicion ? 'Actualizar Recepcionista' : 'Guardar Recepcionista'}
      </button>
    </form>
  `;
  abrirModal();
}

async function guardarRecepcionista(e, id) {
  e.preventDefault();
  const passwordVal = document.getElementById('recPassword').value;

  const datos = {
    nombre_usuario: document.getElementById('recUsuario').value,
    correo: document.getElementById('recCorreo').value,
    rol: 'Recepcionista',
    estado: document.getElementById('recEstado').value
  };

  if (passwordVal) {
    datos.password = passwordVal;
  }

  const url = id ? `/usuarios/${id}` : '/usuarios';
  const method = id ? 'PUT' : 'POST';

  const res = await Auth.fetchApi(url, {
    method,
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    cerrarModal();
    mostrarModalNotificacion({
      titulo: id ? 'Recepcionista Actualizado' : 'Recepcionista Creado',
      mensaje: res.mensaje || 'Información de recepcionista guardada con éxito.',
      tipo: 'exito'
    });
    cargarRecepcionistas();
  } else {
    mostrarModalNotificacion({
      titulo: 'Error',
      mensaje: res.mensaje || 'Error al guardar recepcionista.',
      tipo: 'error'
    });
  }
}

function cambiarEstadoRecepcionista(id, estadoActual, nombreUsuario) {
  const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
  const accion = nuevoEstado === 'inactivo' ? 'deshabilitar' : 'activar';

  mostrarModalConfirmacion({
    titulo: `Confirmar ${accion.toUpperCase()}`,
    mensaje: `¿Está seguro de que desea ${accion} al recepcionista "${nombreUsuario}"?`,
    textoBoton: `Sí, ${accion}`,
    claseBoton: nuevoEstado === 'inactivo' ? 'btn-danger' : 'btn-primary',
    onConfirm: async () => {
      const recep = recepcionistasData.find(u => u.id_usuario === id);
      if (!recep) return;

      const res = await Auth.fetchApi(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...recep, estado: nuevoEstado })
      });

      if (res.ok) {
        mostrarModalNotificacion({
          titulo: 'Estado Actualizado',
          mensaje: `El recepcionista "${nombreUsuario}" ha sido ${nuevoEstado === 'inactivo' ? 'deshabilitado' : 'activado'}.`,
          tipo: 'exito'
        });
        cargarRecepcionistas();
      } else {
        mostrarModalNotificacion({
          titulo: 'Error',
          mensaje: res.mensaje || 'No se pudo cambiar el estado del recepcionista.',
          tipo: 'error'
        });
      }
    }
  });
}

function eliminarRecepcionista(id, nombreUsuario) {
  mostrarModalConfirmacion({
    titulo: 'Quitar Recepcionista',
    mensaje: `¿Está seguro de quitar al recepcionista "${nombreUsuario}"?`,
    textoBoton: 'Sí, quitar',
    claseBoton: 'btn-danger',
    onConfirm: async () => {
      const res = await Auth.fetchApi(`/usuarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarModalNotificacion({
          titulo: 'Recepcionista Eliminado',
          mensaje: `El recepcionista "${nombreUsuario}" fue eliminado con éxito.`,
          tipo: 'exito'
        });
        cargarRecepcionistas();
      } else {
        mostrarModalNotificacion({
          titulo: 'Error',
          mensaje: res.mensaje || 'No se pudo eliminar el recepcionista.',
          tipo: 'error'
        });
      }
    }
  });
}

// Módulo de Administración de Usuarios (Solo Administrador)

let usuariosData = [];

async function cargarUsuarios() {
  const res = await Auth.fetchApi('/usuarios');
  if (res.ok) {
    usuariosData = res.usuarios;
    renderizarUsuarios(usuariosData);
  } else {
    document.getElementById('tableUsuarios').innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">${res.mensaje || 'No tiene permisos para ver esta sección.'}</td></tr>`;
  }
}

function renderizarUsuarios(lista) {
  const tbody = document.getElementById('tableUsuarios');
  tbody.innerHTML = '';

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay usuarios registrados.</td></tr>';
    return;
  }

  lista.forEach(u => {
    let vinculoText = '-';
    if (u.rol === 'Cliente' && u.cliente_nombre) {
      vinculoText = `👤 Cliente: <strong>${u.cliente_nombre}</strong>`;
    } else if (u.rol === 'Entrenador' && u.entrenador_nombre) {
      vinculoText = `🏋️ Entrenador: <strong>${u.entrenador_nombre}</strong>`;
    }

    const esActivo = u.estado === 'activo';
    const btnEstadoText = esActivo ? '🚫 Deshabilitar' : '✅ Activar';
    const btnEstadoClass = esActivo ? 'btn-secondary' : 'btn-primary';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.nombre_usuario}</strong></td>
      <td>${u.correo}</td>
      <td><span class="badge" style="background:#e8eaf6; color:#283593;">${u.rol}</span></td>
      <td>${vinculoText}</td>
      <td><span class="badge badge-${u.estado}">${u.estado}</span></td>
      <td>
        <button class="btn ${btnEstadoClass} btn-sm" onclick="cambiarEstadoUsuario(${u.id_usuario}, '${u.estado}', '${u.nombre_usuario}')">${btnEstadoText}</button>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalUsuario(${u.id_usuario})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id_usuario}, '${u.nombre_usuario}')">🗑️ Quitar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function abrirModalUsuario(id = null) {
  const usuario = id ? usuariosData.find(u => u.id_usuario === id) : null;
  const esEdicion = !!usuario;

  const [resClientes, resEntrenadores] = await Promise.all([
    Auth.fetchApi('/clientes'),
    Auth.fetchApi('/entrenadores')
  ]);

  const clientes = resClientes.ok ? resClientes.clientes : [];
  const entrenadores = resEntrenadores.ok ? resEntrenadores.entrenadores : [];

  const optClientes = clientes.map(c => 
    `<option value="${c.id_cliente}" ${usuario && usuario.id_cliente === c.id_cliente ? 'selected' : ''}>${c.nombre} ${c.apellido} (Doc: ${c.documento})</option>`
  ).join('');

  const optEntrenadores = entrenadores.map(e => 
    `<option value="${e.id_entrenador}" ${usuario && usuario.id_entrenador === e.id_entrenador ? 'selected' : ''}>${e.nombre} ${e.apellido} (Doc: ${e.documento})</option>`
  ).join('');

  document.getElementById('modalTitle').innerText = esEdicion ? 'Editar Usuario' : 'Nuevo Usuario';
  document.getElementById('modalBody').innerHTML = `
    <form id="formUsuario" onsubmit="guardarUsuario(event, ${id})">
      <div class="grid-2">
        <div class="form-group">
          <label>Nombre de Usuario *</label>
          <input type="text" id="usrNombre" class="form-control" value="${usuario ? usuario.nombre_usuario : ''}" required>
        </div>
        <div class="form-group">
          <label>Correo Electrónico *</label>
          <input type="email" id="usrCorreo" class="form-control" value="${usuario ? usuario.correo : ''}" required>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Contraseña ${esEdicion ? '(Dejar vacía para mantener)' : '*'}</label>
          <input type="password" id="usrPassword" class="form-control" ${esEdicion ? '' : 'required'}>
        </div>
        <div class="form-group">
          <label>Rol de Usuario *</label>
          <select id="usrRol" class="form-control" onchange="toggleVinculoCampos()" required>
            <option value="Administrador" ${usuario && usuario.rol === 'Administrador' ? 'selected' : ''}>Administrador</option>
            <option value="Entrenador" ${usuario && usuario.rol === 'Entrenador' ? 'selected' : ''}>Entrenador</option>
            <option value="Recepcionista" ${usuario && usuario.rol === 'Recepcionista' ? 'selected' : ''}>Recepcionista</option>
            <option value="Cliente" ${usuario && usuario.rol === 'Cliente' ? 'selected' : ''}>Cliente</option>
          </select>
        </div>
      </div>
      <div class="form-group" id="groupCliente" style="display:none;">
        <label>Vincular a Perfil de Cliente *</label>
        <select id="usrCliente" class="form-control">
          <option value="">Seleccione el cliente correspondiente...</option>
          ${optClientes}
        </select>
      </div>
      <div class="form-group" id="groupEntrenador" style="display:none;">
        <label>Vincular a Perfil de Entrenador *</label>
        <select id="usrEntrenador" class="form-control">
          <option value="">Seleccione el entrenador correspondiente...</option>
          ${optEntrenadores}
        </select>
      </div>
      <div class="form-group">
        <label>Estado</label>
        <select id="usrEstado" class="form-control">
          <option value="activo" ${usuario && usuario.estado === 'activo' ? 'selected' : ''}>Activo</option>
          <option value="inactivo" ${usuario && usuario.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" style="margin-top:1rem; width:100%;">
        ${esEdicion ? 'Actualizar Usuario' : 'Guardar Usuario'}
      </button>
    </form>
  `;

  toggleVinculoCampos();
  abrirModal();
}

function toggleVinculoCampos() {
  const rol = document.getElementById('usrRol').value;
  const groupCliente = document.getElementById('groupCliente');
  const groupEntrenador = document.getElementById('groupEntrenador');

  if (rol === 'Cliente') {
    groupCliente.style.display = 'block';
    groupEntrenador.style.display = 'none';
  } else if (rol === 'Entrenador') {
    groupCliente.style.display = 'none';
    groupEntrenador.style.display = 'block';
  } else {
    groupCliente.style.display = 'none';
    groupEntrenador.style.display = 'none';
  }
}

async function guardarUsuario(e, id) {
  e.preventDefault();
  const rol = document.getElementById('usrRol').value;
  const id_cliente_val = document.getElementById('usrCliente').value;
  const id_entrenador_val = document.getElementById('usrEntrenador').value;

  const datos = {
    nombre_usuario: document.getElementById('usrNombre').value,
    correo: document.getElementById('usrCorreo').value,
    password: document.getElementById('usrPassword').value,
    rol,
    id_cliente: rol === 'Cliente' && id_cliente_val ? parseInt(id_cliente_val) : null,
    id_entrenador: rol === 'Entrenador' && id_entrenador_val ? parseInt(id_entrenador_val) : null,
    estado: document.getElementById('usrEstado').value
  };

  const url = id ? `/usuarios/${id}` : '/usuarios';
  const method = id ? 'PUT' : 'POST';

  const res = await Auth.fetchApi(url, {
    method,
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    cerrarModal();
    mostrarModalNotificacion({
      titulo: id ? 'Usuario Actualizado' : 'Usuario Creado',
      mensaje: res.mensaje || 'Información de usuario guardada correctamente.',
      tipo: 'exito'
    });
    cargarUsuarios();
  } else {
    mostrarModalNotificacion({
      titulo: 'Error',
      mensaje: res.mensaje || 'Error al guardar usuario.',
      tipo: 'error'
    });
  }
}

function cambiarEstadoUsuario(id, estadoActual, nombreUsuario) {
  const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
  const accion = nuevoEstado === 'inactivo' ? 'deshabilitar' : 'activar';

  mostrarModalConfirmacion({
    titulo: `Confirmar ${accion.toUpperCase()}`,
    mensaje: `¿Está seguro de que desea ${accion} la cuenta de usuario "${nombreUsuario}"?`,
    textoBoton: `Sí, ${accion}`,
    claseBoton: nuevoEstado === 'inactivo' ? 'btn-danger' : 'btn-primary',
    onConfirm: async () => {
      const usr = usuariosData.find(u => u.id_usuario === id);
      if (!usr) return;

      const res = await Auth.fetchApi(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre_usuario: usr.nombre_usuario,
          correo: usr.correo,
          rol: usr.rol,
          id_cliente: usr.id_cliente,
          id_entrenador: usr.id_entrenador,
          estado: nuevoEstado
        })
      });

      if (res.ok) {
        mostrarModalNotificacion({
          titulo: 'Estado Actualizado',
          mensaje: `La cuenta "${nombreUsuario}" ha sido ${nuevoEstado === 'inactivo' ? 'deshabilitada' : 'activada'} correctamente.`,
          tipo: 'exito'
        });
        cargarUsuarios();
      } else {
        mostrarModalNotificacion({
          titulo: 'Error',
          mensaje: res.mensaje || 'No se pudo cambiar el estado de la cuenta.',
          tipo: 'error'
        });
      }
    }
  });
}

function eliminarUsuario(id, nombreUsuario) {
  mostrarModalConfirmacion({
    titulo: 'Quitar Cuenta de Usuario',
    mensaje: `¿Está seguro de que desea quitar permanentemente la cuenta de "${nombreUsuario}" del sistema? Esta acción no se puede deshacer.`,
    textoBoton: 'Sí, quitar cuenta',
    claseBoton: 'btn-danger',
    onConfirm: async () => {
      const res = await Auth.fetchApi(`/usuarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarModalNotificacion({
          titulo: 'Usuario Eliminado',
          mensaje: `La cuenta de usuario "${nombreUsuario}" ha sido eliminada con éxito.`,
          tipo: 'exito'
        });
        cargarUsuarios();
      } else {
        mostrarModalNotificacion({
          titulo: 'Error',
          mensaje: res.mensaje || 'Error al quitar usuario.',
          tipo: 'error'
        });
      }
    }
  });
}

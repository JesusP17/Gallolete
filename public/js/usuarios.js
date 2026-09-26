// Módulo de Administración de Usuarios (Solo Administrador)

let usuariosData = [];

async function cargarUsuarios() {
  const res = await Auth.fetchApi('/usuarios');
  if (res.ok) {
    usuariosData = res.usuarios;
    renderizarUsuarios(usuariosData);
  } else {
    document.getElementById('tableUsuarios').innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">${res.mensaje || 'No tiene permisos para ver esta sección.'}</td></tr>`;
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
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#${u.id_usuario}</td>
      <td><strong>${u.nombre_usuario}</strong></td>
      <td>${u.correo}</td>
      <td><span class="badge" style="background:#e8eaf6; color:#283593;">${u.rol}</span></td>
      <td><span class="badge badge-${u.estado}">${u.estado}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="abrirModalUsuario(${u.id_usuario})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id_usuario})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function abrirModalUsuario(id = null) {
  const usuario = id ? usuariosData.find(u => u.id_usuario === id) : null;
  const esEdicion = !!usuario;

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
          <select id="usrRol" class="form-control" required>
            <option value="Administrador" ${usuario && usuario.rol === 'Administrador' ? 'selected' : ''}>Administrador</option>
            <option value="Entrenador" ${usuario && usuario.rol === 'Entrenador' ? 'selected' : ''}>Entrenador</option>
            <option value="Recepcionista" ${usuario && usuario.rol === 'Recepcionista' ? 'selected' : ''}>Recepcionista</option>
          </select>
        </div>
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
  abrirModal();
}

async function guardarUsuario(e, id) {
  e.preventDefault();
  const datos = {
    nombre_usuario: document.getElementById('usrNombre').value,
    correo: document.getElementById('usrCorreo').value,
    password: document.getElementById('usrPassword').value,
    rol: document.getElementById('usrRol').value,
    estado: document.getElementById('usrEstado').value
  };

  const url = id ? `/usuarios/${id}` : '/usuarios';
  const method = id ? 'PUT' : 'POST';

  const res = await Auth.fetchApi(url, {
    method,
    body: JSON.stringify(datos)
  });

  if (res.ok) {
    alert(res.mensaje);
    cerrarModal();
    cargarUsuarios();
  } else {
    alert(res.mensaje || 'Error al guardar usuario.');
  }
}

async function eliminarUsuario(id) {
  if (confirm('¿Está seguro de eliminar este usuario del sistema?')) {
    const res = await Auth.fetchApi(`/usuarios/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert(res.mensaje);
      cargarUsuarios();
    } else {
      alert(res.mensaje || 'Error al eliminar usuario.');
    }
  }
}

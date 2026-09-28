// Módulo Principal de Navegación, Dashboards por Rol y Modales

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  initTheme();
  mostrarLandingView();

  // Login Form Event Listener
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('loginUsuario').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password })
    });

    const data = await res.json();
    if (data.ok) {
      Auth.setSession(data.token, data.usuario);
      errorDiv.classList.add('hidden');
      mostrarAppLayout();
    } else {
      errorDiv.innerText = data.mensaje || 'Credenciales incorrectas.';
      errorDiv.classList.remove('hidden');
    }
  });

  // Register Form Event Listener
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombreCompleto = document.getElementById('regNombreCompleto').value.trim();
    const correo = document.getElementById('regCorreo').value.trim();
    const password = document.getElementById('regPassword').value;
    const nombre_usuario = document.getElementById('regUsuario').value.trim();

    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.add('hidden');

    if (!nombreCompleto) {
      errorDiv.innerText = 'Debe ingresar nombre y apellido.';
      errorDiv.classList.remove('hidden');
      return;
    }

    const partes = nombreCompleto.split(/\s+/);
    const nombre = (partes[0] || '').substring(0, 30);
    const apellido = (partes.slice(1).join(' ') || partes[0] || '').substring(0, 30);

    if (correo.length > 70) {
      errorDiv.innerText = 'El correo electrónico no puede superar los 70 caracteres.';
      errorDiv.classList.remove('hidden');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo) || !correo.includes('@') || !correo.includes('.')) {
      errorDiv.innerText = 'El correo debe incluir "@" y un punto "." con un dominio válido (ej: usuario@correo.com).';
      errorDiv.classList.remove('hidden');
      return;
    }

    if (password.length < 8 || password.length > 12) {
      errorDiv.innerText = 'La contraseña debe tener un mínimo de 8 caracteres y un máximo de 12.';
      errorDiv.classList.remove('hidden');
      return;
    }

    if (nombre_usuario.length > 30) {
      errorDiv.innerText = 'El nombre de usuario no puede superar los 30 caracteres.';
      errorDiv.classList.remove('hidden');
      return;
    }

    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_completo: nombreCompleto,
        nombre,
        apellido,
        correo,
        password,
        nombre_usuario
      })
    });

    const data = await res.json();
    if (data.ok) {
      Auth.setSession(data.token, data.usuario);
      mostrarAppLayout();
    } else {
      errorDiv.innerText = data.mensaje || 'Error al registrar el cliente.';
      errorDiv.classList.remove('hidden');
    }
  });

  // Logout Event Listener
  document.getElementById('btnLogout').addEventListener('click', () => {
    Auth.clearSession();
    mostrarLandingView();
  });
}

function mostrarLandingView() {
  document.getElementById('landingView').classList.remove('hidden');
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('appLayout').classList.add('hidden');
  actualizarBotonHeaderLanding();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarLoginView(tab = 'login') {
  document.getElementById('landingView').classList.add('hidden');
  document.getElementById('appLayout').classList.add('hidden');
  document.getElementById('loginView').classList.remove('hidden');
  mostrarAuthTab(tab);
}

function actualizarBotonHeaderLanding() {
  const loggedOutDiv = document.getElementById('landingHeaderLoggedOut');
  const loggedInDiv = document.getElementById('landingHeaderLoggedIn');

  if (Auth.isAuthenticated()) {
    const user = Auth.getUser();
    if (loggedOutDiv) loggedOutDiv.classList.add('hidden');
    if (loggedInDiv) {
      loggedInDiv.classList.remove('hidden');
      const uName = document.getElementById('landingUserNombre');
      const uRole = document.getElementById('landingUserRol');
      const dName = document.getElementById('landingDropdownNombre');
      const dMail = document.getElementById('landingDropdownCorreo');
      if (uName) uName.innerText = user ? user.nombre_usuario : 'Usuario';
      if (uRole) uRole.innerText = user ? user.rol : 'Rol';
      if (dName) dName.innerText = user ? user.nombre_usuario : 'Usuario';
      if (dMail) dMail.innerText = user ? (user.correo || `${user.nombre_usuario}@gallolete.com`) : '';
    }
  } else {
    if (loggedInDiv) loggedInDiv.classList.add('hidden');
    if (loggedOutDiv) loggedOutDiv.classList.remove('hidden');
  }
}

function irAComprarPlan(tipoPlan) {
  if (!Auth.isAuthenticated()) {
    mostrarLoginView('registro');
    mostrarModalNotificacion({
      titulo: `Plan ${tipoPlan}`,
      mensaje: 'Crea tu cuenta de cliente o inicia sesión para adquirir tu plan de membresía.',
      tipo: 'info'
    });
    return;
  }

  const user = Auth.getUser();
  if (user && user.rol === 'Cliente') {
    abrirModalAdquirirPlanCliente(tipoPlan);
  } else {
    mostrarAppLayout();
    cambiarTab('membresias');
    setTimeout(() => {
      abrirModalMembresia();
      const memTipoSelect = document.getElementById('memTipo');
      if (memTipoSelect) memTipoSelect.value = tipoPlan;
    }, 400);
  }
}

function abrirModalAdquirirPlanCliente(tipoPlan) {
  const user = Auth.getUser();
  const idCliente = user ? user.id_cliente : null;

  if (!idCliente) {
    mostrarModalNotificacion({
      titulo: 'Atención',
      mensaje: 'Tu usuario aún no está vinculado a un perfil de cliente. Solicitalo en recepción.',
      tipo: 'error'
    });
    return;
  }

  const precios = {
    'Mensual General': 100000,
    'Mensual VIP': 120000,
    'Trimestral Ahorro': 300000,
    'Trimestral': 300000,
    'Anual Black': 950000,
    'Anual': 950000
  };

  const precio = precios[tipoPlan] || 100000;

  document.getElementById('modalTitle').innerText = `💳 Adquirir Plan ${tipoPlan}`;
  document.getElementById('modalBody').innerHTML = `
    <form id="formAdquirirPlan" onsubmit="confirmarAdquisicionPlan(event, '${tipoPlan}', ${precio})">
      <div style="text-align: center; margin-bottom: 1.2rem;">
        <div style="font-size: 2.8rem; margin-bottom: 0.5rem;">🔥</div>
        <h3 style="color: var(--dark-bg); font-weight: 800;">Plan ${tipoPlan}</h3>
        <p style="font-size: 1.4rem; color: var(--primary-color); font-weight: 900; margin: 0.4rem 0;">
          $${precio.toLocaleString('es-CO')} COP
        </p>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Acceso total a la Sede UniSalamanca Cra 50 #79-155.
        </p>
      </div>

      <div style="margin-bottom: 1.2rem;">
        <label style="display:block; margin-bottom:0.4rem; font-weight:600; color:var(--dark-bg);">Método de Pago</label>
        <select id="planMetodoPago" class="form-control" style="width:100%; padding:0.6rem; border:1px solid #ccc; border-radius:6px;">
          <option value="Tarjeta de Crédito / PSE">💳 Tarjeta de Crédito / PSE</option>
          <option value="Transferencia Nequi / Daviplata">📱 Transferencia Nequi / Daviplata</option>
          <option value="Efectivo en Recepción">💵 Efectivo en Recepción</option>
        </select>
      </div>

      <div style="display:flex; gap:1rem; justify-content:flex-end; margin-top: 1.5rem;">
        <button type="button" class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">🚀 Confirmar y Activar Plan</button>
      </div>
    </form>
  `;

  abrirModal();
}

async function confirmarAdquisicionPlan(e, tipoPlan, precio) {
  e.preventDefault();
  const user = Auth.getUser();
  const idCliente = user ? user.id_cliente : null;
  const metodoPago = document.getElementById('planMetodoPago').value;

  if (!idCliente) return;

  const hoy = new Date();
  const fechaInicio = hoy.toISOString().substring(0, 10);
  
  let dias = 30;
  if (tipoPlan.includes('Trimestral')) dias = 90;
  if (tipoPlan.includes('Anual')) dias = 365;

  const fechaFinObj = new Date(hoy.getTime() + (dias * 24 * 60 * 60 * 1000));
  const fechaFin = fechaFinObj.toISOString().substring(0, 10);

  // 1. Crear Membresía para el Cliente
  const resMem = await Auth.fetchApi('/membresias', {
    method: 'POST',
    body: JSON.stringify({
      id_cliente: idCliente,
      tipo: tipoPlan,
      precio: precio,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      estado: 'activa'
    })
  });

  if (resMem.ok) {
    // 2. Registrar Pago
    const idMembresia = resMem.membresia ? resMem.membresia.id_membresia : null;
    await Auth.fetchApi('/pagos', {
      method: 'POST',
      body: JSON.stringify({
        id_cliente: idCliente,
        id_membresia: idMembresia,
        valor: precio,
        fecha_pago: fechaInicio,
        metodo_pago: metodoPago,
        referencia: `PLAN-${Date.now().toString().slice(-6)}`
      })
    });

    cerrarModal();
    mostrarAppLayout();
    cambiarTab('dashboard-cliente');
    mostrarModalNotificacion({
      titulo: '¡Membresía Activada!',
      mensaje: `Tu plan ${tipoPlan} fue adquirido con éxito. ¡Bienvenido a GalloLeTe!`,
      tipo: 'exito'
    });
  } else {
    mostrarModalNotificacion({
      titulo: 'Error',
      mensaje: resMem.mensaje || 'No se pudo procesar la adquisición del plan.',
      tipo: 'error'
    });
  }
}

function mostrarAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const btnTabLogin = document.getElementById('btnTabLogin');
  const btnTabRegistro = document.getElementById('btnTabRegistro');
  const loginError = document.getElementById('loginError');
  const registerSuccess = document.getElementById('registerSuccess');

  if (loginError) loginError.classList.add('hidden');
  if (registerSuccess) registerSuccess.classList.add('hidden');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    btnTabLogin.classList.remove('btn-secondary');
    btnTabLogin.classList.add('btn-primary');
    btnTabRegistro.classList.remove('btn-primary');
    btnTabRegistro.classList.add('btn-secondary');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    btnTabRegistro.classList.remove('btn-secondary');
    btnTabRegistro.classList.add('btn-primary');
    btnTabLogin.classList.remove('btn-primary');
    btnTabLogin.classList.add('btn-secondary');
  }
}

function mostrarLogin() {
  mostrarLoginView('login');
}

function mostrarAppLayout() {
  const user = Auth.getUser();
  if (!user) return mostrarLoginView('login');

  document.getElementById('userNombre').innerText = user.nombre_usuario;
  document.getElementById('userRol').innerText = user.rol;

  const hName = document.getElementById('headerUserNombre');
  const hRole = document.getElementById('headerUserRol');
  const ddName = document.getElementById('dropdownUserNombre');
  const ddEmail = document.getElementById('dropdownUserCorreo');

  if (hName) hName.innerText = user.nombre_usuario;
  if (hRole) hRole.innerText = user.rol;
  if (ddName) ddName.innerText = user.nombre_usuario;
  if (ddEmail) ddEmail.innerText = user.correo || `${user.nombre_usuario}@gallolete.com`;

  // Construir navegación lateral según el ROL
  construirMenuPorRol(user.rol);

  document.getElementById('landingView').classList.add('hidden');
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('appLayout').classList.remove('hidden');

  // Cargar pestaña por defecto según rol
  if (user.rol === 'Administrador') cambiarTab('dashboard-admin');
  else if (user.rol === 'Entrenador') cambiarTab('dashboard-entrenador');
  else if (user.rol === 'Recepcionista') cambiarTab('dashboard-recepcionista');
  else if (user.rol === 'Cliente') cambiarTab('dashboard-cliente');
}

function construirMenuPorRol(rol) {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';

  let opciones = [];

  if (rol === 'Administrador') {
    opciones = [
      { id: 'dashboard-admin', label: '📊 Dashboard General' },
      { id: 'membresias', label: '💳 Membresías' },
      { id: 'entrenadores', label: '🏋️ Entrenadores' },
      { id: 'recepcionistas', label: '📞 Recepcionistas' },
      { id: 'clientes', label: '👥 Clientes' },
      { id: 'pagos', label: '💰 Pagos' }
    ];
  } else if (rol === 'Entrenador') {
    opciones = [
      { id: 'dashboard-entrenador', label: '📊 Mi Panel Entrenador' },
      { id: 'rutinas', label: '📋 Rutinas de Atletas' },
      { id: 'ejercicios', label: '💪 Base de Ejercicios' },
      { id: 'clientes', label: '👥 Clientes Asignados' }
    ];
  } else if (rol === 'Recepcionista') {
    opciones = [
      { id: 'dashboard-recepcionista', label: '📊 Panel Recepción' },
      { id: 'clientes', label: '👥 Registro de Clientes' },
      { id: 'membresias', label: '💳 Venta de Membresías' },
      { id: 'pagos', label: '💰 Cobros y Caza' }
    ];
  } else if (rol === 'Cliente') {
    opciones = [
      { id: 'dashboard-cliente', label: '🏋️‍♂️ Mi Portal de Atleta' }
    ];
  }

  opciones.forEach(op => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.setAttribute('data-tab', op.id);
    li.innerText = op.label;
    li.addEventListener('click', () => cambiarTab(op.id));
    nav.appendChild(li);
  });
}

function cambiarTab(tab) {
  // Cerrar sidebar en móviles tras seleccionar una pestaña
  const sidebar = document.querySelector('.sidebar');
  const btnSidebar = document.getElementById('btnSidebarBurger');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar && sidebar.classList.contains('active-mobile')) {
    sidebar.classList.remove('active-mobile');
    if (btnSidebar) btnSidebar.classList.remove('active');
    if (backdrop) backdrop.classList.add('hidden');
  }

  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

  const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (navItem) navItem.classList.add('active');

  const contentSection = document.getElementById(`tab-${tab}`);
  if (contentSection) contentSection.classList.remove('hidden');

  const titulos = {
    'dashboard-admin': 'Panel de Administración General',
    'dashboard-entrenador': 'Panel del Entrenador',
    'dashboard-recepcionista': 'Panel de Recepción y Atención',
    'dashboard-cliente': 'Mi Portal GalloLeTe - Zona de Atleta',
    clientes: 'Gestión de Clientes',
    membresias: 'Gestión de Membresías',
    entrenadores: 'Gestión de Entrenadores',
    recepcionistas: 'Gestión de Recepcionistas',
    rutinas: 'Gestión de Rutinas',
    ejercicios: 'Base de Ejercicios',
    pagos: 'Historial de Pagos',
    usuarios: 'Administración de Usuarios'
  };

  document.getElementById('tabTitle').innerText = titulos[tab] || 'GalloLeTe';

  // Cargar datos correspondientes
  switch (tab) {
    case 'dashboard-admin': cargarDashboardAdmin(); break;
    case 'dashboard-entrenador': cargarDashboardEntrenador(); break;
    case 'dashboard-recepcionista': cargarDashboardRecepcionista(); break;
    case 'dashboard-cliente': cargarDashboardCliente(); break;
    case 'clientes': cargarClientes(); break;
    case 'membresias': cargarMembresias(); break;
    case 'entrenadores': cargarEntrenadores(); break;
    case 'recepcionistas': cargarRecepcionistas(); break;
    case 'rutinas': cargarRutinas(); break;
    case 'ejercicios': cargarEjercicios(); break;
    case 'pagos': cargarPagos(); break;
    case 'usuarios': cargarUsuarios(); break;
  }
}

// 1. Cargar Dashboard Administrador
async function cargarDashboardAdmin() {
  const [resCli, resMem, resPag] = await Promise.all([
    Auth.fetchApi('/clientes'),
    Auth.fetchApi('/membresias'),
    Auth.fetchApi('/pagos')
  ]);

  const clientes = resCli.ok ? resCli.clientes : [];
  const membresias = resMem.ok ? resMem.membresias : [];
  const pagos = resPag.ok ? resPag.pagos : [];

  document.getElementById('statAdminClientes').innerText = clientes.length;
  document.getElementById('statAdminMembresiasActivas').innerText = membresias.filter(m => m.estado === 'activa').length;
  document.getElementById('statAdminMembresiasVencidas').innerText = membresias.filter(m => m.estado === 'vencida').length;
  
  const totalIngresos = pagos.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
  document.getElementById('statAdminTotalPagos').innerText = `$${totalIngresos.toLocaleString('es-CO')}`;

  const tbody = document.getElementById('tableAdminDashboard');
  if (tbody) {
    tbody.innerHTML = membresias.slice(0, 5).map(m => `
      <tr>
        <td><strong>${m.cliente_nombre}</strong></td>
        <td>${m.tipo}</td>
        <td>${m.fecha_inicio ? m.fecha_inicio.substring(0,10) : ''}</td>
        <td>${m.fecha_fin ? m.fecha_fin.substring(0,10) : ''}</td>
        <td><span class="badge badge-${m.estado}">${m.estado}</span></td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;">No hay registros.</td></tr>';
  }

  // Cargar gráficos estadísticos de Chart.js y tabla de días pico
  if (typeof cargarGraficosDashboardAdmin === 'function') {
    cargarGraficosDashboardAdmin();
  }
}

// 2. Cargar Dashboard Entrenador
async function cargarDashboardEntrenador() {
  const user = Auth.getUser();
  const idEntrenador = user ? user.id_entrenador : null;

  const [resRut, resEj, resCli] = await Promise.all([
    Auth.fetchApi('/rutinas'),
    Auth.fetchApi('/ejercicios'),
    Auth.fetchApi('/clientes')
  ]);

  let rutinas = resRut.ok ? resRut.rutinas : [];
  const ejercicios = resEj.ok ? resEj.ejercicios : [];
  const clientes = resCli.ok ? resCli.clientes : [];

  if (idEntrenador) {
    rutinas = rutinas.filter(r => r.id_entrenador === idEntrenador);
  }

  document.getElementById('statEntrenadorRutinas').innerText = rutinas.filter(r => r.estado === 'activa').length;
  document.getElementById('statEntrenadorEjercicios').innerText = ejercicios.length;
  document.getElementById('statEntrenadorClientes').innerText = rutinas.length > 0 ? new Set(rutinas.map(r => r.id_cliente)).size : clientes.length;

  // Renderizar Clientes Recientes para Entrenador
  const tbodyNuevosCli = document.getElementById('tableEntrenadorNuevosClientes');
  if (tbodyNuevosCli) {
    tbodyNuevosCli.innerHTML = clientes.slice(0, 5).map(c => `
      <tr>
        <td><strong>${c.nombre} ${c.apellido}</strong></td>
        <td>${c.telefono || '-'}</td>
        <td>${c.correo || '-'}</td>
        <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
        <td><button class="btn btn-primary btn-sm" onclick="cambiarTab('rutinas'); abrirModalRutina();">📋 Asignar Rutina</button></td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;">No hay clientes registrados aún.</td></tr>';
  }

  const tbody = document.getElementById('tableEntrenadorDashboard');
  if (tbody) {
    tbody.innerHTML = rutinas.map(r => `
      <tr>
        <td><strong>${r.nombre_rutina}</strong></td>
        <td>${r.cliente_nombre}</td>
        <td>${r.nivel}</td>
        <td><span class="badge badge-${r.estado}">${r.estado}</span></td>
        <td><button class="btn btn-primary btn-sm" onclick="verDetalleRutina(${r.id_rutina})">💪 Ver Ejercicios</button></td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;">No hay rutinas creadas o asignadas a tu perfil de entrenador.</td></tr>';
  }
}

// 3. Cargar Dashboard Recepcionista
async function cargarDashboardRecepcionista() {
  const [resCli, resMem] = await Promise.all([
    Auth.fetchApi('/clientes'),
    Auth.fetchApi('/membresias')
  ]);

  const clientes = resCli.ok ? resCli.clientes : [];
  const membresias = resMem.ok ? resMem.membresias : [];

  const elActivas = document.getElementById('statRecepActivas');
  const elVencidas = document.getElementById('statRecepVencidas');
  if (elActivas) elActivas.innerText = membresias.filter(m => m.estado === 'activa').length;
  if (elVencidas) elVencidas.innerText = membresias.filter(m => m.estado === 'vencida').length;

  // Cargar Registro de Asistencia en Tiempo Real
  if (typeof cargarRegistroAsistencia === 'function') {
    cargarRegistroAsistencia();
  }

  // Renderizar Clientes Recientes para Recepcionista
  const tbodyNuevosCli = document.getElementById('tableRecepNuevosClientes');
  if (tbodyNuevosCli) {
    tbodyNuevosCli.innerHTML = clientes.slice(0, 5).map(c => `
      <tr>
        <td><strong>${c.nombre} ${c.apellido}</strong></td>
        <td>${c.telefono || '-'}</td>
        <td>${c.correo || '-'}</td>
        <td><span class="badge badge-${c.estado}">${c.estado}</span></td>
        <td><button class="btn btn-secondary btn-sm" onclick="cambiarTab('membresias'); abrirModalMembresia();">💳 Membresía</button></td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;">No hay clientes registrados aún.</td></tr>';
  }

  const vencidas = membresias.filter(m => m.estado === 'vencida');
  const tbody = document.getElementById('tableRecepDashboard');
  tbody.innerHTML = vencidas.map(m => `
    <tr>
      <td><strong>${m.cliente_nombre}</strong></td>
      <td>${m.tipo}</td>
      <td>${m.fecha_fin ? m.fecha_fin.substring(0,10) : ''}</td>
      <td><span class="badge badge-vencida">Vencida</span></td>
      <td><button class="btn btn-secondary btn-sm" onclick="abrirModalMembresia(${m.id_membresia})">🔄 Renovar</button></td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;">¡Excelente! No hay membresías vencidas pendientes.</td></tr>';
}

// 4. Cargar Dashboard Cliente (Portal de Atleta)
async function cargarDashboardCliente() {
  const user = Auth.getUser();
  const idCliente = user ? user.id_cliente : null;

  if (!idCliente) {
    document.getElementById('statClienteMembresiaEstado').innerText = 'SIN VÍNCULO';
    document.getElementById('statClienteMembresiaFin').innerText = '-';
    document.getElementById('statClienteRutinaNombre').innerText = 'Sin Perfil Vinculado';
    document.getElementById('tableClienteRutina').innerHTML = '<tr><td colspan="5" style="text-align:center; color: #d32f2f; font-weight: bold;">⚠️ Tu usuario no está vinculado a ningún perfil de cliente.<br><small style="color: #666; font-weight: normal;">Solicita al administrador vincular tu usuario con tu registro de cliente en el módulo de Usuarios.</small></td></tr>';
    document.getElementById('tableClientePagos').innerHTML = '<tr><td colspan="4" style="text-align:center;">Sin registro de cliente vinculado.</td></tr>';
    return;
  }

  const [resMem, resRut, resPag] = await Promise.all([
    Auth.fetchApi('/membresias'),
    Auth.fetchApi('/rutinas'),
    Auth.fetchApi('/pagos')
  ]);

  const membresias = resMem.ok ? resMem.membresias.filter(m => m.id_cliente === idCliente) : [];
  const rutinas = resRut.ok ? resRut.rutinas.filter(r => r.id_cliente === idCliente) : [];
  const pagos = resPag.ok ? resPag.pagos.filter(p => p.id_cliente === idCliente) : [];

  // Membresía
  const membresiaActual = membresias.find(m => m.estado === 'activa') || membresias[0];
  if (membresiaActual) {
    document.getElementById('statClienteMembresiaEstado').innerText = membresiaActual.estado.toUpperCase();
    document.getElementById('statClienteMembresiaFin').innerText = membresiaActual.fecha_fin ? membresiaActual.fecha_fin.substring(0,10) : '-';
  } else {
    document.getElementById('statClienteMembresiaEstado').innerText = 'SIN MEMBRESÍA';
    document.getElementById('statClienteMembresiaFin').innerText = '-';
  }

  // Rutina (prioriza la activa)
  const rutinaActual = rutinas.find(r => r.estado === 'activa') || rutinas[0];
  if (rutinaActual) {
    document.getElementById('statClienteRutinaNombre').innerText = `${rutinaActual.nombre_rutina} (${rutinaActual.nivel})`;
    
    // Cargar detalle completo de la rutina con sus ejercicios
    const resDetalle = await Auth.fetchApi(`/rutinas/${rutinaActual.id_rutina}`);
    if (resDetalle.ok && resDetalle.rutina && resDetalle.rutina.ejercicios && resDetalle.rutina.ejercicios.length > 0) {
      const tbodyRutina = document.getElementById('tableClienteRutina');
      tbodyRutina.innerHTML = resDetalle.rutina.ejercicios.map(e => `
        <tr>
          <td><strong>${e.ejercicio_nombre}</strong></td>
          <td><span class="badge" style="background:#e3f2fd; color:#1565c0;">${e.grupo_muscular}</span></td>
          <td>${e.series} series x ${e.repeticiones} reps</td>
          <td>${e.peso} kg</td>
          <td>${e.descanso || '-'}</td>
        </tr>
      `).join('');
    } else {
      document.getElementById('tableClienteRutina').innerHTML = '<tr><td colspan="5" style="text-align:center;">La rutina asignada no tiene ejercicios agregados aún.</td></tr>';
    }
  } else {
    document.getElementById('statClienteRutinaNombre').innerText = 'Sin Rutina Asignada';
    document.getElementById('tableClienteRutina').innerHTML = '<tr><td colspan="5" style="text-align:center;">Aún no tienes una rutina asignada por tu entrenador.</td></tr>';
  }

  // Pagos
  const tbodyPagos = document.getElementById('tableClientePagos');
  tbodyPagos.innerHTML = pagos.map(p => `
    <tr>
      <td>${p.fecha_pago ? p.fecha_pago.substring(0,10) : ''}</td>
      <td style="color:var(--success); font-weight:bold;">$${parseFloat(p.valor).toLocaleString('es-CO')}</td>
      <td>${p.metodo_pago}</td>
      <td>${p.referencia || '-'}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="text-align:center;">No registras pagos.</td></tr>';
}

// Utilidades para Modales
function abrirModal() {
  document.getElementById('modalOverlay').classList.add('active');
}

function cerrarModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

// Ventanas Emergentes (Modales Personalizados de Confirmación y Notificación)
function mostrarModalConfirmacion({ titulo = 'Confirmar Acción', mensaje, textoBoton = 'Confirmar', claseBoton = 'btn-danger', onConfirm }) {
  document.getElementById('modalTitle').innerText = titulo;
  document.getElementById('modalBody').innerHTML = `
    <div style="text-align: center; padding: 1rem 0;">
      <div style="font-size: 3.2rem; margin-bottom: 0.8rem; line-height: 1;">⚠️</div>
      <h4 style="margin-bottom: 0.5rem; color: var(--dark-bg); font-weight: 700;">${titulo}</h4>
      <p style="font-size: 1rem; color: var(--text-muted); margin-bottom: 1.8rem; line-height: 1.5;">${mensaje}</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button type="button" class="btn btn-secondary" style="flex: 1; padding: 0.65rem 1rem;" onclick="cerrarModal()">Cancelar</button>
        <button type="button" id="btnModalConfirmarAccion" class="btn ${claseBoton}" style="flex: 1; padding: 0.65rem 1rem;">${textoBoton}</button>
      </div>
    </div>
  `;

  document.getElementById('btnModalConfirmarAccion').onclick = async () => {
    cerrarModal();
    if (typeof onConfirm === 'function') {
      await onConfirm();
    }
  };

  abrirModal();
}

function mostrarModalNotificacion({ titulo = 'Aviso', mensaje, tipo = 'exito' }) {
  const icono = tipo === 'exito' ? '✅' : (tipo === 'error' ? '❌' : 'ℹ️');
  document.getElementById('modalTitle').innerText = titulo;
  document.getElementById('modalBody').innerHTML = `
    <div style="text-align: center; padding: 1rem 0;">
      <div style="font-size: 3.2rem; margin-bottom: 0.8rem; line-height: 1;">${icono}</div>
      <h4 style="margin-bottom: 0.5rem; color: var(--dark-bg); font-weight: 700;">${titulo}</h4>
      <p style="font-size: 1rem; color: var(--text-muted); margin-bottom: 1.8rem; line-height: 1.5;">${mensaje}</p>
      <button type="button" class="btn btn-primary" style="width: 100%; max-width: 200px;" onclick="cerrarModal()">Aceptar</button>
    </div>
  `;
  abrirModal();
}

// -------------------------------------------------------------
// Funciones Adicionales: Desplazamiento Suave, Menú de Roles y Perfil de Usuario
// -------------------------------------------------------------

function scrollASeccion(e, id) {
  if (e) e.preventDefault();
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function seleccionarRolDemo(rol) {
  const userInp = document.getElementById('loginUsuario');
  const passInp = document.getElementById('loginPassword');
  if (!userInp || !passInp) return;

  if (rol === 'Administrador') {
    userInp.value = 'admin';
    passInp.value = 'admin123';
  } else if (rol === 'Entrenador') {
    userInp.value = 'carlos_entrenador';
    passInp.value = 'admin123';
  } else if (rol === 'Recepcionista') {
    userInp.value = 'maria_recep';
    passInp.value = 'admin123';
  } else if (rol === 'Cliente') {
    userInp.value = 'JesusP171';
    passInp.value = 'admin123';
  }
}

function toggleUserDropdownMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('userHeaderDropdown');
  if (menu) {
    menu.classList.toggle('active');
  }
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userHeaderDropdown');
  const toggleBtn = document.getElementById('btnUserMenuToggle');
  if (dropdown && toggleBtn && !dropdown.contains(e.target) && !toggleBtn.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

function ejecutarCerrarSesion() {
  const menu = document.getElementById('userHeaderDropdown');
  if (menu) menu.classList.remove('active');
  Auth.clearSession();
  mostrarLandingView();
}

function abrirModalMiPerfil() {
  const menu = document.getElementById('userHeaderDropdown');
  if (menu) menu.classList.remove('active');

  const user = Auth.getUser();
  if (!user) return;

  document.getElementById('modalTitle').innerText = '✏️ Modificar Mis Datos de Cuenta';
  document.getElementById('modalBody').innerHTML = `
    <form id="formMiPerfil" onsubmit="guardarMiPerfil(event)">
      <div style="margin-bottom: 1rem;">
        <label style="display:block; margin-bottom:0.4rem; font-weight:600; color:var(--dark-bg);">Nombre de Usuario *</label>
        <input type="text" id="perfilUsuario" class="form-control" value="${user.nombre_usuario || ''}" required maxlength="30">
      </div>
      <div style="margin-bottom: 1rem;">
        <label style="display:block; margin-bottom:0.4rem; font-weight:600; color:var(--dark-bg);">Correo Electrónico *</label>
        <input type="email" id="perfilCorreo" class="form-control" value="${user.correo || ''}" required maxlength="70">
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label style="display:block; margin-bottom:0.4rem; font-weight:600; color:var(--dark-bg);">Nueva Contraseña (Opcional)</label>
        <input type="password" id="perfilPassword" class="form-control" placeholder="Dejar en blanco para conservar actual (8-12 carát.)" minlength="8" maxlength="12">
      </div>
      <div style="display:flex; gap:1rem; justify-content:flex-end;">
        <button type="button" class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button>
        <button type="submit" class="btn btn-primary">💾 Guardar Cambios</button>
      </div>
    </form>
  `;

  abrirModal();
}

async function guardarMiPerfil(e) {
  e.preventDefault();
  const user = Auth.getUser();
  if (!user) return;

  const nombre_usuario = document.getElementById('perfilUsuario').value.trim();
  const correo = document.getElementById('perfilCorreo').value.trim();
  const password = document.getElementById('perfilPassword').value;

  if (!nombre_usuario) {
    mostrarModalNotificacion({ titulo: 'Error', mensaje: 'El nombre de usuario es obligatorio.', tipo: 'error' });
    return;
  }

  if (correo.length > 70) {
    mostrarModalNotificacion({ titulo: 'Error', mensaje: 'El correo no puede superar los 70 caracteres.', tipo: 'error' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo) || !correo.includes('@') || !correo.includes('.')) {
    mostrarModalNotificacion({ titulo: 'Error', mensaje: 'El correo debe ser un email válido (ej: usuario@correo.com).', tipo: 'error' });
    return;
  }

  if (password && (password.length < 8 || password.length > 12)) {
    mostrarModalNotificacion({ titulo: 'Error', mensaje: 'La contraseña debe tener entre 8 y 12 caracteres.', tipo: 'error' });
    return;
  }

  const payload = {
    nombre_usuario,
    correo,
    rol: user.rol,
    id_cliente: user.id_cliente,
    id_entrenador: user.id_entrenador,
    estado: user.estado || 'activo'
  };
  if (password) {
    payload.password = password;
  }

  const res = await Auth.fetchApi(`/usuarios/${user.id_usuario}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    user.nombre_usuario = nombre_usuario;
    user.correo = correo;
    Auth.setSession(Auth.getToken(), user);
    cerrarModal();
    mostrarAppLayout();
    mostrarModalNotificacion({ titulo: '¡Datos Actualizados!', mensaje: 'Tus datos de usuario fueron actualizados correctamente.', tipo: 'exito' });
  } else {
    mostrarModalNotificacion({ titulo: 'Error', mensaje: res.mensaje || 'No se pudieron actualizar los datos.', tipo: 'error' });
  }
}

// -------------------------------------------------------------
// Control del Menú Hamburguesa en Dispositivos Móviles
// -------------------------------------------------------------

function toggleLandingMobileMenu(e) {
  if (e) e.stopPropagation();
  const nav = document.getElementById('landingNav');
  const btn = document.getElementById('btnLandingBurger');
  if (nav && btn) {
    nav.classList.toggle('active');
    btn.classList.toggle('active');
  }
}

function toggleSidebarMobile(e) {
  if (e) e.stopPropagation();
  const sidebar = document.querySelector('.sidebar');
  const btn = document.getElementById('btnSidebarBurger');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (sidebar) {
    sidebar.classList.toggle('active-mobile');
    if (btn) btn.classList.toggle('active');
    if (backdrop) backdrop.classList.toggle('hidden');
  }
}

// -------------------------------------------------------------
// Menús Desplegables de Landing Page y Cierre al Clic Afuera
// -------------------------------------------------------------

function toggleLandingRoleDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('landingRoleDropdown');
  if (dropdown) dropdown.classList.toggle('active');
}

function toggleLandingUserDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('landingUserDropdown');
  if (dropdown) dropdown.classList.toggle('active');
}

function seleccionarRolYAcceder(rol) {
  const dropdown = document.getElementById('landingRoleDropdown');
  if (dropdown) dropdown.classList.remove('active');

  const roleSelect = document.getElementById('loginRolSelect');
  if (roleSelect) {
    roleSelect.value = rol;
    seleccionarRolDemo(rol);
  }
  mostrarLoginView('login');
}

// Escuchador global de clics para cerrar menús desplegables al hacer clic afuera
document.addEventListener('click', (e) => {
  // Dropdown de perfil en panel principal
  const userHeaderDropdown = document.getElementById('userHeaderDropdown');
  const btnUserMenuToggle = document.getElementById('btnUserMenuToggle');
  if (userHeaderDropdown && btnUserMenuToggle && !userHeaderDropdown.contains(e.target) && !btnUserMenuToggle.contains(e.target)) {
    userHeaderDropdown.classList.remove('active');
  }

  // Dropdown de rol en landing
  const landingRoleDropdown = document.getElementById('landingRoleDropdown');
  const btnHeaderAccesoPaneles = document.getElementById('btnHeaderAccesoPaneles');
  if (landingRoleDropdown && btnHeaderAccesoPaneles && !landingRoleDropdown.contains(e.target) && !btnHeaderAccesoPaneles.contains(e.target)) {
    landingRoleDropdown.classList.remove('active');
  }

  // Dropdown de perfil en landing
  const landingUserDropdown = document.getElementById('landingUserDropdown');
  const btnLandingUserMenu = document.getElementById('btnLandingUserMenu');
  if (landingUserDropdown && btnLandingUserMenu && !landingUserDropdown.contains(e.target) && !btnLandingUserMenu.contains(e.target)) {
    landingUserDropdown.classList.remove('active');
  }
});

/* ============================================================
   GESTOR DE TEMAS: TEMA CLARO VS MODO AZUL ELÉCTRICO
   ============================================================ */
function initTheme() {
  const savedTheme = localStorage.getItem('gallolete_theme') || 'light';
  applyTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'electric' : 'light';
  applyTheme(newTheme);
}

function applyTheme(theme) {
  if (theme === 'electric') {
    document.documentElement.setAttribute('data-theme', 'electric');
    localStorage.setItem('gallolete_theme', 'electric');
    updateThemeButtons(true);
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('gallolete_theme', 'light');
    updateThemeButtons(false);
  }
}

function updateThemeButtons(isElectric) {
  const buttons = document.querySelectorAll('.theme-toggle-btn');
  buttons.forEach(btn => {
    btn.innerHTML = isElectric ? '☀️ Modo Claro' : '⚡ Modo Eléctrico';
  });
}




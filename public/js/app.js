// Módulo Principal de Navegación, Dashboards por Rol y Modales

// El formulario normal de login solo permite Cliente; el menú desplegable
// habilita el rol elegido únicamente para ese inicio de sesión.
let rolHabilitadoLogin = null;
// Plan elegido en la landing sin sesión activa; se retoma en la pasarela al autenticarse.
let planPendienteCliente = null;
// Credenciales del personal: acceso solo desde el menú desplegable (nunca se muestran al Cliente).
const CREDENCIALES_STAFF = {
  Administrador: { usuario: 'admin@gallolete.com', clave: 'admin2026' },
  Entrenador: { usuario: 'carlos@gallolete.com', clave: 'entrenador2026' },
  Recepcionista: { usuario: 'maria@gallolete.com', clave: 'recepcion2026' }
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  initTheme();
  initThemeFab();
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
    if (!data.ok) {
      if (rolHabilitadoLogin === null) {
        errorDiv.innerHTML = `${data.mensaje || 'Credenciales incorrectas.'} Si aún no tienes cuenta, <a href="#" style="color:#E4002B; font-weight:700;" onclick="event.preventDefault(); irARegistroCliente();">créala aquí</a>.`;
      } else {
        errorDiv.innerText = data.mensaje || 'Credenciales incorrectas.';
      }
      errorDiv.classList.remove('hidden');
      return;
    }

    // El formulario es solo para Clientes; los demás roles entran desde el menú desplegable
    if (data.usuario.rol !== 'Cliente' && rolHabilitadoLogin !== data.usuario.rol) {
      errorDiv.innerHTML = `Este inicio de sesión es solo para <strong>Clientes</strong>. Para entrar como <strong>${data.usuario.rol}</strong> usa el botón <strong>"Iniciar Sesión ▾"</strong> de la página principal.`;
      errorDiv.classList.remove('hidden');
      return;
    }

    rolHabilitadoLogin = null;
    Auth.setSession(data.token, data.usuario);
    errorDiv.classList.add('hidden');
    continuarTrasAutenticacion(data.usuario);
  });

  // Register Form Event Listener
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombreCompleto = document.getElementById('regNombreCompleto').value.trim();
    const correo = document.getElementById('regCorreo').value.trim();
    const password = document.getElementById('regPassword').value;

    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.add('hidden');

    const palabrasNombre = nombreCompleto.split(/\s+/).filter(Boolean);
    if (palabrasNombre.length < 2) {
      errorDiv.innerText = 'Debe ingresar nombre y apellido (mínimo dos palabras).';
      errorDiv.classList.remove('hidden');
      return;
    }

    const nombreRegex = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;
    if (!nombreRegex.test(nombreCompleto)) {
      errorDiv.innerText = 'El nombre y apellido no puede contener números ni símbolos (solo letras y espacios).';
      errorDiv.classList.remove('hidden');
      return;
    }

    if (nombreCompleto.length > 30) {
      errorDiv.innerText = 'El nombre completo no puede superar los 30 caracteres.';
      errorDiv.classList.remove('hidden');
      return;
    }

    const nombre = (palabrasNombre[0] || '').substring(0, 30);
    const apellido = (palabrasNombre.slice(1).join(' ') || palabrasNombre[0] || '').substring(0, 30);

    if (correo.length > 70) {
      errorDiv.innerText = 'El correo electrónico no puede superar los 70 caracteres.';
      errorDiv.classList.remove('hidden');
      return;
    }

    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    if (!emailRegex.test(correo)) {
      errorDiv.innerText = 'El correo debe ser de Gmail obligatoriamente (ej: usuario@gmail.com).';
      errorDiv.classList.remove('hidden');
      return;
    }

    if (password.length < 8) {
      errorDiv.innerText = 'La contraseña debe tener mínimo 8 caracteres.';
      errorDiv.classList.remove('hidden');
      return;
    }

    if (password.length > 30) {
      errorDiv.innerText = 'La contraseña no puede superar los 30 caracteres.';
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
        password
      })
    });

    const data = await res.json();
    if (data.ok) {
      Auth.setSession(data.token, data.usuario);
      continuarTrasAutenticacion(data.usuario);
      mostrarModalNotificacion({
        titulo: '¡Cuenta creada!',
        mensaje: `Tu nombre de usuario generado es "${data.usuario.nombre_usuario}". También puedes iniciar sesión con tu correo ${data.usuario.correo}.`,
        tipo: 'exito'
      });
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
  planPendienteCliente = null;
  document.getElementById('landingView').classList.remove('hidden');
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('appLayout').classList.add('hidden');
  actualizarBotonHeaderLanding();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarLoginCliente() {
  rolHabilitadoLogin = null;
  limpiarLoginView();
  mostrarLoginView('login');
}

function limpiarLoginView() {
  const userInp = document.getElementById('loginUsuario');
  const passInp = document.getElementById('loginPassword');
  if (userInp) userInp.value = '';
  if (passInp) passInp.value = '';
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) errorDiv.classList.add('hidden');
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

function continuarTrasAutenticacion(usuario) {
  mostrarAppLayout();

  if (!planPendienteCliente) return;

  const plan = planPendienteCliente;
  planPendienteCliente = null;

  if (usuario && usuario.rol === 'Cliente' && usuario.id_cliente) {
    setTimeout(() => abrirPasarelaPagoModal(plan.tipo, plan.precio), 350);
  }
}

function irAComprarPlan(tipoPlan) {
  const precios = {
    'Mensual General': 100000,
    'Mensual VIP': 120000,
    'Trimestral Ahorro': 300000,
    'Trimestral': 300000,
    'Anual Black': 950000,
    'Anual': 950000
  };
  const precio = precios[tipoPlan] || 100000;

  if (!Auth.isAuthenticated()) {
    planPendienteCliente = { tipo: tipoPlan, precio };
    mostrarLoginView('registro');
    mostrarModalNotificacion({
      titulo: `Plan ${tipoPlan}`,
      mensaje: 'Para adquirir tu plan primero debes crear tu cuenta de cliente o iniciar sesión. Al terminar te llevaremos a la pasarela de pago.',
      tipo: 'info'
    });
    return;
  }

  const user = Auth.getUser();
  if (user && user.rol === 'Cliente') {
    abrirPasarelaPagoModal(tipoPlan, precio);
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

function mostrarAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginError = document.getElementById('loginError');
  const registerSuccess = document.getElementById('registerSuccess');

  if (loginError) loginError.classList.add('hidden');
  if (registerSuccess) registerSuccess.classList.add('hidden');
  if (!loginForm || !registerForm) return;

  const esLogin = tab === 'login';
  loginForm.classList.toggle('hidden', !esLogin);
  registerForm.classList.toggle('hidden', esLogin);
  actualizarCajaCredencialesStaff(esLogin ? 'login' : 'registro');
}

// La caja de credenciales solo aparece cuando un rol staff entró desde el menú desplegable.
function actualizarCajaCredencialesStaff(vista) {
  const caja = document.getElementById('staffCredBox');
  const footerCrear = document.getElementById('loginFooterCrearCuenta');
  const googleBtn = document.getElementById('googleLoginBtn');
  const dividerCorreo = document.getElementById('dividerCorreo');
  const cred = CREDENCIALES_STAFF[rolHabilitadoLogin];
  const esStaff = Boolean(cred);

  // El personal no puede registrarse: solo inicia sesión (las cuentas staff las crea el Administrador).
  if (footerCrear) footerCrear.classList.toggle('hidden', esStaff);

  // Google y el separador "O CON CORREO" son solo para el ingreso del Cliente.
  if (googleBtn) googleBtn.classList.toggle('hidden', esStaff);
  if (dividerCorreo) dividerCorreo.classList.toggle('hidden', esStaff);

  if (!caja) return;

  if (vista !== 'login' || !cred) {
    caja.classList.add('hidden');
    caja.innerHTML = '';
    return;
  }

  caja.innerHTML = `
    <strong>🔑 Acceso ${rolHabilitadoLogin}</strong><br>
    Usuario: <code>${cred.usuario}</code><br>
    Contraseña: <code>${cred.clave}</code>
  `;
  caja.classList.remove('hidden');
}

function toggleVerPassword(idInput, boton) {
  const input = document.getElementById(idInput);
  if (!input) return;
  const mostrar = input.type === 'password';
  input.type = mostrar ? 'text' : 'password';
  if (boton) boton.innerText = mostrar ? '🙈' : '👁';
}

function irARegistroCliente() {
  // Registro exclusivo de Clientes: el personal solo inicia sesión.
  if (CREDENCIALES_STAFF[rolHabilitadoLogin]) {
    mostrarModalNotificacion({
      titulo: 'Solo para nuevos Clientes',
      mensaje: 'El personal (Entrenador, Recepcionista y Administrador) no crea cuentas desde aquí, solo inicia sesión. Las cuentas del personal las registra el Administrador desde su panel.',
      tipo: 'info'
    });
    return;
  }

  const errorDiv = document.getElementById('loginError');
  if (errorDiv) errorDiv.classList.add('hidden');
  const userInp = document.getElementById('loginUsuario');
  const passInp = document.getElementById('loginPassword');
  if (userInp) userInp.value = '';
  if (passInp) passInp.value = '';
  mostrarAuthTab('registro');
}

function accesoGoogleProximamente() {
  mostrarModalNotificacion({
    titulo: 'Continuar con Google',
    mensaje: 'El acceso con Google estará disponible próximamente. Por ahora puedes crear tu cuenta o iniciar sesión con tu correo y contraseña.',
    tipo: 'info'
  });
}

function solicitarRecuperarPassword() {
  mostrarModalNotificacion({
    titulo: '¿Olvidaste tu contraseña?',
    mensaje: 'Por seguridad, el restablecimiento se realiza en la recepción del gimnasio (Sede UniSalamanca Cra 50 #79-155) presentando tu documento. Si aún no eres miembro, crea tu cuenta desde "Crear cuenta".',
    tipo: 'info'
  });
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

  userInp.value = '';
  passInp.value = '';

  // El Cliente no recibe credenciales de prueba: debe crear su cuenta o iniciar con la suya.
  const cred = CREDENCIALES_STAFF[rol];
  if (cred) {
    userInp.value = cred.usuario;
    passInp.value = cred.clave;
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

  rolHabilitadoLogin = rol;
  seleccionarRolDemo(rol);
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
  const fab = document.getElementById('themeFab');
  if (fab) fab.textContent = isElectric ? '☀️' : '⚡';
}

/* ------------------------------------------------------------
   BOTÓN FLOTANTE DE ACCESIBILIDAD (circulito del modo eléctrico)
   Se arrastra con el puntero a cualquier parte de la pantalla y
   la posición se guarda; al presionarlo (sin arrastrar) cambia
   el tema.
   ------------------------------------------------------------ */
function initThemeFab() {
  const fab = document.getElementById('themeFab');
  if (!fab) return;

  try {
    const saved = JSON.parse(localStorage.getItem('gallolete_themebtn_pos') || 'null');
    if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
      placeThemeFab(fab, saved.left, saved.top);
    }
  } catch (e) { /* posición inválida: se queda en la esquina */ }

  let startX = 0, startY = 0, origLeft = 0, origTop = 0;
  let dragging = false, moved = false, activePointer = null, suppressClick = false;

  fab.addEventListener('pointerdown', (e) => {
    if (activePointer !== null) return;
    activePointer = e.pointerId;
    try { fab.setPointerCapture(e.pointerId); } catch (err) { /* puntero sintético: no esencial */ }
    startX = e.clientX;
    startY = e.clientY;
    const rect = fab.getBoundingClientRect();
    origLeft = rect.left;
    origTop = rect.top;
    dragging = true;
    moved = false;
    fab.classList.add('dragging');
  });

  fab.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== activePointer) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    moved = true;
    placeThemeFab(fab, origLeft + dx, origTop + dy);
  });

  const endDrag = (e) => {
    if (!dragging || (e && e.pointerId !== undefined && e.pointerId !== activePointer)) return;
    dragging = false;
    fab.classList.remove('dragging');
    if (activePointer !== null) {
      try { fab.releasePointerCapture(activePointer); } catch (err) { /* ya liberado */ }
      activePointer = null;
    }
    if (moved) {
      const rect = fab.getBoundingClientRect();
      localStorage.setItem('gallolete_themebtn_pos', JSON.stringify({ left: rect.left, top: rect.top }));
      suppressClick = true;
    }
  };

  fab.addEventListener('pointerup', endDrag);
  fab.addEventListener('pointercancel', endDrag);

  fab.addEventListener('click', (e) => {
    if (suppressClick) {
      suppressClick = false;
      e.preventDefault();
      return;
    }
    toggleTheme();
  });
}

function placeThemeFab(fab, left, top) {
  const maxLeft = Math.max(0, window.innerWidth - fab.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - fab.offsetHeight);
  const x = Math.min(Math.max(0, left), maxLeft);
  const y = Math.min(Math.max(0, top), maxTop);
  fab.style.left = x + 'px';
  fab.style.top = y + 'px';
  fab.style.right = 'auto';
  fab.style.bottom = 'auto';
}




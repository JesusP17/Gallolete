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

// 4. Dashboard Cliente (Portal de Atleta)
// Catálogo real de planes: los mismos 4 de la landing. La pasarela crea la membresía y el pago.
const CLX_PLANES = [
  {
    nombre: 'Mensual General', precio: 100000, periodo: '/ mes', etiqueta: 'Básico',
    pasarela: 'Mensual General', claves: ['general'],
    features: ['Acceso a zona de musculación y peso libre', 'Área cardio y resistencia ilimitada', 'Duchas con agua caliente y vestieres VIP', 'App móvil para control de entrenamiento']
  },
  {
    nombre: 'Mensual VIP', precio: 120000, periodo: '/ mes', etiqueta: 'Más Popular',
    pasarela: 'Mensual VIP', claves: ['vip'],
    features: ['Todo lo del Plan General', 'Evaluación física y seguimiento con Entrenador', 'Rutinas personalizadas por objetivo', 'Invitado gratis 4 días al mes', 'Lockers preferenciales de seguridad']
  },
  {
    nombre: 'Trimestral Ahorro', precio: 300000, periodo: '/ 3 meses', etiqueta: 'Ahorro',
    pasarela: 'Trimestral', claves: ['trimestral'],
    features: ['Ahorro garantizado del 15%', 'Acceso a todas las zonas del gimnasio', 'Asesoría en nutrición deportiva básica', 'Clases grupales y funcional']
  },
  {
    nombre: 'Anual Black', precio: 950000, periodo: '/ año', etiqueta: 'Élite',
    pasarela: 'Anual', claves: ['anual', 'black'],
    features: ['Máximo ahorro y tarifa fija asegurada', 'Congelamiento de membresía hasta por 30 días', 'Acceso prioritario a eventos y talleres', 'Regalo de bienvenida kit GalloLeTe']
  }
];

function cambiarTabPortalCliente(tab) {
  const paneles = { resumen: 'clxPanelResumen', entrenamiento: 'clxPanelEntrenamiento', miplan: 'clxPanelMiPlan' };
  document.querySelectorAll('.clx-tab').forEach(b => b.classList.toggle('active', b.dataset.clxtab === tab));
  Object.keys(paneles).forEach(t => {
    const p = document.getElementById(paneles[t]);
    if (p) p.classList.toggle('hidden', t !== tab);
  });
}

function clxSetText(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

function clxMoneda(v) {
  return '$' + parseFloat(v || 0).toLocaleString('es-CO');
}

function clxFmtFecha(s) {
  if (!s) return null;
  const d = new Date(String(s).substring(0, 10) + 'T00:00:00');
  if (isNaN(d)) return null;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function clxEdad(fechaNac) {
  if (!fechaNac) return null;
  const n = new Date(String(fechaNac).substring(0, 10) + 'T00:00:00');
  if (isNaN(n)) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) edad--;
  return edad >= 0 ? edad : null;
}

function clxDiasHasta(fechaFin) {
  if (!fechaFin) return null;
  const fin = new Date(String(fechaFin).substring(0, 10) + 'T00:00:00');
  if (isNaN(fin)) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((fin - hoy) / 86400000);
}

function clxFilaPago(p) {
  return `
    <div class="clx-pago">
      <div>
        <div class="clx-pago-fecha">${clxFmtFecha(p.fecha_pago) || 'Sin fecha'}</div>
        <div class="clx-pago-detalle">${p.metodo_pago || 'Pago en recepción'}${p.referencia ? ' · Ref. ' + p.referencia : ''}</div>
      </div>
      <div class="clx-pago-valor">${clxMoneda(p.valor)}</div>
    </div>`;
}

function clxTarjetaMembresia(m) {
  const dias = clxDiasHasta(m.fecha_fin);
  return `
    <div class="clx-mem-tipo">${m.tipo}</div>
    <div class="clx-mem-fechas">${clxFmtFecha(m.fecha_inicio) || '—'} → ${clxFmtFecha(m.fecha_fin) || '—'}</div>
    <div class="clx-mem-pie">
      <span class="clx-mem-precio">${clxMoneda(m.precio)}</span>
      <span class="clx-mem-estado ${m.estado === 'activa' ? 'ok' : 'off'}">${m.estado === 'activa' ? 'Activa' : 'Vencida'}</span>
    </div>
    ${dias !== null ? `<div class="clx-mem-dias">${dias >= 0 ? `Te quedan <strong>${dias} días</strong> de entrenamiento` : 'Esta membresía ya venció'}</div>` : ''}`;
}

function clxBannerPlan(m, planCat) {
  const dias = clxDiasHasta(m.fecha_fin);
  const detalle = dias !== null ? `${dias} ${dias === 1 ? 'día restante' : 'días restantes'} · vence el ${clxFmtFecha(m.fecha_fin) || '—'}` : '';
  return `
    <div class="clx-plan-activo">
      <div>
        <div class="clx-plan-activo-k">Tu plan actual</div>
        <div class="clx-plan-activo-n">${m.tipo}</div>
        <div class="clx-plan-activo-d">${detalle}</div>
      </div>
      ${planCat ? `<button class="clx-btn" onclick="irAComprarPlan('${planCat.pasarela}')">Renovar →</button>` : ''}
    </div>`;
}

function clxFilaEjercicio(e) {
  return `
    <div class="clx-ej">
      <div class="clx-ej-info">
        <div class="clx-ej-nombre">${e.ejercicio_nombre}</div>
        <div class="clx-ej-grupo">${e.grupo_muscular || ''}${e.ejercicio_nivel ? ' · ' + e.ejercicio_nivel : ''}</div>
      </div>
      <div class="clx-ej-serie">
        <div class="clx-ej-serie-v">${e.series} × ${e.repeticiones}</div>
        <div class="clx-ej-serie-l">series × reps</div>
      </div>
      <div class="clx-ej-serie">
        <div class="clx-ej-serie-v">${parseFloat(e.peso) > 0 ? parseFloat(e.peso) + ' kg' : 'Peso corporal'}</div>
        <div class="clx-ej-serie-l">peso sugerido</div>
      </div>
      <div class="clx-ej-serie">
        <div class="clx-ej-serie-v">${e.descanso || '60 seg'}</div>
        <div class="clx-ej-serie-l">descanso</div>
      </div>
    </div>`;
}

async function cargarDashboardCliente() {
  const user = Auth.getUser() || {};
  const idCliente = user.id_cliente || null;

  let perfil = null, membresias = [], rutinas = [], pagos = [];

  if (idCliente) {
    const [resPerfil, resMem, resRut, resPag] = await Promise.all([
      Auth.fetchApi('/clientes/perfil'),
      Auth.fetchApi('/membresias'),
      Auth.fetchApi('/rutinas'),
      Auth.fetchApi('/pagos')
    ]);
    if (resPerfil.ok) perfil = resPerfil.cliente;
    if (resMem.ok) membresias = resMem.membresias || [];
    if (resRut.ok) rutinas = resRut.rutinas || [];
    if (resPag.ok) pagos = resPag.pagos || [];
  }

  // HERO: identidad del atleta
  clxSetText('clxNombre', perfil ? `${perfil.nombre} ${perfil.apellido}`.trim() : (user.nombre_usuario || 'Atleta GalloLeTe'));
  const avatarEl = document.getElementById('clxAvatar');
  if (avatarEl) {
    avatarEl.textContent = perfil
      ? `${(perfil.nombre || '?')[0]}${(perfil.apellido || '')[0]}`.toUpperCase()
      : (user.nombre_usuario || '?')[0].toUpperCase();
  }

  const membresiaActual = membresias.find(m => m.estado === 'activa') || null;
  const rutinaActual = rutinas.find(r => r.estado === 'activa') || rutinas[0] || null;

  const planBadge = document.getElementById('clxPlanBadge');
  if (planBadge) {
    if (membresiaActual) {
      planBadge.textContent = membresiaActual.tipo;
      planBadge.classList.remove('hidden');
    } else {
      planBadge.classList.add('hidden');
    }
  }

  if (!idCliente) {
    clxSetText('clxHeroLine', 'Usuario sin perfil de cliente vinculado');
    clxSetText('clxHeroMono', 'Solicita al administrador vincular tu usuario en el módulo de Usuarios');
  } else {
    const partesLinea = [];
    if (perfil) {
      const edad = clxEdad(perfil.fecha_nacimiento);
      if (edad !== null) partesLinea.push(`${edad} años`);
      if (perfil.fecha_registro) partesLinea.push('Miembro desde ' + clxFmtFecha(perfil.fecha_registro));
    }
    if (rutinaActual && rutinaActual.objetivo) partesLinea.push('Objetivo: ' + rutinaActual.objetivo);
    clxSetText('clxHeroLine', partesLinea.join(' · '));

    const partesMono = [];
    if (perfil) {
      if (perfil.documento) partesMono.push('DOC ' + perfil.documento);
      if (perfil.telefono) partesMono.push(perfil.telefono);
      if (perfil.correo) partesMono.push(perfil.correo);
    }
    clxSetText('clxHeroMono', partesMono.join(' · '));
  }

  // HERO (lado derecho): días restantes y próximo vencimiento
  // El backend ya marca 'vencida' la membresía expirada, así que aquí solo llegan planes vigentes.
  const diasRestantes = membresiaActual ? clxDiasHasta(membresiaActual.fecha_fin) : null;
  clxSetText('clxDiasRestantes', diasRestantes !== null ? String(diasRestantes) : '—');
  clxSetText('clxDiasRestantesLabel', diasRestantes !== null
    ? (diasRestantes === 1 ? 'día restante' : 'días restantes')
    : (idCliente ? 'sin membresía activa' : 'días restantes'));
  clxSetText('clxVencimiento', membresiaActual ? (clxFmtFecha(membresiaActual.fecha_fin) || '—') : '—');

  // Tarjeta de entrenador (solo hay datos cuando existe una rutina asignada)
  const trainerCard = document.getElementById('clxTrainerCard');
  if (trainerCard) {
    if (rutinaActual && rutinaActual.entrenador_nombre) {
      trainerCard.classList.remove('hidden');
      const tAvatar = document.getElementById('clxTrainerAvatar');
      if (tAvatar) tAvatar.textContent = rutinaActual.entrenador_nombre.split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase();
      clxSetText('clxTrainerNombre', rutinaActual.entrenador_nombre);
      clxSetText('clxTrainerEspecialidad', rutinaActual.entrenador_especialidad || 'Entrenador GalloLeTe');
      const metaBits = [];
      if (rutinaActual.entrenador_horario) metaBits.push(rutinaActual.entrenador_horario);
      metaBits.push('Sede UniSalamanca');
      clxSetText('clxTrainerMeta', metaBits.join(' · '));
      clxSetText('clxRutinaNombre', rutinaActual.nombre_rutina);
      clxSetText('clxRutinaNivel', rutinaActual.nivel);
      const mail = document.getElementById('clxContactar');
      if (mail) {
        if (rutinaActual.entrenador_correo) {
          mail.href = 'mailto:' + rutinaActual.entrenador_correo;
          mail.classList.remove('hidden');
        } else {
          mail.classList.add('hidden');
        }
      }
    } else {
      trainerCard.classList.add('hidden');
    }
  }

  // Fila de estadísticas (solo datos reales de la base de datos)
  clxSetText('clxStatRutinas', String(rutinas.length));
  clxSetText('clxStatPagos', String(pagos.length));
  const inicioMasAntiguo = membresias.map(m => m.fecha_inicio).filter(Boolean).sort()[0]
    || (perfil && perfil.fecha_registro) || null;
  let diasMiembro = null;
  if (inicioMasAntiguo) {
    const d = new Date(String(inicioMasAntiguo).substring(0, 10) + 'T00:00:00');
    if (!isNaN(d)) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      diasMiembro = Math.max(0, Math.round((hoy - d) / 86400000));
    }
  }
  clxSetText('clxStatDias', diasMiembro !== null ? String(diasMiembro) : '0');
  clxSetText('clxStatDiasNota', inicioMasAntiguo ? 'desde el ' + clxFmtFecha(inicioMasAntiguo) : 'desde tu primer plan');

  // PESTAÑA RESUMEN
  const resMemb = document.getElementById('clxResumenMembresia');
  if (resMemb) {
    resMemb.innerHTML = membresiaActual
      ? clxTarjetaMembresia(membresiaActual)
      : `<div class="clx-empty">${idCliente
          ? 'No tienes una membresía activa. Elige tu plan en la pestaña <strong>Mi Plan</strong> para empezar a entrenar.'
          : 'Sin perfil de cliente vinculado.'}</div>`;
  }
  const resPagos = document.getElementById('clxResumenPagos');
  if (resPagos) {
    const ultimos = pagos.slice(0, 4);
    resPagos.innerHTML = ultimos.length
      ? ultimos.map(clxFilaPago).join('')
      : '<div class="clx-empty">Aún no registras pagos en recepción.</div>';
  }

  // PESTAÑA ENTRENAMIENTO
  clxSetText('clxRutinaTitulo', rutinaActual ? `Mi rutina · ${rutinaActual.nombre_rutina}` : 'Mi rutina');
  clxSetText('clxRutinaObjetivo', rutinaActual && rutinaActual.objetivo ? rutinaActual.objetivo : '');
  const ejCont = document.getElementById('clxEjercicios');
  if (ejCont) {
    if (!idCliente) {
      ejCont.innerHTML = '<div class="clx-empty">Sin perfil de cliente vinculado.</div>';
    } else if (!rutinaActual) {
      ejCont.innerHTML = '<div class="clx-empty">Aún no tienes una rutina asignada. Tu entrenador la creará según tu objetivo.</div>';
    } else {
      ejCont.innerHTML = '<div class="clx-empty">Cargando ejercicios…</div>';
      const resDetalle = await Auth.fetchApi(`/rutinas/${rutinaActual.id_rutina}`);
      const ejercicios = resDetalle.ok && resDetalle.rutina ? (resDetalle.rutina.ejercicios || []) : [];
      ejCont.innerHTML = ejercicios.length
        ? ejercicios.map(clxFilaEjercicio).join('')
        : '<div class="clx-empty">Tu rutina aún no tiene ejercicios agregados.</div>';
    }
  }

  // PESTAÑA MI PLAN
  let planCatalogoActual = null;
  if (membresiaActual && membresiaActual.tipo) {
    const t = String(membresiaActual.tipo).toLowerCase();
    planCatalogoActual = CLX_PLANES.find(p => p.claves.some(k => t.includes(k))) || null;
  }
  const planActivo = document.getElementById('clxPlanActivo');
  if (planActivo) {
    planActivo.innerHTML = membresiaActual ? clxBannerPlan(membresiaActual, planCatalogoActual) : '';
  }
  const grid = document.getElementById('clxPlanesGrid');
  if (grid) {
    grid.innerHTML = CLX_PLANES.map(p => {
      const esActual = planCatalogoActual && p.nombre === planCatalogoActual.nombre;
      return `
        <article class="clx-plan-card${esActual ? ' actual' : ''}">
          <div class="clx-plan-card-head">
            <span class="clx-plan-tag">${p.etiqueta}</span>
            ${esActual ? '<span class="clx-plan-yours">Tu plan actual</span>' : ''}
          </div>
          <h4 class="clx-plan-nombre">${p.nombre}</h4>
          <div class="clx-plan-precio">${clxMoneda(p.precio)} <span>${p.periodo}</span></div>
          <ul class="clx-plan-feats">
            ${p.features.map(f => `<li><span class="clx-tick">✓</span>${f}</li>`).join('')}
          </ul>
          <button class="${esActual ? 'clx-btn-ghost' : 'clx-btn'}" onclick="irAComprarPlan('${p.pasarela}')">${esActual ? 'Extender este plan →' : 'Elegir Plan →'}</button>
        </article>`;
    }).join('');
  }
  const hist = document.getElementById('clxHistorialPagos');
  if (hist) {
    hist.innerHTML = pagos.length
      ? pagos.map(clxFilaPago).join('')
      : '<div class="clx-empty">Aún no registras pagos.</div>';
  }
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
      <h4 style="margin-bottom: 0.5rem; color: var(--text-dark); font-weight: 700;">${titulo}</h4>
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
      <h4 style="margin-bottom: 0.5rem; color: var(--text-dark); font-weight: 700;">${titulo}</h4>
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
        <label style="display:block; margin-bottom:0.4rem; font-weight:600; color:var(--text-dark);">Nombre de Usuario *</label>
        <input type="text" id="perfilUsuario" class="form-control" value="${user.nombre_usuario || ''}" required maxlength="30">
      </div>
      <div style="margin-bottom: 1rem;">
        <label style="display:block; margin-bottom:0.4rem; font-weight:600; color:var(--text-dark);">Correo Electrónico *</label>
        <input type="email" id="perfilCorreo" class="form-control" value="${user.correo || ''}" required maxlength="70">
      </div>
      <div style="margin-bottom: 1.5rem;">
        <label style="display:block; margin-bottom:0.4rem; font-weight:600; color:var(--text-dark);">Nueva Contraseña (Opcional)</label>
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




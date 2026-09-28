// Módulo Principal de Navegación, Dashboards por Rol y Modales

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  iniciarEtiquetadoTablas();
});

// Copia el texto de cada <th> a un data-label en sus <td> para que, en
// pantallas estrechas, las tablas puedan apilarse como tarjetas sin perder
// el nombre de cada columna (evita el desplazamiento horizontal).
function aplicarEtiquetasTabla(table) {
  const heads = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
  if (!heads.length) return;
  table.querySelectorAll('tbody tr').forEach(tr => {
    Array.from(tr.children).forEach((td, i) => {
      if (td.tagName !== 'TD' || td.hasAttribute('colspan') || td.dataset.label) return;
      td.dataset.label = heads[i] || '';
    });
  });
}

function etiquetarTablas() {
  document.querySelectorAll('.table-container table').forEach(aplicarEtiquetasTabla);
}

function iniciarEtiquetadoTablas() {
  etiquetarTablas();
  let pendiente = false;
  const observer = new MutationObserver(() => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      etiquetarTablas();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function initApp() {
  // El listener del login debe registrarse primero. Si el layout viejo ya no
  // existe, mostrarAppLayout no puede impedir que se pueda iniciar sesión.
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const usuario = document.getElementById('loginUsuario').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });

      const data = await res.json();
      if (data.ok) {
        Auth.setSession(data.token, data.usuario);
        errorDiv.classList.add('hidden');
        history.replaceState(null, '', window.location.pathname);
        mostrarAppLayout();
      } else {
        errorDiv.innerText = data.mensaje || 'Credenciales incorrectas.';
        errorDiv.classList.remove('hidden');
      }
    } catch (error) {
      errorDiv.innerText = 'No se pudo conectar con el servidor.';
      errorDiv.classList.remove('hidden');
    }
  });

  const btnLogout = document.getElementById('btnCerrarSesion');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      cerrarSesion();
    });
  }

  inicializarMenuPerfil();

  if (Auth.isAuthenticated()) {
    mostrarAppLayout();
  } else if (quiereVerLogin()) {
    mostrarLogin();
  } else {
    // Sin sesión y sin intención explícita de entrar: lo primero que se
    // muestra es la landing pública (landing.html).
    window.location.replace('/landing.html');
  }
}

// Detecta si el usuario llegó pidiendo explícitamente el login del sistema
// (botón "Iniciar sesión" de la landing) o si tiene una pestaña pendiente.
function quiereVerLogin() {
  const params = new URLSearchParams(window.location.search);
  return params.has('login') ||
    window.location.hash === '#login' ||
    !!localStorage.getItem('gallolete_tab_pendiente');
}

function mostrarLogin() {
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('appLayout').classList.add('hidden');
}

function cerrarSesion() {
  Auth.clearSession();
  const menu = document.getElementById('profileMenu');
  if (menu) menu.classList.add('hidden');
  mostrarLogin();
}

function inicializarMenuPerfil() {
  const btnPerfil = document.getElementById('btnPerfil');
  const menu = document.getElementById('profileMenu');
  if (!btnPerfil || !menu) return;

  btnPerfil.addEventListener('click', (e) => {
    e.stopPropagation();
    const abierto = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden', abierto);
    btnPerfil.setAttribute('aria-expanded', String(!abierto));
  });

  // Cerrar el menú al hacer clic fuera de él
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('hidden') && !menu.contains(e.target) && e.target !== btnPerfil) {
      menu.classList.add('hidden');
      btnPerfil.setAttribute('aria-expanded', 'false');
    }
  });
}

function mostrarAppLayout() {
  const user = Auth.getUser();
  if (!user) return mostrarLogin();

  // Sidebar clásico (puede no existir tras el rediseño) y sidebar moderno
  const userNombre = document.getElementById('userNombre');
  const userRol = document.getElementById('userRol');
  if (userNombre) userNombre.innerText = user.nombre_usuario;
  if (userRol) userRol.innerText = user.rol;

  const modernUserNombre = document.getElementById('modernUserNombre');
  const modernUserRol = document.getElementById('modernUserRol');
  if (modernUserNombre) modernUserNombre.innerText = user.nombre_usuario;
  if (modernUserRol) modernUserRol.innerText = user.rol;

  const profileNombre = document.getElementById('profileMenuNombre');
  const profileRol = document.getElementById('profileMenuRol');
  if (profileNombre) profileNombre.innerText = user.nombre_usuario;
  if (profileRol) profileRol.innerText = user.rol;

  // Construir navegación lateral según el ROL
  construirMenuPorRol(user.rol);

  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('appLayout').classList.remove('hidden');

  // Cargar pestaña por defecto según rol, o la pestaña pendiente que
  // dejó un botón de la landing pública (landing.html).
  const tabPendiente = localStorage.getItem('gallolete_tab_pendiente');
  localStorage.removeItem('gallolete_tab_pendiente');

  let tabInicial = null;
  const tabEnMenu = tabPendiente && document.querySelector(`.modern-nav-link[data-tab="${tabPendiente}"]`);
  if (tabEnMenu && document.getElementById(`tab-${tabPendiente}`)) {
    tabInicial = tabPendiente;
  } else if (user.rol === 'Administrador') tabInicial = 'dashboard-admin';
  else if (user.rol === 'Entrenador') tabInicial = 'dashboard-entrenador';
  else if (user.rol === 'Recepcionista') tabInicial = 'dashboard-recepcionista';
  else if (user.rol === 'Cliente') tabInicial = 'dashboard-cliente';

  if (tabInicial) cambiarTab(tabInicial);
}

function construirMenuPorRol(rol) {
  const nav = document.getElementById('sidebarNav');
  const modernNav = document.getElementById('modernSidebarNav');
  
  // Limpiar ambas navegaciones
  if (nav) nav.innerHTML = '';
  if (modernNav) modernNav.innerHTML = '';

  let opciones = [];

  if (rol === 'Administrador') {
    opciones = [
      { id: 'dashboard-admin', label: 'Dashboard General', icon: 'fas fa-tachometer-alt' },
      { id: 'clientes', label: 'Clientes', icon: 'fas fa-users' },
      { id: 'membresias', label: 'Membresías', icon: 'fas fa-credit-card' },
      { id: 'entrenadores', label: 'Entrenadores', icon: 'fas fa-user-tie' },
      { id: 'rutinas', label: 'Rutinas', icon: 'fas fa-clipboard-list' },
      { id: 'ejercicios', label: 'Ejercicios', icon: 'fas fa-dumbbell' },
      { id: 'pagos', label: 'Pagos', icon: 'fas fa-money-bill-wave' },
      { id: 'usuarios', label: 'Usuarios', icon: 'fas fa-user-cog' }
    ];
  } else if (rol === 'Entrenador') {
    opciones = [
      { id: 'dashboard-entrenador', label: 'Mi Panel', icon: 'fas fa-tachometer-alt', badge: null },
      { id: 'entrenador-clientes', label: 'Mis Atletas', icon: 'fas fa-user-friends' },
      { id: 'entrenador-rutinas', label: 'Mis Rutinas', icon: 'fas fa-list-alt' },
      { id: 'rutinas', label: 'Crear Rutina', icon: 'fas fa-plus-circle' },
      { id: 'ejercicios', label: 'Ejercicios', icon: 'fas fa-dumbbell' }
    ];
  } else if (rol === 'Recepcionista') {
    opciones = [
      { id: 'dashboard-recepcionista', label: 'Panel Recepción', icon: 'fas fa-desktop' },
      { id: 'clientes', label: 'Registro de Clientes', icon: 'fas fa-user-plus' },
      { id: 'membresias', label: 'Venta de Membresías', icon: 'fas fa-shopping-cart' },
      { id: 'pagos', label: 'Cobros y Caja', icon: 'fas fa-cash-register' }
    ];
  } else if (rol === 'Cliente') {
    opciones = [
      { id: 'dashboard-cliente', label: 'Mi Portal de Atleta', icon: 'fas fa-user-circle' }
    ];
  }

  // Construir navegación clásica (si existe)
  if (nav) {
    opciones.forEach(op => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.setAttribute('data-tab', op.id);
      li.innerText = op.label;
      li.addEventListener('click', () => cambiarTab(op.id));
      nav.appendChild(li);
    });
  }

  // Construir navegación moderna
  if (modernNav) {
    opciones.forEach((op, index) => {
      const li = document.createElement('li');
      li.className = 'modern-nav-item';
      
      const link = document.createElement('div');
      link.className = 'modern-nav-link';
      link.setAttribute('data-tab', op.id);
      link.innerHTML = `
        <div class="nav-icon">
          <i class="${op.icon}"></i>
        </div>
        <span class="nav-text">${op.label}</span>
        ${op.badge ? `<span class="nav-badge">${op.badge}</span>` : ''}
      `;
      
      link.addEventListener('click', () => cambiarTab(op.id));
      li.appendChild(link);
      modernNav.appendChild(li);
    });
  }
}

function cambiarTab(tab) {
  // Actualizar navegación clásica
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

  // Actualizar navegación moderna
  document.querySelectorAll('.modern-nav-link').forEach(i => i.classList.remove('active'));

  // Activar elemento clásico
  const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  if (navItem) navItem.classList.add('active');

  // Activar elemento moderno
  const modernNavItem = document.querySelector(`.modern-nav-link[data-tab="${tab}"]`);
  if (modernNavItem) modernNavItem.classList.add('active');

  const contentSection = document.getElementById(`tab-${tab}`);
  if (contentSection) contentSection.classList.remove('hidden');

  const titulos = {
    'dashboard-admin': 'Panel de Administración General',
    'dashboard-entrenador': 'Panel del Entrenador',
    'dashboard-recepcionista': 'Panel de Recepción y Atención',
    'dashboard-cliente': 'Mi Portal GalloLeTe - Zona de Atleta',
    'entrenador-clientes': 'Mis Clientes Asignados',
    'entrenador-rutinas': 'Mis Rutinas',
    clientes: 'Gestión de Clientes',
    membresias: 'Gestión de Membresías',
    entrenadores: 'Gestión de Entrenadores',
    rutinas: 'Gestión de Rutinas',
    ejercicios: 'Base de Ejercicios',
    pagos: 'Historial de Pagos',
    usuarios: 'Administración de Usuarios'
  };

  document.getElementById('tabTitle').innerText = titulos[tab] || 'GalloLeTe';

  // El dashboard del entrenador ya trae su propio encabezado; evitar título duplicado
  const topBar = document.querySelector('.top-bar');
  if (topBar) topBar.style.display = (tab === 'dashboard-entrenador') ? 'none' : '';

  // Cargar datos correspondientes
  switch (tab) {
    case 'dashboard-admin': cargarDashboardAdmin(); break;
    case 'dashboard-entrenador': cargarDashboardEntrenador(); break;
    case 'dashboard-recepcionista': cargarDashboardRecepcionista(); break;
    case 'dashboard-cliente': cargarDashboardCliente(); break;
    case 'entrenador-clientes': cargarMisClientesEntrenador(); break;
    case 'entrenador-rutinas': cargarMisRutinasEntrenador(); break;
    case 'clientes': cargarClientes(); break;
    case 'membresias': cargarMembresias(); break;
    case 'entrenadores': cargarEntrenadores(); break;
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

// 2. Cargar Dashboard Entrenador - AHORA UTILIZA EL PANEL ENTRENADOR
async function cargarDashboardEntrenador() {
  // Inicializar las vistas del panel de entrenador si no existen
  inicializarVistasEntrenador();
  
  // Cargar datos del panel usando el módulo PanelEntrenador
  await PanelEntrenador.inicializar();
}

// 3. Cargar Dashboard Recepcionista
async function cargarDashboardRecepcionista() {
  const [resCli, resMem] = await Promise.all([
    Auth.fetchApi('/clientes'),
    Auth.fetchApi('/membresias')
  ]);

  const clientes = resCli.ok ? resCli.clientes : [];
  const membresias = resMem.ok ? resMem.membresias : [];

  document.getElementById('statRecepClientes').innerText = clientes.length;
  document.getElementById('statRecepActivas').innerText = membresias.filter(m => m.estado === 'activa').length;
  document.getElementById('statRecepVencidas').innerText = membresias.filter(m => m.estado === 'vencida').length;

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

// Utilidades para Modales Modernos
function abrirModal() {
  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  
  // Limpiar formularios después del cierre
  setTimeout(() => {
    limpiarFormulario();
  }, 300);
}

function abrirModalModerno(titulo, subtitulo, icono, contenidoHTML, tamaño = 'normal') {
  // Configurar título e ícono
  document.getElementById('modalTitle').textContent = titulo;
  document.getElementById('modalSubtitle').textContent = subtitulo;
  
  const modalIcon = document.getElementById('modalIcon');
  modalIcon.innerHTML = `<i class="${icono}"></i>`;
  
  // Configurar contenido
  document.getElementById('modalBody').innerHTML = contenidoHTML;
  
  // Aplicar tamaño si es necesario
  const modal = document.getElementById('modalModern');
  modal.className = 'modal-modern';
  if (tamaño === 'large') {
    modal.classList.add('modal-large');
  }
  
  // Abrir modal
  abrirModal();
  
  // Inicializar validación de formularios
  inicializarValidacionFormulario();
}

function limpiarFormulario() {
  const modalBody = document.getElementById('modalBody');
  const inputs = modalBody.querySelectorAll('.form-input-modern, .form-select-modern, .form-textarea-modern');
  
  inputs.forEach(input => {
    input.classList.remove('error', 'success', 'validating');
  });
  
  const errorMessages = modalBody.querySelectorAll('.form-error-message, .form-success-message');
  errorMessages.forEach(message => {
    message.classList.remove('show');
  });
}

function inicializarValidacionFormulario() {
  const modalBody = document.getElementById('modalBody');
  const inputs = modalBody.querySelectorAll('.form-input-modern');
  
  inputs.forEach(input => {
    // Validación en tiempo real
    input.addEventListener('input', function() {
      validarCampo(this);
    });
    
    // Validación al perder el foco
    input.addEventListener('blur', function() {
      validarCampo(this);
    });
  });
}

function validarCampo(input) {
  const valor = input.value.trim();
  const esRequerido = input.hasAttribute('required');
  const tipo = input.type;
  const grupo = input.closest('.form-group-modern');
  
  // Limpiar estados anteriores
  input.classList.remove('error', 'success', 'validating');
  
  const errorMessage = grupo.querySelector('.form-error-message');
  const successMessage = grupo.querySelector('.form-success-message');
  
  if (errorMessage) errorMessage.classList.remove('show');
  if (successMessage) successMessage.classList.remove('show');
  
  // Validar campo requerido
  if (esRequerido && !valor) {
    mostrarErrorCampo(input, 'Este campo es requerido');
    return false;
  }
  
  // Validar email
  if (tipo === 'email' && valor) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(valor)) {
      mostrarErrorCampo(input, 'Ingresa un correo electrónico válido');
      return false;
    }
  }
  
  // Validar teléfono
  if (input.id && input.id.includes('telefono') && valor) {
    const telefonoRegex = /^[+]?[\d\s-()]{7,}$/;
    if (!telefonoRegex.test(valor)) {
      mostrarErrorCampo(input, 'Ingresa un número de teléfono válido');
      return false;
    }
  }
  
  // Si llega aquí, el campo es válido
  if (valor) {
    mostrarExitoCampo(input, '¡Perfecto!');
  }
  
  return true;
}

function mostrarErrorCampo(input, mensaje) {
  input.classList.add('error');
  const grupo = input.closest('.form-group-modern');
  let errorMessage = grupo.querySelector('.form-error-message');
  
  if (!errorMessage) {
    errorMessage = document.createElement('div');
    errorMessage.className = 'form-error-message';
    errorMessage.innerHTML = '<i class="fas fa-exclamation-circle"></i><span></span>';
    grupo.appendChild(errorMessage);
  }
  
  errorMessage.querySelector('span').textContent = mensaje;
  errorMessage.classList.add('show');
}

function mostrarExitoCampo(input, mensaje) {
  input.classList.add('success');
  const grupo = input.closest('.form-group-modern');
  let successMessage = grupo.querySelector('.form-success-message');
  
  if (!successMessage) {
    successMessage = document.createElement('div');
    successMessage.className = 'form-success-message';
    successMessage.innerHTML = '<i class="fas fa-check-circle"></i><span></span>';
    grupo.appendChild(successMessage);
  }
  
  successMessage.querySelector('span').textContent = mensaje;
  successMessage.classList.add('show');
}

function validarFormularioCompleto(formulario) {
  const inputs = formulario.querySelectorAll('.form-input-modern[required]');
  let esValido = true;
  
  inputs.forEach(input => {
    if (!validarCampo(input)) {
      esValido = false;
    }
  });
  
  return esValido;
}

function mostrarCargandoBoton(boton) {
  boton.classList.add('loading');
  boton.disabled = true;
}

function ocultarCargandoBoton(boton) {
  boton.classList.remove('loading');
  boton.disabled = false;
}

// Función para abrir modal genérico (compatibilidad)
function abrirModalGenerico(titulo, contenidoHTML) {
  abrirModalModerno(titulo, 'Completa la información requerida', 'fas fa-edit', contenidoHTML);
}

// ============================================================
// FUNCIONES ESPECÍFICAS PARA EL PANEL DE ENTRENADOR
// ============================================================

async function cargarMisClientesEntrenador() {
  // Inicializar vistas si no existen
  inicializarVistasEntrenador();
  
  // Cargar clientes usando el módulo PanelEntrenador
  await PanelEntrenador.cargarMisClientes();
}

async function cargarMisRutinasEntrenador() {
  // Inicializar vistas si no existen
  inicializarVistasEntrenador();
  
  // Cargar rutinas usando el módulo PanelEntrenador
  await PanelEntrenador.cargarMisRutinas();
}
// ============================================================
// FUNCIONES DEL SIDEBAR MODERNO
// ============================================================

function inicializarSidebarModerno() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.modern-sidebar');
  
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      
      // Cambiar icono del toggle
      const icon = sidebarToggle.querySelector('i');
      if (sidebar.classList.contains('collapsed')) {
        icon.className = 'fas fa-chevron-right';
      } else {
        icon.className = 'fas fa-bars';
      }
    });
  }

  // Añadir efectos de hover a los elementos de navegación
  const navLinks = document.querySelectorAll('.modern-nav-link');
  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const icon = link.querySelector('.nav-icon i');
      if (icon) {
        icon.style.transform = 'scale(1.1)';
      }
    });

    link.addEventListener('mouseleave', () => {
      const icon = link.querySelector('.nav-icon i');
      if (icon) {
        icon.style.transform = 'scale(1)';
      }
    });
  });

  // Animar la entrada de los elementos del menú
  setTimeout(() => {
    const navItems = document.querySelectorAll('.modern-nav-item');
    navItems.forEach((item, index) => {
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, index * 100);
    });
  }, 200);
}

// Actualizar función mostrarAppLayout para incluir inicialización del sidebar
const originalMostrarAppLayout = mostrarAppLayout;
function mostrarAppLayoutConSidebar() {
  originalMostrarAppLayout();
  
  // Inicializar sidebar moderno después de construir el menú
  setTimeout(() => {
    inicializarSidebarModerno();
    
    // Agregar badge de alertas si es entrenador
    const user = Auth.getUser();
    if (user && user.rol === 'Entrenador') {
      actualizarBadgeAlertasNavegacion();
    }
  }, 100);
}

// Reemplazar la función original
mostrarAppLayout = mostrarAppLayoutConSidebar;

// Función para actualizar badge de alertas en navegación
async function actualizarBadgeAlertasNavegacion() {
  if (typeof PanelEntrenadorFase2 !== 'undefined') {
    try {
      await PanelEntrenadorFase2.cargarAlertas();
      const alertasCount = PanelEntrenadorFase2.alertas.length;
      
      // Buscar el enlace del dashboard del entrenador
      const dashboardLink = document.querySelector('.modern-nav-link[data-tab="dashboard-entrenador"]');
      if (dashboardLink && alertasCount > 0) {
        // Agregar o actualizar badge
        let badge = dashboardLink.querySelector('.nav-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'nav-badge';
          dashboardLink.appendChild(badge);
        }
        badge.textContent = alertasCount;
      }
    } catch (error) {
      console.error('Error al cargar alertas para navegación:', error);
    }
  }
}

// CSS dinámico para sidebar colapsado
const sidebarStyles = document.createElement('style');
sidebarStyles.textContent = `
  .modern-sidebar.collapsed {
    width: 80px;
  }
  
  .modern-sidebar.collapsed .logo-text,
  .modern-sidebar.collapsed .nav-text,
  .modern-sidebar.collapsed .user-info,
  .modern-sidebar.collapsed .activity-text {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  
  .modern-sidebar.collapsed .modern-nav-link {
    justify-content: center;
  }
  
  .modern-sidebar.collapsed .modern-user-section {
    justify-content: center;
  }
  
  .modern-sidebar.collapsed .user-actions {
    display: none;
  }
  
  .modern-nav-item {
    opacity: 0;
    transform: translateX(-20px);
    transition: all 0.3s ease;
  }
  
  @media (max-width: 768px) {
    .main-content {
      width: calc(100% - 80px);
    }
    
    .modern-sidebar:hover ~ .main-content {
      width: calc(100% - 280px);
    }
  }
`;
document.head.appendChild(sidebarStyles);

// Sistema de Alertas Modernas
function mostrarAlerta(tipo, mensaje, duracion = 4000) {
  // Crear contenedor de alertas si no existe
  let alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.id = 'alertContainer';
    alertContainer.className = 'alert-container';
    document.body.appendChild(alertContainer);
  }

  // Crear alerta
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo}`;
  
  const iconos = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };

  alerta.innerHTML = `
    <div class="alert-icon">
      <i class="${iconos[tipo] || iconos.info}"></i>
    </div>
    <div class="alert-content">
      <span>${mensaje}</span>
    </div>
    <button class="alert-close" onclick="cerrarAlerta(this.parentElement)">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Agregar al contenedor
  alertContainer.appendChild(alerta);

  // Animar entrada
  requestAnimationFrame(() => {
    alerta.classList.add('show');
  });

  // Auto-cerrar
  if (duracion > 0) {
    setTimeout(() => {
      cerrarAlerta(alerta);
    }, duracion);
  }

  return alerta;
}

function cerrarAlerta(alerta) {
  alerta.classList.remove('show');
  alerta.classList.add('hide');
  
  setTimeout(() => {
    if (alerta.parentElement) {
      alerta.parentElement.removeChild(alerta);
    }
  }, 300);
}
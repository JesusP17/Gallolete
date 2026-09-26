// Módulo Principal de Navegación, Dashboards por Rol y Modales

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  if (Auth.isAuthenticated()) {
    mostrarAppLayout();
  } else {
    mostrarLogin();
  }

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

  // Logout Event Listener
  document.getElementById('btnLogout').addEventListener('click', () => {
    Auth.clearSession();
    mostrarLogin();
  });
}

function mostrarLogin() {
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('appLayout').classList.add('hidden');
}

function mostrarAppLayout() {
  const user = Auth.getUser();
  if (!user) return mostrarLogin();

  document.getElementById('userNombre').innerText = user.nombre_usuario;
  document.getElementById('userRol').innerText = user.rol;

  // Construir navegación lateral según el ROL
  construirMenuPorRol(user.rol);

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
      { id: 'clientes', label: '👥 Clientes' },
      { id: 'membresias', label: '💳 Membresías' },
      { id: 'entrenadores', label: '🏋️ Entrenadores' },
      { id: 'rutinas', label: '📋 Rutinas' },
      { id: 'ejercicios', label: '💪 Ejercicios' },
      { id: 'pagos', label: '💰 Pagos' },
      { id: 'usuarios', label: '⚙️ Usuarios' }
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

// 2. Cargar Dashboard Entrenador
async function cargarDashboardEntrenador() {
  const [resRut, resEj, resCli] = await Promise.all([
    Auth.fetchApi('/rutinas'),
    Auth.fetchApi('/ejercicios'),
    Auth.fetchApi('/clientes')
  ]);

  const rutinas = resRut.ok ? resRut.rutinas : [];
  const ejercicios = resEj.ok ? resEj.ejercicios : [];
  const clientes = resCli.ok ? resCli.clientes : [];

  document.getElementById('statEntrenadorRutinas').innerText = rutinas.filter(r => r.estado === 'activa').length;
  document.getElementById('statEntrenadorEjercicios').innerText = ejercicios.length;
  document.getElementById('statEntrenadorClientes').innerText = clientes.length;

  const tbody = document.getElementById('tableEntrenadorDashboard');
  tbody.innerHTML = rutinas.slice(0, 5).map(r => `
    <tr>
      <td><strong>${r.nombre_rutina}</strong></td>
      <td>${r.cliente_nombre}</td>
      <td>${r.nivel}</td>
      <td><span class="badge badge-${r.estado}">${r.estado}</span></td>
      <td><button class="btn btn-primary btn-sm" onclick="verDetalleRutina(${r.id_rutina})">💪 Ver Ejercicios</button></td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;">No hay rutinas creadas.</td></tr>';
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
  const idCliente = user ? user.id_cliente : 1; // Si no hay vínculo usa id=1 de prueba

  const [resMem, resRut, resPag] = await Promise.all([
    Auth.fetchApi('/membresias'),
    Auth.fetchApi('/rutinas'),
    Auth.fetchApi('/pagos')
  ]);

  const membresias = resMem.ok ? resMem.membresias.filter(m => m.id_cliente === idCliente) : [];
  const rutinas = resRut.ok ? resRut.rutinas.filter(r => r.id_cliente === idCliente) : [];
  const pagos = resPag.ok ? resPag.pagos.filter(p => p.id_cliente === idCliente) : [];

  // Membresía
  const membresiaActual = membresias[0];
  if (membresiaActual) {
    document.getElementById('statClienteMembresiaEstado').innerText = membresiaActual.estado.toUpperCase();
    document.getElementById('statClienteMembresiaFin').innerText = membresiaActual.fecha_fin ? membresiaActual.fecha_fin.substring(0,10) : '-';
  } else {
    document.getElementById('statClienteMembresiaEstado').innerText = 'SIN MEMBRESÍA';
    document.getElementById('statClienteMembresiaFin').innerText = '-';
  }

  // Rutina
  const rutinaActual = rutinas[0];
  if (rutinaActual) {
    document.getElementById('statClienteRutinaNombre').innerText = rutinaActual.nombre_rutina;
    
    // Cargar detalle completo de la rutina con sus ejercicios
    const resDetalle = await Auth.fetchApi(`/rutinas/${rutinaActual.id_rutina}`);
    if (resDetalle.ok && resDetalle.rutina.ejercicios) {
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

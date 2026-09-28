// Módulo de Pasarela de Pago, Analítica de Gráficos (Admin) y Control de Asistencia (Recepcionista)

let chartAfluenciaInstancia = null;
let chartTiposInstancia = null;
let clienteSeleccionadoAsistencia = null;
let registroAsistenciaHoyData = [];

/* ============================================================
   1. ANALÍTICA Y GRÁFICOS INTERACTIVOS (DASHBOARD ADMINISTRADOR)
   ============================================================ */
function cargarGraficosDashboardAdmin() {
  if (typeof Chart === 'undefined') return;

  // Gráfico 1: Días Pico de Afluencia y Pagos (Inicia en 0)
  const ctxAfluencia = document.getElementById('chartAfluenciaPagos');
  if (ctxAfluencia) {
    if (chartAfluenciaInstancia) chartAfluenciaInstancia.destroy();
    
    chartAfluenciaInstancia = new Chart(ctxAfluencia, {
      type: 'bar',
      data: {
        labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        datasets: [
          {
            label: 'Recaudación ($)',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: '#0066ff',
            borderRadius: 6
          },
          {
            label: 'Atletas Asistentes',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: '#00d2ff',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // Gráfico 2: Ventas por Tipo de Membresía (Inicia en 0)
  const ctxTipos = document.getElementById('chartTiposMembresia');
  if (ctxTipos) {
    if (chartTiposInstancia) chartTiposInstancia.destroy();

    chartTiposInstancia = new Chart(ctxTipos, {
      type: 'doughnut',
      data: {
        labels: ['Mensual General ($100k)', 'Mensual VIP ($120k)', 'Trimestral ($300k)', 'Anual Black ($950k)'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#0066ff', '#00d2ff', '#2e7d32', '#ed6c02'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // Tabla Analítica de Días Pico
  renderizarTablaDiasPicoAdmin();
}

function renderizarTablaDiasPicoAdmin() {
  const tbody = document.getElementById('tableAdminDiasPico');
  if (!tbody) return;

  const dias = [
    { dia: 'Lunes', recaudado: '$0', transacciones: 0, promedio: '0 Atletas', carga: 'SIN REGISTROS', badge: 'badge-pendiente' },
    { dia: 'Martes', recaudado: '$0', transacciones: 0, promedio: '0 Atletas', carga: 'SIN REGISTROS', badge: 'badge-pendiente' },
    { dia: 'Miércoles', recaudado: '$0', transacciones: 0, promedio: '0 Atletas', carga: 'SIN REGISTROS', badge: 'badge-pendiente' },
    { dia: 'Jueves', recaudado: '$0', transacciones: 0, promedio: '0 Atletas', carga: 'SIN REGISTROS', badge: 'badge-pendiente' },
    { dia: 'Viernes', recaudado: '$0', transacciones: 0, promedio: '0 Atletas', carga: 'SIN REGISTROS', badge: 'badge-pendiente' },
    { dia: 'Sábado', recaudado: '$0', transacciones: 0, promedio: '0 Atletas', carga: 'SIN REGISTROS', badge: 'badge-pendiente' },
    { dia: 'Domingo', recaudado: '$0', transacciones: 0, promedio: '0 Atletas', carga: 'SIN REGISTROS', badge: 'badge-pendiente' }
  ];

  tbody.innerHTML = dias.map(d => `
    <tr>
      <td><strong>${d.dia}</strong></td>
      <td style="color:var(--primary-color); font-weight:bold;">${d.recaudado}</td>
      <td>${d.transacciones} pagos</td>
      <td>${d.promedio}</td>
      <td><span class="badge ${d.badge}">${d.carga}</span></td>
    </tr>
  `).join('');
}

/* ============================================================
   2. PASARELA DE PAGO INTERACTIVA Y RECIBO DIGITAL
   ============================================================ */
function abrirPasarelaPagoModal(nombrePlan = 'Mensual VIP', precioPlan = 120000, idCliente = null) {
  document.getElementById('modalTitle').innerText = '💳 Pasarela de Pago Seguro GalloLeTe';
  document.getElementById('modalBody').innerHTML = `
    <div style="text-align: center; margin-bottom: 1.2rem;">
      <span class="badge badge-activa" style="margin-bottom:0.5rem;">🔒 PAGO 100% SEGURO • SEDE UNISALAMANCA</span>
      <h3 style="margin: 0.3rem 0; color: var(--text-dark); font-size: 1.4rem;">${nombrePlan}</h3>
      <p style="font-size: 1.8rem; color: var(--primary-color); font-weight: 900; margin: 0.2rem 0;">
        $${parseFloat(precioPlan).toLocaleString('es-CO')} COP
      </p>
    </div>

    <!-- Pestañas Métodos de Pago -->
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1.2rem; flex-wrap: wrap;">
      <button type="button" id="btnPagoTabCard" class="btn btn-primary" style="flex:1;" onclick="seleccionarMetodoPago('tarjeta')">💳 Tarjeta</button>
      <button type="button" id="btnPagoTabNequi" class="btn btn-secondary" style="flex:1;" onclick="seleccionarMetodoPago('nequi')">📱 Nequi / QR</button>
      <button type="button" id="btnPagoTabPSE" class="btn btn-secondary" style="flex:1;" onclick="seleccionarMetodoPago('pse')">🏦 PSE</button>
      <button type="button" id="btnPagoTabEfectivo" class="btn btn-secondary" style="flex:1;" onclick="seleccionarMetodoPago('efectivo')">💵 Efectivo</button>
    </div>

    <!-- FORMULARIO TARJETA -->
    <div id="formMetodoTarjeta">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 1.2rem; border-radius: 12px; margin-bottom: 1.2rem; border: 1px solid rgba(255,255,255,0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <span style="font-weight: bold; letter-spacing: 1px;">GALLOLETE CARD</span>
          <span style="font-size: 1.2rem;">💳 VISA</span>
        </div>
        <div id="cardPreviewNum" style="font-size: 1.2rem; font-family: monospace; letter-spacing: 2px; margin-bottom: 0.8rem;">
          •••• •••• •••• 8492
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
          <div>
            <div style="color: #94a3b8; font-size: 0.65rem;">TITULAR</div>
            <strong id="cardPreviewName">NOMBRE Y APELLIDO</strong>
          </div>
          <div>
            <div style="color: #94a3b8; font-size: 0.65rem;">EXPIRA</div>
            <strong id="cardPreviewExp">12/28</strong>
          </div>
        </div>
      </div>

      <form onsubmit="procesarPagoPasarela(event, '${nombrePlan}', ${precioPlan}, 'Tarjeta')">
        <div class="form-group">
          <label>Número de Tarjeta (16 dígitos) *</label>
          <input type="text" id="pagoCardNumber" class="form-control" placeholder="4532 8901 2345 8492" maxlength="19" required oninput="actualizarPreviewTarjeta()">
        </div>
        <div class="form-group">
          <label>Nombre en la Tarjeta *</label>
          <input type="text" id="pagoCardName" class="form-control" placeholder="Ej: CARLOS MENDOZA" required oninput="actualizarPreviewTarjeta()">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Fecha Vencimiento (MM/AA) *</label>
            <input type="text" id="pagoCardExp" class="form-control" placeholder="12/28" maxlength="5" required oninput="actualizarPreviewTarjeta()">
          </div>
          <div class="form-group">
            <label>CVV / CVC *</label>
            <input type="password" id="pagoCardCvv" class="form-control" placeholder="•••" maxlength="4" required>
          </div>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem; padding:0.8rem; font-size:1.05rem;">
          🚀 Pagar y Activar Membresía $${parseFloat(precioPlan).toLocaleString('es-CO')}
        </button>
      </form>
    </div>

    <!-- FORMULARIO NEQUI / QR -->
    <div id="formMetodoNequi" class="hidden" style="text-align: center;">
      <div style="background: var(--section-alt); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid var(--border-color);">
        <img src="img/logo.png" alt="QR Nequi" style="height: 140px; margin-bottom: 0.8rem;">
        <h4 style="margin: 0; color: var(--text-dark);">Nequi / Daviplata Sede UniSalamanca</h4>
        <p style="margin: 0.4rem 0; font-size: 1.2rem; font-weight: bold; color: var(--primary-color);">📱 300 987 6543</p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Escanea el código QR o transfiere al número indicado.</p>
      </div>
      <form onsubmit="procesarPagoPasarela(event, '${nombrePlan}', ${precioPlan}, 'Nequi')">
        <div class="form-group" style="text-align: left;">
          <label>Número de Comprobante / Transacción Nequi *</label>
          <input type="text" id="pagoNequiRef" class="form-control" placeholder="Ej: M8927402" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem; padding:0.8rem;">
          ✅ Confirmar Transferencia Nequi
        </button>
      </form>
    </div>

    <!-- FORMULARIO PSE -->
    <div id="formMetodoPSE" class="hidden">
      <form onsubmit="procesarPagoPasarela(event, '${nombrePlan}', ${precioPlan}, 'PSE')">
        <div class="form-group">
          <label>Seleccionar Banco *</label>
          <select id="pagoPseBanco" class="form-control" required>
            <option value="Bancolombia">Bancolombia</option>
            <option value="Nequi">Nequi / Daviplata</option>
            <option value="Davivienda">Davivienda</option>
            <option value="Banco de Bogotá">Banco de Bogotá</option>
            <option value="BBVA">BBVA Colombia</option>
          </select>
        </div>
        <div class="form-group">
          <label>Número de Documento del Titular *</label>
          <input type="text" id="pagoPseDoc" class="form-control" placeholder="Ej: 1092837465" required>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem; padding:0.8rem;">
          🏦 Ir a la Plataforma PSE
        </button>
      </form>
    </div>

    <!-- FORMULARIO EFECTIVO -->
    <div id="formMetodoEfectivo" class="hidden" style="text-align: center;">
      <div style="background: var(--section-alt); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid var(--border-color);">
        <div style="font-size: 2.5rem;">🏢</div>
        <h4 style="margin: 0.5rem 0; color: var(--text-dark);">Pago en Recepción Sede UniSalamanca</h4>
        <p style="font-size: 0.9rem; color: var(--text-muted);">
          Puedes pagar directamente en efectivo o datáfono en Cra 50 #79-155.
        </p>
      </div>
      <form onsubmit="procesarPagoPasarela(event, '${nombrePlan}', ${precioPlan}, 'Efectivo en Recepción')">
        <button type="submit" class="btn btn-primary" style="width:100%; padding:0.8rem;">
          🎟️ Generar Ticket de Pago en Caja
        </button>
      </form>
    </div>
  `;
  abrirModal();
}

function seleccionarMetodoPago(metodo) {
  ['Tarjeta', 'Nequi', 'PSE', 'Efectivo'].forEach(m => {
    const btn = document.getElementById(`btnPagoTab${m}`);
    const form = document.getElementById(`formMetodo${m}`);
    if (btn) btn.className = 'btn btn-secondary';
    if (form) form.classList.add('hidden');
  });

  const btnSel = document.getElementById(`btnPagoTab${metodo.charAt(0).toUpperCase() + metodo.slice(1)}`);
  const formSel = document.getElementById(`formMetodo${metodo.charAt(0).toUpperCase() + metodo.slice(1)}`);
  if (btnSel) btnSel.className = 'btn btn-primary';
  if (formSel) formSel.classList.remove('hidden');
}

function actualizarPreviewTarjeta() {
  const num = document.getElementById('pagoCardNumber')?.value || '';
  const name = document.getElementById('pagoCardName')?.value || '';
  const exp = document.getElementById('pagoCardExp')?.value || '';

  const elNum = document.getElementById('cardPreviewNum');
  const elName = document.getElementById('cardPreviewName');
  const elExp = document.getElementById('cardPreviewExp');

  if (elNum) elNum.innerText = num ? num.replace(/\d{4}(?=.)/g, '$& ') : '•••• •••• •••• 8492';
  if (elName) elName.innerText = name ? name.toUpperCase() : 'NOMBRE Y APELLIDO';
  if (elExp) elExp.innerText = exp || '12/28';
}

async function procesarPagoPasarela(e, nombrePlan, precioPlan, metodo) {
  e.preventDefault();
  
  const user = Auth.getUser();
  const clienteNombre = user ? (user.nombre_usuario || user.correo) : 'Cliente Registrado';
  const ref = `GLT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const datosPago = {
    facturaNo: ref,
    fecha: new Date().toLocaleString('es-CO'),
    cliente: clienteNombre,
    plan: nombrePlan,
    monto: precioPlan,
    metodo: metodo,
    sede: 'UniSalamanca Cra 50 #79-155'
  };

  // Mostrar Comprobante Digital
  generarComprobanteDigital(datosPago);
}

function generarComprobanteDigital(pago) {
  document.getElementById('modalTitle').innerText = '🧾 Comprobante Digital de Pago GalloLeTe';
  document.getElementById('modalBody').innerHTML = `
    <div id="seccionReciboDigital" style="background: white; color: #0f172a; padding: 2rem; border-radius: 12px; border: 2px dashed #0066ff; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.2rem;">
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <img src="img/logo.png" alt="Logo" style="height: 45px;">
          <div>
            <h3 style="margin: 0; color: #0066ff; font-size: 1.3rem;">GalloLeTe Gimnasio</h3>
            <small style="color: #64748b;">NIT 900.849.201-4 • Sede UniSalamanca</small>
          </div>
        </div>
        <div style="text-align: right;">
          <span class="badge badge-activa" style="font-size: 0.85rem;">🟢 PAGADO & APROBADO</span>
          <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">${pago.facturaNo}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.9rem; margin-bottom: 1.5rem;">
        <div>
          <div style="color: #64748b;">CLIENTE / ATLETA:</div>
          <strong>${pago.cliente}</strong>
        </div>
        <div>
          <div style="color: #64748b;">FECHA & HORA:</div>
          <strong>${pago.fecha}</strong>
        </div>
        <div>
          <div style="color: #64748b;">MÉTODO DE PAGO:</div>
          <strong>${pago.metodo}</strong>
        </div>
        <div>
          <div style="color: #64748b;">SEDE DE ENTRENAMIENTO:</div>
          <strong>${pago.sede}</strong>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.9rem;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="padding: 0.6rem; color: #0f172a;">Concepto / Plan</th>
            <th style="padding: 0.6rem; text-align: right; color: #0f172a;">Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 0.8rem 0.6rem; border-bottom: 1px solid #e2e8f0;">${pago.plan} (Membresía Completa)</td>
            <td style="padding: 0.8rem 0.6rem; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: bold;">
              $${parseFloat(pago.monto).toLocaleString('es-CO')}
            </td>
          </tr>
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 1rem; border-radius: 8px;">
        <img src="img/logo.png" alt="QR Factura" style="height: 60px;">
        <div style="text-align: right;">
          <div style="font-size: 0.8rem; color: #64748b;">TOTAL CANCELADO:</div>
          <div style="font-size: 1.6rem; font-weight: 900; color: #0066ff;">$${parseFloat(pago.monto).toLocaleString('es-CO')} COP</div>
        </div>
      </div>
    </div>

    <div style="display: flex; gap: 0.8rem; margin-top: 1.2rem;">
      <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="imprimirComprobanteDigital()">🖨️ Imprimir / Guardar PDF</button>
      <button type="button" class="btn btn-primary" style="flex: 1;" onclick="cerrarModal(); mostrarAppLayout();">✅ Finalizar y Volver a Mi Panel</button>
    </div>
  `;
}

function imprimirComprobanteDigital() {
  window.print();
}

/* ============================================================
   3. CONTROL DE ASISTENCIA EN TIEMPO REAL (RECEPCIONISTA)
   ============================================================ */
async function buscarClienteAsistencia(query) {
  const boxRes = document.getElementById('resultadosAsistenciaBuscar');
  if (!boxRes) return;

  if (!query || query.trim().length === 0) {
    boxRes.style.display = 'none';
    return;
  }

  const q = query.toLowerCase().trim();
  let listaAtletas = [{ id_cliente: 1, nombre_usuario: 'JesusP171', nombre: 'Jesus', apellido: 'Perez', correo: 'jesusp171@gmail.com' }];

  const res = await Auth.fetchApi('/clientes');
  if (res.ok && res.clientes && res.clientes.length > 0) {
    listaAtletas = res.clientes;
  }

  const filtrados = listaAtletas.filter(c => 
    (c.nombre_usuario && c.nombre_usuario.toLowerCase().includes(q)) ||
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
    (c.cedula && c.cedula.includes(q)) ||
    (c.correo && c.correo.toLowerCase().includes(q))
  );

  if (filtrados.length === 0) {
    boxRes.innerHTML = `<div style="padding:0.8rem; color:var(--text-muted);">No se encontró ningún atleta con el usuario "${query}".</div>`;
  } else {
    boxRes.innerHTML = filtrados.map(c => {
      const uName = c.nombre_usuario || `${c.nombre} ${c.apellido}`;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.9rem; border-bottom:1px solid var(--border-color); background:var(--card-bg);">
          <div>
            <strong style="color:var(--primary-color);">👤 ${uName}</strong>
            <div style="font-size:0.8rem; color:var(--text-muted);">${c.nombre} ${c.apellido}</div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="marcarAsistenciaDirecta('${uName}')">
            ⚡ Marcar Asistencia
          </button>
        </div>
      `;
    }).join('');
  }
  boxRes.style.display = 'block';
}

function marcarAsistenciaDirecta(nombreUsuario) {
  const boxRes = document.getElementById('resultadosAsistenciaBuscar');
  if (boxRes) boxRes.style.display = 'none';
  document.getElementById('inputAsistenciaBuscar').value = '';

  const horaActual = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });

  const nuevoRegistro = {
    id: Date.now(),
    hora: horaActual,
    cliente: nombreUsuario,
    plan: 'Mensual VIP',
    puerta: 'Torniquete 1 - Principal UniSalamanca',
    estado: '✅ PERMITIDO'
  };

  registroAsistenciaHoyData.unshift(nuevoRegistro);

  mostrarModalNotificacion({
    titulo: '⚡ Asistencia Registrada',
    mensaje: `Entrada registrada con éxito para el usuario "${nombreUsuario}" a las ${horaActual}.`,
    tipo: 'exito'
  });

  cargarRegistroAsistencia();
}

function seleccionarClienteAsistencia(idCliente, nombreCliente) {
  document.getElementById('resultadosAsistenciaBuscar').style.display = 'none';
  document.getElementById('inputAsistenciaBuscar').value = nombreCliente;

  clienteSeleccionadoAsistencia = { id: idCliente, nombre: nombreCliente };

  document.getElementById('verifNombreCliente').innerText = nombreCliente;
  document.getElementById('verifPlanCliente').innerText = 'Plan Mensual VIP • Sede UniSalamanca Cra 50 #79-155';
  document.getElementById('boxVerificacionAtleta').classList.remove('hidden');
}

function ejecutarMarcacionAsistencia() {
  if (!clienteSeleccionadoAsistencia) {
    alert('Por favor busca y selecciona un atleta primero.');
    return;
  }

  marcarAsistenciaDirecta(clienteSeleccionadoAsistencia.nombre);
  document.getElementById('boxVerificacionAtleta').classList.add('hidden');
  clienteSeleccionadoAsistencia = null;
}

function cargarRegistroAsistencia() {
  const tbody = document.getElementById('tableRegistroAsistencia');
  const counterSede = document.getElementById('statRecepAtletasEnSede');
  const counterHoy = document.getElementById('statRecepEntradasHoy');

  if (counterSede) counterSede.innerText = `${registroAsistenciaHoyData.length} / 200`;
  if (counterHoy) counterHoy.innerText = `${registroAsistenciaHoyData.length}`;

  if (!tbody) return;

  if (registroAsistenciaHoyData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No hay asistencias registradas el día de hoy. Usa el buscador para registrar entradas.</td></tr>';
    return;
  }

  tbody.innerHTML = registroAsistenciaHoyData.map(r => `
    <tr>
      <td><strong>${r.hora}</strong></td>
      <td><strong>👤 ${r.cliente}</strong></td>
      <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${r.plan}</span></td>
      <td><small>${r.puerta}</small></td>
      <td><span class="badge badge-activa">${r.estado}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="marcarSalidaAsistencia(${r.id})">🚪 Registrar Salida</button>
      </td>
    </tr>
  `).join('');
}

function marcarSalidaAsistencia(id) {
  registroAsistenciaHoyData = registroAsistenciaHoyData.filter(r => r.id !== id);
  cargarRegistroAsistencia();
}

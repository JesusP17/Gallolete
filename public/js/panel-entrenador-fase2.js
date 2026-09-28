// ============================================================
// PANEL DE ENTRENADOR - FASE 2
// Funcionalidades avanzadas: Gráficos, Alertas, Comparativas
// ============================================================

const PanelEntrenadorFase2 = {
  graficos: {},
  alertas: [],
  historialProgreso: {},

  // ============================================================
  // 1. GRÁFICOS DE EVOLUCIÓN DE PROGRESO
  // ============================================================
  
  async cargarEvolucionCliente(idCliente) {
    try {
      const respuesta = await Auth.fetchApi(`/progresos?id_cliente=${idCliente}`);
      
      if (respuesta.ok && respuesta.registros) {
        this.historialProgreso[idCliente] = respuesta.registros;
        return respuesta.registros;
      }
      return [];
    } catch (error) {
      console.error('Error al cargar evolución:', error);
      return [];
    }
  },

  async mostrarGraficosProgreso(idCliente) {
    const cliente = PanelEntrenador.clientes.find(c => c.id_cliente === idCliente);
    
    if (!cliente) {
      mostrarAlerta('error', 'Cliente no encontrado');
      return;
    }

    // Cargar datos de progreso
    const registros = await this.cargarEvolucionCliente(idCliente);
    
    if (registros.length === 0) {
      mostrarAlerta('info', 'Este cliente aún no tiene registros de progreso');
      return;
    }

    // Preparar datos para los gráficos
    const fechas = registros.map(r => r.fecha).reverse();
    const peso = registros.map(r => r.peso || null).reverse();
    const grasaPorcentaje = registros.map(r => r.grasa_porcentaje || null).reverse();
    const pecho = registros.map(r => r.pecho || null).reverse();
    const cintura = registros.map(r => r.cintura || null).reverse();
    const cadera = registros.map(r => r.cadera || null).reverse();
    const brazo = registros.map(r => r.brazo || null).reverse();
    const pierna = registros.map(r => r.pierna || null).reverse();

    const modalBody = `
      <div style="margin-bottom: 1.5rem;">
        <h4>📈 Evolución de ${cliente.nombre} ${cliente.apellido}</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Registros: ${registros.length} | 
          Primer registro: ${fechas[0]} | 
          Último registro: ${fechas[fechas.length - 1]}
        </p>
      </div>

      <!-- Tabs para diferentes gráficos -->
      <div class="tabs-container" style="margin-bottom: 1rem;">
        <button class="tab-btn active" onclick="PanelEntrenadorFase2.cambiarGrafico('peso')">Peso</button>
        <button class="tab-btn" onclick="PanelEntrenadorFase2.cambiarGrafico('grasa')">% Grasa</button>
        <button class="tab-btn" onclick="PanelEntrenadorFase2.cambiarGrafico('medidas')">Medidas</button>
        <button class="tab-btn" onclick="PanelEntrenadorFase2.cambiarGrafico('comparativa')">Comparativa</button>
      </div>

      <!-- Gráfico de Peso -->
      <div id="grafico-peso" class="grafico-container">
        <canvas id="chartPeso"></canvas>
      </div>

      <!-- Gráfico de Grasa -->
      <div id="grafico-grasa" class="grafico-container hidden">
        <canvas id="chartGrasa"></canvas>
      </div>

      <!-- Gráfico de Medidas -->
      <div id="grafico-medidas" class="grafico-container hidden">
        <canvas id="chartMedidas"></canvas>
      </div>

      <!-- Tabla Comparativa -->
      <div id="grafico-comparativa" class="grafico-container hidden">
        ${this.generarTablaComparativa(registros)}
      </div>

      <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button class="btn btn-primary" onclick="PanelEntrenador.registrarProgreso(${idCliente})">
          + Nuevo Registro
        </button>
        <button class="btn btn-secondary" onclick="cerrarModal()">
          Cerrar
        </button>
      </div>
    `;

    abrirModalGenerico('Evolución del Cliente', modalBody);

    // Crear gráficos después de que el modal esté visible
    setTimeout(() => {
      this.crearGraficoPeso(fechas, peso);
      this.crearGraficoGrasa(fechas, grasaPorcentaje);
      this.crearGraficoMedidas(fechas, { pecho, cintura, cadera, brazo, pierna });
    }, 100);
  },

  crearGraficoPeso(fechas, datos) {
    const ctx = document.getElementById('chartPeso');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (this.graficos.peso) {
      this.graficos.peso.destroy();
    }

    this.graficos.peso = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fechas,
        datasets: [{
          label: 'Peso (kg)',
          data: datos,
          borderColor: '#e63946',
          backgroundColor: 'rgba(230, 57, 70, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Evolución del Peso',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Kilogramos (kg)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Fecha'
            }
          }
        }
      }
    });
  },

  crearGraficoGrasa(fechas, datos) {
    const ctx = document.getElementById('chartGrasa');
    if (!ctx) return;

    if (this.graficos.grasa) {
      this.graficos.grasa.destroy();
    }

    this.graficos.grasa = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fechas,
        datasets: [{
          label: '% Grasa Corporal',
          data: datos,
          borderColor: '#ffb703',
          backgroundColor: 'rgba(255, 183, 3, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Evolución del % de Grasa Corporal',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Porcentaje (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Fecha'
            }
          }
        }
      }
    });
  },

  crearGraficoMedidas(fechas, medidas) {
    const ctx = document.getElementById('chartMedidas');
    if (!ctx) return;

    if (this.graficos.medidas) {
      this.graficos.medidas.destroy();
    }

    const datasets = [];
    const colores = {
      pecho: { border: '#e63946', bg: 'rgba(230, 57, 70, 0.1)' },
      cintura: { border: '#457b9d', bg: 'rgba(69, 123, 157, 0.1)' },
      cadera: { border: '#38b000', bg: 'rgba(56, 176, 0, 0.1)' },
      brazo: { border: '#ffb703', bg: 'rgba(255, 183, 3, 0.1)' },
      pierna: { border: '#d90429', bg: 'rgba(217, 4, 41, 0.1)' }
    };

    for (const [nombre, valores] of Object.entries(medidas)) {
      if (valores.some(v => v !== null)) {
        datasets.push({
          label: nombre.charAt(0).toUpperCase() + nombre.slice(1) + ' (cm)',
          data: valores,
          borderColor: colores[nombre].border,
          backgroundColor: colores[nombre].bg,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        });
      }
    }

    this.graficos.medidas = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fechas,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Evolución de Medidas Corporales',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Centímetros (cm)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Fecha'
            }
          }
        }
      }
    });
  },

  cambiarGrafico(tipo) {
    // Ocultar todos los gráficos
    document.querySelectorAll('.grafico-container').forEach(g => g.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // Mostrar el gráfico seleccionado
    const contenedor = document.getElementById(`grafico-${tipo}`);
    if (contenedor) {
      contenedor.classList.remove('hidden');
    }
    
    // Marcar tab activo
    event.target.classList.add('active');
  },

  generarTablaComparativa(registros) {
    if (registros.length < 2) {
      return '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">Se necesitan al menos 2 registros para mostrar la comparativa</p>';
    }

    const primero = registros[0];
    const ultimo = registros[registros.length - 1];

    const calcularCambio = (inicial, actual) => {
      if (!inicial || !actual) return '-';
      const cambio = actual - inicial;
      const porcentaje = ((cambio / inicial) * 100).toFixed(1);
      const signo = cambio >= 0 ? '+' : '';
      const color = cambio < 0 ? 'var(--success)' : cambio > 0 ? 'var(--danger)' : 'var(--text-muted)';
      return `<span style="color: ${color}; font-weight: bold;">${signo}${cambio.toFixed(1)} (${signo}${porcentaje}%)</span>`;
    };

    return `
      <div style="margin-bottom: 1rem;">
        <h4>📊 Comparativa: Antes vs Ahora</h4>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Primer registro: ${primero.fecha} | Último registro: ${ultimo.fecha}
        </p>
      </div>

      <table style="width: 100%;">
        <thead>
          <tr>
            <th>Medida</th>
            <th>Inicial</th>
            <th>Actual</th>
            <th>Cambio</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Peso</strong></td>
            <td>${primero.peso ? primero.peso + ' kg' : '-'}</td>
            <td>${ultimo.peso ? ultimo.peso + ' kg' : '-'}</td>
            <td>${calcularCambio(primero.peso, ultimo.peso)}</td>
          </tr>
          <tr>
            <td><strong>% Grasa</strong></td>
            <td>${primero.grasa_porcentaje ? primero.grasa_porcentaje + '%' : '-'}</td>
            <td>${ultimo.grasa_porcentaje ? ultimo.grasa_porcentaje + '%' : '-'}</td>
            <td>${calcularCambio(primero.grasa_porcentaje, ultimo.grasa_porcentaje)}</td>
          </tr>
          <tr>
            <td><strong>Pecho</strong></td>
            <td>${primero.pecho ? primero.pecho + ' cm' : '-'}</td>
            <td>${ultimo.pecho ? ultimo.pecho + ' cm' : '-'}</td>
            <td>${calcularCambio(primero.pecho, ultimo.pecho)}</td>
          </tr>
          <tr>
            <td><strong>Cintura</strong></td>
            <td>${primero.cintura ? primero.cintura + ' cm' : '-'}</td>
            <td>${ultimo.cintura ? ultimo.cintura + ' cm' : '-'}</td>
            <td>${calcularCambio(primero.cintura, ultimo.cintura)}</td>
          </tr>
          <tr>
            <td><strong>Cadera</strong></td>
            <td>${primero.cadera ? primero.cadera + ' cm' : '-'}</td>
            <td>${ultimo.cadera ? ultimo.cadera + ' cm' : '-'}</td>
            <td>${calcularCambio(primero.cadera, ultimo.cadera)}</td>
          </tr>
          <tr>
            <td><strong>Brazo</strong></td>
            <td>${primero.brazo ? primero.brazo + ' cm' : '-'}</td>
            <td>${ultimo.brazo ? ultimo.brazo + ' cm' : '-'}</td>
            <td>${calcularCambio(primero.brazo, ultimo.brazo)}</td>
          </tr>
          <tr>
            <td><strong>Pierna</strong></td>
            <td>${primero.pierna ? primero.pierna + ' cm' : '-'}</td>
            <td>${ultimo.pierna ? ultimo.pierna + ' cm' : '-'}</td>
            <td>${calcularCambio(primero.pierna, ultimo.pierna)}</td>
          </tr>
        </tbody>
      </table>

      ${ultimo.comentarios ? `
        <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
          <strong>Último comentario:</strong><br>
          ${ultimo.comentarios}
        </div>
      ` : ''}
    `;
  },

  // ============================================================
  // 2. SISTEMA DE ALERTAS Y NOTIFICACIONES
  // ============================================================

  async cargarAlertas() {
    this.alertas = [];

    // Alertas de membresías próximas a vencer
    const clientesConAlertas = PanelEntrenador.clientes.filter(c => {
      return c.dias_restantes_membresia !== null && 
             c.dias_restantes_membresia >= 0 && 
             c.dias_restantes_membresia <= 7;
    });

    clientesConAlertas.forEach(c => {
      this.alertas.push({
        tipo: 'warning',
        icono: '⚠️',
        titulo: 'Membresía por vencer',
        mensaje: `${c.nombre} ${c.apellido} - ${c.dias_restantes_membresia} días restantes`,
        cliente: c,
        accion: () => this.alertaMembresia(c)
      });
    });

    // Alertas de clientes sin asistencia reciente (más de 7 días)
    try {
      const respuesta = await Auth.fetchApi('/asistencias');
      if (respuesta.ok) {
        const asistencias = respuesta.asistencias;
        const hoy = new Date();
        
        PanelEntrenador.clientes.forEach(cliente => {
          const asistenciasCliente = asistencias.filter(a => a.id_cliente === cliente.id_cliente);
          
          if (asistenciasCliente.length > 0) {
            const ultimaAsistencia = new Date(Math.max(...asistenciasCliente.map(a => new Date(a.fecha))));
            const diasSinAsistir = Math.floor((hoy - ultimaAsistencia) / (1000 * 60 * 60 * 24));
            
            if (diasSinAsistir > 7) {
              this.alertas.push({
                tipo: 'info',
                icono: '📅',
                titulo: 'Cliente inactivo',
                mensaje: `${cliente.nombre} ${cliente.apellido} - ${diasSinAsistir} días sin asistir`,
                cliente: cliente,
                accion: () => PanelEntrenador.verDetalleCliente(cliente.id_cliente)
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error al verificar asistencias:', error);
    }

    // Alertas de clientes sin rutinas
    const clientesSinRutina = PanelEntrenador.clientes.filter(c => c.total_rutinas === 0);
    clientesSinRutina.forEach(c => {
      this.alertas.push({
        tipo: 'info',
        icono: '📋',
        titulo: 'Sin rutina asignada',
        mensaje: `${c.nombre} ${c.apellido} no tiene rutinas`,
        cliente: c,
        accion: () => PanelEntrenador.crearRutinaParaCliente(c.id_cliente)
      });
    });

    return this.alertas;
  },

  async mostrarPanelAlertas() {
    await this.cargarAlertas();

    if (this.alertas.length === 0) {
      const modalBody = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <div class="empty-state-text">¡Todo en orden!</div>
          <div class="empty-state-subtext">No hay alertas pendientes en este momento</div>
        </div>
        <div style="margin-top: 1.5rem; text-align: center;">
          <button class="btn btn-secondary" onclick="cerrarModal()">Cerrar</button>
        </div>
      `;
      abrirModalGenerico('Notificaciones y Alertas', modalBody);
      return;
    }

    // Agrupar alertas por tipo
    const porTipo = {
      warning: this.alertas.filter(a => a.tipo === 'warning'),
      info: this.alertas.filter(a => a.tipo === 'info')
    };

    const modalBody = `
      <div style="margin-bottom: 1rem;">
        <p style="color: var(--text-muted);">
          Tienes <strong>${this.alertas.length}</strong> alerta(s) pendiente(s)
        </p>
      </div>

      ${porTipo.warning.length > 0 ? `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: var(--warning); display: flex; align-items: center; gap: 0.5rem;">
            ⚠️ Advertencias (${porTipo.warning.length})
          </h4>
          <div style="margin-top: 0.5rem;">
            ${porTipo.warning.map((alerta, index) => this.generarAlertaHTML(alerta, index)).join('')}
          </div>
        </div>
      ` : ''}

      ${porTipo.info.length > 0 ? `
        <div style="margin-bottom: 1.5rem;">
          <h4 style="color: var(--primary-color); display: flex; align-items: center; gap: 0.5rem;">
            📢 Información (${porTipo.info.length})
          </h4>
          <div style="margin-top: 0.5rem;">
            ${porTipo.info.map((alerta, index) => this.generarAlertaHTML(alerta, index + porTipo.warning.length)).join('')}
          </div>
        </div>
      ` : ''}

      <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="cerrarModal()">Cerrar</button>
      </div>
    `;

    abrirModalGenerico('🔔 Notificaciones y Alertas', modalBody);
  },

  generarAlertaHTML(alerta, index) {
    const claseAlerta = `alert-${alerta.tipo}`;
    return `
      <div class="alert ${claseAlerta}" style="margin-bottom: 0.5rem; cursor: pointer;" onclick="PanelEntrenadorFase2.alertas[${index}].accion()">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <span style="font-size: 1.5rem;">${alerta.icono}</span>
          <div style="flex: 1;">
            <strong>${alerta.titulo}</strong><br>
            <span style="font-size: 0.9rem;">${alerta.mensaje}</span>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();">
            Ver
          </button>
        </div>
      </div>
    `;
  },

  // Pinta las alertas que están ocurriendo ahora mismo en el dashboard,
  // sin necesidad de abrir el modal de notificaciones.
  renderizarAlertasActivas() {
    const strip = document.getElementById('alertsStripEntrenador');
    if (!strip) return;

    const total = this.alertas ? this.alertas.length : 0;

    if (total === 0) {
      strip.innerHTML = `
        <div class="alerts-strip-header">
          <span class="alerts-strip-title"><i class="fas fa-bell"></i> Alertas activas (0)</span>
        </div>
        <div class="alerts-strip-list">
          <div class="alerts-strip-item ok">
            <span class="alerts-strip-icon">✅</span>
            <div class="alerts-strip-body">
              <strong>Todo en orden</strong>
              <span>No hay alertas pendientes en este momento</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    strip.innerHTML = `
      <div class="alerts-strip-header">
        <span class="alerts-strip-title"><i class="fas fa-bell"></i> Alertas activas (${total})</span>
        <button type="button" class="alerts-strip-all" onclick="PanelEntrenadorFase2.mostrarPanelAlertas()">Ver todas</button>
      </div>
      <div class="alerts-strip-list">
        ${this.alertas.map((alerta, index) => `
          <div class="alerts-strip-item ${alerta.tipo}">
            <span class="alerts-strip-icon">${alerta.icono}</span>
            <div class="alerts-strip-body">
              <strong>${alerta.titulo}</strong>
              <span>${alerta.mensaje}</span>
            </div>
            <button type="button" class="alerts-strip-action" onclick="PanelEntrenadorFase2.alertas[${index}].accion()">Atender</button>
          </div>
        `).join('')}
      </div>
    `;
  },

  alertaMembresia(cliente) {
    cerrarModal();
    setTimeout(() => {
      PanelEntrenador.verDetalleCliente(cliente.id_cliente);
    }, 300);
  },

  // ============================================================
  // 3. HISTORIAL DE ASISTENCIAS POR CLIENTE
  // ============================================================

  async mostrarHistorialAsistencias(idCliente) {
    const cliente = PanelEntrenador.clientes.find(c => c.id_cliente === idCliente);
    
    if (!cliente) {
      mostrarAlerta('error', 'Cliente no encontrado');
      return;
    }

    try {
      const respuesta = await Auth.fetchApi(`/asistencias?id_cliente=${idCliente}`);
      
      if (!respuesta.ok) {
        mostrarAlerta('error', 'Error al cargar historial de asistencias');
        return;
      }

      const asistencias = respuesta.asistencias || [];
      
      // Calcular estadísticas
      const totalAsistencias = asistencias.length;
      const ultimaAsistencia = asistencias.length > 0 ? asistencias[0].fecha : null;
      
      // Asistencias por mes
      const porMes = {};
      asistencias.forEach(a => {
        const mes = a.fecha.substring(0, 7); // YYYY-MM
        porMes[mes] = (porMes[mes] || 0) + 1;
      });

      const modalBody = `
        <div style="margin-bottom: 1.5rem;">
          <h4>📅 Historial de Asistencias</h4>
          <p style="color: var(--text-muted);">
            <strong>${cliente.nombre} ${cliente.apellido}</strong>
          </p>
        </div>

        <div class="stats-grid" style="margin-bottom: 1.5rem;">
          <div class="stat-card">
            <span class="title">Total Asistencias</span>
            <span class="value" style="color: var(--success);">${totalAsistencias}</span>
          </div>
          <div class="stat-card">
            <span class="title">Última Asistencia</span>
            <span class="value" style="font-size: 1.2rem;">${ultimaAsistencia || 'N/A'}</span>
          </div>
          <div class="stat-card">
            <span class="title">Promedio Mensual</span>
            <span class="value">${Object.keys(porMes).length > 0 ? (totalAsistencias / Object.keys(porMes).length).toFixed(1) : 0}</span>
          </div>
        </div>

        ${asistencias.length > 0 ? `
          <div style="max-height: 400px; overflow-y: auto;">
            <table style="width: 100%;">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                ${asistencias.map(a => `
                  <tr>
                    <td><strong>${a.fecha}</strong></td>
                    <td>${a.hora_entrada || '-'}</td>
                    <td>${a.hora_salida || '-'}</td>
                    <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${a.observaciones || '-'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <div class="empty-state-text">Sin asistencias registradas</div>
            <div class="empty-state-subtext">Este cliente aún no ha asistido al gimnasio</div>
          </div>
        `}

        <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button class="btn btn-primary" onclick="PanelEntrenador.registrarAsistenciaRapida(${idCliente})">
            + Nueva Asistencia
          </button>
          <button class="btn btn-secondary" onclick="cerrarModal()">
            Cerrar
          </button>
        </div>
      `;

      abrirModalGenerico('Historial de Asistencias', modalBody);

    } catch (error) {
      console.error('Error al cargar historial:', error);
      mostrarAlerta('error', 'Error al cargar el historial de asistencias');
    }
  }
};

// Agregar botones de gráficos y alertas al detalle del cliente
const originalVerDetalleCliente = PanelEntrenador.verDetalleCliente;
PanelEntrenador.verDetalleCliente = function(idCliente) {
  const clienteOriginal = this.clienteSeleccionado;
  originalVerDetalleCliente.call(this, idCliente);
  
  // Esperar a que se abra el modal y agregar botones adicionales
  setTimeout(() => {
    const modalBody = document.getElementById('modalBody');
    if (modalBody) {
      const botonesAdicionales = modalBody.querySelector('div[style*="justify-content: flex-end"]');
      if (botonesAdicionales) {
        // Agregar botones de Fase 2
        const btnGraficos = document.createElement('button');
        btnGraficos.className = 'btn btn-primary';
        btnGraficos.innerHTML = '📈 Ver Gráficos';
        btnGraficos.onclick = () => {
          cerrarModal();
          setTimeout(() => PanelEntrenadorFase2.mostrarGraficosProgreso(idCliente), 300);
        };

        const btnHistorial = document.createElement('button');
        btnHistorial.className = 'btn btn-secondary';
        btnHistorial.innerHTML = '📅 Historial';
        btnHistorial.onclick = () => {
          cerrarModal();
          setTimeout(() => PanelEntrenadorFase2.mostrarHistorialAsistencias(idCliente), 300);
        };

        botonesAdicionales.insertBefore(btnHistorial, botonesAdicionales.children[2]);
        botonesAdicionales.insertBefore(btnGraficos, botonesAdicionales.children[2]);
      }
    }
  }, 100);
};

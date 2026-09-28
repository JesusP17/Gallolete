// ============================================================
// PANEL DE ENTRENADOR - FASE 1
// ============================================================

const PanelEntrenador = {
  estadisticas: null,
  clientes: [],
  rutinas: [],
  clienteSeleccionado: null,
  rutinaSeleccionada: null,

  // Inicializar el panel del entrenador
  async inicializar() {
    console.log('🏋️ Inicializando Panel de Entrenador...');
    await this.cargarDashboard();
    
    // Cargar y mostrar contador de alertas (Fase 2)
    if (typeof PanelEntrenadorFase2 !== 'undefined') {
      await PanelEntrenadorFase2.cargarAlertas();
      const contadorElem = document.getElementById('contadorAlertas');
      if (contadorElem) {
        if (PanelEntrenadorFase2.alertas.length > 0) {
          contadorElem.textContent = PanelEntrenadorFase2.alertas.length;
          contadorElem.style.display = 'flex';
        } else {
          contadorElem.style.display = 'none';
        }
      }
      PanelEntrenadorFase2.renderizarAlertasActivas();
    }
  },

  // ============================================================
  // 1. DASHBOARD CON ESTADÍSTICAS
  // ============================================================
  async cargarDashboard() {
    try {
      // Cargar estadísticas del entrenador
      const respuesta = await Auth.fetchApi('/entrenadores/estadisticas');
      
      if (respuesta.ok) {
        this.estadisticas = respuesta.estadisticas;
        this.renderizarEstadisticas();
      } else {
        mostrarAlerta('error', respuesta.mensaje || 'Error al cargar estadísticas');
      }

      // Cargar clientes para la sección de dashboard
      await this.cargarMisClientes();

      // Cargar rutinas para el widget de "Rutinas Recientes"
      await this.cargarMisRutinas();
      this.renderizarRutinasRecientesModernas();

    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      mostrarAlerta('error', 'Error al cargar el dashboard del entrenador');
    }
  },

  renderizarEstadisticas() {
    const stats = this.estadisticas;
    
    // Actualizar stats modernos con animación
    this.actualizarEstadisticaAnimada('statEntrenadorClientes', stats.clientes_asignados || 0);
    this.actualizarEstadisticaAnimada('statEntrenadorRutinas', stats.rutinas_activas || 0);
    this.actualizarEstadisticaAnimada('statEntrenadorEjercicios', stats.total_ejercicios || 0);
    
    // Actualizar asistencias en el nuevo diseño
    const statAsistencias = document.getElementById('statEntrenadorAsistencias');
    if (statAsistencias) {
      this.actualizarEstadisticaAnimada('statEntrenadorAsistencias', stats.total_asistencias || 0);
    }

    // Renderizar timeline de actividad
    this.renderizarTimelineActividad();
    
    // Renderizar rutinas recientes modernas
    this.renderizarRutinasRecientesModernas();
    
    // Actualizar fecha del widget con efecto typewriter
    const fechaHoy = document.getElementById('fechaHoy');
    if (fechaHoy) {
      const fecha = new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (window.animationManager) {
        window.animationManager.typeWriter(fechaHoy, fecha, 30);
      } else {
        fechaHoy.textContent = fecha;
      }
    }
  },

  // Nueva función para actualizar estadísticas con animación
  actualizarEstadisticaAnimada(elementId, nuevoValor) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
      const valorActual = parseInt(elemento.textContent) || 0;
      
      if (nuevoValor !== valorActual) {
        elemento.setAttribute('data-target', nuevoValor);
        
        // Usar AnimationUtils si está disponible
        if (window.AnimationUtils) {
          window.AnimationUtils.countUp(elemento, nuevoValor, 1500);
        } else {
          elemento.textContent = nuevoValor;
        }
        
        // Agregar efecto de celebración si aumentó significativamente
        if (nuevoValor > valorActual + 2) {
          setTimeout(() => {
            if (window.animationManager) {
              window.animationManager.showSuccessAnimation(elemento.closest('.modern-stat-card'));
            }
          }, 1000);
        }
      }
    }
  },

  renderizarTimelineActividad() {
    const timeline = document.getElementById('timelineEntrenador');
    if (!timeline) return;

    const actividades = [
      {
        icono: 'fas fa-user-plus',
        titulo: 'Nuevo cliente asignado',
        descripcion: 'María González se unió a tu grupo',
        tiempo: 'Hace 2 horas',
        tipo: 'success'
      },
      {
        icono: 'fas fa-dumbbell',
        titulo: 'Rutina completada',
        descripcion: 'Carlos terminó su rutina de pecho',
        tiempo: 'Hace 4 horas',
        tipo: 'primary'
      },
      {
        icono: 'fas fa-chart-line',
        titulo: 'Progreso registrado',
        descripcion: 'Ana actualizó sus medidas corporales',
        tiempo: 'Ayer',
        tipo: 'info'
      },
      {
        icono: 'fas fa-calendar-check',
        titulo: 'Asistencia registrada',
        descripcion: '5 clientes asistieron hoy',
        tiempo: 'Hace 6 horas',
        tipo: 'warning'
      }
    ];

    timeline.innerHTML = actividades.map(actividad => `
      <div class="timeline-item">
        <div class="timeline-icon">
          <i class="${actividad.icono}"></i>
        </div>
        <div class="timeline-content">
          <div class="timeline-title">${actividad.titulo}</div>
          <div class="timeline-desc">${actividad.descripcion}</div>
          <div class="timeline-time">${actividad.tiempo}</div>
        </div>
      </div>
    `).join('');
  },

  renderizarRutinasRecientesModernas() {
    const container = document.getElementById('rutinasRecientesContainer');
    if (!container || !this.rutinas) return;

    const rutinasRecientes = this.rutinas.slice(0, 4);

    if (rutinasRecientes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <i class="fas fa-clipboard-list" style="font-size: 2rem; opacity: 0.3; margin-bottom: 1rem;"></i>
          <p>No hay rutinas recientes</p>
        </div>
      `;
      return;
    }

    container.innerHTML = rutinasRecientes.map(rutina => `
      <div class="rutina-card-mini" onclick="PanelEntrenador.verDetalleRutina(${rutina.id_rutina})">
        <div class="rutina-card-header">
          <div class="rutina-title">${rutina.nombre_rutina}</div>
          <span class="rutina-badge badge-${rutina.estado}">${rutina.estado}</span>
        </div>
        <div class="rutina-client">
          <i class="fas fa-user"></i> ${rutina.cliente_nombre}
        </div>
      </div>
    `).join('');
  },

  // ============================================================
  // 2. GESTIÓN DE CLIENTES
  // ============================================================
  async cargarMisClientes() {
    try {
      const respuesta = await Auth.fetchApi('/entrenadores/mis-clientes');
      
      if (respuesta.ok) {
        this.clientes = respuesta.clientes;
        this.renderizarListaClientes();
        return this.clientes;
      } else {
        mostrarAlerta('error', respuesta.mensaje || 'Error al cargar clientes');
        return [];
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      mostrarAlerta('error', 'Error al cargar la lista de clientes');
      return [];
    }
  },

  renderizarListaClientes() {
    const tbody = document.getElementById('tableEntrenadorClientes');
    if (!tbody) return;

    if (this.clientes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No tienes clientes asignados</td></tr>';
      return;
    }

    tbody.innerHTML = this.clientes.map(cliente => {
      const membresiaBadge = this.generarBadgeMembresia(cliente);
      const diasRestantes = cliente.dias_restantes_membresia;
      const alertaVencimiento = diasRestantes !== null && diasRestantes < 7 && diasRestantes >= 0;
      
      return `
        <tr>
          <td data-label="Cliente"><strong>${cliente.nombre} ${cliente.apellido}</strong></td>
          <td data-label="Documento">${cliente.documento}</td>
          <td data-label="Teléfono">${cliente.telefono || '-'}</td>
          <td data-label="Membresía">${membresiaBadge}</td>
          <td data-label="Días Restantes">
            ${alertaVencimiento ? 
              `<span class="badge badge-pendiente">⚠️ ${diasRestantes} días</span>` : 
              diasRestantes !== null ? `${diasRestantes} días` : '-'
            }
          </td>
          <td data-label="Rutinas">${cliente.total_rutinas || 0}</td>
          <td data-label="Acciones" class="trainer-cell-actions">
            <button class="btn btn-primary btn-sm" onclick="PanelEntrenador.verDetalleCliente(${cliente.id_cliente})" title="Ver detalle completo">
              Ver Detalle
            </button>
            <button class="btn btn-secondary btn-sm" onclick="PanelEntrenador.registrarAsistenciaRapida(${cliente.id_cliente})" title="Registrar asistencia">
              ✓ Asistencia
            </button>
            <button class="btn btn-secondary btn-sm" onclick="PanelEntrenadorFase2.mostrarGraficosProgreso(${cliente.id_cliente})" title="Ver gráficos de progreso">
              📈
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  generarBadgeMembresia(cliente) {
    const estado = cliente.membresia_estado;
    const tipo = cliente.membresia_tipo;
    
    if (!estado) return '<span class="badge badge-inactivo">Sin membresía</span>';
    
    let badgeClass = 'badge-';
    switch (estado) {
      case 'activa':
        badgeClass += cliente.membresia_al_dia ? 'activa' : 'pendiente';
        break;
      case 'vencida':
        badgeClass += 'vencida';
        break;
      case 'cancelada':
        badgeClass += 'cancelada';
        break;
      default:
        badgeClass += 'inactivo';
    }
    
    return `<span class="badge ${badgeClass}">${tipo || estado}</span>`;
  },

  // Filtrar clientes
  filtrarClientes(criterio) {
    const tbody = document.getElementById('tableEntrenadorClientes');
    const filas = tbody.querySelectorAll('tr');
    
    filas.forEach(fila => {
      const texto = fila.textContent.toLowerCase();
      if (texto.includes(criterio.toLowerCase())) {
        fila.style.display = '';
      } else {
        fila.style.display = 'none';
      }
    });
  },

  // Ver detalle completo del cliente
  async verDetalleCliente(idCliente) {
    this.clienteSeleccionado = this.clientes.find(c => c.id_cliente === idCliente);
    
    if (!this.clienteSeleccionado) {
      mostrarAlerta('error', 'Cliente no encontrado');
      return;
    }

    const cliente = this.clienteSeleccionado;
    
    // Cargar rutinas del cliente
    const rutinasCliente = this.rutinas.filter(r => r.id_cliente === idCliente);
    
    const modalBody = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <strong>Nombre:</strong><br>
          ${cliente.nombre} ${cliente.apellido}
        </div>
        <div>
          <strong>Documento:</strong><br>
          ${cliente.documento}
        </div>
        <div>
          <strong>Teléfono:</strong><br>
          ${cliente.telefono || '-'}
        </div>
        <div>
          <strong>Correo:</strong><br>
          ${cliente.correo || '-'}
        </div>
        <div>
          <strong>Membresía:</strong><br>
          ${this.generarBadgeMembresia(cliente)}
        </div>
        <div>
          <strong>Días Restantes:</strong><br>
          ${cliente.dias_restantes_membresia !== null ? cliente.dias_restantes_membresia + ' días' : '-'}
        </div>
        <div>
          <strong>Total Rutinas:</strong><br>
          ${cliente.total_rutinas || 0}
        </div>
        <div>
          <strong>Total Asistencias:</strong><br>
          ${cliente.total_asistencias || 0}
        </div>
      </div>

      <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
        <strong>Rutinas Asignadas:</strong>
        ${rutinasCliente.length > 0 ? 
          `<ul style="margin-top: 0.5rem;">
            ${rutinasCliente.map(r => `<li>${r.nombre_rutina} - <span class="badge badge-${r.estado}">${r.estado}</span></li>`).join('')}
          </ul>` :
          '<p style="color: var(--text-muted); margin-top: 0.5rem;">No tiene rutinas asignadas</p>'
        }
      </div>

      <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
        <button class="btn btn-primary" onclick="PanelEntrenador.crearRutinaParaCliente(${idCliente})">
          + Crear Rutina
        </button>
        <button class="btn btn-secondary" onclick="PanelEntrenador.registrarAsistenciaRapida(${idCliente})">
          ✓ Registrar Asistencia
        </button>
        <button class="btn btn-secondary" onclick="PanelEntrenador.registrarProgreso(${idCliente})">
          📈 Registrar Progreso
        </button>
        <button class="btn btn-secondary" onclick="cerrarModal()">
          Cerrar
        </button>
      </div>
    `;

    abrirModalGenerico('Detalle del Cliente', modalBody);
  },

  // ============================================================
  // 3. GESTIÓN DE RUTINAS
  // ============================================================
  async cargarMisRutinas() {
    try {
      const respuesta = await Auth.fetchApi('/entrenadores/mis-rutinas');
      
      if (respuesta.ok) {
        this.rutinas = respuesta.rutinas;
        this.renderizarListaRutinas();
        this.renderizarRutinasDashboard();
        return this.rutinas;
      } else {
        mostrarAlerta('error', respuesta.mensaje || 'Error al cargar rutinas');
        return [];
      }
    } catch (error) {
      console.error('Error al cargar rutinas:', error);
      mostrarAlerta('error', 'Error al cargar la lista de rutinas');
      return [];
    }
  },

  renderizarListaRutinas() {
    const tbody = document.getElementById('tableEntrenadorRutinas');
    if (!tbody) return;

    if (this.rutinas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No tienes rutinas creadas</td></tr>';
      return;
    }

    tbody.innerHTML = this.rutinas.map(rutina => `
      <tr>
        <td data-label="Rutina"><strong>${rutina.nombre_rutina}</strong></td>
        <td data-label="Cliente">${rutina.cliente_nombre}</td>
        <td data-label="Nivel"><span class="badge" style="background: #e3f2fd; color: #1976d2;">${rutina.nivel}</span></td>
        <td data-label="Fecha Inicio">${rutina.fecha_inicio || '-'}</td>
        <td data-label="Estado"><span class="badge badge-${rutina.estado}">${rutina.estado}</span></td>
        <td data-label="Acciones" class="trainer-cell-actions">
          <button class="btn btn-primary btn-sm" onclick="PanelEntrenador.verDetalleRutina(${rutina.id_rutina})">
            Ver Detalle
          </button>
          <button class="btn btn-secondary btn-sm" onclick="PanelEntrenador.editarRutina(${rutina.id_rutina})">
            Editar
          </button>
        </td>
      </tr>
    `).join('');
  },

  renderizarRutinasDashboard() {
    const tbody = document.getElementById('tableEntrenadorDashboard');
    if (!tbody) return;

    const rutinasRecientes = this.rutinas.slice(0, 5);

    if (rutinasRecientes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">No hay rutinas recientes</td></tr>';
      return;
    }

    tbody.innerHTML = rutinasRecientes.map(rutina => `
      <tr>
        <td><strong>${rutina.nombre_rutina}</strong></td>
        <td>${rutina.cliente_nombre}</td>
        <td><span class="badge" style="background: #e3f2fd; color: #1976d2;">${rutina.nivel}</span></td>
        <td><span class="badge badge-${rutina.estado}">${rutina.estado}</span></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="PanelEntrenador.verDetalleRutina(${rutina.id_rutina})">
            Ver
          </button>
        </td>
      </tr>
    `).join('');
  },

  // Ver detalle de rutina con ejercicios
  async verDetalleRutina(idRutina) {
    try {
      // Buscar la rutina en la lista cargada
      const rutina = this.rutinas.find(r => r.id_rutina === idRutina);
      
      if (!rutina) {
        mostrarAlerta('error', 'Rutina no encontrada');
        return;
      }

      // Cargar los ejercicios de la rutina
      const respuesta = await Auth.fetchApi(`/rutinas/${idRutina}`);
      
      if (!respuesta.ok) {
        mostrarAlerta('error', 'Error al cargar los detalles de la rutina');
        return;
      }

      const rutinaCompleta = respuesta.rutina;
      const ejercicios = rutinaCompleta.ejercicios || [];

      const modalBody = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <strong>Rutina:</strong><br>
            ${rutinaCompleta.nombre_rutina}
          </div>
          <div>
            <strong>Cliente:</strong><br>
            ${rutinaCompleta.cliente_nombre || '-'}
          </div>
          <div>
            <strong>Nivel:</strong><br>
            <span class="badge" style="background: #e3f2fd; color: #1976d2;">${rutinaCompleta.nivel}</span>
          </div>
          <div>
            <strong>Estado:</strong><br>
            <span class="badge badge-${rutinaCompleta.estado}">${rutinaCompleta.estado}</span>
          </div>
          <div>
            <strong>Fecha Inicio:</strong><br>
            ${rutinaCompleta.fecha_inicio || '-'}
          </div>
          <div>
            <strong>Fecha Fin:</strong><br>
            ${rutinaCompleta.fecha_fin || '-'}
          </div>
        </div>

        ${rutinaCompleta.objetivo ? `
          <div style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
            <strong>Objetivo:</strong><br>
            ${rutinaCompleta.objetivo}
          </div>
        ` : ''}

        <h4 style="margin-top: 1.5rem; margin-bottom: 1rem;">Ejercicios (${ejercicios.length})</h4>
        <div style="max-height: 300px; overflow-y: auto;">
          <table style="width: 100%;">
            <thead>
              <tr>
                <th>Ejercicio</th>
                <th>Series</th>
                <th>Reps</th>
                <th>Peso</th>
                <th>Descanso</th>
              </tr>
            </thead>
            <tbody>
              ${ejercicios.length > 0 ? ejercicios.map(ej => `
                <tr>
                  <td>${ej.ejercicio_nombre}</td>
                  <td>${ej.series}</td>
                  <td>${ej.repeticiones}</td>
                  <td>${ej.peso ? ej.peso + ' kg' : '-'}</td>
                  <td>${ej.descanso}</td>
                </tr>
              `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 1rem; color: var(--text-muted);">Sin ejercicios asignados</td></tr>'}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button class="btn btn-primary" onclick="PanelEntrenador.editarRutina(${idRutina})">
            Editar Rutina
          </button>
          <button class="btn btn-secondary" onclick="cerrarModal()">
            Cerrar
          </button>
        </div>
      `;

      abrirModalGenerico('Detalle de Rutina', modalBody);

    } catch (error) {
      console.error('Error al cargar detalle de rutina:', error);
      mostrarAlerta('error', 'Error al cargar los detalles de la rutina');
    }
  },

  // Crear rutina para un cliente específico
  crearRutinaParaCliente(idCliente) {
    cerrarModal();
    // Cambiar a la pestaña de rutinas y abrir modal de creación
    cambiarTab('rutinas');
    setTimeout(() => {
      abrirModalRutina(null, idCliente);
    }, 300);
  },

  // Editar rutina existente
  editarRutina(idRutina) {
    cerrarModal();
    cambiarTab('rutinas');
    setTimeout(() => {
      abrirModalRutina(idRutina);
    }, 300);
  },

  // ============================================================
  // 4. REGISTRO DE ASISTENCIAS
  // ============================================================
  async registrarAsistenciaRapida(idCliente) {
    const cliente = this.clientes.find(c => c.id_cliente === idCliente);
    
    if (!cliente) {
      mostrarAlerta('error', 'Cliente no encontrado');
      return;
    }

    // Obtener fecha y hora actual
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);

    const modalBody = `
      <form id="formAsistenciaRapida">
        <div class="form-group">
          <label>Cliente</label>
          <input type="text" class="form-control" value="${cliente.nombre} ${cliente.apellido}" readonly>
        </div>
        
        <div class="form-group">
          <label>Fecha</label>
          <input type="date" id="asistenciaFecha" class="form-control" value="${fecha}" required>
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label>Hora de Entrada</label>
            <input type="time" id="asistenciaHoraEntrada" class="form-control" value="${hora}" required>
          </div>
          
          <div class="form-group">
            <label>Hora de Salida (Opcional)</label>
            <input type="time" id="asistenciaHoraSalida" class="form-control">
          </div>
        </div>

        <div class="form-group">
          <label>Observaciones (Opcional)</label>
          <textarea id="asistenciaObservaciones" class="form-control" rows="3" placeholder="Ej: Cliente completó toda la rutina, excelente forma"></textarea>
        </div>

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">✓ Registrar Asistencia</button>
        </div>
      </form>
    `;

    abrirModalGenerico('Registrar Asistencia', modalBody);

    // Manejar el envío del formulario
    document.getElementById('formAsistenciaRapida').onsubmit = async (e) => {
      e.preventDefault();
      await this.guardarAsistencia(idCliente);
    };
  },

  async guardarAsistencia(idCliente) {
    const datos = {
      id_cliente: idCliente,
      fecha: document.getElementById('asistenciaFecha').value,
      hora_entrada: document.getElementById('asistenciaHoraEntrada').value,
      hora_salida: document.getElementById('asistenciaHoraSalida').value || null,
      observaciones: document.getElementById('asistenciaObservaciones').value || null
    };

    try {
      const respuesta = await Auth.fetchApi('/asistencias', {
        method: 'POST',
        body: JSON.stringify(datos)
      });

      if (respuesta.ok) {
        mostrarAlerta('success', 'Asistencia registrada correctamente');
        cerrarModal();
        // Recargar estadísticas
        await this.cargarDashboard();
      } else {
        mostrarAlerta('error', respuesta.mensaje || 'Error al registrar asistencia');
      }
    } catch (error) {
      console.error('Error al guardar asistencia:', error);
      mostrarAlerta('error', 'Error al registrar la asistencia');
    }
  },

  // ============================================================
  // 5. REGISTRO DE PROGRESO
  // ============================================================
  async registrarProgreso(idCliente) {
    const cliente = this.clientes.find(c => c.id_cliente === idCliente);
    
    if (!cliente) {
      mostrarAlerta('error', 'Cliente no encontrado');
      return;
    }

    const fecha = new Date().toISOString().split('T')[0];

    const modalBody = `
      <form id="formProgreso">
        <div class="form-group">
          <label>Cliente</label>
          <input type="text" class="form-control" value="${cliente.nombre} ${cliente.apellido}" readonly>
        </div>
        
        <div class="form-group">
          <label>Fecha de Registro</label>
          <input type="date" id="progresoFecha" class="form-control" value="${fecha}" required>
        </div>

        <h4 style="margin-top: 1.5rem; margin-bottom: 1rem;">Medidas Corporales</h4>
        
        <div class="grid-2">
          <div class="form-group">
            <label>Peso (kg)</label>
            <input type="number" id="progresoPeso" class="form-control" step="0.1" placeholder="Ej: 75.5">
          </div>
          
          <div class="form-group">
            <label>% Grasa Corporal</label>
            <input type="number" id="progresoGrasa" class="form-control" step="0.1" placeholder="Ej: 18.5">
          </div>

          <div class="form-group">
            <label>Pecho (cm)</label>
            <input type="number" id="progresoPecho" class="form-control" step="0.1" placeholder="Ej: 95.0">
          </div>

          <div class="form-group">
            <label>Cintura (cm)</label>
            <input type="number" id="progresoCintura" class="form-control" step="0.1" placeholder="Ej: 80.0">
          </div>

          <div class="form-group">
            <label>Cadera (cm)</label>
            <input type="number" id="progresoCadera" class="form-control" step="0.1" placeholder="Ej: 95.0">
          </div>

          <div class="form-group">
            <label>Brazo (cm)</label>
            <input type="number" id="progresoBrazo" class="form-control" step="0.1" placeholder="Ej: 35.0">
          </div>

          <div class="form-group">
            <label>Pierna (cm)</label>
            <input type="number" id="progresoPierna" class="form-control" step="0.1" placeholder="Ej: 55.0">
          </div>
        </div>

        <div class="form-group" style="margin-top: 1rem;">
          <label>Comentarios / Observaciones</label>
          <textarea id="progresoComentarios" class="form-control" rows="3" placeholder="Ej: Excelente progreso, ha perdido 2kg desde la última medición"></textarea>
        </div>

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
          <button type="button" class="btn btn-secondary" onclick="cerrarModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">📈 Guardar Progreso</button>
        </div>
      </form>
    `;

    abrirModalGenerico('Registrar Progreso del Cliente', modalBody);

    // Manejar el envío del formulario
    document.getElementById('formProgreso').onsubmit = async (e) => {
      e.preventDefault();
      await this.guardarProgreso(idCliente);
    };
  },

  async guardarProgreso(idCliente) {
    const datos = {
      id_cliente: idCliente,
      fecha: document.getElementById('progresoFecha').value,
      peso: document.getElementById('progresoPeso').value || null,
      grasa_porcentaje: document.getElementById('progresoGrasa').value || null,
      pecho: document.getElementById('progresoPecho').value || null,
      cintura: document.getElementById('progresoCintura').value || null,
      cadera: document.getElementById('progresoCadera').value || null,
      brazo: document.getElementById('progresoBrazo').value || null,
      pierna: document.getElementById('progresoPierna').value || null,
      comentarios: document.getElementById('progresoComentarios').value || null
    };

    // Validar que al menos un campo de medida esté lleno
    const tieneMedidas = datos.peso || datos.grasa_porcentaje || datos.pecho || 
                         datos.cintura || datos.cadera || datos.brazo || datos.pierna;

    if (!tieneMedidas) {
      mostrarAlerta('error', 'Debes ingresar al menos una medida');
      return;
    }

    try {
      const respuesta = await Auth.fetchApi('/progresos', {
        method: 'POST',
        body: JSON.stringify(datos)
      });

      if (respuesta.ok) {
        mostrarAlerta('success', 'Progreso registrado correctamente');
        cerrarModal();
        // Recargar clientes para actualizar el último progreso
        await this.cargarMisClientes();
      } else {
        mostrarAlerta('error', respuesta.mensaje || 'Error al registrar progreso');
      }
    } catch (error) {
      console.error('Error al guardar progreso:', error);
      mostrarAlerta('error', 'Error al registrar el progreso');
    }
  }
};

// ============================================================
// SECCIÓN DEL PANEL DE ENTRENADOR EN EL HTML
// ============================================================
function inicializarVistasEntrenador() {
  const mainContent = document.querySelector('.main-content');
  
  // Verificar si ya existen las secciones
  if (document.getElementById('tab-entrenador-clientes')) {
    return; // Ya están creadas
  }

  // Crear la sección de Mis Clientes
  const seccionClientes = document.createElement('section');
  seccionClientes.id = 'tab-entrenador-clientes';
  seccionClientes.className = 'tab-content hidden';
  seccionClientes.innerHTML = `
    <div class="trainer-panel">
      <div class="trainer-panel-header">
        <div class="trainer-panel-title">
          <div class="trainer-panel-icon"><i class="fas fa-user-friends"></i></div>
          <div>
            <h2>Mis Atletas</h2>
            <p>Clientes asignados a tu supervisión</p>
          </div>
        </div>
        <div class="trainer-panel-tools">
          <div class="trainer-search">
            <i class="fas fa-search"></i>
            <input type="text" id="searchMisClientes" placeholder="Buscar atleta..." onkeyup="PanelEntrenador.filtrarClientes(this.value)">
          </div>
          <button class="trainer-btn" onclick="PanelEntrenador.cargarMisClientes()">
            <i class="fas fa-sync-alt"></i> Actualizar
          </button>
        </div>
      </div>
      <div class="trainer-table-wrap">
        <table class="trainer-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th>Membresía</th>
              <th>Días Restantes</th>
              <th>Rutinas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="tableEntrenadorClientes"></tbody>
        </table>
      </div>
    </div>
  `;
  mainContent.appendChild(seccionClientes);

  // Crear la sección de Mis Rutinas
  const seccionRutinas = document.createElement('section');
  seccionRutinas.id = 'tab-entrenador-rutinas';
  seccionRutinas.className = 'tab-content hidden';
  seccionRutinas.innerHTML = `
    <div class="trainer-panel">
      <div class="trainer-panel-header">
        <div class="trainer-panel-title">
          <div class="trainer-panel-icon"><i class="fas fa-list-alt"></i></div>
          <div>
            <h2>Mis Rutinas</h2>
            <p>Planes de entrenamiento que has creado</p>
          </div>
        </div>
        <div class="trainer-panel-tools">
          <button class="trainer-btn trainer-btn-primary" onclick="cambiarTab('rutinas'); abrirModalRutina();">
            <i class="fas fa-plus"></i> Nueva Rutina
          </button>
        </div>
      </div>
      <div class="trainer-table-wrap">
        <table class="trainer-table">
          <thead>
            <tr>
              <th>Rutina</th>
              <th>Cliente</th>
              <th>Nivel</th>
              <th>Fecha Inicio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="tableEntrenadorRutinas"></tbody>
        </table>
      </div>
    </div>
  `;
  mainContent.appendChild(seccionRutinas);
}

// Función de utilidad para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
  // Crear elemento de alerta
  const alerta = document.createElement('div');
  alerta.className = `badge badge-${tipo === 'success' ? 'activa' : 'vencida'}`;
  alerta.textContent = mensaje;
  alerta.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    z-index: 10000;
    font-size: 0.95rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(alerta);

  // Remover después de 3 segundos
  setTimeout(() => {
    alerta.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => alerta.remove(), 300);
  }, 3000);
}

// Función para abrir modal genérico
function abrirModalGenerico(titulo, contenidoHTML) {
  document.getElementById('modalTitle').textContent = titulo;
  document.getElementById('modalBody').innerHTML = contenidoHTML;
  document.getElementById('modalOverlay').classList.add('active');
}

// Función para modal de asistencia rápida desde dashboard
function abrirModalAsistenciaRapida() {
  if (!PanelEntrenador.clientes || PanelEntrenador.clientes.length === 0) {
    mostrarAlerta('info', 'Primero necesitas cargar tus clientes');
    cambiarTab('entrenador-clientes');
    return;
  }

  const modalBody = `
    <div style="text-align: center; margin-bottom: 2rem;">
      <div style="width: 80px; height: 80px; background: var(--gradient-success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto;">
        <i class="fas fa-user-check" style="font-size: 2rem; color: white;"></i>
      </div>
      <h3 style="color: var(--dark-bg); margin-bottom: 0.5rem;">Registro Rápido de Asistencia</h3>
      <p style="color: var(--text-muted);">Selecciona un cliente y registra su asistencia al gimnasio</p>
    </div>

    <form id="formAsistenciaRapidaDashboard">
      <div class="form-group">
        <label>Seleccionar Cliente</label>
        <select id="clienteAsistenciaRapida" class="form-control" required>
          <option value="">-- Selecciona un cliente --</option>
          ${PanelEntrenador.clientes.map(c => `
            <option value="${c.id_cliente}">${c.nombre} ${c.apellido} - ${c.documento}</option>
          `).join('')}
        </select>
      </div>
      
      <div class="grid-2">
        <div class="form-group">
          <label>Fecha</label>
          <input type="date" id="fechaAsistenciaRapida" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
        
        <div class="form-group">
          <label>Hora de Entrada</label>
          <input type="time" id="horaAsistenciaRapida" class="form-control" value="${new Date().toTimeString().split(' ')[0].substring(0, 5)}" required>
        </div>
      </div>

      <div class="form-group">
        <label>Observaciones (Opcional)</label>
        <textarea id="obsAsistenciaRapida" class="form-control" rows="2" placeholder="Ej: Cliente muy motivado, completó toda la rutina"></textarea>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-top: 2rem;">
        <button type="submit" class="btn-modern btn-primary" style="flex: 1;">
          <i class="fas fa-check"></i>
          <span>Registrar Asistencia</span>
        </button>
        <button type="button" class="btn-modern btn-outline" onclick="cerrarModal()">
          <i class="fas fa-times"></i>
          <span>Cancelar</span>
        </button>
      </div>
    </form>
  `;

  abrirModalGenerico('Registro Rápido de Asistencia', modalBody);
  
  // Agregar clase modal-large para mejor visualización
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.classList.add('modal-large');
  }

  // Manejar envío del formulario
  document.getElementById('formAsistenciaRapidaDashboard').onsubmit = async (e) => {
    e.preventDefault();
    
    const idCliente = document.getElementById('clienteAsistenciaRapida').value;
    const fecha = document.getElementById('fechaAsistenciaRapida').value;
    const hora = document.getElementById('horaAsistenciaRapida').value;
    const observaciones = document.getElementById('obsAsistenciaRapida').value;

    const datos = {
      id_cliente: parseInt(idCliente),
      fecha: fecha,
      hora_entrada: hora,
      observaciones: observaciones || null
    };

    try {
      const respuesta = await Auth.fetchApi('/asistencias', {
        method: 'POST',
        body: JSON.stringify(datos)
      });

      if (respuesta.ok) {
        mostrarAlerta('success', 'Asistencia registrada correctamente');
        cerrarModal();
        // Recargar estadísticas del dashboard
        await PanelEntrenador.cargarDashboard();
      } else {
        mostrarAlerta('error', respuesta.mensaje || 'Error al registrar asistencia');
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarAlerta('error', 'Error al registrar la asistencia');
    }
  };
}
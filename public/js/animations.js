// Módulo de Animaciones y Micro-interacciones Avanzadas

class AnimationManager {
  constructor() {
    this.init();
  }

  init() {
    this.initScrollAnimations();
    this.initCounterAnimations();
    this.initParallaxEffects();
    this.initHoverEffects();
    this.initPageTransitions();
    this.initScrollIndicator();
    this.initFloatingElements();
    this.initTooltips();
  }

  // 1. Animaciones basadas en scroll
  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          
          // Agregar clase de animación escalonada
          if (entry.target.classList.contains('stats-grid') || 
              entry.target.classList.contains('clients-grid')) {
            entry.target.classList.add('stagger-animation');
          }
          
          // Iniciar contadores animados
          if (entry.target.querySelector('.animated-counter')) {
            this.animateCounters(entry.target);
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    // Observar elementos para reveal
    document.querySelectorAll('.stat-card, .client-card, .quick-action-card, .timeline-item')
      .forEach(el => {
        el.classList.add('reveal-on-scroll');
        observer.observe(el);
      });
  }

  // 2. Animación de contadores
  animateCounters(container) {
    const counters = container.querySelectorAll('.animated-counter');
    
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target') || counter.textContent);
      const duration = parseInt(counter.getAttribute('data-duration') || '2000');
      const start = 0;
      const increment = target / (duration / 16);
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          counter.textContent = target;
          counter.classList.add('counter-increment');
          clearInterval(timer);
        } else {
          counter.textContent = Math.floor(current);
        }
      }, 16);
    });
  }

  // 3. Efectos parallax sutiles
  initParallaxEffects() {
    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.stat-card, .client-card');

      parallaxElements.forEach((el, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed * 0.1);
        el.style.transform = `translateY(${yPos}px)`;
      });

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    });
  }

  // 4. Efectos de hover mejorados
  initHoverEffects() {
    // Efecto de magnetic hover para botones
    document.querySelectorAll('.btn-modern, .btn-card').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        btn.style.transform = `perspective(1000px) rotateX(${y * 0.1}deg) rotateY(${x * 0.1}deg)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });

    // Efecto ripple mejorado
    document.querySelectorAll('.btn-modern, .btn-card, .client-card').forEach(el => {
      el.addEventListener('click', this.createRipple.bind(this));
    });
  }

  // 5. Efecto ripple personalizado
  createRipple(e) {
    const button = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${e.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple-effect');

    const ripple = button.getElementsByClassName('ripple-effect')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);

    setTimeout(() => {
      circle.remove();
    }, 600);
  }

  // 6. Transiciones de página suaves
  initPageTransitions() {
    // Interceptar cambios de tab
    const originalCambiarTab = window.cambiarTab;
    window.cambiarTab = (tab) => {
      // Fade out actual
      const currentTab = document.querySelector('.tab-content:not(.hidden)');
      if (currentTab) {
        currentTab.style.opacity = '0';
        currentTab.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
          originalCambiarTab(tab);
          
          // Fade in nuevo
          const newTab = document.getElementById(`tab-${tab}`);
          if (newTab) {
            newTab.style.opacity = '0';
            newTab.style.transform = 'translateX(20px)';
            
            requestAnimationFrame(() => {
              newTab.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
              newTab.style.opacity = '1';
              newTab.style.transform = 'translateX(0)';
            });
          }
        }, 200);
      } else {
        originalCambiarTab(tab);
      }
    };
  }

  // 7. Indicador de progreso de scroll
  initScrollIndicator() {
    let indicator = document.querySelector('.scroll-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'scroll-indicator';
      document.body.appendChild(indicator);
    }

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      const scrollPercent = scrollTop / docHeight;
      
      indicator.style.transform = `scaleX(${scrollPercent})`;
    });
  }

  // 8. Elementos flotantes
  initFloatingElements() {
    // Crear botón flotante de ayuda
    const floatingBtn = document.createElement('button');
    floatingBtn.className = 'floating-btn';
    floatingBtn.innerHTML = '<i class="fas fa-question"></i>';
    floatingBtn.setAttribute('data-tooltip', '¿Necesitas ayuda?');
    
    floatingBtn.addEventListener('click', () => {
      this.showHelpModal();
    });

    document.body.appendChild(floatingBtn);

    // Animación flotante sutil
    setInterval(() => {
      floatingBtn.style.transform += ' translateY(-2px)';
      setTimeout(() => {
        floatingBtn.style.transform = floatingBtn.style.transform.replace(' translateY(-2px)', '');
      }, 1000);
    }, 3000);
  }

  // 9. Sistema de tooltips avanzado
  initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        this.showTooltip(e.target, e.target.getAttribute('data-tooltip'));
      });

      el.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  showTooltip(element, text) {
    let tooltip = document.getElementById('dynamic-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'dynamic-tooltip';
      tooltip.className = 'dynamic-tooltip';
      document.body.appendChild(tooltip);
    }

    tooltip.textContent = text;
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';

    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
  }

  hideTooltip() {
    const tooltip = document.getElementById('dynamic-tooltip');
    if (tooltip) {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    }
  }

  // 10. Modal de ayuda
  showHelpModal() {
    const helpContent = `
      <div class="help-content">
        <div class="help-section">
          <h3><i class="fas fa-tachometer-alt"></i> Dashboard</h3>
          <p>Visualiza estadísticas generales y acciones rápidas para gestionar tu gimnasio eficientemente.</p>
        </div>
        <div class="help-section">
          <h3><i class="fas fa-user-friends"></i> Atletas</h3>
          <p>Gestiona la información de tus clientes, ve su progreso y asigna rutinas personalizadas.</p>
        </div>
        <div class="help-section">
          <h3><i class="fas fa-dumbbell"></i> Rutinas</h3>
          <p>Crea y edita rutinas de ejercicios adaptadas a las necesidades de cada atleta.</p>
        </div>
        <div class="help-section">
          <h3><i class="fas fa-chart-line"></i> Progreso</h3>
          <p>Registra y monitorea el progreso de tus atletas con gráficos visuales y estadísticas.</p>
        </div>
      </div>
    `;

    abrirModalModerno(
      'Centro de Ayuda',
      'Guía rápida para usar el Panel de Entrenador',
      'fas fa-life-ring',
      helpContent
    );
  }

  // 11. Animaciones de éxito y error
  showSuccessAnimation(element) {
    element.classList.add('celebration-effect', 'bounce-success');
    setTimeout(() => {
      element.classList.remove('celebration-effect', 'bounce-success');
    }, 2000);
  }

  showErrorAnimation(element) {
    element.classList.add('shake-error');
    setTimeout(() => {
      element.classList.remove('shake-error');
    }, 600);
  }

  // 12. Progreso circular animado
  animateCircularProgress(element, percentage) {
    element.style.setProperty('--progress', percentage);
    element.classList.add('animate');
    
    const text = element.querySelector('.progress-text');
    if (text) {
      this.animateCounter(text, percentage);
    }
  }

  animateCounter(element, target) {
    let current = 0;
    const increment = target / 60; // 60 frames para suavidad
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = Math.round(target) + '%';
        clearInterval(timer);
      } else {
        element.textContent = Math.round(current) + '%';
      }
    }, 16);
  }

  // 13. Efecto typewriter para textos
  typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    }
    
    type();
  }

  // 14. Lazy loading de imágenes con animación
  initLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          img.classList.add('fade-in');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // 15. Gestos táctiles para móviles
  initTouchGestures() {
    let startX, startY, distX, distY;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener('touchmove', (e) => {
      if (!startX || !startY) return;

      distX = e.touches[0].clientX - startX;
      distY = e.touches[0].clientY - startY;

      // Swipe horizontal para cambiar tabs (en móviles)
      if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > 100) {
        if (distX > 0) {
          // Swipe right - tab anterior
          this.navigateTab('previous');
        } else {
          // Swipe left - siguiente tab
          this.navigateTab('next');
        }
        
        startX = null;
        startY = null;
      }
    });
  }

  navigateTab(direction) {
    const tabs = ['dashboard-entrenador', 'clientes', 'rutinas', 'ejercicios'];
    const currentTab = document.querySelector('.sidebar-nav a.active')?.getAttribute('onclick')?.match(/cambiarTab\('([^']+)'\)/)?.[1];
    
    if (currentTab) {
      const currentIndex = tabs.indexOf(currentTab);
      let newIndex;
      
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % tabs.length;
      } else {
        newIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
      }
      
      cambiarTab(tabs[newIndex]);
    }
  }
}

// Funciones utilitarias globales
window.AnimationUtils = {
  // Función para animar números
  countUp: (element, target, duration = 2000) => {
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        element.textContent = target;
        element.classList.add(increment > 0 ? 'counter-increment' : 'counter-decrement');
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  },

  // Función para mostrar loading
  showLoading: (element) => {
    element.classList.add('loading-skeleton');
    element.innerHTML = '<div class="pulse-loader"></div>';
  },

  // Función para ocultar loading
  hideLoading: (element, originalContent) => {
    element.classList.remove('loading-skeleton');
    element.innerHTML = originalContent;
  },

  // Función para efecto de confetti
  confetti: (element) => {
    for (let i = 0; i < 50; i++) {
      const confettiPiece = document.createElement('div');
      confettiPiece.className = 'confetti-piece';
      confettiPiece.style.left = Math.random() * 100 + '%';
      confettiPiece.style.animationDelay = Math.random() * 3 + 's';
      confettiPiece.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      element.appendChild(confettiPiece);

      setTimeout(() => {
        confettiPiece.remove();
      }, 3000);
    }
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.animationManager = new AnimationManager();
  
  // Agregar estilos CSS adicionales para efectos dinámicos
  const additionalStyles = `
    <style>
      .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
      }
      
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
      
      .dynamic-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
        pointer-events: none;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .confetti-piece {
        position: absolute;
        width: 10px;
        height: 10px;
        animation: confettiFall 3s ease-out infinite;
      }
      
      @keyframes confettiFall {
        0% {
          transform: translateY(-100vh) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
      
      .fade-in {
        animation: fadeIn 0.5s ease-in;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .help-content {
        display: grid;
        gap: 1.5rem;
      }
      
      .help-section {
        padding: 1.5rem;
        background: rgba(77, 161, 169, 0.05);
        border-radius: 12px;
        border-left: 4px solid var(--primary-color);
      }
      
      .help-section h3 {
        margin: 0 0 1rem 0;
        color: var(--primary-color);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .help-section p {
        margin: 0;
        line-height: 1.6;
        color: var(--text-light);
      }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', additionalStyles);
});

// Exportar para uso en otros módulos
window.AnimationManager = AnimationManager;
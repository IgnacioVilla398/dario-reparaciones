/* ==========================================================================
   START PC — JavaScript nativo (sin dependencias)
   Módulos: configuración, header, menú, scroll-spy, reveal, contadores,
            FAQ, parallax, formulario por email, volver arriba
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. CONFIGURACIÓN — datos de contacto del sitio
     ------------------------------------------------------------------ */
  const CONFIG = {
    // Casilla donde llegan los pedidos de presupuesto del formulario
    email: 'contacto@dariusreparaciones.com',
    appName: 'Start Pc',
    asunto: 'Presupuesto desde la web - Start Pc'
  };

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------------
     2. HEADER: fondo al scrollear + botón "volver arriba"
     ------------------------------------------------------------------ */
  function initHeader() {
    const header = $('#header');
    const toTop  = $('#toTop');
    if (!header) return;

    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      if (toTop) toTop.classList.toggle('is-visible', y > 700);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', () => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    }
  }

  /* ------------------------------------------------------------------
     3. MENÚ MÓVIL
     ------------------------------------------------------------------ */
  function initMenu() {
    const burger = $('#burger');
    const list   = $('#navList');
    if (!burger || !list) return;

    const close = () => {
      list.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menú de navegación');
      document.body.style.removeProperty('overflow');
    };

    const open = () => {
      list.classList.add('is-open');
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Cerrar menú de navegación');
      document.body.style.overflow = 'hidden';
    };

    burger.addEventListener('click', () => {
      list.classList.contains('is-open') ? close() : open();
    });

    // Cerrar al elegir una sección
    $$('.nav__link', list).forEach((link) => link.addEventListener('click', close));

    // Cerrar con Escape o al agrandar la ventana
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && list.classList.contains('is-open')) {
        close();
        burger.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) close();
    });
  }

  /* ------------------------------------------------------------------
     4. SCROLL-SPY: resalta el enlace de la sección visible
     ------------------------------------------------------------------ */
  function initScrollSpy() {
    const links = $$('.nav__link');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const map = new Map();
    links.forEach((link) => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const section = document.querySelector(id);
      if (section) map.set(section, link);
    });
    if (!map.size) return;

    const ratios = new Map();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      });

      let best = null;
      let bestRatio = 0;
      ratios.forEach((ratio, section) => {
        if (ratio > bestRatio) { bestRatio = ratio; best = section; }
      });

      if (best) {
        links.forEach((l) => l.classList.remove('is-active'));
        const active = map.get(best);
        if (active) active.classList.add('is-active');
      }
    }, {
      rootMargin: '-45% 0px -45% 0px',
      threshold: [0, 0.25, 0.5, 1]
    });

    map.forEach((_link, section) => observer.observe(section));
  }

  /* ------------------------------------------------------------------
     5. ANIMACIONES DE APARICIÓN (reveal)
     ------------------------------------------------------------------ */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = Array.from(el.parentElement ? el.parentElement.children : []);
        const index = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = `${Math.min(index * 90, 450)}ms`;
        el.classList.add('is-visible');
        observer.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -60px 0px' });

    items.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
     6. CONTADORES ANIMADOS DEL HERO
     ------------------------------------------------------------------ */
  function initCounters() {
    const counters = $$('[data-count]');
    if (!counters.length) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const run = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || '';

      if (reduce) { el.textContent = target + suffix; return; }

      const duration = 1500;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------
     7. ACORDEÓN DE PREGUNTAS FRECUENTES
     ------------------------------------------------------------------ */
  function initFaq() {
    const items = $$('.faq__item');
    if (!items.length) return;

    const closeAll = (except) => {
      items.forEach((item) => {
        if (item === except) return;
        item.classList.remove('is-open');
        const btn = $('.faq__q', item);
        const panel = $('.faq__a', item);
        if (btn) btn.setAttribute('aria-expanded', 'false');
        if (panel) panel.style.maxHeight = '0px';
      });
    };

    items.forEach((item) => {
      const btn = $('.faq__q', item);
      const panel = $('.faq__a', item);
      if (!btn || !panel) return;

      btn.setAttribute('aria-expanded', 'false');
      panel.style.maxHeight = '0px';

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        closeAll(item);
        if (isOpen) {
          item.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
          panel.style.maxHeight = '0px';
        } else {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        }
      });

      // Recalcular la altura si el texto se reacomoda
      window.addEventListener('resize', () => {
        if (item.classList.contains('is-open')) {
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     8. PARALLAX DE FONDOS (secciones Nosotros y Preguntas frecuentes)
     ------------------------------------------------------------------ */
  function initParallax() {
    const layers = $$('[data-parallax]');
    if (!layers.length) return;

    // Con "reducir movimiento" activado el fondo queda quieto: lo maneja el CSS,
    // que en ese caso usa background-attachment: fixed.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ultimo = 0;

    const update = () => {
      const vh = window.innerHeight;

      layers.forEach((layer) => {
        const section = layer.parentElement;
        if (!section) return;

        const rect = section.getBoundingClientRect();
        // Si la sección está lejos de la pantalla, no gastamos trabajo
        if (rect.bottom < -200 || rect.top > vh + 200) return;

        const speed = parseFloat(layer.dataset.parallax) || 0.16;
        // -1 = la sección está por debajo | 1 = ya pasó por arriba
        const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
        const shift = (-progress * speed * 100).toFixed(2);

        layer.style.transform = `translate3d(0, ${shift}px, 0) scale(1.16)`;
      });
    };

    // Throttle por tiempo (~50 fps) en lugar de requestAnimationFrame: así
    // funciona igual en navegadores que pausan los frames (pestaña de fondo,
    // modo ahorro de energía o entornos de captura headless).
    const onScroll = () => {
      const ahora = Date.now();
      if (ahora - ultimo < 18) return;
      ultimo = ahora;
      update();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ------------------------------------------------------------------
     9. FORMULARIO DE CONTACTO -> email
     ------------------------------------------------------------------ */
  function initForm() {
    const form = $('#contactForm');
    if (!form) return;

    const campos = ['nombre', 'equipo', 'servicio', 'mensaje'];

    const setError = (name, message) => {
      const input = form.elements[name];
      const box = $(`[data-error-for="${name}"]`, form);
      const wrap = input ? input.closest('.field') : null;
      if (box) box.textContent = message || '';
      if (wrap) wrap.classList.toggle('has-error', Boolean(message));
    };

    const validate = () => {
      let ok = true;

      campos.forEach((name) => {
        const input = form.elements[name];
        if (!input) return;
        const value = String(input.value || '').trim();

        if (!value) {
          setError(name, 'Este campo es obligatorio.');
          ok = false;
          return;
        }
        if (name === 'nombre' && value.length < 2) {
          setError(name, 'Ingresá tu nombre completo.');
          ok = false;
          return;
        }
        if (name === 'mensaje' && value.length < 10) {
          setError(name, 'Contanos un poco más (mínimo 10 caracteres).');
          ok = false;
          return;
        }
        setError(name, '');
      });

      return ok;
    };

    // Limpiar errores al escribir
    campos.forEach((name) => {
      const input = form.elements[name];
      if (!input) return;
      input.addEventListener('input', () => setError(name, ''));
      input.addEventListener('change', () => setError(name, ''));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validate()) {
        const primerError = $('.field.has-error input, .field.has-error select, .field.has-error textarea', form);
        if (primerError) primerError.focus();
        return;
      }

      const nombre   = form.elements.nombre.value.trim();
      const equipo   = form.elements.equipo.value.trim();
      const servicio = form.elements.servicio.value;
      const mensaje  = form.elements.mensaje.value.trim();

      const cuerpo = [
        `Nombre: ${nombre}`,
        `Equipo: ${equipo}`,
        `Servicio: ${servicio}`,
        '',
        'Detalle:',
        mensaje,
        '',
        `(Enviado desde la web de ${CONFIG.appName})`
      ].join('\n');

      // Se abre el gestor de correo con el mensaje ya redactado
      const destino = `mailto:${CONFIG.email}` +
        `?subject=${encodeURIComponent(CONFIG.asunto)}` +
        `&body=${encodeURIComponent(cuerpo)}`;

      window.location.href = destino;

      const btn = $('button[type="submit"]', form);
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '¡Abriendo tu correo…!';
        btn.disabled = true;
        window.setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 2600);
      }

      form.reset();
    });
  }

  /* ------------------------------------------------------------------
     10. BRILLO QUE SIGUE AL CURSOR EN LAS TARJETAS
     ------------------------------------------------------------------ */
  function initCardGlow() {
    const cards = $$('.card');
    if (!cards.length) return;
    if (window.matchMedia('(hover: none)').matches) return;

    cards.forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });
  }

  /* ------------------------------------------------------------------
     11. VIDEO DEL LOGO (sección Nosotros)
     Se reproduce en bucle mientras el usuario recorre la página y se pausa
     cuando sale de pantalla (ahorra batería y CPU en celulares).

     NOTA: el autoplay se respeta SIEMPRE, incluso si el sistema operativo
     pide "reducir movimiento". Si preferís que en ese caso quede como imagen
     fija (más conservador en accesibilidad), descomentá las 4 líneas
     marcadas abajo.
     ------------------------------------------------------------------ */
  function initLogoVideo() {
    const video = $('.about__video');
    if (!video) return;

    /* --- Opción accesible (desactivada a propósito) ---
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.removeAttribute('autoplay');
      video.pause();
      return;
    }
    --- fin de la opción accesible --- */

    // Algunos navegadores ignoran el atributo muted del HTML y con eso
    // bloquean el autoplay: se refuerza por JS.
    video.muted = true;
    video.defaultMuted = true;

    const reproducir = () => {
      const intento = video.play();
      if (intento && typeof intento.catch === 'function') {
        intento.catch(() => { /* sin permiso de autoplay: queda el poster */ });
      }
    };

    // Play/pause según esté a la vista o no
    if ('IntersectionObserver' in window) {
      const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) reproducir();
          else video.pause();
        });
      }, { threshold: 0.25 });

      observador.observe(video);

      // Si la pestaña queda en segundo plano, se pausa
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) video.pause();
        else if (video.getBoundingClientRect().top < window.innerHeight) reproducir();
      });
    } else {
      reproducir();
    }
  }

  /* ------------------------------------------------------------------
     12. AÑO DINÁMICO EN EL FOOTER
     ------------------------------------------------------------------ */
  function initYear() {
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------
     INICIALIZACIÓN
     ------------------------------------------------------------------ */
  function init() {
    // El JS cargó bien: se confirma que las animaciones de aparición van a
    // ejecutarse, así el seguro anti-fallo del <head> no muestra todo de golpe.
    document.documentElement.classList.remove('reveal-pending');

    initHeader();
    initMenu();
    initScrollSpy();
    initReveal();
    initCounters();
    initFaq();
    initParallax();
    initForm();
    initCardGlow();
    initLogoVideo();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

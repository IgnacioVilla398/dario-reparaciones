/* ==========================================================================
   DARIUS REPARACIONES — JavaScript nativo (sin dependencias)
   Módulos: configuración, WhatsApp, header, menú, scroll-spy, reveal,
            contadores, FAQ, slider de reseñas, formulario, volver arriba
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. CONFIGURACIÓN — cambiá acá tus datos de contacto reales
     ------------------------------------------------------------------ */
  const CONFIG = {
    // Número de WhatsApp en formato internacional, SIN + ni espacios.
    // Ej: Argentina (11) 2345-6789  ->  '5491123456789'
    whatsapp: '5492235738816',
    appName: 'Darius Reparaciones',
    // Mensaje por defecto cuando un enlace no trae data-wa-text
    defaultMessage: 'Hola Dario! Vengo desde la página web de Darius Reparaciones y quiero hacer una consulta.'
  };

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ------------------------------------------------------------------
     2. ENLACES DE WHATSAPP (número y mensaje centralizados)
     ------------------------------------------------------------------ */
  function buildWaLink(text) {
    const msg = encodeURIComponent(text || CONFIG.defaultMessage);
    return `https://wa.me/${CONFIG.whatsapp}?text=${msg}`;
  }

  function initWhatsAppLinks() {
    $$('[data-wa]').forEach((el) => {
      el.setAttribute('href', buildWaLink(el.dataset.waText));
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    });
  }

  /* ------------------------------------------------------------------
     3. HEADER: fondo al scrollear + botón "volver arriba"
     ------------------------------------------------------------------ */
  function initHeader() {
    const header = $('#header');
    const toTop  = $('#toTop');
    const waFloat = $('.wa-float');
    if (!header) return;

    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      if (toTop) toTop.classList.toggle('is-visible', y > 700);
      // El botón flotante de WhatsApp aparece con un "pop" al pasar el hero
      if (waFloat) waFloat.classList.toggle('is-visible', y > 320);
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
     4. MENÚ MÓVIL
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
      const isOpen = list.classList.contains('is-open');
      isOpen ? close() : open();
    });

    // Cerrar al elegir una sección
    $$('.nav__link, .nav__cta-mobile .btn', list).forEach((link) => {
      link.addEventListener('click', close);
    });

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
     5. SCROLL-SPY: resalta el enlace de la sección visible
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

    const visible = new Map();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      });

      let best = null;
      let bestRatio = 0;
      visible.forEach((ratio, section) => {
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
     6. ANIMACIONES DE APARICIÓN (reveal)
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
     7. CONTADORES ANIMADOS DEL HERO
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
     8. ACORDEÓN DE PREGUNTAS FRECUENTES
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

      // Recalcular altura si cambia el tamaño (texto que se reacomoda)
      window.addEventListener('resize', () => {
        if (item.classList.contains('is-open')) {
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     9. PARALLAX DE FONDOS (secciones Sobre mí y Preguntas frecuentes)
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
     10. FORMULARIO DE CONTACTO -> WhatsApp
     ------------------------------------------------------------------ */
  function initForm() {
    const form = $('#contactForm');
    if (!form) return;

    const fields = ['nombre', 'equipo', 'servicio', 'mensaje'];

    const setError = (name, message) => {
      const input = form.elements[name];
      const box = $(`[data-error-for="${name}"]`, form);
      const wrap = input ? input.closest('.field') : null;
      if (box) box.textContent = message || '';
      if (wrap) wrap.classList.toggle('has-error', Boolean(message));
    };

    const validate = () => {
      let ok = true;

      fields.forEach((name) => {
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
          setError(name, 'Contame un poco más (mínimo 10 caracteres).');
          ok = false;
          return;
        }
        setError(name, '');
      });

      return ok;
    };

    // Limpiar errores al escribir
    fields.forEach((name) => {
      const input = form.elements[name];
      if (!input) return;
      input.addEventListener('input', () => setError(name, ''));
      input.addEventListener('change', () => setError(name, ''));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validate()) {
        const firstError = $('.field.has-error input, .field.has-error select, .field.has-error textarea', form);
        if (firstError) firstError.focus();
        return;
      }

      const nombre   = form.elements.nombre.value.trim();
      const equipo   = form.elements.equipo.value.trim();
      const servicio = form.elements.servicio.value;
      const mensaje  = form.elements.mensaje.value.trim();

      const texto =
        `Hola Dario! Soy ${nombre}.%0A` +
        `Equipo: ${equipo}%0A` +
        `Servicio: ${servicio}%0A` +
        `Detalle: ${mensaje}%0A%0A` +
        `(Enviado desde la web de ${CONFIG.appName})`;

      // Se abre Telegram/WhatsApp con el mensaje ya redactado
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${texto}`, '_blank', 'noopener');

      const btn = $('button[type="submit"]', form);
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = '¡Abriendo WhatsApp…!';
        btn.disabled = true;
        window.setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 2600);
      }

      form.reset();
    });
  }

  /* ------------------------------------------------------------------
     11. BRILLO QUE SIGUE AL CURSOR EN LAS TARJETAS
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

    initWhatsAppLinks();
    initHeader();
    initMenu();
    initScrollSpy();
    initReveal();
    initCounters();
    initFaq();
    initParallax();
    initForm();
    initCardGlow();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

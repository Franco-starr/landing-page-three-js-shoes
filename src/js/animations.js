import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  /* =========================
     SCROLL SUAVE A ANCLAS
  ========================= */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;

      event.preventDefault();

      /* En Tecnología y Reseñas el contenido vive en un stage sticky dentro
         de una sección de 250vh. Aterrizar justo en el tope deja la entrada
         del scrub a medias (sobre todo en Reseñas). Bajamos apenas pasado
         el tope para que la entrada ya esté completa y se vea toda la sección
         (el stage sigue llenando la pantalla de igual forma).
         El destino final se calcula explícito y se fuerza en onComplete para
         que el scroll nunca se quede corto aunque la animación se interrumpa. */
      const isStage = target.matches('.features, .reviews');
      const finalY = target.getBoundingClientRect().top + window.scrollY + (isStage ? window.innerHeight * 0.25 : 0);

      gsap.to(window, {
        scrollTo: finalY,
        duration: 1.1,
        ease: 'power3.inOut',
        onComplete: () => {
          window.scrollTo(0, finalY);
          ScrollTrigger.update();
        }
      });
    });
  });

  /* =========================
     HERO - entrada al cargar
  ========================= */

  gsap.timeline({ delay: 0.3 }).from(
    '.hero .eyebrow, .hero .hero-actions',
    { y: 40, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 }
  );

  /* =========================
     SECTION FADE - telón negro + texto (scrub)
  ========================= */

  const sectionFade = (selector, items, options = {}) => {
    const section = document.querySelector(selector);
    if (!section) return;

    const curtain = section.querySelector('.curtain');
    const title = `${selector} .section-title`;
    const sub = `${selector} .section-sub`;

    gsap.set(curtain, { scaleY: 0 });
    gsap.set(`${title}, ${sub}, ${items}`, { autoAlpha: 0, y: 40 });

    /* En mobile (<=768px) la entrada se adelanta y se comprime: el contenido
       queda legible antes de que el stage se clave en pantalla. El scrub con
       lag de 1s hacía que las cards aparecieran "tarde" (recién al salir de la
       sección). Desktop conserva la cadencia original. */
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const curtainDur = isMobile ? 0.4 : 0.6;
    const titleAt = isMobile ? 0.5 : 0.7;
    const subAt = isMobile ? 0.55 : 0.8;
    const itemsAt = isMobile ? 0.68 : 0.9;
    const itemsStagger = isMobile ? 0.07 : 0.04;

    /* Cuándo se esconde el contenido y se abre el telón, sobre la timeline.
       Default: las cards salen temprano y el telón abre al final del recorrido
       (comportamiento original de reviews). En features se pasa otro exit para
       que las cards se sostengan hasta el final y, mientras salen, el telón YA
       se está levantando: la escena 3D queda a la vista de inmediato, sin
       huecos negros entre el fade de las cards y el reveal. */
    const EXIT_DEFAULT = { items: 3.0, sub: 3.2, title: 3.4, curtain: 4.2, curtainDur: 0.6 };
    const exit = options.exit ?? EXIT_DEFAULT;

    /* En mobile las features miden 100svh (igual que el stage sticky): si las
       cards salieran al 65% del scrub quedaría un tramo de escenario vacío
       antes de que Talles entre. Se comprime el exit contra el final del
       recorrido: las cards se sostienen hasta ~85% y recién entonces salen
       con el telón, justo cuando Talles ya cubre la pantalla. Reviews (200svh)
       no usa este override y conserva el cadencia original. */
    const exitMobile = options.exitMobile && isMobile
      ? options.exitMobile
      : exit;

    /* Una sola timeline por sección: entrada → espera → salida, recorrida
       sobre todo el tramo de la sección con scrub. Al subir se reproduce
       exactamente al revés, sin que dos timelines peleen por el mismo texto. */
    const tl = gsap.timeline({
      scrollTrigger: { trigger: selector, start: 'top bottom', end: 'bottom top', scrub: isMobile ? 0.4 : 1 }
    });

    tl.to(curtain, { scaleY: 1, duration: curtainDur, ease: 'none', immediateRender: false }, 0)
      .to(title, { autoAlpha: 1, y: 0, ease: 'none' }, titleAt)
      .to(sub, { autoAlpha: 1, y: 0, ease: 'none' }, subAt)
      .to(items, { autoAlpha: 1, y: 0, stagger: itemsStagger, ease: 'none' }, itemsAt);

    if (options.keepCurtain) {
      /* El negro queda arriba hasta que la sección termina, para que el
         switch a la escena oscura ocurra oculto. */
      tl.to(items, { autoAlpha: 0, y: -40, stagger: 0.04, ease: 'none' }, exitMobile.items)
        .to(sub, { autoAlpha: 0, y: -40, ease: 'none' }, exitMobile.sub)
        .to(title, { autoAlpha: 0, y: -40, ease: 'none' }, exitMobile.title);
    } else {
      tl.to(items, { autoAlpha: 0, y: -40, stagger: 0.04, ease: 'none' }, exitMobile.items)
        .to(sub, { autoAlpha: 0, y: -40, ease: 'none' }, exitMobile.sub)
        .to(title, { autoAlpha: 0, y: -40, ease: 'none' }, exitMobile.title)
        .set(curtain, { transformOrigin: 'top center' }, exitMobile.curtain)
        .to(curtain, { scaleY: 0, duration: exitMobile.curtainDur, ease: 'none' }, exitMobile.curtain);
    }
  };

  /* En features y reviews el contenido (cards/sub/título) sale COMPLETO con el
     telón cerrado (fade sobre negro, sin overlap visible); recién después el
     telón abre de abajo hacia arriba (transform-origin top en el reveal) y
     revela la escena ya activa. Así nunca se ven cards flotando sobre el reveal. */
  sectionFade('.features', '.cards .card', {
    exit: { items: 3.0, sub: 3.2, title: 3.4, curtain: 4.0, curtainDur: 0.6 },
    /* En mobile se recorta la sección a 100svh: las cards se sostienen hasta
       el final del recorrido y el exit se comprime contra el fin. */
    exitMobile: { items: 3.9, sub: 4.02, title: 4.14, curtain: 4.55, curtainDur: 0.15 }
  });
  sectionFade('.reviews', '.review-card', {
    exit: { items: 3.0, sub: 3.2, title: 3.4, curtain: 4.0, curtainDur: 0.6 }
  });

  /* =========================
     TALLES
  ========================= */

  gsap.fromTo('.talles-card', { y: 24, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    duration: 0.5,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.talles-card', start: 'top bottom' }
  });

  gsap.fromTo('.sizes button', { y: 40, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    duration: 0.4,
    ease: 'power3.out',
    stagger: 0.03,
    scrollTrigger: { trigger: '.sizes', start: 'top bottom' }
  });

  gsap.fromTo('.talles-hint', { y: 12, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    duration: 0.4,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.talles-hint', start: 'top 85%' }
  });

  /* Mini forceo: al pasar cerca de Talles el scroll se atrae suave
     hasta dejarla centrada verticalmente (progreso 0.5 del rango). */
  ScrollTrigger.create({
    trigger: '.talles',
    start: 'top center',
    end: 'bottom center',
    snap: {
      snapTo: (progress) =>
        (progress >= 0.25 && progress <= 0.75) ? 0.5 : undefined,
      duration: { min: 0.2, max: 0.5 },
      ease: 'power2.inOut'
    }
  });

  /* Mini forceo en el CTA final: cuando el scroll entra en el último
     tramo (≥80% del recorrido de la sección) se atrae solo hasta el
     fondo, asentando la pose final de la zapa y el texto/CTA ya
     revelados. Mismo estilo que el de Talles. */
  ScrollTrigger.create({
    trigger: '.cta-final',
    start: 'top bottom',
    end: 'bottom bottom',
    snap: {
      snapTo: (progress) => (progress >= 0.8 ? 1 : undefined),
      duration: { min: 0.2, max: 0.45 },
      ease: 'power2.inOut'
    }
  });


  /* =========================
     CTA FINAL
     Sin telón propio: el violeta de la escena 3 se activa mientras
     Reseñas (negro) ocupa toda la pantalla y aparece con el scroll.
     La zapa 3D gira durante todo el tramo visible (ver main.js) y el
     texto/CTA aparecen recién en el ÚLTIMO tramo, cuando la zapa ya
     casi terminó el giro. Al subir, se revierte.
  ========================= */

  gsap.matchMedia().add({
    '(max-width: 768px)': () => {
      /* En mobile el CTA se recorta a 200svh y el scrub tardío (0.72) nunca
         llegaba a revelar el texto. Se reemplaza por una entrada que dispara
         al llegar al FONDO de la sección (bottom bottom = 100% del viewport):
         cualquier punto anterior a 100% es inalcanzable en la última sección. */
      gsap.fromTo('.cta-final h2, .cta-final p, .cta-final .btn', { autoAlpha: 0, y: 24 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.cta-final', start: 'bottom bottom', toggleActions: 'play reverse play reverse' }
      });
    },
    '(min-width: 769px)': () => {
      gsap.set('.cta-final h2, .cta-final p, .cta-final .btn', { autoAlpha: 0, y: 50 });
      gsap.timeline({
        scrollTrigger: {
          trigger: '.cta-final',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1
        },
        defaults: { ease: 'none' }
      })
        .to('.cta-final h2, .cta-final p, .cta-final .btn', { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.06 }, 0.72);
    }
  });

  gsap.to('.cta-final .btn-primary', {
    scale: 1.04,
    repeat: -1,
    yoyo: true,
    duration: 0.9,
    ease: 'sine.inOut'
  });
} else {
  /* Sin movimiento: los telones de features y reviews quedan completos
     y el texto se muestra, para no romper el fondo ni dejar contenido oculto. */
  gsap.set('.features .curtain, .reviews .curtain', { scaleY: 1 });
  gsap.set(
    '.features .section-title, .features .section-sub, .features .card, .reviews .section-title, .reviews .section-sub, .reviews .review-card',
    { autoAlpha: 1, y: 0 }
  );
}

/* Las fuentes y el contexto WebGL alteran el layout después del primer
   refresh: recalcular los disparadores una vez que todo está asentado
   para que el primer scroll no muestre/esconda contenido con medidas viejas. */
const refreshScrollTriggers = () => ScrollTrigger.refresh();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(refreshScrollTriggers);
}
window.addEventListener('load', refreshScrollTriggers);
refreshScrollTriggers();
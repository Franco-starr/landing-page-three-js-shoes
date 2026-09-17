import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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
    '.hero .eyebrow, .hero .hero-title, .hero .hero-subtitle, .hero .hero-price, .hero .rating, .hero .hero-actions',
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

    /* Una sola timeline por sección: entrada → espera → salida, recorrida
       sobre todo el tramo de la sección con scrub. Al subir se reproduce
       exactamente al revés, sin que dos timelines peleen por el mismo texto. */
    const tl = gsap.timeline({
      scrollTrigger: { trigger: selector, start: 'top bottom', end: 'bottom top', scrub: 1 }
    });

    tl.to(curtain, { scaleY: 1, duration: 0.6, ease: 'none', immediateRender: false }, 0)
      .to(title, { autoAlpha: 1, y: 0, ease: 'none' }, 0.7)
      .to(sub, { autoAlpha: 1, y: 0, ease: 'none' }, 0.8)
      .to(items, { autoAlpha: 1, y: 0, stagger: 0.04, ease: 'none' }, 0.9);

    if (options.keepCurtain) {
      /* El negro queda arriba hasta que la sección termina, para que el
         switch a la escena oscura ocurra oculto. */
      tl.to(items, { autoAlpha: 0, y: -40, stagger: 0.04, ease: 'none' }, 3.0)
        .to(sub, { autoAlpha: 0, y: -40, ease: 'none' }, 3.2)
        .to(title, { autoAlpha: 0, y: -40, ease: 'none' }, 3.4);
    } else {
      tl.to(items, { autoAlpha: 0, y: -40, stagger: 0.04, ease: 'none' }, 3.0)
        .to(sub, { autoAlpha: 0, y: -40, ease: 'none' }, 3.2)
        .to(title, { autoAlpha: 0, y: -40, ease: 'none' }, 3.4)
        .to(curtain, { scaleY: 0, duration: 0.6, ease: 'none' }, 4.2);
    }
  };

  sectionFade('.features', '.cards .card');
  sectionFade('.reviews', '.review-card', { keepCurtain: true });

  /* =========================
     TALLES
  ========================= */

  gsap.fromTo('.sizes button', { y: 40, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    duration: 0.5,
    ease: 'power3.out',
    stagger: 0.06,
    scrollTrigger: { trigger: '.sizes', start: 'top 80%' }
  });

  /* Mini forceo: al pasar cerca de Talles el scroll se atrae suave
     hasta dejarla centrada verticalmente (progreso 0.5 del rango). */
  ScrollTrigger.create({
    trigger: '.talles',
    start: 'top center',
    end: 'bottom center',
    snap: {
      snapTo: (progress) => (progress >= 0.4 && progress <= 0.6) ? 0.5 : undefined,
      duration: { min: 0.2, max: 0.5 },
      ease: 'power2.inOut'
    }
  });

  /* =========================
     CTA FINAL
     Sin telón propio: el violeta de la escena 3 se activa mientras
     Reseñas (negro) ocupa toda la pantalla y aparece con el scroll.
     Solo se animan el texto y el pulso del botón.
  ========================= */

  gsap.fromTo('.cta-final h2, .cta-final p, .cta-final .btn', { y: 50, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.15,
    scrollTrigger: { trigger: '.cta-final', start: 'top 75%' }
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
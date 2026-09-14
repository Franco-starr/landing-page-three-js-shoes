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
      gsap.to(window, {
        scrollTo: { y: target, offsetY: 0 },
        duration: 1.1,
        ease: 'power3.inOut'
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

  const sectionFade = (selector, items) => {
    const section = document.querySelector(selector);
    if (!section) return;

    const curtain = section.querySelector('.curtain');
    const title = `${selector} .section-title`;
    const sub = `${selector} .section-sub`;

    gsap.set(curtain, { scaleY: 0 });
    gsap.set(`${title}, ${sub}, ${items}`, { autoAlpha: 0, y: 40 });

    /* Entrada: el negro sube primero y dura, luego aparece el texto */
    gsap.timeline({
      scrollTrigger: { trigger: selector, start: 'top bottom', end: 'top -60%', scrub: 1 }
    })
      .to(curtain, { scaleY: 1, duration: 0.7, ease: 'none' }, 0)
      .to(title, { autoAlpha: 1, y: 0, ease: 'none' }, 0.85)
      .to(sub, { autoAlpha: 1, y: 0, ease: 'none' }, 0.9)
      .to(items, { autoAlpha: 1, y: 0, stagger: 0.04, ease: 'none' }, 0.96);

    /* Salida: primero desaparece el texto, luego el negro baja y queda */
    gsap.timeline({
      scrollTrigger: { trigger: selector, start: 'bottom bottom', end: 'bottom top', scrub: 1 }
    })
      .to(items, { autoAlpha: 0, y: -40, stagger: 0.04, ease: 'none' }, 0)
      .to(sub, { autoAlpha: 0, y: -40, ease: 'none' }, 0.18)
      .to(title, { autoAlpha: 0, y: -40, ease: 'none' }, 0.26)
      .to(curtain, { scaleY: 0, duration: 0.6, ease: 'none' }, 0.5);
  };

  sectionFade('.features', '.cards .card');
  sectionFade('.reviews', '.review-card');

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

  /* =========================
     CTA FINAL
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
  /* Sin movimiento: el telón queda completo para no romper el fondo */
  gsap.set('.features .curtain, .reviews .curtain', { scaleY: 1 });
}

ScrollTrigger.refresh();
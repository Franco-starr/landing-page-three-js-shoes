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
     FEATURES
  ========================= */

  gsap.fromTo('.cards .card', { y: 60, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    duration: 0.7,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: { trigger: '.cards', start: 'top 80%' }
  });

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
     RESEÑAS
  ========================= */

  gsap.fromTo('.review-card', { y: 60, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    duration: 0.7,
    ease: 'power3.out',
    stagger: 0.12,
    scrollTrigger: { trigger: '.reviews-grid', start: 'top 80%' }
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
}

ScrollTrigger.refresh();
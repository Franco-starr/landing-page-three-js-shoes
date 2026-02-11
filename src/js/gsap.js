//scroll horizontal
const panels = gsap.utils.toArray(".panel");

gsap.to(panels, {
  xPercent: -100 * (panels.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: ".horizontal",
    start: "top top",
    end: () => "+=" + window.innerWidth * (panels.length - 1),
    scrub: 1,
    pin: true
  }
});

// =============================
// SECCIONES DEL MAIN (PRO)
// =============================

gsap.utils.toArray(".info").forEach((section) => {
  
  const items = section.querySelectorAll(".title, .text");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 75%",
      end: "bottom 25%",
      scrub: 1
    }
  });

  // ESTADO INICIAL (fuera)
  tl.from(items, {
    y: 60,
    opacity: 0,
    stagger: 0.2,
    duration: 1
  })

  // ESTADO FINAL (se van)
  .to(items, {
    y: -60,
    opacity: 0,
    stagger: 0.2,
    duration: 1
  });

});

// =============================
// ANIMACIONES DE TEXTO HORIZONTAL
// =============================

gsap.utils.toArray(".panel").forEach((panel) => {
  
  const items = panel.querySelectorAll(
    ".header_main_content_h1, .header_main_content_p, .cta"
  );

  // ENTRADA
  gsap.fromTo(items,
    { x: 60, opacity: 0 },
    {
      x: 0,
      opacity: 1,
      stagger: 0.15,
      scrollTrigger: {
        trigger: panel,
        containerAnimation: gsap.getTweensOf(".panel")[0], // usa el scroll horizontal
        start: "left center",
        end: "center center",
        scrub: 1
      }
    }
  );

  // SALIDA
  gsap.to(items, {
    x: -60,
    opacity: 0,
    stagger: 0.15,
    scrollTrigger: {
      trigger: panel,
      containerAnimation: gsap.getTweensOf(".panel")[0],
      start: "center center",
      end: "right center",
      scrub: 1
    }
  });

});
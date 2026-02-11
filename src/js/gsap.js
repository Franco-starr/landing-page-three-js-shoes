import { shoes, camera } from "./main.js";
gsap.registerPlugin(ScrollTrigger);

//scroll horizontal
const panels = gsap.utils.toArray(".panel");

export const horizontalTween = gsap.to(panels, {
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


/* =====================================================
   SCROLL HORIZONTAL
===================================================== */



/* =====================================================
   ANIMACIONES DE TEXTO HORIZONTAL
===================================================== */

function initTextAnimations() {
  panels.forEach((panel) => {

    const items = panel.querySelectorAll(
      ".header_main_content_h1, .header_main_content_p, .cta"
    );

    // entrada
    gsap.fromTo(items,
      { x: 80, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        stagger: 0.15,
        scrollTrigger: {
          trigger: panel,
          containerAnimation: horizontalTween,
          start: "left center",
          end: "center center",
          scrub: 1
        }
      }
    );

    // salida
    gsap.to(items, {
      x: -80,
      opacity: 0,
      stagger: 0.15,
      scrollTrigger: {
        trigger: panel,
        containerAnimation: horizontalTween,
        start: "center center",
        end: "right center",
        scrub: 1
      }
    });

  });
}

/* =====================================================
   ANIMACIONES DEL MODELO
===================================================== */

function initModelAnimations(horizontalTween) {

  panels.forEach((panel, i) => {

    const triggerSettings = {
      trigger: panel,
      containerAnimation: horizontalTween,
      start: "left center",
      end: "center center",
      scrub: 1
    };

    // panel 1 → derecha
    if (i === 0) {
      gsap.to(shoes.position, {
        x: 1.3,
        scrollTrigger: triggerSettings
      });

      gsap.to(shoes.rotation, {
        y: 1.5,
        scrollTrigger: triggerSettings
      });
    }

    // panel 2 → izquierda
    if (i === 1) {
      gsap.to(shoes.position, {
        x: -1.3,
        //z: 1,
        scrollTrigger: triggerSettings
      });

      gsap.to(shoes.rotation, {
        y: -1,
        scrollTrigger: triggerSettings
      });
    }
  });

}

function logState(label) {
  console.log("====== " + label + " ======");
  console.log("position:", shoes.position);
  console.log("rotation:", shoes.rotation);
  console.log("camera:", camera.position);
}

function initInfoModelAnimations() {

  // agarramos info + buy
  const sections = gsap.utils.toArray(".main > section");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".main",
      start: "top 80%",
      end: "+=" + window.innerHeight * sections.length,
      scrub: 1
    }
  });

  // =====================
  // INFO
  // =====================
  tl.to(shoes.position, {
    x: 0,
    y: 0,
      onStart: () => logState("INFO")

  });

  tl.to(shoes.rotation, {
    y: 0.5
  }, "<");

  tl.to(camera.position, {
    z: 2
  }, "<");


  // =====================
  // INFO DARK
  // =====================
  tl.to(shoes.position, {
    x: 1,
    y: -0.6,
      onStart: () => logState("INFO DARK")

  });

  tl.to(shoes.rotation, {
    y: 0
  }, "<");

  tl.to(camera.position, {
    y: 2.5,
    z: 0.3
  }, "<");

}

function initBuyModelAnimations() {

  const buySection = document.querySelector(".buy"); 
  // usa la clase real que tenga tu sección

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: buySection,
      start: "top 80%",
      end: "bottom 20%",
      scrub: 1
    }
  });

  tl.to(shoes.position, {
    x: -1.5,
    y: -0.3,
    onStart: () => logState("BUY")
  });

  tl.to(shoes.rotation, {
    y: 2.8
  }, "<");

  tl.to(camera.position, {
    y: 0,
    z: 2.2
  }, "<");
}

/* =====================================================
   INIT CUANDO EL MODELO ESTÁ LISTO
===================================================== */

window.addEventListener("modelReady", () => {
    initTextAnimations();
    initModelAnimations(horizontalTween);
    initInfoModelAnimations();   // 👈 ESTA ES LA NUEVA
    initBuyModelAnimations();   // solo buy
});
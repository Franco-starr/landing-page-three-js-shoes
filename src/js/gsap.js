import { shoes, camera } from "./main.js";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* =====================================================
   CONFIG
===================================================== */

let mm = gsap.matchMedia();
const panels = gsap.utils.toArray(".panel");

let horizontalTween = null;
let horizontalST = null;

/* =====================================================
   SCROLL HORIZONTAL (DESKTOP)
===================================================== */

mm.add("(min-width: 768px)", () => {

  horizontalTween = gsap.to(panels, {
    xPercent: -100 * (panels.length - 1),
    ease: "none",
    scrollTrigger: {
      trigger: ".horizontal",
      start: "top top",
      end: () => "+=" + window.innerWidth * (panels.length - 1),
      scrub: 1,
      pin: true,
      onUpdate(self) {
        horizontalST = self;
      }
    }
  });

});

/* =====================================================
   TEXTOS
===================================================== */

function initTextAnimations() {

  panels.forEach((panel) => {

    const items = panel.querySelectorAll(
      ".header_main_content_h1, .header_main_content_p, .cta"
    );

    /* DESKTOP */
    mm.add("(min-width: 768px)", () => {

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

    /* MOBILE */
    mm.add("(max-width: 767px)", () => {

      gsap.fromTo(items,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          scrollTrigger: {
            trigger: panel,
            start: "top 75%",
            end: "top 45%",
            scrub: 1
          }
        }
      );

    });

  });

}

/* =====================================================
   MODELO EN PANELES
===================================================== */

function initHorizontalModelAnimations() {

  mm.add("(min-width: 768px)", () => {

    panels.forEach((panel, i) => {

      const triggerSettings = {
        trigger: panel,
        containerAnimation: horizontalTween,
        start: "left center",
        end: "center center",
        scrub: 1
      };

      if (i === 0) {
        gsap.to(shoes.position, { x: 1.3, scrollTrigger: triggerSettings });
        gsap.to(shoes.rotation, { y: 1.5, scrollTrigger: triggerSettings });
      }

      if (i === 1) {
        gsap.to(shoes.position, { x: -1.3, scrollTrigger: triggerSettings });
        gsap.to(shoes.rotation, { y: -1, scrollTrigger: triggerSettings });
      }

    });

  });

}

/* =====================================================
   INFO
===================================================== */

function initInfoModelAnimations() {

  const sections = gsap.utils.toArray(".info");

  sections.forEach((section, i) => {

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 75%",
        end: "bottom 25%",
        scrub: 1
      }
    });

    if (i === 0) {
      tl.to(shoes.position, { x: 0, y: 0 })
        .to(shoes.rotation, { y: 0.5 }, "<")
        .to(camera.position, { z: 2 }, "<");
    }

    if (i === 1) {
      tl.to(shoes.position, { x: 1, y: -0.6 })
        .to(shoes.rotation, { y: 0 }, "<")
        .to(camera.position, { y: 2.5, z: 0.3 }, "<");
    }

  });

}

/* =====================================================
   BUY
===================================================== */

function initBuyModelAnimations() {

  const buySection = document.querySelector(".buy");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: buySection,
      start: "top 80%",
      end: "bottom 20%",
      scrub: 1
    }
  });

  tl.to(shoes.position, { x: -1.5, y: -0.3 })
    .to(shoes.rotation, { y: 2.8 }, "<")
    .to(camera.position, { y: 0, z: 2.2 }, "<");

}

/* =====================================================
   AUTO SNAP VERTICAL (SIN ROMPER HORIZONTAL)
===================================================== */

let isSnapping = false;

const snapSections = [
  document.querySelector(".horizontal"),
  ...document.querySelectorAll(".info"),
  document.querySelector(".buy")
];

let currentSection = 0;

function goToSection(index) {

  if (index < 0 || index >= snapSections.length) return;

  isSnapping = true;
  currentSection = index;

  gsap.to(window, {
    duration: 1,
    scrollTo: {
      y: snapSections[index],
      autoKill: false
    },
    ease: "power2.inOut",
    onComplete: () => {
      isSnapping = false;
    }
  });

}

window.addEventListener("wheel", (e) => {

  /* 🚫 NO SNAPEAR SI EL HORIZONTAL ESTÁ ACTIVO */
  if (horizontalST && horizontalST.isActive) return;

  if (isSnapping) return;

  if (e.deltaY > 0) {
    goToSection(currentSection + 1);
  } else {
    goToSection(currentSection - 1);
  }

});

/* =====================================================
   INIT
===================================================== */

window.addEventListener("modelReady", () => {
  initTextAnimations();
  initHorizontalModelAnimations();
  initInfoModelAnimations();
  initBuyModelAnimations();
});
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

   /* MOBILE */
  mm.add("(max-width: 767px)", () => {

    panels.forEach((panel, i) => {

      const triggerSettings = {
        trigger: panel,
        start: "top center",
        end: "bottom center",
        scrub: 1
      };

      if (i === 0) {
        gsap.to(shoes.position, {
          x: 0,
          z: -0.3,
          y: -0.5,
          scrollTrigger: triggerSettings
        });

        gsap.to(shoes.rotation, {
          y: 1.1,
          scrollTrigger: triggerSettings
        });
      }

      if (i === 1) {
        gsap.to(shoes.position, {
          x: 0,
          scrollTrigger: triggerSettings
        });

        gsap.to(shoes.rotation, {
          y: -1.5,
          scrollTrigger: triggerSettings
        });
      }

    });
     });

}

/* =====================================================
   INFO
===================================================== */

function initInfoModelAnimations() {

 const mm = gsap.matchMedia();
  const sections = gsap.utils.toArray(".info");

  /* =========================
     DESKTOP
  ========================= */

  mm.add("(min-width: 768px)", () => {

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
          .to(shoes.rotation, { y: 2.6, x: 0.5 }, "<")
          .to(camera.position, { z: 2 }, "<");
      }

      if (i === 1) {
        tl.to(shoes.position, { x: 0, y: -0.6, z: 0 })
          .to(shoes.rotation, { y: -1.4 }, "<")
          .to(camera.position, { y: 2.5, z: 2 }, "<");
      }

    });

  });

    /* =========================
     MOBILE
  ========================= */

  mm.add("(max-width: 767px)", () => {

    sections.forEach((section, i) => {

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "bottom 20%",
          scrub: 1
        }
      });

      if (i === 0) {
        tl.to(shoes.position, { x: 0, y: -0.8 })
          .to(shoes.rotation, { y: -1, x: 1.4 }, "<")
          .to(camera.position, { z: 2.5 }, "<");
      }

      if (i === 1) {
        tl.to(shoes.position, { x: 0, y: -1.4 })
          .to(shoes.rotation, { y: 0, x: 0 }, "<")
          .to(camera.position, { y: 1.5, z: 1.5 }, "<");
      }

    });

  });


}

/* =====================================================
   BUY
===================================================== */

function initBuyModelAnimations() {

   const mm = gsap.matchMedia();
  const buySection = document.querySelector(".buy");

  /* DESKTOP */
  mm.add("(min-width: 768px)", () => {

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: buySection,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 1
      }
    });

    tl.to(shoes.position, { x: 1.4, y: -0.3, z: 0 })
      .to(shoes.rotation, { y: -2.2, x: 0, z: 0 }, "<")
      .to(camera.position, { y: 0, z: 2.2 }, "<");

  });

  /* MOBILE */
  mm.add("(max-width: 767px)", () => {

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: buySection,
        start: "top 85%",
        end: "bottom 15%",
        scrub: 1
      }
    });

    tl.to(shoes.position, { x: 0, y: -1.01, z: 0 })
      .to(shoes.rotation, { y: 1.5, x: 0, z: -1 }, "<")
      .to(camera.position, { y: 0, z: 2.8 }, "<");

  });

}
/* =====================================================
   AUTO SNAP RESPONSIVE (FIX REAL)
===================================================== */

let isSnapping = false;

function getSnapSections() {

  if (window.innerWidth < 768) {
    // En mobile cada panel es sección individual
    return [
      ...document.querySelectorAll(".panel"),
      ...document.querySelectorAll(".info"),
      document.querySelector(".buy")
    ];
  } else {
    // En desktop el horizontal es una sola sección
    return [
      document.querySelector(".horizontal"),
      ...document.querySelectorAll(".info"),
      document.querySelector(".buy")
    ];
  }

}

function getCurrentSectionIndex(sections) {

  const scrollY = window.scrollY;
  let index = 0;

  sections.forEach((section, i) => {
    if (scrollY >= section.offsetTop - window.innerHeight * 0.5) {
      index = i;
    }
  });

  return index;
}

function goToSection(index, sections) {

  if (index < 0 || index >= sections.length) return;

  isSnapping = true;

  gsap.to(window, {
    duration: 0.8,
    scrollTo: {
      y: sections[index],
      autoKill: false
    },
    ease: "power2.inOut",
    onComplete: () => {
      isSnapping = false;
    }
  });

}

let wheelTimeout;

window.addEventListener("wheel", (e) => {

  if (horizontalST && horizontalST.isActive) return;
  if (isSnapping) return;

  clearTimeout(wheelTimeout);

  wheelTimeout = setTimeout(() => {

    const sections = getSnapSections();
    const currentIndex = getCurrentSectionIndex(sections);

    if (e.deltaY > 0) {
      goToSection(currentIndex + 1, sections);
    } else {
      goToSection(currentIndex - 1, sections);
    }

  }, 60);

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
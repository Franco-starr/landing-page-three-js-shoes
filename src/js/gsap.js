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
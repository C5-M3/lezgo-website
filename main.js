// Landing page motion. GSAP is saved in /assets/vendor so the site loads no outside scripts. Scrolling stays the
// browser's own. Without this file the page still works: the four stops are a plain list beside the phone.
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header gets a hairline once the page scrolls.
  const header = document.querySelector(".top");
  ScrollTrigger.create({ start: 8, end: "max", onToggle: self => header.classList.toggle("scrolled", self.isActive) });

  // How it works: the stops pin under the header and the page scrolls through them one at a time. The phone
  // crossfades to the matching screen, the stop's text slides in, and the leader's car moves down the rail.
  document.documentElement.classList.add("motion");
  const screens = gsap.utils.toArray(".stage .screen img");
  const progress = gsap.utils.toArray(".progress span");
  const steps = gsap.utils.toArray(".step");
  const pins = gsap.utils.toArray(".rail-pin");
  const heroScreen = screens.findIndex(screen => screen.classList.contains("current"));
  let shownScreen = heroScreen;
  let shownStep = 0;

  function showScreen(index) {
    if (index === shownScreen) return;
    const incoming = screens[index];
    shownScreen = index;
    screens.forEach(screen => {
      screen.classList.toggle("current", screen === incoming);
      gsap.set(screen, { zIndex: screen === incoming ? 2 : 1 });
    });
    gsap.killTweensOf(screens);
    gsap.to(screens.filter(screen => screen !== incoming), { autoAlpha: 0, duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.15, ease: "power1.out" });
    gsap.fromTo(incoming, { autoAlpha: 0, scale: 1.04 }, { autoAlpha: 1, scale: 1, duration: reduce ? 0 : 0.6, ease: "power2.out" });
  }

  function showStep(index) {
    pins.forEach((pin, i) => pin.classList.toggle("on", i <= index));
    progress.forEach((bar, i) => bar.classList.toggle("on", i === index));
    if (index === shownStep) return;
    const direction = index > shownStep ? 1 : -1;
    const outgoing = steps[shownStep];
    const incoming = steps[index];
    shownStep = index;
    gsap.killTweensOf(steps);
    gsap.to(steps.filter(step => step !== incoming), { autoAlpha: 0, y: -28 * direction, duration: reduce ? 0 : 0.3, ease: "power2.in" });
    gsap.fromTo(incoming, { autoAlpha: 0, y: 36 * direction },
      { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.55, delay: reduce || !outgoing ? 0 : 0.18, ease: "power3.out" });
  }

  const pinned = document.querySelector(".steps-pin");
  const rail = document.querySelector(".rail");
  const fill = document.querySelector(".rail-fill");
  const car = document.querySelector(".rail-car");
  // Each stop holds for a quarter of the scroll; the rail fills smoothly between them.
  function followScroll(self) {
    if (self.progress === 0 && self.scroll() < self.start) return;
    const index = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
    showStep(index);
    showScreen(Number(steps[index].dataset.screen));
    const along = Math.min(1, Math.max(0, (self.progress * steps.length - 0.5) / (steps.length - 1)));
    gsap.set(fill, { scaleY: along });
    gsap.set(car, { y: along * rail.offsetHeight });
  }
  ScrollTrigger.create({
    trigger: ".steps",
    start: () => `top ${parseFloat(getComputedStyle(pinned).top) || 0}px`,
    end: "bottom bottom",
    invalidateOnRefresh: true,
    onUpdate: followScroll,
    // A reload or a jump past the stops lands without an update, so sync on refresh too.
    onRefresh: followScroll,
    onLeaveBack: () => {
      showScreen(heroScreen);
      progress.forEach(bar => bar.classList.remove("on"));
    }
  });

  if (reduce) return;

  // The one orchestrated load: headline lines rise, then the phone springs up beside them.
  document.fonts.ready.then(() => {
    const split = SplitText.create(".lead h1", { type: "lines", mask: "lines", linesClass: "split-line" });
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(split.lines, { yPercent: 105, duration: 1.1, stagger: 0.09 })
      .from(".lead > p, .lead .actions, .lead .facts", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, 0.35)
      .from(".phone", { y: 90, rotation: 5, autoAlpha: 0, duration: 1.4, ease: "elastic.out(1, 0.7)" }, 0.25)
      .from(".progress", { autoAlpha: 0, duration: 0.6 }, 0.9);
  });

  // Phone tips gently toward the pointer.
  gsap.set(".stage-inner", { perspective: 1200 });
  const tiltX = gsap.quickTo(".phone", "rotationY", { duration: 0.6, ease: "power3" });
  const tiltY = gsap.quickTo(".phone", "rotationX", { duration: 0.6, ease: "power3" });
  window.addEventListener("pointermove", event => {
    if (event.pointerType !== "mouse") return;
    tiltX((event.clientX / innerWidth - 0.5) * 10);
    tiltY((event.clientY / innerHeight - 0.5) * -8);
  });

  // Buttons answer a press with a quick spring.
  document.querySelectorAll(".store, .ghost, .get").forEach(button => {
    button.addEventListener("pointerdown", () => gsap.to(button, { scale: 0.96, duration: 0.12, ease: "power2.out" }));
    ["pointerup", "pointerleave"].forEach(type => button.addEventListener(type, () => gsap.to(button, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" })));
  });

  // The crew hops up one after another when the closing comes into view.
  gsap.from(".crew img", { y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.8, ease: "back.out(2)",
    scrollTrigger: { trigger: ".crew", start: "top 90%" } });
})();

// Landing page motion. GSAP and Lenis are saved in /assets/vendor so the site loads no outside scripts.
// Without this file the page still works: the phone shows the trip map, the route is drawn
// and the alerts are listed in the app's own words.
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header gets a hairline once the page scrolls.
  const header = document.querySelector(".top");
  ScrollTrigger.create({ start: 8, end: "max", onToggle: self => header.classList.toggle("scrolled", self.isActive) });

  // Sticky phone: each stop wipes its screen into the phone; the progress bar under it follows.
  const screens = gsap.utils.toArray(".stage .screen img");
  const progress = gsap.utils.toArray(".progress span");
  let current = 2;
  function showScreen(index) {
    progress.forEach((bar, i) => bar.classList.toggle("on", i === index));
    if (index === current) return;
    const goingDown = index > current;
    const incoming = screens[index];
    const outgoing = screens[current];
    current = index;
    gsap.killTweensOf(screens);
    screens.forEach(screen => {
      if (screen !== incoming && screen !== outgoing) gsap.set(screen, { clipPath: "inset(100% 0 0 0)", zIndex: 0 });
    });
    gsap.set(outgoing, { zIndex: 1 });
    gsap.fromTo(incoming, { clipPath: goingDown ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)", zIndex: 2 },
      { clipPath: "inset(0% 0 0% 0)", duration: reduce ? 0 : 0.7, ease: "power3.inOut" });
  }
  ScrollTrigger.create({ trigger: ".lead", start: "top 55%", end: "bottom 55%", onToggle: self => { if (self.isActive) showScreen(2); } });

  const steps = gsap.utils.toArray(".step");
  const stepsElement = document.querySelector(".steps");
  const car = document.querySelector(".route-car");
  // `line` is how far down the screen a stop must reach before it counts as the current one.
  function storyTriggers(line) {
    steps.forEach(step => {
      ScrollTrigger.create({ trigger: step, start: `top ${line}`, end: `bottom ${line}`,
        onToggle: self => { if (self.isActive) showScreen(Number(step.dataset.screen)); } });
      ScrollTrigger.create({ trigger: step.querySelector(".pin"), start: `top ${line}`,
        onEnter: () => step.classList.add("reached"), onLeaveBack: () => step.classList.remove("reached") });
    });
    // The route: the yellow line fills down the story and the leader's car rides its tip.
    gsap.fromTo(".route-fill", { scaleY: 0 }, { scaleY: 1, ease: "none",
      scrollTrigger: { trigger: stepsElement, start: `top ${line}`, end: `bottom ${line}`, scrub: true,
        onUpdate: self => gsap.set(car, { y: self.progress * stepsElement.offsetHeight }) } });
  }
  const layouts = gsap.matchMedia();
  layouts.add("(min-width: 861px)", () => storyTriggers("55%"));
  // On phones the sticky phone fills the top of the screen, so a stop counts once it is lower down.
  layouts.add("(max-width: 860px)", () => storyTriggers("75%"));

  // Room code: digits flicker through numbers and lock in, left to right.
  const digits = gsap.utils.toArray(".code .digits span");
  ScrollTrigger.create({ trigger: ".code .digits", start: "top 80%", once: true, onEnter: () => {
    if (reduce) {
      digits.forEach(digit => digit.classList.add("set"));
      return;
    }
    digits.forEach((digit, index) => {
      const final = digit.textContent;
      const state = { t: 0 };
      gsap.to(state, { t: 1, duration: 0.5 + index * 0.14, ease: "none",
        onUpdate: () => { digit.textContent = state.t < 1 ? Math.floor(Math.random() * 10) : final; },
        onComplete: () => {
          digit.textContent = final;
          digit.classList.add("set");
          gsap.fromTo(digit, { scale: 1.08 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
        } });
    });
  } });

  // Alerts: tapping one says it out loud, the way the app does on the road.
  const alertButtons = Array.from(document.querySelectorAll(".alert-list button"));
  if ("speechSynthesis" in window) {
    document.querySelector(".hear-copy .note").hidden = false;
    alertButtons.forEach(button => button.addEventListener("click", () => {
      alertButtons.forEach(other => other.setAttribute("aria-pressed", other === button ? "true" : "false"));
      try {
        speechSynthesis.cancel();
        speechSynthesis.speak(new SpeechSynthesisUtterance(button.dataset.say));
      } catch {
        // Speech is a nice extra; the words are already on screen.
      }
    }));
    alertButtons.forEach(button => button.setAttribute("aria-pressed", "false"));
  }

  if (reduce) return;

  // Smooth scrolling, driven by GSAP's ticker.
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

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

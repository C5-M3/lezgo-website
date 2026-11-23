// Landing page motion. GSAP and Lenis are saved in /assets/vendor so the site loads no outside scripts.
// Without this file the page still works: the phone shows the trip map, the route is drawn
// and the alert banner shows its first alert.
(() => {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Header gets a hairline once the page scrolls.
  const header = document.querySelector(".top");
  ScrollTrigger.create({ start: 8, end: "max", onToggle: self => header.classList.toggle("scrolled", self.isActive) });

  // Sticky phone: each stop wipes its screen into the phone; the progress bar under it follows.
  const screens = gsap.utils.toArray(".screen img");
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
  // On phones the sticky phone covers the top half, so a stop counts once it is lower down.
  layouts.add("(max-width: 860px)", () => storyTriggers("78%"));

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

  // Alerts demo: picking an alert swaps the banner and speaks it, unless muted.
  const icons = {
    warn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 1 21h22zm1 15h-2v-2h2zm0-4h-2V9h2z"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 2h2v20H5zM8 3h12l-2.5 4.5L20 12H8z"/></svg>',
    ahead: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 4 11h5v10h6V11h5z"/></svg>',
    route: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 6.4A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.2L13 11h7V4z"/></svg>'
  };
  const windshield = document.querySelector(".windshield");
  const banner = windshield.querySelector(".banner");
  const badge = banner.querySelector(".badge");
  const wave = banner.querySelector(".wave");
  for (let i = 0; i < 9; i++) wave.appendChild(document.createElement("span"));
  const waveBars = Array.from(wave.children);
  const picks = Array.from(windshield.querySelectorAll(".picks button"));
  const muteButton = windshield.querySelector(".mute");
  windshield.querySelector(".controls").hidden = false;
  let muted = false;
  let waveTween = null;
  let cycle = null;
  let userTouched = false;
  gsap.set(".map-car", { x: 250, y: 312 });

  function speak(text) {
    try {
      if (muted || !("speechSynthesis" in window)) return;
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    } catch {
      // Speech is a nice extra; the banner already shows the alert.
    }
  }
  function showAlert(button, withVoice) {
    picks.forEach(pick => pick.setAttribute("aria-pressed", pick === button ? "true" : "false"));
    const swap = () => {
      windshield.style.setProperty("--tone", `var(${button.dataset.tone})`);
      badge.innerHTML = icons[button.dataset.icon];
      banner.querySelector("strong").textContent = button.dataset.say;
      banner.querySelector("small").textContent = button.dataset.when;
    };
    if (reduce) {
      swap();
    } else {
      gsap.timeline()
        .to(banner, { y: -24, autoAlpha: 0, duration: 0.2, ease: "power2.in" })
        .add(swap)
        .fromTo(banner, { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: "back.out(1.6)" })
        .fromTo(badge, { scale: 0.4 }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, "<0.1");
    }
    const [x, y] = button.dataset.at.split(" ").map(Number);
    gsap.to(".map-car", { x, y, duration: reduce ? 0 : 0.9, ease: "power3.inOut" });
    waveTween?.kill();
    if (!reduce && !muted) {
      waveTween = gsap.to(waveBars, { scaleY: () => gsap.utils.random(0.25, 1), duration: 0.14, repeat: 12, yoyo: true, repeatRefresh: true,
        stagger: { each: 0.03, from: "center" }, onComplete: () => gsap.to(waveBars, { scaleY: 0.15, duration: 0.3 }) });
    }
    if (withVoice) speak(button.dataset.say);
  }
  picks.forEach(button => button.addEventListener("click", () => {
    userTouched = true;
    clearInterval(cycle);
    showAlert(button, true);
  }));
  muteButton.addEventListener("click", () => {
    muted = !muted;
    muteButton.setAttribute("aria-pressed", String(muted));
    muteButton.querySelector("span").textContent = muted ? "Muted" : "Sound on";
    banner.classList.toggle("muted", muted);
    if (!muted) return;
    try { speechSynthesis.cancel(); } catch { /* speech is optional */ }
    waveTween?.kill();
    gsap.set(waveBars, { scaleY: 0.15 });
  });
  // While the section is on screen and nobody has tapped yet, the banner cycles silently through the alerts.
  if (!reduce) {
    ScrollTrigger.create({ trigger: windshield, start: "top 75%", end: "bottom 25%",
      onToggle: self => {
        clearInterval(cycle);
        if (!self.isActive || userTouched) return;
        let index = picks.findIndex(pick => pick.getAttribute("aria-pressed") === "true");
        cycle = setInterval(() => {
          index = (index + 1) % picks.length;
          showAlert(picks[index], false);
        }, 2800);
      } });
  }

  // CarPlay car sits partway along its route at rest.
  const dashPath = { path: "#dash-route", align: "#dash-route", alignOrigin: [0.5, 0.5] };
  gsap.set("#dash-car", { motionPath: { ...dashPath, start: 0, end: 0.6 } });

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

  // CarPlay: the route draws and the car drives it as the dashboard scrolls past.
  gsap.timeline({ scrollTrigger: { trigger: ".dash", start: "top 85%", end: "bottom 35%", scrub: 0.8 } })
    .from("#dash-route", { drawSVG: "0%", ease: "none" })
    .fromTo("#dash-car", { motionPath: { ...dashPath, start: 0.02, end: 0.02 } },
      { motionPath: { ...dashPath, start: 0.02, end: 0.6 }, ease: "none" }, 0);

  // The crew hops up one after another when the closing comes into view.
  gsap.from(".crew img", { y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.8, ease: "back.out(2)",
    scrollTrigger: { trigger: ".crew", start: "top 90%" } });
})();

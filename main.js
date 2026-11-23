// Landing page motion. GSAP is saved in /assets/vendor so the site loads no outside scripts. Scrolling stays the
// browser's own. Without this file the page still works: the four steps are a plain list beside the phone, and
// every tile shows its final state.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Each bento tile plays its own small animation the first time most of it is on screen.
  const tiles = document.querySelectorAll(".tile");
  if (reduce || !("IntersectionObserver" in window)) {
    tiles.forEach(tile => tile.classList.add("shown"));
  } else {
    const watcher = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("shown");
      watcher.unobserve(entry.target);
    }), { threshold: 0.35 });
    tiles.forEach(tile => watcher.observe(tile));
  }

  startMapTile();
  if (!reduce && window.gsap && window.ScrollTrigger) startStory();

  // How it works: the section pins for one screen and the scroll moves through the four steps. Each change is
  // tied to the scroll, so scrolling back plays it in reverse: the text slides out up and the next slides in from
  // below, while the next app screen slides up inside the phone over the last one. Snapping lands on a step.
  function startStory() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    const story = document.querySelector(".story");
    const steps = gsap.utils.toArray(".step");
    const screens = gsap.utils.toArray(".stage .screen img");
    const dots = gsap.utils.toArray(".dots span");
    const header = document.querySelector(".top");
    story.classList.add("pinned");

    gsap.set(steps.slice(1), { autoAlpha: 0, y: 40 });
    gsap.set(screens.slice(1), { yPercent: 100 });

    const hold = 0.5;
    let shownDot = 0;
    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: story,
        pin: ".story-pin",
        start: () => `top ${header.offsetHeight}px`,
        end: () => `+=${(steps.length - 1 + hold) * innerHeight}`,
        scrub: 0.6,
        invalidateOnRefresh: true,
        // Directional snapping moves one step in the direction of the scroll, so a quick flick never skips a step.
        snap: { snapTo: "labelsDirectional", inertia: false, duration: { min: 0.25, max: 0.6 }, delay: 0.1, ease: "power2.inOut" },
        onUpdate: self => {
          const index = Math.min(steps.length - 1, Math.round(self.progress * (steps.length - 1 + hold)));
          if (index === shownDot) return;
          shownDot = index;
          dots.forEach((dot, i) => dot.classList.toggle("on", i === index));
        }
      }
    });

    timeline.addLabel("step0", 0);
    for (let i = 1; i < steps.length; i += 1) {
      const at = i - 1;
      timeline
        .to(steps[i - 1], { autoAlpha: 0, y: -40, duration: 0.3, ease: "power2.in" }, at + 0.15)
        .fromTo(steps[i], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, at + 0.5)
        .fromTo(screens[i], { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: "power2.inOut" }, at + 0.15)
        .to(screens[i - 1], { yPercent: -14, scale: 0.94, autoAlpha: 0.35, duration: 0.7, ease: "power2.inOut" }, at + 0.15)
        .addLabel(`step${i}`, i);
    }
    // A short hold so the last step rests on screen before the section scrolls away.
    timeline.to({}, { duration: hold }).addLabel("end");
  }

  // Live map tile: the five buddies drive along the route with the leader in front, and the arrival time counts
  // down. With reduced motion they stay parked on the route.
  function startMapTile() {
    const route = document.getElementById("map-route");
    const group = document.getElementById("map-cars");
    const eta = document.getElementById("map-eta");
    if (!route || !group) return;
    const namespace = "http://www.w3.org/2000/svg";
    const length = route.getTotalLength();
    const crew = [["yellow", "Agus"], ["purple", "Budi"], ["pink", "Citra"], ["blue", "Dewi"], ["green", "Eko"]];
    const cars = crew.map(([colour, name], i) => {
      const size = i === 0 ? 62 : 52;
      const car = document.createElementNS(namespace, "g");
      const image = document.createElementNS(namespace, "image");
      image.setAttribute("href", `/assets/mascot-${colour}.png`);
      image.setAttribute("x", -size / 2);
      image.setAttribute("y", -size / 2 - 8);
      image.setAttribute("width", size);
      image.setAttribute("height", size);
      const tag = document.createElementNS(namespace, "rect");
      tag.setAttribute("x", -26);
      tag.setAttribute("y", size / 2 - 6);
      tag.setAttribute("width", 52);
      tag.setAttribute("height", 20);
      tag.setAttribute("rx", 10);
      tag.setAttribute("fill", i === 0 ? "#f7ff00" : "#000");
      const label = document.createElementNS(namespace, "text");
      label.setAttribute("class", "car-label");
      label.setAttribute("x", 0);
      label.setAttribute("y", size / 2 + 8);
      label.setAttribute("text-anchor", "middle");
      if (i === 0) label.style.fill = "#000";
      label.textContent = name;
      car.append(image, tag, label);
      group.appendChild(car);
      return { car, gap: i * 0.085 };
    });

    let progress = 0.6;
    function place() {
      cars.forEach(({ car, gap }) => {
        const along = Math.max(0, Math.min(1, progress - gap));
        const point = route.getPointAtLength(length * along);
        car.setAttribute("transform", `translate(${point.x} ${point.y})`);
      });
      eta.textContent = `${Math.max(1, Math.round((1 - progress) * 21))} min`;
    }
    place();
    if (reduce) return;

    // Only drive while the tile is on screen.
    let frame = 0;
    let last = 0;
    function drive(now) {
      progress += (now - last) / 60000;
      last = now;
      if (progress > 0.97) progress = 0.45;
      place();
      frame = requestAnimationFrame(drive);
    }
    new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (!entry.isIntersecting) return;
      last = performance.now();
      frame = requestAnimationFrame(drive);
    }).observe(route.closest(".tile"));
  }
})();

/* ============================================================
   Ishtmi – Erlebnis-Schicht
   Intro-Vorhang, Smooth Scroll (Lenis), Cursor, Magnet-Buttons,
   Split-Text, Zähler, Spotlight, Pfoten-Navigation, Scroll-Fortschritt
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Split-Text für Überschriften ---------- */
  const splitWords = (el) => {
    if (!el || el.dataset.split) return;
    el.dataset.split = "1";
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="word"><b style="--i:${i}">${w}</b></span>`).join(" ");
  };
  $$("h2.split").forEach(splitWords);
  $$(".scene-text h2").forEach(h => { h.classList.add("split"); splitWords(h); });

  /* ---------- Footer-Wordmark in Buchstaben ---------- */
  (() => {
    const w = $("#wordmark"); if (!w) return;
    w.innerHTML = [...w.textContent.trim()].map(c => `<b>${c}</b>`).join("");
  })();

  /* ---------- Intro-Vorhang ---------- */
  const introDone = () => {
    body.classList.add("intro-done");
    dispatchEvent(new Event("intro:done"));
  };
  (() => {
    const intro = $("#intro");
    let seen = false;
    try { seen = sessionStorage.getItem("ishtmi-intro") === "1"; } catch (e) {}
    if (!intro || reduceMotion || seen) { intro?.remove(); introDone(); return; }
    body.classList.add("has-intro");
    const word = $("#intro-word");
    word.innerHTML = [...word.textContent.trim()].map((c, i) => `<b style="--i:${i}">${c}</b>`).join("");
    const t0 = performance.now();
    const finish = () => {
      const wait = Math.max(0, 1900 - (performance.now() - t0));
      setTimeout(() => {
        intro.classList.add("out");
        try { sessionStorage.setItem("ishtmi-intro", "1"); } catch (e) {}
        setTimeout(() => { intro.remove(); introDone(); }, 1050);
      }, wait);
    };
    if (document.readyState === "complete") finish(); else addEventListener("load", finish, { once: true });
    /* Sicherheitsnetz: nie länger als 4 s warten */
    setTimeout(() => { if (body.classList.contains("has-intro") && !body.classList.contains("intro-done")) finish(); }, 4000);
  })();

  /* ---------- Smooth Scroll (Lenis) ---------- */
  let lenis = null, velocity = 0;
  const startLenis = () => {
    if (reduceMotion || !window.Lenis || !fine) return;
    lenis = new Lenis({ lerp: .11, smoothWheel: true, wheelMultiplier: 1 });
    document.documentElement.classList.add("lenis-on");
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    lenis.on("scroll", (e) => { velocity = e.velocity; });
  };
  /* Anker-Links: weich hinscrollen (mit oder ohne Lenis) */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute("href"); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: id === "#top" ? 0 : -64, duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", id);
  });
  if (body.classList.contains("intro-done")) startLenis(); else addEventListener("intro:done", startLenis, { once: true });

  /* ---------- Hero schrumpft zur Karte ---------- */
  (() => {
    const frame = $("#hero-frame"); if (!frame || reduceMotion) return;
    let last = -1;
    const tick = () => {
      const s = clamp(scrollY / (innerHeight * .9));
      if (Math.abs(s - last) > .0005) {
        last = s;
        frame.style.clipPath = s > .001
          ? `inset(${(s * 9).toFixed(2)}% ${(s * 6).toFixed(2)}% ${(s * 10).toFixed(2)}% ${(s * 6).toFixed(2)}% round ${(s * 36).toFixed(1)}px)`
          : "";
        frame.style.transform = s > .001 ? `translateY(${(s * 60).toFixed(1)}px)` : "";
      }
      requestAnimationFrame(tick);
    };
    tick();
  })();

  /* ---------- Scroll-Fortschritt + Outline-Skew ---------- */
  (() => {
    const bar = $("#scrollbar-fill"), track = $("#outline-track");
    let skew = 0;
    let docH = 0, lastMeasure = 0;
    const tick = () => {
      const now = performance.now();
      if (now - lastMeasure > 500) { docH = document.documentElement.scrollHeight; lastMeasure = now; }
      const max = docH - innerHeight;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max).toFixed(4) : 0})`;
      if (track) {
        skew = lerp(skew, clamp(velocity * .12, -12, 12), .12);
        track.style.setProperty("--skew", skew.toFixed(2));
      }
      requestAnimationFrame(tick);
    };
    if (!reduceMotion) tick();
  })();

  /* ---------- Pfoten-Navigation + aktiver Abschnitt ---------- */
  (() => {
    const paws = $("#paws"); if (!paws) return;
    const items = [
      ["top", "Start"], ["stream", "Stream"], ["info", "Info"], ["plan", "Streamplan"],
      ["news", "News"], ["workshop", "Workshop"], ["games", "Games"], ["setup", "Setup"],
    ].filter(([id]) => document.getElementById(id));
    const paw = `<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><circle cx="5.5" cy="9.5" r="2.3"/><circle cx="10" cy="5.5" r="2.4"/><circle cx="15" cy="5.5" r="2.4"/><circle cx="19.5" cy="9.5" r="2.3"/><path d="M12.5 10.2c-3.7 0-7.2 3.3-7.2 6.6 0 2.1 1.6 3.5 3.6 3.5 1.3 0 2.3-.6 3.6-.6s2.3.6 3.6.6c2 0 3.6-1.4 3.6-3.5 0-3.3-3.5-6.6-7.2-6.6Z"/></g></svg>`;
    paws.innerHTML = items.map(([id, label], i) =>
      `<a href="#${id}" data-section="${id}" data-label="${label}" aria-label="${label}" style="--r:${i % 2 ? 16 : -16}">${paw}</a>`).join("");
    const links = [...$$("a", paws), ...$$(".nav-links a[data-section]")];
    const setActive = (id) => {
      for (const a of links) {
        const on = a.dataset.section === id;
        a.classList.toggle("on", on);
        if (a.closest(".nav-links")) a.setAttribute("aria-current", on ? "true" : "false");
      }
    };
    const targets = items.map(([id]) => document.getElementById(id));
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    targets.forEach(t => io.observe(t));
    const showIO = new IntersectionObserver(([e]) => paws.classList.toggle("show", !e.isIntersecting), { threshold: .3 });
    showIO.observe($(".hero"));
  })();

  /* ---------- Spotlight auf Karten (ein Handler für alle) ---------- */
  (() => {
    if (!fine) return;
    const sel = ".feature,.news,.day,.setup,.stream-card,.stat";
    $$(sel).forEach(el => { if (!$(".spotlight", el)) el.insertAdjacentHTML("afterbegin", '<i class="spotlight"></i>'); });
    document.addEventListener("mousemove", (e) => {
      const c = e.target.closest(sel); if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      c.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    }, { passive: true });
  })();

  /* ---------- Magnetische Buttons ---------- */
  (() => {
    if (!fine || reduceMotion) return;
    /* Rechtecke werden nur alle 300 ms (und bei Scroll) neu gemessen – kein Layout-Thrashing pro Mausbewegung */
    const strength = .28, radius = 70;
    let els = [], rects = [], dirty = true, lastMeasure = 0, mx = -1e4, my = -1e4;
    const measure = () => { els = $$(".magnetic"); rects = els.map(el => el.getBoundingClientRect()); dirty = false; lastMeasure = performance.now(); };
    addEventListener("scroll", () => { dirty = true; }, { passive: true });
    addEventListener("resize", () => { dirty = true; }, { passive: true });
    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const tick = () => {
      if (dirty || performance.now() - lastMeasure > 300) measure();
      for (let i = 0; i < els.length; i++) {
        const el = els[i], r = rects[i];
        const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
        const inside = Math.abs(dx) < r.width / 2 + radius && Math.abs(dy) < r.height / 2 + radius;
        if (inside) {
          el.classList.add("pull");
          el.style.transform = `translate(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px)`;
        } else if (el.classList.contains("pull")) {
          el.classList.remove("pull");
          el.style.transform = "";
        }
      }
      requestAnimationFrame(tick);
    };
    tick();
  })();

  /* ---------- Eigener Cursor ---------- */
  (() => {
    const cur = $("#cursor"); if (!cur || !fine || reduceMotion) return;
    body.classList.add("fx-cursor");
    const dot = $(".cursor-dot", cur), ring = $(".cursor-ring", cur), label = $("#cursor-label");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, shown = false;
    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; rx = mx; ry = my; cur.classList.remove("hidden"); }
      const t = e.target;
      const labelled = t.closest("[data-cursor]");
      const interactive = t.closest("a,button,[role=tab],.game,.ws-card,.day,.strip-row a");
      cur.classList.toggle("label", !!labelled);
      cur.classList.toggle("hover", !!interactive && !labelled);
      if (labelled) label.textContent = labelled.dataset.cursor;
    }, { passive: true });
    addEventListener("mousedown", () => cur.classList.add("down"));
    addEventListener("mouseup", () => cur.classList.remove("down"));
    document.addEventListener("mouseleave", () => cur.classList.add("hidden"));
    document.addEventListener("mouseenter", () => cur.classList.remove("hidden"));
    cur.classList.add("hidden");
    const tick = () => {
      rx = lerp(rx, mx, .18); ry = lerp(ry, my, .18);
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      requestAnimationFrame(tick);
    };
    tick();
    /* Beschriftungen für Flächen */
    $$(".scene-sticky").forEach(el => el.dataset.cursor = "Scrollen");
    $$(".ws-card").forEach(el => el.dataset.cursor = "Öffnen");
    $$(".strip-row a").forEach(el => el.dataset.cursor = "Workshop");
    $$(".player").forEach(el => el.dataset.cursor = "Twitch");
  })();

  /* ---------- Szenen-Fließtext in Wörter ---------- */
  $$(".scene-text p.lead").forEach(p => {
    if (p.dataset.split) return; p.dataset.split = "1";
    p.innerHTML = p.textContent.trim().split(/\s+/).map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(" ");
  });

  /* ---------- Footer-Wordmark einlaufen lassen ---------- */
  (() => {
    const f = $(".footer"); if (!f) return;
    $$("#wordmark b").forEach((b, i) => b.style.setProperty("--i", i));
    new IntersectionObserver(([e]) => { if (e.isIntersecting) { f.classList.add("in"); } }, { threshold: .2 }).observe(f);
  })();

  /* ---------- Liquid-Fill: Startpunkt = Cursorposition ---------- */
  (() => {
    if (!fine) return;
    document.addEventListener("mouseover", (e) => {
      const b = e.target.closest(".btn-ghost"); if (!b) return;
      const r = b.getBoundingClientRect();
      b.style.setProperty("--bx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      b.style.setProperty("--by", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    }, { passive: true });
  })();

  /* ---------- Hero-Buchstaben neigen sich zum Cursor ---------- */
  (() => {
    if (!fine || reduceMotion) return;
    const hero = $(".hero"); if (!hero) return;
    let letters = [], mx = 0, my = 0, active = false;
    const collect = () => { letters = $$(".hero-title .ch b"); };
    hero.addEventListener("mouseenter", () => { active = true; collect(); });
    hero.addEventListener("mouseleave", () => { active = false; letters.forEach(b => b.style.transform = ""); });
    hero.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    const tick = () => {
      if (active && body.classList.contains("hero-done")) {
        for (const b of letters) {
          const r = b.getBoundingClientRect();
          const dx = (mx - (r.left + r.width / 2)) / innerWidth, dy = (my - (r.top + r.height / 2)) / innerHeight;
          const d = Math.hypot(dx, dy);
          const lift = Math.max(0, .18 - d) * 60;
          b.style.transform = `perspective(600px) rotateY(${(dx * 26).toFixed(2)}deg) rotateX(${(-dy * 18).toFixed(2)}deg) translateY(${(-lift).toFixed(1)}px)`;
        }
      }
      requestAnimationFrame(tick);
    };
    tick();
  })();

  /* ---------- 3D-Tilt auf Info- und News-Karten ---------- */
  (() => {
    if (!fine || reduceMotion) return;
    const sel = ".feature,.news,.setup";
    document.addEventListener("mousemove", (e) => {
      const c = e.target.closest(sel); if (!c || !c.classList.contains("in")) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(900px) rotateY(${(x * 8).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg) translateY(-6px)`;
    }, { passive: true });
    document.addEventListener("mouseout", (e) => {
      const c = e.target.closest(sel); if (c && !c.contains(e.relatedTarget)) c.style.transform = "";
    });
  })();

  /* ---------- Scroll-Geschwindigkeit global (für Bildband) ---------- */
  (() => {
    if (reduceMotion) return;
    let s = 0;
    const tick = () => {
      s = lerp(s, clamp(velocity * .12, -12, 12), .12);
      document.documentElement.style.setProperty("--skew", s.toFixed(2));
      requestAnimationFrame(tick);
    };
    tick();
  })();

  /* ---------- Welt: Biom pro Stockwerk ---------- */
  (() => {
    const world = $("#world"); if (!world || typeof WORLD === "undefined") return;
    const ids = Object.keys(WORLD), imgs = {};
    for (const id of ids) {
      const img = document.createElement("img");
      img.alt = ""; img.decoding = "async"; img.dataset.src = WORLD[id].image;
      world.appendChild(img); imgs[id] = img;
    }
    const load = (id) => { const i = imgs[id]; if (i && !i.src) i.src = i.dataset.src; };
    let current = null;
    const show = (id) => {
      if (current === id) return;
      current = id;
      for (const k of ids) { if (k === id) { load(k); imgs[k].classList.add("on"); } else imgs[k].classList.remove("on"); }
      load(ids[ids.indexOf(id) + 1]);
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) show(e.target.id);
    }, { rootMargin: "-35% 0px -45% 0px" });
    ids.forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
    /* Erstes Biom vorladen, sobald der Hero fast durchgescrollt ist */
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) load(ids[0]); }, { threshold: .4 }).observe($(".hero"));

    /* Etagen-Schilder */
    for (const id of ids) {
      const sec = document.getElementById(id), b = WORLD[id]; if (!sec) continue;
      const head = $(".section-head", sec);
      if (head) head.insertAdjacentHTML("afterbegin",
        `<div class="floor-tag"><span class="num">${b.floor}</span><span class="ico">${b.icon}</span><span>Ebene ${b.floor} · ${b.name}</span><span class="line"></span></div>`);
      sec.insertAdjacentHTML("afterbegin", `<div class="floor-down" aria-hidden="true">▼ Ebene <b>${b.floor}</b></div>`);
    }
  })();

  /* ---------- Entdeckungen pro Etage ---------- */
  (() => {
    if (typeof WORLD === "undefined" || reduceMotion) return;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const bird = `<svg class="bird" viewBox="0 0 40 20"><path d="M2 12 Q10 2 20 12 Q30 2 38 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    const fishSvg = `<svg viewBox="0 0 64 32" fill="currentColor"><path d="M2 16 L18 4 L18 28Z"/><ellipse cx="38" cy="16" rx="22" ry="11"/><circle cx="49" cy="13" r="2.2" fill="rgba(0,20,30,.8)"/></svg>`;
    const elephant = `<svg viewBox="0 0 110 90" fill="currentColor">
      <rect class="leg" x="12" y="56" width="12" height="32" rx="4"/><rect class="leg" x="26" y="56" width="12" height="32" rx="4"/>
      <rect class="leg" x="52" y="56" width="12" height="32" rx="4"/><rect class="leg" x="66" y="56" width="12" height="32" rx="4"/>
      <ellipse cx="44" cy="42" rx="40" ry="26"/><circle cx="88" cy="36" r="19"/><ellipse cx="76" cy="38" rx="11" ry="16"/>
      <path class="trunk" d="M100 42 C110 54 108 70 100 86 L94 84 C100 70 102 56 92 46Z"/>
      <path d="M6 36 L-3 58" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    const giraffe = `<svg viewBox="0 0 90 150" fill="currentColor">
      <rect x="22" y="104" width="6" height="46" rx="2"/><rect x="32" y="104" width="6" height="46" rx="2"/><rect x="54" y="104" width="6" height="46" rx="2"/><rect x="64" y="104" width="6" height="46" rx="2"/>
      <ellipse cx="46" cy="98" rx="28" ry="15"/>
      <g class="head"><path d="M62 92 L70 24 L80 26 L74 94Z"/><path d="M68 22 L92 16 L94 25 L76 32Z"/><path d="M74 20 L72 8 M82 18 L84 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></g>
      <path d="M20 94 L8 114" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    const gondola = `<svg viewBox="0 0 56 70" fill="currentColor"><path d="M28 0 L28 14" stroke="currentColor" stroke-width="3"/><path d="M16 14 L40 14 L34 24 L22 24Z"/><rect x="6" y="24" width="44" height="40" rx="10"/><rect x="12" y="30" width="32" height="16" rx="5" fill="rgba(200,235,255,.6)"/></svg>`;
    const make = (kind, box) => {
      const add = (html) => box.insertAdjacentHTML("beforeend", html);
      switch (kind) {
        case "birds": for (let i = 0; i < 3; i++) add(bird.replace('class="bird"', `class="bird" style="--y:${rnd(8, 26).toFixed(0)}%;--d:${rnd(28, 44).toFixed(0)}s;--delay:${(-rnd(0, 40)).toFixed(0)}s;width:${rnd(16, 28).toFixed(0)}px"`)); break;
        case "leaves": for (let i = 0; i < 8; i++) add(`<i class="leaf" style="--x:${rnd(2, 98).toFixed(0)}%;--s:${rnd(9, 18).toFixed(0)}px;--d:${rnd(13, 22).toFixed(0)}s;--delay:${(-rnd(0, 22)).toFixed(0)}s"></i>`); break;
        case "bubbles": for (let i = 0; i < 12; i++) add(`<i class="bubble" style="--x:${rnd(0, 100).toFixed(0)}%;--s:${rnd(5, 16).toFixed(0)}px;--d:${rnd(9, 16).toFixed(0)}s;--delay:${(-rnd(0, 16)).toFixed(0)}s"></i>`); break;
        case "fish": for (let i = 0; i < 3; i++) add(`<div class="fish" style="--y:${rnd(10, 80).toFixed(0)}%;--s:${rnd(36, 72).toFixed(0)}px;--d:${rnd(36, 60).toFixed(0)}s;--delay:${(-rnd(0, 60)).toFixed(0)}s">${fishSvg}</div>`); break;
        case "butterflies": for (let i = 0; i < 2; i++) add(`<div class="butterfly" style="--d:${rnd(28, 40).toFixed(0)}s;--delay:${(-rnd(0, 30)).toFixed(0)}s"><i></i><i></i></div>`); break;
        case "balloons": { const cols = ["#ff5f7a", "#f6b042", "#4ecb8d", "#9146ff", "#66c0f4"]; for (let i = 0; i < 5; i++) add(`<i class="balloon" style="--x:${rnd(3, 95).toFixed(0)}%;--c:${cols[i % cols.length]};--d:${rnd(22, 34).toFixed(0)}s;--delay:${(-rnd(0, 34)).toFixed(0)}s"></i>`); break; }
        case "elephant": add(`<div class="walker">${elephant}</div>`); break;
        case "giraffe": add(`<div class="giraffe">${giraffe}</div>`); break;
        case "stars": for (let i = 0; i < 70; i++) add(`<i class="star" style="left:${rnd(0, 100).toFixed(1)}%;top:${rnd(0, 70).toFixed(1)}%;--d:${rnd(2, 6).toFixed(1)}s;--delay:${(-rnd(0, 6)).toFixed(1)}s;--o:${rnd(.4, 1).toFixed(2)};width:${Math.random() < .15 ? 3 : 2}px;height:${Math.random() < .15 ? 3 : 2}px"></i>`); break;
        case "fireflies": for (let i = 0; i < 14; i++) add(`<i class="firefly" style="--x:${rnd(0, 100).toFixed(0)}%;--y:${rnd(20, 95).toFixed(0)}%;--d:${rnd(4, 8).toFixed(1)}s;--delay:${(-rnd(0, 8)).toFixed(1)}s"></i>`); break;
        case "gondola": add(`<div class="cable"></div><div class="gondola">${gondola}</div>`); break;
      }
    };
    for (const [id, b] of Object.entries(WORLD)) {
      const sec = document.getElementById(id); if (!sec || !b.critters) continue;
      const box = document.createElement("div"); box.className = "critters"; box.setAttribute("aria-hidden", "true");
      sec.prepend(box);
      b.critters.forEach(k => make(k, box));
    }
  })();

  /* ---------- Zähler hochzählen ---------- */
  (() => {
    const fmt = (n) => Math.round(n).toLocaleString("de-DE");
    const run = (el) => {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      const target = +el.dataset.count || 0, suffix = el.dataset.suffix || "";
      if (reduceMotion || !target) { el.textContent = fmt(target) + suffix; return; }
      const t0 = performance.now(), dur = 1700;
      const step = (t) => {
        const p = clamp((t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(target * e) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }, { threshold: .4 });
    $$(".stat strong[data-count]").forEach(el => io.observe(el));
    /* Wenn main.js später neue Zahlen setzt, einmal nachziehen */
    addEventListener("stats:update", (e) => {
      const el = document.getElementById(e.detail.id); if (!el) return;
      el.dataset.count = e.detail.value;
      if (el.dataset.counted) el.textContent = fmt(e.detail.value) + (el.dataset.suffix || "");
    });
  })();
})();

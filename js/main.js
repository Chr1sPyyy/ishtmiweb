/* ============================================================
   Ishtmi – Seitenlogik
   ============================================================ */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isLite = () => document.documentElement.classList.contains("lite");

  /* ---------- Hero: Titel in Buchstaben zerlegen ---------- */
  (() => {
    const h = $("#hero-title");
    const txt = h.textContent.trim();
    h.innerHTML = [...txt].map((c, i) => `<span class="ch" style="--i:${i}"><b>${c}</b></span>`).join("");
  })();

  /* Intro-Animation abschließen: Endzustand per Klasse festnageln (erst nach dem Intro-Vorhang) */
  const heroDone = () => {
    document.body.classList.add("hero-done");
    setTimeout(() => document.body.classList.add("hero-settled"), 700);
  };
  addEventListener("intro:done", () => setTimeout(heroDone, reduceMotion ? 0 : 2600), { once: true });
  setTimeout(heroDone, 9000); /* Sicherheitsnetz */

  /* ---------- Sternenhimmel (für die Dämmerungs-Szene) ---------- */
  const makeStars = (box, n) => {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement("i");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      const size = Math.random() < .15 ? 3 : 2;
      s.style.width = s.style.height = size + "px";
      s.style.setProperty("--d", (2 + Math.random() * 4).toFixed(2) + "s");
      s.style.setProperty("--delay", (-Math.random() * 6).toFixed(2) + "s");
      s.style.setProperty("--o", (.4 + Math.random() * .6).toFixed(2));
      frag.appendChild(s);
    }
    box.appendChild(frag);
  };

  /* ---------- Hero: Diashow + Trailer-Video ---------- */
  (() => {
    const slidesBox = $("#hero-slides"), video = $("#hero-video"), muteBtn = $("#hero-mute");
    const slides = (HERO.slides || []).map((src, i) => {
      const img = document.createElement("img");
      img.className = "hero-slide" + (i % 2 ? " alt" : "");
      img.src = src; img.alt = ""; img.decoding = "async";
      if (i) img.loading = "lazy";
      img.style.setProperty("--kb", (HERO.slideSeconds + 3) + "s");
      slidesBox.appendChild(img);
      return img;
    });
    let idx = 0, timer;
    const showSlide = (i) => {
      slides.forEach((s, k) => s.classList.toggle("on", k === i));
    };
    if (slides.length) {
      showSlide(0);
      if (slides.length > 1 && !reduceMotion) {
        /* Nächste Folie erst einblenden, wenn sie dekodiert ist; unter laufendem Video pausiert */
        timer = setInterval(() => {
          if (document.getElementById("hero-media").classList.contains("video-on")) return;
          const n = (idx + 1) % slides.length, img = slides[n];
          (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => { idx = n; showSlide(idx); });
        }, HERO.slideSeconds * 1000);
      }
    }

    /* Video nur, wenn sinnvoll: nicht bei reduzierter Bewegung oder Datensparmodus */
    const conn = navigator.connection || {};
    if (!HERO.video || reduceMotion || conn.saveData) return;
    const media = $("#hero-media");

    /* Vorspann überspringen und vor dem Abspann wieder einsteigen */
    const vStart = HERO.videoStart || 0, vTrim = HERO.videoTrimEnd || 0;
    if (slides.length) video.poster = HERO.slides[0];
    video.addEventListener("loadedmetadata", () => { if (vStart) video.currentTime = vStart; });
    video.addEventListener("timeupdate", () => {
      if (video.duration && video.currentTime > video.duration - vTrim - .25) video.currentTime = vStart;
      else if (video.currentTime < vStart - .5) video.currentTime = vStart;
    });

    /* Sichtbar erst, wenn wirklich Bilder ankommen; bei Pufferpausen zurück zur Diashow.
       Geprüft wird nur, bis das Video steht – kein Dauer-Callback pro Videoframe. */
    let shown = false;
    const check = () => video.readyState >= 3 && !video.paused && video.currentTime > vStart + .4;
    const watch = () => {
      if ("requestVideoFrameCallback" in video) {
        const onFrame = () => { if (check()) setShown(true); else if (!shown) video.requestVideoFrameCallback(onFrame); };
        video.requestVideoFrameCallback(onFrame);
      } else {
        const onTime = () => { if (check()) { video.removeEventListener("timeupdate", onTime); setShown(true); } };
        video.addEventListener("timeupdate", onTime);
      }
    };
    const setShown = (v) => {
      if (shown === v) return;
      shown = v;
      video.classList.toggle("ready", v);
      media.classList.toggle("video-on", v);
      if (v) muteBtn.hidden = false; else watch();
    };
    const hide = () => setShown(false);
    watch();
    video.addEventListener("waiting", hide);
    video.addEventListener("stalled", hide);
    video.addEventListener("error", hide);

    const start = () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = HERO.video;
      } else if (window.Hls && Hls.isSupported()) {
        const hls = new Hls({ capLevelToPlayerSize: true, startLevel: -1, maxBufferLength: 20 });
        hls.loadSource(HERO.video);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) { hls.destroy(); hide(); } });
        /* Höchstens 720p: im abgedunkelten Hintergrund reicht das und spart viel Decoder-Last */
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          let cap = -1;
          hls.levels.forEach((l, i) => { if (l.height && l.height <= 720 && (cap < 0 || l.height > hls.levels[cap].height)) cap = i; });
          if (cap >= 0) hls.autoLevelCapping = cap;
        });
      } else return;
      video.muted = true;
      video.play().catch(() => {});
    };
    /* Nur im vollen Effektmodus; hls.js lädt mit defer – ggf. kurz warten */
    let started = false;
    const startVideo = () => {
      if (started || isLite()) return;
      started = true;
      if (window.Hls || video.canPlayType("application/vnd.apple.mpegurl")) start();
      else window.addEventListener("load", start, { once: true });
    };
    startVideo();
    addEventListener("fx:mode", (e) => {
      if (e.detail.lite) { video.pause(); hide(); }
      else if (!started) startVideo();
      else video.play().catch(() => {});
    });

    muteBtn.addEventListener("click", () => {
      video.muted = !video.muted;
      muteBtn.setAttribute("aria-pressed", String(!video.muted));
      muteBtn.setAttribute("aria-label", video.muted ? "Ton einschalten" : "Ton ausschalten");
    });

    /* Video pausieren, wenn der Hero aus dem Bild ist */
    new IntersectionObserver(([e]) => {
      if (!video.src && !video.srcObject && !video.classList.contains("ready")) return;
      if (e.isIntersecting && !isLite()) video.play().catch(() => {}); else video.pause();
    }, { threshold: .05 }).observe($(".hero"));
  })();

  /* ---------- Hero: Glühwürmchen (Canvas) ---------- */
  (() => {
    const canvas = $("#fireflies");
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    const hero = $(".hero");
    let w, h, dpr, flies = [], raf, visible = true, mx = 0, my = 0;

    const spawn = () => ({
      x: Math.random() * w,
      y: h * .35 + Math.random() * h * .6,
      r: 1 + Math.random() * 1.8,
      vx: (Math.random() - .5) * .25,
      vy: (Math.random() - .5) * .18,
      p: Math.random() * Math.PI * 2,
      ps: .4 + Math.random() * 1.2,
      hue: 40 + Math.random() * 30,
      depth: .3 + Math.random() * .7,
    });
    const resize = () => {
      dpr = 1; /* weiche Leuchtpunkte brauchen keine Retina-Auflösung */
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(44, Math.max(18, w / 30)));
      flies = Array.from({ length: n }, spawn);
    };

    /* Glüh-Sprite einmal vorrendern statt pro Frame Verläufe zu bauen */
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext("2d");
    const sg = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    sg.addColorStop(0, "rgba(255,235,170,1)");
    sg.addColorStop(.25, "rgba(255,200,90,.45)");
    sg.addColorStop(1, "rgba(255,190,80,0)");
    sctx.fillStyle = sg; sctx.fillRect(0, 0, 64, 64);

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const f of flies) {
        f.p += .016 * f.ps;
        f.x += f.vx + Math.sin(f.p * .7) * .12;
        f.y += f.vy + Math.cos(f.p * .5) * .08;
        if (f.x < -10) f.x = w + 10; if (f.x > w + 10) f.x = -10;
        if (f.y < h * .25) f.y = h * .95; if (f.y > h) f.y = h * .3;
        const a = (Math.sin(f.p) * .5 + .5) * .85 + .05;
        const px = f.x + mx * 18 * f.depth, py = f.y + my * 10 * f.depth;
        const s = f.r * 14;
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, px - s / 2, py - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      if (visible && !isLite()) raf = requestAnimationFrame(tick);
    };

    addEventListener("fx:mode", () => { cancelAnimationFrame(raf); if (visible && !isLite()) raf = requestAnimationFrame(tick); });
    addEventListener("resize", resize, { passive: true });
    addEventListener("mousemove", (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !isLite()) raf = requestAnimationFrame(tick);
    }).observe(hero);
    resize();
  })();

  /* ---------- Hero: sanfter Maus-Parallax + Ausblenden beim Scrollen ---------- */
  (() => {
    if (reduceMotion) return;
    const media = $("#hero-media"), content = $(".hero-content");
    const hasMouse = matchMedia("(hover:hover) and (pointer:fine)").matches;
    /* Läuft nur, solange gescrollt wird oder die Maus-Glättung noch nachzieht */
    let tx = 0, ty = 0, cx = 0, cy = 0, running = false, lastY = -1;
    const loop = () => {
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      const sy = scrollY;
      const settling = Math.abs(tx - cx) > .0008 || Math.abs(ty - cy) > .0008;
      if (sy < innerHeight * 1.1 && (settling || sy !== lastY)) {
        lastY = sy;
        const moving = sy > 0 || Math.abs(cx) > .001 || Math.abs(cy) > .001;
        media.style.transform = moving ? `translate3d(${(-cx * 22).toFixed(1)}px, ${(sy * .3 - cy * 14).toFixed(1)}px, 0) scale(1.02)` : "";
        /* Inhalt nur bei echter Bewegung transformieren – ein dauerhafter 3D-Layer
           führte auf Mobilgeräten zu einem nicht gezeichneten Hero-Text. */
        content.style.transform = moving ? `translate(${(-cx * 8).toFixed(1)}px, ${(sy * .22).toFixed(1)}px)` : "";
        content.style.opacity = sy > 0 ? Math.max(0, 1 - sy / (innerHeight * .7)).toFixed(3) : "";
      }
      if (settling) requestAnimationFrame(loop); else running = false;
    };
    const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
    if (hasMouse) addEventListener("mousemove", (e) => {
      if (scrollY > innerHeight || isLite()) return;
      tx = (e.clientX / innerWidth - .5);
      ty = (e.clientY / innerHeight - .5);
      kick();
    }, { passive: true });
    addEventListener("scroll", kick, { passive: true });
    kick();
  })();

  /* ---------- Scroll-Szenen: Aufbau + Fortschritt ---------- */
  (() => {
    const slots = $$(".scene-slot");
    if (!slots.length || typeof SCENES === "undefined") return;
    const escA = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const scenes = [];
    for (const slot of slots) {
      const sc = SCENES.find(s => s.id === slot.dataset.scene);
      if (!sc) { slot.remove(); continue; }
      const sec = document.createElement("section");
      sec.className = `scene scene--${sc.effect}`;
      sec.id = `scene-${sc.id}`;
      sec.setAttribute("aria-label", sc.title);
      let extra = "";
      if (sc.effect === "dive") extra = `<div class="iris"></div><div class="rays"></div><div class="bubbles"></div>`;
      if (sc.effect === "dusk") extra = `<div class="night"></div><div class="stars"></div><div class="moon"></div>`;
      if (sc.effect === "wipe") extra = `<div class="wipe-mask"><div class="wipe-inner"><img class="scene-img scene-img2" src="${escA(sc.image2)}" alt="" loading="lazy" decoding="async"></div></div><div class="wipe-track"><div class="wipe-line"></div></div><span class="wipe-label l">${escA(sc.label)}</span><span class="wipe-label r">${escA(sc.label2)}</span>`;
      const cta = sc.link ? `<a class="btn ${sc.external ? "btn-twitch" : "btn-ghost"}" href="${escA(sc.link)}" ${sc.external ? 'target="_blank" rel="noopener"' : ""}>${escA(sc.linkText || "Mehr")}</a>` : "";
      sec.innerHTML = `
        <div class="scene-sticky">
          <div class="scene-media">
            <img class="scene-img" src="${escA(sc.image)}" alt="" loading="lazy" decoding="async">
            ${extra}
          </div>
          <div class="scene-shade"></div>
          <div class="scene-text">
            <p class="eyebrow">${escA(sc.eyebrow)}</p>
            <h2>${escA(sc.title)}</h2>
            <p class="lead">${escA(sc.text)}</p>
            ${cta}
          </div>
          ${sc.credit ? `<small class="scene-credit">${escA(sc.credit)}</small>` : ""}
          <div class="scene-progress"><i></i></div>
        </div>`;
      slot.replaceWith(sec);
      if (sc.effect === "dusk") makeStars($(".stars", sec), 30);
      if (sc.effect === "dive") {
        const b = $(".bubbles", sec);
        for (let i = 0; i < 10; i++) {
          const el = document.createElement("i");
          el.style.setProperty("--x", Math.random() * 100 + "%");
          el.style.setProperty("--s", (4 + Math.random() * 14).toFixed(0) + "px");
          el.style.setProperty("--d", (7 + Math.random() * 9).toFixed(1) + "s");
          el.style.setProperty("--delay", (-Math.random() * 14).toFixed(1) + "s");
          b.appendChild(el);
        }
      }
      scenes.push(sec);
    }
    if (reduceMotion) return;

    /* Positionen werden gecacht (nur bei Größenänderung neu gemessen), damit pro
       Scroll-Frame keine Layout-Abfrage nötig ist. */
    const clamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
    let tops = [], heights = [];
    const measure = () => {
      const y = scrollY;
      tops = scenes.map(s => s.getBoundingClientRect().top + y);
      heights = scenes.map(s => s.offsetHeight);
    };
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = innerHeight, y = scrollY;
      scenes.forEach((sec, i) => {
        const top = tops[i] - y, h = heights[i], total = h - vh;
        if (top + h < -vh || top > vh * 2) {                       /* weit weg: nichts tun */
          if (sec._active) { sec._active = false; sec.classList.remove("active"); }
          return;
        }
        const p = clamp(total > 0 ? -top / total : 0);
        if (sec._p !== undefined && Math.abs(sec._p - p) < .0004) return;
        sec._p = p;
        sec.style.setProperty("--p", p.toFixed(4));
        sec.style.setProperty("--t", clamp((p - .12) / .4).toFixed(4));
        sec.style.setProperty("--e", clamp((p - .86) / .14).toFixed(4));
        const act = p > 0 && p < 1;
        if (act !== sec._active) { sec._active = act; sec.classList.toggle("active", act); }
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", onScroll, { passive: true });
    new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);
    measure();
    update();
  })();

  /* ---------- Nav ---------- */
  (() => {
    const nav = $("#nav"), burger = $("#nav-burger"), links = $("#nav-links");
    const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
      burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) { links.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
    });
  })();

  /* ---------- Reveal beim Scrollen ---------- */
  const pendingReveal = new Set();
  const show = (el) => { el.classList.add("in"); pendingReveal.delete(el); revealIO.unobserve(el); };
  const revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting || e.boundingClientRect.top < 0) show(e.target);
  }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
  const observeReveal = (root = document) => $$(".reveal", root).forEach(el => { pendingReveal.add(el); revealIO.observe(el); });
  /* Fallback: bei Sprüngen (Anker, schnelles Scrollen) übersprungene Elemente nachträglich einblenden */
  /* Erst nach dem Scrollen prüfen statt in jedem Frame Dutzende Rechtecke zu messen */
  let revealTimer = 0;
  addEventListener("scroll", () => {
    if (!pendingReveal.size) return;
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => {
      for (const el of pendingReveal) if (el.getBoundingClientRect().top < innerHeight) show(el);
    }, 150);
  }, { passive: true });

  /* ---------- Hilfsfunktionen ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  const fmtNum = (n) => Number(n || 0).toLocaleString("de-DE");
  const byDay = (idx) => SCHEDULE.find(e => e.dayIndex === idx);

  /* Nächsten Stream berechnen */
  const nextStream = () => {
    const now = new Date(), today = now.getDay(), hour = now.getHours();
    for (let i = 0; i < 7; i++) {
      const e = byDay((today + i) % 7);
      if (!e || e.slot === "offline") continue;
      if (i === 0) {
        if (e.slot === "vormittags" && hour >= 14) continue;
        if (e.slot === "abends" && hour >= 23) continue;
        return { e, when: "Heute" };
      }
      return { e, when: i === 1 ? "Morgen" : e.day };
    }
    return null;
  };
  const nextStreamText = () => {
    const n = nextStream();
    if (!n) return "Bald wieder";
    const t = n.e.time ? ` (${n.e.time})` : "";
    const sp = n.e.special ? ` · ${n.e.special}` : "";
    return `${n.when}, ${SLOTS[n.e.slot].label.toLowerCase()}${t}${sp}`;
  };
  /* Nächster Stream als Zeitpunkt (für den Countdown) */
  const nextStreamDate = () => {
    const now = new Date();
    for (let i = 0; i < 8; i++) {
      const d = new Date(now); d.setDate(now.getDate() + i);
      const e = byDay(d.getDay());
      if (!e || e.slot === "offline") continue;
      const s = SLOTS[e.slot]; if (!s.start) continue;
      const [hh, mm] = s.start.split(":").map(Number);
      d.setHours(hh, mm, 0, 0);
      const end = new Date(d.getTime() + (s.hours || 4) * 3600e3);
      if (end < now) continue;
      return { date: d, entry: e, slot: s, running: d <= now };
    }
    return null;
  };

  /* ---------- Info-Kacheln ---------- */
  $("#feature-grid").innerHTML = FEATURES.map((f, i) => `
    <article class="feature reveal" style="transition-delay:${i * 60}ms">
      <div class="ico">${f.icon}</div>
      <h3>${esc(f.title)}</h3>
      <p>${esc(f.text)}</p>
    </article>`).join("");

  /* ---------- Streamplan ---------- */
  (() => {
    const today = new Date().getDay();
    const order = [1, 2, 3, 4, 5, 6, 0];
    $("#week").innerHTML = order.map((d, i) => {
      const e = byDay(d), s = SLOTS[e.slot];
      return `
      <article class="day ${e.slot} ${d === today ? "today" : ""} reveal" style="transition-delay:${i * 50}ms">
        <div class="d-short">${e.short}</div>
        <div class="d-name">${esc(e.day)}</div>
        <div class="d-ico">${s.icon}</div>
        <div class="d-slot">${s.label}</div>
        <div class="d-hint">${e.time ? esc(e.time) : s.hint}</div>
        ${e.special ? `<span class="d-special" title="${esc(e.note || "")}">${esc(e.special)}</span>` : ""}
      </article>`;
    }).join("");
    const nx = nextStreamText();
    $("#hero-next").innerHTML = `Nächster Stream: <strong>${esc(nx)}</strong>`;
    $("#stream-next").textContent = nx;
  })();

  /* ---------- Countdown zum nächsten Stream ---------- */
  const countdown = (() => {
    const box = $("#countdown"), lbl = $("#cd-label");
    const d = $("#cd-d"), h = $("#cd-h"), m = $("#cd-m"), s = $("#cd-s");
    const heroNext = $("#hero-next");
    let live = false;
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      if (live) {
        box.hidden = false; box.classList.add("live");
        lbl.textContent = "Gerade live – schau rein!";
        return;
      }
      box.classList.remove("live");
      const n = nextStreamDate();
      if (!n) { box.hidden = true; return; }
      box.hidden = false;
      const approx = n.slot.approx ? "ca. " : "";
      if (n.running) {
        lbl.textContent = `Streamzeit (${approx}ab ${n.slot.start} Uhr) – vielleicht schon live`;
        d.parentElement.parentElement.style.display = "none";
        return;
      }
      d.parentElement.parentElement.style.display = "";
      const diff = Math.max(0, n.date - Date.now());
      const days = Math.floor(diff / 864e5), hrs = Math.floor(diff % 864e5 / 36e5);
      const mins = Math.floor(diff % 36e5 / 6e4), secs = Math.floor(diff % 6e4 / 1e3);
      /* Ziffer wechseln + kurz einploppen (Web Animations, ohne erzwungenes Layout) */
      const set = (el, v) => {
        if (el.textContent === String(v)) return;
        el.textContent = v;
        if (!reduceMotion && el.animate) el.animate([{ transform: "translateY(-40%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
      };
      set(d, days); set(h, pad(hrs)); set(m, pad(mins)); set(s, pad(secs));
      d.parentElement.style.display = days ? "" : "none";
      lbl.textContent = `Nächster Stream in (${approx}${n.slot.start} Uhr)`;
      const short = days ? `${days} T ${hrs} Std` : hrs ? `${hrs} Std ${pad(mins)} Min` : `${mins} Min ${pad(secs)} Sek`;
      heroNext.innerHTML = `Nächster Stream in <strong>${short}</strong> · ${esc(nextStreamText())}`;
    };
    tick(); setInterval(tick, 1000);
    return { setLive: (v) => { live = v; tick(); } };
  })();

  /* ---------- Stats: Workshop-Zahlen ---------- */
  (() => {
    if (typeof WORKSHOP === "undefined") return;
    const subs = WORKSHOP.reduce((a, w) => a + (w.subs || 0), 0);
    const roundDown = subs >= 1000 ? Math.floor(subs / 100) * 100 : Math.floor(subs / 10) * 10;
    dispatchEvent(new CustomEvent("stats:update", { detail: { id: "stat-subs", value: roundDown } }));
    dispatchEvent(new CustomEvent("stats:update", { detail: { id: "stat-items", value: WORKSHOP.length } }));
    $("#stat-subs").dataset.count = roundDown;
    $("#stat-items").dataset.count = WORKSHOP.length;
  })();

  /* ---------- Bildband aus dem Workshop ---------- */
  (() => {
    if (typeof WORKSHOP === "undefined") return;
    const a = $("#strip-a"), b = $("#strip-b"); if (!a || !b) return;
    const items = [...WORKSHOP].sort((x, y) => (y.subs || 0) - (x.subs || 0)).filter(w => w.image);
    const half = Math.ceil(items.length / 2);
    const mk = (list) => list.concat(list).map(w => `
      <a href="https://steamcommunity.com/sharedfiles/filedetails/?id=${w.id}" target="_blank" rel="noopener" tabindex="-1">
        <img src="${esc(w.image.replace(/\?.*$/, ""))}?imw=520&imh=300&ima=fit&impolicy=Letterbox&letterbox=false" alt="" loading="lazy" decoding="async">
        <span>${esc(w.title)}</span>
      </a>`).join("");
    a.innerHTML = mk(items.slice(0, half));
    b.innerHTML = mk(items.slice(half));
  })();

  /* ---------- News ---------- */
  $("#news-grid").innerHTML = [...NEWS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((n, i) => `
    <article class="news reveal" style="transition-delay:${i * 60}ms">
      <div class="news-meta"><span class="news-tag">${esc(n.tag)}</span><time datetime="${n.date}">${fmtDate(n.date)}</time></div>
      <h3>${esc(n.title)}</h3>
      <p>${esc(n.text)}</p>
      ${n.link ? `<a class="more" href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.linkText || "Mehr")}</a>` : ""}
    </article>`).join("");

  /* ---------- Steam Workshop ---------- */
  (() => {
    const featBox = $("#ws-featured"), grid = $("#ws-grid");
    if (typeof WORKSHOP === "undefined" || !WORKSHOP.length) {
      featBox.remove();
      grid.innerHTML = `<p class="ws-empty">Workshop-Inhalte folgen in Kürze.</p>`;
      return;
    }
    const url = (id) => `https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`;
    /* Steam liefert Vorschaubilder in jeder Größe – Highlights groß, Rest kompakt */
    const img = (src, w, h) => src.replace(/\?.*$/, "") + `?imw=${w}&imh=${h}&ima=fit&impolicy=Letterbox&letterbox=false`;
    /* Score: Abos zählen am meisten, dann Favoriten, dann Aufrufe. Sterne geben Bonus. */
    const score = (w) => (w.subs || 0) * 6 + (w.favs || 0) * 4 + (w.views || 0) / 25 + (Number(w.stars) || 0) * 40;
    const manual = (typeof WORKSHOP_FEATURED !== "undefined" && WORKSHOP_FEATURED.length) ? WORKSHOP_FEATURED.map(String) : null;
    const sorted = [...WORKSHOP].sort((a, b) => score(b) - score(a));
    const featured = manual
      ? manual.map(id => WORKSHOP.find(w => String(w.id) === id)).filter(Boolean).slice(0, 3)
      : sorted.slice(0, 3);
    const rest = sorted.filter(w => !featured.includes(w));
    const rankLabel = ["Community-Favorit", "Top-Blueprint", "Fan-Liebling"];

    const stars = (s) => {
      const n = Number(s) || 0;
      if (!n) return "";
      return `<span class="ws-stars" title="${n} von 5 Sternen">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;
    };
    const card = (w, i, top) => `
      <a class="ws-card ${top ? "top" : ""} reveal" href="${url(w.id)}" target="_blank" rel="noopener" style="transition-delay:${i * 50}ms">
        <img src="${esc(top ? img(w.image, 1024, 576) : img(w.image, 640, 360))}" alt="${esc(w.title)}" loading="lazy">
        <div class="ws-shade"></div>
        ${top ? `<span class="ws-badge">★ #${i + 1} ${rankLabel[i] || "Highlight"}</span>` : (w.stars && Number(w.stars) >= 4 ? `<span class="ws-badge rank">★ ${w.stars}/5</span>` : "")}
        <div class="ws-body">
          <div class="ws-title">${esc(w.title)}</div>
          ${w.blurb || w.desc ? `<p class="ws-desc">${esc(w.blurb || w.desc)}</p>` : ""}
          <div class="ws-meta">
            ${w.game ? `<span class="ws-chip ws-game">${esc(w.game)}</span>` : ""}
            ${w.subs ? `<span class="ws-chip" title="Abonnenten">⬇ ${fmtNum(w.subs)}</span>` : ""}
            ${w.favs ? `<span class="ws-chip" title="Favoriten">♥ ${fmtNum(w.favs)}</span>` : ""}
            ${w.views ? `<span class="ws-chip" title="Aufrufe">👁 ${fmtNum(w.views)}</span>` : ""}
            ${stars(w.stars)}
          </div>
        </div>
      </a>`;
    featBox.innerHTML = featured.map((w, i) => card(w, i, true)).join("");
    grid.innerHTML = rest.map((w, i) => card(w, i, false)).join("");
  })();

  /* ---------- Games ---------- */
  (() => {
    const grid = $("#game-grid"), filters = $("#game-filters");
    const order = { aktuell: 0, geplant: 1, pausiert: 2 };
    const games = [...GAMES].sort((a, b) => order[a.status] - order[b.status]);
    grid.innerHTML = games.map((g, i) => `
      <article class="game ${g.status} reveal" data-status="${g.status}" style="transition-delay:${i * 40}ms">
        <img src="${esc(g.cover)}" alt="Cover: ${esc(g.name)}" loading="lazy" width="285" height="380">
        <div class="shade"></div>
        <span class="g-status" style="--c:${GAME_STATUS[g.status].color}">${GAME_STATUS[g.status].label}</span>
        <div class="g-body"><h3>${esc(g.name)}</h3>${g.note ? `<p class="g-note">${esc(g.note)}</p>` : ""}</div>
        <div class="glare"></div>
      </article>`).join("");
    $$("img", grid).forEach(img => img.addEventListener("error", () => {
      img.style.display = "none";
      img.parentElement.style.background = "linear-gradient(160deg,#1c3a2e,#0f1f19)";
    }));

    const counts = games.reduce((a, g) => (a[g.status] = (a[g.status] || 0) + 1, a), {});
    const tabs = [["alle", "Alle", games.length], ...Object.keys(GAME_STATUS).map(k => [k, GAME_STATUS[k].label, counts[k] || 0])];
    filters.innerHTML = tabs.map(([k, l, n], i) =>
      `<button role="tab" data-filter="${k}" aria-selected="${i === 0}">${l}<span class="n">${n}</span></button>`).join("");
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      $$("button", filters).forEach(x => x.setAttribute("aria-selected", x === b));
      const f = b.dataset.filter;
      $$(".game", grid).forEach(c => c.classList.toggle("hidden", f !== "alle" && c.dataset.status !== f));
    });

    /* 3D-Tilt */
    if (!reduceMotion && matchMedia("(hover:hover)").matches) {
      grid.addEventListener("mousemove", (e) => {
        const c = e.target.closest(".game"); if (!c) return;
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.transform = `rotateY(${(x - .5) * 14}deg) rotateX(${(.5 - y) * 14}deg) translateY(-6px)`;
        c.style.setProperty("--gx", x * 100 + "%"); c.style.setProperty("--gy", y * 100 + "%");
      });
      grid.addEventListener("mouseout", (e) => {
        const c = e.target.closest(".game"); if (c && !c.contains(e.relatedTarget)) c.style.transform = "";
      });
    }
  })();

  /* ---------- Setup ---------- */
  $("#setup-grid").innerHTML = SETUP.map((s, i) => `
    <section class="setup reveal" style="transition-delay:${i * 80}ms">
      <h3><span>${s.icon}</span>${esc(s.title)}</h3>
      <ul>${s.items.map(it => `<li>${esc(it)}</li>`).join("")}</ul>
    </section>`).join("");

  observeReveal();
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Twitch-Player einbetten ---------- */
  (() => {
    const host = location.hostname || "localhost";
    $("#twitch-player").src =
      `https://player.twitch.tv/?channel=${SITE.channel}&parent=${encodeURIComponent(host)}&muted=true&autoplay=false`;
  })();

  /* ---------- Live-Status (decapi.me, ohne API-Key) ---------- */
  (() => {
    const pill = $("#hero-status"), pillTxt = $(".txt", pill);
    const badge = $("#live-badge"), title = $("#stream-title"), game = $("#stream-game");
    const uptime = $("#stream-uptime"), follow = $("#follow-count"), dot = $("#nav-live-dot");
    const viewers = $("#stream-viewers");
    const get = (ep) => fetch(`https://decapi.me/twitch/${ep}/${SITE.channel}`, { cache: "no-store" })
      .then(r => r.ok ? r.text() : Promise.reject(r.status)).then(t => t.trim());

    const setOffline = () => {
      pill.classList.remove("live"); dot.classList.remove("on"); badge.classList.remove("on");
      pillTxt.textContent = `Gerade offline · Nächster Stream: ${nextStreamText()}`;
      badge.textContent = "Offline";
      uptime.textContent = "Offline";
      viewers.textContent = "–";
      countdown.setLive(false);
      $("#stream-card").classList.remove("is-live");
      title.textContent = "Gerade kein Stream – schau im Plan nach, wann's weitergeht.";
      document.title = "Ishtmi – Cozy Planet Zoo Streams auf Twitch";
    };

    const update = async () => {
      try {
        const [up, g, t, f, vc] = await Promise.all([get("uptime"), get("game"), get("title"), get("followcount"), get("viewercount").catch(() => "")]);
        if (/^\d+$/.test(f)) {
          follow.textContent = `${fmtNum(f)} Follower · twitch.tv/${SITE.channel}`;
          dispatchEvent(new CustomEvent("stats:update", { detail: { id: "stat-follow", value: Number(f) } }));
        }
        const live = !/offline/i.test(up) && !/error|not found/i.test(up);
        if (!live) return setOffline();
        const short = up
          .replace(/(\d+) hours?/, "$1 Std")
          .replace(/(\d+) minutes?/, "$1 Min")
          .replace(/,\s*\d+ seconds?/, "")
          .replace(/^(\d+) seconds?$/, "gerade gestartet");
        pill.classList.add("live"); dot.classList.add("on"); badge.classList.add("on");
        pillTxt.textContent = `Jetzt live · ${g || "Stream"} · seit ${short}`;
        badge.textContent = "Live";
        title.textContent = t || "Live auf Twitch";
        game.textContent = g || "–";
        uptime.textContent = `Live seit ${short}`;
        viewers.textContent = /^\d+$/.test(vc) ? `${fmtNum(vc)} gerade dabei` : "–";
        countdown.setLive(true);
        $("#stream-card").classList.add("is-live");
        document.title = `🔴 LIVE: ${g || "Stream"} – Ishtmi`;
      } catch (err) {
        /* Dienst nicht erreichbar → neutraler Zustand ohne Fehlermeldung */
        pill.classList.remove("live");
        pillTxt.textContent = `Nächster Stream: ${nextStreamText()}`;
        badge.textContent = "Twitch";
        title.textContent = "Schau auf Twitch vorbei – dort siehst du sofort, ob Ishtmi live ist.";
        uptime.textContent = "–";
      }
    };
    update();
    setInterval(update, 120000);
  })();
})();

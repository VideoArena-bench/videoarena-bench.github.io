/* Video-Arena project page — rendering. All content lives in data.js. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (t) => { t = Math.max(0, t); return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`; };
  const SYM = { full: "✓", partial: "◐", fp: "✗" };
  const ft = (x) => fmt(x.ts ?? x.t); // game time when the clip is condensed

  /* ------------------------------------------------------------ tooltip */
  const tip = $("#tip");
  function moveTip(e) {
    const pad = 14, w = tip.offsetWidth, ht = tip.offsetHeight;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + w > innerWidth - 8) x = e.clientX - w - pad;
    if (y + ht > innerHeight - 8) y = e.clientY - ht - pad;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function bindTip(el, html) {
    el.addEventListener("mouseenter", (e) => { tip.innerHTML = html(); tip.classList.add("on"); moveTip(e); });
    el.addEventListener("mousemove", moveTip);
    el.addEventListener("mouseleave", () => tip.classList.remove("on"));
  }
  const gtTip = (e) => `<div class="th">Ground truth · ${ft(e)}</div><table>
    <tr><td>T1</td><td>${esc(e.text)}</td></tr><tr><td>T2</td><td>${esc(e.t2)}</td></tr><tr><td>T3</td><td>${esc(e.t3)}</td></tr></table>`;

  /* ------------------------------------------------------------ player
   * Plays videos/…mp4 when it exists; otherwise a frame slideshow driven by a virtual clock. */
  const ICON_PLAY = '<svg viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 16 16"><path d="M3 2h4v12H3zM9 2h4v12H9z"/></svg>';
  const SPEEDS = [1, 2, 4];

  function Player(host, o) {
    host.innerHTML = `<div class="player"><div class="screen">
        <img class="bgblur" alt=""><img class="fr" alt="">
        <div class="rec"><i></i>REPLAY</div><div class="clock"></div>
        <div class="toast"></div><div class="phtag">placeholder · frame slideshow</div></div>
      <div class="controls"><button class="play" aria-label="Play / pause">${ICON_PLAY}</button>
        <div class="track"><div class="rail"></div><div class="fill"></div><div class="knob"></div></div>
        <button class="speed" title="Playback speed">1×</button><span class="time"></span></div></div>`;
    const screen = $(".screen", host), fr = $(".fr", host), bg = $(".bgblur", host), toastEl = $(".toast", host);
    const track = $(".track", host), fill = $(".fill", track), knob = $(".knob", track);
    const btn = $(".play", host), spd = $(".speed", host), clock = $(".clock", host), time = $(".time", host);
    const D = o.duration;
    let t = 0, playing = false, speed = 1, last = 0, raf = 0, frameIdx = -1, video = null, toastHtml = null;

    const ticks = (o.ticks || []).map((k) => {
      const el = h(`<div class="tick" style="left:${(k.t / D) * 100}%"></div>`);
      track.insertBefore(el, knob);
      if (k.tip) bindTip(el, k.tip);
      return { t: k.t, el };
    });

    if (o.video) {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = o.video;
      v.addEventListener("loadeddata", () => {
        video = v; screen.insertBefore(v, fr);
        fr.style.display = bg.style.display = "none";
        const tag = $(".phtag", host);
        if (o.tag) { tag.textContent = o.tag; tag.classList.add("real"); } else tag?.remove();
        v.playbackRate = speed; v.currentTime = t;
        if (playing) v.play();
      }, { once: true });
    }

    const api = {
      play() {
        if (t >= D) api.seek(0);
        playing = true; btn.innerHTML = ICON_PAUSE; last = performance.now();
        if (video) video.play();
        cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      },
      pause() { playing = false; btn.innerHTML = ICON_PLAY; cancelAnimationFrame(raf); if (video) video.pause(); },
      seek(nt) { t = Math.max(0, Math.min(D, nt)); if (video) video.currentTime = t; render(); },
      toast(html) {
        if (html === toastHtml) return;
        toastHtml = html;
        if (html) toastEl.innerHTML = html;
        toastEl.classList.toggle("show", !!html);
      },
      get t() { return t; },
      get playing() { return playing; },
    };

    function render() {
      const p = (t / D) * 100;
      fill.style.width = p + "%"; knob.style.left = p + "%";
      clock.textContent = o.clock ? o.clock(t) : fmt(t); time.textContent = `${fmt(t)} / ${fmt(D)}`;
      if (!video) {
        const i = Math.min(o.frames.length - 1, Math.floor((t / D) * o.frames.length));
        if (i !== frameIdx) { frameIdx = i; fr.src = bg.src = o.frames[i]; }
      }
      ticks.forEach((k) => { k.el.classList.toggle("past", k.t <= t); k.el.classList.toggle("hot", t >= k.t && t - k.t < 1.5); });
      o.onTime && o.onTime(t, api);
    }
    function loop(now) {
      if (!playing) return;
      t = video ? video.currentTime : t + ((now - last) / 1000) * speed;
      last = now;
      if (t >= D) {
        if (o.loop) { t = 0; if (video) video.currentTime = 0; }
        else { t = D; render(); api.pause(); return; }
      }
      render();
      raf = requestAnimationFrame(loop);
    }

    btn.onclick = () => (playing ? api.pause() : api.play());
    spd.onclick = () => {
      speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
      spd.textContent = speed + "×";
      if (video) video.playbackRate = speed;
    };
    let drag = false;
    const at = (e) => { const r = track.getBoundingClientRect(); api.seek(((e.clientX - r.left) / r.width) * D); };
    track.addEventListener("pointerdown", (e) => { drag = true; track.setPointerCapture(e.pointerId); at(e); });
    track.addEventListener("pointermove", (e) => drag && at(e));
    track.addEventListener("pointerup", () => (drag = false));
    render();
    return api;
  }

  // Play while the section is on screen; pause (and later resume) when it scrolls away.
  function autoplay(section, get) {
    let seen = false, resume = false;
    new IntersectionObserver(([en]) => {
      const p = get();
      if (!p) return;
      if (en.isIntersecting) { if (!seen || resume) p.play(); seen = true; resume = false; }
      else if (p.playing) { p.pause(); resume = true; }
    }, { threshold: 0.3 }).observe(section);
  }

  /* ------------------------------------------------------------ V(t) chart */
  let chartN = 0;
  function vchart(el, gt, g) {
    const W = 460, H = 130, PX = 4, PY = 18, T = gt.duration, evs = gt.events, id = "vc" + chartN++;
    let lo = 0, hi = 1, mid = 0.5;
    if (gt.kind !== "prob") {
      const m = Math.max(gt.kind === "share" ? 0.2 : 1, ...evs.map((e) => Math.abs(e.v)), ...(gt.curve || []).map((c) => Math.abs(c[1])), Math.abs(gt.v0 || 0)) * 1.15;
      lo = -m; hi = m; mid = 0;
    }
    const v0 = gt.v0 ?? mid;
    const x = (t) => PX + (t / T) * (W - 2 * PX);
    const y = (v) => PY + ((hi - v) / (hi - lo)) * (H - 2 * PY);
    let d = `M${x(0)},${y(v0)}`;
    if (gt.curve) gt.curve.forEach(([t, v]) => (d += `L${x(t).toFixed(1)},${y(v).toFixed(1)}`));
    else evs.forEach((e) => (d += `H${x(e.t).toFixed(1)}V${y(e.v).toFixed(1)}`));
    d += `H${x(T)}`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}">
      <defs><clipPath id="${id}"><rect x="0" y="0" height="${H}" width="0"/></clipPath></defs>
      <line x1="${PX}" x2="${W - PX}" y1="${y(mid)}" y2="${y(mid)}" stroke="#3a4252" stroke-dasharray="3 4"/>
      ${gt.kind === "share" ? `<rect x="${PX}" width="${W - 2 * PX}" y="${y(0.1)}" height="${y(-0.1) - y(0.1)}" fill="rgba(148,163,184,.07)"/>` : ""}
      <text x="${PX}" y="11" class="ax">▲ ${esc(g.up)}</text><text x="${PX}" y="${H - 3}" class="ax">▼ ${esc(g.down)}</text>
      <path d="${d}" fill="none" stroke="#2a303c" stroke-width="2"/>
      <g clip-path="url(#${id})"><path d="${d}V${y(mid)}H${x(0)}Z" fill="rgba(20,184,166,.13)"/>
        <path d="${d}" fill="none" stroke="#14b8a6" stroke-width="2"/></g>
      <line class="phl" y1="${PY - 8}" y2="${H - PY + 8}" stroke="#fff" stroke-width="1.5"/>
      <circle r="4.5" fill="#14b8a6" stroke="#151922" stroke-width="2"/></svg>`;
    const rect = $("rect", el), phl = $(".phl", el), dot = $("circle", el);
    return (t) => {
      const X = x(t);
      let v = v0;
      if (gt.curve) {
        const c = gt.curve, i = c.findIndex((p) => p[0] > t);
        if (i < 0) v = c[c.length - 1]?.[1] ?? v0;
        else if (i > 0) v = c[i - 1][1] + ((t - c[i - 1][0]) / (c[i][0] - c[i - 1][0])) * (c[i][1] - c[i - 1][1]);
      } else for (const e of evs) { if (e.t <= t) v = e.v; else break; }
      rect.setAttribute("width", X);
      phl.setAttribute("x1", X); phl.setAttribute("x2", X);
      dot.setAttribute("cx", X); dot.setAttribute("cy", y(v));
    };
  }

  const clipOpts = (gt) => (gt.speed ? { clock: (t) => fmt(gt.start + t * gt.speed), tag: `${gt.speed}× speed` } : {});

  /* ------------------------------------------------------------ Demo I: nine arenas */
  const envTabs = $("#env-tabs");
  let envPlayer = null;
  VA.games.forEach((g) => {
    const b = h(`<button class="gtab" data-g="${g.id}"><img src="${g.frames[2]}" alt="">${g.short || g.name}<small>${g.genre}</small></button>`);
    b.onclick = () => loadEnv(g.id);
    envTabs.appendChild(b);
  });

  function loadEnv(id) {
    const g = VA.game(id), gt = VA.gt(id), evs = gt.events;
    const wasPlaying = envPlayer?.playing;
    envPlayer?.pause();
    $$(".gtab", envTabs).forEach((b) => b.classList.toggle("on", b.dataset.g === id));

    $("#env-meta").innerHTML = `
      <div><span>Case</span><b>${esc(g.caseId)}</b></div>
      <div><span>Clip shown</span><b>${esc(g.clip || "—")}</b></div>
      <div><span>Source</span><b>${esc(g.record)}</b></div>
      <div><span>Labels from</span><b>${esc(g.labeler)}</b></div>
      <div><span>Avg. length · GT tuples</span><b>${g.len} min · ${g.ny}</b></div>
      <div style="grid-column:1/-1"><span>Tasks in this game</span><b><span style="color:#7fb3f2">T1</span> ${esc(g.t1)} &nbsp;·&nbsp;
        <span style="color:#c7a4f3">T2</span> ${esc(g.t2)} &nbsp;·&nbsp; <span style="color:#5fd8c8">T3</span> ${esc(g.t3)}</b></div>
      <pre>// released ground-truth record #1 of this case\n${esc(g.sample)}</pre>`;

    const now = $("#env-now");
    now.innerHTML = [["s1", "T1 · perceive"], ["s2", "T2 · interpret"], ["s3", "T3 · track"]]
      .map(([c, k]) => `<div class="slot ${c}"><span class="k">${k}</span><span class="v"></span></div>`).join("");
    const slots = $$(".slot", now);
    $("#env-chart-title").textContent = `State V(t) · ${g.vLabel}`;
    const chart = vchart($("#env-chart"), gt, g);

    const log = $("#env-log");
    log.innerHTML = "";
    const lis = evs.map((e) => {
      const li = h(`<li><span class="ts">${ft(e)}</span><span class="tt"><span>${esc(e.text)}</span>
        <span class="c2">${esc(e.t2)}</span><span class="c3">${esc(e.t3)}</span></span></li>`);
      li.onclick = () => envPlayer.seek(e.t + 0.05);
      log.appendChild(li);
      return li;
    });

    let cur = -2;
    envPlayer = Player($("#env-player"), {
      frames: g.frames, video: g.video, duration: gt.duration, loop: true, ...clipOpts(gt),
      ticks: evs.map((e) => ({ t: e.t, tip: () => gtTip(e) })),
      onTime(t, p) {
        let k = -1;
        for (let i = 0; i < evs.length; i++) { if (evs[i].t <= t) k = i; else break; }
        const e = evs[k];
        if (k !== cur) {
          cur = k;
          slots[0].lastChild.textContent = e ? `${ft(e)}  ${e.text}` : "waiting for the first event…";
          slots[1].lastChild.textContent = e ? e.t2 : "—";
          slots[2].lastChild.textContent = e ? e.t3 : "—";
          if (e) slots.forEach((s) => { s.classList.remove("flash"); void s.offsetWidth; s.classList.add("flash"); });
          lis.forEach((li, i) => { li.classList.toggle("future", i > k); li.classList.toggle("cur", i === k); });
          // centre the current event inside the list (offsetTop is relative to the card, not the list)
          log.scrollTop = lis[k] ? log.scrollTop + lis[k].getBoundingClientRect().top - log.getBoundingClientRect().top
            - (log.clientHeight - lis[k].offsetHeight) / 2 : 0;
        }
        p.toast(e && t - e.t < 2.5 ? `<b>T1</b> ${esc(e.text)} &nbsp;<span style="color:#c7a4f3">T2</span> ${esc(e.t2)} &nbsp;<span style="color:#5fd8c8">T3</span> ${esc(e.t3)}` : null);
        chart(t);
      },
    });
    if (wasPlaying) envPlayer.play();
  }

  /* ------------------------------------------------------------ Demo II: model arena */
  const qa = new URLSearchParams(location.search).get("g");
  const A = { caseId: VA.arena.cases.some((c) => c.id === qa) ? qa : VA.arena.cases[0].id, proto: "agentic", player: null, sync: null };
  const casesEl = $("#arena-cases");
  // the arena case may differ from the Demo I case: its own GT, clip and frames override the game's
  const arenaCase = (id) => {
    const r = VA.arena.real[id] || {};
    return { g: { ...VA.game(id), ...(r.video ? { video: r.video, frames: r.frames } : {}) }, gt: r.gt || VA.gt(id), r };
  };
  VA.arena.cases.forEach((c) => {
    const g = VA.game(c.id), tag = VA.arena.real[c.id]?.tag ?? c.tag;
    const b = h(`<button class="case" data-c="${c.id}"><img src="${g.frames[2]}" alt="">${g.short || g.name}<small>${esc(tag)}</small></button>`);
    b.onclick = () => { A.caseId = c.id; buildArena(true); };
    casesEl.appendChild(b);
  });
  $$("#arena-proto button").forEach((b) => (b.onclick = () => {
    A.proto = b.dataset.p;
    $$("#arena-proto button").forEach((x) => x.classList.toggle("on", x === b));
    buildArena(false);
  }));

  function predTip(m, p, evs) {
    const e = p.gi != null ? evs[p.gi] : null;
    const head = {
      full: '<span class="ok">✓ exact tuple</span>',
      partial: '<span class="pa">◐ right event, wrong update/state</span>',
      fp: '<span class="no">✗ no GT event within ±3 s</span>',
    }[p.verdict];
    const row = (k, a, b, ok) => `<tr><td>${k}</td><td>${esc(a)}</td><td>${esc(b)}</td><td class="${ok ? "ok" : "no"}">${ok ? "✓" : "✗"}</td></tr>`;
    return `<div class="th">${m.name} — ${head}</div><table>
      <tr><td></td><td>prediction</td><td>ground truth</td><td></td></tr>
      ${row("time", ft(p), e ? ft(e) : "—", !!e)}
      ${row("T1", p.text, e ? e.text : "—", !!e)}
      ${row("T2", p.t2, e ? e.t2 : "—", e && p.t2 === e.t2)}
      ${row("T3", p.t3, e ? e.t3 : "—", e && p.t3 === e.t3)}</table>`;
  }
  const missTip = (m, e) => `<div class="th">${m.name} — <span class="no">○ missed this event</span></div><table>
    <tr><td>time</td><td>${ft(e)}</td></tr><tr><td>T1</td><td>${esc(e.text)}</td></tr>
    <tr><td>T2</td><td>${esc(e.t2)}</td></tr><tr><td>T3</td><td>${esc(e.t3)}</td></tr></table>`;

  function buildArena(newCase) {
    const { g, gt } = arenaCase(A.caseId), evs = gt.events, T = gt.duration, tol = gt.tol ?? VA.arena.tolerance;
    $$(".case", casesEl).forEach((b) => b.classList.toggle("on", b.dataset.c === A.caseId));
    const lanes = Array.isArray(VA.arena.lanes) ? VA.arena.lanes : VA.arena.lanes[A.proto];
    const models = lanes.map((id) => ({ ...VA.models.find((x) => x.id === id), ...VA.preds(A.caseId, A.proto, id) }));
    const pct = (t) => `${(Math.max(0, Math.min(T, t)) / T) * 100}%`;

    // lanes
    const lanesEl = $("#arena-lanes");
    lanesEl.innerHTML = "";
    const gtLane = h(`<div class="lane gt"><div class="ln">Ground truth<small>${evs.length} events · ±${VA.arena.tolerance} s</small></div><div class="ltrack"></div><div class="lf"></div></div>`);
    lanesEl.appendChild(gtLane);
    const gtTrack = $(".ltrack", gtLane);
    const gticks = evs.map((e) => {
      gtTrack.appendChild(h(`<div class="gwin" style="left:${pct(e.t - tol)};width:${((2 * tol) / T) * 100}%"></div>`));
      const d = h(`<div class="gtick" style="left:${pct(e.t)}"></div>`);
      bindTip(d, () => gtTip(e));
      gtTrack.appendChild(d);
      return d;
    });
    models.forEach((m) => {
      m.lane = h(`<div class="lane"><div class="ln">${m.name}<small>${A.proto === "agentic" ? m.harness : "native · 1 FPS"}${!m.norun && !m.preds.length ? " · empty answer" : ""}${m.note ? ` · ${m.note}` : ""}</small></div>
        <div class="ltrack">${m.norun ? '<span class="norun">no run on this case</span>' : ""}</div><div class="lf">${m.norun ? "—" : "0.0"}</div></div>`);
      lanesEl.appendChild(m.lane);
      m.lf = $(".lf", m.lane);
      const tr = $(".ltrack", m.lane);
      // A match can only be judged once its GT event has happened.
      m.marks = m.preds.map((p) => {
        const el = h(`<i class="mk ${p.verdict}" style="left:${pct(p.t)}">${SYM[p.verdict]}</i>`);
        bindTip(el, () => predTip(m, p, evs));
        tr.appendChild(el);
        return { at: p.gi != null ? Math.max(p.t, evs[p.gi].t) : p.t, el, p };
      });
      m.missMarks = m.misses.map((i) => {
        const e = evs[i], el = h(`<i class="mk miss" style="left:${pct(e.t)}">○</i>`);
        bindTip(el, () => missTip(m, e));
        tr.appendChild(el);
        return { at: e.t + tol, el };
      });
      m.f1 = 0;
    });
    const phs = $$(".ltrack", lanesEl).map((tr) => tr.appendChild(h('<div class="ph"></div>')));

    // leaderboard
    const race = $("#arena-race");
    race.innerHTML = "";
    race.style.height = models.length * 32 + "px";
    models.forEach((m, i) => {
      m.row = h(`<div class="rrow" style="top:${i * 32}px"><span class="rk"></span><span class="nm">${m.name}</span><span class="bar"><i style="width:0"></i></span><span class="sc">0.0</span></div>`);
      race.appendChild(m.row);
    });

    const ticker = $("#arena-ticker");
    ticker.innerHTML = "";
    let lastT = -1;
    function announce(m, p) {
      const cls = { full: "ok", partial: "pa", fp: "no" }[p.verdict];
      ticker.prepend(h(`<li><span class="ts">${ft(p)}</span><span class="${cls}">${SYM[p.verdict]}</span><span>${m.name} · ${esc(p.text)}</span></li>`));
      while (ticker.children.length > 7) ticker.lastChild.remove();
      if (p.verdict !== "partial") {
        const c = p.verdict === "full" ? "flash-good" : "flash-bad";
        m.lane.classList.remove("flash-good", "flash-bad"); void m.lane.offsetWidth; m.lane.classList.add(c);
      }
    }

    // Running strict F1 = 2·TP / (#predictions so far + #GT events so far).
    A.sync = (t, p) => {
      const back = t < lastT;
      if (back) ticker.innerHTML = "";
      let G = 0;
      evs.forEach((e, i) => { const on = e.t <= t; gticks[i].classList.toggle("past", on); if (on) G++; });
      models.forEach((m) => {
        let P = 0, TP = 0;
        m.marks.forEach((k) => {
          const on = k.at <= t;
          k.el.classList.toggle("shown", on);
          if (on) { P++; if (k.p.verdict === "full") TP++; }
          if (!back && t - lastT < 2 && k.at > lastT && on) announce(m, k.p);
        });
        m.missMarks.forEach((k) => k.el.classList.toggle("shown", k.at <= t));
        const f1 = P + G ? (200 * TP) / (P + G) : 0;
        if (f1 > m.f1 + 1e-9 && !back) { m.row.classList.remove("bump"); void m.row.offsetWidth; m.row.classList.add("bump"); }
        m.f1 = f1;
        if (!m.norun) m.lf.textContent = f1.toFixed(1);
      });
      [...models].sort((a, b) => b.f1 - a.f1).forEach((m, r) => {
        m.row.style.top = r * 32 + "px";
        $(".rk", m.row).innerHTML = r < 3 && m.f1 > 0 ? `<img src="assets/img/${r + 1}_medal.png" alt="${r + 1}">` : r + 1;
        $(".bar i", m.row).style.width = m.f1 + "%";
        $(".sc", m.row).textContent = m.f1.toFixed(1);
      });
      phs.forEach((ph) => (ph.style.left = pct(t)));
      let k = -1;
      for (let i = 0; i < evs.length; i++) { if (evs[i].t <= t) k = i; else break; }
      p.toast(k >= 0 && t - evs[k].t < 2.5 ? `<b>GT</b> ${esc(evs[k].text)}` : null);
      lastT = t;
    };

    if (newCase || !A.player) {
      const wasPlaying = A.player?.playing;
      A.player?.pause();
      A.player = Player($("#arena-player"), {
        frames: g.frames, video: g.video, duration: T, loop: false, ...clipOpts(gt),
        ticks: evs.map((e) => ({ t: e.t, tip: () => gtTip(e) })),
        onTime: (t, p) => A.sync && A.sync(t, p),
      });
      if (wasPlaying) A.player.play();
    } else {
      A.sync(A.player.t, A.player);
    }
  }

  /* ------------------------------------------------------------ results table */
  function buildTable(proto) {
    const order = VA.gameOrder;
    const groups = [["Board", 3], ["Card", 1], ["FPS", 1], ["MOBA", 1], ["RTS", 1], ["Sports", 2]];
    const rows = VA.models.map((m) => ({ m, r: VA.f1[proto][m.id] })).sort((a, b) => b.r[9] - a.r[9]);
    const best = [...Array(10).keys()].map((j) => Math.max(...rows.map((x) => x.r[j])));
    const shade = (v) => `background:rgba(57,135,229,${((v / 100) * 0.55).toFixed(3)})`;
    const cells = (r, isModel) => r.map((v, j) =>
      `<td class="${j === 9 ? "ov" : ""} ${isModel && v === best[j] && v > 0 ? "best" : ""}" style="${isModel ? shade(v) : ""}">${v.toFixed(1)}</td>`).join("");

    let html = `<thead><tr><th class="grp"></th>${groups.map(([n, c]) => `<th class="grp" colspan="${c}">${n}</th>`).join("")}<th class="grp"></th></tr>
      <tr><th>${proto === "agentic" ? "Model · harness" : "Model"}</th>${order.map((id) => `<th>${VA.game(id).short || VA.game(id).name}</th>`).join("")}<th>Overall</th></tr></thead><tbody>`;
    if (proto === "visual") {
      html += `<tr class="sep"><td colspan="11">Baselines</td></tr>`;
      VA.f1.baselines.forEach((b) => (html += `<tr class="base"><td>${b.name}</td>${cells(b.row, false)}</tr>`));
      html += `<tr class="sep"><td colspan="11">Models · 1 FPS, ≤ 256 frames</td></tr>`;
    } else {
      html += `<tr class="sep"><td colspan="11">Agents · ≤ 200 turns, 2 h</td></tr>`;
    }
    rows.forEach(({ m, r }, i) => {
      const medal = i < 3 ? `<img class="medal" src="assets/img/${i + 1}_medal.png" alt="">` : "";
      html += `<tr><td class="mname">${m.name}${proto === "agentic" ? `<small>${m.harness}</small>` : ""}</td>${cells(r, true).replace(/<\/td>$/, medal + "</td>")}</tr>`;
    });
    $("#res-table").innerHTML = html + "</tbody>";
  }
  $$("#res-seg button").forEach((b) => (b.onclick = () => {
    $$("#res-seg button").forEach((x) => x.classList.toggle("on", x === b));
    buildTable(b.dataset.p);
  }));

  /* ------------------------------------------------------------ bibtex */
  $("#bibtex").textContent = VA.bibtex;
  $("#bib-copy").onclick = async (e) => {
    try { await navigator.clipboard.writeText(VA.bibtex); e.target.textContent = "Copied!"; }
    catch { e.target.textContent = "Select & copy"; }
    setTimeout(() => (e.target.textContent = "Copy"), 1500);
  };

  /* ------------------------------------------------------------ init */
  const qs = new URLSearchParams(location.search), qg = qs.get("g");
  loadEnv(VA.games.some((g) => g.id === qg) ? qg : "chess");
  buildArena(true);
  buildTable("agentic");
  autoplay($("#arenas"), () => envPlayer);
  autoplay($("#model-arena"), () => A.player);
  // ?t=45 seeks both demos, ?g=go opens that game in both (handy for screenshots)
  const qt = +qs.get("t");
  if (qt) { envPlayer.seek(qt); A.player.seek(Math.min(qt / 2, 1)); A.player.seek(qt); }

  // Dark nav while it overlaps the hero; the promo only plays while it is on screen.
  const nav = $(".nav"), hero = $("#top"), promo = $(".promo-video");
  const navTone = () => nav.classList.toggle("on-dark", hero.getBoundingClientRect().bottom > nav.offsetHeight);
  addEventListener("scroll", navTone, { passive: true });
  navTone();
  new IntersectionObserver(([en]) => (en.isIntersecting ? promo.play().catch(() => {}) : promo.pause()), { threshold: 0.25 }).observe(promo);
  // Browsers only autoplay muted video: the pill (or the native controls) turns the soundtrack on.
  const sound = $(".promo .sound");
  const soundTone = () => {
    sound.classList.toggle("on", !promo.muted);
    sound.lastChild.textContent = promo.muted ? "Sound on" : "Mute";
    sound.setAttribute("aria-label", promo.muted ? "Turn sound on" : "Mute");
  };
  sound.addEventListener("click", () => {
    promo.muted = !promo.muted;
    if (!promo.muted) { promo.currentTime = 0; promo.play().catch(() => {}); }
  });
  promo.addEventListener("volumechange", soundTone);
})();

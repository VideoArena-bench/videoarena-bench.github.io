/* Video-Arena project page — all content & data.
 *
 * Static content lives here: games metadata, F1 tables (from the paper).
 * The real clips, ground-truth timelines and model answers are generated into data_real.js by
 * tools/build_real.py, which fills VA.realGT / VA.realPreds and overrides VA.arena.lanes.
 * VA.gt(id) / VA.preds(...) fall back to deterministic synthetic data only when that file is absent.
 */
(function () {
  const VA = (window.VA = {});

  VA.models = [
    { id: "opus",     name: "Claude-Opus-5.0",      open: false, harness: "Claude Code" },
    { id: "sol",      name: "GPT-5.6-Sol",          open: false, harness: "Codex" },
    { id: "flash",    name: "Gemini-3.7-Flash",     open: false, harness: "Antigravity" },
    { id: "pro",      name: "Gemini-3.1-Pro",       open: false, harness: "Antigravity" },
    { id: "luna",     name: "GPT-5.6-Luna",         open: false, harness: "Codex" },
    { id: "kimi",     name: "Kimi K3",              open: true,  harness: "Claude Code" },
    { id: "qwen27",   name: "Qwen3.8-27B",          open: true,  harness: "Claude Code" },
    { id: "minimax",  name: "MiniMax M3",           open: true,  harness: "Claude Code" },
    { id: "qwen27nt", name: "Qwen3.8-27B-no-think", open: true,  harness: "Claude Code" },
    { id: "qwen122",  name: "Qwen3.5-122B-A10B",    open: true,  harness: "Claude Code" },
  ];

  // Column order of every F1 row below (last = Overall).
  VA.gameOrder = ["go", "chess", "gomoku", "doudizhu", "cs2", "dota2", "sc2", "gfootball", "badminton"];

  // Table 3 (visual protocol) and Table 4 (agentic protocol) of the paper.
  VA.f1 = {
    visual: {
      sol:      [7.1, 47.3, 19.6, 17.9, 17.8, 2.2, 3.4, 0.8, 2.9, 13.2],
      opus:     [6.0, 19.7, 10.6, 16.2, 10.3, 0.0, 0.6, 0.8, 1.0, 7.2],
      kimi:     [1.4, 9.9, 6.8, 21.4, 1.8, 0.4, 0.0, 0.8, 0.7, 4.8],
      luna:     [2.8, 13.0, 11.1, 13.2, 0.5, 0.0, 1.4, 0.0, 0.3, 4.7],
      flash:    [1.7, 11.8, 6.1, 16.5, 5.0, 0.2, 0.6, 0.0, 0.3, 4.7],
      pro:      [2.2, 11.5, 8.7, 14.2, 2.1, 0.1, 0.9, 0.2, 0.3, 4.5],
      qwen27:   [1.1, 4.0, 3.2, 12.3, 0.6, 0.3, 0.0, 0.4, 0.0, 2.4],
      minimax:  [0.9, 4.3, 2.1, 10.2, 1.1, 0.2, 0.1, 0.2, 0.1, 2.1],
      qwen27nt: [0.3, 1.3, 1.0, 5.5, 0.0, 0.1, 0.1, 0.0, 0.2, 0.9],
      qwen122:  [0.1, 0.6, 0.8, 5.3, 0.1, 0.8, 0.2, 0.3, 0.0, 0.9],
    },
    agentic: {
      opus:     [49.0, 63.2, 32.7, 29.1, 84.5, 30.0, 14.6, 92.9, 63.2, 51.0],
      sol:      [34.9, 71.5, 29.1, 21.1, 65.9, 15.9, 7.4, 42.4, 24.5, 34.7],
      flash:    [40.6, 72.2, 30.5, 31.5, 28.7, 5.6, 4.3, 24.7, 14.6, 28.1],
      kimi:     [27.7, 54.6, 18.2, 19.6, 27.3, 9.6, 4.5, 7.9, 3.7, 19.2],
      pro:      [30.9, 66.7, 34.5, 19.1, 2.4, 5.9, 0.3, 1.3, 0.4, 17.9],
      qwen27:   [30.4, 64.3, 20.8, 18.7, 7.4, 2.6, 1.2, 14.5, 1.3, 17.9],
      minimax:  [17.2, 47.1, 17.5, 15.2, 7.3, 0.3, 0.8, 1.7, 0.7, 12.0],
      luna:     [14.2, 57.4, 15.1, 6.8, 4.0, 1.8, 3.1, 0.4, 1.2, 11.6],
      qwen27nt: [18.5, 26.3, 15.2, 16.3, 0.1, 4.9, 0.5, 0.7, 0.2, 9.2],
      qwen122:  [18.1, 25.1, 10.5, 10.9, 0.4, 0.7, 0.0, 0.0, 1.6, 7.5],
    },
    baselines: [
      { name: "Random Tuple",          row: [0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0] },
      { name: "Set-time Random Tuple", row: [0.0, 0.3, 0.1, 0.0, 0.0, 0.3, 1.1, 0.0, 0.0, 0.2] },
      { name: "Temporal Ceiling @256", row: [87.8, 83.5, 100.0, 100.0, 79.5, 69.5, 99.8, 93.6, 98.2, 90.2], visualOnly: true },
    ],
  };

  // Table 2 + Appendix C. `sample` is the verbatim first GT record of the illustrated case.
  VA.games = [
    { id: "go", name: "Go", genre: "Board", len: "30.3 ± 17.0", ny: "275.8 ± 66.7",
      record: "OGS board record (SGF), re-rendered", labeler: "Evaluator · KataGo", caseId: "OGS 27400000",
      t1: "move, capture", t2: "win-rate swing (KataGo)", t3: "win-rate leader after",
      vLabel: "Black win probability", up: "Black ahead", down: "White ahead",
      sample: '{"type": "move", "idx": 1, "color": "B", "coord": "Q4",\n "game_clock_s": 2.0, "wr_swing": "equal", "leader_after": "equal"}' },
    { id: "chess", name: "Chess", genre: "Board", len: "31.3 ± 21.5", ny: "88.1 ± 23.1",
      record: "Lichess board record (PGN), re-rendered", labeler: "Evaluator · Stockfish", caseId: "Lichess cZWtZEBE",
      t1: "move, capture", t2: "win-rate swing (Stockfish)", t3: "win-rate leader after",
      vLabel: "White expected score", up: "White ahead", down: "Black ahead",
      sample: '{"type": "move", "idx": 1, "color": "W", "coord": "E4",\n "game_clock_s": 2.0, "wr_swing": "equal", "leader_after": "equal"}' },
    { id: "gomoku", name: "Gomoku", genre: "Board", len: "3.2 ± 1.5", ny: "40.4 ± 8.8",
      record: "Tournament record (PSQ), re-rendered", labeler: "Evaluator · Rapfi", caseId: "PSQ 0_11_6_2",
      t1: "move", t2: "win-rate swing (Rapfi)", t3: "win-rate leader after",
      vLabel: "Black win probability", up: "Black ahead", down: "White ahead",
      sample: '{"type": "move", "idx": 1, "color": "B", "coord": "N7",\n "game_clock_s": 2.0, "wr_swing": "W", "leader_after": "W"}' },
    { id: "doudizhu", name: "Doudizhu", genre: "Card", len: "4.4 ± 0.9", ny: "21.5 ± 4.3",
      record: "DouZero self-play deal, rendered tabletop", labeler: "Evaluator · PIMC", caseId: "dzh-01",
      t1: "move, type, card count", t2: "win-rate swing (PIMC)", t3: "win-rate leader after",
      vLabel: "Landlord win probability", up: "Landlord ahead", down: "Farmers ahead",
      sample: '{"idx": 1, "game_clock_s": 15.0, "player": "landlord", "move_type": "pair",\n "num_cards": 2, "impact": "neutral", "leader_after": "farmers"}' },
    { id: "cs2", name: "Counter-Strike 2", short: "CS2", genre: "FPS", len: "38.9 ± 8.7", ny: "186.0 ± 34.3",
      record: "Pro demo (.dem), radar render", labeler: "Parser · demo, 64 Hz", caseId: "9z-vs-legacy-m2-nuke",
      t1: "kill, elimination, plant, …", t2: "round winner", t3: "score pair after the round",
      vLabel: "Round-score difference (A − B)", up: "Team A ahead", down: "Team B ahead",
      sample: '{"round_no": 1, "type": "kill", "video_ts": 49.812, "side": "CT",\n "number": 6, "round_winner": "CT", "score_after": {"A": 0, "B": 1}}' },
    { id: "dota2", name: "DOTA 2", genre: "MOBA", len: "46.9 ± 14.8", ny: "29.9 ± 11.0",
      record: "Valve replay (.dem), minimap render", labeler: "Parser · replay + API", caseId: "dota-01",
      t1: "kill, tower, barracks, Roshan, …", t2: "minute-level net-worth change", t3: "net-worth leader at interval end",
      vLabel: "Radiant net-worth advantage (gold)", up: "Radiant ahead", down: "Dire ahead",
      sample: '{"type": "firstblood", "time_s": 9, "video_ts": 17.0,\n "killer_side": "dire", "minute_gain": "even", "leader_after": "even"}' },
    { id: "sc2", name: "StarCraft II", short: "SC2", genre: "RTS", len: "19.1 ± 2.9", ny: "67.9 ± 22.3",
      record: ".SC2Replay, full-map observer render", labeler: "Parser · tracker events", caseId: "g00",
      t1: "battle, building destroyed", t2: "net resource-value swing", t3: "resource-value leader after",
      vLabel: "Resource-value difference (A − B)", up: "Player A ahead", down: "Player B ahead",
      sample: '{"game_clock_s": 235, "type": "battle", "entity": "r0c0",\n "fight_result": "B", "leader_after": "equal"}' },
    { id: "gfootball", name: "GFootball", genre: "Sports", len: "25.0 ± 6.1", ny: "20.3 ± 9.0",
      record: "Self-play episode trace, rendered pitch", labeler: "Parser · engine trace", caseId: "gf-01",
      t1: "goal (scoring side, scorer)", t2: "goal-differential shift", t3: "score pair after the goal",
      vLabel: "Goal difference (L − R)", up: "Left ahead", down: "Right ahead",
      sample: '{"type": "goal", "idx": 1, "game_clock_s": 78.458, "scoring_side": "L",\n "scorer_name": "Blackwell", "impact": "taken", "score_after": [1, 0],\n "own_goal": false}' },
    { id: "badminton", name: "Badminton", genre: "Sports", len: "19.9 ± 2.5", ny: "35.1 ± 2.6",
      record: "ShuttleSet stroke annotation, rendered court", labeler: "Parser · rollout", caseId: "badminton-01",
      t1: "point (scoring side, landing zone)", t2: "score-differential shift", t3: "score pair after the point",
      vLabel: "Score difference (near − far)", up: "Near ahead", down: "Far ahead",
      sample: '{"type": "point", "idx": 1, "game_clock_s": 5.84, "scoring_side": "near",\n "zone": "out", "impact": "taken", "score_after": [1, 0]}' },
  ];
  VA.game = (id) => VA.games.find((g) => g.id === id);
  VA.games.forEach((g) => {
    g.frames = [0, 1, 2, 3, 4, 5].map((i) => `assets/frames/${g.id}_${i}.jpg`);
    g.video = `videos/env/${g.id}.mp4`;
  });

  VA.arena = {
    // one case per arena; data_real.js fills VA.arena.real[id] = {case, tag, clip, gt?, video?, frames?}
    cases: ["go", "chess", "gomoku", "doudizhu", "cs2", "dota2", "sc2", "gfootball", "badminton"].map((id) => ({ id, tag: "" })),
    real: {},
    lanes: ["opus", "sol", "flash", "pro", "kimi", "qwen27"],
    tolerance: 3, // seconds, as in the strict F1 matcher
  };

  // Drop real data here (same shape the generators return) to replace the placeholders.
  VA.realGT = {};
  VA.realPreds = {};

  /* ------------------------------------------------------------------ */
  /* Placeholder generators (deterministic)                              */
  /* ------------------------------------------------------------------ */
  function rng(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const CLIP = 90;
  function times(r, n, pad = 4) {
    const gap = (CLIP - 2 * pad) / n;
    return Array.from({ length: n }, (_, i) => +(pad + gap * i + r() * gap * 0.6).toFixed(1));
  }
  function shuffle(a, r) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // T2 label for a score change, seen from the scoring side.
  const impact = (pre) => (pre === 0 ? "taken" : pre > 0 ? "extended" : pre === -1 ? "levelled" : "narrowed");

  const board = (cols, size, first, sides, capture) => ({
    kind: "prob",
    t2Vocab: [sides[0], sides[1], "equal"], t3Vocab: [sides[0], sides[1], "equal"],
    fake: (r) => `move · ${pick(r, sides)} · ${pick(r, cols.split(""))}${1 + Math.floor(r() * size)}`,
    make(r) {
      const other = first === sides[0] ? sides[1] : sides[0];
      let v = 0.5;
      return times(r, 16).map((t, i) => {
        const d = r() < 0.5 ? (r() - 0.5) * 0.05 : (r() < 0.55 ? 1 : -1) * (0.05 + r() * 0.14);
        v = clamp(v + d, 0.04, 0.96);
        const type = capture && r() < 0.2 ? "capture" : "move";
        return { t, v, text: `${type} · ${i % 2 ? other : first} · ${pick(r, cols.split(""))}${1 + Math.floor(r() * size)}`,
          t2: d > 0.04 ? sides[0] : d < -0.04 ? sides[1] : "equal",
          t3: v > 0.55 ? sides[0] : v < 0.45 ? sides[1] : "equal" };
      });
    },
  });

  const scoreGame = (n, sides, t1) => ({
    kind: "score",
    t2Vocab: ["taken", "extended", "levelled", "narrowed"], t3Vocab: null,
    fake: (r) => t1(r, pick(r, sides)),
    make(r) {
      let a = 0, b = 0;
      return times(r, n).map((t) => {
        const s = r() < 0.52 ? 0 : 1;
        const pre = s === 0 ? a - b : b - a;
        s === 0 ? a++ : b++;
        return { t, v: a - b, text: t1(r, sides[s]), t2: impact(pre), t3: `${a} : ${b}` };
      });
    },
  });

  const GEN = {
    go: board("ABCDEFGHJKLMNOPQRST", 19, "Black", ["Black", "White"], true),
    chess: board("abcdefgh", 8, "White", ["White", "Black"], true),
    gomoku: board("ABCDEFGHJKLMNOP", 15, "Black", ["Black", "White"], false),
    doudizhu: {
      kind: "prob",
      t2Vocab: ["landlord", "farmers", "neutral"], t3Vocab: ["landlord", "farmers", "equal"],
      fake: (r) => `${pick(r, ["landlord", "farmer_L", "farmer_R"])} · ${pick(r, ["single", "pair", "trio"])}`,
      make(r) {
        const types = [["single", 1], ["pair", 2], ["trio", 3], ["trio+1", 4], ["straight", 5], ["bomb", 4]];
        const players = ["landlord", "farmer_R", "farmer_L"];
        let p = 0, v = 0.5;
        return times(r, 12).map((t) => {
          p = (p + (r() < 0.3 ? 2 : 1)) % 3;
          const [mt, nc] = pick(r, types);
          const d = (r() - 0.5) * 0.3;
          v = clamp(v + d, 0.05, 0.95);
          return { t, v, text: `${players[p]} · ${mt} · ${mt === "straight" ? nc + Math.floor(r() * 3) : nc} cards`,
            t2: d > 0.05 ? "landlord" : d < -0.05 ? "farmers" : "neutral",
            t3: v > 0.55 ? "landlord" : v < 0.45 ? "farmers" : "equal" };
        });
      },
    },
    cs2: {
      kind: "score", v0: 2,
      t2Vocab: ["CT", "T"], t3Vocab: null,
      fake: (r) => `kill · ${pick(r, ["CT", "T"])} #${1 + Math.floor(r() * 10)}`,
      make(r) {
        let a = 5, b = 3;
        const ev = [], ts = times(r, 15);
        for (let k = 0; k < 3; k++) {
          const win = r() < 0.5 ? "CT" : "T";
          win === "CT" ? a++ : b++;
          ts.slice(k * 5, k * 5 + 5).forEach((t, i) => {
            const text = i === 4
              ? win === "CT" ? pick(r, ["elimination · CT", "bomb_defused · CT"]) : pick(r, ["elimination · T", "bomb_exploded · T"])
              : i === 2 && r() < 0.5 ? "bomb_planted · T" : `kill · ${pick(r, ["CT", "T"])} #${1 + Math.floor(r() * 10)}`;
            ev.push({ t, v: a - b, text: `R${9 + k} ${text}`, t2: win, t3: `${a} : ${b}` });
          });
        }
        return ev;
      },
    },
    dota2: {
      kind: "gold",
      t2Vocab: ["radiant", "dire", "even"], t3Vocab: ["radiant", "dire", "even"],
      fake: (r) => `${pick(r, ["teamfight", "tower", "roshan"])} · ${pick(r, ["radiant", "dire"])}`,
      make(r) {
        let v = 0;
        return times(r, 10).map((t, i) => {
          const side = pick(r, ["radiant", "dire"]);
          const text = i === 0 ? `first blood · ${side}` : pick(r, [
            `teamfight · ${2 + Math.floor(r() * 4)} deaths · ${side} wins`,
            `tower · T${1 + Math.floor(r() * 3)} ${pick(r, ["top", "mid", "bot"])} · by ${side}`,
            `roshan · ${side}`,
          ]);
          const d = (side === "radiant" ? 1 : -1) * (r() * 3200) + (r() - 0.5) * 900;
          v = Math.round(v + d);
          return { t, v, text, t2: d > 1000 ? "radiant" : d < -1000 ? "dire" : "even",
            t3: v > 1000 ? "radiant" : v < -1000 ? "dire" : "even" };
        });
      },
    },
    sc2: {
      kind: "gold",
      t2Vocab: ["A", "B", "equal"], t3Vocab: ["A", "B", "equal"],
      fake: (r) => `battle · r${Math.floor(r() * 3)}c${Math.floor(r() * 3)}`,
      make(r) {
        let v = 0;
        return times(r, 10).map((t) => {
          const d = (r() - 0.48) * 3000;
          v = Math.round(v + d);
          const cell = `r${Math.floor(r() * 3)}c${Math.floor(r() * 3)}`;
          return { t, v, text: r() < 0.7 ? `battle · ${cell}` : `building destroyed · ${cell}`,
            t2: d > 400 ? "A" : d < -400 ? "B" : "equal", t3: v > 1500 ? "A" : v < -1500 ? "B" : "equal" };
        });
      },
    },
    gfootball: scoreGame(6, ["L", "R"], (r, s) => `goal · ${s} · ${pick(r, ["Blackwell", "Moreno", "Keller", "Osei", "Varga", "Lindqvist"])}`),
    badminton: scoreGame(12, ["near", "far"], (r, s) => `point · ${s} · ${pick(r, ["net", "out", "in_front", "in_mid", "in_back"])}`),
  };

  const gtCache = {};
  VA.gt = function (id) {
    if (VA.realGT[id]) return VA.realGT[id];
    if (gtCache[id]) return gtCache[id];
    const gen = GEN[id];
    return (gtCache[id] = {
      duration: CLIP, kind: gen.kind, v0: gen.v0 ?? (gen.kind === "prob" ? 0.5 : 0),
      events: gen.make(rng("gt|" + id)), placeholder: true,
    });
  };

  function altT3(gen, t3, r) {
    if (gen.t3Vocab) return pick(r, gen.t3Vocab.filter((x) => x !== t3));
    const [a, b] = t3.split(" : ").map(Number);
    const s = r() < 0.5 ? 1 : -1;
    return r() < 0.5 ? `${Math.max(0, a + s)} : ${b}` : `${a} : ${Math.max(0, b + s)}`;
  }

  /* Predictions for one model on one case. Verdicts:
   *   full    — tuple fully matches a GT event (counts for strict F1)
   *   partial — T1 (what/when/who) matches but T2 and/or T3 is wrong
   *   fp      — no GT event within tolerance (hallucinated or mistimed)
   * GT events without any matched prediction are listed in `misses`.
   * The number of full matches is calibrated so the final F1 equals the paper's per-game number. */
  VA.preds = function (caseId, protocol, modelId) {
    const real = VA.realPreds[caseId]?.[protocol]?.[modelId];
    if (real) return real;
    if (VA.realPreds[caseId]) return { preds: [], misses: [], norun: true };
    const gt = VA.gt(caseId), gen = GEN[caseId], N = gt.events.length;
    const f = VA.f1[protocol][modelId][VA.gameOrder.indexOf(caseId)] / 100;
    const r = rng(`${caseId}|${protocol}|${modelId}`);
    const TP = Math.round(f * N);
    const detect = clamp(Math.sqrt(f) * 1.2 + (protocol === "agentic" ? 0.12 : 0.05), 0, 1);
    const D = Math.min(N, Math.max(TP, Math.round(N * detect)));
    const hit = shuffle([...Array(N).keys()], r).slice(0, D);
    const full = new Set(shuffle(hit.slice(), r).slice(0, TP));
    const preds = hit.map((i) => {
      const e = gt.events[i];
      let t2 = e.t2, t3 = e.t3;
      if (!full.has(i)) {
        const w = r();
        if (w < 0.45) t2 = pick(r, gen.t2Vocab.filter((x) => x !== e.t2));
        if (w >= 0.3 || t2 === e.t2) t3 = altT3(gen, e.t3, r);
      }
      return { t: +clamp(e.t + (r() * 2 - 1) * 2.4, 0, gt.duration).toFixed(1), text: e.text, t2, t3,
        gi: i, verdict: full.has(i) ? "full" : "partial" };
    });
    // Keep #predictions == #GT so the final strict F1 = TP / N.
    for (let k = 0; k < N - D; k++) {
      const e = gt.events[Math.floor(r() * N)];
      preds.push({ t: +(3 + r() * (gt.duration - 6)).toFixed(1), text: gen.fake(r),
        t2: pick(r, gen.t2Vocab), t3: gen.t3Vocab ? pick(r, gen.t3Vocab) : altT3(gen, e.t3, r),
        gi: null, verdict: "fp" });
    }
    preds.sort((a, b) => a.t - b.t);
    const matched = new Set(hit);
    return { preds, misses: [...Array(N).keys()].filter((i) => !matched.has(i)), placeholder: true };
  };

  VA.bibtex = `@article{zhang2026videoarena,
  title   = {Video-Arena: A Scalable Agentic Video Benchmark for Spatiotemporal Capability},
  author  = {Zhang, Kuan and Chen, Yukun and Yang, Zhihao and Su, Yue and Wu, Xiangnan and
             Chen, Zirong and Luo, Run and Tan, Tao and Zheng, Yinhe and Li, Yiming},
  journal = {arXiv preprint},
  year    = {2026}
}`;
})();

// The slope behind davepack.dev, in the spirit of the old Windows ski game.
// In the background a pixel skier coasts downhill on autopilot, weaving
// around trees and rocks. "Play game" brings the slope to the front and hands
// over the controls. Plain script with no build step, served from public/.

const PX_PER_METER = 8;
const CELL = 48; // the world is generated one CELL x CELL square at a time
const BG_SPEED = 24; // autopilot top speed in world px per second: slow
const PLAY_SPEED = 90;
const BOOST = 1.6;
const CHASE_AFTER = 1200; // meters into a run before the snow beast wakes up
const BEAST_SPEED = 104; // a bit faster than cruising, slower than boosting

// Heading for each direction step: 0 is straight downhill, 3 is sideways.
const ANGLES = [0, 0.45, 0.9, Math.PI / 2];
const SPEED_FACTOR = [1, 0.85, 0.5, 0];

const SAVE_PAUSED = "ski:paused";
const SAVE_BEST = "ski:best";

const INTRO =
  "Steer with the arrow keys, the mouse, or touch. Hold the down arrow or the mouse button to go faster. Esc goes back to the site.";

// Sprites are drawn bottom-center on their anchor. Each letter is a palette
// color and "." is transparent.
const SPRITES = {
  tree: [
    ".....G.....",
    "....GgG....",
    "...GgggG...",
    "....GgG....",
    "...GgggG...",
    "..GgggggG..",
    "...GgggG...",
    "..GgggggG..",
    ".GgggggggG.",
    "..GgggggG..",
    ".GgggggggG.",
    "GgggggggggG",
    "GGGGGbGGGGG",
    ".....b.....",
    "....bbb....",
  ],
  snowTree: [
    ".....w.....",
    "....wwG....",
    "...GwggG...",
    "....wgG....",
    "...wwggG...",
    "..GgggwwG..",
    "...wwgwG...",
    "..GgwwggG..",
    ".GgggggwwG.",
    "..wwgggwG..",
    ".GgggwwggG.",
    "GgwwggggwwG",
    "GGGGGbGGGGG",
    ".....b.....",
    "....bbb....",
  ],
  smallTree: ["...G...", "..GgG..", ".GgggG.", "..GgG..", ".GgggG.", "GgggggG", "...b..."],
  deadTree: [
    "..b...b.",
    "b.b..b..",
    ".bb.b...",
    "..bbb..b",
    "...b..b.",
    "...bbbb.",
    "...bb...",
    "...bb...",
    "..bbbb..",
  ],
  rock: ["...OOOO...", "..OooowOO.", ".OoooooooO", "OooooooooO", "OOOOOOOOOO"],
  stump: [".bbbbb.", "byybyyb", "bbbbbbb", ".bbbbb."],
  mogul: ["...mmmm...", ".mm....mm.", "m........m"],
  ramp: ["..kkkkkkkkkk..", ".kyyyyyyyyyyk.", "kyyyyyyyyyyyyk", "kbbbbbbbbbbbbk", ".kkkkkkkkkkkk."],
  redFlag: ["krrr", "krrr", "kr..", "k...", "k...", "k...", "k...", "k..."],
  blueFlag: ["kBBB", "kBBB", "kB..", "k...", "k...", "k...", "k...", "k..."],
  skier: [
    "...rrr...",
    "..rrrrr..",
    "..sssss..",
    "..sssss..",
    "...sss...",
    "..BBBBB..",
    ".BBBBBBB.",
    "sBBBBBBBs",
    "..BBBBB..",
    "..nnnnn..",
    "..nn.nn..",
    "..n...n..",
  ],
  // Profile facing left; flipped for the right.
  skierSide: [
    "...rrr...",
    "..rrrrr..",
    "..ssss...",
    "..ksss...",
    "...ss....",
    "...BBB...",
    "..BBBBB..",
    ".sBBBBB..",
    "...BBBB..",
    "...nnnn..",
    "....nn...",
    "....nn...",
  ],
  // Tumbled: upside down with the skis crossed in the air.
  crash: [
    "..y.....y..",
    "...y...y...",
    "....y.y....",
    ".....k.....",
    "....k.k....",
    "...kBBBk...",
    "..sBBBBBs..",
    "...BBBBB...",
    "...sssss...",
    "...rrrrr...",
    "....rrr....",
  ],
  beastA: [
    "..h........h..",
    "..hh......hh..",
    "cc.hhCCCChh.cc",
    "cc.cccccccc.cc",
    ".cccwkccwkccc.",
    "..cccccccccc..",
    "..ccrrrrrrcc..",
    "..ccwrwwrwcc..",
    "...cccccccc...",
    "..cccccccccc..",
    "..cccccccccc..",
    "...ccc..ccc...",
    "...ccc..ccc...",
    "..CCCC..CCCC..",
  ],
  beastB: [
    "..h........h..",
    "..hh......hh..",
    "...hhCCCChh...",
    "...cccccccc...",
    ".cccwkccwkccc.",
    "cccccccccccccc",
    "cc.crrrrrrc.cc",
    "cc.cwrwwrwc.cc",
    "cc.cccccccc.cc",
    "..cccccccccc..",
    "..cccccccccc..",
    "...ccc..ccc...",
    "..CCCC...ccc..",
    ".........CCCC.",
  ],
};

// hx is the half-width of the hit box and hh its height above the anchor.
const KINDS = {
  tree: { hit: "crash", hx: 2, hh: 3, weight: 32 },
  snowTree: { hit: "crash", hx: 2, hh: 3, weight: 14 },
  smallTree: { hit: "crash", hx: 1, hh: 2, weight: 14 },
  deadTree: { hit: "crash", hx: 2, hh: 2, weight: 7 },
  rock: { hit: "crash", hx: 5, hh: 3, weight: 10 },
  stump: { hit: "crash", hx: 3, hh: 3, weight: 5 },
  mogul: { hit: "hop", hx: 4, hh: 2, weight: 11 },
  ramp: { hit: "jump", hx: 6, hh: 3, weight: 3.5 },
  gate: { hit: null, weight: 3 },
  redFlag: { hit: null, weight: 0 },
  blueFlag: { hit: null, weight: 0 },
};
const TOTAL_WEIGHT = Object.values(KINDS).reduce((sum, kind) => sum + kind.weight, 0);

const SHARED = {
  k: "#141820",
  g: "#2f8f46",
  G: "#1d5e30",
  b: "#7a4a24",
  B: "#2251c7",
  r: "#d12b2b",
  s: "#f2c29b",
  y: "#f2b630",
  o: "#9aa3ad",
  O: "#5d6670",
  c: "#9fd3f0",
  C: "#3f7fb3",
  h: "#f08a24",
  n: "#4a5160", // ski pants and poles: readable on day snow and at night
};
const PALETTES = {
  day: {
    ...SHARED,
    snow: "#f7fafd",
    speck: "#e2e9f2",
    track: "#d6dfeb",
    shadow: "rgba(30, 45, 70, 0.2)",
    flake: "#d2dce9",
    w: "#ffffff",
    m: "#d0dbe8",
  },
  night: {
    ...SHARED,
    snow: "#0d1726",
    speck: "#14223a",
    track: "#1b2b47",
    shadow: "rgba(0, 0, 0, 0.45)",
    flake: "#c9d6ea",
    w: "#dbe6f4",
    m: "#1f3150",
  },
};

function load(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the preference just won't stick.
  }
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const approach = (n, target, step) =>
  n < target ? Math.min(n + step, target) : Math.max(n - step, target);
const heading = (dir) => Math.sign(dir) * ANGLES[Math.abs(dir)];

// mulberry32: small, fast, and good enough for scattering trees.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function main() {
  const root = document.querySelector("[data-ski-root]");
  const canvas = document.getElementById("ski-canvas");
  const hud = document.getElementById("ski-hud");
  const controls = document.getElementById("ski-controls");
  const pauseButton = document.getElementById("ski-pause");
  const playButton = document.getElementById("ski-play");
  const ctx = canvas?.getContext("2d");
  if (!root || !ctx || !hud || !controls || !pauseButton || !playButton) return;

  const stat = (name) => hud.querySelector(`[data-stat="${name}"]`);
  const stats = {
    time: stat("time"),
    distance: stat("distance"),
    speed: stat("speed"),
    best: stat("best"),
    message: stat("message"),
  };

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const dark = matchMedia("(prefers-color-scheme: dark)");
  const seed = (Math.random() * 2 ** 31) | 0;

  let W = 0;
  let H = 0;
  let scale = 3;
  // Follow the theme switcher: Dark, Light, or the device setting.
  const isNight = () => {
    const choice = document.querySelector('input[name="theme"]:checked')?.value ?? "system";
    return choice === "dark" || (choice === "system" && dark.matches);
  };
  let pal = isNight() ? PALETTES.night : PALETTES.day;
  let sheet = buildSheet(pal);

  let mode = "background";
  let running = false;
  let frame = 0;
  let last = 0;
  let bgPaused = reduceMotion.matches || load(SAVE_PAUSED) === "1";

  const player = { x: 0, y: 0, dir: 1, speed: BG_SPEED / 2, z: 0, air: 0, airDur: 1, airHeight: 0 };
  player.crashed = 0;
  player.ignore = null;
  const cam = { x: 0, y: 0 };
  const keys = { boost: false };
  const pilot = { next: 0, clock: 0, phase: Math.random() * 10, want: 1 };
  let run = null;
  let beast = null;
  let best = Number(load(SAVE_BEST)) || 0;
  let messageTimer = 0;
  let hudClock = 0;
  const tracks = [];
  let lastTrack = null;
  const flakes = [];

  // ---- World -------------------------------------------------------------

  const cells = new Map();

  function hash(cx, cy) {
    let h = (Math.imul(cx, 374761393) + Math.imul(cy, 668265263) + seed) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  }

  function pickKind(roll) {
    let n = roll * TOTAL_WEIGHT;
    for (const [name, kind] of Object.entries(KINDS)) {
      n -= kind.weight;
      if (n < 0) return name;
    }
    return "tree";
  }

  function cellObjects(cx, cy) {
    const key = `${cx},${cy}`;
    let list = cells.get(key);
    if (list) return list;
    list = [];
    // Keep the spot where the skier starts clear.
    const startArea = cy > -6 && cy < 3 && Math.abs(cx) < 3;
    if (!startArea) {
      const r = rng(hash(cx, cy));
      const roll = r();
      const count = roll < 0.5 ? 0 : roll < 0.85 ? 1 : 2;
      for (let i = 0; i < count; i++) {
        const x = cx * CELL + 8 + r() * (CELL - 16);
        const y = cy * CELL + 8 + r() * (CELL - 16);
        const kind = pickKind(r());
        if (kind === "gate") {
          list.push({ id: `${key}:${i}r`, kind: "redFlag", x: x - 11, y });
          list.push({ id: `${key}:${i}b`, kind: "blueFlag", x: x + 11, y });
        } else {
          list.push({ id: `${key}:${i}`, kind, x, y });
        }
      }
    }
    if (cells.size > 4000) cells.clear();
    cells.set(key, list);
    return list;
  }

  function objectsIn(x0, y0, x1, y1) {
    const out = [];
    for (let cy = Math.floor(y0 / CELL); cy <= Math.floor(y1 / CELL); cy++) {
      for (let cx = Math.floor(x0 / CELL); cx <= Math.floor(x1 / CELL); cx++) {
        for (const o of cellObjects(cx, cy)) {
          if (o.x >= x0 && o.x <= x1 && o.y >= y0 && o.y <= y1) out.push(o);
        }
      }
    }
    return out;
  }

  function hazardAt(x, y, pad) {
    for (const o of objectsIn(x - 16, y - 8, x + 16, y + 16)) {
      const kind = KINDS[o.kind];
      if (kind.hit !== "crash") continue;
      if (Math.abs(o.x - x) < kind.hx + pad && y > o.y - kind.hh - pad && y < o.y + pad)
        return true;
    }
    return false;
  }

  // ---- Sprites -----------------------------------------------------------

  function paint(rows, flip) {
    const w = Math.max(...rows.map((row) => row.length));
    const sprite = document.createElement("canvas");
    sprite.width = w;
    sprite.height = rows.length;
    const g = sprite.getContext("2d");
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === ".") continue;
        g.fillStyle = pal[row[x]];
        g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
      }
    });
    return sprite;
  }

  function buildSheet() {
    const out = {};
    for (const [name, rows] of Object.entries(SPRITES)) {
      out[name] = paint(rows, false);
      out[`${name}Flip`] = paint(rows, true);
    }
    return out;
  }

  function blit(sprite, x, y) {
    ctx.drawImage(sprite, Math.round(x - sprite.width / 2), Math.round(y - sprite.height + 1));
  }

  function line(x0, y0, x1, y1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      ctx.fillRect(
        Math.round(x0 + ((x1 - x0) * i) / steps),
        Math.round(y0 + ((y1 - y0) * i) / steps),
        1,
        1,
      );
    }
  }

  // ---- Simulation --------------------------------------------------------

  function update(dt) {
    if (mode === "background") steerAutopilot(dt);
    if (run?.caught) {
      run.caughtTime += dt;
      if (beast) beast.t += dt;
      if (run.caughtTime > 1.8 && !run.over) finishRun();
      return;
    }
    movePlayer(dt);
    if (mode === "play") {
      run.time += dt;
      moveBeast(dt);
    }
    updateCamera(dt);
    layTracks();
    moveFlakes(dt);
  }

  function movePlayer(dt) {
    const p = player;
    if (p.crashed > 0) {
      p.crashed -= dt;
      if (p.crashed <= 0) {
        p.dir = 0;
        p.speed = 0;
      }
      return;
    }
    const boosting = mode === "play" && keys.boost && Math.abs(p.dir) <= 1;
    const top = (mode === "play" ? PLAY_SPEED : BG_SPEED) * (boosting ? BOOST : 1);
    const target = top * SPEED_FACTOR[Math.abs(p.dir)];
    const rate = target > p.speed ? top * 0.7 : top * 2;
    p.speed = approach(p.speed, target, rate * dt);
    const a = heading(p.dir);
    p.x += Math.sin(a) * p.speed * dt;
    p.y += Math.cos(a) * p.speed * dt;

    if (p.air > 0) {
      p.air -= dt;
      p.z = p.air > 0 ? Math.sin(Math.PI * (1 - p.air / p.airDur)) * p.airHeight : 0;
      return;
    }
    collide();
  }

  function takeOff(duration, height) {
    player.air = player.airDur = duration;
    player.airHeight = height;
  }

  function collide() {
    const p = player;
    let touchingIgnored = false;
    for (const o of objectsIn(p.x - 16, p.y - 8, p.x + 16, p.y + 16)) {
      const kind = KINDS[o.kind];
      if (!kind.hit) continue;
      if (Math.abs(o.x - p.x) > kind.hx + 3 || p.y < o.y - kind.hh - 1 || p.y > o.y + 1) continue;
      if (o.id === p.ignore) {
        touchingIgnored = true;
        continue;
      }
      if (kind.hit === "crash") {
        p.crashed = 1;
        p.speed = 0;
        p.ignore = o.id;
        return;
      }
      if (kind.hit === "jump") return takeOff(0.5 + p.speed / 180, 10 + p.speed / 10);
      if (kind.hit === "hop" && p.speed > 20) return takeOff(0.3, 3);
    }
    if (!touchingIgnored) p.ignore = null;
  }

  // The autopilot looks a couple of seconds down each possible line, avoids
  // anything solid, and otherwise drifts toward a slowly wandering target so
  // it uses the whole width of the window.
  function steerAutopilot(dt) {
    pilot.clock += dt;
    pilot.next -= dt;
    if (pilot.next > 0 || player.crashed > 0) return;
    pilot.next = 0.2;
    pilot.want = bestLine();
    if (player.dir < pilot.want) player.dir++;
    else if (player.dir > pilot.want) player.dir--;
  }

  function bestLine() {
    const p = player;
    const target = cam.x + W * (0.5 + 0.4 * Math.sin(pilot.clock * 0.05 + pilot.phase));
    let bestDir = 0;
    let bestScore = Infinity;
    for (let d = -2; d <= 2; d++) {
      const a = heading(d);
      const v = Math.max(BG_SPEED * SPEED_FACTOR[Math.abs(d)], 6);
      let score = Math.abs(d - p.dir) * 2 + (Math.abs(d) === 2 ? 3 : 0);
      for (let t = 0.25; t <= 2.5; t += 0.25) {
        if (hazardAt(p.x + Math.sin(a) * v * t, p.y + Math.cos(a) * v * t, 4)) {
          score += (2.75 - t) * 60;
          break;
        }
      }
      const endX = p.x + Math.sin(a) * v * 2;
      if (endX < cam.x + 16 || endX > cam.x + W - 16) score += 200;
      score += Math.abs(endX - target) * 0.3;
      if (score < bestScore) {
        bestScore = score;
        bestDir = d;
      }
    }
    return bestDir;
  }

  function updateCamera() {
    cam.y = player.y - H * 0.3;
    if (mode === "play") {
      const left = cam.x + W * 0.3;
      const right = cam.x + W * 0.7;
      if (player.x < left) cam.x -= left - player.x;
      else if (player.x > right) cam.x += player.x - right;
    } else {
      // The background camera stays put sideways; just keep the skier in it.
      if (player.x < cam.x + 8) cam.x = player.x - 8;
      else if (player.x > cam.x + W - 8) cam.x = player.x - W + 8;
    }
  }

  function layTracks() {
    if (player.z > 0 || player.crashed > 0) {
      lastTrack = null;
      return;
    }
    if (!lastTrack || Math.hypot(player.x - lastTrack.x, player.y - lastTrack.y) >= 1.5) {
      lastTrack = { x: player.x, y: player.y, a: heading(player.dir) };
      tracks.push(lastTrack);
      if (tracks.length > 1500) tracks.splice(0, 500);
    }
  }

  function moveFlakes(dt) {
    const want = mode === "background" ? Math.round((W * H) / 2500) : 0;
    while (flakes.length < want) {
      flakes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        v: 6 + Math.random() * 10,
        phase: Math.random() * 6,
      });
    }
    flakes.length = Math.min(flakes.length, want);
    for (const f of flakes) {
      // Snow drifts down the screen while the slope scrolls up past it.
      f.y += (f.v - player.speed * 0.25) * dt;
      f.x += Math.sin(pilot.clock * 0.8 + f.phase) * 4 * dt;
      if (f.y < -2) f.y += H + 4;
      if (f.y > H + 2) f.y -= H + 4;
      if (f.x < -2) f.x += W + 4;
      if (f.x > W + 2) f.x -= W + 4;
    }
  }

  function moveBeast(dt) {
    const meters = (player.y - run.startY) / PX_PER_METER;
    if (!beast && meters > CHASE_AFTER) {
      const side = Math.random() < 0.5 ? -1 : 1;
      beast = { x: player.x + side * W * 0.6, y: player.y - H * 0.3 - 24, t: 0 };
      message("Something is following you.", 4);
    }
    if (!beast) return;
    beast.t += dt;
    const dx = player.x - beast.x;
    const dy = player.y - beast.y;
    const dist = Math.hypot(dx, dy) || 1;
    const step = Math.min(dist, BEAST_SPEED * dt);
    beast.x += (dx / dist) * step;
    beast.y += (dy / dist) * step;
    if (dist < 5 && player.z < 4) {
      run.caught = true;
      run.caughtTime = 0;
      player.speed = 0;
    }
  }

  // ---- Drawing -----------------------------------------------------------

  function draw() {
    const ox = Math.round(cam.x);
    const oy = Math.round(cam.y);
    ctx.fillStyle = pal.snow;
    ctx.fillRect(0, 0, W, H);

    // A few fixed specks per cell give the snow some texture and make the
    // scrolling readable.
    ctx.fillStyle = pal.speck;
    for (let cy = Math.floor(oy / CELL); cy <= Math.floor((oy + H) / CELL); cy++) {
      for (let cx = Math.floor(ox / CELL); cx <= Math.floor((ox + W) / CELL); cx++) {
        const r = rng(hash(cx, cy) ^ 0x9e3779b9);
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(
            Math.floor(cx * CELL + r() * CELL) - ox,
            Math.floor(cy * CELL + r() * CELL) - oy,
            i ? 1 : 2,
            1,
          );
        }
      }
    }

    ctx.fillStyle = pal.track;
    for (const t of tracks) {
      const sx = Math.round(t.x) - ox;
      const sy = Math.round(t.y) - oy;
      if (sx < -4 || sx > W + 4 || sy < -4 || sy > H + 4) continue;
      const nx = Math.round(Math.cos(t.a) * 2);
      const ny = Math.round(-Math.sin(t.a) * 2);
      ctx.fillRect(sx + nx, sy + ny, 1, 1);
      ctx.fillRect(sx - nx, sy - ny, 1, 1);
    }

    const items = objectsIn(cam.x - 24, cam.y - 8, cam.x + W + 24, cam.y + H + 32).map((o) => ({
      y: o.y,
      draw: () => blit(sheet[o.kind], o.x - ox, o.y - oy),
    }));
    items.push({ y: player.y, draw: () => drawSkier(ox, oy) });
    if (beast) items.push({ y: beast.y, draw: () => drawBeast(ox, oy) });
    items.sort((a, b) => a.y - b.y);
    for (const item of items) item.draw();

    ctx.fillStyle = pal.flake;
    for (const f of flakes) ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
  }

  function drawSkier(ox, oy) {
    if (run?.caught) return;
    const p = player;
    const sx = Math.round(p.x) - ox;
    const sy = Math.round(p.y) - oy;
    if (p.crashed > 0) {
      blit(sheet.crash, sx, sy + 2);
      return;
    }
    const lift = Math.round(p.z);
    if (lift > 0) {
      ctx.fillStyle = pal.shadow;
      ctx.fillRect(sx - 3, sy - 1, 7, 1);
      ctx.fillRect(sx - 4, sy, 9, 1);
      ctx.fillRect(sx - 3, sy + 1, 7, 1);
    }
    const fy = sy - lift;
    const a = heading(p.dir);
    const dx = Math.sin(a);
    const dy = Math.cos(a);
    const nx = Math.cos(a);
    const ny = -Math.sin(a);

    ctx.fillStyle = pal.y;
    for (const side of [-2, 2]) {
      line(
        sx + nx * side - dx * 4,
        fy + ny * side - dy * 4,
        sx + nx * side + dx * 6,
        fy + ny * side + dy * 6,
      );
    }

    if (Math.abs(p.dir) >= 2) {
      blit(p.dir < 0 ? sheet.skierSide : sheet.skierSideFlip, sx, fy);
      return;
    }
    blit(sheet.skier, sx, fy);
    ctx.fillStyle = pal.n;
    line(sx - 4, fy - 4, sx - 5, fy + 1);
    line(sx + 4, fy - 4, sx + 5, fy + 1);
  }

  function drawBeast(ox, oy) {
    const flip = beast.x > player.x;
    const fast = run?.caught;
    const second = Math.floor(beast.t / (fast ? 0.12 : 0.25)) % 2 === 1;
    const name = (second ? "beastB" : "beastA") + (flip ? "Flip" : "");
    blit(sheet[name], Math.round(beast.x) - ox, Math.round(beast.y) - oy + 1);
  }

  // ---- HUD ---------------------------------------------------------------

  function message(text, seconds = 0) {
    stats.message.textContent = text;
    messageTimer = seconds;
  }

  function updateHud(dt) {
    if (mode !== "play" || !run) return;
    if (messageTimer > 0) {
      messageTimer -= dt;
      if (messageTimer <= 0) stats.message.textContent = "";
    }
    hudClock -= dt;
    if (hudClock > 0) return;
    hudClock = 0.1;
    const meters = Math.max(0, Math.floor((player.y - run.startY) / PX_PER_METER));
    const seconds = Math.floor(run.time);
    stats.time.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    stats.distance.textContent = `${meters.toLocaleString("en-US")} m`;
    stats.speed.textContent = `${Math.round((player.speed / PX_PER_METER) * 3.6)} km/h`;
    stats.best.textContent = `${Math.max(best, run.over ? 0 : meters).toLocaleString("en-US")} m`;
    run.meters = meters;
  }

  function finishRun() {
    run.over = true;
    const meters = run.meters ?? 0;
    if (meters > best) {
      best = meters;
      save(SAVE_BEST, String(best));
    }
    hudClock = 0;
    updateHud(0);
    message(`Caught at ${meters.toLocaleString("en-US")} m. Press Enter or tap to ski again.`);
  }

  // ---- Loop and modes ----------------------------------------------------

  function loop(now) {
    frame = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    draw();
    updateHud(dt);
  }

  function start() {
    if (!running) {
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    }
    syncButtons();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
    draw();
    syncButtons();
  }

  function syncButtons() {
    pauseButton.textContent = running ? "Pause" : "Resume";
    pauseButton.setAttribute("aria-pressed", String(!running));
    playButton.textContent = mode === "play" ? "Exit game" : "Play game";
    if (mode === "play" && run && !run.over) {
      if (!running) message("Paused. Press Space to keep skiing.");
      else if (stats.message.textContent.startsWith("Paused")) message("");
    }
  }

  function newRun() {
    run = { startY: player.y, time: 0, caught: false, caughtTime: 0, over: false, meters: 0 };
    beast = null;
    player.crashed = 0;
    player.ignore = null;
    player.dir = 0;
    hudClock = 0;
    message(INTRO, 8);
  }

  function enterPlay() {
    mode = "play";
    root.dataset.mode = "play";
    document.documentElement.style.overflow = "hidden";
    canvas.setAttribute("aria-hidden", "false");
    canvas.tabIndex = 0;
    hud.hidden = false;
    newRun();
    start();
    canvas.focus({ preventScroll: true });
  }

  function exitPlay() {
    mode = "background";
    delete root.dataset.mode;
    document.documentElement.style.overflow = "";
    canvas.setAttribute("aria-hidden", "true");
    canvas.tabIndex = -1;
    hud.hidden = true;
    run = null;
    beast = null;
    keys.boost = false;
    player.crashed = 0;
    if (bgPaused) stop();
    else start();
    playButton.focus();
  }

  function togglePause() {
    if (running) stop();
    else if (mode === "play" && run?.over) {
      newRun();
      start();
    } else start();
    if (mode === "background") {
      bgPaused = !running;
      save(SAVE_PAUSED, bgPaused ? "1" : "0");
    }
  }

  // ---- Input -------------------------------------------------------------

  function turn(side) {
    if (!running || player.crashed > 0 || run?.caught) return;
    if (player.dir === side * 3)
      player.x += side * 3; // already sideways: sidestep
    else player.dir = clamp(player.dir + side, -3, 3);
  }

  addEventListener("keydown", (event) => {
    if (mode !== "play" || event.metaKey || event.ctrlKey || event.altKey) return;
    const onButton = event.target instanceof HTMLButtonElement;
    switch (event.key) {
      case "Escape":
        exitPlay();
        break;
      case " ":
      case "p":
      case "P":
        if (onButton && event.key === " ") return;
        togglePause();
        break;
      case "Enter":
        if (onButton || !run?.over) return;
        newRun();
        start();
        break;
      case "ArrowLeft":
      case "a":
        turn(-1);
        break;
      case "ArrowRight":
      case "d":
        turn(1);
        break;
      case "ArrowDown":
      case "s":
        if (player.crashed <= 0) player.dir = 0;
        keys.boost = true;
        break;
      case "ArrowUp":
      case "w":
        if (player.crashed <= 0) player.dir = player.dir < 0 ? -3 : 3;
        break;
      default:
        return;
    }
    event.preventDefault();
  });

  addEventListener("keyup", (event) => {
    if (event.key === "ArrowDown" || event.key === "s") keys.boost = false;
  });

  // Like the original, the skier heads toward the pointer.
  function aimAt(event) {
    if (!running || player.crashed > 0 || run?.caught) return;
    const sx = (player.x - cam.x) * scale;
    const sy = (player.y - player.z - cam.y - 6) * scale;
    const dx = event.clientX - sx;
    const dy = event.clientY - sy;
    if (dy < 0) player.dir = dx < 0 ? -3 : 3;
    else player.dir = clamp(Math.round((Math.atan2(dx, dy) / (Math.PI / 2)) * 3), -3, 3);
  }

  canvas.addEventListener("pointermove", (event) => {
    if (mode !== "play") return;
    if (event.pointerType === "mouse" || event.buttons) aimAt(event);
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (mode !== "play") return;
    if (run?.over) {
      newRun();
      start();
      return;
    }
    if (!running) togglePause();
    aimAt(event);
    if (event.pointerType === "mouse") keys.boost = true;
  });

  addEventListener("pointerup", () => {
    keys.boost = false;
  });

  pauseButton.addEventListener("click", togglePause);
  playButton.addEventListener("click", () => (mode === "play" ? exitPlay() : enterPlay()));

  reduceMotion.addEventListener("change", () => {
    if (reduceMotion.matches && mode === "background") {
      bgPaused = true;
      stop();
    }
  });

  function applyTheme() {
    pal = isNight() ? PALETTES.night : PALETTES.day;
    sheet = buildSheet();
    draw();
  }

  dark.addEventListener("change", applyTheme);
  document.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement && event.target.name === "theme") applyTheme();
  });

  // ---- Setup -------------------------------------------------------------

  function resize() {
    scale = innerWidth < 700 ? 2 : 3;
    const firstLayout = W === 0;
    W = Math.ceil(innerWidth / scale);
    H = Math.ceil(innerHeight / scale);
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;
    // Start the skier off to the right, out from behind the content.
    if (firstLayout) cam.x = player.x - W * 0.78;
    updateCamera();
    draw();
  }

  let resizeFrame = 0;
  addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resize);
  });

  resize();
  controls.hidden = false;
  if (bgPaused) stop();
  else start();
}

main();

// draw.mjs — renders entry.png for Monday 23 November 2026 from scratch.
// Pure Node.js standard library: a small raster canvas, a hand-made 5x7
// bitmap font, simple vector shapes, and a hand-rolled PNG encoder.
// No dependencies, no network, no external fonts. Deterministic output.
//
// Stories verified 23 Nov 2026 against Reuters, AP, CNN, BBC, Anadolu
// and RIA Novosti:
//   1. Iran vows to use "all available tools" to confront the US naval
//      blockade; Trump dares Iran to test it; 14 tankers at Kharg Island
//      (Reuters, 23 Nov).
//   2. Ukraine's sea drones sink the Russian corvette Merkury in Benghazi,
//      Libya, and hit the cargo ship MV Angara; a Ka-27 helicopter is
//      destroyed (Reuters/AP/CNN, 23 Nov).
//   3. Russian strike on an apartment block in Dymer, near Kyiv, kills 11
//      (BBC/Ukrinform, 23 Nov).
//   4. Armenia launches the TRIPP "Trump Route" corridor; Trump announces
//      the TRIPP Development Company (RIA Novosti/Anadolu/Fox, 23 Nov).
//   5. NATO's North Atlantic Council meets in Brussels over Russian
//      objects in Polish airspace; a recovered Kh-101 was built this fall
//      (Kyiv Post, 23 Nov).
//   6. AI selloff: the S&P 500 slides into correction, the Nasdaq turns
//      negative for the year, Seoul's KOSPI falls 3% (Reuters, 23 Nov).

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ------------------------------------------------------------------ palette
const PAL = {
  paper: [244, 240, 230],
  ink: [20, 26, 40],
  navy: [16, 34, 66],
  navySoft: [30, 58, 100],
  red: [176, 32, 32],
  white: [255, 255, 255],
  grey: [96, 102, 116],
  edge: [210, 212, 216],
  card: [255, 255, 255],
  gold: [198, 148, 30],
  green: [30, 118, 62],
  sky: [168, 206, 232],
  sea: [22, 64, 104],
  deepSea: [14, 46, 80],
  sand: [228, 210, 166],
  orange: [228, 104, 20],
  yellow: [244, 192, 44],
  smoke: [118, 122, 130],
  teal: [24, 96, 96],
  body: [54, 60, 74],
};

// ------------------------------------------------------------------ canvas
const buf = new Uint8Array(W * H * 3);
function paintAll([r, g, b]) {
  for (let i = 0; i < W * H; i++) {
    buf[i * 3] = r; buf[i * 3 + 1] = g; buf[i * 3 + 2] = b;
  }
}
function dot(x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
}
function box(x, y, w, h, col) {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) dot(i, j, col);
}
function hbar(x0, x1, y, col, t = 1) {
  for (let k = 0; k < t; k++) for (let x = x0; x <= x1; x++) dot(x, y + k, col);
}
function vbar(x, y0, y1, col, t = 1) {
  for (let k = 0; k < t; k++) for (let y = y0; y <= y1; y++) dot(x + k, y, col);
}
function seg(x0, y0, x1, y1, col, t = 1) {
  // Bresenham with a square brush.
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  const h = Math.floor(t / 2);
  for (;;) {
    for (let a = -h; a <= h; a++)
      for (let b = -h; b <= h; b++) dot(x + a, y + b, col);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}
function disc(cx, cy, r, col, solid = true) {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y);
      if (solid ? d <= r : d <= r && d >= r - 1.5) dot(cx + x, cy + y, col);
    }
}
function tri(x0, y0, x1, y1, x2, y2, col) {
  const loX = Math.min(x0, x1, x2), hiX = Math.max(x0, x1, x2);
  const loY = Math.min(y0, y1, y2), hiY = Math.max(y0, y1, y2);
  const s = (ax, ay, bx, by, cx, cy) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
  for (let y = loY; y <= hiY; y++)
    for (let x = loX; x <= hiX; x++) {
      const d0 = s(x, y, x0, y0, x1, y1);
      const d1 = s(x, y, x1, y1, x2, y2);
      const d2 = s(x, y, x2, y2, x0, y0);
      if (!((d0 < 0 || d1 < 0 || d2 < 0) && (d0 > 0 || d1 > 0 || d2 > 0))) dot(x, y, col);
    }
}
function oval(cx, cy, rx, ry, col) {
  for (let y = -ry; y <= ry; y++)
    for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) dot(cx + x, cy + y, col);
}

// ------------------------------------------------------------------ 5x7 font
// Glyphs as 7 rows of 5 bits, drawn by hand for this image.
const GLYPHS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11100', '10010', '10001', '10001', '10001', '10010', '11100'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
};
function strWidth(s, scale) { return s.length * 6 * scale - scale; }
function putText(x, y, s, scale, col) {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = GLYPHS[ch] ?? GLYPHS[' '];
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 5; c++)
        if (g[r][c] === '1') box(cx + c * scale, y + r * scale, scale, scale, col);
    cx += 6 * scale;
  }
  return cx;
}
function putCentred(cx, y, s, scale, col) {
  return putText(cx - Math.floor(strWidth(s, scale) / 2), y, s, scale, col);
}
// Greedy word wrap; returns the lines that fit maxWidth at scale.
function wrapText(s, scale, maxWidth) {
  const out = [];
  let cur = '';
  for (const w of s.split(' ')) {
    const trial = cur ? cur + ' ' + w : w;
    if (strWidth(trial, scale) <= maxWidth) { cur = trial; continue; }
    if (cur) out.push(cur);
    cur = w;
  }
  if (cur) out.push(cur);
  return out;
}

// ------------------------------------------------------------------ scenes
// Each scene draws inside (x, y, w, h). All original vector art.

// 1. Gulf blockade: tanker convoy halted at sea, warship on watch, a
// red chain of buoys barring the strait.
function sceneBlockade(x, y, w, h) {
  box(x, y, w, h, [196, 210, 220]); // hazy sky
  disc(x + Math.floor(w * 0.84), y + Math.floor(h * 0.20), 16, PAL.yellow);
  box(x, y + Math.floor(h * 0.55), w, h - Math.floor(h * 0.55), PAL.sea); // sea
  box(x, y + Math.floor(h * 0.55), w, 4, PAL.white);
  // big tanker, mid-frame
  const tx = x + Math.floor(w * 0.10), ty = y + Math.floor(h * 0.42);
  box(tx, ty, Math.floor(w * 0.52), 22, [52, 56, 64]); // hull
  box(tx + 6, ty + 22, Math.floor(w * 0.52) - 12, 6, PAL.red); // waterline
  box(tx + 8, ty - 20, 30, 20, [196, 64, 48]); // tank block
  box(tx + 44, ty - 20, 30, 20, [64, 118, 196]);
  box(tx + 80, ty - 20, 30, 20, [218, 178, 58]);
  box(tx + 116, ty - 34, 10, 34, [52, 56, 64]); // funnel
  box(tx + 116, ty - 40, 10, 6, PAL.orange);
  // warship silhouette on the right
  const wx = x + Math.floor(w * 0.68), wy = y + Math.floor(h * 0.46);
  tri(wx, wy, wx + Math.floor(w * 0.24), wy, wx + Math.floor(w * 0.20), wy + 18, [30, 34, 42]);
  box(wx, wy, Math.floor(w * 0.24), 10, [30, 34, 42]);
  box(wx + 18, wy - 16, 8, 16, [30, 34, 42]);
  box(wx + 34, wy - 10, 14, 10, [30, 34, 42]);
  // chain of red buoys across the strait
  for (let i = 0; i < 7; i++) {
    const bx = x + 14 + i * Math.floor((w - 28) / 6);
    disc(bx, y + Math.floor(h * 0.72), 7, PAL.red);
    if (i < 6) seg(bx + 7, y + Math.floor(h * 0.72), bx + Math.floor((w - 28) / 6) - 7, y + Math.floor(h * 0.72), PAL.red, 3);
  }
  // wave marks
  for (let i = 0; i < 3; i++)
    seg(x + 16 + i * 90, y + h - 16, x + 46 + i * 90, y + h - 16, PAL.white, 2);
}

// 2. Benghazi: a corvette listing and burning in the harbour, smoke
// rising, a small drone boat racing away with a white wake.
function sceneLibya(x, y, w, h) {
  box(x, y, w, h, [232, 176, 128]); // dusk sky
  disc(x + Math.floor(w * 0.80), y + Math.floor(h * 0.22), 18, [240, 120, 40]);
  box(x, y + Math.floor(h * 0.60), w, h - Math.floor(h * 0.60), PAL.deepSea);
  // harbour wall
  box(x, y + Math.floor(h * 0.52), w, 12, [120, 116, 108]);
  // listing corvette
  const sx = x + Math.floor(w * 0.16), sy = y + Math.floor(h * 0.50);
  seg(sx, sy, sx + Math.floor(w * 0.52), sy - 26, [36, 40, 48], 12);
  seg(sx + 20, sy - 6, sx + 34, sy - 34, [36, 40, 48], 6);
  seg(sx + 60, sy - 16, sx + 74, sy - 40, [36, 40, 48], 6);
  // flames and smoke above the ship
  const fx = sx + Math.floor(w * 0.28);
  tri(fx, sy - 28, fx + 12, sy - 62, fx + 24, sy - 28, PAL.orange);
  tri(fx + 20, sy - 28, fx + 30, sy - 52, fx + 40, sy - 28, PAL.yellow);
  disc(fx + 14, sy - 58, 10, PAL.smoke);
  disc(fx + 32, sy - 70, 12, [140, 142, 148]);
  disc(fx + 50, sy - 58, 9, [160, 162, 168]);
  // drone boat with wake
  const dx = x + Math.floor(w * 0.72), dy = y + Math.floor(h * 0.76);
  tri(dx, dy, dx + 34, dy, dx + 26, dy + 10, [220, 222, 226]);
  seg(dx - 4, dy + 12, dx - 44, dy + 18, PAL.white, 3);
  seg(dx - 4, dy + 14, dx - 36, dy + 24, PAL.white, 2);
}

// 3. Dymer: a damaged apartment block, one corner broken open, smoke,
// a rescue ladder and a small ambulance cross.
function sceneDymer(x, y, w, h) {
  box(x, y, w, h, [214, 220, 226]); // cold sky
  // apartment block
  const bx = x + Math.floor(w * 0.20), by = y + Math.floor(h * 0.22);
  box(bx, by, Math.floor(w * 0.56), Math.floor(h * 0.62), [150, 152, 158]);
  box(bx, by, Math.floor(w * 0.56), 8, [96, 98, 104]);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++)
      box(bx + 14 + c * 36, by + 18 + r * 34, 20, 18, [52, 74, 104]);
  // broken corner, top right
  tri(bx + Math.floor(w * 0.56), by, bx + Math.floor(w * 0.40), by, bx + Math.floor(w * 0.56), by + 44, [40, 42, 48]);
  box(bx + Math.floor(w * 0.44), by + 22, 26, 22, [40, 42, 48]);
  // smoke plume
  disc(bx + Math.floor(w * 0.50), by - 6, 9, PAL.smoke);
  disc(bx + Math.floor(w * 0.56), by - 18, 11, [140, 142, 148]);
  disc(bx + Math.floor(w * 0.62), by - 28, 8, [160, 162, 168]);
  // ground and rescue ladder
  box(x, y + Math.floor(h * 0.84), w, h - Math.floor(h * 0.84), [96, 98, 104]);
  seg(x + Math.floor(w * 0.14), y + h - 6, x + Math.floor(w * 0.34), by + 40, PAL.yellow, 5);
  for (let i = 0; i < 5; i++)
    seg(x + Math.floor(w * 0.14) + i * 12, y + h - 6 - i * 14, x + Math.floor(w * 0.14) + i * 12 + 14, y + h - 6 - i * 14, PAL.yellow, 3);
  // ambulance cross badge
  const cx = x + Math.floor(w * 0.82), cy = y + Math.floor(h * 0.76);
  disc(cx, cy, 16, PAL.white);
  box(cx - 10, cy - 3, 20, 6, PAL.red);
  box(cx - 3, cy - 10, 6, 20, PAL.red);
}

// 4. TRIPP corridor: green mountains, a road and rail line winding
// through a valley, a road sign, morning sun.
function sceneTripp(x, y, w, h) {
  box(x, y, w, h, PAL.sky);
  disc(x + Math.floor(w * 0.82), y + Math.floor(h * 0.18), 15, PAL.yellow);
  // mountains
  tri(x, y + Math.floor(h * 0.55), x + Math.floor(w * 0.30), y + Math.floor(h * 0.18), x + Math.floor(w * 0.55), y + Math.floor(h * 0.55), [88, 132, 92]);
  tri(x + Math.floor(w * 0.42), y + Math.floor(h * 0.55), x + Math.floor(w * 0.70), y + Math.floor(h * 0.26), x + w, y + Math.floor(h * 0.55), [64, 110, 76]);
  // valley floor
  box(x, y + Math.floor(h * 0.55), w, h - Math.floor(h * 0.55), [120, 172, 96]);
  // winding road
  seg(x + 10, y + h - 12, x + Math.floor(w * 0.42), y + Math.floor(h * 0.70), [52, 52, 56], 10);
  seg(x + Math.floor(w * 0.42), y + Math.floor(h * 0.70), x + w - 10, y + Math.floor(h * 0.62), [52, 52, 56], 10);
  seg(x + 10, y + h - 12, x + Math.floor(w * 0.42), y + Math.floor(h * 0.70), PAL.white, 2);
  seg(x + Math.floor(w * 0.42), y + Math.floor(h * 0.70), x + w - 10, y + Math.floor(h * 0.62), PAL.white, 2);
  // rail line below the road
  seg(x + 10, y + h - 26, x + Math.floor(w * 0.46), y + Math.floor(h * 0.78), [120, 60, 30], 4);
  seg(x + Math.floor(w * 0.46), y + Math.floor(h * 0.78), x + w - 10, y + Math.floor(h * 0.72), [120, 60, 30], 4);
  // road sign
  const sx = x + Math.floor(w * 0.14), sy = y + Math.floor(h * 0.66);
  vbar(sx, sy, sy + 26, [80, 82, 88], 4);
  box(sx - 18, sy - 22, 40, 24, PAL.navySoft);
  hbar(sx - 18, sx + 21, sy - 22, PAL.white, 2);
  hbar(sx - 18, sx + 21, sy + 1, PAL.white, 2);
  vbar(sx - 18, sy - 22, sy + 1, PAL.white, 2);
  vbar(sx + 21, sy - 22, sy + 1, PAL.white, 2);
  putText(sx - 13, sy - 16, 'TRIPP', 1, PAL.white);
}

// 5. NATO / Poland: a shield over a stylised map, a missile arc
// crossing the sky, allied stars.
function sceneNato(x, y, w, h) {
  box(x, y, w, h, [24, 34, 58]); // dark blue
  // stars
  const stars = [[0.12, 0.16], [0.86, 0.12], [0.78, 0.34], [0.16, 0.40], [0.90, 0.62]];
  for (const [fx, fy] of stars) disc(x + Math.floor(w * fx), y + Math.floor(h * fy), 3, PAL.gold);
  // shield
  const cx = x + Math.floor(w * 0.50), cy = y + Math.floor(h * 0.48);
  tri(cx - 52, cy - 40, cx + 52, cy - 40, cx, cy + 52, [52, 96, 160]);
  box(cx - 52, cy - 40, 104, 22, [52, 96, 160]);
  tri(cx - 40, cy - 28, cx + 40, cy - 28, cx, cy + 40, PAL.white);
  // missile arc with trail
  seg(x + Math.floor(w * 0.10), y + Math.floor(h * 0.30), x + Math.floor(w * 0.40), y + Math.floor(h * 0.14), PAL.orange, 4);
  seg(x + Math.floor(w * 0.40), y + Math.floor(h * 0.14), x + Math.floor(w * 0.62), y + Math.floor(h * 0.26), PAL.orange, 4);
  tri(x + Math.floor(w * 0.62), y + Math.floor(h * 0.26), x + Math.floor(w * 0.72), y + Math.floor(h * 0.20), x + Math.floor(w * 0.66), y + Math.floor(h * 0.34), [220, 222, 226]);
  disc(x + Math.floor(w * 0.10), y + Math.floor(h * 0.30), 5, PAL.yellow);
  // map pin
  const px = x + Math.floor(w * 0.76), py = y + Math.floor(h * 0.72);
  disc(px, py, 12, PAL.red);
  disc(px, py, 5, PAL.white);
  seg(px, py + 10, px, py + 22, PAL.red, 3);
}

// 6. Markets: a chart panel with a steep falling line, a big red
// arrow down, and a small green uptick that fails to hold.
function sceneMarkets(x, y, w, h) {
  box(x, y, w, h, [238, 240, 244]); // pale chart board
  // grid
  for (let i = 1; i < 4; i++) hbar(x + 12, x + w - 12, y + Math.floor(h * i / 4), PAL.edge, 1);
  for (let i = 1; i < 5; i++) vbar(x + Math.floor(w * i / 5), y + 10, y + h - 10, PAL.edge, 1);
  // falling line: high left, low right
  const pts = [
    [0.06, 0.22], [0.20, 0.30], [0.30, 0.24], [0.44, 0.44],
    [0.58, 0.40], [0.70, 0.58], [0.82, 0.72], [0.94, 0.84],
  ];
  for (let i = 0; i < pts.length - 1; i++)
    seg(x + Math.floor(w * pts[i][0]), y + Math.floor(h * pts[i][1]),
        x + Math.floor(w * pts[i + 1][0]), y + Math.floor(h * pts[i + 1][1]), PAL.red, 5);
  for (const [fx, fy] of pts) disc(x + Math.floor(w * fx), y + Math.floor(h * fy), 4, PAL.red);
  // big down arrow
  const ax = x + Math.floor(w * 0.74), ay = y + Math.floor(h * 0.30);
  seg(ax, ay, ax, ay + 52, PAL.red, 8);
  tri(ax - 16, ay + 40, ax + 16, ay + 40, ax, ay + 72, PAL.red);
  // red "-3%" tag
  box(x + Math.floor(w * 0.08), y + Math.floor(h * 0.74), 64, 26, PAL.red);
  putText(x + Math.floor(w * 0.08) + 8, y + Math.floor(h * 0.74) + 6, '-3%', 2, PAL.white);
}

// ------------------------------------------------------------------ layout
paintAll(PAL.paper);

// Header band
box(0, 0, W, 150, PAL.navy);
box(0, 150, W, 4, PAL.gold);
putCentred(W / 2, 20, 'THE WORLD IN ONE PICTURE', 4, PAL.white);
putCentred(W / 2, 66, 'MONDAY 23 NOVEMBER 2026', 3, PAL.gold);
putCentred(W / 2, 112, "THE DAY'S NEWS, IN SIX STORIES", 2, [198, 206, 222]);

const panels = [
  {
    kicker: 'GULF - IRAN', kickCol: PAL.teal,
    head: 'IRAN VOWS TO FIGHT US NAVAL BLOCKADE',
    body: "Tehran says it will use 'all available tools' as 14 tankers gather at Kharg Island. Trump dares Iran to test the blockade.",
    scene: sceneBlockade,
  },
  {
    kicker: 'LIBYA - BENGHAZI', kickCol: PAL.navySoft,
    head: 'UKRAINE SINKS RUSSIAN WARSHIP IN LIBYA',
    body: 'Seven sea drones sink the corvette Merkury in Benghazi and hit the cargo ship MV Angara, Kyiv says.',
    scene: sceneLibya,
  },
  {
    kicker: 'UKRAINE - DYMER', kickCol: PAL.red,
    head: 'RUSSIAN STRIKE KILLS 11 IN DYMER',
    body: 'A Russian strike hits an apartment block near Kyiv. Rescuers pull an 11th body from the rubble.',
    scene: sceneDymer,
  },
  {
    kicker: 'ARMENIA - SYUNIK', kickCol: PAL.green,
    head: "ARMENIA LAUNCHES THE 'TRUMP ROUTE'",
    body: 'Work begins on the TRIPP corridor linking Azerbaijan to Nakhchivan. A US-backed development company is formed.',
    scene: sceneTripp,
  },
  {
    kicker: 'BRUSSELS - NATO', kickCol: PAL.navy,
    head: 'NATO MEETS OVER MISSILES IN POLAND',
    body: 'Allies gather in Brussels after Russian objects entered Polish airspace. A recovered Kh-101 was built this fall.',
    scene: sceneNato,
  },
  {
    kicker: 'MARKETS - GLOBAL', kickCol: [120, 32, 32],
    head: 'AI SELLOFF DRAGS MARKETS DOWN',
    body: "The S&P 500 slides into correction and the Nasdaq turns negative for the year. Seoul's KOSPI falls 3%.",
    scene: sceneMarkets,
  },
];

const M = 14, GAP = 10;
const PW = Math.floor((W - M * 2 - GAP * 2) / 3); // 325
const PH = 400;
const TOP = 164;
for (let i = 0; i < panels.length; i++) {
  const col = i % 3, row = Math.floor(i / 3);
  const x0 = M + col * (PW + GAP);
  const y0 = TOP + row * (PH + GAP);
  const p = panels[i];
  box(x0, y0, PW, PH, PAL.card);
  hbar(x0, x0 + PW - 1, y0, PAL.grey, 2);
  hbar(x0, x0 + PW - 1, y0 + PH - 1, PAL.grey, 2);
  vbar(x0, y0, y0 + PH - 1, PAL.grey, 2);
  vbar(x0 + PW - 1, y0, y0 + PH - 1, PAL.grey, 2);
  box(x0 + 2, y0 + 2, PW - 4, 28, p.kickCol);
  putText(x0 + 12, y0 + 10, p.kicker, 2, PAL.white);
  const picY = y0 + 32, picH = 170;
  p.scene(x0 + 2, picY, PW - 4, picH);
  let ty = picY + picH + 12;
  for (const ln of wrapText(p.head, 2, PW - 24)) {
    putText(x0 + 12, ty, ln, 2, PAL.ink);
    ty += 19;
  }
  ty += 4;
  hbar(x0 + 12, x0 + PW - 12, ty, PAL.gold, 3);
  ty += 12;
  for (const ln of wrapText(p.body, 2, PW - 24)) {
    putText(x0 + 12, ty, ln, 2, PAL.body);
    ty += 19;
  }
}

// Footer
putCentred(W / 2, 988, 'SOURCES: REUTERS, AP, CNN, BBC, ANADOLU, RIA NOVOSTI - REPORTED 23 NOVEMBER 2026', 2, PAL.grey);

// ------------------------------------------------------------------ PNG encode
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}
function crc32(data) {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0; // filter: none
  raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type RGB
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', deflateSync(raw, { level: 9 })),
  pngChunk('IEND', Buffer.alloc(0)),
]);
writeFileSync(new URL('./entry.png', import.meta.url), png);
console.log('entry.png', png.length, 'bytes,', W + 'x' + H);

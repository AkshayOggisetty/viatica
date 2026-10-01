// Minimal QR encoder — byte mode, error-correction level M, versions 1–13.
// Written from the ISO/IEC 18004 tables so the ticket QR on screen is a real,
// scannable code rather than a decorative grid.

// Error-correction level M is encoded as 0b00 in the format information.
const EC_LEVEL_M = 0b00;

// [totalCodewords, ecPerBlock, [ [blocks, dataCodewords], ... ] ] for level M
const VERSIONS = {
  1:  [26,  10, [[1,16]]],
  2:  [44,  16, [[1,28]]],
  3:  [70,  26, [[1,44]]],
  4:  [100, 18, [[2,32]]],
  5:  [134, 24, [[2,43]]],
  6:  [172, 16, [[4,27]]],
  7:  [196, 18, [[4,31]]],
  8:  [242, 22, [[2,38],[2,39]]],
  9:  [292, 22, [[3,36],[2,37]]],
  10: [346, 26, [[4,43],[1,44]]],
  11: [404, 30, [[1,50],[4,51]]],
  12: [466, 22, [[6,36],[2,37]]],
  13: [532, 22, [[8,37],[1,38]]],
};

const ALIGN = {
  1:[], 2:[6,18], 3:[6,22], 4:[6,26], 5:[6,30], 6:[6,34], 7:[6,22,38],
  8:[6,24,42], 9:[6,26,46], 10:[6,28,50], 11:[6,30,54], 12:[6,32,58], 13:[6,34,62],
};

// Format information strings for EC level M, masks 0–7.
// Format info: 5 data bits (EC level + mask) + 10 BCH bits, XOR 0x5412.
// Computed rather than tabulated so the bit order cannot drift.
function bch(value, poly, bits) {
  let v = value << bits;
  const deg = poly.toString(2).length - 1;
  for (let i = v.toString(2).length - 1; i >= deg; i--)
    if ((v >> i) & 1) v ^= poly << (i - deg);
  return v;
}
function formatBits(ecLevelBits, mask) {
  const data = (ecLevelBits << 3) | mask;
  return ((data << 10) | bch(data, 0b10100110111, 10)) ^ 0b101010000010010;
}
// Version info: 6 data bits + 12 BCH bits (versions 7+).
function versionBits(version) {
  return (version << 12) | bch(version, 0b1111100100101, 12);
}

// ── GF(256) ────────────────────────────────────────────────────────────────
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const gmul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

function generatorPoly(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) {
      next[j] ^= gmul(g[j], 1);
      next[j + 1] ^= gmul(g[j], EXP[i]);
    }
    g = next;
  }
  return g;
}

function rsEncode(data, ecLen) {
  const gen = generatorPoly(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const d of data) {
    const factor = d ^ res[0];
    res.shift(); res.push(0);
    for (let i = 0; i < ecLen; i++) res[i] ^= gmul(gen[i + 1], factor);
  }
  return res;
}

// ── Bit stream ─────────────────────────────────────────────────────────────
class Bits {
  constructor() { this.v = []; }
  push(val, len) { for (let i = len - 1; i >= 0; i--) this.v.push((val >> i) & 1); }
  get length() { return this.v.length; }
}

function pickVersion(byteLen) {
  for (let v = 1; v <= 13; v++) {
    const [total, ecPer, groups] = VERSIONS[v];
    const dataCw = groups.reduce((s, [b, d]) => s + b * d, 0);
    const countBits = v <= 9 ? 8 : 16;
    const needed = Math.ceil((4 + countBits + byteLen * 8) / 8);
    if (needed <= dataCw) return v;
  }
  throw new Error('QR payload too large for this encoder (max ~331 bytes)');
}

function buildCodewords(bytes, version) {
  const [, ecPer, groups] = VERSIONS[version];
  const dataCw = groups.reduce((s, [b, d]) => s + b * d, 0);
  const countBits = version <= 9 ? 8 : 16;

  const bs = new Bits();
  bs.push(0b0100, 4);              // byte mode
  bs.push(bytes.length, countBits);
  for (const b of bytes) bs.push(b, 8);

  const cap = dataCw * 8;
  bs.push(0, Math.min(4, cap - bs.length));           // terminator
  while (bs.length % 8) bs.v.push(0);                 // byte align
  const pads = [0xec, 0x11];
  for (let i = 0; bs.length < cap; i++) bs.push(pads[i % 2], 8);

  const cw = [];
  for (let i = 0; i < bs.length; i += 8) {
    let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bs.v[i + j];
    cw.push(b);
  }

  // Split into blocks, compute EC, then interleave.
  const blocks = [];
  let idx = 0;
  for (const [count, dLen] of groups) {
    for (let i = 0; i < count; i++) {
      const d = cw.slice(idx, idx + dLen); idx += dLen;
      blocks.push({ d, e: rsEncode(d, ecPer) });
    }
  }
  const out = [];
  const maxD = Math.max(...blocks.map(b => b.d.length));
  for (let i = 0; i < maxD; i++) for (const b of blocks) if (i < b.d.length) out.push(b.d[i]);
  for (let i = 0; i < ecPer; i++) for (const b of blocks) out.push(b.e[i]);
  return out;
}

// ── Matrix ─────────────────────────────────────────────────────────────────
function newMatrix(size) {
  return { size, m: Array.from({length:size},()=>new Array(size).fill(null)),
           r: Array.from({length:size},()=>new Array(size).fill(false)) };
}
const setF = (M, x, y, v) => { M.m[y][x] = v ? 1 : 0; M.r[y][x] = true; };

function placeFunction(M, version) {
  const n = M.size;
  const finder = (ox, oy) => {
    for (let dy = -1; dy <= 7; dy++) for (let dx = -1; dx <= 7; dx++) {
      const x = ox + dx, y = oy + dy;
      if (x < 0 || y < 0 || x >= n || y >= n) continue;
      const inRing = (dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6);
      const dark = inRing && ((dx===0||dx===6||dy===0||dy===6) ||
                              (dx>=2&&dx<=4&&dy>=2&&dy<=4));
      setF(M, x, y, dark);
    }
  };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);

  for (let i = 8; i < n - 8; i++) { setF(M, i, 6, i % 2 === 0); setF(M, 6, i, i % 2 === 0); }

  const centres = ALIGN[version];
  for (const cy of centres) for (const cx of centres) {
    if ((cx <= 8 && cy <= 8) || (cx >= n - 9 && cy <= 8) || (cx <= 8 && cy >= n - 9)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
      setF(M, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }

  setF(M, 8, n - 8, true);                                   // dark module
  // Reserve format areas
  for (let i = 0; i < 9; i++) { if (M.m[8][i] === null) setF(M, i, 8, false);
                                if (M.m[i][8] === null) setF(M, 8, i, false); }
  for (let i = 0; i < 8; i++) { setF(M, n - 1 - i, 8, false); if (M.m[n-1-i][8] === null) setF(M, 8, n - 1 - i, false); }

  if (version >= 7) {
    const vi = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((vi >> i) & 1) === 1;      // bit 0 is the LSB
      const a = Math.floor(i / 3), b = i % 3;
      setF(M, a, n - 11 + b, bit);
      setF(M, n - 11 + b, a, bit);
    }
  }
}

function placeData(M, codewords) {
  const n = M.size;
  let bit = 0;
  const total = codewords.length * 8;
  const nextBit = () => {
    if (bit >= total) return 0;
    const v = (codewords[bit >> 3] >> (7 - (bit & 7))) & 1;
    bit++; return v;
  };
  let up = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col--;                     // skip the vertical timing column
    for (let i = 0; i < n; i++) {
      const y = up ? n - 1 - i : i;
      for (const x of [col, col - 1]) {
        if (M.r[y][x]) continue;
        M.m[y][x] = nextBit();
      }
    }
    up = !up;
  }
}

const MASKS = [
  (x,y)=> (y + x) % 2 === 0,
  (x,y)=> y % 2 === 0,
  (x,y)=> x % 3 === 0,
  (x,y)=> (y + x) % 3 === 0,
  (x,y)=> (Math.floor(y/2) + Math.floor(x/3)) % 2 === 0,
  (x,y)=> ((y*x) % 2) + ((y*x) % 3) === 0,
  (x,y)=> (((y*x) % 2) + ((y*x) % 3)) % 2 === 0,
  (x,y)=> (((y+x) % 2) + ((y*x) % 3)) % 2 === 0,
];

function applyMask(M, k) {
  const out = { size:M.size, m:M.m.map(r=>[...r]), r:M.r };
  for (let y = 0; y < M.size; y++) for (let x = 0; x < M.size; x++)
    if (!M.r[y][x] && MASKS[k](x, y)) out.m[y][x] ^= 1;
  return out;
}

function placeFormat(M, mask) {
  const n = M.size, f = formatBits(EC_LEVEL_M, mask);
  const bit = i => (f >> i) & 1;                  // bit 0 is the LSB
  const put = (row, col, v) => { M.m[row][col] = v; };

  // First copy — around the top-left finder.
  for (let i = 0; i <= 5; i++) put(i, 8, bit(i));
  put(7, 8, bit(6));
  put(8, 8, bit(7));
  put(8, 7, bit(8));
  for (let i = 9; i < 15; i++) put(8, 14 - i, bit(i));

  // Second copy — split between the top-right and bottom-left finders.
  for (let i = 0; i < 8; i++)  put(8, n - 1 - i, bit(i));
  for (let i = 8; i < 15; i++) put(n - 15 + i, 8, bit(i));

  put(n - 8, 8, 1);                               // the dark module
}

function penalty(M) {
  const n = M.size, g = M.m;
  let p = 0;
  const run = (get) => {
    for (let a = 0; a < n; a++) {
      let last = -1, len = 0;
      for (let b = 0; b < n; b++) {
        const v = get(a, b);
        if (v === last) { len++; if (len === 5) p += 3; else if (len > 5) p += 1; }
        else { last = v; len = 1; }
      }
    }
  };
  run((a,b)=>g[a][b]); run((a,b)=>g[b][a]);
  for (let y = 0; y < n-1; y++) for (let x = 0; x < n-1; x++)
    if (g[y][x] === g[y][x+1] && g[y][x] === g[y+1][x] && g[y][x] === g[y+1][x+1]) p += 3;
  const pat = [1,0,1,1,1,0,1,0,0,0,0], pat2 = [0,0,0,0,1,0,1,1,1,0,1];
  const scan = (get) => {
    for (let a = 0; a < n; a++) for (let b = 0; b <= n - 11; b++) {
      let m1 = true, m2 = true;
      for (let k = 0; k < 11; k++) { const v = get(a, b+k); if (v !== pat[k]) m1 = false; if (v !== pat2[k]) m2 = false; }
      if (m1) p += 40; if (m2) p += 40;
    }
  };
  scan((a,b)=>g[a][b]); scan((a,b)=>g[b][a]);
  let dark = 0; for (let y=0;y<n;y++) for (let x=0;x<n;x++) dark += g[y][x];
  p += Math.floor(Math.abs(dark * 100 / (n*n) - 50) / 5) * 10;
  return p;
}

/** Encode a string to a boolean module matrix. */
export function encodeQR(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const version = pickVersion(bytes.length);
  const size = 17 + version * 4;
  const cw = buildCodewords(bytes, version);

  const base = newMatrix(size);
  placeFunction(base, version);
  placeData(base, cw);

  let best = null;
  for (let k = 0; k < 8; k++) {
    const cand = applyMask(base, k);
    placeFormat(cand, k);
    const p = penalty(cand);
    if (!best || p < best.p) best = { p, k, m: cand.m };
  }
  return { size, version, mask: best.k, modules: best.m.map(r => r.map(v => !!v)) };
}

/** Render a matrix into an SVG path string (one path, all dark modules). */
export function qrPath(modules, unit = 1) {
  let d = '';
  for (let y = 0; y < modules.length; y++)
    for (let x = 0; x < modules.length; x++)
      if (modules[y][x]) d += `M${x*unit} ${y*unit}h${unit}v${unit}h-${unit}z`;
  return d;
}

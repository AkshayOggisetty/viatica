// Travel matrix + multi-modal comparison. SIMULATED figures, tuned to be
// plausible for the seeded corridor. Fare bands are what the traveller is
// shown BEFORE agreeing a price.

import { byId } from './places.js';

export const MODES = {
  walk:  { label:'Walk',       icon:'walk',  kmph:4.5,  perKm:0,    co2:0,     base:0,   maxKm:4,   book:false, note:'Folded into timing' },
  auto:  { label:'Auto',       icon:'auto',  kmph:22,   perKm:16,   co2:70,    base:30,  maxKm:25,  book:false, note:'Meter + fare band' },
  cab:   { label:'Cab',        icon:'cab',   kmph:42,   perKm:14,   co2:118,   base:60,  maxKm:600, book:true,  note:'Private, door to door' },
  bus:   { label:'Bus',        icon:'bus',   kmph:34,   perKm:1.6,  co2:28,    base:15,  maxKm:900, book:true,  note:'KSRTC / state transport' },
  train: { label:'Train',      icon:'train', kmph:52,   perKm:0.75, co2:14,    base:40,  maxKm:2200,book:true,  note:'Sleeper / chair car' },
  ferry: { label:'Ferry',      icon:'ferry', kmph:18,   perKm:5,    co2:42,    base:40,  maxKm:60,  book:true,  note:'Where water is the road' },
  flight:{ label:'Flight',     icon:'plane', kmph:520,  perKm:5.2,  co2:158,   base:1400,maxKm:4000,book:true,  note:'Adds 150 min ground time' },
};

export const R = 6371;
export function haversine(a, b) {
  const t = Math.PI / 180;
  const dLat = (b.lat - a.lat) * t, dLon = (b.lon - a.lon) * t;
  const s = Math.sin(dLat/2)**2 +
            Math.cos(a.lat*t) * Math.cos(b.lat*t) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Road distance is longer than crow-flight; hillier corridors more so.
function roadFactor(a, b) {
  const hilly = ['Himachal Pradesh','Uttarakhand','Ladakh','Sikkim','Jammu and Kashmir','Meghalaya','Kerala'];
  const h = hilly.includes(a.state) || hilly.includes(b.state);
  return h ? 1.62 : 1.28;
}

// Manually verified legs in the seeded corridor override the estimate.
// [from, to] -> { km, modes: { mode: minutes } }
export const VERIFIED = {
  'blr|hampi':        { km: 340, modes:{ bus: 435, train: 480, cab: 390 } },
  'hampi|badami':     { km: 140, modes:{ bus: 210, cab: 165 } },
  'badami|pattadakal':{ km: 22,  modes:{ bus: 45,  cab: 32,  auto: 40 } },
  'pattadakal|aihole':{ km: 14,  modes:{ bus: 30,  cab: 22,  auto: 28 } },
  'hampi|mysuru':     { km: 400, modes:{ bus: 510, train: 555, cab: 445 } },
  'blr|mysuru':       { km: 145, modes:{ train: 125, bus: 190, cab: 165 } },
  'mysuru|madikeri':  { km: 120, modes:{ bus: 180, cab: 150 } },
  'mysuru|bandipur':  { km: 80,  modes:{ bus: 135, cab: 105 } },
  'mysuru|srirangapatna': { km: 18, modes:{ bus: 35, cab: 25, auto: 32 } },
  'mysuru|chamundi':  { km: 13,  modes:{ bus: 32,  cab: 24,  auto: 30 } },
  'blr|nandi':        { km: 61,  modes:{ bus: 110, cab: 80 } },
  'blr|lalbagh':      { km: 5,   modes:{ auto: 18, cab: 16, bus: 26, walk: 62 } },
  'hampi|virupaksha': { km: 1.2, modes:{ walk: 16, auto: 6 } },
  'hampi|vittala':    { km: 2.6, modes:{ walk: 34, auto: 10 } },
  'hampi|matanga':    { km: 1.0, modes:{ walk: 14 } },
  'hampi|anegundi':   { km: 7,   modes:{ ferry: 22, auto: 26 } },
  'hampi|tbdam':      { km: 18,  modes:{ bus: 40, auto: 34, cab: 26 } },
  'blr|udupi':        { km: 405, modes:{ bus: 480, train: 525, cab: 450 } },
  'udupi|malpe':      { km: 6,   modes:{ auto: 15, bus: 24, cab: 13 } },
  'udupi|gokarna':    { km: 200, modes:{ bus: 270, train: 240, cab: 225 } },
  'gokarna|jog':      { km: 130, modes:{ bus: 210, cab: 165 } },
  'belur|halebidu':   { km: 16,  modes:{ bus: 30, cab: 24, auto: 30 } },
  'blr|belur':        { km: 220, modes:{ bus: 300, cab: 255 } },
  'blr|shravana':     { km: 145, modes:{ bus: 205, cab: 170 } },
  'madikeri|dubare':  { km: 30,  modes:{ bus: 60, cab: 45 } },
};

const key = (a,b) => a < b ? `${a}|${b}` : `${b}|${a}`;

export function distanceKm(aId, bId) {
  const v = VERIFIED[key(aId,bId)];
  if (v) return v.km;
  const a = byId[aId], b = byId[bId];
  return Math.round(haversine(a,b) * roadFactor(a,b));
}

// Deterministic pseudo-random so the demo is identical every run.
function jitter(seedStr, spread) {
  let h = 2166136261;
  for (let i=0;i<seedStr.length;i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000 * spread - spread/2;
}

export function legOptions(aId, bId) {
  const a = byId[aId], b = byId[bId];
  const km = distanceKm(aId, bId);
  const v = VERIFIED[key(aId,bId)];
  const out = [];
  for (const [id, m] of Object.entries(MODES)) {
    if (km > m.maxKm) continue;
    if (id === 'flight' && km < 450) continue;
    if (id === 'ferry' && !(v && v.modes.ferry)) continue;
    // Rail only where a line is actually seeded, or over long inter-city hops.
    if (id === 'train' && !(v && v.modes.train) && km < 200) continue;
    if (id === 'bus' && km > 700 && !(v && v.modes.bus)) continue;

    let mins = v && v.modes[id]
      ? v.modes[id]
      : Math.round(km / m.kmph * 60 + (id === 'flight' ? 150 : id === 'train' ? 35 : id === 'bus' ? 20 : 5));
    let cost = Math.round(m.base + km * m.perKm);
    if (id === 'bus' || id === 'train') cost = Math.max(cost, 20);

    const spread = id === 'auto' || id === 'cab' ? 0.34 : 0.14;
    const band = [Math.round(cost * (1 - spread/2)), Math.round(cost * (1 + spread/2))];
    const co2 = +(km * m.co2 / 1000).toFixed(1);
    const crowd = Math.min(.95, Math.max(.1,
      (id==='train'?.62:id==='bus'?.55:id==='cab'?.2:id==='auto'?.25:.35) + jitter(aId+bId+id, .3)));

    out.push({
      mode: id, label: m.label, icon: m.icon, km, mins, cost,
      band, co2, crowd, book: m.book, note: m.note,
      verified: !!(v && v.modes[id]),
      // Overcharge risk: how far a tout could push above the honest band.
      touts: (id==='auto'||id==='cab') ? Math.round(band[1] * 1.85) : null,
    });
  }
  // Rank: a blend the platform is explicit about — time, then cost, then carbon.
  out.forEach(o => {
    const tN = o.mins / Math.max(...out.map(x=>x.mins));
    const cN = o.cost / Math.max(...out.map(x=>x.cost), 1);
    const eN = o.co2  / Math.max(...out.map(x=>x.co2), .1);
    o.score = 1 - (tN*0.45 + cN*0.35 + eN*0.20);
  });
  return out.sort((x,y) => y.score - x.score);
}

export function bestLeg(aId, bId, prefer='balanced') {
  const opts = legOptions(aId, bId);
  if (!opts.length) return null;
  if (prefer === 'cheap')  return [...opts].sort((a,b)=>a.cost-b.cost)[0];
  if (prefer === 'fast')   return [...opts].sort((a,b)=>a.mins-b.mins)[0];
  if (prefer === 'green')  return [...opts].sort((a,b)=>a.co2-b.co2)[0];
  return opts[0];
}

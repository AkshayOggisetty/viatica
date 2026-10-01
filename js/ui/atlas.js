// The atlas plate. Draws India as an illustrated sheet and makes it navigable
// at three depths: country → state → destination.

import { INDIA } from '../data/india-geo.js';
import { RIVERS, RANGES, ANNOTATIONS, NEIGHBOUR_LABELS } from '../data/geography.js';
import { PLACES, byId, STATE_CHAR, STATE_SCRIPT, KINDS } from '../data/places.js';
import { GLYPHS, compassRose } from './glyphs.js';
import { state, ACTIONS } from '../core/store.js';
import { toHM } from '../core/scheduler.js';

const { proj } = INDIA;
const COS = Math.cos(proj.lat0 * Math.PI / 180);
export const project = (lat, lon) => [
  (lon * COS - proj.x0) * proj.sc,
  (proj.maxy - lat) * proj.sc,
];

const W = INDIA.width, H = INDIA.height;

// Which visual character each state carries.
const PALETTE = {
  'Rajasthan':'desert','Gujarat':'desert','Ladakh':'alpine','Jammu and Kashmir':'alpine',
  'Himachal Pradesh':'alpine','Uttarakhand':'alpine','Sikkim':'alpine','Arunachal Pradesh':'alpine',
  'Kerala':'green','Karnataka':'stone','Goa':'coast','Tamil Nadu':'stone','Andhra Pradesh':'coast',
  'Telangana':'stone','Maharashtra':'stone','Madhya Pradesh':'sand','Chhattisgarh':'green',
  'West Bengal':'delta','Odisha':'delta','Assam':'delta','Bihar':'delta','Jharkhand':'green',
  'Uttar Pradesh':'sand','Punjab':'sand','Haryana':'sand','Delhi':'sand',
  'Meghalaya':'green','Manipur':'green','Mizoram':'green','Nagaland':'green','Tripura':'green',
  'Andaman and Nicobar Islands':'coast','Lakshadweep':'coast','Puducherry':'coast',
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pathFrom = pts => pts.map((p,i) => {
  const [x,y] = project(p[0], p[1]);
  return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
}).join('');

/** Smooth a polyline into a Catmull-Rom flavoured curve so rivers look drawn. */
function curve(pts) {
  const P = pts.map(p => project(p[0], p[1]));
  if (P.length < 3) return P.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join('');
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i-1] || P[i], p1 = P[i], p2 = P[i+1], p3 = P[i+2] || P[i+1];
    const c1 = [p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6];
    const c2 = [p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/** Engraved peak forms along a range spine. */
function hachures(range) {
  const P = range.pts.map(p => project(p[0], p[1]));
  let d = '';
  for (let i = 0; i < P.length - 1; i++) {
    const [x1,y1] = P[i], [x2,y2] = P[i+1];
    const len = Math.hypot(x2-x1, y2-y1);
    const n = Math.max(2, Math.round(len / 8));
    for (let k = 0; k < n; k++) {
      const t = (k + .5) / n;
      const x = x1 + (x2-x1)*t, y = y1 + (y2-y1)*t;
      const h = (5 + (k % 3) * 2.2) * range.h;
      const w = h * 0.85;
      d += `M${(x-w).toFixed(1)} ${(y+h*0.34).toFixed(1)}L${x.toFixed(1)} ${(y-h).toFixed(1)}L${(x+w).toFixed(1)} ${(y+h*0.34).toFixed(1)}`;
    }
  }
  return d;
}

const glyphFor = p => GLYPHS[p.glyph] ? p.glyph : 'temple';

function destNode(p, opts = {}) {
  const [x, y] = project(p.lat, p.lon);
  const s = opts.scale ?? 1;
  const r = 8.4 * s;
  const g = 0.62 * s;
  return `
  <g class="dest ${opts.cls||''}" data-place="${p.id}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
    <g class="dest-box">
      <circle class="dest-disc" r="${r.toFixed(1)}"/>
      <g transform="translate(${(-12*g).toFixed(2)},${(-12*g).toFixed(2)}) scale(${g.toFixed(3)})">
        <path class="dest-glyph" d="${GLYPHS[glyphFor(p)]}"/>
      </g>
    </g>
    <rect class="dest-label-bg" x="${(-46*s).toFixed(1)}" y="${(r+2).toFixed(1)}" width="${(92*s).toFixed(1)}" height="${(p.script?20:11)*s}" rx="2"/>
    <text class="dest-label" y="${(r+10.5*s).toFixed(1)}" style="font-size:${(8.5*s).toFixed(1)}px">${esc(p.name)}</text>
    ${p.script ? `<text class="dest-label dest-label-sc" y="${(r+19*s).toFixed(1)}" style="font-size:${(7.5*s).toFixed(1)}px">${esc(p.script)}</text>` : ''}
  </g>`;
}

// ── Layers ────────────────────────────────────────────────────────────────

function defs() {
  return `<defs>
    <filter id="inkWobble" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.026" numOctaves="3" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.7" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="coastWobble" x="-4%" y="-4%" width="108%" height="108%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <pattern id="stipple" width="7" height="7" patternUnits="userSpaceOnUse">
      <circle cx="1.6" cy="1.6" r=".52" fill="#8c7859" opacity=".8"/>
      <circle cx="5.2" cy="4.4" r=".52" fill="#8c7859" opacity=".8"/>
    </pattern>
    <radialGradient id="glowSel">
      <stop offset="0%" stop-color="#fff6e2" stop-opacity=".85"/>
      <stop offset="100%" stop-color="#fff6e2" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

function seaLayer() {
  const halos = [3,2,1].map(i =>
    `<path class="coast-halo${i>1?' h'+i:''}" d="${INDIA.outline}"/>`).join('');
  return `<g class="layer-sea">
    <rect x="-4000" y="-4000" width="${W+8000}" height="${H+8000}" class="sea-fill"/>
    <g filter="url(#coastWobble)">${halos}</g>
  </g>`;
}

function neighbourLayer(z = 1) {
  return `<g class="layer-neigh">${NEIGHBOUR_LABELS.map(n => {
    const [x,y] = project(n.at[0], n.at[1]);
    return `<text class="neighbour-label" x="${x.toFixed(1)}" y="${y.toFixed(1)}"
      style="font-size:${(8/z).toFixed(2)}px;letter-spacing:${(0.24*8/z).toFixed(2)}px">${esc(n.t)}</text>`;
  }).join('')}</g>`;
}

function statesLayer(scope) {
  return `<g class="layer-states" filter="url(#coastWobble)">
    <path class="land-mass" d="${INDIA.outline}"/>
    ${INDIA.states.map(s => `
      <g class="state${scope ? (s.name === scope ? ' active' : ' dim') : ''}"
         data-state="${esc(s.name)}" data-pal="${PALETTE[s.name]||'stone'}">
        <path class="state-fill" d="${s.d}"/>
      </g>`).join('')}
  </g>`;
}

function stateNamesLayer(z = 1) {
  return `<g class="layer-statenames">${INDIA.states.map(s => {
    if (!STATE_CHAR[s.name]) return '';
    const short = s.name.length > 18 ? s.name.split(' ')[0] : s.name;
    return `<text class="state-name" x="${s.c[0]}" y="${s.c[1]}"
      style="font-size:${(10.2/z).toFixed(2)}px;letter-spacing:${(0.17*10.2/z).toFixed(2)}px">${esc(short)}</text>`;
  }).join('')}</g>`;
}

function geographyLayer() {
  const rivers = RIVERS.map(r => {
    const d = curve(r.pts);
    // Widened for projection — a 1px hair disappears past the third row.
    return `<path class="river" d="${d}" style="stroke-width:${(r.w * 1.45).toFixed(2)}"/>
            <path class="river-shimmer" d="${d}" style="stroke-width:${(r.w * 0.85).toFixed(2)};animation-delay:${(r.name.length%7)*1.7}s"/>`;
  }).join('');
  const ranges = RANGES.map(r =>
    `<path class="hatch" d="${hachures(r)}"/>`).join('');
  const thar = (() => {
    const [x,y] = project(27.2, 71.2);
    return `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="52" ry="72" fill="url(#stipple)" opacity=".8" transform="rotate(-14 ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
  })();
  return `<g class="layer-geo">${thar}${ranges}${rivers}</g>`;
}

function annotationLayer(z = 1) {
  return `<g class="layer-annot">${ANNOTATIONS.map(a => {
    const [x,y] = project(a.at[0], a.at[1]);
    return `<text class="annot${a.sea?' sea':''}" x="${x.toFixed(1)}" y="${y.toFixed(1)}"
      style="font-size:${(a.size * 1.14 / z).toFixed(2)}px;letter-spacing:${(a.sp * 1.14 / z).toFixed(2)}px"
      transform="rotate(${a.rot} ${x.toFixed(1)} ${y.toFixed(1)})">${esc(a.t)}</text>`;
  }).join('')}</g>`;
}

function destLayer(scope, routeIds = new Set(), z = 1) {
  // At country level the sheet would be unreadable with all 92 marks, so it
  // carries the strongest destinations plus anything on the traveller's route.
  const list = scope
    ? PLACES.filter(p => p.state === scope)
    : PLACES.filter(p => p.rating >= 4.6 || routeIds.has(p.id));
  // Markers keep a constant size on screen, so a zoomed sheet gains detail,
  // not bulk. Sized for a projector rather than a laptop at arm's length.
  const scale = (scope ? 1.45 : 1.22) / z;

  // A printed sheet does not stack six names on one another. Lay labels out
  // greedily by rating and suppress any that would collide; those still name
  // themselves on hover.
  const taken = [];
  const w = 92 * scale, h = (scope ? 21 : 12) * scale, r = 8.4 * scale;
  const ordered = [...list].sort((a, b) => b.rating - a.rating);
  const labelled = new Set();
  for (const p of ordered) {
    const [x, y] = project(p.lat, p.lon);
    const box = [x - w/2, y + r, x + w/2, y + r + h];
    if (taken.some(t => box[0] < t[2] && box[2] > t[0] && box[1] < t[3] && box[3] > t[1])) continue;
    taken.push(box);
    labelled.add(p.id);
  }
  return `<g class="layer-dest">${list.map(p =>
    destNode(p, { scale, cls: labelled.has(p.id) ? '' : 'no-label' })).join('')}</g>`;
}

function zoneLayer(zones) {
  if (!zones?.length) return '';
  return `<g class="layer-zone">${zones.map(z => {
    const [x,y] = project(z.at[0], z.at[1]);
    const r = z.r * 1000 / 111000 * proj.sc;
    return `<circle class="zone ${z.level==='watch'?'watch':''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(6,r).toFixed(1)}"/>`;
  }).join('')}</g>`;
}

/** The traveller's route, drawn as an ink line with annotations. */
function routeLayer(trip, z = 1) {
  if (!trip) return '';
  const seq = [];
  trip.plan.forEach(d => {
    if (!seq.length && d.anchor) seq.push({ id: d.anchor, day: d.day, anchor: true });
    d.items.forEach(i => {
      if (i.kind === 'travel') seq.push({ id: i.to, day: d.day, leg: i });
    });
  });
  const pts = seq.filter(s => byId[s.id]);
  if (pts.length < 2) return '';

  let d = '', arrows = '', notes = '';
  const XY = pts.map(s => project(byId[s.id].lat, byId[s.id].lon));
  for (let i = 0; i < XY.length; i++) {
    const [x,y] = XY[i];
    if (i === 0) { d += `M${x.toFixed(1)} ${y.toFixed(1)}`; continue; }
    const [px,py] = XY[i-1];
    // a shallow arc so the line reads as drawn rather than plotted
    const mx = (px+x)/2, my = (py+y)/2;
    const nx = -(y-py), ny = (x-px);
    const L = Math.hypot(nx, ny) || 1;
    const bow = Math.min(24, L * 0.13);
    d += `Q${(mx + nx/L*bow).toFixed(1)} ${(my + ny/L*bow).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    const ang = Math.atan2(y-py, x-px) * 180/Math.PI;
    arrows += `<path class="route-arrow" d="M-3.4 -2.6L2.6 0L-3.4 2.6L-1.8 0Z"
                 transform="translate(${mx.toFixed(1)},${my.toFixed(1)}) rotate(${ang.toFixed(0)}) scale(${(1/z).toFixed(3)})"/>`;
    const leg = pts[i].leg;
    if (leg && L > 46) {
      notes += `<text class="route-note" x="${(mx + nx/L*bow).toFixed(1)}" y="${(my + ny/L*bow - 5/z).toFixed(1)}"
                  text-anchor="middle" style="font-size:${(7.5/z).toFixed(2)}px">${leg.label} · ${leg.km} km</text>`;
    }
  }
  const nodes = XY.map(([x,y],i) => {
    const done = trip.frozen.includes(pts[i].id);
    return `<circle class="route-node ${done?'done':''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}"
              r="${((i===0?3.6:2.8)/z).toFixed(2)}" style="stroke-width:${(1.6/z).toFixed(2)}px"/>`;
  }).join('');

  return `<g class="layer-route">
    <path class="route-shadow" d="${d}"/>
    <path class="route-ink route-draw" d="${d}" style="--len:4200"/>
    ${arrows}${nodes}${notes}
  </g>`;
}

function liveLayer(trip, z = 1) {
  if (!trip) return '';
  const day = trip.plan[trip.currentDay - 1];
  const pid = day?.stops?.[0];
  if (!pid || !byId[pid]) return '';
  const [x,y] = project(byId[pid].lat, byId[pid].lon);
  return `<g class="layer-live" transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${(1/z).toFixed(3)})">
    <circle class="live-ring" r="3"/><circle class="live-dot" r="2.6"/></g>`;
}

// ── Component ─────────────────────────────────────────────────────────────

export function renderAtlas(host, opts = {}) {
  const A = state.atlas;
  const trip = opts.trip ?? state.trip;
  const scope = A.state;
  const zoneList = opts.zones ?? (trip?.safety?.zones || []);

  const zoomCls = A.place ? 'zoom-3' : scope ? 'zoom-2' : 'zoom-1';
  const routeIds = new Set(trip ? trip.plan.flatMap(d => d.stops).concat(trip.plan.map(d => d.anchor)) : []);
  const z = scope ? zoomOf(scope) : 1;

  host.innerHTML = `
  <div class="atlas ${zoomCls}">
    <svg class="atlas-svg" viewBox="${INDIA.viewBox}" preserveAspectRatio="xMidYMid meet"
         role="img" aria-label="Illustrated map of India">
      ${defs()}
      <g class="atlas-vp">
        ${seaLayer()}
        ${A.layers.geography ? neighbourLayer(z) : ''}
        ${statesLayer(scope)}
        ${A.layers.geography ? geographyLayer() : ''}
        ${A.layers.culture ? stateNamesLayer(z) : ''}
        ${A.layers.culture ? annotationLayer(z) : ''}
        ${A.layers.journey ? zoneLayer(zoneList) : ''}
        ${A.layers.tourism ? destLayer(scope, routeIds, z) : ''}
        ${A.layers.journey ? routeLayer(trip, z) : ''}
        ${A.layers.journey ? liveLayer(trip, z) : ''}
      </g>
    </svg>

    <div class="atlas-frame">
      ${['tl','tr','bl','br'].map(c =>
        `<svg class="atlas-corner ${c}" viewBox="0 0 30 30"><path d="M2 28V9a7 7 0 017-7h19M6 28V12a6 6 0 016-6h16M2.5 2.5h4v4h-4zM10.5 7.5a2.6 2.6 0 11.01 0"/></svg>`).join('')}
    </div>

    ${scope ? '' : `<div class="atlas-title">
      <h1>Viatica</h1>
      <p>An Atlas of Indian Journeys</p>
    </div>`}

    ${scope ? `<div class="breadcrumb">
      <button class="btn btn-sm btn-ghost" data-nav="india">← All of India</button>
      <span class="label">${esc(scope)}</span>
    </div>` : ''}

    <div class="panel cartouche${scope ? ' on pinned' : ''}" id="cartouche">${
      scope ? stateCartouche(scope) : ''}</div>

    <div class="atlas-tools">
      <div class="panel tool-block">
        <span class="label">Explore</span>
        <div class="lens-grid">
          ${KINDS.map(k => `<button class="chip" data-lens="${k.id}"
             aria-pressed="${A.lens===k.id}">${k.label}</button>`).join('')}
        </div>
      </div>
      <div class="panel tool-block">
        <span class="label">Layers of the sheet</span>
        ${[['geography','Geography'],['culture','Culture'],['tourism','Destinations'],['journey','Your journey']]
          .map(([k,l]) => `<div class="layer-row" data-layer="${k}" aria-pressed="${A.layers[k]}">
            <span>${l}</span><span class="switch"></span></div>`).join('')}
      </div>
    </div>

    <div class="scalebar">
      <span class="label">Scale of the Journey</span>
      <svg viewBox="0 0 172 20" height="20">
        <rect class="bar-b" x="1" y="6" width="170" height="7"/>
        <rect class="bar-a" x="1" y="6" width="42.5" height="7"/>
        <rect class="bar-a" x="86" y="6" width="42.5" height="7"/>
        <text class="bar-t" x="1" y="20">0</text>
        <text class="bar-t" x="86" y="20" id="scaleMid">—</text>
        <text class="bar-t" x="168" y="20" id="scaleEnd">—</text>
      </svg>
    </div>

    <svg class="compass" viewBox="0 0 108 108" id="compass">${compassRose(108)}</svg>
    <div id="destcard-host"></div>
  </div>`;

  wire(host, opts);
  applyLens(host);
  markRoute(host, trip);
  updateScale(host, z);

  // Turn the page: start from wherever the sheet was, then ease to the new frame.
  const vp = host.querySelector('.atlas-vp');
  const from = lastScope ? frameFor(lastScope) : REST();
  const to   = scope ? frameFor(scope) : REST();
  if (vp && from !== to) {
    vp.style.transition = 'none';
    vp.style.transform = from;
    requestAnimationFrame(() => {
      vp.style.transition = '';
      vp.style.transform = to;
      const c = host.querySelector('#compass');
      if (c) c.style.transform = `rotate(${scope ? ((scope.length * 13) % 24) - 12 : 0}deg)`;
    });
  } else if (vp && scope) {
    vp.style.transform = to;
  }
  lastScope = scope;
}

// Resting frame at country level. Read from the stylesheet so the animated
// transform and the CSS default cannot drift apart across breakpoints.
const REST = () => {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--sheet-shift').trim() || '-150px';
  return `translate(${v}, 0)`;
};
let lastScope = null;

/** How much a state's frame magnifies the sheet. */
export function zoomOf(name) {
  const s = INDIA.states.find(x => x.name === name);
  if (!s) return 1;
  const [, , bw, bh] = s.bbox;
  const pad = Math.max(bw, bh) * 0.18;
  return Math.min(W / (bw + pad * 2), H / (bh + pad * 2), 7);
}

/** The viewport transform that frames one state. */
function frameFor(name) {
  const s = INDIA.states.find(x => x.name === name);
  if (!s) return REST();
  const [bx, by, bw, bh] = s.bbox;
  const k = zoomOf(name);
  const cx = bx + bw / 2, cy = by + bh / 2;
  return `translate(${(W/2 - cx*k).toFixed(1)}px, ${(H/2 - cy*k).toFixed(1)}px) scale(${k.toFixed(3)})`;
}

function stateCartouche(name) {
  const list = PLACES.filter(p => p.state === name);
  const kinds = new Set(list.flatMap(p => p.kinds));
  return `
    <h2>${esc(name)}</h2>
    ${STATE_SCRIPT[name] ? `<div class="script">${esc(STATE_SCRIPT[name])}</div>` : ''}
    <div class="char">${esc(STATE_CHAR[name] || 'A page of the atlas')}</div>
    <div class="cnt">
      <div><b class="num">${list.length}</b><span class="label">Destinations</span></div>
      <div><b class="num">${kinds.size}</b><span class="label">Kinds</span></div>
      <div><b class="num">${list.filter(p => p.corridor).length}</b><span class="label">Verified</span></div>
    </div>`;
}

function markRoute(host, trip) {
  if (!trip) return;
  const ids = new Set(trip.plan.flatMap(d => d.stops));
  host.querySelectorAll('.dest').forEach(el => {
    el.classList.toggle('on-route', ids.has(el.dataset.place));
  });
}

// One projected unit is a fixed number of kilometres; the bar just needs to
// know how many pixels a unit currently occupies.
const KM_PER_UNIT = (37.07695799999999 - 6.766373153037801) / INDIA.height * 111.32;

function updateScale(host, z) {
  const svg = host.querySelector('.atlas-svg');
  const mid = host.querySelector('#scaleMid'), end = host.querySelector('#scaleEnd');
  if (!svg || !end) return;
  const pxPerUnit = svg.getBoundingClientRect().height / INDIA.height * z;
  if (!pxPerUnit) return;
  const raw = 170 / pxPerUnit * KM_PER_UNIT;
  const step = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = [1, 2, 2.5, 5, 10].map(m => m * step).filter(v => v <= raw).pop() || raw;
  mid.textContent = Math.round(nice / 2).toLocaleString('en-IN');
  end.textContent = Math.round(nice).toLocaleString('en-IN') + ' km';
  host.querySelectorAll('.scalebar .bar-a, .scalebar .bar-b').forEach(r => {
    const full = 170 * (nice / raw);
    if (r.classList.contains('bar-b')) r.setAttribute('width', full.toFixed(1));
    else if (r.getAttribute('x') === '1') r.setAttribute('width', (full/4).toFixed(1));
    else { r.setAttribute('x', (1 + full/2).toFixed(1)); r.setAttribute('width', (full/4).toFixed(1)); }
  });
  mid.setAttribute('x', (1 + 170 * (nice/raw) / 2).toFixed(1));
  end.setAttribute('x', (1 + 170 * (nice/raw)).toFixed(1));
}

function applyLens(host) {
  const lens = state.atlas.lens;
  host.querySelectorAll('.dest').forEach(el => {
    const p = byId[el.dataset.place];
    el.classList.toggle('muted-lens', !!lens && !p.kinds.includes(lens));
  });
}

function wire(host, opts) {
  const cart = host.querySelector('#cartouche');

  host.querySelectorAll('.state').forEach(el => {
    const name = el.dataset.state;
    el.addEventListener('mouseenter', () => {
      if (state.atlas.state) return;
      const n = PLACES.filter(p => p.state === name).length;
      cart.innerHTML = `
        <h2>${esc(name)}</h2>
        ${STATE_SCRIPT[name] ? `<div class="script">${esc(STATE_SCRIPT[name])}</div>` : ''}
        <div class="char">${esc(STATE_CHAR[name] || 'A page of the atlas')}</div>
        ${n ? `<div class="cnt">
          <div><b class="num">${n}</b><span class="label">Destinations</span></div>
          <div><b class="num">${new Set(PLACES.filter(p=>p.state===name).flatMap(p=>p.kinds)).size}</b><span class="label">Kinds</span></div>
        </div>` : '<div class="cnt"><span class="tiny faint">Not yet seeded in this corridor</span></div>'}`;
      cart.classList.add('on');
      host.querySelectorAll('.state').forEach(s => s.classList.toggle('dim', s !== el));
    });
    el.addEventListener('mouseleave', () => {
      if (state.atlas.state) return;
      cart.classList.remove('on');
      host.querySelectorAll('.state').forEach(s => s.classList.remove('dim'));
    });
    el.addEventListener('click', e => {
      e.stopPropagation();
      if (!PLACES.some(p => p.state === name)) return;
      ACTIONS.atlas({ state: name, place: null });
    });
  });

  host.querySelectorAll('.dest').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      showDestCard(host, byId[el.dataset.place], opts);
    });
  });

  host.querySelector('[data-nav="india"]')?.addEventListener('click', () => {
    ACTIONS.atlas({ state: null, place: null });
  });

  host.querySelectorAll('[data-lens]').forEach(b => b.addEventListener('click', () => {
    const l = b.dataset.lens;
    ACTIONS.atlas({ lens: state.atlas.lens === l ? null : l });
  }));

  host.querySelectorAll('[data-layer]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.layer;
    ACTIONS.atlas({ layers: { ...state.atlas.layers, [k]: !state.atlas.layers[k] } });
  }));

  host.querySelector('.atlas-svg')?.addEventListener('click', () => {
    host.querySelector('#destcard-host').innerHTML = '';
  });
}

function showDestCard(host, p, opts) {
  const [x, y] = project(p.lat, p.lon);
  const svg = host.querySelector('.atlas-svg');
  const box = svg.getBoundingClientRect();
  const hostBox = host.getBoundingClientRect();
  const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
  const scr = pt.matrixTransform(host.querySelector('.atlas-vp').getScreenCTM());
  let left = scr.x - hostBox.left + 22, top = scr.y - hostBox.top - 90;
  left = Math.min(Math.max(16, left), hostBox.width - 304);
  top  = Math.min(Math.max(16, top), hostBox.height - 340);

  const onTrip = state.trip?.plan.some(d => d.stops.includes(p.id));
  const host2 = host.querySelector('#destcard-host');
  host2.innerHTML = `
    <div class="panel destcard" style="left:${left}px;top:${top}px">
      <div class="plate">
        <svg viewBox="0 0 288 92">
          <g opacity=".30" transform="translate(96,-6) scale(4.2)">
            <path fill="none" stroke="#4a3826" stroke-width="1" stroke-linecap="round"
                  stroke-linejoin="round" d="${GLYPHS[glyphFor(p)]}"/>
          </g>
          <path d="M0 78c26-8 52-8 78 0s52 8 78 0 52-8 78 0 46 6 54 3v11H0z" fill="#c2ab7e" opacity=".7"/>
        </svg>
      </div>
      <div class="top">
        <h2>${esc(p.name)}</h2>
        ${p.script ? `<div class="script">${esc(p.script)}</div>` : ''}
        <div class="small muted" style="margin-top:7px">${esc(p.blurb)}</div>
      </div>
      <div class="rows">
        <div class="row"><span class="label">Region</span><span>${esc(p.state)}</span></div>
        <div class="row"><span class="label">Character</span><span>${p.kinds.map(k=>k[0].toUpperCase()+k.slice(1)).join(' · ')}</span></div>
        <div class="row"><span class="label">Rating</span><span class="stars">${'★'.repeat(Math.round(p.rating))}<span class="num muted" style="margin-left:6px">${p.rating.toFixed(1)}</span></span></div>
        <div class="row"><span class="label">Best time</span><span>${esc(p.best)}</span></div>
        <div class="row"><span class="label">Hours</span><span class="num">${p.open}–${p.close}</span></div>
        <div class="row"><span class="label">Typical visit</span><span class="num">${Math.floor(p.visitMin/60)}h ${p.visitMin%60 ? (p.visitMin%60)+'m' : ''}</span></div>
        <div class="row"><span class="label">Entry</span><span class="num">${p.fee ? '₹'+p.fee : 'Free'}</span></div>
      </div>
      <div class="acts">
        <button class="btn btn-primary btn-sm" data-act="add" style="flex:1">
          ${onTrip ? 'On your trip ✓' : 'Add to trip'}</button>
        <button class="btn btn-ghost btn-sm" data-act="close">Close</button>
      </div>
    </div>`;

  host2.querySelector('[data-act="close"]').onclick = () => { host2.innerHTML = ''; };
  host2.querySelector('[data-act="add"]').onclick = () => {
    opts.onAdd?.(p);
    host2.innerHTML = '';
  };
  host2.querySelector('.destcard').addEventListener('click', e => e.stopPropagation());
}

export { frameFor };

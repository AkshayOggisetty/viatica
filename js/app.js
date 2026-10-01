// Shell: rail navigation, top bar, modal/toast host, demo controls.

import { state, ACTIONS, subscribe, planTrip } from './core/store.js';
import { byId } from './data/places.js';
import { esc, icon, money, on } from './ui/util.js';
import { renderAtlas } from './ui/atlas.js';
import { renderPlan, renderTrip } from './ui/views-plan.js';
import { renderPass, renderSafety, renderGroup, renderDesk, renderAbout } from './ui/views-ops.js';

const NAV = [
  ['atlas',  'Atlas',  'atlas'],
  ['plan',   'Plan',   'plan'],
  ['trip',   'Trip',   'trip'],
  ['pass',   'Pass',   'pass'],
  ['safety', 'Safety', 'safety'],
  ['group',  'Group',  'group'],
  ['desk',   'Desk',   'desk'],
];

const app = {
  modal(cfg)  { showModal(cfg); },
  close()     { document.querySelector('.modal-bg')?.remove(); },
  toast(msg)  { toast(msg); },
  solving(done) { showSolving(done); },
};

let root, viewHost;

function shell() {
  document.getElementById('app').innerHTML = `
  <header class="topbar">
    <div class="wordmark">Viatica<small>Smart tourism · SIH 2026</small></div>
    <div class="sep"></div>
    <div class="tchip" id="tripChip"></div>
    <div class="grow"></div>
    <button class="tbtn" id="net"></button>
    <button class="tbtn" id="demo">${icon('bolt')} Demo scenario</button>
    <button class="tbtn" id="reset">Reset</button>
  </header>
  <div class="shell-body">
    <nav class="rail" id="rail"></nav>
    <main class="view" id="view"></main>
  </div>`;
  root = document.getElementById('app');
  viewHost = document.getElementById('view');

  document.getElementById('rail').innerHTML =
    NAV.map(([k,l,i]) => `<button class="rail-btn" data-go="${k}">${icon(i)}<span>${l}</span></button>`).join('')
    + `<div class="spacer"></div>
       <button class="rail-btn" data-go="about">${icon('about')}<span>About</span></button>`;

  on(root, '[data-go]', 'click', e => ACTIONS.go(e.currentTarget.dataset.go));
  document.getElementById('net').onclick =
    () => ACTIONS.network(state.network === 'online' ? 'offline' : 'online');
  document.getElementById('demo').onclick = () => demoSheet();
  document.getElementById('reset').onclick = () => { seedTrip(); ACTIONS.go('atlas'); toast('Demo reset'); };
}

function paintChrome() {
  document.querySelectorAll('[data-go]').forEach(b =>
    b.setAttribute('aria-current', b.dataset.go === state.view));

  const net = document.getElementById('net');
  const off = state.network === 'offline';
  net.className = 'tbtn' + (off ? ' offline' : '');
  net.innerHTML = `${icon(off ? 'wifioff' : 'wifi')} ${off ? 'Offline' : 'Online'}`;

  const chip = document.getElementById('tripChip');
  const t = state.trip;
  chip.innerHTML = t
    ? `<span class="dot ${off?'off':''}"></span>
       <span><b>${esc(t.title)}</b> · day ${t.currentDay}/${t.days} ·
       ${t.plan.flatMap(d=>d.stops).length} stops · ${money(t.budget_.planned)}</span>`
    : `<span class="dot off"></span><span>No active trip</span>`;

  const sosOn = t?.safety?.sos && t.safety.sos.status !== 'resolved';
  const sb = document.querySelector('[data-go="safety"]');
  sb.querySelector('.rail-badge')?.remove();
  if (sosOn) sb.insertAdjacentHTML('beforeend', '<span class="rail-badge">!</span>');
}

const VIEWS = {
  atlas:  h => renderAtlas(h, { trip: state.trip, onAdd: p => addToTrip(p) }),
  plan:   h => renderPlan(h, app),
  trip:   h => renderTrip(h, app),
  pass:   h => renderPass(h, app),
  safety: h => renderSafety(h, app),
  group:  h => renderGroup(h, app),
  desk:   h => renderDesk(h, app),
  about:  h => renderAbout(h),
};

function paint() {
  paintChrome();
  (VIEWS[state.view] || VIEWS.atlas)(viewHost);
}

function addToTrip(p) {
  if (!state.trip) { seedTrip(); }
  ACTIONS.vote(p.id);
  toast(`${p.name} added — itinerary re-solved around it`);
}

// ── Modal / toast / solving ───────────────────────────────────────────────

function showModal(cfg) {
  app.close();
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `
    <div class="panel modal">
      <div class="modal-h">
        <div><h2>${esc(cfg.title)}</h2>
          ${cfg.sub ? `<div class="small muted">${esc(cfg.sub)}</div>` : ''}</div>
        <button class="btn btn-ghost btn-sm" data-close>Close</button>
      </div>
      <div class="modal-b">${cfg.body}</div>
      ${cfg.footer ? `<div class="modal-b" style="padding-top:0;display:flex;gap:8px;justify-content:flex-end">${cfg.footer}</div>` : ''}
    </div>`;
  bg.addEventListener('click', e => { if (e.target === bg) app.close(); });
  bg.querySelector('[data-close]').onclick = () => app.close();
  document.body.appendChild(bg);
  cfg.wire?.(bg);
}

let toastT = null;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast panel';
  t.style.cssText = `position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:300;
    padding:11px 18px;font-size:12.5px;max-width:520px;text-align:center;
    animation:fadeUp .3s cubic-bezier(.22,.61,.36,1) both`;
  t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastT);
  toastT = setTimeout(() => t.remove(), 4200);
}

function showSolving(done) {
  const steps = [
    'Reading opening hours and visit durations',
    'Loading the travel-time matrix for the corridor',
    'Forcing must-do stops into the plan',
    'Greedy insertion — profit per added minute',
    'Checking day windows and budget',
    'Holding capacity slots and minting the Trip Pass',
  ];
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="panel modal" style="max-width:430px">
    <div class="modal-b" style="text-align:center;padding:32px 28px">
      <svg viewBox="0 0 108 108" style="width:78px;height:78px;animation:spin 5s linear infinite">
        <circle cx="54" cy="54" r="46" fill="none" stroke="var(--hair)" stroke-width="1"/>
        <circle cx="54" cy="54" r="46" fill="none" stroke="var(--terracotta)" stroke-width="2"
                stroke-dasharray="42 247" stroke-linecap="round"/>
        <circle cx="54" cy="54" r="30" fill="none" stroke="var(--brass)" stroke-width="1" opacity=".6"/>
      </svg>
      <h2 style="margin-top:14px;letter-spacing:.1em;text-transform:uppercase;font-size:17px">Solving</h2>
      <div class="small muted" id="solveStep" style="margin-top:8px;min-height:20px"></div>
      <div class="meter" style="margin-top:16px"><i id="solveBar" style="width:0%"></i></div>
    </div></div>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
  document.body.appendChild(bg);
  let i = 0;
  const step = () => {
    bg.querySelector('#solveStep').textContent = steps[i];
    bg.querySelector('#solveBar').style.width = Math.round((i + 1) / steps.length * 100) + '%';
    i++;
    if (i < steps.length) setTimeout(step, 260);
    else setTimeout(() => { bg.remove(); done(); }, 380);
  };
  step();
}

// ── Demo scenario ─────────────────────────────────────────────────────────

function demoSheet() {
  const t = state.trip;
  app.modal({
    title: 'Demo scenario', sub: 'The five-minute pitch, driven from here',
    body: `
      <p class="small muted">Each button changes exactly one part of the record. Watch the
      other four repair themselves in the trip log.</p>
      <div class="rule"></div>
      <div class="grid g2" style="gap:8px">
        <button class="btn" data-d="delay">1 · Bus delayed 90 minutes</button>
        <button class="btn" data-d="budget">2 · Cut the budget to ₹6,000</button>
        <button class="btn" data-d="vote">3 · Group votes in Badami</button>
        <button class="btn" data-d="close">4 · Vittala closed for conservation</button>
        <button class="btn" data-d="offline">5 · Lose the network at Hampi</button>
        <button class="btn btn-danger" data-d="sos">6 · Raise an SOS offline</button>
      </div>
      <div class="rule"></div>
      <p class="small faint">Full run: 1 → 5 → 6 tells the story in the script — a delay repairs
      the plan, the network dies, and the SOS still goes out knowing where you should be.</p>`,
    wire(root) {
      on(root, '[data-d]', 'click', e => {
        const k = e.currentTarget.dataset.d;
        app.close();
        if (k === 'delay')  { ACTIONS.delay(90); ACTIONS.go('trip'); toast('Delay injected — itinerary, tickets, budget and slots all re-solved'); }
        if (k === 'budget') { ACTIONS.budget(6000); ACTIONS.go('trip'); toast('Budget cut — remaining stops and modes re-solved'); }
        if (k === 'vote')   { ACTIONS.vote('badami'); ACTIONS.go('trip'); toast('Vote passed — trip forked and re-solved'); }
        if (k === 'close')  { ACTIONS.close('vittala'); ACTIONS.go('trip'); toast('Site closed — slot released, day rebuilt'); }
        if (k === 'offline'){ ACTIONS.network('offline'); ACTIONS.go('pass'); toast('Network down — plan, pass and map served from cache'); }
        if (k === 'sos')    { ACTIONS.network('offline'); ACTIONS.sos('Injured — no data'); ACTIONS.go('safety'); }
      });
    },
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────

function seedTrip() {
  Object.assign(state.atlas, { level:'india', state:null, place:null, lens:null });
  state.gateSeen = new Set(); state.scanLog = [];
  state.network = 'online';
  planTrip({
    originId:'blr', days:4, budget:9000, pace:'balanced',
    interests:['heritage','spiritual','food'], mustDo:['hampi','vittala'],
    prefer:'balanced', title:'Hampi & the Chalukyan corridor',
  });
}

const ROUTES = new Set([...NAV.map(n => n[0]), 'about']);

/** `#/trip`, or `#/atlas/Karnataka` to open the sheet straight at a state. */
function routeFromHash() {
  const [view, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  const stateName = rest.length ? decodeURIComponent(rest.join('/')) : null;
  return { view: ROUTES.has(view) ? view : 'atlas', stateName };
}

// Read the requested route before anything can rewrite the hash.
const initial = routeFromHash();

shell();
subscribe(() => {
  paint();
  const want = '#/' + state.view +
    (state.view === 'atlas' && state.atlas.state ? '/' + encodeURIComponent(state.atlas.state) : '');
  if (location.hash !== want) history.replaceState(null, '', want);
});
seedTrip();
window.addEventListener('hashchange', () => {
  const r = routeFromHash();
  if (r.view !== state.view || (r.stateName || null) !== state.atlas.state) {
    state.atlas.state = r.stateName || null;
    ACTIONS.go(r.view);
  }
});
if (initial.stateName) state.atlas.state = initial.stateName;
ACTIONS.go(initial.view);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// The offline toggle should behave like a real outage for anything networked.
const realFetch = window.fetch;
window.fetch = (...a) => state.network === 'offline'
  ? Promise.reject(new TypeError('Failed to fetch — simulated offline'))
  : realFetch(...a);

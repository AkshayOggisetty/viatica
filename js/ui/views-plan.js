// Screens: Plan intake (with voice) and the live Trip record.

import { PLACES, byId, KINDS } from '../data/places.js';
import { LANGS } from '../data/seed.js';
import { MODE_ICONS, GLYPHS } from './glyphs.js';
import { esc, money, dur, icon, on } from './util.js';
import { PACE, toHM } from '../core/scheduler.js';
import { state, ACTIONS, planTrip, dayDate, legChoices, expectedPosition } from '../core/store.js';

const CORRIDOR = PLACES.filter(p => p.corridor);

// ── PLAN ──────────────────────────────────────────────────────────────────

let draft = {
  originId: 'blr', days: 4, budget: 9000, pace: 'balanced',
  interests: ['heritage', 'spiritual', 'food'],
  mustDo: ['hampi', 'vittala'], prefer: 'balanced',
};

export function renderPlan(host, app) {
  host.innerHTML = `
  <div class="view-scroll"><div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Module 01 · Itinerary planning</span>
        <h1>Plan a journey</h1>
        <p>Give the solver your constraints. It works over opening hours, visit
           times and a travel matrix — and re-solves whenever anything changes.</p>
      </div>
      <button class="btn btn-primary" id="solve">${icon('bolt')} Solve itinerary</button>
    </div>
    <div class="rule-orn"><i>❖</i></div>

    <div class="split">
      <div class="grid" style="gap:16px">
        <div class="card sec">
          <div class="sec-h"><h3>Speak your trip</h3>
            <span class="tag tag-brass">Web Speech API</span></div>
          <div style="display:flex;gap:12px;align-items:center">
            <button class="mic" id="mic" title="Hold to speak">${icon('mic')}</button>
            <div style="flex:1">
              <div id="heard" class="small muted" style="min-height:34px">
                Tap the microphone and describe the trip in your own words.
              </div>
              <div style="display:flex;gap:6px;margin-top:8px">
                ${Object.entries(LANGS).map(([k,v]) =>
                  `<button class="chip" data-lang="${k}" aria-pressed="${state.lang===k}">${esc(v.native)}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="small faint" style="margin-top:10px;font-style:italic">
            e.g. “${esc(LANGS[state.lang].sample)}”
          </div>
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Constraints</h3></div>
          <div class="grid g2">
            <div>
              <span class="label">Starting from</span>
              <select id="origin">
                ${[...new Set(CORRIDOR.map(p=>p.id))].map(id =>
                  `<option value="${id}" ${draft.originId===id?'selected':''}>${esc(byId[id].name)}</option>`).join('')}
              </select>
            </div>
            <div>
              <span class="label">Days · <b class="num" id="daysV">${draft.days}</b></span>
              <input type="range" id="days" min="2" max="8" value="${draft.days}">
            </div>
          </div>
          <div style="margin-top:14px">
            <span class="label">Budget · <b class="num" id="budgetV">${money(draft.budget)}</b>
              <span class="faint">per traveller</span></span>
            <input type="range" id="budget" min="3000" max="40000" step="500" value="${draft.budget}">
          </div>
          <div style="margin-top:14px">
            <span class="label">Pace</span>
            <div style="display:flex;gap:6px">
              ${Object.entries(PACE).map(([k,v]) => `<button class="chip" data-pace="${k}"
                aria-pressed="${draft.pace===k}">${v.label}
                <span class="faint">${v.dayStart}–${v.dayEnd}</span></button>`).join('')}
            </div>
          </div>
          <div style="margin-top:14px">
            <span class="label">Optimise transport for</span>
            <div style="display:flex;gap:6px">
              ${[['balanced','Balanced'],['fast','Time'],['cheap','Cost'],['green','Carbon']].map(([k,l]) =>
                `<button class="chip" data-prefer="${k}" aria-pressed="${draft.prefer===k}">${l}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Interests</h3>
            <span class="small faint">weights the solver's profit function</span></div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${KINDS.map(k => `<button class="chip" data-int="${k.id}"
              aria-pressed="${draft.interests.includes(k.id)}">${k.label}</button>`).join('')}
          </div>
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>What the solver actually does</h3>
            <span class="tag tag-brass">team orienteering</span></div>
          <ol class="small muted" style="padding-left:18px;margin:0;line-height:1.85">
            <li>Scores every candidate: rating × interest match, penalised by crowding.</li>
            <li>Forces your must-do stops in first, whatever the score.</li>
            <li>Repeatedly inserts the best <i>profit per added minute</i> at the cheapest
                feasible position — checking opening hours, the day window, the travel
                matrix and the budget at every step.</li>
            <li>Long opening hops become the overnight bus or train, capped so you are not
                on a coach every night.</li>
            <li>Anything that changes later re-runs only the stops you have not reached.</li>
          </ol>
          <p class="tiny faint" style="margin:11px 0 0">
            Greedy, not exact. That is the point: it has to re-solve instantly on a delay,
            a vote or a budget edit. Grounded in Vansteenwegen et al., <i>The Orienteering
            Problem: A Survey</i>, EJOR 209(1), 2011.</p>
        </div>
      </div>

      <div class="card sec" style="align-self:start">
        <div class="sec-h"><h3>Must-do stops</h3>
          <span class="tag">${draft.mustDo.length} chosen</span></div>
        <p class="small muted" style="margin:0 0 12px">
          Forced into the plan before greedy insertion runs. Group votes add to this list.</p>
        <div class="scroll" style="max-height:420px;margin:0 -6px;padding:0 6px">
          ${CORRIDOR.map(p => `
            <label class="list-row" style="cursor:pointer">
              <input type="checkbox" data-must="${p.id}" ${draft.mustDo.includes(p.id)?'checked':''}
                     style="width:auto;margin:0">
              <div class="grow">
                <h4>${esc(p.name)}</h4>
                <div class="meta">${esc(p.state)} · ${dur(p.visitMin)} · ${p.fee?money(p.fee):'Free'}</div>
              </div>
              <span class="stars small">${'★'.repeat(Math.round(p.rating))}</span>
            </label>`).join('')}
        </div>
      </div>
    </div>
  </div></div>`;

  const sync = () => {
    host.querySelector('#daysV').textContent = draft.days;
    host.querySelector('#budgetV').textContent = money(draft.budget);
  };

  host.querySelector('#days').oninput = e => { draft.days = +e.target.value; sync(); };
  host.querySelector('#budget').oninput = e => { draft.budget = +e.target.value; sync(); };
  host.querySelector('#origin').onchange = e => { draft.originId = e.target.value; };

  on(host, '[data-pace]', 'click', e => {
    draft.pace = e.currentTarget.dataset.pace;
    host.querySelectorAll('[data-pace]').forEach(b =>
      b.setAttribute('aria-pressed', b.dataset.pace === draft.pace));
  });
  on(host, '[data-prefer]', 'click', e => {
    draft.prefer = e.currentTarget.dataset.prefer;
    host.querySelectorAll('[data-prefer]').forEach(b =>
      b.setAttribute('aria-pressed', b.dataset.prefer === draft.prefer));
  });
  on(host, '[data-int]', 'click', e => {
    const k = e.currentTarget.dataset.int;
    draft.interests = draft.interests.includes(k)
      ? draft.interests.filter(x => x !== k) : [...draft.interests, k];
    e.currentTarget.setAttribute('aria-pressed', draft.interests.includes(k));
  });
  on(host, '[data-must]', 'change', e => {
    const id = e.currentTarget.dataset.must;
    draft.mustDo = e.currentTarget.checked
      ? [...new Set([...draft.mustDo, id])] : draft.mustDo.filter(x => x !== id);
  });
  on(host, '[data-lang]', 'click', e => { ACTIONS.setLang(e.currentTarget.dataset.lang); });

  host.querySelector('#mic').onclick = () => voice(host);
  host.querySelector('#solve').onclick = () => {
    app.solving(() => { planTrip({ ...draft }); ACTIONS.go('trip'); });
  };
}

/** Real Web Speech recognition where available; a scripted stand-in otherwise. */
function voice(host) {
  const mic = host.querySelector('#mic');
  const out = host.querySelector('#heard');
  const L = LANGS[state.lang];
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  const parse = text => {
    out.innerHTML = `<b>“${esc(text)}”</b>`;
    const t = text.toLowerCase();
    const d = t.match(/(\d+)\s*(day|days|दिन|ದಿನ)/);
    if (d) draft.days = Math.min(8, Math.max(2, +d[1]));
    const b = t.match(/(\d{3,6})/g);
    if (b) { const big = Math.max(...b.map(Number)); if (big >= 2000) draft.budget = big; }
    if (/relax|आराम|ನಿಧಾನ/.test(t)) draft.pace = 'relaxed';
    if (/pack|तेज|ವೇಗ/.test(t))    draft.pace = 'packed';
    const map = { heritage:/herit|विरासत|ಪರಂಪರೆ/, food:/food|खाना|ಆಹಾರ/, nature:/nature|प्रकृति|ಪ್ರಕೃತಿ/,
                  spiritual:/temple|spirit|मंदिर|ದೇವ/, beaches:/beach|समुद्र|ಕಡಲ/, adventure:/adventure|trek/ };
    const found = Object.entries(map).filter(([, re]) => re.test(t)).map(([k]) => k);
    if (found.length) draft.interests = found;
    for (const p of PLACES) if (t.includes(p.name.toLowerCase().split(' ')[0]))
      draft.mustDo = [...new Set([...draft.mustDo, p.id])];
    out.innerHTML += `<div class="small muted" style="margin-top:6px">
      Parsed → ${draft.days} days · ${money(draft.budget)} · ${PACE[draft.pace].label} ·
      ${draft.interests.join(', ')}</div>`;
    setTimeout(() => ACTIONS.go('plan'), 900);
  };

  if (!SR) {
    mic.classList.add('live');
    out.innerHTML = `<span class="muted">Listening…</span>`;
    setTimeout(() => { mic.classList.remove('live');
      out.innerHTML = `<span class="tag tag-warn">Simulated</span>
        <div class="small faint" style="margin-top:5px">This browser has no Web Speech API — replaying the seeded utterance.</div>`;
      setTimeout(() => parse(L.sample), 500);
    }, 1300);
    return;
  }
  const rec = new SR();
  rec.lang = L.code; rec.interimResults = false; rec.maxAlternatives = 1;
  mic.classList.add('live');
  out.innerHTML = `<span class="muted">Listening in ${esc(L.label)}…</span>`;
  rec.onresult = e => parse(e.results[0][0].transcript);
  rec.onerror = () => { out.innerHTML = `<span class="muted">Didn’t catch that — replaying the seeded utterance.</span>`; parse(L.sample); };
  rec.onend = () => mic.classList.remove('live');
  rec.start();
}

// ── TRIP ──────────────────────────────────────────────────────────────────

export function renderTrip(host, app) {
  const trip = state.trip;
  if (!trip) return renderEmpty(host, 'No trip yet', 'Plan a journey to open the live trip record.', app);

  const b = trip.budget_;
  const pos = expectedPosition(trip);
  const pct = Math.min(100, Math.round(b.planned / b.budget * 100));

  host.innerHTML = `
  <div class="view-scroll"><div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">One live trip record · ten modules, one state</span>
        <h1>${esc(trip.title)}</h1>
        <p>${trip.days} days from ${esc(byId[trip.originId].name)} ·
           solved in ${trip.solveMs} ms at ${esc(trip.solvedAt)} ·
           day ${trip.currentDay} of ${trip.days} in progress</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" id="showTrace">${icon('book')} Solver trace</button>
        <button class="btn btn-ink btn-sm" id="nextDay">Advance day →</button>
      </div>
    </div>

    <div class="pillars" style="margin:16px 0 18px">
      <div class="pillar"><span class="label">${icon('plan')} Itinerary</span>
        <b class="num">${trip.plan.flatMap(d=>d.stops).length}</b>
        <div class="sub">stops · ${dur(trip.stats.travelMinutes)} moving</div></div>
      <div class="pillar"><span class="label">${icon('pass')} Tickets</span>
        <b class="num">${trip.tickets.entries.length}</b>
        <div class="sub">slots held · ${money(trip.tickets.total)}</div></div>
      <div class="pillar"><span class="label">${icon('wallet')} Budget</span>
        <b class="num">${money(b.planned)}</b>
        <div class="sub">of ${money(b.budget)}/head · ${money(b.groupTotal)} for ${b.heads}</div></div>
      <div class="pillar"><span class="label">${icon('group')} Group</span>
        <b class="num">${trip.group.length}</b>
        <div class="sub">${trip.group.filter(g=>g.verified).length} phone-verified</div></div>
      <div class="pillar"><span class="label">${icon('shield')} Safety</span>
        <b class="num">${trip.safety.zones.length}</b>
        <div class="sub">advisories on route · guardian ${trip.safety.guardian.watching?'live':'off'}</div></div>
    </div>

    <div class="split">
      <div>
        <div class="sec-h"><h3>Day-wise itinerary</h3>
          <span class="small faint">click a stop for detail · click a leg to compare transport</span></div>
        ${trip.plan.map((d, di) => dayBlock(trip, d, di)).join('')}
      </div>

      <div class="grid" style="gap:16px;align-content:start">
        <div class="card sec">
          <div class="sec-h"><h3>Budget</h3>
            <span class="tag ${b.over?'tag-danger':'tag-ok'}">${b.over?'over':'within'} budget</span></div>
          <div class="meter ${b.over?'over':pct>85?'warn':''}"><i style="width:${pct}%"></i></div>
          <div class="small faint" style="margin:6px 0 12px">
            ${pct}% of ${money(b.budget)} per traveller committed</div>
          <div class="kv"><span class="k">Transport</span><span class="v num">${money(b.travel)}</span></div>
          <div class="kv"><span class="k">Entry & slots</span><span class="v num">${money(b.tickets)}</span></div>
          <div class="kv"><span class="k">Stay & food (est.)</span><span class="v num">${money(b.living)}</span></div>
          <div class="kv"><span class="k">Remaining</span>
            <span class="v num" style="color:${b.remaining<0?'var(--madder)':'var(--forest)'}">${money(b.remaining)}</span></div>
          <div class="kv"><span class="k">Group total (× ${b.heads})</span><span class="v num">${money(b.groupTotal)}</span></div>
          <div class="kv"><span class="k">Carbon</span><span class="v num">${trip.stats.co2} kg CO₂e</span></div>
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Where you should be</h3><span class="tag tag-indigo">SOS context</span></div>
          <div class="kv"><span class="k">Right now</span><span class="v">${
            pos?.cur ? (pos.cur.kind==='visit' ? esc(byId[pos.cur.placeId].name) : 'In transit → ' + esc(byId[pos.cur.to].name))
                     : 'Between stops'}</span></div>
          <div class="kv"><span class="k">Next</span><span class="v">${
            pos?.next ? esc(byId[pos.next.placeId].name) + ' at ' + toHM(pos.next.start) : '—'}</span></div>
          <div class="kv"><span class="k">Local time</span><span class="v num">${toHM(trip.clock)}</span></div>
          <p class="small faint" style="margin:10px 0 0">
            This is what the SOS packet carries even with no data connection.</p>
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Live trip log</h3><span class="tag">${trip.events.length}</span></div>
          <div class="scroll" style="max-height:320px">
            ${trip.events.map(e => `
              <div class="evt" data-k="${e.kind}">
                <span class="when">${esc(e.at)}</span><span class="pip"></span>
                <div class="txt"><div class="t">${esc(e.text)}</div>
                  <div class="d">${esc(e.detail || '')}</div></div>
              </div>`).join('') || '<p class="small faint">Nothing yet.</p>'}
          </div>
        </div>
      </div>
    </div>
  </div></div>`;

  on(host, '[data-leg]', 'click', e => {
    const [from, to, di, ii] = e.currentTarget.dataset.leg.split('|');
    app.modal(transportSheet(from, to, +di, +ii, app));
  });
  on(host, '[data-stop]', 'click', e => {
    app.modal(stopSheet(e.currentTarget.dataset.stop, app));
  });
  host.querySelector('#nextDay').onclick = () => ACTIONS.advanceDay();
  host.querySelector('#showTrace').onclick = () => app.modal(traceSheet(trip));
}

function dayBlock(trip, d, di) {
  const visits = d.items.filter(i => i.kind === 'visit');
  const isNow = d.day === trip.currentDay;
  const past = d.day < trip.currentDay;
  return `
  <div class="day">
    <div class="day-h">
      <b>Day ${d.day}</b>
      <span class="when">${esc(dayDate(d.day))}</span>
      ${isNow ? '<span class="tag tag-solid">Today</span>' : past ? '<span class="tag tag-ok">Done</span>' : ''}
      <span class="sum">${visits.length} stops · ${money(d.cost)} · ${d.co2.toFixed(1)} kg</span>
    </div>
    <div class="tl">
      ${d.items.length ? d.items.map((it, ii) => item(trip, d, it, di, ii)).join('')
        : '<p class="small faint" style="padding:8px 0">Nothing scheduled — the solver could not fit a stop here.</p>'}
    </div>
  </div>`;
}

function item(trip, d, it, di, ii) {
  if (it.kind === 'wait')
    return `<div class="ti"><span class="clock num">${toHM(it.start)}</span>
      <span class="knot" style="opacity:.4"></span>
      <div class="small faint" style="padding:4px 0">Waiting ${dur(it.mins)} — site opens later</div></div>`;

  if (it.kind === 'travel') {
    const from = byId[it.from], to = byId[it.to];
    return `<div class="ti travel">
      <span class="clock num">${toHM(it.start)}${it.overnight ? '<em style="display:block;font-style:normal;font-size:9px;opacity:.7">night before</em>' : ''}</span>
      <span class="knot"></span>
      <div class="leg" data-leg="${it.from}|${it.to}|${di}|${ii}">
        <svg viewBox="0 0 24 24"><path d="${MODE_ICONS[it.mode] || MODE_ICONS.bus}"/></svg>
        <span class="grow"><b>${esc(it.label)}</b> to ${esc(to.name)}
          ${it.overnight ? '<span class="tag" style="margin-left:6px">overnight</span>' : ''}
          ${it.verified ? '<span class="tag tag-ok" style="margin-left:4px">verified leg</span>' : ''}
        </span>
        <span class="num">${it.km} km · ${dur(it.mins)}</span>
        <span class="num" style="color:var(--ink)">${money(it.cost)}</span>
        <span class="faint tiny">band ${money(it.band[0])}–${money(it.band[1])}</span>
      </div></div>`;
  }

  const p = byId[it.placeId];
  const done = trip.frozen.includes(p.id);
  const tk = trip.tickets.entries.find(e => e.placeId === p.id && e.day === d.day);
  return `<div class="ti visit ${done?'done':''}"><span class="clock num">${toHM(it.start)}</span><span class="knot"></span>
    <div class="card stop" data-stop="${p.id}">
      <div class="ico"><svg viewBox="0 0 24 24"><path d="${GLYPHS[p.glyph] || GLYPHS.temple}"/></svg></div>
      <div style="min-width:0">
        <h4>${esc(p.name)}</h4>
        <div class="script tiny">${esc(p.script || '')}</div>
        <div class="meta">${p.kinds.join(' · ')} · open ${p.open}–${p.close}
          ${tk ? ` · slot ${esc(tk.window)}${tk.capacity ? ` (${tk.held}/${tk.capacity})` : ''}` : ''}</div>
      </div>
      <div class="right">
        <div class="num" style="font-size:13px">${dur(it.mins)}</div>
        <div class="tiny faint">${p.fee ? money(p.fee) + '/head' : 'Free entry'}</div>
      </div>
    </div></div>`;
}

// ── Sheets ────────────────────────────────────────────────────────────────

function transportSheet(from, to, di, ii, app) {
  const opts = legChoices(from, to);
  const trip = state.trip;
  const cur = trip.plan[di]?.items[ii];
  return {
    title: `${byId[from].name} → ${byId[to].name}`,
    sub: 'Compare time, cost and carbon before you agree a price',
    body: `
      <div class="banner">${icon('bolt')}
        <span><b>Fare band</b> is what an honest fare looks like. Anything far above it is
        flagged, and community overcharge reports feed straight back into this band.</span></div>
      ${opts.map(o => `
        <div class="opt ${cur && o.mode===cur.mode?'pick':''}" data-mode="${o.mode}">
          <svg viewBox="0 0 24 24"><path d="${MODE_ICONS[o.icon] || MODE_ICONS.bus}"/></svg>
          <div class="grow">
            <div style="display:flex;align-items:center;gap:8px">
              <b style="font-family:var(--display);font-size:15px">${esc(o.label)}</b>
              ${o.verified ? '<span class="tag tag-ok">verified</span>' : '<span class="tag">estimated</span>'}
              ${cur && o.mode===cur.mode ? '<span class="tag tag-solid">in plan</span>' : ''}
            </div>
            <div class="small muted">${esc(o.note)} · ${o.km} km</div>
            <div class="band" style="margin-top:4px">expected fare ${money(o.band[0])} – ${money(o.band[1])}
              ${o.touts ? `<span style="color:var(--madder)"> · touts ask up to ${money(o.touts)}</span>` : ''}</div>
          </div>
          <div style="text-align:right;flex:none">
            <div class="num" style="font-size:15px">${dur(o.mins)}</div>
            <div class="num" style="font-size:13px">${money(o.cost)}</div>
            <div class="tiny" style="color:var(--forest)">${o.co2} kg CO₂e</div>
            <div class="tiny faint">crowd ${Math.round(o.crowd*100)}%</div>
          </div>
        </div>`).join('')}
      <p class="small faint" style="margin-top:14px">
        Walking legs are folded into the timing, not treated as free. Public transport is
        ranked up by the carbon term in the score.</p>`,
    wire(root) {
      on(root, '[data-mode]', 'click', e => {
        const m = e.currentTarget.dataset.mode;
        ACTIONS.go('trip');
        app.close();
        setTimeout(() => app.toast(`${byId[from].name} → ${byId[to].name}: ${m} selected. Re-solve to apply across the plan.`), 60);
      });
    },
  };
}

function stopSheet(id, app) {
  const p = byId[id];
  const trip = state.trip;
  const tk = trip.tickets.entries.find(e => e.placeId === id);
  return {
    title: p.name, sub: p.script ? `${p.script} · ${p.state}` : p.state,
    body: `
      <p style="font-family:var(--display);font-size:15px;line-height:1.5">${esc(p.blurb)}</p>
      <div class="rule"></div>
      <div class="grid g2" style="gap:0 22px">
        <div><div class="kv"><span class="k">Character</span><span class="v">${p.kinds.join(' · ')}</span></div>
        <div class="kv"><span class="k">Rating</span><span class="v stars">${'★'.repeat(Math.round(p.rating))}</span></div>
        <div class="kv"><span class="k">Best time</span><span class="v">${esc(p.best)}</span></div></div>
        <div><div class="kv"><span class="k">Hours</span><span class="v num">${p.open}–${p.close}</span></div>
        <div class="kv"><span class="k">Typical visit</span><span class="v num">${dur(p.visitMin)}</span></div>
        <div class="kv"><span class="k">Entry</span><span class="v num">${p.fee?money(p.fee):'Free'}</span></div></div>
      </div>
      ${tk ? `<div class="rule"></div>
        <div class="sec-h"><h3>Slot held</h3><span class="tag tag-ok">on your Trip Pass</span></div>
        <div class="kv"><span class="k">Window</span><span class="v num">${esc(tk.window)}</span></div>
        ${tk.capacity ? `<div class="kv"><span class="k">Capacity</span>
          <span class="v num">${tk.held} of ${tk.capacity} this hour</span></div>
          <div class="meter ${tk.held/tk.capacity>.9?'over':tk.held/tk.capacity>.7?'warn':''}" style="margin-top:8px">
            <i style="width:${Math.round(tk.held/tk.capacity*100)}%"></i></div>` : ''}` : ''}
      <div class="rule"></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-ghost btn-sm" data-x="close">Site closed today — re-solve</button>
        <button class="btn btn-ghost btn-sm" data-x="done">Mark visited</button>
      </div>`,
    wire(root) {
      root.querySelector('[data-x="close"]').onclick = () => { app.close(); ACTIONS.close(id); };
      root.querySelector('[data-x="done"]').onclick  = () => { app.close(); ACTIONS.complete(id); };
    },
  };
}

function traceSheet(trip) {
  return {
    title: 'Solver trace', sub: 'Greedy insertion, step by step',
    body: `
      <p class="small muted">Must-dos are forced first. Then each round inserts the
      candidate with the highest profit per added minute, at the cheapest feasible
      position, subject to opening hours, day windows and budget.</p>
      <div class="rule"></div>
      <div class="trace">
        ${trip.trace.map(t => `<div>
          <span class="n">${String(t.step).padStart(2,'0')}</span>
          ${t.failed ? '<span class="f">✕</span>' : '<span style="color:var(--forest)">→</span>'}
          <span class="p">${esc(byId[t.placeId]?.name || t.placeId)}</span>
          ${t.day ? `<span class="faint">day ${t.day}</span>` : ''}
          <span class="faint">— ${esc(t.why)}</span>
        </div>`).join('')}
      </div>
      <div class="rule"></div>
      <div class="grid g3">
        <div><span class="label">Considered</span><b class="num">${trip.stats.places + trip.stats.skipped}</b></div>
        <div><span class="label">Routed</span><b class="num">${trip.stats.places}</b></div>
        <div><span class="label">Solve time</span><b class="num">${trip.solveMs} ms</b></div>
      </div>
      <p class="small faint" style="margin-top:12px">
        Greedy, not exact — the whole "one live record repairs itself" behaviour depends
        on this being fast enough to re-run on every change, not on finding the provable
        optimum. See Vansteenwegen et al., <i>The Orienteering Problem: A Survey</i> (2011).</p>`,
  };
}

export function renderEmpty(host, title, sub, app) {
  host.innerHTML = `<div class="view-scroll"><div class="page"><div class="empty">
    <h3>${esc(title)}</h3><p>${esc(sub)}</p>
    <button class="btn btn-primary" style="margin-top:14px" id="goPlan">Plan a journey</button>
  </div></div></div>`;
  host.querySelector('#goPlan').onclick = () => ACTIONS.go('plan');
}

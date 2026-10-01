// Screens: Trip Pass + gate scanner, Safety/SOS, Group, Department dashboard.

import { byId, PLACES } from '../data/places.js';
import { GUIDES, REPORTS, INCIDENTS, FOOTFALL, FOOTFALL_HOURS, SLOTS, EMERGENCY, REFERENCES } from '../data/seed.js';
import { GLYPHS } from './glyphs.js';
import { esc, money, dur, icon, on } from './util.js';
import { encodeQR, qrPath } from '../core/qr.js';
import { mintCode, verifyCode, secondsLeft, STEP_SECONDS, upiLink, DEMO_VENUE_KEY } from '../core/ticket.js';
import { state, ACTIONS, settleUp, expectedPosition, dayDate } from '../core/store.js';
import { renderEmpty } from './views-plan.js';
import { toHM } from '../core/scheduler.js';

// ── TRIP PASS ─────────────────────────────────────────────────────────────

let passTimer = null, activeEntry = 0;

export function renderPass(host, app) {
  const trip = state.trip;
  if (!trip) return renderEmpty(host, 'No Trip Pass yet', 'Plan a journey first — one pass covers the whole trip.', app);
  if (!trip.tickets.entries.length)
    return renderEmpty(host, 'Nothing ticketed', 'This itinerary has no paid or capacity-controlled sites.', app);

  activeEntry = Math.min(activeEntry, trip.tickets.entries.length - 1);

  host.innerHTML = `
  <div class="view-scroll"><div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Modules 03 & 04 · Digital ticketing and slot control</span>
        <h1>Trip Pass</h1>
        <p>One pass per trip. The code is HMAC-signed and rotates every ${STEP_SECONDS} seconds,
           so a screenshot is useless — and the gate verifies it with no network at all.</p>
      </div>
      <span class="tag ${state.network==='offline'?'tag-warn':'tag-ok'}">
        ${state.network==='offline' ? 'offline — cached pass' : 'online'}</span>
    </div>
    <div class="rule-orn"><i>❖</i></div>

    <div class="split">
      <div>
        <div class="card pass" id="passCard"></div>
        <p class="small faint" style="max-width:380px;margin-top:12px">
          RFC 2104 signs the payload; RFC 6238 rotates it. The gate device holds the same
          venue key from its last sync, so verification is a local recomputation.
        </p>
      </div>

      <div class="grid" style="gap:16px;align-content:start">
        <div class="card sec">
          <div class="sec-h"><h3>Entries on this pass</h3>
            <span class="tag">${trip.tickets.entries.length}</span></div>
          ${trip.tickets.entries.map((e, i) => `
            <div class="list-row" style="cursor:pointer" data-entry="${i}">
              <div class="av" style="background:${i===activeEntry?'var(--terracotta)':'var(--ink-4)'}">${i+1}</div>
              <div class="grow">
                <h4>${esc(byId[e.placeId].name)}</h4>
                <div class="meta">Day ${e.day} · ${esc(e.window)} · ${e.pax} people
                  ${e.capacity ? ` · slot ${e.held}/${e.capacity}` : ''}</div>
              </div>
              <div style="text-align:right">
                <div class="num">${money(e.total)}</div>
                <div class="tiny faint">${money(e.fee)}/head</div>
              </div>
            </div>`).join('')}
          <div class="rule"></div>
          <div class="kv"><span class="k">Pass total</span><span class="v num">${money(trip.tickets.total)}</span></div>
          <button class="btn btn-primary" style="width:100%;margin-top:12px;justify-content:center" id="upi">
            ${icon('wallet')} Pay ${money(trip.tickets.total)} by UPI</button>
          <p class="tiny faint" style="margin:8px 0 0;text-align:center">
            Hands off to your own UPI app via deep link — no gateway, no card data here.</p>
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Gate scanner</h3><span class="tag tag-indigo">staff view</span></div>
          <p class="small muted" style="margin:0 0 12px">
            What the person at the gate sees. Runs entirely offline.</p>
          <div style="display:flex;flex-wrap:wrap;gap:7px">
            <button class="btn btn-sm" data-scan="live">${icon('scan')} Scan the live code</button>
            <button class="btn btn-sm btn-ghost" data-scan="old">Scan a screenshot (60s old)</button>
            <button class="btn btn-sm btn-ghost" data-scan="forge">Scan a forged code</button>
            <button class="btn btn-sm btn-ghost" data-scan="wrong">Scan at the wrong gate</button>
          </div>
          <div id="verdicts" style="margin-top:14px"></div>
        </div>
      </div>
    </div>
  </div></div>`;

  on(host, '[data-entry]', 'click', e => { activeEntry = +e.currentTarget.dataset.entry; ACTIONS.go('pass'); });
  host.querySelector('#upi').onclick = () => {
    const link = upiLink({ pa:'viatica.demo@upi', pn:'Viatica Demo', am: trip.tickets.total,
                           tn:`Trip Pass ${trip.passId}`, tr: trip.passId });
    app.modal({
      title:'UPI deep link', sub:'NPCI specification — no payment data touches Viatica',
      body:`<div class="packet">${esc(link)}</div>
        <p class="small muted" style="margin-top:12px">On a phone this opens the user's own UPI app
        with the amount and reference pre-filled. Nothing is charged in this prototype.</p>`});
  };
  on(host, '[data-scan]', 'click', e => runScan(host, e.currentTarget.dataset.scan, app));

  drawPass(host);
}

async function drawPass(host) {
  const trip = state.trip;
  const entry = trip.tickets.entries[activeEntry];
  const card = host.querySelector('#passCard');
  if (!card || !entry) return;

  const paint = async () => {
    if (!document.body.contains(card)) { clearInterval(passTimer); return; }
    const e = { placeId: entry.placeId, date: entry.date, window: entry.window, pax: entry.pax };
    const code = await mintCode({ tripId: trip.id, holderId: trip.group[0].id }, e);
    trip._lastCode = code;
    const qr = encodeQR(code.text);
    const q = qr.size, pad = 2, tot = q + pad * 2;
    const left = secondsLeft();

    card.innerHTML = `
      <div class="pass-h">
        <div class="wordmark">Viatica<small>Trip Pass</small></div>
        <div class="id">${esc(trip.passId)} · ${esc(trip.group[0].name)} · ${entry.pax} people</div>
      </div>
      <div class="qr-wrap">
        <svg class="qr" viewBox="0 0 ${tot} ${tot}" shape-rendering="crispEdges">
          <rect width="${tot}" height="${tot}"/>
          <g transform="translate(${pad},${pad})"><path d="${qrPath(qr.modules)}"/></g>
        </svg>
      </div>
      <div class="qr-meta">
        <div class="qr-code">${esc(code.short)}</div>
        <div class="small muted" style="margin-top:3px">rotates in ${left}s · counter ${code.counter}</div>
        <div class="rotor"><i style="width:${Math.round(left/STEP_SECONDS*100)}%"></i></div>
      </div>
      <div class="rows" style="border-top:1px solid var(--hair)">
        <div class="row"><span class="label">Site</span><span>${esc(byId[entry.placeId].name)}</span></div>
        <div class="row"><span class="label">Date</span><span class="num">${esc(dayDate(entry.day))}</span></div>
        <div class="row"><span class="label">Slot window</span><span class="num">${esc(entry.window)}</span></div>
        ${entry.capacity ? `<div class="row"><span class="label">Slot capacity</span>
          <span class="num">${entry.held} of ${entry.capacity} this hour</span></div>` : ''}
        <div class="row"><span class="label">Signature</span>
          <span class="num tiny">HMAC-SHA256 · v${qr.version} QR</span></div>
      </div>`;
  };

  clearInterval(passTimer);
  await paint();
  passTimer = setInterval(paint, 1000);
}

async function runScan(host, kind, app) {
  const trip = state.trip;
  const entry = trip.tickets.entries[activeEntry];
  const box = host.querySelector('#verdicts');
  let text = trip._lastCode?.text;
  let now = Date.now();
  let gate = { placeId: entry.placeId };

  if (kind === 'old')   now = Date.now() + 60000;
  if (kind === 'forge') text = text.slice(0, -6) + 'deadbe';
  if (kind === 'wrong') gate = { placeId: PLACES.find(p => p.id !== entry.placeId).id };

  const v = await verifyCode(text, gate, { now, seen: state.gateSeen });
  state.scanLog.unshift({ ...v, kind, at: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }) });
  state.scanLog = state.scanLog.slice(0, 6);

  box.innerHTML = state.scanLog.map(s => `
    <div class="verdict ${s.ok?'ok':'bad'}">
      <b>${s.ok ? '✓ ADMIT' : '✕ REFUSE'} — ${esc(s.label)}</b>
      <div class="gate" style="margin-top:5px">
        ${s.info ? `${esc(s.info.tripId)} · ${esc(s.info.placeId)} · ${esc(s.info.window)} · ${s.info.pax} pax · counter ${s.info.counter}` : 'unparseable'}
      </div>
      <div class="tiny" style="margin-top:4px;opacity:.75">
        verified locally at ${esc(s.at)} — no network call · key synced ${esc(DEMO_VENUE_KEY.slice(0,18))}…
      </div>
    </div>`).join('');
}

// ── SAFETY ────────────────────────────────────────────────────────────────

export function renderSafety(host, app) {
  const trip = state.trip;
  if (!trip) return renderEmpty(host, 'No active trip', 'Safety context comes from the live trip record.', app);
  const s = trip.safety;
  const pos = expectedPosition(trip);
  const here = byId[pos?.at] || byId[trip.plan[0].anchor];

  host.innerHTML = `
  <div class="view-scroll"><div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Modules 05 & 06 · Emergency assistance and guardian</span>
        <h1>Safety</h1>
        <p>An SOS that already knows where you were supposed to be — and that still
           goes out when there is no data connection.</p>
      </div>
      <span class="tag ${state.network==='offline'?'tag-warn':'tag-ok'}">
        channel: ${state.network==='offline' ? 'SMS fallback' : 'Socket.io'}</span>
    </div>
    <div class="rule-orn"><i>❖</i></div>

    <div class="split">
      <div class="grid" style="gap:16px">
        <div class="card sec" style="text-align:center;padding:26px">
          <button class="sos-btn" id="sos"><span class="fill"></span>SOS<small>hold to send</small></button>
          <p class="small muted" style="margin:16px auto 0;max-width:330px">
            Hold for 1.5 seconds. Viatica sends your identity, live coordinates, the stop you
            should be at, your next stop, your group size and your guardian's number.
          </p>
        </div>

        ${s.sos ? sosPacket(s.sos) : ''}

        <div class="card sec">
          <div class="sec-h"><h3>Advisories on your route</h3>
            <span class="tag ${s.zones.length?'tag-warn':'tag-ok'}">${s.zones.length} geofenced</span></div>
          ${s.zones.length ? s.zones.map(z => `
            <div class="list-row">
              <span class="tag ${z.level==='restricted'?'tag-danger':z.level==='caution'?'tag-warn':''}">${esc(z.level)}</span>
              <div class="grow"><h4>${esc(z.title)}</h4>
                <div class="meta">${esc(z.note)}</div></div>
              <span class="tiny faint">${esc(z.hours)}</span>
            </div>`).join('') : '<p class="small faint">No advisories intersect this itinerary.</p>'}
        </div>
      </div>

      <div class="grid" style="gap:16px;align-content:start">
        <div class="card sec">
          <div class="sec-h"><h3>Remote guardian</h3>
            <span class="tag ${s.guardian.watching?'tag-ok':''}">${s.guardian.watching?'watching live':'off'}</span></div>
          <div class="kv"><span class="k">Guardian</span><span class="v">${esc(s.guardian.name)} · ${esc(s.guardian.relation)}</span></div>
          <div class="kv"><span class="k">Number</span><span class="v num">${esc(s.guardian.phone)}</span></div>
          <div class="kv"><span class="k">Consent given</span><span class="v">${esc(s.guardian.consentGivenAt)}</span></div>
          <div class="kv"><span class="k">Location pings</span><span class="v">${esc(s.pings.replace(/-/g,' '))}</span></div>
          <p class="small faint" style="margin:10px 0 0">
            Battery-aware: pings fire only during an active trip, only with consent, and stop
            the moment the trip ends.</p>
          <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:11px;justify-content:center" id="watch">
            ${icon('eye')} Open the guardian's view</button>
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Emergency numbers</h3></div>
          ${EMERGENCY.map(e => `<div class="kv">
            <span class="k">${esc(e.label)}</span>
            <span class="v num" style="${e.primary?'color:var(--madder);font-size:15px':''}">${esc(e.num)}</span></div>`).join('')}
          <p class="tiny faint" style="margin-top:10px">
            Grounded in ERSS-112 and the Ministry of Tourism 24×7 multilingual helpline.</p>
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Misuse controls</h3></div>
          <div class="kv"><span class="k">Login</span><span class="v">Firebase phone OTP — verified</span></div>
          <div class="kv"><span class="k">Responders</span><span class="v">Reputation-gated</span></div>
          <div class="kv"><span class="k">Reports</span><span class="v">Admin review queue</span></div>
          <div class="kv"><span class="k">Flagged this week</span><span class="v num">${INCIDENTS.filter(i=>i.status==='flagged').length}</span></div>
        </div>
      </div>
    </div>
  </div></div>`;

  holdToFire(host.querySelector('#sos'), () => {
    ACTIONS.sos(state.network === 'offline' ? 'Injured — no data' : 'Need help');
  });
  host.querySelector('#watch').onclick = () => app.modal(guardianSheet());
  host.querySelector('[data-x="clear"]')?.addEventListener('click', () => ACTIONS.clearSos());
}

function sosPacket(p) {
  const sms = `VIATICA SOS ${p.tripId}
${p.user.name} ${p.phone}
AT ${p.place.name} ${p.coords}
DAY ${p.day} EXPECTED ${p.place.name}
NEXT ${p.nextStop ? p.nextStop.name : 'end of day'}
GROUP ${p.group} GUARDIAN ${p.guardian.phone}`;
  return `
  <div class="card sec" style="border-color:var(--madder)">
    <div class="sec-h"><h3 style="color:var(--madder)">SOS ${esc(p.status)}</h3>
      <span class="tag tag-danger">${esc(p.channel)}</span></div>
    <div class="grid g2" style="gap:0 20px">
      <div>
        <div class="kv"><span class="k">Raised</span><span class="v num">${esc(p.at)}</span></div>
        <div class="kv"><span class="k">Kind</span><span class="v">${esc(p.kind)}</span></div>
        <div class="kv"><span class="k">Responder ETA</span><span class="v num">${esc(p.eta)}</span></div>
      </div>
      <div>
        <div class="kv"><span class="k">At</span><span class="v">${esc(p.place.name)}</span></div>
        <div class="kv"><span class="k">Coordinates</span><span class="v num">${esc(p.coords)}</span></div>
        <div class="kv"><span class="k">Next stop</span><span class="v">${p.nextStop?esc(p.nextStop.name):'—'}</span></div>
      </div>
    </div>
    <div class="rule"></div>
    <span class="label">Context packet ${state.network==='offline'?'— sent as SMS via the device intent':'— dispatched over Socket.io'}</span>
    <div class="packet" style="margin-top:8px">${esc(sms)}</div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-ghost btn-sm" data-x="clear">Mark resolved</button>
    </div>
  </div>`;
}

function guardianSheet() {
  const trip = state.trip;
  const pos = expectedPosition(trip);
  return {
    title: 'Guardian live view', sub: `${trip.safety.guardian.name} · read-only link`,
    body: `
      <div class="banner">${icon('eye')}<span>The guardian sees position and plan, never
        tickets, payments or messages. The link dies when the trip ends.</span></div>
      <div class="kv"><span class="k">Traveller</span><span class="v">${esc(trip.group[0].name)}</span></div>
      <div class="kv"><span class="k">Trip</span><span class="v">${esc(trip.title)}</span></div>
      <div class="kv"><span class="k">Day</span><span class="v num">${trip.currentDay} of ${trip.days}</span></div>
      <div class="kv"><span class="k">Last ping</span><span class="v num">${toHM(trip.clock)} · ${state.network==='offline'?'cached':'live'}</span></div>
      <div class="kv"><span class="k">Expected at</span><span class="v">${pos?.cur?esc(byId[pos.cur.placeId||pos.cur.to].name):'in transit'}</span></div>
      <div class="kv"><span class="k">Next</span><span class="v">${pos?.next?esc(byId[pos.next.placeId].name)+' at '+toHM(pos.next.start):'—'}</span></div>
      <div class="rule"></div>
      <span class="label">Remaining plan</span>
      <div class="trace" style="margin-top:8px">
        ${trip.plan.slice(trip.currentDay-1).map(d => `<div><span class="n">Day ${d.day}</span>
          <span class="p">${d.stops.map(s=>esc(byId[s].name)).join(' → ') || '—'}</span></div>`).join('')}
      </div>`,
  };
}

function holdToFire(btn, fn) {
  if (!btn) return;
  let t = null, raf = null, t0 = 0;
  const fill = btn.querySelector('.fill');
  const stop = () => { clearTimeout(t); cancelAnimationFrame(raf); fill.style.setProperty('--p','0%'); };
  const tick = () => {
    const p = Math.min(100, (Date.now() - t0) / 1500 * 100);
    fill.style.setProperty('--p', p + '%');
    if (p < 100) raf = requestAnimationFrame(tick);
  };
  btn.addEventListener('pointerdown', () => {
    t0 = Date.now(); tick(); t = setTimeout(() => { stop(); fn(); }, 1500);
  });
  ['pointerup','pointerleave','pointercancel'].forEach(e => btn.addEventListener(e, stop));
}

// ── GROUP ─────────────────────────────────────────────────────────────────

export function renderGroup(host, app) {
  const trip = state.trip;
  if (!trip) return renderEmpty(host, 'No group trip', 'Plan a journey to open group coordination.', app);
  const st = settleUp(trip);
  const routed = new Set(trip.plan.flatMap(d => d.stops));
  const candidates = PLACES
    .filter(p => p.corridor && !routed.has(p.id) && p.id !== trip.originId)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  host.innerHTML = `
  <div class="view-scroll"><div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Module 08 · Group travel</span>
        <h1>Group</h1>
        <p>Vote on stops, keep must-dos honest, and settle expenses without an argument.
           A vote that passes forks the trip and re-solves it.</p>
      </div>
      <span class="tag">${trip.group.length} travelling</span>
    </div>
    <div class="rule-orn"><i>❖</i></div>

    <div class="split">
      <div class="grid" style="gap:16px">
        <div class="card sec">
          <div class="sec-h"><h3>Open votes</h3><span class="small faint">majority adds a must-do and re-solves</span></div>
          ${candidates.map(p => {
            const v = trip.votes[p.id];
            return `<div class="list-row">
              <div class="ico" style="width:30px;height:30px;border-radius:3px;background:var(--paper-3);border:1px solid var(--hair);display:grid;place-items:center">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--ink-2)" stroke-width="1.4"
                  stroke-linecap="round" stroke-linejoin="round"><path d="${GLYPHS[p.glyph] || GLYPHS.temple}"/></svg></div>
              <div class="grow"><h4>${esc(p.name)}</h4>
                <div class="meta">${esc(p.state)} · ${dur(p.visitMin)} · ${p.fee?money(p.fee)+'/head':'free'}</div></div>
              ${v ? `<span class="tag tag-ok">passed ${v.yes}–${v.no}</span>`
                  : `<button class="btn btn-sm" data-vote="${p.id}">${icon('vote')} Call a vote</button>`}
            </div>`;
          }).join('')}
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Expense ledger</h3>
            <button class="btn btn-sm btn-ghost" id="addExp">Add an expense</button></div>
          ${trip.ledger.length ? trip.ledger.map(e => `
            <div class="list-row">
              <div class="av" style="background:${trip.group.find(g=>g.id===e.memberId)?.colour}">
                ${esc(trip.group.find(g=>g.id===e.memberId)?.avatar || '?')}</div>
              <div class="grow"><h4>${esc(e.label)}</h4>
                <div class="meta">${esc(trip.group.find(g=>g.id===e.memberId)?.name)} · ${esc(e.at)}</div></div>
              <span class="num">${money(e.amount)}</span>
            </div>`).join('')
            : '<p class="small faint">Nothing logged yet — add an expense to see the split move.</p>'}
        </div>
      </div>

      <div class="grid" style="gap:16px;align-content:start">
        <div class="card sec">
          <div class="sec-h"><h3>Who paid what</h3><span class="tag">${money(st.total)} total</span></div>
          ${st.balances.map(b => `
            <div class="list-row">
              <div class="av" style="background:${b.colour}">${esc(b.avatar)}</div>
              <div class="grow"><h4>${esc(b.name)}</h4>
                <div class="meta">${esc(b.role)}${b.verified?' · phone verified':' · unverified'}</div></div>
              <div style="text-align:right">
                <div class="num">${money(b.paid)}</div>
                <div class="tiny" style="color:${b.delta<0?'var(--madder)':'var(--forest)'}">
                  ${b.delta>=0?'+':''}${money(b.delta)}</div></div>
            </div>`).join('')}
          <div class="rule"></div>
          <div class="kv"><span class="k">Equal share</span><span class="v num">${money(st.share)}</span></div>
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Settle up</h3><span class="tag tag-brass">${st.transfers.length} transfers</span></div>
          ${st.transfers.length ? st.transfers.map(t => `
            <div class="list-row">
              <div class="av" style="background:${t.from.colour};width:26px;height:26px;font-size:12px">${esc(t.from.avatar)}</div>
              <span class="faint">→</span>
              <div class="av" style="background:${t.to.colour};width:26px;height:26px;font-size:12px">${esc(t.to.avatar)}</div>
              <div class="grow small">${esc(t.from.name)} pays ${esc(t.to.name)}</div>
              <span class="num">${money(t.amount)}</span>
            </div>`).join('') : '<p class="small faint">Everyone is square.</p>'}
          <p class="tiny faint" style="margin-top:10px">Minimised to the fewest transfers, then handed to UPI.</p>
        </div>
      </div>
    </div>
  </div></div>`;

  on(host, '[data-vote]', 'click', e => ACTIONS.vote(e.currentTarget.dataset.vote));
  host.querySelector('#addExp').onclick = () => app.modal(expenseSheet(app));
}
function expenseSheet(app) {
  const trip = state.trip;
  return {
    title: 'Add an expense', sub: 'It re-splits the moment it lands',
    body: `
      <span class="label">Who paid</span>
      <div style="display:flex;gap:6px;margin:8px 0 14px">
        ${trip.group.map((g,i) => `<button class="chip" data-who="${g.id}" aria-pressed="${i===0}">${esc(g.name)}</button>`).join('')}
      </div>
      <span class="label">What for</span>
      <input type="text" id="expLabel" value="Lunch at the Hampi bazaar" style="margin:8px 0 14px">
      <span class="label">Amount</span>
      <input type="number" id="expAmt" value="840" style="margin-top:8px">`,
    footer: `<button class="btn btn-primary" id="expGo">Add expense</button>`,
    wire(root) {
      let who = trip.group[0].id;
      on(root, '[data-who]', 'click', e => {
        who = e.currentTarget.dataset.who;
        root.querySelectorAll('[data-who]').forEach(b => b.setAttribute('aria-pressed', b.dataset.who === who));
      });
      root.querySelector('#expGo').onclick = () => {
        ACTIONS.addExpense(who, root.querySelector('#expLabel').value || 'Expense',
                           +root.querySelector('#expAmt').value || 0);
        app.close();
      };
    },
  };
}

// ── DEPARTMENT DASHBOARD ──────────────────────────────────────────────────

export function renderDesk(host, app) {
  const totalFoot = Object.values(FOOTFALL).reduce((s,a) => s + a.reduce((x,y)=>x+y,0), 0);
  const pending = REPORTS.filter(r => r.status === 'pending');

  host.innerHTML = `
  <div class="view-scroll"><div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Module 10 · Governance</span>
        <h1>Department desk</h1>
        <p>Live footfall, slot control, incidents and a moderated scam queue — the reason
           a tourism department has something to gain by joining.</p>
      </div>
      <span class="tag tag-indigo">Karnataka corridor · simulated</span>
    </div>
    <div class="rule-orn"><i>❖</i></div>

    <div class="grid g4" style="margin-bottom:18px">
      <div class="card stat"><span class="label">Visitors today</span>
        <b class="num">${totalFoot.toLocaleString('en-IN')}</b><div class="sub">across 5 monitored sites</div></div>
      <div class="card stat"><span class="label">Slots at capacity</span>
        <b class="num">${Object.values(SLOTS).reduce((s,v)=>s+Object.values(v.sold).filter(x=>x>=v.cap).length,0)}</b>
        <div class="sub">hour-blocks sold out</div></div>
      <div class="card stat"><span class="label">Incidents this week</span>
        <b class="num">${INCIDENTS.length}</b><div class="sub">${INCIDENTS.filter(i=>i.status==='resolved').length} resolved</div></div>
      <div class="card stat"><span class="label">Reports pending</span>
        <b class="num" style="color:${pending.length?'var(--warn)':'inherit'}">${pending.length}</b>
        <div class="sub">awaiting moderation</div></div>
    </div>

    <div class="split">
      <div class="grid" style="gap:16px">
        <div class="card sec">
          <div class="sec-h"><h3>Footfall by hour</h3><span class="small faint">green normal · amber busy · red at capacity</span></div>
          ${Object.entries(FOOTFALL).map(([id, arr]) => {
            const cap = SLOTS[id]?.cap ?? Math.max(...arr);
            const max = Math.max(...arr, cap);
            return `<div style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;align-items:baseline">
                <b style="font-family:var(--display);font-size:14px">${esc(byId[id].name)}</b>
                <span class="tiny faint">peak ${Math.max(...arr)} · capacity ${cap}/hr</span>
              </div>
              <div class="bars" style="height:64px;margin-top:6px">
                ${arr.map(v => `<div class="b ${v>=cap?'full':v>cap*.75?'hot':''}"
                  style="height:${Math.round(v/max*100)}%" title="${v}"></div>`).join('')}
                ${cap < max * 0.97 ? `<div class="cap-line" style="bottom:${Math.round(cap/max*100)}%">
                  <span>hourly cap ${cap}</span></div>` : ''}
              </div>
              <div class="bars-x">${FOOTFALL_HOURS.map(h=>`<span>${h}</span>`).join('')}</div>
            </div>`;
          }).join('')}
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Scam & overcharge queue</h3>
            <span class="tag tag-warn">${pending.length} pending</span></div>
          ${REPORTS.map(r => `
            <div class="list-row">
              <span class="tag ${r.status==='verified'?'tag-ok':'tag-warn'}">${esc(r.status)}</span>
              <div class="grow">
                <h4>${esc(r.kind)} · ${esc(byId[r.at].name)}</h4>
                <div class="meta">${esc(r.text)}</div>
                <div class="tiny faint" style="margin-top:3px">
                  reporter reputation ${r.rep}/100 · ${r.votes} corroborations · ${esc(r.ago)}</div>
              </div>
              ${r.status==='pending' ? `<div style="display:flex;gap:5px;flex:none">
                <button class="btn btn-xs" data-mod="ok|${r.id}">Verify</button>
                <button class="btn btn-xs btn-ghost" data-mod="no|${r.id}">Reject</button></div>` : ''}
            </div>`).join('')}
        </div>
      </div>

      <div class="grid" style="gap:16px;align-content:start">
        <div class="card sec">
          <div class="sec-h"><h3>Slot control</h3><span class="tag tag-brass">fragile sites</span></div>
          ${Object.entries(SLOTS).map(([id, s]) => {
            const used = Object.values(s.sold).reduce((a,b)=>a+b,0);
            const capT = s.cap * Object.keys(s.sold).length;
            const pc = Math.round(used/capT*100);
            return `<div style="margin-bottom:13px">
              <div style="display:flex;justify-content:space-between;font-size:12.5px">
                <span>${esc(byId[id].name)}</span><span class="num">${pc}%</span></div>
              <div class="meter ${pc>90?'over':pc>75?'warn':''}" style="margin-top:5px"><i style="width:${pc}%"></i></div>
              <div class="tiny faint" style="margin-top:3px">${used} of ${capT} slot-places sold · cap ${s.cap}/hr</div>
            </div>`;
          }).join('')}
          <p class="tiny faint">Capping arrivals per hour is what keeps a site like Vittala usable.</p>
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Incident feed</h3></div>
          ${INCIDENTS.map(i => `
            <div class="list-row">
              <span class="tag ${i.type==='SOS'?'tag-danger':i.status==='flagged'?'tag-warn':''}">${esc(i.type)}</span>
              <div class="grow"><h4>${esc(byId[i.at].name)}</h4>
                <div class="meta">${esc(i.note)}</div>
                <div class="tiny faint">${esc(i.t)} · ${esc(i.who)}</div></div>
              <span class="tiny faint">${esc(i.status)}</span>
            </div>`).join('')}
        </div>

        <div class="card sec">
          <div class="sec-h"><h3>Verified guides</h3><span class="tag tag-ok">direct bookings</span></div>
          ${GUIDES.map(g => `
            <div class="list-row">
              <div class="av" style="background:var(--forest)">${esc(g.name[0])}</div>
              <div class="grow"><h4>${esc(g.name)}</h4>
                <div class="meta">${esc(byId[g.at].name)} · ${g.langs.join(', ')}</div>
                <div class="tiny faint">${esc(g.verified)}</div></div>
              <div style="text-align:right">
                <div class="num">${money(g.rate)}</div>
                <div class="tiny stars">${'★'.repeat(Math.round(g.rating))}</div>
                <div class="tiny faint">${g.jobs} trips</div></div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </div></div>`;

  on(host, '[data-mod]', 'click', e => {
    const [act, id] = e.currentTarget.dataset.mod.split('|');
    const r = REPORTS.find(x => x.id === id);
    if (r) r.status = act === 'ok' ? 'verified' : 'rejected';
    ACTIONS.go('desk');
    app.toast(`Report ${id} ${act === 'ok' ? 'verified — fare band updated' : 'rejected'}`);
  });
}

// ── ABOUT ─────────────────────────────────────────────────────────────────

export function renderAbout(host) {
  const modules = [
    ['01','Itinerary planning','Greedy-insertion solver over opening hours, visit time and a travel matrix','Plan · Trip'],
    ['02','Transportation','Time / cost / CO₂ comparison with an expected fare band before you agree a price','Trip → any leg'],
    ['03','Digital ticketing','One Trip Pass per trip; HMAC-signed, TOTP-rotating QR verified offline at the gate','Pass'],
    ['04','Slot control','Capacity held per place per hour to manage crowding at fragile sites','Pass · Desk'],
    ['05','Emergency assistance','SOS carrying live trip context, falling back to device SMS with no data','Safety'],
    ['06','Guardian & geofencing','A remote guardian watching live; geofenced risk advisories on the route','Safety'],
    ['07','Budget','Transport, entry and living costs projected against the budget, re-solved on change','Trip'],
    ['08','Group travel','Votes on stops, shared must-dos, expense ledger and settle-up','Group'],
    ['09','Voice & multilingual','Web Speech planning in English, Hindi and Kannada','Plan'],
    ['10','Governance','Footfall, incidents, verified guides and a moderated scam queue','Desk'],
  ];
  host.innerHTML = `
  <div class="view-scroll"><div class="page">
    <div class="page-head">
      <div>
        <span class="eyebrow">Team S2P10 · OggyAndTheCockroaches · PS IHSIH019 · YUKTI IR2026-1042884</span>
        <h1>What this prototype shows</h1>
        <p>Ten modules, one live trip record. Every figure on screen is simulated seed data.</p>
      </div>
    </div>
    <div class="rule-orn"><i>❖</i></div>

    <div class="banner">${icon('bolt')}<span><b>Demonstration build.</b> Places, fares, footfall,
      incidents and guides are seeded fixtures. The scheduler, the HMAC/TOTP ticket signing
      and the QR encoding are real and run in your browser.</span></div>

    <div class="split">
      <div class="card sec">
        <div class="sec-h"><h3>Module traceability</h3><span class="tag">10 modules</span></div>
        ${modules.map(([n,t,d,w]) => `
          <div class="list-row">
            <div class="av" style="background:var(--ink-3)">${n}</div>
            <div class="grow"><h4>${esc(t)}</h4><div class="meta">${esc(d)}</div></div>
            <span class="tag">${esc(w)}</span>
          </div>`).join('')}
      </div>

      <div class="grid" style="gap:16px;align-content:start">
        <div class="card sec">
          <div class="sec-h"><h3>What is genuinely implemented</h3></div>
          <div class="kv"><span class="k">Greedy-insertion scheduler</span><span class="v">real, in-browser</span></div>
          <div class="kv"><span class="k">Travel matrix</span><span class="v">seeded + verified legs</span></div>
          <div class="kv"><span class="k">HMAC-SHA256 signing</span><span class="v">real (Web Crypto)</span></div>
          <div class="kv"><span class="k">TOTP rotation</span><span class="v">real, ${STEP_SECONDS}s step</span></div>
          <div class="kv"><span class="k">QR encoding</span><span class="v">real, ISO 18004</span></div>
          <div class="kv"><span class="k">Offline verification</span><span class="v">real, no network call</span></div>
          <div class="kv"><span class="k">Service worker cache</span><span class="v">real</span></div>
          <div class="kv"><span class="k">Web Speech input</span><span class="v">real where supported</span></div>
          <div class="kv"><span class="k">Maps, tiles, OTP, UPI, SMS</span><span class="v">simulated</span></div>
        </div>
        <div class="card sec">
          <div class="sec-h"><h3>Research grounding</h3></div>
          <ol class="small muted" style="padding-left:17px;margin:0;line-height:1.75">
            ${REFERENCES.map(r => `<li>${esc(r)}</li>`).join('')}
          </ol>
        </div>
      </div>
    </div>
  </div></div>`;
}

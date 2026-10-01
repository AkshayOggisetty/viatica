// THE ONE LIVE TRIP RECORD.
//
// Itinerary, tickets, budget, group and safety are fields of a single object.
// Nothing mutates them independently: every change goes through an action,
// which re-solves what it must and then rebuilds the dependent fields. That
// cascade is what "change one part and the rest repairs itself" means here.

import { solve, PACE, toHM, toMin } from './scheduler.js';
import { byId } from '../data/places.js';
import { legOptions } from '../data/transport.js';
import { USER, GROUP, GUARDIAN, RISK_ZONES, SLOTS } from '../data/seed.js';

const listeners = new Set();
export const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach(fn => fn(state));

export const state = {
  ready: false,
  view: 'atlas',
  network: 'online',
  lang: 'en',
  user: USER,
  trip: null,
  gateSeen: new Set(),
  scanLog: [],
  atlas: { level: 'india', state: null, place: null, lens: null, layers:
           { geography:true, culture:true, tourism:true, journey:true } },
};

export const DATE0 = new Date('2026-03-14T00:00:00');
export const dayDate = n => {
  const d = new Date(DATE0); d.setDate(d.getDate() + n - 1);
  return d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });
};
export const isoDate = n => {
  // Built from local parts: toISOString() would shift a local midnight back a
  // day in any timezone east of UTC, and that date is signed into the ticket.
  const d = new Date(DATE0); d.setDate(d.getDate() + n - 1);
  const p = x => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

let eventSeq = 0;
function log(trip, kind, text, detail) {
  trip.events.unshift({
    id: ++eventSeq, kind, text, detail,
    at: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
  });
  trip.events = trip.events.slice(0, 40);
}

// ── Derived fields — rebuilt from the itinerary every time it changes ──────

function buildTickets(trip) {
  const entries = [];
  trip.plan.forEach(day => {
    day.items.filter(i => i.kind === 'visit').forEach(i => {
      const p = byId[i.placeId];
      if (!p.fee && !SLOTS[p.id]) return;                  // free & uncapped
      const slot = SLOTS[p.id];
      const hour = toHM(i.start).slice(0, 2);
      entries.push({
        placeId: p.id, day: day.day, date: isoDate(day.day),
        window: `${toHM(i.start)}-${toHM(i.end)}`,
        pax: trip.group.length, fee: p.fee, total: p.fee * trip.group.length,
        capacity: slot ? slot.cap : null,
        held: slot ? (slot.sold[hour] ?? Math.round(slot.cap * 0.6)) : null,
        state: 'held',
      });
    });
  });
  return { passId: trip.passId, entries,
           total: entries.reduce((s,e) => s + e.total, 0),          // what the group pays
           perHead: entries.reduce((s,e) => s + e.fee, 0) };        // what the solver budgets
}

// The budget is stated per traveller, which is also how the solver counts:
// entry fees, transport and living costs are all one person's share. The group
// total is derived from it, never the other way round.
function buildBudget(trip) {
  const travel  = trip.plan.reduce((s,d) => s + d.travelCost, 0);
  const tickets = trip.tickets.perHead;
  const living  = PACE[trip.pace].live * trip.days;
  const spent   = trip.ledger.reduce((s,e) => s + e.amount, 0);
  const planned = travel + tickets + living;
  return {
    travel, tickets, living, planned, spent,
    budget: trip.budget,
    remaining: trip.budget - planned,
    groupTotal: planned * trip.group.length,
    heads: trip.group.length,
    over: planned > trip.budget,
  };
}

function buildSafety(trip) {
  // Which advisories does this itinerary actually pass through?
  const visited = new Set(trip.plan.flatMap(d => d.stops));
  const near = RISK_ZONES.filter(z =>
    [...visited].some(pid => {
      const p = byId[pid];
      const dLat = (p.lat - z.at[0]) * 111, dLon = (p.lon - z.at[1]) * 105;
      return Math.hypot(dLat, dLon) <= z.r + 3;
    }));
  return {
    zones: near, guardian: trip.safety?.guardian ?? { ...GUARDIAN },
    sos: trip.safety?.sos ?? null,
    consent: trip.safety?.consent ?? true,
    pings: trip.safety?.pings ?? 'active-trip-only',
  };
}

/** Where the traveller is meant to be right now — used by the SOS packet. */
export function expectedPosition(trip) {
  const day = trip.plan[trip.currentDay - 1];
  if (!day) return null;
  const nowMin = trip.clock;
  let cur = null, next = null;
  for (const it of day.items) {
    if (it.kind === 'visit') {
      if (it.start <= nowMin && nowMin <= it.end) cur = it;
      else if (it.start > nowMin && !next) next = it;
    }
    if (it.kind === 'travel' && it.start <= nowMin && nowMin <= it.end) cur = it;
  }
  return { day: day.day, cur, next, at: cur?.placeId ?? cur?.to ?? day.anchor };
}

function rebuild(trip) {
  trip.tickets = buildTickets(trip);
  trip.budget_ = buildBudget(trip);
  trip.safety  = buildSafety(trip);
  return trip;
}

// ── Actions ───────────────────────────────────────────────────────────────

export function planTrip(input) {
  const res = solve(input);
  const trip = {
    id: 'TP-2026-0417', passId: 'TP-2026-0417',
    title: input.title || 'Hampi & the Chalukyan corridor',
    ...input,
    plan: res.plan, trace: res.trace, stats: res.stats,
    solveOpts: res.opts,
    frozen: [], currentDay: 1, clock: toMin('09:20'),
    group: GROUP.map(g => ({ ...g })),
    votes: {}, ledger: [], events: [],
    delays: [], excluded: [],
    safety: null, tickets: { entries: [], total: 0 },
    solvedAt: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
    solveMs: res.stats.places ? 40 + res.stats.places * 7 : 0,
  };
  rebuild(trip);
  log(trip, 'solve', `Plan solved — ${res.stats.places} places over ${input.days} days`,
      `${res.trace.length} insertion steps · ₹${trip.budget_.planned.toLocaleString('en-IN')} of ₹${input.budget.toLocaleString('en-IN')}`);
  state.trip = trip; state.ready = true;
  emit();
  return trip;
}

/** Where each stop sits, so a re-solve can be described truthfully. */
const dayOf = plan => {
  const m = new Map();
  plan.forEach(d => d.stops.forEach(s => m.set(s, d.day)));
  return m;
};

/** Re-solve only the stops that have not happened yet. */
function resolveRemaining(trip, changes, reason, detail) {
  const done = new Set(trip.frozen);
  const before = { at: dayOf(trip.plan), cost: trip.budget_.planned };

  const res = solve({
    ...trip.solveOpts, ...changes,
    exclude: [...done, ...trip.excluded, ...(changes.exclude || [])],
  });

  // Days already lived keep their original shape; the rest is rebuilt.
  const kept = trip.plan.slice(0, trip.currentDay - 1);
  trip.plan = [...kept, ...res.plan.slice(kept.length)]
    .map((d, i) => ({ ...d, day: i + 1 }));
  trip.trace = res.trace;
  trip.stats = res.stats;
  trip.solveOpts = { ...res.opts };
  Object.assign(trip, changes);
  rebuild(trip);

  const after = { at: dayOf(trip.plan), cost: trip.budget_.planned };
  const dropped = [...before.at.keys()].filter(k => !after.at.has(k));
  const added   = [...after.at.keys()].filter(k => !before.at.has(k));
  const moved   = [...after.at.keys()].filter(k => before.at.has(k) && before.at.get(k) !== after.at.get(k));
  const name = id => byId[id]?.name ?? id;

  const parts = [detail];
  if (dropped.length) parts.push(`dropped ${dropped.map(name).join(', ')}`);
  if (moved.length)   parts.push(`moved ${moved.map(d => `${name(d)} → day ${after.at.get(d)}`).join(', ')}`);
  if (added.length)   parts.push(`picked up ${added.map(name).join(', ')}`);
  if (!dropped.length && !moved.length && !added.length) parts.push('itinerary already optimal — unchanged');
  parts.push(`budget ₹${before.cost.toLocaleString('en-IN')} → ₹${after.cost.toLocaleString('en-IN')}`);
  parts.push(`${trip.tickets.entries.length} slots re-held`);

  log(trip, 'resolve', reason, parts.join(' · '));
  emit();
  return trip;
}

export const ACTIONS = {
  /** A bus runs late. Today's window shrinks and the rest re-solves around it. */
  delay(mins = 90, note = 'Bus from Hospet delayed') {
    const trip = state.trip;
    const day = trip.plan[trip.currentDay - 1];
    trip.delays.push({ mins, note, day: trip.currentDay });
    trip.clock += mins;

    // The hours are simply gone: today cannot start before the bus arrives.
    const dayOpen = { ...(trip.solveOpts.dayOpen || {}) };
    dayOpen[trip.currentDay] = (day?.open ?? trip.clock) + mins;

    log(trip, 'alert', `${note} — ${mins} min`,
        `Day ${trip.currentDay} now starts at ${toHM(dayOpen[trip.currentDay])}; re-solving what is left`);
    return resolveRemaining(trip, { dayOpen },
      `Itinerary repaired around a ${mins}-minute delay`,
      `today opens ${toHM(dayOpen[trip.currentDay])} instead of ${toHM(day?.open ?? 0)}`);
  },

  /** The traveller cuts the budget mid-trip. */
  budget(newBudget) {
    const trip = state.trip;
    return resolveRemaining(trip, { budget: newBudget },
      `Budget changed to ₹${newBudget.toLocaleString('en-IN')}`,
      'Remaining stops and transport modes re-solved to fit');
  },

  /** The group votes a stop in. It becomes a must-do and the plan forks. */
  vote(placeId) {
    const trip = state.trip;
    const mustDo = [...new Set([...(trip.solveOpts.mustDo || []), placeId])];
    trip.votes[placeId] = { yes: trip.group.length - 1, no: 1, closed: true };
    return resolveRemaining(trip, { mustDo },
      `Group voted in ${byId[placeId].name}`,
      `${trip.group.length - 1} of ${trip.group.length} in favour; forked and re-solved`);
  },

  /** A site closes. It is excluded and the day is rebuilt. */
  close(placeId, why = 'closed for conservation work') {
    const trip = state.trip;
    trip.excluded.push(placeId);
    return resolveRemaining(trip, {},
      `${byId[placeId].name} ${why}`,
      'Slot released and the day re-solved around it');
  },

  /** Pace change — the whole trip re-solves. */
  pace(pace) {
    return resolveRemaining(state.trip, { pace }, `Pace set to ${PACE[pace].label}`,
      'Day windows and stop counts re-solved');
  },

  /** Mark the current stop done; it freezes and stops being re-planned. */
  complete(placeId) {
    const trip = state.trip;
    if (!trip.frozen.includes(placeId)) trip.frozen.push(placeId);
    log(trip, 'done', `${byId[placeId].name} completed`, 'Frozen — excluded from future re-solves');
    rebuild(trip); emit();
  },

  advanceDay() {
    const trip = state.trip;
    if (trip.currentDay >= trip.days) return;
    const day = trip.plan[trip.currentDay - 1];
    day.stops.forEach(s => { if (!trip.frozen.includes(s)) trip.frozen.push(s); });
    trip.currentDay++;
    trip.clock = toMin('08:30');
    log(trip, 'day', `Day ${trip.currentDay} begins`, `${trip.frozen.length} stops now frozen`);
    rebuild(trip); emit();
  },

  network(mode) {
    state.network = mode;
    if (state.trip) log(state.trip, mode === 'offline' ? 'offline' : 'online',
      mode === 'offline' ? 'Network lost — running from cache' : 'Network restored',
      mode === 'offline'
        ? 'Plan, Trip Pass and map tiles served by the service worker; SOS falls back to SMS'
        : 'Queued changes synced');
    emit();
  },

  sos(kind = 'Need help') {
    const trip = state.trip;
    const pos = expectedPosition(trip);
    const p = byId[pos?.at] || byId[trip.plan[0].anchor];
    const packet = {
      kind, at: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
      user: trip.group[0], phone: state.user.phone,
      place: p, expected: pos,
      coords: `${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}`,
      day: trip.currentDay, tripId: trip.id,
      group: trip.group.length,
      channel: state.network === 'offline' ? 'SMS (device intent)' : 'Socket.io → responder + guardian',
      guardian: trip.safety.guardian,
      nextStop: pos?.next ? byId[pos.next.placeId] : null,
      zones: trip.safety.zones,
      status: 'dispatched',
      eta: state.network === 'offline' ? '—' : '9 min',
    };
    trip.safety.sos = packet;
    log(trip, 'sos', `SOS dispatched — ${kind}`,
        `${packet.channel} · context: day ${packet.day}, ${p.name}, ${packet.coords}`);
    emit();
    return packet;
  },

  clearSos() {
    const trip = state.trip;
    if (trip.safety.sos) { trip.safety.sos.status = 'resolved'; log(trip,'done','SOS resolved','Responder stood down'); }
    emit();
  },

  addExpense(memberId, label, amount, placeId) {
    const trip = state.trip;
    trip.ledger.push({ id: trip.ledger.length + 1, memberId, label, amount, placeId,
                       at: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) });
    const m = trip.group.find(g => g.id === memberId); if (m) m.paid += amount;
    rebuild(trip);
    log(trip, 'money', `${m?.name || 'Someone'} paid ₹${amount} — ${label}`, 'Split recomputed');
    emit();
  },

  setLang(lang) { state.lang = lang; emit(); },
  go(view, extra = {}) { state.view = view; Object.assign(state, extra); emit(); },
  atlas(patch) { Object.assign(state.atlas, patch); emit(); },
};

/** Settle-up: who owes whom, minimised to the fewest transfers. */
export function settleUp(trip) {
  const n = trip.group.length;
  const total = trip.group.reduce((s,g) => s + g.paid, 0);
  const share = total / n;
  const bal = trip.group.map(g => ({ ...g, delta: +(g.paid - share).toFixed(0) }));
  const debtors  = bal.filter(b => b.delta < 0).sort((a,b) => a.delta - b.delta);
  const creditors= bal.filter(b => b.delta > 0).sort((a,b) => b.delta - a.delta);
  const transfers = [];
  let i = 0, j = 0;
  const d = debtors.map(x=>({...x})), c = creditors.map(x=>({...x}));
  while (i < d.length && j < c.length) {
    const amt = Math.min(-d[i].delta, c[j].delta);
    if (amt > 0) transfers.push({ from: d[i], to: c[j], amount: Math.round(amt) });
    d[i].delta += amt; c[j].delta -= amt;
    if (Math.abs(d[i].delta) < 1) i++;
    if (c[j].delta < 1) j++;
  }
  return { total, share: Math.round(share), balances: bal, transfers };
}

/** Options for one leg of the plan, for the transport comparison sheet. */
export function legChoices(from, to) { return legOptions(from, to); }

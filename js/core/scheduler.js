// Greedy-insertion scheduler.
//
// This is the client-side mirror of the server solver described in the
// technical approach: a team-orienteering-style heuristic that inserts the
// highest profit-per-minute candidate into the cheapest feasible position,
// subject to opening hours, visit duration, a travel-time matrix and a budget.
// It is deliberately greedy rather than exact so that a re-solve is instant.

import { byId, PLACES } from '../data/places.js';
import { bestLeg, legOptions, distanceKm } from '../data/transport.js';

export const PACE = {
  relaxed:  { label:'Relaxed',  dayStart:'08:30', dayEnd:'19:00', maxStops:3, buffer:35, live:1400 },
  balanced: { label:'Balanced', dayStart:'07:30', dayEnd:'20:00', maxStops:4, buffer:22, live:1100 },
  packed:   { label:'Packed',   dayStart:'06:30', dayEnd:'21:30', maxStops:6, buffer:12, live:900  },
};

export const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
export const toHM  = m => {
  m = ((Math.round(m) % 1440) + 1440) % 1440;
  return String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
};

// How well a place matches the traveller's declared interests.
function profitOf(p, interests, pace) {
  const overlap = p.kinds.filter(k => interests.includes(k)).length;
  const match = overlap === 0 ? 0.28 : 1 + (overlap - 1) * 0.45;
  const crowdPenalty = pace === 'relaxed' ? 1 - p.crowd * 0.35 : 1 - p.crowd * 0.12;
  return (p.rating / 5) * match * crowdPenalty * 100;
}

function scope(opts) {
  let pool = PLACES.filter(p => p.id !== opts.originId);
  if (opts.states?.length) pool = pool.filter(p => opts.states.includes(p.state));
  else if (opts.corridorOnly !== false) pool = pool.filter(p => p.corridor);
  if (opts.exclude?.length) pool = pool.filter(p => !opts.exclude.includes(p.id));
  // Keep the search space sane: nearest 40 to the origin.
  const o = byId[opts.originId];
  return pool
    .map(p => ({ p, d: distanceKm(opts.originId, p.id) }))
    .sort((a,b) => a.d - b.d)
    .slice(0, 40)
    .map(x => x.p);
}

function emptyDays(n, opts, startAnchor) {
  const cfg = PACE[opts.pace];
  return Array.from({ length: n }, (_, i) => ({
    day: i + 1,
    anchor: i === 0 ? startAnchor : null,   // resolved as days fill
    // A delay does not vanish: it moves the start of the day it lands on.
    open: opts.dayOpen?.[i + 1] ?? toMin(cfg.dayStart),
    close: toMin(cfg.dayEnd),
    stops: [],                              // ordered placeIds
  }));
}

// Rebuild the concrete timeline for one day from its ordered stops.
function layout(day, opts, prefer) {
  const cfg = PACE[opts.pace];
  const items = [];
  let cursor = day.open;
  let at = day.anchor;
  let travelCost = 0, feeCost = 0, co2 = 0, nightMins = 0;

  let first = true;
  for (const pid of day.stops) {
    const p = byId[pid];
    if (at && at !== pid) {
      const leg = bestLeg(at, pid, prefer);
      if (!leg) return null;
      // A long opening hop is how this corridor is actually travelled: the
      // night bus or the overnight train. It departs the evening before and
      // hands the traveller the whole day at the other end.
      const overnight = first && leg.mins >= 285;
      const start = overnight ? day.open - leg.mins : cursor;
      const end   = overnight ? day.open : cursor + leg.mins;
      items.push({ kind:'travel', from:at, to:pid, mode:leg.mode, label:leg.label,
                   mins:leg.mins, cost:leg.cost, band:leg.band, co2:leg.co2, km:leg.km,
                   verified:leg.verified, overnight, start, end });
      cursor = overnight ? day.open + 30 : cursor + leg.mins + cfg.buffer;
      if (overnight) nightMins += leg.mins;
      travelCost += leg.cost; co2 += leg.co2;
    }
    first = false;
    const openM = toMin(p.open), closeM = toMin(p.close);
    const arrive = Math.max(cursor, openM);
    if (arrive + p.visitMin > closeM) return null;      // window violated
    if (arrive + p.visitMin > day.close) return null;   // day exhausted
    if (arrive > cursor) items.push({ kind:'wait', mins: arrive - cursor, start:cursor, end:arrive });
    items.push({ kind:'visit', placeId:pid, start:arrive, end:arrive + p.visitMin,
                 mins:p.visitMin, fee:p.fee, slot:`${toHM(arrive)}–${toHM(arrive + p.visitMin)}` });
    feeCost += p.fee;
    cursor = arrive + p.visitMin;
    at = pid;
  }
  // `effort` is what insertion is scored against. A night on a bus is not
  // free just because it happens outside the day window.
  return { items, endAt: at, endTime: cursor,
           travelCost, feeCost, cost: travelCost + feeCost, co2, nightMins,
           effort: (cursor - day.open) + nightMins * 0.7 };
}

export function solve(opts) {
  const o = {
    originId:'blr', days:4, budget:9000, pace:'balanced',
    interests:['heritage','food'], mustDo:[], prefer:'balanced',
    livingPerDay: null, states:null, exclude:[], locked:null, dayOpen:null, ...opts,
  };
  const cfg = PACE[o.pace];
  const living = o.livingPerDay ?? cfg.live;
  const pool = scope(o);
  const days = emptyDays(o.days, o, o.originId);
  const trace = [];

  // Resolve day anchors lazily: day n+1 starts where day n ended.
  // Nobody takes the night bus four nights running.
  const maxOvernight = Math.max(1, Math.ceil(o.days / 3));

  const relayout = () => {
    let anchor = o.originId;
    const laid = [];
    let nights = 0;
    for (const d of days) {
      d.anchor = anchor;
      const L = layout(d, o, o.prefer);
      if (!L) return null;
      nights += L.items.filter(i => i.overnight).length;
      if (nights > maxOvernight) return null;
      laid.push(L);
      anchor = L.endAt || anchor;
    }
    return laid;
  };

  const totalCost = laid =>
    laid.reduce((s,L) => s + L.cost, 0) + living * o.days;

  // Reject insertions that turn a coherent day into a long back-track.
  const MAX_DETOUR = 210;

  const tryInsert = (pid, force = false) => {
    const base = relayout();
    let best = null;
    for (let di = 0; di < days.length; di++) {
      const d = days[di];
      if (d.stops.length >= cfg.maxStops) continue;
      for (let pos = 0; pos <= d.stops.length; pos++) {
        const backup = [...d.stops];
        d.stops.splice(pos, 0, pid);
        const laid = relayout();
        if (laid) {
          const cost = totalCost(laid);
          const extra = laid.reduce((s,L)=>s+L.endTime,0);
          const dayExtra = base ? laid[di].effort - base[di].effort : extra;
          const ok = cost <= o.budget &&
                     (force || backup.length === 0 || dayExtra <= MAX_DETOUR);
          if (ok) {
            const cand = { di, pos, cost, extra, dayExtra };
            // Classic greedy insertion: cheapest added travel time wins.
            if (!best || cand.dayExtra < best.dayExtra) best = cand;
          }
        }
        d.stops = backup;
      }
    }
    return best;
  };

  // 1 — must-dos are forced in first, whatever the profit.
  for (const pid of o.mustDo) {
    if (!byId[pid]) continue;
    if (o.exclude.includes(pid)) continue;   // dropped or already visited
    const spot = tryInsert(pid, true);
    if (spot) {
      days[spot.di].stops.splice(spot.pos, 0, pid);
      trace.push({ step:trace.length+1, placeId:pid, day:spot.di+1, why:'must-do — forced insertion' });
    } else {
      trace.push({ step:trace.length+1, placeId:pid, day:null, why:'must-do could not be fitted', failed:true });
    }
  }

  // 2 — greedy insertion by profit per added minute.
  const routed = new Set(days.flatMap(d => d.stops));
  let guard = 0;
  while (guard++ < 60) {
    let pick = null;
    const baseline = relayout();
    if (!baseline) break;
    const baseExtra = baseline.reduce((s,L)=>s+L.endTime,0);

    for (const p of pool) {
      if (routed.has(p.id)) continue;
      const spot = tryInsert(p.id);
      if (!spot) continue;
      const added = Math.max(1, spot.dayExtra);
      const ratio = profitOf(p, o.interests, o.pace) / added;
      if (!pick || ratio > pick.ratio) pick = { p, spot, ratio, added };
    }
    if (!pick) break;
    days[pick.spot.di].stops.splice(pick.spot.pos, 0, pick.p.id);
    routed.add(pick.p.id);
    trace.push({
      step: trace.length+1, placeId: pick.p.id, day: pick.spot.di + 1,
      why: `profit ${profitOf(pick.p,o.interests,o.pace).toFixed(0)} ÷ ${pick.added} min added = ${pick.ratio.toFixed(2)}`,
    });
  }

  const laid = relayout() || [];
  const plan = days.map((d,i) => ({
    day: d.day, anchor: d.anchor, stops: [...d.stops],
    items: laid[i]?.items ?? [],
    cost: laid[i]?.cost ?? 0,                 // travel + entry, for this day
    travelCost: laid[i]?.travelCost ?? 0,
    feeCost: laid[i]?.feeCost ?? 0,
    co2: laid[i]?.co2 ?? 0,
    endAt: laid[i]?.endAt, open: d.open, close: d.close,
  }));

  const travelCost = plan.reduce((s,d)=>s+d.travelCost,0);
  const feeCost    = plan.reduce((s,d)=>s+d.feeCost,0);
  return {
    plan, trace,
    opts: o,
    stats: {
      places: routed.size,
      travelCost, feeCost,
      living: living * o.days,
      total: travelCost + feeCost + living * o.days,
      budget: o.budget,
      co2: +plan.reduce((s,d)=>s+d.co2,0).toFixed(1),
      minutes: plan.reduce((s,d)=>s + d.items.filter(i=>i.kind==='visit').reduce((a,i)=>a+i.mins,0), 0),
      travelMinutes: plan.reduce((s,d)=>s + d.items.filter(i=>i.kind==='travel').reduce((a,i)=>a+i.mins,0), 0),
      skipped: pool.filter(p=>!routed.has(p.id)).length,
    },
  };
}

// Re-solve only what has not happened yet. `frozen` are stops already visited
// (or in progress); everything after is thrown away and rebuilt.
export function resolveFrom(prevOpts, frozen, changes = {}) {
  const merged = { ...prevOpts, ...changes };
  const keep = new Set(frozen);
  const res = solve({ ...merged, exclude: [...keep, ...(merged.exclude || [])] });
  return { ...res, frozen: [...keep] };
}

export function explainDay(d) {
  const v = d.items.filter(i=>i.kind==='visit');
  const t = d.items.filter(i=>i.kind==='travel');
  return {
    start: d.items.length ? toHM(d.items[0].start) : '—',
    end:   d.items.length ? toHM(d.items[d.items.length-1].end) : '—',
    visits: v.length,
    travelMins: t.reduce((s,i)=>s+i.mins,0),
    visitMins:  v.reduce((s,i)=>s+i.mins,0),
  };
}

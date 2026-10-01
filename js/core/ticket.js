// Trip Pass — HMAC-signed, TOTP-rotating QR that a gate can verify with no
// network. RFC 2104 (HMAC) + RFC 6238 (time-based rotation).
//
// The gate device holds the same venue key, synced whenever it last had a
// connection. Verification is a local HMAC recomputation: no server call.

const enc = new TextEncoder();

// Demo venue key. In deployment this is provisioned per venue and never
// leaves the gate device.
export const DEMO_VENUE_KEY = 'viatica-demo-venue-key-2026-karnataka';

export const STEP_SECONDS = 30;   // rotation period
export const SKEW_STEPS   = 1;    // accept ±1 step for clock drift

const keyCache = new Map();
async function hmacKey(secret) {
  if (keyCache.has(secret)) return keyCache.get(secret);
  const k = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  keyCache.set(secret, k);
  return k;
}

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

export async function hmacHex(secret, message) {
  return hex(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(message)));
}

export const counterAt = (ms = Date.now()) => Math.floor(ms / 1000 / STEP_SECONDS);
export const secondsLeft = (ms = Date.now()) =>
  STEP_SECONDS - Math.floor(ms / 1000) % STEP_SECONDS;

/** The signed payload. Everything a gate needs is inside it. */
export function payloadFor(pass, entry, counter) {
  return [
    'VTC1', pass.tripId, pass.holderId, entry.placeId,
    entry.date, entry.window, entry.pax, counter,
  ].join('|');
}

/** Mint the current rotating code for one gate entry. */
export async function mintCode(pass, entry, opts = {}) {
  const secret  = opts.secret ?? DEMO_VENUE_KEY;
  const now     = opts.now ?? Date.now();
  const counter = counterAt(now);
  const body    = payloadFor(pass, entry, counter);
  const sig     = (await hmacHex(secret, body)).slice(0, 16);
  return {
    counter, body, sig,
    text: `${body}|${sig}`,
    expiresIn: secondsLeft(now),
    short: sig.slice(0, 6).toUpperCase().match(/.{1,3}/g).join(' '),
  };
}

/** Offline verification at the gate. Returns a verdict, never throws. */
export async function verifyCode(text, gate, opts = {}) {
  const secret = opts.secret ?? DEMO_VENUE_KEY;
  const now    = opts.now ?? Date.now();
  const seen   = opts.seen ?? new Set();

  const parts = String(text).split('|');
  if (parts.length !== 9 || parts[0] !== 'VTC1')
    return { ok:false, code:'MALFORMED', label:'Not a Viatica pass' };

  const [, tripId, holderId, placeId, date, window, pax, counterStr, sig] = parts;
  const counter = Number(counterStr);
  const body = parts.slice(0, 8).join('|');
  const info = { tripId, holderId, placeId, date, window, pax: Number(pax), counter };

  if (gate?.placeId && gate.placeId !== placeId)
    return { ok:false, code:'WRONG_GATE', label:`Pass is for ${placeId}, not this gate`, info };

  const nowCounter = counterAt(now);
  const drift = nowCounter - counter;
  if (Math.abs(drift) > SKEW_STEPS)
    return { ok:false, code:'EXPIRED', label:
      drift > 0 ? `Code rotated ${drift} step${drift>1?'s':''} ago — screenshot reuse`
                : 'Code is from the future — clock mismatch', info, drift };

  const expected = (await hmacHex(secret, body)).slice(0, 16);
  if (expected !== sig)
    return { ok:false, code:'BAD_SIGNATURE', label:'Signature does not verify — forged pass', info };

  const replayKey = `${tripId}|${placeId}|${counter}`;
  if (seen.has(replayKey))
    return { ok:false, code:'REPLAY', label:'This exact code was already admitted', info };
  seen.add(replayKey);

  return { ok:true, code:'ADMIT', label:'Verified offline — admit', info, drift };
}

/** UPI deep link for the booking payment (NPCI spec). No gateway involved. */
export function upiLink({ pa, pn, am, tn, tr }) {
  const q = new URLSearchParams({ pa, pn, am: String(am), cu: 'INR', tn, tr });
  return `upi://pay?${q.toString()}`;
}

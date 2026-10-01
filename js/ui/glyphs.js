// Landmark glyphs. Each is engraved line-art drawn in a 24×24 box with the
// ground line at y=21 — printed onto the map rather than pinned to it.

export const GLYPHS = {
  temple: 'M12 2l4.2 5.6H7.8zM8.4 8.2h7.2l1.1 3.4H7.3zM7 12.2h10v2.1H7zM6 15h12v6H6zM9.4 21v-4.1a2.6 2.6 0 015.2 0V21',
  gopuram:'M6.6 21V8.4h10.8V21M7.9 8.4l1.5-2.6h5.2l1.5 2.6M9.3 5.8l1.1-2h3.2l1.1 2M10 21v-5a2 2 0 014 0v5M8.6 11.4h6.8M8.6 14.2h6.8M12 3.8V2',
  fort:   'M4 21V9.5h16V21M4 9.5V6.6h2.2V8h2.1V6.6h2.2V8h2.2V6.6h2.2V8h2.1V6.6H20v2.9M9.6 21v-5.4a2.4 2.4 0 014.8 0V21M6.6 12.2v2.4M17.4 12.2v2.4',
  palace: 'M3 21v-8.5h18V21M12 3.2c2.4 1.6 3.6 3.3 3.6 5.2H8.4c0-1.9 1.2-3.6 3.6-5.2zM12 3.2V1.8M7.2 12.5V9.8c0-1 .8-1.6 1.6-1.6M16.8 12.5V9.8c0-1-.8-1.6-1.6-1.6M6.4 21v-4a1.9 1.9 0 013.8 0v4M13.8 21v-4a1.9 1.9 0 013.8 0v4M3 12.5h18',
  ruins:  'M3 21h18M5 21V9.2h2.8V21M10.6 21V6.4h2.8V21M16.2 21v-8.6H19V21M5 12.4h2.8M10.6 10h2.8M4.4 9.2l1.6-1.7 1.6 1.7M10 6.4l2-1.9 2 1.9M15.6 12.4l1.8-1.6 1.6 1.6',
  stupa:  'M3.6 21h16.8M5.4 21v-3.1h13.2V21M6.6 17.9c0-3 2.4-5.4 5.4-5.4s5.4 2.4 5.4 5.4M12 12.5V8.9M9.8 8.9h4.4l-.9-1.7h-2.6zM12 7.2V4.6M9.9 6.1h4.2M10.6 4.6h2.8',
  church: 'M4.5 21V10.4h9.4V21M14 21V6.2h5.5V21M16.7 6.2V3.4M15.4 4.4h2.6M6.6 21v-4.2a2 2 0 014 0V21M16 12.6h1.6M16 15.8h1.6M7 13.4h1.4M10.2 13.4h1.4M4.5 10.4l4.7-2.8 4.7 2.8',
  ghats:  'M2 21h20M3 18.4h18M4.4 15.8h15.2M6 13.2h12M7.6 13.2V8.6h2.4v4.6M13.6 13.2V8.6H16v4.6M8.8 8.6c0-1.3-1.2-1.3-1.2-2.6M14.8 8.6c0-1.3-1.2-1.3-1.2-2.6M2 21c1.6-1 3.2-1 4.8 0s3.2 1 4.8 0 3.2-1 4.8 0 3.2 1 3.6.4',
  houseboat:'M2.4 17.6h19.2l-2 3.4H4.4zM4.6 17.6v-4.2h14.8v4.2M5.6 13.4c1.2-2.4 3.6-3.6 6.4-3.6s5.2 1.2 6.4 3.6M12 9.8V7.4M7.4 15.4h3M13.6 15.4h3M2 21.4c1.7-1 3.4-1 5.1 0M9.5 21.4c1.7-1 3.4-1 5.1 0',
  beach:  'M2 19.4h20M4 19.4c1.7-1.1 3.4-1.1 5.1 0M11.5 19.4c1.7-1.1 3.4-1.1 5.1 0M14.4 19.4V9.2M14.4 9.2c-1.8-2-4-2.6-6.2-1.6 2 .2 3.6 1 4.6 2.4M14.4 9.2c1-2.6 3-4 5.6-3.8-1.8 1-2.8 2.4-3.2 4.2M14.4 9.6c-2.4-.6-4.2.2-5.4 2.2 1.8-.8 3.4-.8 4.8.2',
  mountain:'M1.5 20h21M2.5 20l6.4-11.6L12.4 15l2.6-4.6L21.5 20zM8.9 8.4l-1.8 3.2h3.6zM15 10.4l-1.4 2.6h2.8zM4.6 17.2h2.8M16.4 17.2h3',
  forest: 'M2 21h20M6.4 21v-3.4M6.4 17.6L3 12.6h6.8zM6.4 13.2L4 9.4h4.8zM16.4 21v-4.2M16.4 16.8L13 11.2h6.8zM16.4 12l-2.2-3.6h4.4zM11.4 21v-2.6M11.4 18.4l-2.2-3.4h4.4z',
  waterfall:'M2 21h20M3.4 21V5.6h5.6V21M15 21V5.6h5.6V21M9 8.4h6M10.2 9.4v10M12 9.4v10M13.8 9.4v10M9.6 19.6c1.6-1 3.2-1 4.8 0M4.8 8.8h2.6M4.8 12h2.6M16.6 8.8h2.6M16.6 12h2.6',
  cave:   'M2 21h20M3 21V9.6C3 5.6 7 3 12 3s9 2.6 9 6.6V21M8.4 21v-6.2a3.6 3.6 0 017.2 0V21M6 10.2c1-1.4 2.4-2.2 4-2.4M18 10.2c-1-1.4-2.4-2.2-4-2.4M12 14.6v6.4',
  lake:   'M2 15.6c2.4-1.4 4-1.4 6.4 0s4 1.4 6.4 0 4-1.4 7.2 0M2 18.6c2.4-1.4 4-1.4 6.4 0s4 1.4 6.4 0 4-1.4 7.2 0M3 12.4l5-6.6 3.4 4.6 2.4-3.2 6.2 5.2z',
  tea:    'M2 21h20M3.4 21c0-2.6 1.8-4.2 4.2-4.2s4.2 1.6 4.2 4.2M12 21c0-2.6 1.8-4.2 4.2-4.2s4.2 1.6 4.2 4.2M4 15.4c0-2.4 1.6-3.8 3.8-3.8S11.6 13 11.6 15.4M12.4 15.4c0-2.4 1.6-3.8 3.8-3.8s3.8 1.4 3.8 3.8M7.8 11.6v-2M16.2 11.6v-2M6 8.6h3.6M14.4 8.6H18',
  wildlife:'M3 20.4h18M6 20.4v-4.6M9.6 20.4v-4.6M14.4 20.4v-4.6M18 20.4v-4.6M5 15.8c0-3.2 2.2-5.2 7-5.2s7 2 7 5.2zM19 12.4l2.2-1.8M19 12.4c.6-1.6 1.4-2.4 2.8-2.6M5 12.6c-1.4-.6-2.4-1.8-2.6-3.4 1.4.8 2.4 1.4 3 2.4',
  bridge: 'M1.5 8.4h21M1.5 8.4v3M22.5 8.4v3M3 8.4c3.4 5.6 6.4 8.4 9 8.4s5.6-2.8 9-8.4M5.6 11.2c1 2 2 3.4 3 4.4M18.4 11.2c-1 2-2 3.4-3 4.4M12 16.8v3.6M8 13.6l-1 3M16 13.6l1 3M1.5 20.4h21',
  minaret:'M4 21V12h16v9M12 3l3.4 4.4H8.6zM8 12V9.6h8V12M12 7.4V4M2.2 21V11.6M2.2 11.6c0-1 .7-1.7 1.4-1.7M21.8 21V11.6M21.8 11.6c0-1-.7-1.7-1.4-1.7M9.2 21v-4.6a2.8 2.8 0 015.6 0V21M2.2 9.9V7M21.8 9.9V7',
  lighthouse:'M2 21h20M7.4 21l1.6-11h6l1.6 11zM8.6 13.4h6.8M9 10V7.6h6V10M9.6 7.6V5.4h4.8v2.2M12 5.4V3.2M4 8.4l4.4 1M20 8.4l-4.4 1M4.4 5.6l4 1.6M19.6 5.6l-4 1.6',
  stepwell:'M2 4.4h20M3.6 4.4v3.4h2.8v3.4h2.8v3.4H12v3.4M20.4 4.4v3.4h-2.8v3.4h-2.8v3.4H12v3.4M12 18v3M3.6 7.8h2.8M6.4 11.2h2.8M9.2 14.6H12M20.4 7.8h-2.8M17.6 11.2h-2.8M14.8 14.6H12',
  dunes:  'M1.5 20.4h21M1.5 17c3-4.6 6-4.6 9 0M8 17c3.4-5.6 7-5.6 10.4 0M14.4 20.4c1.6-2.6 3.4-2.6 5 0M2.6 20.4c1.4-2 3-2 4.4 0M18.4 8.6c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8',
  monastery:'M3.4 21V11.2h17.2V21M5 11.2l1.6-3h10.8l1.6 3M8.4 8.2V5.4h7.2v2.8M12 5.4V2.6M10.4 4h3.2M6.6 21v-4.4h3.4V21M14 21v-4.4h3.4V21M6.6 13.6h3.4M14 13.6h3.4M3.4 11.2h17.2',
  statue: 'M4 21h16M6.6 21v-2.6h10.8V21M8 18.4v-2.2h8v2.2M12 16.2V7.4M12 7.4a2.1 2.1 0 100-4.2 2.1 2.1 0 000 4.2zM12 9.4L8.6 12v4.2M12 9.4l3.4 2.6v4.2M9.6 16.2h4.8',
  village:'M2 21h20M3.4 21v-5.4l3.4-3 3.4 3V21M13.8 21v-6.6l3.2-2.8 3.2 2.8V21M6.2 21v-3h1.2v3M16.4 21v-3.4h1.2V21M4.6 15.6h4.4M15 14.4h4.4',
  city:   'M2 21h20M3.4 21V13h3.8v8M8.4 21V8.6h4.2V21M13.8 21v-6.2h3.4V21M18.4 21v-9.4h2.2V21M4.6 15.2h1.4M4.6 17.6h1.4M9.6 11h1.8M9.6 14h1.8M9.6 17h1.8M15 17.2h1.2M10.5 8.6V6.4',
};

/** An ornamental Indian compass rose, drawn as layered SVG. */
export function compassRose(size = 108) {
  const c = size / 2, r = c - 4;
  const petal = (a, len, w) => {
    const rad = d => (d - 90) * Math.PI / 180;
    const tip = [c + Math.cos(rad(a)) * len, c + Math.sin(rad(a)) * len];
    const l   = [c + Math.cos(rad(a - w)) * len * 0.30, c + Math.sin(rad(a - w)) * len * 0.30];
    const rr  = [c + Math.cos(rad(a + w)) * len * 0.30, c + Math.sin(rad(a + w)) * len * 0.30];
    return `M${c} ${c}L${l[0].toFixed(1)} ${l[1].toFixed(1)}L${tip[0].toFixed(1)} ${tip[1].toFixed(1)}L${rr[0].toFixed(1)} ${rr[1].toFixed(1)}Z`;
  };
  const majors = [0, 90, 180, 270].map(a => petal(a, r * 0.94, 26)).join('');
  const minors = [45, 135, 225, 315].map(a => petal(a, r * 0.60, 22)).join('');
  const ticks = Array.from({ length: 32 }, (_, i) => {
    const a = (i * 11.25 - 90) * Math.PI / 180;
    const o = i % 4 === 0 ? 0.80 : 0.87;
    return `M${(c+Math.cos(a)*r*o).toFixed(1)} ${(c+Math.sin(a)*r*o).toFixed(1)}` +
           `L${(c+Math.cos(a)*r*0.94).toFixed(1)} ${(c+Math.sin(a)*r*0.94).toFixed(1)}`;
  }).join('');
  // A lotus ring, in place of the usual fleur-de-lis.
  const lotus = Array.from({ length: 16 }, (_, i) => {
    const a = (i * 22.5 - 90) * Math.PI / 180, rr = r * 0.44;
    const x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr;
    const nx = Math.cos(a) * 5, ny = Math.sin(a) * 5;
    return `M${(x-ny).toFixed(1)} ${(y+nx).toFixed(1)}Q${(x+nx*1.7).toFixed(1)} ${(y+ny*1.7).toFixed(1)} ${(x+ny).toFixed(1)} ${(y-nx).toFixed(1)}`;
  }).join('');
  return `
    <g class="rose">
      <circle cx="${c}" cy="${c}" r="${r}"        class="rose-ring"/>
      <circle cx="${c}" cy="${c}" r="${r*0.80}"   class="rose-ring thin"/>
      <circle cx="${c}" cy="${c}" r="${r*0.44}"   class="rose-ring thin"/>
      <path d="${ticks}" class="rose-tick"/>
      <path d="${lotus}" class="rose-lotus"/>
      <path d="${minors}" class="rose-minor"/>
      <path d="${majors}" class="rose-major"/>
      <circle cx="${c}" cy="${c}" r="3.2" class="rose-hub"/>
      <text x="${c}" y="11"        class="rose-letter">N</text>
      <text x="${size-6}" y="${c+4}" class="rose-letter">E</text>
      <text x="${c}" y="${size-4}" class="rose-letter">S</text>
      <text x="6" y="${c+4}"       class="rose-letter">W</text>
    </g>`;
}

/** A jaali lattice tile, used as a repeating pattern behind panels. */
export const JAALI = `
  <path d="M0 12h24M12 0v24M0 0l24 24M24 0L0 24" stroke-width=".4"/>
  <circle cx="12" cy="12" r="5.4" fill="none" stroke-width=".5"/>
  <path d="M12 4.6l5.2 7.4-5.2 7.4-5.2-7.4z" fill="none" stroke-width=".5"/>`;

/** Manuscript corner ornament. */
export const CORNER = `
  M2 22V8a6 6 0 016-6h14M6 22V10a4 4 0 014-4h12
  M2 2h3v3H2z M9 6.5a2.4 2.4 0 11.01 0 M6.5 9a2.4 2.4 0 11.01 0`;

/** Small mode icons for the transport comparison. */
export const MODE_ICONS = {
  walk: 'M13 3.2a1.6 1.6 0 11.01 0M12.6 6.6l-3 2.2-1 4M12.6 6.6l2.6 1.8 1.4 3.4M12.6 6.6l.6 5.2 2.4 3.6.8 5M13.2 11.8l-3.6 3-1.2 5.6',
  auto: 'M3 16.4h15.4M4.6 16.4V11l3.4-3.6h6.2L18 11v5.4M6.4 19.4a1.9 1.9 0 11.01 0M16.4 19.4a1.9 1.9 0 11.01 0M8 8.2v8.2M2.6 13.6h2M18.4 11h2.4v5.4h-2.4',
  cab:  'M2.6 16.6h18.8M4.2 16.6v-4.4l2-4.2h11.6l2 4.2v4.4M6.4 19.2a1.9 1.9 0 11.01 0M17.6 19.2a1.9 1.9 0 11.01 0M6.6 12.4h10.8M9.4 8v4.4M14.6 8v4.4',
  bus:  'M3.4 17h17.2M4.6 17V5.6h14.8V17M4.6 9.4h14.8M7 19.4a1.7 1.7 0 11.01 0M17 19.4a1.7 1.7 0 11.01 0M7.4 12.2h3.2v3H7.4zM13.4 12.2h3.2v3h-3.2zM10.4 5.6v3.8M2.6 11.6h2M19.4 11.6h2',
  train:'M5 16.6V6.2c0-1.8 3.2-2.6 7-2.6s7 .8 7 2.6v10.4zM5 10.4h14M7.6 13.6a1.3 1.3 0 11.01 0M16.4 13.6a1.3 1.3 0 11.01 0M8 6.6h8M6.4 16.6l-2.6 4M17.6 16.6l2.6 4M9 20.6h6',
  ferry:'M2.6 18.4c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6.4 0M4.4 15.6h15.2l-1.8 2.8H6.2zM6.6 15.6v-4.2h10.8v4.2M9 11.4V8.2h6v3.2M12 8.2V5.4M8.6 13.2h2.2M13.2 13.2h2.2',
  plane:'M2.4 13.4l19.2-6.2-2 3.6-8.6 3.4-1.6 5.4-1.8-1-.2-3.6-4.2 1.4z',
};

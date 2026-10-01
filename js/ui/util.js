export const esc = s => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

export const money = n => '₹' + Math.round(n).toLocaleString('en-IN');
export const dur = m => {
  m = Math.round(m);
  const h = Math.floor(m / 60), r = m % 60;
  return h ? `${h}h${r ? ' ' + r + 'm' : ''}` : `${r}m`;
};
export const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function on(root, sel, ev, fn) {
  root.querySelectorAll(sel).forEach(e => e.addEventListener(ev, fn));
}

/** Icons used in the navigation rail and inline UI. */
export const ICONS = {
  atlas:  'M3 6.4l6-2.6 6 2.6 6-2.6v13.8l-6 2.6-6-2.6-6 2.6zM9 3.8v13.8M15 6.4v13.8',
  plan:   'M4 3.6h16v16.8H4zM8 2v3.2M16 2v3.2M4 9h16M7.6 12.4h3M7.6 16h3M13.4 12.4h3M13.4 16h3',
  trip:   'M6 21c2.6-2.6 4-5.2 4-7.8C10 9.8 8.2 8 6 8s-4 1.8-4 5.2C2 15.8 3.4 18.4 6 21zM6 12.6a1.4 1.4 0 100 .01M18 12c1.8-1.8 2.8-3.6 2.8-5.4C20.8 4.2 19.6 3 18 3s-2.8 1.2-2.8 3.6c0 1.8 1 3.6 2.8 5.4zM10 13.6h4.2a2.4 2.4 0 010 4.8H8',
  pass:   'M3 6.6h18v10.8H3zM3 11h18M7 14.4h4M15.4 14.4h2.2M7 8.2h3',
  safety: 'M12 2.6l8 3v6.2c0 4.6-3.2 8.4-8 9.6-4.8-1.2-8-5-8-9.6V5.6zM12 8.4v4.4M12 15.8v.2',
  group:  'M9 11.4a3.4 3.4 0 100-6.8 3.4 3.4 0 000 6.8zM2.6 20.4c0-3.6 2.8-6 6.4-6s6.4 2.4 6.4 6M16.6 5.2a3.2 3.2 0 010 6.2M18 14.8c2.2.7 3.6 2.6 3.6 5.6',
  desk:   'M3 20.4h18M5.4 20.4V11h3.4v9.4M11.2 20.4V5.6h3.4v14.8M17 20.4v-6.6h3.4v6.6',
  about:  'M12 21.4a9.4 9.4 0 100-18.8 9.4 9.4 0 000 18.8zM12 11v6M12 7.4v.2',
  mic:    'M12 14.4a3.2 3.2 0 003.2-3.2V5.8a3.2 3.2 0 10-6.4 0v5.4A3.2 3.2 0 0012 14.4zM5.6 11.2a6.4 6.4 0 0012.8 0M12 17.6V21M8.6 21h6.8',
  bolt:   'M13.4 2.6L4.8 13.4h6l-.6 8 8.6-10.8h-6z',
  clock:  'M12 21.4a9.4 9.4 0 100-18.8 9.4 9.4 0 000 18.8zM12 6.8V12l3.4 2.2',
  leaf:   'M20.4 3.6C10 3.6 4.2 8 4.2 15.2c0 2 .6 3.6 1.6 5C11.4 13.4 15 10.6 20.4 8.6c-4 2.4-8 6-11.2 12.2',
  wallet: 'M3 7.4h15.4a2.6 2.6 0 012.6 2.6v7.4a2.6 2.6 0 01-2.6 2.6H3zM3 7.4V5.2A1.6 1.6 0 014.6 3.6h11M16.6 13.8h.2',
  shield: 'M12 2.6l8 3v6.2c0 4.6-3.2 8.4-8 9.6-4.8-1.2-8-5-8-9.6V5.6z',
  wifi:   'M2.6 9.2a14 14 0 0118.8 0M6 12.8a9 9 0 0112 0M9.4 16.4a4.2 4.2 0 015.2 0M12 20h.2',
  wifioff:'M2 2l20 20M4.6 9.6a14 14 0 015-3M14.6 6.8a14 14 0 014.8 2.8M7.4 13.2a9 9 0 013-1.8M17 13.2a9 9 0 00-1.6-1.2M9.4 16.4a4.2 4.2 0 014.4-.8M12 20h.2',
  check:  'M4.4 12.6l5 5 10.2-11',
  cross:  'M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4',
  scan:   'M3.4 8V5.4a2 2 0 012-2H8M16 3.4h2.6a2 2 0 012 2V8M20.6 16v2.6a2 2 0 01-2 2H16M8 20.6H5.4a2 2 0 01-2-2V16M3.4 12h17.2',
  vote:   'M4 20.4h16M6 17.4l-1.4-4.8L14 4.2l3.4 3.4-9.4 8.4zM12.6 5.6l3.4 3.4',
  flag:   'M5 21V3.6M5 4.4h13.4l-2.4 4 2.4 4H5',
  eye:    'M2 12s3.8-6.6 10-6.6S22 12 22 12s-3.8 6.6-10 6.6S2 12 2 12zM12 14.8a2.8 2.8 0 100-5.6 2.8 2.8 0 000 5.6z',
  book:   'M4 4.6A2 2 0 016 2.6h13v18.8H6a2 2 0 01-2-2zM4 17.4h15',
};

/** Inline icon. Sized by attribute so it never balloons in a flex row;
 *  any CSS rule (the rail, option rows) still wins. */
export const icon = (name, cls = '', size = 15) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" class="${cls}"
     fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
     stroke-linejoin="round" style="flex:none;vertical-align:-2px"
     aria-hidden="true"><path d="${ICONS[name] || ICONS.about}"/></svg>`;

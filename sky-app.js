'use strict';
/* ===========================================================================
   Star Hop — a naked-eye planetarium with a course attached.
   Positions are J2000 catalogue values, precessed to the date on screen.
   =========================================================================== */

const D2R = Math.PI / 180, R2D = 180 / Math.PI, TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const norm360 = d => ((d % 360) + 360) % 360;

/* ---------- time ---------- */
const jdFrom = ms => ms / 86400000 + 2440587.5;
function gmst(jd) {
  const d = jd - 2451545.0, T = d / 36525;
  return norm360(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - T * T * T / 38710000);
}
function tzOffsetMin(ms, tz) {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const p = {}; for (const x of dtf.formatToParts(new Date(ms))) p[x.type] = x.value;
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, p.hour === '24' ? 0 : +p.hour, +p.minute, +p.second);
    return Math.round((asUTC - Math.floor(ms / 1000) * 1000) / 60000);
  } catch (e) { return 0; }
}
function localParts(ms, tz) {
  const off = tzOffsetMin(ms, tz);
  const d = new Date(ms + off * 60000);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(),
           h: d.getUTCHours(), mi: d.getUTCMinutes(), dow: d.getUTCDay(), off };
}
function localToMs(y, mo, d, h, mi, tz) {
  let guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  for (let i = 0; i < 3; i++) guess = Date.UTC(y, mo - 1, d, h, mi, 0) - tzOffsetMin(guess, tz) * 60000;
  return guess;
}

/* ---------- matrices ---------- */
function precession(jd) {
  const T = (jd - 2451545) / 36525, s = D2R / 3600;
  const z1 = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T ** 3) * s;
  const z2 = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T ** 3) * s;
  const th = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T ** 3) * s;
  const ca = Math.cos(z1), sa = Math.sin(z1), cb = Math.cos(z2), sb = Math.sin(z2),
        ct = Math.cos(th), st = Math.sin(th);
  return [[ca * ct * cb - sa * sb, -sa * ct * cb - ca * sb, -st * cb],
          [ca * ct * sb + sa * cb, -sa * ct * sb + ca * cb, -st * sb],
          [ca * st,                -sa * st,                 ct]];
}
function enuMat(lst, lat) {
  const L = lst * D2R, p = lat * D2R;
  const cL = Math.cos(L), sL = Math.sin(L), cp = Math.cos(p), sp = Math.sin(p);
  return [[-sL, cL, 0], [-sp * cL, -sp * sL, cp], [cp * cL, cp * sL, sp]];
}
function camMat(az, alt) {
  const a = az * D2R, h = alt * D2R, ch = Math.cos(h);
  const f = [ch * Math.sin(a), ch * Math.cos(a), Math.sin(h)];
  const r = [Math.cos(a), -Math.sin(a), 0];
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  return [r, u, f];
}
const mul3 = (A, B) => A.map(r => [0, 1, 2].map(c => r[0] * B[0][c] + r[1] * B[1][c] + r[2] * B[2][c]));
const apply3 = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
                          M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
                          M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
const radecVec = (raH, dec) => {
  const a = raH * 15 * D2R, d = dec * D2R, cd = Math.cos(d);
  return [cd * Math.cos(a), cd * Math.sin(a), Math.sin(d)];
};
const vecRaDec = v => ({ ra: norm360(Math.atan2(v[1], v[0]) * R2D) / 15, dec: Math.asin(clamp(v[2], -1, 1)) * R2D });

/* ---------- sun, moon, planets ---------- */
const OBL = jd => (23.4392911 - 0.0130042 * (jd - 2451545) / 36525) * D2R;
function sunEq(jd) {
  const n = jd - 2451545.0;
  const g = (357.528 + 0.9856003 * n) * D2R;
  const lam = ((280.460 + 0.9856474 * n) + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
  const e = OBL(jd), R = 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g);
  return { v: [Math.cos(lam), Math.cos(e) * Math.sin(lam), Math.sin(e) * Math.sin(lam)], lam, R };
}
function moonEq(jd) {
  const d = jd - 2451545.0;
  const Lp = (218.316 + 13.176396 * d) * D2R, M = (134.963 + 13.064993 * d) * D2R,
        F = (93.272 + 13.229350 * d) * D2R, D = (297.850 + 12.190749 * d) * D2R,
        Ms = (357.529 + 0.98560028 * d) * D2R;
  const lam = Lp + (6.289 * Math.sin(M) + 1.274 * Math.sin(2 * D - M) + 0.658 * Math.sin(2 * D)
    + 0.214 * Math.sin(2 * M) - 0.186 * Math.sin(Ms) - 0.114 * Math.sin(2 * F)) * D2R;
  const bet = (5.128 * Math.sin(F) + 0.281 * Math.sin(M + F) - 0.278 * Math.sin(F - M)
    - 0.173 * Math.sin(F - 2 * D)) * D2R;
  const dist = 385001 - 20905 * Math.cos(M) - 3699 * Math.cos(2 * D - M) - 2956 * Math.cos(2 * D);
  const e = OBL(jd), cb = Math.cos(bet), sb = Math.sin(bet), cl = Math.cos(lam), sl = Math.sin(lam);
  return { v: [cb * cl, Math.cos(e) * cb * sl - Math.sin(e) * sb, Math.sin(e) * cb * sl + Math.cos(e) * sb],
           lam, bet, dist, semi: Math.asin(6378.14 / dist) * R2D };
}
const PLANETS = [
  { k:'mercury', n:'Mercury', a:[.38709927,.00000037], e:[.20563593,.00001906], I:[7.00497902,-.00594749], L:[252.25032350,149472.67411175], w:[77.45779628,.16047689], O:[48.33076593,-.12534081], V:-.42, ph:i=>.0380*i-.000273*i*i+2e-6*i**3, col:'#d8cbb6', note:'Never strays far from the Sun — catch it low in twilight.' },
  { k:'venus', n:'Venus', a:[.72333566,.00000390], e:[.00677672,-.00004107], I:[3.39467605,-.00078890], L:[181.97909950,58517.81538729], w:[131.60246718,.00268329], O:[76.67984255,-.27769418], V:-4.40, ph:i=>.0009*i+2.39e-4*i*i-6.5e-7*i**3, col:'#fff4d6', note:'The Morning or Evening Star — far brighter than any star.' },
  { k:'mars', n:'Mars', a:[1.52371034,.00001847], e:[.09339410,.00007882], I:[1.84969142,-.00813131], L:[-4.55343205,19140.30268499], w:[-23.94362959,.44441088], O:[49.55953891,-.29257343], V:-1.52, ph:i=>.016*i, col:'#ff8a5c', note:'Unmistakably orange. Brightens hugely every 26 months.' },
  { k:'jupiter', n:'Jupiter', a:[5.20288700,-.00011607], e:[.04838624,-.00013253], I:[1.30439695,-.00183714], L:[34.39644051,3034.74612775], w:[14.72847983,.21252668], O:[100.47390909,.20469106], V:-9.40, ph:i=>.005*i, col:'#ffe9c4', note:'Steady creamy-white. Binoculars show its four big moons.' },
  { k:'saturn', n:'Saturn', a:[9.53667594,-.00125060], e:[.05386179,-.00050991], I:[2.48599187,.00193609], L:[49.95424423,1222.49362201], w:[92.59887831,-.41897216], O:[113.66242448,-.28867794], V:-8.88, ph:i=>.044*Math.abs(i), col:'#f3ddb0', note:'Pale gold and slow. Any small telescope shows the rings.' },
  { k:'uranus', n:'Uranus', a:[19.18916464,-.00196176], e:[.04725744,-.00004397], I:[.77263783,-.00242939], L:[313.23810451,428.48202785], w:[170.95427630,.40805281], O:[74.01692503,.04240589], V:-7.19, ph:()=>0, col:'#bfe8ea', note:'Right at the naked-eye limit — you need a dark sky and a chart.' },
  { k:'neptune', n:'Neptune', a:[30.06992276,.00026291], e:[.00859048,.00005105], I:[1.77004347,.00035372], L:[-55.12002969,218.45945325], w:[44.96476227,-.32241464], O:[131.78422574,-.00508664], V:-6.87, ph:()=>0, col:'#9fb8ff', note:'Never visible to the unaided eye — binoculars at best.' },
  { k:'earth', a:[1.00000261,.00000562], e:[.01671123,-.00004392], I:[-.00001531,-.01294668], L:[100.46457166,35999.37244981], w:[102.93768193,.32327364], O:[0,0] }
];
function helio(p, T) {
  const a = p.a[0] + p.a[1] * T, e = p.e[0] + p.e[1] * T, I = (p.I[0] + p.I[1] * T) * D2R,
        L = p.L[0] + p.L[1] * T, wb = p.w[0] + p.w[1] * T, O = (p.O[0] + p.O[1] * T) * D2R;
  const w = wb * D2R - O;
  let M = ((L - wb) % 360 + 540) % 360 - 180; M *= D2R;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xv = a * (Math.cos(E) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
  return [(cw * cO - sw * sO * cI) * xv + (-sw * cO - cw * sO * cI) * yv,
          (cw * sO + sw * cO * cI) * xv + (-sw * sO + cw * cO * cI) * yv,
          (sw * sI) * xv + (cw * sI) * yv];
}
const EARTH = PLANETS[PLANETS.length - 1];
function planetState(p, jd) {
  const T = (jd - 2451545) / 36525;
  const P = helio(p, T), E = helio(EARTH, T);
  const g = [P[0] - E[0], P[1] - E[1], P[2] - E[2]];
  const e0 = 23.43928 * D2R;                                  // J2000 obliquity
  const v = [g[0], g[1] * Math.cos(e0) - g[2] * Math.sin(e0), g[1] * Math.sin(e0) + g[2] * Math.cos(e0)];
  const D = Math.hypot(v[0], v[1], v[2]);
  const r = Math.hypot(P[0], P[1], P[2]), R = Math.hypot(E[0], E[1], E[2]);
  const ci = clamp((r * r + D * D - R * R) / (2 * r * D), -1, 1), i = Math.acos(ci) * R2D;
  return { v: [v[0] / D, v[1] / D, v[2] / D], mag: p.V + 5 * Math.log10(r * D) + p.ph(i), dist: D, phase: (1 + ci) / 2 };
}

/* ---------- colour ---------- */
function bvRGB(bv) {
  bv = clamp(bv, -0.4, 2.0);
  const t = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
  const k = t / 100; let r, g, b;
  if (k <= 66) { r = 255; g = 99.47 * Math.log(k) - 161.12; }
  else { r = 329.7 * Math.pow(k - 60, -0.1332); g = 288.12 * Math.pow(k - 60, -0.0755); }
  if (k >= 66) b = 255; else if (k <= 19) b = 0; else b = 138.52 * Math.log(k - 10) - 305.04;
  const m = 0.42;                                              // ease toward white, as the eye sees them
  return [clamp(r, 0, 255) * (1 - m) + 255 * m, clamp(g, 0, 255) * (1 - m) + 255 * m, clamp(b, 0, 255) * (1 - m) + 255 * m]
    .map(Math.round);
}

/* ---------- catalogue ---------- */
const GREEK = { alp:'Alpha', bet:'Beta', gam:'Gamma', del:'Delta', eps:'Epsilon', zet:'Zeta', eta:'Eta',
  the:'Theta', iot:'Iota', kap:'Kappa', lam:'Lambda', mu:'Mu', nu:'Nu', xi:'Xi', omi:'Omicron', pi:'Pi',
  rho:'Rho', sig:'Sigma', tau:'Tau', ups:'Upsilon', phi:'Phi', chi:'Chi', psi:'Psi', ome:'Omega' };
const CON_NAME = {}, FIGURES = [];
const STARS = [], BY_ID = new Map();
STAR_SRC.trim().split('\n').forEach(line => {
  const f = line.split('|'); if (f.length < 9) return;
  const s = { id: f[0], name: f[1] || '', bayer: f[2], con: f[0].split('-')[0],
    ra: +f[3], dec: +f[4], mag: +f[5], bv: +f[6], dist: f[7], spec: f[8], kind: 'star' };
  s.vec = radecVec(s.ra, s.dec); s.rgb = bvRGB(s.bv);
  s.hash = (s.id.charCodeAt(0) * 31 + s.id.charCodeAt(s.id.length - 1) * 7 + s.ra * 13) % TAU;
  STARS.push(s); BY_ID.set(s.id, s);
});
FIGURE_SRC.trim().split('\n').forEach(line => {
  const f = line.split('|'); if (f.length < 4) return;
  const con = f[0];
  CON_NAME[con] = { name: f[1], nick: f[2] };
  const lines = f[3].split(',').map(pair => pair.split('-').map(t =>
    t.includes('.') ? t.replace('.', '-') : con + '-' + t)).filter(p => BY_ID.has(p[0]) && BY_ID.has(p[1]));
  FIGURES.push({ con, name: f[1], nick: f[2], lines });
});
const DSOS = [];
DSO_SRC.trim().split('\n').forEach(line => {
  const f = line.split('|'); if (f.length < 8) return;
  const o = { id: f[0], name: f[1], ra: +f[2], dec: +f[3], mag: +f[4], dsoKind: f[5],
    dist: f[6], eye: f[7], kind: 'dso' };
  o.vec = radecVec(o.ra, o.dec); DSOS.push(o); BY_ID.set(o.id, o);
});
const FIG_BY_CON = {}; FIGURES.forEach(f => FIG_BY_CON[f.con] = f);
const AST_BY_ID = {}; ASTERISMS.forEach(a => AST_BY_ID[a.id] = a);
// Star designations use the Latin genitive: Delta Lyrae, "delta of Lyra".
const CON_GEN = Object.fromEntries('and Andromedae|ant Antliae|aps Apodis|aqr Aquarii|aql Aquilae|ara Arae|ari Arietis|aur Aurigae|boo Boötis|cae Caeli|cam Camelopardalis|cnc Cancri|cvn Canum Venaticorum|cma Canis Majoris|cmi Canis Minoris|cap Capricorni|car Carinae|cas Cassiopeiae|cen Centauri|cep Cephei|cet Ceti|cha Chamaeleontis|cir Circini|col Columbae|com Comae Berenices|cra Coronae Australis|crb Coronae Borealis|crv Corvi|crt Crateris|cru Crucis|cyg Cygni|del Delphini|dor Doradus|dra Draconis|equ Equulei|eri Eridani|for Fornacis|gem Geminorum|gru Gruis|her Herculis|hor Horologii|hya Hydrae|hyi Hydri|ind Indi|lac Lacertae|leo Leonis|lmi Leonis Minoris|lep Leporis|lib Librae|lup Lupi|lyn Lyncis|lyr Lyrae|men Mensae|mic Microscopii|mon Monocerotis|mus Muscae|nor Normae|oct Octantis|oph Ophiuchi|ori Orionis|pav Pavonis|peg Pegasi|per Persei|phe Phoenicis|pic Pictoris|psc Piscium|psa Piscis Austrini|pup Puppis|pyx Pyxidis|ret Reticuli|sge Sagittae|sgr Sagittarii|sco Scorpii|scl Sculptoris|sct Scuti|ser Serpentis|sex Sextantis|tau Tauri|tel Telescopii|tri Trianguli|tra Trianguli Australis|tuc Tucanae|uma Ursae Majoris|umi Ursae Minoris|vel Velorum|vir Virginis|vol Volantis|vul Vulpeculae'.split('|').map(p => [p.slice(0, 3), p.slice(4)]));
function displayName(o) {
  if (o.name) return o.name;
  if (o.kind === 'star') return (GREEK[o.id.split('-')[1]] || o.bayer) + ' ' + (CON_GEN[o.con] || (CON_NAME[o.con] ? CON_NAME[o.con].name : o.con));
  return o.id;
}

/* ---------- Milky Way ---------- */
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const MW = (() => {
  const rnd = mulberry(20260922), pts = [];
  const NGP_RA = 192.85948 * D2R, NGP_DEC = 27.12825 * D2R, LNCP = 122.93192 * D2R;
  const sD = Math.sin(NGP_DEC), cD = Math.cos(NGP_DEC);
  for (let i = 0; i < 900; i++) {
    const l = rnd() * 360;
    const dl = Math.min(Math.abs(l), 360 - Math.abs(l));
    const sig = 4.2 + 6.5 * Math.exp(-((dl / 45) ** 2));
    let b = (rnd() + rnd() + rnd() + rnd() - 2) * sig;
    let w = 0.30 + 0.70 * Math.exp(-((dl / 52) ** 2)) + 0.34 * Math.exp(-((Math.abs(l - 80) / 28) ** 2))
          + 0.20 * Math.exp(-((Math.abs(l - 285) / 30) ** 2));
    w *= Math.exp(-0.5 * (b / sig) ** 2) * (0.55 + 0.9 * rnd());
    if (l < 95 && b > -2.5 && b < 7) w *= 0.34;                 // the Great Rift
    if (w < 0.045) continue;
    const lr = l * D2R, br = b * D2R, cb = Math.cos(br), sb = Math.sin(br), cx = Math.cos(LNCP - lr), sx = Math.sin(LNCP - lr);
    const dec = Math.asin(clamp(sD * sb + cD * cb * cx, -1, 1));
    const ra = NGP_RA + Math.atan2(cb * sx, cD * sb - sD * cb * cx);
    const cdec = Math.cos(dec);
    pts.push({ v: [cdec * Math.cos(ra), cdec * Math.sin(ra), Math.sin(dec)], w, r: 0.9 + rnd() * 1.6 });
  }
  return pts;
})();

/* ---------- places ---------- */
const PLACES = [
  { n: 'London', lat: 51.51, lon: -0.13, tz: 'Europe/London' },
  { n: 'New York', lat: 40.71, lon: -74.01, tz: 'America/New_York' },
  { n: 'Los Angeles', lat: 34.05, lon: -118.24, tz: 'America/Los_Angeles' },
  { n: 'Chicago', lat: 41.88, lon: -87.63, tz: 'America/Chicago' },
  { n: 'Berlin', lat: 52.52, lon: 13.40, tz: 'Europe/Berlin' },
  { n: 'Madrid', lat: 40.42, lon: -3.70, tz: 'Europe/Madrid' },
  { n: 'Cairo', lat: 30.04, lon: 31.24, tz: 'Africa/Cairo' },
  { n: 'Delhi', lat: 28.61, lon: 77.21, tz: 'Asia/Kolkata' },
  { n: 'Tokyo', lat: 35.68, lon: 139.69, tz: 'Asia/Tokyo' },
  { n: 'Singapore', lat: 1.35, lon: 103.82, tz: 'Asia/Singapore' },
  { n: 'Nairobi', lat: -1.29, lon: 36.82, tz: 'Africa/Nairobi' },
  { n: 'São Paulo', lat: -23.55, lon: -46.63, tz: 'America/Sao_Paulo' },
  { n: 'Santiago', lat: -33.45, lon: -70.67, tz: 'America/Santiago' },
  { n: 'Sydney', lat: -33.87, lon: 151.21, tz: 'Australia/Sydney' },
  { n: 'Cape Town', lat: -33.92, lon: 18.42, tz: 'Africa/Johannesburg' },
  { n: 'Auckland', lat: -36.85, lon: 174.76, tz: 'Pacific/Auckland' },
  { n: 'Toronto', lat: 43.65, lon: -79.38, tz: 'America/Toronto' },
  { n: 'Vancouver', lat: 49.28, lon: -123.12, tz: 'America/Vancouver' },
  { n: 'Denver', lat: 39.74, lon: -104.99, tz: 'America/Denver' },
  { n: 'Phoenix', lat: 33.45, lon: -112.07, tz: 'America/Phoenix' },
  { n: 'Anchorage', lat: 61.22, lon: -149.90, tz: 'America/Anchorage' },
  { n: 'Honolulu', lat: 21.31, lon: -157.86, tz: 'Pacific/Honolulu' },
  { n: 'Halifax', lat: 44.65, lon: -63.57, tz: 'America/Halifax' },
  { n: 'Mexico City', lat: 19.43, lon: -99.13, tz: 'America/Mexico_City' },
  { n: 'Bogotá', lat: 4.71, lon: -74.07, tz: 'America/Bogota' },
  { n: 'Lima', lat: -12.05, lon: -77.04, tz: 'America/Lima' },
  { n: 'Buenos Aires', lat: -34.60, lon: -58.38, tz: 'America/Argentina/Buenos_Aires' },
  { n: 'Reykjavík', lat: 64.15, lon: -21.94, tz: 'Atlantic/Reykjavik' },
  { n: 'Dublin', lat: 53.35, lon: -6.26, tz: 'Europe/Dublin' },
  { n: 'Paris', lat: 48.86, lon: 2.35, tz: 'Europe/Paris' },
  { n: 'Amsterdam', lat: 52.37, lon: 4.90, tz: 'Europe/Amsterdam' },
  { n: 'Rome', lat: 41.90, lon: 12.50, tz: 'Europe/Rome' },
  { n: 'Stockholm', lat: 59.33, lon: 18.07, tz: 'Europe/Stockholm' },
  { n: 'Athens', lat: 37.98, lon: 23.73, tz: 'Europe/Athens' },
  { n: 'Istanbul', lat: 41.01, lon: 28.98, tz: 'Europe/Istanbul' },
  { n: 'Moscow', lat: 55.76, lon: 37.62, tz: 'Europe/Moscow' },
  { n: 'Lagos', lat: 6.52, lon: 3.38, tz: 'Africa/Lagos' },
  { n: 'Johannesburg', lat: -26.20, lon: 28.05, tz: 'Africa/Johannesburg' },
  { n: 'Dubai', lat: 25.20, lon: 55.27, tz: 'Asia/Dubai' },
  { n: 'Karachi', lat: 24.86, lon: 67.01, tz: 'Asia/Karachi' },
  { n: 'Mumbai', lat: 19.08, lon: 72.88, tz: 'Asia/Kolkata' },
  { n: 'Bangkok', lat: 13.76, lon: 100.50, tz: 'Asia/Bangkok' },
  { n: 'Jakarta', lat: -6.21, lon: 106.85, tz: 'Asia/Jakarta' },
  { n: 'Manila', lat: 14.60, lon: 120.98, tz: 'Asia/Manila' },
  { n: 'Hong Kong', lat: 22.32, lon: 114.17, tz: 'Asia/Hong_Kong' },
  { n: 'Shanghai', lat: 31.23, lon: 121.47, tz: 'Asia/Shanghai' },
  { n: 'Seoul', lat: 37.57, lon: 126.98, tz: 'Asia/Seoul' },
  { n: 'Perth', lat: -31.95, lon: 115.86, tz: 'Australia/Perth' },
  { n: 'Melbourne', lat: -37.81, lon: 144.96, tz: 'Australia/Melbourne' },
  { n: 'Brisbane', lat: -27.47, lon: 153.03, tz: 'Australia/Brisbane' },
  { n: 'Adelaide', lat: -34.93, lon: 138.60, tz: 'Australia/Adelaide' }
];
function guessPlace() {
  let tz = 'UTC';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {}
  const hit = PLACES.find(p => p.tz === tz);
  if (hit) return { ...hit };
  // Unknown zone: longitude from STANDARD time (daylight saving would shift it 15°), latitude a rough regional guess.
  const y = new Date().getUTCFullYear();
  const std = Math.min(tzOffsetMin(Date.UTC(y, 0, 15), tz), tzOffsetMin(Date.UTC(y, 6, 15), tz));
  const lat = /^Australia|^Pacific\/(Auckland|Chatham)|^Antarctica/.test(tz) ? -33 : /^America\/(Argentina|Santiago|Sao_Paulo|Montevideo)/.test(tz) ? -30 : 42;
  return { n: tz.split('/').pop().replace(/_/g, ' ') + ' (approx.)', lat, lon: clamp(std / 4, -180, 180), tz };
}

/* ---------- state ---------- */
const S = {
  time: Date.now(), playing: false, speed: 3600,
  place: guessPlace(),
  az: 180, alt: 35, fov: 100,
  limit: 5.2, twinkle: true,
  layers: { figures: true, labels: 'named', milkyway: true, dso: true, planets: true,
            horizon: true, cardinals: true, ecliptic: false, altgrid: false, atmosphere: true, art: true },
  live: false, liveLast: 0, dir: 1,
  focusFigs: null, asterism: null, marks: [], hop: null, hideLabels: false,
  awaiting: null, selected: null, lesson: null, step: 0, done: {}, drill: null, tab: 'course',
  ruler: false, lessonRuler: false, ladder: null, measuring: false, measure: { a: null, b: null },
  nightAcc: 0, tour: null, home: null,
  q: 0, hintLevel: 0, known: {}, readAloud: false, linkedTerms: new Set(), qPassing: false, lookSince: 0, lastDrill: null
};
try { const raw = localStorage.getItem('starhop.v1'); if (raw) { const o = JSON.parse(raw); if (o && o.done) S.done = o.done; if (o.home) S.place = o.home;
  else if (o.place) { const hit = PLACES.find(q => q.n === o.place.n); S.place = hit ? { ...hit } : guessPlace(); } if (o.limit) S.limit = o.limit; if (o.known) S.known = o.known; if (o.read) S.readAloud = true; } } catch (e) {}
S.home = { ...S.place };
function save() { try { localStorage.setItem('starhop.v1', JSON.stringify({ done: S.done, home: S.home, limit: S.limit, known: S.known, read: S.readAloud })); } catch (e) {} }
function goHome() { S.place = { ...S.home }; }

const VR = { on: false, stereo: false, C: null, fov: 72 };

/* ---------- per-frame sky solution ---------- */
let SKY = null;
function solve() {
  const jd = jdFrom(S.time);
  const lst = norm360(gmst(jd) + S.place.lon);
  const P = precession(jd);
  const E = enuMat(lst, S.place.lat);
  const C = VR.on && VR.C ? VR.C : camMat(S.az, S.alt);
  const sun = sunEq(jd), moon = moonEq(jd);
  const enuStar = mul3(E, P);
  const sunE = apply3(E, sun.v), sunAlt = Math.asin(clamp(sunE[2], -1, 1)) * R2D;
  const sunAz = norm360(Math.atan2(sunE[0], sunE[1]) * R2D);
  const elong = Math.acos(clamp(Math.cos(moon.bet) * Math.cos(moon.lam - sun.lam), -1, 1));
  const moonIllum = (1 - Math.cos(elong)) / 2;
  const moonE = apply3(E, moon.v), moonAlt = Math.asin(clamp(moonE[2], -1, 1)) * R2D;
  // moonlight washes the sky too
  const atm = S.layers.atmosphere !== false, effSun = atm ? sunAlt : -90;
  const moonWash = atm && moonAlt > 0 ? moonIllum * moonIllum * Math.min(1, moonAlt / 30) * 1.5 : 0;
  let limit = S.limit;
  if (effSun > -18) limit = Math.min(limit, -1.2 + (Math.max(-18, Math.min(-2, effSun)) + 18) * -0.42 + 6.6);
  if (effSun > -6) limit = Math.min(limit, 1.4 - effSun * 0.55);
  if (effSun > 0) limit = Math.min(limit, -2.2 - effSun * 0.08);
  limit -= moonWash;
  SKY = { jd, lst, P, E, C, sun, moon, enuStar, enuCam: mul3(C, E), starCam: mul3(C, enuStar),
          sunAlt, effSun, atm, sunAz, moonAlt, moonIllum, limit: Math.max(-3, limit), elong,
          planets: PLANETS.filter(p => p.n).map(p => ({ p, ...planetState(p, jd) })) };
  return SKY;
}
function altazVec(v, ofDate) {
  const e = apply3(ofDate ? SKY.E : SKY.enuStar, v);
  return { alt: Math.asin(clamp(e[2], -1, 1)) * R2D, az: norm360(Math.atan2(e[0], e[1]) * R2D) };
}
const COMPASS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
const dirWord = az => COMPASS[Math.round(norm360(az) / 22.5) % 16];

/* =====================  RENDERER  ===================== */
const cv = document.getElementById('sky'), ctx = cv.getContext('2d', { alpha: true });
let W = 0, H = 0, DPR = 1, CX = 0, CY = 0, SCALE = 1;
const INSET = { l: 0, t: 0, b: 0 };
function measureInsets() {
  if (VR.on) { INSET.l = INSET.t = INSET.b = 0; return; }
  const rail = document.getElementById('rail'), con = document.getElementById('console'), top = document.getElementById('topbar');
  const mobile = window.innerWidth <= 820;
  INSET.l = (!mobile && rail) ? Math.max(0, rail.getBoundingClientRect().right) : 0;
  INSET.t = top ? Math.max(0, top.getBoundingClientRect().bottom - 8) : 0;
  INSET.b = con ? Math.max(0, H - con.getBoundingClientRect().top) : 0;
}
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  measureInsets();
}
new ResizeObserver(resize).observe(cv);

const glow = (() => { const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(.28, 'rgba(255,255,255,.34)');
  rg.addColorStop(.6, 'rgba(255,255,255,.07)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return c; })();

const mwGlow = (() => { const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(208,201,186,.95)'); rg.addColorStop(.35, 'rgba(202,197,188,.42)');
  rg.addColorStop(.7, 'rgba(190,188,184,.10)'); rg.addColorStop(1, 'rgba(180,180,180,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64); return c; })();

function refract(e) {
  if (e[2] >= 0.16 || e[2] < -0.05) return e;
  const alt = Math.asin(clamp(e[2], -1, 1)) * R2D;
  const R = (1.02 / Math.tan((alt + 10.3 / (alt + 5.11)) * D2R)) / 60;
  const na = (alt + R) * D2R, hor = Math.hypot(e[0], e[1]) || 1e-9, f = Math.cos(na) / hor;
  return [e[0] * f, e[1] * f, Math.sin(na)];
}
function proj(camV) {
  const Z = camV[2];
  if (VR.on) { if (Z < 0.03) return null; return { x: CX + camV[0] / Z * SCALE, y: CY - camV[1] / Z * SCALE, z: Z }; }
  if (Z < -0.92) return null;
  const k = 2 / (1 + Z);
  return { x: CX + camV[0] * k * SCALE, y: CY - camV[1] * k * SCALE, z: Z };
}
function place(vec, ofDate) {
  let e = apply3(ofDate ? SKY.E : SKY.enuStar, vec);
  e = refract(e);
  const alt = Math.asin(clamp(e[2], -1, 1)) * R2D;
  const p = proj(apply3(SKY.C, e));
  return p ? { x: p.x, y: p.y, z: p.z, alt, az: norm360(Math.atan2(e[0], e[1]) * R2D) } : null;
}
const airmass = alt => 1 / (Math.sin(Math.max(alt, -1.2) * D2R) + 0.025);
const extinct = alt => alt < 30 ? Math.min(3.2, 0.23 * (airmass(alt) - airmass(90))) : 0.02;

const DAY = (() => { const c = document.createElement('canvas'); c.width = 96; c.height = 64;
  const g = c.getContext('2d'); return { c, g, img: g.createImageData(96, 64) }; })();
function perez(th, ga, k) {
  return (1 + k[0] * Math.exp(k[1] / Math.max(Math.cos(th), 0.02))) * (1 + k[2] * Math.exp(k[3] * ga) + k[4] * Math.cos(ga) * Math.cos(ga));
}
function drawDaySky(alpha) {
  const T = 2.6;                                                  // turbidity: a clear day
  const sun = apply3(SKY.E, SKY.sun.v), ts = Math.min(Math.acos(clamp(sun[2], -1, 1)), 1.56);
  const kY = [0.1787 * T - 1.4630, -0.3554 * T + 0.4275, -0.0227 * T + 5.3251, 0.1206 * T - 2.5771, -0.0670 * T + 0.3703];
  const kx = [-0.0193 * T - 0.2592, -0.0665 * T + 0.0008, -0.0004 * T + 0.2125, -0.0641 * T - 0.8989, -0.0033 * T + 0.0452];
  const ky = [-0.0167 * T - 0.2608, -0.0950 * T + 0.0092, -0.0079 * T + 0.2102, -0.0441 * T - 1.6537, -0.0109 * T + 0.0529];
  const chi = (4 / 9 - T / 120) * (Math.PI - 2 * ts);
  const Yz = Math.max(0.05, (4.0453 * T - 4.9710) * Math.tan(chi) - 0.2155 * T + 2.4192);
  const t2 = ts * ts, t3 = t2 * ts;
  const xz = T * T * (0.00166 * t3 - 0.00375 * t2 + 0.00209 * ts) + T * (-0.02903 * t3 + 0.06377 * t2 - 0.03202 * ts + 0.00394) + (0.11693 * t3 - 0.21196 * t2 + 0.06052 * ts + 0.25886);
  const yz = T * T * (0.00275 * t3 - 0.00610 * t2 + 0.00317 * ts) + T * (-0.04214 * t3 + 0.08970 * t2 - 0.04153 * ts + 0.00516) + (0.15346 * t3 - 0.26756 * t2 + 0.06670 * ts + 0.26688);
  const fY = perez(0, ts, kY), fx = perez(0, ts, kx), fy = perez(0, ts, ky);
  const C = SKY.C, w = 96, h = 64, d = DAY.img.data, gnom = VR.on;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const X1 = ((i + 0.5) / w * W - CX) / SCALE, Y1 = -((j + 0.5) / h * H - CY) / SCALE;
    let X, Y, Z;
    if (gnom) { const n = 1 / Math.hypot(X1, Y1, 1); X = X1 * n; Y = Y1 * n; Z = n; }
    else { const r2 = X1 * X1 + Y1 * Y1, q = 4 + r2; X = 4 * X1 / q; Y = 4 * Y1 / q; Z = (4 - r2) / q; }
    const e0 = X * C[0][0] + Y * C[1][0] + Z * C[2][0], e1 = X * C[0][1] + Y * C[1][1] + Z * C[2][1], e2 = X * C[0][2] + Y * C[1][2] + Z * C[2][2];
    const th = Math.acos(clamp(e2, 0.02, 1)), ga = Math.acos(clamp(e0 * sun[0] + e1 * sun[1] + e2 * sun[2], -1, 1));
    const Yv = Yz * perez(th, ga, kY) / fY, xv = xz * perez(th, ga, kx) / fx, yv = yz * perez(th, ga, ky) / fy;
    const Xc = xv / yv * Yv, Zc = (1 - xv - yv) / yv * Yv;
    const lin = [3.2406 * Xc - 1.5372 * Yv - 0.4986 * Zc, -0.9689 * Xc + 1.8758 * Yv + 0.0415 * Zc, 0.0557 * Xc - 0.2040 * Yv + 1.0570 * Zc];
    const o = (j * w + i) * 4;
    const tm = lin.map(c => 1 - Math.exp(-Math.max(0, c) / 17));
    const L = 0.2126 * tm[0] + 0.7152 * tm[1] + 0.0722 * tm[2];
    for (let c = 0; c < 3; c++) d[o + c] = 255 * Math.pow(clamp(L + (tm[c] - L) * 1.35, 0, 1), 1 / 2.2);
    d[o + 3] = 255;
  }
  DAY.g.putImageData(DAY.img, 0, 0);
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(DAY.c, 0, 0, W, H); ctx.restore();
}
function skyGround() {
  if (VR.camera) { ctx.clearRect(0, 0, W, H); return; }          // the phone's camera is the sky
  const sa = SKY.effSun;
  const day = clamp((sa + 6) / 12, 0, 1);
  const tw = clamp((sa + 18) / 18, 0, 1);
  const top = [4 + 30 * day + 4 * tw, 6 + 66 * day + 8 * tw, 13 + 110 * day + 26 * tw];
  const bot = [7 + 60 * day + 26 * tw, 11 + 92 * day + 26 * tw, 22 + 128 * day + 44 * tw];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgb(${top.map(Math.round)})`);
  g.addColorStop(1, `rgb(${bot.map(Math.round)})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (sa > -22) {                                              // glow where the Sun actually is
    const sp = place(SKY.sun.v, true);
    if (sp) {
      const inten = clamp((sa + 22) / 26, 0, 1);
      const rad = Math.max(W, H) * (0.55 + 0.5 * inten);
      const rg = ctx.createRadialGradient(sp.x, sp.y + rad * 0.12, 0, sp.x, sp.y + rad * 0.12, rad);
      const a = 0.62 * inten;
      rg.addColorStop(0, `rgba(255,${Math.round(150 + 80 * day)},${Math.round(70 + 120 * day)},${a})`);
      rg.addColorStop(.35, `rgba(${Math.round(210 + 30 * day)},${Math.round(110 + 90 * day)},70,${a * .34})`);
      rg.addColorStop(1, 'rgba(120,60,40,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }
  }
  if (sa > -4) drawDaySky(clamp((sa + 4) / 7, 0, 1));             // from sunrise on, the real colour of daylight
}
/* Light pollution and natural airglow: both brighten toward the horizon, where you look through more air. */
function drawSkyGlow() {
  if (!SKY.atm) return;
  const dark = clamp((-SKY.sunAlt - 8) / 10, 0, 1);
  if (dark <= 0.01) return;
  const lp = clamp((6.6 - S.limit) / 3.4, 0, 1);              // 0 = pristine, 1 = city centre
  const col = [Math.round(52 + 78 * lp), Math.round(66 + 30 * lp), Math.round(64 - 4 * lp)];
  // a uniform lift: city skies are never black, even straight up
  ctx.fillStyle = `rgba(${col},${(0.035 + 0.16 * lp) * dark})`;
  ctx.fillRect(0, 0, W, H);
  if (VR.on) {
    const n = [SKY.C[0][2], SKY.C[1][2], SKY.C[2][2]], nn = n[0] * n[0] + n[1] * n[1];
    if (nn < 1e-4) return;
    const X0 = -n[2] * n[0] / nn, Y0 = -n[2] * n[1] / nn, r = Math.sqrt(nn);
    const hx = CX + X0 * SCALE, hy = CY - Y0 * SCALE, ux = n[0] / r, uy = -n[1] / r, L = SCALE * 0.75;
    const gv = ctx.createLinearGradient(hx, hy, hx + ux * L, hy + uy * L), a1 = (0.07 + 0.42 * lp) * dark;
    gv.addColorStop(0, `rgba(${col},${a1})`); gv.addColorStop(0.3, `rgba(${col},${a1 * 0.4})`); gv.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H);
    return;
  }
  const sa = Math.sin(S.alt * D2R), ca = Math.cos(S.alt * D2R);
  if (1 + sa < 0.06) return;
  const zx = CX, zy = CY - (2 * ca / (1 + sa)) * SCALE;
  const hz = proj(apply3(SKY.C, [Math.sin(S.az * D2R), Math.cos(S.az * D2R), 0]));
  const R = hz ? Math.max(40, Math.hypot(hz.x - zx, hz.y - zy)) : Math.max(W, H);
  const g = ctx.createRadialGradient(zx, zy, R * 0.3, zx, zy, R * 1.03);
  const a1 = (0.07 + 0.42 * lp) * dark;
  g.addColorStop(0, `rgba(${col},0)`);
  g.addColorStop(0.62, `rgba(${col},${a1 * 0.22})`);
  g.addColorStop(0.9, `rgba(${col},${a1 * 0.7})`);
  g.addColorStop(1, `rgba(${col},${a1})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function drawMilkyWay() {
  if (!S.layers.milkyway || SKY.effSun > -8) return;
  // Brightness is deliberately low: from a dark site the Milky Way is a faint
  // glow a few per cent above the background sky, never a bright band.
  const fade = clamp((-SKY.effSun - 9) / 9, 0, 1) * clamp((SKY.limit - 4.2) / 1.5, 0, 1);
  if (fade <= 0.01) return;
  ctx.globalCompositeOperation = 'lighter';
  const sz = Math.max(20, SCALE * 0.10);
  for (const m of MW) {
    const p = place(m.v, false); if (!p || p.alt < -3) continue;
    const a = m.w * fade * 0.026 * clamp((p.alt + 3) / 16, 0, 1);
    if (a < 0.0015) continue;
    const r = sz * m.r * (2 / (1 + p.z));
    ctx.globalAlpha = Math.min(a, 0.032);
    ctx.drawImage(mwGlow, p.x - r, p.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}
function drawAltGrid() {
  if (!S.layers.altgrid) return;
  ctx.strokeStyle = 'rgba(127,178,255,.16)'; ctx.lineWidth = 1;
  for (let alt = 0; alt <= 80; alt += 20) {
    ctx.beginPath(); let started = false;
    for (let az = 0; az <= 360; az += 3) {
      const a = alt * D2R, z = az * D2R, ca = Math.cos(a);
      const p = proj(apply3(SKY.C, [ca * Math.sin(z), ca * Math.cos(z), Math.sin(a)]));
      if (!p) { started = false; continue; }
      started ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), started = true);
    }
    ctx.stroke();
  }
  for (let az = 0; az < 360; az += 45) {
    ctx.beginPath(); let started = false;
    for (let alt = 0; alt <= 88; alt += 3) {
      const a = alt * D2R, z = az * D2R, ca = Math.cos(a);
      const p = proj(apply3(SKY.C, [ca * Math.sin(z), ca * Math.cos(z), Math.sin(a)]));
      if (!p) { started = false; continue; }
      started ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), started = true);
    }
    ctx.stroke();
  }
}
function drawEcliptic() {
  if (!S.layers.ecliptic) return;
  const e = OBL(SKY.jd);
  ctx.strokeStyle = 'rgba(244,185,66,.42)'; ctx.lineWidth = 1.3; ctx.setLineDash([7, 6]);
  ctx.beginPath(); let started = false;
  for (let l = 0; l <= 360; l += 2) {
    const lr = l * D2R;
    const v = [Math.cos(lr), Math.cos(e) * Math.sin(lr), Math.sin(e) * Math.sin(lr)];
    const p = place(v, true);
    if (!p || p.z < -0.3) { started = false; continue; }
    started ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), started = true);
  }
  ctx.stroke(); ctx.setLineDash([]);
}
function drawFigures() {
  if (!S.layers.figures && !S.focusFigs) return;
  const focus = S.focusFigs;
  ctx.lineWidth = 1;
  for (const fig of FIGURES) {
    const on = focus ? focus.includes(fig.con) : true;
    if (focus && !on) continue;
    ctx.strokeStyle = on && focus ? 'rgba(160,200,255,.72)' : 'rgba(127,178,255,.30)';
    ctx.lineWidth = on && focus ? 1.5 : 1;
    ctx.beginPath();
    for (const [a, b] of fig.lines) {
      const A = place(BY_ID.get(a).vec), B = place(BY_ID.get(b).vec);
      if (!A || !B || A.alt < -2 || B.alt < -2 || A.z < 0 || B.z < 0) continue;
      if (Math.hypot(A.x - B.x, A.y - B.y) > Math.max(W, H) * 1.4) continue;
      ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
    }
    ctx.stroke();
  }
}
function drawAsterism() {
  const a = S.asterism && AST_BY_ID[S.asterism]; if (!a) return;
  ctx.strokeStyle = 'rgba(244,185,66,.85)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(244,185,66,.55)'; ctx.shadowBlur = 9;
  ctx.beginPath();
  for (const [x, y] of a.path) {
    const A = place(BY_ID.get(x).vec), B = place(BY_ID.get(y).vec);
    if (!A || !B || A.z < 0 || B.z < 0) continue;
    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
  }
  ctx.stroke(); ctx.shadowBlur = 0;
}
let tClock = 0;
function drawStars() {
  const lim = SKY.limit, zoomB = clamp(62 / S.fov, 0.72, 2.4);
  const labels = [];
  for (const s of STARS) {
    s._p = null;
    const p = place(s.vec); if (!p || p.alt < -1.5 || p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) continue;
    let m = s.mag + extinct(p.alt);
    if (m > lim + 0.6) continue;
    let tw = 1;
    if (S.twinkle && p.alt < 45) {
      const amp = 0.05 + 0.30 * clamp((45 - p.alt) / 45, 0, 1) ** 1.6;
      tw = 1 + amp * Math.sin(tClock * 6.1 + s.hash) * Math.sin(tClock * 3.3 + s.hash * 2.1);
    }
    const over = lim - m;
    const alpha = clamp(0.30 + over * 0.42, 0, 1) * clamp((over + 0.6) / 0.9, 0, 1) * tw;
    if (alpha < 0.035) continue;
    let r = (0.62 + 0.62 * Math.max(0, over)) * zoomB * tw;
    r = Math.min(r, 9);
    const [R, G, B] = s.rgb;
    if (m < 2.6) {
      const gr = r * (m < 1 ? 7.5 : m < 1.8 ? 5.5 : 4);
      ctx.globalAlpha = clamp(0.30 * alpha, 0, .5);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(glow, p.x - gr, p.y - gr, gr * 2, gr * 2);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${R},${G},${B})`;
    if (VR.camera) { ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 4; r = Math.max(r * 1.35, 1.4); }
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    if (m < 1.1) {                                             // diffraction spikes on the true beacons
      const L = r * 5.5;
      ctx.globalAlpha = alpha * 0.32; ctx.strokeStyle = `rgb(${R},${G},${B})`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(p.x - L, p.y); ctx.lineTo(p.x + L, p.y);
      ctx.moveTo(p.x, p.y - L); ctx.lineTo(p.x, p.y + L); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    s._p = p;
    const mode = S.hideLabels ? 'none' : S.layers.labels;
    if (mode !== 'none' && p.alt > 0) {
      const want = mode === 'all' ? m < lim - 0.4 : mode === 'named' ? (s.name && m < 3.9) : (s.name && m < 2.2);
      if (want) labels.push({ x: p.x, y: p.y, r, text: s.name || displayName(s), dim: m > 2.4 });
    }
  }
  return labels;
}
function drawDSOs() {
  if (!S.layers.dso) { for (const o of DSOS) o._p = null; return []; }
  const labels = [];
  for (const o of DSOS) {
    o._p = null;
    if (o.mag > SKY.limit + 0.5) continue;                       // a cluster or galaxy you could not see now
    const p = place(o.vec); if (!p || p.alt < 0 || p.z < 0) continue;
    o._p = p;
    const r = clamp(SCALE * 0.055, 5, 26);
    ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glow, p.x - r, p.y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(157,140,255,.55)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.72, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    if (!S.hideLabels && S.layers.labels !== 'none')
      labels.push({ x: p.x, y: p.y, r: r * 0.72, text: o.name, dim: true, violet: true });
  }
  return labels;
}
function drawPlanets() {
  if (!S.layers.planets) return [];
  const labels = [];
  for (const q of SKY.planets) {
    const p = place(q.v, false); if (!p || p.alt < -1 || p.z < 0) continue;
    const m = q.mag + extinct(p.alt);
    if (m > SKY.limit + 0.8) { q._p = null; continue; }
    q._p = p; q.obj = { id: 'planet-' + q.p.k, kind: 'planet', name: q.p.n, q };
    const over = SKY.limit - m;
    const r = Math.min(10, (1.0 + 0.72 * Math.max(0, over)) * clamp(62 / S.fov, 0.75, 2.4));
    const gr = r * 5;
    ctx.globalAlpha = 0.34; ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glow, p.x - gr, p.y - gr, gr * 2, gr * 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = q.p.col;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
    if (!S.hideLabels && S.layers.labels !== 'none') labels.push({ x: p.x, y: p.y, r, text: q.p.n, planet: true });
  }
  return labels;
}
function drawMoonSun() {
  const sp = place(SKY.sun.v, true);
  if (sp && sp.alt > -1.2 && sp.z > 0) {
    const r = Math.max(5, 0.266 * D2R * SCALE * 2);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .9; const gr = r * 9;
    ctx.drawImage(glow, sp.x - gr, sp.y - gr, gr * 2, gr * 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff6df'; ctx.beginPath(); ctx.arc(sp.x, sp.y, r, 0, TAU); ctx.fill();
    SKY.sunScreen = sp;
  } else SKY.sunScreen = null;

  const mp = place(SKY.moon.v, true);
  SKY.moonScreen = null;
  if (mp && mp.alt > -1.2 && mp.z > 0) {
    SKY.moonScreen = mp;
    const r = Math.max(6, SKY.moon.semi * D2R * SCALE * 2);
    const gr = r * 3.4;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.16 + 0.5 * SKY.moonIllum;
    ctx.drawImage(glow, mp.x - gr, mp.y - gr, gr * 2, gr * 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // bright limb faces the Sun
    let chi = 0;
    if (SKY.sunScreen) chi = Math.atan2(SKY.sunScreen.y - mp.y, SKY.sunScreen.x - mp.x);
    ctx.save(); ctx.translate(mp.x, mp.y); ctx.rotate(chi);
    ctx.fillStyle = 'rgba(126,134,152,.30)';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    const k = 1 - 2 * SKY.moonIllum;                            // terminator half-width factor
    ctx.fillStyle = '#e9e5d8'; ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(0, 0, Math.abs(r * k), r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
    ctx.fill(); ctx.restore();
  }
}
function drawMarksAndHops() {
  for (const id of S.marks) {
    let p = null;
    if (id.startsWith('planet-')) { const q = SKY.planets.find(z => 'planet-' + z.p.k === id); p = q && q._p; }
    else { const o = BY_ID.get(id); p = o && (o._p || place(o.vec)); }
    if (!p || p.z < 0) continue;
    const t = (Math.sin(tClock * 2.6) + 1) / 2;
    const rr = 15 + 6 * t;
    ctx.strokeStyle = `rgba(244,185,66,${0.55 + 0.4 * t})`; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(244,185,66,.3)';
    ctx.beginPath(); ctx.arc(p.x, p.y, rr + 8 * t, 0, TAU); ctx.stroke();
  }
  const hop = S.hop; if (!hop) return;
  const pts = hop.chain.map(id => {
    const o = BY_ID.get(id); return o ? place(o.vec) : null;
  });
  ctx.setLineDash([9, 7]); ctx.lineDashOffset = -tClock * 26;
  ctx.strokeStyle = 'rgba(244,185,66,.92)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(244,185,66,.5)'; ctx.shadowBlur = 8;
  for (let i = 0; i < pts.length - 1; i++) {
    const A = pts[i], B = pts[i + 1]; if (!A || !B || A.z < 0 || B.z < 0) continue;
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
    const bow = (hop.curve || 0) * len;
    const mx = (A.x + B.x) / 2 - dy / len * bow, my = (A.y + B.y) / 2 + dx / len * bow;
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.quadraticCurveTo(mx, my, B.x, B.y); ctx.stroke();
    if (i === pts.length - 2) {                                 // arrowhead
      const ang = Math.atan2(B.y - my, B.x - mx);
      ctx.setLineDash([]); ctx.beginPath();
      ctx.moveTo(B.x - 13 * Math.cos(ang - .38), B.y - 13 * Math.sin(ang - .38));
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(B.x - 13 * Math.cos(ang + .38), B.y - 13 * Math.sin(ang + .38));
      ctx.stroke(); ctx.setLineDash([9, 7]);
    }
  }
  ctx.setLineDash([]); ctx.shadowBlur = 0; ctx.lineDashOffset = 0;
  if (hop.label) {
    const A = pts.find(Boolean), B = [...pts].reverse().find(Boolean);
    if (A && B) {
      const x = (A.x + B.x) / 2, y = (A.y + B.y) / 2 - 16;
      ctx.font = '500 12px Montserrat,sans-serif'; ctx.textAlign = 'center';
      const w = ctx.measureText(hop.label).width;
      ctx.fillStyle = 'rgba(9,13,24,.85)'; ctx.fillRect(x - w / 2 - 7, y - 12, w + 14, 19);
      ctx.fillStyle = '#f4b942'; ctx.fillText(hop.label, x, y + 2);
      ctx.textAlign = 'left';
    }
  }
}
function drawHorizonVR() {
  const n = [SKY.C[0][2], SKY.C[1][2], SKY.C[2][2]];          // world "up" in camera coordinates
  const g = (x, y) => n[0] * (x - CX) / SCALE - n[1] * (y - CY) / SCALE + n[2];
  const corners = [[0, 0], [W, 0], [W, H], [0, H]], poly = [], cut = [];
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4], ga = g(a[0], a[1]), gb = g(b[0], b[1]);
    if (ga < 0) poly.push(a);
    if ((ga < 0) !== (gb < 0)) { const t = ga / (ga - gb), q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; poly.push(q); cut.push(q); }
  }
  if (poly.length >= 3) {
    ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for (const q of poly.slice(1)) ctx.lineTo(q[0], q[1]); ctx.closePath();
    const lit = clamp((SKY.effSun + 4) / 12, 0, 1);
    if (!VR.camera) { ctx.fillStyle = `rgba(${Math.round(5 + 64 * lit)},${Math.round(8 + 70 * lit)},${Math.round(14 + 52 * lit)},.96)`; ctx.fill(); }
  }
  if (cut.length === 2) {
    ctx.strokeStyle = 'rgba(140,165,215,.45)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cut[0][0], cut[0][1]); ctx.lineTo(cut[1][0], cut[1][1]); ctx.stroke();
  }
}
function drawHorizon() {
  if (!S.layers.horizon) return;
  if (VR.on) { drawHorizonVR(); drawCardinals(); return; }
  // In a stereographic projection the horizon great circle maps to an exact circle.
  // Camera-space up = (0, cos alt0, sin alt0) -> centre (0, 2cot alt0), radius 2/|sin alt0|.
  const sa = Math.sin(S.alt * D2R), ca = Math.cos(S.alt * D2R);
  const gg = ctx.createLinearGradient(0, 0, 0, H);
  const lit = clamp((SKY.effSun + 4) / 12, 0, 1), mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * lit));
  gg.addColorStop(0, `rgba(${mix([6, 9, 16], [74, 82, 70])},.97)`); gg.addColorStop(1, `rgba(${mix([2, 3, 6], [38, 44, 36])},1)`);
  ctx.save();
  ctx.beginPath();
  if (Math.abs(sa) < 0.018) {                                   // looking along the horizon
    ctx.rect(-W, CY, W * 3, H * 2);
    ctx.fillStyle = gg; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-W, CY); ctx.lineTo(W * 2, CY);
  } else {
    const hx = CX, hy = CY - (2 * ca / sa) * SCALE, hr = Math.abs(2 / sa) * SCALE;
    if (hr < 1e6) {
      if (S.alt > 0) {                                          // ground is OUTSIDE the circle
        ctx.rect(-W, -H, W * 3, H * 3);
        ctx.arc(hx, hy, hr, 0, TAU);
        ctx.fillStyle = gg; ctx.fill('evenodd');
      } else {                                                  // looking down: ground is inside
        ctx.arc(hx, hy, hr, 0, TAU);
        ctx.fillStyle = gg; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(hx, hy, hr, 0, TAU);
    }
  }
  ctx.strokeStyle = 'rgba(140,165,215,.38)'; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.restore();
  drawCardinals();
}
function drawCardinals() {
  if (!S.layers.cardinals) return;
  ctx.textAlign = 'center';
  for (let i = 0; i < 16; i++) {
    const az = i * 22.5, major = i % 4 === 0;
    if (!major && S.fov > 120) continue;
    const z = az * D2R;
    const p = proj(apply3(SKY.C, [Math.sin(z) * 0.996, Math.cos(z) * 0.996, 0.087]));
    if (!p || p.z < 0.1) continue;
    ctx.fillStyle = major ? 'rgba(231,236,248,.85)' : 'rgba(155,167,196,.45)';
    ctx.font = major ? '600 13px Montserrat,sans-serif' : '400 10px Montserrat,sans-serif';
    ctx.fillText(COMPASS[i], p.x, p.y);
  }
  ctx.textAlign = 'left';
}
/* ---------- measuring: the hand scale, the fist ladder, and the two-point ruler ---------- */
const COMPASS8 = ['north','north-east','east','south-east','south','south-west','west','north-west'];
const compassLong = az => COMPASS8[Math.round(norm360(az) / 45) % 8];
function fistsText(deg) {
  const h = Math.round(deg / 5) / 2;
  if (h < 0.5) return deg < 1.5 ? 'about a little finger' : deg < 3.5 ? 'about a thumb-width' : 'about three fingers';
  const whole = Math.floor(h), half = h - whole >= 0.5;
  return `about ${whole || ''}${half ? '½' : ''} fist${h > 1 ? 's' : ''}`;
}
function upPhrase(alt) {
  if (alt > 78) return 'almost straight overhead';
  if (alt < 6) return 'right down on the horizon';
  return fistsText(alt) + ' above the horizon';
}
function handWords(deg) {
  if (deg < 1.4) return 'a little finger';
  if (deg < 3.2) return 'a thumb-width';
  if (deg < 7.5) return 'three fingers';
  return fistsText(deg).replace('about ', '');
}
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function enuOf(o) {
  if (o.kind === 'moon') return apply3(SKY.E, SKY.moon.v);
  if (o.kind === 'sun') return apply3(SKY.E, SKY.sun.v);
  if (o.kind === 'planet') { const q = SKY.planets.find(z => z.p.k === o.q.p.k); return apply3(SKY.enuStar, q.v); }
  return apply3(SKY.enuStar, o.vec);
}
function screenOf(o) {
  if (!o) return null;
  if (o.kind === 'moon') return SKY.moonScreen;
  if (o.kind === 'sun') return SKY.sunScreen;
  if (o.kind === 'planet') { const q = SKY.planets.find(z => z.p.k === o.q.p.k); return q && q._p; }
  return o._p || place(o.vec);
}
function angPx(deg) { return VR.on ? Math.tan(deg * D2R) * SCALE : 2 * Math.tan(deg * D2R / 2) * SCALE; }
function drawHandScale() {
  if (!S.ruler && !S.lessonRuler && !S.measuring) return;
  if (VR.stereo) return;
  const rows = HANDS.map(h => ({ ...h, px: angPx(h.deg) }))
    .filter(h => h.px >= 5 && h.px <= (W - INSET.l) * 0.42);
  if (!rows.length) return;
  const lw = 92, pad = 12, rowH = 21;
  const boxW = lw + Math.max(...rows.map(r => r.px)) + pad * 2 + 8, boxH = rows.length * rowH + 34;
  const x0 = INSET.l + 16, y0 = H - INSET.b - boxH - 12;
  ctx.fillStyle = 'rgba(9,13,24,.84)'; ctx.fillRect(x0, y0, boxW, boxH);
  ctx.strokeStyle = 'rgba(140,165,215,.18)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + .5, y0 + .5, boxW - 1, boxH - 1);
  ctx.font = '500 9.5px Montserrat,sans-serif'; ctx.fillStyle = 'rgba(155,167,196,.8)';
  ctx.textBaseline = 'middle'; ctx.fillText('AT ARM’S LENGTH', x0 + pad, y0 + 14);
  rows.forEach((r, i) => {
    const y = y0 + 32 + i * rowH;
    ctx.font = '400 11.5px Montserrat,sans-serif'; ctx.fillStyle = 'rgba(231,236,248,.9)';
    ctx.fillText(r.short, x0 + pad, y);
    ctx.font = '400 10px Montserrat,sans-serif'; ctx.fillStyle = 'rgba(244,185,66,.9)';
    ctx.fillText(r.deg + '°', x0 + pad + 64, y);
    const bx = x0 + pad + lw;
    ctx.strokeStyle = 'rgba(244,185,66,.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + r.px, y); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(bx, y - 4); ctx.lineTo(bx, y + 4); ctx.moveTo(bx + r.px, y - 4); ctx.lineTo(bx + r.px, y + 4); ctx.stroke();
  });
  ctx.textBaseline = 'alphabetic';
}
function drawLadder() {
  const o = S.ladder && BY_ID.get(S.ladder); if (!o) return;
  const pos = altazVec(o.vec, false); if (pos.alt < 2) return;
  const az = pos.az * D2R, pt = a => { const r = a * D2R; return proj(apply3(SKY.C, refract([Math.cos(r) * Math.sin(az), Math.cos(r) * Math.cos(az), Math.sin(r)]))); };
  ctx.strokeStyle = 'rgba(244,185,66,.8)'; ctx.lineWidth = 1.6; ctx.setLineDash([2, 4]);
  ctx.beginPath(); let started = false;
  for (let a = 0; a <= pos.alt; a += 0.5) { const p = pt(a); if (!p) continue; started ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), started = true); }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '500 10.5px Montserrat,sans-serif'; ctx.textBaseline = 'middle';
  for (let f = 1; f * 10 <= pos.alt + 0.01; f++) {
    const p = pt(f * 10); if (!p) continue;
    ctx.strokeStyle = 'rgba(244,185,66,.95)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(p.x - 7, p.y); ctx.lineTo(p.x + 7, p.y); ctx.stroke();
    const t = f + (f === 1 ? ' fist' : ' fists');
    ctx.fillStyle = 'rgba(9,13,24,.82)'; ctx.fillRect(p.x + 11, p.y - 8, ctx.measureText(t).width + 8, 16);
    ctx.fillStyle = '#f4b942'; ctx.fillText(t, p.x + 15, p.y);
  }
  ctx.textBaseline = 'alphabetic';
}
function drawMeasure() {
  const m = S.measure; if (!S.measuring || !m.a) return;
  const pa = screenOf(m.a);
  if (pa) { ctx.strokeStyle = '#f4b942'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pa.x, pa.y, 11, 0, TAU); ctx.stroke(); }
  if (!m.b) return;
  const A = enuOf(m.a), B = enuOf(m.b), ang = Math.acos(clamp(dot3(A, B), -1, 1));
  if (ang < 1e-5) return;
  ctx.strokeStyle = '#f4b942'; ctx.lineWidth = 1.8; ctx.setLineDash([6, 5]);
  ctx.beginPath(); let started = false, mid = null;
  for (let i = 0; i <= 48; i++) {
    const t = i / 48, k1 = Math.sin((1 - t) * ang) / Math.sin(ang), k2 = Math.sin(t * ang) / Math.sin(ang);
    const v = [A[0] * k1 + B[0] * k2, A[1] * k1 + B[1] * k2, A[2] * k1 + B[2] * k2];
    const p = proj(apply3(SKY.C, refract(v)));
    if (!p || p.z < -0.2) { started = false; continue; }
    if (i === 24) mid = p;
    started ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), started = true);
  }
  ctx.stroke(); ctx.setLineDash([]);
  const pb = screenOf(m.b);
  if (pb) { ctx.beginPath(); ctx.arc(pb.x, pb.y, 11, 0, TAU); ctx.stroke(); }
  if (mid) {
    const deg = ang * R2D, t1 = deg.toFixed(deg < 10 ? 1 : 0) + '°', t2 = handWords(deg);
    ctx.font = '600 13px Montserrat,sans-serif';
    const w1 = ctx.measureText(t1).width;
    ctx.font = '400 11px Montserrat,sans-serif';
    const w2 = ctx.measureText(t2).width, bw = Math.max(w1, w2) + 18;
    ctx.fillStyle = 'rgba(9,13,24,.9)'; ctx.fillRect(mid.x - bw / 2, mid.y - 40, bw, 36);
    ctx.strokeStyle = 'rgba(244,185,66,.5)'; ctx.lineWidth = 1; ctx.strokeRect(mid.x - bw / 2 + .5, mid.y - 39.5, bw - 1, 35);
    ctx.textAlign = 'center';
    ctx.font = '600 13px Montserrat,sans-serif'; ctx.fillStyle = '#f4b942'; ctx.fillText(t1, mid.x, mid.y - 24);
    ctx.font = '400 11px Montserrat,sans-serif'; ctx.fillStyle = 'rgba(231,236,248,.9)'; ctx.fillText(t2, mid.x, mid.y - 10);
    ctx.textAlign = 'left';
  }
}
function drawLabels(list) {
  if (!list.length) return;
  list.sort((a, b) => (a.dim === b.dim) ? 0 : a.dim ? 1 : -1);
  const taken = [];
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const L of list) {
    ctx.font = L.dim ? '400 11px Montserrat,sans-serif' : '500 12.5px Montserrat,sans-serif';
    const w = ctx.measureText(L.text).width;
    const x = L.x + L.r + 7, y = L.y - L.r - 2;
    const box = [x - 3, y - 8, w + 6, 16];
    if (taken.some(t => box[0] < t[0] + t[2] && box[0] + box[2] > t[0] && box[1] < t[1] + t[3] && box[1] + box[3] > t[1])) continue;
    taken.push(box);
    ctx.fillStyle = L.planet ? 'rgba(255,232,190,.95)' : L.violet ? 'rgba(178,166,255,.85)'
      : L.dim ? 'rgba(190,202,228,.62)' : 'rgba(236,241,252,.94)';
    ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 4;
    ctx.fillText(L.text, x, y); ctx.shadowBlur = 0;
  }
  ctx.textBaseline = 'alphabetic';
}
function drawSelection() {
  const o = S.selected; if (!o) return;
  const p = o.kind === 'planet' ? (o.q && o.q._p) : place(o.vec, o.ofDate);
  if (!p || p.z < 0) return;
  ctx.strokeStyle = 'rgba(231,236,248,.9)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, TAU); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(p.x - 27, p.y); ctx.lineTo(p.x - 20, p.y); ctx.moveTo(p.x + 20, p.y); ctx.lineTo(p.x + 27, p.y);
  ctx.moveTo(p.x, p.y - 27); ctx.lineTo(p.x, p.y - 20); ctx.moveTo(p.x, p.y + 20); ctx.lineTo(p.x, p.y + 27);
  ctx.stroke();
}

let lastFrame = performance.now();
function frame(now) {
  if (typeof XR !== 'undefined' && XR.active) { lastFrame = now; requestAnimationFrame(frame); return; }   // the headset draws for itself
  const dt = Math.min(0.25, (now - lastFrame) / 1000); lastFrame = now; tClock = now / 1000;
  advanceTime(dt);
  if (!W) resize();
  frameBody();
}
function advanceTime(dt) {
  if (S.live) {
    // Live follows the wall clock exactly. Anything else that moves the time drops out of live.
    if (Math.abs(S.time - S.liveLast) > 1500) { S.live = false; syncTimeBtns(); }
    else { S.time = Date.now(); S.liveLast = S.time; }
  }
  if (!S.live && S.playing) {
    if (S.speed === -1) {                                      // same clock time, night after night
      S.nightAcc += dt * 8;
      while (S.nightAcc >= 1) { S.time += 86400000 * S.dir; S.nightAcc -= 1; }
    } else S.time += dt * S.speed * 1000 * S.dir;
  }
}
function frameBody() {
  if (VR.on) vrBeforeFrame();
  if (VR.on && VR.stereo) {
    const fullW = W, eyeW = Math.floor(fullW / 2);
    W = eyeW; layoutView();
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, eyeW, H); ctx.clip();
    drawWorld(); vrHud();
    ctx.restore();
    W = fullW;
    ctx.drawImage(cv, 0, 0, Math.round(eyeW * DPR), cv.height, fullW - eyeW, 0, eyeW, H);
    ctx.fillStyle = '#000'; ctx.fillRect(eyeW - 1, 0, fullW - 2 * eyeW + 2, H);
  } else {
    layoutView(); drawWorld();
    if (VR.on) vrHud();
  }
  tickUI();
  requestAnimationFrame(frame);
}
function layoutView() {
  if (VR.on) {
    // The crosshair is wherever the phone points; keep it in the middle of the sky you can
    // actually see, above the lesson sheet, easing so it never jumps.
    const target = VR.stereo ? H / 2 : (VR.top + 96 + (VR.bottom || H - 62)) / 2;
    VR.cy = VR.cy == null ? target : VR.cy + (target - VR.cy) * 0.18;
    CX = W / 2; CY = VR.stereo ? H / 2 : VR.cy;
    SCALE = (Math.min(W, H) / 2) / Math.tan(VR.fov * D2R / 2);
    return;
  }
  const vw = Math.max(200, W - INSET.l), vh = Math.max(200, H - INSET.t - INSET.b);
  CX = INSET.l + vw / 2; CY = INSET.t + vh / 2;
  SCALE = (Math.min(vw, vh) / 2) / (2 * Math.tan(S.fov * D2R / 4));
}
const ARTS = (typeof ART !== 'undefined' ? ART : []).map(a => ({ ...a,
  v: a.a.map(([, , ra, dec]) => radecVec(ra / 15, dec)), img: null, ready: false }));
function artImg(a) {
  if (!a.img) { a.img = new Image(); a.img.onload = () => { a.ready = true; }; a.img.src = a.file; }
  return a.ready;
}
function drawArt() {
  if (!S.layers.art || !ARTS.length || S.hideLabels) return;
  const day = clamp((-SKY.effSun - 2) / 8, 0, 1); if (day <= 0.02 && !VR.camera) return;
  const focus = S.focusFigs || null;
  const base = (focus ? 0.05 : VR.camera ? 0.26 : 0.1) * (VR.camera ? 1 : day);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const a of ARTS) {
    const on = focus && focus.includes(a.con);
    const alpha = on ? 0.36 * Math.max(day, VR.camera ? 1 : 0) : base;
    if (alpha < 0.01) continue;
    const P = a.v.map(v => place(v));
    if (P.some(p => !p || p.z < (VR.on ? 0.1 : -0.3))) continue;
    const minx = Math.min(P[0].x, P[1].x, P[2].x), maxx = Math.max(P[0].x, P[1].x, P[2].x);
    const miny = Math.min(P[0].y, P[1].y, P[2].y), maxy = Math.max(P[0].y, P[1].y, P[2].y);
    const span = Math.max(maxx - minx, maxy - miny);
    if (maxx < -span || minx > W + span || maxy < -span || miny > H + span || span > Math.max(W, H) * 3) continue;
    if (!artImg(a)) continue;
    const [u0, v0] = a.a[0], [u1, v1] = a.a[1], [u2, v2] = a.a[2];
    const du1 = u1 - u0, dv1 = v1 - v0, du2 = u2 - u0, dv2 = v2 - v0, det = du1 * dv2 - du2 * dv1;
    if (Math.abs(det) < 1e-6) continue;
    const dX1 = P[1].x - P[0].x, dX2 = P[2].x - P[0].x, dY1 = P[1].y - P[0].y, dY2 = P[2].y - P[0].y;
    const m11 = (dX1 * dv2 - dX2 * dv1) / det, m21 = (du1 * dX2 - du2 * dX1) / det;
    const m12 = (dY1 * dv2 - dY2 * dv1) / det, m22 = (du1 * dY2 - du2 * dY1) / det;
    const tx = P[0].x - m11 * u0 - m21 * v0, ty = P[0].y - m12 * u0 - m22 * v0;
    ctx.setTransform(DPR * m11, DPR * m12, DPR * m21, DPR * m22, DPR * tx, DPR * ty);
    ctx.globalAlpha = alpha;
    ctx.drawImage(a.img, 0, 0, a.w, a.h);
  }
  ctx.restore();
}
function drawWorld() {
  solve();
  skyGround();
  if (!VR.camera) { drawSkyGlow(); drawMilkyWay(); }
  drawArt();
  drawAltGrid();
  drawEcliptic();
  drawFigures();
  drawAsterism();
  const dsoL = drawDSOs();
  const starL = drawStars();
  const planL = drawPlanets();
  drawMoonSun();
  drawMarksAndHops();
  drawHorizon();
  drawLadder();
  drawMeasure();
  drawLabels([...starL, ...planL, ...dsoL]);
  drawSelection();
  drawHandScale();
}

/* =====================  STAGING  ===================== */
function evalAt(ms, lat, lon, vec) {
  const jd = jdFrom(ms), lst = norm360(gmst(jd) + lon);
  const E = enuMat(lst, lat);
  const se = apply3(E, sunEq(jd).v);
  const te = apply3(mul3(E, precession(jd)), vec);
  return { sunAlt: Math.asin(clamp(se[2], -1, 1)) * R2D,
           alt: Math.asin(clamp(te[2], -1, 1)) * R2D,
           az: norm360(Math.atan2(te[0], te[1]) * R2D) };
}
function findStage(vec, lat, lon, tz, minAlt, floor, extra) {
  const base = Date.now();
  for (const need of [minAlt, minAlt - 12, minAlt - 22, 6].filter(n => floor == null || n >= floor)) {
    for (let d = 0; d < 375; d++) {
      const lp = localParts(base + d * 86400000, tz);
      const ev = localToMs(lp.y, lp.mo, lp.d, 18, 0, tz);
      let best = null;
      for (let k = 0; k <= 11; k++) {
        const ms = ev + k * 3600000;
        const r = evalAt(ms, lat, lon, vec);
        if (r.sunAlt > -13 || r.alt < need) continue;
        if (extra && extra.some(v => evalAt(ms, lat, lon, v).alt < 12)) continue;
        const score = -Math.abs(r.alt - 48);
        if (!best || score > best.score) best = { ms, ...r, score };
      }
      if (best) return best;
    }
  }
  return null;
}
const BORROW = {
  north: [PLACES.find(p => p.n === 'New York'), PLACES.find(p => p.n === 'London'), PLACES.find(p => p.n === 'Tokyo')],
  south: [PLACES.find(p => p.n === 'Santiago'), PLACES.find(p => p.n === 'Cape Town'), PLACES.find(p => p.n === 'Sydney')]
};
function borrowPlace(dir) {
  const lon = S.home.lon, set = BORROW[dir];
  return { ...(lon < -30 ? set[0] : lon < 90 ? set[1] : set[2]) };
}
function sunAltAt(ms, pl) {
  const jd = jdFrom(ms), E = enuMat(norm360(gmst(jd) + pl.lon), pl.lat);
  return Math.asin(clamp(apply3(E, sunEq(jd).v)[2], -1, 1)) * R2D;
}
function nextDark(pl, fromMs) {
  if (sunAltAt(fromMs, pl) < -14) return fromMs;
  const lp = localParts(fromMs, pl.tz);
  const ev = localToMs(lp.y, lp.mo, lp.d, 16, 0, pl.tz);
  for (let k = 0; k < 34; k++) { const t = ev + k * 1800000; if (t > fromMs - 3600000 && sunAltAt(t, pl) < -14) return t; }
  for (let k = 0; k < 34; k++) { const t = ev + k * 1800000; if (t > fromMs - 3600000 && sunAltAt(t, pl) < -8) return t; }
  return ev + 6 * 3600000;
}
function doStage(st) {
  goHome();
  if (st.north && S.place.lat < 15) {
    const b = borrowPlace('north');
    toast(`Polaris never rises from ${S.home.n}, so this lesson visits ${b.n}. Your own southern sky gets the last lesson.`, 6000);
    S.place = b;
  }
  S.playing = false;
  if (st.fov) S.fov = st.fov;
  let vec = null, label = '';
  if (st.target) { const o = BY_ID.get(st.target); if (o) { vec = o.vec; label = displayName(o); } }
  if (st.planets) {
    const now = solve();
    let bestP = null;
    for (let d = 0; d < 200 && !bestP; d++) {
      const lp = localParts(Date.now() + d * 86400000, S.place.tz);
      const ev = localToMs(lp.y, lp.mo, lp.d, 19, 0, S.place.tz);
      for (let k = 0; k <= 8 && !bestP; k++) {
        const ms = ev + k * 3600000, jd = jdFrom(ms);
        const E = enuMat(norm360(gmst(jd) + S.place.lon), S.place.lat);
        if (Math.asin(clamp(apply3(E, sunEq(jd).v)[2], -1, 1)) * R2D > -12) continue;
        for (const p of PLANETS) {
          if (!p.n || p.k === 'uranus' || p.k === 'neptune') continue;
          const ps = planetState(p, jd);
          const e = apply3(mul3(E, precession(jd)), ps.v);
          const alt = Math.asin(clamp(e[2], -1, 1)) * R2D;
          if (alt > 22) { bestP = { ms, alt, az: norm360(Math.atan2(e[0], e[1]) * R2D), name: p.n }; break; }
        }
      }
    }
    if (bestP) { S.time = bestP.ms; S.az = bestP.az; S.alt = clamp(bestP.alt, 12, 68); return; }
    toast('No bright planet is well placed from here in the next few months — the sky below is still tonight.');
    return;
  }
  if (!vec) {
    if (sunAltAt(S.time, S.place) > -12) S.time = nextDark(S.place, Date.now());
    if (st.az != null) S.az = st.az;
    if (st.alt != null) S.alt = st.alt;
    return;
  }
  const extra = (st.also || []).map(id => BY_ID.get(id)).filter(Boolean).map(o => o.vec);
  let r = findStage(vec, S.place.lat, S.place.lon, S.place.tz, 34, 22, extra);
  if (!r) {                                                     // not well placed from home: go where it is
    const dec = vecRaDec(vec).dec, b = borrowPlace(dec >= 0 ? 'north' : 'south');
    r = findStage(vec, b.lat, b.lon, b.tz, 34, 22, extra);
    if (r) { S.place = b; toast(`That part of the sky is never well placed from ${S.home.n}, so this lesson borrows the sky over ${b.n}.`, 6000); }
  }
  if (!r) r = findStage(vec, S.place.lat, S.place.lon, S.place.tz, 34, 6);
  if (!r) { toast(label + ' is not well placed from here. Try a different location in the Sky tab.'); return; }
  S.time = r.ms; S.az = r.az; S.alt = clamp(r.alt, 10, 70);
}
function tzForLon(lat, lon, name) {
  const hit = PLACES.find(p => p.n === name); if (hit) return hit.tz;
  const h = Math.round(lon / 15);
  return h === 0 ? 'UTC' : 'Etc/GMT' + (h > 0 ? '-' : '+') + Math.abs(h);
}

/* =====================  PICKING  ===================== */
function pick(x, y) {
  let best = null, bestD = 30;
  const test = (o, p) => { if (!p || p.z < 0) return; const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) { bestD = d; best = o; } };
  for (const s of STARS) if (s._p) test(s, s._p);
  if (S.layers.dso) for (const o of DSOS) if (o._p) test(o, o._p);
  if (S.layers.planets) for (const q of SKY.planets) if (q._p) test(q.obj, q._p);
  if (SKY.moonScreen) test({ id: 'moon', kind: 'moon', name: 'The Moon' }, SKY.moonScreen);
  if (SKY.sunScreen) test({ id: 'sun', kind: 'sun', name: 'The Sun' }, SKY.sunScreen);
  return best;
}

/* =====================  CANVAS INPUT  ===================== */
let drag = null, pinch = null;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, az: S.az, alt: S.alt, moved: 0, t0: performance.now() };
  cv.classList.add('dragging');
});
cv.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
  if (VR.on && (VR.sensing || VR.stereo)) return;
  const perPx = (VR.on ? VR.fov * 0.9 : S.fov) / Math.min(W, H) * 1.05;
  S.az = norm360(drag.az - dx * perPx / Math.max(0.35, Math.cos(S.alt * D2R)));
  S.alt = clamp(drag.alt + dy * perPx, -25, 89);
});
cv.addEventListener('pointerup', e => {
  cv.classList.remove('dragging');
  if (drag && (drag.moved < 5 || (VR.on && VR.stereo && drag.moved < 40))) onSkyClick(e.clientX, e.clientY, performance.now() - drag.t0);
  drag = null;
});
cv.addEventListener('pointercancel', () => { drag = null; cv.classList.remove('dragging'); });
cv.addEventListener('wheel', e => {
  e.preventDefault();
  if (VR.on) VR.fov = clamp(VR.fov * (1 + Math.sign(e.deltaY) * 0.12), 12, 110);
  else S.fov = clamp(S.fov * (1 + Math.sign(e.deltaY) * 0.12), 4, 160);
}, { passive: false });
cv.addEventListener('touchstart', e => {
  if (e.touches.length === 2) { drag = null;
    pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), fov: VR.on ? VR.fov : S.fov }; }
}, { passive: true });
cv.addEventListener('touchmove', e => {
  if (pinch && e.touches.length === 2) {
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (VR.on) VR.fov = clamp(pinch.fov * pinch.d / Math.max(1, d), 12, 110);
    else S.fov = clamp(pinch.fov * pinch.d / Math.max(1, d), 4, 160);
  }
}, { passive: true });
cv.addEventListener('touchend', () => { pinch = null; });

function onSkyClick(cx, cy, pressMs) {
  if (VR.on && VR.stereo) { if (pressMs > 650) setStereo(false); else stereoTap(); return; }
  const r = cv.getBoundingClientRect();
  let o = pick(cx - r.left, cy - r.top);
  if (!o && VR.on && VR.hoverObj) o = VR.hoverObj;           // tap anywhere = "this one", the one in the crosshair
  if (S.awaiting) { judgeClick(o); return; }
  if (S.measuring) {
    if (!o) { toast('Click directly on a star, planet or the Moon.'); return; }
    const m = S.measure;
    if (!m.a || m.b) { m.a = o; m.b = null; toast('Now click a second object.', 2200); }
    else m.b = o;
    return;
  }
  S.selected = o; showInfo(o);
}

/* =====================  SMALL UI HELPERS  ===================== */
const $ = id => document.getElementById(id);
let toastT = 0;
function toast(msg, ms = 4200) {
  const t = $('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, ms);
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

/* =====================  RISE / SET  ===================== */
function altAtTime(vec, ms, ofDate) {
  const jd = jdFrom(ms), E = enuMat(norm360(gmst(jd) + S.place.lon), S.place.lat);
  const e = apply3(ofDate ? E : mul3(E, precession(jd)), vec);
  return Math.asin(clamp(e[2], -1, 1)) * R2D;
}
function bisectT(f, a, b, h0) {
  let fa = f(a) - h0;
  for (let i = 0; i < 14; i++) { const m = (a + b) / 2, fm = f(m) - h0; if ((fm >= 0) === (fa >= 0)) { a = m; fa = fm; } else b = m; }
  return (a + b) / 2;
}
/* Scans the local noon-to-noon window that contains the time on screen, so "tonight" means tonight. */
function riseSet(posAt, h0) {
  const lp = localParts(S.time, S.place.tz);
  let t0 = localToMs(lp.y, lp.mo, lp.d, 12, 0, S.place.tz);
  if (t0 > S.time) t0 -= 86400000;
  const alt = t => { const [v, od] = posAt(t); return altAtTime(v, t, od); };
  const step = 900000;
  let pt = t0, pa = alt(t0), rise = null, set = null, peak = { t: t0, a: pa }, low = pa;
  for (let t = t0 + step; t <= t0 + 86400000 + 1; t += step) {
    const a = alt(t);
    if (a > peak.a) peak = { t, a };
    if (a < low) low = a;
    if (pa < h0 && a >= h0 && rise == null) rise = bisectT(alt, pt, t, h0);
    if (pa >= h0 && a < h0 && set == null) set = bisectT(alt, pt, t, h0);
    pt = t; pa = a;
  }
  return { rise, set, peak, low, always: low >= h0, never: peak.a < h0 };
}
function hhmm(ms) { const lp = localParts(ms, S.place.tz); return String(lp.h).padStart(2, '0') + ':' + String(lp.mi).padStart(2, '0'); }
function posFn(o) {
  if (o.kind === 'moon') return t => [moonEq(jdFrom(t)).v, true];
  if (o.kind === 'sun') return t => [sunEq(jdFrom(t)).v, true];
  if (o.kind === 'planet') { const p = o.q.p; return t => [planetState(p, jdFrom(t)).v, false]; }
  return () => [o.vec, false];
}
function scheduleLine(o) {
  const h0 = o.kind === 'sun' ? -0.83 : o.kind === 'moon' ? 0.13 : -0.57;
  const r = riseSet(posFn(o), h0);
  if (r.never) return `Never rises from ${S.place.n}.`;
  if (r.always) return `Never sets from ${S.place.n} — it circles the pole all night. Highest at ${hhmm(r.peak.t)} (${r.peak.a.toFixed(0)}°).`;
  const bits = [];
  if (r.rise) bits.push('rises ' + hhmm(r.rise));
  bits.push('highest ' + hhmm(r.peak.t) + ' (' + r.peak.a.toFixed(0) + '°)');
  if (r.set) bits.push('sets ' + hhmm(r.set));
  const t = bits.join(' · ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/* =====================  INFO CARD  ===================== */
function showInfo(o) {
  const el = $('infocard');
  if (!o) { el.hidden = true; return; }
  let name, sub, rows = [], note = '', vis = '';
  const pos = o.kind === 'planet' ? altazVec(o.q.v, false)
            : (o.kind === 'moon') ? altazVec(SKY.moon.v, true)
            : (o.kind === 'sun') ? altazVec(SKY.sun.v, true)
            : altazVec(o.vec, false);
  if (o.kind === 'star') {
    name = o.name || displayName(o);
    const con = CON_NAME[o.con];
    sub = (o.name ? (GREEK[o.id.split('-')[1]] || o.bayer) + ' · ' : '') + (con ? con.name : o.con) + (con && con.nick ? ' · ' + con.nick : '');
    rows = [['Magnitude', o.mag.toFixed(2)], ['Distance', o.dist + ' ly'], ['Type', o.spec],
            ['Colour', tempWord(o.bv)], ['RA / Dec', raStr(o.ra) + '  ' + decStr(o.dec)]];
    note = NOTES[o.id] || '';
  } else if (o.kind === 'dso') {
    name = o.name; sub = o.dsoKind === 'galaxy' ? 'Galaxy' : o.dsoKind === 'nebula' ? 'Nebula' : 'Star cluster';
    rows = [['Magnitude', o.mag.toFixed(1)], ['Distance', o.dist], ['RA / Dec', raStr(o.ra) + '  ' + decStr(o.dec)]];
    note = o.eye;
  } else if (o.kind === 'planet') {
    name = o.q.p.n; sub = 'Planet';
    rows = [['Magnitude', o.q.mag.toFixed(1)], ['Distance', o.q.dist.toFixed(2) + ' AU'],
            ['Light delay', (o.q.dist * 8.317).toFixed(0) + ' min'], ['Lit', Math.round(o.q.phase * 100) + '%']];
    note = o.q.p.note;
  } else if (o.kind === 'moon') {
    name = 'The Moon'; sub = moonPhaseName(SKY.elong, SKY.moon.lam, SKY.sun.lam);
    rows = [['Illuminated', Math.round(SKY.moonIllum * 100) + '%'], ['Distance', Math.round(SKY.moon.dist).toLocaleString() + ' km'],
            ['Light delay', (SKY.moon.dist / 299792).toFixed(1) + ' s'], ['Apparent size', (SKY.moon.semi * 2 * 60).toFixed(1) + "'"]];
    note = 'The same face always points at us. A full Moon floods the sky and hides everything fainter than about magnitude 4 — plan faint targets for the week around new Moon.';
  } else if (o.kind === 'sun') {
    name = 'The Sun'; sub = 'Our star';
    rows = [['Distance', (SKY.sun.R * 149.6).toFixed(1) + ' million km'], ['Light delay', (SKY.sun.R * 8.317).toFixed(1) + ' min'],
            ['Type', 'G2V']];
    note = 'Never look at it directly, and never through binoculars or a telescope.';
  }
  vis = pos.alt > 0 ? `Up now — face ${compassLong(pos.az)}, ${upPhrase(pos.alt)} (${pos.alt.toFixed(0)}°)`
                    : `Below the horizon right now, towards the ${compassLong(pos.az)}`;
  const say = o.kind === 'star' && SAY[o.id];
  let sched = '';
  try { sched = scheduleLine(o); } catch (e) {}
  el.innerHTML = `<button class="x" id="info-x" aria-label="Close">×</button>
    <h3 class="iname">${esc(name)}</h3>
    ${say ? `<p class="isay"><span class="pron">${esc(say[0])}</span><span>${esc(say[1])}</span></p>` : ''}
    <p class="ibayer">${esc(sub)}</p>
    <dl class="idata">${rows.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>
    ${note ? `<p class="inote">${esc(note)}</p>` : ''}
    <p class="ivis${pos.alt > 0 ? '' : ' no'}">${esc(vis)}</p>
    ${sched ? `<p class="isched">${esc(sched)}</p>` : ''}
    <div style="display:flex;gap:7px;margin-top:12px">
      <button class="btn" id="info-centre" style="height:30px;font-size:11.5px">Centre view</button>
      ${pos.alt <= 0 ? `<button class="btn" id="info-when" style="height:30px;font-size:11.5px">When is it up?</button>` : ''}
    </div>`;
  el.hidden = false;
  $('info-x').onclick = () => { el.hidden = true; S.selected = null; };
  $('info-centre').onclick = () => { S.az = pos.az; S.alt = clamp(pos.alt, -8, 85); if (S.fov > 70) S.fov = 55; };
  const w = $('info-when');
  if (w) w.onclick = () => {
    const vec = o.kind === 'planet' ? o.q.v : o.vec;
    const r = findStage(vec, S.place.lat, S.place.lon, S.place.tz, 25);
    if (!r) { toast(name + ' does not rise usefully high from ' + S.place.n + '.'); return; }
    S.time = r.ms; S.az = r.az; S.alt = clamp(r.alt, 10, 70); S.playing = false;
    toast('Jumped to a night when ' + name + ' is well placed.');
    showInfo(o);
  };
}
const raStr = h => `${Math.floor(h)}h ${String(Math.floor((h % 1) * 60)).padStart(2, '0')}m`;
const decStr = d => `${d < 0 ? '−' : '+'}${String(Math.floor(Math.abs(d))).padStart(2, '0')}° ${String(Math.round((Math.abs(d) % 1) * 60)).padStart(2, '0')}'`;
function tempWord(bv) {
  return bv < -0.1 ? 'Blue-white · very hot' : bv < 0.25 ? 'White' : bv < 0.55 ? 'Yellow-white'
       : bv < 0.9 ? 'Yellow, like the Sun' : bv < 1.35 ? 'Orange · cooler' : 'Red · coolest';
}
function moonPhaseName(elong, mlam, slam) {
  const d = norm360((mlam - slam) * R2D);
  const names = ['New Moon','Waxing crescent','First quarter','Waxing gibbous','Full Moon','Waning gibbous','Last quarter','Waning crescent'];
  return names[Math.floor(((d + 22.5) % 360) / 45)];
}

/* =====================  TABS  ===================== */
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
let booted = false;
function setTab(t) {
  S.tab = t;
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  ['course','tonight','sky'].forEach(k => $('pane-' + k).hidden = k !== t);
  if (t === 'tonight') renderTonight();
  requestAnimationFrame(measureInsets);
  if (booted && window.innerWidth <= 820) $('rail').classList.add('open');
}

/* =====================  COURSE  ===================== */
const ALL_LESSONS = COURSE.flatMap(t => t.lessons);
function lessonIndex(id) { return ALL_LESSONS.findIndex(l => l.id === id); }
const checksOf = L => L.checks || (L.check ? [L.check] : []);
function currentCheck() { return S.lesson ? checksOf(S.lesson)[S.q] || null : null; }
const plain = t => String(t).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
function nextLesson() { return ALL_LESSONS.find(l => !S.done[l.id]) || null; }
function lessonNumber(L) { let n = 0; for (const l of ALL_LESSONS) { if (!l.checkpoint) n++; if (l === L) return l.checkpoint ? null : n; } return null; }

/* ---------- read aloud ---------- */
function readOut(text) {
  if (!S.readAloud || !window.speechSynthesis || VR.on || (typeof XR !== 'undefined' && XR.active)) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(plain(text)); u.lang = 'en'; u.rate = 0.97;
    setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) {} }, 60); } catch (e) {}
}
const SPEAKER = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6h2.6L8.6 3v10L5.1 10H2.5z"/><path d="M10.8 5.4a3.6 3.6 0 010 5.2M12.6 3.6a6.1 6.1 0 010 8.8"/></svg>';
function readButton(textForNow) {
  return `<button class="readbtn" id="l-read" aria-pressed="${S.readAloud}" title="Read the lesson out loud">${SPEAKER}<span>${S.readAloud ? 'Reading aloud' : 'Read aloud'}</span></button>`;
}
function wireReadButton(getText) {
  const b = $('l-read'); if (!b) return;
  b.onclick = () => {
    S.readAloud = !S.readAloud; save();
    b.setAttribute('aria-pressed', String(S.readAloud)); b.querySelector('span').textContent = S.readAloud ? 'Reading aloud' : 'Read aloud';
    if (S.readAloud) readOut(getText()); else try { speechSynthesis.cancel(); } catch (e) {}
  };
}

/* ---------- words explained where they appear ---------- */
const escRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function linkTerms(root) {
  if (!root || typeof GLOSSARY === 'undefined') return;
  const terms = GLOSSARY.filter(g => g.auto !== false).sort((a, b) => b.term.length - a.term.length);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (let n = 0; n < nodes.length; n++) {
    const node = nodes[n];
    if (!node.parentElement || node.parentElement.closest('.term, button, svg')) continue;
    for (const g of terms) {
      if (S.linkedTerms.has(g.term)) continue;
      const m = new RegExp('\\b' + escRe(g.term) + '(s|es)?\\b', 'i').exec(node.nodeValue);
      if (!m) continue;
      const after = document.createTextNode(node.nodeValue.slice(m.index + m[0].length));
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'term'; btn.dataset.term = g.term; btn.textContent = m[0];
      node.nodeValue = node.nodeValue.slice(0, m.index);
      node.parentNode.insertBefore(btn, node.nextSibling); btn.parentNode.insertBefore(after, btn.nextSibling);
      S.linkedTerms.add(g.term); nodes.push(after);
      break;
    }
  }
}
function showTerm(btn) {
  const g = GLOSSARY.find(x => x.term === btn.dataset.term); if (!g) return;
  let pop = $('termpop');
  if (!pop) { pop = document.createElement('div'); pop.id = 'termpop'; pop.setAttribute('role', 'tooltip'); document.body.appendChild(pop); }
  pop.innerHTML = `<b>${esc(g.term.charAt(0).toUpperCase() + g.term.slice(1))}</b>${esc(g.def)}`;
  pop.hidden = false;
  const r = btn.getBoundingClientRect(), w = Math.min(290, innerWidth - 24);
  pop.style.width = w + 'px';
  pop.style.left = clamp(r.left + r.width / 2 - w / 2, 12, innerWidth - w - 12) + 'px';
  const below = r.bottom + 8, h = pop.offsetHeight;
  pop.style.top = (below + h > innerHeight - 10 ? r.top - h - 8 : below) + 'px';
  readOut(g.term + '. ' + g.def);
}
document.addEventListener('click', e => {
  const t = e.target.closest && e.target.closest('.term');
  const pop = $('termpop');
  if (t) { e.stopPropagation(); showTerm(t); return; }
  if (pop && !e.target.closest('#termpop')) pop.hidden = true;
}, true);

/* ---------- pictures ---------- */
function figHtml(name) {
  if (typeof FIGS === 'undefined' || !FIGS[name]) return '';
  const f = FIGS[name]();
  return `<figure class="fig">${f.svg}<figcaption>${esc(f.cap)}</figcaption></figure>`;
}

/* ---------- what you have learned ---------- */
function learnedItems() {
  const out = [];
  for (const L of ALL_LESSONS) if (S.done[L.id]) for (const id of (L.teaches || [])) if (!out.includes(id)) out.push(id);
  for (const id of Object.keys(S.known)) if (!out.includes(id)) out.push(id);
  return out;
}
function itemName(id) {
  if (id.startsWith('ast:')) return (AST_BY_ID[id.slice(4)] || {}).name || id;
  if (id.startsWith('con:')) return (CON_NAME[id.slice(4)] || {}).name || id;
  const o = BY_ID.get(id); return o ? (o.name || displayName(o)) : id;
}
function itemLevel(id) { const k = S.known[id]; if (!k || !k.c) return 0; return k.c >= 3 && k.c > k.w ? 2 : 1; }
function credit(id, ok) {
  if (!id) return;
  const k = S.known[id] || (S.known[id] = { c: 0, w: 0, t: 0 });
  if (ok) k.c++; else k.w++;
  k.t = Date.now(); save();
}
function showKnown(id) {
  clearOverlays();
  let o = null;
  if (id.startsWith('ast:')) { const a = AST_BY_ID[id.slice(4)]; if (!a) return; S.asterism = a.id; o = BY_ID.get(a.stars[0]); }
  else if (id.startsWith('con:')) { const c = id.slice(4); S.focusFigs = [c]; o = STARS.filter(x => x.con === c).sort((a, b) => a.mag - b.mag)[0]; }
  else o = BY_ID.get(id);
  if (!o) return;
  let pos = altazVec(o.vec, false);
  if (pos.alt < 8) {
    const r = findStage(o.vec, S.place.lat, S.place.lon, S.place.tz, 30, 10);
    if (!r) { toast(itemName(id) + ' never climbs high from ' + S.place.n + '.'); return; }
    S.time = r.ms; S.playing = false; syncTimeBtns(); solve(); pos = altazVec(o.vec, false);
    toast(itemName(id) + ' is not up right now — showing a night when it is.');
  }
  if (!VR.on) { S.az = pos.az; S.alt = clamp(pos.alt, 5, 80); S.fov = id.includes(':') ? 85 : 55; }
  if (!id.includes(':')) { S.selected = o; showInfo(o); }
}

/* ---------- the course list ---------- */
function renderCourse() {
  const done = ALL_LESSONS.filter(l => S.done[l.id]).length;
  const pct = Math.round(done / ALL_LESSONS.length * 100), next = nextLesson();
  const mins = ALL_LESSONS.reduce((a, l) => a + l.mins, 0);
  let h = '';
  if (!done) h += `<div class="startcard">
      <p class="kicker" style="color:var(--amber)">New to the night sky?</p>
      <h3>Start here — no knowledge needed</h3>
      <p>Lesson 1 assumes you know nothing at all. Every lesson is a few short steps with a picture, then you try it yourself. Words with a dotted underline can be tapped for a plain explanation.</p>
      <button class="btn primary" id="c-go">Start lesson 1</button></div>`;
  else if (next) h += `<button class="continue" id="c-go"><span class="kicker">${next.checkpoint ? 'Next: a checkpoint' : 'Continue · lesson ' + lessonNumber(next)}</span>
      <b>${esc(next.title)}</b><span class="goalline">${esc(next.goal)}</span></button>`;
  h += `<p class="kicker">The pathway</p>
    <p class="lede">${ALL_LESSONS.filter(l => !l.checkpoint).length} short lessons and ${ALL_LESSONS.filter(l => l.checkpoint).length} checkpoints, about ${mins} minutes in all. Each lesson teaches one thing, then asks you to do it yourself.</p>
    <div class="progbar"><i style="width:${pct}%"></i></div>
    <p class="progtext">${done} of ${ALL_LESSONS.length} done · ${pct}%</p>`;
  let unlocked = true;
  for (const tier of COURSE) {
    h += `<div class="tier"><h3>${esc(tier.tierName)} <em>${esc(tier.tier)}</em></h3><p>${esc(tier.tierNote)}</p><div class="lessons">`;
    for (const l of tier.lessons) {
      const isDone = !!S.done[l.id], open = isDone || unlocked;
      if (!isDone && unlocked) unlocked = false;
      const num = lessonNumber(l);
      h += `<button class="lrow ${isDone ? 'done' : ''} ${open ? '' : 'locked'} ${l.checkpoint ? 'cp' : ''}" data-lesson="${l.id}" ${open ? '' : 'disabled'}>
        <span class="dot">${isDone ? '✓' : l.checkpoint ? '◆' : num}</span>
        <span class="lname">${esc(l.title)}</span>
        <span class="lmins">${l.checkpoint ? 'review' : l.mins + ' min'}</span></button>`;
    }
    h += `</div></div>`;
  }
  const items = learnedItems(), pool = practicePool();
  h += `<div class="seclabel">Your sky</div>`;
  if (items.length) {
    const lv = items.map(itemLevel), mastered = lv.filter(x => x === 2).length;
    h += `<p class="ksum">You know <b>${items.length}</b> ${items.length === 1 ? 'thing' : 'things'} in the sky${mastered ? `, <b>${mastered}</b> mastered` : ''}. Tap one to see it.</p>
      <div class="kchips">${items.map((id, i) => `<button class="kchip k${lv[i]}" data-item="${esc(id)}">${esc(itemName(id))}</button>`).join('')}</div>
      <p class="klegend"><span><i class="k0"></i>learned</span><span><i class="k1"></i>found in practice</span><span><i class="k2"></i>mastered (found 3+ times)</span></p>`;
  } else h += `<p class="ksum">Stars and patterns you learn will collect here.</p>`;
  h += `<button class="lrow" id="start-drill" ${pool.length ? '' : 'disabled'}><span class="dot">★</span>
      <span class="lname">${pool.length ? `Practise what you’ve learned <small>${pool.length} star${pool.length === 1 ? '' : 's'}, labels off</small>` : 'Practice unlocks after Lesson 3'}</span><span class="lmins">∞</span></button>`;
  h += `<details class="gloss"><summary>Words you’ll meet <span>${GLOSSARY.length}</span></summary><dl>
      ${[...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term)).map(g => `<dt>${esc(g.term)}</dt><dd>${esc(g.def)}</dd>`).join('')}</dl></details>`;
  if (done >= ALL_LESSONS.length) h += `<p class="tip">You have finished the pathway. Now do the only thing left: go outside, find the Big Dipper or Orion, and work outwards. Nothing on a screen replaces ten cold minutes under real stars.</p>`;
  $('pane-course').innerHTML = h;
  $('pane-course').querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => startLesson(b.dataset.lesson));
  $('pane-course').querySelectorAll('[data-item]').forEach(b => b.onclick = () => showKnown(b.dataset.item));
  const go = $('c-go'); if (go && next) go.onclick = () => startLesson(next.id);
  $('start-drill').onclick = startDrill;
}
function startLesson(id) {
  S.lesson = ALL_LESSONS[lessonIndex(id)]; S.step = 0; S.q = 0; S.drill = null; S.lessonDone = false;
  S.hideLabels = false; S.awaiting = null; S.selected = null; S.linkedTerms = new Set(); $('infocard').hidden = true;
  renderLesson();
}
function lessonHeader(right) {
  return `<div class="lhead"><button class="btn ghost" id="l-exit">← All lessons</button><span class="spacer"></span>${readButton()}<span class="lmins">${right}</span></div>`;
}
function renderLesson() {
  const L = S.lesson; if (!L) return renderCourse();
  const st = L.steps[S.step], last = S.step === L.steps.length - 1;
  applySet(st.set);
  S.hideLabels = false; S.awaiting = null;
  const num = lessonNumber(L);
  $('pane-course').innerHTML = lessonHeader(`${S.step + 1} / ${L.steps.length}`) + `
    <div id="lessonview">
      <p class="kicker">${L.checkpoint ? 'Checkpoint' : 'Lesson ' + num}</p>
      <h2>${esc(L.title)}</h2><p class="goal">${esc(L.goal)}</p>
      <div class="stepdots">${L.steps.map((_, i) => `<i class="${i === S.step ? 'on' : i < S.step ? 'past' : ''}"></i>`).join('')}</div>
      <p class="saytext">${fillSay(st.say)}</p>
      ${st.fig ? figHtml(st.fig) : ''}
      <div class="navrow">
        <button class="btn" id="l-prev" ${S.step === 0 ? 'disabled' : ''}>Back</button>
        ${last ? `<button class="btn primary" id="l-check">${L.checkpoint ? 'Start →' : 'Try it yourself →'}</button>`
               : `<button class="btn primary" id="l-next">Next</button>`}
        <span class="spacer"></span>
      </div>
    </div>`;
  linkTerms(document.querySelector('#pane-course .saytext'));
  $('l-exit').onclick = leaveLesson;
  $('l-prev').onclick = () => { if (S.step > 0) { S.step--; renderLesson(); } };
  const n = $('l-next'); if (n) n.onclick = () => { S.step++; renderLesson(); };
  const c = $('l-check'); if (c) c.onclick = () => { S.q = 0; renderCheck(); };
  const sayNow = () => plain(fillSay(st.say)) + (st.fig && FIGS[st.fig] ? ' ' + FIGS[st.fig]().cap : '');
  wireReadButton(sayNow); readOut(sayNow());
}
function fillSay(t) {
  const lat = Math.abs(S.place.lat);
  return t.replace(/\{place\}/g, esc(S.place.n)).replace(/\{lat\}/g, lat.toFixed(0))
          .replace(/\{latFists\}/g, fistsText(lat));
}
function lessonPattern(L, ch) {
  if (ch && ch.pattern) return ch.pattern;
  for (let i = L.steps.length - 1; i >= 0; i--) {
    const st = L.steps[i].set || {};
    if (st.asterism || st.figures || st.hop) return { asterism: st.asterism, figures: st.figures, hop: st.hop };
  }
  return null;
}
function renderCheck() {
  const L = S.lesson, qs = checksOf(L), ch = qs[S.q];
  if (!ch) return passLesson();
  S.checking = ch; S.hintLevel = 0; S.misses = 0; S.lookSince = 0; S.qPassing = false;
  S.marks = []; S.hop = null; S.asterism = null; S.focusFigs = null;
  if (ch.hideLabels) S.hideLabels = true;
  if (ch.kind !== 'choice' && S.playing && !S.live) { S.playing = false; syncTimeBtns(); }   // hold the sky still while they point
  if (ch.kind === 'look' && !VR.on && !(typeof XR !== 'undefined' && XR.active)) { S.az = 70; S.alt = 12; }   // start away from the answer
  let body;
  if (ch.kind === 'choice') {
    body = `<div class="opts">${ch.options.map((o, i) => `<button class="opt" data-o="${i}">${esc(o.text)}</button>`).join('')}</div>`;
    S.awaiting = null;
  } else if (ch.kind === 'look') {
    body = `<div class="findcue"><span class="pulse"></span>${VR.on ? 'Turn and tilt — the app is watching which way you point' : 'Drag the sky — the app is watching which way you look'}</div>`;
    S.awaiting = null;
  } else {
    body = `<div class="findcue"><span class="pulse"></span>Click it in the sky</div>`;
    S.awaiting = ch;
  }
  const many = qs.length > 1;
  $('pane-course').innerHTML = lessonHeader(many ? `question ${S.q + 1} of ${qs.length}` : 'your turn') + `
    <div id="lessonview"><p class="kicker">${L.checkpoint ? 'Checkpoint' : 'Your turn'}</p><h2>${esc(L.title)}</h2>
      ${many ? `<div class="stepdots">${qs.map((_, i) => `<i class="${i === S.q ? 'on' : i < S.q ? 'past' : ''}"></i>`).join('')}</div>` : ''}
      <div class="check"><p class="q">${esc(ch.ask)}</p>${body}
        <p class="verdict" id="verdict" hidden></p>
        <p class="hint" id="hintbox" hidden></p>
      </div>
      <div class="navrow" style="margin-top:14px">
        <button class="btn" id="l-back">Back to the lesson</button>
        <span class="spacer"></span>
        <button class="btn ghost" id="l-hint">Hint</button>
        ${ch.kind === 'find' || ch.kind === 'planet' ? '<button class="btn ghost" id="l-show">Show me</button>' : ''}
      </div></div>`;
  linkTerms(document.querySelector('#pane-course .check .q'));
  $('l-exit').onclick = leaveLesson;
  $('l-back').onclick = () => { S.awaiting = null; S.checking = null; S.hideLabels = false; S.step = L.steps.length - 1; renderLesson(); };
  $('l-hint').onclick = () => giveHint(L, ch);
  const sm = $('l-show'); if (sm) sm.onclick = () => showAnswer(ch);
  $('pane-course').querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const ok = !!ch.options[+b.dataset.o].ok;
    b.classList.add(ok ? 'right' : 'wrong');
    const v = $('verdict'); v.hidden = false;
    if (ok) { v.className = 'verdict ok'; v.textContent = 'Right.'; readOut('Right.'); passQuestion(700); }
    else { v.className = 'verdict no'; v.textContent = 'Not quite — try another.'; readOut('Not quite. Try another.'); if (!S.hintLevel) giveHint(L, ch); }
  });
  wireReadButton(() => ch.ask); readOut(ch.ask);
}
/* Hints climb: words first, then the pattern drawn in, then the answer circled. */
function giveHint(L, ch) {
  const hb = $('hintbox'), btn = $('l-hint'); if (!hb) return;
  const max = ch.kind === 'choice' ? 1 : ch.kind === 'look' ? 2 : 3;
  S.hintLevel = Math.min(max, S.hintLevel + 1);
  if (S.hintLevel === 1) hb.textContent = (VR.on && ch.hintVR) || ch.hint || 'Go back to the lesson for a reminder.';
  if (S.hintLevel === 2) {
    if (ch.kind === 'look') hb.textContent += VR.on ? ' Use the compass strip and the small number above the crosshair.' : ' Watch “facing” and “alt” in the bar at the bottom of the screen.';
    else {
      const pat = lessonPattern(L, ch);
      if (pat) { S.asterism = pat.asterism || null; S.focusFigs = pat.figures || null; S.hop = pat.hop || null; hb.textContent += ' The pattern is drawn in for you now.'; }
      else hb.textContent += ' Try zooming out to see more of the sky.';
    }
  }
  if (S.hintLevel === 3) { showAnswer(ch); }
  hb.hidden = false;
  if (btn) { btn.textContent = S.hintLevel >= max ? 'Hint' : 'More help'; btn.disabled = S.hintLevel >= max; }
  readOut(hb.textContent);
}
function showAnswer(ch) {
  S.marks = ch.kind === 'planet'
    ? SKY.planets.filter(q => q._p && q.mag < 3).map(q => 'planet-' + q.p.k)
    : (ch.targets || []).filter(id => { const t = BY_ID.get(id); return t && altazVec(t.vec, false).alt > 0; }).slice(0, 7);
  const t = BY_ID.get(ch.targets && ch.targets[0]);
  if (t && !VR.on) { const pos = altazVec(t.vec, false); if (pos.alt > 0) { S.az = pos.az; S.alt = clamp(pos.alt, 5, 80); } }
  toast('Circled. Now click it to carry on.');
}
function missHint(o, targets) {
  if (!o) return '';
  if (typeof XR !== 'undefined' && XR.active) return xrMissHint(o, targets);
  const oe = enuOf(o); let best = null;
  for (const id of targets) {
    const t = BY_ID.get(id); if (!t) continue;
    const d = Math.acos(clamp(dot3(oe, apply3(SKY.enuStar, t.vec)), -1, 1)) * R2D;
    if (!best || d < best.d) best = { t, d };
  }
  if (!best) return 'Try again.';
  const tp = place(best.t.vec), op = screenOf(o);
  const onScreen = tp && tp.z > 0 && tp.alt > 0 && tp.x > INSET.l && tp.x < W && tp.y > INSET.t && tp.y < H - INSET.b;
  if (onScreen && op) {
    const dx = tp.x - op.x, dy = tp.y - op.y;
    const v = Math.abs(dy) > 16 ? (dy < 0 ? 'up' : 'down') : '', h = Math.abs(dx) > 16 ? (dx > 0 ? 'right' : 'left') : '';
    const way = v && h ? `${v} and to the ${h}` : v ? v : h ? 'to the ' + h : 'right beside it';
    return `The one you want is ${best.d.toFixed(0)}° away — ${handWords(best.d)} ${way}.`;
  }
  const pos = altazVec(best.t.vec, false);
  return `The one you want is off-screen: face ${compassLong(pos.az)}, ${upPhrase(pos.alt)}.`;
}
function judgeClick(o) {
  const ch = S.awaiting; if (!ch) return;
  const v = $('verdict'); if (!v) return;
  let ok = false, what = o ? (o.name || displayName(o)) : null;
  if (!o) { v.hidden = false; v.className = 'verdict no'; v.textContent = 'Nothing there. Click directly on a star.'; return; }
  if (ch.kind === 'planet') ok = o.kind === 'planet';
  else ok = ch.targets.includes(o.id);
  v.hidden = false;
  if (ok) {
    v.className = 'verdict ok'; v.textContent = 'Yes — that is ' + what + '.'; readOut(v.textContent);
    if (ch.kind !== 'planet') { credit(o.id, true); if (ch.credit) credit(ch.credit, true); }
    S.awaiting = null; passQuestion(850);
  } else {
    v.className = 'verdict no';
    v.textContent = 'That is ' + what + '. ' + (ch.kind === 'planet' ? 'Not a planet — planets sit on the gold line and do not twinkle.' : missHint(o, ch.targets));
    readOut(v.textContent);
    if (ch.targets && ch.targets.length === 1) credit(ch.targets[0], false); else if (ch.credit) credit(ch.credit, false);
    S.misses = (S.misses || 0) + 1;
    if (S.misses >= 2 && S.hintLevel < 1) giveHint(S.lesson, ch);
  }
}
function passQuestion(delay) {
  if (S.qPassing) return;
  S.qPassing = true;
  setTimeout(() => {
    S.qPassing = false;
    if (!S.lesson) return;
    if (S.q < checksOf(S.lesson).length - 1) { S.q++; S.hideLabels = false; renderCheck(); }
    else passLesson();
  }, delay || 0);
}
/* Pointing checks ("face south, 4 fists up") watch the view — or your phone, or your head. */
let lookTick = 0;
function currentLook() {
  if (typeof XR !== 'undefined' && XR.active && typeof xrLook === 'function') return xrLook();
  return { az: S.az, alt: S.alt };
}
function evalLookTick() {
  const ch = S.checking;
  if (!S.lesson || !ch || ch.kind !== 'look' || S.qPassing) return;
  const now = performance.now(); if (now - lookTick < 200) return; lookTick = now;
  const v = $('verdict'); if (!v) return;
  const L = currentLook(), dAz = norm180(ch.az - L.az), dAlt = ch.alt - L.alt;
  const okAz = Math.abs(dAz) <= (ch.tolAz || 20), okAlt = Math.abs(dAlt) <= (ch.tolAlt || 12);
  v.hidden = false;
  if (okAz && okAlt) {
    if (!S.lookSince) S.lookSince = now;
    if (now - S.lookSince > 900) {
      v.className = 'verdict ok'; v.textContent = `Yes — that is ${compassLong(L.az)}, ${upPhrase(L.alt)}.`;
      readOut(v.textContent); passQuestion(900);
    } else { v.className = 'verdict ok'; v.textContent = 'That’s it — hold it there…'; }
    return;
  }
  S.lookSince = 0;
  const parts = [];
  if (!okAz) parts.push(`turn ${dAz > 0 ? 'right' : 'left'} about ${Math.round(Math.abs(dAz))}°`);
  if (!okAlt) parts.push(`look ${dAlt > 0 ? 'up' : 'down'} about ${Math.round(Math.abs(dAlt))}°`);
  v.className = 'verdict coach';
  v.textContent = `Now: ${compassLong(L.az)}, ${Math.max(0, Math.round(L.alt))}° up. Next, ${parts.join(' and ')}.`;
}
function passLesson() {
  const L = S.lesson; if (!L) return;
  S.done[L.id] = true; save(); S.lessonDone = true;
  S.awaiting = null; S.checking = null; S.hideLabels = false; S.marks = []; S.lessonRuler = false; S.ladder = null;
  const i = lessonIndex(L.id), next = ALL_LESSONS[i + 1];
  const taught = (L.teaches || []).map(itemName);
  $('pane-course').innerHTML = lessonHeader('done') + `<div id="lessonview">
    <p class="kicker">${L.checkpoint ? 'Checkpoint passed' : 'Lesson complete'}</p>
    <h2>${esc(L.title)}</h2>
    ${L.recap ? `<div class="recap"><p class="seclabel" style="margin-top:4px">What you now know</p><ul>${L.recap.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
    ${taught.length ? `<p class="added">Added to your sky: ${taught.map(n => `<b>${esc(n)}</b>`).join(', ')}</p>` : ''}
    ${L.tonight ? `<div class="mission"><b>Try this tonight</b><span>${esc(L.tonight)}</span></div>` : ''}
    <div class="navrow">
      ${next ? `<button class="btn primary" id="l-next2">${next.checkpoint ? 'Next: ' : 'Next lesson: '}${esc(next.title)} →</button>` : ''}
      <button class="btn" id="l-list">All lessons</button></div>
    ${next ? '' : '<p class="tip">That is the whole pathway. Go outside on the next clear night — you know enough now to find your way around.</p>'}</div>`;
  linkTerms(document.querySelector('#pane-course .recap'));
  const b = $('l-next2'); if (b) b.onclick = () => startLesson(next.id);
  $('l-list').onclick = leaveLesson; $('l-exit').onclick = leaveLesson;
  const spoken = 'Well done. What you now know: ' + (L.recap || []).join(' ') + (L.tonight ? ' Try this tonight: ' + L.tonight : '');
  wireReadButton(() => spoken); readOut(spoken);
}
function clearOverlays() { S.lessonDone = false; S.focusFigs = null; S.asterism = null; S.marks = []; S.hop = null; S.hideLabels = false;
  S.lessonRuler = false; S.ladder = null; if (S.speed === -1) { S.speed = 3600; S.playing = false; $('speed').value = '3600'; syncTimeBtns(); } }
function leaveLesson() { S.lesson = null; S.awaiting = null; clearOverlays(); goHome(); renderCourse(); }
function applySet(set) {
  if (!set) return;
  if (set.stage) doStage(set.stage);
  if (set.layers) Object.assign(S.layers, set.layers);
  if ('limit' in set) { S.limit = set.limit; const el = $('limit'); if (el) { el.value = set.limit; syncLimitLabel(); } }
  S.focusFigs = set.figures || null;
  S.asterism = set.asterism || null;
  S.marks = set.mark ? set.mark.slice() : [];
  S.hop = set.hop || null;
  S.lessonRuler = !!set.ruler;
  S.ladder = set.ladder || null;
  if (set.look) { if (set.look.az != null) S.az = set.look.az; if (set.look.alt != null) S.alt = set.look.alt; if (set.look.fov) S.fov = set.look.fov; }
  if (set.zoom) S.fov = set.zoom;
  if ('speed' in set) {
    S.playing = set.speed !== 0;
    if (set.speed === -1) { S.speed = -1; S.nightAcc = 0; $('speed').value = '-1'; }
    else if (set.speed > 0) { S.speed = nearestSpeed(set.speed); $('speed').value = String(S.speed); }
  }
  syncTimeBtns();
}
function nearestSpeed(v) {
  const opts = [1, 60, 600, 3600, 86400, 2592000];
  return opts.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
}

/* ---------- practice ---------- */
function practicePool() { return learnedItems().filter(id => !id.includes(':') && BY_ID.has(id) && BY_ID.get(id).vec); }
function startDrill() {
  S.lesson = null; clearOverlays();
  S.drill = S.drill || { score: 0, asked: 0, streak: 0, best: 0 };
  nextDrill();
}
function drillWeight(id) {
  const k = S.known[id];
  if (!k || !k.c) return 3;                // never found in practice yet
  if (k.w > k.c) return 4;                 // getting it wrong more than right
  if (k.c < 3) return 2;
  return 1;                                // mastered: still comes up, less often
}
function nextDrill(depth) {
  depth = depth || 0;
  const pool = practicePool();
  if (!pool.length) {
    toast('Practice only uses stars you have been taught — finish Lesson 3 first.');
    S.drill = null; S.awaiting = null; S.hideLabels = false; return renderCourse();
  }
  let usable = pool.filter(id => altazVec(BY_ID.get(id).vec, false).alt > 12);
  if (!usable.length) {
    const any = pool[Math.floor(Math.random() * pool.length)], o = BY_ID.get(any);
    const r = findStage(o.vec, S.place.lat, S.place.lon, S.place.tz, 30);
    if (r) { S.time = r.ms; S.playing = false; syncTimeBtns(); solve(); }
    if (depth > 4) { toast('None of the stars you know are up from here. Try another location.');
      S.drill = null; S.awaiting = null; S.hideLabels = false; return renderCourse(); }
    return nextDrill(depth + 1);
  }
  if (usable.length > 1 && S.lastDrill) usable = usable.filter(id => id !== S.lastDrill);
  const total = usable.reduce((a, id) => a + drillWeight(id), 0);
  let r = Math.random() * total, id = usable[0];
  for (const u of usable) { r -= drillWeight(u); if (r <= 0) { id = u; break; } }
  S.lastDrill = id;
  const o = BY_ID.get(id), pos = altazVec(o.vec, false);
  if (!VR.on) {
    S.az = norm360(pos.az + (Math.random() - .5) * 46);
    S.alt = clamp(pos.alt + (Math.random() - .5) * 26, 5, 75);
    S.fov = 95;
  }
  S.hideLabels = true; S.layers.labels = 'named';
  S.drill.target = { id, name: itemName(id) }; S.awaiting = { kind: 'find', targets: [id], drill: true };
  renderDrill();
}
function renderDrill() {
  const d = S.drill, k = S.known[d.target.id];
  $('pane-course').innerHTML = `
    <div class="lhead"><button class="btn ghost" id="d-exit">← All lessons</button><span class="spacer"></span>
      <span class="lmins">score ${d.score}/${d.asked}${d.best ? ' · best streak ' + d.best : ''}</span></div>
    <div id="lessonview">
      <p class="kicker">Practise what you’ve learned</p>
      <h2>Find ${esc(d.target.name)}</h2>
      <div class="check"><p class="q">Labels are off. Click ${esc(d.target.name)} in the sky.</p>
        <div class="findcue"><span class="pulse"></span>Waiting for your click</div>
        <p class="verdict" id="verdict" hidden></p></div>
      <div class="navrow" style="margin-top:14px">
        <button class="btn" id="d-skip">Skip · show me</button><span class="spacer"></span>
        <span class="lmins">${k && k.c ? `found ${k.c}×` : 'new'} · streak ${d.streak}</span></div></div>`;
  $('d-exit').onclick = () => { S.drill = null; S.awaiting = null; S.hideLabels = false; clearOverlays(); renderCourse(); };
  $('d-skip').onclick = () => {
    S.marks = [d.target.id]; S.hideLabels = false; S.awaiting = null; d.streak = 0;
    credit(d.target.id, false);
    const v = $('verdict'); v.hidden = false; v.className = 'verdict no';
    v.textContent = 'Circled in the sky — that is ' + d.target.name + '.';
    setTimeout(() => { S.marks = []; nextDrill(); }, 2600);
  };
}
/* drill clicks route through judgeClick */
const _judge = judgeClick;
judgeClick = function (o) {
  const ch = S.awaiting;
  if (ch && ch.drill) {
    const d = S.drill, v = $('verdict'); if (!v) return;
    d.asked++;
    v.hidden = false;
    if (o && o.id === ch.targets[0]) {
      d.score++; d.streak++; d.best = Math.max(d.best, d.streak); credit(o.id, true);
      v.className = 'verdict ok'; v.textContent = 'Correct.';
      S.awaiting = null; setTimeout(nextDrill, 800);
    } else {
      d.streak = 0; credit(ch.targets[0], false);
      v.className = 'verdict no';
      v.textContent = o ? 'That is ' + (o.name || displayName(o)) + '. ' + missHint(o, ch.targets) : 'Nothing there — click on a star.';
    }
    return;
  }
  _judge(o);
};


/* =====================  TONIGHT'S TOUR  ===================== */
const PATTERN_OF = {
  'uma-alp':'dipper','cas-alp':'w','peg-alp':'square','and-alp':'square','sgr-sig':'teapot','sgr-eps':'teapot',
  'lyr-alp':'summer','cyg-alp':'cross','aql-alp':'summer','ori-alp':'belt','ori-bet':'belt',
  'cma-alp':'wintertri','cmi-alp':'wintertri','aur-alp':'hexagon','leo-alp':'sickle','cen-alp':'pointers','cen-bet':'pointers',
  'cru-alp':'southerncross','cru-bet':'southerncross'
};
const PATTERN_LINE = {
  dipper: 'It marks the end of the Big Dipper’s bowl — seven stars in a saucepan shape.',
  w: 'It is one of the five stars of the W, Cassiopeia.',
  square: 'It is a corner of the Great Square — a big, surprisingly empty box of four stars.',
  teapot: 'It is part of the Teapot. The Milky Way rises like steam from its spout.',
  summer: 'It is one corner of the Summer Triangle — three bright stars in a huge triangle.',
  cross: 'It is the top of the Northern Cross, which flies straight down the Milky Way.',
  belt: 'Nearby: three stars in a short, straight row — Orion’s Belt. Nothing else looks like it.',
  wintertri: 'It is a corner of the Winter Triangle, with Betelgeuse and Procyon or Sirius.',
  hexagon: 'It is the top corner of the Winter Hexagon, a ring of six bright stars around Orion.',
  sickle: 'It is the dot at the bottom of the Sickle — a backwards question mark.',
  pointers: 'It is one of the two Pointers that lead to the Southern Cross.',
  southerncross: 'It is part of the Southern Cross — small, bright, with a red star on top.'
};
function colourPhrase(bv) {
  return bv < -0.05 ? 'blue-white' : bv < 0.3 ? 'white' : bv < 0.7 ? 'pale yellow' : bv < 1.3 ? 'orange' : 'red-orange';
}
function firstSentence(t) { const i = t.indexOf('. '); return i > 0 ? t.slice(0, i + 1) : t; }
function buildTour() {
  goHome(); S.time = nextDark(S.place, Date.now()); S.playing = false; syncTimeBtns(); solve();
  const stops = [];
  if (S.place.lat > 10) {
    const p = altazVec(BY_ID.get('umi-alp').vec, false);
    stops.push({ title: 'Find north first', az: p.az, alt: p.alt, fov: 100, marks: ['umi-alp'], ladder: 'umi-alp', select: 'umi-alp',
      say: `Face north. Polaris is ${upPhrase(p.alt)}. It is not especially bright — its trick is that it never moves. Everything else tonight turns slowly around it.` });
  } else if (S.place.lat < -10) {
    const c = altazVec(BY_ID.get('cru-alp').vec, false);
    if (c.alt > 8) stops.push({ title: 'Find the Southern Cross', az: c.az, alt: c.alt, fov: 70, asterism: 'southerncross', marks: ['cru-gam'], select: 'cru-alp',
      say: `Face ${compassLong(c.az)}, ${upPhrase(c.alt)}. A small, bright cross with a red star at the top. Its long bar points toward the south celestial pole.` });
  }
  const m = altazVec(SKY.moon.v, true);
  if (m.alt > 5) {
    const ph = moonPhaseName(SKY.elong, SKY.moon.lam, SKY.sun.lam).toLowerCase(), pct = Math.round(SKY.moonIllum * 100);
    stops.push({ title: 'The Moon', az: m.az, alt: m.alt, fov: 45, selectMoon: true,
      say: `Face ${compassLong(m.az)}, ${upPhrase(m.alt)}. A ${ph}, ${pct}% lit. ` + (SKY.moonIllum > 0.6
        ? 'Its glare hides the faint stars, so tonight is for the bright ones.' : SKY.moonIllum < 0.25
        ? 'Hardly any moonlight — a good night for faint stars.' : 'Its light washes out the faintest stars.') });
  }
  for (const q of [...SKY.planets].sort((a, b) => a.mag - b.mag)) {
    if (q.mag > 2.2) continue;
    const pp = altazVec(q.v, false); if (pp.alt < 8) continue;
    stops.push({ title: q.p.n, az: pp.az, alt: pp.alt, fov: 60, marks: ['planet-' + q.p.k], planet: q.p.k,
      say: `Face ${compassLong(pp.az)}, ${upPhrase(pp.alt)}. A steady point that does not twinkle, brighter than the stars around it. ${q.p.note}` });
  }
  const used = new Set();
  const cands = STARS.filter(st => st.name && (st.mag < 1.6 || PATTERN_OF[st.id]))
    .map(st => ({ st, pos: altazVec(st.vec, false) }))
    .filter(c => c.pos.alt > 15 && c.st.mag + extinct(c.pos.alt) < SKY.limit)
    .sort((a, b) => a.st.mag - b.st.mag);
  let nStars = 0;
  for (const c of cands) {
    if (nStars >= 5) break;
    const pat = PATTERN_OF[c.st.id];
    if (pat && used.has(pat)) continue;
    if (!pat && used.has('fig:' + c.st.con)) continue;
    used.add(pat || 'fig:' + c.st.con);
    const con = CON_NAME[c.st.con];
    const how = pat ? PATTERN_LINE[pat] : `It belongs to ${con.name}, ${con.nick.replace(/^The /, 'the ')}.`;
    const note = NOTES[c.st.id] ? ' ' + firstSentence(NOTES[c.st.id]) : '';
    stops.push({ title: c.st.name, az: c.pos.az, alt: c.pos.alt, fov: pat ? 85 : 75, select: c.st.id,
      asterism: pat || null, figures: pat ? null : [c.st.con], marks: [c.st.id],
      say: `Face ${compassLong(c.pos.az)}, ${upPhrase(c.pos.alt)}. A bright ${colourPhrase(c.st.bv)} star. ${how}${note}` });
    nStars++;
  }
  const dsoPick = ['m45', 'm31', 'm42', 'lmc', 'ngc5139', 'm13', 'm7', 'm44', 'dblcl'].map(id => BY_ID.get(id))
    .map(o => ({ o, pos: altazVec(o.vec, false) }))
    .find(d => d.pos.alt > 25 && d.o.mag < SKY.limit - 0.5);
  if (dsoPick) stops.push({ title: dsoPick.o.name, az: dsoPick.pos.az, alt: dsoPick.pos.alt, fov: 40, marks: [dsoPick.o.id], select: dsoPick.o.id, dso: true,
    say: `Face ${compassLong(dsoPick.pos.az)}, ${upPhrase(dsoPick.pos.alt)}. Not a star: ${dsoPick.o.eye.charAt(0).toLowerCase() + dsoPick.o.eye.slice(1)}. It is ${dsoPick.o.dist} away. Look slightly to one side of it — the edge of your eye is more sensitive in the dark.` });
  // Walk the sky in the order that needs the least turning.
  const vec = st => { const a = st.alt * D2R, z = st.az * D2R; return [Math.cos(a) * Math.sin(z), Math.cos(a) * Math.cos(z), Math.sin(a)]; };
  if (stops.length > 2) {
    const ordered = [stops.shift()];
    while (stops.length) {
      const last = vec(ordered[ordered.length - 1]);
      let bi = 0, bd = 9;
      stops.forEach((st, i) => { const d = Math.acos(clamp(dot3(last, vec(st)), -1, 1)); if (d < bd) { bd = d; bi = i; } });
      ordered.push(stops.splice(bi, 1)[0]);
    }
    return ordered;
  }
  return stops;
}
function startTour() {
  S.lesson = null; S.drill = null; S.awaiting = null; clearOverlays();
  const stops = buildTour();
  if (!stops.length) { toast('Nothing bright is well placed tonight from ' + S.place.n + '. Try the course instead.'); return; }
  S.tour = { stops, i: 0, at: S.time };
  renderTour();
}
function renderTour() {
  const T = S.tour, st = T.stops[T.i], last = T.i === T.stops.length - 1;
  S.az = st.az; S.alt = clamp(st.alt, 4, 82); S.fov = st.fov;
  S.marks = st.marks || []; S.asterism = st.asterism || null; S.focusFigs = st.figures || null;
  S.ladder = st.ladder || null; S.hop = null;
  S.layers.dso = S.layers.dso || !!st.dso;
  const pane = $('pane-tonight');
  pane.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <button class="btn ghost" id="t-exit">← Tonight</button><span class="spacer"></span>
      <span class="lmins">stop ${T.i + 1} / ${T.stops.length}</span></div>
    <p class="kicker">Tonight's tour · ${esc(S.place.n)} · ${hhmm(T.at)}</p>
    <h2 class="tourtitle">${esc(st.title)}</h2>
    <div class="bigdir"><span>${esc(compassLong(st.az))}</span><span>${esc(upPhrase(st.alt).replace(' above the horizon', ' up'))}</span></div>
    <div class="stepdots">${T.stops.map((_, i) => `<i class="${i === T.i ? 'on' : i < T.i ? 'past' : ''}"></i>`).join('')}</div>
    <p class="saytext">${esc(st.say)}</p>
    <div class="navrow">
      <button class="btn" id="t-prev" ${T.i === 0 ? 'disabled' : ''}>Back</button>
      ${last ? '<button class="btn primary" id="t-done">Finish</button>' : '<button class="btn primary" id="t-next">Next stop</button>'}
    </div>
    <p class="tip">Doing this outside? Turn on <b>Red mode</b> at the top so your screen doesn’t ruin your dark-adapted eyes.</p>`;
  $('t-exit').onclick = endTour;
  $('t-prev').onclick = () => { if (T.i > 0) { T.i--; renderTour(); } };
  const n = $('t-next'); if (n) n.onclick = () => { T.i++; renderTour(); };
  const d = $('t-done'); if (d) d.onclick = () => { endTour(); toast('Tour done. Tomorrow night the same stars rise 4 minutes earlier.'); };
}
function endTour() { S.tour = null; clearOverlays(); renderTonight(); }

/* =====================  TONIGHT  ===================== */
function darknessWord(sa) {
  if (sa > 0) return 'Daylight — the Sun is up';
  if (sa > -6) return 'Civil twilight — only the very brightest objects show';
  if (sa > -12) return 'Nautical twilight — bright stars appearing';
  if (sa > -18) return 'Astronomical twilight — nearly dark';
  return 'Full darkness';
}
function nightSchedule() {
  const sunFn = t => [sunEq(jdFrom(t)).v, true];
  const r18 = riseSet(sunFn, -18), r0 = riseSet(sunFn, -0.83);
  const rows = [];
  if (r0.set) rows.push(['Sunset', hhmm(r0.set)]);
  if (r18.always) rows.push(['Darkness', `Never fully dark tonight — the Sun only sinks to ${r18.low.toFixed(0)}°`]);
  else if (r18.never) rows.push(['Darkness', 'Dark around the clock — polar night']);
  else {
    if (r18.set) rows.push(['Fully dark', hhmm(r18.set)]);
    if (r18.rise) rows.push(['Dawn begins', hhmm(r18.rise)]);
  }
  if (r0.rise) rows.push(['Sunrise', hhmm(r0.rise)]);
  const mr = riseSet(t => [moonEq(jdFrom(t)).v, true], 0.13);
  if (mr.rise) rows.push(['Moonrise', hhmm(mr.rise)]);
  if (mr.set) rows.push(['Moonset', hhmm(mr.set)]);
  return rows;
}
function moonRiseText() {
  try {
    const r = riseSet(t => [moonEq(jdFrom(t)).v, true], 0.13);
    if (r.rise && r.rise > S.time) return 'rises ' + hhmm(r.rise);
  } catch (e) {}
  return 'below horizon';
}
/* Is the real Moon up this minute? (The page may be showing a different time.) */
function moonUpNow() {
  const keep = S.time; S.time = Date.now(); solve();
  const m = altazVec(SKY.moon.v, true), lit = Math.round(SKY.moonIllum * 100);
  S.time = keep; solve();
  return m.alt > 3 ? { ...m, lit } : null;
}
function renderTonight() {
  if (S.tour) return renderTour();
  if (!SKY) solve();
  const away = S.place.n !== S.home.n || Math.abs(S.time - Date.now()) > 12 * 3600000;
  const lp = localParts(S.time, S.place.tz);
  const clock = String(lp.h).padStart(2, '0') + ':' + String(lp.mi).padStart(2, '0');
  const rows = [];
  for (const q of SKY.planets) {
    const pos = altazVec(q.v, false);
    if (pos.alt < 2) continue;
    if (q.mag > 5.5) continue;
    rows.push({ col: q.p.col, name: q.p.n, sub: 'Planet · mag ' + q.mag.toFixed(1),
      alt: pos.alt, az: pos.az, click: () => { S.az = pos.az; S.alt = clamp(pos.alt, -5, 85); S.fov = 55;
        S.selected = q.obj; showInfo(q.obj); } });
  }
  rows.sort((a, b) => a.alt - b.alt);
  const mpos = altazVec(SKY.moon.v, true);
  const stars = [];
  for (const s of STARS) {
    if (s.mag > 1.9) continue;
    const pos = altazVec(s.vec, false);
    if (pos.alt < 12) continue;
    if (s.mag + extinct(pos.alt) > SKY.limit) continue;
    stars.push({ s, pos });
  }
  stars.sort((a, b) => a.s.mag - b.s.mag);
  const top = stars.slice(0, 9);

  let sched = [];
  try { sched = nightSchedule(); } catch (e) {}
  let h = `${away ? `<div class="banner">Showing ${esc(S.place.n)} on ${esc(new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: S.place.tz }).format(new Date(S.time)))} — not your sky tonight.
      <button class="chip" id="t-home">Back to my sky tonight</button></div>` : ''}
    <button class="vrcard" id="vr-entry">
      <svg viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="11" height="19" rx="2"/><path d="M10 18.5h4"/><path d="M3 8l2 1M21 8l-2 1M12 .5v1"/></svg>
      <span><b>Sky window</b><small>Hold your phone up — it shows the real sky in the direction you point, true north corrected, even through city glow.</small></span>
    </button>
    <div class="tourcard">
      <p class="kicker" style="color:var(--amber)">Start here</p>
      <h3>Tonight’s tour</h3>
      <p>A guided walk around what is genuinely up over ${esc(S.home.n)} tonight — which way to face, how many fists up, and what you are looking at.</p>
      <button class="btn primary" id="t-start">Start the tour</button>
    </div>
    <p class="kicker">What is up right now</p>
    <p class="nowline"><b>${esc(S.place.n)}</b> · ${clock} local · lat ${S.place.lat.toFixed(1)}°<br>
      ${esc(darknessWord(SKY.sunAlt))} · Sun ${SKY.sunAlt.toFixed(0)}°<br>
      Limiting magnitude here: <b>${SKY.limit.toFixed(1)}</b></p>
    ${sched.length ? `<dl class="sched">${sched.map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join('')}</dl>` : ''}`;

  h += `<div class="seclabel">Moon</div>`;
  h += `<button class="orow" data-moon="1">
      <span class="swatch" style="background:#e9e5d8;color:#e9e5d8"></span>
      <span class="oname">The Moon<small>${esc(moonPhaseName(SKY.elong, SKY.moon.lam, SKY.sun.lam))} · ${Math.round(SKY.moonIllum * 100)}% lit</small></span>
      <span class="opos">${mpos.alt > 0 ? dirWord(mpos.az) + ' · ' + mpos.alt.toFixed(0) + '°' : moonRiseText()}</span></button>`;

  h += `<div class="seclabel">Planets</div>`;
  h += rows.length ? `<div class="olist">${rows.map((r, i) => `
      <button class="orow" data-planet="${i}">
        <span class="swatch" style="background:${r.col};color:${r.col}"></span>
        <span class="oname">${esc(r.name)}<small>${esc(r.sub)}</small></span>
        <span class="opos">${dirWord(r.az)} · ${r.alt.toFixed(0)}°</span></button>`).join('')}</div>`
    : `<p class="empty">No planets above the horizon at this moment. Scrub the time forward with the ▶ button — Venus and Mercury only ever show up near dawn or dusk.</p>`;

  h += `<div class="seclabel">Brightest stars up</div>`;
  h += top.length ? `<div class="olist">${top.map(t => {
      const [R, G, B] = t.s.rgb;
      return `<button class="orow" data-star="${t.s.id}">
        <span class="swatch" style="background:rgb(${R},${G},${B});color:rgb(${R},${G},${B})"></span>
        <span class="oname">${esc(t.s.name || displayName(t.s))}<small>${esc(CON_NAME[t.s.con] ? CON_NAME[t.s.con].name : t.s.con)} · mag ${t.s.mag.toFixed(2)}</small></span>
        <span class="opos">${dirWord(t.pos.az)} · ${t.pos.alt.toFixed(0)}°</span></button>`; }).join('')}</div>`
    : `<p class="empty">The sky is too bright right now for any star to show. Wait for the Sun to get more than 6° below the horizon.</p>`;

  const mw = SKY.sunAlt < -15 && SKY.moonIllum < 0.4 && S.limit > 5.4;
  h += `<p class="tip">${mw
    ? 'Dark sky, little moonlight: this is when the Milky Way is visible. Give your eyes 20 minutes away from every screen and phone — dark adaptation is most of the battle.'
    : SKY.moonIllum > 0.6 && mpos.alt > 0
      ? 'A bright Moon is up, which wipes out everything faint. Good night for the Moon itself, lunar craters and the brightest stars — save galaxies for a darker week.'
      : 'Tap any row to swing the view onto it. Everything listed here is genuinely above your horizon at the time shown in the bar below.'}</p>`;

  const pane = $('pane-tonight');
  pane.innerHTML = h;
  $('t-start').onclick = startTour;
  $('vr-entry').onclick = () => enterVR(false);
  const th = $('t-home'); if (th) th.onclick = () => { goHome(); S.time = Date.now(); S.playing = false; syncTimeBtns(); renderTonight(); };
  pane.querySelectorAll('[data-planet]').forEach(b => b.onclick = () => rows[+b.dataset.planet].click());
  pane.querySelectorAll('[data-star]').forEach(b => b.onclick = () => {
    const s = BY_ID.get(b.dataset.star), pos = altazVec(s.vec, false);
    S.az = pos.az; S.alt = clamp(pos.alt, -5, 85); S.fov = 55; S.selected = s; showInfo(s);
  });
  const mb = pane.querySelector('[data-moon]');
  if (mb) mb.onclick = () => {
    const o = { id: 'moon', kind: 'moon', name: 'The Moon' };
    if (mpos.alt > 0) { S.az = mpos.az; S.alt = clamp(mpos.alt, -5, 85); S.fov = 40; }
    S.selected = o; showInfo(o);
  };
}

/* =====================  SKY CONTROLS  ===================== */
const TOGGLES = [
  ['art', 'Constellation art', 'Stellarium’s drawings of the figures'],
  ['atmosphere', 'Atmosphere & daylight', 'Switch off to see the stars that are up in the daytime'],
  ['figures', 'Constellation lines', 'The joined-up stick figures'],
  ['labels', 'Star names', ''],
  ['milkyway', 'Milky Way', ''],
  ['dso', 'Clusters, nebulae, galaxies', ''],
  ['planets', 'Planets', ''],
  ['ecliptic', 'Ecliptic line', 'The path the Sun, Moon and planets follow'],
  ['horizon', 'Horizon and ground', ''],
  ['altgrid', 'Altitude grid', '']
];
function renderSkyPane() {
  const p = S.place;
  $('pane-sky').innerHTML = `
    <p class="kicker">Where you are</p>
    <div class="placecard"><b>${esc(S.home.n)}</b>
      ${S.home.full && S.home.full !== S.home.n ? `<span>${esc(S.home.full.split(', ').slice(1).join(', ') || S.home.full)}</span>` : ''}
      <small>${fmtLL(S.home.lat, S.home.lon)}<br>${esc(S.home.tz)} · ${esc(offsetStr(S.time, S.home.tz))}</small></div>
    <div class="minibtns"><button class="chip on" id="sp-change">Search for a place…</button><button class="chip" id="geo">Use my location</button></div>
    <details class="coords"><summary>Enter exact coordinates</summary>
      <div class="twocol">
        <div class="field"><span>Latitude</span><input type="text" id="lat" value="${S.home.lat.toFixed(3)}" inputmode="decimal"></div>
        <div class="field"><span>Longitude</span><input type="text" id="lon" value="${S.home.lon.toFixed(3)}" inputmode="decimal"></div>
      </div>
      <button class="chip" id="applyll">Use these coordinates</button></details>

    <div class="seclabel">Headset — Meta Quest</div>
    <p class="fine" style="font-size:12px;line-height:1.55;color:var(--ink-dim);margin:0 0 10px">Step inside the sky in virtual reality, or overlay it on the real world in mixed reality — you calibrate north yourself.
      ${typeof XR !== 'undefined' && XR.supportVR ? '<b style="color:var(--good)">This headset is ready.</b>' : 'Open this page in the Quest Browser to use it.'}</p>
    <div class="minibtns"><button class="chip on" id="sp-xr">Headset options…</button></div>

    <div class="seclabel">Sky darkness</div>
    <div class="slider">
      <label for="limit">Faintest star visible <span id="limitval">mag ${S.limit.toFixed(1)}</span></label>
      <input type="range" id="limit" min="3" max="6.5" step="0.1" value="${S.limit}">
      <div class="scale"><span>city centre</span><span>suburb</span><span>dark countryside</span></div>
    </div>

    <div class="seclabel">Show</div>
    <div class="ctlgroup">${TOGGLES.map(([k, label, note]) => `
      <button class="tog" data-tog="${k}" aria-pressed="${k === 'labels' ? S.layers.labels !== 'none' : !!S.layers[k]}">
        <span class="sw"></span><span>${esc(label)}${note ? `<br><small style="color:var(--ink-faint);font-size:10.5px">${esc(note)}</small>` : ''}</span></button>`).join('')}
      <button class="tog" data-tog="twinkle" aria-pressed="${S.twinkle}"><span class="sw"></span><span>Twinkle</span></button>
      <button class="tog" data-tog="ruler" aria-pressed="${S.ruler}"><span class="sw"></span><span>Hand-size scale<br><small style="color:var(--ink-faint);font-size:10.5px">Fist, fingers and thumb at arm’s length</small></span></button>
    </div>

    <div class="seclabel">Name labels</div>
    <div class="minibtns" id="labelmode">
      ${[['none', 'Off'], ['bright', 'Brightest only'], ['named', 'Named stars'], ['all', 'Everything']].map(([v, t]) =>
        `<button class="chip ${S.layers.labels === v ? 'on' : ''}" data-lm="${v}">${t}</button>`).join('')}
    </div>

    <div class="seclabel">Jump to</div>
    <div class="minibtns" id="jump">
      ${['N', 'E', 'S', 'W'].map(d => `<button class="chip" data-az="${{ N: 0, E: 90, S: 180, W: 270 }[d]}">${d}</button>`).join('')}
      <button class="chip" data-zen="1">Zenith</button>
      <button class="chip" data-fov="140">Wide</button>
      <button class="chip" data-fov="60">Normal</button>
      <button class="chip" data-fov="20">Close</button>
    </div>
    <p class="tip">Drag the sky to look around, scroll or pinch to zoom, and click anything to identify it.
      Positions are real: catalogue coordinates precessed to the date shown, with atmospheric refraction and
      extinction near the horizon.</p>
    <div class="seclabel">Credits</div>
    <p class="credits">Constellation illustrations from <a href="https://stellarium.org" target="_blank" rel="noopener">Stellarium</a> (Johan Meuris and the Stellarium team), used under the <a href="https://artlibre.org/licence/lal/en/" target="_blank" rel="noopener">Free Art License 1.3</a>; their placement data is Stellarium’s, CC BY-SA 4.0. Anchor star positions: Hipparcos (ESA). Daylight colours: the Preetham sky model. Places: GeoNames, CC BY 4.0. True north: World Magnetic Model 2025 (NOAA/BGS).</p>`;

  $('sp-change').onclick = openPlace;
  $('sp-xr').onclick = () => openXrChooser();
  $('applyll').onclick = () => {
    const la = parseFloat($('lat').value), lo = parseFloat($('lon').value);
    if (isNaN(la) || isNaN(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) { toast('Latitude must be −90 to 90, longitude −180 to 180.'); return; }
    whenGeo(() => setHome(placeFromCoords(la, lo)));
  };
  $('geo').onclick = useMyLocation;
  $('limit').oninput = e => { S.limit = +e.target.value; syncLimitLabel(); save(); };
  $('pane-sky').querySelectorAll('[data-tog]').forEach(b => b.onclick = () => {
    const k = b.dataset.tog;
    if (k === 'twinkle') S.twinkle = !S.twinkle;
    else if (k === 'ruler') S.ruler = !S.ruler;
    else if (k === 'labels') S.layers.labels = S.layers.labels === 'none' ? 'named' : 'none';
    else S.layers[k] = !S.layers[k];
    renderSkyPane();
  });
  $('labelmode').querySelectorAll('[data-lm]').forEach(b => b.onclick = () => { S.layers.labels = b.dataset.lm; renderSkyPane(); });
  $('jump').querySelectorAll('[data-az]').forEach(b => b.onclick = () => { S.az = +b.dataset.az; S.alt = 30; });
  $('jump').querySelector('[data-zen]').onclick = () => { S.alt = 88; };
  $('jump').querySelectorAll('[data-fov]').forEach(b => b.onclick = () => { S.fov = +b.dataset.fov; });
}
function syncLimitLabel() { const e = $('limitval'); if (e) e.textContent = 'mag ' + S.limit.toFixed(1); }

/* =====================  TIME CONTROLS  ===================== */
function syncTimeBtns() {
  const running = S.playing || S.live;
  $('btn-play').setAttribute('aria-pressed', String(running));
  $('btn-live').setAttribute('aria-pressed', String(!!S.live));
  $('btn-rev').setAttribute('aria-pressed', String(S.dir < 0));
  $('clock-live').hidden = !S.live;
  $('playicon').innerHTML = running
    ? '<rect x="2.5" y="1.5" width="2.6" height="9"/><rect x="6.9" y="1.5" width="2.6" height="9"/>'
    : '<path d="M3 1.5l7 4.5-7 4.5z"/>';
}
$('btn-play').onclick = () => {
  if (S.live) { S.live = false; S.playing = false; toast('Paused. Press LIVE to catch up with the real sky.'); }
  else S.playing = !S.playing;
  syncTimeBtns();
};
function goLive(quiet) {
  goHome();
  S.live = true; S.playing = false; S.dir = 1; S.time = Date.now(); S.liveLast = S.time;
  syncTimeBtns(); syncPlaceChip();
  if (!$('timewrap').hidden) renderTimePop();
  if (quiet) return;
  const sa = sunAltAt(S.time, S.place);
  toast(sa > -6 && S.layers.atmosphere
    ? `Live over ${S.place.n}. It is daylight there, so the Sun hides the stars — switch off “Atmosphere” in the Sky tab to see them anyway.`
    : `Live: the real sky over ${S.place.n}, right now. It turns 15° an hour — a fist and a half.`, 6000);
}
$('btn-live').onclick = () => { if (S.live) { S.live = false; syncTimeBtns(); } else goLive(); };
$('btn-rev').onclick = () => {
  S.dir = -S.dir;
  if (S.live) { S.live = false; S.playing = true; }
  syncTimeBtns();
  toast(S.dir < 0 ? 'Time runs backwards: the sky turns the other way.' : 'Time runs forwards again.', 2600);
};
$('speed').onchange = e => { S.speed = +e.target.value; S.nightAcc = 0;
  if (S.live) { S.live = false; S.playing = true; syncTimeBtns(); }
  if (S.speed === -1) toast('Same clock time, night after night: watch the stars drift west with the seasons.', 5000); };
const stepMs = () => S.speed === -1 ? 7 * 86400000 : S.speed * 1000 * 4;
$('btn-back').onclick = () => { S.time -= stepMs(); };
$('btn-fwd').onclick = () => { S.time += stepMs(); };
$('btn-measure').onclick = () => {
  S.measuring = !S.measuring; S.measure = { a: null, b: null };
  $('btn-measure').setAttribute('aria-pressed', String(S.measuring));
  if (S.measuring) toast('Ruler on. Click two stars to measure the gap — in degrees and in hands.', 4500);
};



/* =====================  TIME PANEL  ===================== */
function offsetStr(ms, tz) {
  const o = tzOffsetMin(ms, tz), sgn = o < 0 ? '−' : '+', a = Math.abs(o);
  return 'UTC' + sgn + Math.floor(a / 60) + (a % 60 ? ':' + String(a % 60).padStart(2, '0') : '');
}
const pad2 = n => String(n).padStart(2, '0');
function hms(ms, tz) { const lp = localParts(ms, tz), sec = Math.floor(((ms % 60000) + 60000) % 60000 / 1000); return pad2(lp.h) + ':' + pad2(lp.mi) + ':' + pad2(sec); }
function sidereal(lstDeg) { const h = lstDeg / 15, H = Math.floor(h), m = Math.floor((h - H) * 60), sec = Math.floor(((h - H) * 60 - m) * 60); return `${H}h ${pad2(m)}m ${pad2(sec)}s`; }
function openTimePop() { closePlace(); closeSearch(); $('timewrap').hidden = false; renderTimePop(); }
function closeTimePop() { $('timewrap').hidden = true; }
function renderTimePop() {
  const lp = localParts(S.time, S.place.tz);
  $('timewrap').innerHTML = `
    <div class="pophead"><b>Time</b><span>${esc(S.place.n)} · ${esc(offsetStr(S.time, S.place.tz))}</span>
      <button class="x" id="tp-x" aria-label="Close">×</button></div>
    ${S.live ? `<div class="livenow"><i></i><span>Live — this is the real sky over ${esc(S.place.n)} right now, moving in step with your clock.</span></div>`
             : `<button class="btn primary livebig" id="tp-live"><i></i>Go live — the real sky right now</button>`}
    <div class="twocol">
      <div class="field"><span>Date</span><input type="date" id="tp-date" value="${lp.y}-${pad2(lp.mo)}-${pad2(lp.d)}" min="1800-01-01" max="2200-12-31"></div>
      <div class="field"><span>Local time</span><input type="time" id="tp-time" value="${pad2(lp.h)}:${pad2(lp.mi)}"></div>
    </div>
    <button class="btn" id="tp-set" style="width:100%">Show the sky at this moment</button>
    <div class="seclabel">Step</div>
    <div class="jumpgrid">${[['-1y', '−1 yr'], ['-1mo', '−1 mo'], ['-1d', '−1 day'], ['-1h', '−1 hr'], ['+1h', '+1 hr'], ['+1d', '+1 day'], ['+1mo', '+1 mo'], ['+1y', '+1 yr']].map(([j, t]) =>
      `<button class="chip" data-jump="${j}">${t}</button>`).join('')}</div>
    <div class="seclabel">Tonight</div>
    <div class="minibtns">${[['sunset', 'Sunset'], ['dark', 'Fully dark'], ['midnight', 'Midnight'], ['dawn', 'Dawn'], ['sunrise', 'Sunrise']].map(([k, t]) =>
      `<button class="chip" data-ev="${k}">${t}</button>`).join('')}</div>
    <dl class="sched" id="tp-read" style="margin-top:14px"></dl>
    <p class="tip" style="margin-top:10px">Pick a speed and press ▶ to run time from here. ◀◀ runs it backwards. Planet positions are most accurate between 1800 and 2050.</p>`;
  fillTimeRead();
  $('tp-x').onclick = closeTimePop;
  const lv = $('tp-live'); if (lv) lv.onclick = () => { goLive(); };
  $('tp-set').onclick = () => {
    const d = $('tp-date').value, t = $('tp-time').value;
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/), n = t.match(/^(\d{2}):(\d{2})/);
    if (!m || !n) { toast('Pick both a date and a time.'); return; }
    S.time = localToMs(+m[1], +m[2], +m[3], +n[1], +n[2], S.place.tz);
    S.live = false; S.playing = false; syncTimeBtns(); renderTimePop();
    toast(`Showing ${S.place.n} at ${n[1]}:${n[2]} on ${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}.`);
  };
  $('timewrap').querySelectorAll('[data-jump]').forEach(b => b.onclick = () => { jumpTime(b.dataset.jump); renderTimePop(); });
  $('timewrap').querySelectorAll('[data-ev]').forEach(b => b.onclick = () => { jumpEvent(b.dataset.ev); renderTimePop(); });
}
function fillTimeRead() {
  const el = $('tp-read'); if (!el || !SKY) return;
  const rows = [['Local', hms(S.time, S.place.tz)], ['UTC', hms(S.time, 'UTC')],
    ['Sidereal time', sidereal(SKY.lst)], ['Julian day', SKY.jd.toFixed(4)]];
  el.innerHTML = rows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('');
}
function jumpTime(code) {
  const m = code.match(/^([+-]\d+)(y|mo|d|h)$/); if (!m) return;
  const n = +m[1], u = m[2];
  if (u === 'h') S.time += n * 3600000;
  else if (u === 'd') S.time += n * 86400000;
  else {
    const lp = localParts(S.time, S.place.tz);
    let y = lp.y + (u === 'y' ? n : 0), mo = lp.mo + (u === 'mo' ? n : 0);
    while (mo > 12) { mo -= 12; y++; } while (mo < 1) { mo += 12; y--; }
    const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    S.time = localToMs(y, mo, Math.min(lp.d, dim), lp.h, lp.mi, S.place.tz);
  }
  S.live = false; syncTimeBtns();
}
function jumpEvent(kind) {
  const sunFn = t => [sunEq(jdFrom(t)).v, true];
  let t = null;
  if (kind === 'midnight') {
    const lp = localParts(S.time, S.place.tz);
    t = localToMs(lp.y, lp.mo, lp.d + (lp.h >= 12 ? 1 : 0), 0, 0, S.place.tz);
  } else {
    const r = riseSet(sunFn, kind === 'sunset' || kind === 'sunrise' ? -0.83 : -18);
    t = kind === 'sunset' || kind === 'dark' ? r.set : r.rise;
    if (t == null) {
      toast(kind === 'dark' || kind === 'dawn'
        ? (r.always ? `It never gets fully dark tonight in ${S.place.n}.` : `It stays dark all day in ${S.place.n} at this time of year.`)
        : (r.always ? `The Sun does not set tonight in ${S.place.n}.` : `The Sun does not rise today in ${S.place.n}.`), 5000);
      return;
    }
  }
  S.time = t; S.live = false; S.playing = false; syncTimeBtns();
}
$('btn-clock').onclick = () => $('timewrap').hidden ? openTimePop() : closeTimePop();

/* =====================  PLACES  ===================== */
let GEOIDX = null, geoWait = [];
function loadGeo() {
  if (window.GEO || loadGeo.busy) return;
  loadGeo.busy = true;
  const sc = document.createElement('script');
  sc.src = 'sky-places.js'; sc.async = true;
  sc.onerror = () => { loadGeo.busy = false; if (!$('placewrap').hidden) renderPlaceResults(); };
  document.head.appendChild(sc);
}
const fold = t => t.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ');
window.onGeoReady = () => {
  GEOIDX = GEO.rows.split('\n').map(r => {
    const f = r.split('|');
    return { n: f[0], k: fold(f[0]), k2: f[1] ? fold(f[1]) : '', c: +f[2], a: +f[3], lat: +f[4], lon: +f[5], pop: +f[6], tz: +f[7] };
  });
  geoWait.splice(0).forEach(fn => fn());
  if (!$('placewrap').hidden) renderPlaceResults();
  // A guessed home ("Detroit (approx.)" or a bare city name) becomes a real place from the gazetteer.
  const h = S.home;
  if (!h.full) {
    let g = null;
    if (/\(approx\.\)$/.test(h.n)) g = GEOIDX.find(x => GEO.tz[x.tz] === h.tz);
    else { const r = mainTownNear(h.lat, h.lon, 25); if (r.km < 40 && fold(r.g.n) === fold(h.n)) g = r.g; }
    if (g) {
      const wasHome = S.place.n === h.n && S.place.lat === h.lat;
      S.home = placeOf(g); if (wasHome) goHome(); save(); syncPlaceChip(); renderSkyPane();
    }
  }
};
function whenGeo(fn) { if (GEOIDX) fn(); else { geoWait.push(fn); loadGeo(); } }
function placeOf(g) {
  const region = GEO.a1[g.a], country = GEO.cc[g.c];
  return { n: g.n, full: [g.n, region && region !== g.n ? region : '', country].filter(Boolean).join(', '),
           lat: g.lat, lon: g.lon, tz: GEO.tz[g.tz] };
}
function nearestCity(lat, lon) {
  let best = null, bd = Infinity; const cl = Math.cos(lat * D2R);
  for (const g of GEOIDX) {
    let dx = g.lon - lon; if (dx > 180) dx -= 360; if (dx < -180) dx += 360;
    const dy = g.lat - lat, d = dy * dy + (dx * cl) * (dx * cl);
    if (d < bd) { bd = d; best = g; }
  }
  return { g: best, km: Math.sqrt(bd) * 111.2 };
}
function mainTownNear(lat, lon, radiusKm) {
  const r = nearestCity(lat, lon);
  if (r.km > radiusKm) return r;
  const cl = Math.cos(lat * D2R), lim = (Math.max(radiusKm, r.km + 4) / 111.2) ** 2;
  for (const g of GEOIDX) {                                  // GEOIDX is sorted largest first
    let dx = g.lon - lon; if (dx > 180) dx -= 360; if (dx < -180) dx += 360;
    const dy = g.lat - lat, d = dy * dy + (dx * cl) * (dx * cl);
    if (d <= lim) return { g, km: Math.sqrt(d) * 111.2 };
  }
  return r;
}
const fmtLL = (la, lo) => `${Math.abs(la).toFixed(2)}°${la < 0 ? 'S' : 'N'} ${Math.abs(lo).toFixed(2)}°${lo < 0 ? 'W' : 'E'}`;
function parseCoords(q) {
  const m = q.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*°?\s*([NSns])?\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([EWew])?$/);
  if (!m) return null;
  let la = +m[1], lo = +m[3];
  if (m[2] && /s/i.test(m[2])) la = -Math.abs(la);
  if (m[4] && /w/i.test(m[4])) lo = -Math.abs(lo);
  return Math.abs(la) <= 90 && Math.abs(lo) <= 180 ? { lat: la, lon: lo } : null;
}
function placeFromCoords(lat, lon, tzOverride) {
  let tz = tzOverride || tzForLon(lat, lon), n = fmtLL(lat, lon), full = n;
  if (GEOIDX) {
    const r = nearestCity(lat, lon), town = mainTownNear(lat, lon, 12);
    if (r.km < 500 && !tzOverride) tz = GEO.tz[r.g.tz];
    if (town.km < 12) { const p = placeOf(town.g); n = p.n; full = p.full; }
    else if (r.km < 500) { n = 'Near ' + r.g.n; full = `${fmtLL(lat, lon)} — ${Math.round(r.km)} km from ${placeOf(r.g).full}`; }
  }
  return { n, full, lat: +lat.toFixed(4), lon: +lon.toFixed(4), tz };
}
function searchPlaces(q) {
  const run = (head, qual) => {
    const out = [];
    for (const g of GEOIDX) {
      let sc;
      if (g.k === head || g.k2 === head) sc = 3;
      else if (g.k.startsWith(head) || g.k2.startsWith(head)) sc = 2;
      else if (head.length >= 3 && (g.k.includes(head) || g.k2.includes(head))) sc = 1;
      else continue;
      if (qual && !fold(GEO.a1[g.a] + ' ' + GEO.cc[g.c] + ' ' + GEO.iso[g.c]).includes(qual)) continue;
      out.push({ g, sc });
      if (out.length > 4000) break;
    }
    return out.sort((a, b) => b.sc - a.sc || b.g.pop - a.g.pop).slice(0, 12).map(x => x.g);
  };
  const f = fold(q.trim()); if (!f) return [];
  const [head, ...rest] = f.split(',').map(x => x.trim());
  let res = run(head, rest.join(' ').trim());
  if (!res.length && head.includes(' ')) {                      // "paris texas", "perth scotland"
    const w = head.split(' ');
    for (let i = w.length - 1; i >= 1 && !res.length; i--) res = run(w.slice(0, i).join(' '), w.slice(i).join(' '));
  }
  return res;
}
let placeHits = [], placeSel = 0;
function openPlace() { closeSearch(); closeTimePop(); loadGeo(); $('placewrap').hidden = false; $('placebox').value = ''; renderPlaceResults(); $('placebox').focus(); }
function closePlace() { $('placewrap').hidden = true; }
function localClock(tz) { try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date()); } catch (e) { return ''; } }
function renderPlaceResults() {
  const q = $('placebox').value, box = $('placeres');
  const co = parseCoords(q);
  placeHits = []; placeSel = 0;
  let h = '';
  if (co) { placeHits.push({ coords: co }); h += `<button data-i="0" class="sel"><span class="pn">Use these coordinates</span><span class="pr">${fmtLL(co.lat, co.lon)}</span><small>exact<br>position</small></button>`; }
  if (!window.GEO) h += `<p class="empty">${loadGeo.busy ? 'Loading 32,580 towns and cities…' : 'The place list did not load. You can still type coordinates, like 48.86, 2.35.'}</p>`;
  else if (!q.trim()) h += `<p class="empty">Type any town or city with more than 15,000 people. Add a region or country to narrow it down: <i>Portland, Maine</i> · <i>Perth, Australia</i>.</p>`;
  else if (GEOIDX && !co) {
    for (const g of searchPlaces(q)) placeHits.push({ g });
    if (!placeHits.length) h += `<p class="empty">No town called “${esc(q)}” in the list. Try the nearest bigger town, or type coordinates like 51.5, -0.12.</p>`;
    h += placeHits.map((x, i) => {
      const p = placeOf(x.g);
      return `<button data-i="${i}" class="${i === 0 ? 'sel' : ''}"><span class="pn">${esc(p.n)}</span>
        <span class="pr">${esc(p.full.split(', ').slice(1).join(', '))}</span>
        <small>${fmtLL(p.lat, p.lon)}<br>${localClock(p.tz)} there</small></button>`;
    }).join('');
  }
  box.innerHTML = h;
  box.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => choosePlace(+b.dataset.i));
}
function choosePlace(i) {
  const x = placeHits[i]; if (!x) return;
  setHome(x.g ? placeOf(x.g) : placeFromCoords(x.coords.lat, x.coords.lon));
}
function setHome(pl) {
  S.home = pl; goHome(); save(); closePlace();
  if (S.tour) { S.tour = null; clearOverlays(); }
  if (S.live) { S.time = Date.now(); S.liveLast = S.time; }
  syncPlaceChip(); renderSkyPane();
  if (S.tab === 'tonight') renderTonight();
  if (!$('timewrap').hidden) renderTimePop();
  const sa = sunAltAt(S.time, S.place);
  toast(`The sky over ${pl.full || pl.n}${S.live ? ', live' : ''} — ${hhmm(S.time)} local time there.` +
    (sa > -6 && S.layers.atmosphere ? ' It is daylight there, so only the Sun and Moon show.' : ''), 5500);
}
function syncPlaceChip() {
  const el = $('placename'); if (!el) return;
  el.textContent = S.place.n;
  $('btn-place').classList.toggle('away', S.place.n !== S.home.n);
  $('btn-place').title = S.place.n !== S.home.n
    ? `A lesson is borrowing the sky over ${S.place.n}. Your home is ${S.home.n}.` : 'Change location — search any town or city';
}
function useMyLocation() {
  if (!navigator.geolocation) { toast('This browser will not share a location. Search for your town instead.'); return; }
  toast('Asking your browser for your location…');
  navigator.geolocation.getCurrentPosition(pos => {
    let tz; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    const { latitude: la, longitude: lo } = pos.coords;
    whenGeo(() => setHome(placeFromCoords(la, lo, tz)));
  }, () => toast('Location not shared. Search for your town instead.'), { timeout: 10000 });
}
$('btn-place').onclick = () => $('placewrap').hidden ? openPlace() : closePlace();
$('pl-x').onclick = closePlace;
$('pl-geo').onclick = useMyLocation;
$('placebox').oninput = renderPlaceResults;
$('placebox').onkeydown = e => {
  if (e.key === 'Escape') { closePlace(); return; }
  if (e.key === 'Enter') { choosePlace(placeSel); return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    placeSel = clamp(placeSel + (e.key === 'ArrowDown' ? 1 : -1), 0, Math.max(0, placeHits.length - 1));
    $('placeres').querySelectorAll('button[data-i]').forEach((b, i) => b.classList.toggle('sel', i === placeSel));
  }
};

/* =====================  SEARCH  ===================== */
let searchSel = 0, searchHits = [];
function openSearch() { closePlace(); closeTimePop(); $('searchwrap').hidden = false; $('searchbox').value = ''; $('results').innerHTML = ''; $('searchbox').focus(); }
function closeSearch() { $('searchwrap').hidden = true; }
$('btn-search').onclick = () => $('searchwrap').hidden ? openSearch() : closeSearch();
$('searchbox').oninput = e => {
  const q = e.target.value.trim().toLowerCase();
  searchHits = []; searchSel = 0;
  if (q.length >= 1) {
    for (const s of STARS) {
      const n = (s.name || '').toLowerCase(), dn = displayName(s).toLowerCase();
      if (n.startsWith(q) || dn.startsWith(q) || (n && n.includes(q)))
        searchHits.push({ o: s, label: s.name || displayName(s), sub: CON_NAME[s.con] ? CON_NAME[s.con].name : s.con });
    }
    for (const d of DSOS) if (d.name.toLowerCase().includes(q) || d.id.toLowerCase().startsWith(q))
      searchHits.push({ o: d, label: d.name, sub: d.dsoKind });
    for (const q2 of (SKY ? SKY.planets : [])) if (q2.p.n.toLowerCase().startsWith(q))
      searchHits.push({ o: q2.obj || { id: 'planet-' + q2.p.k, kind: 'planet', name: q2.p.n, q: q2 }, label: q2.p.n, sub: 'planet' });
    for (const f of FIGURES) if (f.name.toLowerCase().startsWith(q)) {
      const anchor = STARS.filter(s => s.con === f.con).sort((a, b) => a.mag - b.mag)[0];
      if (anchor) searchHits.push({ o: anchor, label: f.name, sub: f.nick, con: f.con });
    }
    searchHits = searchHits.slice(0, 14);
  }
  $('results').innerHTML = searchHits.map((h, i) =>
    `<button data-i="${i}" class="${i === 0 ? 'sel' : ''}">${esc(h.label)}<small>${esc(h.sub || '')}</small></button>`).join('');
  $('results').querySelectorAll('button').forEach(b => b.onclick = () => gotoHit(+b.dataset.i));
};
$('searchbox').onkeydown = e => {
  if (e.key === 'Escape') { closeSearch(); return; }
  if (e.key === 'Enter') { if (searchHits.length) gotoHit(searchSel); return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    searchSel = clamp(searchSel + (e.key === 'ArrowDown' ? 1 : -1), 0, searchHits.length - 1);
    $('results').querySelectorAll('button').forEach((b, i) => b.classList.toggle('sel', i === searchSel));
  }
};
function gotoHit(i) {
  const h = searchHits[i]; if (!h) return;
  closeSearch();
  const vec = h.o.kind === 'planet' ? h.o.q.v : h.o.vec;
  const pos = altazVec(vec, false);
  if (pos.alt < 2) {
    const r = findStage(vec, S.place.lat, S.place.lon, S.place.tz, 28);
    if (r) { S.time = r.ms; S.az = r.az; S.alt = clamp(r.alt, 10, 70); S.playing = false;
      toast(h.label + ' is below the horizon now — jumped to a night when it is well up.'); }
    else { toast(h.label + ' never rises from ' + S.place.n + '.'); return; }
  } else { S.az = pos.az; S.alt = clamp(pos.alt, -5, 85); }
  S.fov = h.con ? 75 : 45;
  if (h.con) { S.focusFigs = [h.con]; S.layers.figures = true; }
  S.selected = h.o; showInfo(h.o);
}

/* =====================  KEYBOARD  ===================== */
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key;
  if (k === '/') { e.preventDefault(); openSearch(); }
  else if (k === ' ') { e.preventDefault(); S.playing = !S.playing; syncTimeBtns(); }
  else if (k === 'Escape' && VR.on) { exitVR(); }
  else if (k === 'Escape') { closeSearch(); closePlace(); closeTimePop(); $('infocard').hidden = true; S.selected = null; S.measure = { a: null, b: null }; }
  else if (k === 'l') { S.live ? null : goLive(); }
  else if (k === 'r') $('btn-measure').click();
  else if (k === 'ArrowLeft') S.az = norm360(S.az - 5);
  else if (k === 'ArrowRight') S.az = norm360(S.az + 5);
  else if (k === 'ArrowUp') S.alt = clamp(S.alt + 4, -25, 89);
  else if (k === 'ArrowDown') S.alt = clamp(S.alt - 4, -25, 89);
  else if (k === '+' || k === '=') S.fov = clamp(S.fov * 0.85, 4, 160);
  else if (k === '-') S.fov = clamp(S.fov * 1.18, 4, 160);
  else if (k === 'n') toggleNight();
});

/* =====================  CHROME  ===================== */
function toggleNight() {
  const on = document.documentElement.getAttribute('data-vision') === 'night';
  document.documentElement.setAttribute('data-vision', on ? '' : 'night');
  $('btn-night').setAttribute('aria-pressed', String(!on));
  if (!on) toast('Red mode on. Real observers use red light — white light wrecks 20 minutes of dark adaptation in a second.');
}
$('btn-night').onclick = toggleNight;
$('btn-rail').onclick = () => { $('rail').classList.toggle('open'); };
addEventListener('resize', () => requestAnimationFrame(measureInsets));

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let lastUI = 0, lastTonight = 0;
function tickUI() {
  const now = performance.now();
  if (now - lastUI < 220) return;
  lastUI = now;
  const lp = localParts(S.time, S.place.tz);
  $('clock-time').textContent = S.live || (S.playing && S.speed <= 60) ? hms(S.time, S.place.tz)
    : String(lp.h).padStart(2, '0') + ':' + String(lp.mi).padStart(2, '0');
  $('clock-date').textContent = `${DAYS[lp.dow]} ${lp.d} ${MONTHS[lp.mo - 1]} ${lp.y}`;
  $('ro-dir').textContent = dirWord(S.az) + ' ' + S.az.toFixed(0) + '°';
  $('ro-alt').textContent = S.alt.toFixed(0) + '°';
  $('ro-fov').textContent = S.fov.toFixed(0) + '°';
  syncPlaceChip();
  evalLookTick();
  if (!$('timewrap').hidden) fillTimeRead();
  if (VR.on && !VR.stereo) {
    const rail = $('rail'), bar = $('vrbar');
    VR.bottom = rail.classList.contains('open') ? rail.getBoundingClientRect().top - 8 : bar.getBoundingClientRect().top - 8;
  }
  if (S.tab === 'tonight' && !S.tour && (S.playing || S.live) && now - lastTonight > (S.live ? 30000 : 2500)) { lastTonight = now; renderTonight(); }
}

/* =====================  BOOT  ===================== */
resize();
solve();
(function firstLook() {
  // Open on a real, useful sky: the user's own location, at the next properly dark hour.
  if (sunAltAt(Date.now(), S.place) < -8) { S.live = true; S.time = Date.now(); S.liveLast = S.time; }
  else { S.live = false; S.time = nextDark(S.place, Date.now()); }
  solve();
  // face the most interesting bright thing that is up
  let best = null;
  for (const s of STARS) {
    if (s.mag > 1.6) continue;
    const p = altazVec(s.vec, false);
    if (p.alt < 18 || p.alt > 72) continue;
    if (!best || s.mag < best.mag) best = { mag: s.mag, az: p.az, alt: p.alt };
  }
  if (best) { S.az = best.az; S.alt = clamp(best.alt, 18, 55); }
  else { S.az = 180; S.alt = 40; }
  S.fov = 95;
})();
renderCourse();
renderSkyPane();
syncTimeBtns();
setTab('course');
booted = true;
if (window.innerWidth > 820) $('rail').classList.add('open');
requestAnimationFrame(frame);
setTimeout(() => toast(S.live
  ? `Live: the real sky over ${S.place.n}, right now. Not your town? Click the place name at the top.`
  : daylightOpening(), S.live ? 7500 : 11000), 900);
function daylightOpening() {
  let msg = `It is daylight in ${S.place.n}, so this is tonight at ${hhmm(S.time)}.`;
  const now = moonUpNow();
  if (now) {
    const shown = altazVec(SKY.moon.v, true);
    msg += ` The real Moon is up right now — ${compassLong(now.az)}, ${upPhrase(now.alt)}, ${now.lit}% lit`;
    msg += shown.alt < 0 ? ` (tonight it ${moonRiseText().replace('below horizon', 'is below the horizon at this hour')}).` : '.';
    msg += ' Press LIVE to see it.';
  } else msg += ' Press LIVE for the real sky this minute.';
  return msg;
}
setTimeout(loadGeo, 1200);

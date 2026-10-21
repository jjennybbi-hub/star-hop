'use strict';
/* ===========================================================================
   Sky Window & headset view.
   The phone becomes a window onto the real sky: its compass and gyroscope point the view
   exactly where the phone points, corrected from magnetic to true north with the World
   Magnetic Model. Everything in the course works by pointing instead of clicking.
   =========================================================================== */

Object.assign(VR, {
  sensing: false, source: 'none', raw: null, iosOff: null, iosReject: 0, absSeen: false,
  decl: 0, useDecl: true, calib: 0, compassAcc: null, evtCount: 0, lastEvt: 0,
  f: null, u: null, r: null, lastWrote: null, desired: null,
  hover: null, hoverT0: 0, fired: null, voice: true, saved: null, wake: null, autoAtm: false,
  calibrating: null, cards: null, cardsFor: null, top: 0, enteredAt: 0, stereoAt: 0, figName: ''
});
try {
  const c = JSON.parse(localStorage.getItem('starhop.vr') || '{}');
  if (typeof c.calib === 'number') VR.calib = c.calib;
  if (typeof c.useDecl === 'boolean') VR.useDecl = c.useDecl;
  if (typeof c.voice === 'boolean') VR.voice = c.voice;
} catch (e) {}
function vrSave() { try { localStorage.setItem('starhop.vr', JSON.stringify({ calib: VR.calib, useDecl: VR.useDecl, voice: VR.voice })); } catch (e) {} }

const DWELL_MS = 1100;
const norm180 = d => ((d % 360) + 540) % 360 - 180;
const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const len3 = a => Math.hypot(a[0], a[1], a[2]) || 1e-9;
const unit3 = a => { const l = len3(a); return [a[0] / l, a[1] / l, a[2] / l]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const stripHtml = t => String(t).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------- true north ---------- */
function decimalYear(ms) {
  const y = new Date(ms).getUTCFullYear(), a = Date.UTC(y, 0, 1), b = Date.UTC(y + 1, 0, 1);
  return y + (ms - a) / (b - a);
}
function updateDecl() {
  try { VR.decl = wmmField(S.home.lat, S.home.lon, 0, clamp(decimalYear(Date.now()), 2025, 2029.99)).decl; }
  catch (e) { VR.decl = 0; }
}

/* ---------- sensors ---------- */
function onOrient(e) {
  if (e.beta == null || e.gamma == null) return;
  const isAbs = e.type === 'deviceorientationabsolute' || e.absolute === true;
  if (isAbs) VR.absSeen = true;
  else if (VR.absSeen) return;                           // Android fires both; keep the compass-referenced one
  let alpha;
  if (isAbs && e.alpha != null) { alpha = e.alpha; VR.source = 'compass'; }
  else if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0 && e.alpha != null) {
    // iOS: the gyroscope's alpha is smooth but has an arbitrary zero; the compass heading is absolute
    // but noisy. Track the offset between them slowly — a complementary filter.
    const off = norm360(e.webkitCompassHeading + e.alpha);
    if (VR.iosOff == null) VR.iosOff = off;
    else {
      const d = norm180(off - VR.iosOff);
      if (Math.abs(d) < 40) { VR.iosOff = norm360(VR.iosOff + d * 0.035); VR.iosReject = 0; }
      else if (++VR.iosReject > 40) { VR.iosOff = off; VR.iosReject = 0; }
    }
    alpha = norm360(e.alpha - VR.iosOff);
    VR.source = 'compass';
    VR.compassAcc = typeof e.webkitCompassAccuracy === 'number' ? e.webkitCompassAccuracy : null;
  } else if (e.alpha != null) { alpha = e.alpha; VR.source = 'gyro'; }
  else return;
  VR.raw = { alpha, beta: e.beta, gamma: e.gamma };
  VR.lastEvt = performance.now(); VR.evtCount++;
  if (!VR.helpShown && !VR.stereo) { VR.helpShown = true; showVrHelp(); }
}
function screenAngle() {
  const a = screen.orientation && typeof screen.orientation.angle === 'number' ? screen.orientation.angle
          : typeof window.orientation === 'number' ? window.orientation : 0;
  return a * D2R;
}
/* W3C DeviceOrientation: R = Rz(alpha)·Rx(beta)·Ry(gamma) maps the phone's axes into East-North-Up. */
function basisFromRaw() {
  const yaw = (VR.source === 'compass' && VR.useDecl ? VR.decl : 0) + VR.calib;
  const a = (VR.raw.alpha - yaw) * D2R, b = VR.raw.beta * D2R, g = VR.raw.gamma * D2R;
  const cA = Math.cos(a), sA = Math.sin(a), cB = Math.cos(b), sB = Math.sin(b), cG = Math.cos(g), sG = Math.sin(g);
  const right = [cA * cG - sA * sB * sG, cG * sA + cA * sB * sG, -cB * sG];
  const up = [-cB * sA, cA * cB, sB];
  const fwd = [-(cG * sA * sB + cA * sG), -(sA * sG - cA * cG * sB), -(cB * cG)];   // out of the back of the phone
  const t = screenAngle(), c = Math.cos(t), s = Math.sin(t);
  return { f: fwd, u: [c * up[0] + s * right[0], c * up[1] + s * right[1], c * up[2] + s * right[2]] };
}

/* ---------- per frame: follow the phone ---------- */
function vrBeforeFrame() {
  if (VR.sensing && VR.raw) {
    const t = basisFromRaw();
    if (!VR.f) { VR.f = t.f; VR.u = t.u; }
    else {
      // Heavier smoothing when nearly still (kills sensor jitter), light when moving (no lag).
      const moved = Math.acos(clamp(dot3(VR.f, t.f), -1, 1)) * R2D;
      const k = moved < 0.35 ? 0.09 : moved < 2.5 ? 0.26 : 0.6;
      VR.f = unit3(lerp3(VR.f, t.f, k));
      const u = lerp3(VR.u, t.u, k), d = dot3(u, VR.f);
      VR.u = unit3([u[0] - d * VR.f[0], u[1] - d * VR.f[1], u[2] - d * VR.f[2]]);
    }
    VR.r = cross3(VR.f, VR.u);
    VR.C = [VR.r, VR.u, VR.f];
    // A lesson or the tour that tries to point the camera is really saying "look over there":
    // keep that as a guidance target instead of fighting the user's own hands.
    if (VR.lastWrote && (Math.abs(S.az - VR.lastWrote.az) > 0.01 || Math.abs(S.alt - VR.lastWrote.alt) > 0.01))
      VR.desired = { az: S.az, alt: S.alt, t: performance.now() };
    S.az = norm360(Math.atan2(VR.f[0], VR.f[1]) * R2D);
    S.alt = Math.asin(clamp(VR.f[2], -1, 1)) * R2D;
    VR.lastWrote = { az: S.az, alt: S.alt };
  } else VR.C = null;
}

/* ---------- what the crosshair is on ---------- */
const FIG_STARS = (() => { const m = new Map(); for (const f of FIGURES) for (const [a, b] of f.lines) { m.set(a, f); m.set(b, f); } return m; })();
function vrHoverPick() {
  const R = Math.max(20, angPx(2.4));
  let best = null, bd = R;
  const test = (o, p) => { if (!p) return; const d = Math.hypot(p.x - CX, p.y - CY); if (d < bd) { bd = d; best = o; } };
  if (VR.cards) VR.cards.forEach((c, i) => { if (c.p) test({ id: 'card-' + i, kind: 'card', i }, c.p); });
  if (best) return best;
  for (const s of STARS) if (s._p) test(s, s._p);
  if (S.layers.dso) for (const o of DSOS) if (o._p) test(o, o._p);
  if (S.layers.planets) for (const q of SKY.planets) if (q._p) test(q.obj, q._p);
  if (SKY.moonScreen) test({ id: 'moon', kind: 'moon', name: 'The Moon' }, SKY.moonScreen);
  if (SKY.sunScreen) test({ id: 'sun', kind: 'sun', name: 'The Sun' }, SKY.sunScreen);
  return best;
}
function figureUnderCrosshair() {
  const f = SKY.C[2];                                        // forward, in East-North-Up
  let best = null, bd = Math.cos(13 * D2R);
  for (const s of STARS) {
    if (!FIG_STARS.has(s.id)) continue;
    const e = apply3(SKY.enuStar, s.vec), d = e[0] * f[0] + e[1] * f[1] + e[2] * f[2];
    if (d > bd) { bd = d; best = s; }
  }
  return best ? FIG_STARS.get(best.id) : null;
}
function describe(o) {
  if (!o) return { name: '', sub: '' };
  if (o.kind === 'star') {
    const con = CON_NAME[o.con];
    return { name: o.name || displayName(o), sub: `${con ? con.name : ''} · ${tempWord(o.bv).split(' ·')[0].toLowerCase()} · ${o.dist} light years` };
  }
  if (o.kind === 'dso') return { name: o.name, sub: `${o.dsoKind === 'galaxy' ? 'galaxy' : o.dsoKind === 'nebula' ? 'nebula' : 'star cluster'} · ${o.dist}` };
  if (o.kind === 'planet') return { name: o.q.p.n, sub: 'planet · does not twinkle' };
  if (o.kind === 'moon') return { name: 'The Moon', sub: moonPhaseName(SKY.elong, SKY.moon.lam, SKY.sun.lam).toLowerCase() + ', ' + Math.round(SKY.moonIllum * 100) + '% lit' };
  if (o.kind === 'sun') return { name: 'The Sun', sub: 'never look at it directly' };
  return { name: '', sub: '' };
}
function spokenFact(o) {
  const d = describe(o);
  let t = d.name + '.';
  if (o.kind === 'star') {
    const con = CON_NAME[o.con];
    if (con) t += ` In ${con.name}, ${con.nick.replace(/^The /, 'the ')}.`;
    if (NOTES[o.id]) t += ' ' + firstSentence(NOTES[o.id]);
  } else if (o.kind === 'planet') t += ' A planet. ' + o.q.p.note;
  else if (o.kind === 'dso') t += ' ' + o.eye + '.';
  else if (o.kind === 'moon') t += ' ' + d.sub + '.';
  else if (o.kind === 'sun') t += ' Never look at it directly.';
  return t;
}

/* ---------- selecting by pointing ---------- */
function vrSelect(o) {
  if (!o) return;
  try { navigator.vibrate && navigator.vibrate(25); } catch (e) {}
  if (o.kind === 'card') { chooseCard(o.i); return; }
  if (S.awaiting) { judgeClick(o); return; }
  S.selected = o;
  if (!VR.stereo) { showInfo(o); clearTimeout(VR.infoT); VR.infoT = setTimeout(() => { if (VR.on) $('infocard').hidden = true; }, 9000); }
  vrSpeak(spokenFact(o));
}
function vrSpeak(text) {
  if (!VR.on || !VR.voice || !window.speechSynthesis || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(stripHtml(text));
    u.rate = 1; u.pitch = 1; u.lang = 'en';
    setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) {} }, 60);   // Chrome drops speech queued right after cancel
  } catch (e) {}
}

/* ---------- guidance: where to turn ---------- */
function objFromId(id) {
  if (!id) return null;
  if (id.startsWith('planet-')) { const q = SKY.planets.find(z => 'planet-' + z.p.k === id); return q ? q.obj || { id, kind: 'planet', name: q.p.n, q } : null; }
  return BY_ID.get(id) || null;
}
function guideTarget() {
  if (S.awaiting && !S.marks.length) return null;                 // a test: no arrows to the answer
  let o = null, label = '';
  if (S.tour) {
    const st = S.tour.stops[S.tour.i];
    if (st.selectMoon) o = { id: 'moon', kind: 'moon', name: 'The Moon' };
    else if (st.planet) o = objFromId('planet-' + st.planet);
    else if (st.select) o = objFromId(st.select);
    if (!o) return { enu: azAltVec(st.az, st.alt), label: st.title };
  }
  if (!o && S.marks.length) o = objFromId(S.marks[0]);
  if (!o && S.hop) o = objFromId(S.hop.chain[S.hop.chain.length - 1]);
  if (!o && S.asterism && AST_BY_ID[S.asterism]) o = objFromId(AST_BY_ID[S.asterism].stars[0]);
  if (!o && S.focusFigs && S.focusFigs.length) o = STARS.filter(s => s.con === S.focusFigs[0]).sort((a, b) => a.mag - b.mag)[0] || null;
  if (!o && VR.desired && (S.lesson || S.drill) && performance.now() - VR.desired.t < 300000)
    return { enu: azAltVec(VR.desired.az, VR.desired.alt), label: 'this part of the sky' };
  if (!o) return null;
  if (o.kind === 'planet' && !o.q) return null;
  label = describe(o).name;
  return { enu: enuOf(o), label, obj: o };
}
function azAltVec(az, alt) { const a = alt * D2R, z = az * D2R; return [Math.cos(a) * Math.sin(z), Math.cos(a) * Math.cos(z), Math.sin(a)]; }

/* ---------- HUD ---------- */
function hudText(t, x, y, font, color, align, shadow) {
  ctx.font = font; ctx.textAlign = align || 'center'; ctx.fillStyle = color;
  if (shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,.95)'; ctx.shadowBlur = 5; }
  ctx.fillText(t, x, y); ctx.shadowBlur = 0; ctx.textAlign = 'left';
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function wrapLines(text, maxW, font, maxLines) {
  ctx.font = font; const words = String(text).split(' '), lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'; }
  return lines;
}
function drawTape() {
  const heading = S.az, w = Math.min(W * 0.86, 440), h = 32, x0 = CX - w / 2, y = VR.top + 10, span = 100;
  const unsteady = S.alt > 80 || S.alt < -80;
  ctx.fillStyle = 'rgba(4,6,13,.62)'; roundRect(x0, y, w, h, 4); ctx.fill();
  ctx.save(); roundRect(x0, y, w, h, 4); ctx.clip();
  for (let d = Math.floor((heading - span / 2) / 5) * 5; d <= heading + span / 2 + 5; d += 5) {
    const x = CX + (d - heading) / span * w, nd = norm360(d);
    const major = nd % 45 === 0, mid = nd % 15 === 0;
    ctx.strokeStyle = major ? 'rgba(231,236,248,.9)' : 'rgba(155,167,196,.55)'; ctx.lineWidth = major ? 1.5 : 1;
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + h - (major ? 10 : mid ? 7 : 4)); ctx.stroke();
    if (major) {
      const lab = COMPASS[Math.round(nd / 22.5) % 16];
      hudText(lab, x, y + 15, `600 ${lab.length === 1 ? 14 : 11.5}px Montserrat,sans-serif`,
        lab === 'N' ? '#ff7a5c' : 'rgba(236,241,252,.95)', 'center', false);
    } else if (mid) hudText(String(nd), x, y + 13, '400 9px Montserrat,sans-serif', 'rgba(155,167,196,.75)', 'center', false);
  }
  ctx.restore();
  ctx.fillStyle = '#f4b942'; ctx.beginPath(); ctx.moveTo(CX - 6, y + h + 7); ctx.lineTo(CX + 6, y + h + 7); ctx.lineTo(CX, y + h + 1); ctx.fill();
  const lab = unsteady ? (S.alt > 0 ? 'looking straight up' : 'looking straight down')
    : `facing ${compassLong(heading)} · ${Math.round(heading)}°`;
  hudText(lab, CX, y + h + 21, '500 11px Montserrat,sans-serif', unsteady ? 'rgba(155,167,196,.8)' : '#f4b942');
}
function drawStatus() {
  const y = VR.top + 76, bits = [];
  const away = S.place.n !== S.home.n || !S.live;
  if (S.live && S.place.n === S.home.n) bits.push(['● LIVE', '#ff7a5c']);
  else {
    const lp = localParts(S.time, S.place.tz);
    bits.push([`${S.place.n === S.home.n ? '' : S.place.n + ' · '}${lp.d} ${MONTHS[lp.mo - 1]} ${lp.y} ${pad2(lp.h)}:${pad2(lp.mi)} — not the live sky`, '#f4b942']);
  }
  if (!VR.sensing) bits.push(['drag to look around', 'rgba(155,167,196,.9)']);
  else if (VR.source === 'gyro') bits.push(['no compass: calibrate on a real star', '#f0883e']);
  else if (VR.compassAcc != null && (VR.compassAcc < 0 || VR.compassAcc > 25)) bits.push(['compass unsteady — wave the phone in a figure-8', '#f0883e']);
  else if (!VR.stereo) bits.push([`true north ✓`, 'rgba(94,211,155,.95)']);
  if (!S.layers.atmosphere) bits.push(['daylight hidden', 'rgba(155,167,196,.9)']);
  void away;
  ctx.font = '500 10.5px Montserrat,sans-serif';
  const sep = '   ', total = bits.reduce((a, b, i) => a + ctx.measureText(b[0] + (i ? sep : '')).width, 0);
  let x = CX - total / 2;
  for (let i = 0; i < bits.length; i++) {
    const t = (i ? sep : '') + bits[i][0];
    hudText(t, x, y, '500 10.5px Montserrat,sans-serif', bits[i][1], 'left');
    x += ctx.measureText(t).width;
  }
}
function drawReticle(hov, prog) {
  const r = 22;
  ctx.strokeStyle = 'rgba(236,241,252,.85)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(CX, CY, r, 0, TAU); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CX - r - 9, CY); ctx.lineTo(CX - r + 4, CY); ctx.moveTo(CX + r - 4, CY); ctx.lineTo(CX + r + 9, CY);
  ctx.moveTo(CX, CY - r - 9); ctx.lineTo(CX, CY - r + 4); ctx.moveTo(CX, CY + r - 4); ctx.lineTo(CX, CY + r + 9);
  ctx.stroke();
  if (hov && prog > 0) {
    ctx.strokeStyle = '#f4b942'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(CX, CY, r + 5, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, prog)); ctx.stroke();
  }
  // what you are pointing at
  let y = CY + r + 30;
  if (hov && hov.kind !== 'card') {
    const d = describe(hov), secret = S.hideLabels;
    hudText(secret ? '?' : d.name, CX, y, '600 15px Montserrat,sans-serif', '#fff');
    if (!secret) hudText(d.sub, CX, y + 17, '400 11.5px Montserrat,sans-serif', 'rgba(200,210,232,.9)');
    y += 38;
  }
  const alt = S.alt;
  if (alt > -85 && alt < 85)
    hudText(`${Math.round(alt)}° up · ${alt > 2 ? handWords(alt) : 'horizon'}`, CX, CY - r - 16, '400 10.5px Montserrat,sans-serif', 'rgba(200,210,232,.75)');
  if (VR.figName && !S.hideLabels) hudText(VR.figName, CX, y, 'italic 500 12.5px Montserrat,sans-serif', 'rgba(244,185,66,.95)');
}
function drawFigureHighlight(fig) {
  if (!fig || S.hideLabels) { VR.figName = ''; return; }
  VR.figName = `${fig.name} — ${fig.nick.replace(/^The /, 'the ')}`;
  ctx.strokeStyle = 'rgba(244,205,120,.62)'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const [a, b] of fig.lines) {
    const A = BY_ID.get(a)._p || place(BY_ID.get(a).vec), B = BY_ID.get(b)._p || place(BY_ID.get(b).vec);
    if (!A || !B) continue;
    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
  }
  ctx.stroke();
}
function drawGuide() {
  const g = guideTarget(); if (!g) return;
  const e = g.enu, alt = Math.asin(clamp(e[2], -1, 1)) * R2D, az = norm360(Math.atan2(e[0], e[1]) * R2D);
  const cam = apply3(SKY.C, refract(e)), p = proj(cam), m = 46;
  const t = (Math.sin(tClock * 3) + 1) / 2;
  const topY = VR.stereo ? m : VR.top + 104, botY = VR.stereo ? H - m : (VR.bottom || H - 62) - 14;
  if (p && p.x > m && p.x < W - m && p.y > topY && p.y < botY) {
    const on = Math.hypot(p.x - CX, p.y - CY) < 34;
    const s = 26 + 5 * t;
    ctx.strokeStyle = on ? 'rgba(94,211,155,.95)' : `rgba(244,185,66,${0.6 + 0.4 * t})`; ctx.lineWidth = 2;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath(); ctx.moveTo(p.x + sx * s, p.y + sy * (s - 9)); ctx.lineTo(p.x + sx * s, p.y + sy * s); ctx.lineTo(p.x + sx * (s - 9), p.y + sy * s); ctx.stroke();
    }
    if (!on && g.label) hudText(g.label, p.x, p.y - s - 8, '500 12px Montserrat,sans-serif', '#f4b942');
    return;
  }
  // off-screen: an arrow at the edge, pointing the way to turn
  let dx = cam[0], dy = -cam[1];
  if (Math.hypot(dx, dy) < 1e-4) { dx = 0; dy = 1; }
  const L = Math.hypot(dx, dy); dx /= L; dy /= L;
  const hw = W / 2 - m, hh = dy < 0 ? CY - topY : botY - CY;
  const k = Math.max(20, Math.min(hw / Math.max(1e-6, Math.abs(dx)), Math.max(20, hh) / Math.max(1e-6, Math.abs(dy))));
  const ax = CX + dx * k, ay = CY + dy * k, ang = Math.atan2(dy, dx);
  ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
  ctx.fillStyle = `rgba(244,185,66,${0.65 + 0.35 * t})`;
  ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -13); ctx.lineTo(-4, 0); ctx.lineTo(-10, 13); ctx.closePath(); ctx.fill();
  ctx.restore();
  // words: relative first ("turn right"), then absolute ("south-west, 2 fists up")
  const dAz = norm180(az - S.az), dAlt = alt - S.alt, parts = [];
  if (alt < -1) parts.push(`below the horizon — under the ground to the ${compassLong(az)}`);
  else {
    if (Math.abs(dAz) > 8 && S.alt < 80) parts.push(`turn ${dAz > 0 ? 'right' : 'left'} ${Math.round(Math.abs(dAz))}°`);
    if (Math.abs(dAlt) > 8) parts.push(`look ${dAlt > 0 ? 'up' : 'down'} ${Math.round(Math.abs(dAlt))}°`);
  }
  const line1 = parts.length ? parts.join(', ').replace(/^./, c => c.toUpperCase()) : 'Nearly there';
  const line2 = alt > -1 ? `${g.label ? g.label + ': ' : ''}${compassLong(az)}, ${upPhrase(alt)}` : (g.label || '');
  // Below the crosshair if there is room above the lesson sheet, otherwise above it.
  let y = VR.stereo ? CY - 96 : CY + 104;
  if (!VR.stereo && y + 30 > botY) y = CY - 96;
  ctx.font = '600 13.5px Montserrat,sans-serif';
  const w = Math.min(W - 24, Math.max(ctx.measureText(line1).width, (ctx.font = '400 11.5px Montserrat,sans-serif', ctx.measureText(line2).width)) + 24);
  ctx.fillStyle = 'rgba(9,13,24,.78)'; roundRect(CX - w / 2, y - 17, w, 44, 4); ctx.fill();
  hudText(line1, CX, y, '600 13.5px Montserrat,sans-serif', '#f4b942', 'center', false);
  hudText(line2, CX, y + 17, '400 11.5px Montserrat,sans-serif', 'rgba(220,228,244,.9)', 'center', false);
}

/* ---------- answer cards floating in the sky (headset view, where there is no touch screen) ---------- */
function ensureCards() {
  const ch = S.checking;
  if (!(VR.stereo && ch && ch.kind === 'choice')) { VR.cards = null; VR.cardsFor = null; return; }
  if (VR.cardsFor === ch) return;
  VR.cardsFor = ch;
  const baseAz = S.az, baseAlt = clamp(S.alt - 14, 5, 55), n = ch.options.length;
  VR.cards = ch.options.map((o, i) => ({ text: o.text, ok: !!o.ok, az: baseAz + (i - (n - 1) / 2) * 24, alt: baseAlt, state: '' }));
}
function drawCards() {
  if (!VR.cards) return;
  for (const c of VR.cards) {
    const p = proj(apply3(SKY.C, azAltVec(c.az, c.alt)));
    c.p = p; if (!p) continue;
    const lines = wrapLines(c.text, 120, '500 12px Montserrat,sans-serif', 3), h = 16 + lines.length * 15;
    ctx.fillStyle = c.state === 'wrong' ? 'rgba(224,103,74,.3)' : c.state === 'right' ? 'rgba(94,211,155,.3)' : 'rgba(9,13,24,.86)';
    roundRect(p.x - 70, p.y - h / 2, 140, h, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(244,185,66,.6)'; ctx.lineWidth = 1; ctx.stroke();
    lines.forEach((l, i) => hudText(l, p.x, p.y - h / 2 + 20 + i * 15, '500 12px Montserrat,sans-serif', '#fff', 'center', false));
  }
}
function chooseCard(i) {
  const c = VR.cards && VR.cards[i]; if (!c) return;
  c.state = c.ok ? 'right' : 'wrong';
  const btn = document.querySelectorAll('#pane-course .opt')[i];
  if (btn) btn.click();
  vrSpeak(c.ok ? 'Correct.' : 'Not quite. Try another.');
}

/* ---------- headset view: the words live inside the picture ---------- */
function stereoText() {
  const verdict = $('verdict'), vt = verdict && !verdict.hidden ? verdict.textContent : '';
  if (S.tour) { const st = S.tour.stops[S.tour.i]; return { title: st.title, body: st.say, foot: S.tour.i < S.tour.stops.length - 1 ? 'Tap for the next stop' : 'Tap to finish' }; }
  if (S.drill && S.drill.target) return { title: 'Find ' + S.drill.target.name, body: 'Point at it and hold still.', foot: vt || 'Tap to be shown' };
  if (S.lesson && S.lessonDone) {
    const rc = document.querySelectorAll('#pane-course .recap li');
    return { title: 'Lesson complete', body: rc.length ? [...rc].map(li => li.textContent).join(' ') : 'Well done.', foot: $('l-next2') ? 'Tap for the next lesson' : 'Tap for the list of lessons' };
  }
  if (S.lesson && S.checking) {
    const ch = S.checking;
    if (ch.kind === 'look') return { title: 'Your turn', body: ch.ask, foot: vt || 'Turn and tilt until you are there' };
    return { title: 'Your turn', body: ch.ask + (ch.kind === 'choice' ? ' Look at an answer and hold still.' : ' Point at it and hold still.'),
             foot: vt || (ch.kind === 'choice' ? '' : 'Tap to be shown') };
  }
  if (S.lesson) {
    const st = S.lesson.steps[S.step];
    return { title: S.lesson.title, body: stripHtml(fillSay(st.sayVR || st.say)), foot: S.step < S.lesson.steps.length - 1 ? 'Tap for next' : 'Tap to try it yourself' };
  }
  if (performance.now() - VR.stereoAt < 9000)
    return { title: 'Headset view', body: 'Look at any star and hold still to hear its name. Tap the headset button to start the tour.', foot: 'Press and hold the screen to leave' };
  return null;
}
function drawStereoPanel() {
  const t = stereoText(); if (!t) return;
  const w = Math.min(W * 0.78, 330), x = CX - w / 2;
  const body = wrapLines(t.body, w - 22, '400 12px Montserrat,sans-serif', 5);
  const h = 30 + body.length * 15 + (t.foot ? 20 : 4);
  const y = H - h - 18;
  ctx.fillStyle = 'rgba(9,13,24,.84)'; roundRect(x, y, w, h, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(244,185,66,.35)'; ctx.lineWidth = 1; ctx.stroke();
  hudText(t.title, x + 11, y + 19, '500 14px Montserrat,sans-serif', '#fff', 'left', false);
  body.forEach((l, i) => hudText(l, x + 11, y + 37 + i * 15, '400 12px Montserrat,sans-serif', 'rgba(220,228,244,.95)', 'left', false));
  if (t.foot) hudText(t.foot, x + 11, y + h - 9, '500 10.5px Montserrat,sans-serif', '#f4b942', 'left', false);
}

function vrHud() {
  const hov = vrHoverPick(), now = performance.now();
  VR.hoverObj = hov && hov.kind !== 'card' ? hov : null;
  let prog = 0;
  if (hov && VR.hover && hov.id === VR.hover.id) {
    prog = (now - VR.hoverT0) / DWELL_MS;
    if (prog >= 1 && VR.fired !== hov.id) { VR.fired = hov.id; vrSelect(hov); }
  } else { VR.hover = hov; VR.hoverT0 = now; VR.fired = null; }
  if (VR.fired === (hov && hov.id)) prog = 1;
  drawFigureHighlight(figureUnderCrosshair());
  ensureCards(); drawCards();
  drawGuide();
  drawReticle(hov, prog);
  drawTape();
  if (!VR.stereo) drawStatus();
  else {
    drawStereoPanel();
    if (H > W * 1.9) hudText('Turn your phone sideways', CX, CY - 80, '600 16px Montserrat,sans-serif', '#f4b942');
  }
}

/* ---------- entering and leaving ---------- */
/* Phones have a compass; a page shown inside another page (an embed, a viewer) is often not allowed to read it. */
const EMBEDDED = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
const IS_PHONE = (() => {
  try { if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return true; } catch (e) {}
  try { return matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 900; } catch (e) { return false; }
})();
function policyBlocked() {
  try {
    const fp = document.permissionsPolicy || document.featurePolicy;
    return !!(fp && fp.allowsFeature && (!fp.allowsFeature('accelerometer') || !fp.allowsFeature('gyroscope')));
  } catch (e) { return false; }
}
function unlockSpeech() {
  try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(''); speechSynthesis.speak(u); } } catch (e) {}
}
async function requestWake() { try { if (navigator.wakeLock) VR.wake = await navigator.wakeLock.request('screen'); } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (VR.on && document.visibilityState === 'visible') requestWake(); });

function enterVR(stereo) {
  // iOS only grants motion access from inside the tap itself, so ask before anything else.
  let permP = null;
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    try { permP = DeviceOrientationEvent.requestPermission(); } catch (e) { permP = Promise.reject(e); }
  }
  unlockSpeech();
  if (!VR.on) {
    VR.saved = { limit: S.limit, atm: S.layers.atmosphere, fov: S.fov };
    VR.on = true; VR.enteredAt = performance.now();
    VR.f = null; VR.u = null; VR.raw = null; VR.iosOff = null; VR.absSeen = false; VR.evtCount = 0;
    VR.helpShown = false; VR.noSensorReason = null;
    document.body.classList.add('vr');
    closeSearch(); closePlace(); closeTimePop(); $('infocard').hidden = true;
    $('rail').classList.remove('open');
    VR.top = parseFloat(getComputedStyle(document.documentElement).paddingTop) || 0;
    updateDecl();
    if (!S.lesson && !S.tour && !S.drill) goLive(true);
    // A teaching tool for places where you cannot see the stars: show them anyway.
    if (S.limit < 5.8) S.limit = 6.0;
    if (sunAltAt(S.time, S.place) > -8 && S.layers.atmosphere) { S.layers.atmosphere = false; VR.autoAtm = true; }
    measureInsets();
  }
  setStereo(!!stereo, true);
  const start = () => {
    VR.sensing = true;
    addEventListener('deviceorientationabsolute', onOrient);
    addEventListener('deviceorientation', onOrient);
    setTimeout(() => { if (VR.on && VR.sensing && VR.evtCount === 0) noSensors(policyBlocked() ? 'policy' : 'none'); }, 1800);
  };
  if (permP) permP.then(r => r === 'granted' ? start() : noSensors('denied')).catch(() => noSensors('blocked'));
  else if (typeof DeviceOrientationEvent === 'undefined') noSensors('none');
  else start();
  requestWake();
  syncVrBar();
}
function noSensors(reason) {
  VR.sensing = false; VR.C = null; VR.source = 'drag';
  removeEventListener('deviceorientationabsolute', onOrient); removeEventListener('deviceorientation', onOrient);
  VR.noSensorReason = reason;
  if (!VR.stereo) { VR.helpShown = true; showVrHelp(); }
}
function exitVR() {
  if (!VR.on) return;
  removeEventListener('deviceorientationabsolute', onOrient); removeEventListener('deviceorientation', onOrient);
  stopCamera();
  VR.on = false; VR.sensing = false; VR.C = null; VR.cards = null;
  if (VR.stereo) setStereo(false, true);
  document.body.classList.remove('vr', 'stereo');
  if (VR.saved) { S.limit = VR.saved.limit; S.fov = VR.saved.fov; if (VR.autoAtm) S.layers.atmosphere = VR.saved.atm; }
  VR.autoAtm = false;
  try { VR.wake && VR.wake.release(); } catch (e) {} VR.wake = null;
  try { speechSynthesis.cancel(); } catch (e) {}
  $('vrpanel').hidden = true; $('infocard').hidden = true;
  measureInsets(); renderSkyPane();
  if (window.innerWidth > 820) $('rail').classList.add('open');
}
function setStereo(on, quiet) {
  if (on && VR.camera) stopCamera();
  VR.stereo = on;
  document.body.classList.toggle('stereo', on);
  VR.fov = on ? 88 : 72;
  VR.cards = null; VR.cardsFor = null;
  if (on) {
    VR.stereoAt = performance.now();
    $('vrpanel').hidden = true; $('rail').classList.remove('open'); $('infocard').hidden = true;
    const el = document.documentElement;
    try { const p = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen && el.webkitRequestFullscreen(); p && p.catch && p.catch(() => {}); } catch (e) {}
    try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
    if (!quiet) vrSpeak('Headset view. Look at a star and hold still to hear its name.');
  } else {
    try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) {}
    try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch (e) {}
  }
  syncVrBar();
}
function stereoTap() {
  const click = id => { const b = $(id); if (b) { b.click(); return true; } return false; };
  if (S.tour) { click('t-next') || click('t-done'); return; }
  if (S.drill) { click('d-skip'); return; }
  if (S.lesson && S.lessonDone) { click('l-next2') || click('l-list'); return; }
  if (S.lesson && !S.checking) { click('l-next') || click('l-check'); return; }
  if (S.lesson && S.checking) { click('l-show'); return; }
  if (VR.hoverObj) { vrSelect(VR.hoverObj); return; }
  setTab('tonight'); startTour();
}

/* ---------- panels (window mode only) ---------- */
function sensorReasonText(r) {
  if (EMBEDDED && (IS_PHONE || r !== 'none'))
    return 'Your phone has a compass, but this copy of Star Hop is running inside another page — the Claude viewer — which does not pass the phone’s motion sensors through. Open Star Hop from its own web address and the sky will follow your phone.';
  if (r === 'denied') return 'Motion access was turned down. Reload the page, tap Sky window again, and choose “Allow” when your phone asks.';
  if (r === 'blocked' || r === 'policy') return 'Your browser is not letting this page read the motion sensors. Check its settings for motion or orientation access.';
  if (IS_PHONE) return 'Your phone’s browser is not sending any motion readings. Check that motion and orientation access is switched on in its settings, then try again.';
  return 'This device has no compass or motion sensors — it looks like a computer. Open Star Hop on a phone to point it at the sky.';
}
function showVrHelp() {
  const r = VR.noSensorReason, p = $('vrpanel');
  const where = S.home.full || S.home.n;
  let sensorLine;
  if (!r) sensorLine = `<p class="vrok">Compass and gyroscope on. True north for ${esc(S.home.n)} is ${Math.abs(VR.decl).toFixed(1)}° ${VR.decl >= 0 ? 'east' : 'west'} of magnetic north — corrected automatically (World Magnetic Model 2025).</p>`;
  else sensorLine = `<p class="vrwarn">${sensorReasonText(r)}</p>
    <p class="fine" style="margin-top:0">Until then, drag to look around — lessons, the tour and pointing all work the same way.</p>`;
  p.innerHTML = `<div class="pophead"><b>${r ? 'Sky window — drag mode' : 'Hold your phone up to the sky'}</b><button class="x" id="vh-x" aria-label="Close">×</button></div>
    ${r ? '' : `<p>Hold it like a window in front of you. Turn around, tilt it up: the screen shows the real sky in exactly that direction over ${esc(where)}, right now — stars your city lights hide included.</p>`}
    <p>Put the crosshair on any star and <b>hold still</b> for a second: it tells you what it is${VR.voice ? ', out loud' : ''}. Constellations light up as you sweep across them.</p>
    ${sensorLine}
    <div class="navrow" style="flex-wrap:wrap;margin-top:12px">
      <button class="btn primary" id="vh-go">Start looking</button>
      <button class="btn" id="vh-course">Take a lesson</button>
      <button class="btn" id="vh-tour">Tonight's tour</button>
    </div>
    ${r ? '' : '<p class="fine">Steel, magnets and speakers upset phone compasses. If the sky looks rotated against something you can really see — the Moon, a bright planet — use <b>Calibrate</b>.</p>'}`;
  p.hidden = false;
  $('vh-x').onclick = $('vh-go').onclick = () => { p.hidden = true; };
  $('vh-course').onclick = () => { p.hidden = true; openSheet('course'); };
  $('vh-tour').onclick = () => { p.hidden = true; openSheet('tonight'); startTour(); };
}
function openCalib() {
  const p = $('vrpanel');
  const cands = [];
  const m = altazVec(SKY.moon.v, true);
  if (m.alt > 3 && m.alt < 72) cands.push({ o: { id: 'moon', kind: 'moon', name: 'The Moon' }, pos: m, name: 'The Moon' });
  for (const q of SKY.planets) { if (q.mag > 1.2) continue; const pp = altazVec(q.v, false); if (pp.alt > 5 && pp.alt < 72) cands.push({ o: q.obj || { id: 'planet-' + q.p.k, kind: 'planet', name: q.p.n, q }, pos: pp, name: q.p.n }); }
  for (const s of STARS) { if (s.mag > 1.3) continue; const pp = altazVec(s.vec, false); if (pp.alt > 8 && pp.alt < 72) cands.push({ o: s, pos: pp, name: s.name }); }
  cands.sort((a, b) => (a.o.kind === 'moon' ? -9 : a.o.mag || a.o.q && a.o.q.mag || 0) - (b.o.kind === 'moon' ? -9 : b.o.mag || b.o.q && b.o.q.mag || 0));
  const list = cands.slice(0, 7);
  p.innerHTML = `<div class="pophead"><b>Calibrate on something real</b><button class="x" id="vc-x" aria-label="Close">×</button></div>
    <p>Pick something you can actually see in the sky right now. You will line it up with the crosshair, and Star Hop will turn its whole sky to match.</p>
    ${S.live ? '' : '<p class="vrwarn">Go LIVE first — calibration only makes sense against tonight’s real sky.</p>'}
    <div class="olist">${list.length ? list.map((c, i) => `<button class="orow" data-c="${i}"><span class="swatch" style="background:#f4b942;color:#f4b942"></span>
      <span class="oname">${esc(c.name)}<small>${esc(compassLong(c.pos.az))}, ${esc(upPhrase(c.pos.alt))}</small></span><span class="opos">${Math.round(c.pos.az)}°</span></button>`).join('')
      : '<p class="empty">Nothing bright enough is well placed right now.</p>'}</div>
    <div class="seclabel">Or face a direction you know</div>
    <p class="fine" style="margin-top:0">Stand facing a direction you are sure of — a street you know runs north, the side the Sun set on is west — hold the phone upright in front of you and tap it.</p>
    <div class="jumpgrid" id="vc-dirs">${[['North', 0], ['East', 90], ['South', 180], ['West', 270]].map(([n, a]) =>
      `<button class="chip" data-a="${a}">I face ${n}</button>`).join('')}</div>
    <div class="minibtns" style="margin-top:12px">
      <button class="chip" id="vc-reset">Reset calibration${VR.calib ? ` (${VR.calib > 0 ? '+' : ''}${VR.calib.toFixed(1)}°)` : ''}</button>
      <button class="chip ${VR.useDecl ? 'on' : ''}" id="vc-decl">True-north correction ${VR.useDecl ? 'on' : 'off'} (${VR.decl > 0 ? '+' : ''}${VR.decl.toFixed(1)}°)</button>
    </div>
    <p class="fine">Never point at or look toward the Sun.</p>`;
  p.hidden = false;
  $('vc-x').onclick = () => { p.hidden = true; };
  $('vc-reset').onclick = () => { VR.calib = 0; vrSave(); openCalib(); toast('Calibration cleared.'); };
  p.querySelectorAll('#vc-dirs [data-a]').forEach(b => b.onclick = () => {
    const delta = norm180(+b.dataset.a - S.az);
    VR.calib = norm180(VR.calib + delta); vrSave(); p.hidden = true;
    toast(`Calibrated: facing ${compassLong(+b.dataset.a)}. Adjusted by ${Math.abs(delta).toFixed(1)}°.`);
    vrSpeak('Calibrated.');
  });
  $('vc-decl').onclick = () => { VR.useDecl = !VR.useDecl; vrSave(); openCalib(); };
  p.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
    const c = list[+b.dataset.c];
    VR.calibrating = c.o;
    p.innerHTML = `<div class="pophead"><b>Line up ${esc(c.name)}</b><button class="x" id="vc-x2" aria-label="Close">×</button></div>
      <p>Hold the phone up so the real ${esc(c.name)} sits right in the crosshair — look past the phone at the sky to line it up. Then tap <b>Lock</b>.</p>
      <div class="navrow"><button class="btn primary" id="vc-lock">Lock</button><button class="btn" id="vc-cancel">Cancel</button></div>`;
    $('vc-x2').onclick = $('vc-cancel').onclick = () => { VR.calibrating = null; p.hidden = true; };
    $('vc-lock').onclick = () => {
      const e = enuOf(c.o), trueAz = norm360(Math.atan2(e[0], e[1]) * R2D);
      const delta = norm180(trueAz - S.az);
      VR.calib = norm180(VR.calib + delta); VR.calibrating = null; vrSave();
      p.hidden = true;
      toast(`Calibrated. Your compass was off by ${Math.abs(delta).toFixed(1)}°.`);
      vrSpeak('Calibrated.');
    };
  });
}
function openSheet(tab) {
  if (VR.stereo) return;
  setTab(tab || 'course');
  $('rail').classList.add('open');
  $('vrpanel').hidden = true;
}
function syncVrBar() {
  const v = $('vr-voice'); if (v) v.setAttribute('aria-pressed', String(VR.voice));
  const st = $('vr-stereo'); if (st) st.setAttribute('aria-pressed', String(VR.stereo));
  const cm = $('vr-cam'); if (cm) cm.setAttribute('aria-pressed', String(!!VR.camera));
}

/* ---------- camera: the real sky, live, with the stars drawn where they really are ---------- */
Object.assign(VR, { camera: false, camStream: null, camFovLong: 66 });
try { const c = JSON.parse(localStorage.getItem('starhop.cam') || '{}'); if (c.fovLong) VR.camFovLong = c.fovLong; } catch (e) {}
function camReason(name) {
  if (EMBEDDED) return 'This copy of Star Hop is running inside another page — the Claude viewer — which does not let it use your camera. Open Star Hop from its own web address and Camera will work.';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Camera access was turned down. Allow the camera for this site in your browser’s settings, then tap Camera again.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device.';
  if (name === 'NotReadableError') return 'Another app is using the camera. Close it and tap Camera again.';
  return 'The camera could not start on this device.';
}
/* Match the drawing to the camera's real field of view (about 66° across the long side for most phones). */
function camGeometry() {
  const v = $('camfeed'); if (!v || !v.videoWidth) return null;
  const vw = v.videoWidth, vh = v.videoHeight, scale = Math.max(innerWidth / vw, innerHeight / vh);
  const minPx = Math.min(innerWidth, innerHeight) / scale, f = (Math.max(vw, vh) / 2) / Math.tan(VR.camFovLong * D2R / 2);
  return { minPx, f, long: Math.max(vw, vh) };
}
function matchCameraFov() { const g = camGeometry(); if (g) VR.fov = 2 * Math.atan((g.minPx / 2) / g.f) * R2D; }
function rememberCameraFov() {
  const g = camGeometry(); if (!g) return;
  const f = (g.minPx / 2) / Math.tan(VR.fov * D2R / 2);
  VR.camFovLong = clamp(2 * Math.atan((g.long / 2) / f) * R2D, 30, 120);
  try { localStorage.setItem('starhop.cam', JSON.stringify({ fovLong: VR.camFovLong })); } catch (e) {}
}
function setCamera(on) {
  if (!on) { stopCamera(); return; }
  if (VR.stereo) setStereo(false, true);
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast(camReason('none'), 8000); return; }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
    .then(st => {
      VR.camStream = st; VR.camera = true;
      const v = $('camfeed'); v.srcObject = st; v.hidden = false;
      v.onloadedmetadata = () => { matchCameraFov(); v.play().catch(() => {}); };
      document.body.classList.add('camera'); syncVrBar();
      toast('Camera on: the stars are drawn where they really are. If they sit a little off, pinch until a real star or the Moon lines up.', 7000);
      vrSpeak('Camera on.');
    })
    .catch(e => { toast(camReason(e && e.name), 9000); syncVrBar(); });
}
function stopCamera() {
  if (VR.camera) rememberCameraFov();
  if (VR.camStream) VR.camStream.getTracks().forEach(t => t.stop());
  VR.camStream = null; VR.camera = false;
  const v = $('camfeed'); if (v) { v.srcObject = null; v.hidden = true; }
  document.body.classList.remove('camera');
  if (VR.on && !VR.stereo) VR.fov = 72;
  syncVrBar();
}
addEventListener('resize', () => { if (VR.camera) setTimeout(matchCameraFov, 250); });

/* ---------- on a phone, invite it straight away ---------- */
(function phoneInvite() {
  if (!IS_PHONE || typeof DeviceOrientationEvent === 'undefined') return;
  try { if (sessionStorage.getItem('starhop.invite') === 'no') return; } catch (e) {}
  const b = document.createElement('div');
  b.id = 'phoneinvite';
  b.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10.5 18.5h3"/><path d="M3.5 7.5l2 1.2M20.5 7.5l-2 1.2M12 0.6v1.2"/></svg>
    <span><b>Point your phone at the sky</b><small>The screen follows your phone — real north, south, east and west, true north corrected.</small></span>
    <button class="btn primary" id="pi-go">Start</button><button class="x" id="pi-x" aria-label="Not now">×</button>`;
  document.getElementById('app').appendChild(b);
  const hide = () => { b.remove(); try { sessionStorage.setItem('starhop.invite', 'no'); } catch (e) {} };
  $('pi-go').onclick = () => { hide(); enterVR(false); };          // the tap itself is what lets iPhones ask for motion access
  $('pi-x').onclick = hide;
})();

/* ---------- wiring ---------- */
$('btn-vr').onclick = () => enterVR(false);
$('vr-exit').onclick = exitVR;
$('vr-lessons').onclick = () => { const r = $('rail'); if (r.classList.contains('open') && S.tab === 'course') r.classList.remove('open'); else openSheet('course'); };
$('vr-tour').onclick = () => { openSheet('tonight'); startTour(); };
$('vr-cal').onclick = () => { $('rail').classList.remove('open'); openCalib(); };
$('vr-stereo').onclick = () => setStereo(!VR.stereo);
$('vr-cam').onclick = () => setCamera(!VR.camera);
$('vr-voice').onclick = () => { VR.voice = !VR.voice; vrSave(); syncVrBar(); if (VR.voice) vrSpeak('Voice on.'); else try { speechSynthesis.cancel(); } catch (e) {} };
$('vr-night').onclick = toggleNight;
const vrCard = $('vr-entry'); if (vrCard) vrCard.onclick = () => enterVR(false);

/* ---------- the course, spoken and pointed ---------- */
(function teachHooks() {
  const speakPane = sel => { const el = document.querySelector(sel); if (el) vrSpeak(el.textContent); };
  const _renderLesson = renderLesson;
  renderLesson = function () {
    S.checking = null; VR.cards = null; VR.cardsFor = null;
    _renderLesson.apply(this, arguments);
    if (VR.on && S.lesson) {
      const st = S.lesson.steps[S.step];
      if (st.sayVR) { const el = document.querySelector('#pane-course .saytext'); if (el) el.innerHTML = fillSay(st.sayVR); }
      speakPane('#pane-course .saytext');
      if (!VR.stereo) $('rail').classList.add('open');
    }
  };
  const _renderCheck = renderCheck;
  renderCheck = function () {
    _renderCheck.apply(this, arguments);
    S.checking = currentCheck();
    if (VR.on) {
      const cue = document.querySelector('#pane-course .findcue');
      if (cue && S.checking && S.checking.kind !== 'look' && S.checking.kind !== 'choice') cue.innerHTML = '<span class="pulse"></span>Point the crosshair at it and hold still';
      vrSpeak(S.checking ? S.checking.ask : '');
    }
  };
  const _passLesson = passLesson;
  passLesson = function () {
    S.checking = null; VR.cards = null; VR.cardsFor = null;
    _passLesson.apply(this, arguments);
    if (VR.on) vrSpeak('Well done. Lesson complete.');
  };
  const _leave = leaveLesson;
  leaveLesson = function () { S.checking = null; VR.cards = null; _leave.apply(this, arguments); };
  const _judge = judgeClick;
  judgeClick = function () {
    _judge.apply(this, arguments);
    if (VR.on) { const v = $('verdict'); if (v && !v.hidden) vrSpeak(v.textContent); }
  };
  const _renderTour = renderTour;
  renderTour = function () {
    _renderTour.apply(this, arguments);
    if (VR.on && S.tour) {
      const st = S.tour.stops[S.tour.i];
      vrSpeak(st.title + '. ' + st.say);
      if (!VR.stereo) $('rail').classList.add('open');
    }
  };
  const _renderDrill = renderDrill;
  renderDrill = function () {
    _renderDrill.apply(this, arguments);
    if (VR.on && S.drill && S.drill.target) {
      const cue = document.querySelector('#pane-course .findcue');
      if (cue) cue.innerHTML = '<span class="pulse"></span>Point the crosshair at it and hold still';
      vrSpeak('Find ' + S.drill.target.name + '.');
    }
  };
})();

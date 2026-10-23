'use strict';
/* ===========================================================================
   Headset mode — Meta Quest and other WebXR headsets.
   Virtual reality draws the whole night around you. Mixed reality draws only the stars, lines
   and names over the headset's camera view, so the real world stays in full view and each
   drawn star sits on the real one, even when it is too faint or clouded to see.
   Headsets carry no compass, so the player shows it where north is; where the headset can
   pin that to the room, it is remembered for next time.
   =========================================================================== */

const XR = {
  active: false, preview: false, session: null, mode: 'vr', refSpace: null,
  supportVR: false, supportAR: false, blocked: null, headsetUA: false,
  theta: 0, calibHow: null, calibPending: null, calibObj: null, calibNote: '', calibChanged: false,
  samples: [], tuned: false, drag: null, still: null, anchor: null, wantAnchor: false, restoring: false, anchorSaved: false,
  screen: 'calib', labels: true, lines: true, art: true, voice: true, below: false, boost: 1.45, mrLimit: 4.8,
  info: null, hoverBtn: null, dirty: true, lastT: 0, lastPanel: 0, lastPlanets: 0, lastSpoken: '',
  needPanel: true, primary: 'right', gazeId: null, gazeT0: 0, saved: null, figKey: '', focusKey: ''
};
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const R_SKY = 100;
let threeP = null, R3 = null, SC = null, CAM = null;
const G = {};                                               // scene objects

function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (!threeP) threeP = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = THREE_URL; s.async = true;
    s.onload = () => res(window.THREE);
    s.onerror = () => { threeP = null; rej(new Error('The 3D engine could not load.')); };
    document.head.appendChild(s);
  });
  return threeP;
}
function fontsReady() {
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.all(['700 40px Montserrat', '600 40px Montserrat', '500 30px Montserrat', '400 30px Montserrat', '500 30px "IBM Plex Mono"']
    .map(f => document.fonts.load(f).catch(() => {}))).then(() => {});
}

/* ---------- what this device can do ---------- */
async function xrDetect() {
  XR.headsetUA = /OculusBrowser|Quest|Pico|Wolvic|VisionOS|Vision Pro/i.test(navigator.userAgent || '');
  if (navigator.xr) {
    try { XR.supportVR = await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) { XR.blocked = e && e.name || 'error'; }
    try { XR.supportAR = await navigator.xr.isSessionSupported('immersive-ar'); } catch (e) {}
    try {
      const fp = document.permissionsPolicy || document.featurePolicy;
      if (fp && fp.allowsFeature && !fp.allowsFeature('xr-spatial-tracking')) XR.blocked = 'policy';
    } catch (e) {}
  }
  const b = $('btn-xr');
  if (b) b.hidden = !(XR.supportVR || XR.headsetUA);
  if (XR.headsetUA && $('btn-vr')) $('btn-vr').hidden = true;     // "Sky window" is for phones; in a headset, use Headset
  if (XR.supportVR) loadThree().catch(() => {});        // ready before the tap, so the session starts instantly
  if (S.tab === 'sky') renderSkyPane();
}

/* ---------- chooser (the ordinary page) ---------- */
function openXrChooser() {
  closeSearch(); closePlace(); closeTimePop();
  const p = $('xrpanel'), can = XR.supportVR || XR.supportAR;
  const blockedMsg = (XR.blocked === 'policy' || (XR.headsetUA && navigator.xr))
    ? 'This headset can do VR, but this page is embedded somewhere that is not allowed to start it. Open Star Hop from its own web address and these buttons will work.'
    : 'No VR headset found here. Open this page in the Meta Quest Browser — or another WebXR browser — to step inside.';
  p.innerHTML = `<div class="pophead"><b>Headset</b><button class="x" id="xp-x" aria-label="Close">×</button></div>
    ${can ? `<p>Step inside the sky. Your headset does not know where north is, so first you will show it: face a direction you know, or — in mixed reality — look at the real Moon. It remembers for next time in the same spot.</p>` : `<p class="vrwarn">${blockedMsg}</p>`}
    <div class="xrmodes">
      <button class="xrmode" id="xp-vr" ${XR.supportVR ? '' : 'disabled'}><b>Virtual reality</b>
        <span>The whole night sky around you, ground below your feet. Learn anywhere, any time of day.</span></button>
      <button class="xrmode" id="xp-ar" ${XR.supportAR ? '' : 'disabled'}><b>Mixed reality</b>
        <span>Only the stars, lines and names, drawn on top of the real sky through the headset’s cameras — the rest of the world stays in view. Go outside or face a window.</span></button>
    </div>
    <button class="btn" id="xp-preview" style="width:100%;margin-top:12px">Preview the headset view on this screen</button>
    <p class="fine">In the headset: point a controller and pull the trigger to pick a star or press a button. Squeeze the grip to bring the menu to you. Hand tracking works too — pinch to select.</p>`;
  p.hidden = false;
  $('xp-x').onclick = () => { p.hidden = true; };
  $('xp-vr').onclick = () => enterXR('vr');
  $('xp-ar').onclick = () => enterXR('ar');
  $('xp-preview').onclick = () => { p.hidden = true; startPreview(); };
}

/* ---------- starting and stopping ---------- */
function enterXR(mode) {
  if (!navigator.xr) return;
  let sp;
  // Must be requested inside the tap itself.
  try { sp = navigator.xr.requestSession(mode === 'ar' ? 'immersive-ar' : 'immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking', 'anchors'] }); }
  catch (e) { toast('The headset would not start: ' + (e.message || e)); return; }
  $('xrpanel').hidden = true;
  Promise.all([sp, loadThree(), fontsReady()])
    .then(([session]) => startSession(session, mode))
    .catch(e => toast('The headset would not start: ' + (e && e.message || e), 6000));
}
function beginCommon(mode) {
  XR.mode = mode; XR.active = true;
  XR.saved = { atm: S.layers.atmosphere };
  S.layers.atmosphere = false;                  // a teaching sky: show the stars even by day
  if (!S.lesson && !S.tour && !S.drill) goLive(true);
  XR.theta = 0; XR.calibHow = null; XR.calibPending = null; XR.calibObj = null; XR.calibNote = ''; XR.calibChanged = false;
  XR.samples = []; XR.tuned = false; XR.drag = null; XR.still = null;
  XR.anchor = null; XR.wantAnchor = false; XR.restoring = false; XR.anchorSaved = false;
  XR.art = mode !== 'ar';                       // mixed reality starts with just stars and lines; the drawings are a tap away
  XR.screen = 'calib'; XR.info = null; XR.needPanel = true; XR.dirty = true; XR.lastT = 0; XR.lastSpoken = '';
  buildScene();
  applyMode();
  $('infocard').hidden = true;
}
async function startSession(session, mode) {
  XR.session = session; XR.preview = false;
  beginCommon(mode);
  R3.xr.setReferenceSpaceType('local');
  await R3.xr.setSession(session);
  XR.refSpace = R3.xr.getReferenceSpace();
  XR.refSpace.addEventListener('reset', onRecenter);
  session.addEventListener('end', endXR);
  R3.setAnimationLoop(xrLoop);
  const remembering = restoreNorth(session);
  xrSpeak(remembering ? 'Welcome back. Checking for the north you set last time.'
    : mode === 'ar' ? 'Mixed reality. First, show me where north is.' : 'Welcome to the sky. First, show me where north is.');
}
function endXR() {
  if (!XR.active) return;
  XR.active = false; XR.session = null; XR.anchor = null; XR.wantAnchor = false; XR.restoring = false; XR.drag = null;
  if (R3) R3.setAnimationLoop(null);
  if (XR.preview) { XR.preview = false; document.body.classList.remove('xrpreview'); }
  if (XR.saved) S.layers.atmosphere = XR.saved.atm;
  try { speechSynthesis.cancel(); } catch (e) {}
  renderSkyPane();
}
function exitXR() { if (XR.session) XR.session.end().catch(endXR); else endXR(); }

/* ---------- preview on an ordinary screen ---------- */
const PV = { yaw: 0, pitch: 4, drag: null, ndc: null };
function startPreview() {
  Promise.all([loadThree(), fontsReady()]).then(() => {
    XR.preview = true;
    beginCommon('vr');
    document.body.classList.add('xrpreview');
    sizePreview();
    R3.setAnimationLoop(xrLoop);
  }).catch(e => toast(e.message || String(e)));
}
function sizePreview() {
  if (!R3 || XR.session) return;
  const w = innerWidth, h = innerHeight;
  R3.setSize(w, h, false); CAM.aspect = w / h; CAM.updateProjectionMatrix();
}
addEventListener('resize', () => { if (XR.preview) sizePreview(); });

/* ---------- the scene ---------- */
function canvasTex(cv) {
  const t = new THREE.CanvasTexture(cv);
  t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const labelCache = new Map();
function textSprite(text, o = {}) {
  const key = text + '|' + (o.color || '') + '|' + (o.weight || '') + '|' + (o.size || '');
  let tex = labelCache.get(key), aspect;
  if (!tex) {
    const px = 44, font = `${o.weight || 600} ${px}px Montserrat, sans-serif`;
    const c0 = makeCanvas(8, 8).getContext('2d'); c0.font = font;
    const w = Math.ceil(c0.measureText(text).width) + 24, h = Math.ceil(px * 1.5);
    const cv = makeCanvas(w, h), g = cv.getContext('2d');
    g.font = font; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.95)'; g.shadowBlur = 10;
    g.fillStyle = o.color || '#eef2fb'; g.fillText(text, 12, h / 2);
    tex = canvasTex(cv); tex.userData = { aspect: w / h };
    labelCache.set(key, tex);
  }
  aspect = tex.userData.aspect;
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: o.depthTest !== false });
  const sp = new THREE.Sprite(m);
  const hgt = o.h || 2.1;
  sp.scale.set(hgt * aspect, hgt, 1);
  if (o.left) sp.center.set(-0.06, 0.5);
  return sp;
}
function ringTexture(color, width) {
  const cv = makeCanvas(128, 128), g = cv.getContext('2d');
  g.strokeStyle = color; g.lineWidth = width || 7;
  g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.stroke();
  return canvasTex(cv);
}
function glowTexture(inner) {
  const cv = makeCanvas(128, 128), g = cv.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, inner || 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.45)');
  r.addColorStop(0.6, 'rgba(255,255,255,.08)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return canvasTex(cv);
}
function arrowTexture() {
  const cv = makeCanvas(128, 128), g = cv.getContext('2d');
  g.fillStyle = '#f4b942'; g.beginPath(); g.moveTo(112, 64); g.lineTo(28, 20); g.lineTo(48, 64); g.lineTo(28, 108); g.closePath(); g.fill();
  return canvasTex(cv);
}
function reticleTexture() {                                   // a sight: put the real Moon in the middle
  const cv = makeCanvas(128, 128), g = cv.getContext('2d');
  g.strokeStyle = '#5ed39b'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.arc(64, 64, 34, 0, TAU); g.stroke();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { g.beginPath(); g.moveTo(64 + dx * 42, 64 + dy * 42); g.lineTo(64 + dx * 60, 64 + dy * 60); g.stroke(); }
  return canvasTex(cv);
}
const enuToLocal = (e, r) => new THREE.Vector3(e[0] * r, e[2] * r, -e[1] * r);   // East, Up, -North
// Light laid on top. The headset blends this picture over its camera view by alpha, so the alpha
// has to stay where the light is: plain additive blending sets it to 1 wherever anything is drawn,
// and in mixed reality every constellation drawing became an opaque black card across the sky.
// src is SrcAlphaFactor for straight colour, OneFactor for a shader that premultiplies its own.
const lightBlend = src => ({ blending: THREE.CustomBlending, blendSrc: src, blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });

// Air bends starlight near the horizon and lifts it — half a degree right at the horizon — the same
// correction the flat sky makes, so drawn stars sit on the real ones even low down.
const LIFT = `
  vec4 lifted(vec3 p) {
    vec4 w = modelMatrix * vec4(p, 1.0);
    vec3 o = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz, d = w.xyz - o;
    float r = length(d), s = d.y / r;
    if (s < 0.16 && s > -0.05) {
      float alt = degrees(asin(s));
      float na = radians(alt + 1.02 / tan(radians(alt + 10.3 / (alt + 5.11))) / 60.0);
      vec2 h = normalize(d.xz) * cos(na);
      d = vec3(h.x, sin(na), h.y) * r;
    }
    return vec4(o + d, 1.0);
  }`;
const STAR_VS = `
  attribute vec3 color; attribute float mag;
  uniform float uLimit; uniform float uScale; uniform float uBelow; uniform float uBoost;
  varying vec3 vColor; varying float vAlpha;
  ${LIFT}
  void main() {
    vec3 dir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    float over = uLimit - mag;
    float a = clamp(0.3 + over * 0.38, 0.0, 1.0) * clamp((over + 0.5) / 0.8, 0.0, 1.0);
    float up = smoothstep(-0.03, 0.01, dir.y);
    a *= max(up, uBelow * 0.5);
    a = min(1.0, a * uBoost);
    vAlpha = a; vColor = color;
    gl_PointSize = clamp((1.3 + max(over, 0.0) * 1.15) * uScale * (0.85 + 0.15 * uBoost), 1.0, 18.0);
    gl_Position = projectionMatrix * viewMatrix * lifted(position);
  }`;
const STAR_FS = `
  varying vec3 vColor; varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float a = vAlpha * pow(core, 1.5);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }`;
const LINE_VS = `
  uniform float uBelow;
  varying float vUp;
  ${LIFT}
  void main() {
    vec3 dir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    vUp = max(smoothstep(-0.03, 0.01, dir.y), uBelow * 0.45);
    gl_Position = projectionMatrix * viewMatrix * lifted(position);
  }`;
const LINE_FS = `
  uniform vec3 uColor; uniform float uOpacity;
  varying float vUp;
  void main() { gl_FragColor = vec4(uColor, uOpacity * vUp); }`;
const MW_VS = `
  attribute float wgt; attribute float sz;
  uniform float uScale; uniform float uOn;
  varying float vA;
  void main() {
    vec3 dir = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    vA = wgt * uOn * smoothstep(-0.02, 0.12, dir.y);
    gl_PointSize = sz * uScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const MW_FS = `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = vA * pow(smoothstep(0.5, 0.0, d), 1.6) * 0.016;     // a faint glow, never a searchlight
    if (a < 0.002) discard;
    gl_FragColor = vec4(0.82, 0.80, 0.76, a);
  }`;
function lineMaterial(color, opacity) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uBelow: { value: 0 } },
    vertexShader: LINE_VS, fragmentShader: LINE_FS, transparent: true, depthWrite: false
  });
}

function buildScene() {
  if (R3) return;
  const T = THREE;
  R3 = new T.WebGLRenderer({ antialias: true, alpha: true });
  R3.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  R3.setClearColor(0x000000, 0);
  R3.xr.enabled = true;
  R3.domElement.id = 'xrstage';
  document.body.appendChild(R3.domElement);
  SC = new T.Scene();
  CAM = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 1000);
  CAM.rotation.order = 'YXZ';
  SC.add(CAM);

  G.world = new T.Group(); SC.add(G.world);                // East-Up-(-North), turned by the calibration

  // VR backdrop and ground; hidden in mixed reality, where the real world shows through
  G.bg = new T.Mesh(new T.SphereGeometry(400, 32, 16), new T.MeshBasicMaterial({ color: 0x04060d, side: T.BackSide, depthWrite: false }));
  G.bg.renderOrder = -10; G.world.add(G.bg);
  G.ground = new T.Mesh(new T.SphereGeometry(94, 48, 16, 0, TAU, Math.PI / 2, Math.PI / 2),
    new T.MeshBasicMaterial({ color: 0x05070c, side: T.BackSide }));
  G.world.add(G.ground);
  const ring = []; for (let i = 0; i <= 128; i++) { const a = i / 128 * TAU; ring.push(Math.sin(a) * 93.5, 0, -Math.cos(a) * 93.5); }
  const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(ring, 3));
  G.horizon = new T.Line(rg, new T.LineBasicMaterial({ color: 0x8ca5d7, transparent: true, opacity: 0.45 }));
  G.world.add(G.horizon);
  // Everything that depends on where north is. Hidden while you show the headset north, so a
  // misplaced "N" or Moon can't be mistaken for the real thing.
  G.sky = new T.Group(); G.world.add(G.sky);
  G.compass = [];
  COMPASS.forEach((c, i) => {
    if (i % 2) return;
    const major = i % 4 === 0, az = i * 22.5 * D2R;
    const sp = textSprite(c, { color: c === 'N' ? '#ff7a5c' : major ? '#eef2fb' : '#9aa7c4', h: major ? 3.2 : 2.2, weight: 700 });
    sp.position.set(Math.sin(az) * 90, 90 * Math.sin(2.2 * D2R), -Math.cos(az) * 90);
    sp.userData = { major }; G.sky.add(sp); G.compass.push(sp);
  });
  G.cel = new T.Group(); G.cel.matrixAutoUpdate = false; G.sky.add(G.cel);   // J2000 sky

  // stars
  const pos = [], col = [], mag = [];
  for (const s of STARS) { pos.push(s.vec[0] * R_SKY, s.vec[1] * R_SKY, s.vec[2] * R_SKY); col.push(s.rgb[0] / 255, s.rgb[1] / 255, s.rgb[2] / 255); mag.push(s.mag); }
  const sg = new T.BufferGeometry();
  sg.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  sg.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  sg.setAttribute('mag', new T.Float32BufferAttribute(mag, 1));
  G.starMat = new T.ShaderMaterial({
    uniforms: { uLimit: { value: 5.5 }, uScale: { value: 1.6 }, uBelow: { value: 0 }, uBoost: { value: 1 } },
    vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, ...lightBlend(T.SrcAlphaFactor)
  });
  G.stars = new T.Points(sg, G.starMat); G.stars.frustumCulled = false; G.cel.add(G.stars);

  // Milky Way
  const mp = [], mw = [], ms = [];
  for (const m of MW) { mp.push(m.v[0] * 101, m.v[1] * 101, m.v[2] * 101); mw.push(m.w); ms.push(30 + m.r * 26); }
  const mg = new T.BufferGeometry();
  mg.setAttribute('position', new T.Float32BufferAttribute(mp, 3));
  mg.setAttribute('wgt', new T.Float32BufferAttribute(mw, 1));
  mg.setAttribute('sz', new T.Float32BufferAttribute(ms, 1));
  G.mwMat = new T.ShaderMaterial({ uniforms: { uScale: { value: 1 }, uOn: { value: 1 } }, vertexShader: MW_VS, fragmentShader: MW_FS,
    transparent: true, depthWrite: false, ...lightBlend(T.SrcAlphaFactor) });
  G.mw = new T.Points(mg, G.mwMat); G.mw.frustumCulled = false; G.cel.add(G.mw);

  // constellation figures, and a second layer for whatever is being taught
  const lp = [];
  for (const f of FIGURES) for (const [a, b] of f.lines) { const A = BY_ID.get(a).vec, B = BY_ID.get(b).vec; lp.push(A[0] * 99, A[1] * 99, A[2] * 99, B[0] * 99, B[1] * 99, B[2] * 99); }
  const lg = new T.BufferGeometry(); lg.setAttribute('position', new T.Float32BufferAttribute(lp, 3));
  G.lineMat = lineMaterial(0x7fb2ff, 0.34);
  G.lines = new T.LineSegments(lg, G.lineMat); G.lines.frustumCulled = false; G.cel.add(G.lines);
  G.focusGeo = new T.BufferGeometry(); G.focusGeo.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(600 * 6), 3));
  G.focusGeo.setDrawRange(0, 0);
  G.focusMat = lineMaterial(0xf4b942, 0.9);
  G.focus = new T.LineSegments(G.focusGeo, G.focusMat); G.focus.frustumCulled = false; G.cel.add(G.focus);

  // Stellarium's constellation drawings, each fitted to its three anchor stars on the sky sphere
  G.art = [];
  if (typeof ARTS !== 'undefined' && ARTS.length) {
    const loader = new T.TextureLoader(), N = 10;
    const vs = `varying vec2 vUv; varying float vUp; uniform float uBelow;
      void main(){ vUv = uv; vec3 d = normalize((modelMatrix * vec4(position, 0.0)).xyz);
        vUp = max(smoothstep(-0.03, 0.01, d.y), uBelow * 0.45); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
    // premultiplied, with alpha only where the drawing has ink: the black around it stays see-through
    const fs = `uniform sampler2D map; uniform float uOpacity; varying vec2 vUv; varying float vUp;
      void main(){ vec3 c = texture2D(map, vUv).rgb * uOpacity * vUp; gl_FragColor = vec4(c, max(c.r, max(c.g, c.b))); }`;
    for (const a of ARTS) {
      const V = a.v.map(v => new T.Vector3(v[0], v[1], v[2]));
      const c = V[0].clone().add(V[1]).add(V[2]).normalize();
      const e1 = new T.Vector3().crossVectors(c, Math.abs(c.z) > 0.95 ? new T.Vector3(0, 1, 0) : new T.Vector3(0, 0, 1)).normalize();
      const e2 = new T.Vector3().crossVectors(c, e1);
      const st = V.map(v => { const w = v.clone().multiplyScalar(1 / v.dot(c)); return [w.dot(e1), w.dot(e2)]; });
      const [u0, v0] = a.a[0], [u1, v1] = a.a[1], [u2, v2] = a.a[2];
      const du1 = u1 - u0, dv1 = v1 - v0, du2 = u2 - u0, dv2 = v2 - v0, det = du1 * dv2 - du2 * dv1;
      if (Math.abs(det) < 1e-6) continue;
      const ds1 = st[1][0] - st[0][0], ds2 = st[2][0] - st[0][0], dt1 = st[1][1] - st[0][1], dt2 = st[2][1] - st[0][1];
      const a11 = (ds1 * dv2 - ds2 * dv1) / det, a12 = (du1 * ds2 - du2 * ds1) / det;
      const a21 = (dt1 * dv2 - dt2 * dv1) / det, a22 = (du1 * dt2 - du2 * dt1) / det;
      const s0 = st[0][0] - a11 * u0 - a12 * v0, t0 = st[0][1] - a21 * u0 - a22 * v0;
      const pos = [], uv = [], idx = [];
      let rad = 0;                                           // how far the drawing reaches from its centre
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
        const u = i / N * a.w, v = j / N * a.h, s = s0 + a11 * u + a12 * v, t = t0 + a21 * u + a22 * v;
        const p = c.clone().add(e1.clone().multiplyScalar(s)).add(e2.clone().multiplyScalar(t)).normalize();
        rad = Math.max(rad, p.angleTo(c)); p.multiplyScalar(96);
        pos.push(p.x, p.y, p.z); uv.push(i / N, 1 - j / N);
      }
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = j * (N + 1) + i; idx.push(k, k + 1, k + N + 1, k + 1, k + N + 2, k + N + 1); }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
      // The drawings are grey, so one byte a pixel is enough: a quarter of the headset's graphics memory.
      const tex = loader.load(a.file, t => { t.format = T.LuminanceFormat; t.needsUpdate = true; });
      const mat = new T.ShaderMaterial({ uniforms: { map: { value: tex }, uOpacity: { value: 0.2 }, uBelow: { value: 0 } },
        vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, ...lightBlend(T.OneFactor), side: T.DoubleSide });
      const mesh = new T.Mesh(geo, mat); mesh.userData = { con: a.con, c: [c.x, c.y, c.z], rad };   // culled when out of view
      G.cel.add(mesh); G.art.push(mesh);
    }
  }

  // names
  G.starLabels = [];
  for (const s of STARS) {
    if (!s.name || s.mag > 2.6) continue;
    const sp = textSprite(s.name, { h: 1.9, left: true, color: '#e7ecf8', weight: 600 });
    sp.position.set(s.vec[0] * 97, s.vec[1] * 97, s.vec[2] * 97);
    sp.userData = { star: s }; G.cel.add(sp); G.starLabels.push(sp);
  }
  G.dsoSprites = [];
  const glow = glowTexture();
  for (const o of DSOS) {
    const g = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xb9adff, transparent: true, opacity: 0.55, depthWrite: false, ...lightBlend(T.SrcAlphaFactor) }));
    g.scale.set(2.4, 2.4, 1); g.position.set(o.vec[0] * 98, o.vec[1] * 98, o.vec[2] * 98);
    const l = textSprite(o.name, { h: 1.5, left: true, color: '#b7abff', weight: 500 });
    l.position.copy(g.position);
    g.userData = { dso: o, label: l }; G.cel.add(g); G.cel.add(l); G.dsoSprites.push(g);
  }
  // planets, Moon, Sun
  G.planets = PLANETS.filter(p => p.n).map(p => {
    const dot = new T.Sprite(new T.SpriteMaterial({ map: glow, color: new T.Color(p.col), transparent: true, depthWrite: false, ...lightBlend(T.SrcAlphaFactor) }));
    dot.scale.set(1.5, 1.5, 1);
    const l = textSprite(p.n, { h: 1.8, left: true, color: '#ffe6bd', weight: 600 });
    G.cel.add(dot); G.cel.add(l);
    return { p, dot, l };
  });
  G.moonCv = makeCanvas(128, 128); G.moonTex = canvasTex(G.moonCv);
  G.moon = new T.Sprite(new T.SpriteMaterial({ map: G.moonTex, transparent: true, depthWrite: false }));
  G.sky.add(G.moon);
  // in mixed reality a ring marks where the Moon should be, so you see the real one inside it
  G.moonRing = new T.Sprite(new T.SpriteMaterial({ map: ringTexture('#eee8d6', 4), transparent: true, depthWrite: false })); G.sky.add(G.moonRing);
  G.moonLabel = textSprite('Moon', { h: 1.8, left: true, color: '#eee8d6' }); G.sky.add(G.moonLabel);
  G.moonLabel.center.x = -0.06 - 1.5 / G.moonLabel.scale.x;          // clear of the disc and the ring
  G.sun = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xfff1cc, transparent: true, depthWrite: false, ...lightBlend(T.SrcAlphaFactor) }));
  G.sun.scale.set(9, 9, 1); G.sky.add(G.sun);

  // markers
  const amber = ringTexture('#f4b942', 7), white = ringTexture('#eef2fb', 5), green = ringTexture('#5ed39b', 7);
  G.marks = Array.from({ length: 8 }, () => { const m = new T.Sprite(new T.SpriteMaterial({ map: amber, transparent: true, depthWrite: false, depthTest: false })); m.visible = false; G.sky.add(m); return m; });
  G.guide = new T.Sprite(new T.SpriteMaterial({ map: green, transparent: true, depthWrite: false, depthTest: false })); G.guide.visible = false; G.sky.add(G.guide);
  G.hover = new T.Sprite(new T.SpriteMaterial({ map: white, transparent: true, depthWrite: false, depthTest: false })); G.hover.visible = false; G.sky.add(G.hover);
  G.figLabel = null;

  // head-locked guide arrow
  G.head = new T.Group(); SC.add(G.head);
  G.chev = new T.Sprite(new T.SpriteMaterial({ map: arrowTexture(), transparent: true, depthTest: false, depthWrite: false }));
  G.chev.scale.set(0.09, 0.09, 1); G.chev.visible = false; G.head.add(G.chev);
  // the sight for showing it north with the real Moon: far off, so both eyes see it single
  G.reticle = new T.Sprite(new T.SpriteMaterial({ map: reticleTexture(), transparent: true, depthTest: false, depthWrite: false }));
  G.reticle.position.set(0, 0, -20); G.reticle.scale.set(2, 2, 1); G.reticle.renderOrder = 22; G.reticle.visible = false; G.head.add(G.reticle);

  // the menu panel
  G.pcv = makeCanvas(PW, PH); G.pctx = G.pcv.getContext('2d'); G.ptex = canvasTex(G.pcv);
  G.panel = new T.Mesh(new T.PlaneGeometry(1.15, 1.15 * PH / PW), new T.MeshBasicMaterial({ map: G.ptex, transparent: true, depthTest: false }));
  G.panel.renderOrder = 20; SC.add(G.panel);
  G.cursors = [0, 1].map(() => { const m = new T.Mesh(new T.RingGeometry(0.006, 0.011, 24), new T.MeshBasicMaterial({ color: 0xf4b942, depthTest: false, transparent: true }));
    m.renderOrder = 21; m.visible = false; SC.add(m); return m; });

  // controllers (and tracked hands): a ray each
  G.ctrls = [0, 1].map(i => {
    const c = R3.xr.getController(i);
    const rgeo = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(0, 0, -1)]);
    const ray = new T.Line(rgeo, new T.LineBasicMaterial({ color: 0xf4b942, transparent: true, opacity: 0.75 }));
    ray.scale.z = 4; c.add(ray);
    c.userData = { ray, src: null, hoverBtn: null, hoverObj: null };
    c.addEventListener('connected', e => { c.userData.src = e.data; c.visible = e.data.targetRayMode !== 'gaze'; });
    c.addEventListener('disconnected', () => { c.userData.src = null; c.visible = false; });
    c.addEventListener('selectstart', () => onSelectStart(c.userData));
    c.addEventListener('select', () => onSelect(c.userData));
    c.addEventListener('selectend', () => { if (XR.drag && XR.drag.p === c.userData) XR.drag = null; });
    c.addEventListener('squeeze', () => { XR.needPanel = true; });
    c.visible = false; SC.add(c);
    return c;
  });
  G.ray = new T.Raycaster();

  // preview: look with the mouse, point with the mouse
  const el = R3.domElement;
  el.addEventListener('pointerdown', e => { PV.drag = { x: e.clientX, y: e.clientY, yaw: PV.yaw, pitch: PV.pitch, moved: 0 }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => {
    PV.ndc = { x: e.clientX / innerWidth * 2 - 1, y: -(e.clientY / innerHeight) * 2 + 1 };
    if (!PV.drag) return;
    const dx = e.clientX - PV.drag.x, dy = e.clientY - PV.drag.y;
    PV.drag.moved = Math.max(PV.drag.moved, Math.hypot(dx, dy));
    PV.yaw = norm360(PV.drag.yaw - dx * 0.18); PV.pitch = clamp(PV.drag.pitch + dy * 0.18, -85, 85);
  });
  el.addEventListener('pointerup', () => { if (PV.drag && PV.drag.moved < 5 && XR.pointers && XR.pointers[0]) onSelect(XR.pointers[0]); PV.drag = null; });
  el.addEventListener('wheel', e => { e.preventDefault(); CAM.fov = clamp(CAM.fov * (1 + Math.sign(e.deltaY) * 0.1), 20, 100); CAM.updateProjectionMatrix(); }, { passive: false });
}
// Mixed reality draws only what belongs on the sky: no backdrop, ground, horizon ring, Milky Way
// haze or Sun glow — the real ones are right there — and just the four main compass letters.
function applyMode() {
  const ar = XR.mode === 'ar';
  G.bg.visible = !ar; G.ground.visible = !ar; G.mw.visible = !ar; G.horizon.visible = !ar;
  for (const sp of G.compass) sp.visible = !ar || sp.userData.major;
  G.lineMat.uniforms.uOpacity.value = ar ? 0.6 : 0.34;
  XR.dirty = true;
}

/* ---------- per frame ---------- */
const tmpV = () => new THREE.Vector3();
function headForward() { return new THREE.Vector3(0, 0, -1).applyQuaternion(G.head.quaternion); }
const yawOf = d => norm360(Math.atan2(d.x, -d.z) * R2D);        // compass-style: 0 = straight ahead at start, clockwise
function worldToEnu(d) {                                         // three world direction -> East, North, Up
  const t = -XR.theta * D2R, c = Math.cos(t), s = Math.sin(t);
  const x = d.x * c + d.z * s, z = -d.x * s + d.z * c;
  return unit3([x, -z, d.y]);
}
function xrLoop(time, frame) {
  // three.js also calls this from the page's own animation timer; in a headset only the XR frames count.
  if (XR.session && !frame) return;
  const now = performance.now(), dt = XR.lastT ? Math.min(0.25, (now - XR.lastT) / 1000) : 0;
  XR.lastT = now; tClock = now / 1000;
  advanceTime(dt);
  solve();
  // where the head is
  if (XR.session) {
    const pose = frame.getViewerPose(XR.refSpace || R3.xr.getReferenceSpace());
    if (pose) { const p = pose.transform.position, q = pose.transform.orientation; G.head.position.set(p.x, p.y, p.z); G.head.quaternion.set(q.x, q.y, q.z, q.w); }
  } else {
    CAM.rotation.set(PV.pitch * D2R, -PV.yaw * D2R, 0);
    CAM.position.set(0, 0, 0);
    G.head.position.copy(CAM.position); G.head.quaternion.copy(CAM.quaternion);
  }
  G.head.updateMatrixWorld(true);
  if (frame) { if (XR.wantAnchor) saveNorth(frame); followAnchor(frame); }
  if (XR.needPanel) placePanel();
  followPanel(now);
  updateSky(now);
  updatePointers(dt);
  updateGuide();
  if (typeof evalLookTick === 'function') evalLookTick();
  maybeSpeakTeaching();
  if ((XR.dirty && now - XR.lastPanel > 60) || now - XR.lastPanel > 1000) drawPanel();
  R3.render(SC, CAM);
}
function placePanel() {
  XR.needPanel = false;
  const f = headForward(); f.y = 0; if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
  // low, like a lectern: easy to read with a glance down, and the horizon stays clear above it
  const p = G.head.position.clone().add(f.multiplyScalar(1.25)); p.y = G.head.position.y - (XR.preview ? 0.22 : 0.34);
  G.panel.position.copy(p);
  // in a headset the panel leans back like a lectern; on a flat screen it faces you square-on
  if (XR.preview) G.panel.lookAt(G.head.position); else G.panel.lookAt(G.head.position.x, G.panel.position.y + 0.12, G.head.position.z);
}
// The menu comes after you: at once while calibrating, and after a couple of seconds once you have
// turned well away from it — so a lesson's next instruction is always a glance down, hands or controllers.
function followPanel(now) {
  const f = headForward(); f.y = 0; if (f.lengthSq() < 1e-6) return; f.normalize();
  const toPanel = G.panel.position.clone().sub(G.head.position); toPanel.y = 0; toPanel.normalize();
  const off = f.dot(toPanel);
  if (XR.screen === 'calib') { if (off < Math.cos(40 * D2R)) XR.needPanel = true; return; }
  if (XR.preview || off > Math.cos(70 * D2R)) { XR.awaySince = 0; return; }
  if (!XR.awaySince) XR.awaySince = now;
  else if (now - XR.awaySince > 2200) { XR.awaySince = 0; XR.needPanel = true; }
}
function updateSky(now) {
  const M = SKY.enuStar, ar = XR.mode === 'ar';
  G.cel.matrix.set(M[0][0], M[0][1], M[0][2], 0, M[2][0], M[2][1], M[2][2], 0, -M[1][0], -M[1][1], -M[1][2], 0, 0, 0, 0, 1);
  G.cel.matrixWorldNeedsUpdate = true;
  G.world.position.copy(G.head.position);
  G.world.rotation.y = XR.theta * D2R;
  G.sky.visible = !aiming();
  G.reticle.visible = !!XR.calibObj;
  const limit = ar ? XR.mrLimit : Math.max(SKY.limit, 3.5);
  const u = G.starMat.uniforms;
  u.uLimit.value = limit; u.uBelow.value = XR.below ? 1 : 0; u.uBoost.value = ar ? XR.boost : 1;
  u.uScale.value = XR.preview ? (devicePixelRatio || 1) * 1.1 : 1.7;
  G.mwMat.uniforms.uScale.value = XR.preview ? (devicePixelRatio || 1) : 1.6;
  G.lineMat.uniforms.uBelow.value = G.focusMat.uniforms.uBelow.value = XR.below ? 1 : 0;
  G.lines.visible = XR.lines;
  for (const m of G.art) {
    const on = S.focusFigs && S.focusFigs.includes(m.userData.con);
    const alt = Math.asin(clamp(apply3(SKY.enuStar, m.userData.c)[2], -1, 1));
    m.visible = XR.art && !S.hideLabels && (XR.below || alt > -m.userData.rad - 0.03);   // skip drawings wholly underground
    m.material.uniforms.uOpacity.value = on ? 0.45 : S.focusFigs ? 0.05 : ar ? 0.26 : 0.13;
    m.material.uniforms.uBelow.value = XR.below ? 1 : 0;
  }
  const hide = S.hideLabels || !XR.labels;
  const up = v => { const e = apply3(SKY.enuStar, v); return e[2] > -0.005 || XR.below; };
  for (const sp of G.starLabels) { const s = sp.userData.star; sp.visible = !hide && s.mag < limit - 0.2 && up(s.vec); }
  for (const g of G.dsoSprites) { const o = g.userData.dso, vis = S.layers.dso && o.mag < limit + 1 && up(o.vec); g.visible = vis; g.userData.label.visible = vis && !hide; }
  if (now - XR.lastPlanets > 500) {
    XR.lastPlanets = now;
    for (const P of G.planets) {
      const q = SKY.planets.find(z => z.p === P.p);
      const vis = !!q && q.mag < limit + 0.6 && up(q.v);
      P.dot.visible = vis; P.l.visible = vis && !hide;
      if (q) { P.dot.position.set(q.v[0] * 97, q.v[1] * 97, q.v[2] * 97); P.l.position.copy(P.dot.position); P.dot.scale.setScalar(clamp(2.4 - q.mag * 0.25, 0.9, 3.2)); }
    }
    drawMoonPhase();
  }
  const me = apply3(SKY.E, SKY.moon.v), mv = enuToLocal(refract(me), 92);
  G.moon.position.copy(mv); G.moonLabel.position.copy(mv); G.moonRing.position.copy(mv);
  const ms = SKY.moon.semi * 2 * D2R * 92 * 1.6;
  G.moon.scale.set(ms, ms, 1); G.moonRing.scale.set(ms * 1.9, ms * 1.9, 1);
  const moonUp = me[2] > -0.01 || XR.below;
  G.moon.visible = moonUp && !ar; G.moonRing.visible = moonUp && ar; G.moonLabel.visible = moonUp && !hide;
  const se = apply3(SKY.E, SKY.sun.v);
  G.sun.position.copy(enuToLocal(se, 91)); G.sun.visible = se[2] > -0.01 && !ar;
  // rotate the Moon's lit side toward the Sun, as seen from the head
  const inv = G.head.quaternion.clone().invert();
  const mw = enuToLocal(me, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), XR.theta * D2R).applyQuaternion(inv);
  const sw = enuToLocal(se, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), XR.theta * D2R).applyQuaternion(inv);
  G.moon.material.rotation = Math.atan2(sw.y - mw.y, sw.x - mw.x);
  updateFocusLines();
  updateMarks();
}
function drawMoonPhase() {
  const g = G.moonCv.getContext('2d'), r = 56, k = 1 - 2 * SKY.moonIllum;
  g.clearRect(0, 0, 128, 128);
  g.save(); g.translate(64, 64);
  g.fillStyle = 'rgba(120,128,146,.35)'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.fillStyle = '#ece7d8'; g.beginPath();
  g.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
  g.ellipse(0, 0, Math.abs(r * k), r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
  g.fill(); g.restore();
  G.moonTex.needsUpdate = true;
}
function figUnderGaze() {
  const f = worldToEnu(headForward());
  let best = null, bd = Math.cos(13 * D2R);
  for (const s of STARS) {
    if (!FIG_STARS.has(s.id)) continue;
    const e = apply3(SKY.enuStar, s.vec), d = dot3(e, f);
    if (d > bd) { bd = d; best = s; }
  }
  return best ? FIG_STARS.get(best.id) : null;
}
function updateFocusLines() {
  const segs = [], add = (a, b) => { const A = BY_ID.get(a), B = BY_ID.get(b); if (A && B && A.vec && B.vec) segs.push(A.vec, B.vec); };
  let key = '';
  const gazeFig = S.hideLabels ? null : figUnderGaze();
  if (S.asterism && AST_BY_ID[S.asterism]) { key += 'a' + S.asterism; for (const [a, b] of AST_BY_ID[S.asterism].path) add(a, b); }
  if (S.focusFigs) { key += 'f' + S.focusFigs.join(); for (const c of S.focusFigs) { const f = FIG_BY_CON[c]; if (f) for (const [a, b] of f.lines) add(a, b); } }
  if (S.hop) { key += 'h' + S.hop.chain.join(); for (let i = 0; i < S.hop.chain.length - 1; i++) add(S.hop.chain[i], S.hop.chain[i + 1]); }
  if (!key && gazeFig) { key = 'g' + gazeFig.con; for (const [a, b] of gazeFig.lines) add(a, b); }
  if (key !== XR.focusKey) {
    XR.focusKey = key;
    const arr = G.focusGeo.attributes.position.array, n = Math.min(segs.length, 1200);
    for (let i = 0; i < n; i++) { arr[i * 3] = segs[i][0] * 99; arr[i * 3 + 1] = segs[i][1] * 99; arr[i * 3 + 2] = segs[i][2] * 99; }
    G.focusGeo.attributes.position.needsUpdate = true; G.focusGeo.setDrawRange(0, n);
    G.focusMat.uniforms.uColor.value.set(key.startsWith('g') ? 0xf4d690 : 0xf4b942);
    G.focusMat.uniforms.uOpacity.value = key.startsWith('g') ? 0.55 : 0.95;
  }
  // the name of the constellation you are looking at
  const figShown = gazeFig && XR.labels ? gazeFig : null, fk = figShown ? figShown.con : '';
  if (fk !== XR.figKey) {
    XR.figKey = fk;
    if (G.figLabel) { G.sky.remove(G.figLabel); G.figLabel = null; }
    if (figShown) { G.figLabel = textSprite(`${figShown.name} — ${figShown.nick.replace(/^The /, 'the ')}`, { h: 2.6, color: '#f4c766', weight: 600 }); G.sky.add(G.figLabel); }
  }
  if (G.figLabel && figShown) {
    let c = [0, 0, 0];
    for (const [a] of figShown.lines) { const e = apply3(SKY.enuStar, BY_ID.get(a).vec); c = [c[0] + e[0], c[1] + e[1], c[2] + e[2]]; }
    c = unit3(c); const p = enuToLocal(c, 88); p.y -= 4; G.figLabel.position.copy(p);
  }
}
function updateMarks() {
  const list = [...S.marks];
  if (S.selected && S.selected.kind === 'star' && !S.awaiting) list.push(S.selected.id);
  G.marks.forEach((m, i) => {
    const id = list[i];
    let e = null;
    if (id) { const o = objFromId(id); if (o) e = o.kind === 'planet' && !o.q ? null : enuOf(o); }
    m.visible = !!e;
    if (e) { m.position.copy(enuToLocal(e, 90)); const s = 3.2 + Math.sin(tClock * 2.6) * 0.5; m.scale.set(s, s, 1); }
  });
}

/* ---------- pointing ---------- */
const PICK_DEG = 2.6;
function skyPick(dirWorld) {
  const f = worldToEnu(dirWorld), lim = XR.mode === 'ar' ? XR.mrLimit : Math.max(SKY.limit, 3.5);
  let best = null, bd = Math.cos(PICK_DEG * D2R);
  const test = (o, e) => { const d = dot3(e, f); if (d > bd && (e[2] > -0.01 || XR.below)) { bd = d; best = o; } };
  for (const s of STARS) if (s.mag < lim) test(s, apply3(SKY.enuStar, s.vec));
  for (const q of SKY.planets) if (q.mag < lim + 0.6) test(q.obj || { id: 'planet-' + q.p.k, kind: 'planet', name: q.p.n, q }, apply3(SKY.enuStar, q.v));
  if (S.layers.dso) for (const o of DSOS) if (o.mag < lim + 1) test(o, apply3(SKY.enuStar, o.vec));
  test({ id: 'moon', kind: 'moon', name: 'The Moon' }, apply3(SKY.E, SKY.moon.v));
  return best;
}
function updatePointers(dt) {
  const T = THREE, pointers = [];
  if (XR.session) {
    for (const c of G.ctrls) {
      const src = c.userData.src;
      if (!src || src.targetRayMode === 'gaze') continue;
      c.updateMatrixWorld(true);
      const o = new T.Vector3().setFromMatrixPosition(c.matrixWorld);
      const d = new T.Vector3(0, 0, -1).transformDirection(c.matrixWorld);
      c.userData.origin = o; c.userData.dir = d; c.userData.ctrl = c; c.userData.hand = src.handedness;
      pointers.push(c.userData);
      // thumbstick nudges the sky while calibrating
      const gp = src.gamepad;
      if (gp && gp.axes && XR.screen === 'calib' && !aiming() && !XR.drag) {
        const x = gp.axes.length >= 4 ? gp.axes[2] : gp.axes[0];
        // curved response: a light push creeps (≈1°/s) for exact alignment, a full push sweeps (20°/s)
        if (Math.abs(x) > 0.12) { XR.theta = norm180(XR.theta - Math.sign(x) * x * x * 20 * dt); markTuned(); }
      }
    }
    // Grabbing the sky: while the trigger or pinch is held, the sky turns with your hand, so you
    // can drag a drawn star straight onto the real one.
    const dg = XR.drag;
    if (dg && dg.p.dir) {
      const dy = norm180(yawOf(dg.p.dir) - dg.yaw0);
      dg.moved = Math.max(dg.moved, Math.abs(dy));
      if (dg.moved > 0.4) { XR.theta = norm180(dg.theta0 - dy); markTuned(); }
    }
  } else if (XR.preview) {
    if (!XR.pvPointer) XR.pvPointer = {};
    if (PV.ndc) {
      G.ray.setFromCamera(PV.ndc, CAM);
      XR.pvPointer.origin = G.ray.ray.origin.clone(); XR.pvPointer.dir = G.ray.ray.direction.clone();
      pointers.push(XR.pvPointer);
    }
  }
  // The hand that pressed last leads: its button lights up and its star gets the ring, even
  // when the other controller is resting with its ray across the menu.
  pointers.sort((a, b) => (b.hand === XR.primary) - (a.hand === XR.primary));
  XR.pointers = pointers;
  let hoverBtn = null, hoverObj = null;
  G.cursors.forEach(m => { m.visible = false; });
  pointers.forEach((p, i) => {
    G.ray.set(p.origin, p.dir);
    const hit = G.ray.intersectObject(G.panel, false)[0];
    p.hoverBtn = null; p.hoverObj = null; p.onPanel = !!hit;
    if (hit && hit.uv) {
      const x = hit.uv.x * PW, y = (1 - hit.uv.y) * PH;
      const b = PBTN.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
      p.hoverBtn = b ? b.id : null; hoverBtn = hoverBtn || p.hoverBtn;
      const cur = G.cursors[i] || G.cursors[1];
      cur.visible = true; cur.position.copy(hit.point); cur.quaternion.copy(G.panel.quaternion); cur.material.opacity = i ? 0.4 : 1;
      if (p.ctrl) p.ctrl.userData.ray.scale.z = hit.distance;
    } else {
      p.hoverObj = aiming() ? null : skyPick(p.dir); hoverObj = hoverObj || p.hoverObj;
      if (p.ctrl) p.ctrl.userData.ray.scale.z = 6;
    }
    if (p.ctrl) p.ctrl.userData.ray.material.opacity = i ? 0.3 : 0.75;
  });
  // no controllers or hands: look at something and hold still
  if (!pointers.length && XR.session) {
    const f = headForward(), now = performance.now();
    const o = aiming() ? null : skyPick(f);
    if (o && XR.gazeId === o.id) { if (now - XR.gazeT0 > 1300 && XR.gazeFired !== o.id) { XR.gazeFired = o.id; selectObj(o); } }
    else { XR.gazeId = o ? o.id : null; XR.gazeT0 = now; XR.gazeFired = null; }
    hoverObj = o;
    // hands-free calibration: hold still for three seconds — facing the direction, or with the real
    // Moon in the sight (only counted while looking up about as high as it really is)
    if (aiming()) {
      const y = yawOf(f), pt = Math.asin(clamp(f.y, -1, 1)) * R2D, tol = XR.calibObj ? 1 : 3;
      if (XR.calibObj && Math.abs(pt - XR.calibObj.alt) > 10) XR.still = null;
      else if (!XR.still || Math.abs(norm180(y - XR.still.y)) > tol || Math.abs(pt - XR.still.p) > tol) XR.still = { y, p: pt, t0: now };
      else if (now - XR.still.t0 > 3000) { XR.still = null; if (XR.calibPending) finishFacing(); else finishObject(); }
    }
  }
  if (hoverBtn !== XR.hoverBtn) { XR.hoverBtn = hoverBtn; XR.dirty = true; }
  XR.hoverObj = hoverObj;
  G.hover.visible = !!hoverObj && !S.hideLabels;
  if (hoverObj) { const e = enuOf(hoverObj); G.hover.position.copy(enuToLocal(e, 90)); G.hover.scale.set(2.6, 2.6, 1); }
}
function onSelectStart(p) {
  if (XR.screen !== 'calib' || aiming() || p.onPanel || !p.dir) return;
  XR.drag = { p, yaw0: yawOf(p.dir), theta0: XR.theta, moved: 0 };
}
function onSelect(p) {
  if (p.hand && p.hand !== XR.primary) { XR.primary = p.hand; XR.dirty = true; }
  if (XR.drag && XR.drag.p === p && XR.drag.moved > 0.4) return;          // that was a drag, not a click
  if (p.hoverBtn) { pressButton(p.hoverBtn, p); return; }
  if (XR.calibPending) { finishFacing(); return; }
  if (XR.calibObj) { finishObject(); return; }
  const o = p.hoverObj || (p.dir ? skyPick(p.dir) : null);
  if (o) selectObj(o);
}
function selectObj(o) {
  if (S.awaiting) {
    judgeClick(o);
    const v = $('verdict'); if (v && !v.hidden) xrSpeak(v.textContent);
    if (XR.screen !== 'lesson') XR.screen = 'lesson';
  } else {
    S.selected = o; XR.info = o;                               // calibration stays open; the name is still spoken
    xrSpeak(spokenFact(o));
  }
  XR.dirty = true;
}
function xrLook() {
  const e = worldToEnu(headForward());
  return { az: norm360(Math.atan2(e[0], e[1]) * R2D), alt: Math.asin(clamp(e[2], -1, 1)) * R2D };
}
function xrMissHint(o, targets) {
  const ce = enuOf(o); let best = null;
  for (const id of targets) { const t = BY_ID.get(id); if (!t) continue; const te = apply3(SKY.enuStar, t.vec), d = Math.acos(clamp(dot3(ce, te), -1, 1)) * R2D; if (!best || d < best.d) best = { d, te }; }
  if (!best) return 'Try again.';
  const azC = Math.atan2(ce[0], ce[1]) * R2D, azT = Math.atan2(best.te[0], best.te[1]) * R2D;
  const altC = Math.asin(clamp(ce[2], -1, 1)) * R2D, altT = Math.asin(clamp(best.te[2], -1, 1)) * R2D;
  const dAz = norm180(azT - azC) * Math.cos(altC * D2R), dAlt = altT - altC;
  const v = Math.abs(dAlt) > 2.5 ? (dAlt > 0 ? 'up' : 'down') : '', h = Math.abs(dAz) > 2.5 ? (dAz > 0 ? 'right' : 'left') : '';
  const way = v && h ? `${v} and to the ${h}` : v ? v : h ? 'to the ' + h : 'right beside it';
  return `The one you want is ${best.d.toFixed(0)}° away — ${handWords(best.d)} ${way}.`;
}

/* ---------- calibration ----------
   Three steps, coarse to exact: face a direction you know (or, by day, along your shadow); then
   look at the real Moon or a bright planet through a sight in the middle of your view — each one
   you add is averaged in, and they cross-check each other; then grab the sky and drag a drawn star
   onto the real one. Only the compass direction needs setting: the headset already knows "up". */
const aiming = () => !!(XR.calibPending || XR.calibObj);
const capFirst = t => t.charAt(0).toUpperCase() + t.slice(1);
const listNames = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
function startFacing(name, az, how) {
  XR.calibPending = { name, az, how: how || `Turn your body to face ${name}.` };
  XR.calibObj = null; XR.still = null; XR.restoring = false; XR.calibNote = ''; XR.dirty = true;
  xrSpeak(XR.calibPending.how.replace(/\.$/, ', then pull the trigger.'));
}
function finishFacing() {
  const c = XR.calibPending; if (!c) return;
  XR.theta = norm180(c.az - yawOf(headForward()));
  XR.calibHow = c.name === 'shadow' ? 'Set from your shadow' : `Set by facing ${c.name}`;
  XR.samples = []; XR.tuned = false; XR.calibPending = null; XR.calibNote = ''; XR.calibChanged = true; XR.dirty = true;
  xrSpeak(c.name === 'shadow' ? 'North is set from your shadow.' : `North is set. You are facing ${c.name.toLowerCase()}.`);
}
function shadowAz() {                    // your shadow points straight away from the Sun
  return atNow(() => { const s = altazVec(SKY.sun.v, true); return s.alt > 4 && s.alt < 65 ? norm360(s.az + 180) : null; });
}
function markTuned() {
  if (!XR.calibHow) XR.calibHow = 'Set by hand'; else if (XR.calibHow !== 'Set by hand') XR.tuned = true;
  XR.calibChanged = true; XR.restoring = false; XR.dirty = true;
}
function calibDone() {
  if (XR.calibChanged && XR.calibHow) { dropAnchor(); XR.wantAnchor = !!XR.session; XR.anchorSaved = false; XR.restoring = false; }
  XR.calibChanged = false; XR.calibPending = null; XR.calibObj = null; XR.drag = null;
  XR.screen = 'main'; XR.needPanel = true;
}
// Aiming at a real object has to use the real sky — here, this minute — even when the app is
// showing another time or place for a lesson or the tour.
function atNow(fn) {
  if (S.live && S.place.n === S.home.n) return fn();
  const t = S.time, pl = S.place;
  S.time = Date.now(); S.place = { ...S.home }; solve();
  try { return fn(); } finally { S.time = t; S.place = pl; solve(); }
}
const theName = c => c.o.kind === 'moon' ? 'the Moon' : c.name;
function startObject(o, name) {
  const e = atNow(() => enuOf(o));
  XR.calibObj = { o, name, alt: Math.asin(clamp(refract(e)[2], -1, 1)) * R2D, az: norm360(Math.atan2(e[0], e[1]) * R2D) };
  XR.calibPending = null; XR.still = null; XR.restoring = false; XR.calibNote = ''; XR.dirty = true;
  xrSpeak(`Look straight at the real ${name}. Put it in the middle of the green circle, then pull the trigger.`);
}
function meanOff(list) {                 // weighted average of directions, safe across ±180°
  let x = 0, y = 0;
  for (const s of list) { x += s.w * Math.cos(s.off * D2R); y += s.w * Math.sin(s.off * D2R); }
  return norm180(Math.atan2(y, x) * R2D);
}
// The sight is fixed in the middle of your view, so where your head points is where you looked —
// steadier than aiming a controller, and the same for hands and controllers.
function finishObject() {
  const c = XR.calibObj; if (!c) return;
  const e = atNow(() => enuOf(c.o)), A = Math.atan2(e[0], e[1]) * R2D;
  const altO = Math.asin(clamp(refract(e)[2], -1, 1)) * R2D;
  const d = headForward(), altR = Math.asin(clamp(d.y, -1, 1)) * R2D, miss = altR - altO;
  if (Math.abs(miss) > 10) {             // the headset knows "up" exactly, so a height this far off means the wrong object
    XR.calibNote = `You looked ${Math.round(Math.abs(miss))}° ${miss > 0 ? 'higher' : 'lower'} than ${theName(c)} should be, so that was something else — try again. If you are sure it was ${theName(c)}, check Star Hop's location is where you are.`;
    XR.still = null; XR.dirty = true;
    xrSpeak(`That is not where ${theName(c)} should be. Try again.`);
    return;
  }
  // high in the sky, a small slip of the head swings the compass direction a long way, so it counts for less
  const s = { label: theName(c), off: norm180(A - yawOf(d)), w: Math.cos(altO * D2R) ** 2 };
  const others = XR.samples.filter(k => k.label !== s.label);
  const gap = others.length ? Math.abs(norm180(s.off - meanOff(others))) : 0;
  XR.calibObj = null; XR.dirty = true;
  if (gap > 6 && others.length > 1) {    // two or more that agree outvote the odd one out
    XR.calibNote = `${capFirst(s.label)} came out ${Math.round(gap)}° away from ${listNames(others.map(k => k.label))}, which agree — that was probably not ${s.label}, so it is left out.`;
    xrSpeak(`That was probably not ${s.label}, so I left it out.`);
    return;
  }
  XR.calibNote = gap > 6 ? `${capFirst(s.label)} and ${others[0].label} disagree by ${Math.round(gap)}° — one of them was probably the wrong object. Using ${s.label}; line up on a third to be sure.` : '';
  XR.samples = gap > 6 ? [s] : [...others, s];
  XR.theta = meanOff(XR.samples);
  let spread = 0;
  for (const a of XR.samples) for (const b of XR.samples) spread = Math.max(spread, Math.abs(norm180(a.off - b.off)));
  const names = listNames(XR.samples.map(k => k.label));
  XR.calibHow = XR.samples.length > 1 ? `Aligned on ${names} — they agree within ${spread.toFixed(1)}°` : `Aligned on ${names}`;
  XR.tuned = false; XR.calibChanged = true;
  xrSpeak(`Aligned on ${names}.` + (c.o.kind === 'moon' ? ' The ring should now sit on the real Moon.' : ''));
}
function calibCandidates() {
  return atNow(() => {
    const out = [], sun = SKY.sunAlt;
    // Nothing near the top of the sky: there, a small slip of the head swings the direction a long way.
    const ok = (pp, lo) => pp.alt > lo && pp.alt < 70;
    const m = altazVec(SKY.moon.v, true);
    if (ok(m, 3)) out.push({ o: { id: 'moon', kind: 'moon', name: 'The Moon' }, name: 'Moon', pos: m, mag: -12 });
    // By day only the Moon shows; planets come out in twilight, the brightest stars a little later.
    if (sun < -4) for (const q of SKY.planets) { if (q.mag > 0.5) continue; const pp = altazVec(q.v, false); if (ok(pp, 5)) out.push({ o: q.obj || { id: 'planet-' + q.p.k, kind: 'planet', name: q.p.n, q }, name: q.p.n, pos: pp, mag: q.mag }); }
    if (sun < -8) for (const s of STARS) { if (s.mag > 0.9) continue; const pp = altazVec(s.vec, false); if (ok(pp, 8)) out.push({ o: s, name: s.name, pos: pp, mag: s.mag }); }
    return out.sort((a, b) => a.mag - b.mag).slice(0, 3);        // brightest first: the easiest to see through the cameras
  });
}

/* ---------- remembering north ----------
   Where the headset supports spatial anchors, north is pinned to the room: an anchor whose forward
   axis points at true north. It stays put when the headset recentres or its tracking drifts, and a
   saved one brings north back next time you start in the same spot. */
const NORTH_KEY = 'starhop.xrNorth';
function dropAnchor() { if (XR.anchor) { try { XR.anchor.delete(); } catch (e) {} XR.anchor = null; } }
function saveNorth(frame) {
  XR.wantAnchor = false;
  if (!frame.createAnchor || typeof XRRigidTransform === 'undefined') return;
  const a = XR.theta * D2R / 2, h = G.head.position, session = XR.session;
  let p;
  try { p = frame.createAnchor(new XRRigidTransform({ x: h.x, y: h.y, z: h.z }, { x: 0, y: Math.sin(a), z: 0, w: Math.cos(a) }), XR.refSpace); } catch (e) { return; }
  Promise.resolve(p).then(anchor => {
    if (!anchor) return;
    if (XR.session !== session || XR.wantAnchor) { try { anchor.delete(); } catch (e) {} return; }   // superseded
    dropAnchor(); XR.anchor = anchor;
    if (!anchor.requestPersistentHandle) return;
    const keep = tries => anchor.requestPersistentHandle().then(id => {
      let old = null;
      try { old = localStorage.getItem(NORTH_KEY); localStorage.setItem(NORTH_KEY, id); } catch (e) {}
      if (old && old !== id && session.deletePersistentAnchor) session.deletePersistentAnchor(old).catch(() => {});
      XR.anchorSaved = true; XR.dirty = true;
    }).catch(() => { if (tries) setTimeout(() => { if (XR.anchor === anchor) keep(tries - 1); }, 1500); });
    keep(2);
  }).catch(() => {});
}
function restoreNorth(session) {
  let id = null;
  try { id = localStorage.getItem(NORTH_KEY); } catch (e) {}
  if (!id || !session.restorePersistentAnchor) return false;
  XR.restoring = true; XR.dirty = true;
  let p;
  try { p = session.restorePersistentAnchor(id); } catch (e) { XR.restoring = false; return false; }
  Promise.resolve(p).then(a => {
    if (XR.session === session && XR.restoring && !XR.anchor) XR.anchor = a; else try { a.delete(); } catch (e) {}
  }).catch(() => { if (XR.session === session) { XR.restoring = false; XR.dirty = true; } });
  // somewhere new, the saved anchor is never found: stop waiting and calibrate as usual
  setTimeout(() => { if (XR.session === session && XR.restoring) { XR.restoring = false; XR.dirty = true; } }, 8000);
  return true;
}
function followAnchor(frame) {
  const a = XR.anchor;
  if (!a || (XR.screen === 'calib' && !XR.restoring)) return;      // while north is being set by hand, the hand wins
  let pose = null;
  try { if (!frame.trackedAnchors || frame.trackedAnchors.has(a)) pose = frame.getPose(a.anchorSpace, XR.refSpace); } catch (e) {}
  if (!pose) return;
  const q = pose.transform.orientation;
  XR.theta = norm180(-yawOf(new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w))));
  if (XR.restoring || !XR.calibHow) {
    XR.restoring = false; XR.calibHow = 'Remembered from last time'; XR.samples = []; XR.tuned = false;
    XR.calibChanged = false; XR.anchorSaved = true; XR.dirty = true;
    xrSpeak(XR.screen === 'calib' ? 'North is remembered from last time. Check the sky lines up, then press Done.' : 'North is remembered from last time.');
  }
}
// Recentring the headset (holding the Meta button) moves its idea of "straight ahead". If the
// browser says by how much, north turns to match; an anchor puts it right by itself; failing
// both, north has to be shown again.
function onRecenter(e) {
  const t = e && e.transform;
  if (t) {
    const q = t.orientation, dy = yawOf(new THREE.Vector3(0, 0, -1).applyQuaternion(new THREE.Quaternion(q.x, q.y, q.z, q.w)));
    XR.theta = norm180(XR.theta + dy);
    for (const s of XR.samples) s.off = norm180(s.off + dy);
  } else if (!XR.anchor && XR.calibHow) {
    XR.calibHow = null; XR.samples = []; XR.tuned = false; XR.screen = 'calib';
    XR.calibNote = 'The headset was recentred, so north was lost — please show it again.';
    xrSpeak('The headset was recentred. Show me north again.');
  }
  XR.drag = null; XR.needPanel = true; XR.dirty = true;
}

/* ---------- guidance ---------- */
function updateGuide() {
  const g = typeof guideTarget === 'function' ? guideTarget() : null;
  G.guide.visible = false; G.chev.visible = false; XR.guideText = '';
  if (!g || aiming()) return;
  const e = g.enu, alt = Math.asin(clamp(e[2], -1, 1)) * R2D, az = norm360(Math.atan2(e[0], e[1]) * R2D);
  G.guide.visible = true; G.guide.position.copy(enuToLocal(e, 89));
  const s = 4.2 + Math.sin(tClock * 3) * 0.6; G.guide.scale.set(s, s, 1);
  XR.guideText = alt > -1 ? `${g.label ? g.label + ': ' : ''}${compassLong(az)}, ${upPhrase(alt)}` : `${g.label || 'It'} is below the horizon, to the ${compassLong(az)}`;
  const w = enuToLocal(e, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), XR.theta * D2R);
  const h = w.clone().applyQuaternion(G.head.quaternion.clone().invert());
  if (h.z > -Math.cos(26 * D2R)) {                                 // outside the middle of your view: show the way
    const L = Math.hypot(h.x, h.y) || 1;
    G.chev.visible = true;
    G.chev.position.set(h.x / L * 0.2, h.y / L * 0.2, -0.75);
    G.chev.material.rotation = Math.atan2(h.y, h.x);
  }
}

/* ---------- the menu panel ---------- */
const PW = 1024, PH = 700;
let PBTN = [];
const PF = (w, px) => `${w} ${px}px Montserrat, sans-serif`;
const PT = px => `500 ${px}px "IBM Plex Mono", ui-monospace, monospace`;
function prr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function ptext(t, x, y, font, color, align) { const g = G.pctx; g.font = font; g.fillStyle = color; g.textAlign = align || 'left'; g.textBaseline = 'alphabetic'; g.fillText(t, x, y); }
function pwrap(t, maxW, font, maxLines) {
  const g = G.pctx; g.font = font; const words = String(t).split(' '), lines = []; let cur = '';
  for (const w of words) { const n = cur ? cur + ' ' + w : w; if (g.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; }
  if (cur) lines.push(cur);
  if (maxLines && lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] += '…'; }
  return lines;
}
function pbtn(id, label, x, y, w, h, o = {}) {
  const g = G.pctx, hov = XR.hoverBtn === id && !o.disabled;
  g.fillStyle = o.primary ? (hov ? '#ffd27a' : '#f4b942') : o.on ? (hov ? 'rgba(244,185,66,.34)' : 'rgba(244,185,66,.2)') : hov ? 'rgba(127,178,255,.26)' : 'rgba(255,255,255,.075)';
  prr(g, x, y, w, h, 12); g.fill();
  if (o.on || hov) { g.strokeStyle = o.on ? 'rgba(244,185,66,.7)' : 'rgba(127,178,255,.6)'; g.lineWidth = 2; g.stroke(); }
  let px = o.px || 25; g.font = PF(600, px);
  while (g.measureText(label).width > w - 24 && px > 15) { px--; g.font = PF(600, px); }
  ptext(label, x + w / 2, y + h / 2 + px * 0.36, PF(600, px), o.primary ? '#170f02' : o.disabled ? '#5a6480' : '#e9edf8', 'center');
  if (!o.disabled && o.act) PBTN.push({ id, x, y, w, h, act: o.act });
}
function pressButton(id, p) {
  const b = PBTN.find(b => b.id === id); if (!b) return;
  b.act(); XR.dirty = true;
  try { const s = p && p.src; s && s.gamepad && s.gamepad.hapticActuators && s.gamepad.hapticActuators[0] && s.gamepad.hapticActuators[0].pulse(0.4, 30); } catch (e) {}
}
const clickDom = id => { const el = $(id); if (el) { el.click(); return true; } return false; };
function teachingText() {
  let t = typeof stereoText === 'function' ? stereoText() : null;
  const pointWords = q => q.replace(/\bClick\b/g, 'Point at').replace(/\bclick\b/g, 'point at');
  if (t && S.checking) t = { title: 'Your turn', body: pointWords(S.checking.ask) };     // no "hold still" or clicking in a headset
  else if (t && S.lesson && !S.lessonDone) {
    const st = S.lesson.steps[S.step];
    t = { title: S.lesson.title, body: stripHtml(fillSay(st.sayXR || st.say)) };
  }
  if (t && S.drill && S.drill.target) t = { title: 'Find ' + S.drill.target.name, body: 'Point at it and pull the trigger.' };
  const v = $('verdict'), hint = $('hintbox');
  return { t, verdict: v && !v.hidden ? v.textContent : '', verdictOk: v && v.classList.contains('ok'), hint: hint && !hint.hidden ? hint.textContent : '' };
}
function maybeSpeakTeaching() {
  if (!(S.lesson || S.tour)) { XR.lastSpoken = ''; return; }
  const { t } = teachingText(); if (!t) return;
  const key = t.title + '|' + t.body;
  if (key !== XR.lastSpoken) { XR.lastSpoken = key; xrSpeak(t.title + '. ' + t.body); XR.dirty = true; }
}
function drawPanel() {
  XR.dirty = false; XR.lastPanel = performance.now();
  const g = G.pctx; PBTN = [];
  g.clearRect(0, 0, PW, PH);
  g.fillStyle = 'rgba(9,13,24,.94)'; prr(g, 2, 2, PW - 4, PH - 4, 26); g.fill();
  g.strokeStyle = 'rgba(244,185,66,.38)'; g.lineWidth = 3; g.stroke();
  // header: the time keeps its own typeface
  ptext('STAR HOP', 40, 58, PF(700, 22), '#f4b942');
  ptext(XR.mode === 'ar' ? 'MIXED REALITY' : 'VIRTUAL REALITY', 170, 58, PF(600, 18), '#8190b0');
  const lp = localParts(S.time, S.place.tz);
  const clock = `${pad2(lp.h)}:${pad2(lp.mi)}`;
  g.font = PT(26); const cw = g.measureText(clock).width;
  ptext(clock, PW - 40, 60, PT(26), '#e7ecf8', 'right');
  ptext(S.live && S.place.n === S.home.n ? '● LIVE' : `${lp.d} ${MONTHS[lp.mo - 1]} ${lp.y}`, PW - 52 - cw, 58, PF(600, 18), S.live ? '#ff7a5c' : '#f4b942', 'right');
  ptext(S.place.n, PW - 40, 88, PF(500, 18), '#8190b0', 'right');
  g.fillStyle = 'rgba(140,165,215,.18)'; g.fillRect(40, 104, PW - 80, 2);
  // Jump to the lesson or tour when one starts or ends; otherwise stay where the player put us.
  const tk = (S.tour ? 'tour' : '') + (S.lesson ? 'L' + S.lesson.id : '') + (S.drill ? 'drill' : '');
  if (tk !== XR.teachKey) {
    XR.teachKey = tk;
    if (XR.screen !== 'calib') XR.screen = S.tour ? 'tour' : (S.lesson || S.drill) ? 'lesson'
      : (XR.screen === 'lesson' || XR.screen === 'tour') ? 'main' : XR.screen;
  }
  ({ calib: panelCalib, main: panelMain, lessons: panelLessons, lesson: panelLesson, tour: panelTour }[XR.screen] || panelMain)();
  G.ptex.needsUpdate = true;
}
function panelCalib() {
  const ar = XR.mode === 'ar';
  ptext('Where is north?', 40, 160, PF(700, 40), '#ffffff');
  const status = XR.calibHow ? '✓ ' + XR.calibHow + (XR.tuned ? ' · fine-tuned by hand' : '') + (XR.anchorSaved && !XR.calibChanged ? ' · saved for next time' : '')
    : XR.restoring ? 'Looking for the north you set here last time…' : 'Not set yet — for now the sky assumes you started facing north.';
  pwrap(status, PW - 80, PF(500, 22), 1).forEach(l => ptext(l, 40, 200, PF(500, 22), XR.calibHow ? '#5ed39b' : '#9aa7c4'));
  if (XR.calibNote) pwrap(XR.calibNote, PW - 80, PF(500, 20), 2).forEach((l, i) => ptext(l, 40, 232 + i * 26, PF(500, 20), '#f0883e'));
  const cancel = () => pbtn('cancel', 'Cancel', PW / 2 - 110, 530, 220, 66, { act: () => { XR.calibPending = null; XR.calibObj = null; XR.still = null; } });
  if (XR.calibPending) {
    pwrap(XR.calibPending.how, PW - 80, PF(700, 34), 2).forEach((l, i) => ptext(l, PW / 2, 330 + i * 44, PF(700, 34), '#f4b942', 'center'));
    ptext('Look straight ahead, then pull the trigger — or pinch, or hold still for three seconds.', PW / 2, 440, PF(500, 22), '#dfe5f3', 'center');
    cancel(); return;
  }
  if (XR.calibObj) {
    const c = XR.calibObj;
    ptext(`Look straight at the real ${c.name}.`, PW / 2, 320, PF(700, 36), '#f4b942', 'center');
    ptext(`It is roughly ${compassLong(c.az)}, ${upPhrase(c.alt)}.`, PW / 2, 366, PF(500, 23), '#9aa7c4', 'center');
    ptext('Centre it in the green circle, then pull the trigger or pinch.', PW / 2, 420, PF(600, 24), '#dfe5f3', 'center');
    ptext('No controllers? Hold it there, still, for three seconds.', PW / 2, 456, PF(500, 21), '#9aa7c4', 'center');
    cancel(); return;
  }
  let y = 300;
  ptext('1   QUICK — FACE A DIRECTION YOU KNOW', 40, y, PF(700, 18), '#8190b0');
  const sh = ar ? shadowAz() : null, n = sh == null ? 4 : 5, bw = n === 4 ? 220 : 179, gap = n === 4 ? 21 : 12;
  [['North', 0], ['East', 90], ['South', 180], ['West', 270]].forEach(([nm, a], i) =>
    pbtn('face-' + nm, nm, 40 + i * (bw + gap), y + 14, bw, 62, { act: () => startFacing(nm, a) }));
  if (sh != null) pbtn('face-shadow', 'My shadow', 40 + 4 * (bw + gap), y + 14, bw, 62,
    { act: () => startFacing('shadow', sh, 'Turn your back to the Sun and face straight along your shadow.') });
  y += 118;
  ptext('2   PRECISE — LOOK AT THE REAL MOON OR A BRIGHT PLANET', 40, y, PF(700, 18), '#8190b0');
  if (ar) {
    const c = calibCandidates();
    if (!c.length) ptext(atNow(() => SKY.sunAlt) > -4 ? `By day only the Moon will do, and it is not up — use ${sh != null ? 'your shadow' : 'a direction'} instead.`
      : 'Nothing bright enough is up right now — use a direction instead.', 40, y + 50, PF(500, 22), '#9aa7c4');
    c.forEach((k, i) => {
      const done = XR.samples.some(s => s.label === (k.o.kind === 'moon' ? 'the Moon' : k.name));
      pbtn('obj-' + i, `${done ? '✓ ' : ''}${k.name} · ${COMPASS[Math.round(k.pos.az / 22.5) % 16]}`, 40 + i * 320, y + 14, 300, 62, { on: done, act: () => startObject(k.o, k.name) });
    });
  } else ptext('Switch to mixed reality to line up on the real Moon or a bright planet.', 40, y + 50, PF(500, 22), '#6b7799');
  y += 118;
  ptext('3   EXACT — GRAB THE SKY', 40, y, PF(700, 18), '#8190b0');
  ptext(`${XR.theta >= 0 ? '+' : ''}${XR.theta.toFixed(1)}°`, PW - 40, y + 2, PT(24), '#f4b942', 'right');
  pwrap('Hold the trigger — or pinch — on the sky and sweep sideways, dragging a drawn star onto the real one. Or nudge it with the thumbstick.', 690, PF(500, 21), 3)
    .forEach((l, i) => ptext(l, 40, y + 36 + i * 28, PF(500, 21), '#dfe5f3'));
  pbtn('done', 'Done', PW - 250, PH - 96, 210, 66, { primary: true, act: calibDone });
}
function panelMain() {
  const o = XR.info;
  if (o) {
    const d = describe(o);
    ptext(d.name, 40, 162, PF(700, 40), '#ffffff');
    ptext(d.sub, 40, 198, PF(500, 22), '#9aa7c4');
    const fact = spokenFact(o).replace(/^[^.]*\.\s*/, '');
    pwrap(fact, PW - 80, PF(400, 23), mrOff() ? 2 : 3).forEach((l, i) => ptext(l, 40, 238 + i * 31, PF(400, 23), '#dfe5f3'));
  } else {
    ptext('Point at any star and pull the trigger', 40, 166, PF(700, 34), '#ffffff');
    ptext('— or pinch with your hand — to find out what it is.', 40, 204, PF(500, 23), '#9aa7c4');
    if (!mrOff()) pwrap('Constellations light up and name themselves as you look across them. This panel follows when you turn away — squeeze the grip to call it at once.',
      PW - 80, PF(400, 22), 3).forEach((l, i) => ptext(l, 40, 250 + i * 30, PF(400, 22), '#b9c3da'));
  }
  if (mrOff()) {
    ptext('This is not the sky outside right now, so it will not line up.', 40, 326, PF(600, 21), '#f0883e');
    pbtn('now', 'Show it now', PW - 250, 290, 210, 50, { px: 21, act: () => { goLive(true); XR.dirty = true; } });
  }
  const y1 = 360;
  if (S.lesson || S.drill || S.tour) pbtn('resume', S.tour ? 'Back to the tour' : 'Back to the lesson', 40, y1, 300, 70, { primary: true, act: () => { XR.screen = S.tour ? 'tour' : 'lesson'; } });
  else pbtn('lessons', 'Lessons', 40, y1, 300, 70, { primary: true, act: () => { XR.screen = 'lessons'; } });
  pbtn('tour', "Tonight's tour", 362, y1, 300, 70, { act: () => { startTour(); XR.screen = 'tour'; } });
  pbtn('calib', 'Calibrate north', 684, y1, 300, 70, { act: () => { XR.screen = 'calib'; } });
  const y2 = 452, w = 179;
  pbtn('art', 'Art', 40, y2, w, 62, { on: XR.art, act: () => { XR.art = !XR.art; } });
  pbtn('labels', 'Labels', 40 + (w + 12), y2, w, 62, { on: XR.labels, act: () => { XR.labels = !XR.labels; } });
  pbtn('lines', 'Lines', 40 + 2 * (w + 12), y2, w, 62, { on: XR.lines, act: () => { XR.lines = !XR.lines; } });
  pbtn('below', 'Below ground', 40 + 3 * (w + 12), y2, w, 62, { on: XR.below, act: () => { XR.below = !XR.below; } });
  pbtn('voice', 'Voice', 40 + 4 * (w + 12), y2, w, 62, { on: XR.voice, act: () => { XR.voice = !XR.voice; if (!XR.voice) try { speechSynthesis.cancel(); } catch (e) {} } });
  const y3 = 540;
  if (XR.mode === 'ar') {
    ptext('STAR BRIGHTNESS', 40, y3 + 18, PF(700, 16), '#8190b0');
    [[1.45, 'Normal'], [2.2, 'Bright'], [3.2, 'Bold']].forEach(([v, t], i) => pbtn('boost' + i, t, 40 + i * 118, y3 + 30, 108, 56, { px: 22, on: XR.boost === v, act: () => { XR.boost = v; } }));
    ptext('STARS SHOWN', 420, y3 + 18, PF(700, 16), '#8190b0');
    [[3.2, 'Bright'], [4.8, 'More'], [6.0, 'All']].forEach(([v, t], i) => pbtn('lim' + i, t, 420 + i * 118, y3 + 30, 108, 56, { px: 22, on: XR.mrLimit === v, act: () => { XR.mrLimit = v; } }));
  }
  pbtn('exit', 'Exit', PW - 190, y3 + 30, 150, 56, { px: 22, act: exitXR });
}
function mrOff() { return XR.mode === 'ar' && !(S.live && S.place.n === S.home.n); }
function panelLessons() {
  ptext('Lessons', 40, 160, PF(700, 40), '#ffffff');
  let unlocked = true, i = 0;
  const cols = 3, bw = 304, bh = 44, gap = 12;
  for (const l of ALL_LESSONS) {
    const done = !!S.done[l.id], open = done || unlocked;
    if (!done && unlocked) unlocked = false;
    const x = 40 + (i % cols) * (bw + gap), y = 176 + Math.floor(i / cols) * (bh + 8);
    const num = lessonNumber(l);
    pbtn('les-' + l.id, `${done ? '✓ ' : l.checkpoint ? '◆ ' : num + '. '}${l.title}`, x, y, bw, bh, { px: 17, on: done, disabled: !open,
      act: () => { startLesson(l.id); XR.screen = 'lesson'; } });
    i++;
  }
  pbtn('back', 'Back', 40, PH - 84, 180, 58, { px: 22, act: () => { XR.screen = 'main'; } });
}
function panelLesson() {
  const { t, verdict, verdictOk, hint } = teachingText();
  if (!t) { XR.screen = 'main'; return; }
  if (S.lesson && S.lessonDone) { panelLessonDone(); return; }
  ptext(t.title, 40, 160, PF(700, 36), '#ffffff');
  const lines = pwrap(t.body, PW - 80, PF(400, 25), 7);
  lines.forEach((l, i) => ptext(l, 40, 206 + i * 34, PF(400, 25), '#e1e7f4'));
  let y = 206 + lines.length * 34 + 10;
  if (verdict) { pwrap(verdict, PW - 80, PF(600, 23), 2).forEach(l => { ptext(l, 40, y, PF(600, 23), verdictOk ? '#5ed39b' : '#f0883e'); y += 30; }); }
  if (hint && !verdictOk) { pwrap('Hint: ' + hint, PW - 80, PF(500, 21), 2).forEach(l => { ptext(l, 40, y, PF(500, 21), '#9aa7c4'); y += 28; }); }
  if (XR.guideText && !S.awaiting) ptext('→ ' + XR.guideText, 40, Math.max(y + 6, 520), PF(600, 22), '#5ed39b');
  const by = PH - 98;
  if (S.drill) {
    pbtn('d-skip', 'Show me', 40, by, 220, 66, { act: () => clickDom('d-skip') });
    pbtn('d-exit', 'Stop practising', PW - 300, by, 260, 66, { act: () => { clickDom('d-exit'); XR.screen = 'main'; } });
    return;
  }
  if (S.checking) {
    const ch = S.checking;
    if (ch.kind === 'choice') {
      const opts = document.querySelectorAll('#pane-course .opt');
      ch.options.forEach((o, i) => pbtn('opt' + i, o.text, 40, 330 + i * 76, PW - 80, 64, { px: 23,
        on: opts[i] && opts[i].classList.contains('right'), act: () => { const b = document.querySelectorAll('#pane-course .opt')[i]; if (b) b.click(); } }));
    } else if (ch.kind === 'look') {
      ptext('Turn your head and body — the app is watching which way you look.', 40, by - 20, PF(600, 21), '#f4b942');
      pbtn('hint', 'Hint', 40, by, 150, 66, { act: () => clickDom('l-hint') });
    } else {
      ptext('Point at it and pull the trigger.', 40, by - 20, PF(600, 22), '#f4b942');
      pbtn('show', 'Show me', 40, by, 200, 66, { act: () => clickDom('l-show') });
      pbtn('hint', 'Hint', 256, by, 150, 66, { act: () => clickDom('l-hint') });
    }
    pbtn('back', 'Back to the lesson', PW - 340, by, 300, 66, { act: () => clickDom('l-back') });
    return;
  }
  pbtn('prev', 'Back', 40, by, 170, 66, { disabled: S.step === 0, act: () => clickDom('l-prev') });
  const last = S.lesson && S.step === S.lesson.steps.length - 1;
  pbtn('next', last ? 'Try it yourself' : 'Next', 226, by, 300, 66, { primary: true, act: () => clickDom('l-next') || clickDom('l-check') });
  pbtn('menu', 'Menu', PW - 440, by, 170, 66, { act: () => { XR.screen = 'main'; } });
  pbtn('exitl', 'All lessons', PW - 250, by, 210, 66, { act: () => { clickDom('l-exit'); XR.screen = 'lessons'; } });
}
function panelLessonDone() {
  const L = S.lesson, by = PH - 98;
  ptext(L.checkpoint ? 'CHECKPOINT PASSED' : 'LESSON COMPLETE', 40, 148, PF(700, 18), '#5ed39b');
  ptext(L.title, 40, 192, PF(700, 36), '#ffffff');
  let y = 242;
  for (const r of L.recap || []) {
    if (y > by - 60) break;
    pwrap(r, PW - 114, PF(400, 23), 3).forEach((l, i) => { if (!i) ptext('•', 46, y, PF(700, 23), '#f4b942'); ptext(l, 74, y, PF(400, 23), '#e1e7f4'); y += 31; });
    y += 6;
  }
  if (L.tonight && y < by - 50) pwrap('Try this tonight: ' + L.tonight, PW - 80, PF(600, 21), 2).forEach(l => { ptext(l, 40, y + 6, PF(600, 21), '#f4b942'); y += 28; });
  const hasNext = !!$('l-next2');
  if (hasNext) pbtn('next2', 'Next lesson', 40, by, 300, 66, { primary: true, act: () => clickDom('l-next2') });
  pbtn('list', 'All lessons', hasNext ? 360 : 40, by, 240, 66, { primary: !hasNext, act: () => { clickDom('l-list'); XR.screen = 'lessons'; } });
}
function panelTour() {
  const { t } = teachingText();
  if (!t || !S.tour) { XR.screen = 'main'; return; }
  ptext(t.title, 40, 160, PF(700, 38), '#ffffff');
  ptext(`Stop ${S.tour.i + 1} of ${S.tour.stops.length}`, PW - 40, 160, PF(600, 20), '#8190b0', 'right');
  const lines = pwrap(t.body, PW - 80, PF(400, 25), 7);
  lines.forEach((l, i) => ptext(l, 40, 208 + i * 34, PF(400, 25), '#e1e7f4'));
  if (XR.guideText) ptext('→ ' + XR.guideText, 40, 208 + lines.length * 34 + 18, PF(600, 22), '#5ed39b');
  const by = PH - 98, last = S.tour.i === S.tour.stops.length - 1;
  pbtn('tprev', 'Back', 40, by, 170, 66, { disabled: S.tour.i === 0, act: () => clickDom('t-prev') });
  pbtn('tnext', last ? 'Finish' : 'Next stop', 226, by, 300, 66, { primary: true, act: () => { if (!clickDom('t-next')) { clickDom('t-done'); XR.screen = 'main'; } } });
  pbtn('tmenu', 'Menu', PW - 400, by, 150, 66, { act: () => { XR.screen = 'main'; } });
  pbtn('tend', 'End tour', PW - 230, by, 190, 66, { act: () => { endTour(); XR.screen = 'main'; } });
}

function xrSpeak(text) {
  if (!XR.voice || !window.speechSynthesis || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(stripHtml(text)); u.lang = 'en';
    setTimeout(() => { try { speechSynthesis.speak(u); } catch (e) {} }, 60);
  } catch (e) {}
}

/* ---------- wiring on the ordinary page ---------- */
$('btn-xr').onclick = openXrChooser;
$('xrexit').onclick = exitXR;
xrDetect();

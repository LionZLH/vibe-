/* 一 · 1950：图灵肖像（2.5D + 空气尘埃）→ Mind 原文页（镜头贴纸面掠过，琥珀荧光）→ 模仿游戏：平面图长成 3D 模型
   → 电传纸走纸打出论文里的示范问答 → ENIAC 机房（2.5D）→ 甩回时间轴 */
import { THREE, scene, CAM, G, plane, depthPhoto, loadTex, canvasTex } from '../gl.js';
import { F } from '../film.js';
import { tl, c, ce, cw, COL, el, hidden, letters, typeOn, seg, lerp, clamp, E, track, hash, shot, sfx } from '../core.js';
import { X, spineState, glow } from '../spine.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const O = new THREE.Vector3(-3000, 0, 0);   // 这一章的场景放在远处，免得和时间轴穿帮
const grp = new THREE.Group(); grp.position.copy(O); scene.add(grp);
const W3 = (x, y, z) => new THREE.Vector3(O.x + x, O.y + y, O.z + z);
const pose = (p, t, fov = 35, roll = 0) => ({ x: p.x, y: p.y, z: p.z, tx: t.x, ty: t.y, tz: t.z, fov, roll });
const mixP = (a, b, k) => { const o = {}; for (const key in a) o[key] = lerp(a[key], b[key], k); return o; };
const tA1 = c('a1'), tA2 = c('a2'), tA3 = c('a3'), tA4 = c('a4'), tA5 = c('a5'), tA6 = c('a6');

/* ---------------- 空气尘埃（投影灯光里的浮尘，靠景深虚成光斑） ---------------- */
function motes(n, box, seedK) {
  const p = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) base.push([hash(i * 1.3 + seedK) * box[0] - box[0] / 2, hash(i * 2.9 + seedK) * box[1] - box[1] / 2, hash(i * 4.7 + seedK) * box[2] - box[2] / 2, hash(i * 6.1 + seedK)]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.ShaderMaterial({ uniforms: { uOp: { value: 1 } },
    vertexShader: `varying float vS; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = 1.7 * (60. / -mv.z); vS = 1.; }`,
    fragmentShader: `uniform float uOp; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; float a = smoothstep(.5, .0, d); gl_FragColor = vec4(vec3(1.15, 1.08, .95) * a, a * .35 * uOp); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 9;
  pts.userData.step = t => { for (let i = 0; i < n; i++) { const [x, y, z, s] = base[i]; p[i * 3] = x + Math.sin(t * .23 + s * 40) * .6 + t * .05 * (s - .5); p[i * 3 + 1] = y + ((t * .08 * (.3 + s)) % box[1]) - (y + t * .08 * (.3 + s) > box[1] / 2 ? box[1] : 0); p[i * 3 + 2] = z + Math.cos(t * .19 + s * 30) * .4; } g.attributes.position.needsUpdate = true; };
  return pts;
}

/* ================= 图灵肖像 ================= */
const tur = depthPhoto(await loadTex('素材/图/turing1951.jpg'), await loadTex('素材/图/turing1951_depth.png', false), 8, 10.67, { depth: 1.6, edge: .05, sat: 0, tint: [1.04, 1, .93] });
grp.add(tur);
const turMotes = motes(260, [9, 11, 6], 1); turMotes.position.set(0, 0, 3.4); grp.add(turMotes);
const name = el(null, 'position:absolute;left:210px;top:418px;width:640px');
const ln = el(name, `position:absolute;left:0;top:-34px;width:120px;height:3px;background:${COL.amber};transform-origin:0 50%`); gsap.set(ln, { scaleX: 0 });
const nm = el(name, `position:relative;font:600 70px/1.05 EBGaramond;letter-spacing:8px;color:${COL.white};white-space:nowrap`, '', { 'data-chk': 'text' });
const nd = el(name, `position:relative;margin-top:26px;font:700 36px/1 JBM;color:${COL.amber};letter-spacing:2px;height:36px`, '', { 'data-chk': 'text' });
const nc = el(name, `position:relative;margin-top:22px;font:500 28px/1.3 JBM;color:${COL.mute};height:36px`, '', { 'data-chk': 'text' });
const tName = cw('a1', '图灵') - .25;
tl.to(ln, { scaleX: 1, duration: .7, ease: 'expo.out' }, tName - .15);
letters(nm, 'ALAN TURING', tName, .04, .7);
typeOn(nd, '1912 — 1954', tName + .5, 30, false);
typeOn(nc, '摄于 1951 年 · Elliott & Fry', cw('a1', '论文') - .2, 40, false);
tl.to(name, { opacity: 0, x: -40, duration: .4, ease: 'power2.in' }, tA2 - .45);

/* ================= Mind 1950 原文页（按原刊版式重排，文字为原文） ================= */
const PW = 1700, PH = 2400, M = 150;
const marks = {};
const pageTex = canvasTex(PW, PH, (g) => {
  g.fillStyle = '#ece5d3'; g.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 12000; i++) { const x = hash(i * 1.3) * PW, y = hash(i * 2.7) * PH, a = hash(i * 3.1) * .045; g.fillStyle = `rgba(120,95,60,${a})`; g.fillRect(x, y, 1 + hash(i) * 3, 1 + hash(i * 5) * 3); }
  const grd = g.createRadialGradient(PW / 2, PH * .45, PH * .25, PW / 2, PH / 2, PH * .8); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(110,80,40,.25)'); g.fillStyle = grd; g.fillRect(0, 0, PW, PH);
  g.fillStyle = '#1b1612'; g.textBaseline = 'alphabetic';
  const ctr = (s, y, font, ls = 0) => { g.font = font; g.letterSpacing = ls + 'px'; g.textAlign = 'center'; g.fillText(s, PW / 2, y); g.letterSpacing = '0px'; };
  g.font = '500 40px EBGaramond'; g.textAlign = 'left'; g.fillText('VOL. LIX. NO. 236.]', M, 190); g.textAlign = 'right'; g.fillText('[October, 1950', PW - M, 190);
  ctr('M I N D', 330, '600 112px EBGaramond', 30);
  ctr('A QUARTERLY REVIEW', 420, '500 44px EBGaramond', 8);
  ctr('OF', 482, '500 34px EBGaramond', 6);
  ctr('PSYCHOLOGY AND PHILOSOPHY', 546, '500 44px EBGaramond', 8);
  g.fillRect(PW / 2 - 70, 600, 140, 2);
  ctr('I.—COMPUTING MACHINERY AND', 700, '600 54px EBGaramond', 3);
  ctr('INTELLIGENCE', 774, '600 54px EBGaramond', 3);
  ctr('BY A. M. TURING', 852, '500 38px EBGaramond', 5);
  g.textAlign = 'left'; g.font = 'italic 500 48px EBGaramond'; g.fillText('1. The Imitation Game.', PW / 2 - 230, 950);
  const text = "I PROPOSE to consider the question, {q:'Can machines think?'} This should begin with {d:definitions of the meaning of the terms 'machine' and 'think'.} The definitions might be framed so as to reflect so far as possible the normal use of the words, but this attitude is dangerous. If the meaning of the words 'machine' and 'think' are to be found by examining how they are commonly used it is difficult to escape the conclusion that the meaning and the answer to the question, 'Can machines think?' is to be sought in a statistical survey such as a Gallup poll. But this is absurd. Instead of attempting such a definition {r:I shall replace the question by another,} which is closely related to it and is expressed in relatively unambiguous words.";
  const words = []; text.replace(/\{(\w):([^}]+)\}|(\S+)/g, (m, tag, inner, w) => { if (tag) inner.split(' ').forEach(x => words.push([x, tag])); else words.push([w, null]); });
  g.font = '500 47px EBGaramond'; const sp = g.measureText(' ').width, LH = 70, Wd = PW - 2 * M; let y = 1040, line = [];
  const flush = last => {
    const wsum = line.reduce((s, [w]) => s + g.measureText(w).width, 0), indent = y === 1040 ? 50 : 0;
    const gap = last ? sp : (Wd - indent - wsum) / (line.length - 1); let x = M + indent;
    line.forEach(([w, tag], k) => {
      const ww = g.measureText(w).width; g.fillText(w, x, y);
      if (tag) { const r = (marks[tag] = marks[tag] || []), b = r.find(q => q.y === y); const x1 = x + ww; if (b) b.x1 = x1; else r.push({ x0: x, x1, y }); }
      x += ww + gap;
    });
    y += LH; line = [];
  };
  let cur = 0; words.forEach(wd => { const ww = g.measureText(wd[0]).width; if (line.length && cur + sp + ww > Wd - (y === 1040 ? 50 : 0)) { flush(false); cur = 0; } cur += (line.length ? sp : 0) + ww; line.push(wd); });
  flush(true);
});
const PWW = 8, PHW = PWW * PH / PW, px = PWW / PW;
const paper = new THREE.Group(); grp.add(paper);
const page = plane(pageTex, PWW, PHW, { depthWrite: true, sat: .35, bright: 1.02 }); page.renderOrder = 2; paper.add(page);
const toLocal = (x, y) => [(x - PW / 2) * px, (PH / 2 - y) * px];
const hiMat = op => new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, .66, .16), transparent: true, opacity: op, depthWrite: false });
const strip = (r, h, yoff, mat) => { const [x0, y0] = toLocal(r.x0 - 8, r.y + yoff); const w = (r.x1 - r.x0 + 16) * px; const m = new THREE.Mesh(new THREE.PlaneGeometry(1, h * px), mat); m.geometry.translate(.5, 0, 0); m.position.set(x0, y0, .006); m.scale.x = w; m.userData.w = w; m.renderOrder = 3; paper.add(m); return m; };
/* 荧光用「正片叠底」的效果：在白纸上叠半透明琥珀；字是深色，压上去仍然清楚 */
const hiQ = marks.q.map(r => strip(r, 60, -15, hiMat(.42)));
const strike = marks.d.map(r => strip(r, 6, -16, hiMat(.95)));
const hiR = marks.r.map(r => strip(r, 60, -15, hiMat(.42)));
const reveal = (arr, k) => { const tot = arr.reduce((s, m) => s + m.userData.w, 0); let acc = 0; arr.forEach(m => { const a = clamp((k * tot - acc) / m.userData.w); m.visible = a > .001; m.scale.x = Math.max(.0001, m.userData.w * a); acc += m.userData.w; }); };
const mid = (r, dx = 0, dy = 0) => new THREE.Vector3(((r.x0 + r.x1) / 2 + dx - PW / 2) * px, (PH / 2 - r.y + 14 + dy) * px, 0);
const pMotes = motes(200, [10, 12, 8], 2); grp.add(pMotes);

/* ================= 模仿游戏：平面图 → 3D 模型 ================= */
const game = new THREE.Group(); game.position.set(80, 0, 0); grp.add(game);
const floorTex = canvasTex(2400, 1440, (g, w, h) => {
  g.fillStyle = '#e7dfcc'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 16000; i++) { g.fillStyle = `rgba(110,85,55,${hash(i * 3.3) * .05})`; g.fillRect(hash(i * 1.1) * w, hash(i * 2.2) * h, 2, 2); }
  g.strokeStyle = 'rgba(40,32,24,.08)'; g.lineWidth = 2; for (let x = 0; x <= w; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
});
const floor = plane(floorTex, 40, 24, { depthWrite: true, sat: .3 }); floor.rotation.x = -Math.PI / 2; floor.renderOrder = -2; game.add(floor);
const lineMat = (col, w) => { const m = new LineMaterial({ color: col, linewidth: w, transparent: true, depthWrite: false, worldUnits: false }); m.resolution.set(1920, 1080); return m; };
/* 房间：C 在左，A、B 在右（论文：考官在另一个房间） */
const R1 = [-15, -6.5, -3.5, 6.5], R2 = [1.5, -6.5, 16, 6.5], HW = 4.2;
const wallMat = lineMat(0x1b1612, 3.2);
function roomLines(r, gapZ) {   // 地面轮廓 + 竖边 + 顶边；gapZ：墙上给电线留的口
  const [x0, z0, x1, z1] = r, s = [];
  const rect = y => [[x0, y, z0, x1, y, z0], [x1, y, z0, x1, y, z1], [x1, y, z1, x0, y, z1], [x0, y, z1, x0, y, z0]];
  s.push(...rect(0), ...rect(HW)); [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].forEach(([x, z]) => s.push([x, 0, z, x, HW, z]));
  return s;
}
const segs = [...roomLines(R1), ...roomLines(R2)];
const wallGeo = new LineSegmentsGeometry(); wallGeo.setPositions(segs.flat());
const walls = new LineSegments2(wallGeo, wallMat); game.add(walls);
const wallFill = new THREE.Group(); game.add(wallFill);
for (const r of [R1, R2]) {   // 半透明墙面
  const [x0, z0, x1, z1] = r, fm = new THREE.MeshBasicMaterial({ color: 0xf3ecdc, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false });
  [[x0, z0, x1, z0], [x1, z0, x1, z1], [x1, z1, x0, z1], [x0, z1, x0, z0]].forEach(([a, b, c2, d]) => { const len = Math.hypot(c2 - a, d - b); const m = new THREE.Mesh(new THREE.PlaneGeometry(len, HW), fm); m.position.set((a + c2) / 2, HW / 2, (b + d) / 2); m.rotation.y = -Math.atan2(d - b, c2 - a); m.renderOrder = 6; wallFill.add(m); });
}
/* 电传线（琥珀）：C → 两墙 → A / B */
const wirePts = [[-9.2, .5, 0], [8.2, .5, 0]];
const wireGeo = new LineSegmentsGeometry(); wireGeo.setPositions([...wirePts[0], ...wirePts[1]]);
const wireMat = lineMat(0xf2b33d, 4); const wire = new LineSegments2(wireGeo, wireMat); game.add(wire);
const pulses = [0, 1, 2, 3, 4].map(() => glow(0, .5, 0, 1.6, game));
/* 字母（思源宋体，立着，始终朝向镜头） */
const letterSprite = (ch, sub, size = 4.2) => {
  const gtx = canvasTex(512, 640, (g, w, h) => { g.font = '900 380px SourceHanSerif'; g.fillStyle = '#1b1612'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, w / 2, 230); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gtx, transparent: true, depthWrite: false })); s.scale.set(size * .8, size, 1); s.center.set(.5, .15);
  return s;
};
const subSprite = () => { const cv = document.createElement('canvas'); cv.width = 640; cv.height = 160; const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false })); s.scale.set(6.4, 1.6, 1); s.center.set(.5, 1);
  s.userData.set = (txt, col = '#5b5247') => { if (s.userData.cur === txt + col) return; s.userData.cur = txt + col; const g = cv.getContext('2d'); g.clearRect(0, 0, 640, 160); g.font = '700 96px PuHuiTi'; g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 320, 84); tx.needsUpdate = true; };
  return s; };
const mk = (ch, x, z) => { const L = letterSprite(ch), S = subSprite(); L.renderOrder = S.renderOrder = 8; L.material.depthTest = S.material.depthTest = false; /* 字母和标签浮在墙面之上，不被半透明墙压住 */ const g0 = new THREE.Group(); g0.add(L); S.position.y = -.05; g0.add(S); g0.position.set(x, 1.9, z); game.add(g0); return { g: g0, L, S }; };
const LC = mk('C', -9.2, 0), LA = mk('A', 5.2, 0), LB = mk('B', 12.2, 0);
LC.S.userData.set('提问的人');

/* ================= 电传纸：示范问答（原文） ================= */
const TW = 1700, TH = 2600;
const tapeCv = document.createElement('canvas'); tapeCv.width = TW; tapeCv.height = TH; const tg = tapeCv.getContext('2d');
const tapeTex = new THREE.CanvasTexture(tapeCv); tapeTex.colorSpace = THREE.SRGBColorSpace; tapeTex.anisotropy = 8;
const QA = [['Q:', 'Please write me a sonnet on the subject of the Forth Bridge.'], ['A:', 'Count me out on this one. I never could write poetry.'], ['Q:', 'Add 34957 to 70764.'], ['A:', '(Pause about 30 seconds and then give as answer) 105621.']];
const TL = { x: 150, y0: 700, lh: 92, fs: 62, wrap: 38 };
const lay = []; { let y = TL.y0; QA.forEach(([q, s], k) => { const ws = s.split(' '), rows = []; let r = ''; ws.forEach(w => { if ((r + ' ' + w).trim().length > TL.wrap) { rows.push(r.trim()); r = w; } else r += ' ' + w; }); rows.push(r.trim()); lay.push({ q, rows, y }); y += rows.length * TL.lh + (k % 2 ? 70 : 24); }); }
let lastTape = '';
function drawTape(nChars, note) {
  const key = nChars + '|' + note.toFixed(2); if (key === lastTape) return; lastTape = key;
  tg.fillStyle = '#efe8d6'; tg.fillRect(0, 0, TW, TH);
  for (let i = 0; i < 6000; i++) { tg.fillStyle = `rgba(110,85,55,${hash(i * 7.7) * .05})`; tg.fillRect(hash(i * 1.9) * TW, hash(i * 3.7) * TH, 2, 2); }
  for (let y = 20; y < TH; y += 46) { tg.fillStyle = 'rgba(60,48,36,.22)'; tg.beginPath(); tg.arc(46, y, 9, 0, 7); tg.fill(); tg.beginPath(); tg.arc(TW - 46, y, 9, 0, 7); tg.fill(); }
  let left = nChars, caret = nChars === 0 ? [TL.x + 130, lay[0].y] : null;
  lay.forEach(({ q, rows, y }) => {
    tg.font = `700 ${TL.fs}px CourierPrime`; tg.fillStyle = q === 'A:' ? '#9a5e05' : '#1b1612'; if (left > 0) tg.fillText(q, TL.x, y);
    tg.font = `400 ${TL.fs}px CourierPrime`; tg.fillStyle = '#1b1612';
    rows.forEach((r, i) => { const k = Math.max(0, Math.min(r.length, left)); if (k > 0 || left > 0) tg.fillText(r.slice(0, k), TL.x + 130, y + i * TL.lh); if (left > 0 && k < r.length) caret = [TL.x + 130 + tg.measureText(r.slice(0, k)).width, y + i * TL.lh]; left -= r.length; if (left <= 0 && !caret) caret = [TL.x + 130 + tg.measureText(r).width, y + i * TL.lh]; });
  });
  if (!caret) caret = [TL.x + 130, lay[0].y];
  if (note <= 0) { tg.fillStyle = '#9a5e05'; tg.fillRect(caret[0] + 6, caret[1] - TL.fs * .78, TL.fs * .55, TL.fs * .95); }
  if (note > 0) {   // 105621 下划线 + 批注
    const L4 = lay[3], r = L4.rows[L4.rows.length - 1]; tg.font = `400 ${TL.fs}px CourierPrime`;
    const x1 = TL.x + 130 + tg.measureText(r.replace(/\.$/, '')).width, x0 = x1 - tg.measureText('105621').width, y = L4.y + (L4.rows.length - 1) * TL.lh + 16;
    tg.fillStyle = '#e09a1e'; tg.fillRect(x0, y, (x1 - x0) * Math.min(1, note * 2), 7);
    if (note > .4) { tg.globalAlpha = Math.min(1, (note - .4) * 3); tg.font = '700 58px JBM'; tg.fillStyle = '#b8700a'; tg.fillText('34957 + 70764 = 105721', x0 - 330, y + 110); tg.globalAlpha = 1; }
  }
  tapeTex.needsUpdate = true;
}
const totalChars = lay.reduce((s, l) => s + l.rows.join('').length, 0);
const tape = plane(tapeTex, 10.6, 10.6 * TH / TW, { depthWrite: true, sat: .35 }); tape.position.set(170, 0, 0); grp.add(tape);
const tTape = ce('a4') + .25;
const charT = []; { let t0 = tTape + .35; lay.forEach((l, k) => { if (k === 3) t0 += .9; const n = l.rows.join('').length; charT.push([t0, n, k === 3 ? 30 : 34]); t0 += n / (k === 3 ? 30 : 34) + .3; }); }
const tNote = charT[3][0] + charT[3][1] / charT[3][2] + .25;
const charsAt = t => { let s = 0; for (const [t0, n, cps] of charT) s += clamp(Math.floor((t - t0) * cps), 0, n); return s; };
/* 正在打的那一行在纸上的高度（纸的本地坐标） */
const lineY = t => { const n = charsAt(t); let y = TL.y0, acc = 0; lay.forEach(l => l.rows.forEach((r, i) => { if (acc < Math.max(1, n)) y = l.y + i * TL.lh; acc += r.length; })); return (TH / 2 - y) * (10.6 / TW); };

/* ================= ENIAC 机房（2.5D） ================= */
const eni = depthPhoto(await loadTex('素材/图/eniac_room.jpg'), await loadTex('素材/图/eniac_room_depth.png', false), 13.4, 10.24, { depth: 4.2, edge: .015, sat: 0, tint: [1.04, 1, .93] });
eni.position.set(260, 0, 0); grp.add(eni);
const eMotes = motes(220, [12, 9, 6], 3); eMotes.position.set(260, 0, 2.5); grp.add(eMotes);
const tE = tA6 - .15;
const shade = el(null, 'position:absolute;left:0;top:0;width:1150px;height:1080px;background:linear-gradient(90deg,rgba(8,7,6,.9) 0%,rgba(8,7,6,.72) 42%,rgba(8,7,6,0) 100%)'); hidden(shade);
const data = el(null, 'position:absolute;left:150px;top:250px;width:640px');
const dT = el(data, `position:relative;font:700 36px/1 JBM;color:${COL.amber};letter-spacing:3px;margin-bottom:40px;height:36px`, '', { 'data-chk': 'text' });
const dRows = [['27', '吨', '重量'], ['167', 'm²', '占地'], ['17,468', '根', '真空管']].map(([n, u, lab]) => {
  const r = el(data, `position:relative;display:flex;align-items:baseline;gap:18px;padding:14px 0 16px;border-top:1px solid rgba(244,239,230,.18)`);
  el(r, `position:relative;width:150px;font:500 30px/1 PuHuiTi;color:${COL.mute}`, lab, { 'data-chk': 'text' });
  el(r, `position:relative;font:900 92px/1 SourceHanSerif;color:${COL.white}`, n, { 'data-chk': 'text' });
  el(r, `position:relative;font:700 36px/1 PuHuiTi;color:#cfc6b8`, u, { 'data-chk': 'text' });
  hidden(r); return r;
});
const dC = el(data, `position:relative;margin-top:26px;font:500 28px/1.3 JBM;color:${COL.mute}`, '照片：美国陆军弹道研究实验室', { 'data-chk': 'text' }); hidden(dC);
tl.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: .6, immediateRender: false }, tE + .4);
typeOn(dT, 'ENIAC · 1946', tE + .6, 26, false);
dRows.forEach((r, k) => tl.fromTo(r, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: .55, ease: 'expo.out', immediateRender: false }, cw('a6', '屈指可数') + k * .4));
tl.fromTo(dC, { opacity: 0 }, { opacity: 1, duration: .4, immediateRender: false }, cw('a6', '屈指可数') + 1.4);
const tOut = ce('a6') + 1.3;
tl.to([shade, data], { opacity: 0, duration: .25 }, tOut);
/* 片尾：甩回时间轴，年份滚到 1955 */
const hud2 = el(null, `position:absolute;left:96px;top:58px;display:flex;align-items:center;gap:14px;font:700 40px/1 JBM;color:${COL.white};letter-spacing:3px`, '', { 'data-chk': 'text' });
el(hud2, `position:relative;width:12px;height:12px;border-radius:50%;background:${COL.amber};box-shadow:0 0 12px ${COL.amber}`);
const hud2Y = el(hud2, 'position:relative;font-variant-numeric:tabular-nums', '1950'); hidden(hud2);

const camEnd = track([[tOut + .3, X(1950)], [tOut + 1.7, X(1955)]]);

/* ================= 每帧 ================= */
const tQ = cw('a2', '机器能思考吗'), tS = cw('a3', '空谈'), tR = cw('a3', '设计');
const tG0 = tA4 - .3, tSwap = cw('a4', '人机') - .15;
/* 音效 */
sfx(tA2 - .55, 'paper', { g: .8 }); sfx(tQ + .05, 'marker'); sfx(tS, 'marker', { g: .7 }); sfx(tR, 'marker');
sfx(tG0 - .9, 'whoosh', { d: 1, g: .6 }); sfx(tG0 + .4, 'thud', { g: .5 }); [0, 1, 2].forEach(k => sfx(tSwap + k * .42, 'tick', { g: .35, f: 900 }));
sfx(tTape - .7, 'whoosh', { d: .8, g: .6 });
charT.forEach(([t0, n, cps]) => { for (let i = 0; i < n; i++) sfx(t0 + i / cps, 'teletype', { g: .38 }); sfx(t0 + n / cps + .05, 'bell', { g: .25 }); });
sfx(tNote, 'marker'); sfx(tE, 'flash', { g: .6 }); sfx(tE, 'hum', { d: tOut - tE + .3, g: .35 }); sfx(tOut - .2, 'whip', { g: .8 });
shot({ name: 'turing', t0: tA1 - .02, t1: c('b1') - 2.65, look(t) {
  spineState({ on: t > tOut + .3, labels: 1, axis: 1, lanes: 1, ice: [0, 0], cut: 0, cutLabel: 0, head: 0, origin: 1 });
  grp.visible = t < tOut + .3;
  tur.visible = turMotes.visible = t < tA2 + 1.2;
  paper.visible = pMotes.visible = t >= tA2 - .45 && t < tG0;
  game.visible = t >= tG0 && t < tTape;
  tape.visible = t >= tTape && t < tE;
  eni.visible = eMotes.visible = t >= tE;
  [turMotes, pMotes, eMotes].forEach(m => m.visible && m.userData.step(t));
  /* 银盐：图像本身去色；全局不去色，琥珀标注保留颜色 */
  G.sat = 1; G.tint = [1.03, 1.0, .95]; G.scurve = .4; G.bloom = .45; G.streak = .35; G.bg = [.022, .019, .016];
  F.grain = .55; F.flicker = .4; F.scratch = .4; F.weave = 2.2; F.vig = .62;
  G.flash = .9 * (1 - E.o3(seg(t, tA1 - .02, tA1 + .55)));
  let cam;
  if (t < tA2 - .45) {
    /* a1：肖像慢推 + 横移出视差 */
    const k = E.io2(seg(t, tA1 - .2, tA2 + .2));
    cam = pose(W3(lerp(-4.3, -2.2, k), lerp(.25, .55, k), lerp(17.6, 14.4, k)), W3(lerp(-3.1, -2.55, k), lerp(.3, .55, k), 0));
    G.focus = cam.z - O.z - 1.2; G.aperture = .0016; G.maxblur = .008;
  } else if (t < tG0) {
    /* a2–a3：原文页从下方滑入，镜头贴着纸面掠过 → 推到问句 → 删除线 → 新问题 */
    const kIn = E.o5(seg(t, tA2 - .55, tA2 + .75));
    paper.position.set(lerp(-1.4, -.4, kIn), lerp(-14, -.2, kIn), 4.5);
    const kQ = E.io3(seg(t, tQ - 1.3, tQ + .2)), kD = E.io3(seg(t, tA3 - .5, tS + .15)), kR = E.io3(seg(t, tR - .8, tR + .2));
    paper.rotation.set(lerp(lerp(-1.18, -.62, kIn), -.16, kQ), lerp(lerp(.28, .1, kIn), 0, kQ), lerp(lerp(.14, .04, kIn), 0, kQ));
    paper.updateMatrixWorld();
    const L = v => paper.localToWorld(v.clone());
    const head = L(new THREE.Vector3(0, (PH / 2 - 560) * px, 0)), body = L(new THREE.Vector3(0, (PH / 2 - 1150) * px, 0));
    const q = L(mid(marks.q[0])), d = L(mid(marks.d[0], 120, 30)), r = L(mid(marks.r[0], 60));
    const kB = E.io2(seg(t, tA2 + .3, tQ - 1.2));
    const tgt = head.clone().lerp(body, kB).lerp(q, kQ).lerp(d, kD).lerp(r, kR);
    const dist = lerp(lerp(lerp(9.2, 7.2, kB), 4.4, kQ), 6.2, kD) - .5 * kR;
    const exit = E.i3(seg(t, tG0 - .9, tG0));
    cam = pose({ x: tgt.x + lerp(1.1, 0, Math.max(kQ, kD)), y: tgt.y + lerp(-2.4, -.3, Math.max(kQ, kD)) + 6 * exit, z: tgt.z + dist }, { x: tgt.x, y: tgt.y + 8 * exit, z: tgt.z }, 35, lerp(-.035, 0, kQ));
    G.blur = [0, -.06 * exit];
    G.focus = dist; G.aperture = .0013; G.maxblur = .009;
    tur.userData.u.uBright.value = 1 - .8 * kIn; tur.userData.u.uOp.value = 1;
    reveal(hiQ, E.io2(seg(t, tQ + .05, tQ + .75)));
    reveal(strike, E.io2(seg(t, tS, tS + .9)));
    reveal(hiR, E.io2(seg(t, tR, tR + .9)));
    pMotes.position.copy(tgt).add(new THREE.Vector3(0, 0, 2.5)).sub(O);
  } else if (t < tTape) {
    /* a4：俯视平面图（墙从地面长出）→ 斜 45° 的模型 */
    const kU = E.io3(seg(t, tG0 + .1, tG0 + 2.2));
    const up = E.o3(seg(t, tG0 + .4, tG0 + 1.6));
    walls.scale.y = Math.max(.001, up); wallFill.scale.y = Math.max(.001, up); wallFill.children.forEach(m => m.material.opacity = .45 * up);
    const top = pose(W3(80.5, 44, 1.5), W3(80.5, 0, 0)), tilt = pose(W3(80 - 4, 22, 31), W3(80 + .8, 1, -.5), 35);
    cam = mixP(top, tilt, kU);
    const orbit = seg(t, tG0 + 2, tTape); cam.x += Math.sin(orbit * 1.2) * 3 - 1; cam.z -= orbit * 2;
    /* 电线：从 C 拉到 A/B，消息来回跑 */
    const tWire = cw('a4', '打字') - .2, kw = E.io2(seg(t, tWire, tWire + .6));
    wireGeo.setPositions([wirePts[0][0], .5, 0, lerp(wirePts[0][0], wirePts[1][0], kw), .5, 0]);
    pulses.forEach((p, i) => { const s = (t - tWire - .6 - i * .38); const ph = s > 0 ? (s * .9) % 2 : -1; p.visible = ph >= 0 && t < tTape; const f = ph < 1 ? ph : 2 - ph; p.position.set(lerp(wirePts[0][0], wirePts[1][0], E.io2(clamp(f))), .5, 0); });
    /* 字母：先出现；「人还是机器」时 A、B 换位三次，身份来回闪，最后都是问号 */
    const ap = E.o3(seg(t, tG0 + 1.0, tG0 + 1.6));
    [LC, LA, LB].forEach((o, i) => { o.g.scale.setScalar(Math.max(.001, E.o3(seg(t, tG0 + .9 + i * .12, tG0 + 1.5 + i * .12)))); });
    const sw = t - tSwap, nsw = clamp(Math.floor(sw / .42) + 1, 0, 3), ps = clamp((sw - (nsw - 1) * .42) / .36);
    const flip = nsw % 2, e = nsw > 0 && nsw <= 3 ? E.io2(ps) : 0;
    const ax = 5.2, bx = 12.2, from = (nsw - 1) % 2 ? [bx, ax] : [ax, bx], to = [from[1], from[0]];
    const pa = nsw === 0 ? ax : lerp(from[0], to[0], e), pb = nsw === 0 ? bx : lerp(from[1], to[1], e);
    LA.g.position.set(pa, 1.9 + Math.sin(e * Math.PI) * 1.6, Math.sin(e * Math.PI) * 2.4);
    LB.g.position.set(pb, 1.9 + Math.sin(e * Math.PI) * 1.6, -Math.sin(e * Math.PI) * 2.4);
    const idT = ['人', '机器'][Math.floor(t * 9) % 2];
    if (sw > 0 && sw < 1.3) { LA.S.userData.set(idT, '#9a5e05'); LB.S.userData.set(idT === '人' ? '机器' : '人', '#9a5e05'); } else { LA.S.userData.set('？'); LB.S.userData.set('？'); }
    G.focus = Math.hypot(cam.x - cam.tx, cam.y - cam.ty, cam.z - cam.tz); G.aperture = .0007; G.maxblur = .006;
    F.grain = .4; F.scratch = .25; F.weave = 1.4;
    const dive = E.i3(seg(t, tTape - .7, tTape)); cam = mixP(cam, pose(W3(80 + 2, 2.2, 3), W3(80 + 4, .5, 0)), dive); G.flash = Math.max(G.flash, .7 * E.i2(seg(t, tTape - .25, tTape)));
  } else if (t < tE) {
    /* 电传纸：纸往上走，当前那一行停在画面中下方 */
    drawTape(charsAt(t), seg(t, tNote, tNote + 1.2));
    const k = E.o3(seg(t, tTape, tTape + .8));
    tape.position.y = lerp(-7, 0, k); tape.rotation.set(-.08, .1, .015);
    const ly = [0, .1, .2, .3, .4].reduce((s, d) => s + lineY(t - d), 0) / 5 + (t > tNote ? .7 * E.io2(seg(t, tNote, tNote + .8)) * -1 : 0);
    const fy = tape.position.y + ly;
    cam = pose(W3(170 + .6, fy - .5, 9.6), W3(170 - .1, fy + .15, 0), 35, -.02);
    G.focus = 9.5; G.aperture = .0012; G.maxblur = .008; G.flash = Math.max(G.flash, .7 * (1 - E.o3(seg(t, tTape, tTape + .4))));
    F.grain = .45;
  } else if (t < tOut + .3) {
    /* a6：ENIAC 机房往里推 */
    const k = E.io2(seg(t, tE, tOut + .3));
    cam = pose(W3(260 + lerp(1.0, -.4, k), lerp(-.35, .35, k), lerp(12.9, 8.4, k)), W3(260 + lerp(.5, -.15, k), lerp(-.1, .45, k), -2));
    G.focus = cam.z - O.z - 1; G.aperture = .0006; G.maxblur = .006;
    G.flash = Math.max(G.flash, .5 * (1 - E.o3(seg(t, tE, tE + .35))));
    const whip = E.i3(seg(t, tOut - .3, tOut + .3)); G.blur = [.09 * whip, 0]; cam.tx += 8 * whip;
  } else {
    /* 时间轴：1950 → 1955 */
    const x = camEnd(t), k = seg(t, tOut + .3, tOut + .9);
    cam = pose({ x: x + 10, y: 6, z: 30 }, { x: x - 4, y: 0, z: 0 });
    G.blur = [.09 * (1 - E.o3(k)), 0]; G.tint = [1.03, 1, .94];
    F.grain = .35; F.scratch = .2; F.weave = 1.2; F.flicker = .25;
    hud2Y.textContent = String(Math.round(1950 + x / 10));
  }
  Object.assign(CAM, cam);
} });

/* 九 · 第 37 手（h1–h7）：李世石 → 10¹⁷⁰ vs 10⁸⁰ → 十六万盘棋谱 + 自我对弈 → 3D 棋盘按真实棋谱重下第 2 局，第 37 手落下全盘压暗 → 1/10000 → 下完 → 4 : 1
   十 · 注意力（t1–t5）：论文首页 → Transformer → 论文附录例句：每个词同时连向所有词，its 看向 Law → 一层层往上堆 → ChatGPT 的 T
   十一 · 越大越强（s1–s7）：一个光点 = 100 万参数：GPT-1 / 2 / 3 → Epoch AI 训练算力散点立在时间轴上 → 2022.11.30 → 打字纸带散成星海
   十二 · 领奖台（n1–n3）：辛顿 → 哈萨比斯 → 1969 断口到 2024 拉出一道琥珀弧线
   尾声（e1–e8）：IMO 35/42 → 代理：写代码、查资料、操作电脑 → 沿轴倒飞回 1950，胶片一层层变回银盐 → 论文最后一句 → 全轴 */
import { THREE, scene, CAM, G, canvasTex, loadTex, plane } from '../gl.js';
import { F } from '../film.js';
import { tl, c, ce, cw, COL, el, hidden, letters, typeOn, seg, lerp, clamp, E, hash, shot, DUR, track, onFrame, sfx } from '../core.js';
import { X, LANE, spineState, glow } from '../spine.js';
import { stage, photo, textMesh, typeset, doc, motes, pose, mixP, LOOK, wipeText, ringTex, sprite, infoCard, label, only, shade } from '../kit.js';
import { chapterAt } from '../chapter.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const line2 = (pts, col, w) => { const g = new LineGeometry(); g.setPositions(pts.flat()); const m = new LineMaterial({ color: col, linewidth: w, transparent: true, depthWrite: false, worldUnits: false, toneMapped: false }); m.resolution.set(1920, 1080); const l = new Line2(g, m); l.userData.n = pts.length - 1; return l; };
const drawTo = (l, k) => { l.geometry.instanceCount = Math.max(0, Math.round(l.userData.n * clamp(k))); l.visible = k > .001; };
const shake = (cam, t, t0, amp, dur = .6) => { if (t < t0 || t > t0 + dur) return cam; const s = (1 - (t - t0) / dur) ** 2 * amp; return { ...cam, x: cam.x + (hash(t * 97) - .5) * s, y: cam.y + (hash(t * 71) - .5) * s }; };
const flashIn = (t, t0, a = .45) => t >= t0 ? a * (1 - E.o3(seg(t, t0, t0 + .3))) : 0;
/* 10 的幂（上标自己排） */
const powMesh = (exp, h, color, pre = '10') => {
  const tx = canvasTex(900, 300, (g, w, hh) => { g.fillStyle = color; g.textBaseline = 'alphabetic'; g.font = '900 220px SourceHanSerif'; const bw = g.measureText(pre).width; g.font = '900 120px SourceHanSerif'; const ew = g.measureText(exp).width; const x0 = (w - bw - ew - 10) / 2; g.font = '900 220px SourceHanSerif'; g.fillText(pre, x0, 250); g.font = '900 120px SourceHanSerif'; g.fillText(exp, x0 + bw + 10, 140); });
  const m = plane(tx, h * 3, h, {}); m.userData.u.uOp.value = 1; return m;
};
/* 散点 → 星海 用的点 */
const pointsMat = (rgb, size, op = 1) => new THREE.PointsMaterial({ color: new THREE.Color(...rgb), size, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });

/* ======================= 九 · 第 37 手 ======================= */
{
  const S = stage(7), { grp, W, P, O } = S;
  const T0 = chapterAt('h1').t1, T1 = chapterAt('t1').t0;
  only(grp, T0, T1);
  const tH2 = c('h2'), tH3 = c('h3'), tH4 = c('h4'), tH5 = c('h5'), tH6 = c('h6'), tH7 = c('h7');
  /* 李世石 */
  const lee = await photo('leesedol.jpg', 10, { depth: 1.3, edge: .05, sat: .9, tint: [1, 1, 1] }); lee.position.set(0, 0, 0); grp.add(lee);
  const leeCard = infoCard({ title: '2016 年 3 月 · 首尔', rows: [['李世石', 'vs AlphaGo', '']], src: '照片：LG Electronics · CC BY' });
  leeCard.show(T0, tH2 - .4);
  /* 10¹⁷⁰ vs 10⁸⁰ */
  const big = new THREE.Group(); big.position.set(60, 0, 0); grp.add(big);
  const p170 = powMesh('170', 3.6, '#f2b33d'); p170.position.set(0, 2.4, 0); big.add(p170);
  const p80 = powMesh('80', 3.6, '#f4efe6'); p80.position.set(0, -3.4, 0); big.add(p80);
  const l170 = textMesh('围棋的合法局面', .8, { font: '700 200px PuHuiTi', color: '#cfc6b8' }); l170.position.set(0, .1, 0); big.add(l170);
  const l80 = textMesh('可观测宇宙的原子', .8, { font: '700 200px PuHuiTi', color: '#cfc6b8' }); l80.position.set(0, -5.7, 0); big.add(l80);
  const NS = 30000, sp = new Float32Array(NS * 3); for (let i = 0; i < NS; i++) sp.set([(hash(i * 1.3) - .5) * 160, (hash(i * 2.7) - .5) * 90, -10 - hash(i * 3.9) * 120], i * 3);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, pointsMat([1.2, 1.15, 1.05], .18, .7)); big.add(stars);
  /* 十六万盘棋谱：一面小棋盘墙 */
  const mini = canvasTex(256, 256, (g, w) => { g.fillStyle = '#4a3622'; g.fillRect(0, 0, w, w); g.strokeStyle = 'rgba(230,210,170,.55)'; g.lineWidth = 1; for (let i = 0; i < 19; i++) { const p = 10 + i * 13; g.beginPath(); g.moveTo(10, p); g.lineTo(244, p); g.stroke(); g.beginPath(); g.moveTo(p, 10); g.lineTo(p, 244); g.stroke(); }
    for (let k = 0; k < 120; k++) { const x = 10 + Math.floor(hash(k * 3.3) * 19) * 13, y = 10 + Math.floor(hash(k * 7.1) * 19) * 13; g.fillStyle = k % 2 ? '#eee6d6' : '#111'; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); } });
  const MW = 36, MH = 20, NM = MW * MH;
  const minis = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: mini, transparent: true, toneMapped: true }), NM);
  const mOrd = [...Array(NM)].map((_, i) => hash(i * 4.4)); minis.position.set(120, 0, 0); grp.add(minis);
  const placeMinis = (k, t) => { const o = new THREE.Object3D(); for (let i = 0; i < NM; i++) { const x = (i % MW - MW / 2) * 1.85, y = (Math.floor(i / MW) - MH / 2) * 1.85, on = clamp((k - mOrd[i]) * 12); o.position.set(x, y, 0); o.rotation.set(0, 0, Math.floor(hash(i * 9.1 + Math.floor(t * 8) * (k > 1 ? 1 : 0)) * 4) * Math.PI / 2); o.scale.setScalar(Math.max(.001, on)); o.updateMatrix(); minis.setMatrixAt(i, o.matrix); } minis.instanceMatrix.needsUpdate = true; };
  const goCtr = el(null, 'position:absolute;left:150px;top:300px;width:900px'); hidden(goCtr);
  const gc1 = el(goCtr, 'position:relative;display:flex;align-items:baseline;gap:18px;padding:14px 0;border-top:1px solid rgba(244,239,230,.18)');
  const gc1n = el(gc1, `position:relative;font:900 92px/1 SourceHanSerif;color:${COL.white};font-variant-numeric:tabular-nums`, '0', { 'data-chk': 'text' }); el(gc1, `position:relative;font:700 36px/1 PuHuiTi;color:#cfc6b8`, '盘人类棋谱', { 'data-chk': 'text' });
  const gc2 = el(goCtr, 'position:relative;display:flex;align-items:baseline;gap:18px;padding:14px 0;border-top:1px solid rgba(244,239,230,.18)'); hidden(gc2);
  el(gc2, `position:relative;font:900 92px/1 SourceHanSerif;color:${COL.amber}`, '几千万', { 'data-chk': 'text' }); el(gc2, `position:relative;font:700 36px/1 PuHuiTi;color:#cfc6b8`, '盘自我对弈', { 'data-chk': 'text' });
  const goShade = shade(1150, .92);
  tl.fromTo([goCtr, goShade], { opacity: 0 }, { opacity: 1, duration: .4, immediateRender: false }, tH3).to([goCtr, goShade], { opacity: 0, duration: .3 }, tH4 - .5);
  tl.fromTo(gc2, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: .5, ease: 'expo.out', immediateRender: false }, cw('h3', '自我对弈') - .2);
  /* 3D 棋盘：第 2 局真实棋谱（带提子） */
  const MV = (await (await fetch('data/go_g2.json')).json());
  const gb = new THREE.Group(); gb.position.set(200, 0, 0); grp.add(gb);
  gb.add(new THREE.HemisphereLight(0xfff1dd, 0x1a1410, 1.0));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.6); key.position.set(-6, 14, 8); gb.add(key);
  const rim = new THREE.DirectionalLight(0x9cc3e0, 1.4); rim.position.set(8, 6, -10); gb.add(rim);
  const boardTex = canvasTex(2048, 2048, (g, w) => { g.fillStyle = '#4a3420'; g.fillRect(0, 0, w, w); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(20,10,0,${hash(i * 1.7) * .08})`; g.fillRect(0, hash(i * 2.3) * w, w, 1 + hash(i) * 3); }
    const m = w / 20; g.strokeStyle = 'rgba(235,215,175,.7)'; g.lineWidth = 3; for (let i = 0; i < 19; i++) { const p = m * (i + .5) + m * .5; g.beginPath(); g.moveTo(m, p); g.lineTo(w - m, p); g.stroke(); g.beginPath(); g.moveTo(p, m); g.lineTo(p, w - m); g.stroke(); }
    g.fillStyle = 'rgba(235,215,175,.85)'; [3, 9, 15].forEach(a => [3, 9, 15].forEach(b => { g.beginPath(); g.arc(m * (a + 1), m * (b + 1), 9, 0, 7); g.fill(); })); });
  const gboard = plane(boardTex, 20, 20, { depthWrite: true }); gboard.rotation.x = -Math.PI / 2; gb.add(gboard);
  const gbase = new THREE.Mesh(new THREE.BoxGeometry(20.4, .6, 20.4), new THREE.MeshStandardMaterial({ color: 0x2a1d12, roughness: .7 })); gbase.position.y = -.31; gb.add(gbase);
  const sGeo = new THREE.SphereGeometry(.47, 28, 14); sGeo.scale(1, .42, 1);
  const sMat = { B: new THREE.MeshStandardMaterial({ color: 0x15130f, roughness: .25 }), W: new THREE.MeshStandardMaterial({ color: 0xece4d4, roughness: .35 }) };
  const stones = { B: new THREE.InstancedMesh(sGeo, sMat.B, 120), W: new THREE.InstancedMesh(sGeo, sMat.W, 120) };
  Object.values(stones).forEach(m => { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); gb.add(m); });
  /* 按规则提子：记下每颗子落下和被提走的手数 */
  const life = MV.map(() => [0, 1e9]);
  { const bd = [...Array(19)].map(() => Array(19).fill(-1)), N4 = (x, y) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < 19 && b < 19);
    const group = (x, y) => { const c0 = MV[bd[y][x]][0], seen = new Set([x + ',' + y]), st = [[x, y]]; let lib = 0; const libs = new Set();
      while (st.length) { const [a, b] = st.pop(); for (const [p, q] of N4(a, b)) { const v = bd[q][p]; if (v < 0) libs.add(p + ',' + q); else if (MV[v][0] === c0 && !seen.has(p + ',' + q)) { seen.add(p + ',' + q); st.push([p, q]); } } }
      return { stones: [...seen].map(s => s.split(',').map(Number)), libs: libs.size }; };
    MV.forEach(([col, x, y], i) => { bd[y][x] = i; life[i][0] = i; for (const [p, q] of N4(x, y)) { const v = bd[q][p]; if (v >= 0 && MV[v][0] !== col) { const g = group(p, q); if (!g.libs) g.stones.forEach(([a, b]) => { life[bd[b][a]][1] = i; bd[b][a] = -1; }); } } }); }
  const t37 = cw('h4', '职业棋手') - .25, tRest0 = tH6 - .3, tRest1 = cw('h6', '锁定了胜局') + .2;
  const moveT = MV.map((_, i) => i < 36 ? lerp(tH4 - .4, t37 - .7, Math.pow(i / 35, .9)) : i === 36 ? t37 : lerp(tRest0, tRest1, Math.pow((i - 37) / (MV.length - 38), .8)));
  const gpos = (x, y) => [x - 9, .22, y - 9];
  const m37 = new THREE.Mesh(sGeo, new THREE.MeshStandardMaterial({ color: 0x15130f, roughness: .2, emissive: new THREE.Color(.9, .5, .1), emissiveIntensity: 0 })); m37.position.set(...gpos(MV[36][1], MV[36][2])); gb.add(m37);
  const halo = glow(m37.position.x, .5, m37.position.z, 3, gb);
  const ring37 = sprite(ringTex, 1.6, [2.6, 1.6, .5]); ring37.position.set(m37.position.x, .6, m37.position.z); gb.add(ring37);
  const coord = el(null, `position:absolute;left:150px;top:300px;font:700 40px/1.5 JBM;color:${COL.white}`, '', { 'data-chk': 'text' }); hidden(coord);
  tl.set(coord, { opacity: 1 }, tH4 - .3).set(coord, { opacity: 0 }, tH7 - .3);
  const odds = el(null, 'position:absolute;right:140px;top:300px;text-align:right'); hidden(odds);
  el(odds, `position:relative;font:900 150px/1 SourceHanSerif;color:${COL.amber};letter-spacing:4px`, '1 / 10,000', { 'data-chk': 'text' });
  el(odds, `position:relative;margin-top:22px;font:700 36px/1.4 PuHuiTi;color:#cfc6b8`, 'AlphaGo 估计：<br>人类棋手下这一步的概率', { 'data-chk': 'text' });
  tl.fromTo(odds, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .5, ease: 'expo.out', immediateRender: false }, cw('h5', '概率') - .4).to(odds, { opacity: 0, duration: .3 }, tH6 - .4);
  /* 4 : 1 */
  const score = new THREE.Group(); score.position.set(260, 0, 0); grp.add(score);
  const sc = textMesh('4 : 1', 7, { font: '900 200px SourceHanSerif', color: '#f2b33d', hdr: 1.15 }); score.add(sc);
  const scL = textMesh('AlphaGo  ·  李世石', 1, { font: '700 200px PuHuiTi', color: '#cfc6b8' }); scL.position.y = -4.6; score.add(scL);

  sfx(T0, 'flash', { g: .4 }); sfx(cw('h2', '围棋的变化') - .2, 'boom', { g: .6 }); sfx(cw('h2', '宇宙原子') - .2, 'impact', { g: .5 });
  for (let k = 0; k < 60; k++) sfx(lerp(tH3 - .1, tH4 - .5, k / 60), 'tick', { g: .08 + .06 * (k / 60), f: 1800 + (k % 5) * 200 });
  MV.forEach((_, i) => { if (i === 36) return; sfx(moveT[i] + .1, 'stone', { g: i > 36 ? .3 : .45 }); });
  sfx(t37 - .6, 'riser', { d: .6, g: .4 }); sfx(t37 + .3, 'stone', { g: 1.2 }); sfx(t37 + .32, 'boom', { g: 1 }); sfx(t37 + .32, 'shimmer', { d: 3, g: .5 });
  sfx(cw('h5', '概率') - .4, 'impact', { g: .5 }); sfx(tH7 - .1, 'boom', { g: 1 });
  shot({ name: 'ch9', t0: T0, t1: T1, look(t) {
    LOOK.digital(G, F); grp.visible = true; spineState({ on: false });
    lee.visible = t < tH2 - .3; big.visible = t >= tH2 - .3 && t < tH3 - .3; minis.visible = t >= tH3 - .3 && t < tH4 - .4; gb.visible = t >= tH4 - .4 && t < tH7 - .3; score.visible = t >= tH7 - .3;
    let cam;
    if (lee.visible) {
      const k = E.io2(seg(t, T0, tH2 - .3));
      cam = P([lerp(-3.6, -3, k), lerp(1.4, 1.8, k), lerp(14, 11.5, k)], [lerp(-3.2, -2.6, k), 1.6, 0]);
      G.focus = cam.z - O.z - .4; G.aperture = .0012; G.maxblur = .008;
    } else if (big.visible) {
      const a = E.o3(seg(t, cw('h2', '围棋的变化') - .2, cw('h2', '围棋的变化') + .4)), b = E.o3(seg(t, cw('h2', '宇宙原子') - .2, cw('h2', '宇宙原子') + .4));
      p170.userData.u.uOp.value = l170.userData.u.uOp.value = a; p80.userData.u.uOp.value = l80.userData.u.uOp.value = b;
      p170.scale.setScalar(lerp(.8, 1, a)); p80.scale.setScalar(lerp(.8, 1, b));
      const k = E.io2(seg(t, tH2 - .3, tH3 - .3));
      cam = P([60 + lerp(-1, 1, k), lerp(-.5, -1, k), lerp(26, 21, k)], [60, -1.2, 0], 35, lerp(.02, -.02, k));
      G.flash = flashIn(t, tH2 - .3); G.aperture = 0; G.bloom = .65;
    } else if (minis.visible) {
      const k1 = seg(t, tH3 - .1, cw('h3', '自我对弈') - .3), k2 = seg(t, cw('h3', '自我对弈') - .3, tH4 - .4);
      placeMinis(E.o2(k1) * .6 + E.io2(k2) * .45 + (k2 > 0 ? 1 : 0) * .0, t + (k2 > 0 ? t : 0));
      gc1n.textContent = Math.round(E.o3(k1) * 160000 / 1000) * 1000 ? (Math.round(E.o3(k1) * 160000 / 1000) * 1000).toLocaleString('en-US') : '0';
      const k = E.io2(seg(t, tH3 - .3, tH4 - .4));
      cam = P([120 + lerp(4, 10, k), lerp(-2, 2, k), lerp(26, 40, k)], [120 + lerp(5, 12, k), 0, 0], 35, lerp(-.04, .03, k));
      G.flash = flashIn(t, tH3 - .3);
    } else if (gb.visible) {
      const n = moveT.filter(x => t >= x).length, cnt = { B: 0, W: 0 }, o = new THREE.Object3D();
      MV.forEach(([col, x, y], i) => { if (i === 36 || i >= n || life[i][1] < n) return; const k = E.o3(seg(t, moveT[i], moveT[i] + .14)); o.position.set(...gpos(x, y)); o.position.y += (1 - k) * 1.2; o.scale.setScalar(Math.max(.001, k)); o.updateMatrix(); stones[col].setMatrixAt(cnt[col]++, o.matrix); });
      stones.B.count = cnt.B; stones.W.count = cnt.W; stones.B.instanceMatrix.needsUpdate = stones.W.instanceMatrix.needsUpdate = true;
      const k37 = E.o3(seg(t, t37, t37 + .35)); m37.visible = t >= t37; m37.position.y = .22 + (1 - k37) * 3; m37.scale.setScalar(Math.max(.001, k37));
      const dim = E.io2(seg(t, t37 + .2, t37 + .9)) * (1 - E.io2(seg(t, tRest0 - .2, tRest0 + .5)));
      sMat.B.color.setScalar(.082 * (1 - .8 * dim)); sMat.W.color.setRGB(.84 * (1 - .88 * dim), .79 * (1 - .88 * dim), .7 * (1 - .88 * dim)); gboard.userData.u.uBright.value = 1 - .8 * dim; key.intensity = 2.6 * (1 - .6 * dim);
      m37.material.emissiveIntensity = 1.6 * dim + .5 * (t > t37 ? 1 : 0);
      halo.visible = ring37.visible = t > t37 + .1; halo.scale.setScalar(lerp(9, 3.2, E.o3(seg(t, t37, t37 + .7)))); halo.material.opacity = .4 + .6 * dim;
      ring37.scale.setScalar(1.6 + .25 * Math.sin(t * 6)); ring37.material.opacity = dim;
      coord.innerHTML = `第 ${Math.min(n, MV.length)} 手` + (n >= 37 ? `<br><span style="color:${COL.amber}">第 37 手 · O10 · AlphaGo 执黑</span>` : '');
      /* 镜头：俯视全盘 → 第 37 手落下时贴近 → 拉回 */
      const [mx, , mz] = gpos(MV[36][1], MV[36][2]);
      const wide = P([200 - 3, 21, 17], [200 - 1, 0, 0], 35, 0), close = P([200 + mx - 4.5, 7.5, mz + 8], [200 + mx - 1, 0, mz], 35, -.02), end = P([200 + 4, 25, 14], [200 + 1.5, 0, -1], 35, .02);
      cam = mixP(mixP(wide, close, E.io3(seg(t, t37 - .6, t37 + .9))), end, E.io3(seg(t, tRest0 - .3, tH7 - .3)));
      cam = shake(cam, t, t37 + .3, .25, .5);
      G.flash = flashIn(t, tH4 - .4) + .3 * Math.exp(-Math.pow((t - t37 - .32) / .07, 2)); G.focus = Math.hypot(cam.x - cam.tx, cam.y - cam.ty, cam.z - cam.tz); G.aperture = .0011; G.maxblur = .007;
    } else {
      const k = E.io2(seg(t, tH7 - .3, T1));
      sc.userData.u.uOp.value = E.o3(seg(t, tH7 - .1, tH7 + .4)); scL.userData.u.uOp.value = E.o3(seg(t, tH7 + .3, tH7 + .8));
      cam = P([260, lerp(-1.4, -.8, k), lerp(24, 20, k)], [260, -.8, 0]);
      G.flash = flashIn(t, tH7 - .3, .55); G.bloom = .7;
    }
    Object.assign(CAM, cam);
  } });
}

/* ======================= 十 · 注意力 ======================= */
{
  const S = stage(8), { grp, W, P, O } = S;
  const T0 = chapterAt('t1').t1, T1 = chapterAt('s1').t0;
  only(grp, T0, T1);
  const tT2 = c('t2'), tT3 = c('t3'), tT4 = c('t4'), tT5 = c('t5');
  /* 论文首页（arXiv 1706.03762v7 原件）；标题、作者位置按 docmarks 量好 */
  const PW = 1700, PH = 2200, pw = 12, px = pw / PW;
  const page = plane(await loadTex('素材/图/transformer_p1.png'), pw, pw * PH / PW, { depthWrite: true, sat: .6 }); grp.add(page);
  const at = (x, y) => new THREE.Vector3((x - PW / 2) * px, (PH / 2 - y) * px, 0);
  const hiTitle = new THREE.Mesh(new THREE.PlaneGeometry(1, 52 * px), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, .66, .16), transparent: true, opacity: .4, depthWrite: false })); hiTitle.geometry.translate(.5, 0, 0); hiTitle.position.copy(at(580, 437)); hiTitle.position.z = .01; hiTitle.renderOrder = 3; grp.add(hiTitle);
  const pmo = motes(200, [16, 18, 8], 81, .3); pmo.position.set(0, 0, 3); grp.add(pmo);
  const tAu = cw('t1', '注意力就是一切') + .7;
  const t8 = label(`left:150px;top:420px;font:900 120px/1 SourceHanSerif;color:${COL.white}`, `8 <span style="font:700 40px PuHuiTi;color:#cfc6b8">位作者 · 谷歌 · 2017</span>`, tAu + .5, tT2 - .3);
  const t8sh = shade(1000, .9); tl.fromTo(t8sh, { opacity: 0 }, { opacity: 1, duration: .4, immediateRender: false }, tAu + .4).to(t8sh, { opacity: 0, duration: .25 }, tT2 - .55);
  const tSrc = label(`right:96px;top:56px;text-align:right;font:500 28px/1 JBM;color:#b3aa9c;background:rgba(8,7,6,.78);padding:12px 18px`, 'arXiv:1706.03762 · 首页声明允许新闻 / 学术引用', T0 + .2, tT2 - .3);
  /* Transformer 一词 */
  const tw = wipeText('Transformer', 3.4, { font: '600 200px EBGaramond', color: '#f4efe6', ls: 6 }); tw.position.set(60 - tw.userData.w / 2, 0, 0); grp.add(tw);
  /* 注意力：论文附录的例句（第 4 张图用的就是这句） */
  const WORDS = 'The Law will never be perfect , but its application should be just'.split(' ');
  const sent = new THREE.Group(); sent.position.set(120, -2, 0); grp.add(sent);
  const meas = document.createElement('canvas').getContext('2d'); meas.font = '500 200px EBGaramond';
  const WH = 1.2, sc = WH / (200 * 1.35), sp = meas.measureText(' ').width * sc;
  let xx = 0; const wpos = WORDS.map(w => { const ww = meas.measureText(w).width * sc + 40 * sc; const p = xx + ww / 2; xx += ww + sp * .6; return p; });
  const tot = xx; const wm = WORDS.map((w, i) => { const m = textMesh(w, WH, { font: '500 200px EBGaramond', color: w === 'its' ? '#f2b33d' : '#f4efe6' }); m.position.set(wpos[i] - tot / 2, 0, 0); sent.add(m); return m; });
  const wx = i => wpos[i] - tot / 2;
  /* 所有词两两相连（同时），细线；its 的注意力粗线 */
  const ARC = 28, NWd = WORDS.length, pairs = []; for (let i = 0; i < NWd; i++) for (let j = 0; j < NWd; j++) if (i !== j) pairs.push([i, j]);
  const ap = new Float32Array(pairs.length * ARC * 6), aw = new Float32Array(pairs.length * ARC * 2);
  /* 前往后的连线画在字上方，后往前的画在字下方 */
  const arcPt = (i, j, s, up = i < j) => { const a = wx(i), b = wx(j), h = .5 + Math.abs(b - a) * .3; return [lerp(a, b, s), up ? .85 + Math.sin(s * Math.PI) * h : -.85 - Math.sin(s * Math.PI) * h, 0]; };
  pairs.forEach(([i, j], p) => { for (let s = 0; s < ARC; s++) { ap.set([...arcPt(i, j, s / ARC), ...arcPt(i, j, (s + 1) / ARC)], (p * ARC + s) * 6); aw[(p * ARC + s) * 2] = aw[(p * ARC + s) * 2 + 1] = p; } });
  const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.BufferAttribute(ap, 3)); ag.setAttribute('aP', new THREE.BufferAttribute(aw, 1));
  const AU = { uOp: { value: 0 }, uFocus: { value: 0 } };
  const arcs = new THREE.LineSegments(ag, new THREE.ShaderMaterial({ uniforms: AU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `attribute float aP; varying float vA; uniform float uFocus; float h(float n){ return fract(sin(n * 12.9898) * 43758.5453); } void main(){ vA = (.25 + .75 * h(aP)) * (1. - .85 * uFocus); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uOp; varying float vA; void main(){ gl_FragColor = vec4(vec3(.9, .95, 1.1) * vA * uOp * .55, 1.); }` }));
  arcs.frustumCulled = false; sent.add(arcs);
  const ITS = WORDS.indexOf('its'), ATT = { Law: .5, application: .32, its: .1, perfect: .05, be: .03 };
  const focusArcs = Object.entries(ATT).map(([w, a]) => { const j = WORDS.indexOf(w); const pts = [...Array(41)].map((_, s) => j === ITS ? [wx(ITS) + Math.sin(s / 40 * Math.PI * 2) * .5, .85 + (1 - Math.cos(s / 40 * Math.PI * 2)) * .6, 0] : arcPt(ITS, j, s / 40, true)); const l = line2(pts, 0xf2b33d, 1 + a * 22); l.material.color.setRGB(2.4, 1.45, .42); sent.add(l); return { l, a, w }; });
  const attLab = label(`left:0;top:150px;width:1920px;text-align:center;font:700 40px/1.4 PuHuiTi;color:#cfc6b8`, `论文附录里的例句：<span style="color:${COL.amber}">its</span> 指的是谁？`, cw('t3', '自己决定') - .4, tT4 - .3);
  /* 一层层往上堆 */
  const tower = new THREE.Group(); tower.position.set(180, -6, 0); grp.add(tower);
  const NL = 24, slabs = [...Array(NL)].map((_, i) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(8, .42, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(.13, .1, .07), transparent: true, opacity: .85 })); const e = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), new THREE.LineBasicMaterial({ color: new THREE.Color(2.2, 1.35, .4), transparent: true, toneMapped: false })); g.add(b, e); g.position.y = i * .62; tower.add(g); return g; });
  const nLab = el(null, 'position:absolute;left:150px;top:300px'); hidden(nLab);
  const nNum = el(nLab, `position:relative;font:900 120px/1 SourceHanSerif;color:${COL.white};font-variant-numeric:tabular-nums`, '', { 'data-chk': 'text' });
  const nLab2 = el(nLab, `position:relative;margin-top:18px;font:700 36px/1.4 PuHuiTi;color:#cfc6b8`, '同样的层，一层层堆上去<br>堆得越高，吃得下越多数据', { 'data-chk': 'text' });
  tl.set(nLab, { opacity: 1 }, tT4).set(nLab, { opacity: 0 }, tT5 - .3);
  /* ChatGPT 的 T */
  const gptTex = canvasTex(2200, 400, (g, w, h) => { g.font = '600 280px EBGaramond'; g.textBaseline = 'middle'; const a = g.measureText('ChatGP').width, b = g.measureText('T').width, x0 = (w - a - b) / 2; g.fillStyle = '#f4efe6'; g.fillText('ChatGP', x0, h / 2); g.fillStyle = '#f2b33d'; g.fillText('T', x0 + a, h / 2); });
  const gpt = plane(gptTex, 16.5, 3, {}); gpt.position.set(240, 1.4, 0); grp.add(gpt);
  const gptSub = wipeText('Generative Pre-trained Transformer', .9, { font: '500 200px JBM', color: '#cfc6b8' }); gptSub.position.set(240 - gptSub.userData.w / 2, -1.6, 0); grp.add(gptSub);
  const hiT = new THREE.Mesh(new THREE.PlaneGeometry(1, .08), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.45, .42), toneMapped: false })); hiT.geometry.translate(.5, 0, 0); grp.add(hiT);

  sfx(T0, 'paper', { g: .8 }); sfx(cw('t1', '注意力就是一切') - .2, 'marker');
  [...'Transformer'].forEach((_, i) => sfx(tT2 + .1 + i * .8 / 11, 'type', { g: .35 })); sfx(tT2 + .1, 'shimmer', { d: 1.5, g: .4 });
  sfx(cw('t3', '同时') - .2, 'swell', { d: 1.4, g: .5 }); sfx(cw('t3', '自己决定'), 'chime', { g: .6 });
  for (let i = 0; i < 24; i++) sfx(tT4 - .1 + (tT5 - .7 - tT4) * (i / 24) + .25, 'thud', { g: .25 + .01 * i });
  sfx(cw('t5', '正来源于此') - .3, 'chime', { g: .6 });
  shot({ name: 'ch10', t0: T0, t1: T1, look(t) {
    LOOK.digital(G, F); grp.visible = true; spineState({ on: false });
    page.visible = hiTitle.visible = pmo.visible = t < tT2 - .3; tw.visible = t >= tT2 - .3 && t < tT3 - .3; sent.visible = t >= tT3 - .3 && t < tT4 - .3; tower.visible = t >= tT4 - .3 && t < tT5 - .3; gpt.visible = gptSub.visible = hiT.visible = t >= tT5 - .3;
    pmo.userData.step(t);
    let cam;
    if (page.visible) {
      const kIn = E.o5(seg(t, T0, T0 + .9)); page.position.y = lerp(-6, 0, kIn); page.rotation.set(lerp(-.7, -.12, kIn), lerp(.2, .04, kIn), 0);
      const tTi = cw('t1', '注意力就是一切') - .2; hiTitle.scale.x = Math.max(.0001, (1115 - 580) * px * E.io2(seg(t, tTi, tTi + .8))); hiTitle.position.y = page.position.y + at(0, 437).y; hiTitle.rotation.copy(page.rotation);
      const tA = tTi + .9, kA = E.io3(seg(t, tA, tA + 1.1));
      page.updateMatrixWorld(); const tgt = page.localToWorld(at(845, 437)).lerp(page.localToWorld(at(650, 805)), kA);
      const kz = E.io3(seg(t, T0, tTi + .3)), dz = lerp(13, 7, kz) + 2.5 * kA, off = -2.6 * kA;
      cam = pose({ x: tgt.x + .4 + off, y: tgt.y - 1.2, z: tgt.z + dz }, { x: tgt.x + off, y: tgt.y, z: tgt.z }, 35, -.015);
      G.focus = dz; G.aperture = .0011; G.maxblur = .008; G.flash = flashIn(t, T0);
    } else if (tw.visible) {
      tw.userData.type(seg(t, tT2 + .1, tT2 + .9)); const k = E.io2(seg(t, tT2 - .3, tT3 - .3));
      cam = P([60 + lerp(-1, 1, k), lerp(.4, 0, k), lerp(17, 14, k)], [60, 0, 0], 35, lerp(.02, -.01, k));
      G.flash = flashIn(t, tT2 - .3); G.aperture = 0; G.bloom = .6; G.streak = .6;
    } else if (sent.visible) {
      const k0 = E.o3(seg(t, tT3 - .2, tT3 + .4)); wm.forEach((m, i) => { m.userData.u.uOp.value = k0; });
      AU.uOp.value = E.io2(seg(t, cw('t3', '同时') - .2, cw('t3', '同时') + .4)); const kf = E.io2(seg(t, cw('t3', '自己决定') - .2, cw('t3', '自己决定') + .8)); AU.uFocus.value = kf;
      focusArcs.forEach(({ l, a }, i) => { drawTo(l, E.io2(seg(t, cw('t3', '自己决定') + i * .08, cw('t3', '自己决定') + .6 + i * .08))); l.material.opacity = kf; });
      wm.forEach((m, i) => { const w = WORDS[i]; m.userData.u.uBright.value = kf ? lerp(1, ATT[w] ? 1 + ATT[w] * 1.6 : .45, kf) : 1; });
      const k = E.io2(seg(t, tT3 - .3, tT4 - .3));
      cam = P([120 + lerp(-2, 1, k), lerp(.6, 1.6, k), lerp(25, 21, k)], [120 + lerp(-1.5, .6, k), lerp(0, .4, k), 0], 35, lerp(-.02, .01, k));
      G.flash = flashIn(t, tT3 - .3); G.aperture = 0; G.bloom = .7;
    } else if (tower.visible) {
      const n = Math.min(NL, Math.floor(E.io2(seg(t, tT4 - .1, tT5 - .8)) * NL) + 1);
      slabs.forEach((g, i) => { const k = E.o3(seg(t, tT4 - .1 + (tT5 - .7 - tT4) * (i / NL), tT4 + .2 + (tT5 - .7 - tT4) * (i / NL))); g.visible = k > 0; g.position.y = i * .62 + (1 - k) * 4; g.children.forEach(o => o.material.opacity = k * (o.isLineSegments ? 1 : .85)); });
      nNum.textContent = `× ${n} 层`;
      const k = E.io2(seg(t, tT4 - .3, tT5 - .3));
      cam = P([180 + lerp(9, 6, k), lerp(2, 16, k), lerp(26, 30, k)], [180 + 4, lerp(0, 9, k), 0], 35, .02);
      G.flash = flashIn(t, tT4 - .3); G.bloom = .75;
    } else {
      gpt.userData.u.uOp.value = E.o3(seg(t, tT5 - .2, tT5 + .4)); gptSub.userData.type(seg(t, tT5 + .4, tT5 + 1.4));
      const kT = E.io2(seg(t, cw('t5', '正来源于此') - .3, cw('t5', '正来源于此') + .4)); const x0 = 240 - gptSub.userData.w / 2 + gptSub.userData.w * .565; hiT.position.set(x0, -2.2, .02); hiT.scale.x = Math.max(.0001, gptSub.userData.w * .43 * kT);
      const k = E.io2(seg(t, tT5 - .3, T1));
      cam = P([240 + lerp(-1, 1, k), lerp(0, .2, k), lerp(19, 16, k)], [240, 0, 0]);
      G.flash = flashIn(t, tT5 - .3); G.bloom = .6;
    }
    Object.assign(CAM, cam);
  } });
}

/* ======================= 十一 · 越大越强 ======================= */
{
  const S = stage(9), { grp, W, P, O } = S;
  const T0 = chapterAt('s1').t1, T1 = chapterAt('n1').t0;
  const onSp = new THREE.Group(); scene.add(onSp); only(grp, T0, T1); only(onSp, T0, T1);
  const tS2 = c('s2'), tS3 = c('s3'), tS4 = c('s4'), tS5 = c('s5'), tS6 = c('s6'), tS7 = c('s7');
  const bet = textMesh('押注：把模型做大', 2.2, { font: '900 200px SourceHanSerif', color: '#f2b33d' }); bet.position.set(X(2018) + 4, LANE.learn - 9.5, 1); onSp.add(bet);
  /* 参数量：一个光点 = 100 万个参数 */
  const cube = (n, gap, cx) => { const s = Math.ceil(Math.cbrt(n)), p = new Float32Array(n * 3), side = (s - 1) * gap; for (let i = 0; i < n; i++) { const a = i % s, b = Math.floor(i / s) % s, d = Math.floor(i / (s * s)); p.set([cx + a * gap - side / 2 + (hash(i * 1.7) - .5) * gap * .3, d * gap + (hash(i * 2.9) - .5) * gap * .3, b * gap - side / 2 + (hash(i * 3.3) - .5) * gap * .3], i * 3); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return { g, side }; };
  const GPT = [[117, 0, 'GPT-1 · 2018', '1.17 亿'], [1500, 4.2, 'GPT-2 · 2019', '15 亿'], [175000, 20, 'GPT-3 · 2020', '1750 亿']].map(([n, cx, nm, v], i) => { const { g, side } = cube(n, .2, cx); const pts = new THREE.Points(g, pointsMat(i === 2 ? [1.1, .66, .2] : [1.4, 1.3, 1.15], i === 2 ? .055 : .09)); pts.userData.op = i === 2 ? .32 : 1; pts.frustumCulled = false; grp.add(pts);
    const lab = textMesh(nm, i === 2 ? 1.6 : .42, { font: '700 200px JBM', color: '#cfc6b8' }); lab.position.set(cx, -.5 - (i === 2 ? 1.1 : .25), 0); grp.add(lab);
    const val = textMesh(v + ' 参数', i === 2 ? 2.4 : .6, { font: '900 200px SourceHanSerif', color: i === 2 ? '#f2b33d' : '#f4efe6' }); val.position.set(cx, side + (i === 2 ? 2.2 : .6), 0); grp.add(val); return { pts, lab, val, n, side, cx }; });
  const legend = el(null, `position:absolute;right:96px;top:812px;font:500 30px/1 JBM;color:${COL.mute};display:flex;align-items:center;gap:14px;white-space:nowrap`, `<span style="position:relative;display:inline-block;width:14px;height:14px;border-radius:50%;background:${COL.amber};box-shadow:0 0 14px ${COL.amber}"></span>每个光点 = 100 万个参数`, { 'data-chk': 'text' }); hidden(legend);
  tl.fromTo(legend, { opacity: 0 }, { opacity: 1, duration: .4, immediateRender: false }, tS2).to(legend, { opacity: 0, duration: .3 }, tS5 - .4);
  /* Epoch AI：训练算力（log10 FLOP）立在时间轴上 */
  const EP = await (await fetch('data/epoch.json')).json();
  const ey = lf => 2 + (lf - 1.5) * 1.6;
  const trend = yr => yr < 2010 ? 2 + (yr - 1950) * .18 : 12.8 + (yr - 2010) * .95;   // 镜头跟着走的大致趋势（log10 FLOP）
  const epp = new Float32Array(EP.pts.length * 3), epc = new Float32Array(EP.pts.length * 3), epy = new Float32Array(EP.pts.length);
  EP.pts.forEach(([yr, lf], i) => { epp.set([X(yr), ey(lf), -3 - hash(i * 3.1) * 2], i * 3); const a = yr >= 2010; epc.set(a ? [2.3, 1.4, .42] : [1.25, 1.25, 1.3], i * 3); epy[i] = yr; });
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(epp, 3)); eg.setAttribute('color', new THREE.BufferAttribute(epc, 3)); eg.setAttribute('aYr', new THREE.BufferAttribute(epy, 1));
  const EU = { uYr: { value: 1950 }, uOp: { value: 1 } };
  const scatter = new THREE.Points(eg, new THREE.ShaderMaterial({ uniforms: EU, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `attribute float aYr; uniform float uYr; varying vec3 vC; varying float vA; void main(){ vC = color; vA = smoothstep(aYr, aYr - .6, uYr - 0.); vA = 1. - vA; vA = step(aYr, uYr); vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = 16. * (60. / -mv.z); }`,
    fragmentShader: `uniform float uOp; varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; float a = smoothstep(.5, .15, d); gl_FragColor = vec4(vC * a, a * vA * uOp); }` }));
  scatter.frustumCulled = false; onSp.add(scatter);
  const gridL = [5, 10, 15, 20, 25].map(e => { const l = line2([[X(1950), ey(e), -4], [X(2026), ey(e), -4]], 0x9a9184, 1); l.material.opacity = .35; onSp.add(l); const m = powMesh(String(e), 3, '#9a9184'); m.position.set(X(1950) - 6, ey(e), -4); onSp.add(m); return [l, m]; });
  const named = Object.entries(EP.lab).filter(([k]) => /Mark I|AlexNet|Transformer|GPT-2|GPT-3|AlphaGo Lee|LeNet/.test(k)).map(([k, [yr, lf]]) => { const m = textMesh(k.replace(' (davinci)', '').replace(' (1.5B)', ''), 2.2, { font: '700 200px JBM', color: yr >= 2010 ? '#f2b33d' : '#cfc6b8' }); m.position.set(X(yr) - 1, ey(lf) + 2.4, -3); m.geometry.translate(-m.geometry.parameters.width / 2, 0, 0); onSp.add(m); return { m, yr }; });
  const epSrc = label(`right:96px;top:56px;text-align:right;font:500 28px/1.35 JBM;color:#b3aa9c;background:rgba(8,7,6,.78);padding:12px 18px`, '训练算力（FLOP，对数刻度）<br>数据：Epoch AI · CC BY', tS5 - .2, tS6 - .3);
  /* 2022.11.30：发布页示例对话（原文） */
  const chat = el(null, 'position:absolute;left:330px;top:300px;width:1260px'); hidden(chat);
  const date = el(chat, `position:relative;font:700 40px/1 JBM;color:${COL.amber};letter-spacing:3px;margin-bottom:60px`, '2022 · 11 · 30', { 'data-chk': 'text' });
  const row = (lab, col) => { const r = el(chat, 'position:relative;margin-bottom:46px'); el(r, `position:relative;font:700 30px/1 JBM;color:${col};margin-bottom:20px;letter-spacing:1px`, lab, { 'data-chk': 'text' }); return el(r, `position:relative;font:500 46px/1.45 PuHuiTi;color:${COL.white};min-height:66px`, '', { 'data-chk': 'text' }); };
  const uq = row('User', COL.mute), ar = row('ChatGPT', COL.amber); ar.style.color = '#d9d0c2';
  tl.fromTo(chat, { opacity: 0 }, { opacity: 1, duration: .3, immediateRender: false }, tS6 - .2).to(chat, { opacity: 0, duration: .3 }, tS7 - .4);
  const tq = typeOn(uq, 'this code is not working like i expect — how do i fix it?', tS6 + .3, 46);
  typeOn(ar, "It's difficult to say what's wrong with the code without more context.", tq + .2, 40);
  /* 图灵的电传纸 → 星海 */
  const QS = 'Q: Please write me a sonnet on the subject of the Forth Bridge.';
  const tapeTex = canvasTex(2400, 260, (g, w, h) => { g.fillStyle = '#ece5d3'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(110,85,55,${hash(i * 7.7) * .05})`; g.fillRect(hash(i * 1.9) * w, hash(i * 3.7) * h, 2, 2); } g.fillStyle = '#1b1612'; g.font = '400 72px CourierPrime'; g.textBaseline = 'middle'; g.fillText(QS, 80, h / 2 + 4); });
  const tape = plane(tapeTex, 24, 2.6, { depthWrite: true, sat: .35 }); tape.position.set(120, 0, 0); grp.add(tape);
  const NPq = 24000, qs = new Float32Array(NPq * 3), qe = new Float32Array(NPq * 3), qp = new Float32Array(NPq * 3);
  { const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 260; const g = cv.getContext('2d'); g.font = '400 72px CourierPrime'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(QS, 80, 134); const d = g.getImageData(0, 0, 2400, 260).data, cand = [];
    for (let y = 0; y < 260; y += 2) for (let x = 0; x < 2400; x += 2) if (d[(y * 2400 + x) * 4 + 3] > 120) cand.push([x, y]);
    for (let i = 0; i < NPq; i++) { const [x, y] = cand[Math.floor(hash(i * 1.31) * cand.length)]; qs.set([120 + (x - 1200) * 24 / 2400, (130 - y) * 2.6 / 260, .05], i * 3);
      const r = 8 + Math.pow(hash(i * 2.2), 1.5) * 120, a = hash(i * 3.3) * Math.PI * 2 + r * .03, z = (hash(i * 4.4) - .5) * 14 * (1 - r / 140); qe.set([120 + Math.cos(a) * r, z * .6 + (hash(i * 5.5) - .5) * 6, Math.sin(a) * r * .55 - 30], i * 3); } }
  const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.BufferAttribute(qp, 3));
  const qpts = new THREE.Points(qg, pointsMat([2.2, 1.6, .9], .09)); qpts.frustumCulled = false; grp.add(qpts);
  const tFly = cw('s7', '飞入') - .4;

  sfx(cw('s1', '押注') - .2, 'impact', { g: .5 }); [tS2, tS3, tS4].forEach((x, i) => { sfx(x - .1, 'whoosh', { d: .6 + i * .5, g: .4 + i * .2 }); sfx(x + .1, 'shimmer', { d: 1 + i, g: .3 + i * .15 }); }); sfx(tS4, 'boom', { g: .7 });
  sfx(tS5 - .3, 'riser', { d: tS6 - tS5 - .5, g: .6 });
  [...'this code is not working like i expect — how do i fix it?'].forEach((_, i) => sfx(tS6 + .3 + i / 46, 'key', { g: .25 }));
  sfx(tS7 - .3, 'flash', { g: .5 }); sfx(tFly, 'swell', { d: 3, g: .9 }); sfx(tFly, 'shimmer', { d: 4, g: .6 });
  shot({ name: 'ch11', t0: T0, t1: T1, look(t) {
    LOOK.digital(G, F);
    const onSpine = t < tS2 - .3 || (t >= tS5 - .3 && t < tS6 - .3);
    grp.visible = !onSpine; onSp.visible = true; bet.visible = t < tS2; scatter.visible = t >= tS5 - .3 && t < tS6 - .3; gridL.forEach(([l, m]) => l.visible = m.visible = scatter.visible); named.forEach(o => o.m.visible = scatter.visible);
    GPT.forEach(o => o.pts.visible = o.lab.visible = o.val.visible = t >= tS2 - .3 && t < tS5 - .3);
    tape.visible = t >= tS7 - .3 && t < tFly + .3; qpts.visible = t >= tFly;
    let cam;
    if (t < tS2 - .3) {
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [1, 1], iceDir: 1, cut: 1, ember: 1, head: 1, origin: 1 });
      bet.userData.u.uOp.value = E.o3(seg(t, cw('s1', '押注') - .2, cw('s1', '押注') + .4));
      const k = E.io2(seg(t, T0, tS2 - .3));
      cam = { x: X(lerp(2015, 2019, k)), y: lerp(0, -1, k), z: lerp(30, 26, k), tx: X(lerp(2018, 2021, k)), ty: LANE.learn - 2, tz: 0, fov: 35, roll: 0 };
    } else if (t < tS5 - .3) {   // GPT-1 → 2 → 3
      spineState({ on: false });
      const ks = [tS2, tS3, tS4].map(x => E.o3(seg(t, x - .1, x + .7)));
      GPT.forEach((o, i) => { o.pts.material.opacity = ks[i] * o.pts.userData.op; o.pts.scale.setScalar(Math.max(.001, lerp(.3, 1, ks[i]))); o.pts.position.set(o.cx * (1 - lerp(.3, 1, ks[i])), 0, 0); o.lab.userData.u.uOp.value = ks[i]; o.val.userData.u.uOp.value = E.o3(seg(t, [tS2, tS3, tS4][i] + .4, [tS2, tS3, tS4][i] + 1)); });
      const c1 = P([-.4, 1.4, 7.2], [0, .45, 0]), c2 = P([1.6, 2.2, 10], [2.2, 1.2, 0]), c3 = P([9, 9, 46], [12, 6, 0]);
      cam = mixP(mixP(c1, c2, E.io3(seg(t, tS3 - .5, tS3 + .5))), c3, E.io3(seg(t, tS4 - .4, tS4 + 1.8)));
      cam.x += Math.sin(t * .5) * .3 * (1 + cam.z / 10);
      G.flash = flashIn(t, tS2 - .3); G.bloom = .7;
    } else if (t < tS6 - .3) {   // 训练算力
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [0, 0], cut: 1, ember: 1, head: 1, origin: 1 });
      const yr = lerp(1950, 2026, E.io2(seg(t, tS5 - .2, tS6 - 1.2))), cy = Math.min(yr, 2024);
      EU.uYr.value = yr; named.forEach(o => o.m.userData.u.uOp.value = clamp((yr - o.yr) * 2));
      const ride = { x: X(cy) - 30, y: ey(trend(cy)) + 6, z: 120, tx: X(cy) + 12, ty: ey(trend(cy)), tz: 0, fov: 35, roll: 0 }, all = { x: X(1996), y: 22, z: 210, tx: X(1996), ty: 20, tz: 0, fov: 35, roll: 0 };
      cam = mixP(ride, all, E.io3(seg(t, tS6 - 1.6, tS6 - .3)));
      G.flash = flashIn(t, tS5 - .3); G.bloom = .7;
    } else if (t < tS7 - .3) {   // 2022.11.30
      spineState({ on: false });
      cam = P([0, 0, 30], [0, 0, 0]); G.flash = flashIn(t, tS6 - .3);
    } else {   // 电传纸 → 星海
      spineState({ on: false });
      const kx = seg(t, tFly, tFly + 2.6);
      for (let i = 0; i < NPq; i++) { const k = E.io3(clamp((kx - hash(i * 6.6) * .3) / .7)); qp[i * 3] = lerp(qs[i * 3], qe[i * 3], k); qp[i * 3 + 1] = lerp(qs[i * 3 + 1], qe[i * 3 + 1], k) + Math.sin(k * Math.PI) * 4 * (hash(i) - .5); qp[i * 3 + 2] = lerp(qs[i * 3 + 2], qe[i * 3 + 2], k); }
      qg.attributes.position.needsUpdate = true; qpts.material.opacity = 1;
      tape.userData.u.uOp.value = 1 - seg(t, tFly, tFly + .3);
      const k = E.io2(seg(t, tS7 - .3, tFly)), kb = E.io3(seg(t, tFly, T1));
      cam = mixP(P([120 - 6, .6, 10], [120 - 7, 0, 0], 35, -.03), P([120 - 4, 22, 70], [120, -4, -30], 35, 0), kb); cam.x += 6 * k;
      LOOK.silver(G, F); const dg = E.io2(seg(t, tFly, tFly + 1.5)); G.tint = [lerp(1.03, 1, dg), 1, lerp(.95, 1, dg)]; F.grain = lerp(.5, .12, dg); F.flicker = lerp(.35, 0, dg); F.scratch = lerp(.35, 0, dg); F.weave = lerp(2, 0, dg);
      G.flash = flashIn(t, tS7 - .3); G.bloom = .7; G.focus = 10; G.aperture = .0009 * (1 - kb); G.maxblur = .008;
    }
    Object.assign(CAM, cam);
  } });
}

/* ======================= 十二 · 领奖台 ======================= */
{
  const S = stage(10), { grp, W, P, O } = S;
  const T0 = chapterAt('n1').t1, T1 = chapterAt('e1').t0;
  const onSp = new THREE.Group(); scene.add(onSp); only(grp, T0, T1); only(onSp, T0, T1);
  const tN2 = c('n2'), tN3 = c('n3');
  const hin = await photo('hinton_nobel.jpg', 14, { depth: 1.8, edge: .03, sat: .85, tint: [1, 1, 1] }); grp.add(hin);
  const hCard = infoCard({ title: '2024 · 诺贝尔物理学奖', rows: [['霍普菲尔德', '', ''], ['辛顿', '', '']], src: '照片：2024 诺贝尔讲座<br>Jay Dixit · CC BY-SA' });
  hCard.show(cw('n1', '物理学奖') - .4, tN2 - .4, [cw('n1', '霍普菲尔德') - .2, cw('n1', '辛顿') - .2]);
  const has = await photo('hassabis.jpg', 11, { depth: 1.5, edge: .04, sat: .85, tint: [1, 1, 1] }); has.position.set(60, 0, 0); grp.add(has);
  const sCard = infoCard({ title: '2024 · 诺贝尔化学奖', rows: [['1 / 2', '哈萨比斯 · 詹伯', ''], ['蛋白质', '结构预测', '']], src: '照片：Arthur Petron · CC BY-SA' });
  sCard.show(tN2 - .2, tN3 - .4, [cw('n2', '半数') - .2, cw('n2', '蛋白质') - .2]);
  /* 1969 → 2024 的弧线 */
  const A0 = new THREE.Vector3(X(1969), LANE.learn, 0), A1 = new THREE.Vector3(X(2024), LANE.learn, 0), AC = new THREE.Vector3(X(1996.5), 62, 8);
  const curve = new THREE.QuadraticBezierCurve3(A0, AC, A1), cp = curve.getPoints(160);
  const arc = line2(cp.map(v => v.toArray()), 0xffffff, 5); arc.material.color.setRGB(2.6, 1.6, .5); onSp.add(arc);
  const headG = glow(0, 0, 0, 4, onSp);
  const y55 = textMesh('55 年', 13, { font: '900 200px SourceHanSerif', color: '#f2b33d', hdr: 1.1 }); y55.position.set(X(1996.5), 40, 4); onSp.add(y55);
  const tArc0 = cw('n3', '55 年后') - .8, tArc1 = cw('n3', '诺贝尔') + .3;
  sfx(T0, 'flash', { g: .4 }); sfx(tN2 - .3, 'flash', { g: .5 }); sfx(tN3 - .3, 'whoosh', { d: 1, g: .6 });
  sfx(tArc0, 'riser', { d: tArc1 - tArc0, g: .8 }); sfx(tArc1, 'chime', { g: .9 }); sfx(tArc1, 'boom', { g: .7 });
  shot({ name: 'ch12', t0: T0, t1: T1, look(t) {
    LOOK.digital(G, F);
    const onSpine = t >= tN3 - .3;
    grp.visible = !onSpine; onSp.visible = onSpine; hin.visible = t < tN2 - .3; has.visible = !hin.visible;
    let cam;
    if (hin.visible) {
      const k = E.io2(seg(t, T0, tN2 - .3));
      cam = P([lerp(-3.4, -2.6, k), lerp(1.4, 1.9, k), lerp(16, 12.5, k)], [lerp(-3.2, -2.5, k), 1.7, 0]);
      G.focus = cam.z - O.z - .6; G.aperture = .0012; G.maxblur = .008; spineState({ on: false });
    } else if (!onSpine) {
      const k = E.io2(seg(t, tN2 - .3, tN3 - .3));
      cam = P([60 - lerp(3.6, 3, k), lerp(1.4, 1.8, k), lerp(15, 12, k)], [60 - lerp(3.4, 2.8, k), 1.6, 0]);
      G.flash = flashIn(t, tN2 - .3); G.focus = cam.z - O.z - .5; G.aperture = .0012; G.maxblur = .008; spineState({ on: false });
    } else {
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [1, 1], iceDir: 1, cut: 1, cutLabel: 1, ember: 1, head: 1, origin: 1 });
      const ka = E.io2(seg(t, tArc0, tArc1)); drawTo(arc, ka); const hp = curve.getPoint(Math.max(.001, ka)); headG.position.copy(hp); headG.visible = ka > 0 && ka < 1; headG.scale.setScalar(4 + Math.sin(t * 20) * .4);
      y55.userData.u.uOp.value = E.o3(seg(t, cw('n3', '55 年后') - .2, cw('n3', '55 年后') + .4));
      const start = { x: X(1969) + 8, y: -1, z: 24, tx: X(1969) + 1, ty: LANE.learn - 1, tz: 0, fov: 35, roll: 0 };
      const ride = { x: hp.x - 30, y: hp.y + 8, z: 70, tx: hp.x + 10, ty: hp.y * .7, tz: 0, fov: 38, roll: 0 };
      const end = { x: X(1996.5), y: 26, z: 330, tx: X(1996.5), ty: 18, tz: 0, fov: 35, roll: 0 };
      cam = mixP(mixP(start, ride, E.io3(seg(t, tArc0 - .4, tArc0 + .6))), end, E.io3(seg(t, tArc1 - 1.2, T1)));
      G.flash = flashIn(t, tN3 - .3) + .35 * Math.exp(-Math.pow((t - tArc1 + .1) / .1, 2)); G.bloom = .8; G.streak = .6;
    }
    Object.assign(CAM, cam);
  } });
}

/* ======================= 尾声 · 前方 ======================= */
{
  const S = stage(11), { grp, W, P, O } = S;
  const T0 = chapterAt('e1').t1, T1 = DUR + 1;
  const onSp = new THREE.Group(); scene.add(onSp); only(grp, T0, T1); only(onSp, T0, T1);
  const tE2 = c('e2'), tE3 = c('e3'), tE4 = c('e4'), tE5 = c('e5'), tE6 = c('e6'), tE7 = c('e7'), tE8 = c('e8');
  /* IMO 2025：35 / 42（金牌线 35） */
  const imo = el(null, 'position:absolute;left:0;top:250px;width:1920px;display:flex;flex-direction:column;align-items:center'); hidden(imo);
  el(imo, `position:relative;font:700 36px/1 JBM;color:${COL.amber};letter-spacing:3px;margin-bottom:40px`, 'IMO 2025 · 国际数学奥林匹克', { 'data-chk': 'text' });
  const cells = el(imo, 'position:relative;display:flex;gap:18px;margin-bottom:46px');
  const cellE = [7, 7, 7, 7, 7, 0].map((v, i) => { const b = el(cells, `position:relative;width:150px;height:150px;border:2px solid rgba(244,239,230,.25);display:flex;flex-direction:column;align-items:center;justify-content:center`); el(b, `position:relative;font:700 30px/1 JBM;color:${COL.mute}`, 'P' + (i + 1), { 'data-chk': 'text' }); const n = el(b, `position:relative;margin-top:14px;font:900 64px/1 SourceHanSerif;color:${COL.white}`, '', { 'data-chk': 'text' }); return { b, n, v }; });
  const tot = el(imo, `position:relative;font:900 140px/1 SourceHanSerif;color:${COL.white};font-variant-numeric:tabular-nums`, '', { 'data-chk': 'text' });
  el(imo, `position:relative;margin-top:22px;font:700 36px/1 PuHuiTi;color:#cfc6b8`, '金牌线 35 分', { 'data-chk': 'text' });
  tl.fromTo(imo, { opacity: 0 }, { opacity: 1, duration: .4, immediateRender: false }, tE2 - .1).to(imo, { opacity: 0, duration: .3 }, tE3 - .4);
  /* 代理：写代码 / 查资料 / 操作电脑（通用界面，示意） */
  const ag = el(null, 'position:absolute;left:150px;top:230px;width:1620px;display:flex;gap:36px'); hidden(ag);
  const pane = (title) => { const p = el(ag, 'position:relative;flex:1;height:520px;border:1px solid rgba(244,239,230,.22);background:rgba(20,17,13,.85);padding:30px'); el(p, `position:relative;font:700 30px/1 JBM;color:${COL.amber};letter-spacing:2px;margin-bottom:28px`, title, { 'data-chk': 'text' }); return p; };
  const pc = pane('写代码'), ps = pane('查资料'), po = pane('操作电脑');
  const code = el(pc, `position:relative;font:500 30px/1.6 JBM;color:${COL.white};white-space:pre`, '', { 'data-chk': 'text' });
  const srch = el(ps, `position:relative;font:500 30px/1.6 JBM;color:${COL.white};white-space:pre-wrap`, '', { 'data-chk': 'text' });
  const btn = el(po, `position:absolute;left:110px;top:300px;padding:22px 44px;border:2px solid ${COL.amber};font:700 34px/1 PuHuiTi;color:${COL.amber}`, '提交', { 'data-chk': 'text' });
  el(po, `position:absolute;left:30px;top:120px;width:380px;font:500 30px/1.6 PuHuiTi;color:#cfc6b8`, '打开网页 → 填表 → 点击', { 'data-chk': 'text' });
  const cur = el(po, 'position:absolute;left:380px;top:460px;width:0;height:0;border-left:16px solid #fff;border-top:10px solid transparent;border-bottom:10px solid transparent;transform:rotate(-30deg)');
  tl.fromTo(ag, { opacity: 0 }, { opacity: 1, duration: .3, immediateRender: false }, tE3 - .2).to(ag, { opacity: 0, duration: .3 }, tE4 - .4);
  typeOn(code, 'def mean(xs):\n    return sum(xs) / len(xs)', cw('e3', '写代码') - .2, 34);
  typeOn(srch, '搜索：Lighthill report 1973\n→ 3 篇来源', cw('e3', '查资料') - .2, 30);
  tl.fromTo(cur, { left: 380, top: 460 }, { left: 190, top: 330, duration: .7, ease: 'power2.inOut', immediateRender: false }, cw('e3', '操作电脑') - .4).to(btn, { backgroundColor: 'rgba(242,179,61,.35)', duration: .1 }, cw('e3', '操作电脑') + .35).to(btn, { backgroundColor: 'rgba(242,179,61,0)', duration: .3 });
  /* 回到 1950：论文首页的那个问题 + 最后一句（原文） */
  const pg = typeset({ PW: 1700, PH: 1300, M: 150, font: '500 50px EBGaramond', lh: 76, justify: true, top: 300,
    head: (g, PW) => { g.textAlign = 'center'; g.font = '600 54px EBGaramond'; g.fillText('COMPUTING MACHINERY AND INTELLIGENCE', PW / 2, 170); g.font = '500 38px EBGaramond'; g.fillText('BY A. M. TURING · MIND, 1950', PW / 2, 240); g.textAlign = 'left'; return 380; },
    text: "I PROPOSE to consider the question, {q:'Can machines think?'} This should begin with definitions of the meaning of the terms 'machine' and 'think'." });
  const pDoc = doc(pg, 10, { sat: .3 }); pDoc.position.set(80, 0, 0); grp.add(pDoc);
  const last = typeset({ PW: 1700, PH: 1100, M: 150, font: '500 54px EBGaramond', lh: 82, top: 260, hide: ['l'],
    text: '… Again I do not know what the right answer is, but I think both approaches should be tried.\n{l:We can only see a short distance ahead, but we can see plenty there that needs to be done.}' });
  const lDoc = doc(last, 10, { sat: .3 }); lDoc.position.set(140, 0, 0); grp.add(lDoc);
  /* 最后一句逐字打出来：纸上先空着这一句，按原排版的位置一行行打 */
  const lpx = 10 / 1700, lLines = last.marks.l.map(r => { const m = wipeText(r.text, 54 * 1.35 * lpx, { font: '500 200px EBGaramond', color: '#1b1612' }); m.position.set((r.x0 - 850) * lpx, (550 - r.y + .34 * 54) * lpx, .004); m.renderOrder = 4; lDoc.add(m); return m; });
  const lmo = motes(200, [16, 12, 8], 91, .3); lmo.position.set(110, 0, 3); grp.add(lmo);
  const lSrc = label(`right:96px;top:56px;text-align:right;font:500 28px/1 JBM;color:#b3aa9c;background:rgba(8,7,6,.78);padding:12px 18px`, '图灵 1950 · 论文最后一句', tE6 + .3, tE8 - .4);
  /* 倒飞：2025 → 1950 */
  const tBack0 = tE4 - .3, tBack1 = cw('e4', '图灵发问') + .1;
  const backX = track([[tBack0, X(2025)], [tBack1, X(1950)]]);
  /* 片尾（升华）：纸面化成一束光落回 1950 → 光沿七十年一路跑到 2026，胶片随年代变 → 轴没有终点，化成一串光点伸向星海
     → 片名下打出 1950 — 2026，再把 2026 删掉，只留光标：故事还没写完 */
  const tF0 = tE8 - .3, tRun0 = tE8 + .35, tRun1 = tE8 + 3.6, tFut = tE8 + 3.6, tTitle = tE8 + 5.0;
  const runX = track([[tRun0, X(1950)], [tRun1, X(2026)], [DUR, X(2026) + 260]]);
  const runner = glow(0, 0, 0, 4, onSp), trail = [...Array(14)].map((_, i) => glow(0, 0, 0, 3 * (1 - i / 16), onSp));
  const NF = 160, futP = new Float32Array(NF * 3); for (let i = 0; i < NF; i++) futP.set([X(2026) + 2.5 + i * 2.5 * (1 + i * .012), 0, 0], i * 3);
  const futG = new THREE.BufferGeometry(); futG.setAttribute('position', new THREE.BufferAttribute(futP, 3));
  const futU = { uK: { value: 0 } };
  const future = new THREE.Points(futG, new THREE.ShaderMaterial({ uniforms: futU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `uniform float uK; varying float vA; void main(){ float i = float(gl_VertexID); vA = clamp(uK * 160. - i, 0., 1.) * (1. - i / 170.); vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = 26. * (20. / -mv.z); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vec3(2.4, 1.5, .5) * smoothstep(.5, 0., d) * vA, 1.); }` }));
  future.frustumCulled = false; onSp.add(future);
  const NSt = 9000, stP = new Float32Array(NSt * 3); for (let i = 0; i < NSt; i++) stP.set([X(2040) + hash(i * 1.1) * 900, (hash(i * 2.3) - .5) * 260, (hash(i * 3.7) - .5) * 320], i * 3);
  const stG = new THREE.BufferGeometry(); stG.setAttribute('position', new THREE.BufferAttribute(stP, 3));
  const sky = new THREE.Points(stG, pointsMat([1.2, 1.15, 1.05], .9, 0)); sky.frustumCulled = false; onSp.add(sky);
  const fin = hidden(el(null, 'position:absolute;left:0;top:190px;width:1920px;display:flex;flex-direction:column;align-items:center'));
  const finT = el(fin, `position:relative;font:900 150px/1 SourceHanSerif;color:#f6efe2;letter-spacing:10px`, '', { 'data-chk': 'text' });
  const finS = el(fin, `position:relative;margin-top:34px;font:700 44px/1 JBM;color:${COL.amber};letter-spacing:14px;height:44px;white-space:pre`, '', { 'data-chk': 'text' });
  tl.set(fin, { opacity: 1 }, tTitle - .1); letters(finT, 'AI 七十年', tTitle, .08, .9);
  { const full = '1950 — 2026', tT = tTitle + .9, tDel = tTitle + 3.1;   // 先打出 2026，再一个字一个字删掉，光标一直闪
    onFrame(t => { if (t < tT) { finS.textContent = ''; return; } const k = Math.floor(clamp((t - tT) * 16, 0, full.length)), del = Math.floor(clamp((t - tDel) * 7, 0, 4)); finS.textContent = full.slice(0, k - del) + (t < tDel + .6 || Math.floor(t * 1.7) % 2 === 0 ? '▍' : ' '); }); }
  tl.to(fin, { opacity: 0, duration: 1.4 }, DUR - 1.6);

  { const tc = cw('e2', '金牌级') - .9; for (let i = 0; i < 6; i++) sfx(tc + i * .22, 'tick', { g: .3, f: i < 5 ? 1200 : 300 }); sfx(tc + 1.4, 'chime', { g: .5 }); }
  [...'def mean(xs):'].forEach((_, i) => sfx(cw('e3', '写代码') - .2 + i / 34, 'key', { g: .22 })); [...'搜索：Lighthill'].forEach((_, i) => sfx(cw('e3', '查资料') - .2 + i / 30, 'key', { g: .22 })); sfx(cw('e3', '操作电脑') + .35, 'click', { g: .6 });
  sfx(tBack0, 'riser', { d: tBack1 - tBack0, g: .7 }); sfx(tBack0, 'whoosh', { d: tBack1 - tBack0 + .3, g: .6 }); sfx(tBack1 + .3, 'paper', { g: .7 }); sfx(cw('e4', '机器能思考吗') - .1, 'marker');
  sfx(tE6 - .3, 'paper', { g: .6 }); { const n = last.marks.l.reduce((a, r) => a + r.text.length, 0), d = ce('e7') - tE7 + .1; for (let i = 0; i < n; i += 1) sfx(tE7 - .1 + d * i / n, 'type', { g: .3 }); }
  sfx(tF0 - .7, 'swell', { d: .9, g: .7 }); sfx(tRun0, 'whoosh', { d: tRun1 - tRun0, g: .7 }); sfx(tRun1, 'shimmer', { d: 4, g: .5 }); sfx(tTitle, 'boom', { g: .9 });
  for (let k = 0; k < 4; k++) sfx(tTitle + 3.1 + k / 7, 'key', { g: .2 });
  shot({ name: 'epilogue', t0: T0, t1: T1, look(t) {
    let cam;
    const onSpine = t < tE2 - .3 || (t >= tBack0 && t < tBack1 + .3) || t >= tE8 - .3;
    grp.visible = !onSpine; onSp.visible = onSpine;
    pDoc.visible = t >= tBack1 + .3 && t < tE6 - .3; lDoc.visible = lmo.visible = t >= tE6 - .3 && t < tE8 - .3; lmo.userData.step(t);
    if (t < tE2 - .3) {   // 2025：轴的最前端
      LOOK.digital(G, F);
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [1, 1], iceDir: 1, cut: 1, ember: 1, head: 1, origin: 1 });
      const k = E.io2(seg(t, T0, tE2 - .3));
      cam = { x: X(lerp(2019, 2024, k)), y: lerp(2, 3, k), z: lerp(26, 20, k), tx: X(lerp(2023, 2027, k)), ty: 0, tz: 0, fov: 35, roll: 0 };
    } else if (t < tBack0) {   // IMO / 代理（版面为主，背景压暗的轴）
      LOOK.digital(G, F); spineState({ on: false });
      if (t < tE3 - .3) { const tc = cw('e2', '金牌级') - .9; let s = 0; cellE.forEach((o, i) => { const k = seg(t, tc + i * .22, tc + .2 + i * .22); o.n.textContent = k > 0 ? String(o.v) : ''; o.b.style.borderColor = k > 0 ? (o.v ? COL.amber : 'rgba(244,239,230,.25)') : 'rgba(244,239,230,.25)'; if (k > 0) s += o.v; }); tot.innerHTML = `${s} <span style="font:700 60px SourceHanSerif;color:#cfc6b8">/ 42</span>`; }
      cam = P([0, 0, 30], [0, 0, 0]); G.flash = flashIn(t, tE2 - .3) + flashIn(t, tE3 - .3);
    } else if (t < tBack1 + .3) {   // 倒飞：胶片一层层变回银盐
      const x = backX(t), v = (backX(t - .02) - backX(t + .02)) / .04, yr = 1950 + x / 10;
      (yr > 1995 ? LOOK.digital : yr > 1975 ? LOOK.crt : LOOK.silver)(G, F);
      const old = clamp((2000 - yr) / 45); G.sat = 1 - .5 * old; F.grain = .1 + .45 * old; F.flicker = .35 * old; F.scratch = .35 * old;
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [1, 1], iceDir: 1, cut: 1, ember: 1, head: 1, origin: 1 });
      cam = { x: x - 8, y: 5.2, z: 13.5, tx: x + 46, ty: -.6, tz: -1.5, fov: 38 + clamp(Math.abs(v) / 450) * 12, roll: .025 * clamp(Math.abs(v) / 300) };
      G.blur = [clamp(Math.abs(v) / 420) * .045, 0]; G.flash = .7 * E.i2(seg(t, tBack1 - .1, tBack1 + .3));
      cam = mixP(cam, { x: X(1950) - .6, y: .2, z: 3, tx: X(1950), ty: 0, tz: 0, fov: 35, roll: 0 }, E.i3(seg(t, tBack1 - .6, tBack1 + .3)));
    } else if (t < tE6 - .3) {   // 机器能思考吗
      LOOK.silver(G, F); spineState({ on: false });
      const kIn = E.o5(seg(t, tBack1 + .3, tBack1 + 1.1)); pDoc.rotation.set(lerp(-.9, -.15, kIn), lerp(.2, .03, kIn), 0); pDoc.position.y = lerp(-8, 0, kIn); pDoc.updateMatrixWorld();
      pDoc.userData.hi('q', E.io2(seg(t, cw('e4', '机器能思考吗') - .1, cw('e4', '机器能思考吗') + .6)));
      const q = pDoc.localToWorld(pDoc.userData.at('q').clone()), k = E.io3(seg(t, tBack1 + .3, tE5 + 1)), kz = E.io2(seg(t, tE5, tE6 - .3));
      const qq = q.clone().lerp(pDoc.localToWorld(new THREE.Vector3(0, q.y - pDoc.position.y, 0)), 1 - E.io2(seg(t, tBack1 + .6, tE4 + 2.4)));
      cam = pose({ x: qq.x + .4, y: qq.y - 1.4, z: qq.z + lerp(12, 6, k) + 2 * kz }, qq, 35, -.015);
      G.flash = flashIn(t, tBack1 + .3, .6); G.focus = lerp(12, 6.2, k) + 2 * kz; G.aperture = .0013; G.maxblur = .009;
    } else if (t < tE8 - .3) {   // 最后一句
      LOOK.silver(G, F); spineState({ on: false }); F.scratch = .2;
      const kIn = E.o5(seg(t, tE6 - .3, tE6 + .6)); lDoc.rotation.set(lerp(-.8, -.14, kIn), lerp(-.2, -.03, kIn), 0); lDoc.position.y = lerp(-8, 0, kIn); lDoc.updateMatrixWorld();
      const nl = lLines.length, kt = seg(t, tE7 - .1, ce('e7')); lLines.forEach((m, i) => m.userData.type(clamp(kt * nl - i)));
      lDoc.userData.hi('l', E.io2(seg(t, ce('e7') + .1, ce('e7') + 1.2)));
      const ym = (last.marks.l[0].y + last.marks.l[last.marks.l.length - 1].y) / 2, tgt = lDoc.localToWorld(new THREE.Vector3(.2, (550 - ym + 30) * lpx, 0)), dz = lerp(10.5, 9.2, E.io2(seg(t, tE6, tE8)));
      cam = pose({ x: tgt.x + .3, y: tgt.y - 1.5, z: tgt.z + dz }, tgt, 35, .01);
      G.flash = flashIn(t, tE6 - .3) + .9 * E.i3(seg(t, tE8 - 1, tE8 - .25)); G.focus = dz; G.aperture = .0012; G.maxblur = .008;
    } else {   // 升华：光沿七十年跑到今天，再伸向前方
      const rx = runX(t), yr = 1950 + Math.min(rx, X(2026)) / 10, inRun = t < tFut;
      (yr > 1995 ? LOOK.digital : yr > 1975 ? LOOK.crt : LOOK.silver)(G, F);
      const old = clamp((2000 - yr) / 45); G.sat = 1 - .5 * old; F.grain = .1 + .4 * old; F.flicker = .25 * old; F.scratch = .25 * old; G.streak = .55; G.bloom = .75;
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [1, 1], iceDir: 1, cut: 1, cutLabel: 0, ember: 1, head: 0, origin: 1 });
      runner.visible = t >= tRun0; runner.position.set(rx, 0, .2); runner.scale.setScalar(inRun ? 4.2 + .4 * Math.sin(t * 22) : lerp(4.2, 1.2, E.o3(seg(t, tFut, tFut + 3))));
      trail.forEach((g, i) => { const tx = runX(t - (i + 1) * .035); g.visible = runner.visible && tx > X(1950); g.position.set(tx, 0, .2); g.material.opacity = (1 - i / 14) * .6; });
      futU.uK.value = E.io2(seg(t, tFut - .3, tFut + 2.6)); sky.material.opacity = .85 * E.io2(seg(t, tFut, tFut + 2.4));
      const v = (runX(t + .02) - runX(t - .02)) / .04;
      const chase = { x: rx - 13, y: 4.2, z: 15, tx: rx + 10, ty: -.4, tz: 0, fov: 38 + clamp(v / 450) * 10, roll: -.02 };
      const ahead = { x: X(2026) - 18, y: 6, z: 11, tx: X(2026) + 120, ty: -2, tz: -8, fov: 40, roll: 0 };
      const dive = { x: X(1950) - 4, y: 1.2, z: 6, tx: X(1950) + 6, ty: 0, tz: 0, fov: 38, roll: 0 };
      cam = mixP(mixP(dive, chase, E.io2(seg(t, tF0 + .2, tRun0 + .5))), ahead, E.io3(seg(t, tFut - .5, tFut + 2.2)));
      cam.y += .15 * Math.sin(t * .9); cam.z += (t > tFut ? -1.5 * E.io2(seg(t, tFut, DUR)) : 0);
      G.blur = [clamp(v / 420) * .04 * (inRun ? 1 : 0), 0];
      G.flash = .9 * Math.exp(-Math.pow((t - tF0 - .1) / .18, 2)) + .25 * Math.exp(-Math.pow((t - tRun1) / .12, 2)); G.fade = E.io2(seg(t, DUR - 1.6, DUR - .1));
    }
    Object.assign(CAM, cam);
  } });
}

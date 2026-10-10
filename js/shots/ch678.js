/* 六 · 寒冬里的火种（y1–y7）：冰层下 1986 一点火苗 → 《自然》论文 → 真跑的小网络学异或（误差往回传，边界弯了）
   → 杨立昆 + MNIST 手写数字 → 支票 → 拉远：火苗还很细
   七 · 深蓝（z1–z4）：3D 棋盘按 1997 第 6 局棋谱重下 → 卡斯帕罗夫 → 每走一步炸开一棵搜索树（每秒 2 亿步）→ 井字棋：它不会
   八 · 数据和显卡（g1–g8）：李飞飞 → 1400 万张图的点阵墙 → 167 国众包工人 → 显卡芯片 + 并行 → AlexNet 源码
   → 26.2% vs 15.3% → 2012 学习轨炸亮 → 苏茨克维 */
import { THREE, scene, CAM, G, canvasTex, loadTex, plane } from '../gl.js';
import { F } from '../film.js';
import { tl, c, cw, COL, el, hidden, letters, typeOn, seg, lerp, clamp, E, hash, shot, sfx } from '../core.js';
import { X, LANE, spineState, glow } from '../spine.js';
import { stage, photo, textMesh, typeset, doc, motes, pose, mixP, LOOK, wipeText, ringTex, sprite, infoCard, label, only, shade } from '../kit.js';
import { chapterAt } from '../chapter.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const line2 = (pts, col, w) => { const g = new LineGeometry(); g.setPositions(pts.flat()); const m = new LineMaterial({ color: col, linewidth: w, transparent: true, depthWrite: false, worldUnits: false, toneMapped: false }); m.resolution.set(1920, 1080); return new Line2(g, m); };
const shake = (cam, t, t0, amp, dur = .6) => { if (t < t0 || t > t0 + dur) return cam; const s = (1 - (t - t0) / dur) ** 2 * amp; return { ...cam, x: cam.x + (hash(t * 97) - .5) * s, y: cam.y + (hash(t * 71) - .5) * s }; };
const sig = x => 1 / (1 + Math.exp(-x));
const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
/* MNIST 样例图（16 列 × 10 行，每行一个数字）：取一格做成发光的手写数字 */
const mnistTex = await loadTex('素材/图/mnist.png');
/* 格子位置按图里墨迹的实际间隔量出来（不是均匀的 16×10） */
const MCX = [[30, 53], [64, 87], [101, 123], [135, 158], [170, 192], [208, 227], [243, 264], [278, 300], [314, 334], [347, 370], [383, 404], [418, 440], [454, 475], [491, 510], [524, 547], [561, 581]].map(([a, b]) => (a + b) / 2);
const MRY = [[13, 35], [47, 68], [79, 101], [113, 136], [146, 169], [180, 203], [211, 233], [248, 270], [280, 302], [314, 336]].map(([a, b]) => (a + b) / 2);
const MC = 36, MR = 34, cellX = col => MCX[col] - MC / 2, cellY = d => MRY[d] - MR / 2;
const digitMesh = (d, col, s = 1) => {
  const m = new THREE.ShaderMaterial({ uniforms: { uMap: { value: mnistTex }, uCell: { value: new THREE.Vector4(cellX(col) / 594, 1 - (cellY(d) + MR) / 361, MC / 594, MR / 361) }, uOp: { value: 1 }, uCol: { value: new THREE.Vector3(.95, .92, .86) } },
    vertexShader: VS, fragmentShader: `uniform sampler2D uMap; uniform vec4 uCell; uniform float uOp; uniform vec3 uCol; varying vec2 vUv;
      void main(){ vec4 c = texture2D(uMap, uCell.xy + vUv * uCell.zw); float ink = c.a * (1. - c.r); gl_FragColor = vec4(uCol * ink, ink * uOp); }`,
    transparent: true, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(s, s * MR / MC), m); mesh.userData.u = m.uniforms; return mesh;
};

/* ======================= 六 · 寒冬里的火种 ======================= */
{
  const S = stage(4), { grp, W, P, O } = S;
  const T0 = chapterAt('y1').t1, T1 = chapterAt('z1').t0;
  const onSp = new THREE.Group(); scene.add(onSp); only(grp, T0, T1); only(onSp, T0, T1);
  const tY2 = c('y2'), tY3 = c('y3'), tY4 = c('y4'), tY5 = c('y5'), tY6 = c('y6'), tY7 = c('y7');
  /* 冰层下的火苗 */
  const flame = glow(X(1986), LANE.learn, .1, 3, onSp);
  /* 《自然》1986（题目、作者、刊期、摘要首句为原文） */
  const nat = typeset({ PW: 1700, PH: 1500, M: 150, font: '500 50px EBGaramond', lh: 74, justify: true,
    head: (g, PW) => { g.font = '700 40px EBGaramond'; g.letterSpacing = '6px'; g.fillText('NATURE VOL. 323 9 OCTOBER 1986', 150, 170); g.letterSpacing = '0px'; g.fillRect(150, 200, PW - 300, 3);
      g.font = '700 78px EBGaramond'; g.fillText('Learning representations', 150, 330); g.fillText('by back-propagating errors', 150, 420);
      g.font = '500 46px EBGaramond'; g.fillText('David E. Rumelhart, Geoffrey E. Hinton', 150, 520); g.fillText('& Ronald J. Williams', 150, 580); return 720; },
    text: 'We describe a new learning procedure, {b:back-propagation,} for networks of neurone-like units. The procedure repeatedly adjusts the weights of the connections in the network so as to minimize a measure of the difference between the actual output vector of the net and the desired output vector.' });
  const natDoc = doc(nat, 10, { sat: .25 }); natDoc.position.set(40, 0, 0); grp.add(natDoc);
  const nmo = motes(200, [16, 14, 8], 61, .3); nmo.position.set(40, 0, 3); grp.add(nmo);
  label(`right:96px;top:56px;text-align:right;font:500 28px/1 JBM;color:#b3aa9c;background:rgba(8,7,6,.78);padding:12px 18px`, 'Nature 323, 533–536（1986）', tY2 + .6, tY3 - .3);
  /* 小网络：2 → 3 → 1，真跑反向传播学异或（每一轮的权重都记下来） */
  const DATA = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]], NH = 3, EP = 1500;
  const snaps = [];
  { let W1 = [...Array(6)].map((_, i) => (hash(i * 3.1 + 17) - .5) * 2), b1 = [...Array(3)].map((_, i) => (hash(i * 5.3 + 11) - .5) * 2), W2 = [...Array(3)].map((_, i) => (hash(i * 7.9 + 13) - .5) * 2), b2 = 0;
    for (let ep = 0; ep <= EP; ep++) {
      const g1 = W1.map(() => 0), gb1 = b1.map(() => 0), g2 = W2.map(() => 0); let gb2 = 0, err = 0;
      for (const [x1, x2, y] of DATA) { const h = b1.map((b, j) => sig(W1[j * 2] * x1 + W1[j * 2 + 1] * x2 + b)), o = sig(h.reduce((s, v, j) => s + v * W2[j], b2)); err += .5 * (o - y) ** 2; const d = (o - y) * o * (1 - o); gb2 += d; h.forEach((v, j) => { g2[j] += d * v; const dh = d * W2[j] * v * (1 - v); gb1[j] += dh; g1[j * 2] += dh * x1; g1[j * 2 + 1] += dh * x2; }); }
      snaps.push({ W1: [...W1], b1: [...b1], W2: [...W2], b2, err });
      W1 = W1.map((w, i) => w - 2.2 * g1[i]); b1 = b1.map((w, i) => w - 2.2 * gb1[i]); W2 = W2.map((w, i) => w - 2.2 * g2[i]); b2 -= 2.2 * gb2;
    } }
  const net = new THREE.Group(); net.position.set(100, 0, 0); grp.add(net);
  const NX = -6.5, NI = [[NX - 5, 2.2], [NX - 5, -2.2]], NHp = [[NX, 3.6], [NX, 0], [NX, -3.6]], NO = [NX + 5, 0];
  const edges = [];
  NHp.forEach((h, j) => NI.forEach((ii, i) => edges.push({ a: ii, b: h, w: s => s.W1[j * 2 + i], L: 0, j })));
  NHp.forEach((h, j) => edges.push({ a: h, b: NO, w: s => s.W2[j], L: 1, j }));
  edges.forEach(e => { e.line = line2([[...e.a, 0], [...e.b, 0]], 0xffffff, 2); net.add(e.line); });
  const nodes = [...NI, ...NHp, NO].map(([x, y]) => glow(x, y, .05, 2.2, net));
  const nLab = [['输入', NX - 5, 4.6], ['隐藏层', NX, 5.8], ['输出', NX + 5, 2.2]].map(([s, x, y]) => { const m = textMesh(s, .7, { font: '700 200px PuHuiTi', color: '#cfc6b8' }); m.position.set(x, y, 0); net.add(m); return m; });
  const pulses = [...Array(9)].map(() => { const g = glow(0, 0, .1, 1.3, net); g.material.color.setRGB(1.4, 1.8, 2.6); return g; });
  const BU = { uW: { value: new Array(13).fill(0) }, uOp: { value: 0 } };
  const bnd = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.ShaderMaterial({ uniforms: BU, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, vertexShader: VS,
    fragmentShader: `uniform float uW[13]; uniform float uOp; varying vec2 vUv;
      float sg(float x){ return 1. / (1. + exp(-x)); }
      void main(){ vec2 p = (vUv - .5) * 10.; vec2 x = (p + 3.) / 6.;
        float o = uW[12]; for (int j = 0; j < 3; j++) o += sg(uW[j * 2] * x.x + uW[j * 2 + 1] * x.y + uW[6 + j]) * uW[9 + j]; o = sg(o);
        float fw = max(fwidth(o), 1e-4); vec3 col = mix(vec3(.5, .62, .82), vec3(1., .6, .14), o) * .14 + vec3(3., 1.9, .6) * (1. - smoothstep(0., 2.2 * fw, abs(o - .5))) * smoothstep(.002, .03, fw);
        vec2 gr = abs(fract(p / 1.5 + .5) - .5) * 1.5; col += vec3(.9, .85, .78) * (1. - smoothstep(0., .025, min(gr.x, gr.y))) * .04;
        gl_FragColor = vec4(col * smoothstep(5., 3.6, max(abs(p.x), abs(p.y))) * uOp, 1.); }` }));
  bnd.position.set(7, 0, 0); net.add(bnd);
  const bDots = DATA.map(([a, b, y]) => { const g = glow(7 + (a ? 3 : -3), b ? 3 : -3, .1, 2.2, net); g.material.color.setRGB(...(y ? [2.6, 1.6, .5] : [1.3, 1.45, 1.75])); return g; });
  const tTr0 = tY3 + .2, tSolve = cw('y4', '迎刃而解') - .05, tTr1 = tY5 - .4;   // 第 155 轮第一次四个点全分对，卡在「迎刃而解」
  const snapAt = t => snaps[Math.round(t < tSolve ? 155 * Math.pow(seg(t, tTr0, tSolve), 1.15) : lerp(155, EP, Math.pow(seg(t, tSolve, tTr1), 1.6)))];
  const epCtr = el(null, `position:absolute;left:0;top:836px;width:1920px;text-align:center;font:700 38px/1 JBM;color:${COL.white};font-variant-numeric:tabular-nums`, '', { 'data-chk': 'text' }); hidden(epCtr);
  tl.set(epCtr, { opacity: 1 }, tTr0).set(epCtr, { opacity: 0 }, tY5 - .3);
  /* 杨立昆 + 手写数字 */
  const lecun = await photo('lecun.jpg', 10, { depth: 1.4, edge: .05, sat: .85, tint: [1, 1, 1] }); lecun.position.set(160, 0, 0); grp.add(lecun);
  const digits = new THREE.Group(); digits.position.set(160 + 9.5, 1, 1); grp.add(digits);
  const DG = [...Array(18)].map((_, k) => { const d = Math.floor(hash(k * 3.7 + 1) * 10), col = Math.floor(hash(k * 5.1 + 2) * 16); const m = digitMesh(d, col, 1.5); m.position.set((k % 6) * 1.9 - 4.75, -Math.floor(k / 6) * 2.6 + 2.6, 0); digits.add(m);
    const lb = textMesh(String(d), .62, { font: '700 200px JBM', color: '#f2b33d' }); lb.position.set(m.position.x, m.position.y - 1.15, 0); digits.add(lb); return { m, lb }; });
  const lcCard = infoCard({ left: 1120, top: 170, shade: false, title: 'YANN LeCUN · 杨立昆', rows: [], src: '照片：Jérémy Barande · CC BY-SA<br>手写数字：MNIST 样例 · Josef Steppan · CC BY-SA' });
  lcCard.show(tY5 - .1, tY6 - .4);
  /* 支票（通用样式，金额是 MNIST 手写数字） */
  const AMT = [[1, 3], [2, 7], [8, 1], [5, 9], [0, 12]];   // [数字, 取第几列的样本]
  const DX = k => 1380 + k * 80 + (k > 2 ? 34 : 0);   // 每个数字的中心（画布像素）
  const chk = canvasTex(1800, 820, (g, w, h) => {
    g.fillStyle = '#e6e0cf'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(80,110,100,${hash(i * 2.9) * .05})`; g.fillRect(hash(i * 1.1) * w, hash(i * 4.3) * h, 3, 3); }
    g.strokeStyle = '#7d8f86'; g.lineWidth = 3; g.strokeRect(24, 24, w - 48, h - 48);
    g.fillStyle = '#4c5b54'; g.font = '700 34px CourierPrime'; g.fillText('PAY TO THE', 90, 300); g.fillText('ORDER OF', 90, 340); g.fillRect(300, 340, 1000, 3);
    g.fillText('DATE', 1200, 150); g.fillRect(1300, 150, 380, 3); g.fillText('DOLLARS', 1420, 480); g.fillRect(90, 480, 1300, 3); g.fillText('MEMO', 90, 700); g.fillRect(200, 700, 500, 3); g.fillRect(1080, 700, 600, 3);
    g.font = '700 30px CourierPrime'; g.fillText('No. 0418', 1500, 90);
    g.strokeRect(1280, 250, 470, 140); g.font = '700 52px CourierPrime'; g.fillText('$', 1296, 340);
    g.globalCompositeOperation = 'multiply'; AMT.forEach(([d, col], k) => g.drawImage(mnistTex.image, cellX(col), cellY(d), MC, MR, DX(k) - 40, 270, 80, 80 * MR / MC)); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#1b1612'; g.beginPath(); g.arc(DX(2) + 52, 352, 6, 0, 7); g.fill();
  });
  const check = plane(chk, 18, 18 * 820 / 1800, { depthWrite: true, sat: .5 }); check.position.set(220, 0, 0); grp.add(check);
  const boxes = AMT.map(([d], k) => { const b = sprite(canvasTex(128, 128, g => { g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(6, 6, 116, 116); }), .84, [2.6, 1.6, .5], false); b.position.set(220 + (DX(k) - 900) * 18 / 1800, (410 - 308) * 18 / 1800, .05); b.renderOrder = 5; grp.add(b);
    const lb = textMesh(String(d), .5, { font: '700 200px JBM', color: '#f2b33d', hdr: 1.6 }); lb.position.set(b.position.x, b.position.y + .82, .06); lb.renderOrder = 5; grp.add(lb); return { b, lb }; });
  const chkCard = infoCard({ left: 150, top: 300, width: 700, title: '1990 年代末', rows: [['10%+', '的美国支票', ''], ['LeNet', '自动读金额', '']] });
  chkCard.show(cw('y6', '一成以上') - .4, tY7 - 1.9);
  const cmo = motes(200, [20, 12, 8], 62, .3); cmo.position.set(220, 0, 3); grp.add(cmo);

  sfx(T0, 'ignite', { g: .7 }); sfx(tY2 - .3, 'paper', { g: .8 }); sfx(cw('y2', '反向传播') - .2, 'marker');
  for (let t0 = tTr0; t0 < tY4 - .2; t0 += 1 / 1.3) { sfx(t0, 'blip', { f: 660, g: .12 }); sfx(t0 + .38, 'blip', { f: 440, g: .1 }); }
  sfx(tSolve, 'chime', { g: .8 });
  for (let k = 0; k < 18; k++) sfx(cw('y5', '手写数字') - 1.2 + k * .12, 'tick', { g: .14, f: 2000 });
  sfx(tY6 - .3, 'paper', { g: .7 }); AMT.forEach((_, k) => sfx(cw('y6', '支票') - .4 + k * .18, 'beep', { g: .25 })); sfx(tY7 - .3, 'whoosh', { d: 1.4, g: .6 });
  shot({ name: 'ch6', t0: T0, t1: T1, look(t) {
    const onSpine = t < tY2 - .3 || t >= tY7 - .3;
    grp.visible = !onSpine; onSp.visible = true; flame.visible = onSpine;
    [nmo, cmo].forEach(m => m.userData.step(t));
    natDoc.visible = nmo.visible = t < tY3 - .3; net.visible = t >= tY3 - .3 && t < tY5 - .3; lecun.visible = digits.visible = t >= tY5 - .3 && t < tY6 - .3; check.visible = cmo.visible = t >= tY6 - .3;
    boxes.forEach(o => o.b.visible = o.lb.visible = check.visible);
    let cam;
    if (t < tY2 - .3) {   // 冰层下一点火苗
      LOOK.cold(G, F);
      const warm = E.io2(seg(t, T0, tY2 - .3)); G.tint = [lerp(.86, 1, warm), .97, lerp(1.08, .96, warm)]; G.frost = lerp(.55, .25, warm);
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [1, 1], iceDir: 1, cut: 1, ember: 1, head: 0, origin: 1 });
      flame.scale.setScalar(lerp(.5, 3.4, E.o3(seg(t, T0, T0 + 1.6))) * (1 + .12 * Math.sin(t * 17) + .08 * Math.sin(t * 29)));
      const k = E.io2(seg(t, T0, tY2 - .3));
      cam = { x: X(1986) + lerp(10, 5, k), y: lerp(1, -1.5, k), z: lerp(22, 15, k), tx: X(1986) + 1, ty: LANE.learn, tz: 0, fov: 35, roll: 0 };
    } else if (t < tY3 - .3) {   // 《自然》论文
      LOOK.crt(G, F); G.sat = 1; F.grain = .3;
      const kIn = E.o5(seg(t, tY2 - .3, tY2 + .7));
      natDoc.rotation.set(lerp(-.9, -.2, kIn), lerp(-.25, -.05, kIn), .01); natDoc.position.y = lerp(-8, 0, kIn); natDoc.updateMatrixWorld();
      const tB = cw('y2', '反向传播'); natDoc.userData.hi('b', E.io2(seg(t, tB - .2, tB + .6)));
      const hd = natDoc.localToWorld(new THREE.Vector3(-1.2, natDoc.userData.h / 2 - 2.6, 0)), b = natDoc.localToWorld(natDoc.userData.at('b').clone());
      const kb = E.io3(seg(t, tB - 1.1, tB + .2)), tgt = hd.clone().lerp(b, kb);
      cam = pose({ x: tgt.x + .4, y: tgt.y - 1.6, z: tgt.z + lerp(10, 6.8, kb) }, tgt, 35, -.015);
      G.focus = lerp(10.2, 7, kb); G.aperture = .0011; G.maxblur = .008; G.flash = .45 * (1 - E.o3(seg(t, tY2 - .3, tY2)));
      spineState({ on: false });
    } else if (t < tY5 - .3) {   // 反向传播真跑
      LOOK.crt(G, F); G.bloom = .7; F.grain = .25;
      const s = snapAt(t), sample = DATA[Math.floor(t * 2.5) % 4], back = t < tY4 - .2;
      edges.forEach(e => { const w = e.w(s), m = e.line.material; m.linewidth = 1 + Math.min(9, Math.abs(w) * 1.4); m.color.setRGB(...(w > 0 ? [2.4, 1.45, .4] : [1.1, 1.4, 2])); m.opacity = .85; });
      const h = s.b1.map((b, j) => sig(s.W1[j * 2] * sample[0] + s.W1[j * 2 + 1] * sample[1] + b)), o = sig(h.reduce((a, v, j) => a + v * s.W2[j], s.b2));
      [sample[0], sample[1], ...h, o].forEach((a, i) => { nodes[i].scale.setScalar(1.3 + 2.2 * a); });
      /* 误差往回传：从输出跑回隐藏层，再跑回输入 */
      const ph = ((t - tTr0) * 1.3) % 1;
      pulses.forEach((p, i) => { const e = i < 3 ? edges[6 + i] : edges[i - 3]; const f = i < 3 ? clamp(ph * 2) : clamp(ph * 2 - 1); p.visible = back && t > tTr0 && f > 0 && f < 1; p.position.set(lerp(e.b[0], e.a[0], f), lerp(e.b[1], e.a[1], f), .1); });
      for (let j = 0; j < 6; j++) BU.uW.value[j] = s.W1[j]; for (let j = 0; j < 3; j++) { BU.uW.value[6 + j] = s.b1[j]; BU.uW.value[9 + j] = s.W2[j]; } BU.uW.value[12] = s.b2;
      BU.uOp.value = E.o3(seg(t, tY3, tY3 + .6));
      const ok = DATA.filter(([a, b, y]) => { const hh = s.b1.map((bb, j) => sig(s.W1[j * 2] * a + s.W1[j * 2 + 1] * b + bb)); return (sig(hh.reduce((q, v, j) => q + v * s.W2[j], s.b2)) > .5) === !!y; }).length;
      epCtr.innerHTML = `第 ${String(snaps.indexOf(s)).padStart(4, '0')} 轮 · 误差 ${s.err.toFixed(3)} · 分对 <span style="color:${ok === 4 ? COL.amber : COL.white}">${ok} / 4</span>`;
      nLab[1].userData.u.uBright.value = 1 + 1.4 * Math.exp(-Math.pow((t - cw('y4', '多加一层')) / .4, 2));
      const k = E.io2(seg(t, tY3 - .3, tY5 - .3));
      cam = P([100 + lerp(-3, 2.5, k), lerp(-2.2, -.6, k), lerp(27, 25, k)], [100 + lerp(-2, 1.4, k), 0, 0], 35, lerp(.02, -.015, k));
      G.flash = .45 * (1 - E.o3(seg(t, tY3 - .3, tY3))); G.aperture = 0;
      spineState({ on: false });
    } else if (t < tY6 - .3) {   // 杨立昆 + 手写数字
      LOOK.digital(G, F); F.grain = .2;
      DG.forEach(({ m, lb }, k) => { const a = E.o3(seg(t, cw('y5', '手写数字') - 1.2 + k * .12, cw('y5', '手写数字') - .7 + k * .12)); m.userData.u.uOp.value = a; lb.userData.u.uOp.value = E.o3(seg(t, cw('y5', '手写数字') - .5 + k * .12, cw('y5', '手写数字') - .1 + k * .12)); m.position.z = (1 - a) * 3; });
      const k = E.io2(seg(t, tY5 - .3, tY6 - .3));
      cam = P([160 + lerp(1.5, 4.5, k), lerp(.8, .6, k), lerp(17, 19, k)], [160 + lerp(1.6, 4.4, k), .4, 0]);
      G.flash = .45 * (1 - E.o3(seg(t, tY5 - .3, tY5))); G.focus = cam.z - O.z - .5; G.aperture = .0006; G.maxblur = .005;
      spineState({ on: false });
    } else if (t < tY7 - .3) {   // 支票
      LOOK.digital(G, F); F.grain = .2;
      const tB = cw('y6', '支票');
      boxes.forEach(({ b, lb }, k) => { const a = E.o3(seg(t, tB - .4 + k * .18, tB + k * .18)); b.material.opacity = a; b.scale.setScalar(lerp(1.6, .84, a)); lb.userData.u.uOp.value = E.o3(seg(t, tB + k * .18, tB + .4 + k * .18)); });
      const k = E.io2(seg(t, tY6 - .3, tY7 - .3));
      const wide = P([220 - lerp(6.5, 5.5, k), lerp(-1, -.6, k), lerp(25, 23, k)], [220 - lerp(6.2, 5.4, k), .3, 0], 35, -.02), amt = P([226.4, .2, 7.5], [226.6, 1.05, 0], 35, -.01);
      cam = mixP(wide, amt, E.io3(seg(t, tY7 - 2, tY7 - .4)));
      G.flash = .4 * (1 - E.o3(seg(t, tY6 - .3, tY6))); G.focus = cam.z - O.z; G.aperture = .0009; G.maxblur = .007;
      spineState({ on: false });
    } else {   // 拉远：火苗还很细
      LOOK.crt(G, F); G.frost = .12;
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [1, 1], iceDir: 1, cut: 1, ember: 1, head: 0, origin: 1 });
      flame.scale.setScalar(2 * (1 + .1 * Math.sin(t * 17)));
      const k = E.io3(seg(t, tY7 - .3, T1));
      cam = { x: X(lerp(1987, 1992, k)), y: lerp(2, 9, k), z: lerp(26, 70, k), tx: X(lerp(1989, 1994, k)), ty: 0, tz: 0, fov: 35, roll: 0 };
      G.flash = .4 * (1 - E.o3(seg(t, tY7 - .3, tY7)));
    }
    Object.assign(CAM, cam);
  } });
}

/* ======================= 七 · 深蓝 ======================= */
{
  const S = stage(5), { grp, W, P, O } = S;
  const T0 = chapterAt('z1').t1, T1 = chapterAt('g1').t0;
  only(grp, T0, T1);
  const tZ2 = c('z2'), tZ3 = c('z3'), tZ4 = c('z4');
  const board = new THREE.Group(); grp.add(board);
  board.add(new THREE.HemisphereLight(0xfff1dd, 0x1a1410, 1.1));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.4); key.position.set(-4, 9, 5); board.add(key);
  const rim = new THREE.DirectionalLight(0x9cc3e0, 1.6); rim.position.set(5, 4, -7); board.add(rim);
  const bTex = canvasTex(1024, 1024, (g, w) => { const s = w / 8; for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { g.fillStyle = (r + f) % 2 ? '#8a7a63' : '#2b241d'; g.fillRect(f * s, r * s, s, s); } for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(0,0,0,${hash(i * 1.7) * .06})`; g.fillRect(hash(i * 2.1) * w, hash(i * 3.3) * w, 6, 1); } });
  const sq = plane(bTex, 8, 8, { depthWrite: true }); sq.rotation.x = -Math.PI / 2; board.add(sq);
  const base = new THREE.Mesh(new THREE.BoxGeometry(8.8, .3, 8.8), new THREE.MeshStandardMaterial({ color: 0x15110d, roughness: .6 })); base.position.y = -.16; board.add(base);
  const files = 'abcdefgh';
  const fl = [...files].map((f, i) => { const m = textMesh(f, .32, { font: '700 200px JBM', color: '#9a9184' }); m.position.set(i - 3.5, .01, 4.22); m.rotation.x = -Math.PI / 2; board.add(m); return m; });
  /* 棋子：车床旋转出来 */
  const V = (a) => a.map(([r, y]) => new THREE.Vector2(r, y));
  const arc = (cx, cy, r, a0, a1, n = 8) => [...Array(n + 1)].map((_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const BASE = [[0, 0], [.34, 0], [.34, .06], [.27, .1], [.22, .15]];
  const PROF = {
    p: [...BASE, [.13, .3], [.18, .34], [.18, .37], [.11, .39], ...arc(0, .5, .13, -1.2, Math.PI / 2)],
    r: [...BASE, [.2, .48], [.26, .52], [.26, .72], [.19, .72], [.19, .66], [0, .66]],
    b: [...BASE, [.13, .44], [.2, .48], [.2, .51], [.12, .53], ...arc(0, .69, .15, -1.3, 1.2), [.05, .86], ...arc(0, .9, .05, -1.2, Math.PI / 2, 4)],
    q: [...BASE, [.15, .56], [.25, .61], [.25, .64], [.16, .67], [.24, .9], [.14, .92], ...arc(0, .97, .06, -1.2, Math.PI / 2, 4)],
    k: [...BASE, [.16, .6], [.26, .65], [.26, .68], [.17, .71], [.24, .94], [.1, .97], [0, .97]],
    n: [...BASE, [.2, .3], [.26, .34], [0, .34]],
  };
  const GEO = {}; for (const [k, p] of Object.entries(PROF)) GEO[k] = new THREE.LatheGeometry(V(p), 28);
  const head = new THREE.Shape(); [[-.2, .3], [.2, .3], [.17, .45], [.1, .54], [.27, .6], [.29, .69], [.13, .79], [.03, .88], [-.06, .86], [-.17, .7], [-.22, .48]].forEach(([x, y], i) => i ? head.lineTo(x, y) : head.moveTo(x, y));
  const headGeo = new THREE.ExtrudeGeometry(head, { depth: .2, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 2 }); headGeo.translate(0, 0, -.1);
  const crossGeo = new THREE.BoxGeometry(.07, .26, .07), crossH = new THREE.BoxGeometry(.2, .07, .07);
  const MAT = { w: new THREE.MeshStandardMaterial({ color: 0xe9dcc2, roughness: .42, transparent: true }), b: new THREE.MeshStandardMaterial({ color: 0x1d1814, roughness: .3, transparent: true }) };
  const mkPiece = (type, col) => { const g = new THREE.Group(); g.add(new THREE.Mesh(GEO[type], MAT[col]));
    if (type === 'n') { const h = new THREE.Mesh(headGeo, MAT[col]); h.rotation.y = col === 'w' ? -Math.PI / 2 : Math.PI / 2; h.scale.setScalar(1.1); g.add(h); }
    if (type === 'k') { const a = new THREE.Mesh(crossGeo, MAT[col]); a.position.y = 1.08; const b = new THREE.Mesh(crossH, MAT[col]); b.position.y = 1.1; g.add(a, b); }
    g.scale.setScalar(1.15); board.add(g); return g; };
  const sqXY = s => [files.indexOf(s[0]) - 3.5, 3.5 - (+s[1] - 1)];
  const pieces = {}, P0 = [];
  const back = 'rnbqkbnr';
  for (let f = 0; f < 8; f++) { P0.push([back[f], 'w', files[f] + '1'], ['p', 'w', files[f] + '2'], ['p', 'b', files[f] + '7'], [back[f], 'b', files[f] + '8']); }
  const all = P0.map(([type, col, s]) => { const o = { type, col, keys: [[-1, s]], dead: 1e9, mesh: mkPiece(type, col) }; pieces[s] = o; return o; });
  /* 1997 年 5 月 11 日，第 6 局：深蓝执白，19 回合卡斯帕罗夫认输 */
  const MOVES = 'e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 b8d7 e4g5 g8f6 f1d3 e7e6 g1f3 h7h6 g5e6 d8e7 e1g1 f7e6 d3g6 e8d8 c1f4 b7b5 a2a4 c8b7 f1e1 f6d5 f4g3 d8c8 a4b5 c6b5 d1d3 b7c6 g6f5 e6f5 e1e7 f8e7 c2c4'.split(' ');
  const SAN = 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7 Ng5 Ngf6 Bd3 e6 N1f3 h6 Nxe6 Qe7 O-O fxe6 Bg6+ Kd8 Bf4 b5 a4 Bb7 Re1 Nd5 Bg3 Kc8 axb5 cxb5 Qd3 Bc6 Bf5 exf5 Rxe7 Bxe7 c4'.split(' ');
  const tP1 = T0 + .3, tPa = tZ2 - .5, tP2 = tZ3 + .1, tPb = tZ4 - .6;
  const plyT = MOVES.map((_, i) => i < 12 ? lerp(tP1, tPa, i / 11) : lerp(tP2, tPb, Math.pow((i - 12) / 24, .85)));
  MOVES.forEach((mv, i) => { const a = mv.slice(0, 2), b = mv.slice(2), p = pieces[a]; if (pieces[b]) pieces[b].dead = plyT[i] + .18; p.keys.push([plyT[i], b]); pieces[b] = p; delete pieces[a];
    if (mv === 'e1g1') { const r = pieces.h1; r.keys.push([plyT[i] + .08, 'f1']); pieces.f1 = r; delete pieces.h1; } });
  const placePieces = (t, fade) => all.forEach(o => {
    let k = 0; while (k < o.keys.length - 1 && t >= o.keys[k + 1][0]) k++;
    const [ta, sa] = o.keys[k], prev = k > 0 ? o.keys[k - 1][1] : sa, m = E.io3(seg(t, ta, ta + .26));
    const [x0, z0] = sqXY(prev), [x1, z1] = sqXY(sa), jump = o.type === 'n' ? .9 : .25;
    o.mesh.position.set(lerp(x0, x1, m), Math.sin(m * Math.PI) * jump, lerp(z0, z1, m));
    const dk = seg(t, o.dead, o.dead + .4); o.mesh.visible = dk < 1; o.mesh.position.y -= dk * .7; o.mesh.scale.setScalar(1.15 * (1 - dk * .4));
  });
  const fadePieces = k => { MAT.w.opacity = MAT.b.opacity = 1 - k; };
  /* 搜索树：每走一步，从这一格往上炸开（24 → 240 → 1920 个局面） */
  const tp = [], tf = [], tl2 = [], tlf = [], lev = [], llev = [];
  const kid = (p, n, r, lv, spread) => { for (let i = 0; i < n; i++) { const a = hash(p[0] * 13 + p[1] * 7 + i * 3.1 + lv) * Math.PI * 2, e = .25 + hash(p[2] * 5 + i * 1.7 + lv) * spread; const d = [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)]; const q = [p[0] + d[0] * r, p[1] + d[1] * r * .8 + r * .3, p[2] + d[2] * r]; tp.push(...q); tf.push(...p); lev.push(lv); tl2.push(...p, ...q); tlf.push(...p, ...p); llev.push(lv, lv); if (lv < 3) kid(q, lv === 1 ? 10 : 8, r * .62, lv + 1, spread); } };
  kid([0, 0, 0], 24, 2.4, 1, 1.1);
  const treeU = { uK: { value: 0 }, uOp: { value: 0 } };
  const treeMat = (pts) => new THREE.ShaderMaterial({ uniforms: treeU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `attribute vec3 aFrom; attribute float aLev; uniform float uK; varying float vA;
      void main(){ float g = clamp(uK * 3.2 - aLev + 1., 0., 1.); g = g * g * (3. - 2. * g); vec3 p = mix(aFrom, position, g); vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; ${pts ? 'gl_PointSize = 2.5 * (30. / -mv.z);' : ''} vA = g * (1.15 - aLev * .2); }`,
    fragmentShader: `uniform float uOp; varying float vA; void main(){ ${pts ? 'float d = length(gl_PointCoord - .5); if (d > .5) discard;' : ''} gl_FragColor = vec4(vec3(1.25, 1.35, 1.6) * vA * uOp, 1.); }` });
  const tpg = new THREE.BufferGeometry(); tpg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tpg.setAttribute('aFrom', new THREE.Float32BufferAttribute(tf, 3)); tpg.setAttribute('aLev', new THREE.Float32BufferAttribute(lev, 1));
  const tlg = new THREE.BufferGeometry(); tlg.setAttribute('position', new THREE.Float32BufferAttribute(tl2, 3)); tlg.setAttribute('aFrom', new THREE.Float32BufferAttribute(tlf, 3)); tlg.setAttribute('aLev', new THREE.Float32BufferAttribute(llev, 1));
  const tree = new THREE.Group(); tree.add(new THREE.Points(tpg, treeMat(true)), new THREE.LineSegments(tlg, treeMat(false))); tree.children.forEach(o => o.frustumCulled = false); board.add(tree);
  const nps = el(null, 'position:absolute;right:120px;top:300px;text-align:right'); hidden(nps);
  el(nps, `position:relative;font:700 36px/1 JBM;color:${COL.amber};letter-spacing:3px;margin-bottom:22px`, 'DEEP BLUE · 1997', { 'data-chk': 'text' });
  const npsN = el(nps, `position:relative;font:900 104px/1 SourceHanSerif;color:${COL.white};font-variant-numeric:tabular-nums`, '0', { 'data-chk': 'text' });
  el(nps, `position:relative;margin-top:16px;font:700 36px/1 PuHuiTi;color:#cfc6b8`, '步 / 秒', { 'data-chk': 'text' });
  const evalL = el(nps, `position:relative;margin-top:40px;font:500 32px/1.4 PuHuiTi;color:#b9c8dc`, '估值：人写好的规则<br>搜索：穷举', { 'data-chk': 'text' }); hidden(evalL);
  const tNps = cw('z3', '每秒') - .2;
  tl.fromTo(nps, { opacity: 0 }, { opacity: 1, duration: .4, immediateRender: false }, cw('z3', '写死的估值') - .3).to(nps, { opacity: 0, duration: .3 }, tZ4 - .4);
  tl.fromTo(evalL, { opacity: 0 }, { opacity: 1, duration: .4, immediateRender: false }, cw('z3', '写死的估值'));
  const sanL = el(null, `position:absolute;left:150px;top:300px;font:700 44px/1 JBM;color:${COL.white};font-variant-numeric:tabular-nums`, '', { 'data-chk': 'text' }); hidden(sanL);
  tl.set(sanL, { opacity: 1 }, tP1).set(sanL, { opacity: 0 }, tPa + .5).set(sanL, { opacity: 1 }, tP2).set(sanL, { opacity: 0 }, tZ4 - .4);
  /* 卡斯帕罗夫 */
  const kas = await photo('kasparov.jpg', 10, { depth: 1.4, edge: .05, sat: .9, tint: [1, 1, 1] }); kas.position.set(60, 0, 0); grp.add(kas);
  const kCard = infoCard({ title: 'GARRY KASPAROV', rows: [['3½ : 2½', '深蓝胜', '总比分'], ['19', '回合认输', '第 6 局']], src: '1997 年 5 月 · 纽约<br>照片：S.M.S.I. / Owen Williams' });
  kCard.show(tZ2 - .2, tZ3 - .4);
  /* 井字棋 */
  const ttt = new THREE.Group(); ttt.position.set(0, .12, 0); board.add(ttt);
  const tttL = [[-1, -3, -1, 3], [1, -3, 1, 3], [-3, -1, 3, -1], [-3, 1, 3, 1]].map(([a, b, c2, d]) => { const l = line2([[a, 0, b], [c2, 0, d]], 0xb9c8dc, 4); l.material.depthTest = false; l.renderOrder = 6; ttt.add(l); return l; });
  const xMark = textMesh('×', 1.8, { font: '700 200px JBM', color: '#f2b33d', hdr: 1.4 }); xMark.rotation.x = -Math.PI / 2; xMark.position.set(-2, .02, -2); xMark.material.depthTest = false; xMark.renderOrder = 6; ttt.add(xMark);
  const qMark = textMesh('？', 1.8, { font: '900 200px SourceHanSerif', color: '#b9c8dc' }); qMark.rotation.x = -Math.PI / 2; qMark.position.set(0, .02, 0); qMark.material.depthTest = false; qMark.renderOrder = 6; ttt.add(qMark);
  const tttLab = label(`left:0;top:150px;width:1920px;text-align:center;font:900 64px/1 SourceHanSerif;color:#b9c8dc;letter-spacing:6px`, '换个游戏：井字棋', cw('z4', '换个') - .2, T1);

  sfx(T0, 'flash', { g: .4 });
  MOVES.forEach((_, i) => { sfx(plyT[i] + .2, 'clack', { g: all.some(o => Math.abs(o.dead - plyT[i] - .18) < .01) ? 1 : .6 }); if (i >= 12 && plyT[i] < tZ4 - .4) sfx(plyT[i], 'burst', { g: .35 }); });
  sfx(tZ2 - .3, 'flash', { g: .5 }); sfx(tZ4 - .45, 'down', { d: 1.2, g: .5 }); [0, 1, 2, 3].forEach(j => sfx(cw('z4', '换个') - .2 + j * .1, 'tick', { g: .25, f: 700 }));
  sfx(cw('z4', '全都不会') - .1, 'blip', { f: 196, g: .3 });
  shot({ name: 'ch7', t0: T0, t1: T1, look(t) {
    LOOK.digital(G, F); G.bloom = .55; F.grain = .18; F.vig = .55;
    spineState({ on: false });
    const onKas = t >= tZ2 - .3 && t < tZ3 - .3;
    grp.visible = true;
    board.visible = !onKas; kas.visible = onKas;
    let cam;
    if (onKas) {
      const k = E.io2(seg(t, tZ2 - .3, tZ3 - .3));
      cam = P([60 + lerp(-3.4, -2.4, k), lerp(1, 1.6, k), lerp(14, 11, k)], [60 - lerp(2.9, 2.2, k), 1.2, 0]);
      G.flash = .45 * (1 - E.o3(seg(t, tZ2 - .3, tZ2))); G.focus = cam.z - O.z - .4; G.aperture = .0012; G.maxblur = .008;
    } else {
      placePieces(t);
      const n = plyT.filter(x => t >= x).length;
      sanL.textContent = n ? `${Math.ceil(n / 2)}. ${n % 2 ? '' : '… '}${SAN[n - 1]}` : '';
      /* 搜索树 */
      const i = n - 1, inTree = i >= 12 && t < tZ4 - .4;
      tree.visible = inTree;
      if (inTree) { const [x, z] = sqXY(MOVES[i].slice(2)); tree.position.set(x, .8, z); tree.rotation.y = i * 1.3; const k = seg(t, plyT[i], plyT[i] + .5); treeU.uK.value = E.o3(k); treeU.uOp.value = 1 - seg(t, plyT[i] + .35, (plyT[i + 1] ?? plyT[i] + .6) + .05) * .85; }
      const kn = E.io2(seg(t, tNps, tNps + 1.2)); npsN.textContent = Math.round(kn * 200) * 1e6 ? (Math.round(kn * 200) * 1e6).toLocaleString('en-US') : '0';
      /* 井字棋：棋子褪去，3×3 格亮起 */
      const kt = E.io2(seg(t, tZ4 - .4, cw('z4', '换个') + .3)); fadePieces(kt); all.forEach(o => o.mesh.visible = o.mesh.visible && kt < .99);
      ttt.visible = kt > 0; tttL.forEach((l, j) => { l.material.opacity = E.o3(seg(t, cw('z4', '换个') - .2 + j * .1, cw('z4', '换个') + .3 + j * .1)); });
      xMark.userData.u.uOp.value = E.o3(seg(t, cw('z4', '简单的游戏'), cw('z4', '简单的游戏') + .3)); qMark.userData.u.uOp.value = E.o3(seg(t, cw('z4', '全都不会') - .1, cw('z4', '全都不会') + .3)) * (.7 + .3 * Math.sin(t * 8));
      sq.userData.u.uBright.value = 1 - .75 * kt; fl.forEach(m => m.userData.u.uOp.value = 1 - kt);
      const orbit = lerp(-.35, .5, seg(t, T0, T1)), kz = E.io2(seg(t, tZ3 - .3, tZ3 + .8)), kt2 = E.io3(seg(t, tZ4 - .5, tZ4 + .6));
      const r = lerp(lerp(12.5, 15.5, kz), 11, kt2), hgt = lerp(lerp(8.5, 9.5, kz), 13, kt2);
      cam = P([Math.sin(orbit) * r, hgt, Math.cos(orbit) * r], [0, lerp(.4, 1.6 * kz, 1 - kt2), lerp(-.4, 0, kt2)], 35);
      if (n && t - plyT[n - 1] < .3 && n > 12) cam = shake(cam, t, plyT[n - 1] + .2, .12, .25);
      G.flash = .45 * (1 - E.o3(seg(t, T0, T0 + .3))) + (t > tZ3 - .3 ? .4 * (1 - E.o3(seg(t, tZ3 - .3, tZ3))) : 0);
      G.focus = Math.hypot(r, hgt); G.aperture = .0012; G.maxblur = .007;
    }
    Object.assign(CAM, cam);
  } });
}

/* ======================= 八 · 数据和显卡 ======================= */
{
  const S = stage(6), { grp, W, P, O } = S;
  const T0 = chapterAt('g1').t1, T1 = chapterAt('h1').t0;
  const onSp = new THREE.Group(); scene.add(onSp); only(grp, T0, T1); only(onSp, T0, T1);
  const tG2 = c('g2'), tG3 = c('g3'), tG4 = c('g4'), tG5 = c('g5'), tG6 = c('g6'), tG7 = c('g7'), tG8 = c('g8');
  const two = [['数据', 2008.5], ['算力', 2011.2]].map(([s, yr]) => { const m = textMesh(s, 3, { font: '900 200px SourceHanSerif', color: '#f2b33d' }); m.position.set(X(yr), LANE.learn - 4.2, 1); onSp.add(m); return m; });
  /* 李飞飞 */
  const fei = await photo('feifei.jpg', 11, { depth: 1.4, edge: .05, sat: .9, tint: [1, 1, 1] }); fei.position.set(0, 0, 0); grp.add(fei);
  const fCard = infoCard({ title: 'FEI-FEI LI · 李飞飞', rows: [['ImageNet', '图片库', '']], src: '照片：ITU Pictures · CC BY' });
  fCard.show(tG2 - .1, cw('g2', '收集') - .2);
  /* 1400 万张图：点阵墙（每 8×6 个点 = 一张缩略图） */
  const WC = 120, WR = 90, PPX = 8, PPY = 6, NPt = WC * WR * PPX * PPY;
  const wp = new Float32Array(NPt * 3), wc = new Float32Array(NPt * 3), wo = new Float32Array(NPt);
  { let n = 0; for (let j = 0; j < WR; j++) for (let i = 0; i < WC; i++) { const h0 = hash(i * 1.3 + j * 7.7), h1 = hash(i * 3.9 + j * 2.1), base = new THREE.Color().setHSL(h0, .35 + h1 * .4, .35 + hash(i + j * 3.3) * .3), ord = hash(i * 5.5 + j * 9.1);
      for (let y = 0; y < PPY; y++) for (let x = 0; x < PPX; x++) { wp.set([(i - WC / 2) * (PPX + 2.5) * .12 + x * .12, (j - WR / 2) * (PPY + 2.5) * .12 + y * .12, 0], n * 3); const v = .6 + .8 * hash(n * .37); wc.set([base.r * v, base.g * v, base.b * v], n * 3); wo[n] = ord; n++; } } }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp, 3)); wg.setAttribute('color', new THREE.BufferAttribute(wc, 3)); wg.setAttribute('aOrd', new THREE.BufferAttribute(wo, 1));
  const wallU = { uK: { value: 0 }, uOp: { value: 1 } };
  const imgWall = new THREE.Points(wg, new THREE.ShaderMaterial({ uniforms: wallU, transparent: true, depthWrite: false, toneMapped: false, vertexColors: true,
    vertexShader: `attribute float aOrd; uniform float uK; varying vec3 vC; varying float vA; void main(){ vC = color; vA = step(aOrd, uK); vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(5. / -mv.z * 30., 1., 6.); }`,
    fragmentShader: `uniform float uOp; varying vec3 vC; varying float vA; void main(){ gl_FragColor = vec4(vC * 1.1, vA * uOp); }` }));
  imgWall.frustumCulled = false; imgWall.position.set(60, 0, 0); grp.add(imgWall);
  const imgCtr = el(null, `position:absolute;left:0;top:830px;width:1920px;text-align:center;font:700 40px/1 JBM;color:${COL.white};font-variant-numeric:tabular-nums`, '', { 'data-chk': 'text' }); hidden(imgCtr);
  /* 167 国、近 5 万众包工人 */
  const NW = 49000, gp = new Float32Array(NW * 3);
  for (let i = 0; i < NW; i++) { const y = 1 - 2 * (i + .5) / NW, r = Math.sqrt(1 - y * y), a = i * 2.39996; gp.set([Math.cos(a) * r * 7, y * 7, Math.sin(a) * r * 7], i * 3); }
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
  const gm = new THREE.PointsMaterial({ color: new THREE.Color(2.4, 1.45, .45), size: .07, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const globe = new THREE.Points(gg, gm); globe.position.set(120, 0, 0); grp.add(globe);
  const wkCard = infoCard({ title: '众包 · 给图片逐张打标签', rows: [['167', '个国家', ''], ['近 50,000', '名工人', '']], src: '每个光点 = 一名工人' });
  wkCard.show(tG3 - .2, tG4 - .4, [cw('g3', '167') - .1, cw('g3', '五万') - .2]);
  /* 显卡芯片 + 并行 */
  const die = plane(await loadTex('素材/图/gpu_die.jpg'), 20, 20 * 1365 / 2048, { depthWrite: true }); die.position.set(180, 0, 0); grp.add(die);
  const sweepTex = canvasTex(512, 16, (g, w, h) => { const r = g.createLinearGradient(0, 0, w, 0); r.addColorStop(0, 'rgba(255,200,120,0)'); r.addColorStop(.5, 'rgba(255,230,190,1)'); r.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
  const sweep = plane(sweepTex, 6, 18, { additive: true, bright: .5 }); sweep.position.set(180, 0, .05); sweep.rotation.z = .5; grp.add(sweep);
  /* 并行：不另外盖格子，让芯片自己的电路结构亮起来——按 32×16 个区块同时脉动（亮度乘芯片照片本身的明暗，黑底不亮） */
  const dieTex = die.userData.u.uMap.value, DU = { uMap: { value: dieTex }, uK: { value: 0 }, uTime: { value: 0 } };
  const cores = new THREE.Mesh(new THREE.PlaneGeometry(20, 20 * 1365 / 2048), new THREE.ShaderMaterial({ uniforms: DU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, vertexShader: VS,
    fragmentShader: `uniform sampler2D uMap; uniform float uK, uTime; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){ vec3 c = texture2D(uMap, vUv).rgb; float l = dot(c, vec3(.2126, .7152, .0722));
        vec2 cell = floor(vUv * vec2(32., 16.)); float ph = h(cell) * 6.2832;
        float beat = pow(.5 + .5 * sin(uTime * 9. + ph * .15), 3.);
        float edge = 1. - smoothstep(.35, .5, max(abs(fract(vUv.x * 32.) - .5), abs(fract(vUv.y * 16.) - .5)) );
        float v = uK * (.25 + .75 * beat) * smoothstep(.08, .5, l) * (.55 + .45 * edge);
        gl_FragColor = vec4(vec3(1.5, .95, .32) * v * (.4 + l) * .42, 1.); }` }));
  cores.position.set(180, 0, .03); grp.add(cores);
  const gpuCard = infoCard({ title: 'GTX 580 · 2010', rows: [['512', '个核心', '同时算'], ['×', '乘法 · 加法', '每个都在干']], src: '芯片照片：Fritzchens Fritz · CC0' });
  gpuCard.show(tG4 - .2, tG5 - .4, [cw('g4', '海量并行') - .3, cw('g4', '乘法') - .2]);
  /* AlexNet 原始源码（逐字读自计算机历史博物馆开源的代码） */
  const src = await (await fetch('素材/下载/code/alexnet/src/layer_kernels.cu')).text();
  const codeL = src.split('\n').slice(478, 499);
  const code = canvasTex(1900, 1280, (g, w, h) => { g.fillStyle = '#07090a'; g.fillRect(0, 0, w, h); g.font = '500 34px JBM'; codeL.forEach((l, i) => { const y = 90 + i * 54; g.fillStyle = '#4a5560'; g.fillText(String(479 + i).padStart(3, ' '), 30, y); g.fillStyle = /__global__|template|for|if|else|float|const|int/.test(l) ? '#e9e1cf' : '#aab4bc'; g.fillText(l.replace(/\t/g, '    '), 130, y); }); g.fillStyle = 'rgba(242,179,61,.18)'; g.fillRect(120, 90 + 1 * 54 - 40, w - 150, 52); });
  const codeP = plane(code, 17, 17 * 1280 / 1900, { depthWrite: true }); codeP.position.set(240, 0, 0); grp.add(codeP);
  const anCard = infoCard({ title: 'ALEXNET · 2012', rows: [['2', '块 GTX 580', '显卡'], ['5 — 6', '天', '训练']], src: '源码：layer_kernels.cu<br>计算机历史博物馆开源 · BSD-2' });
  anCard.show(tG5 - .2, tG6 - .4, [cw('g5', '两块显卡') - .2, cw('g5', 'AlexNet')]);
  /* 错误率柱 */
  const bars = new THREE.Group(); bars.position.set(300, -3, 0); grp.add(bars);
  const barMat = [new THREE.MeshBasicMaterial({ color: new THREE.Color(.62, .61, .6), toneMapped: false }), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.15, .7, .19), toneMapped: false })];
  const BAR = [[26.2, '第二名', -3.4, 0], [15.3, 'AlexNet', 3.4, 1]].map(([v, n, x, a]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 1.2), barMat[a]); m.geometry.translate(0, .5, 0); m.position.set(x, 0, 0); bars.add(m);
    const vl = textMesh(v + '%', 1.5, { font: '700 200px JBM', color: a ? '#f2b33d' : '#f4efe6' }); bars.add(vl); const nl = textMesh(n, .9, { font: '700 200px PuHuiTi', color: '#cfc6b8' }); nl.position.set(x, -1, 0); bars.add(nl); return { m, vl, v, x }; });
  const base0 = new THREE.Mesh(new THREE.BoxGeometry(14, .05, .05), barMat[0]); bars.add(base0);
  const barTitle = label(`left:0;top:120px;width:1920px;text-align:center;font:700 40px/1 JBM;color:${COL.white};letter-spacing:2px`, 'ImageNet 2012 · Top-5 错误率', tG6 - .2, tG7 - .3);
  /* 2012：学习轨炸亮 */
  const NB = 600, bp = new Float32Array(NB * 3), bv = [...Array(NB)].map((_, i) => { const a = hash(i * 1.1) * Math.PI * 2, e = (hash(i * 2.3) - .5) * 2.6, s = 3 + hash(i * 3.7) * 14; return [Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s, Math.sin(a) * Math.cos(e) * s]; });
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  const bm = new THREE.PointsMaterial({ color: new THREE.Color(3, 1.9, .6), size: .2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const burst = new THREE.Points(bg, bm); burst.position.set(X(2012), LANE.learn, 0); burst.frustumCulled = false; onSp.add(burst);
  const core12 = glow(X(2012), LANE.learn, .1, 4, onSp);
  /* 苏茨克维 */
  const ily = plane(await loadTex('素材/图/sutskever.jpg'), 7, 7 * 861 / 576, { depthWrite: true, sat: .25 }); ily.position.set(360, 0, 0); grp.add(ily);
  const iCard = infoCard({ title: 'ILYA SUTSKEVER', rows: [['伊利亚', '苏茨克维', ''], ['AlexNet', '论文第二作者', '']], src: '照片：Eladkarmel · CC BY-SA' });
  iCard.show(cw('g8', '伊利亚') - .4, T1 - .2);
  const tBoom = cw('g7', '倒向') - .5;

  sfx(cw('g1', '两样东西') - .2, 'impact', { g: .4 }); sfx(tG2 - .3, 'flash', { g: .5 });
  sfx(cw('g2', '收集') - .2, 'whoosh', { d: tG3 - cw('g2', '收集'), g: .7 }); sfx(cw('g2', '收集') - .1, 'swell', { d: 2, g: .4 });
  sfx(tG3 - .3, 'shimmer', { d: 3, g: .4 }); sfx(tG4 - .3, 'flash', { g: .5 }); sfx(tG4, 'shimmer', { d: 1.6, g: .4 }); sfx(cw('g4', '海量并行') - .2, 'pulse', { d: tG5 - cw('g4', '海量并行'), g: .5 });
  sfx(tG5 - .3, 'whoosh', { d: .8, g: .5 }); for (let k = 0; k < 20; k++) sfx(tG5 + k * .17, 'term', { g: .12 });
  sfx(cw('g6', '15.3%') - .3, 'rise', { d: .9, g: .5 }); sfx(cw('g6', '26.2%') - .2, 'rise', { d: .9, g: .4 });
  sfx(tBoom - 1.6, 'riser', { d: 1.6, g: .7 }); sfx(tBoom, 'boom', { g: 1.1 }); sfx(tBoom, 'sparks', { d: 2.4, g: .6 }); sfx(cw('g8', '伊利亚') - .4, 'flash', { g: .5 });
  shot({ name: 'ch8', t0: T0, t1: T1, look(t) {
    LOOK.digital(G, F);
    const onSpine = t < tG2 - .3 || (t >= tG7 - .3 && t < cw('g8', '伊利亚') - .4);
    grp.visible = !onSpine; onSp.visible = true; two.forEach(m => m.visible = onSpine && t < tG2); burst.visible = core12.visible = onSpine && t > tG2;
    const seg8 = [tG2 - .3, tG3 - .3, tG4 - .3, tG5 - .3, tG6 - .3, tG7 - .3];
    fei.visible = t < cw('g2', '收集') - .2; imgWall.visible = t >= cw('g2', '收集') - .2 && t < seg8[1]; globe.visible = t >= seg8[1] && t < seg8[2]; die.visible = sweep.visible = cores.visible = t >= seg8[2] && t < seg8[3]; codeP.visible = t >= seg8[3] && t < seg8[4]; bars.visible = t >= seg8[4] && t < seg8[5]; ily.visible = !onSpine && t >= tG8 - .5;
    imgCtr.style.opacity = imgWall.visible ? 1 : 0;
    let cam;
    if (onSpine && t < tG2) {   // 两样东西
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [1, 1], iceDir: 1, cut: 1, ember: 1, head: 0, origin: 1 });
      two.forEach((m, i) => { const a = E.o3(seg(t, cw('g1', '两样东西') - .2 + i * .35, cw('g1', '两样东西') + .3 + i * .35)); m.userData.u.uOp.value = a; m.position.y = LANE.learn - 4.2 - (1 - a); });
      const k = E.io2(seg(t, T0, tG2 - .3));
      cam = { x: X(lerp(2006, 2009, k)), y: lerp(2, 0, k), z: lerp(30, 26, k), tx: X(lerp(2009, 2011, k)), ty: LANE.learn - 1.5, tz: 0, fov: 35, roll: 0 };
    } else if (onSpine) {   // 2012：学习轨炸亮
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [1, 1], iceDir: 1, cut: 1, ember: 1, head: 0, origin: 1 });
      const kb = t - tBoom; for (let i = 0; i < NB; i++) { const d = .6 * (1 - Math.exp(-Math.max(0, kb) * 2)); bp[i * 3] = bv[i][0] * d; bp[i * 3 + 1] = bv[i][1] * d - .8 * Math.max(0, kb) ** 2; bp[i * 3 + 2] = bv[i][2] * d; }
      bg.attributes.position.needsUpdate = true; bm.opacity = kb > 0 ? clamp(1 - kb / 2.5) : 0; core12.scale.setScalar(kb > 0 ? lerp(14, 4, E.o3(clamp(kb / 1.2))) : 2);
      const k = E.io3(seg(t, tG7 - .3, cw('g8', '伊利亚') - .4));
      cam = { x: X(lerp(2008, 2016, k)), y: lerp(3, 6, k), z: lerp(32, 52, k), tx: X(lerp(2012, 2016, k)), ty: lerp(-1, 0, k), tz: 0, fov: 35, roll: 0 };
      cam = shake(cam, t, tBoom, .5, .7);
      G.flash = .55 * Math.exp(-Math.pow((t - tBoom) / .08, 2)) + .4 * (1 - E.o3(seg(t, tG7 - .3, tG7))); G.bloom = .8;
    } else {
      spineState({ on: false });
      if (fei.visible) {
        const k = E.io2(seg(t, tG2 - .3, cw('g2', '收集')));
        cam = P([lerp(-3.4, -2.6, k), lerp(2.6, 2.9, k), lerp(14, 11.5, k)], [lerp(-2.8, -2.2, k), 2.7, 0]);
        G.flash = .45 * (1 - E.o3(seg(t, tG2 - .3, tG2))); G.focus = cam.z - O.z - .4; G.aperture = .0012; G.maxblur = .008;
      } else if (imgWall.visible) {   // 穿过点阵墙
        const t0 = cw('g2', '收集') - .2, k = seg(t, t0, tG3 - .3);
        wallU.uK.value = E.o2(seg(t, t0, t0 + 1.6));
        imgCtr.textContent = Math.round(E.o2(seg(t, t0, t0 + 1.6)) * 14e6).toLocaleString('en-US') + ' 张图片';
        cam = P([60 + lerp(-6, 3, k), lerp(-3, 2, k), lerp(70, 2.5, E.i2(k))], [60 + lerp(-4, 4, k), lerp(-2, 2.4, k), -20], 35, lerp(.05, -.08, k));
        G.blur = [0, 0]; G.bloom = .5; G.flash = .5 * (1 - E.o3(seg(t, t0, t0 + .3)));
      } else if (globe.visible) {
        const n = Math.floor(NW * E.io2(seg(t, tG3 - .2, cw('g3', '五万') + .4))); gg.setDrawRange(0, n);
        globe.rotation.y = t * .25; globe.rotation.x = .3;
        const k = E.io2(seg(t, tG3 - .3, tG4 - .3));
        cam = P([120 - lerp(6.5, 7.5, k), lerp(1, .5, k), lerp(34, 29, k)], [120 - lerp(6, 7, k), 0, 0]);
        G.flash = .5 * (1 - E.o3(seg(t, tG3 - .3, tG3))); G.bloom = .75;
      } else if (die.visible) {   // 芯片：光扫过 + 512 个核同时亮
        const k = E.io2(seg(t, tG4 - .3, tG5 - .3));
        sweep.position.x = 180 + lerp(-14, 14, seg(t, tG4 - .3, tG4 + 1.6)); sweep.userData.u.uOp.value = 1 - seg(t, tG4 + 1.2, tG4 + 1.6);
        const tPar = cw('g4', '海量并行') - .2, kp = seg(t, tPar, tPar + .2);
        DU.uK.value = kp; DU.uTime.value = t;
        cam = P([180 - lerp(4.4, 3.4, k), lerp(-.6, 0, k), lerp(17, 13, k)], [180 - lerp(3.6, 3, k), 0, 0], 35, lerp(.04, 0, k));
        G.flash = .45 * (1 - E.o3(seg(t, tG4 - .3, tG4))); G.bloom = .7;
      } else if (codeP.visible) {
        const k = E.io2(seg(t, tG5 - .3, tG6 - .3));
        cam = P([240 - lerp(3, 1.6, k), lerp(3.2, -1, k), lerp(15, 13.5, k)], [240 - lerp(4.4, 3.2, k), lerp(3, -1.2, k), 0], 35, -.03);
        G.flash = .45 * (1 - E.o3(seg(t, tG5 - .3, tG5))); G.focus = cam.z - O.z; G.aperture = .0012; G.maxblur = .008;
      } else if (bars.visible) {   // 26.2% vs 15.3%
        BAR.forEach((b, i) => { const tb = cw('g6', i ? '15.3%' : '26.2%') - (i ? .3 : .2); const h = b.v * .4 * E.o5(seg(t, tb, tb + .9)); b.m.scale.y = Math.max(.001, h); b.vl.position.set(b.x, h + 1.1, 0); b.vl.userData.u.uOp.value = E.o3(seg(t, tb + .3, tb + .7)); });
        const k = E.io2(seg(t, tG6 - .3, tG7 - .3));
        cam = P([300 + lerp(-2, 2, k), lerp(4.5, 3.5, k), lerp(28, 25, k)], [300, 3.4, 0]);
        G.flash = .45 * (1 - E.o3(seg(t, tG6 - .3, tG6))); G.bloom = .7;
      } else {   // 苏茨克维
        const k = E.io2(seg(t, tG8 - .5, T1));
        cam = P([360 - lerp(4, 3.4, k), lerp(2.6, 3, k), lerp(13, 10.5, k)], [360 - lerp(3.6, 3, k), 2.6, 0]);
        G.flash = .45 * (1 - E.o3(seg(t, cw('g8', '伊利亚') - .4, cw('g8', '伊利亚') - .1)));
        F.grain = .3;
      }
    }
    Object.assign(CAM, cam);
  } });
}

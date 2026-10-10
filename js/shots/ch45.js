/* 四 · 第一次寒冬（w2–w9）：《感知机》砸下来 → 异或：一条直线怎么摆都分不开四个点 → 1969 一刀切断，余烬散落
   → 罗森布拉特（安静）→ 规则写不完：鸟会飞，除非…… → 莱特希尔报告原句 → 冰从轴上长出来，全屏结霜
   五 · 专家系统（x1–x7）：琥珀 CRT 打出 R1/XCON 的真实规则 → 拉开成两千多块规则墙 → LISP 机 + 第五代计划
   → 规则互相打架 → 1987 墙碎 → 第二次结霜 */
import { THREE, scene, CAM, G, canvasTex } from '../gl.js';
import { F } from '../film.js';
import { tl, c, cw, COL, el, hidden, letters, typeOn, seg, lerp, clamp, E, hash, shot } from '../core.js';
import { X, LANE, spineState, glow } from '../spine.js';
import { stage, photo, textMesh, typeset, doc, motes, pose, mixP, LOOK, wipeText, ringTex, sprite, crt, infoCard, label, only, shade } from '../kit.js';
import { chapterAt } from '../chapter.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const fatLine = (pts, col, w) => { const g = new LineGeometry(); g.setPositions(pts.flat()); const m = new LineMaterial({ color: col, linewidth: w, transparent: true, depthWrite: false, worldUnits: false, toneMapped: false }); m.resolution.set(1920, 1080); const l = new Line2(g, m); l.computeLineDistances(); l.userData.n = pts.length - 1; return l; };
const drawTo = (l, k) => { l.geometry.instanceCount = Math.max(0, Math.round(l.userData.n * clamp(k))); l.visible = k > .001; };
const shake = (cam, t, t0, amp, dur = .6) => { if (t < t0 || t > t0 + dur) return cam; const s = (1 - (t - t0) / dur) ** 2 * amp; return { ...cam, x: cam.x + (hash(t * 97) - .5) * s, y: cam.y + (hash(t * 71) - .5) * s }; };

/* ======================= 四 · 第一次寒冬 ======================= */
{
  const S = stage(2), { grp, W, P, O } = S;
  const T0 = chapterAt('w1').t1, T1 = chapterAt('x1').t0;
  const onSp = new THREE.Group(); scene.add(onSp);   // 放在时间轴坐标里的东西
  only(grp, T0, T1); only(onSp, T0, T1);
  const tW2 = c('w2'), tW3 = c('w3'), tW4 = c('w4'), tW5 = c('w5'), tW6 = c('w6'), tW7 = c('w7'), tW9 = c('w9');

  /* ---- w2：《感知机》（按原书书名、作者、出版社排版） ---- */
  const cover = canvasTex(1200, 1680, (g, w, h) => {
    g.fillStyle = '#1a1714'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 14000; i++) { g.fillStyle = `rgba(255,236,210,${hash(i * 2.3) * .035})`; g.fillRect(hash(i * 1.7) * w, hash(i * 3.9) * h, 2, 1 + hash(i) * 4); }
    g.textAlign = 'center'; g.fillStyle = '#ece4d2'; g.font = '600 150px EBGaramond'; g.letterSpacing = '12px'; g.fillText('PERCEPTRONS', w / 2 + 6, 560); g.letterSpacing = '0px';
    g.fillStyle = '#f2b33d'; g.fillRect(w / 2 - 90, 640, 180, 5);
    g.fillStyle = '#d9cfb8'; g.font = 'italic 500 60px EBGaramond'; g.fillText('an introduction to', w / 2, 770); g.fillText('computational geometry', w / 2, 846);
    g.font = '500 66px EBGaramond'; g.fillText('Marvin Minsky', w / 2, 1180); g.fillText('Seymour Papert', w / 2, 1266);
    g.font = '500 42px EBGaramond'; g.letterSpacing = '8px'; g.fillStyle = '#9a9184'; g.fillText('THE M.I.T. PRESS · 1969', w / 2, 1540);
  });
  const pages = canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#ddd3bd'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(90,70,45,${.08 + hash(y) * .12})`; g.fillRect(0, y, w, 1); } });
  const pagesH = canvasTex(512, 64, (g, w, h) => { g.fillStyle = '#ddd3bd'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(90,70,45,${.08 + hash(y) * .12})`; g.fillRect(0, y, w, 1); } });
  const bm = (o) => new THREE.MeshBasicMaterial(o);
  const book = new THREE.Mesh(new THREE.BoxGeometry(6, 8.4, 1.1), [bm({ map: pages }), bm({ color: 0x141210 }), bm({ map: pagesH }), bm({ map: pagesH }), bm({ map: cover }), bm({ color: 0x141210 })]);
  grp.add(book);
  const minsky = await photo('minsky.jpg', 9, { depth: 1.2, edge: .08 }); minsky.position.set(-6.5, 1.2, -7); grp.add(minsky);
  const bmo = motes(260, [24, 14, 10], 41); bmo.position.set(0, 0, 2); grp.add(bmo);
  const tLand = cw('w2', '《感知机》') - .05;

  /* ---- w3：异或。四个点 + 一条真的在试的直线（着色 = 直线两侧） ---- */
  const xg = new THREE.Group(); xg.position.set(60, 0, 0); grp.add(xg);
  const XU = { uA: { value: 0 }, uD: { value: 0 }, uOn: { value: 0 }, uOp: { value: 0 } };
  const xq = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.ShaderMaterial({ uniforms: XU, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform float uA, uD, uOn, uOp; varying vec2 vUv;
      void main(){ vec2 p = (vUv - .5) * 18.; vec2 n = vec2(cos(uA), sin(uA)); float s = dot(p, n) - uD;
        vec2 gr = abs(fract(p / 1.5 + .5) - .5) * 1.5; float gl = 1. - smoothstep(0., .025, min(gr.x, gr.y));
        float ax = 1. - smoothstep(0., .03, min(abs(p.x), abs(p.y)));
        vec3 col = vec3(.9, .85, .78) * (gl * .05 + ax * .12);
        col += (s > 0. ? vec3(1., .6, .14) : vec3(.55, .66, .85)) * .085 * uOn * smoothstep(0., .4, abs(s));
        col += vec3(3., 1.9, .6) * exp(-abs(s) * 18.) * uOn;
        gl_FragColor = vec4(col * smoothstep(9., 6., length(p)) * uOp, 1.); }` }));
  xg.add(xq);
  const PT = [[-3, -3, 0], [-3, 3, 1], [3, -3, 1], [3, 3, 0]];   // (x1,x2) → 异或
  const AMB = [2.6, 1.6, .5], ICE = [1.3, 1.45, 1.75];
  const dots = PT.map(([x, y, v]) => { const g = glow(x, y, .05, 2.4, xg); g.material.color.setRGB(...(v ? AMB : ICE)); return g; });
  const rings = PT.map(([x, y]) => { const r = sprite(ringTex, 1.9, [1.6, 1.9, 2.4]); r.position.set(x, y, .06); xg.add(r); return r; });
  const ptLab = PT.map(([x, y]) => { const m = textMesh(`(${x > 0 ? 1 : 0}, ${y > 0 ? 1 : 0})`, .62, { font: '700 200px JBM', color: '#bdb4a6' }); m.position.set(x, y + (y > 0 ? 1.45 : -1.45), .05); xg.add(m); return m; });
  /* 试的直线：切掉一个角（3/4）或者从中间劈开（2/4） */
  const NA = 15, tX0 = cw('w3', '单层') - .3, tX1 = tW4 - .7;
  const att = [...Array(NA)].map((_, i) => {
    let a, d;
    if (i % 4 === 3) { a = (hash(i * 4.1) > .5 ? 0 : Math.PI / 2) + (hash(i * 2.2) - .5) * .5; d = (hash(i * 6.6) - .5) * 1.6; }
    else { const k = Math.floor(hash(i * 7.7 + 3) * 4), [cx, cy] = PT[k]; a = Math.atan2(cy, cx) + (hash(i * 3.3) - .5) * .7; d = 1.7 + hash(i * 5.1) * 1.6; }
    const cnt = (a, d) => PT.reduce((s, [x, y, v]) => s + ((x * Math.cos(a) + y * Math.sin(a) - d > 0) === !!v ? 1 : 0), 0);
    if (cnt(a, d) < 2) { a += Math.PI; d = -d; }
    return { a, d, n: cnt(a, d) };
  });
  const tAtt = att.map((_, i) => tX0 + (tX1 - tX0) * (1 - Math.pow(1 - i / NA, 1.8)));
  const lineAt = t => {
    let i = 0; while (i < NA - 1 && t >= tAtt[i + 1]) i++;
    const A = att[i], B = att[Math.min(NA - 1, i + 1)], k = i < NA - 1 ? E.io3(seg(t, tAtt[i], tAtt[i] + (tAtt[i + 1] - tAtt[i]) * .55)) : 0;
    let da = B.a - A.a; da = Math.atan2(Math.sin(da), Math.cos(da));
    return { a: A.a + da * k, d: lerp(A.d, B.d, k), i, n: (k > .5 ? B : A).n };
  };
  const truth = el(null, 'position:absolute;left:150px;top:290px;width:520px'); hidden(truth);
  el(truth, `position:relative;font:700 36px/1 JBM;color:${COL.amber};letter-spacing:3px;margin-bottom:30px`, '异或 · XOR', { 'data-chk': 'text' });
  el(truth, `position:relative;display:flex;font:700 32px/1 JBM;color:${COL.mute};padding:0 0 16px`, '<span style="position:relative;width:120px">x₁</span><span style="position:relative;width:120px">x₂</span><span style="position:relative">输出</span>', { 'data-chk': 'text' });
  const tRows = PT.map(([x, y, v]) => { const r = el(truth, `position:relative;display:flex;font:700 56px/1 JBM;color:${COL.white};padding:16px 0;border-top:1px solid rgba(244,239,230,.18)`, `<span style="position:relative;width:120px">${x > 0 ? 1 : 0}</span><span style="position:relative;width:120px">${y > 0 ? 1 : 0}</span><span style="position:relative;color:${v ? COL.amber : '#b9c8dc'}">${v}</span>`, { 'data-chk': 'text' }); hidden(r); return r; });
  const tTT = cw('w3', '异或') - .3;
  tl.fromTo(truth, { opacity: 0 }, { opacity: 1, duration: .3, immediateRender: false }, tW3 - .2).set(truth, { opacity: 0 }, tW4 - .3);
  tRows.forEach((r, k) => tl.fromTo(r, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: .45, ease: 'expo.out', immediateRender: false }, tW3 + .1 + k * .25));
  const xShade = shade(900, .85);
  tl.fromTo(xShade, { opacity: 0 }, { opacity: 1, duration: .3, immediateRender: false }, tW3 - .2).set(xShade, { opacity: 0 }, tW4 - .3);
  const xCtr = el(null, `position:absolute;left:150px;top:820px;width:700px;text-align:left;font:700 40px/1 JBM;color:${COL.white};font-variant-numeric:tabular-nums`, '', { 'data-chk': 'text' }); hidden(xCtr);
  tl.set(xCtr, { opacity: 1 }, tX0 + .1).set(xCtr, { opacity: 0 }, tW4 - .3);

  /* ---- w4：1969 断口 + 余烬散落（「人员离散」） ---- */
  const tCut = cw('w4', '死刑'), tScat = cw('w4', '人员离散') - .2;
  const NE = 520, ep = new Float32Array(NE * 3), eBase = [];
  for (let i = 0; i < NE; i++) eBase.push([lerp(X(1958), X(1969), hash(i * 1.9)), LANE.learn + (hash(i * 2.7) - .5) * .25, (hash(i * 3.3) - .5) * .25, hash(i * 4.4), hash(i * 5.5), hash(i * 6.6)]);
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
  const emat = new THREE.PointsMaterial({ color: new THREE.Color(2.6, 1.4, .4), size: .16, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const embers = new THREE.Points(eg, emat); embers.frustumCulled = false; onSp.add(embers);

  /* ---- w5：罗森布拉特 ---- */
  const ros = await photo('rosenblatt.jpg', 9.5, { depth: 1.3, edge: .07, tint: [.95, .98, 1.04] }); ros.position.set(120, 0, 0); grp.add(ros);
  const rmo = motes(160, [14, 12, 8], 43, .25); rmo.position.set(120, 0, 2); grp.add(rmo);
  const rName = el(null, 'position:absolute;left:170px;top:420px;width:760px'); hidden(rName);
  const rN = el(rName, `position:relative;font:600 70px/1.05 EBGaramond;letter-spacing:8px;color:${COL.white};white-space:nowrap`, '', { 'data-chk': 'text' });
  const rD = el(rName, `position:relative;margin-top:28px;font:700 40px/1 JBM;color:#b9c8dc;letter-spacing:2px;height:40px`, '', { 'data-chk': 'text' });
  const rC = el(rName, `position:relative;margin-top:24px;font:500 32px/1.3 PuHuiTi;color:${COL.mute};height:40px`, '', { 'data-chk': 'text' });
  const rShade = shade(1100, .9);
  tl.fromTo([rShade, rName], { opacity: 0 }, { opacity: 1, duration: .6, immediateRender: false }, tW5 - .2).to([rShade, rName], { opacity: 0, duration: .4 }, tW6 - .7);
  letters(rN, 'FRANK ROSENBLATT', tW5, .035, .7);
  typeOn(rD, '1928.7.11 — 1971.7.11', cw('w5', '43 岁') - .3, 26, false);
  typeOn(rC, '43 岁生日那天 · 划船事故', cw('w5', '死于') - .2, 14, false);

  /* ---- w6：规则写不完（经典的「鸟会飞」例子） ---- */
  const RL = ['IF  x 是鸟  THEN  x 会飞', '除非 x 是企鹅', '除非 x 是鸵鸟', '除非 x 的翅膀断了', '除非 x 被关在笼子里', '除非 x 还是雏鸟', '除非 x 已经死了', '除非 x 的脚被冻在冰里', '除非 x 是一只玩具鸟', '除非 x 是画上的鸟', '除非 ……'];
  const NR = 44, rules = new THREE.Group(); rules.position.set(180, -2, 0); rules.rotation.x = -1.0; grp.add(rules);
  const rLines = [...Array(NR)].map((_, i) => { const s = RL[Math.min(i, RL.length - 1)]; const m = wipeText(s, .95, { font: `${i ? 400 : 700} 200px CourierPrime, SourceHanSerif`, color: i ? '#e9e1cf' : '#f2b33d' }); m.position.set(i ? -4.2 : -5.4, i * 1.45, 0); rules.add(m); return m; });
  const tRu0 = cw('w6', '写规则') - .2, tRu1 = cw('w6', '现实的规则') - .1, tRuE = tW7 - .5;
  const tRule = rLines.map((_, i) => i === 0 ? tRu0 : tRu1 + (tRuE - tRu1) * (1 - Math.pow(1 - (i - 1) / (NR - 1), 1.9)));
  const rmo2 = motes(220, [20, 14, 14], 44, .3); rmo2.position.set(180, 2, 2); grp.add(rmo2);

  /* ---- w7–w8：莱特希尔报告（原文） ---- */
  const lh = typeset({ PW: 1700, PH: 1900, M: 150, font: '400 46px CourierPrime', lh: 70, justify: true,
    head: (g, PW) => { g.textAlign = 'center'; g.font = '700 50px CourierPrime'; g.fillText('ARTIFICIAL INTELLIGENCE: A GENERAL SURVEY', PW / 2, 200); g.font = 'italic 500 48px EBGaramond'; g.fillText('by Professor Sir James Lighthill, FRS', PW / 2, 280); g.font = '500 38px EBGaramond'; g.fillText('Science Research Council · 1973', PW / 2, 340); g.fillRect(150, 390, PW - 300, 2); g.textAlign = 'left'; return 500; },
    text: 'Most workers in AI research and in related fields confess to a pronounced feeling of disappointment in what has been achieved in the past twenty-five years. Workers entered the field around 1950, and even around 1960, with high hopes that are very far from having been realised in 1972. {q:In no part of the field have the discoveries made so far produced the major impact that was then promised.}' });
  const lhDoc = doc(lh, 10, { sat: .15 }); lhDoc.position.set(240, 0, 0); grp.add(lhDoc);
  const lmo = motes(200, [16, 14, 8], 45, .3); lmo.position.set(240, 0, 3); grp.add(lmo);
  const lhSrc = label(`right:96px;top:56px;text-align:right;font:500 28px/1 JBM;color:#b3aa9c;background:rgba(8,7,6,.78);padding:12px 18px`, '莱特希尔报告 · 英国科学研究委员会 · 1973', tW7 + 1.2, tW9 - .4);

  /* ---- w9：经费（示意）往下掉 → 冰从 1974 长到 1980 ---- */
  const fund = fatLine([...Array(60)].map((_, i) => { const yr = lerp(1960, 1980, i / 59); const v = yr < 1968 ? 1 : yr < 1975 ? lerp(1, .18, E.io2((yr - 1968) / 7)) : .18; return [X(yr), LANE.rule + 2.2 + v * 6, 0]; }), 0xb9c8dc, 3.2);
  onSp.add(fund); fund.material.linewidth = 5;
  const fundLab = textMesh('经费（示意）', 1.1, { font: '700 200px PuHuiTi', color: '#b9c8dc' }); fundLab.position.set(X(1963.5), LANE.rule + 9.9, 0); onSp.add(fundLab);
  const tFund = cw('w9', '大砍经费') - .3, tIce = cw('w9', '寒冬') - .9;

  shot({ name: 'ch4', t0: T0, t1: T1, look(t) {
    const onSpine = (t >= tW4 - .3 && t < tW5 - .3) || t >= tW9 - .4;
    grp.visible = !onSpine; onSp.visible = true;
    [bmo, rmo, rmo2, lmo].forEach(m => m.userData.step(t));
    book.visible = minsky.visible = bmo.visible = t < tW3 - .4;
    xg.visible = t >= tW3 - .4 && t < tW4 - .3;
    ros.visible = rmo.visible = t >= tW5 - .3 && t < tW6 - .3;
    rules.visible = rmo2.visible = t >= tW6 - .3 && t < tW7 - .3;
    lhDoc.visible = lmo.visible = t >= tW7 - .3 && t < tW9 - .4;
    embers.visible = t >= tScat - .1 && t < tW5 - .3;
    fund.visible = fundLab.visible = t >= tW9 - .4;
    let cam;
    if (t < tW3 - .4) {   // 书砸下来
      LOOK.silver(G, F);
      const k = E.i2(seg(t, tLand - .5, tLand)), b = t > tLand ? Math.exp(-(t - tLand) * 7) * Math.sin((t - tLand) * 26) * .12 : 0;
      book.position.set(lerp(1.2, .8, k), lerp(11, 0, k) + b, lerp(-2, 0, k));
      book.rotation.set(lerp(-1.3, -.14, k), lerp(.9, .2, k), lerp(.5, .03, k));
      const kc = E.io2(seg(t, T0, tW3 - .4));
      cam = P([lerp(3.2, .6, kc), lerp(-1.4, -.6, kc), lerp(21, 16.5, kc)], [lerp(-.6, .5, kc), .2, 0], 35, lerp(-.03, .01, kc));
      cam = shake(cam, t, tLand, .45);
      G.flash = .55 * Math.exp(-Math.pow((t - tLand) / .07, 2)) + .5 * (1 - E.o3(seg(t, T0, T0 + .3)));
      minsky.userData.u.uBright.value = lerp(.75, .32, E.o2(seg(t, tLand - .3, tLand + .4)));
      G.focus = cam.z - O.z; G.aperture = .0012; G.maxblur = .008;
      spineState({ on: false });
    } else if (t < tW4 - .3) {   // 异或
      LOOK.silver(G, F); F.scratch = .2; F.vig = .35;
      XU.uOp.value = E.o3(seg(t, tW3 - .4, tW3 + .3)); XU.uOn.value = E.o2(seg(t, tX0 - .1, tX0 + .3));
      const L = lineAt(t); XU.uA.value = L.a; XU.uD.value = L.d;
      PT.forEach(([x, y, v], i) => {
        const s = x * Math.cos(L.a) + y * Math.sin(L.a) - L.d, wrong = (s > 0) !== !!v;
        const a = E.o3(seg(t, tW3 + .1 + i * .25, tW3 + .5 + i * .25));
        dots[i].material.opacity = a; ptLab[i].userData.u.uOp.value = a;
        rings[i].visible = XU.uOn.value > .5 && wrong; rings[i].material.opacity = .55 + .45 * Math.sin(t * 22); rings[i].scale.setScalar(1.9 + .25 * Math.sin(t * 11));
      });
      xCtr.innerHTML = `第 ${String(L.i + 1).padStart(2, '0')} 次 · 分对 <span style="color:${L.n === 3 ? COL.amber : COL.white}">${L.n} / 4</span>`;
      const kc = E.io2(seg(t, tW3 - .4, tW4 - .3));
      cam = P([60 + lerp(-3.6, -2.4, kc), lerp(-1.4, -.4, kc), lerp(25, 22, kc)], [60 - 3.4, 0, 0], 35, lerp(.02, -.01, kc));
      G.flash = .45 * (1 - E.o3(seg(t, tW3 - .4, tW3 - .05))); G.aperture = 0; G.bloom = .65;
      spineState({ on: false });
    } else if (t < tW5 - .3) {   // 1969：切断 + 余烬散落
      const cold = E.io2(seg(t, tCut, tCut + 1.5));
      LOOK.silver(G, F); G.tint = [lerp(1.03, .9, cold), lerp(1, .97, cold), lerp(.95, 1.06, cold)];
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [0, 0], cut: E.oExpo(seg(t, tCut - .08, tCut + .12)), cutLabel: E.o3(seg(t, tCut + .25, tCut + .8)), spark: t - tCut, ember: E.o2(seg(t, tCut + .1, tCut + 1.4)), head: 0, origin: 1 });
      const k = E.io2(seg(t, tW4 - .3, tW5 - .3));
      const side = { x: X(1969) + 7, y: -.5, z: 21, tx: X(1969) + 1.5, ty: LANE.learn - 1.6, tz: 0, fov: 35, roll: 0 };
      const wide = { x: X(1966), y: 2, z: 30, tx: X(1964), ty: LANE.learn - 1, tz: 0, fov: 35, roll: 0 };
      cam = mixP(side, wide, E.io3(seg(t, tScat - .6, tW5 - .3)));
      cam.x += .25 * Math.sin(t * .8); cam = shake(cam, t, tCut, .3, .7);
      G.flash = .45 * (1 - E.o3(seg(t, tW4 - .3, tW4))) + .28 * Math.exp(-Math.pow((t - tCut) / .08, 2));
      const ks = t - tScat;
      for (let i = 0; i < NE; i++) { const [x, y, z, a, b, cc] = eBase[i], s = Math.max(0, ks - a * .8); ep[i * 3] = x + (b - .5) * 3 * s; ep[i * 3 + 1] = y - (.4 + cc * 1.6) * s * s - .3 * s; ep[i * 3 + 2] = z + (cc - .5) * 4 * s; }
      eg.attributes.position.needsUpdate = true; emat.opacity = clamp(1.4 - ks * .45); emat.size = .16 + .06 * Math.sin(t * 30);
    } else if (t < tW6 - .3) {   // 罗森布拉特
      LOOK.cold(G, F); F.flicker = .12; F.scratch = .15; F.weave = 1;
      const k = E.io2(seg(t, tW5 - .3, tW6 - .3));
      cam = P([120 - lerp(4.6, 3.6, k), lerp(.9, 1.3, k), lerp(14, 11, k)], [120 - lerp(3.9, 3.3, k), 1.3, 0]);
      ros.userData.u.uBright.value = lerp(1, .55, E.io2(seg(t, tW6 - 1.8, tW6 - .3)));
      G.flash = .35 * (1 - E.o3(seg(t, tW5 - .3, tW5 + .1))); G.focus = cam.z - O.z - .6; G.aperture = .0014; G.maxblur = .008;
      spineState({ on: false });
    } else if (t < tW7 - .3) {   // 规则写不完
      LOOK.silver(G, F); F.scratch = .2;
      let cur = 0; rLines.forEach((m, i) => { const t0 = tRule[i], d = i ? Math.min(.55, Math.max(.12, (tRule[Math.min(NR - 1, i + 1)] - t0) * .8)) : .9; m.userData.type(seg(t, t0, t0 + d)); m.userData.u.uOp.value = i < RL.length ? 1 : clamp(1 - (i - RL.length) / 40); if (t >= t0) cur = i; });
      rules.updateMatrixWorld();
      const kb = E.io3(seg(t, tRu1 + 1.2, tW7 - .3));
      const tgt = rules.localToWorld(new THREE.Vector3(lerp(3, 6, kb), lerp(Math.min(cur, 4) * 1.45, 24, kb), 0));
      const dist = lerp(11, 42, kb);
      cam = pose({ x: tgt.x + lerp(-1, -7, kb), y: tgt.y + dist * lerp(.42, .62, kb), z: tgt.z + dist * lerp(.9, .78, kb) }, tgt, 35, lerp(-.02, .05, kb));
      G.flash = .4 * (1 - E.o3(seg(t, tW6 - .3, tW6))); G.focus = lerp(13, 20, kb); G.aperture = .0011; G.maxblur = .01;
      spineState({ on: false });
    } else if (t < tW9 - .4) {   // 莱特希尔报告
      LOOK.silver(G, F); const cold = E.io2(seg(t, cw('w8', '重大影响') - .5, tW9 - .4)); G.tint = [lerp(1.03, .9, cold), 1, lerp(.95, 1.07, cold)];
      const kIn = E.o5(seg(t, tW7 - .3, tW7 + .7));
      lhDoc.rotation.set(lerp(-.9, -.22, kIn), lerp(.25, .05, kIn), -.01); lhDoc.position.y = lerp(-8, 0, kIn); lhDoc.updateMatrixWorld();
      const tQ = cw('w8', '没有任何'); lhDoc.userData.hi('q', E.io2(seg(t, tQ, tQ + 2.6)));
      const hd = lhDoc.localToWorld(new THREE.Vector3(0, lhDoc.userData.h / 2 - 1.6, 0)), q = lhDoc.localToWorld(lhDoc.userData.at('q', 0, 260).clone()), q2 = lhDoc.localToWorld(lhDoc.userData.at('q', 1, 0).clone());
      const kq = E.io3(seg(t, tQ - 1, tQ + .4)), k2 = E.io2(seg(t, tQ + .8, tW9 - .4));
      const tgt = hd.clone().lerp(q, kq).lerp(q2, k2 * .8);
      cam = pose({ x: tgt.x - .4, y: tgt.y - 1.7, z: tgt.z + lerp(10, 7.4, kq) }, tgt, 35, .015);
      G.focus = lerp(10.2, 7.6, kq); G.aperture = .0011; G.maxblur = .008;
      G.flash = .4 * (1 - E.o3(seg(t, tW7 - .3, tW7)));
      spineState({ on: false });
    } else {   // 第一次寒冬
      const ki = E.io2(seg(t, tIce, tIce + 2.2));
      LOOK.silver(G, F); LOOK.cold(G, F);
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [ki, 0], iceDir: 1, cut: 1, ember: 1, head: 0, origin: 1 });
      drawTo(fund, E.io2(seg(t, tFund - .9, tFund + 1.1))); fund.material.opacity = 1; fundLab.userData.u.uOp.value = E.o3(seg(t, tFund - .9, tFund - .3));
      const k = E.io3(seg(t, tW9 - .4, T1));
      cam = { x: X(lerp(1968, 1976, k)), y: lerp(7, 6, k), z: lerp(80, 46, k), tx: X(lerp(1969.5, 1977, k)), ty: lerp(5, 1.5, k), tz: 0, fov: 35, roll: 0 };
      G.frost = .72 * E.io2(seg(t, tIce + .4, T1 - .1)); G.sat = lerp(1, .55, ki);
      G.flash = .4 * (1 - E.o3(seg(t, tW9 - .4, tW9 - .1)));
    }
    Object.assign(CAM, cam);
  } });
}

/* ======================= 五 · 专家系统 ======================= */
{
  const S = stage(3), { grp, W, P, O } = S;
  const T0 = chapterAt('x1').t1, T1 = chapterAt('y1').t0;
  const onSp = new THREE.Group(); scene.add(onSp); only(grp, T0, T1); only(onSp, T0, T1);
  const tX2 = c('x2'), tX3 = c('x3'), tX4 = c('x4'), tX5 = c('x5'), tX6 = c('x6'), tX7 = c('x7');
  /* R1 / XCON 的规则原文（McDermott 1982） */
  const RULE = ['R1 (XCON) · DIGITAL EQUIPMENT CORPORATION', '', 'ASSIGN-POWER-SUPPLY-1', 'IF:   THE MOST CURRENT ACTIVE CONTEXT IS', '      ASSIGNING A POWER SUPPLY', 'AND   AN SBI MODULE OF ANY TYPE HAS BEEN PUT', '      IN A CABINET', 'AND   THE POSITION IT OCCUPIES IN THE CABINET', '      (ITS NEXUS) IS KNOWN', 'AND   THERE IS SPACE AVAILABLE IN THE CABINET', '      FOR A POWER SUPPLY FOR THAT NEXUS', 'AND   THERE IS NO AVAILABLE POWER SUPPLY', 'AND   THE VOLTAGE AND FREQUENCY OF THE', '      COMPONENTS ON THE ORDER IS KNOWN', 'THEN: FIND A POWER SUPPLY OF THAT VOLTAGE', '      AND FREQUENCY', 'AND   ADD IT TO THE ORDER'];
  const NCH = RULE.reduce((s, l) => s + l.length, 0);
  const SW = 1600, SH = 1200;
  const scr = canvasTex(SW, SH, () => {}); const sg = scr.userData.canvas.getContext('2d');
  let lastN = -1;
  const drawScr = (n, blink) => {
    const key = n * 2 + (blink ? 1 : 0); if (key === lastN) return; lastN = key;
    sg.fillStyle = '#000'; sg.fillRect(0, 0, SW, SH); sg.font = '700 44px CourierPrime'; sg.textBaseline = 'alphabetic';
    let left = n, y = 150, cx = 110, cy = 150;
    for (const [i, l] of RULE.entries()) { const k = Math.min(l.length, Math.max(0, left)); sg.fillStyle = i === 0 ? '#8a8a8a' : i === 2 ? '#fff' : '#d8d8d8'; sg.fillText(l.slice(0, k), 110, y); if (left > 0) { cx = 110 + sg.measureText(l.slice(0, k)).width; cy = y; } left -= l.length; if (left <= 0) break; y += 58; }
    sg.fillStyle = '#9a9a9a'; if (blink) sg.fillRect(cx + 6, cy - 38, 24, 44);   // 光标常亮、偏暗，不整块闪
    sg.fillStyle = '#5a5a5a'; sg.fillRect(110, 182, SW - 220, 3);
    scr.needsUpdate = true;
  };
  const mon = crt(scr, 16, 12); grp.add(mon);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(17.6, 13.6), new THREE.MeshBasicMaterial({ color: 0x0d0b09 })); bezel.position.z = -.05; grp.add(bezel);
  const cmo = motes(200, [22, 16, 10], 51, .22); cmo.position.set(0, 0, 4); grp.add(cmo);
  const xSrc = label(`right:96px;top:56px;text-align:right;font:500 28px/1 JBM;color:#b3aa9c;background:rgba(8,7,6,.78);padding:12px 18px`, '规则原文：McDermott，R1，1982', T0 + .3, tX3 + .5);
  const tType0 = T0 + .35, CPS = NCH / (tX2 + 1.2 - tType0);
  const nAt = t => clamp(Math.floor((t - tType0) * CPS), 0, NCH);
  /* 规则墙：每块 = 一条规则（同一张规则纹理，各自错开一截） */
  const wallTex = canvasTex(800, 600, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.font = '700 26px CourierPrime'; g.fillStyle = '#fff'; RULE.slice(2).concat(RULE.slice(2)).forEach((l, i) => g.fillText(l, 40, 40 + i * 34)); });
  wallTex.wrapT = THREE.RepeatWrapping;
  const CW = 48, CH = 44, NT = CW * CH, TW = 1.6, TH = 1.2, GP = .22;
  const aOn = new Float32Array(NT), aHot = new Float32Array(NT), aSd = new Float32Array(NT);
  const tg = new THREE.PlaneGeometry(TW, TH);
  tg.setAttribute('aOn', new THREE.InstancedBufferAttribute(aOn, 1)); tg.setAttribute('aHot', new THREE.InstancedBufferAttribute(aHot, 1)); tg.setAttribute('aSd', new THREE.InstancedBufferAttribute(aSd, 1));
  const wallU = { uMap: { value: wallTex }, uTime: { value: 0 }, uDim: { value: 1 } };
  const wall = new THREE.InstancedMesh(tg, new THREE.ShaderMaterial({ uniforms: wallU, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aOn, aHot, aSd; varying vec2 vUv; varying float vOn, vHot, vSd; void main(){ vUv = uv; vOn = aOn; vHot = aHot; vSd = aSd; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uTime, uDim; varying vec2 vUv; varying float vOn, vHot, vSd;
      void main(){ vec2 uv = vec2(vUv.x, vUv.y * .5 + vSd + uTime * .02 * (vSd - .5)); float l = texture2D(uMap, uv).r;
        float edge = smoothstep(0., .04, min(vUv.x, 1. - vUv.x)) * smoothstep(0., .05, min(vUv.y, 1. - vUv.y));
        vec3 ph = mix(vec3(2., 1.15, .3), vec3(1.2, 1.6, 2.4), vHot);
        vec3 col = (ph * l * (.55 + 1.6 * vHot) + vec3(.05, .03, .01) + ph * .05 * vHot) * edge * vOn * uDim;
        gl_FragColor = vec4(col, 1.); }` }), NT);
  wall.frustumCulled = false; grp.add(wall);
  const base = [], order = [];
  for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) { const x = (i - (CW - 1) / 2) * (TW + GP), y = (j - (CH - 1) / 2) * (TH + GP); base.push([x, y, -.02 * (x * x + y * y) * .05]); }
  base.forEach((b, i) => { aSd[i] = hash(i * 3.3); order.push([Math.hypot(b[0], b[1] * 1.3) + hash(i * 7.1) * 6, i]); });
  order.sort((a, b) => a[0] - b[0]); const rank = new Float32Array(NT); order.forEach(([, i], r) => rank[i] = r / NT);
  const dmy = new THREE.Object3D();
  const placeWall = (fall, t) => { for (let i = 0; i < NT; i++) { const [x, y, z] = base[i]; let px = x, py = y, pz = z, rx = 0, rz = 0; if (fall > 0) { const d = Math.max(0, fall - hash(i * 5.7) * .35 - (y + 30) / 160); px += (hash(i * 2.1) - .5) * 9 * d; py -= 26 * d * d + 2 * d; pz += (hash(i * 4.3) - .2) * 14 * d; rx = (hash(i * 8.8) - .5) * 9 * d; rz = (hash(i * 9.9) - .5) * 7 * d; } dmy.position.set(px, py, pz); dmy.rotation.set(rx, 0, rz); dmy.updateMatrix(); wall.setMatrixAt(i, dmy.matrix); } wall.instanceMatrix.needsUpdate = true; };
  placeWall(0, 0);
  /* 冲突连线 */
  const NC = 90, cPairs = [...Array(NC)].map((_, k) => { const a = Math.floor(hash(k * 3.1 + .5) * NT), b = Math.min(NT - 1, Math.max(0, a + Math.floor((hash(k * 4.7) - .5) * 14) + CW * Math.floor((hash(k * 6.1) - .5) * 8))); return [a, b]; });
  const cPos = new Float32Array(NC * 6); cPairs.forEach(([a, b], k) => cPos.set([...base[a], ...base[b]].map((v, i) => v + (i % 3 === 2 ? .05 : 0)), k * 6));
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
  const cm = new THREE.LineBasicMaterial({ color: new THREE.Color(1.6, 2.1, 3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const conflicts = new THREE.LineSegments(cg, cm); conflicts.frustumCulled = false; grp.add(conflicts);
  /* 计数 */
  const cnt = el(null, 'position:absolute;left:150px;top:300px;width:900px'); hidden(cnt);
  const cntShade = shade(1150, .92);
  el(cnt, `position:relative;font:700 36px/1 JBM;color:${COL.amber};letter-spacing:3px;margin-bottom:34px`, 'DEC · XCON', { 'data-chk': 'text' });
  const r1 = el(cnt, 'position:relative;display:flex;align-items:baseline;gap:18px;padding:14px 0 16px;border-top:1px solid rgba(244,239,230,.18)');
  const r1n = el(r1, `position:relative;font:900 92px/1 SourceHanSerif;color:${COL.white};font-variant-numeric:tabular-nums`, '0', { 'data-chk': 'text' }); el(r1, `position:relative;font:700 36px/1 PuHuiTi;color:#cfc6b8`, '条规则', { 'data-chk': 'text' });
  const r2 = el(cnt, 'position:relative;display:flex;align-items:baseline;gap:18px;padding:14px 0 16px;border-top:1px solid rgba(244,239,230,.18)'); hidden(r2);
  el(r2, `position:relative;font:900 76px/1 SourceHanSerif;color:${COL.amber}`, '$25,000,000', { 'data-chk': 'text' }); el(r2, `position:relative;font:700 36px/1.2 PuHuiTi;color:#cfc6b8`, '每年省下<br>（估计）', { 'data-chk': 'text' });
  const tWall0 = tX3 - .4, tWallN = cw('x3', '两千多条') + .9;
  tl.fromTo([cnt, cntShade], { opacity: 0 }, { opacity: 1, duration: .4, immediateRender: false }, cw('x3', 'DEC') - .1).to([cnt, cntShade], { opacity: 0, duration: .3 }, tX4 - .5);
  tl.fromTo(r2, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: .5, ease: 'expo.out', immediateRender: false }, cw('x3', '两千五百万') - .2);
  /* LISP 机 + 第五代 */
  const lisp = await photo('lisp_cadr2.jpg', 12, { depth: 2.2, edge: .03, sat: .3, tint: [1.12, .96, .78] }); lisp.position.set(90, 0, 0); grp.add(lisp);
  const lmo = motes(200, [14, 14, 8], 52, .3); lmo.position.set(90, 0, 3); grp.add(lmo);
  const card = infoCard({ title: '1980 年代 · AI 热', rows: [['1982', '年启动', '日本'], ['10', '年计划', '第五代计算机']], src: '照片：MIT CADR LISP 机<br>Daderot · CC0' });
  card.show(tX4 - .2, tX5 - .4, [cw('x4', '日本') - .1, cw('x4', '第五代') + .1]);
  const xConf = label(`left:0;top:150px;width:1920px;text-align:center;font:900 64px/1 SourceHanSerif;color:#b9c8dc;letter-spacing:6px`, '规则 × 规则', cw('x5', '打架') - .3, cw('x5', '没写过') - .2);
  const xDumb = label(`left:0;top:150px;width:1920px;text-align:center;font:900 64px/1 SourceHanSerif;color:#b9c8dc;letter-spacing:6px`, '没写过的情况 → ？', cw('x5', '没写过') - .1, tX6 - .3);
  const tCrash = cw('x6', '彻底崩盘') - .1;
  const crashLab = label(`left:0;top:150px;width:1920px;text-align:center;font:900 72px/1 SourceHanSerif;color:${COL.amber};letter-spacing:4px`, '1987 · LISP 机市场崩盘', cw('x6', 'LISP') - .5, tX7 - .4);
  /* 第二次寒冬：「AI」这个词被冻住 */
  const aiWord = textMesh('“AI”', 6, { font: '900 200px SourceHanSerif', color: '#f4efe6' }); aiWord.position.set(X(1990), 11, -2); onSp.add(aiWord);
  const tIce = cw('x7', '寒冬') - .7, tAfraid = cw('x7', '不敢提');

  shot({ name: 'ch5', t0: T0, t1: T1, look(t) {
    const onSpine = t >= tX7 - .4;
    grp.visible = !onSpine; onSp.visible = true; aiWord.visible = onSpine;
    [cmo, lmo].forEach(m => m.userData.step(t)); wallU.uTime.value = t; mon.userData.u.uTime.value = t;
    const inLisp = t >= tX4 - .3 && t < tX5 - .3;
    lisp.visible = lmo.visible = inLisp; wall.visible = !inLisp && t >= tWall0 - .2; mon.visible = bezel.visible = !inLisp && t < tX4 - .3; cmo.visible = t < tX4 - .3;
    conflicts.visible = t >= cw('x5', '打架') - .3 && t < tX6;
    LOOK.crt(G, F); F.flicker = 0; F.grain = .18; G.streak = 0;   // CRT 段：横向光痕会在字行之间拉出跳动的细线，关掉
    let cam;
    if (t < tWall0) {   // 一条规则打出来
      drawScr(nAt(t), true); mon.userData.u.uBright.value = .72;
      mon.scale.setScalar(1);
      const n = nAt(t), li = (() => { let s = 0; for (let i = 0; i < RULE.length; i++) { s += RULE[i].length; if (s >= n) return i; } return RULE.length - 1; })();
      const yy = 6 - (150 + Math.max(li, 3) * 58) / SH * 12, k = E.io2(seg(t, T0, tWall0));
      cam = P([lerp(-.6, 1.4, k), yy - 1.4, lerp(15, 16.5, k)], [lerp(-.4, .6, k), yy + .2, 0], 35, lerp(.03, -.01, k));
      G.flash = .5 * (1 - E.o3(seg(t, T0, T0 + .3))); G.aperture = .0008; G.focus = cam.z - O.z; G.maxblur = .006;
    } else if (t < tX4 - .3) {   // 拉开：两千多条规则
      drawScr(NCH, true);
      const kw = seg(t, tWall0, tWallN), nOn = Math.floor(E.io2(kw) * NT);
      for (let i = 0; i < NT; i++) aOn[i] = clamp((E.io2(kw) - rank[i]) * 40) * (Math.hypot(base[i][0], base[i][1]) < 9.6 && kw < .02 ? 0 : 1); tg.attributes.aOn.needsUpdate = true; aHot.fill(0); tg.attributes.aHot.needsUpdate = true;
      const ks = E.io3(seg(t, tWall0 - .2, tWall0 + 1.2)); mon.scale.setScalar(lerp(1, TW / 16, ks)); bezel.scale.setScalar(lerp(1, TW / 16, ks)); mon.position.z = bezel.position.z = .05;
      r1n.textContent = (Math.min(2000, Math.round(nOn * 2000 / NT / 50) * 50)).toLocaleString('en-US') + (nOn >= NT * .99 ? '+' : '');
      const k = E.io3(seg(t, tWall0, tWallN + .8));
      cam = P([lerp(1.4, -14, k), lerp(-.8, -4, k), lerp(13.5, 62, k)], [lerp(.2, -10, k), lerp(-.5, -1, k), 0], 35, lerp(-.01, .05, k));
      G.aperture = 0; G.bloom = .75;
    } else if (inLisp) {   // LISP 机
      const k = E.io2(seg(t, tX4 - .3, tX5 - .3));
      cam = P([90 + lerp(1.2, -.4, k), lerp(2.2, .4, k), lerp(16, 12.5, k)], [90 + lerp(.4, .1, k), lerp(1.8, .3, k), -2]);
      G.flash = .45 * (1 - E.o3(seg(t, tX4 - .3, tX4))); G.focus = cam.z - O.z - 1; G.aperture = .0007; G.maxblur = .006; F.grain = .35;
    } else if (t < tX6 - .3) {   // 规则打架 / 犯傻
      for (let i = 0; i < NT; i++) aOn[i] = 1; tg.attributes.aOn.needsUpdate = true;
      const kc = seg(t, cw('x5', '打架') - .3, tX6 - .3); aHot.fill(0);
      cPairs.forEach(([a, b], k) => { const on = hash(k * 1.3 + Math.floor(t * 9)) > .45 && kc > 0; aHot[a] = aHot[b] = on ? 1 : 0; });
      tg.attributes.aHot.needsUpdate = true; cm.opacity = .55 + .45 * Math.sin(t * 40);
      const g = clamp(kc * 2) * (.5 + .5 * Math.sin(t * 13)); G.ca = .008 * g; G.blur = [g * .006 * (hash(Math.floor(t * 24)) - .5), 0];
      const k = E.io2(seg(t, tX5 - .3, tX6 - .3));
      cam = P([lerp(-8, 6, k), lerp(-6, 2, k), lerp(34, 26, k)], [lerp(-4, 4, k), 0, 0], 35, lerp(.06, -.04, k));
      cam = shake(cam, t, cw('x5', '没写过'), .25, .5);
      G.flash = .4 * (1 - E.o3(seg(t, tX5 - .3, tX5)));
    } else {   // 1987：墙碎
      aHot.fill(0); tg.attributes.aHot.needsUpdate = true;
      const kf = seg(t, tCrash, tCrash + 3.2); placeWall(kf * 3.2 * .55, t);
      wallU.uDim.value = 1 - .5 * kf;
      const k = E.io2(seg(t, tX6 - .3, tX7 - .4));
      cam = P([lerp(0, -3, k), lerp(4, -2, k), lerp(46, 58, k)], [0, lerp(1, -6, k), 0], 35, .02);
      cam = shake(cam, t, tCrash, .7, .9);
      G.flash = .6 * Math.exp(-Math.pow((t - tCrash) / .09, 2)) + .4 * (1 - E.o3(seg(t, tX6 - .3, tX6))); G.ca = .006 * Math.exp(-(t - tCrash) * 3) * (t > tCrash ? 1 : 0);
    }
    if (onSpine) {   // 第二次寒冬
      const ki = E.io2(seg(t, tIce, tIce + 2));
      LOOK.cold(G, F);
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [1, ki], iceDir: 1, cut: 1, ember: 1, head: 0, origin: 1 });
      const k = E.io3(seg(t, tX7 - .4, T1));
      cam = { x: X(lerp(1984, 1991, k)), y: lerp(6, 8, k), z: lerp(36, 42, k), tx: X(lerp(1988, 1991, k)), ty: 4, tz: 0, fov: 35, roll: 0 };
      const ka = E.o3(seg(t, tX7 - .2, tX7 + .5)), kf = E.io2(seg(t, tAfraid - .2, tAfraid + 1));
      aiWord.userData.u.uOp.value = ka * lerp(1, .22, kf); aiWord.userData.u.uBright.value = lerp(1, .7, kf);
      G.frost = .74 * E.io2(seg(t, tIce + .3, T1 - .1)); G.sat = lerp(1, .5, ki);
      G.flash = .45 * (1 - E.o3(seg(t, tX7 - .4, tX7 - .1)));
    } else spineState({ on: false });
    Object.assign(CAM, cam);
  } });
}

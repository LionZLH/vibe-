/* 二 · 命名（b1–b5）：三位发起人 → 申请书首页（ARTIFICIAL INTELLIGENCE）→ 第二页（2 个月、10 个人、一个夏天）→ 1956 → 规则轨亮起
   三 · 另一条路（d1–d8）：罗森布拉特 → 感知机真跑 50 次（400 个光电管 + 权重）→ 1958 年报纸原句 → Mark I 原机 → 两条轨 */
import { THREE, CAM, G, canvasTex } from '../gl.js';
import { F } from '../film.js';
import { tl, c, ce, cw, COL, el, hidden, letters, typeOn, seg, lerp, clamp, E, hash, shot } from '../core.js';
import { X, LANE, spineState } from '../spine.js';
import { stage, photo, textMesh, typeset, doc, motes, pose, mixP, LOOK } from '../kit.js';
import { chapterAt } from '../chapter.js';

/* ======================= 二 · 命名 ======================= */
{
  const S = stage(0), { grp, W, P } = S;
  const T0 = chapterAt('b1').t1, T1 = chapterAt('d1').t0;
  /* 三位发起人（2.5D 黑白），横向排开，镜头平移扫过 */
  const people = [['mccarthy.jpg', 'JOHN McCARTHY', '1927 — 2011'], ['minsky.jpg', 'MARVIN MINSKY', '1927 — 2016'], ['shannon.jpg', 'CLAUDE SHANNON', '1916 — 2001']];
  const ppl = [];
  for (let i = 0; i < 3; i++) {
    const m = await photo(people[i][0], 7.2, { depth: 1.2, edge: .06 }); m.position.set(i * 9.2, 0, -i * .6); grp.add(m);
    const nm = textMesh(people[i][1], .62, { font: '600 200px EBGaramond', ls: 14, color: '#f4efe6' }); nm.position.set(i * 9.2, -4.6, .2); grp.add(nm);
    const yr = textMesh(people[i][2], .48, { font: '700 200px JBM', color: '#f2b33d' }); yr.position.set(i * 9.2, -5.4, .2); grp.add(yr);
    ppl.push({ m, nm, yr });
  }
  const pm = motes(220, [30, 12, 8], 11); pm.position.set(9, 0, 3); grp.add(pm);
  /* 申请书（按原件打字稿重排，文字为原文） */
  const p1 = typeset({ PH: 1700, top: 420, font: '700 54px CourierPrime', lh: 82, text: 'A PROPOSAL FOR THE\nDARTMOUTH SUMMER RESEARCH PROJECT\nON {ai:ARTIFICIAL INTELLIGENCE}', head: null });
  const p1doc = doc(p1, 9); p1doc.position.set(60, 0, 0); grp.add(p1doc);
  const authors = typeset({ PH: 900, top: 120, font: '400 46px CourierPrime', lh: 72, text: 'J. McCarthy, Dartmouth College\nM. L. Minsky, Harvard University\nN. Rochester, I.B.M. Corporation\nC.E. Shannon, Bell Telephone Laboratories\n{d:August 31, 1955}' });
  const audoc = doc(authors, 9); audoc.position.set(60, -9.4, 0); grp.add(audoc);
  const p2 = typeset({ PH: 1800, top: 220, font: '400 48px CourierPrime', lh: 74, justify: true,
    text: 'We propose that a {m:2 month, 10 man study} of artificial intelligence be carried out during the summer of 1956 at Dartmouth College in Hanover, New Hampshire. The study is to proceed on the basis of the conjecture that every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it. An attempt will be made to find how to make machines use language, form abstractions and concepts, solve kinds of problems now reserved for humans, and improve themselves. We think that a significant advance can be made in one or more of these problems if a carefully selected group of scientists work on it {s:together for a summer.}' });
  const p2doc = doc(p2, 9); p2doc.position.set(76, -1, -.5); p2doc.rotation.z = .02; grp.add(p2doc);
  const dm = motes(200, [26, 20, 8], 12); dm.position.set(66, -2, 3); grp.add(dm);
  /* 1956 */
  const y56 = textMesh('1956', 7, { color: '#f2b33d', font: '900 200px SourceHanSerif' }); y56.position.set(100, 1.5, 0); grp.add(y56);
  const place = textMesh('DARTMOUTH COLLEGE · HANOVER, NEW HAMPSHIRE', .7, { font: '700 200px JBM', color: '#cfc6b8', ls: 8 }); place.position.set(100, -3.6, 0); grp.add(place);
  /* 规则轨标注 */
  const ruleLab = textMesh('规则', 2.2, { color: '#dfe6ee', font: '900 200px SourceHanSerif' }); ruleLab.position.set(X(1956) + 4, LANE.rule + 2.4, 0); ruleLab.visible = false; S.grp.parent.add(ruleLab);
  const tB2 = cw('b2', '人工智能'), tB3m = cw('b3', '一群科学家'), tB3s = cw('b3', '一个夏天'), tB4 = c('b4'), tB5 = c('b5');
  shot({ name: 'ch2', t0: T0, t1: T1, look(t) {
    LOOK.silver(G, F);
    spineState({ on: t > tB5 - .4, axis: 1, labels: 1, lanes: 1, ice: [0, 0], head: 0, origin: 1 });
    grp.visible = t < tB5 - .4; ruleLab.visible = t >= tB5 - .4;
    [pm, dm].forEach(m => m.userData.step(t));
    let cam;
    if (t < tB2 - 1.1) {   // 三人：横移
      const k = E.io2(seg(t, T0, tB2 - 1.1));
      cam = P([lerp(-2, 20, k), .3, 15.5], [lerp(-1, 19.5, k), -.4, 0]);
      ppl.forEach(({ m, nm, yr }, i) => { const a = E.o3(seg(t, T0 + i * .35, T0 + .6 + i * .35)); m.userData.u.uOp.value = a; nm.userData.u.uOp.value = a; yr.userData.u.uOp.value = E.o3(seg(t, T0 + .3 + i * .35, T0 + .9 + i * .35)); });
      G.focus = 15.3; G.aperture = .0012; G.maxblur = .008;
    } else if (t < tB4 - .5) {   // 申请书：首页 → 作者 → 第二页
      const kIn = E.o5(seg(t, tB2 - 1.1, tB2 - .2));
      p1doc.rotation.set(lerp(-1.0, -.25, kIn), lerp(.2, .04, kIn), 0); p1doc.position.y = lerp(-8, 0, kIn);
      const ai = p1doc.userData.at('ai'); p1doc.updateMatrixWorld(); const aiW = p1doc.localToWorld(ai.clone());
      p1doc.userData.hi('ai', E.io2(seg(t, tB2, tB2 + .8)));
      const kA = E.io3(seg(t, tB2 + 1.2, tB3m - 1.2));   // 往下看作者和日期
      audoc.userData.hi('d', E.io2(seg(t, tB2 + 1.6, tB2 + 2.3)));
      audoc.position.y = -9.4 + lerp(-3, 0, kIn); audoc.rotation.copy(p1doc.rotation); audoc.updateMatrixWorld();
      const dW = audoc.localToWorld(audoc.userData.at('d').clone());
      const kP2 = E.io3(seg(t, tB3m - 1.2, tB3m - .2));
      p2doc.updateMatrixWorld(); const mW = p2doc.localToWorld(p2doc.userData.at('m').clone()), sW = p2doc.localToWorld(p2doc.userData.at('s').clone());
      p2doc.userData.hi('m', E.io2(seg(t, tB3m - .1, tB3m + .6))); p2doc.userData.hi('s', E.io2(seg(t, tB3s, tB3s + .7)));
      const kS = E.io3(seg(t, tB3s - .9, tB3s + .1));
      const tgt = aiW.clone().lerp(dW, kA).lerp(mW, kP2).lerp(sW, kS);
      const dist = lerp(lerp(6.5, 4.6, E.io2(seg(t, tB2 - .6, tB2 + .3))), 5.4, Math.max(kA, kP2));
      cam = pose({ x: tgt.x + .3, y: tgt.y - 1.4 * (1 - kIn) - .4, z: tgt.z + dist }, tgt, 35, -.02);
      G.focus = dist; G.aperture = .0013; G.maxblur = .009;
    } else if (t < tB5 - .4) {   // 1956：年份从光里浮出
      const k = E.io2(seg(t, tB4 - .5, tB5 - .4));
      y56.userData.u.uOp.value = E.o3(seg(t, tB4 - .4, tB4 + .4)); place.userData.u.uOp.value = E.o3(seg(t, tB4 + .5, tB4 + 1.1));
      cam = P([100 + lerp(-2, 1, k), lerp(-1, .5, k), lerp(26, 20, k)], [100, 0, 0]);
      G.flash = .5 * (1 - E.o3(seg(t, tB4 - .5, tB4 - .1)));
    } else {   // 规则轨：从 1956 往后亮起
      const k = E.io3(seg(t, tB5 - .4, T1));
      cam = { x: X(1956) + lerp(8, 30, k), y: lerp(6, 9, k), z: lerp(22, 46, k), tx: X(1956) + lerp(10, 40, k), ty: 2, tz: 0, fov: 35, roll: 0 };
      ruleLab.userData.u.uOp.value = E.o3(seg(t, tB5 + .2, tB5 + .9));
      spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [0, 0], head: 0, origin: 1, reveal: X(1950), learnOff: 1 });
      G.flash = .45 * (1 - E.o3(seg(t, tB5 - .4, tB5)));
    }
    Object.assign(CAM, cam);
  } });
}

/* ======================= 三 · 另一条路 ======================= */
{
  const S = stage(1), { grp, W, P } = S;
  const T0 = chapterAt('d1').t1, T1 = chapterAt('w1').t0;
  const ros = await photo('rosenblatt.jpg', 9, { depth: 1.3, edge: .06 }); ros.position.set(0, 0, 0); grp.add(ros);
  const rn = textMesh('FRANK ROSENBLATT', .7, { font: '600 200px EBGaramond', ls: 14 }); rn.position.set(-7.2, .6, 0); grp.add(rn);
  const ry = textMesh('1928 — 1971', .5, { font: '700 200px JBM', color: '#f2b33d' }); ry.position.set(-7.2, -.4, 0); grp.add(ry);
  const rm = motes(200, [16, 12, 8], 21); rm.position.set(-2, 0, 3); grp.add(rm);
  /* ---- 感知机真跑：20×20 视网膜 + 20×20 权重；卡片上的方块在左还是右 ---- */
  const N = 20, trials = [];
  { const w = new Float32Array(N * N); let b = 0;
    for (let n = 0; n < 50; n++) {
      const right = hash(n * 7.13 + 2) > .5, cx = right ? 11 + Math.floor(hash(n * 3.1) * 6) : 1 + Math.floor(hash(n * 3.1) * 6), cy = 2 + Math.floor(hash(n * 5.7) * 14), sz = 2 + Math.floor(hash(n * 9.9) * 3);
      const x = new Float32Array(N * N); for (let j = cy; j < Math.min(N, cy + sz); j++) for (let i = cx; i < Math.min(N, cx + sz); i++) x[j * N + i] = 1;
      let s = b; for (let i = 0; i < N * N; i++) s += w[i] * x[i];
      const pred = s > 0, ok = pred === right;
      trials.push({ x, w: Float32Array.from(w), right, ok });   // w：这次判断前的权重
      if (!ok) { const d = right ? 1 : -1; for (let i = 0; i < N * N; i++) w[i] += d * x[i] * .5; b += d * .5; }
    }
    trials.push({ x: trials[49].x, w: Float32Array.from(w), right: trials[49].right, ok: true });
  }
  const cell = .42, gap = .06, gridW = N * (cell + gap);
  const mkGrid = (x0) => { const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(cell, cell), new THREE.MeshBasicMaterial({ toneMapped: false }), N * N); const o = new THREE.Object3D();
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { o.position.set(x0 + i * (cell + gap) - gridW / 2, (N / 2 - j) * (cell + gap) - (cell + gap) / 2, 0); o.updateMatrix(); m.setMatrixAt(j * N + i, o.matrix); m.setColorAt(j * N + i, new THREE.Color(.1, .1, .1)); }
    m.instanceColor.needsUpdate = true; return m; };
  const net = new THREE.Group(); net.position.set(60, 0, 0); grp.add(net);
  const retina = mkGrid(-6.2), weights = mkGrid(6.2); net.add(retina, weights);
  const lab1 = textMesh('输入 · 400 个光电管', .62, { font: '700 200px PuHuiTi', color: '#cfc6b8' }); lab1.position.set(-6.2, 5.6, 0); net.add(lab1);
  const lab2 = textMesh('权重 · 每次猜错就调一点', .62, { font: '700 200px PuHuiTi', color: '#cfc6b8' }); lab2.position.set(6.2, 5.6, 0); net.add(lab2);
  const ctr = el(null, `position:absolute;left:0;top:760px;width:1920px;display:flex;justify-content:center;align-items:baseline;gap:26px;font:700 40px/1 JBM;color:${COL.white}`, '', { 'data-chk': 'text' }); hidden(ctr);
  const ctrN = el(ctr, 'position:relative;font-variant-numeric:tabular-nums', '');
  const ctrR = el(ctr, `position:relative;font:700 40px/1 PuHuiTi`, '');
  const dots = el(null, 'position:absolute;left:560px;top:830px;width:800px;display:flex;gap:4px'); hidden(dots);
  const dotEls = trials.slice(0, 50).map(() => el(dots, 'position:relative;flex:1;height:14px;background:rgba(244,239,230,.12)'));
  /* ---- 1958 年报纸原句 ---- */
  const nyt = typeset({ PW: 1800, PH: 1300, M: 140, top: 300, font: '500 56px EBGaramond', lh: 82, bg: '#e6dfcc', justify: true,
    head: (g, PW) => { g.font = '700 46px EBGaramond'; g.textAlign = 'center'; g.fillText('NEW NAVY DEVICE LEARNS BY DOING', PW / 2, 150); g.font = 'italic 500 38px EBGaramond'; g.fillText('Psychologist Shows Embryo of Computer Designed to Read and Grow Wiser', PW / 2, 215); g.fillRect(140, 245, PW - 280, 2); g.textAlign = 'left'; return 330; },
    text: 'WASHINGTON, July 7 (UPI) — The Navy revealed the embryo of an electronic computer today that it expects will be able to {q:walk, talk, see, write, reproduce itself and be conscious of its existence.}' });
  const nydoc = doc(nyt, 11, { sat: .2 }); nydoc.position.set(120, 0, 0); grp.add(nydoc);
  const nysrc = el(null, `position:absolute;left:0;top:820px;width:1920px;text-align:center;font:500 30px/1 JBM;color:${COL.mute}`, 'The New York Times · 1958 年 7 月 8 日', { 'data-chk': 'text' }); hidden(nysrc);
  /* ---- Mark I 原机 ---- */
  const mk = await photo('perceptron_navy.jpg', 10.5, { depth: 2.2, edge: .02 }); mk.position.set(180, 0, 0); grp.add(mk);
  const mkm = motes(200, [16, 12, 8], 23); mkm.position.set(180, 0, 3); grp.add(mkm);
  const mkData = el(null, 'position:absolute;left:150px;top:300px;width:600px'); hidden(mkData);
  el(mkData, `position:relative;font:700 36px/1 JBM;color:${COL.amber};letter-spacing:3px;margin-bottom:34px`, 'MARK I PERCEPTRON · 1960', { 'data-chk': 'text' });
  const mkRows = [['400', '个光电管'], ['20 × 20', '视网膜']].map(([n, u]) => { const r = el(mkData, 'position:relative;display:flex;align-items:baseline;gap:18px;padding:14px 0;border-top:1px solid rgba(244,239,230,.18)'); el(r, `position:relative;font:900 92px/1 SourceHanSerif;color:${COL.white}`, n, { 'data-chk': 'text' }); el(r, `position:relative;font:700 36px/1 PuHuiTi;color:#cfc6b8`, u, { 'data-chk': 'text' }); hidden(r); return r; });
  el(mkData, `position:relative;margin-top:24px;font:500 28px/1.3 JBM;color:${COL.mute}`, '照片：美国海军国家博物馆', { 'data-chk': 'text' });
  const mkShade = el(null, 'position:absolute;left:0;top:0;width:1100px;height:1080px;background:linear-gradient(90deg,rgba(8,7,6,.9),rgba(8,7,6,.65) 45%,rgba(8,7,6,0))'); hidden(mkShade);
  document.getElementById('dom').appendChild(mkData);
  /* 两条轨的标注 */
  const ruleLab = textMesh('规则', 2.2, { color: '#dfe6ee', font: '900 200px SourceHanSerif' }), learnLab = textMesh('学习', 2.2, { color: '#f2b33d', font: '900 200px SourceHanSerif' });
  ruleLab.position.set(X(1959), LANE.rule + 2.4, 0); learnLab.position.set(X(1961), LANE.learn - 2.6, 0); S.grp.parent.add(ruleLab, learnLab);
  const tD2 = c('d2'), tD3 = c('d3'), tD4 = c('d4'), tD5 = c('d5'), tD6 = c('d6'), tD7 = c('d7');
  const tSim0 = tD3 - .3, tSim1 = tD5 - .5;
  tl.set(ctr, { opacity: 1 }, tSim0 + .3).set([ctr, dots], { opacity: 0 }, tSim1).set(dots, { opacity: 1 }, tSim0 + .3);
  tl.set(nysrc, { opacity: 1 }, tD5 + .4).set(nysrc, { opacity: 0 }, tD6 - .3);
  tl.fromTo(mkShade, { opacity: 0 }, { opacity: 1, duration: .5, immediateRender: false }, tD6).set(mkShade, { opacity: 0 }, tD7 - .3);
  tl.set(mkData, { opacity: 1 }, tD6 + .2).set(mkData, { opacity: 0 }, tD7 - .3);
  mkRows.forEach((r, k) => tl.fromTo(r, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: .5, ease: 'expo.out', immediateRender: false }, cw('d6', '四百个') + k * .5));
  const amber = new THREE.Color(2.4, 1.5, .4), white = new THREE.Color(1.3, 1.25, 1.2), off = new THREE.Color(.07, .065, .06), neg = new THREE.Color(.35, .5, .75);
  shot({ name: 'ch3', t0: T0, t1: T1, look(t) {
    LOOK.silver(G, F);
    const onSpine = t >= tD7 - .3;
    spineState({ on: onSpine, axis: 1, labels: 1, lanes: 1, ice: [0, 0], head: 0, origin: 1 });
    grp.visible = !onSpine; ruleLab.visible = learnLab.visible = onSpine;
    [rm, mkm].forEach(m => m.userData.step(t));
    ros.visible = rn.visible = ry.visible = t < tSim0; net.visible = t >= tSim0 && t < tSim1; nydoc.visible = t >= tSim1 && t < tD6; mk.visible = t >= tD6 && !onSpine;
    let cam;
    if (t < tSim0) {
      const k = E.io2(seg(t, T0, tSim0));
      cam = P([lerp(-3.4, -2.2, k), lerp(.2, .5, k), lerp(17, 14, k)], [-2.6, .2, 0]);
      const a = E.o3(seg(t, tD2 - .2, tD2 + .5)); rn.userData.u.uOp.value = a; ry.userData.u.uOp.value = E.o3(seg(t, tD2 + .3, tD2 + 1));
      G.focus = cam.z - S.O.z - .5; G.aperture = .0014; G.maxblur = .008;
    } else if (t < tSim1) {   // 50 次试验，越来越快
      const k = seg(t, tSim0 + .6, tSim1 - .6), n = Math.min(50, Math.floor(50 * Math.pow(k, 1.7)));
      const tr = trials[n], sub = 50 * Math.pow(k, 1.7) - n;
      for (let i = 0; i < N * N; i++) {
        retina.setColorAt(i, tr.x[i] ? (tr.right ? amber : white) : off);
        const w = (sub > .5 ? trials[Math.min(50, n + 1)] : tr).w[i], a = clamp(Math.abs(w) / 2.5);
        weights.setColorAt(i, w > 0 ? off.clone().lerp(amber, a) : off.clone().lerp(neg, a));
      }
      retina.instanceColor.needsUpdate = weights.instanceColor.needsUpdate = true;
      const correct = trials.slice(0, n).filter(x => x.ok).length;
      ctrN.textContent = `第 ${String(Math.max(1, n)).padStart(2, '0')} / 50 次`; ctrR.textContent = n ? `近 10 次猜对 ${trials.slice(Math.max(0, n - 10), n).filter(x => x.ok).length} 次` : '';
      dotEls.forEach((d, i) => { d.style.background = i < n ? (trials[i].ok ? COL.amber : 'rgba(244,239,230,.35)') : 'rgba(244,239,230,.12)'; });
      const kc = E.io2(seg(t, tSim0, tSim1));
      cam = P([60 + lerp(-3, 3, kc), lerp(-3, -1, kc), lerp(21, 19, kc)], [60, .3, 0], 35, lerp(.03, -.02, kc));
      lab1.userData.u.uOp.value = lab2.userData.u.uOp.value = E.o3(seg(t, tSim0 + .2, tSim0 + .8));
      G.flash = .45 * (1 - E.o3(seg(t, tSim0, tSim0 + .35))); G.bloom = .7; G.aperture = 0;
    } else if (t < tD6) {   // 报纸原句
      const kIn = E.o5(seg(t, tSim1, tSim1 + .9));
      nydoc.rotation.set(lerp(-.9, -.2, kIn), lerp(-.2, -.04, kIn), .01); nydoc.position.y = lerp(-8, 0, kIn); nydoc.updateMatrixWorld();
      const q = nydoc.localToWorld(nydoc.userData.at('q', 0, 200).clone()), tQ = cw('d5', '海军');
      nydoc.userData.hi('q', E.io2(seg(t, tQ, tQ + 2.2)));
      const kq = E.io3(seg(t, tQ - .8, tQ + 1.6)), hd = nydoc.localToWorld(new THREE.Vector3(0, 2.2, 0));
      const tgt = hd.clone().lerp(q, kq);
      cam = pose({ x: tgt.x - .3, y: tgt.y - 1.6, z: tgt.z + lerp(9, 7.2, kq) }, tgt, 35, .02);
      G.focus = lerp(9.2, 7.4, kq); G.aperture = .0011; G.maxblur = .008;
    } else if (!onSpine) {   // Mark I
      const k = E.io2(seg(t, tD6, tD7));
      cam = P([180 + lerp(1.2, -.6, k), lerp(-.4, .3, k), lerp(13.5, 10.5, k)], [180 + lerp(.8, .1, k), 0, -2]);
      G.flash = .5 * (1 - E.o3(seg(t, tD6, tD6 + .35))); G.focus = cam.z - S.O.z - 1; G.aperture = .0007; G.maxblur = .006;
    } else {   // 两条轨，拉远看七十年
      const k = E.io3(seg(t, tD7 - .3, T1));
      cam = { x: X(1957) + lerp(6, 120, k), y: lerp(3, 14, k), z: lerp(26, 95, k), tx: X(1957) + lerp(14, 150, k), ty: 0, tz: 0, fov: 35, roll: 0 };
      ruleLab.userData.u.uOp.value = E.o3(seg(t, tD7 + .2, tD7 + .8)); learnLab.userData.u.uOp.value = E.o3(seg(t, cw('d7', '从例子学') - .1, cw('d7', '从例子学') + .5));
      G.flash = .45 * (1 - E.o3(seg(t, tD7 - .3, tD7 + .05)));
      F.grain = .3; F.scratch = .15;
    }
    Object.assign(CAM, cam);
  } });
}

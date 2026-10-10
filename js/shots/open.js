/* 冷开场（c1–c2）对话散成星海 → 星海塌缩（c3）→ 光从 2022 往回跑出时间轴（c4）→ 时间长廊倒飞（c5）→ 1969 断口 → 片名 */
import { THREE, scene, camera, renderer, CAM, G, plane, loadTex, canvasTex } from '../gl.js';
import { F } from '../film.js';
import { tl, c, ce, cw, COL, el, hidden, typeOn, seg, lerp, clamp, E, track, hash, shot, sfx } from '../core.js';
import { X, LANE, spineState, head, origin, glow } from '../spine.js';

/* ================= 1. 2022：第一段对话（发布页原文） ================= */
const chat = el(null, 'position:absolute;left:330px;top:250px;width:1260px');
hidden(chat);
const src = el(null, `position:absolute;left:96px;top:64px;font:500 28px/1 JBM;color:${COL.mute};letter-spacing:.5px;white-space:nowrap`, '来源：ChatGPT 发布页示例对话', { 'data-chk': 'text' });
hidden(src);
const row = (label, col) => {
  const r = el(chat, 'position:relative;margin-bottom:54px');
  el(r, `position:relative;font:700 30px/1 JBM;color:${col};margin-bottom:22px;letter-spacing:1px`, label, { 'data-chk': 'text' });
  return el(r, `position:relative;font:500 50px/1.45 PuHuiTi;color:${COL.white};min-height:72px`, '', { 'data-chk': 'text' });
};
const uq = row('User', COL.mute), ar = row('ChatGPT', COL.amber);
ar.style.color = '#d9d0c2';
const Q = 'this code is not working like i expect — how do i fix it?';
const A = "It's difficult to say what's wrong with the code without more context. Can you provide more information about what the code is supposed to do?";
const Afull = "It's difficult to say what's wrong with the code without more context. Can you provide more information about what the code is supposed to do and what isn't working as expected?";
tl.set(chat, { opacity: 1 }, .3).set(src, { opacity: 1 }, .3);
tl.fromTo(chat, { scale: 1 }, { scale: 1.035, duration: c('c2') - .3, ease: 'none', immediateRender: false }, .3);
const tq = typeOn(uq, Q, c('c1') + .05, 40);
ar.parentElement.style.opacity = 0; tl.set(ar.parentElement, { opacity: 1 }, tq + .2);
const words = A.split(' ');
{ const o = { n: 0 }, t0 = tq + .45, dur = c('c2') - .35 - t0;
  tl.fromTo(o, { n: 0 }, { n: words.length, duration: dur, ease: 'none', immediateRender: false, onUpdate: () => { const k = Math.floor(o.n); ar.innerHTML = words.slice(0, k).join(' ') + (k < words.length ? ` <span style="color:${COL.amber}">●</span>` : ''); } }, t0); }
const tCol = c('c2') - .1;   // 对话化成光尘的时刻
tl.set([chat, src], { opacity: 0 }, tCol + .12);

/* ================= 2. 星海：一粒光 = 1000 人 ================= */
const N = 100000, R = 420;
const pos = new Float32Array(N * 3), seed = new Float32Array(N), rr = new Float32Array(N);
{ const tmp = [];
  for (let i = 0; i < N; i++) {
    const u = hash(i * 1.17 + 3.3), r = R * Math.pow(u, 1.6) + 1.5, arm = Math.floor(hash(i * 2.9) * 3);
    const g1 = (hash(i * 5.1) + hash(i * 7.7) + hash(i * 9.3) - 1.5) * .9, g2 = (hash(i * 11.3) + hash(i * 13.9) - 1) * 1.2;
    const a = arm * 2.0944 + r / R * 5.2 + g1 * (.55 - .35 * r / R);
    tmp.push([r, Math.cos(a) * r + g2 * 6, Math.sin(a) * r + g1 * 6, g2 * (16 - 12 * r / R) * (1 - .6 * u)]);
  }
  tmp.sort((p, q) => p[0] - q[0]);
  tmp.forEach((p, i) => { pos[i * 3] = p[1]; pos[i * 3 + 1] = p[3]; pos[i * 3 + 2] = p[2]; rr[i] = p[0] / R; seed[i] = hash(i * 3.7); });
}
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); pg.setAttribute('aR', new THREE.BufferAttribute(rr, 1));
const starVS = `attribute float aSeed, aR; uniform float uCount, uExpand, uCollapse, uTime, uSize; varying float vA; varying vec3 vC;
    void main(){
      float on = step(float(gl_VertexID), uCount);
      vec3 p = position * uExpand;
      p = mix(p, vec3(0.), pow(uCollapse, 1. + aSeed * 1.5));
      vec4 mv = modelViewMatrix * vec4(p, 1.);
      gl_Position = projectionMatrix * mv;
      float tw = .65 + .35 * sin(uTime * (2. + aSeed * 5.) + aSeed * 40.);
      gl_PointSize = on * uSize * (1.5 + aSeed * 2.) * (380. / -mv.z);
      vA = on * tw; vC = mix(vec3(2.8, 1.75, .55), vec3(1.3, 1.24, 1.18), smoothstep(.04, .6, aR));
    }`;
const starFS = `uniform float uOp; varying float vA; varying vec3 vC; void main(){ vec2 q = gl_PointCoord - .5; float d = length(q); if (d > .5) discard; float a = smoothstep(.5, 0., d); gl_FragColor = vec4(vC * a, a * vA * uOp); }`;
const pm = new THREE.ShaderMaterial({ uniforms: { uCount: { value: 0 }, uExpand: { value: 1 }, uCollapse: { value: 0 }, uTime: { value: 0 }, uSize: { value: 1 }, uOp: { value: 1 } }, vertexShader: starVS, fragmentShader: starFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const stars = new THREE.Points(pg, pm); stars.frustumCulled = false; stars.position.set(X(2022), 0, 0); scene.add(stars);

/* 星海阶段的相机：方位角 a、仰角 e、距离 z → 位置 */
const GC = new THREE.Vector3(X(2022), 0, 0);
const orbit = (a, e, z) => ({ x: GC.x + Math.sin(a) * z * Math.cos(e), y: Math.sin(e) * z, z: Math.cos(a) * z * Math.cos(e), tx: GC.x, ty: 0, tz: 0, fov: 35, roll: 0 });
const t1m = cw('c2', '百万人'), t1y = cw('c2', '过亿');
const tCollapse0 = c('c3') + .9, tCollapse1 = cw('c3', '凭空') + .3;
const starCam = t => {
  const a = lerp(-.1, .7, E.io2(seg(t, tCol, tCollapse0 + .6)));
  const e = lerp(1.05, .5, E.io3(seg(t, t1y - .3, t1y + 2.2)));
  const z = t < t1y - .3 ? lerp(150, 135, seg(t, tCol, t1y)) : t < tCollapse0 ? lerp(135, 780, E.io3(seg(t, t1y - .3, t1y + 2.3))) : lerp(780, 70, E.i3(seg(t, tCollapse0, tCollapse1 + .15)));
  return orbit(a, e, z);
};

/* ---- 对话 → 光尘：按对话最后一帧的字形取样，映射到星海所在的平面上 ---- */
const DUST = 7000;
const dStart = new Float32Array(DUST * 3), dEnd = new Float32Array(DUST * 3), dSeed = new Float32Array(DUST);
{
  /* 把对话定格成最终状态，量每个词的位置，画到一张 1920×1080 的画布上 */
  const st = document.getElementById('stage'), sr = st.getBoundingClientRect(), sc = sr.width / 1920;
  const saveQ = uq.textContent, saveA = ar.innerHTML, saveOp = ar.parentElement.style.opacity;
  uq.textContent = Q; ar.textContent = Afull.split(' ').slice(0, words.length).join(' '); ar.parentElement.style.opacity = 1; gsap.set(chat, { opacity: 1, scale: 1.035 });
  const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080; const g = cv.getContext('2d'); g.fillStyle = '#fff';
  for (const node of [uq, ar]) {
    const cs = getComputedStyle(node); g.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * 1.035}px PuHuiTi`; g.textBaseline = 'alphabetic';
    const tn = node.firstChild, txt = tn.textContent; let i = 0;
    for (const w of txt.split(' ')) { const j = txt.indexOf(w, i), rg = document.createRange(); rg.setStart(tn, j); rg.setEnd(tn, j + w.length); const r = rg.getClientRects()[0]; i = j + w.length;
      if (r) g.fillText(w, (r.left - sr.left) / sc, (r.bottom - sr.top) / sc - parseFloat(cs.fontSize) * .28); }
  }
  uq.textContent = saveQ; ar.innerHTML = saveA; ar.parentElement.style.opacity = saveOp; gsap.set(chat, { opacity: 0, scale: 1 });
  const px = g.getImageData(0, 0, 1920, 1080).data, cand = [];
  for (let y = 0; y < 1080; y += 2) for (let x = 0; x < 1920; x += 2) if (px[(y * 1920 + x) * 4 + 3] > 120) cand.push([x, y]);
  /* 相机在 tCol 时的姿态 → 屏幕像素对应的世界坐标（过星海中心、垂直视线的平面） */
  const P = starCam(tCol), cam = new THREE.PerspectiveCamera(35, 16 / 9, .1, 5000); cam.position.set(P.x, P.y, P.z); cam.lookAt(GC); cam.updateMatrixWorld();
  const dist = cam.position.distanceTo(GC), k = 2 * dist * Math.tan(THREE.MathUtils.degToRad(17.5)) / 1080;
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  for (let i = 0; i < DUST; i++) {
    const [sx, sy] = cand[Math.floor(hash(i * 1.31) * cand.length)] || [960, 540];
    const p = GC.clone().addScaledVector(right, (sx - 960 + (hash(i * 7.1) - .5) * 2) * k).addScaledVector(up, (540 - sy + (hash(i * 9.3) - .5) * 2) * k).sub(GC);
    dStart.set([p.x, p.y, p.z], i * 3);
    const j = Math.floor(Math.pow(hash(i * 3.3), 2) * 1000);   // 落进星海最里面的 1000 颗星附近
    dEnd.set([pos[j * 3] * .12 + (hash(i * 5.5) - .5) * 3, pos[j * 3 + 1] * .12, pos[j * 3 + 2] * .12 + (hash(i * 8.8) - .5) * 3], i * 3);
    dSeed[i] = hash(i * 4.4);
  }
}
const dg = new THREE.BufferGeometry();
dg.setAttribute('position', new THREE.BufferAttribute(dStart, 3)); dg.setAttribute('aEnd', new THREE.BufferAttribute(dEnd, 3)); dg.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
const dm = new THREE.ShaderMaterial({
  uniforms: { uK: { value: 0 }, uOp: { value: 0 } },
  vertexShader: `attribute vec3 aEnd; attribute float aSeed; uniform float uK; varying float vA;
    void main(){ float k = clamp((uK - aSeed * .35) / .65, 0., 1.); k = k * k * (3. - 2. * k);
      vec3 mid = mix(position, aEnd, .5) + vec3(0., 18. * aSeed - 4., 0.) * sin(k * 3.14159);
      vec3 p = mix(mix(position, mid, k), mix(mid, aEnd, k), k);
      vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = (1.2 + aSeed * 1.6) * (300. / -mv.z) * (1. - .5 * k); vA = 1. - smoothstep(.75, 1., k); }`,
  fragmentShader: `uniform float uOp; varying float vA; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; float a = smoothstep(.5, 0., d); gl_FragColor = vec4(vec3(2.6, 1.9, 1.1) * a, a * vA * uOp); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const dust = new THREE.Points(dg, dm); dust.frustumCulled = false; dust.position.copy(GC); scene.add(dust);

/* 计数器（左下）+ 图例（右下） */
const counter = el(null, 'position:absolute;left:96px;top:700px;display:flex;align-items:baseline;gap:20px');
const cnum = el(counter, `position:relative;font:900 128px/1 SourceHanSerif;color:${COL.white};letter-spacing:1px`, '', { 'data-chk': 'text' });
el(counter, `position:relative;font:700 44px/1 SourceHanSerif;color:${COL.amber}`, '人', { 'data-chk': 'text' });
const legend = el(null, `position:absolute;right:96px;top:812px;font:500 30px/1 JBM;color:${COL.mute};display:flex;align-items:center;gap:14px;white-space:nowrap`, `<span style="position:relative;display:inline-block;width:14px;height:14px;border-radius:50%;background:${COL.amber};box-shadow:0 0 14px ${COL.amber}"></span>每个光点 = 1,000 人`, { 'data-chk': 'text' });
hidden(counter); hidden(legend);
const fmtN = n => Math.round(n).toLocaleString('en-US');
{ const o = { n: 0 }; cnum.textContent = '0';
  tl.fromTo(counter, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .4, ease: 'expo.out', immediateRender: false }, t1m - .2)
    .fromTo(o, { n: 0 }, { n: 1e6, duration: .8, ease: 'expo.out', immediateRender: false, onUpdate: () => cnum.textContent = fmtN(o.n) }, t1m - .15)
    .to(o, { n: 1e8, duration: 1.6, ease: 'power3.inOut', onUpdate: () => cnum.textContent = fmtN(Math.round(o.n / 1e4) * 1e4) }, t1y - .1);
  tl.fromTo(legend, { opacity: 0 }, { opacity: 1, duration: .4, immediateRender: false }, t1m + .3);
  tl.to([counter, legend], { opacity: 0, y: 30, duration: .5, ease: 'power2.in' }, c('c3') + .5);
}

/* ================= 3. 时间轴显形 + 时间长廊 ================= */
const tRun0 = tCollapse1 + .35, tRun1 = cw('c4', '七十多年') + .9;   // 光从 2022 往回跑到 1950
/* 飞过的史料：长廊两侧，面向来车方向 */
const FLY = [
  ['transformer_p1.png', 2017.4, 7.4, 9.6, 1], ['go_game2.png', 2015.8, 9, 9.9, -1], ['gpu_die.jpg', 2011.6, 13.5, 9, 1],
  ['deepblue_g6_final.png', 1997, 9.4, 9.4, -1], ['lisp_cadr.jpg', 1986.6, 6.6, 9.9, 1],
  ['perceptron_navy.jpg', 1960.4, 12.6, 9.9, -1], ['dartmouth_p1.png', 1955.6, 7.6, 9.9, 1],
];
const flyMeshes = [];
for (const [f, yr, w, h, side] of FLY) {
  const m = plane(await loadTex('素材/图/' + f), w, h, { opacity: 1, sat: yr < 1990 ? 0 : 1, bright: .92 });
  m.position.set(X(yr), 6.2, side > 0 ? 23 : 3.5); m.rotation.y = Math.PI / 2 + (side > 0 ? .35 : -.55);
  scene.add(m); flyMeshes.push({ m, yr });
}
const tW = cw('c5a', '寒冬'), tDeath = cw('c5b', '死刑');
const flyStart = tRun1 + .1;
const camX = track([[flyStart - .6, X(2024)], [flyStart + .8, X(2018.5)], [tW - 1.0, X(1996)], [tW - .1, X(1985)], [tW + .7, X(1975)], [tDeath - 1.9, X(1971.5)], [tDeath - .2, X(1969.8)], [tDeath + 1.5, X(1969.3)]]);
const yearOf = x => 1950 + x / 10;
/* 片名段 */
const tTitle0 = ce('c5b') + .7, tA1 = c('a1');
const camX2 = track([[tTitle0 - .3, X(1969.3)], [tTitle0 + .7, X(1953)], [tTitle0 + 1.4, X(1950)]]);
const title = new THREE.Group(); scene.add(title);
const titleTex = canvasTex(3000, 760, (g, w, h) => { g.font = '900 560px SourceHanSerif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f6efe2'; g.fillText('AI 七十年', w / 2, h / 2 + 30); });
const titleMat = new THREE.ShaderMaterial({
  uniforms: { uMap: { value: titleTex }, uSweep: { value: 0 }, uOp: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform sampler2D uMap; uniform float uSweep, uOp; varying vec2 vUv;
    void main(){ vec4 c = texture2D(uMap, vUv); float x = vUv.x + (vUv.y - .5) * .18;
      float reveal = smoothstep(uSweep - .02, uSweep - .14, x);
      float edge = exp(-pow((x - uSweep + .06) * 22., 2.));
      vec3 col = c.rgb * .92 + vec3(3.2, 2.2, 1.) * edge * c.a;
      gl_FragColor = vec4(col, c.a * max(reveal, edge) * uOp);
#include <colorspace_fragment>
    }`,
  transparent: true, depthWrite: false, toneMapped: false,
});
const titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(30, 7.6), titleMat); title.add(titleMesh);
const subTex = canvasTex(1600, 140, (g, w, h) => { g.font = '700 84px JBM'; g.letterSpacing = '18px'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f2b33d'; g.fillText('1950 — 2026', w / 2, h / 2 + 4); });
const subMesh = plane(subTex, 22.8, 2.0, {}); subMesh.position.set(0, -6.9, 0); title.add(subMesh);
const TT = new THREE.Vector3(X(1950) + 19, 10.5, 0); title.position.copy(TT);

/* 空间浮尘：沿时间轴分布的微光点，飞行时提供视差和速度感 */
const SD = 6000, sdp = new Float32Array(SD * 3);
for (let i = 0; i < SD; i++) { sdp[i * 3] = hash(i * 1.9) * X(2030) - 40; sdp[i * 3 + 1] = (hash(i * 3.7) - .5) * 70; sdp[i * 3 + 2] = (hash(i * 5.3) - .55) * 90; }
const sdg = new THREE.BufferGeometry(); sdg.setAttribute('position', new THREE.BufferAttribute(sdp, 3));
const sdm = new THREE.ShaderMaterial({ uniforms: { uOp: { value: 0 } },
  vertexShader: `varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; float d = -mv.z; gl_PointSize = clamp(90. / d, 1., 5.); vA = smoothstep(260., 40., d) * smoothstep(1., 6., d); }`,
  fragmentShader: `uniform float uOp; varying float vA; void main(){ float r = length(gl_PointCoord - .5); if (r > .5) discard; gl_FragColor = vec4(vec3(1.1, 1.0, .85), smoothstep(.5, 0., r) * vA * .5 * uOp); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const spaceDust = new THREE.Points(sdg, sdm); spaceDust.frustumCulled = false; scene.add(spaceDust);

/* HUD：左上角年份（导航主线） */
const hud = el(null, `position:absolute;left:96px;top:58px;display:flex;align-items:center;gap:14px;font:700 40px/1 JBM;color:${COL.white};letter-spacing:3px`, '', { 'data-chk': 'text' });
el(hud, `position:relative;width:12px;height:12px;border-radius:50%;background:${COL.amber};box-shadow:0 0 12px ${COL.amber}`);
const hudY = el(hud, 'position:relative;font-variant-numeric:tabular-nums', '2022');
hidden(hud);
tl.to(hud, { opacity: 1, duration: .3 }, tRun0 + .3).to(hud, { opacity: 0, duration: .3 }, tTitle0 + .9);

/* ================= 每帧 ================= */
const mix = (a, b, k) => { const o = {}; for (const key in a) o[key] = lerp(a[key], b[key], k); return o; };
/* 音效 */
[...Q].forEach((_, i) => sfx(c('c1') + .05 + i / 40, 'key', { g: .32 }));
words.forEach((_, i) => sfx(tq + .45 + i * (c('c2') - .35 - tq - .45) / words.length, 'tick', { g: .12, f: 2400 }));
sfx(tCol, 'shimmer', { d: 1.6, g: .7 }); sfx(t1m - .15, 'boom', { g: .45 }); sfx(t1y - .1, 'swell', { d: 2.2, g: .8 });
sfx(tCollapse0, 'suck', { d: tCollapse1 - tCollapse0 }); sfx(tCollapse1, 'impact', { g: .8 });
sfx(tRun0, 'riser', { d: tRun1 - tRun0, g: .6 }); sfx(flyStart - .6, 'whoosh', { d: 1.4, g: .8 });
sfx(tW - 1, 'ice', { d: 1.8, g: .7 }); sfx(tDeath - .02, 'slice', { g: 1 }); sfx(tDeath, 'sparks', { d: 2 });
sfx(tTitle0 + .7, 'whoosh', { d: 1, g: .6 }); sfx(tTitle0 + 1, 'boom', { g: 1 }); sfx(tTitle0 + 1, 'shimmer', { d: 2.5, g: .6 });
sfx(tA1 - 1.25, 'whoosh', { d: 1.3, g: .7 }); sfx(tA1, 'flash', { g: .8 });
shot({ name: 'open', t0: 0, t1: tA1 - .02, look(t) {
  const u = pm.uniforms; u.uTime.value = t;
  /* 光尘 + 星海 */
  dust.visible = t > tCol && t < t1m + 1.6;
  dm.uniforms.uK.value = E.io2(seg(t, tCol + .15, t1m + 1.3)); dm.uniforms.uOp.value = seg(t, tCol, tCol + .12);
  stars.visible = t > tCol + .3 && t < tRun0 + .4;
  u.uCount.value = t < t1y - .1 ? lerp(0, 1000, E.o3(seg(t, tCol + .5, t1m + 1.1))) : lerp(1000, N, E.io3(seg(t, t1y - .1, t1y + 1.6)));
  u.uExpand.value = lerp(.05, 1, E.o3(seg(t, tCol + .3, t1m + 1.6)));
  u.uCollapse.value = E.i3(seg(t, tCollapse0, tCollapse1));
  u.uOp.value = 1 - seg(t, tCollapse1, tCollapse1 + .25);
  /* 时间轴：只露出光跑过的部分 */
  const runX = lerp(X(2022), X(1950), E.io3(seg(t, tRun0, tRun1)));
  const iceK = i => E.io2(seg(t, i ? tW - 1.05 : tW - .25, i ? tW - .3 : tW + .55));
  spineState({ reveal: t < tRun1 + .3 ? Math.min(runX, X(2022) - .02) : undefined, tipOp: 1 - seg(t, tRun1, tRun1 + .3), on: t > tCollapse1 - .05, axis: 1, labels: 1 - seg(t, tDeath - 1.4, tDeath - .9) + seg(t, tTitle0 + .4, tTitle0 + 1), lanes: 1, ice: [iceK(0), iceK(1)], head: t < tCollapse1 ? 0 : 1, origin: 1,
    cut: E.oExpo(seg(t, tDeath - .08, tDeath + .12)), cutLabel: E.o3(seg(t, tDeath + .25, tDeath + .8)) * (1 - seg(t, tTitle0, tTitle0 + .3)), spark: t - tDeath, ember: E.o2(seg(t, tDeath + .1, tDeath + 1.4)) });
  head.scale.setScalar(t < tCollapse1 + .6 ? lerp(22, 3.2, E.o3(seg(t, tCollapse1, tCollapse1 + .6))) : 3.2);
  sdm.uniforms.uOp.value = seg(t, tCollapse1, tCollapse1 + 1.2) * (1 - seg(t, tA1 - .6, tA1)); spaceDust.visible = sdm.uniforms.uOp.value > 0;
  title.visible = t > tTitle0 + .8;
  titleMat.uniforms.uSweep.value = lerp(-.1, 1.2, E.io2(seg(t, tTitle0 + 1.0, tTitle0 + 2.5)));
  subMesh.userData.u.uOp.value = E.o2(seg(t, tTitle0 + 2.1, tTitle0 + 2.7));

  /* ---- 相机 ---- */
  let cam; G.blur = [0, 0];
  const corridor = x => ({ x: x + 8, y: 5.2, z: 13.5, tx: x - 46, ty: -.6, tz: -1.5, fov: 38, roll: 0 });
  if (t < tCollapse1 + .1) cam = starCam(Math.max(t, tCol));
  else if (t < flyStart - .6) {
    /* 塌缩完 → 追着往回跑的光 → 升到高处看清整整七十年 → 俯冲进长廊 */
    const cx = Math.max(runX, X(2014)); const chase = { x: cx + 16, y: 2.6, z: 19, tx: cx - 8, ty: -.3, tz: 0, fov: 35, roll: 0 };
    const xh = lerp(X(2027), X(2024), E.io2(seg(t, tRun0 + .9, flyStart - .6))); const high = { x: xh + 8, y: 5.2, z: 13.5, tx: xh - 46, ty: -.6, tz: -1.5, fov: 38, roll: 0 };
    const enter = high;
    const k0 = E.o3(seg(t, tCollapse1 + .1, tCollapse1 + .7)), k1 = E.io3(seg(t, tRun0 + .9, tRun0 + 2.2)), k2 = E.io3(seg(t, tRun1 - 1.3, flyStart - .6));
    const near = { x: X(2022) + 2, y: 1.5, z: 22, tx: X(2022), ty: 0, tz: 0, fov: 35, roll: 0 };
    cam = mix(mix(mix(mix(starCam(tCollapse1 + .1), near, k0), chase, E.io2(seg(t, tCollapse1 + .3, tRun0 + .4))), high, k1), enter, k2);
  } else if (t < tDeath - 1.2) {
    const x = camX(t), v = (camX(t - .02) - camX(t + .02)) / .04;
    cam = corridor(x); cam.fov = 38 + clamp(v / 450) * 12; cam.roll = -.025 * clamp(v / 300);
    G.blur = [clamp(v / 420) * .045, 0];
  } else if (t < tTitle0) {
    /* 1969：从长廊里出来，转到侧面看断口 */
    const x = camX(t), k = E.io3(seg(t, tDeath - 1.2, tDeath + .1));
    const side = { x: X(1969) + 7, y: -.5, z: 21, tx: X(1969) + 1.5, ty: LANE.learn - 1.6, tz: 0, fov: 35, roll: 0 };
    cam = mix(corridor(x), side, k);
    cam.x += .25 * Math.sin(t * .8); cam.y += .15 * Math.sin(t * 1.1);
    const v = (camX(t - .02) - camX(t + .02)) / .04; G.blur = [clamp(v / 420) * .045 * (1 - k), 0];
    if (t > tDeath - .05 && t < tDeath + .7) { const s = (1 - seg(t, tDeath, tDeath + .7)) * .3; cam.x += (hash(t * 97) - .5) * s; cam.y += (hash(t * 71) - .5) * s; }
  } else {
    /* 甩回 1950，抬头看片名 */
    const x = camX2(t), v = (camX2(t - .02) - camX2(t + .02)) / .04, k = E.io3(seg(t, tTitle0 + .7, tTitle0 + 2.4));
    const side = { x: x + 7, y: -.5, z: 21, tx: x + 1.5, ty: LANE.learn - 1.6, tz: 0, fov: 35, roll: 0 };
    const front = { x: TT.x, y: 7, z: 58, tx: TT.x, ty: 6.2, tz: 0, fov: 35, roll: 0 };
    cam = mix(side, front, k);
    G.blur = [clamp(v / 420) * .05, 0];
    const dive = E.i3(seg(t, tA1 - 1.25, tA1 - .05));
    cam = mix(cam, { x: X(1950) + .6, y: .2, z: 3, tx: X(1950), ty: 0, tz: 0, fov: 35, roll: 0 }, dive);
    G.flash = E.i2(seg(t, tA1 - .5, tA1 - .02));
    origin.scale.setScalar(lerp(3.2, 9, dive));
  }
  Object.assign(CAM, cam);
  /* 照片随距离从远处「显影」出来：先亮后定、从下往上浮起；入场时按顺序错开，不一起蹦出来 */
  flyMeshes.forEach(({ m }, i) => { const d = CAM.x - m.position.x, on = t > flyStart - 1 && t < tTitle0 + 1.4;
    const kd = E.io2(clamp((120 - d) / 70)), kt = E.io3(seg(t, flyStart - .9 + i * .2, flyStart + .4 + i * .2)), op = on ? kd * kt * (1 - seg(d, -10, -40)) : 0;
    m.visible = op > .005; m.userData.u.uOp.value = op; m.userData.u.uBright.value = .92 * (.35 + .65 * op) + .5 * (1 - op) * (op > 0 ? 1 : 0); m.position.y = 6.2 - (1 - op) * 1.8; m.scale.setScalar(.92 + .08 * op); });
  /* 调色：越往过去越褪色，琥珀保留 */
  const yr = t < tRun0 ? 2022 : t < flyStart - .3 ? yearOf(Math.min(X(2022), runX)) : t < flyStart ? 2022 : t < tTitle0 ? yearOf(camX(t)) : yearOf(camX2(t));
  const camYr = t < flyStart ? 2022 : yr;
  const old = clamp((2000 - camYr) / 35);
  G.sat = 1 - .55 * old; G.tint = [1, 1 - .02 * old, 1 - .07 * old];
  const wint = Math.max(Math.exp(-Math.pow((t - (tW - .65)) / .32, 2)), Math.exp(-Math.pow((t - (tW + .2)) / .38, 2)));
  G.frost = .1 * wint; G.tint = [G.tint[0] - .12 * wint, G.tint[1] - .02 * wint, G.tint[2] + .08 * wint];
  G.ca = clamp((Math.abs(G.blur[0]) - .01) * 8) * .005;
  G.bloom = .55; G.streak = .5; G.flash = Math.max(G.flash, .06 * Math.exp(-Math.pow((t - tCollapse1) / .1, 2)), .28 * Math.exp(-Math.pow((t - tDeath - .02) / .08, 2)));
  G.scurve = .3;
  hudY.textContent = String(Math.round(yr));
  F.grain = .06 + .14 * old; F.flicker = .25 * old; F.scratch = .35 * old; F.weave = 1.4 * old; F.vig = .5 + .15 * old;
} });

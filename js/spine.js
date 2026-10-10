/* 主线：3D 时间轴 1950 → 2026（x = (年 - 1950) × 10）。
   上轨「规则」冷白：1956 起；下轨「学习」琥珀：1958–1969 亮，1969 被切断，1986 起一根细火苗，2012 后变粗变亮。
   轨道 = 有体积的光管（边缘柔、芯亮），沿时间方向有光脉冲往前流；轴 = 细标尺（每年一点、五年一短线、十年一长线 + 年份）；
   脚下一层透视网格；学习轨下方挂大事件标记（讲到那一年才点亮）。1974–80、1987–93 两段寒冬：轨道上长出冰晶 + 闪光。 */
import { THREE, scene, canvasTex } from './gl.js';
import { clamp, hash, lerp, onFrame, c } from './core.js';
export const X = y => (y - 1950) * 10;
export const LANE = { rule: 3.2, learn: -3.2 };
export const spine = new THREE.Group(); scene.add(spine);

/* 光管材质：视线垂直于管壁处最亮（看起来是圆的、软边），叠一层沿 x 往前流的脉冲。opacity / color 照旧可写 */
const TUBES = [];
function tubeMat(rgb, op = 1, flow = 0) {
  const u = { uColor: { value: new THREE.Color(...rgb) }, uOp: { value: op }, uTime: { value: 0 }, uFlow: { value: flow } };
  const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `varying vec3 vN, vV; varying float vX; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vX = wp.x; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOp, uTime, uFlow; varying vec3 vN, vV; varying float vX;
      void main(){ float f = abs(dot(normalize(vN), normalize(vV))); float core = pow(f, 2.2);
        float p = pow(.5 + .5 * sin(vX * .16 - uTime * 2.2), 26.) + .6 * pow(.5 + .5 * sin(vX * .053 - uTime * 1.1 + 1.7), 40.);
        gl_FragColor = vec4(uColor * core * (1. + uFlow * p * 1.6), uOp); }` });
  Object.defineProperty(m, 'opacity', { get: () => u.uOp.value, set: v => { u.uOp.value = v; } });
  m.color = u.uColor.value; TUBES.push(m); return m;
}
const glowMat = (rgb, op = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), transparent: true, opacity: op, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending });
const BARS = [];
const bar = (x0, x1, y, r, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, x1 - x0, 20, 1, true), mat); m.rotation.z = Math.PI / 2; m.position.set((x0 + x1) / 2, y, 0); m.userData = { x0, x1 }; spine.add(m); BARS.push(m); return m; };

/* 轴：一根细光管 + 标尺刻度 */
const axisMat = tubeMat([.95, .92, .86], .55);
bar(X(1950), X(2026), 0, .045, axisMat);
const tickMat = glowMat([.95, .9, .82], .6);
const TICKS = [];
for (let y = 1950; y <= 2026; y++) {
  const big = y % 10 === 0, mid = y % 5 === 0, h = big ? 1.6 : mid ? .8 : .32, w = big ? .045 : .03;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), tickMat); m.geometry.translate(0, big ? .3 : 0, 0); m.position.set(X(y), 0, 0); spine.add(m); TICKS.push(m);
}
/* 十年的年份：贴着轴下方，始终朝向镜头 */
export const decadeLabels = {};
for (let y = 1950; y <= 2020; y += 10) {
  const tex = canvasTex(512, 160, (g, w, h) => { g.font = '500 96px JBM'; g.letterSpacing = '6px'; g.fillStyle = '#e8e0d2'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(y), w / 2, h / 2 + 4); });
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: .9 })); m.scale.set(3.2, 1, 1); m.center.set(.5, 1);
  m.position.set(X(y), -.75, 0); m.userData.y0 = -.75; spine.add(m); decadeLabels[y] = m;
}
/* 脚下的透视网格（每格 = 一年 × 10 单位深），远处淡出 */
const gridU = { uOp: { value: 1 } };
const grid = new THREE.Mesh(new THREE.PlaneGeometry(X(2060) - X(1930), 320), new THREE.ShaderMaterial({ uniforms: gridU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  vertexShader: `varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
  fragmentShader: `uniform float uOp; varying vec3 vW;
    float ln(float v, float s, float w){ float d = abs(fract(v / s + .5) - .5) * s; return 1. - smoothstep(0., w * fwidth(v) * 1.2 + .001, d); }
    void main(){ float a = ln(vW.x, 10., 1.) * .5 + ln(vW.x, 100., 1.6) * .7 + ln(vW.z, 10., 1.) * .35;
      float dist = length(cameraPosition - vW); float fade = smoothstep(260., 30., dist) * smoothstep(-150., -20., vW.z) * smoothstep(1925., 1950., 1950. + vW.x / 10.) * (1. - smoothstep(2026., 2045., 1950. + vW.x / 10.));
      gl_FragColor = vec4(vec3(.85, .8, .72) * a * fade * .16 * uOp, 1.); }` }));
grid.rotation.x = -Math.PI / 2; grid.position.set((X(1930) + X(2060)) / 2, -11, -60); spine.add(grid);
/* 两条轨 */
const AMB = [2.6, 1.55, .42], AMB_DIM = [1.2, .66, .18], RULE = [1.05, 1.1, 1.2];
export const laneMats = { rule: [tubeMat(RULE, .8, .6), tubeMat(RULE, .55, .4), tubeMat(RULE, .22, .2)], learn: [tubeMat(AMB, 1, 1), tubeMat(AMB_DIM, .85, 1), tubeMat(AMB, 1, 1)] };
export const lanes = {
  rule: [bar(X(1956), X(1987), LANE.rule, .09, laneMats.rule[0]), bar(X(1987), X(2012), LANE.rule, .08, laneMats.rule[1]), bar(X(2012), X(2026), LANE.rule, .06, laneMats.rule[2])],
  learn: [bar(X(1958), X(1969), LANE.learn, .11, laneMats.learn[0]), bar(X(1986), X(2012), LANE.learn, .05, laneMats.learn[1]), bar(X(2012), X(2026), LANE.learn, .13, laneMats.learn[2])],
};
/* 光点 */
const dotTex = canvasTex(256, 256, (g) => { const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, 'rgba(255,250,235,1)'); r.addColorStop(.12, 'rgba(255,220,150,.85)'); r.addColorStop(.35, 'rgba(242,160,50,.18)'); r.addColorStop(1, 'rgba(242,160,50,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); });
export const glow = (x, y, z, s, parent = scene) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, color: new THREE.Color(2, 2, 2) })); sp.position.set(x, y, z); sp.scale.set(s, s, 1); parent.add(sp); return sp; };
export const origin = glow(X(1950), 0, 0, 3.2);
export const head = glow(X(2022), 0, 0, 3.2);
/* 大事件：学习轨下方垂下一根细线 + 一个点 + 一行字；讲到那一年时点亮 */
const EVENTS = [['a1', 1950, '图灵测试'], ['b4', 1956, '达特茅斯会议'], ['d2', 1958, '感知机'], ['w7', 1973, '莱特希尔报告'], ['y2', 1986, '反向传播'], ['z1', 1997, '深蓝'], ['g5', 2012, 'AlexNet'], ['h1', 2016, 'AlphaGo'], ['t1', 2017, 'Transformer'], ['s6', 2022, 'ChatGPT'], ['n1', 2024, '诺贝尔奖']];
const evMat = glowMat([1.6, 1.15, .55], .7);
const evs = EVENTS.map(([id, yr, name]) => {
  const g = new THREE.Group(); g.position.set(X(yr), 0, 0); spine.add(g);
  const ln = new THREE.Mesh(new THREE.BoxGeometry(.03, 2.6, .03), evMat); ln.position.y = LANE.learn - .45 - 1.3; g.add(ln);
  const dot = glow(0, LANE.learn - 3.2, 0, 1.1, g);
  const tex = canvasTex(1024, 180, (gg, w, h) => { gg.textBaseline = 'middle'; gg.font = '700 84px JBM'; gg.fillStyle = '#f2b33d'; const a = String(yr); gg.fillText(a, 20, h / 2 + 4); const aw = gg.measureText(a + '  ').width; gg.font = '700 84px PuHuiTi'; gg.fillStyle = '#e8e0d2'; gg.fillText(name, 20 + aw, h / 2 + 4); });
  const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); lab.scale.set(5.7, 1, 1); lab.center.set(.06, .5); lab.position.set(-.1, LANE.learn - 4.1, 0); g.add(lab);
  return { g, ln, dot, lab, t: () => c(id) - .4 };
});
/* 1969 切口 */
export const cut = new THREE.Group(); spine.add(cut);
const cutBar = new THREE.Mesh(new THREE.BoxGeometry(.06, 6, .06), glowMat([4, 3, 1.8], 1)); cut.add(cutBar);
cut.position.set(X(1969), LANE.learn, 0);
const cutTex = canvasTex(900, 300, (g, w, h) => { g.font = '900 230px SourceHanSerif'; g.fillStyle = '#f2b33d'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1969', w / 2, h / 2 + 10); });
export const cutLabel = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 2.2), new THREE.MeshBasicMaterial({ map: cutTex, transparent: true, depthWrite: false }));
cutLabel.position.set(X(1969) - .3, LANE.learn - 4.4, 0); spine.add(cutLabel);
/* 1969 断口的火星 */
const SPK = 260, spk = new Float32Array(SPK * 3), spkV = [];
for (let i = 0; i < SPK; i++) { const a = hash(i * 3.1) * Math.PI * 2, e = (hash(i * 5.7) - .3) * 1.6, s = 2 + hash(i * 7.3) * 9; spkV.push([Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s + 2, Math.sin(a) * Math.cos(e) * s]); }
const spkG = new THREE.BufferGeometry(); spkG.setAttribute('position', new THREE.BufferAttribute(spk, 3));
const spkM = new THREE.PointsMaterial({ color: new THREE.Color(3.5, 2.2, .8), size: .16, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
export const sparks = new THREE.Points(spkG, spkM); sparks.position.copy(cut.position); sparks.frustumCulled = false; spine.add(sparks);
export function sparkAt(k) {   // k = 爆开后的秒数
  sparks.visible = k > 0 && k < 2.2; if (!sparks.visible) return;
  for (let i = 0; i < SPK; i++) { const [vx, vy, vz] = spkV[i], d = .55 * (1 - Math.exp(-k * 2.2)) / 1; spk[i * 3] = vx * d; spk[i * 3 + 1] = vy * d - 4.5 * k * k * .5; spk[i * 3 + 2] = vz * d; }
  spkG.attributes.position.needsUpdate = true; spkM.opacity = clamp(1 - k / 2.2);
}
/* 寒冬：冰晶（按六角方向长出的细针，按 x 依次长出）+ 一层闪烁的霜点 */
const NEED = 1100, FROST = 700;
const iceSpark = canvasTex(128, 128, g => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.2, 'rgba(200,225,255,.5)'); r.addColorStop(1, 'rgba(160,200,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(62, 8, 4, 112); g.fillRect(8, 62, 112, 4); });
export const winters = [[1974, 1980], [1987, 1993]].map(([a, b], wi) => {
  const pos = new Float32Array(NEED * 6), base = [];
  for (let i = 0; i < NEED; i++) {
    const x = lerp(X(a), X(b), hash(i * 1.7 + wi * 50)), lane = [0, LANE.rule, LANE.learn][i % 3];
    const ang = (Math.floor(hash(i * 2.3 + wi) * 6) + (hash(i * 8.1) - .5) * .25) * Math.PI / 3, tilt = (hash(i * 4.1) - .5) * .5, len = .25 + Math.pow(hash(i * 6.7), 2.2) * 1.5;
    base.push([x, lane, Math.sin(tilt) * len, Math.cos(ang) * Math.cos(tilt) * len, Math.sin(ang) * Math.cos(tilt) * len, (x - X(a)) / (X(b) - X(a))]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: new THREE.Color(.95, 1.25, 1.7), transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const ls = new THREE.LineSegments(g, m); ls.frustumCulled = false; spine.add(ls);
  const fp = new Float32Array(FROST * 3), fb = [];
  for (let i = 0; i < FROST; i++) { const x = lerp(X(a), X(b), hash(i * 3.9 + wi * 70)), lane = [0, LANE.rule, LANE.learn][i % 3], r = .2 + hash(i * 5.3) * 1.1, an = hash(i * 7.7) * Math.PI * 2; fb.push([x, lane + Math.cos(an) * r, Math.sin(an) * r, (x - X(a)) / (X(b) - X(a)), hash(i * 9.1)]); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const fm = new THREE.PointsMaterial({ map: iceSpark, color: new THREE.Color(1.3, 1.5, 1.9), size: .5, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const fr = new THREE.Points(fg, fm); fr.frustumCulled = false; spine.add(fr);
  return { ls, pos, base, g, m, a, b, fr, fp, fb, fg, fm, k: 0, dir: 1 };
});
function freeze(w, k, dir) {   // k 0→1；dir=-1 表示从右往左长（倒带时）
  w.k = k; w.dir = dir;
  w.ls.visible = w.fr.visible = k > .001; if (!w.ls.visible) return;
  for (let i = 0; i < NEED; i++) {
    const [x, y, dx, dy, dz, f] = w.base[i], ff = dir < 0 ? 1 - f : f, s = clamp((k * 1.4 - ff * .4) / 1);
    w.pos[i * 6] = x; w.pos[i * 6 + 1] = y; w.pos[i * 6 + 2] = 0; w.pos[i * 6 + 3] = x + dx * s; w.pos[i * 6 + 4] = y + dy * s; w.pos[i * 6 + 5] = dz * s;
  }
  w.g.attributes.position.needsUpdate = true; w.m.opacity = .7 * clamp(k * 3);
}
/* 画出来：光点从 2022 往回跑，跑过的地方轨道接上、刻度长出、年份浮起 */
export const tips = [0, LANE.rule, LANE.learn].map(y => glow(X(2022), y, 0, y ? 1.5 : 1.9));
function revealAt(rv) {
  BARS.forEach(m => { const { x0, x1 } = m.userData, a = Math.max(x0, rv); m.visible = a < x1 - .01; if (m.visible) { m.scale.y = (x1 - a) / (x1 - x0); m.position.x = (a + x1) / 2; } });
  TICKS.forEach(m => { const k = clamp((m.position.x - rv) / 7); m.visible = k > 0; m.scale.y = Math.max(.001, 1 - Math.pow(1 - k, 3)); });
  Object.entries(decadeLabels).forEach(([y, m]) => { const k = clamp((X(+y) - rv - 3) / 14); m.material.opacity *= k; m.visible = k > 0; m.position.y = m.userData.y0 - (1 - k) * 1.2; });
  gridU.uOp.value *= clamp((X(2022) - rv) / 300);
}
/* 状态接口：每帧由镜头调用 */
let REVEAL = null;
export function spineState(s) {
  spine.visible = s.on !== false;
  origin.visible = head.visible = spine.visible;
  winters.forEach((w, i) => freeze(w, s.ice?.[i] ?? 0, s.iceDir ?? -1));
  cut.visible = (s.cut ?? 0) > 0; cut.scale.set(1, Math.max(.001, s.cut || 0), 1);
  cutLabel.visible = (s.cutLabel ?? 0) > 0; cutLabel.material.opacity = s.cutLabel ?? 0;
  sparkAt(s.spark ?? -1);
  head.material.opacity = s.head ?? 1; origin.material.opacity = s.origin ?? 1;
  Object.values(decadeLabels).forEach(m => { m.material.opacity = .85 * (s.labels ?? 1); m.visible = (s.labels ?? 1) > 0; m.position.y = m.userData.y0; });
  axisMat.opacity = .55 * (s.axis ?? 1); tickMat.opacity = .6 * (s.axis ?? 1); gridU.uOp.value = s.axis ?? 1;
  const L = s.lanes ?? 1; laneMats.rule.forEach((m, i) => m.opacity = [.8, .55, .22][i] * L); laneMats.learn.forEach((m, i) => m.opacity = [1, .85, 1][i] * L);
  /* 「学习」轨 1969 之前那段在死刑之后变暗成余烬，余烬不再流动 */
  const rv = s.reveal ?? -1e9; revealAt(rv); REVEAL = s.reveal ?? null;
  tips.forEach((g, i) => { const lo = [X(1950), X(1956), X(1958)][i]; g.visible = spine.visible && s.reveal != null && rv > lo && rv < X(2022) - .5; g.position.x = rv; g.material.opacity = s.tipOp ?? 1; });
  if (s.reveal != null) origin.visible = spine.visible && rv <= X(1950) + .5;
  laneMats.learn[0].color.setRGB(...(s.ember ? [lerp(3.2, 1.0, s.ember), lerp(1.9, .45, s.ember), lerp(.5, .12, s.ember)] : AMB));
  laneMats.learn[0].uniforms.uFlow.value = 1 - (s.ember ?? 0);
}
/* 每帧（所有镜头之后）：光脉冲往前流、霜点闪烁、大事件按讲到的时间点亮 */
onFrame(t => {
  TUBES.forEach(m => m.uniforms.uTime.value = t);
  winters.forEach(w => { if (!w.fr.visible) return; for (let i = 0; i < FROST; i++) { const [x, y, z, f, h] = w.fb[i], ff = w.dir < 0 ? 1 - f : f, s = clamp((w.k * 1.4 - ff * .4)); w.fp.set([x, y, z], i * 3); if (s < .5) w.fp[i * 3 + 1] = 1e4; } w.fg.attributes.position.needsUpdate = true; w.fm.opacity = .9 * clamp(w.k * 2) * (.6 + .4 * Math.sin(t * 3.1)); w.fm.size = .45 + .15 * Math.sin(t * 5.3); });
  evs.forEach(e => { const k = clamp((t - e.t()) / .8), on = k > 0 && (REVEAL == null || REVEAL < e.g.position.x); e.g.visible = on; if (!on) return; const a = 1 - Math.pow(1 - k, 3); e.ln.scale.y = Math.max(.001, a); e.ln.position.y = LANE.learn - .45 - 1.3 * a; e.dot.position.y = LANE.learn - .45 - 2.6 * a; e.dot.scale.setScalar(1.1 + 2.5 * Math.exp(-k * 4)); e.lab.material.opacity = clamp((k - .4) / .6) * .95; });
});

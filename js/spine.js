/* 主线：3D 时间轴 1950 → 2026（x = (年 - 1950) × 10）。
   上轨「规则」冷白：1956 起；下轨「学习」琥珀：1958–1969 亮，1969 被切断，1986 起一根细火苗，2012 后变粗变亮。
   1974–80、1987–93 两段寒冬：冰针沿着轨道长出来。 */
import { THREE, scene, canvasTex } from './gl.js';
import { clamp, hash, lerp } from './core.js';
export const X = y => (y - 1950) * 10;
export const LANE = { rule: 3.2, learn: -3.2 };
export const spine = new THREE.Group(); scene.add(spine);

const glowMat = (rgb, op = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb), transparent: true, opacity: op, depthWrite: false, toneMapped: false });
const BARS = [];
const bar = (x0, x1, y, r, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, x1 - x0, 10, 1, true), mat); m.rotation.z = Math.PI / 2; m.position.set((x0 + x1) / 2, y, 0); m.userData = { x0, x1 }; spine.add(m); BARS.push(m); return m; };

/* 轴 + 刻度（细、冷静） */
const axisMat = glowMat([.85, .82, .76], .55);
bar(X(1950), X(2026), 0, .035, axisMat);
const tickMat = glowMat([.9, .86, .8], .6);
const TICKS = [];
for (let y = 1950; y <= 2026; y++) {
  const h = y % 10 === 0 ? 2.2 : y % 5 === 0 ? 1.1 : .55;
  const m = new THREE.Mesh(new THREE.BoxGeometry(.045, h, .045), tickMat); m.position.set(X(y), 0, 0); spine.add(m); TICKS.push(m);
}
/* 十年年份（思源宋体），立在轴下方 */
export const decadeLabels = {};
for (let y = 1950; y <= 2020; y += 10) {
  const tex = canvasTex(512, 200, (g, w, h) => { g.font = '700 150px SourceHanSerif'; g.fillStyle = '#efe8dc'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(y), w / 2, h / 2 + 6); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: .9 }));
  m.position.set(X(y), -6.2, 0); spine.add(m); decadeLabels[y] = m;
}
/* 两条轨 */
const AMB = [2.6, 1.55, .42], AMB_DIM = [1.2, .66, .18], RULE = [1.05, 1.1, 1.2];
export const laneMats = { rule: [glowMat(RULE, .8), glowMat(RULE, .55), glowMat(RULE, .22)], learn: [glowMat(AMB, 1), glowMat(AMB_DIM, .85), glowMat(AMB, 1)] };
export const lanes = {
  rule: [bar(X(1956), X(1987), LANE.rule, .07, laneMats.rule[0]), bar(X(1987), X(2012), LANE.rule, .06, laneMats.rule[1]), bar(X(2012), X(2026), LANE.rule, .045, laneMats.rule[2])],
  learn: [bar(X(1958), X(1969), LANE.learn, .085, laneMats.learn[0]), bar(X(1986), X(2012), LANE.learn, .035, laneMats.learn[1]), bar(X(2012), X(2026), LANE.learn, .09, laneMats.learn[2])],
};
/* 光点 */
const dotTex = canvasTex(256, 256, (g) => { const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, 'rgba(255,250,235,1)'); r.addColorStop(.12, 'rgba(255,220,150,.85)'); r.addColorStop(.35, 'rgba(242,160,50,.18)'); r.addColorStop(1, 'rgba(242,160,50,0)'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); });
export const glow = (x, y, z, s, parent = scene) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, color: new THREE.Color(2, 2, 2) })); sp.position.set(x, y, z); sp.scale.set(s, s, 1); parent.add(sp); return sp; };
export const origin = glow(X(1950), 0, 0, 3.2);
export const head = glow(X(2022), 0, 0, 3.2);
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
/* 寒冬：冰针沿轨道长出（细线段，按 x 依次长出） */
const NEED = 1500;
export const winters = [[1974, 1980], [1987, 1993]].map(([a, b], wi) => {
  const pos = new Float32Array(NEED * 6), base = [];
  for (let i = 0; i < NEED; i++) {
    const x = lerp(X(a), X(b), hash(i * 1.7 + wi * 50)), lane = [0, LANE.rule, LANE.learn][i % 3];
    const ang = hash(i * 2.3 + wi) * Math.PI * 2, el = (hash(i * 4.1) - .5) * 2.4, len = .2 + Math.pow(hash(i * 6.7), 3) * 1.9;
    base.push([x, lane, Math.cos(ang) * Math.cos(el) * len, Math.sin(el) * len, Math.sin(ang) * Math.cos(el) * len, (x - X(a)) / (X(b) - X(a))]);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: new THREE.Color(.9, 1.2, 1.6), transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const ls = new THREE.LineSegments(g, m); ls.frustumCulled = false; spine.add(ls);
  return { ls, pos, base, g, m, a, b };
});
function freeze(w, k, dir) {   // k 0→1；dir=-1 表示从右往左长（倒带时）
  w.ls.visible = k > .001; if (!w.ls.visible) return;
  for (let i = 0; i < NEED; i++) {
    const [x, y, dx, dy, dz, f] = w.base[i], ff = dir < 0 ? 1 - f : f, s = clamp((k * 1.4 - ff * .4) / 1);
    w.pos[i * 6] = x; w.pos[i * 6 + 1] = y; w.pos[i * 6 + 2] = 0; w.pos[i * 6 + 3] = x + dx * s; w.pos[i * 6 + 4] = y + dy * s; w.pos[i * 6 + 5] = dz * s;
  }
  w.g.attributes.position.needsUpdate = true; w.m.opacity = .7 * clamp(k * 3);
}
/* 状态接口：每帧由镜头调用 */
/* 画出来：光点从 2022 往回跑，跑过的地方轨道接上、刻度长出、年份浮起 */
export const tips = [0, LANE.rule, LANE.learn].map(y => glow(X(2022), y, 0, y ? 1.5 : 1.9));
function revealAt(rv) {
  BARS.forEach(m => { const { x0, x1 } = m.userData, a = Math.max(x0, rv); m.visible = a < x1 - .01; if (m.visible) { m.scale.y = (x1 - a) / (x1 - x0); m.position.x = (a + x1) / 2; } });
  TICKS.forEach(m => { const k = clamp((m.position.x - rv) / 7); m.visible = k > 0; m.scale.y = Math.max(.001, 1 - Math.pow(1 - k, 3)); });
  Object.entries(decadeLabels).forEach(([y, m]) => { const k = clamp((X(+y) - rv - 3) / 14); m.material.opacity *= k; m.visible = k > 0; m.position.y = -6.2 - (1 - k) * 1.4; });
}
export function spineState(s) {
  spine.visible = s.on !== false;
  origin.visible = head.visible = spine.visible;
  winters.forEach((w, i) => freeze(w, s.ice?.[i] ?? 0, s.iceDir ?? -1));
  cut.visible = (s.cut ?? 0) > 0; cut.scale.set(1, Math.max(.001, s.cut || 0), 1);
  cutLabel.visible = (s.cutLabel ?? 0) > 0; cutLabel.material.opacity = s.cutLabel ?? 0;
  sparkAt(s.spark ?? -1);
  head.material.opacity = s.head ?? 1; origin.material.opacity = s.origin ?? 1;
  Object.values(decadeLabels).forEach(m => { m.material.opacity = .9 * (s.labels ?? 1); m.visible = (s.labels ?? 1) > 0; });
  axisMat.opacity = .55 * (s.axis ?? 1); tickMat.opacity = .6 * (s.axis ?? 1);
  const L = s.lanes ?? 1; laneMats.rule.forEach((m, i) => m.opacity = [.8, .55, .22][i] * L); laneMats.learn.forEach((m, i) => m.opacity = [1, .85, 1][i] * L);
  /* 「学习」轨 1969 之前那段在死刑之后变暗成余烬 */
  const rv = s.reveal ?? -1e9; revealAt(rv);
  tips.forEach((g, i) => { const y = [0, LANE.rule, LANE.learn][i], lo = [X(1950), X(1956), X(1958)][i]; g.visible = spine.visible && s.reveal != null && rv > lo && rv < X(2022) - .5; g.position.x = rv; g.material.opacity = s.tipOp ?? 1; });
  if (s.reveal != null) origin.visible = spine.visible && rv <= X(1950) + .5;
  laneMats.learn[0].color.setRGB(...(s.ember ? [lerp(3.2, 1.0, s.ember), lerp(1.9, .45, s.ember), lerp(.5, .12, s.ember)] : AMB));
}

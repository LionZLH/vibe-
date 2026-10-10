/* 各章共用的小工具：场景分区、照片（可带 2.5D 深度）、文字纹理、排版文件、浮尘、荧光条 */
import { THREE, scene, plane, depthPhoto, loadTex, canvasTex } from './gl.js';
import { lerp, clamp, hash } from './core.js';
export const pose = (p, t, fov = 35, roll = 0) => ({ x: p.x, y: p.y, z: p.z, tx: t.x, ty: t.y, tz: t.z, fov, roll });
export const mixP = (a, b, k) => { const o = {}; for (const key in a) o[key] = lerp(a[key], b[key], k); return o; };
/* 每章一块远处的空地，互不穿帮 */
export function stage(k) {
  const O = new THREE.Vector3(-3000 * (k + 2), 0, 0), grp = new THREE.Group(); grp.position.copy(O); scene.add(grp);
  const W = (x, y, z) => new THREE.Vector3(O.x + x, O.y + y, O.z + z);
  return { O, grp, W, P: (p, t, fov, roll) => pose(W(p[0], p[1], p[2]), W(t[0], t[1], t[2]), fov, roll) };
}
const imgSize = tx => [tx.image.width, tx.image.height];
/* 照片：按高度 h 定尺寸；depth>0 时读同名 _depth.png 做 2.5D */
export async function photo(name, h, o = {}) {
  const tx = await loadTex('素材/图/' + name); const [iw, ih] = imgSize(tx), w = h * iw / ih;
  const m = o.depth ? depthPhoto(tx, await loadTex('素材/图/' + name.replace(/\.\w+$/, '_depth.png'), false), w, h, { depth: o.depth, edge: o.edge ?? .04, sat: o.sat ?? 0, tint: o.tint || [1.04, 1, .93], seg: o.seg }) : plane(tx, w, h, { sat: o.sat ?? 1, depthWrite: true, bright: o.bright ?? 1 });
  m.userData.w = w; m.userData.h = h; return m;
}
/* 一行字 → 平面（世界高度 h；字号按画布 200px 画） */
export function textMesh(str, h, o = {}) {
  const fs = 200, font = o.font || `900 ${fs}px SourceHanSerif`;
  const cv = document.createElement('canvas').getContext('2d'); cv.font = font.replace(/\d+px/, fs + 'px'); if (o.ls) cv.letterSpacing = o.ls + 'px';
  const w = Math.ceil(cv.measureText(str).width + 40), H = Math.round(fs * 1.35);
  const tx = canvasTex(w, H, g => { g.font = font.replace(/\d+px/, fs + 'px'); if (o.ls) g.letterSpacing = o.ls + 'px'; g.fillStyle = o.color || '#f4efe6'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(str, w / 2, H / 2 + fs * .04); });
  const m = plane(tx, h * w / H, h, { additive: o.additive, bright: o.bright ?? 1 }); m.userData.u.uOp.value = 1;
  if (o.hdr) { m.material.toneMapped = false; m.userData.u.uBright.value = o.hdr; }
  return m;
}
/* 排版一页文件（打字机 / 铅字），{tag:文字} 记下外框；返回 {tex, marks, PW, PH} */
export function typeset({ PW = 1700, PH = 2200, M = 150, top = 260, font = '400 46px CourierPrime', lh = 68, bg = '#ece5d3', ink = '#1b1612', head, text, justify = false }) {
  const marks = {};
  const tex = canvasTex(PW, PH, g => {
    g.fillStyle = bg; g.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 12000; i++) { g.fillStyle = `rgba(120,95,60,${hash(i * 3.1 + PW) * .045})`; g.fillRect(hash(i * 1.3) * PW, hash(i * 2.7) * PH, 1 + hash(i) * 3, 1 + hash(i * 5) * 3); }
    const grd = g.createRadialGradient(PW / 2, PH * .45, PH * .25, PW / 2, PH / 2, PH * .8); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(110,80,40,.22)'); g.fillStyle = grd; g.fillRect(0, 0, PW, PH);
    g.fillStyle = ink; g.textBaseline = 'alphabetic';
    let y = top;
    if (head) y = head(g, PW, PH);
    g.font = font; const sp = g.measureText(' ').width, W = PW - 2 * M;
    for (const para of text.split('\n')) {
      const words = []; para.replace(/\{(\w+):([^}]+)\}|(\S+)/g, (m0, tag, inner, w) => { if (tag) inner.split(' ').forEach(x => words.push([x, tag])); else words.push([w, null]); });
      let line = [], cur = 0;
      const flush = last => {
        const wsum = line.reduce((s, [w]) => s + g.measureText(w).width, 0), gap = !justify || last || line.length < 2 ? sp : (W - wsum) / (line.length - 1); let x = M;
        line.forEach(([w, tag]) => { const ww = g.measureText(w).width; g.fillText(w, x, y); if (tag) { const r = (marks[tag] = marks[tag] || []), b = r.find(q => q.y === y); if (b) b.x1 = x + ww; else r.push({ x0: x, x1: x + ww, y }); } x += ww + gap; });
        y += lh; line = []; cur = 0;
      };
      words.forEach(wd => { const ww = g.measureText(wd[0]).width; if (line.length && cur + sp + ww > W) flush(false); cur += (line.length ? sp : 0) + ww; line.push(wd); });
      if (line.length) flush(true); y += lh * .45;
    }
  });
  return { tex, marks, PW, PH };
}
/* 文件平面 + 荧光条（琥珀，从左往右刷出来） */
export function doc(ts, wWorld, o = {}) {
  const g = new THREE.Group(), px = wWorld / ts.PW, h = ts.PH * px;
  const pg = plane(ts.tex, wWorld, h, { depthWrite: true, sat: o.sat ?? .35 }); pg.renderOrder = 2; g.add(pg);
  const bars = {};
  for (const [tag, rs] of Object.entries(ts.marks)) bars[tag] = rs.map(r => {
    const thick = o.strike?.includes(tag) ? 6 : 58, yoff = o.strike?.includes(tag) ? -16 : -15;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, thick * px), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, .66, .16), transparent: true, opacity: o.strike?.includes(tag) ? .95 : .42, depthWrite: false }));
    m.geometry.translate(.5, 0, 0); m.position.set((r.x0 - 8 - ts.PW / 2) * px, (ts.PH / 2 - r.y - yoff) * px, .006); m.userData.w = (r.x1 - r.x0 + 16) * px; m.renderOrder = 3; m.visible = false; g.add(m); return m;
  });
  const at = (tag, i = 0, dx = 0) => { const r = ts.marks[tag][i]; return new THREE.Vector3(((r.x0 + r.x1) / 2 + dx - ts.PW / 2) * px, (ts.PH / 2 - r.y + 14) * px, 0); };
  const hi = (tag, k) => { const arr = bars[tag], tot = arr.reduce((s, m) => s + m.userData.w, 0); let acc = 0; arr.forEach(m => { const a = clamp((k * tot - acc) / m.userData.w); m.visible = a > .001; m.scale.x = Math.max(.0001, m.userData.w * a); acc += m.userData.w; }); };
  g.userData = { px, h, at, hi, page: pg }; return g;
}
/* 浮尘 */
export function motes(n, box, seedK, op = .35) {
  const p = new Float32Array(n * 3), base = [];
  for (let i = 0; i < n; i++) base.push([hash(i * 1.3 + seedK) * box[0] - box[0] / 2, hash(i * 2.9 + seedK) * box[1] - box[1] / 2, hash(i * 4.7 + seedK) * box[2] - box[2] / 2, hash(i * 6.1 + seedK)]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.ShaderMaterial({ uniforms: { uOp: { value: op } },
    vertexShader: `void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv; gl_PointSize = 1.7 * (60. / -mv.z); }`,
    fragmentShader: `uniform float uOp; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; float a = smoothstep(.5, .0, d); gl_FragColor = vec4(vec3(1.15, 1.08, .95) * a, a * uOp); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 9;
  pts.userData.step = t => { for (let i = 0; i < n; i++) { const [x, y, z, s] = base[i], yy = y + t * .08 * (.3 + s); p[i * 3] = x + Math.sin(t * .23 + s * 40) * .6; p[i * 3 + 1] = ((yy + box[1] / 2) % box[1] + box[1]) % box[1] - box[1] / 2; p[i * 3 + 2] = z + Math.cos(t * .19 + s * 30) * .4; } g.attributes.position.needsUpdate = true; };
  return pts;
}
/* 胶片 / 调色预设 */
export const LOOK = {
  silver: (G, F) => { G.sat = 1; G.tint = [1.03, 1, .95]; G.scurve = .4; G.bloom = .45; G.streak = .35; G.bg = [.022, .019, .016]; F.grain = .5; F.flicker = .35; F.scratch = .35; F.weave = 2; F.vig = .6; },
  cold: (G, F) => { G.sat = 1; G.tint = [.86, .95, 1.08]; G.scurve = .35; G.bloom = .45; G.streak = .3; G.bg = [.02, .024, .03]; F.grain = .45; F.flicker = .25; F.scratch = .25; F.weave = 1.4; F.vig = .65; },
  crt: (G, F) => { G.sat = 1; G.tint = [1, .97, .92]; G.scurve = .3; G.bloom = .7; G.streak = .4; G.bg = [.018, .012, .006]; F.grain = .3; F.flicker = .15; F.scratch = 0; F.weave = 0; F.vig = .65; },
  digital: (G, F) => { G.sat = 1; G.tint = [1, 1, 1]; G.scurve = .3; G.bloom = .6; G.streak = .45; G.bg = [.03, .026, .022]; F.grain = .12; F.flicker = 0; F.scratch = 0; F.weave = 0; F.vig = .5; },
};

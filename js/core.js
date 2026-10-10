/* ================= 014 期 · 风格锁：「显影」——片子的胶片随年代一起变 =================
   · 50–60 年代银盐黑白（颗粒 / 片门抖动 / 闪烁 / 暖调）→ 寒冬结霜冷蓝 → 80 年代琥珀 CRT → 90 年代后数码 → 2012 后纯黑 + 琥珀光点
   · 主线 = 3D 时间轴（1950→2026），上轨「规则」冷白、下轨「学习」琥珀；转场沿轴甩镜，不淡入淡出
   · 暖黑 #0c0a08、档案纸 #e9e1cf、唯一强调色琥珀 #f2b33d、寒冬冰蓝 #9cc3e0
   · 字：章节/年份 思源宋体；原文 EB Garamond / Courier Prime；数据 JetBrains Mono；字幕 普惠体 58px（频道规范）
   · 时间驱动：每一帧 = seek(t)，所有状态都由 t 算出来（GSAP 时间线 + 各镜头的 update(t)），预览和逐帧导出一致 */
export const CUES = window.CUES, DUR = window.DUR;
export const COL = { bg: '#0c0a08', paper: '#e9e1cf', paper2: '#d9cfb8', ink: '#16130f', amber: '#f2b33d', amberDeep: '#c98a1c', ice: '#9cc3e0', white: '#f4efe6', mute: '#9a9184' };
export const tl = gsap.timeline({ paused: true });
export const c = (id, f = 0) => CUES[id].s + f * CUES[id].d;
export const ce = id => CUES[id].s + CUES[id].d;
const nch = t => (t.match(/[一-鿿]/g) || []).length + 1.6 * (t.match(/[0-9]+|[A-Za-z]+/g) || []).length;
export const cw = (id, w) => {   // 某个词开始念的时刻（按字数在整句里插值；配音后若有分句实测 ch 就按它）
  const C = CUES[id], x = C.text, i = x.indexOf(w); if (i < 0) throw new Error('cw: ' + id + ' 没有「' + w + '」');
  if (C.ch) { let p = 0; for (const [t, s0, d0] of C.ch) { const j = x.indexOf(t, p); if (j >= 0 && i < j + t.length) return C.s + s0 + d0 * nch(x.slice(j, i)) / Math.max(1, nch(t)); if (j >= 0) p = j + t.length; } }
  return C.s + C.d * nch(x.slice(0, i)) / nch(x);
};
/* 数学小工具 */
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const E = {
  io2: k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2,
  io3: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  io5: k => k < .5 ? 16 * k ** 5 : 1 - Math.pow(-2 * k + 2, 5) / 2,
  o2: k => 1 - (1 - k) * (1 - k), o3: k => 1 - Math.pow(1 - k, 3), o5: k => 1 - Math.pow(1 - k, 5),
  i2: k => k * k, i3: k => k * k * k,
  oExpo: k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k),
  ioExpo: k => k <= 0 ? 0 : k >= 1 ? 1 : k < .5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2,
};
/* 单调三次插值（关键帧之间速度连续、不过冲）：keys = [[t, v], …] */
export function track(keys) {
  const n = keys.length, T = keys.map(k => k[0]), V = keys.map(k => k[1]);
  const d = []; for (let i = 0; i < n - 1; i++) d.push((V[i + 1] - V[i]) / (T[i + 1] - T[i]));
  const m = [d[0]]; for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2); m.push(d[n - 2]);
  for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const q = 3 / Math.sqrt(s); m[i] = q * a * d[i]; m[i + 1] = q * b * d[i]; } }
  m[0] = keys[0][2] ?? 0; m[n - 1] = keys[n - 1][2] ?? 0;   // 两端默认静止起步 / 停稳
  return t => {
    if (t <= T[0]) return V[0]; if (t >= T[n - 1]) return V[n - 1];
    let i = 0; while (t > T[i + 1]) i++;
    const h = T[i + 1] - T[i], s = (t - T[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * V[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * V[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}

/* ---------- DOM ---------- */
export const $stage = document.getElementById('stage'), $dom = document.getElementById('dom');
export function el(parent, css = '', html = '', attrs = {}) {
  const e = document.createElement('div'); if (css) e.style.cssText = css; if (html) e.innerHTML = html;
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); (parent || $dom).appendChild(e); return e;
}
export const hidden = e => { gsap.set(e, { opacity: 0 }); return e; };
/* 逐字从基线下升起 */
export function letters(box, text, t, st = .035, d = .5, css = '') {
  [...text].forEach((ch, k) => {
    const w = el(box, 'position:relative;display:inline-block;overflow:hidden;vertical-align:bottom;white-space:pre;padding-bottom:.08em;margin-bottom:-.08em');
    const s = el(w, 'position:relative;display:inline-block;white-space:pre;' + css, ch);
    gsap.set(s, { yPercent: 115 }); tl.fromTo(s, { yPercent: 115 }, { yPercent: 0, duration: d, ease: 'expo.out', immediateRender: false }, t + k * st);
  });
}
/* 打字机：逐字显示（带光标） */
export function typeOn(node, text, t, cps = 28, caret = true) {
  node.textContent = '';
  const o = { n: 0 }; const n = text.length;
  tl.fromTo(o, { n: 0 }, { n, duration: n / cps, ease: 'none', immediateRender: false, onUpdate: () => { const k = Math.round(o.n); node.textContent = text.slice(0, k) + (caret && k < n ? '▍' : ''); } }, t);
  return t + n / cps;
}

/* ---------- 每帧更新 ---------- */
export const FRAME = [];
export const onFrame = f => FRAME.push(f);
export const SHOTS = [];   // { name, t0, t1, look(t) → 设置相机/调色/胶片 }
export const shot = s => (SHOTS.push(s), s);

/* ---------- 字幕：底部 58px 粗体白字，一次一个短句；关键词琥珀 ---------- */
export function buildCaptions(KEYS) {
  const box = document.getElementById('caps');
  const hl = t => { let h = t; [...KEYS].sort((a, b) => b.length - a.length).forEach(k => { if (h.includes(k) && !h.includes('>' + k)) h = h.split(k).join(`<span style="color:${COL.amber}">${k}</span>`); }); return h; };
  const clen = t => t.replace(/[，。：、？！；“”《》「」——\s]/g, '').length;
  const chunk = txt0 => {
    const parts = txt0.match(/[^，。：、？！；——]+[，。：、？！；]?(——)?/g) || [txt0], out = []; let cur = '';
    parts.forEach(p => { const n = clen(cur + p); if (cur && n > 14) { out.push(cur); cur = p; } else cur += p; });
    if (cur) out.push(cur); return out.map(x => x.replace(/[，。：；——]+$/, ''));
  };
  const ids = Object.keys(CUES);
  ids.forEach((id, idx) => {
    const v = CUES[id], cs = chunk(v.text); let p = 0;
    const starts = cs.map((x, k) => { const i = v.text.indexOf(x, p); p = i + x.length; return k === 0 ? v.s : cw(id, x); });
    cs.forEach((x, k) => {
      const nx = CUES[ids[idx + 1]], t0 = starts[k], t1 = k === cs.length - 1 ? (nx ? Math.min(nx.s, v.s + v.d + .15) : v.s + v.d + .15) : starts[k + 1];
      const w = el(box, 'position:absolute;left:0;top:944px;width:1920px;height:80px;display:flex;justify-content:center;align-items:center;opacity:0');
      el(w, `font:900 58px/70px PuHuiTi,sans-serif;letter-spacing:1px;color:#fff;white-space:nowrap;text-shadow:0 3px 0 rgba(0,0,0,.6),0 0 26px rgba(0,0,0,.9)`, hl(x), { 'data-chk': 'caption' });
      tl.set(w, { opacity: 1 }, t0).set(w, { opacity: 0 }, t1);
    });
  });
}

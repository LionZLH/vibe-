// 逐 0.5 秒查版面文字的实际显示字号（字号 × 所有祖先缩放），列出 < 28px 的；node tools/字号检测.js
const { serve, launch } = require('./cdp');
(async () => {
  const server = await serve(), b = await launch(); const bad = new Map();
  try {
    await b.open('正片.html?export', 'window.READY===true');
    const dur = await b.evaluate('window.DUR');
    for (let t = 0; t < dur; t += .5) {
      await b.evaluate(`seek(${t})`);
      const r = await b.evaluate(`[...document.querySelectorAll('[data-chk=text],[data-chk=caption]')].filter(e => { for (let a = e; a && a.id !== 'stage'; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || parseFloat(cs.opacity) < .3) return false; } return e.textContent.trim().length > 0; }).map(e => { let s = 1; for (let a = e; a && a.id !== 'stage'; a = a.parentElement) { const tr = getComputedStyle(a).transform; if (tr && tr !== 'none') { const m = new DOMMatrix(tr); s *= Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)); } } return [e.textContent.trim().slice(0, 24), +(parseFloat(getComputedStyle(e).fontSize) * s).toFixed(1)]; }).filter(x => x[1] < 28)`);
      r.forEach(([k, v]) => { if (!bad.has(k)) bad.set(k, [t, v]); });
    }
  } finally { b.close(); server.close(); }
  if (!bad.size) console.log('✓ 版面文字全部 ≥ 28px'); else bad.forEach(([t, v], k) => console.log(`✗ ${t}s  ${v}px  ${k}`));
})();

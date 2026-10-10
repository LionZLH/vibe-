/* 入口：等字体 → 搭各镜头 → seek(t) 驱动；预览播放条；导出用 ?export（逐帧 seek + 截图） */
import { tl, DUR, FRAME, SHOTS, buildCaptions } from './core.js';
const EXPORT = location.search.includes('export');
if (EXPORT) document.body.classList.add('export');
await Promise.all(['900 40px PuHuiTi', '700 40px PuHuiTi', '500 40px PuHuiTi', '700 40px JBM', '500 40px JBM', '900 40px SourceHanSerif', '700 40px SourceHanSerif', '600 40px SourceHanSerif',
  '500 40px EBGaramond', '600 40px EBGaramond', 'italic 500 40px EBGaramond', '400 40px CourierPrime', '700 40px CourierPrime'].map(f => document.fonts.load(f, 'AI七十年人机器1950abc')));
await document.fonts.ready;
const { render, resetG, G } = await import('./gl.js');
const { drawFilm, resetF, F } = await import('./film.js');
const DBG = (new URLSearchParams(location.search).get('dbg') || '').split(',');
await import('./spine.js');
await import('./shots/open.js');
await import('./shots/turing.js');
const { hudFrame, hideCards } = await import('./chapter.js');
for (const m of ['ch23', 'ch45', 'ch678', 'ch9e']) { try { await import(`./shots/${m}.js`); } catch (e) { if (!String(e).includes('Failed to fetch')) throw e; } }
buildCaptions(['百万人', '过亿', '七十多年', '寒冬', '死刑', '图灵', '机器能思考吗', '图灵测试', '屈指可数', '人工智能', '一个夏天', '另一条路', '感知机', '五十次', '四百个光电管', '两条路', '异或', '写不完', '专家系统', '两千五百万', '反向传播', '一成以上', '两亿步', '一千四百万', '两块显卡', '15.3%', '26.2%', '伊利亚·苏茨克维', '第 37 手', '万分之一', '4 比 1', 'Transformer', '十五亿', '一千七百五十亿', '诺贝尔', '55 年后', '金牌级', '标准答案', '太多事要做']);

const $stage = document.getElementById('stage');
function fit() { if (EXPORT) { $stage.style.transform = 'none'; return; } const s = Math.min(innerWidth / 1920, (innerHeight - 44) / 1080); $stage.style.transform = `scale(${s})`; $stage.style.left = (innerWidth - 1920 * s) / 2 + 'px'; $stage.style.top = (innerHeight - 44 - 1080 * s) / 2 + 'px'; }
addEventListener('resize', fit); fit();
let curT = 0;
function frame(t) {
  tl.seek(t, false);
  resetG(); resetF();
  const s = SHOTS.filter(x => t >= x.t0 && t < x.t1).pop();
  hideCards();
  if (s) s.look(t);
  hudFrame(t);
  FRAME.forEach(f => f(t));
  if (DBG.includes('nobloom')) G.bloom = 0; if (DBG.includes('nostreak')) G.streak = 0; if (DBG.includes('nofilm')) Object.assign(F, { grain: 0, flicker: 0, scratch: 0, vig: 0, burn: 0 }); if (DBG.includes('nograde')) Object.assign(G, { scurve: 0, contrast: 1, sat: 1, tint: [1, 1, 1] });
  render(t); drawFilm(t);
}
const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
window.seek = async t => { curT = Math.max(0, Math.min(DUR, t)); frame(curT); await raf2(); updUI(); };
window.seekSync = t => { curT = t; frame(t); };
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${Math.floor(t * 10 % 10)}`;
const $ = id => document.getElementById(id);
function updUI() { $('tm').textContent = fmt(curT); $('bar').value = Math.round(curT / DUR * 1000); }
let playing = false, t0w = 0, t0 = 0;
const stop = () => { playing = false; $('pp').textContent = '▶'; };
function loop() { if (!playing) return; const t = t0 + (performance.now() - t0w) / 1000; if (t >= DUR) { frame(DUR); curT = DUR; updUI(); return stop(); } curT = t; frame(t); updUI(); requestAnimationFrame(loop); }
$('pp').onclick = () => { if (playing) return stop(); playing = true; $('pp').textContent = '❚❚'; t0 = curT >= DUR - .1 ? 0 : curT; t0w = performance.now(); loop(); };
$('bar').oninput = e => { stop(); seek(e.target.value / 1000 * DUR); };
addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); $('pp').click(); } if (e.code === 'ArrowRight') { stop(); seek(curT + 2); } if (e.code === 'ArrowLeft') { stop(); seek(curT - 2); } });
$('dur').textContent = fmt(DUR);
const q = new URLSearchParams(location.search);
await seek(+(q.get('t') || 0));
window.READY = true;

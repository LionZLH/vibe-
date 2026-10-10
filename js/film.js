/* 胶片层（盖在 WebGL 和版面文字之上、字幕之下）：颗粒、闪烁、暗角、划痕、烧边光、片门抖动。
   强度由当前镜头每帧写入 F；随机数全部由帧号决定，导出逐帧可复现。 */
import { hash } from './core.js';
export const F = { grain: 0, flicker: 0, vig: .35, scratch: 0, burn: 0, burnHue: 28, weave: 0, dust: 0 };
export const F0 = { ...F };
export const resetF = () => Object.assign(F, F0);
const cv = document.getElementById('film'), g = cv.getContext('2d');
const gn = document.getElementById('grain').getContext('2d'), gb = document.getElementById('burn').getContext('2d');
const glEl = document.getElementById('gl'), domEl = document.getElementById('dom');
/* 预生成 6 张噪点（256²，按 2 倍放大铺满 → 颗粒更像银盐） */
const NOISE = [...Array(6)].map((_, k) => {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = 128 + (hash(i * 1.37 + k * 9173.1) - .5) * 255 * .9 + (hash(i * 7.1 + k * 31.7) - .5) * 60; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0); return c;
});
export function drawFilm(t) {
  const f = Math.floor(t * 24);   // 胶片 24 格/秒
  g.clearRect(0, 0, 1920, 1080); gb.clearRect(0, 0, 1920, 1080);
  /* 颗粒：中灰底 + 噪点（这张画布用 overlay 混合，中灰 = 不改变画面） */
  gn.globalAlpha = 1; gn.fillStyle = 'rgb(128,128,128)'; gn.fillRect(0, 0, 1920, 1080);
  if (F.grain > 0) {
    gn.save(); gn.globalAlpha = Math.min(1, F.grain);
    const n = NOISE[f % 6], ox = Math.floor(hash(f) * 256), oy = Math.floor(hash(f + .5) * 256);
    gn.translate(-ox * 2, -oy * 2); gn.scale(2, 2);
    for (let y = 0; y < 1080 / 2 + 512; y += 256) for (let x = 0; x < 1920 / 2 + 512; x += 256) gn.drawImage(n, x, y);
    gn.restore();
  }
  if (F.flicker > 0) { const a = F.flicker * (hash(f * 3.1) * .7 + .3 * Math.sin(t * 37)); g.fillStyle = a > 0 ? `rgba(0,0,0,${a * .16})` : `rgba(255,248,235,${-a * .08})`; g.fillRect(0, 0, 1920, 1080); }
  if (F.scratch > 0) {   // 竖向划痕 + 灰点
    g.save(); g.globalAlpha = F.scratch;
    for (let k = 0; k < 3; k++) if (hash(f * 1.9 + k) > .55) { const x = hash(f * 2.3 + k * 7) * 1920, w = 1 + hash(f + k) * 1.5; g.fillStyle = hash(f + k * 3) > .5 ? 'rgba(255,250,240,.35)' : 'rgba(0,0,0,.35)'; g.fillRect(x, 0, w, 1080); }
    for (let k = 0; k < 10; k++) if (hash(f * 5.3 + k) > .7) { const x = hash(f * 4.1 + k) * 1920, y = hash(f * 6.7 + k) * 1080, r = 1 + hash(f + k * 11) * 3; g.fillStyle = 'rgba(20,16,12,.55)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.restore();
  }
  if (F.burn > 0) {   // 胶片烧边：两团暖光在边缘游走
    for (let k = 0; k < 2; k++) {
      const x = k ? 1920 - 140 + Math.sin(t * .7) * 120 : 160 + Math.sin(t * .9 + 2) * 140, y = 540 + Math.sin(t * .5 + k * 3) * 380;
      const r = gb.createRadialGradient(x, y, 0, x, y, 900); r.addColorStop(0, `hsla(${F.burnHue},95%,62%,${.55 * F.burn})`); r.addColorStop(.45, `hsla(${F.burnHue - 12},90%,45%,${.22 * F.burn})`); r.addColorStop(1, 'hsla(0,0%,0%,0)');
      gb.fillStyle = r; gb.fillRect(0, 0, 1920, 1080);
    }
  }
  if (F.vig > 0) { const r = g.createRadialGradient(960, 540, 380, 960, 540, 1150); r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, `rgba(0,0,0,${F.vig})`); g.fillStyle = r; g.fillRect(0, 0, 1920, 1080); }
  const wx = F.weave ? (hash(f * 1.1) - .5) * F.weave : 0, wy = F.weave ? (hash(f * 2.7) - .5) * F.weave * .8 : 0;
  glEl.style.transform = `translate(${wx}px,${wy}px)`; domEl.style.transform = F.weave ? `translate(${wx * .6}px,${wy * .6}px)` : '';
}

// 每 0.1 秒抽一帧（缩小到 240×135），算相邻帧的平均差异，列出突变点：node tools/突变检测.js [起] [止]
const fs = require('fs'), path = require('path');
const { serve, launch } = require('./cdp');
const [a = 0, z] = process.argv.slice(2).map(Number);
(async () => {
  const server = await serve(), b = await launch(); const out = [];
  try {
    await b.open('正片.html?export', 'window.READY===true');
    const dur = z || await b.evaluate('window.DUR');
    await b.evaluate(`window.__cv = document.createElement('canvas'); __cv.width = 240; __cv.height = 135; window.__prev = null;`);
    for (let t = a; t <= dur; t += .1) {
      await b.evaluate(`seek(${t.toFixed(2)})`);
      const shot = await b.shot('jpeg', 70);
      const d = await b.evaluate(`new Promise(r => { const im = new Image(); im.onload = () => { const g = __cv.getContext('2d'); g.drawImage(im, 0, 0, 240, 135); const p = g.getImageData(0, 0, 240, 135).data; let s = 0, n = 0; if (__prev) for (let i = 0; i < p.length; i += 4) { const v = Math.abs(p[i] - __prev[i]) + Math.abs(p[i+1] - __prev[i+1]) + Math.abs(p[i+2] - __prev[i+2]); s += v > 60 ? 1 : 0; n++; } __prev = p; r(n ? s / n : 0); }; im.src = 'data:image/jpeg;base64,${shot.toString('base64')}'; })`);
      out.push([+t.toFixed(1), d]);
    }
  } finally { b.close(); server.close(); }
  out.forEach(([t, d]) => { if (d > .06) console.log(t.toFixed(1), (d * 100).toFixed(1) + '%'); });
})();

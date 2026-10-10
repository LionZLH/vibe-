// 导出成片：逐帧 seek(t) 截图 → ffmpeg 编码 H.264，配上 配音/成片混音.mp3。
// 用法：node tools/导出.js [输出.mp4] [--fps 30] [--from 秒] [--to 秒] [--jobs 并行数]
//   例：node tools/导出.js 成片.mp4 --jobs 4        （默认输出 成片.mp4，30 fps，全片）
// 并行时每个进程渲染一段（各用自己的端口），最后拼起来再配声音。
const fs = require('fs'), path = require('path'), os = require('os'), { spawn, spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const OUT = path.resolve(ROOT, args[0] && !args[0].startsWith('--') ? args[0] : '成片.mp4');
const FPS = +(opt('fps') || 30), JOBS = +(opt('jobs') || 1), AUDIO = path.join(ROOT, '配音', '成片混音.mp3');
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* 单段：渲染 [f0, f1) 帧，只出画面 */
async function renderPart(f0, f1, out, tag = '') {
  const { serve, launch } = require('./cdp');
  const server = await serve(), b = await launch();
  b.listen(m => { if (m.method === 'Runtime.exceptionThrown') console.log(tag, '页面报错:', JSON.stringify(m.params.exceptionDetails).slice(0, 300)); });
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const write = buf => new Promise(r => ff.stdin.write(buf) ? r() : ff.stdin.once('drain', r));
  try {
    await b.open('正片.html?export', 'window.READY===true');
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      await b.evaluate(`seek(${(f / FPS).toFixed(5)})`);
      await write(await b.shot('jpeg', 95));
      if ((f - f0) % (FPS * 5) === 0 && f > f0) { const done = (f - f0) / (f1 - f0), el = (Date.now() - t0) / 1000; console.log(`${tag}${fmt(f / FPS)}  ${(done * 100).toFixed(1)}%  还要约 ${fmt(el / done - el)}`); }
    }
  } finally { ff.stdin.end(); await new Promise(r => ff.on('close', r)); b.close(); server.close(); }
}

(async () => {
  if (process.env.EXPORT_PART) {   // 子进程：只渲染自己那一段
    const [f0, f1, out] = process.env.EXPORT_PART.split('|'); await renderPart(+f0, +f1, out, `[段 ${process.env.CDP_PORT}] `); return;
  }
  const dur = +(opt('to') || JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cues.js'), 'utf8').match(/window\.DUR = ([\d.]+)/)[1]));
  const from = +(opt('from') || 0), F0 = Math.round(from * FPS), F1 = Math.round(dur * FPS);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ep014-export-'));
  console.log(`导出 ${fmt(from)} – ${fmt(dur)}，${F1 - F0} 帧，${FPS} fps，${JOBS} 个进程`);
  const per = Math.ceil((F1 - F0) / JOBS), parts = [];
  await Promise.all([...Array(JOBS)].map((_, k) => {
    const a = F0 + k * per, z = Math.min(F1, a + per), out = path.join(tmp, `part${k}.mp4`); if (a >= z) return; parts.push(out);
    if (JOBS === 1) return renderPart(a, z, out);
    return new Promise((res, rej) => { const p = spawn(process.execPath, [__filename], { stdio: 'inherit', env: { ...process.env, EXPORT_PART: `${a}|${z}|${out}`, CDP_PORT: String(8840 + k), CDP_DEBUG_PORT: String(9370 + k) } }); p.on('close', c => c ? rej(new Error('段 ' + k + ' 失败')) : res()); });
  }));
  const list = path.join(tmp, 'list.txt'); fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
  const hasAudio = fs.existsSync(AUDIO);
  const a = ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list];
  if (hasAudio) a.push('-ss', String(from), '-t', String(dur - from), '-i', AUDIO, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '320k');
  a.push('-c:v', 'copy', '-movflags', '+faststart', OUT);
  const r = spawnSync('ffmpeg', a, { stdio: 'inherit' }); if (r.status) throw new Error('ffmpeg 合成失败');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('完成：', OUT, hasAudio ? '（含混音）' : '（没找到 配音/成片混音.mp3，只有画面）');
})().catch(e => { console.error(e); process.exit(1); });

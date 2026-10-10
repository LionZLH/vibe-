// 用 Chrome 调试协议（CDP）驱动无界面 Chrome：打开页面 → 等 window.READY → 调 window.seek(t) → 截图。
// 被 抽帧.js、export-mp4.js 共用。页面由本文件起的静态服务器提供，端口 8793，根目录是本期文件夹。
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CHROME = process.env.CHROME || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const PORT = 8825, DEBUG_PORT = 9355;
const TYPE = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mp3': 'audio/mpeg',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.otf': 'font/otf', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.mjs': 'text/javascript; charset=utf-8' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 静态服务器；posts 里登记的路径接收 POST（例如整条音轨）
function serve(posts = {}) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      if (req.method === 'POST') {
        const c = []; req.on('data', d => c.push(d));
        req.on('end', () => { (posts[url] || (() => {}))(Buffer.concat(c)); res.end('ok'); });
        return;
      }
      const f = path.join(ROOT, url);
      if (!f.startsWith(ROOT)) return res.writeHead(403).end();
      fs.readFile(f, (e, d) => {
        if (e) return res.writeHead(404).end();
        res.writeHead(200, { 'Content-Type': TYPE[path.extname(f).toLowerCase()] || 'application/octet-stream' }); res.end(d);
      });
    }).listen(PORT, () => resolve(server));
  });
}

async function launch() {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'ep014-cdp-'));
  const chrome = spawn(CHROME, ['--headless=new', `--user-data-dir=${prof}`, `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', '--window-size=1920,1080',
    '--autoplay-policy=no-user-gesture-required', ...(process.platform === 'darwin' ? ['--use-angle=metal'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox']), '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  let list;
  for (let i = 0; i < 100; i++) {
    try { list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json(); if (list.some(t => t.type === 'page')) break; } catch (e) {}
    await sleep(100);
  }
  const target = list.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map();
  const listeners = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.method) listeners.forEach(f => f(m));
    if (m.id && pending.has(m.id)) { const { r, j } = pending.get(m.id); pending.delete(m.id); m.error ? j(new Error(m.error.message)) : r(m.result); }
  };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async expr => {
    const res = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    return res.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  return {
    send, evaluate, listen: f => listeners.push(f),
    async open(url, readyExpr = 'window.READY===true || typeof window.seek==="function"') {
      await send('Page.navigate', { url: `http://localhost:${PORT}/${url}` });
      for (let i = 0; i < 600; i++) { await sleep(100); try { if (await evaluate(`document.readyState==='complete' && (${readyExpr})`)) return; } catch (e) {} }
      throw new Error('页面没有就绪：' + url);
    },
    async shot(format = 'jpeg', quality = 92) {
      const r = await send('Page.captureScreenshot', { format, quality: format === 'jpeg' ? quality : undefined, fromSurface: true });
      return Buffer.from(r.data, 'base64');
    },
    close() { try { ws.close(); } catch (e) {} try { chrome.kill(); } catch (e) {} },
  };
}

module.exports = { ROOT, PORT, serve, launch, sleep };

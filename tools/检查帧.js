// 抽帧：node tools/检查帧.js 输出目录 秒1 秒2 …（1920×1080 静帧，seek 到该时刻）
const fs = require('fs'), path = require('path');
const { serve, launch } = require('./cdp');
const [out, ...args] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const server = await serve(), b = await launch();
  b.listen(m => { if (m.method === 'Runtime.exceptionThrown') console.log('页面报错:', JSON.stringify(m.params.exceptionDetails).slice(0, 600)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') console.log('console.error:', JSON.stringify(m.params.args).slice(0, 400)); });
  try {
    await b.open('正片.html?export' + (process.env.DBG ? '&dbg=' + process.env.DBG : ''), 'window.READY===true');
    for (const a of args) {
      await b.evaluate(`seek(${+a})`);
      const name = 't' + String(Math.round(+a * 10)).padStart(4, '0') + '.jpg';
      fs.writeFileSync(path.join(out, name), await b.shot('jpeg', 88)); console.log(name);
    }
  } finally { b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });

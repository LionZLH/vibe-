// 从页面读出镜头代码登记的音效事件 + 口播时间表，写到 配音/sfx.json（tools/混音.py 用）：node tools/音效表.js
const fs = require('fs'), path = require('path');
const { serve, launch, ROOT } = require('./cdp');
(async () => {
  const server = await serve(), b = await launch();
  b.listen(m => { if (m.method === 'Runtime.exceptionThrown') console.log('页面报错:', JSON.stringify(m.params.exceptionDetails).slice(0, 400)); });
  try {
    await b.open('正片.html?export', 'window.READY===true');
    const data = await b.evaluate('({ dur: window.DUR, cues: window.CUES, sfx: [...window.SFX].sort((a, b) => a.t - b.t) })');
    fs.writeFileSync(path.join(ROOT, '配音', 'sfx.json'), JSON.stringify(data, null, 0));
    const kinds = {}; data.sfx.forEach(e => kinds[e.kind] = (kinds[e.kind] || 0) + 1);
    console.log('音效事件', data.sfx.length, '条；总时长', data.dur, '秒'); console.log(kinds);
  } finally { b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });

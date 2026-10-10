# AI 七十年（014 期，制作中）

抖音「Evan 的 AI 实验室」纪录片《AI 七十年》的工程文件：纯 HTML + three.js + GSAP 的代码动画，浏览器里预览、逐帧导出。

## 进度（2026-10-10，暂停时的状态）
- 口播稿：`口播稿.md`（初稿 v1，带逐条事实出处）→ `口播稿_gemini.md`（Gemini 3.8 Flash 润色）→ `口播稿_v2.md`（在 Gemini 版上修正事实，现行版本，整片按它定时，约 8 分钟）。
- 画面：冷开场、倒带、片名、一 · 1950（图灵）、二 · 命名、三 · 另一条路已做；四至尾声待做。章节转场（时间轴 + 年份章名）已全部接好。
- 无配音（画面确定后再配）。
- 分镜：`分镜.md`；素材出处与授权：`素材/素材清单.md`；项目说明：`CLAUDE.md`。

## 预览
```bash
node tools/serve.js 8824
```
打开 http://localhost:8824/正片.html（空格播放，左右键 ±2 秒，`?t=秒` 直接跳转）。

## 素材授权
史料图片来自 Wikimedia Commons（公版 / CC0 / CC BY / CC BY-SA，作者与授权逐条见 `素材/素材清单.md`）；AlexNet 源码 BSD-2-Clause（计算机历史博物馆）；论文原文为引用。字体：思源宋体、EB Garamond、Courier Prime、JetBrains Mono（OFL），阿里巴巴普惠体（阿里巴巴免费字体）。

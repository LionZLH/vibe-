# 014 期：AI 七十年（纪录片，目标 5 分钟以上）

**状态（2026-10-10）**：口播稿初稿 v1（`口播稿.md`，带逐条事实出处）+ 分镜表（`分镜.md`）+ 全网素材（`素材/素材清单.md`）+ **开场样片**（冷开场 → 倒带 → 片名 → 一 · 1950，约 70 秒，无配音，按 4.6 字/秒估时）待用户审。用户另要求口播稿用 Gemini 3.8 Flash 过一遍 → `口播稿_gemini.md`（用 `../tools/gemini.sh` 跑）。

## 用户要求
- 「ai发展史」纪录片形式，允许全网收集素材；时长选了「5 分钟以上」；流程选了「稿子 + 样片先审」。
- 不用 lemo-opuscar，风格自由发挥；**镜头和动效一定要惊艳**。

## 风格锁「显影」（`js/core.js` 顶部注释）
- 片子的胶片随年代变：50–60 年代银盐黑白（图像本身去色，全局不去色——琥珀标注保留颜色）→ 寒冬冰针 + 冷调 → 80 年代琥珀 CRT → 90 年代后数码 → 2012 后黑底琥珀光点。
- 主线 = 3D 时间轴（`js/spine.js`，x = (年-1950)×10）：上轨「规则」冷白、下轨「学习」琥珀；1969 断口（火星 + 余烬）；两段寒冬冰针。左上角年份 HUD。
- 字体：思源宋体（片名/年份）、EB Garamond / Courier Prime（原文）、JetBrains Mono（数据）、普惠体 58px 字幕。

## 技术
- 纯 HTML + three.js（`lib/three/`，importmap）+ GSAP。`js/gl.js`：渲染器 + 后期（景深 BokehPass → 辉光，阈值 1.0 只吃自发光 → 调色：S 曲线在感知空间、结霜、方向模糊、色差、横向镜头光、闪白）。
- `js/film.js`：三张画布——`#grain`（mix-blend overlay，中灰底 + 噪点）、`#film`（闪烁/划痕/暗角）、`#burn`（screen）。**颗粒不能画在普通透明画布上，会把黑场抬成灰**（踩过）。
- 每帧 = `seek(t)`：GSAP 时间线 + 当前镜头的 `look(t)` 写 CAM / G / F，预览和导出一致。
- 2.5D 照片：`tools/depth.py`（Depth Anything V2 small ONNX，scratchpad venv）出深度图，`depthPhoto()` 顶点位移。
- 调试：`?t=秒` 打开即跳；`?dbg=nobloom,nostreak,nofilm,nograde` 逐层关。

## 命令
- 预览：launch.json `ep014`（端口 **8824**；8814 被别的进程占着）。
- 改口播时长：`tools/cues.py` → `python3 tools/gen_data.py`。
- 抽帧：`node tools/检查帧.js 目录 秒…`（`DBG=nofilm` 可带调试参数）。

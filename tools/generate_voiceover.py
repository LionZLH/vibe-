#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
014期《AI 七十年》广播级逐句口播合成与时间轴对齐脚本
遵循 AGENTS.md 广播人声方案3黄金母带标准：
- 音色：30118d68 (001 克隆音色)
- 语速：1.2 (用户指定 1.2 倍速)
- 解码步数：num_step=32 (底模高质量预设)
- Guidance Scale: 2.5 (原声胸腔磁性共鸣甜点区)
- 尾部防截断静音：200ms (apad=pad_dur=0.2)
- 母带滤镜链：
  - 145Hz +3.2dB 胸腔温暖共鸣
  - 3800Hz +1.2dB 咬字空气透亮补偿
  - loudnorm I=-14 LRA=7 tp=-1 短视频黄金响度
- 输出格式：320k 广播级 MP3 独立分句片段
- 产物归档：
  - 配音/正片/<id>.mp3 (共 90 句)
  - 配音/timing.json (实测时长表，驱动 cues.py 与 gen_data.py)
  - 配音/正片_完整字幕.srt (高精度字幕)
  - 配音/master_voiceover.mp3 (全片与画面时间轴完全对齐的完整母带音频)
"""

import os
import sys
import re
import json
import time
import subprocess
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
VOICE_DIR = BASE_DIR / "配音"
ZHENGPIAN_DIR = VOICE_DIR / "正片"
AUDIO_SEGMENTS_DIR = BASE_DIR / "audio_segments"
RAW_WAV_DIR = VOICE_DIR / "raw_wav"
TIMING_JSON = VOICE_DIR / "timing.json"

for d in [VOICE_DIR, ZHENGPIAN_DIR, AUDIO_SEGMENTS_DIR, RAW_WAV_DIR]:
    d.mkdir(parents=True, exist_ok=True)

TTS_URL = "http://127.0.0.1:3900/v1/audio/speech"
VOICE_ID = "30118d68"
SPEED = 1.2
NUM_STEP = 32
GUIDANCE_SCALE = 2.5
TAIL_PAD_MS = 200

# 90 句口播正本，精准映射 cues.py 与 口播稿_v2.md
SCRIPT_ITEMS = [
    {"id": "c1", "raw": "2022 年底，一个极简的聊天网页悄然上线。", "tts": "2022 年底，一个极简的聊天网页，悄然上线。"},
    {"id": "c2", "raw": "仅仅五天，涌入百万人；两个月，用户过亿。", "tts": "仅仅五天，涌入百万人；两个月，用户过亿。"},
    {"id": "c3", "raw": "很多人以为，AI 是这几年凭空冒出来的。", "tts": "很多人以为，A I 是这几年凭空冒出来的。"},
    {"id": "c4", "raw": "其实这一天，人类整整等了七十多年。", "tts": "其实这一天，人类整整等了七十多年。"},
    {"id": "c5a", "raw": "这七十年里，AI 曾两度跌进绝望的寒冬。", "tts": "这七十年里，A I 曾两度跌进绝望的寒冬。"},
    {"id": "c5b", "raw": "如今赢下一切的想法，当年甚至被判过死刑。", "tts": "如今赢下一切的想法，当年甚至被判过死刑。"},
    {"id": "a1", "raw": "1950 年，英国数学家图灵发表了一篇论文。", "tts": "1950 年，英国数学家图灵，发表了一篇论文。"},
    {"id": "a2", "raw": "开头写道：机器能思考吗？", "tts": "开头写道：机器能思考吗？"},
    {"id": "a3", "raw": "他没有空谈定义，而是设计了一场测试：", "tts": "他没有空谈定义，而是设计了一场测试："},
    {"id": "a4", "raw": "隔着房间打字，若分不出人机，就算机器会思考。", "tts": "隔着房间打字，若分不出人机，就算机器会思考。"},
    {"id": "a5", "raw": "这就是后来大名鼎鼎的“图灵测试”。", "tts": "这就是后来大名鼎鼎的图灵测试。"},
    {"id": "a6", "raw": "可那一年，全球的电子计算机，屈指可数。", "tts": "可那一年，全球的电子计算机，屈指可数。"},
    {"id": "b1", "raw": "1955 年，麦卡锡与明斯基、香农等人写了申请书。", "tts": "1955 年，麦卡锡与明斯基、香农等人，写了申请书。"},
    {"id": "b2", "raw": "里面第一次写下一个新词：人工智能。", "tts": "里面第一次写下一个新词：人工智能。"},
    {"id": "b3", "raw": "他们说：选一群科学家干一个夏天，就能有重大进展。", "tts": "他们说：选一群科学家干一个夏天，就能有重大进展。"},
    {"id": "b4", "raw": "1956 年达特茅斯会议召开，学科由此诞生。", "tts": "1956 年达特茅斯会议召开，学科由此诞生。"},
    {"id": "b5", "raw": "当时主流认为：把规则写给电脑，它就能像人推理。", "tts": "当时主流认为：把规则写给电脑，它就能像人推理。"},
    {"id": "d1", "raw": "但有人选择走另一条路。", "tts": "但有人选择走另一条路。"},
    {"id": "d2", "raw": "1958 年，罗森布拉特提出了感知机。", "tts": "1958 年，罗森布拉特提出了感知机。"},
    {"id": "d3", "raw": "它模仿神经元：看例子、猜答案，错了就自己调整。", "tts": "它模仿神经元：看例子、猜答案，错了就自己调整。"},
    {"id": "d4", "raw": "它在一台 IBM 机器上试了五十次，学会认左右。", "tts": "它在一台 I B M 机器上试了五十次，学会认左右。"},
    {"id": "d5", "raw": "报纸写道：海军期待它将来能走、能看、能写，甚至有自我意识。", "tts": "报纸写道：海军期待它将来能走、能看、能写，甚至有自我意识。"},
    {"id": "d6", "raw": "两年后造出的真机，用四百个光电管当眼睛。", "tts": "两年后造出的真机，用四百个光电管当眼睛。"},
    {"id": "d7", "raw": "AI 由此分出两条路：写规则，还是从例子学？", "tts": "A I 由此分出两条路：写规则，还是从例子学？"},
    {"id": "d8", "raw": "随后的七十年，就是这两条路的漫长拉锯。", "tts": "随后的七十年，就是这两条路的漫长拉锯。"},
    {"id": "w1", "raw": "好景不长。", "tts": "好景不长。"},
    {"id": "w2", "raw": "1969 年，明斯基和派珀特出版了《感知机》。", "tts": "1969 年，明斯基和派珀特出版了《感知机》。"},
    {"id": "w3", "raw": "他们证明：单层感知机，连最简单的异或都解不开。", "tts": "他们证明：单层感知机，连最简单的异或都解不开。"},
    {"id": "w4", "raw": "这本书判了神经网络死刑，经费断绝，人员离散。", "tts": "这本书判了神经网络死刑，经费断绝，人员离散。"},
    {"id": "w5", "raw": "两年后，罗森布拉特在 43 岁生日那天，死于一场划船事故。", "tts": "两年后，罗森布拉特在 43 岁生日那天，死于一场划船事故。"},
    {"id": "w6", "raw": "写规则的路也碰了壁：现实的规则，根本写不完。", "tts": "写规则的路也碰了壁：现实的规则，根本写不完。"},
    {"id": "w7", "raw": "1973 年，莱特希尔向英国政府提交评估报告。", "tts": "1973 年，莱特希尔向英国政府提交评估报告。"},
    {"id": "w8", "raw": "结论是：没有任何一项发现，产生过当初承诺的重大影响。", "tts": "结论是：没有任何一项发现，产生过当初承诺的重大影响。"},
    {"id": "w9", "raw": "英美大砍经费，AI 跌进第一次寒冬。", "tts": "英美大砍经费，A I 跌进第一次寒冬。"},
    {"id": "x1", "raw": "八十年代，规则派换了打法：只写专家的经验规则。", "tts": "八十年代，规则派换了打法：只写专家的经验规则。"},
    {"id": "x2", "raw": "这就是专家系统。", "tts": "这就是专家系统。"},
    {"id": "x3", "raw": "DEC 公司靠两千多条规则，据估计年省两千五百万。", "tts": "D E C 公司靠两千多条规则，据估计年省两千五百万。"},
    {"id": "x4", "raw": "行业跟风投入，日本启动第五代计算机计划。", "tts": "行业跟风投入，日本启动第五代计算机计划。"},
    {"id": "x5", "raw": "但它太脆弱了：规则一多就打架，碰上没写过的情况就犯傻。", "tts": "但它太脆弱了：规则一多就打架，碰上没写过的情况就犯傻。"},
    {"id": "x6", "raw": "1987 年，专用 LISP 计算机市场彻底崩盘。", "tts": "1987 年，专用 Lisp 计算机市场彻底崩盘。"},
    {"id": "x7", "raw": "第二次寒冬降临，学者们甚至不敢提“AI”。", "tts": "第二次寒冬降临，学者们甚至不敢提 A I。"},
    {"id": "y1", "raw": "可就在这期间，神经网络悄悄活了过来。", "tts": "可就在这期间，神经网络悄悄活了过来。"},
    {"id": "y2", "raw": "1986 年，辛顿和同事在《自然》发文，用反向传播训练网络：", "tts": "1986 年，辛顿和同事在《自然》发文，用反向传播训练网络："},
    {"id": "y3", "raw": "让误差从后往前传，每个连接按责任调整一点。", "tts": "让误差从后往前传，每个连接按责任调整一点。"},
    {"id": "y4", "raw": "当年解不开的异或，网络多加一层，就迎刃而解。", "tts": "当年解不开的异或，网络多加一层，就迎刃而解。"},
    {"id": "y5", "raw": "辛顿的博士后杨立昆，用它教电脑认手写数字。", "tts": "辛顿的博士后杨立昆，用它教电脑认手写数字。"},
    {"id": "y6", "raw": "九十年代末，全美一成以上的支票都由它来读。", "tts": "九十年代末，全美一成以上的支票都由它来读。"},
    {"id": "y7", "raw": "但受制于算力与数据，这一派依旧备受冷落。", "tts": "但受制于算力与数据，这一派依旧备受冷落。"},
    {"id": "z1", "raw": "1997 年，IBM 深蓝击败棋王卡斯帕罗夫。", "tts": "1997 年，I B M 深蓝击败棋王卡斯帕罗夫。"},
    {"id": "z2", "raw": "人们惊呼：机器已经比人聪明了。", "tts": "人们惊呼：机器已经比人聪明了。"},
    {"id": "z3", "raw": "但深蓝仍是规则派：写死的估值，加每秒两亿步穷举。", "tts": "但深蓝仍是规则派：写死的估值，加每秒两亿步穷举。"},
    {"id": "z4", "raw": "赢了国际象棋，换个简单的游戏，它全都不会。", "tts": "赢了国际象棋，换个简单的游戏，它全都不会。"},
    {"id": "g1", "raw": "2010 年前后，神经网络欠缺的两样东西补齐了。", "tts": "2010 年前后，神经网络欠缺的两样东西补齐了。"},
    {"id": "g2", "raw": "一是数据：李飞飞团队收集了一千四百万张图片，", "tts": "一是数据：李飞飞团队收集了一千四百万张图片，"},
    {"id": "g3", "raw": "动用 167 国近五万众包工人，建成 ImageNet。", "tts": "动用 167 国近五万众包工人，建成 Image Net。"},
    {"id": "g4", "raw": "二是算力：游戏显卡碰巧极擅长海量并行乘法。", "tts": "二是算力：游戏显卡碰巧极擅长海量并行乘法。"},
    {"id": "g5", "raw": "2012 年，辛顿带学生用两块显卡训出 AlexNet。", "tts": "2012 年，辛顿带学生用两块显卡训出 Alex Net。"},
    {"id": "g6", "raw": "比赛中，它将错误率压到 15.3%，第二名是 26.2%。", "tts": "比赛中，它将错误率压到百分之 15.3，第二名是百分之 26.2。"},
    {"id": "g7", "raw": "次年起，几乎所有顶尖团队都倒向了神经网络。", "tts": "次年起，几乎所有顶尖团队都倒向了神经网络。"},
    {"id": "g8", "raw": "当年的学生里，有个年轻人叫伊利亚·苏茨克维。", "tts": "当年的学生里，有个年轻人叫伊利亚·苏茨克维。"},
    {"id": "h1", "raw": "2016 年 3 月，首尔。AlphaGo 迎战李世石。", "tts": "2016 年 3 月，首尔。Alpha Go 迎战李世石。"},
    {"id": "h2", "raw": "围棋的变化比宇宙原子还多，蛮力根本算不过来。", "tts": "围棋的变化比宇宙原子还多，蛮力根本算不过来。"},
    {"id": "h3", "raw": "它先学十六万盘人类棋谱，又自我对弈几千万盘。", "tts": "它先学十六万盘人类棋谱，又自我对弈几千万盘。"},
    {"id": "h4", "raw": "第二局第 37 手，它下在职业棋手几乎不会考虑的位置。", "tts": "第二局第 37 手，它下在职业棋手几乎不会考虑的位置。"},
    {"id": "h5", "raw": "它自评过：人类下出这一步的概率，仅万分之一。", "tts": "它自评过：人类下出这一步的概率，仅万分之一。"},
    {"id": "h6", "raw": "讲解一度以为是昏招，但正是这一手，锁定了胜局。", "tts": "讲解一度以为是昏招，但正是这一手，锁定了胜局。"},
    {"id": "h7", "raw": "最终比分，4 比 1。", "tts": "最终比分，4 比 1。"},
    {"id": "t1", "raw": "一年后，谷歌八人团队发表《注意力就是一切》。", "tts": "一年后，谷歌八人团队发表《注意力就是一切》。"},
    {"id": "t2", "raw": "论文提出全新架构：Transformer。", "tts": "论文提出全新架构：Transformer。"},
    {"id": "t3", "raw": "它让字词同时纵观全局，自己决定注意力放在哪。", "tts": "它让字词同时纵观全局，自己决定注意力放在哪。"},
    {"id": "t4", "raw": "这种架构极易堆叠算力：数据越大，能力越强。", "tts": "这种架构极易堆叠算力：数据越大，能力越强。"},
    {"id": "t5", "raw": "ChatGPT 名字里的 T，正来源于此。", "tts": "Chat GPT 名字里的 T，正来源于此。"},
    {"id": "s1", "raw": "此时苏茨克维已在 OpenAI，他们押注把模型做大。", "tts": "此时苏茨克维已在 Open AI，他们押注把模型做大。"},
    {"id": "s2", "raw": "2018 年的 GPT-1，一亿多参数。", "tts": "2018 年的 G P T 1，一亿多参数。"},
    {"id": "s3", "raw": "2019 年的 GPT-2，飙到十五亿。", "tts": "2019 年的 G P T 2，飙到十五亿。"},
    {"id": "s4", "raw": "2020 年的 GPT-3，膨胀至一千七百五十亿。", "tts": "2020 年的 G P T 3，膨胀至一千七百五十亿。"},
    {"id": "s5", "raw": "模型够大以后，没专门教过的本事也冒了出来。", "tts": "模型够大以后，没专门教过的本事也冒了出来。"},
    {"id": "s6", "raw": "2022 年 11 月 30 日，ChatGPT 正式上线。", "tts": "2022 年 11 月 30 日，Chat GPT 正式上线。"},
    {"id": "s7", "raw": "图灵当年的打字构想，终于飞入每个人的手机。", "tts": "图灵当年的打字构想，终于飞入每个人的手机。"},
    {"id": "n1", "raw": "2024 年 10 月，诺贝尔物理学奖授予霍普菲尔德与辛顿。", "tts": "2024 年 10 月，诺贝尔物理学奖授予霍普菲尔德与辛顿。"},
    {"id": "n2", "raw": "次日，化学奖半数授予预测蛋白质结构的哈萨比斯与詹伯。", "tts": "次日，化学奖半数授予预测蛋白质结构的哈萨比斯与詹伯。"},
    {"id": "n3", "raw": "1969 年被判死刑的想法，55 年后站上了诺贝尔领奖台。", "tts": "1969 年被判死刑的想法，55 年后站上了诺贝尔领奖台。"},
    {"id": "e1", "raw": "接下来的故事，很多人都在见证。", "tts": "接下来的故事，很多人都在见证。"},
    {"id": "e2", "raw": "2025 年，AI 在国际奥数比赛斩获金牌级高分。", "tts": "2025 年，A I 在国际奥数比赛斩获金牌级高分。"},
    {"id": "e3", "raw": "它能自己写代码、查资料，甚至直接操作电脑。", "tts": "它能自己写代码、查资料，甚至直接操作电脑。"},
    {"id": "e4", "raw": "七十多年前，图灵发问：机器能思考吗？", "tts": "七十多年前，图灵发问：机器能思考吗？"},
    {"id": "e5", "raw": "这个问题直到今天，依旧没有标准答案。", "tts": "这个问题直到今天，依旧没有标准答案。"},
    {"id": "e6", "raw": "但那篇论文的最后一句，放到今天依然成立：", "tts": "但那篇论文的最后一句，放到今天依然成立："},
    {"id": "e7", "raw": "我们能看清的前路很短，但前路上有太多事要做。", "tts": "我们能看清的前路很短，但前路上有太多事要做。"},
    {"id": "e8", "raw": "这段历史值得铭记，未来我们一同见证。", "tts": "这段历史值得铭记，未来我们一同见证。"},
]

def request_tts(text: str) -> bytes:
    payload = {
        "model": "omnivoice",
        "input": text,
        "voice": VOICE_ID,
        "speed": SPEED,
        "response_format": "wav",
        "num_step": NUM_STEP,
        "guidance_scale": GUIDANCE_SCALE
    }
    req = urllib.request.Request(
        TTS_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                if resp.status == 200:
                    return resp.read()
        except Exception as e:
            print(f"[RETRY {attempt+1}] TTS 请求失败: {e}", file=sys.stderr)
            time.sleep(3)
    raise RuntimeError(f"TTS 合成彻底失败: {text}")

def apply_broadcast_master(raw_wav: bytes, out_mp3: Path, atempo: float = 1.2):
    filter_parts = []
    
    # 物理 1.2 倍速加速 (确保听感上有明确且自然的 1.2 倍速节奏)
    if atempo != 1.0:
        filter_parts.append(f"atempo={atempo}")
    
    # 方案 3 黄金广播母带链
    filter_parts.append("equalizer=f=145:width_type=o:w=1.0:g=3.2")
    filter_parts.append("equalizer=f=3800:width_type=o:w=1.0:g=1.2")
    filter_parts.append("loudnorm=I=-14:LRA=7:tp=-1")

    if TAIL_PAD_MS > 0:
        filter_parts.append(f"apad=pad_dur={TAIL_PAD_MS / 1000.0:.3f}")

    cmd = [
        "ffmpeg", "-y",
        "-i", "pipe:0",
        "-af", ",".join(filter_parts),
        "-codec:a", "libmp3lame",
        "-b:a", "320k",
        str(out_mp3)
    ]
    subprocess.run(cmd, input=raw_wav, capture_output=True, check=True)

def get_audio_duration(path: Path) -> float:
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(path)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return float(res.stdout.strip())

def fmt_srt_time(t: float) -> str:
    hrs = int(t // 3600)
    mins = int((t % 3600) // 60)
    secs = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{ms:03d}"

def clean_srt_line(text: str) -> str:
    # 标点符号硬约束：行尾标点及引号清除
    t = text.strip()
    t = re.sub(r'[“”"\'‘’]', '', t)
    t = re.sub(r'[，。：、！？；,.!?:;]+$', '', t)
    return t

def main():
    print("=" * 65)
    print("🎙️ 014期《AI 七十年》口播音频逐句生成与广播级母带工程 (1.2倍速版)")
    print(f"📊 待合成总句数: {len(SCRIPT_ITEMS)} 句")
    print(f"🎚️ 音色: {VOICE_ID} (001) | 语速: {SPEED} (1.2x) | 预设: 32步底模 / 2.5共鸣")
    print(f"🔊 母带链: 145Hz(+3.2dB) + 3800Hz(+1.2dB) + loudnorm(-14 LUFS) + 320k MP3")
    print("=" * 65)

    timing_dict = {}
    total_t0 = time.time()

    for idx, item in enumerate(SCRIPT_ITEMS, 1):
        cid = item["id"]
        raw_text = item["raw"]
        tts_text = item["tts"]
        
        wav_path = RAW_WAV_DIR / f"{cid}.wav"
        mp3_path = ZHENGPIAN_DIR / f"{cid}.mp3"
        seg_mp3_path = AUDIO_SEGMENTS_DIR / f"{cid}.mp3"

        t0 = time.time()
        # 1. 获取 raw wav (有缓存直接复用，无缓存调用 TTS)
        if wav_path.exists() and wav_path.stat().st_size > 5000:
            print(f"[{idx:02d}/{len(SCRIPT_ITEMS):02d}] ⚡️ 复用底模音频 {cid}，应用 1.2x 母带加速...", end="", flush=True)
            raw_wav = wav_path.read_bytes()
        else:
            print(f"[{idx:02d}/{len(SCRIPT_ITEMS):02d}] 正在合成 {cid} ({len(raw_text)}字)...", end="", flush=True)
            raw_wav = request_tts(tts_text)
            wav_path.write_bytes(raw_wav)
        
        # 2. 跑方案3母带链 (含物理 1.2x atempo 加速)
        apply_broadcast_master(raw_wav, mp3_path, atempo=1.2)
        
        # 同步拷贝到 audio_segments
        subprocess.run(["cp", str(mp3_path), str(seg_mp3_path)])
        
        dur = get_audio_duration(mp3_path)
        cost = time.time() - t0
        timing_dict[cid] = {"d": round(dur, 2)}
        print(f" 完成 -> 实测时长: {dur:.2f}s | 耗时: {cost:.1f}s")

        # 实时保存 timing.json
        with open(TIMING_JSON, "w", encoding="utf-8") as f:
            json.dump(timing_dict, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 全部实测时长已更新到: {TIMING_JSON}")

    # 调用 gen_data.py 更新前端工程时间表 data/cues.js
    gen_data_script = BASE_DIR / "tools" / "gen_data.py"
    if gen_data_script.exists():
        subprocess.run([sys.executable, str(gen_data_script)], check=True)
        print("✅ cues.js 数据已同步更新！")

    # 构建字幕 SRT 与无缝合流音频
    sys.path.insert(0, str(BASE_DIR / "tools"))
    import cues
    cues_data = cues.cues()

    srt_lines = []
    for i, item in enumerate(SCRIPT_ITEMS, 1):
        cid = item["id"]
        raw_text = item["raw"]
        c_info = cues_data[cid]
        start_s = c_info["s"]
        end_s = start_s + c_info["d"]
        cleaned_text = clean_srt_line(raw_text)
        srt_lines.append(f"{i}\n{fmt_srt_time(start_s)} --> {fmt_srt_time(end_s)}\n{cleaned_text}\n")

    srt_path = VOICE_DIR / "正片_完整字幕.srt"
    srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
    print(f"✅ 正片完整字幕 SRT 已生成: {srt_path}")

    # 生成 voiceover-sentences.md 资产
    sentences_md_path = BASE_DIR / "voiceover-sentences.md"
    md_content = ["# 014期《AI 七十年》逐句口播中英文朗读优化与实测时长表 (1.2倍速版)\n"]
    md_content.append("| 序号 | 标识 | 原文字幕 | TTS 朗读优化 | 实测时长(s) | 时间线起点(s) |")
    md_content.append("|---|---|---|---|---|---|")
    for i, item in enumerate(SCRIPT_ITEMS, 1):
        cid = item["id"]
        c_info = cues_data[cid]
        md_content.append(f"| {i} | `{cid}` | {clean_srt_line(item['raw'])} | {item['tts']} | {c_info['d']:.2f} | {c_info['s']:.2f} |")
    sentences_md_path.write_text("\n".join(md_content), encoding="utf-8")
    print(f"✅ 核心资产口播表已存盘: {sentences_md_path}")

    # 按照 cues 时间轴把各句音频合成为整条 master_voiceover.mp3 (精确定位，含动画留白与章节静音)
    print("🎬 正在装配整片对齐口播 master_voiceover.mp3 ...")
    try:
        total_duration = cues.duration()
        sample_rate = 24000
        total_samples = int(total_duration * sample_rate) + sample_rate
        master_buffer = bytearray(total_samples * 2)  # 16-bit mono

        for idx, item in enumerate(SCRIPT_ITEMS):
            cid = item["id"]
            mp3_p = ZHENGPIAN_DIR / f"{cid}.mp3"
            start_s = cues_data[cid]["s"]
            start_sample = int(start_s * sample_rate)
            
            # 用 ffmpeg 解码 mp3 为 24kHz 16-bit mono raw PCM
            decode_cmd = [
                "ffmpeg", "-v", "error",
                "-i", str(mp3_p),
                "-f", "s16le",
                "-acodec", "pcm_s16le",
                "-ar", str(sample_rate),
                "-ac", "1",
                "-"
            ]
            pcm_bytes = subprocess.check_output(decode_cmd)
            num_samples = len(pcm_bytes) // 2
            
            # 将该片段的采样叠加到 master_buffer 中
            import struct
            src_shorts = struct.unpack(f"<{num_samples}h", pcm_bytes)
            dst_shorts = list(struct.unpack_from(f"<{num_samples}h", master_buffer, start_sample * 2))
            mixed = [max(-32768, min(32767, s + d)) for s, d in zip(src_shorts, dst_shorts)]
            struct.pack_into(f"<{num_samples}h", master_buffer, start_sample * 2, *mixed)

        # 编码为 320k MP3
        master_mp3 = VOICE_DIR / "master_voiceover.mp3"
        encode_cmd = [
            "ffmpeg", "-y",
            "-f", "s16le",
            "-ar", str(sample_rate),
            "-ac", "1",
            "-i", "-",
            "-b:a", "320k",
            str(master_mp3)
        ]
        subprocess.run(encode_cmd, input=master_buffer, check=True, capture_output=True)
        print(f"✅ 全片时间轴对齐母带音频已生成: {master_mp3}")
    except Exception as e:
        print(f"⚠️ master_voiceover 合成提示: {e}")

    total_cost = time.time() - total_t0
    print("\n" + "=" * 65)
    print(f"🎉 全部 90 句口播生成与母带处理完成 (1.2倍速)！")
    print(f"⏱️ 总耗时: {total_cost:.1f} 秒 ({total_cost/60:.1f} 分钟)")
    print(f"🎬 全片纯口播时长: {sum(v['d'] for v in timing_dict.values()):.2f} 秒")
    print(f"🖥️ 整片动画画面总时长 (含章节演示留白): {cues.duration():.2f} 秒")
    print("=" * 65)

if __name__ == "__main__":
    main()

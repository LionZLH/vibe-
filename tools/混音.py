# 成片混音：口播（逐句按时间表放）+ 程序合成的 BGM（按年代变）+ 程序合成的音效（镜头代码里登记的事件）。
# 用法：node tools/音效表.js   →   python3 tools/混音.py
# 输入：配音/sfx.json（音效事件 + 口播时间表 + 总时长）、配音/正片/<id>.mp3（逐句口播）
# 输出：配音/成片混音.mp3（预览和导出用）、配音/分轨/{口播,配乐,音效}.mp3
# 全部声音都是这里用代码算出来的（不用外部素材），同一份输入每次结果一样。
import json, os, subprocess, sys, numpy as np
from scipy.signal import butter, sosfilt, lfilter, oaconvolve

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, '..')
SR = 48000
D = json.load(open(os.path.join(ROOT, '配音', 'sfx.json')))
DUR, CUES, EV = D['dur'], D['cues'], D['sfx']
N = int((DUR + 1) * SR)
c = lambda i, f=0: CUES[i]['s'] + f * CUES[i]['d']
ce = lambda i: CUES[i]['s'] + CUES[i]['d']
rng = np.random.default_rng(14)

# ---------------- 小工具 ----------------
def T(d): return np.arange(int(d * SR + 1e-6)) / SR
def sos(kind, f, order=2): return butter(order, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('lowpass', min(f, SR / 2 - 100), o), x)
def hp(x, f, o=2): return sosfilt(sos('highpass', f, o), x)
def bp(x, lo, hi, o=2): return sosfilt(sos('bandpass', [lo, min(hi, SR / 2 - 100)], o), x)
def noise(n, seed=None): return (np.random.default_rng(seed) if seed is not None else rng).standard_normal(n)
def ex(n, tau): return np.exp(-np.arange(n) / SR / tau)
def fade(x, a=.005, r=.02):
    n = len(x); a, r = min(int(a * SR), n // 2), min(int(r * SR), n // 2)
    if a: x[:a] *= np.linspace(0, 1, a) ** 2
    if r: x[-r:] *= np.linspace(1, 0, r) ** 2
    return x
def sweep_bp(x, fc, q=1.2, blk=256):
    """时变带通（每 blk 个样本按 fc 曲线重算一次 RBJ 系数）"""
    y = np.zeros_like(x); zi = np.zeros(2)
    for i in range(0, len(x), blk):
        f = float(np.clip(fc[min(i, len(fc) - 1)], 30, SR / 2 - 500)); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q)
        b = np.array([al, 0, -al]); a = np.array([1 + al, -2 * np.cos(w), 1 - al])
        y[i:i + blk], zi = lfilter(b / a[0], a / a[0], x[i:i + blk], zi=zi)
    return y
def sine(f, d, ph=0):   # f 可以是数组（滑音，长度就按数组）
    f = np.asarray(f, float); f = f if f.ndim else np.full(int(d * SR + 1e-6), float(f))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + ph)
def stereo(m, pan=0., width=0.):
    l, r = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
    out = np.stack([m * l, m * r], 1)
    if width: d = int(width * SR); out[d:, 1] = out[d:, 1] * .7 + m[:-d] * r * .3 if d else out[:, 1]
    return out
def put(buf, t, x, g=1.):
    i = int(round(t * SR)); x = np.asarray(x)
    if x.ndim == 1: x = stereo(x)
    if i >= len(buf): return
    j0 = max(0, -i); i = max(0, i); n = min(len(x) - j0, len(buf) - i)
    if n > 0: buf[i:i + n] += x[j0:j0 + n] * g
def midi(n): return 440 * 2 ** ((n - 69) / 12)

# ---------------- 音效 ----------------
def s_whoosh(d=1., hi=3200, lo=280):
    n = int(d * SR); k = np.linspace(0, 1, n); e = np.sin(np.pi * np.clip(k / .62, 0, 1) * .5) ** 2 * np.where(k > .62, np.cos((k - .62) / .38 * np.pi / 2) ** 2, 1)
    fc = lo + (hi - lo) * e; x = sweep_bp(noise(n), fc, .9) * e * 1.6
    pan = np.linspace(-.6, .6, n); return np.stack([x * np.sqrt((1 - pan) / 2), x * np.sqrt((1 + pan) / 2)], 1)
def s_whip(): return s_whoosh(.32, 5200, 900) * 1.2
def s_riser(d=2.):
    n = int(d * SR); k = np.linspace(0, 1, n); e = k ** 2.2
    x = sweep_bp(noise(n), 250 + 6000 * k ** 2, 1.5) * e * 1.4 + sine(110 * 2 ** (2 * k), d) * e * .25 + sine(165 * 2 ** (2 * k), d) * e * .12
    return stereo(fade(x, .01, .01), 0, .012)
def s_suck(d=1.):
    n = int(d * SR); k = np.linspace(0, 1, n); e = k ** 3
    x = sweep_bp(noise(n), 4000 - 3600 * k, 1.2) * e * 1.5 + sine(300 - 240 * k, d) * e * .3
    return stereo(fade(x, .01, .005))
def s_boom():
    d = 3.2; n = int(d * SR); k = np.linspace(0, 1, n)
    x = sine(58 - 24 * k ** .5, d) * ex(n, .9) * 1.1 + lp(noise(n), 160, 4) * ex(n, .25) * 1.4 + bp(noise(n), 300, 2400) * ex(n, .05) * .5
    return stereo(fade(x, .002, .3), 0, .02)
def s_impact():
    d = 1.2; n = int(d * SR); k = np.linspace(0, 1, n)
    x = sine(90 - 45 * k ** .3, d) * ex(n, .22) * 1.1 + bp(noise(n), 120, 2600) * ex(n, .07) * .9 + hp(noise(n), 3000) * ex(n, .012) * .4
    return stereo(fade(x, .001, .2), 0, .01)
def s_slice():
    d = 1.6; n = int(d * SR); x = np.zeros(n)
    for f in [2380, 3170, 4410, 5930, 7120]: x += sine(f * (1 - .04 * np.linspace(0, 1, n)), d) * ex(n, .35 + rng.random() * .3) * .18
    x += hp(noise(n), 4000) * ex(n, .04) * .7 + sine(np.linspace(1800, 400, n), d) * ex(n, .12) * .3
    return stereo(fade(x, .001, .2), .2, .006)
def s_crackle(d=2., rate=60, lo=2000, hi=9000, decay=True, seed=None):
    n = int(d * SR); x = np.zeros(n); r = np.random.default_rng(seed)
    k = int(rate * d)
    for _ in range(k):
        t = r.random() ** (1.6 if decay else 1); i = int(t * (n - 600)); L = int(SR * (.001 + r.random() * .004))
        x[i:i + L] += r.standard_normal(L) * np.exp(-np.arange(L) / (L / 4)) * (1 - t * .7 if decay else 1) * (.3 + r.random())
    x = bp(x, lo, hi); return np.stack([x * (.5 + .5 * r.random()), np.roll(x, int(SR * .003))], 1)
def s_sparks(d=2.): return s_crackle(d, 110, 2500, 11000) * 1.2
def s_shimmer(d=2.):
    n = int(d * SR); x = np.zeros((n, 2)); notes = [86, 88, 90, 93, 95, 98, 100]
    for j in range(9):
        f = midi(rng.choice(notes)); st = rng.random() * d * .5; L = n - int(st * SR)
        if L <= 0: continue
        e = np.minimum(1, np.arange(L) / (SR * .3)) * ex(L, d * .45) * (.6 + .4 * np.sin(2 * np.pi * (4 + rng.random() * 3) * np.arange(L) / SR))
        tone = sine(f, L / SR) * e * .12; p = rng.random() * 1.6 - .8
        x[int(st * SR):] += stereo(tone, p)
    return x
def s_ice(d=2.):
    x = s_crackle(d, 140, 3000, 12000, decay=False) * .9
    n = len(x); k = np.linspace(0, 1, n); hiss = hp(noise(n), 5000) * k * .12
    for j in range(14):
        st = rng.random() * d * .9; L = int(SR * (.05 + rng.random() * .12)); f0 = 1800 + rng.random() * 3500
        tone = sine(np.linspace(f0, f0 * (1.2 + rng.random() * .4), L), L / SR) * np.hanning(L) * .08; i = int(st * SR); x[i:i + L, j % 2] += tone[:max(0, min(L, n - i))]
    return x + np.stack([hiss, hiss[::-1]], 1)
def s_wind(d=4.):
    n = int(d * SR); t = np.arange(n) / SR; lfo = .55 + .45 * np.sin(2 * np.pi * .13 * t) * np.sin(2 * np.pi * .07 * t + 1)
    l = sweep_bp(noise(n), 500 + 300 * lfo, .8) * lfo; r = sweep_bp(noise(n), 560 + 280 * lfo[::-1], .8) * lfo[::-1]
    out = np.stack([l, r], 1) * .35; m = min(n, SR * 2); out[:m] *= np.linspace(0, 1, m)[:, None]; out[-m:] *= np.linspace(1, 0, m)[:, None]; return out
def s_flash():
    d = .9; n = int(d * SR); k = np.linspace(0, 1, n)
    x = sine(3500 + 3500 * k, d) * np.minimum(1, k / .7) * (k < .72) * .05 + hp(noise(n), 2500) * np.exp(-np.maximum(0, k - .72) * 40) * (k >= .72) * .5 + sine(140, d) * np.exp(-np.maximum(0, k - .72) * 18) * (k >= .72) * .5
    return stereo(fade(x, .02, .05), 0, .008)
def s_paper():
    d = .55; n = int(d * SR); e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
    x = bp(noise(n), 900, 6000) * e * .7 + s_crackle(d, 40, 1500, 6000)[:, 0] * .5
    return stereo(x, -.2, .004)
def s_marker():
    d = .55; n = int(d * SR); t = np.arange(n) / SR; e = np.minimum(1, t / .03) * np.minimum(1, (d - t) / .08)
    x = bp(noise(n), 2200, 6500) * e * (.7 + .3 * np.sign(np.sin(2 * np.pi * 37 * t))) * .55
    return stereo(x, .25)
def s_key(seed=None):
    r = np.random.default_rng(seed); n = int(.06 * SR); x = hp(noise(n, seed), 2000) * ex(n, .0025) * .8 + sine(260 + r.random() * 80, .06) * ex(n, .012) * .5
    return stereo(x, r.random() * .6 - .3)
def s_type(seed=None):
    r = np.random.default_rng(seed); n = int(.12 * SR)
    x = hp(noise(n, seed), 1500) * ex(n, .003) * 1.1 + sine(150 + r.random() * 40, .12) * ex(n, .02) * .7 + sine(3200 + r.random() * 600, .12) * ex(n, .03) * .05
    return stereo(x, r.random() * .5 - .25)
def s_teletype(seed=None):
    a = s_type(seed) * .7; i = int(.013 * SR); out = a.copy(); out[i:] += a[:-i] * .55; return out
def s_term(seed=None):
    n = int(.02 * SR); x = bp(noise(n, seed), 1500, 4500) * ex(n, .002); return stereo(x, (np.random.default_rng(seed).random() - .5) * .4)
def s_tick(f=1800):
    n = int(.08 * SR); x = sine(f, .08) * ex(n, .015) * .7 + hp(noise(n), 3000) * ex(n, .0015) * .4; return stereo(x)
def s_blip(f=880):
    n = int(.16 * SR); x = sine(f * (1 - .03 * np.linspace(0, 1, n)), .16) * ex(n, .045) * np.minimum(1, np.arange(n) / 60); return stereo(x, .1)
def s_beep():
    n = int(.09 * SR); t = np.arange(n) / SR; x = np.tanh(3 * np.sin(2 * np.pi * 1320 * t)) * .3 * np.minimum(1, (.09 - t) / .01) * np.minimum(1, t / .003); return stereo(lp(x, 4000))
def fm_bell(f, d, idx=2.5, ratio=1.4, tau=.8):
    n = int(d * SR); t = np.arange(n) / SR; e = np.exp(-t / tau)
    return np.sin(2 * np.pi * f * t + idx * e * np.sin(2 * np.pi * f * ratio * t)) * e
def s_bell(): return stereo(fm_bell(2093, 1.2, 3, 3.5, .35) * .25, .3)
def s_chime():
    d = 3.2; x = np.zeros((int(d * SR), 2))
    for j, m in enumerate([74, 81, 86, 90]): st = j * .06; y = fm_bell(midi(m), d - st, 1.6, 2.0, 1.2) * .16; x[int(st * SR):] += stereo(y, -.5 + j * .33)
    return x
def s_thud():
    n = int(.4 * SR); k = np.linspace(0, 1, n); x = sine(95 - 35 * k, .4) * ex(n, .07) + lp(noise(n), 400) * ex(n, .03) * .6; return stereo(x)
def s_clack(seed=None):
    r = np.random.default_rng(seed); n = int(.25 * SR)
    x = bp(noise(n, seed), 1200, 4200) * ex(n, .004) * 1.1 + sine(1750 + r.random() * 300, .25) * ex(n, .025) * .25 + sine(240 + r.random() * 40, .25) * ex(n, .03) * .6
    return stereo(x, r.random() * .4 - .2)
def s_stone(seed=None):
    r = np.random.default_rng(seed); n = int(.3 * SR)
    x = hp(noise(n, seed), 3500) * ex(n, .0012) * 1.4 + sine(1050 + r.random() * 150, .3) * ex(n, .05) * .3 + sine(320 + r.random() * 30, .3) * ex(n, .035) * .5
    return stereo(x, r.random() * .5 - .25)
def s_burst():
    d = .45; x = np.zeros((int(d * SR), 2))
    for j in range(12): f = 1500 + rng.random() * 4000; st = rng.random() * .3; y = sine(f, .06) * ex(int(.06 * SR), .012) * .15; put_l = int(st * SR); x[put_l:put_l + len(y)] += stereo(y, rng.random() * 1.6 - .8)
    return x
def s_glitch():
    d = .1 + rng.random() * .2; n = int(d * SR); t = np.arange(n) / SR
    x = np.round(noise(n) * 3) / 3 * .3 + np.sign(np.sin(2 * np.pi * (200 + rng.random() * 900) * t)) * .2
    x *= (np.sin(2 * np.pi * 30 * t) > 0); x = np.repeat(x[::6], 6)[:n]; return stereo(fade(x, .002, .01), rng.random() - .5)
def s_shatter():
    d = 2.; n = int(d * SR); x = np.zeros((n, 2))
    for j in range(160):
        st = rng.random() ** 2.4 * 1.5; L = int(SR * (.04 + rng.random() * .25)); f = 2500 + rng.random() * 7000
        y = sine(f, L / SR) * ex(L, .03 + rng.random() * .06) * .12 * (1 - st / 1.6); i = int(st * SR); m = max(0, min(L, n - i)); x[i:i + m] += stereo(y[:m], rng.random() * 1.8 - .9)
    x += stereo(hp(noise(n), 2500) * ex(n, .12) * .7, 0, .01)
    return x
def s_crt_on():
    d = 1.2; n = int(d * SR); t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 60 * t) + .5 * np.sin(2 * np.pi * 120 * t)) * np.minimum(1, t / .4) * np.exp(-t / .8) * .3 + hp(noise(n), 3000) * ex(n, .02) * .8
    x += s_crackle(d, 30, 1000, 6000)[:, 0] * .4; return stereo(x)
def s_hum(d=3.):
    n = int(d * SR); t = np.arange(n) / SR; x = (np.sin(2 * np.pi * 60 * t) + .4 * np.sin(2 * np.pi * 180 * t) + .2 * np.sin(2 * np.pi * 300 * t)) * .12
    x += s_crackle(d, 8, 800, 3000, decay=False)[:, 0] * .5
    return stereo(fade(x, .4, .5))
def s_ignite():
    return s_whoosh(.9, 1800, 200) * .6 + np.pad(s_crackle(1.5, 50, 1500, 7000), ((0, 0), (0, 0)))[:int(.9 * SR)] * .6
def s_down(d=2.):
    n = int(d * SR); k = np.linspace(0, 1, n); x = sine(420 * 2 ** (-2.3 * k), d) * np.sin(np.pi * k) * .25 + sine(630 * 2 ** (-2.3 * k), d) * np.sin(np.pi * k) * .08
    return stereo(x)
def s_rise(d=1.):
    n = int(d * SR); k = np.linspace(0, 1, n); x = sine(220 * 2 ** (1.4 * k), d) * np.sin(np.pi * k * .5) * .2 + bp(noise(n), 500, 3000) * k * .2; return stereo(fade(x, .01, .05))
def s_pulse(d=3.):
    n = int(d * SR); x = np.zeros(n); step = 60 / 112 / 2
    for j in range(int(d / step)):
        i = int(j * step * SR); L = int(.12 * SR); y = (np.sin(2 * np.pi * midi(62 + [0, 7, 12, 7][j % 4]) * np.arange(L) / SR) * ex(L, .04)) * .15; x[i:i + L] += y[:max(0, min(L, n - i))]
    return stereo(lp(x, 3000))
def s_swell(d=2.):
    n = int(d * SR); k = np.linspace(0, 1, n); e = np.sin(np.pi * np.minimum(1, k / .75) * .5) ** 2 * np.minimum(1, (1 - k) / .25)
    x = np.zeros(n)
    for m in [50, 57, 62, 65, 69]: x += sum(np.sin(2 * np.pi * midi(m) * (1 + dd) * np.arange(n) / SR) for dd in (-.003, .003)) * .06
    x = lp(x, 2500) * e + bp(noise(n), 400, 4000) * e * .15; return stereo(x, 0, .015)
def s_click(): a = s_key(5) * 1.2; out = a.copy(); i = int(.07 * SR); out[i:] += a[:-i] * .8; return out

KIND = {'whoosh': lambda e: s_whoosh(e.get('d', 1)), 'whip': lambda e: s_whip(), 'riser': lambda e: s_riser(e.get('d', 2)), 'suck': lambda e: s_suck(e.get('d', 1)),
        'boom': lambda e: s_boom(), 'impact': lambda e: s_impact(), 'slice': lambda e: s_slice(), 'sparks': lambda e: s_sparks(e.get('d', 2)), 'crackle': lambda e: s_crackle(e.get('d', 2), 40, 1200, 6000) * .8,
        'shimmer': lambda e: s_shimmer(e.get('d', 2)), 'ice': lambda e: s_ice(e.get('d', 2)), 'wind': lambda e: s_wind(e.get('d', 4)), 'flash': lambda e: s_flash(), 'paper': lambda e: s_paper(),
        'marker': lambda e: s_marker(), 'key': lambda e: s_key(int(e['t'] * 1000)), 'type': lambda e: s_type(int(e['t'] * 1000)), 'teletype': lambda e: s_teletype(int(e['t'] * 1000)),
        'term': lambda e: s_term(int(e['t'] * 1000)), 'tick': lambda e: s_tick(e.get('f', 1800)), 'blip': lambda e: s_blip(e.get('f', 880)), 'beep': lambda e: s_beep(), 'bell': lambda e: s_bell(),
        'chime': lambda e: s_chime(), 'thud': lambda e: s_thud(), 'clack': lambda e: s_clack(int(e['t'] * 1000)), 'stone': lambda e: s_stone(int(e['t'] * 1000)), 'burst': lambda e: s_burst(),
        'glitch': lambda e: s_glitch(), 'shatter': lambda e: s_shatter(), 'crt_on': lambda e: s_crt_on(), 'hum': lambda e: s_hum(e.get('d', 3)), 'ignite': lambda e: s_ignite(),
        'down': lambda e: s_down(e.get('d', 2)), 'rise': lambda e: s_rise(e.get('d', 1)), 'pulse': lambda e: s_pulse(e.get('d', 3)), 'swell': lambda e: s_swell(e.get('d', 2)), 'click': lambda e: s_click()}

def build_sfx():
    buf = np.zeros((N, 2)); miss = set()
    for e in EV:
        f = KIND.get(e['kind'])
        if not f: miss.add(e['kind']); continue
        put(buf, e['t'], f(e), e.get('g', 1))
    if miss: print('没有合成器的音效：', miss)
    return buf

# ---------------- 配乐（D 小调，84 BPM，按年代换配器） ----------------
BPM = 84; BEAT = 60 / BPM; BAR = BEAT * 4
CH = {'Dm': [50, 57, 62, 65, 69], 'Bb': [46, 53, 58, 62, 65], 'F': [41, 53, 57, 60, 65], 'C': [48, 55, 60, 64, 67], 'Gm': [43, 50, 55, 58, 62],
      'A': [45, 52, 57, 61, 64], 'Dsus': [50, 57, 62, 64, 69], 'D': [50, 57, 62, 66, 69], 'Eb': [51, 58, 63, 67, 70], 'Am': [45, 52, 57, 60, 64]}
WARM, TENSE, EIGHT, HOPE, END = ['Dm', 'Bb', 'F', 'C'], ['Dm', 'Gm', 'A', 'Dm'], ['Dm', 'Bb', 'C', 'Am'], ['F', 'C', 'Dm', 'Bb'], ['Bb', 'F', 'C', 'Dm']
def chord_at(prog, t0, t, bars=2): return CH[prog[int((t - t0) // (BAR * bars)) % len(prog)]]
def env_win(n, fi, fo):
    e = np.ones(n); a, b = min(n, int(fi * SR)), min(n, int(fo * SR))
    if a: e[:a] = np.linspace(0, 1, a) ** 2
    if b: e[-b:] *= np.linspace(1, 0, b) ** 2
    return e
def pad(buf, t0, t1, prog, cut=1800, g=.18, oct=0, fi=2., fo=2., bars=2, top=5):
    """弦乐式铺底：每个音 = 两个微微走音的「软锯齿」（前 10 个泛音），换和弦时交叉淡化"""
    seg = BAR * bars; t = t0
    while t < t1:
        d = min(seg + 1.2, t1 - t + .01); n = int(d * SR); tt = np.arange(n) / SR; x = np.zeros((n, 2))
        for j, m in enumerate(chord_at(prog, t0, t + .01, bars)[:top]):
            f = midi(m + 12 * oct)
            for side, det in ((0, -.004), (1, .004)):
                v = np.zeros(n)
                for h in range(1, 11):
                    if f * h > cut * 1.6: break
                    v += np.sin(2 * np.pi * f * (1 + det) * h * tt + j + h) / h
                x[:, side] += v * (1 if j else .8)
        e = np.minimum(1, tt / 1.0) * np.minimum(1, (d - tt) / 1.0)
        x = np.stack([lp(x[:, 0], cut), lp(x[:, 1], cut)], 1) * e[:, None] * g / 5
        put(buf, t, x * env_win(n, fi if t == t0 else 0, fo if t + seg >= t1 else 0)[:, None])
        t += seg
def piano(buf, t0, t1, prog, g=.22, mode='arp', bars=2, seed=1, oct=0, fi=0., fo=1.5):
    r = np.random.default_rng(seed); step = BEAT / 2 if mode == 'arp' else BEAT * 2; k = 0; t = t0
    while t < t1 - .05:
        notes = chord_at(prog, t0, t, bars)
        if mode == 'arp': m = notes[[1, 2, 3, 4, 3, 2, 1, 2][k % 8]] + 12 + 12 * oct
        else:
            if r.random() < .35: t += step; k += 1; continue
            m = r.choice(notes[2:]) + 12 + 12 * oct
        d = 2.4; n = int(d * SR); f = midi(m); tt = np.arange(n) / SR
        v = (np.sin(2 * np.pi * f * tt) + .35 * np.sin(2 * np.pi * 2.003 * f * tt) * np.exp(-tt / .4) + .12 * np.sin(2 * np.pi * 3.01 * f * tt) * np.exp(-tt / .2)) * np.exp(-tt / (.9 if mode == 'arp' else 1.6)) * np.minimum(1, tt / .004)
        vel = .7 + .3 * r.random(); ramp = min(1, (t - t0) / max(fi, 1e-3)) if fi else 1; ramp *= min(1, (t1 - t) / fo)
        put(buf, t, stereo(v * vel * ramp * g, (m - 72) / 30))
        t += step; k += 1
def arp(buf, t0, t1, prog, g=.12, rate=4, wave='sq', cut=2400, bars=2, fi=1., fo=1., oct=1):
    step = BEAT / rate; k = 0; t = t0
    pat = [0, 2, 1, 3, 2, 4, 3, 1]
    while t < t1 - .02:
        notes = chord_at(prog, t0, t, bars); m = notes[1:][pat[k % 8] % 4] + 12 * oct; f = midi(m); L = int(step * 1.6 * SR); tt = np.arange(L) / SR
        v = (np.tanh(2.5 * np.sin(2 * np.pi * f * tt)) if wave == 'sq' else np.sin(2 * np.pi * f * tt) + .25 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt / (step * .7)) * np.minimum(1, tt / .002)
        if wave == 'sq': v = lp(v, cut)
        ramp = min(1, (t - t0) / fi) * min(1, (t1 - t) / fo)
        put(buf, t, stereo(v * g * ramp, .35 * np.sin(k * .7)))
        t += step; k += 1
def pulse(buf, t0, t1, g=.3, every=1., fi=1., fo=1., f0=55):
    t = t0
    while t < t1 - .05:
        L = int(.5 * SR); tt = np.arange(L) / SR; v = np.sin(2 * np.pi * (f0 + 50 * np.exp(-tt / .02)) * tt) * np.exp(-tt / .14)
        ramp = min(1, (t - t0) / fi) * min(1, (t1 - t) / fo); put(buf, t, stereo(v * g * ramp)); t += BEAT * every
def drone(buf, t0, t1, notes, g=.12, fi=2., fo=2., cold=False):
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; x = np.zeros((n, 2))
    for j, m in enumerate(notes):
        f = midi(m); lfo = .7 + .3 * np.sin(2 * np.pi * (.05 + .03 * j) * tt + j)
        for side, det in ((0, -.002), (1, .002)): x[:, side] += np.sin(2 * np.pi * f * (1 + det) * tt + j) * lfo * (.6 if m > 70 else 1)
    if cold:
        for side in (0, 1): x[:, side] += sweep_bp(noise(n), 2600 + 900 * np.sin(2 * np.pi * .05 * tt + side), 2.) * .5
    put(buf, t0, x * env_win(n, fi, fo)[:, None] * g / len(notes))

def build_bgm():
    b = np.zeros((N, 2))
    cw0 = lambda i: c(i)
    tTitle = c('c5b') + CUES['c5b']['d'] + 1.7       # 片名闪出（open.js：tTitle0 + 1）
    # 冷开场：钢琴零星几个音 → 「过亿」时铺底升起；倒带：低音持续 + 心跳，1969 前一拍收住
    piano(b, .6, c('c3'), WARM, .2, 'sparse', seed=3, fo=1)
    pad(b, c('c2'), c('c3') + 2, WARM, 1400, .14, fi=1.5, fo=2)
    drone(b, c('c3'), c('c5b') + 1.2, [26, 38, 45], .5, 2, .6)
    pulse(b, c('c4'), c('c5b') + .9, .35, 1, 2, .3, 48)
    # 片名 → 一至三章（50 年代）：温暖的弦乐 + 钢琴分解和弦
    pad(b, tTitle - .2, ce('d8') + 1.5, WARM, 1700, .2, fi=.3, fo=2.5)
    piano(b, c('a1') - .5, c('a6') + 2, WARM, .14, 'arp', seed=5, fi=2, fo=2)
    piano(b, c('b1'), ce('d8'), WARM, .12, 'sparse', seed=6)
    arp(b, c('d2'), ce('d6'), WARM, .05, 2, 'sine', fi=3, fo=3)
    # 四 · 第一次寒冬：紧张 → 1969 切断后只剩冷色长音和风
    tCut4 = [e['t'] for e in EV if e['kind'] == 'slice'][1]          # 1969 切断（ch45 登记的音效时间，和画面同一个时刻）
    pad(b, c('w1') - 3, tCut4, TENSE, 1300, .2, fi=2, fo=.3, bars=1)
    drone(b, tCut4, c('x1') - 1.5, [38, 74, 76, 81], .55, .4, 3, cold=True)
    piano(b, c('w5'), ce('w5') + 1, ['Dm'], .1, 'sparse', seed=9, oct=1)
    # 五 · 专家系统：80 年代合成器琶音 + 底鼓 → 1987 崩盘一刀切 → 第二次寒冬
    tCrash = next(e['t'] for e in EV if e['kind'] == 'shatter')
    arp(b, c('x1') - 1.2, tCrash, EIGHT, .1, 4, 'sq', 2200, fi=2, fo=.05)
    pad(b, c('x1') - 1.2, tCrash, EIGHT, 1500, .14, fi=2, fo=.05)
    pulse(b, c('x3'), tCrash, .3, 1, 2, .05)
    drone(b, tCrash + .3, c('y1') - 1, [38, 74, 77, 81], .55, 1.5, 2.5, cold=True)
    # 六 · 火种：钢琴一个音一个音把它暖起来
    piano(b, c('y1') - 1.5, ce('y7'), HOPE, .16, 'sparse', seed=11, fi=4)
    pad(b, c('y2'), ce('y7') + 1, HOPE, 1200, .12, fi=4, fo=2)
    arp(b, c('y3'), c('y5'), HOPE, .05, 2, 'sine', fi=2, fo=2)
    # 七 · 深蓝：低音八分律动 + 紧张和声
    pad(b, c('z1') - 1.5, ce('z4') + 1.5, TENSE, 1400, .16, fi=1.5, fo=2, bars=1)
    pulse(b, c('z1'), ce('z4'), .22, .5, 1.5, 1, 60)
    # 八 · 数据和显卡：一层层叠上去，2012 一声炸开后全力推进
    tBoom = next(e['t'] for e in EV if e['kind'] == 'sparks' and e['t'] > c('g1'))
    pad(b, c('g1') - 1.5, c('h1') - 1, WARM, 1600, .17, fi=2, fo=2)
    pulse(b, c('g4'), tBoom, .26, 1, 3, .1)
    arp(b, c('g5'), c('h1') - 1, WARM, .08, 4, 'sine', fi=2, fo=2, oct=1)
    pad(b, tBoom, c('h1') - 1, WARM, 3200, .12, fi=.05, fo=2, oct=1)
    pulse(b, tBoom, c('h1') - 1.5, .32, .5, .05, 1.5)
    # 九 · 第 37 手：悬着 → 落子前一秒几乎静下来 → 之后希望的和声升起
    t37 = next(e['t'] for e in EV if e['kind'] == 'stone' and e.get('g') == 1.2)
    drone(b, c('h1') - 1, t37 - .9, [38, 50, 57], .4, 2, .8)
    piano(b, c('h2'), t37 - 1.2, TENSE, .1, 'sparse', seed=13)
    pad(b, t37 + .3, ce('h7') + 1.5, HOPE, 2200, .2, fi=1.2, fo=2)
    piano(b, t37 + 2, ce('h7'), HOPE, .12, 'arp', seed=14, fi=2)
    # 十、十一：注意力 + 越大越强——推进
    pad(b, c('t1') - 1.5, c('n1') - 1.5, WARM, 2000, .16, fi=2, fo=2)
    arp(b, c('t2'), c('n1') - 1.5, WARM, .08, 4, 'sine', fi=3, fo=2, oct=1)
    pulse(b, c('t4'), c('s6') - .5, .27, 1, 3, 1)
    pulse(b, c('s4'), c('s6') - .5, .18, .5, 2, 1, 70)
    pad(b, c('s7') - .3, c('n1') - 1.5, HOPE, 3000, .12, fi=1, fo=2, oct=1)
    # 十二 · 领奖台：希望的和声 + 钢琴旋律
    pad(b, c('n1') - 1.5, c('e1') - 1, HOPE, 1800, .22, fi=2, fo=2)
    piano(b, c('n1'), c('e1') - 1, HOPE, .15, 'arp', seed=17, fi=2)
    # 尾声：回想 → 论文最后一句时几乎只剩钢琴 → 光跑过七十年，铺底一路涨上去 → 片名：D 大调落定
    tE8 = c('e8'); tF0 = tE8 - .3; tTitleEnd = tE8 + 5.0
    pad(b, c('e1') - 1, tF0, END, 1300, .14, fi=2, fo=1.5)
    piano(b, c('e1'), c('e6'), END, .12, 'sparse', seed=19)
    piano(b, c('e6'), tF0, ['Dm'], .1, 'sparse', seed=21, oct=1)
    pad(b, tF0, tTitleEnd, ['Bb', 'C'], 2600, .22, fi=1.2, fo=.4, bars=1)
    arp(b, tF0 + .4, tTitleEnd, ['Bb', 'C'], .08, 4, 'sine', fi=2, fo=.3, bars=1, oct=1)
    pad(b, tTitleEnd - .05, DUR + .5, ['D'], 3000, .28, fi=.05, fo=4, bars=8, top=5)
    pad(b, tTitleEnd - .05, DUR + .5, ['D'], 4000, .1, fi=.05, fo=4, bars=8, oct=1)
    return b

def reverb(x, sec=2.4, mix=.25):
    n = int(sec * SR); ir = noise(n, 7) * np.exp(-np.arange(n) / SR / (sec / 5)); ir = lp(ir, 6000); ir /= np.sqrt((ir ** 2).sum())
    wet = np.stack([oaconvolve(x[:, 0], ir)[:len(x)], oaconvolve(x[:, 1], np.roll(ir, 211))[:len(x)]], 1)
    return x * (1 - mix) + wet * mix * 1.4

def load_vo():
    v = np.zeros(N)
    for id_, cu in CUES.items():
        f = os.path.join(ROOT, '配音', '正片', id_ + '.mp3')
        if not os.path.exists(f): print('缺口播：', id_); continue
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
        a = np.frombuffer(raw, np.float32).astype(np.float64); i = int(cu['s'] * SR); n = min(len(a), N - i); v[i:i + n] += a[:n]
    return v
def duck_gain(vo, depth=.55):
    """人声在说话时把配乐压低（10 ms 一帧算响度，起 80 ms、放 450 ms）"""
    hop = SR // 100; fr = np.sqrt(np.add.reduceat(vo ** 2, np.arange(0, len(vo), hop)) / hop)
    on = np.clip((fr - .01) / .04, 0, 1); g = np.zeros_like(on); s = 0.
    for i, x in enumerate(on): s += (x - s) * (.12 if x > s else .022); g[i] = s
    return np.interp(np.arange(len(vo)) / hop, np.arange(len(g)), 1 - depth * g)

def write(path, x, br='320k'):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    p = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', br, path], input=x.astype(np.float32).tobytes(), check=True)

if __name__ == '__main__':
    print('口播…'); vo = load_vo()
    print('音效…', len(EV), '条'); fx = reverb(build_sfx(), 1.8, .22)
    print('配乐…'); mu = reverb(build_bgm(), 2.8, .35)
    duck = duck_gain(vo)[:, None]
    VO, MU, FX = stereo(vo), mu * duck * .5, fx * .55 * (1 - .4 * (1 - duck) / .55)   # 说话时音效也让出约 4 dB
    mix = VO + MU + FX
    pk = np.abs(mix).max(); print('峰值', round(pk, 3))
    mix = np.tanh(mix / max(pk, 1) * 1.2) / np.tanh(1.2) * .95 if pk > .95 else mix   # 软限幅，防削顶
    out = os.path.join(ROOT, '配音')
    tmp = os.path.join(out, '_mix.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', tmp], input=mix.astype(np.float32).tobytes(), check=True)
    # 整片响度对到 -14 LUFS（短视频平台常用），真峰值 ≤ -1 dBTP
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-14:LRA=11:TP=-1', '-ar', str(SR), '-c:a', 'libmp3lame', '-b:a', '320k', os.path.join(out, '成片混音.mp3')], check=True)
    os.remove(tmp)
    sc = 1 / max(pk, 1)   # 分轨按混音里的实际电平导出：三轨相加 = 成片（响度标准化之前），方便自己再调比例
    for name, x in (('口播', VO), ('配乐', MU), ('音效', FX)):
        write(os.path.join(out, '分轨', name + '.mp3'), x * sc, '192k'); r = np.sqrt((x ** 2).mean()) + 1e-9; print(f'  {name}: 平均 {20 * np.log10(r):.1f} dBFS')
    print('完成：配音/成片混音.mp3 + 配音/分轨/')

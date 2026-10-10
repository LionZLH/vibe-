# 口播句子 → 起止时间。口播文本自动读 ../口播稿_v2.md（Gemini 3.8 Flash 润色 + 事实修正版）；画面全部按这张表定时。
# 还没配音：时长按 RATE 字/秒估算（数字/英文每段按 1.6 字）。配音后把实测时长写进 配音/timing.json 自动改用实测。
# EXTRA：这句念完后多留的秒数（给只有画面的段落）；PRE：这句之前空出的秒数（片名、章节转场）。
import re, json, os
HERE = os.path.dirname(__file__)
def _sent():
    t = open(os.path.join(HERE, '..', '口播稿_v2.md')).read().split('## 在 Gemini')[0]
    return re.findall(r'^- \*\*(\w+)\*\* (.+)$', t, re.M)
EXTRA = {'c1': 1.8, 'c2': 1.6, 'c3': .4, 'c4': .6, 'c5b': 1.0, 'a2': 1.6, 'a4': 2.6, 'a5': 1.2, 'a6': 2.2,
         'b2': 1.0, 'b3': 1.0, 'b5': 1.0, 'd3': .8, 'd4': 1.6, 'd5': 1.0, 'd6': 1.6, 'd8': 1.4,
         'w3': 1.8, 'w5': 1.6, 'w6': 1.0, 'w8': 1.2, 'w9': 1.6, 'x2': .6, 'x3': 1.0, 'x5': 1.0, 'x6': 1.4, 'x7': 1.4,
         'y1': .6, 'y4': 1.6, 'y6': 1.2, 'y7': 1.0, 'z1': 1.0, 'z3': 1.2, 'z4': 1.0,
         'g3': 1.0, 'g4': 1.0, 'g6': 1.4, 'g8': 1.2, 'h1': .6, 'h2': .8, 'h4': 1.8, 'h5': 1.0, 'h7': 1.6,
         't1': .8, 't3': 1.4, 't5': 1.0, 's4': 1.4, 's5': 1.0, 's7': 1.6, 'n2': .8, 'n3': 1.8, 'e2': 1.0, 'e3': .8, 'e5': .8, 'e7': 2.2}
PRE = {'a1': 4.6, 'b1': 2.4, 'd1': 2.2, 'w1': 2.4, 'x1': 2.4, 'y1': 2.2, 'z1': 2.2, 'g1': 2.4, 'h1': 2.4, 't1': 2.2, 's1': 2.0, 'n1': 2.2, 'e1': 2.2}
RATE, GAP, HEAD, TAIL = 4.6, 0.28, 1.2, 4.0
def nch(s): return len(re.findall(r'[一-鿿]', s)) + 1.6 * len(re.findall(r'[0-9.%]+|[A-Za-z][A-Za-z-]*', s))
def _timing():
    p = os.path.join(HERE, '..', '配音', 'timing.json')
    return json.load(open(p)) if os.path.exists(p) else {}
def cues():
    T = _timing(); t = HEAD; out = {}
    for id_, text in _sent():
        t += PRE.get(id_, 0)
        d = T[id_]['d'] if id_ in T else round(nch(text) / RATE + .12, 2)
        out[id_] = {'s': round(t, 3), 'd': round(d, 3), 'text': text}
        if id_ in T and 'ch' in T[id_]: out[id_]['ch'] = T[id_]['ch']
        t += d + GAP + EXTRA.get(id_, 0)
    return out
def duration():
    c = cues(); last = list(c.values())[-1]
    return round(last['s'] + last['d'] + TAIL, 2)
if __name__ == '__main__':
    for k, v in cues().items(): print(f"{k:4s} {v['s']:7.2f}  d={v['d']:5.2f}  {v['text'][:30]}")
    print('总时长', duration(), '秒', '(估算)' if not _timing() else '(实测)')

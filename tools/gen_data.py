# 生成 data/cues.js（口播时间表 + 总时长）。改口播后：python3 tools/gen_data.py
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
import cues
root = os.path.join(os.path.dirname(__file__), '..'); os.makedirs(os.path.join(root, 'data'), exist_ok=True)
open(os.path.join(root, 'data', 'cues.js'), 'w').write('window.CUES = %s;\nwindow.DUR = %s;\n' % (json.dumps(cues.cues(), ensure_ascii=False), cues.duration()))
print('data/cues.js 已生成；总时长', cues.duration(), '秒')

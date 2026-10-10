# 给照片估深度（Depth Anything V2 small，ONNX），输出同名 _depth.png（8 位灰度，白=近）。
# 用法：<venv>/bin/python -I tools/depth.py 模型.onnx 输入图 输出图 [最长边]
import sys, numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
model, src, dst = sys.argv[1:4]; long = int(sys.argv[4]) if len(sys.argv) > 4 else 2048
im = Image.open(src).convert('RGB')
if max(im.size) > long: im.thumbnail((long, long), Image.LANCZOS)
im.save(dst, quality=95)                                    # 规格化后的彩图（和深度图同尺寸）
W, H = im.size; s = 518 / max(W, H); w, h = max(14, round(W * s / 14) * 14), max(14, round(H * s / 14) * 14)
x = np.asarray(im.resize((w, h), Image.BICUBIC), np.float32) / 255
x = ((x - [.485, .456, .406]) / [.229, .224, .225]).transpose(2, 0, 1)[None].astype(np.float32)
sess = ort.InferenceSession(model, providers=['CPUExecutionProvider'])
d = sess.run(None, {sess.get_inputs()[0].name: x})[0].squeeze()
d = (d - d.min()) / (d.max() - d.min() + 1e-6)
dm = Image.fromarray((d * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
dm.save(dst.rsplit('.', 1)[0] + '_depth.png'); print(dst, W, H)

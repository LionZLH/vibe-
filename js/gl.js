/* WebGL 底座：一个渲染器 + 一个场景 + 一台相机；后期 = 景深 → 辉光 → 调色（饱和度 / 色调 / 结霜 / 方向模糊 / 色差 / 闪白）→ 输出。
   各镜头每帧写 CAM / G，render() 统一出图。 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export { THREE };

const canvas = document.getElementById('gl');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(1920, 1080, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0a08);
export const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 6000);
export const MAXANISO = renderer.capabilities.getMaxAnisotropy();

/* 相机状态：位置 + 看向 + 视角 + 滚转 */
export const CAM = { x: 0, y: 0, z: 30, tx: 0, ty: 0, tz: 0, fov: 35, roll: 0 };
/* 调色状态（每帧由当前镜头整组写入） */
export const G = { sat: 1, tint: [1, 1, 1], contrast: 1, lift: 0, expo: 1, frost: 0, blur: [0, 0], ca: 0, fade: 0, flash: 0, bloom: .55, streak: 0, streakTint: [1, .78, .45], scurve: .35, focus: 30, aperture: 0, maxblur: .012, bg: [0.047, 0.039, 0.031] };
export const G0 = JSON.parse(JSON.stringify(G));
export const resetG = () => Object.assign(G, JSON.parse(JSON.stringify(G0)));

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1920, 1080, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(1); composer.setSize(1920, 1080);
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 30, aperture: 0.0, maxblur: 0.012 });
composer.addPass(bokeh);
const bloom = new UnrealBloomPass(new THREE.Vector2(1920, 1080), .55, .45, 1.0);
composer.addPass(bloom);

const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uSat: { value: 1 }, uTint: { value: new THREE.Vector3(1, 1, 1) }, uContrast: { value: 1 }, uLift: { value: 0 }, uExpo: { value: 1 },
    uFrost: { value: 0 }, uBlur: { value: new THREE.Vector2() }, uCA: { value: 0 }, uFade: { value: 0 }, uFlash: { value: 0 }, uTime: { value: 0 }, uStreak: { value: 0 }, uStreakTint: { value: new THREE.Vector3(1, .78, .45) }, uS: { value: .35 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uSat, uContrast, uLift, uExpo, uFrost, uCA, uFade, uFlash, uTime, uStreak, uS; uniform vec3 uTint, uStreakTint; uniform vec2 uBlur; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
    float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= .5; } return v; }
    vec2 vor(vec2 p){ vec2 n = floor(p), f = fract(p); float m1 = 8., m2 = 8.;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){ vec2 g = vec2(float(i), float(j)); vec2 o = vec2(hash(n + g), hash(n + g + 19.7)); vec2 r = g + o - f; float d = dot(r, r);
        if (d < m1){ m2 = m1; m1 = d; } else if (d < m2) m2 = d; }
      return vec2(sqrt(m1), sqrt(m2)); }
    vec3 tap(vec2 uv){
      vec3 c;
      if (uCA > 0.){ vec2 d = (uv - .5) * uCA; c = vec3(texture2D(tDiffuse, uv + d).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - d).b); }
      else c = texture2D(tDiffuse, uv).rgb;
      return c; }
    vec3 blurTap(vec2 uv){
      if (dot(uBlur, uBlur) < 1e-10) return tap(uv);
      vec3 s = vec3(0.); for (int i = 0; i < 24; i++){ float k = float(i) / 23. - .5; s += tap(uv + uBlur * k); } return s / 24.; }
    void main(){
      vec2 uv = vUv; vec2 asp = vec2(16. / 9., 1.);
      /* 结霜：从四边往里长；冰晶格 + 细纹 + 折射 */
      float fm = 0.; vec2 off = vec2(0.);
      if (uFrost > 0.001){
        float edge = min(min(uv.x, 1. - uv.x) * 16. / 9., min(uv.y, 1. - uv.y));
        float n = fbm(uv * asp * 5.);
        fm = smoothstep(uFrost * .62 + .02, uFrost * .62 - .16, edge + (n - .5) * .32) * smoothstep(0., .08, uFrost);
        off = (vec2(fbm(uv * asp * 28. + 3.), fbm(uv * asp * 28. + 7.)) - .5) * .045 * fm;
      }
      vec3 col = blurTap(uv + off);
      if (fm > 0.){
        vec2 v = vor(uv * asp * 26. + fbm(uv * 7.) * 2.);
        float crack = 1. - smoothstep(0., .035, v.y - v.x);
        float needles = 0.;
        vec3 ice = vec3(.78, .9, 1.);
        col = mix(col, col * vec3(.72, .84, .96), fm * .8) + ice * crack * .32 * fm * fm;
      }
      /* 横向镜头光（变形宽银幕）：亮部向两侧拉出细长光痕 */
      if (uStreak > 0.){
        vec3 s = vec3(0.);
        for (int i = 1; i <= 32; i++){ float o = float(i) / 32.; float w = exp(-o * 5.);
          vec3 a = texture2D(tDiffuse, uv + vec2(o * .09, 0.)).rgb, b = texture2D(tDiffuse, uv - vec2(o * .09, 0.)).rgb;
          s += (max(a - 1.6, 0.) + max(b - 1.6, 0.)) * w; }
        col += s * uStreakTint * uStreak * .12;
      }
      col *= uExpo;
      float l = dot(col, vec3(.2126, .7152, .0722));
      col = mix(vec3(l), col, uSat) * uTint;
      /* 对比度 / S 曲线在感知空间里做（线性空间里做会把暗部压死） */
      vec3 hdr = max(col - 1., 0.);
      vec3 g = pow(clamp(col, 0., 1.), vec3(1. / 2.2));
      g = (g - .5) * uContrast + .5;
      g = clamp(g, 0., 1.); g = mix(g, g * g * (3. - 2. * g), uS);
      g = g + uLift * (1. - g);
      col = pow(g, vec3(2.2)) + hdr;
      col = mix(col, vec3(0.), uFade);
      col = mix(col, vec3(1., .97, .92), uFlash);
      gl_FragColor = vec4(max(col, 0.), 1.);
    }`,
};
const grade = new ShaderPass(GradeShader);
composer.addPass(grade);
composer.addPass(new OutputPass());

export function render(t) {
  camera.position.set(CAM.x, CAM.y, CAM.z);
  camera.up.set(Math.sin(CAM.roll), Math.cos(CAM.roll), 0);
  camera.lookAt(CAM.tx, CAM.ty, CAM.tz);
  if (camera.fov !== CAM.fov) { camera.fov = CAM.fov; camera.updateProjectionMatrix(); }
  scene.background.setRGB(G.bg[0], G.bg[1], G.bg[2], THREE.SRGBColorSpace);
  bokeh.enabled = G.aperture > 0;
  bokeh.uniforms.focus.value = G.focus; bokeh.uniforms.aperture.value = G.aperture; bokeh.uniforms.maxblur.value = G.maxblur;
  bloom.strength = G.bloom;
  const u = grade.uniforms;
  u.uSat.value = G.sat; u.uTint.value.set(...G.tint); u.uContrast.value = G.contrast; u.uLift.value = G.lift; u.uExpo.value = G.expo;
  u.uFrost.value = G.frost; u.uBlur.value.set(G.blur[0], G.blur[1]); u.uCA.value = G.ca; u.uFade.value = G.fade; u.uFlash.value = G.flash; u.uTime.value = t; u.uStreak.value = G.streak; u.uStreakTint.value.set(...G.streakTint); u.uS.value = G.scurve;
  composer.render();
}

/* ---------- 工具 ---------- */
const loader = new THREE.TextureLoader();
export const loadTex = (url, srgb = true) => new Promise((res, rej) => loader.load(url, tx => { if (srgb) tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = MAXANISO; res(tx); }, undefined, rej));
/* 画布 → 纹理（文字、纸张都这样画） */
export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); draw(g, w, h);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = MAXANISO; tx.generateMipmaps = true; tx.minFilter = THREE.LinearMipmapLinearFilter;
  tx.userData.canvas = cv; return tx;
}
/* 平面（贴图、可调透明度 / 饱和度 / 亮度） */
export function plane(tex, w, h, o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uOp: { value: o.opacity ?? 1 }, uSat: { value: o.sat ?? 1 }, uBright: { value: o.bright ?? 1 }, uTint: { value: new THREE.Vector3(...(o.tint || [1, 1, 1])) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uOp, uSat, uBright; uniform vec3 uTint; varying vec2 vUv;
      void main(){ vec4 c = texture2D(uMap, vUv); vec3 rgb = c.rgb; float l = dot(rgb, vec3(.2126,.7152,.0722)); rgb = mix(vec3(l), rgb, uSat) * uBright * uTint; gl_FragColor = vec4(rgb, c.a * uOp);
#include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: o.depthWrite ?? false, side: THREE.DoubleSide, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.userData.u = m.uniforms; return mesh;
}
/* 2.5D 照片：按深度图把网格顶出来，相机一动就有真实视差 */
export function depthPhoto(tex, dtex, w, h, o = {}) {
  const seg = o.seg || 220;
  const m = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uDepth: { value: dtex }, uDS: { value: o.depth ?? 1 }, uOp: { value: 1 }, uSat: { value: o.sat ?? 1 }, uBright: { value: 1 }, uTint: { value: new THREE.Vector3(...(o.tint || [1, 1, 1])) }, uVig: { value: o.vig ?? 0 }, uEdge: { value: o.edge ?? 0 } },
    vertexShader: `uniform sampler2D uDepth; uniform float uDS; varying vec2 vUv;
      void main(){ vUv = uv; float d = texture2D(uDepth, uv).r; vec3 p = position; p.z += (d - .5) * uDS; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uOp, uSat, uBright, uVig, uEdge; uniform vec3 uTint; varying vec2 vUv;
      void main(){ vec3 rgb = texture2D(uMap, vUv).rgb; float l = dot(rgb, vec3(.2126,.7152,.0722)); rgb = mix(vec3(l), rgb, uSat) * uBright * uTint;
        vec2 q = vUv - .5; float v = 1. - uVig * smoothstep(.25, .75, length(q)); float e = uEdge > 0. ? smoothstep(0., uEdge, min(vUv.x, 1. - vUv.x)) * smoothstep(0., uEdge, min(vUv.y, 1. - vUv.y)) : 1.; gl_FragColor = vec4(rgb * v, uOp * e);
#include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: true,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, seg, Math.round(seg * h / w)), m);
  mesh.userData.u = m.uniforms; return mesh;
}

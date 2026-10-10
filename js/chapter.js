/* 章节转场（主线）：每章开头沿时间轴往前飞到这一章的年份，年份 + 章名在轴上立起来，再甩进本章场景。
   左上角年份 HUD 全片共用（片名之后一直在）。 */
import { THREE, scene, CAM, G } from './gl.js';
import { F } from './film.js';
import { tl, c, CUES, COL, el, hidden, seg, lerp, clamp, E, track, shot, hash } from './core.js';
import { X, LANE, spineState } from './spine.js';
import { textMesh, mixP, LOOK } from './kit.js';
export const CH = [
  { id: 'b1', from: 1950.5, to: 1955, num: '二', name: '命名' },
  { id: 'd1', from: 1956, to: 1958, num: '三', name: '另一条路' },
  { id: 'w1', from: 1961, to: 1969, num: '四', name: '第一次寒冬' },
  { id: 'x1', from: 1974, to: 1980, num: '五', name: '专家系统' },
  { id: 'y1', from: 1991, to: 1986, num: '六', name: '寒冬里的火种' },
  { id: 'z1', from: 1989, to: 1997, num: '七', name: '深蓝' },
  { id: 'g1', from: 1999, to: 2010, num: '八', name: '数据和显卡' },
  { id: 'h1', from: 2012.5, to: 2016, num: '九', name: '第 37 手' },
  { id: 't1', from: 2016.3, to: 2017, num: '十', name: '注意力' },
  { id: 's1', from: 2017.3, to: 2018, num: '十一', name: '越大越强' },
  { id: 'n1', from: 2022.2, to: 2024, num: '十二', name: '领奖台' },
  { id: 'e1', from: 2024.3, to: 2025, num: '尾声', name: '前方' },
];
const PREV = { b1: 2.4, d1: 2.2, w1: 2.4, x1: 2.4, y1: 2.2, z1: 2.2, g1: 2.4, h1: 2.4, t1: 2.2, s1: 2.0, n1: 2.2, e1: 2.2 };
CH.forEach(ch => { ch.t0 = c(ch.id) - PREV[ch.id] - .25; ch.t1 = c(ch.id) + 1.1; });
export const chapterAt = id => CH.find(x => x.id === id);
/* 章名牌：年份（琥珀大字）+ 「二 · 命名」 */
CH.forEach(ch => {
  const g = new THREE.Group(); g.position.set(X(ch.to), 8.5, 1); scene.add(g);
  const y = textMesh(String(ch.to), 5.2, { color: '#f2b33d', font: '900 200px SourceHanSerif' }); y.position.y = 2.2; g.add(y);
  const n = textMesh(`${ch.num} · ${ch.name}`, 2.1, { color: '#f4efe6', font: '700 200px SourceHanSerif', ls: 6 }); n.position.y = -1.6; g.add(n);
  g.visible = false; ch.card = g; ch.cy = y; ch.cn = n;
});
/* 全片 HUD */
const hud = el(null, `position:absolute;left:96px;top:58px;display:flex;align-items:center;gap:14px;font:700 40px/1 JBM;color:${COL.white};letter-spacing:3px`, '', { 'data-chk': 'text' });
el(hud, `position:relative;width:12px;height:12px;border-radius:50%;background:${COL.amber};box-shadow:0 0 12px ${COL.amber}`);
const hudY = el(hud, 'position:relative;font-variant-numeric:tabular-nums', '1950'); hidden(hud);
const hudName = el(hud, `position:relative;margin-left:10px;font:500 30px/1 PuHuiTi;color:${COL.mute};letter-spacing:1px`, '');
tl.to(hud, { opacity: 1, duration: .4 }, c('a1') + .6);
export const HUD = { year: 1950, name: '一 · 提问' };
/* 每帧（所有镜头之后）刷新 HUD 文本 */
export const hideCards = () => CH.forEach(o => o.card.visible = false);
export function hudFrame(t) {
  const cur = [...CH].reverse().find(ch => t >= ch.t0);
  if (cur && t < cur.t1) { const k = E.io3(seg(t, cur.t0 + .2, cur.t1 - .9)); HUD.year = Math.round(lerp(cur.from, cur.to, k)); HUD.name = `${cur.num} · ${cur.name}`; }
  else if (cur) { HUD.year = cur.to; HUD.name = `${cur.num} · ${cur.name}`; }
  else { HUD.year = 1950; HUD.name = '一 · 提问'; }
  hudY.textContent = HUD.year; hudName.textContent = HUD.name;
}
/* 转场镜头 */
const winterK = y => (y > 1973 && y < 1981) || (y > 1986.5 && y < 1994) ? 1 : 0;
CH.forEach((ch, i) => {
  const xs = track([[ch.t0, X(ch.from)], [ch.t1 - .9, X(ch.to)]]);
  shot({ name: 'ch-' + ch.id, t0: ch.t0, t1: ch.t1, look(t) {
    CH.forEach(o => o.card.visible = o === ch);
    const x = xs(t), v = (xs(t + .02) - xs(t - .02)) / .04;
    const fly = { x: x - 9, y: 5.4, z: 14, tx: x + 46, ty: -.6, tz: -1.5, fov: 38 + clamp(Math.abs(v) / 400) * 10, roll: .02 * Math.sign(v) * clamp(Math.abs(v) / 300) };
    /* 落定构图：时间轴在画面下方，章名牌在中上；镜头转正之后牌子才升起，不会被画面顶边切掉、也不压左上角的年份 */
    const side = { x: X(ch.to) + 1.5, y: 6.5, z: 34, tx: X(ch.to) + 1.5, ty: 7.2, tz: 0, fov: 35, roll: 0 };
    const kS = E.io3(seg(t, ch.t1 - 1.9, ch.t1 - .75));
    const cam = mixP(fly, side, kS);
    cam.x += .3 * Math.sin(t * .9); cam.y += .2 * Math.sin(t * 1.3);
    /* 离场：甩向右 */
    const out = E.i3(seg(t, ch.t1 - .35, ch.t1)); cam.tx += 30 * out; G.blur = [clamp(Math.abs(v) / 420) * .045 * (1 - kS) + .09 * out, 0];
    Object.assign(CAM, cam);
    const yr = 1950 + x / 10, old = clamp((1995 - yr) / 40);
    (yr < 1975 ? LOOK.silver : yr < 1995 ? LOOK.crt : LOOK.digital)(G, F);
    G.sat = 1; G.bg = [.03, .026, .022]; F.scratch *= .5; F.vig = .55;
    G.flash = .55 * (1 - E.o3(seg(t, ch.t0, ch.t0 + .35)));   // 从上一场景闪进来
    const wk = winterK(yr) * (yr < 1990 && ch.id === 'y1' ? 1 : 1);
    G.tint = [G.tint[0] - .1 * wk, G.tint[1], G.tint[2] + .08 * wk];
    spineState({ on: true, axis: 1, labels: 1, lanes: 1, ice: [ch.to > 1975 || ch.from > 1975 ? 1 : 0, ch.to > 1988 || ch.from > 1988 ? 1 : 0], iceDir: 1, cut: X(1969) < x + 30 && ch.to >= 1969 ? 1 : 0, cutLabel: 0, ember: ch.to >= 1969 && ch.to < 1986 ? 1 : ch.to >= 1986 ? 1 : 0, head: 0, origin: 1 });
    /* 章名牌：年份先升起，章名跟上 */
    const ky = E.o3(seg(t, ch.t1 - 1.2, ch.t1 - .62)), kn = E.o3(seg(t, ch.t1 - 1.0, ch.t1 - .45));
    ch.cy.userData.u.uOp.value = ky; ch.cy.position.y = 2.2 - (1 - ky) * 1.2;
    ch.cn.userData.u.uOp.value = kn; ch.cn.position.y = -1.6 - (1 - kn) * .8;
  } });
});

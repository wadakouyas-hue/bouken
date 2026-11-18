// がっそうの ミニゲーム: きょくに あわせて スネアを たたく(ひかる まるが わに きたら タップ)
import { charSprite, heroSprite, enemySprite } from './sprites.js';
import { equipLook } from './hero.js';
import { playBgm, bgmTime, sfx } from './audio.js';
import { rubyHTML } from './dialog.js';

const $ = id => document.getElementById(id);
export const concert = { on: false };
// ふめん(1しょうせつ = 16もじ、 x = たたく)。 さいしょの 2しょうせつは まえおき
const A = '....x.......x...', Bp = '....x.......x.x.', Q = 'x...x...x...x...', E = 'x...............';
// place: 'stage' = パルル町の ステージ、 'wedding' = モグの おみせの けっこんしき
const PIECES = {
  stage: { song: 'concert', bpm: 96, chart: ['', '', A, A, A, Bp, A, A, A, Q, A, A, Bp, A, A, A, Bp, Q, A, A, A, Q, E, ''] },
  wedding: { song: 'wedding', bpm: 92, chart: ['', '', A, A, A, Bp, A, A, A, Q, A, A, A, Bp, A, A, A, Q, A, A, Bp, A, A, A, Bp, Q, E, ''] },
};
export const stagePlace = { v: 'stage' };   // ステージの え(えんそうの あとの はなしの あいだも つかう)
let SONG = 'concert', SD = 60 / 96 / 4, BARS = 24;   // SD: 16ぶんおんぷ ひとつの びょうすう
const GOOD = 0.15, GREAT = 0.06;   // はんていの はば(びょう)
const SPEED = 90;                  // まるが うごく はやさ(ドット/びょう)
const HIT_X = 56, LANE_Y = 34;

let C = null;
export function startConcert(place = 'stage') {
  const P = PIECES[place]; stagePlace.v = place; SONG = P.song; SD = 60 / P.bpm / 4; BARS = P.chart.length;
  const notes = [];
  P.chart.forEach((p, b) => [...p].forEach((c, i) => { if (c === 'x') notes.push({ t: (b * 16 + i) * SD, judged: null }); }));
  return new Promise(res => {
    C = { notes, t: 0, msg: '', msgT: 0, ring: 0, pts: 0, great: 0, good: 0, miss: 0, done: res, beat: 0 };
    concert.on = true; playBgm(SONG); show();
  });
}
const now = () => { const a = bgmTime(SONG); return a != null ? a : C.t; };
function show() {
  const el = $('mini'); el.style.display = 'block';
  const hint = now() < 2 * 16 * SD ? 'ひかる まるが わに きたら タップ!' : '';
  el.innerHTML = `<div class="mcount">${C.great + C.good}<small>/ ${C.notes.length}</small></div>` + (hint ? `<div class="mhint">${rubyHTML(hint)}</div>` : '') + (C.msg ? `<div class="mpop">${rubyHTML(C.msg)}</div>` : '');
}
function pop(m) { C.msg = m; C.msgT = 0.5; show(); }
export function concertTap() {
  if (!C) return;
  sfx('snare'); C.ring = 0.15;
  const t = now();
  let best = null;
  for (const n of C.notes) if (!n.judged && Math.abs(n.t - t) <= GOOD && (!best || Math.abs(n.t - t) < Math.abs(best.t - t))) best = n;
  if (!best) return;
  const d = Math.abs(best.t - t);
  if (d <= GREAT) { best.judged = 'great'; C.great++; C.pts += 2; pop('ぴったり!'); }
  else { best.judged = 'good'; C.good++; C.pts += 1; pop('いいね!'); }
}
export function updateConcert(dt) {
  if (!C) return;
  C.t += dt; C.msgT -= dt; C.ring = Math.max(0, C.ring - dt);
  const t = now();
  for (const n of C.notes) if (!n.judged && t - n.t > GOOD) { n.judged = 'miss'; C.miss++; pop('あれれ'); }
  if (C.msgT <= 0 && C.msg) { C.msg = ''; show(); }
  else if (t < 2 * 16 * SD + 0.1) show();
  if (t > BARS * 16 * SD) {                       // おしまい
    const score = Math.round(C.pts / (C.notes.length * 2) * 100);
    const r = { score, great: C.great, good: C.good, miss: C.miss, total: C.notes.length };
    playBgm(''); concert.on = false; $('mini').style.display = 'none';
    const cb = C.done; C = null; cb(r);
  }
}
export const rankOf = s => s >= 90 ? 'さいこうの えんそう!' : s >= 70 ? 'すごい えんそう!' : s >= 40 ? 'いいかんじの えんそう!' : 'たのしい えんそう!';

// ===== ステージの え =====
const AUD = ['shop3', 'girl', 'paint', 'oba', 'oji', 'shop1', 'shop2', 'girl', 'shop3'];
const AUD_W = ['mfam', 'hfam', 'popo', 'mogu', 'pasha', 'oji', 'oba', 'girl', 'shop1'];
export function drawConcert(g, tm) {
  const t = C ? now() : tm, beat = Math.max(0, t) / (SD * 4), bounce = Math.round(Math.abs(Math.sin(beat * Math.PI)) * -2);
  const W = stagePlace.v === 'wedding';
  g.fillStyle = W ? '#f4e6cc' : '#1a1430'; g.fillRect(0, 0, 320, 200);
  g.fillStyle = W ? '#ecd8b4' : '#2a2048'; for (let x = 0; x < 320; x += 20) g.fillRect(x, 0, 10, 96);   // かべ
  // まく(けっこんしきは しろと ピンク)
  const c1 = W ? '#ffffff' : '#a8283a', c2 = W ? '#ffc8e0' : '#d8404e';
  g.fillStyle = c1; g.fillRect(0, 50, 28, 96); g.fillRect(292, 50, 28, 96);
  g.fillStyle = c2; for (let x = 4; x < 28; x += 8) { g.fillRect(x, 50, 2, 96); g.fillRect(296 + x - 4, 50, 2, 96); }
  g.fillStyle = c1; g.fillRect(0, 46, 320, 8); g.fillStyle = '#f2c230'; g.fillRect(0, 54, 320, 1);
  if (W) for (let i = 0; i < 16; i++) { const x = 10 + i * 20, y = 58 + Math.round(Math.sin(i / 15 * Math.PI) * 8); g.fillStyle = ['#ff8ad0', '#ffffff', '#ff5a6e', '#e8803a'][i % 4]; g.fillRect(x - 3, y - 3, 6, 6); g.fillStyle = '#ffd23f'; g.fillRect(x - 1, y - 1, 2, 2); }   // はなの かざり
  // ステージ
  g.fillStyle = '#b8783e'; g.fillRect(28, 96, 264, 50); g.fillStyle = '#8a5228'; for (let y = 102; y < 146; y += 6) g.fillRect(28, y, 264, 1);
  g.fillStyle = '#5a3418'; g.fillRect(28, 146, 264, 6);
  // スポットライト
  g.fillStyle = 'rgba(255,240,180,.13)';
  for (const [x, w] of [[90, 46], [160, 54], [230, 46]]) { g.beginPath(); g.moveTo(x - 6, 56); g.lineTo(x + 6, 56); g.lineTo(x + w / 2, 140); g.lineTo(x - w / 2, 140); g.fill(); }
  // えんそうする 3にん
  g.drawImage(charSprite('hamo', 'down', 0), 78, 98 + bounce, 24, 32);
  g.drawImage(heroSprite('down', 0, equipLook()), 148, 96 + bounce, 24, 32);
  g.fillStyle = '#e8e8f0'; g.fillRect(150, 122, 20, 8); g.fillStyle = '#c84a3a'; g.fillRect(150, 124, 20, 2); g.fillStyle = '#9a9aa8'; g.fillRect(152, 130, 2, 8); g.fillRect(166, 130, 2, 8);   // スネア
  g.fillStyle = '#5a5a66'; g.fillRect(229, 108, 2, 30); g.fillStyle = '#2a2a3a'; g.fillRect(227, 104, 6, 6);   // マイク
  g.drawImage(charSprite('melo', 'down', 0), 218, 98 + bounce, 24, 32);
  // おんぷ
  if (C) for (let i = 0; i < 3; i++) { const k = (beat * 0.5 + i / 3) % 1; g.fillStyle = ['#ffd23f', '#ff8ad0', '#7ac8ff'][i]; const x = 90 + i * 70 + Math.sin(k * 6 + i) * 8, y = 96 - k * 40; g.fillRect(x, y, 3, 3); g.fillRect(x + 2, y - 6, 1, 6); }
  // おきゃくさん(うしろすがた)と ミミズク
  (W ? AUD_W : AUD).forEach((p, i) => g.drawImage(charSprite(p, 'up', 0), 22 + i * 30, 160 + (Math.floor(beat + i) % 2 ? bounce : 0), 18, 24));
  g.drawImage(enemySprite('ミミズク'), 286, 150 + bounce, 24, 24);
  if (W) { g.drawImage(enemySprite('いたずらリス'), 2, 150 + bounce, 22, 22); }
  // レーン(たたく ところ)
  g.fillStyle = 'rgba(10,10,30,.75)'; g.fillRect(30, LANE_Y - 12, 270, 24);
  g.fillStyle = '#ffffff'; g.fillRect(30, LANE_Y, 270, 1);
  const rr = 9 + (C && C.ring > 0 ? 3 : 0);
  g.fillStyle = C && C.ring > 0 ? '#ffd23f' : '#ffffff';
  for (let a = 0; a < 28; a++) { const an = a / 28 * 6.283; g.fillRect(HIT_X + Math.round(Math.cos(an) * rr), LANE_Y + Math.round(Math.sin(an) * rr), 2, 2); }
  if (C) for (const n of C.notes) {
    if (n.judged === 'great' || n.judged === 'good') continue;
    const x = HIT_X + (n.t - t) * SPEED; if (x < 26 || x > 300) continue;
    g.fillStyle = n.judged === 'miss' ? '#6a6a7a' : '#ffd23f'; g.fillRect(Math.round(x) - 5, LANE_Y - 5, 10, 10);
    g.fillStyle = n.judged === 'miss' ? '#8a8a9a' : '#fff3a0'; g.fillRect(Math.round(x) - 3, LANE_Y - 3, 4, 4);
  }
}

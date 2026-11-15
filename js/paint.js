// ぬりえ(えかきの おてつだい)。 いろを えらんで、 えの ばしょを タップすると ぬれる
import { rubyHTML } from './dialog.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
export const paint = { open: false };
export const PW = 64, PH = 40;
// え の ばしょ(0 そら 1 たいよう 2 じめん 3 いえの かべ 4 やね 5 ドア 6 きの は 7 みき 8 はな 9 ねこ)
const NAMES = ['そら', 'たいよう', 'じめん', 'かべ', 'やね', 'ドア', 'きの は', 'みき', 'はな', 'ねこ'];
export const REGIONS = NAMES.length;
let LABEL = null;
function labels() {
  if (LABEL) return LABEL;
  LABEL = new Uint8Array(PW * PH);
  const inC = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    let l = y >= 31 ? 2 : 0;
    if (inC(x, y, 57, 6, 4)) l = 1;
    if (x >= 6 && x <= 25 && y >= 18 && y <= 31) l = 3;
    if (y >= 8 && y < 18 && Math.abs(x - 15.5) <= (y - 8) * 1.2 + 1) l = 4;
    if (x >= 13 && x <= 18 && y >= 23 && y <= 31) l = 5;
    if (x >= 44 && x <= 47 && y >= 24 && y <= 33) l = 7;
    if (inC(x, y, 45.5, 18, 8)) l = 6;
    if (inC(x, y, 33, 34, 2)) l = 8;
    if (inC(x, y, 56, 30, 4) || (y >= 24 && y <= 26 && (x >= 52 && x <= 54 && x - 52 <= y - 24 || x >= 58 && x <= 60 && 60 - x <= y - 24))) l = 9;   // ねこの かお と さんかくの みみ
    LABEL[y * PW + x] = l;
  }
  return LABEL;
}
// colors(10こ)で えを かく(g: canvas の 2d、 s: 1ドットの おおきさ)
export function drawPicture(g, colors, s = 1) {
  const L = labels();
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const l = L[y * PW + x], edge = (x + 1 < PW && L[y * PW + x + 1] !== l) || (y + 1 < PH && L[(y + 1) * PW + x] !== l);
    g.fillStyle = edge ? '#2a1e1a' : colors[l] || '#ffffff';
    g.fillRect(x * s, y * s, s, s);
  }
  // ねこの め(いつも くろ)
  g.fillStyle = '#2a1e1a'; g.fillRect(54 * s, 29 * s, s, s); g.fillRect(57 * s, 29 * s, s, s);
}

// えの ちいさい ばん(かぐの 「え」 で つかう): fx, fy(0〜1)の いろ
export function colorAt(colors, fx, fy) { const x = Math.min(PW - 1, fx * PW | 0), y = Math.min(PH - 1, fy * PH | 0); return colors[labels()[y * PW + x]] || '#ffffff'; }
const PALETTE = ['#e04848', '#ff9a3a', '#ffd23f', '#6cc24a', '#2f8a3a', '#7ac8ff', '#3a5ad8', '#9a5ac8', '#f5a8cf', '#8a5a2a', '#9a9aa8', '#ffffff'];
let P = null;   // { colors, pick, onDone }
export function openPaint(colors, onDone) {
  P = { colors: colors && colors.length === REGIONS ? [...colors] : Array(REGIONS).fill('#ffffff'), pick: PALETTE[0], onDone };
  paint.open = true; $('paint').style.display = 'flex'; render();
}
function close(result) { paint.open = false; $('paint').style.display = 'none'; const cb = P.onDone; P = null; if (cb) cb(result); }
// ボタン(data-p)
export function paintTap(k) {
  if (!P) return;
  if (k === '#done') { sfx('get'); close(P.colors); return; }
  if (k === '#close') { sfx('next'); close(null); return; }
  if (k.startsWith('c:')) { P.pick = k.slice(2); sfx('next'); render(); }
}
// えの うえを タップ(fx, fy: えの なかの 0〜1 の いち)
export function paintAt(fx, fy) {
  if (!P) return;
  const x = Math.floor(fx * PW), y = Math.floor(fy * PH);
  if (x < 0 || y < 0 || x >= PW || y >= PH) return;
  const l = labels()[y * PW + x];
  P.colors[l] = P.pick; sfx('ok'); draw();
}
function draw() { const cv = $('paintcv'); if (!cv) return; const g = cv.getContext('2d'); drawPicture(g, P.colors, 4); }
function render() {
  $('paint').innerHTML = `<div class="ptop">${rubyHTML('すきな いろを えらんで、 えを タップしてね')}</div>` +
    `<div class="pmain"><canvas id="paintcv" width="${PW * 4}" height="${PH * 4}"></canvas>` +
    `<div class="ppal">${PALETTE.map(c => `<button data-p="c:${c}" class="${c === P.pick ? 'on' : ''}" style="background:${c}"></button>`).join('')}</div></div>` +
    `<div class="pfoot"><button data-p="#close">やめる</button><button data-p="#done" class="go">できた!</button></div>`;
  draw();
}

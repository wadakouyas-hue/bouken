// 第4章 おまつりの じゅんびの ミニゲーム
//  しゃしん: こっちを みた ときに 「にっこり!」で えがおの しゃしん(パシャ)
//  りょうり: レシピを よんで、 じゅんばんに ざいりょうを えらんで オムライスを つくる(モグ)
import { charSprite, heroSprite } from './sprites.js';
import { equipLook } from './hero.js';
import { sfx } from './audio.js';
import { rubyHTML } from './dialog.js';

const $ = id => document.getElementById(id);
export const fest = { on: false };
let F = null;
const close = () => { fest.on = false; $('fest').style.display = 'none'; const cb = F.done, r = F.result; F = null; cb(r); };
const btn = (k, label, cls = '') => `<button data-f="${k}" class="${cls}">${rubyHTML(label)}</button>`;

// ===== しゃしん =====
const SUBJ = [['oji', 'むらの おじいさん'], ['girl', 'おんなのこ'], ['shop3', 'はずかしがりの ねこ']];
export function startPhoto() {
  return new Promise(done => {
    F = { kind: 'photo', done, i: 0, look: 'left', t: 0.8, msg: '', msgT: 0, smile: 0, flash: 0, shots: [], result: null };
    fest.on = true; $('fest').style.display = 'block'; renderPhoto();
  });
}
function renderPhoto() {
  const [, name] = SUBJ[Math.min(F.i, SUBJ.length - 1)];
  const top = F.msg || `${name}が こっちを みたら 「にっこり!」`;
  $('fest').innerHTML = `<div class="cwant"><b>${rubyHTML('{パシャ|ぱしゃ}')}</b>${rubyHTML(top)} <small>${F.shots.length}/3</small></div><div class="cbtns">${btn('smile', 'にっこり!', F.smile > 0 ? 'off' : '')}</div>`;
}
function photoTap() {
  if (F.smile > 0) return;
  if (F.look === 'down') { F.smile = 1.6; F.flash = 0.25; sfx('snare'); sfx('get'); F.shots.push(SUBJ[F.i][0]); F.msg = 'パシャ! いい えがお!'.replace('パシャ', '{パシャ|ぱしゃ}'); F.msgT = 1.6; }
  else { sfx('miss'); F.msg = 'あれれ、 まだ こっちを みてないよ'; F.msgT = 1.0; }
  renderPhoto();
}
function updatePhoto(dt) {
  F.flash = Math.max(0, F.flash - dt);
  if (F.msgT > 0 && (F.msgT -= dt) <= 0) { F.msg = ''; renderPhoto(); }
  if (F.smile > 0) { if ((F.smile -= dt) <= 0) { F.i++; F.look = 'left'; F.t = 1; if (F.i >= SUBJ.length) { F.result = F.shots.length; close(); return; } renderPhoto(); } return; }
  if ((F.t -= dt) <= 0) {                     // きょろきょろ。 こっちを みるのは すこしだけ
    F.look = F.look === 'down' ? (Math.random() < 0.5 ? 'left' : 'right') : Math.random() < 0.45 ? 'down' : F.look === 'left' ? 'right' : 'left';
    F.t = F.look === 'down' ? 0.9 + Math.random() * 0.5 : 0.6 + Math.random() * 0.8;
  }
}
function drawPhoto(g, tm) {
  g.fillStyle = '#9fd0f0'; g.fillRect(0, 0, 320, 120); g.fillStyle = '#6cc24a'; g.fillRect(0, 120, 320, 80);
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#e04838' : '#e8803a'; g.beginPath(); g.arc(20 + i * 58, 104, 22, 0, 7); g.fill(); g.fillStyle = '#7a4a2a'; g.fillRect(17 + i * 58, 116, 6, 12); }
  for (let i = 0; i < 20; i++) { g.fillStyle = ['#e8803a', '#d8483c', '#f2c230'][i % 3]; g.fillRect((i * 53 + tm * 12) % 320, (i * 37 + tm * 20) % 200, 3, 2); }   // おちば
  const [pal] = SUBJ[Math.min(F.i, SUBJ.length - 1)];
  const look = F.smile > 0 ? 'down' : F.look;
  g.drawImage(charSprite(pal, look, 0), 136, 60, 48, 64);
  if (F.smile > 0) { g.fillStyle = '#ff5a7a'; for (const [x, y] of [[124, 56], [192, 60], [160, 44]]) { g.fillRect(x, y, 3, 3); g.fillRect(x + 4, y, 3, 3); g.fillRect(x - 1, y + 2, 9, 3); g.fillRect(x + 1, y + 5, 5, 2); } }
  // リズ(カメラの よこで にっこり)
  g.drawImage(heroSprite('up', 0, equipLook()), 40, 140, 36, 48);
  // ファインダー
  g.fillStyle = '#ffffff'; for (const [x, y, w, h] of [[110, 36, 20, 3], [110, 36, 3, 20], [190, 36, 20, 3], [207, 36, 3, 20], [110, 125, 20, 3], [110, 108, 3, 20], [190, 125, 20, 3], [207, 108, 3, 20]]) g.fillRect(x, y, w, h);
  if (F.look === 'down' && !(F.smile > 0)) { g.fillStyle = '#ffd23f'; g.fillRect(156, 30, 8, 3); }   // いま!
  // とった しゃしん
  F.shots.forEach((p, i) => { g.fillStyle = '#ffffff'; g.fillRect(232 + i * 28, 150, 24, 28); g.fillStyle = '#9fd0f0'; g.fillRect(234 + i * 28, 152, 20, 18); g.drawImage(charSprite(p, 'down', 0), 238 + i * 28, 152, 12, 16); });
  if (F.flash > 0) { g.fillStyle = `rgba(255,255,255,${F.flash * 3})`; g.fillRect(0, 0, 320, 200); }
}

// ===== りょうり(オムライス) =====
const STEPS = [
  { say: 'まず、 ごはんを フライパンで いためよう。', pick: 'rice', tap: 5, act: 'じゅうじゅう! タップで まぜよう' },
  { say: 'つぎは、 たまごを わって やこう。', pick: 'egg', tap: 3, act: 'ぱかっ! タップで たまごを わろう' },
  { say: 'さいごに、 ケチャップで えを かこう。', pick: 'ketchup', tap: 4, act: 'タップで ケチャップを にゅるっ' },
];
const FOODS = [['rice', 'ごはん'], ['egg', 'たまご'], ['ketchup', '{ケチャップ|けちゃっぷ}'], ['fish', 'おさかな'], ['carrot', 'にんじん']];
export function startCook() {
  return new Promise(done => {
    F = { kind: 'cook', done, i: 0, phase: 'pick', n: 0, msg: '', msgT: 0, result: true, wait: 0 };
    fest.on = true; $('fest').style.display = 'block'; renderCook();
  });
}
function renderCook() {
  const s = STEPS[Math.min(F.i, STEPS.length - 1)];
  const top = F.phase === 'tap' ? `<div class="chint">${rubyHTML(s.act.replace('ケチャップ', '{ケチャップ|けちゃっぷ}'))} ${'●'.repeat(F.n)}${'○'.repeat(s.tap - F.n)}</div>`
    : `<div class="cwant"><b>${rubyHTML('{モグ|もぐ}')}</b>${rubyHTML(F.msg || s.say.replace('フライパン', '{フライパン|ふらいぱん}').replace('ケチャップ', '{ケチャップ|けちゃっぷ}'))}</div>`;
  $('fest').innerHTML = top + `<div class="cbtns">${FOODS.map(([k, l]) => btn(k, l, F.phase !== 'pick' ? 'off' : '')).join('')}</div>`;
}
function cookTap(k) {
  const s = STEPS[F.i];
  if (F.phase === 'tap') { F.n++; sfx(F.i === 1 ? 'hit' : 'step'); if (F.n >= s.tap) { F.phase = 'done'; F.wait = 1.0; sfx('get'); F.msg = ['いい におい!', 'ふわふわ!', 'できた!'][F.i]; } renderCook(); return; }
  if (F.phase !== 'pick' || !k) return;
  if (k === s.pick) { sfx('next'); F.phase = 'tap'; F.n = 0; F.msg = ''; }
  else { sfx('miss'); F.msg = k === 'fish' || k === 'carrot' ? 'それは きょうは つかわないよ。 レシピを よんでみて!'.replace('レシピ', '{レシピ|れしぴ}') : 'それは まだ あとで つかうよ。'; }
  renderCook();
}
function updateCook(dt) {
  if (F.phase === 'done' && (F.wait -= dt) <= 0) { F.i++; F.msg = ''; if (F.i >= STEPS.length) { close(); return; } F.phase = 'pick'; renderCook(); }
}
function drawCook(g, tm) {
  g.fillStyle = '#efdcb4'; g.fillRect(0, 0, 320, 110); g.fillStyle = '#e2c998'; for (let x = 6; x < 320; x += 18) g.fillRect(x, 0, 1, 110);
  g.fillStyle = '#8a5a32'; g.fillRect(0, 110, 320, 90); g.fillStyle = '#b07a48'; g.fillRect(0, 110, 320, 6);
  // こんろ と フライパン
  g.fillStyle = '#4a4a56'; g.fillRect(100, 120, 120, 40); g.fillStyle = '#2a2a2a'; g.beginPath(); g.ellipse(160, 126, 54, 20, 0, 0, 7); g.fill();
  g.fillStyle = '#5a5a66'; g.beginPath(); g.ellipse(160, 124, 48, 16, 0, 0, 7); g.fill(); g.fillStyle = '#2a2a2a'; g.fillRect(208, 120, 50, 6);
  if (F.i >= 1 || F.phase !== 'pick') { g.fillStyle = '#ff9a6a'; g.beginPath(); g.ellipse(160, 124, 34, 10, 0, 0, 7); g.fill(); for (let i = 0; i < 12; i++) { g.fillStyle = i % 3 ? '#ffffff' : '#7ad87a'; g.fillRect(132 + (i * 7) % 56 + Math.sin(tm * 9 + i) * (F.i === 0 && F.phase === 'tap' ? 2 : 0), 119 + (i * 5) % 9, 3, 2); } }
  if (F.i >= 2 || F.i === 1 && F.phase !== 'pick') { const k = F.i >= 2 ? 1 : F.n / 3; g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(160, 122, 36 * Math.max(0.3, k), 12 * Math.max(0.3, k), 0, 0, 7); g.fill(); g.fillStyle = '#fff3a0'; g.fillRect(146, 116, 10, 2); }
  if (F.i === 2 && F.phase !== 'pick' || F.i >= 3) { const n = F.i >= 3 ? 4 : F.n; g.fillStyle = '#d8241c';   // ケチャップの ハート
    if (n >= 1) { g.fillRect(150, 116, 6, 4); } if (n >= 2) { g.fillRect(162, 116, 6, 4); } if (n >= 3) { g.fillRect(148, 119, 22, 4); } if (n >= 4) { g.fillRect(152, 123, 14, 3); g.fillRect(157, 126, 4, 2); } }
  if (F.phase === 'tap' || F.phase === 'done') { g.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 4; i++) g.fillRect(140 + i * 12, 100 - ((tm * 30 + i * 9) % 20), 2, 6); }   // ゆげ
  // レシピ
  g.fillStyle = '#fff8e8'; g.fillRect(232, 20, 76, 80); g.fillStyle = '#c8a878'; g.fillRect(232, 20, 76, 2);
  for (let i = 0; i < 3; i++) { g.fillStyle = i < F.i ? '#7ad87a' : i === F.i ? '#ffd23f' : '#c8b8a0'; g.fillRect(238, 32 + i * 22, 8, 8); g.fillStyle = '#8a7a6a'; g.fillRect(250, 34 + i * 22, 50, 2); g.fillRect(250, 38 + i * 22, 36, 2); }
  // モグ と リズ
  g.drawImage(charSprite('mogu', 'right', 0), 30, 70, 48, 64); g.drawImage(heroSprite('right', 0, equipLook()), 64, 92, 36, 48);
}

// ===== きょうつう =====
export function festTap(k) { if (!F) return; if (F.kind === 'photo') photoTap(); else cookTap(k); }
export function updateFest(dt) { if (!F) return; if (F.kind === 'photo') updatePhoto(dt); else updateCook(dt); }
export function drawFest(g, tm) { if (!F) return; if (F.kind === 'photo') drawPhoto(g, tm); else drawCook(g, tm); }

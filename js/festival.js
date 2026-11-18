// 第4章 おまつりの じゅんびの ミニゲーム と けっこんしきの え
//  しゃしん: こっちを みた ときに 「にっこり!」で えがおの しゃしん(パシャ)
//  りょうり: レシピを よんで、 じゅんばんに ざいりょうを えらんで オムライスを つくる(モグ)
import { charSprite, heroSprite, enemySprite, DECO } from './sprites.js';
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

// ===== けっこんしき(第4章 3回目) =====
// かいじょう(モグの おみせ)の え。 かざりつけ・はなまき・しき・ふりかえり・おしまい で つかう
export const wed = { stage: 'none', deco: [null, null, null], smile: new Set(), petals: [], riz: 170, glow: 0, lights: 0, flash: 0, frame: false, hearts: 0, lit: -1, list: [], join: 0, glowTo: 0, lightsTo: 0, joinTo: 0 };
const DECO_KIND = [['leaf', 'あかい はっぱ'], ['star', 'ほしの いし'], ['flower', 'おはな']];
const SPOT = ['いりぐち', '{テーブル|てーぶる}', '{ステージ|すてーじ}'];
// おきゃくさん: [みため, ひだり0/みぎ1, れつ, ばんめ(0 = ろうかに ちかい)]。 てきの なかまは enemy
const GUESTS = [
  ['popo', 0, 0, 0], ['mfam', 0, 0, 1], ['mfam', 0, 0, 2], ['hfam', 1, 0, 0], ['hfam', 1, 0, 1], ['oji', 1, 0, 2],
  ['oba', 0, 1, 0], ['girl', 0, 1, 1], ['paint', 0, 1, 2], ['shop1', 1, 1, 0], ['shop2', 1, 1, 1], ['shop3', 1, 1, 2],
  ['e:いたずらリス', 0, 2, 0], ['e:ねぼすけモグラ', 0, 2, 1], ['e:こおばけ', 0, 2, 2], ['e:ミミズク', 1, 2, 0], ['e:おばけび', 1, 2, 1],
];
const gPos = ([, side, row, col]) => ({ x: side ? 194 + col * 30 : 126 - col * 30, y: 92 + row * 30 });
export const GUEST_N = GUESTS.length;
function heart(g, x, y) { g.fillStyle = '#ff5a7a'; g.fillRect(x, y, 3, 3); g.fillRect(x + 4, y, 3, 3); g.fillRect(x - 1, y + 2, 9, 3); g.fillRect(x + 1, y + 5, 5, 2); g.fillRect(x + 3, y + 7, 1, 1); }
function decoPic(k) { return k === 'leaf' ? DECO.leafpile : k === 'star' ? DECO.starOn : DECO.flowers; }
function archDeco(g, k, tm) {   // ステージの アーチの かざり
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * (i / 12), x = 160 - Math.cos(a) * 34, y = 52 - Math.sin(a) * 40;
    if (k === 'leaf') { g.fillStyle = ['#e04838', '#e8803a', '#f2c230'][i % 3]; g.fillRect(x - 3, y - 2, 6, 4); g.fillRect(x - 1, y - 4, 2, 8); }
    else if (k === 'star') { const on = Math.sin(tm * 3 + i) > -0.3; g.fillStyle = on ? '#fff3a0' : '#ffd23f'; g.fillRect(x - 2, y - 2, 4, 4); if (on) { g.fillRect(x - 4, y, 8, 1); g.fillRect(x, y - 4, 1, 8); } }
    else { g.fillStyle = ['#ff8ad0', '#ffffff', '#ff5a6e'][i % 3]; g.fillRect(x - 3, y - 3, 6, 6); g.fillStyle = '#ffd23f'; g.fillRect(x - 1, y - 1, 2, 2); }
  }
}
// かいじょう。 o = wed(stage: 'deco' | 'door' | 'aisle' | 'front' | 'vow' | 'photo')
function drawHall(g, tm, o, extra = {}) {
  g.fillStyle = '#c89a62'; g.fillRect(0, 0, 320, 200);
  g.fillStyle = '#b4864e'; for (let y = 64; y < 200; y += 10) g.fillRect(0, y, 320, 1);
  g.fillStyle = '#f4e6cc'; g.fillRect(0, 0, 320, 60); g.fillStyle = '#d8b888'; g.fillRect(0, 52, 320, 8); g.fillStyle = '#a8784a'; g.fillRect(0, 60, 320, 2);
  for (const x of [34, 254]) { g.fillStyle = '#8ac8f0'; g.fillRect(x, 10, 32, 24); g.fillStyle = '#ffffff'; g.fillRect(x + 15, 10, 2, 24); g.fillRect(x, 21, 32, 2); }   // まど
  // ステージ と アーチ
  g.fillStyle = '#f0dcb4'; g.fillRect(112, 54, 96, 26); g.fillStyle = '#c8a070'; g.fillRect(112, 80, 96, 4);
  g.fillStyle = '#ffffff'; g.fillRect(124, 18, 4, 40); g.fillRect(192, 18, 4, 40);
  for (let i = 0; i <= 20; i++) { const a = Math.PI * (i / 20); g.fillRect(160 - Math.cos(a) * 34 - 1, 52 - Math.sin(a) * 40 - 1, 3, 3); }
  if (o.deco[2]) archDeco(g, o.deco[2], tm);
  // テーブル(オムライス)
  for (const x of [10, 250]) {
    g.fillStyle = '#ffffff'; g.fillRect(x, 62, 60, 14); g.fillStyle = '#e8d8c0'; g.fillRect(x, 76, 60, 3); g.fillStyle = '#8a5a32'; g.fillRect(x + 4, 79, 3, 6); g.fillRect(x + 53, 79, 3, 6);
    for (const dx of [8, 44]) { g.fillStyle = '#ffffff'; g.fillRect(x + dx - 1, 66, 12, 5); g.fillStyle = '#ffd23f'; g.fillRect(x + dx, 64, 10, 5); g.fillStyle = '#d8241c'; g.fillRect(x + dx + 3, 65, 4, 2); }
    if (o.deco[1]) g.drawImage(decoPic(o.deco[1]), x + 22, 54, 16, 14);
  }
  // バージンロード(あかい じゅうたん)
  g.fillStyle = '#c8343c'; g.fillRect(150, 84, 20, 116); g.fillStyle = '#f2c230'; g.fillRect(150, 84, 1, 116); g.fillRect(169, 84, 1, 116);
  // いりぐち
  g.fillStyle = '#7a4a24'; g.fillRect(136, 194, 48, 6);
  if (o.deco[0]) for (const x of [116, 188]) g.drawImage(decoPic(o.deco[0]), x, 178, 16, 14);
  // はなびら(じゅうたんの うえに つもる)
  for (const p of o.petals) { g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
  // おきゃくさん
  const look = o.stage === 'photo' ? 'down' : null;
  if (o.stage !== 'deco') GUESTS.forEach((gu, i) => {
    const { x, y } = gPos(gu), [pic, side] = gu, b = Math.round(Math.sin(tm * 2 + i) * 0.6);
    if (pic.startsWith('e:')) g.drawImage(enemySprite(pic.slice(2)), x - 11, y + 6 + b, 22, 22);
    else g.drawImage(charSprite(pic, look || (side ? 'left' : 'right'), 0), x - 10, y + b, 21, 28);
    if (o.smile.has(i)) heart(g, x - 3, y - 8 + Math.round(Math.sin(tm * 4 + i)));
  });
  // ポポばあちゃんの ひかり
  if (o.glow > 0) { const { x, y } = gPos(GUESTS[0]); const r = 14 + Math.sin(tm * 2) * 2; g.fillStyle = `rgba(255,240,180,${0.35 * o.glow})`; g.beginPath(); g.arc(x, y + 14, r, 0, 7); g.fill(); g.fillStyle = `rgba(255,255,230,${0.3 * o.glow})`; g.beginPath(); g.arc(x, y + 14, r * 0.6, 0, 7); g.fill(); }
  // しゅやく
  const P = {
    door: [[146, 160, 'up'], [174, 160, 'up'], [160, 168, 'up']],
    aisle: [[150, Math.min(166, o.riz + 30), 'up'], [170, Math.min(166, o.riz + 30), 'up'], [160, o.riz, 'up']],
    front: [[146, 46, 'down'], [174, 46, 'down'], [122, 56, 'down']],
    vow: [[146, 46, 'right'], [174, 46, 'left'], [122, 56, 'up']],
    photo: [[140, 46, 'down'], [180, 46, 'down'], [160, 50, 'down']],
  }[o.stage];
  if (P) {
    const [h, m, r] = P;
    g.drawImage(charSprite('hamo', h[2], 0), h[0] - 12, h[1], 24, 32);
    g.drawImage(charSprite('melo', m[2], 0), m[0] - 12, m[1], 24, 32);
    g.fillStyle = '#ffffff'; g.fillRect(m[0] - 7, m[1] - 3, 14, 4); g.fillStyle = '#ff8ad0'; g.fillRect(m[0] - 5, m[1] - 4, 2, 2); g.fillRect(m[0] + 3, m[1] - 4, 2, 2);   // はなかざり
    g.drawImage(heroSprite(r[2], extra.walk ? Math.floor(tm * 6) % 2 : 0, equipLook()), r[0] - 11, r[1], 22, 30);
    if (o.hearts > 0) for (let i = 0; i < 5; i++) heart(g, 140 + i * 10, 40 - ((tm * 18 + i * 7) % 26));
    if (o.lights > 0) {                         // ポポばあちゃんから 3にんの むねへ
      const s = gPos(GUESTS[0]), k = Math.min(1, o.lights);
      [[h[0], h[1] + 16], [m[0], m[1] + 16], [r[0], r[1] + 16]].forEach(([tx, ty], i) => {
        const kk = Math.max(0, Math.min(1, k * 1.3 - i * 0.15)), x = s.x + (tx - s.x) * kk, y = s.y + 14 + (ty - s.y - 14) * kk - Math.sin(kk * Math.PI) * 24;
        const a = kk >= 1 ? 0.45 + Math.sin(tm * 3 + i) * 0.2 : 0.85, rr = kk >= 1 ? 7 : 5;
        g.fillStyle = `rgba(255,236,150,${a * 0.5})`; g.beginPath(); g.arc(x, y, rr + 4, 0, 7); g.fill(); g.fillStyle = `rgba(255,248,200,${a})`; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 3, 3);
      });
    }
  }
  // そのほか: モグ・パシャ
  if (o.stage !== 'deco') { g.drawImage(charSprite('mogu', 'down', 0), 86, 44, 21, 28); g.drawImage(charSprite('pasha', o.stage === 'photo' ? 'up' : 'down', 0), 224, 44, 21, 28); }
  if (o.flash > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(1, o.flash * 3)})`; g.fillRect(0, 0, 320, 200); }
  if (o.frame) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 320, 8); g.fillRect(0, 186, 320, 14); g.fillRect(0, 0, 8, 200); g.fillRect(312, 0, 8, 200); heart(g, 156, 190); }
}
function stepPetals() {
  for (const p of wed.petals) if (p.vy !== null) { p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 2; if (p.y >= p.fy) { p.y = p.fy; p.vy = null; } }
  wed.flash = Math.max(0, wed.flash - 1 / 60);
  // じわっと かわる もの(ポポばあちゃんの ひかり・とんでいく ひかり・かけらが ひとつに)
  for (const [k, sp] of [['glow', 1 / 60], ['lights', 1 / 150], ['join', 1 / 120]]) { const to = wed[k + 'To'] || 0; wed[k] = wed[k] < to ? Math.min(to, wed[k] + sp) : to; }
}
export function drawWedding(g, tm) {
  stepPetals();
  if (wed.stage === 'look') drawLook(g, tm); else if (wed.stage === 'end') drawEnd(g, tm); else drawHall(g, tm, wed);
}
const PETAL_C = ['#ff8ad0', '#ffffff', '#ff5a6e', '#ffd23f'];
export function petalBurst(x, y, n = 10, spread = 40) {
  for (let i = 0; i < n; i++) wed.petals.push({ x, y, vx: (Math.random() - 0.5) * spread * 2, vy: -20 - Math.random() * 30, fy: Math.min(198, y + 6 + Math.random() * 16), c: PETAL_C[i % 4] });
  if (wed.petals.length > 400) wed.petals.splice(0, wed.petals.length - 400);
}

// ===== かざりつけ(みんなで。 3かしょ を えらぶ。 どれでも せいかい) =====
export function startDeco() {
  return new Promise(done => {
    Object.assign(wed, { stage: 'deco', deco: [null, null, null], petals: [] });
    F = { kind: 'deco', done, i: 0, msg: '', wait: 0, result: null };
    fest.on = true; $('fest').style.display = 'block'; renderDeco();
  });
}
function renderDeco() {
  const top = F.msg || `「${SPOT[Math.min(F.i, 2)]}」は なにで かざる?`;
  $('fest').innerHTML = `<div class="cwant"><b>${rubyHTML('{モグ|もぐ}')}</b>${rubyHTML(top)} <small>${Math.min(F.i, 3)}/3</small></div><div class="cbtns">${DECO_KIND.map(([k, l]) => btn(k, l, F.wait > 0 ? 'off' : '')).join('')}</div>`;
}
const DECO_SAY = { leaf: 'まっかで きれい!', star: 'きらきら ひかってる!', flower: 'いい におい!' };
function decoTap(k) {
  if (F.wait > 0 || !DECO_KIND.some(([d]) => d === k)) return;
  wed.deco[F.i] = k; sfx('get'); F.msg = DECO_SAY[k] + ' すてき!'; F.wait = 1.1; renderDeco();
}
function updateDeco(dt) {
  if (F.wait > 0 && (F.wait -= dt) <= 0) { F.i++; F.msg = ''; if (F.i >= 3) { F.result = [...wed.deco]; close(); return; } renderDeco(); }
}
const SPOT_XY = [[160, 170], [160, 50], [160, 6]];
function drawDeco(g, tm) {
  drawHall(g, tm, wed);
  const HELP = [['pasha', 40, 150], ['mogu', 260, 150], ['e:いたずらリス', 90, 120], ['e:ねぼすけモグラ', 220, 120], ['e:こおばけ', 60, 96]];
  for (const [p, x, y] of HELP) { const b = Math.round(Math.abs(Math.sin(tm * 4 + x)) * -2); if (p.startsWith('e:')) g.drawImage(enemySprite(p.slice(2)), x - 11, y + b, 22, 22); else g.drawImage(charSprite(p, 'up', 0), x - 10, y + b, 21, 28); }
  g.drawImage(heroSprite('up', 0, equipLook()), 149, 120, 22, 30);
  if (F && F.i < 3 && !(F.wait > 0)) {   // いま えらぶ ばしょ
    const [x, y] = SPOT_XY[F.i], b = Math.round(Math.sin(tm * 6) * 2);
    g.fillStyle = '#ffd23f'; g.fillRect(x - 5, y + b, 11, 3); g.fillRect(x - 3, y + 3 + b, 7, 2); g.fillRect(x - 1, y + 5 + b, 3, 2);
    if (F.i === 1) { g.fillRect(36, 44 + b, 11, 3); g.fillRect(38, 47 + b, 7, 2); g.fillRect(276, 44 + b, 11, 3); g.fillRect(278, 47 + b, 7, 2); }
  }
}

// ===== はなまき: リズが じゅうたんを あるきながら タップで はなびらを まく =====
const PETAL_TIME = 16, RIZ_FROM = 170, RIZ_TO = 84;
export function startPetal() {
  return new Promise(done => {
    Object.assign(wed, { stage: 'aisle', riz: RIZ_FROM, smile: new Set(), petals: [] });
    F = { kind: 'petal', done, t: 0, msg: '', msgT: 0, end: 0, result: 0 };
    fest.on = true; $('fest').style.display = 'block'; renderPetal();
  });
}
function renderPetal() {
  const top = F.msg || 'タップで はなびらを まこう! ちかくの みんなが にっこり するよ';
  $('fest').innerHTML = `<div class="cwant"><b>${rubyHTML('はなまき')}</b>${rubyHTML(top)} <small>${wed.smile.size}/${GUEST_N}</small></div><div class="cbtns">${btn('petal', 'はなびらを まく!')}</div>`;
}
function petalTap() {
  if (F.end) return;
  sfx('step'); petalBurst(160, wed.riz + 14, 8, 30);
  const cy = wed.riz + 14;
  let best = -1, bd = 1e9;
  GUESTS.forEach((gu, i) => { if (wed.smile.has(i)) return; const d = Math.abs(gPos(gu).y + 14 - cy); if (d < 24 && d < bd) { bd = d; best = i; } });
  if (best >= 0) { wed.smile.add(best); sfx('get'); F.msg = ['にっこり!', 'わあ、 きれい!', 'すてき!'][wed.smile.size % 3]; F.msgT = 0.8; }
  renderPetal();
}
function updatePetal(dt) {
  F.t += dt;
  if (F.msgT > 0 && (F.msgT -= dt) <= 0) { F.msg = ''; renderPetal(); }
  wed.riz = RIZ_FROM + (RIZ_TO - RIZ_FROM) * Math.min(1, F.t / PETAL_TIME);
  if (F.t >= PETAL_TIME && !F.end) { F.end = 1; F.result = wed.smile.size; F.msg = 'ステージに ついた!'.replace('ステージ', '{ステージ|すてーじ}'); renderPetal(); }
  if (F.end && (F.end += dt) > 2) close();
}
function drawPetal(g, tm) { stepPetals(); drawHall(g, tm, wed, { walk: !F.end }); }

// ===== ふりかえり: かけらが ひとつずつ ひかる =====
function kakera(g, x, y, c, on, big) {
  const s = big ? 2 : 1;
  if (on) { g.fillStyle = 'rgba(255,240,190,.25)'; g.beginPath(); g.arc(x, y, 12 * s, 0, 7); g.fill(); }
  g.fillStyle = on ? c : '#4a4a62';
  g.fillRect(x - 2 * s, y - 7 * s, 4 * s, 14 * s); g.fillRect(x - 4 * s, y - 4 * s, 8 * s, 8 * s); g.fillRect(x - 6 * s, y - 1 * s, 12 * s, 2 * s);
  g.fillStyle = on ? '#ffffff' : '#6a6a82'; g.fillRect(x - 1 * s, y - 5 * s, 2 * s, 3 * s);
}
function drawLook(g, tm) {
  g.fillStyle = '#141a3a'; g.fillRect(0, 0, 320, 200);
  for (let i = 0; i < 50; i++) { g.fillStyle = (i + Math.floor(tm * 2)) % 7 ? '#8a90c8' : '#ffffff'; g.fillRect((i * 67) % 320, (i * 41) % 200, 1, 1); }
  const n = wed.list.length;
  wed.list.forEach((c, i) => {
    const a = -Math.PI / 2 + i / n * Math.PI * 2, r = 70 * (1 - wed.join * 0.85), x = 160 + Math.cos(a + wed.join * tm) * r, y = 96 + Math.sin(a + wed.join * tm) * r * 0.85;
    kakera(g, Math.round(x), Math.round(y), c, i <= wed.lit, i === wed.lit && !wed.join);
  });
  if (wed.join >= 1) { const r = 26 + Math.sin(tm * 3) * 3; g.fillStyle = 'rgba(255,240,190,.35)'; g.beginPath(); g.arc(160, 96, r, 0, 7); g.fill(); }
  g.drawImage(charSprite('hamo', 'down', 0), 132, 80, 18, 24); g.drawImage(heroSprite('down', 0, equipLook()), 151, 82, 18, 24); g.drawImage(charSprite('melo', 'down', 0), 170, 80, 18, 24);
}
// ===== おしまい =====
function drawEnd(g, tm) {
  const gr = g.createLinearGradient ? g.createLinearGradient(0, 0, 0, 200) : null;
  if (gr) { gr.addColorStop(0, '#ffb37a'); gr.addColorStop(1, '#ffe2b0'); g.fillStyle = gr; } else g.fillStyle = '#ffc890';
  g.fillRect(0, 0, 320, 200);
  for (let i = 0; i < 40; i++) { g.fillStyle = PETAL_C[i % 4]; g.fillRect((i * 53 + tm * 14) % 320, (i * 37 + tm * 22) % 200, 2, 2); }
  g.fillStyle = '#e8803a'; g.fillRect(0, 150, 320, 50); g.fillStyle = '#c86a2a'; g.fillRect(0, 150, 320, 3);
  g.drawImage(charSprite('hamo', 'down', 0), 112, 104, 36, 48); g.drawImage(heroSprite('down', 0, equipLook()), 142, 110, 36, 48); g.drawImage(charSprite('melo', 'down', 0), 172, 104, 36, 48);
  heart(g, 156, 96 + Math.round(Math.sin(tm * 3) * 2));
  if (g.fillText) {
    g.textAlign = 'center'; g.font = 'bold 30px sans-serif';
    g.fillStyle = '#8a3a1a'; g.fillText('おしまい', 161, 61); g.fillStyle = '#ffffff'; g.fillText('おしまい', 160, 60);
    g.font = 'bold 13px sans-serif'; g.fillStyle = '#8a3a1a'; g.fillText('ぼうけんの たび', 160, 28);
    g.textAlign = 'left';
  }
}

// ===== きょうつう =====
const KEYS = { photo: ['smile'], cook: FOODS.map(([k]) => k), deco: DECO_KIND.map(([k]) => k), petal: ['petal'] };
export const festKeys = () => F ? KEYS[F.kind] : [];
export function festTap(k) { if (!F) return; if (F.kind === 'photo') photoTap(); else if (F.kind === 'deco') decoTap(k); else if (F.kind === 'petal') petalTap(); else cookTap(k); }
export function updateFest(dt) { if (!F) return; if (F.kind === 'photo') updatePhoto(dt); else if (F.kind === 'deco') updateDeco(dt); else if (F.kind === 'petal') updatePetal(dt); else updateCook(dt); }
export function drawFest(g, tm) { if (!F) return; if (F.kind === 'photo') drawPhoto(g, tm); else if (F.kind === 'deco') drawDeco(g, tm); else if (F.kind === 'petal') drawPetal(g, tm); else drawCook(g, tm); }


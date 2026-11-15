// かんびょうの ミニゲーム: リズの 「おねがい」を よんで、 あう ものを えらぶ(まちがえても だいじょうぶ)
import { charSprite, heroSprite } from './sprites.js';
import { equipLook, hero } from './hero.js';
import { sfx } from './audio.js';
import { rubyHTML } from './dialog.js';

const $ = id => document.getElementById(id);
export const care = { on: false };
const HAMO = '{ハモ|はも}', MELO = '{メロ|めろ}';
// おねがい: say リズの ことば、 pick あう もの、 act した こと
const WANT = {
  atsui:    { say: 'あたまが あつい……', pick: 'towel', act: `${MELO}が おでこに つめたい {タオル|たおる}を のせた。` },
  nodo:     { say: 'のどが かわいた……', pick: 'water', act: `${HAMO}が おみずを ゆっくり のませた。` },
  onaka:    { say: 'おなか すいた……', pick: 'kayu', blow: 3, act: `${MELO}が ひとくち たべさせて くれた。` },
  samui:    { say: 'さむいよう……', pick: 'blanket', act: `${HAMO}が もうふを もう いちまい かけた。` },
  samishii: { say: 'そばに いて……', pick: 'hand', act: `${HAMO}と ${MELO}が、 りょうがわから そっと {手|て}を にぎった。` },
};
const PICKS = [['towel', 'タオル'], ['water', 'おみず'], ['kayu', 'おかゆ'], ['blanket', 'もうふ'], ['hand', 'てを にぎる']];
const LABEL = { towel: '{タオル|たおる}', water: 'おみず', kayu: 'おかゆ', blanket: 'もうふ', hand: '{手|て}を にぎる' };

// ===== どうぐの え(ボタンに のせる) =====
function icon(fn) { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); fn((x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); }); return c.toDataURL(); }
let ICONS = null;
const icons = () => ICONS || (ICONS = {
  towel: icon(p => { p(2, 4, 12, 9, '#7ac8ff'); p(2, 4, 12, 2, '#cfeaff'); p(2, 10, 12, 1, '#5aa0e0'); p(5, 7, 1, 1, '#cfeaff'); p(10, 8, 1, 1, '#cfeaff'); }),
  water: icon(p => { p(4, 2, 8, 12, '#e6f6ff'); p(5, 6, 6, 7, '#5ab0ff'); p(5, 6, 6, 1, '#9fd2ff'); p(4, 13, 8, 1, '#9ab0c0'); p(6, 3, 1, 2, '#ffffff'); }),
  kayu: icon(p => { p(5, 1, 1, 3, '#ffffff'); p(9, 0, 1, 3, '#ffffff'); p(1, 6, 14, 2, '#fff8e8'); p(2, 8, 12, 4, '#e8e0d0'); p(3, 12, 10, 2, '#c8b8a0'); p(1, 7, 14, 1, '#d8483c'); p(7, 5, 2, 2, '#ff8a6a'); }),
  blanket: icon(p => { p(1, 3, 14, 11, '#f08aa8'); for (let i = 0; i < 4; i++) p(1 + i * 4, 3, 2, 11, '#ffb0c8'); p(1, 12, 14, 2, '#c85a7a'); }),
  hand: icon(p => { p(3, 6, 10, 6, '#ffe2b8'); p(3, 4, 2, 3, '#ffe2b8'); p(6, 3, 2, 4, '#ffe2b8'); p(9, 3, 2, 4, '#ffe2b8'); p(12, 5, 2, 4, '#ffe2b8'); p(7, 12, 2, 2, '#ff5a7a'); p(6, 13, 4, 1, '#ff5a7a'); }),
});

let C = null;
export function startCare() {
  const mid = ['atsui', 'nodo', 'onaka', 'samui', 'atsui'].sort(() => Math.random() - 0.5);
  if (mid[0] === 'atsui' && mid[1] === 'atsui') mid.push(mid.shift());
  return new Promise(res => {
    C = { list: [...mid, 'samishii'], i: 0, fever: 100, show: 100, phase: 'ask', t: 0, blow: 0, miss: 0, line: '', hearts: [], towel: false, extra: false, done: res };
    care.on = true; $('care').style.display = 'block'; render();
  });
}
const want = () => WANT[C.list[C.i]];
function render() {
  const w = want(), help = C.phase === 'ask' && C.miss >= 2 ? w.pick : null;
  const top = C.phase === 'blow' ? `<div class="chint">${rubyHTML('あつそう! タップして ふーふー しよう')} ${'●'.repeat(C.blow)}${'○'.repeat(w.blow - C.blow)}</div>`
    : `<div class="cwant"><b>${rubyHTML(hero.name)}</b>${rubyHTML(C.line || `「${w.say}」`)}</div>`;
  const btns = PICKS.map(([k], n) => `<button data-c="${k}" class="${help === k ? 'help' : ''}${C.phase !== 'ask' ? ' off' : ''}"><img src="${icons()[k]}">${rubyHTML(LABEL[k])}</button>`).join('');
  $('care').innerHTML = top + `<div class="cbtns">${btns}</div>`;
}
export function careTap(k) {
  if (!C) return;
  if (C.phase === 'blow') { C.blow++; sfx('blow'); if (C.blow >= want().blow) react(); else render(); return; }
  if (C.phase !== 'ask' || !k) return;
  sfx('next');
  if (k === want().pick) { if (want().blow) { C.phase = 'blow'; C.blow = 0; render(); } else react(); return; }
  C.miss++; C.line = 'ううん…… それじゃ ないの……'; C.t = 1.3; sfx('miss'); render();
}
function react() {
  const w = want(), last = C.i === C.list.length - 1;
  sfx('heal'); C.phase = 'react'; C.t = last ? 3.2 : 2.2; C.miss = 0;
  C.fever = last ? 0 : Math.max(10, C.fever - 17);
  if (w.pick === 'towel') C.towel = true; if (w.pick === 'blanket') C.extra = true;
  C.line = w.act;
  for (let i = 0; i < (last ? 8 : 3); i++) C.hearts.push({ x: 150 + Math.random() * 20, y: 80, t: -i * 0.25 });
  render();
}
export function updateCare(dt) {
  if (!C) return;
  C.show += (C.fever - C.show) * Math.min(1, dt * 3);
  for (const h of C.hearts) h.t += dt; C.hearts = C.hearts.filter(h => h.t < 1.6);
  if (C.t > 0 && (C.t -= dt) <= 0) {
    if (C.phase === 'ask') { C.line = ''; render(); }
    else if (C.phase === 'react') {
      if (++C.i >= C.list.length) { care.on = false; $('care').style.display = 'none'; const cb = C.done; C = null; cb(); return; }
      C.phase = 'ask'; C.line = ''; render();
    }
  }
}

// ===== こやの え =====
export function drawCare(g, tm) {
  if (!C) return;
  g.fillStyle = '#efdcb4'; g.fillRect(0, 0, 320, 120);
  g.fillStyle = '#e2c998'; for (let x = 6; x < 320; x += 18) g.fillRect(x, 0, 1, 112);
  g.fillStyle = '#8a5a32'; g.fillRect(0, 112, 320, 8);
  g.fillStyle = '#c8925a'; g.fillRect(0, 120, 320, 80); g.fillStyle = '#a87440'; for (let y = 126; y < 200; y += 8) g.fillRect(0, y, 320, 1);
  // まど(そとは ゆき)
  g.fillStyle = '#6a4426'; g.fillRect(232, 24, 56, 48); g.fillStyle = '#2a3a6a'; g.fillRect(236, 28, 48, 40);
  g.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { const x = 236 + (i * 29 + tm * 6) % 48, y = 28 + (i * 17 + tm * 14) % 40; g.fillRect(x | 0, y | 0, 1, 1); }
  g.fillStyle = '#6a4426'; g.fillRect(259, 28, 2, 40); g.fillRect(236, 47, 48, 2);
  // だんろ
  g.fillStyle = '#7a7a86'; g.fillRect(24, 40, 56, 80); g.fillStyle = '#4a4a56'; g.fillRect(20, 36, 64, 6);
  g.fillStyle = '#1a1414'; g.fillRect(34, 72, 36, 48);
  const f = Math.floor(tm * 6) % 3;
  g.fillStyle = '#ff5a2a'; g.fillRect(40, 96 - f, 24, 22 + f); g.fillStyle = '#ffa02a'; g.fillRect(44, 100 + f, 16, 18); g.fillStyle = '#ffd23f'; g.fillRect(48, 106 - f, 8, 12);
  g.fillStyle = 'rgba(255,170,60,.10)'; g.beginPath(); g.arc(52, 110, 70 + f * 2, 0, 7); g.fill();
  // ベッド
  g.fillStyle = '#6a3c1a'; g.fillRect(116, 64, 88, 112); g.fillStyle = '#ffffff'; g.fillRect(120, 68, 80, 104);
  g.fillStyle = '#f0f0f8'; g.fillRect(128, 72, 64, 28);
  const hs = heroSprite('down', 0, equipLook());
  g.drawImage(hs, 0, 0, 12, 9, 142, 70, 36, 27);
  if (C.show > 35) { g.fillStyle = `rgba(255,80,90,${Math.min(0.8, C.show / 110)})`; g.fillRect(146, 88, 6, 3); g.fillRect(168, 88, 6, 3); }   // ほっぺが あかい
  if (C.show > 50 && Math.floor(tm * 2) % 2) { g.fillStyle = '#9fd2ff'; g.fillRect(180, 78, 2, 3); g.fillRect(179, 80, 4, 2); }                  // あせ
  if (C.towel) { g.fillStyle = '#7ac8ff'; g.fillRect(148, 72, 24, 6); g.fillStyle = '#cfeaff'; g.fillRect(148, 72, 24, 2); }
  g.fillStyle = '#5a8ad8'; g.fillRect(120, 98, 80, 74); g.fillStyle = '#7aa6f0'; for (let y = 108; y < 172; y += 14) g.fillRect(120, y, 80, 2);
  if (C.extra) { g.fillStyle = '#f08aa8'; g.fillRect(120, 120, 80, 52); g.fillStyle = '#ffb0c8'; for (let x = 124; x < 200; x += 12) g.fillRect(x, 120, 4, 52); }
  // ねむっている いき(sleep)
  if (C.show < 30) { g.fillStyle = '#ffffff'; const k = (tm % 2) / 2; g.fillRect(188 + k * 10, 70 - k * 14, 4, 1); g.fillRect(191 + k * 10, 67 - k * 14, 1, 3); }
  // ハモ と メロ
  const hold = C.phase === 'react' && want().pick === 'hand' || C.i >= C.list.length;
  g.drawImage(charSprite('hamo', 'right', 0), 76, 100, 36, 48);
  g.drawImage(charSprite('melo', 'left', 0), 208, 100, 36, 48);
  if (hold) { g.fillStyle = '#ffe2b8'; g.fillRect(108, 128, 14, 4); g.fillRect(198, 128, 14, 4); }
  // ハート
  for (const h of C.hearts) if (h.t > 0) { const x = h.x + Math.sin(h.t * 5) * 6, y = h.y - h.t * 40; g.fillStyle = `rgba(255,90,122,${1 - h.t / 1.6})`; g.fillRect(x, y, 3, 3); g.fillRect(x + 4, y, 3, 3); g.fillRect(x - 1, y + 2, 9, 3); g.fillRect(x + 1, y + 5, 5, 2); g.fillRect(x + 3, y + 7, 1, 1); }
  // ねつの めもり(たいおんけい)
  g.fillStyle = '#ffffff'; g.fillRect(294, 80, 10, 80); g.fillStyle = '#2a2a3a'; g.fillRect(294, 80, 10, 1); g.fillRect(294, 159, 10, 1); g.fillRect(294, 80, 1, 80); g.fillRect(303, 80, 1, 80);
  const h = Math.round(C.show / 100 * 74);
  g.fillStyle = C.show > 50 ? '#e04848' : C.show > 20 ? '#f2a030' : '#5ab0ff'; g.fillRect(296, 157 - h, 6, h + 1);
  g.beginPath(); g.arc(299, 166, 7, 0, 7); g.fill();
}

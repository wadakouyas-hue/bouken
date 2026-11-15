// かぐ(もようがえ で おける もの)の 絵と、おける場所の きまり
import { byId } from './data.js';
import { T, px } from './tiles.js';
import { colorAt } from './paint.js';

// みため → おおきさ(マス)と はたらき
const SIZE = { ベッド: [1, 2], テーブル: [2, 1], じゅうたん: [2, 2], き: [1, 2], ねこタワー: [1, 2], ハンモック: [2, 1], こたつ: [2, 1], にじ: [2, 2] };
export const furnSize = look => SIZE[look] || [1, 1];
export const isFlat = look => look === 'じゅうたん' || look === 'にじ';            // うえを あるける
const WORK = { ベッド: 'ねる', さぎょうだい: 'つくる', こたつ: 'はいる', ハンモック: 'のる', ねこタワー: 'のぼる', ペット: 'なでる' };
export const furnWork = look => WORK[look] || (look.startsWith('おもいで') ? 'みる' : '');

// もっている かぐ: placed = おいてある もの(マップごと)、 stash = しまってある もの(id の ならび)
export const room = { placed: {}, stash: [], paint: null };   // paint: ぬりえの いろ(かぐの 「え」)

// ===== 絵(うしろは すきとおり) =====
function circle(g, cx, cy, r, col) { g.fillStyle = col; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * .6) g.fillRect(cx + x, cy + y, 1, 1); }
function frame(g) { px(g, 1, 1, 14, 14, '#b07a3a'); px(g, 2, 2, 12, 12, '#d8a868'); px(g, 3, 3, 10, 10, '#fff8e8'); px(g, 7, 0, 2, 1, '#5a3418'); }   // おもいでの がくぶち
const PAINT = {
  おもいでかたぐるま: g => { frame(g); px(g, 6, 6, 4, 4, '#f0a050'); px(g, 6, 3, 4, 3, '#f4f2ec'); px(g, 5, 10, 6, 2, '#7a5a3a'); },
  おもいでトランポリン: g => { frame(g); px(g, 3, 10, 10, 2, '#3a5ad8'); px(g, 6, 4, 4, 4, '#f4f2ec'); px(g, 7, 8, 1, 1, '#ffd23f'); },
  おもいでえかき: g => { frame(g); px(g, 4, 4, 8, 7, '#ffffff'); px(g, 5, 5, 3, 3, '#e04848'); px(g, 8, 7, 3, 3, '#5ab0ff'); },
  おもいでこうさく: g => { frame(g); px(g, 5, 6, 6, 5, '#d8a060'); px(g, 4, 5, 8, 2, '#c84a3a'); px(g, 7, 8, 2, 2, '#3a2210'); },
  おもいでキャンプ: g => { frame(g); px(g, 4, 9, 8, 2, '#7a4a24'); px(g, 6, 5, 4, 4, '#ff8a2a'); px(g, 7, 4, 2, 3, '#ffd23f'); },
  おもいでがっそう: g => { frame(g); px(g, 4, 4, 2, 6, '#2a1e1a'); px(g, 3, 9, 3, 2, '#2a1e1a'); px(g, 9, 3, 2, 6, '#2a1e1a'); px(g, 8, 8, 3, 2, '#2a1e1a'); px(g, 4, 3, 7, 1, '#2a1e1a'); },
  おもいでゆうき: g => { frame(g); px(g, 3, 8, 10, 2, '#8a6a42'); px(g, 3, 7, 1, 1, '#c8a878'); px(g, 12, 7, 1, 1, '#c8a878'); px(g, 7, 4, 2, 4, '#f4f2ec'); },
  おもいでぬくもり: g => { frame(g); px(g, 4, 5, 3, 3, '#ff5a7a'); px(g, 9, 5, 3, 3, '#ff5a7a'); px(g, 4, 7, 8, 2, '#ff5a7a'); px(g, 6, 9, 4, 2, '#ff5a7a'); px(g, 7, 11, 2, 1, '#ff5a7a'); },
  ねこタワー: g => { px(g, 7, 6, 2, 24, '#c8a878'); for (let y = 8; y < 30; y += 3) px(g, 7, y, 2, 1, '#a8885a'); px(g, 2, 4, 12, 3, '#8a5a9a'); px(g, 3, 16, 10, 3, '#8a5a9a'); px(g, 1, 29, 14, 3, '#8a5a9a'); px(g, 4, 1, 6, 3, '#b07ab8'); px(g, 12, 19, 1, 4, '#ffd23f'); px(g, 11, 23, 3, 2, '#ffd23f'); },
  こたつ: g => { px(g, 1, 3, 30, 9, '#e04848'); for (let x = 3; x < 30; x += 6) px(g, x, 3, 3, 9, '#c83838'); px(g, 3, 1, 26, 3, '#b07a3a'); px(g, 3, 1, 26, 1, '#d8a868'); circle(g, 22, 1, 2, '#ff8a2a'); circle(g, 9, 1, 2, '#ff8a2a'); px(g, 1, 12, 30, 1, '#8a2828'); },
  ハンモック: g => { px(g, 1, 0, 2, 16, '#7a4a24'); px(g, 29, 0, 2, 16, '#7a4a24'); for (let x = 3; x < 29; x++) { const y = 6 + Math.round(Math.sin((x - 3) / 26 * Math.PI) * 5); px(g, x, y, 1, 3, x % 4 < 2 ? '#5ab0a0' : '#f2c230'); } px(g, 3, 5, 1, 1, '#c8a878'); px(g, 28, 5, 1, 1, '#c8a878'); },
  にじ: g => { const c = ['#ff5a5a', '#ffa03a', '#ffe04a', '#6ad86a', '#5ab0ff', '#7a6ae8']; for (let i = 0; i < 6; i++) px(g, 0, i * 5 + 1, 32, 5, c[i]); px(g, 0, 0, 32, 1, '#ffffff'); px(g, 0, 31, 32, 1, '#ffffff'); },
  ほしランプ: g => { px(g, 7, 9, 2, 5, '#3a3a5a'); px(g, 5, 14, 6, 2, '#3a3a5a'); px(g, 6, 1, 4, 8, '#fff3a0'); px(g, 3, 3, 10, 4, '#ffd23f'); px(g, 7, 0, 2, 10, '#ffffff'); px(g, 4, 4, 8, 2, '#fff8d0'); },
  ペット: g => { px(g, 3, 9, 10, 6, '#f0a050'); px(g, 3, 9, 10, 1, '#b8601e'); px(g, 6, 11, 4, 1, '#b8601e'); px(g, 10, 5, 5, 5, '#f0a050'); px(g, 10, 4, 1, 2, '#f0a050'); px(g, 14, 4, 1, 2, '#f0a050'); px(g, 11, 7, 1, 1, '#2a1e1a'); px(g, 13, 7, 1, 1, '#2a1e1a'); px(g, 12, 8, 1, 1, '#f08aa0'); px(g, 1, 8, 2, 2, '#f0a050'); px(g, 0, 6, 2, 2, '#f0a050'); },
  かぼちゃ: g => { circle(g, 8, 10, 6, '#c8601e'); circle(g, 8, 10, 5, '#e8803a'); px(g, 7, 2, 2, 3, '#3a8a3e'); px(g, 5, 8, 2, 2, '#ffd23f'); px(g, 9, 8, 2, 2, '#ffd23f'); px(g, 5, 12, 6, 1, '#ffd23f'); px(g, 6, 13, 1, 1, '#ffd23f'); px(g, 9, 13, 1, 1, '#ffd23f'); },
  ゆきだるま: g => { circle(g, 8, 11, 5, '#ffffff'); circle(g, 8, 4, 3, '#ffffff'); px(g, 6, 3, 1, 1, '#2a2a3a'); px(g, 9, 3, 1, 1, '#2a2a3a'); px(g, 8, 5, 2, 1, '#ff8a2a'); px(g, 5, 7, 6, 1, '#e04848'); px(g, 5, 0, 6, 2, '#3a3a4a'); px(g, 3, 14, 10, 1, '#c4d4e4'); },
  かかし: g => { px(g, 7, 6, 2, 10, '#7a4a24'); px(g, 2, 7, 12, 2, '#7a4a24'); circle(g, 8, 4, 3, '#f0d8a0'); px(g, 4, 0, 8, 2, '#d8b060'); px(g, 6, 3, 1, 1, '#2a1e1a'); px(g, 9, 3, 1, 1, '#2a1e1a'); px(g, 7, 5, 2, 1, '#e04848'); px(g, 5, 8, 6, 5, '#5a8ad8'); px(g, 1, 9, 2, 3, '#d8b060'); px(g, 13, 9, 2, 3, '#d8b060'); },
  ベッド: g => { px(g, 1, 0, 14, 30, '#6a3c1a'); px(g, 2, 2, 12, 28, '#ffffff'); px(g, 3, 3, 10, 5, '#f0f0f8'); px(g, 3, 8, 10, 1, '#d8d8e8');
    px(g, 2, 11, 12, 17, '#5a8ad8'); px(g, 2, 11, 12, 1, '#7aa6f0'); px(g, 2, 20, 12, 1, '#7aa6f0'); px(g, 2, 25, 12, 1, '#7aa6f0'); px(g, 1, 30, 2, 2, '#4a2a10'); px(g, 13, 30, 2, 2, '#4a2a10'); },
  タンス: g => { px(g, 1, 0, 14, 16, '#5a3418'); px(g, 2, 1, 12, 14, '#9a6232');
    for (const y of [2, 7, 11]) { px(g, 3, y, 10, 3, '#b8783e'); px(g, 3, y + 3, 10, 1, '#6a3c1a'); px(g, 7, y + 1, 2, 1, '#f2c230'); } },
  たな: g => { px(g, 1, 0, 14, 16, '#5a3418'); px(g, 2, 1, 12, 14, '#7a4a24');
    const bk = ['#e04848', '#3a5ad8', '#f2c230', '#4f9a52', '#f07ab0', '#ffffff'];
    for (const y of [1, 6, 11]) { for (let x = 2, i = 0; x < 14; x += 2, i++) px(g, x, y + (i % 2), 2, 4 - (i % 2), bk[(x + y) % 6]); px(g, 2, y + 4, 12, 1, '#5a3418'); } },
  はなびん: g => { px(g, 5, 9, 6, 6, '#b5652a'); px(g, 4, 9, 8, 2, '#c87a3a'); px(g, 7, 3, 1, 6, '#3a8a3e'); px(g, 5, 5, 2, 1, '#3a8a3e');
    px(g, 6, 1, 3, 3, '#ff5a6e'); px(g, 7, 2, 1, 1, '#ffd23f'); px(g, 9, 4, 3, 2, '#ffffff'); px(g, 10, 4, 1, 1, '#ffd23f'); },
  いす: g => { px(g, 3, 1, 10, 7, '#6a3c1a'); px(g, 4, 2, 8, 5, '#b8783e'); px(g, 4, 4, 8, 1, '#9a6232');
    px(g, 2, 8, 12, 4, '#6a3c1a'); px(g, 3, 8, 10, 3, '#c8894a'); px(g, 3, 12, 2, 4, '#5a3418'); px(g, 11, 12, 2, 4, '#5a3418'); },
  テーブル: g => { px(g, 0, 3, 32, 8, '#8a5228'); px(g, 0, 3, 32, 1, '#b07040'); px(g, 0, 10, 32, 1, '#5a3418'); px(g, 0, 3, 1, 8, '#5a3418'); px(g, 31, 3, 1, 8, '#5a3418');
    px(g, 2, 11, 2, 4, '#5a3418'); px(g, 28, 11, 2, 4, '#5a3418');
    px(g, 9, 5, 4, 3, '#ffffff'); px(g, 10, 4, 2, 1, '#e04848'); px(g, 19, 4, 3, 4, '#e6f6ff'); px(g, 19, 5, 3, 2, '#9fd2ff'); },
  うえき: g => { px(g, 4, 10, 8, 6, '#b5652a'); px(g, 3, 10, 10, 2, '#c87a3a'); px(g, 5, 14, 6, 1, '#8a4a20');
    circle(g, 8, 6, 5, '#2f7a34'); circle(g, 6, 5, 2, '#4fb14f'); circle(g, 10, 7, 2, '#3a8a3e'); px(g, 7, 8, 2, 2, '#5a3418'); },
  ぬいぐるみ: g => { circle(g, 4, 3, 2, '#a0683a'); circle(g, 12, 3, 2, '#a0683a'); circle(g, 8, 6, 4, '#c8894a'); circle(g, 8, 12, 4, '#c8894a');
    px(g, 4, 3, 1, 1, '#e8b08a'); px(g, 12, 3, 1, 1, '#e8b08a'); px(g, 6, 5, 1, 1, '#2a1e1a'); px(g, 10, 5, 1, 1, '#2a1e1a');
    px(g, 7, 7, 3, 2, '#f0d0a8'); px(g, 8, 7, 1, 1, '#2a1e1a'); px(g, 6, 10, 5, 1, '#e04848'); px(g, 8, 11, 1, 1, '#ffd23f');
    px(g, 7, 12, 3, 3, '#f0d0a8'); px(g, 3, 14, 3, 2, '#a0683a'); px(g, 11, 14, 3, 2, '#a0683a'); },
  じゅうたん: g => { px(g, 0, 0, 32, 32, '#c0483c'); px(g, 1, 1, 30, 30, '#e8b04a'); px(g, 2, 2, 28, 28, '#c0483c');
    for (let y = 6; y < 28; y += 8) for (let x = 6; x < 28; x += 8) { px(g, x, y - 1, 2, 4, '#f0d890'); px(g, x - 1, y, 4, 2, '#f0d890'); } },
  ドラム: g => { px(g, 11, 1, 1, 9, '#8a96a4'); px(g, 8, 1, 7, 1, '#f2c230'); px(g, 9, 0, 5, 1, '#f8e070');
    circle(g, 7, 10, 5, '#2a1e1a'); circle(g, 7, 10, 4, '#e04848'); circle(g, 7, 10, 2, '#f6f0e0'); px(g, 2, 15, 2, 1, '#2a1e1a'); px(g, 11, 15, 2, 1, '#2a1e1a');
    px(g, 12, 7, 4, 3, '#e04848'); px(g, 12, 6, 4, 1, '#f6f0e0'); },
  ギター: g => { px(g, 8, 0, 2, 2, '#5a3418'); px(g, 8, 2, 2, 7, '#7a4a24'); px(g, 9, 2, 1, 7, '#c8c8c8');
    circle(g, 9, 9, 3, '#e07a2a'); circle(g, 9, 12, 3, '#e07a2a'); px(g, 8, 10, 2, 2, '#2a1e1a'); px(g, 7, 13, 5, 1, '#5a3418');
    px(g, 4, 15, 10, 1, '#2a1e1a'); px(g, 5, 11, 1, 4, '#2a1e1a'); },
  マイク: g => { circle(g, 8, 3, 2, '#5a5a6a'); px(g, 7, 2, 1, 1, '#c8c8d8'); px(g, 8, 5, 1, 1, '#2a2a2a'); px(g, 8, 6, 1, 8, '#8a96a4');
    px(g, 5, 14, 7, 1, '#2a2a2a'); px(g, 4, 15, 9, 1, '#2a2a2a'); },
  さぎょうだい: g => { px(g, 0, 4, 16, 7, '#7a4a24'); px(g, 0, 4, 16, 3, '#c8925a'); px(g, 0, 7, 16, 1, '#5a3418'); px(g, 0, 10, 16, 1, '#5a3418'); px(g, 5, 4, 1, 3, '#a87440'); px(g, 10, 4, 1, 3, '#a87440');
    px(g, 1, 11, 2, 5, '#5a3418'); px(g, 13, 11, 2, 5, '#5a3418'); px(g, 3, 13, 10, 1, '#5a3418'); px(g, 6, 8, 4, 1, '#f2c230');
    px(g, 1, 2, 6, 2, '#b8c4d0'); px(g, 1, 2, 6, 1, '#eef3f8'); px(g, 7, 2, 2, 2, '#a06a36');      // のこぎり
    px(g, 12, 0, 1, 4, '#a06a36'); px(g, 10, 0, 4, 2, '#5a5a6a'); },
  き: g => { px(g, 4, 24, 8, 8, '#b5652a'); px(g, 3, 24, 10, 2, '#c87a3a'); px(g, 7, 14, 2, 10, '#7a4a2a'); px(g, 7, 14, 1, 10, '#5a341c');
    circle(g, 8, 9, 7, '#1d5a26'); circle(g, 8, 9, 6, '#2f8a3a'); circle(g, 5, 7, 3, '#3f9a44'); circle(g, 11, 11, 3, '#2a7a32'); circle(g, 6, 5, 1, '#6cc24a'); px(g, 10, 6, 1, 1, '#e04848'); px(g, 4, 11, 1, 1, '#e04848'); },
  トランポリン: g => { px(g, 2, 10, 2, 5, '#5a5a6a'); px(g, 12, 10, 2, 5, '#5a5a6a'); px(g, 1, 7, 14, 4, '#3a5ad8'); px(g, 2, 8, 12, 2, '#2a2a3a');
    for (const x of [2, 6, 10, 13]) px(g, x, 7, 1, 1, '#f2c230'); },
  トロフィー: g => { px(g, 4, 13, 8, 3, '#7a4a24'); px(g, 6, 11, 4, 2, '#d8a020'); px(g, 7, 9, 2, 2, '#d8a020'); px(g, 3, 2, 10, 7, '#d8a020'); px(g, 4, 3, 8, 5, '#ffd23f');
    px(g, 1, 3, 2, 4, '#d8a020'); px(g, 13, 3, 2, 4, '#d8a020'); px(g, 5, 3, 2, 3, '#fff3a0'); },
  ランプ: g => { px(g, 7, 9, 2, 5, '#5a3418'); px(g, 5, 14, 6, 2, '#5a3418'); px(g, 4, 2, 8, 7, '#2a1e1a');
    px(g, 5, 3, 6, 5, '#ffe27a'); px(g, 6, 4, 4, 3, '#fff6c8'); px(g, 3, 1, 10, 1, '#5a3418'); px(g, 7, 0, 2, 1, '#5a3418'); },
  ほねのいす: g => { px(g, 3, 1, 10, 7, '#2a1e1a'); px(g, 4, 2, 8, 5, '#f2f0e6'); for (const y of [3, 5]) px(g, 5, y, 6, 1, '#b8b4a6');
    px(g, 6, 2, 1, 1, '#3a3450'); px(g, 9, 2, 1, 1, '#3a3450');
    px(g, 2, 8, 12, 4, '#2a1e1a'); px(g, 3, 8, 10, 3, '#e6e2d4'); px(g, 3, 12, 2, 4, '#f2f0e6'); px(g, 11, 12, 2, 4, '#f2f0e6'); px(g, 3, 15, 2, 1, '#2a1e1a'); px(g, 11, 15, 2, 1, '#2a1e1a'); },
};
const cache = {};
// え(イーゼルに ぬりえが かざってある)
function easel() {
  const c = document.createElement('canvas'); c.width = T; c.height = T; const g = c.getContext('2d');
  px(g, 3, 11, 1, 5, '#7a4a24'); px(g, 12, 11, 1, 5, '#7a4a24'); px(g, 7, 11, 2, 4, '#5a3418');
  px(g, 0, 1, 16, 11, '#5a3418'); px(g, 1, 2, 14, 9, '#ffffff');
  const cols = room.paint || [];
  for (let y = 0; y < 9; y++) for (let x = 0; x < 14; x++) px(g, 1 + x, 2 + y, 1, 1, cols.length ? colorAt(cols, (x + .5) / 14, (y + .5) / 9) : '#f4f2ec');
  return c;
}
export function furnImg(look) {
  if (look === 'え') { const k = 'え' + (room.paint || []).join(); return cache[k] || (cache[k] = easel()); }
  if (cache[look]) return cache[look];
  const [w, h] = furnSize(look), c = document.createElement('canvas'); c.width = w * T; c.height = h * T;
  const g = c.getContext('2d'); (PAINT[look] || PAINT.タンス)(g);
  return cache[look] = c;
}

// ===== おける場所 =====
export const furnLook = id => byId('furniture', id)?.look || '';
export function cellsOf(f) { const [w, h] = furnSize(furnLook(f.id)); const out = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.push([f.x + x, f.y + y]); return out; }
// m: マップ、 list: おいてある かぐ、 skip: うごかしている かぐ、 blocked(x, y): 人などが いる マス
export function canPlace(m, list, id, x, y, skip, blocked) {
  const look = furnLook(id), flat = isFlat(look), [w, h] = furnSize(look);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    if (xx < 0 || yy < 0 || xx >= m.w || yy >= m.h || m.rows[yy][xx] !== '_') return false;                 // ゆか だけ
    if ((m.noFurn || []).some(([a, b]) => a === xx && b === yy)) return false;                              // 出入り口の まえ
    if (!flat && blocked(xx, yy)) return false;
    for (const f of list) if (f !== skip && isFlat(furnLook(f.id)) === flat && cellsOf(f).some(([a, b]) => a === xx && b === yy)) return false;
  }
  return true;
}
// マス (x, y) に ある かぐ(上に のっている物を さきに)
export function furnAt(list, x, y) {
  const hit = list.filter(f => cellsOf(f).some(([a, b]) => a === x && b === y));
  return hit.find(f => !isFlat(furnLook(f.id))) || hit[0] || null;
}
// あるけない マスの 一覧
export function solidCells(list) {
  const s = new Set();
  for (const f of list) if (!isFlat(furnLook(f.id))) for (const [x, y] of cellsOf(f)) s.add(x + ',' + y);
  return s;
}

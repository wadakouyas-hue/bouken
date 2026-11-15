// キャラと物のドット絵(12×16ドット)
// ねこの あたま(g ぶち t しま s くちもと e め p はな)
const HEAD = {
  down: [".kk......kk.", ".kgkkkkkkhk.", "kgghthhthhhk", "kghhhhhhhhhk", "khehhsshhehk", ".khhsppshhk."],
  up:   [".kk......kk.", ".khkkkkkkgk.", "khhhthhthggk", "khhhhhhhhhgk", "khhhhhhhhhhk", ".khhhhhhhhk."],
  side: ["...kk....kk.", "..kgkkkkkhk.", ".kgghthhthhk", ".kghhhhhhhhk", ".khhhhhhehsk", "..khhhhhsspk"]};
const BODY = {
  front: ["..krrrrrrk..", ".krrrrrrrrk.", ".ksrrrrrrsk.", ".kkrrrrrrkk."],
  side:  ["...krrrrk...", ".hkrrrrrk...", ".hkrrsrrk...", "..kkrrrkk..."]};   // h = しっぽ
const LEGS = {
  fA: ["..kbbbbbbk..", "..kbbkkbbk..", "..kbk..kbk..", ".kook..kook.", ".kkkk..kkkk.", "............"],
  fB: ["..kbbbbbbk..", "..kbbkkbbk..", "..kbk..kbk..", ".kook..kbk..", ".kkkk..kook.", ".......kkkk."],
  sA: ["...kbbbk....", "...kbbbk....", "...kbbbk....", "...koook....", "...kkkkk....", "............"],
  sB: ["...kbbbk....", "..kbk.kbk...", ".kbk...kbk..", ".kook..kook.", ".kkkk..kkkk.", "............"]};
LEGS.fC = LEGS.fB.map(r => r.split('').reverse().join(''));
// スカート(b = スカートの いろ、 h = あしの 毛)
const SKIRT = {
  fA: ["..kbbbbbbk..", ".kbbbbbbbbk.", ".kkkkkkkkkk.", "..khk..khk..", ".kook..kook.", ".kkkk..kkkk."],
  fB: ["..kbbbbbbk..", ".kbbbbbbbbk.", ".kkkkkkkkkk.", "..khk..khk..", ".kook..khk..", ".kkkk..kook."],
  sA: ["...kbbbk....", "..kbbbbbk...", "..kkkkkkk...", "...khhk.....", "...koook....", "...kkkkk...."],
  sB: ["...kbbbk....", "..kbbbbbk...", "..kkkkkkk...", "..khk.khk...", ".kook..kook.", ".kkkk..kkkk."]};
SKIRT.fC = SKIRT.fB.map(r => r.split('').reverse().join(''));
// 足もと(skirt: スカートの ねこ)
const legsOf = (side, f, skirt) => { const L = skirt ? SKIRT : LEGS; return side ? [L.sA, L.sB, L.sA, L.sB][f] : [L.fA, L.fB, L.fA, L.fC][f]; };

// 色 (k 輪郭 h 毛 g ぶち t しま s くちもと・手 e 目 p はな r 上着 b ズボン o くつ)
export const PAL = {
  hero:  { skirt: true, k: '#2a1e1a', h: '#f4f2ec', g: '#9a9aa8', s: '#ffffff', e: '#2a1e1a', p: '#f08aa0', r: '#e04848', b: '#3a5ad8', o: '#5a3a22' },   // しろに はいいろの ぶち
  melo:  { skirt: true, k: '#2a1e1a', h: '#f4f2ec', g: '#9a9aa8', s: '#ffffff', e: '#2a1e1a', p: '#f08aa0', r: '#5ab0a0', b: '#3a7a70', o: '#4a3a2a' },   // メロ(主人公と おなじ もよう)
  hamo:  { k: '#2a1e1a', h: '#f0a050', t: '#b8601e', s: '#ffe2b8', e: '#2a1e1a', p: '#e07a6a', r: '#7a5a3a', b: '#3a4a6a', o: '#3a2a1a' },   // ハモ(ちゃトラ)
  oji:   { k: '#2a1e1a', h: '#a8a8b4', t: '#787884', s: '#e8e8ee', e: '#2a1e1a', p: '#f08aa0', r: '#4f9a52', b: '#7a6a50', o: '#4a3a2a' },
  girl:  { skirt: true, k: '#15101a', h: '#3a3a46', s: '#5a5a6a', e: '#ffd23f', p: '#f08aa0', r: '#f5a8cf', b: '#d84080', o: '#c04060' },
  oba:   { skirt: true, k: '#2a1e1a', h: '#f6f0e0', g: '#e09a4a', s: '#ffffff', e: '#2a1e1a', p: '#f08aa0', r: '#8a5ab8', b: '#6a4a8a', o: '#4a3a2a' },
  shop1: { k: '#2a1e1a', h: '#a87a4a', t: '#7a5230', s: '#f0dcc0', e: '#2a1e1a', p: '#e07a6a', r: '#4fb07a', b: '#e8e0c8', o: '#4a3a2a' },
  shop2: { k: '#2a1e1a', h: '#8a8a96', g: '#5a5a66', s: '#c8c8d2', e: '#2a1e1a', p: '#f08aa0', r: '#8a96a4', b: '#4a4a5a', o: '#2a2a2a' },
  shop3: { k: '#2a1e1a', h: '#f0dca0', t: '#d0a860', s: '#fff4d8', e: '#2a1e1a', p: '#f08aa0', r: '#e8a040', b: '#7a4a24', o: '#4a3a2a' },
  bank:  { k: '#15101a', h: '#2e2e38', s: '#ffffff', e: '#ffd23f', p: '#f08aa0', r: '#2a3a6a', b: '#2a3a6a', o: '#1a1a1a' },
  obj:  { k: '#2a1e1a', w: '#e0ab62', d: '#8a5a2a', p: '#8a5a2a', c: '#b5652a', y: '#f2c230', x: '#3a2210',
          g: '#dff4ff', l: '#4fd16a', L: '#c8ffd0', n: '#b07a40' }};

const SIGN = ["............", "............", "............", "............", "kkkkkkkkkkkk", "kwwwwwwwwwwk", "kwddddddddwk", "kwwwwwwwwwwk", "kwddddddwwwk", "kwwwwwwwwwwk", "kkkkkkkkkkkk", "....kppk....", "....kppk....", "....kppk....", "....kppk....", "....kkkk...."];
const CHEST = ["............", "............", "............", "............", "............", "............", ".kkkkkkkkkk.", ".kcccccccck.", ".kcccyyccck.", ".kyyyyyyyyk.", ".kcccyyccck.", ".kcccccccck.", ".kcccccccck.", ".kyyyyyyyyk.", ".kkkkkkkkkk.", "............"];
const CHEST_OPEN = ["............", "............", "............", ".kkkkkkkkkk.", ".kcccccccck.", ".kyyyyyyyyk.", ".kkkkkkkkkk.", ".kxxxxxxxxk.", ".kxxxxxxxxk.", ".kyyyyyyyyk.", ".kcccyyccck.", ".kcccccccck.", ".kcccccccck.", ".kyyyyyyyyk.", ".kkkkkkkkkk.", "............"];
// かいふくやく(びん)
const POTION = ["............", "............", "............", "............", "............", ".....kk.....", "....knnk....", "....kkkk....", "....kggk....", "...kggggk...", "..kllllllk..", "..kLlllllk..", "..kLlllllk..", "..kllllllk..", "...kkkkkk...", "............"];

// きの えだ(おちている ざいりょう)
const BRANCH = ["............", "............", "............", "............", "............", "............", "............", "............", "..........k.", ".........kn.", "...kk...knk.", "..knnkkknk..", "..kknnnnk...", "...kkknnnk..", "......kkkk..", "............"];

function build(rows, pal, flip) {
  const w = rows[0].length;
  const c = document.createElement('canvas'); c.width = w; c.height = rows.length; const g = c.getContext('2d');
  rows.forEach((r, y) => { for (let x = 0; x < w; x++) { const ch = r[x]; if (!ch || ch === '.') continue; g.fillStyle = pal[ch]; g.fillRect(flip ? w - 1 - x : x, y, 1, 1); } });
  return c;
}
const cache = {};
export function charSprite(palName, dir, f) {
  const key = palName + dir + f; if (cache[key]) return cache[key];
  const side = (dir === 'left' || dir === 'right');
  const head = side ? HEAD.side : HEAD[dir];
  const body = side ? BODY.side : BODY.front;
  const base = PAL[palName] || PAL.oji, legs = legsOf(side, f, base.skirt), pal = { g: base.h, t: base.h, p: '#f08aa0', ...base };   // ぶち・しまが ない ねこは 毛の いろ
  const c = build([...head, ...body, ...legs], pal, dir === 'left');
  if (palName === 'hamo') drawGuitar(c.getContext('2d'), dir);
  return cache[key] = c;
}
// ハモが せなかに しょっている ギター
function drawGuitar(g, dir) {
  const p = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if (dir === 'up') { p(5, 2, 2, 6, '#5a3418'); p(3, 7, 6, 3, '#d0782a'); p(3, 10, 6, 3, '#e08a3a'); p(5, 9, 2, 2, '#3a2210'); p(2, 8, 1, 4, '#2a1e1a'); p(9, 8, 1, 4, '#2a1e1a'); }
  else if (dir === 'down') { p(10, 1, 1, 7, '#5a3418'); p(9, 0, 2, 1, '#2a1e1a'); }
  else { const x = dir === 'left' ? 9 : 1; p(x, 0, 1, 8, '#5a3418'); p(x + (dir === 'left' ? 0 : 0), 7, 2, 4, '#d0782a'); }
}
export const SPR = { sign: build(SIGN, PAL.obj), chest: build(CHEST, PAL.obj), chestOpen: build(CHEST_OPEN, PAL.obj), potion: build(POTION, PAL.obj), branch: build(BRANCH, PAL.obj) };

// ===== てき(16×16ドット) =====
const ENEMY = {
  きのこ: { pal: { k: '#2a1e1a', r: '#e04848', w: '#ffffff', s: '#f6e7c8', e: '#2a1e1a', p: '#e07070', f: '#8a5a2a' }, rows: [
    '................',
    '.....kkkkkk.....',
    '...kkrrrrrrkk...',
    '..krrwwrrrrrrk..',
    '.krrwwwrrrwwrrk.',
    '.krrrrrrrrwwrrk.',
    'krrrrrwwrrrrrrrk',
    'kkkkkkkkkkkkkkkk',
    '...kssssssssk...',
    '...ksessssesk...',
    '...ksssppsssk...',
    '...kssssssssk...',
    '....kssssssk....',
    '...kkkk..kkkk...',
    '..kffffk.kffffk.',
    '..kkkkkk.kkkkkk.'] },
  どんぐり: { pal: { k: '#2a1e1a', c: '#7a4a24', C: '#5a3418', b: '#c8894a', e: '#2a1e1a', p: '#e07070' }, rows: [
    '......kk........',
    '.......kk.......',
    '....kkkkkkkk....',
    '..kkccCccCcckk..',
    '.kcCccCccCccCck.',
    '.kkkkkkkkkkkkkk.',
    '..kbbbbbbbbbbk..',
    '..kbbebbbbebbk..',
    '..kbbebbbbebbk..',
    '.kkbbbbbbbbbbkk.',
    '..kbbbbppbbbbk..',
    '..kbbbbbbbbbbk..',
    '...kbbbbbbbbk...',
    '....kbbbbbbk....',
    '.....kkkkkk.....',
    '................'] },
  はっぱ: { pal: { k: '#2a1e1a', g: '#5cc45a', G: '#2f8a3a', e: '#2a1e1a', p: '#e07070' }, rows: [
    '........kk......',
    '......kkggk.....',
    '.....kgggggk....',
    '....kgggggggk...',
    '...kgggGgggggk..',
    '..kggggGggggggk.',
    '.kgggegGggeggggk',
    '.kgggegGggeggggk',
    '.kggggggGgggggk.',
    '.kgggpppGgggggk.',
    '..kggggggGgggk..',
    '...kggggggGgk...',
    '....kggggggk....',
    '.....kkkkkk.....',
    '......k..k......',
    '.....kk..kk.....'] },
  // ガラガラ おおがらす(ボス。 ひかる ものが すき)
  からす: { pal: { k: '#15101a', b: '#2e2a40', B: '#4a4560', w: '#ffffff', y: '#f2c230', f: '#e8a040' }, rows: [
    '................',
    '......kkkkk.....',
    '....kkbbbbbk....',
    '...kbbbbbbbbk...',
    '...kbbbbbkwbbk..',
    '..kbbbbbbkkbbk..',
    '.kbbbbbbbbbyyyyk',
    'kbbbbBBbbbbyyyk.',
    'kbbbBBBBbbbkkk..',
    'kbbbBBBBBbbk....',
    '.kbbbBBBbbbk....',
    '..kbbbbbbbk.....',
    '...kbbbbbk......',
    '....kfkfk.......',
    '...kffkffk......',
    '...kkk.kkk......'] },
  // よるの まもの(目は 4〜5れつめ と 10〜11れつめ、 6〜7ぎょうめ。 くらやみで 光る)
  ゾンビねこ: { pal: { k: '#2a1e1a', f: '#86b07e', F: '#5f8a5a', s: '#3a2a2a', e: '#d8ff5a', p: '#c87a8a' }, rows: [
    '................',
    '.kk..........kk.',
    '.kfk........kfk.',
    '.kffkkkkkkkkffk.',
    'kffffffffffffffk',
    'kfFfffffffffsfFk',
    'kfffeeffffeefsfk',
    'kfffeeffffeefffk',
    'kfsffffppffffffk',
    'kfsfffkffkfffffk',
    '.kffffkkkkfffFk.',
    '..kffffffffffk..',
    '..kfFfssfffffk..',
    '..kffffffffffk..',
    '..kffk....kffk..',
    '..kkkk....kkkk..'] },
  ほねほね: { pal: { k: '#2a1e1a', w: '#f2f0e6', d: '#3a3450', e: '#7ad8ff' }, rows: [
    '................',
    '.kk..........kk.',
    '.kwk........kwk.',
    '.kwwkkkkkkkkwwk.',
    'kwwwwwwwwwwwwwwk',
    'kwwwddwwwwddwwwk',
    'kwwweewwwweewwwk',
    'kwwwddwkkwddwwwk',
    '.kwwkwkwwkwkwwk.',
    '..kkwwwwwwwwkk..',
    '...kwkkkkkkwk...',
    '...kwwwwwwwwk...',
    '...kwkkkkkkwk...',
    '...kwwwwwwwwk...',
    '..kwwk....kwwk..',
    '..kkkk....kkkk..'] },
};
const ecache = {};
export function enemySprite(look) {
  const d = ENEMY[look] || ENEMY.きのこ;
  return ecache[look] || (ecache[look] = build(d.rows, d.pal));
}
export const ENEMY_ROWS = ENEMY;
export const eyeColor = look => (ENEMY[look] || ENEMY.きのこ).pal.e;   // くらやみで 光る 目の いろ   // 確認用

// ===== 主人公(そうびで 見た目が かわる) =====
// よろい: 上着(r)と ズボン(b)の色、ベルト
const ARMOR = {
  ぬの: { r: '#e2d2a8', b: '#7a6a50' },
  かわ: { r: '#a0683a', b: '#4a3020', belt: '#f2c230' },
  てつ: { r: '#b8c4d0', b: '#5a6a7a', belt: '#f2c230' },
};
// ぶき: 手に持つ位置に 描く(x = 持つ場所)
function drawWeapon(g, look, x, flip, side) {
  const X = v => flip ? 11 - v : v;
  const p = (xx, y, h, c) => { g.fillStyle = c; g.fillRect(X(xx), y, 1, h); };
  if (side) {   // よこむき: 手から 前に むけて もつ
    if (look === 'ぼう') for (let i = 5; i <= 11; i++) { p(i, 8, 1, '#a06a36'); p(i, 9, 1, '#5a3418'); }
    else if (look === 'けん') { p(4, 8, 1, '#7a4a24'); p(5, 8, 1, '#7a4a24'); p(6, 7, 3, '#f2c230'); for (let i = 7; i <= 11; i++) { p(i, 8, 1, '#eef3f8'); p(i, 9, 1, '#8a96a4'); } }
    return;
  }
  if (look === 'ぼう') { p(x, 3, 10, '#a06a36'); p(x + 1, 3, 10, '#5a3418'); }
  else if (look === 'けん') { p(x, 1, 8, '#eef3f8'); p(x + 1, 1, 8, '#8a96a4'); p(x - 1, 9, 1, '#f2c230'); p(x, 9, 1, '#f2c230'); p(x + 1, 9, 1, '#f2c230'); p(x, 10, 3, '#7a4a24'); }
}
const hcache = {};
export function heroSprite(dir, f, look = {}) {
  const key = dir + f + (look.armor || '') + '/' + (look.weapon || '');
  if (hcache[key]) return hcache[key];
  const side = dir === 'left' || dir === 'right', flip = dir === 'left';
  const legs = legsOf(side, f, true);   // 主人公は スカート
  const a = ARMOR[look.armor] || {};
  const c = build([...(side ? HEAD.side : HEAD[dir]), ...(side ? BODY.side : BODY.front), ...legs], { t: PAL.hero.h, ...PAL.hero, ...a }, flip);
  const g = c.getContext('2d');
  if (a.belt) { g.fillStyle = a.belt; if (side) g.fillRect(flip ? 4 : 3, 9, 5, 1); else g.fillRect(2, 9, 8, 1); }
  if (look.weapon) drawWeapon(g, look.weapon, dir === 'down' ? 10 : 0, flip, side);
  return hcache[key] = c;
}

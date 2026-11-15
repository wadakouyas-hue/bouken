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
  paint: { k: '#2a1e1a', h: '#d8c0a0', g: '#8a5a3a', s: '#fff4e0', e: '#2a1e1a', p: '#f08aa0', r: '#e04848', b: '#3a3a6a', o: '#2a2a2a' },   // えかきの ねこ
  mogu:  { skirt: true, k: '#2a1e1a', h: '#f4f2ec', g: '#e09a4a', t: '#4a3a3a', s: '#ffffff', e: '#2a1e1a', p: '#f08aa0', r: '#ffffff', b: '#4fb07a', o: '#4a3a2a' },   // モグ(みけ。 しろい エプロン)
  pasha: { k: '#15101a', h: '#3a3a46', s: '#ffffff', e: '#7ad87a', p: '#f08aa0', r: '#f2c230', b: '#3a3a5a', o: '#1a1a1a' },   // パシャ(くろねこ。 カメラ)
  popo:  { skirt: true, k: '#2a1e1a', h: '#e8e4dc', g: '#b8b4ac', s: '#ffffff', e: '#2a1e1a', p: '#f08aa0', r: '#b07ab8', b: '#8a5a9a', o: '#4a3a2a' },   // ポポばあちゃん(やさしい おばあちゃん)
  mfam:  { k: '#2a1e1a', h: '#f4f2ec', g: '#9a9aa8', s: '#ffffff', e: '#2a1e1a', p: '#f08aa0', r: '#5a8ad8', b: '#3a4a6a', o: '#4a3a2a' },   // メロの かぞく(メロと おなじ もよう)
  hfam:  { k: '#2a1e1a', h: '#f0a050', t: '#b8601e', s: '#ffe2b8', e: '#2a1e1a', p: '#e07a6a', r: '#d8a040', b: '#5a4a3a', o: '#3a2a1a' },   // ハモの ふるさとの ねこ(ちゃトラ)
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
  if (palName === 'pasha' && dir !== 'up') { const g = c.getContext('2d'); g.fillStyle = '#2a2a2a'; g.fillRect(side ? (dir === 'left' ? 1 : 6) : 3, 7, 5, 4); g.fillStyle = '#9fd2ff'; g.fillRect(side ? (dir === 'left' ? 2 : 8) : 5, 8, 2, 2); }   // カメラ
  if (palName === 'popo' && dir !== 'up') { const g = c.getContext('2d'); g.fillStyle = '#c84a6a'; g.fillRect(side ? 3 : 2, 6, side ? 6 : 8, 1); }   // かたかけ
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

// ===== かざり(テント・たきび・ことりの いえ) =====
function paintCv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn((x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }); return c; }
export const DECO = {
  tent: paintCv(28, 20, p => { for (let y = 0; y < 18; y++) { const w = Math.round(2 + y * 1.4); p(14 - w / 2, y + 1, w, 1, y % 4 === 0 ? '#e8a040' : '#f0c060'); }
    p(14, 1, 1, 18, '#a87020'); for (let y = 8; y < 19; y++) { const w = Math.round((y - 8) * 0.8); p(14 - w / 2, y, w, 1, '#3a2a1a'); } p(0, 19, 28, 1, '#5a4a2a'); }),
  fire: [0, 1].map(f => paintCv(12, 12, p => { p(1, 9, 10, 2, '#7a4a24'); p(2, 8, 2, 4, '#5a3418'); p(8, 8, 2, 4, '#5a3418');
    p(3, 4 + f, 6, 5 - f, '#e8401a'); p(4, 2 - f + 1, 4, 6, '#ff8a2a'); p(5, 1 + f, 2, 6, '#ffd23f'); p(5, 6, 2, 2, '#fff3a0'); })),
  birdhouse: paintCv(10, 12, p => { p(0, 2, 10, 2, '#c84a3a'); p(1, 0, 8, 2, '#e05a4a'); p(1, 4, 8, 7, '#d8a060'); p(4, 6, 2, 2, '#3a2210'); p(4, 11, 2, 1, '#7a4a24'); p(2, 4, 1, 7, '#b8804a'); }),
  bird: paintCv(6, 5, p => { p(1, 1, 4, 3, '#5ab0ff'); p(0, 2, 1, 1, '#5ab0ff'); p(5, 2, 1, 1, '#f2c230'); p(3, 1, 1, 1, '#2a1e1a'); p(1, 4, 1, 1, '#e8a040'); p(3, 4, 1, 1, '#e8a040'); }),
  // きたの もり: ランタン(0 きえている / 1 ついている)・おおきな はな(いろ なし / いろ あり)・ミミズクの す
  lantern: [0, 1].map(on => paintCv(10, 16, p => { p(4, 8, 2, 8, '#5a3418'); p(2, 14, 6, 2, '#3a2210'); p(2, 1, 6, 1, '#3a3430'); p(1, 2, 8, 7, '#3a3430');
    p(2, 3, 6, 5, on ? '#ffd23f' : '#4a4a58'); if (on) { p(4, 4, 2, 3, '#fff3a0'); } p(4, 0, 2, 1, '#3a3430'); })),
  flowerG: paintCv(20, 22, p => { p(9, 10, 2, 12, '#6a6a66'); p(4, 14, 5, 2, '#7a7a76'); p(11, 16, 5, 2, '#7a7a76');
    for (const [x, y] of [[10, 1], [3, 5], [17, 5], [5, 11], [15, 11]]) p(x - 3, y - 1, 6, 5, '#b4b4b0'); p(6, 4, 8, 7, '#d8d8d4'); p(8, 6, 4, 3, '#8a8a86'); }),
  flowerC: paintCv(20, 22, p => { p(9, 10, 2, 12, '#3a8a3e'); p(4, 14, 5, 2, '#4fb14f'); p(11, 16, 5, 2, '#4fb14f');
    const pc = ['#ff5a6e', '#ff8ad0', '#ffd23f', '#7ac8ff', '#b07ae8']; [[10, 1], [3, 5], [17, 5], [5, 11], [15, 11]].forEach(([x, y], i) => p(x - 3, y - 1, 6, 5, pc[i])); p(6, 4, 8, 7, '#ffe8a0'); p(8, 6, 4, 3, '#f2a030'); }),
  nest: paintCv(40, 14, p => { p(2, 4, 36, 8, '#7a5230'); p(0, 6, 40, 4, '#8a6238'); for (let x = 1; x < 39; x += 3) p(x, 3 + (x % 2), 4, 1, '#a87a4a'); p(4, 11, 32, 2, '#5a3a1c'); for (let x = 3; x < 37; x += 5) p(x, 8, 3, 1, '#5a3a1c'); }),
  herb: paintCv(12, 14, p => { p(5, 6, 2, 8, '#3a8a5a'); p(2, 9, 3, 2, '#4fb07a'); p(7, 10, 3, 2, '#4fb07a');
    for (const [x, y] of [[5, 0], [1, 3], [9, 3], [3, 6], [7, 6]]) { p(x, y, 3, 3, '#7ac8ff'); p(x + 1, y + 1, 1, 1, '#ffffff'); } p(5, 3, 2, 2, '#ffd23f'); }),
  firefly: paintCv(5, 5, p => { p(1, 1, 3, 3, '#d8ff7a'); p(2, 0, 1, 5, '#a8e050'); p(0, 2, 5, 1, '#a8e050'); p(2, 2, 1, 1, '#ffffff'); }),
};

DECO.lanternOn = DECO.lantern[1]; DECO.lantern = DECO.lantern[0];

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
  // ===== きたの もり(第2章)。 eye: くらやみで 光る 目の ばしょ [ひだりの x, みぎの x, y]、 glow: その いろ =====
  かえる: { eye: [2, 11, 4], glow: '#ffd23f', pal: { k: '#1a2a1a', g: '#5cc45a', G: '#2f8a3a', w: '#ffffff', y: '#e8f0a0', p: '#ff8a9a' }, rows: [
    '................',
    '................',
    '................',
    '..kkk......kkk..',
    '.kwwwk....kwwwk.',
    '.kwkwkkkkkkwkwk.',
    'kggggggggggggggk',
    'kggGggggggggGggk',
    'kggkkkkkkkkkkggk',
    'kgggppggggppgggk',
    '.kgggyyyyyygggk.',
    '.kggyyyyyyyyggk.',
    'kggggyyyyyyggggk',
    'kgGgkkkkkkkkgGgk',
    'kggk........kggk',
    'kkkk........kkkk'] },
  スカンク: { eye: [3, 11, 7], glow: '#ffe066', pal: { k: '#141018', b: '#3a3448', w: '#f4f2ff', e: '#ffe066', p: '#e07070' }, rows: [
    '.....kkkkkk.....',
    '...kkwwwwwwkk...',
    '..kbwwwbbwwwbk..',
    '..kbbbwbbwbbbk..',
    '.kk.kkkkkkkk.kk.',
    '.kbkbbbwwbbbkbk.',
    '.kbbbbbwwbbbbbk.',
    'kbbeebbwwbbeebbk',
    'kbbeebbwwbbeebbk',
    'kbbbbbbppbbbbbbk',
    '.kbppbbbbbbppbk.',
    '..kbbbbbbbbbbk..',
    '.kbbbwwwwwwbbbk.',
    '.kbbwwwwwwwwbbk.',
    '.kbbkk....kkbbk.',
    '.kkkk......kkkk.'] },
  いのしし: { eye: [4, 10, 7], glow: '#ff7a3a', pal: { k: '#2a1a10', b: '#9a6234', B: '#7a4a24', w: '#fff6e0', p: '#e8a0a0', e: '#1a1010' }, rows: [
    '................',
    '................',
    '..kk........kk..',
    '.kbbk......kbbk.',
    '.kbbbkkkkkkbbbk.',
    'kbbbbbbbbbbbbbbk',
    'kbbbBbbbbbbBbbbk',
    'kbbbeebbbbeebbbk',
    'kbbbeebbbbeebbbk',
    'kbbbbkppppkbbbbk',
    'kbwbkppkkppkbwbk',
    '.kwbkppppppkbwk.',
    '..kbbkkkkkkbbk..',
    '..kbbbbbbbbbbk..',
    '..kbbk....kbbk..',
    '..kkkk....kkkk..'] },
  こうもり: { eye: [5, 9, 6], glow: '#ff4a6a', pal: { k: '#1a1020', p: '#7a4aa8', w: '#ffffff', e: '#ff4a6a' }, rows: [
    '................',
    '................',
    '....k......k....',
    '...kpk....kpk...',
    'k..kppkkkkppk..k',
    'kk.kppppppppk.kk',
    'kpkkpeeppeepkkpk',
    'kppkpeeppeepkppk',
    'kpppkppwwppkpppk',
    'kpppkpwppwpkpppk',
    'kppkkkppppkkkppk',
    'kpk..kkppkk..kpk',
    'kk....kkkk....kk',
    '................',
    '................',
    '................'] },
  // ちゅうちゅう ねずみ(パルル町の ちかしつ)
  ねずみ: { eye: [5, 9, 6], glow: '#ff4a4a', pal: { k: '#2a1e2a', g: '#a8a4b8', p: '#ff9ab0', w: '#ffffff', e: '#2a1e2a' }, rows: [
    '................',
    '.kkk........kkk.',
    'kgggk......kgggk',
    'kgppk......kppgk',
    'kgppkkkkkkkkppgk',
    '.kkggggggggggkk.',
    '..kggeeggeeggk..',
    '..kggeeggeeggk..',
    '..kggggppggggk..',
    '.wkgggkkkkgggkw.',
    '..kggggggggggk..',
    '...kgggwwgggk...',
    '..kggggwwggggk..',
    '...kggggggggk.pp',
    '...kkgk..kgkk.p.',
    '....kk....kk....'] },
  // おとどろぼうの ミミズク(ボス)
  ミミズク: { eye: [4, 10, 5], glow: '#ffd23f', pal: { k: '#1e140c', b: '#8a5a32', B: '#6a4224', w: '#e8d8b8', y: '#ffd23f', o: '#e8a040', f: '#f2c230' }, rows: [
    '.kk..........kk.',
    '.kbk........kbk.',
    '..kbkkkkkkkkbk..',
    '..kbbbbbbbbbbk..',
    '.kbbyyybbyyybbk.',
    '.kbykkybbykkybk.',
    '.kbykkybbykkybk.',
    '.kbbyyyooyyybbk.',
    'kbbbbbboobbbbbbk',
    'kbBwBwBwBwBwBwbk',
    'kbwBwBwBwBwBwBbk',
    'kbBwBwBwBwBwBwbk',
    '.kbwBwBwBwBwBbk.',
    '..kbbbbbbbbbbk..',
    '...kfkfk.kfkfk..',
    '...kkkkk.kkkkk..'] },
  // ぐるぐる つむじかぜ(かぜの のはら)
  つむじかぜ: { eye: [5, 9, 4], glow: '#2a1e1a', pal: { k: '#3a4a5a', w: '#e8f0f8', g: '#a8b8c8', e: '#2a1e1a', d: '#8a7a5a' }, rows: [
    '................',
    '.kkkkkkkkkkkkkk.',
    'kwwwwggggggwwwwk',
    '.kkwwwwwwwwwwkk.',
    '..kggeeggeeggk..',
    '..kggeeggeeggk..',
    '...kkwwwwwwkk...',
    '...kwwggggwwk...',
    '....kkggggkk....',
    '....kwwwwwwk....',
    '.....kggggk.....',
    '.....kwwwwk.....',
    '......kggk......',
    '......kwwk......',
    '.......kk.......',
    '...dd......dd...'] },
  // べろべろ かさおばけ
  かさおばけ: { eye: [4, 4, 5], glow: '#ff4a4a', pal: { k: '#2a1e2a', u: '#b05ac8', U: '#7a3a98', w: '#ffffff', e: '#2a1e2a', t: '#ff5a7a', l: '#d8a060' }, rows: [
    '.......kk.......',
    '.....kkuukk.....',
    '...kkuuuuuukk...',
    '..kuuuuuuuuuuk..',
    '.kuwwwwuuuuuuuk.',
    '.kuwweewuuuuuuk.',
    'kuuwweewuuuuuuuk',
    'kuuuwwwwuuttuuuk',
    'kUkUkUkUkUttkUkk',
    '.k.k.k.kkkttk.k.',
    '.......klk......',
    '.......klk......',
    '.......klk......',
    '......kllk......',
    '......kllkk.....',
    '......kkkk......'] },
  // びりびり うなぎ(かみなりの ぬま)
  うなぎ: { eye: [5, 5, 4], glow: '#fff3a0', pal: { k: '#1e2a1e', y: '#d8d040', Y: '#a8a020', e: '#2a1e1a', z: '#fff3a0' }, rows: [
    '..........z.....',
    '.........zz.....',
    '....kkkk..z.....',
    '...kyyyyk.......',
    '..kyyeeyyk......',
    '..kyyeeyyyk.....',
    '..kyyyyyYyk.....',
    '...kkyyYYyk.....',
    '.....kyyyyk.....',
    '....kyyYyk......',
    '...kyyyyk..kk...',
    '..kyyYyyk.kyyk..',
    '..kyyyyyykyyYk..',
    '...kyyYyyyyyk...',
    '....kkyyyyykk...',
    '......kkkkk.....'] },
  // しとしと あまぐも
  あまぐも: { eye: [4, 10, 5], glow: '#7ac8ff', pal: { k: '#3a4a6a', c: '#e8eef8', C: '#b8c4d8', e: '#2a1e2a', p: '#ff9ab0', b: '#5aa0f0' }, rows: [
    '................',
    '.....kkkk.......',
    '....kcccck.kkk..',
    '..kkcccccckccck.',
    '.kcccccccccccck.',
    'kccceecccceeccck',
    'kccceecccceeccck',
    'kcpcccckkccccpck',
    '.kCCCCCCCCCCCCk.',
    '..kkkkkkkkkkkk..',
    '...b....b....b..',
    '...b....b....b..',
    '.....b....b.....',
    '.....b....b.....',
    '...b....b....b..',
    '................'] },
  // かみなりぐも(ボス)
  かみなりぐも: { eye: [4, 10, 5], glow: '#ffd23f', pal: { k: '#1a1428', c: '#5a5a78', C: '#3a3a52', e: '#ffd23f', b: '#ffd23f' }, rows: [
    '.....kkkk.......',
    '....kcccck.kkk..',
    '..kkcccccckccck.',
    '.kcccccccccccck.',
    'kcckkcccccckkcck',
    'kccceecccceeccck',
    'kccceecccceeccck',
    'kccccckkkkccccck',
    'kcccckCCCCkcccck',
    '.kCCCCCCCCCCCCk.',
    '..kkkkkkkkkkkk..',
    '...bb.....bb....',
    '..bb.....bb.....',
    '...bb.....bb....',
    '....b......b....',
    '................'] },
  // ごろごろ いわごろ(あれた たに)
  いわごろ: { eye: [3, 10, 6], glow: '#ffd23f', pal: { k: '#2a2a30', r: '#8a8a96', R: '#6a6a76', w: '#b8b8c4', e: '#2a1e1a', m: '#5a9a4a' }, rows: [
    '................',
    '................',
    '.....kkkkkk.....',
    '...kkmmmmrrkk...',
    '..kmmrrrrrrrwk..',
    '..krrrrrrrrrrk..',
    '.krreerrrreerrk.',
    '.krreerrrreerrk.',
    '.krrrrrrrrrrRrk.',
    '.krrrrkkkkrrRrk.',
    '.kRrrrrrrrrrRRk.',
    '..kRRrrrrrrRRk..',
    '..kRRRRRRRRRRk..',
    '...kkRRRRRRkk...',
    '.....kkkkkk.....',
    '................'] },
  // ふわふわ おばけび(こわい もり)
  おばけび: { eye: [5, 9, 6], glow: '#7ac8ff', pal: { k: '#1a2a5a', b: '#5aa0ff', B: '#3a6ad8', w: '#cfe8ff', e: '#1a1a3a' }, rows: [
    '.......k........',
    '......kbk.......',
    '.....kbwbk......',
    '....kbwwbk..k...',
    '...kbbwwbbk.kbk.',
    '..kbbbbbbbbkbk..',
    '..kbbeebbeebbk..',
    '.kbbbeebbeebbbk.',
    '.kbbbbbbbbbbbbk.',
    '.kbbbbkkkbbbbbk.',
    '.kBbbbbbbbbbbBk.',
    '..kBBbbbbbbBBk..',
    '...kBBBBBBBBk...',
    '....kkBBBBkk....',
    '......kkkk......',
    '................'] },
  // びっくり きのこ
  びっくりきのこ: { eye: [5, 10, 9], glow: '#ffffff', pal: { k: '#2a1a2a', p: '#a050c8', P: '#7a3098', w: '#ffffff', e: '#1a1a1a', s: '#f0e0c8', d: '#e0c0f0' }, rows: [
    '................',
    '.....kkkkkk.....',
    '...kkppddppkk...',
    '..kppppppppppk..',
    '.kppdpppppdpppk.',
    '.kpppppppppppdk.',
    'kPPPPPPPPPPPPPPk',
    '.kkkkkkkkkkkkkk.',
    '...kwwwskwwwsk..',
    '...kweeskweesk..',
    '...kwwwskwwwsk..',
    '...ksssssssssk..',
    '...kssskkkssk...',
    '....kssssssk....',
    '.....kkkkkk.....',
    '................'] },
  // もじゃもじゃ もりぐも
  もりぐも: { eye: [5, 9, 6], glow: '#ff4a4a', pal: { k: '#1a1a1a', b: '#3a2e3a', B: '#5a4a5a', r: '#ff4a4a', w: '#ffffff' }, rows: [
    '................',
    '................',
    '.k....kkkk....k.',
    '..k..kbbbbk..k..',
    '...kkbbbbbbkk...',
    'kk..kbbbbbbk..kk',
    '..kkbrrbbrrbkk..',
    '....kbbbbbbk....',
    '.kkkbbwbbwbbkkk.',
    'k...kbbbbbbk...k',
    '...kkBbbbbBkk...',
    '..k..kBbbBk..k..',
    '.k....kkkk....k.',
    'k..............k',
    '................',
    '................'] },
  // ころころ ゆきだるま(ゆきの やま)
  ゆきだるま: { eye: [5, 9, 4], glow: '#7ac8ff', pal: { k: '#3a4a6a', w: '#ffffff', g: '#cfe0f0', e: '#1a1a2a', n: '#ff8a2a', r: '#e04848', b: '#6a4a2a' }, rows: [
    '.....kkkkk......',
    '....kbbbbbk.....',
    '...kkkkkkkkk....',
    '....kwwwwwk.....',
    '...kwewwwewk....',
    '...kwwnnwwwk....',
    '...kgwwwwwgk....',
    '..krrrrrrrrrk...',
    '.kwwwwwwwwwwwk..',
    'kwwwwwwkwwwwwwk.',
    'kwwwwwwwwwwwwwk.',
    'kgwwwwwkwwwwwgk.',
    'kggwwwwwwwwwggk.',
    '.kggggggggggggk.',
    '..kkkkkkkkkkkk..',
    '................'] },
  // つらら こうもり
  つららこうもり: { eye: [7, 9, 5], glow: '#7ae8ff', pal: { k: '#1a2a4a', b: '#4a6aa8', B: '#2a4a88', w: '#e6f8ff', i: '#9fd6f2', e: '#ffffff' }, rows: [
    '................',
    '................',
    'k.....k..k.....k',
    'bk...kbkkbk...kb',
    'bbk..kbbbbk..kbb',
    'bbbk.kbebebk.kbb',
    'bbbbkkbbbbbkkbbb',
    '.bbbbbbwbwbbbbb.',
    '..BbbbbbbbbbbB..',
    '...B.BbbbbB.B...',
    '......kiik......',
    '.......ii.......',
    '.......i........',
    '................',
    '................',
    '................'] },
  // ぴょん ゆきうさぎ
  ゆきうさぎ: { eye: [5, 9, 6], glow: '#ff7a9a', pal: { k: '#5a6a8a', w: '#ffffff', g: '#d8e4f0', p: '#ffb0c8', e: '#e0405a' }, rows: [
    '....kk...kk.....',
    '...kwpk.kwpk....',
    '...kwpk.kwpk....',
    '...kwwk.kwwk....',
    '....kwkkkwk.....',
    '...kwwwwwwwk....',
    '..kwwewwwewwk...',
    '..kwwwwpwwwwk...',
    '..kpwwwwwwwpk...',
    '...kwwwwwwwk....',
    '..kwwwwwwwwwk...',
    '.kgwwwwwwwwwgk..',
    '.kgwwwwwwwwwgkk.',
    '..kggwwwwwggkwk.',
    '...kkkkkkkkk.k..',
    '................'] },
  // すべる ペンギン
  ペンギン: { eye: [6, 8, 3], glow: '#ffd23f', pal: { k: '#1a1a2a', b: '#2a3a5a', w: '#ffffff', y: '#ffb02a', e: '#1a1a2a', r: '#e04848' }, rows: [
    '.....kkkkk......',
    '....kbbbbbk.....',
    '...kbbbbbbbk....',
    '...kbwewewbk....',
    '...kbwwyywbk....',
    '...kbbwyywbbk...',
    '..kbbwwwwwwbk...',
    '.kbbwwwwwwwwbk..',
    '.kbbwwwwwwwwbk..',
    'kbb.kwwwwwwk.bk.',
    'kb..kwwwwwwk..k.',
    '....kwwwwwwk....',
    '....kbwwwwbk....',
    '.....kkkkkk.....',
    '....yyy..yyy....',
    '................'] },
  // こおりの ぬし(ボス)
  こおりのぬし: { eye: [4, 10, 5], glow: '#7ae8ff', pal: { k: '#1a2a4a', w: '#ffffff', i: '#bfe8ff', I: '#7ab8e0', d: '#4a7ab0', e: '#1a3a8a', t: '#e6f8ff' }, rows: [
    '..t....tt....t..',
    '..kt..kiik..tk..',
    '...kkkiiiikkk...',
    '..kiiiiiiiiiik..',
    '.kiiwiiiiiiwiik.',
    '.kiieeiiiieeiik.',
    'kiiieeiiiieeiiik',
    'kiiiiiikkiiiiiik',
    'kIiiiiktwkiiiiIk',
    'kIIiiiiiiiiiiIIk',
    'kdIIiiiiiiiiIIdk',
    '.kdIIIiiiiIIIdk.',
    '.kddIIIIIIIIddk.',
    '..kkdddddddddk..',
    '...tk.kk.kk.kt..',
    '................'] },
  // もやもや くろもや(あらしの やま)
  くろもや: { eye: [5, 10, 7], glow: '#c88aff', pal: { k: '#0a0614', m: '#2a1a3a', M: '#4a2a5a', e: '#c88aff', w: '#ffffff' }, rows: [
    '................',
    '......kk........',
    '....kkmmk..kk...',
    '...kmmmmmkkmmk..',
    '..kmmMmmmmmmmk..',
    '..kmmmmmmmmmMk..',
    '.kmmmmmmmmmmmmk.',
    '.kmmmeemmmeemmk.',
    '.kmmmeemmmeemmk.',
    '.kmMmmmmmmmmmmk.',
    '..kmmmmkkmmmmk..',
    '.kmmmmmmmmmmmmk.',
    'kmmk.kmmk.kmmk..',
    '.kk...kk...kk...',
    '................',
    '................'] },
  // ひゅうひゅう ふぶきどり
  ふぶきどり: { eye: [6, 8, 4], glow: '#7ae8ff', pal: { k: '#1a2a4a', w: '#ffffff', b: '#bfe0ff', B: '#7ab0e0', e: '#1a1a3a', y: '#ffb02a' }, rows: [
    '................',
    '.....kkkkk......',
    '....kwwwwwk.....',
    '...kwwwwwwwk....',
    '...kwweweyyk....',
    'k..kwwwwwyyyk...',
    'bk.kbwwwwwwk..kb',
    'bbkkbbwwwwbkkbbB',
    'BbbbbbbwwbbbbbbB',
    '.BBbbbbbbbbbbBB.',
    '...BBbbbbbbBB...',
    '....kBbbbbBk....',
    '.....kBBBBk.....',
    '......y..y......',
    '.....yy..yy.....',
    '................'] },
  // あらしの かげ(ボス)
  あらしのかげ: { eye: [3, 11, 5], glow: '#ff4a6a', pal: { k: '#000000', m: '#1a0a24', M: '#3a1a4a', l: '#6a3a8a', e: '#ff4a6a', w: '#ffd23f' }, rows: [
    '.k..kk..kk...k..',
    'kMk.kMk.kMk.kMk.',
    '.kMkMmMkMmMkMk..',
    '..kmmmmmmmmmmk..',
    '.kmmlmmmmmmlmmk.',
    'kmmeemmmmmmeemmk',
    'kmmeemmmmmmeemmk',
    'kMmmmmmmmmmmmmMk',
    'kMmmmkwkkwkmmmMk',
    'kMmmmmkkkkmmmmMk',
    '.kMmmmmmmmmmmMk.',
    '.kMMmmmmmmmmMMk.',
    'kMlMMmmmmmmMMlMk',
    'kMk.kMMmmMMk.kMk',
    '.k...kMMMMk...k.',
    '......kkkk......'] },
  // とげとげ くりいが(もみじの もり)
  くりいが: { eye: [5, 10, 8], glow: '#ffd23f', pal: { k: '#2a1a0a', g: '#8a9a3a', G: '#5a6a2a', b: '#7a4a24', B: '#a86a34', e: '#1a1a1a', w: '#ffffff' }, rows: [
    '....k..k..k.....',
    '.k..kg.kg.kg..k.',
    '..kgggggggggkk..',
    'kggGgggGgggGggk.',
    '.kggggggggggggk.',
    'kgggggggggggggk.',
    '.kgbbBBbbBBbgk..',
    'kgbBBbbbbbbBbgk.',
    '.kbbweebbweebbk.',
    'kgbbeebbbbeebgk.',
    '.kbbbbbkkbbbbk..',
    'kgbbbbbbbbbbbgk.',
    '.kkbbbbbbbbbkk..',
    '...kkkkkkkkk....',
    '................',
    '................'] },
  // ひらひら もみじっこ
  もみじっこ: { eye: [3, 10, 7], glow: '#ffd23f', pal: { k: '#5a1a0a', r: '#e04838', R: '#a8341c', o: '#f08a3a', e: '#1a1a1a', b: '#7a4a24' }, rows: [
    '.......k........',
    '......krk.......',
    '..k...krk...k...',
    '..krk.krk.krk...',
    '...krkrrrkrk....',
    'kk..krrorrk..kk.',
    'krrkrrrrrrrkrrk.',
    '.kreerrrrreerk..',
    '..krrrrkrrrrk...',
    '.krrrrrrrrrrrk..',
    'krRRk.krk.kRRk..',
    'kk...krrrk...kk.',
    '.....kRRRk......',
    '.......b........',
    '.......b........',
    '................'] },
  // ぶらぶら みのむし
  みのむし: { eye: [6, 9, 7], glow: '#7ad87a', pal: { k: '#2a1a0a', m: '#8a6a3a', M: '#6a4a24', l: '#c88a3a', g: '#e8d8a0', e: '#1a1a1a' }, rows: [
    '.......k........',
    '.......k........',
    '.......k........',
    '......kkk.......',
    '.....kmlmk......',
    '....kmMlmMk.....',
    '....kgggggk.....',
    '....kgeggek.....',
    '....kgggggk.....',
    '...kmlmMmlmk....',
    '...kMmlmlmMk....',
    '...kmlMmMlmk....',
    '...kMmlmlmMk....',
    '....kmMlMmk.....',
    '.....kkkkk......',
    '................'] },
  // きらきら ほしむし(ほしの どうくつ)
  ほしむし: { eye: [4, 9, 5], glow: '#fff3a0', pal: { k: '#1a1a3a', b: '#3a5ad8', B: '#2a3a98', y: '#fff3a0', Y: '#ffd23f', w: '#e6f6ff', e: '#ffffff' }, rows: [
    '....k......k....',
    '.....k....k.....',
    '..ww.kkkkkk.ww..',
    '.wwwkbbbbbbkwww.',
    '.wwkbbbbbbbbkww.',
    '..kbbeebbeebbk..',
    '..kbbeebbeebbk..',
    '..kBbbbbbbbbBk..',
    '...kBbbbbbbBk...',
    '...kyyyyyyyyk...',
    '..kyYyyyyyyYyk..',
    '..kyyyyYYyyyyk..',
    '...kyyyyyyyyk...',
    '....kkyyyykk....',
    '......kkkk......',
    '................'] },
  // いたずら リス(ボス)
  いたずらリス: { eye: [3, 7, 4], glow: '#ffd23f', pal: { k: '#2a1a0a', r: '#c86a2a', R: '#8a4418', w: '#f8e8d0', e: '#1a1a1a', p: '#f08aa0', t: '#e8803a', l: '#e04838' }, rows: [
    '..kk..kk.....kk.',
    '.krrkkrrk...kttk',
    '.krrrrrrrk.ktttk',
    'krrrrrrrrrkttttk',
    'krreerreerktttk.',
    'krreerreerkttk..',
    'krrwwpwwrrkttk..',
    '.krwwwwwrkttk...',
    '..krrrrrkttk....',
    '.krwwwwrrktk....',
    'krwwlwwwrrk.....',
    'krwlllwwrRk.....',
    'krwwlwwwrRk.....',
    '.krwwwwrRk......',
    '.kRk..kRk.......',
    '.kkk..kkk.......'] },
  // ねぼすけ モグラ(ボス)
  ねぼすけモグラ: { eye: [4, 10, 4], glow: '#ffd23f', pal: { k: '#1a1414', m: '#5a4a5a', M: '#3a2e3a', p: '#f08aa0', w: '#ffffff', e: '#1a1a1a', y: '#fff3a0', c: '#e8a0a0' }, rows: [
    '....kkkkkkkk....',
    '..kkmmmmmmmmkk..',
    '.kmmmmmmmmmmmmk.',
    'kmmmmmmmmmmmmmmk',
    'kmmmeemmmmeemmmk',
    'kmmmmmmmmmmmmmmk',
    'kmmmmmkppkmmmmmk',
    'kmmmmmwppwmmmmmk',
    'kMmmmmmmmmmmmmMk',
    'kccMmmmmmmmmMcck',
    'kcccMmyyyymMccck',
    '.kccMyyyyyyMcck.',
    '.kMMMyyyyyyMMMk.',
    '..kMMMyyyyMMMk..',
    '...kkkkkkkkkk...',
    '................'] },
  // こおばけ・おおおばけ(ボス)
  おばけ: { eye: [4, 10, 4], glow: '#ffffff', pal: { k: '#2a2a3a', w: '#f4f4ff', g: '#c8c8e0', e: '#1a1a2a', p: '#ff9ab0', t: '#ff5a7a' }, rows: [
    '.....kkkkkk.....',
    '...kkwwwwwwkk...',
    '..kwwwwwwwwwwk..',
    '.kwwwwwwwwwwwwk.',
    '.kwweewwwweewwk.',
    'kwwweewwwweewwwk',
    'kwwwwwwwwwwwwwwk',
    'kwpwwwkkkkwwwpwk',
    'kwwwwwkttkwwwwwk',
    'kwwwwwwkkwwwwwwk',
    'kgwwwwwwwwwwwwgk',
    'kggwwwwwwwwwwggk',
    '.kgggwwwwwwgggk.',
    '.kgkgggkkgggkgk.',
    '..k.kgk..kgk.k..',
    '.....k....k.....'] },
};
// よるの まもの(章ごとに ふえる)。 ゾンビねこ・ほねほねねこの かたちで いろを かえる
const NIGHT_LOOKS = {
  おばけランタン: ['ゾンビねこ', { f: '#e8803a', F: '#b8601e', s: '#3a8a3e', e: '#ffd23f', p: '#3a2a1a' }, '#ffd23f'],
  こうもりねこ:   ['ほねほね', { w: '#6a5a8a', d: '#2a1a3a', e: '#ff5a7a' }, '#ff5a7a'],
  ゆきおにねこ:   ['ゾンビねこ', { f: '#e6f6ff', F: '#9fd6f2', s: '#5a8ad8', e: '#5ab0ff', p: '#7ab0e0' }, '#5ab0ff'],
  かみなりねこ:   ['ほねほね', { w: '#ffd23f', d: '#3a3a5a', e: '#ffffff' }, '#ffffff'],
  かかしねこ:     ['ゾンビねこ', { f: '#d8b060', F: '#a8783a', s: '#7a4a24', e: '#e04848', p: '#e8a040' }, '#e04848'],
  こがらしねこ:   ['ほねほね', { w: '#e8803a', d: '#7a3418', e: '#ffd23f' }, '#ffd23f'],
};
for (const [k, [base, pal, glow]] of Object.entries(NIGHT_LOOKS)) ENEMY[k] = { rows: ENEMY[base].rows, pal: { ...ENEMY[base].pal, ...pal }, glow, eye: [4, 10, 6] };
const ecache = {};
export function enemySprite(look) {
  const d = ENEMY[look] || ENEMY.きのこ;
  return ecache[look] || (ecache[look] = build(d.rows, d.pal));
}
export const ENEMY_ROWS = ENEMY;
DECO.owl = enemySprite('ミミズク');   // パルル町に いる ミミズク(かざり)
// 第4章 おまつり: ちょうちん・やたい・はなかご・しょうたいじょう
DECO.chochin = paintCv(32, 12, p => { p(0, 1, 32, 1, '#5a3418'); ['#ff5a5a', '#ffd23f', '#ff8ad0', '#ffa02a'].forEach((c, i) => { const x = 2 + i * 8; p(x + 1, 2, 4, 1, '#3a2210'); p(x, 3, 6, 6, c); p(x, 5, 6, 1, '#ffffff'); p(x + 1, 9, 4, 1, '#3a2210'); }); });
DECO.yatai = paintCv(32, 28, p => { p(0, 0, 32, 3, '#e04848'); for (let x = 0; x < 32; x += 8) p(x, 3, 4, 4, '#ffffff'), p(x + 4, 3, 4, 4, '#e04848'); p(1, 7, 2, 21, '#7a4a24'); p(29, 7, 2, 21, '#7a4a24');
  p(0, 16, 32, 10, '#b8783e'); p(0, 16, 32, 2, '#d8985e'); for (let x = 4; x < 28; x += 6) { p(x, 12, 4, 4, ['#ffd23f', '#ff8a6a', '#7ad87a', '#ff5a5a'][x % 4]); } });
DECO.flowers = paintCv(16, 14, p => { p(2, 8, 12, 6, '#a8744a'); p(2, 8, 12, 1, '#d8a878'); for (const [x, y, c] of [[3, 3, '#ff5a6e'], [7, 1, '#ffd23f'], [11, 3, '#ff8ad0'], [5, 5, '#ffffff'], [9, 5, '#ff8a3a']]) { p(x, y, 3, 3, c); p(x + 1, y + 1, 1, 1, '#ffd23f'); } p(4, 6, 1, 2, '#3a8a3e'); p(10, 6, 1, 2, '#3a8a3e'); });
SPR.letter = paintCv(12, 16, p => { p(1, 6, 10, 7, '#ffffff'); p(1, 6, 10, 1, '#d8c8b0'); for (let i = 0; i < 5; i++) p(1 + i, 7 + i, 1, 1, '#c8b8a0'), p(10 - i, 7 + i, 1, 1, '#c8b8a0'); p(5, 9, 2, 2, '#ff5a7a'); });
DECO.leafpile = paintCv(18, 14, p => { for (const [x, y, w, c] of [[2, 8, 14, '#a8341c'], [1, 10, 16, '#e04838'], [0, 12, 18, '#c84a2a'], [4, 6, 10, '#e8803a'], [6, 4, 6, '#f2c230']]) p(x, y, w, 2, c); for (let i = 0; i < 9; i++) p((i * 7) % 16 + 1, 5 + (i * 3) % 8, 2, 1, i % 2 ? '#ffd23f' : '#ff8a3a'); });
DECO.starOff = paintCv(12, 14, p => { p(4, 2, 4, 10, '#4a4a6a'); p(2, 5, 8, 5, '#4a4a6a'); p(5, 3, 2, 2, '#6a6a8a'); p(2, 12, 8, 2, '#2a2a3a'); });
DECO.starOn = paintCv(12, 14, p => { p(4, 2, 4, 10, '#fff3a0'); p(2, 5, 8, 5, '#ffd23f'); p(5, 3, 2, 2, '#ffffff'); p(0, 7, 12, 1, '#fff3a0'); p(6, 0, 1, 14, '#fff3a0'); p(2, 12, 8, 2, '#2a2a3a'); });
// 第3章の おてつだい: こおばけ・おばけび・ゆきうさぎの こ・できた ゆきだるま・あかい かさ
DECO.kobake = enemySprite('おばけ'); DECO.wisp = enemySprite('おばけび'); DECO.usako = enemySprite('ゆきうさぎ'); DECO.snowman = enemySprite('ゆきだるま');
SPR.kasa = paintCv(12, 16, p => { for (let y = 0; y < 5; y++) p(5 - y, 3 + y, 2 + y * 2, 1, y % 2 ? '#e04848' : '#ff5a5a'); p(0, 8, 12, 1, '#a8283a'); p(5, 1, 2, 2, '#ffd23f');
  p(6, 8, 1, 7, '#5a3418'); p(4, 14, 2, 1, '#5a3418'); p(4, 13, 1, 1, '#5a3418'); });
export const eyeColor = look => { const d = ENEMY[look] || ENEMY.きのこ; return d.glow || d.pal.e; };
export const eyePos = look => (ENEMY[look] || ENEMY.きのこ).eye || [4, 10, 6];   // くらやみで 光る 目の いろ   // 確認用

// ===== 主人公(そうびで 見た目が かわる) =====
// よろい: 上着(r)と ズボン(b)の色、ベルト
const ARMOR = {
  ぬの: { r: '#e2d2a8', b: '#7a6a50' },
  かわ: { r: '#a0683a', b: '#4a3020', belt: '#f2c230' },
  てつ: { r: '#b8c4d0', b: '#5a6a7a', belt: '#f2c230' },
  レイン: { r: '#f2c230', b: '#3a5ad8', belt: '#e8a020' },   // きいろい レインコート
  マフラー: { r: '#e04848', b: '#4a4a6a', belt: '#ffffff' },  // あかい マフラー
  ゆき: { r: '#e6f6ff', b: '#5a8ad8', belt: '#7ac8ff' },       // ゆきの よろい
  はっぴ: { r: '#3a5ad8', b: '#f4f2ec', belt: '#e04848' },      // おまつりの はっぴ
  よぞら: { r: '#2a2a6a', b: '#1a1a3a', belt: '#ffd23f' },      // よぞらの マント
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

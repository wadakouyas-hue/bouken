// キャラと物のドット絵(12×16ドット)
const HEAD = {
  down: ["...kkkkkk...", "..khhhhhhk..", ".khhhhhhhhk.", ".khhssssshk.", ".khsesseshk.", "..kssssssk.."],
  up:   ["...kkkkkk...", "..khhhhhhk..", ".khhhhhhhhk.", ".khhhhhhhhk.", ".khhhhhhhhk.", "..khhhhhhk.."],
  side: ["...kkkkkk...", "..khhhhhhk..", ".khhhhhhhhk.", ".khhhhsssk..", ".khhhssesk..", "..khsssssk.."]};
const BODY = {
  front: ["..krrrrrrk..", ".krrrrrrrrk.", ".ksrrrrrrsk.", ".kkrrrrrrkk."],
  side:  ["...krrrrk...", "..krrrrrk...", "..krrsrrk...", "..kkrrrkk..."]};
const LEGS = {
  fA: ["..kbbbbbbk..", "..kbbkkbbk..", "..kbk..kbk..", ".kook..kook.", ".kkkk..kkkk.", "............"],
  fB: ["..kbbbbbbk..", "..kbbkkbbk..", "..kbk..kbk..", ".kook..kbk..", ".kkkk..kook.", ".......kkkk."],
  sA: ["...kbbbk....", "...kbbbk....", "...kbbbk....", "...koook....", "...kkkkk....", "............"],
  sB: ["...kbbbk....", "..kbk.kbk...", ".kbk...kbk..", ".kook..kook.", ".kkkk..kkkk.", "............"]};
LEGS.fC = LEGS.fB.map(r => r.split('').reverse().join(''));

// 色 (k 輪郭 h 髪 s 肌 e 目 r 上着 b ズボン o くつ)
export const PAL = {
  hero: { k: '#2a1e1a', h: '#6b3b1f', s: '#f6c9a0', e: '#2a1e1a', r: '#e04848', b: '#3a5ad8', o: '#5a3a22' },
  oji:  { k: '#2a1e1a', h: '#e6e6e6', s: '#f0c49a', e: '#2a1e1a', r: '#4f9a52', b: '#7a6a50', o: '#4a3a2a' },
  girl: { k: '#2a1e1a', h: '#3a2a40', s: '#f8d0aa', e: '#2a1e1a', r: '#f07ab0', b: '#f5a8cf', o: '#c04060' },
  oba:  { k: '#2a1e1a', h: '#c8c8d2', s: '#f0c49a', e: '#2a1e1a', r: '#8a5ab8', b: '#6a4a8a', o: '#4a3a2a' },
  obj:  { k: '#2a1e1a', w: '#e0ab62', d: '#8a5a2a', p: '#8a5a2a', c: '#b5652a', y: '#f2c230', x: '#3a2210',
          g: '#dff4ff', l: '#4fd16a', L: '#c8ffd0', n: '#b07a40' }};

const SIGN = ["............", "............", "............", "............", "kkkkkkkkkkkk", "kwwwwwwwwwwk", "kwddddddddwk", "kwwwwwwwwwwk", "kwddddddwwwk", "kwwwwwwwwwwk", "kkkkkkkkkkkk", "....kppk....", "....kppk....", "....kppk....", "....kppk....", "....kkkk...."];
const CHEST = ["............", "............", "............", "............", "............", "............", ".kkkkkkkkkk.", ".kcccccccck.", ".kcccyyccck.", ".kyyyyyyyyk.", ".kcccyyccck.", ".kcccccccck.", ".kcccccccck.", ".kyyyyyyyyk.", ".kkkkkkkkkk.", "............"];
const CHEST_OPEN = ["............", "............", "............", ".kkkkkkkkkk.", ".kcccccccck.", ".kyyyyyyyyk.", ".kkkkkkkkkk.", ".kxxxxxxxxk.", ".kxxxxxxxxk.", ".kyyyyyyyyk.", ".kcccyyccck.", ".kcccccccck.", ".kcccccccck.", ".kyyyyyyyyk.", ".kkkkkkkkkk.", "............"];
// かいふくやく(びん)
const POTION = ["............", "............", "............", "............", "............", ".....kk.....", "....knnk....", "....kkkk....", "....kggk....", "...kggggk...", "..kllllllk..", "..kLlllllk..", "..kLlllllk..", "..kllllllk..", "...kkkkkk...", "............"];

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
  const legs = side ? [LEGS.sA, LEGS.sB, LEGS.sA, LEGS.sB][f] : [LEGS.fA, LEGS.fB, LEGS.fA, LEGS.fC][f];
  return cache[key] = build([...head, ...body, ...legs], PAL[palName] || PAL.oji, dir === 'left');
}
export const SPR = { sign: build(SIGN, PAL.obj), chest: build(CHEST, PAL.obj), chestOpen: build(CHEST_OPEN, PAL.obj), potion: build(POTION, PAL.obj) };

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
};
const ecache = {};
export function enemySprite(look) {
  const d = ENEMY[look] || ENEMY.きのこ;
  return ecache[look] || (ecache[look] = build(d.rows, d.pal));
}
export const ENEMY_ROWS = ENEMY;   // 確認用

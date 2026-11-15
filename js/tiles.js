// タイル(16×16ドット)の絵をプログラムで描く
export const T = 16;

// 乱数(毎回同じ見た目にするため固定)
let seed = 7;
function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

function mk(fn) { const c = document.createElement('canvas'); c.width = c.height = T; const g = c.getContext('2d'); fn(g); return c; }
export function px(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w, h); }
function circle(g, cx, cy, r, col) { g.fillStyle = col; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * .6) g.fillRect(cx + x, cy + y, 1, 1); }
function grass(g) { px(g, 0, 0, 16, 16, '#6cc24a'); for (let i = 0; i < 9; i++) px(g, rnd() * 16, rnd() * 16, 1, 1, rnd() < .55 ? '#58a83a' : '#8ad866'); }
function wallBase(g) { px(g, 0, 0, 16, 16, '#f1e2c3'); px(g, 0, 0, 1, 16, '#d8c59f'); px(g, 8, 0, 1, 16, '#e2d0ab'); }

const TILE = {};
// --- 村 ---
TILE.grass = [0, 1, 2].map(() => mk(grass));
TILE.flower = [0, 1, 2].map(() => mk(g => { grass(g); const cols = ['#ff5a6e', '#ffffff', '#ffd23f', '#ff8ad0'];
  for (let i = 0; i < 3; i++) { const x = 1 + rnd() * 12 | 0, y = 1 + rnd() * 12 | 0, c = cols[rnd() * 4 | 0]; px(g, x, y, 3, 1, c); px(g, x + 1, y - 1, 1, 3, c); px(g, x + 1, y, 1, 1, '#ffb000'); } }));
TILE.tree = mk(g => { grass(g); px(g, 6, 11, 4, 5, '#7a4a2a'); px(g, 6, 11, 1, 5, '#5a341c'); circle(g, 8, 6, 6, '#1d5a26'); circle(g, 8, 6, 5, '#2f8a3a'); circle(g, 6, 4, 2, '#4fb14f'); });
TILE.path = [0, 1].map(() => mk(g => { px(g, 0, 0, 16, 16, '#dcbb7d'); for (let i = 0; i < 8; i++) px(g, rnd() * 16, rnd() * 16, 1, 1, rnd() < .5 ? '#c49e5e' : '#ecd29c'); }));
TILE.water = [0, 1].map(p => mk(g => { px(g, 0, 0, 16, 16, '#3b8fe0'); px(g, (2 + p * 3) % 12, 4, 4, 1, '#9fd2ff'); px(g, (9 + p * 3) % 12, 11, 4, 1, '#9fd2ff'); px(g, (5 + p * 5) % 14, 8, 2, 1, '#2f78c4'); }));
TILE.bridgeT = mk(g => { px(g, 0, 0, 16, 16, '#b5803f'); for (let x = 3; x < 16; x += 4) px(g, x, 0, 1, 16, '#8a5a2a'); px(g, 0, 0, 16, 2, '#5a3a1c'); });
TILE.bridgeB = mk(g => { px(g, 0, 0, 16, 16, '#b5803f'); for (let x = 3; x < 16; x += 4) px(g, x, 0, 1, 16, '#8a5a2a'); px(g, 0, 14, 16, 2, '#5a3a1c'); });
TILE.roof = mk(g => { px(g, 0, 0, 16, 16, '#cf4b3b'); for (let y = 0; y < 16; y += 4) { px(g, 0, y + 3, 16, 1, '#9a3328'); for (let x = ((y / 4) % 2) * 4; x < 16; x += 8) px(g, x, y, 1, 3, '#a8392d'); } px(g, 0, 0, 16, 1, '#e8735f'); });
TILE.wallU = mk(g => { wallBase(g); px(g, 0, 0, 16, 3, '#a88f68'); });
TILE.wallL = mk(g => { wallBase(g); px(g, 0, 13, 16, 3, '#9a6a3a'); });
TILE.window = mk(g => { wallBase(g); px(g, 0, 0, 16, 3, '#a88f68'); px(g, 3, 5, 10, 8, '#5a3a1c'); px(g, 4, 6, 8, 6, '#9fd8ff'); px(g, 8, 6, 1, 6, '#5a3a1c'); px(g, 4, 9, 8, 1, '#5a3a1c'); px(g, 5, 7, 2, 1, '#e6f6ff'); });
TILE.door = mk(g => { wallBase(g); px(g, 0, 13, 16, 3, '#9a6a3a'); px(g, 4, 1, 8, 15, '#5a3a1c'); px(g, 5, 2, 6, 14, '#8f5a32'); px(g, 9, 9, 1, 1, '#f2c230'); });

TILE.roofB = mk(g => { px(g, 0, 0, 16, 16, '#3a6ad0'); for (let y = 0; y < 16; y += 4) { px(g, 0, y + 3, 16, 1, '#284a98'); for (let x = ((y / 4) % 2) * 4; x < 16; x += 8) px(g, x, y, 1, 3, '#2c56b0'); } px(g, 0, 0, 16, 1, '#6a94f0'); });

// --- 森 ---
function fgrass(g) { px(g, 0, 0, 16, 16, '#3f8f3a'); for (let i = 0; i < 10; i++) px(g, rnd() * 16, rnd() * 16, 1, 1, rnd() < .6 ? '#347a30' : '#55a84a'); }
TILE.fgrass = [0, 1, 2].map(() => mk(fgrass));
TILE.ftree = [0, 1].map(p => mk(g => { px(g, 0, 0, 16, 16, '#1f4a22'); circle(g, 8, 8, 8, '#163a1a'); circle(g, 7 + p, 7, 6, '#24602a'); circle(g, 5 + p * 2, 5, 2, '#3a8a3e'); circle(g, 11 - p, 10, 2, '#2f7a34'); }));
TILE.mush = mk(g => { fgrass(g); px(g, 4, 8, 5, 2, '#e04848'); px(g, 5, 7, 3, 1, '#e04848'); px(g, 5, 8, 1, 1, '#fff'); px(g, 7, 9, 1, 1, '#fff'); px(g, 6, 10, 1, 2, '#f1e2c3');
  px(g, 10, 11, 3, 1, '#e8a040'); px(g, 11, 10, 1, 1, '#e8a040'); px(g, 11, 12, 1, 1, '#f1e2c3'); });
TILE.bush = mk(g => { fgrass(g); circle(g, 8, 9, 6, '#1f5a24'); circle(g, 7, 8, 5, '#2f7a34'); circle(g, 6, 6, 2, '#4a9a4a'); px(g, 10, 9, 1, 1, '#e04848'); px(g, 5, 11, 1, 1, '#e04848'); });

// たかい だんさ(がけ)。 かたぐるまの かけらが あると のぼれる
TILE.cliff = mk(g => { px(g, 0, 0, 16, 16, '#9a8a6a'); px(g, 0, 0, 16, 3, '#6cc24a'); px(g, 0, 3, 16, 1, '#4a8a32');
  for (const [x, y, w] of [[1, 6, 6], [9, 5, 6], [3, 10, 7], [11, 11, 4], [0, 14, 5]]) { px(g, x, y, w, 1, '#6a5a44'); px(g, x, y - 1, w, 1, '#b8a888'); } });

// --- 家の中 ---
TILE.inTop = mk(g => { px(g, 0, 0, 16, 16, '#5a3a24'); px(g, 0, 0, 16, 1, '#7a5034'); px(g, 0, 15, 16, 1, '#3a2414'); });
function paper(g) { px(g, 0, 0, 16, 16, '#efdcb4'); for (let x = 2; x < 16; x += 5) px(g, x, 0, 1, 13, '#e2c998'); px(g, 0, 13, 16, 3, '#8a5a32'); px(g, 0, 13, 16, 1, '#a8744a'); }
TILE.inWall = mk(paper);
TILE.inWin = mk(g => { paper(g); px(g, 3, 2, 10, 9, '#6a4426'); px(g, 4, 3, 8, 7, '#9fd8ff'); px(g, 8, 3, 1, 7, '#6a4426'); px(g, 4, 6, 8, 1, '#6a4426'); px(g, 5, 4, 2, 1, '#e6f6ff'); });
function floor(g) { px(g, 0, 0, 16, 16, '#c8925a'); for (let y = 3; y < 16; y += 4) px(g, 0, y, 16, 1, '#a87440'); px(g, 5, 0, 1, 3, '#a87440'); px(g, 11, 4, 1, 3, '#a87440'); px(g, 3, 8, 1, 3, '#a87440'); px(g, 13, 12, 1, 3, '#a87440'); }
TILE.floor = mk(floor);
TILE.rug = mk(g => { px(g, 0, 0, 16, 16, '#c0483c'); px(g, 0, 7, 16, 2, '#e8b04a'); for (let x = 1; x < 16; x += 4) px(g, x, 3, 2, 2, '#f0d890'); for (let x = 3; x < 16; x += 4) px(g, x, 11, 2, 2, '#f0d890'); });
TILE.tansu = mk(g => { floor(g); px(g, 1, 0, 14, 16, '#5a3418'); px(g, 2, 1, 12, 14, '#9a6232');
  for (const y of [2, 7, 11]) { px(g, 3, y, 10, 3, '#b8783e'); px(g, 3, y + 3, 10, 1, '#6a3c1a'); px(g, 7, y + 1, 2, 1, '#f2c230'); } });
TILE.shelf = mk(g => { floor(g); px(g, 1, 0, 14, 16, '#5a3418'); px(g, 2, 1, 12, 14, '#7a4a24');
  const bk = ['#e04848', '#3a5ad8', '#f2c230', '#4f9a52', '#f07ab0', '#ffffff'];
  for (const y of [1, 6, 11]) { for (let x = 2, i = 0; x < 14; x += 2, i++) px(g, x, y + (i % 2), 2, 4 - (i % 2), bk[(x + y) % 6]); px(g, 2, y + 4, 12, 1, '#5a3418'); } });
function tableTop(g, side) { floor(g); px(g, 0, 3, 16, 8, '#8a5228'); px(g, 0, 3, 16, 1, '#b07040'); px(g, 0, 10, 16, 1, '#5a3418');
  if (side === 0) { px(g, 0, 3, 1, 8, '#5a3418'); px(g, 2, 11, 2, 4, '#5a3418'); } else { px(g, 15, 3, 1, 8, '#5a3418'); px(g, 12, 11, 2, 4, '#5a3418'); } }
TILE.tableL = mk(g => { tableTop(g, 0); px(g, 9, 5, 4, 3, '#ffffff'); px(g, 10, 4, 2, 1, '#e04848'); });   // パンと皿
TILE.tableR = mk(g => { tableTop(g, 1); px(g, 3, 4, 3, 4, '#e6f6ff'); px(g, 3, 5, 3, 2, '#9fd2ff'); });  // コップ
TILE.bedT = mk(g => { floor(g); px(g, 1, 0, 14, 16, '#6a3c1a'); px(g, 2, 2, 12, 14, '#ffffff'); px(g, 3, 3, 10, 5, '#f0f0f8'); px(g, 3, 8, 10, 1, '#d8d8e8'); px(g, 2, 11, 12, 5, '#5a8ad8'); });
TILE.bedB = mk(g => { floor(g); px(g, 1, 0, 14, 14, '#6a3c1a'); px(g, 2, 0, 12, 12, '#5a8ad8'); px(g, 2, 4, 12, 1, '#7aa6f0'); px(g, 2, 9, 12, 1, '#7aa6f0'); px(g, 1, 14, 2, 2, '#4a2a10'); px(g, 13, 14, 2, 2, '#4a2a10'); });
TILE.pot = mk(g => { floor(g); px(g, 5, 9, 6, 6, '#b5652a'); px(g, 4, 9, 8, 2, '#c87a3a'); px(g, 7, 3, 1, 6, '#3a8a3e'); px(g, 5, 5, 2, 1, '#3a8a3e');
  px(g, 6, 1, 3, 3, '#ff5a6e'); px(g, 7, 2, 1, 1, '#ffd23f'); px(g, 9, 4, 3, 2, '#ffffff'); px(g, 10, 4, 1, 1, '#ffd23f'); });
TILE.counter = mk(g => { px(g, 0, 0, 16, 16, '#7a4a24'); px(g, 0, 0, 16, 4, '#c8925a'); px(g, 0, 3, 16, 1, '#5a3418'); for (let x = 3; x < 16; x += 6) px(g, x, 6, 1, 8, '#5a3418'); px(g, 0, 15, 16, 1, '#3a2414'); });
TILE.mat = mk(g => { floor(g); px(g, 2, 2, 12, 12, '#4f9a52'); px(g, 3, 3, 10, 10, '#6cc24a'); for (let x = 4; x < 12; x += 2) px(g, x, 5, 1, 6, '#4f9a52'); });

// 文字 → タイルの絵
// がけ L たかい だんさ(かたぐるまの かけらで のぼれる)
// 村  . 草  , 花  T 木  = 道  ~ 川  B b 橋  R 屋根  U 青い屋根  H h 壁  W 窓  D ドア
// 森  g 森の草  Y 森の木  m きのこ  o しげみ
// 家  # 天井  w 壁  v 窓  _ 床  r じゅうたん  K タンス  S 本だな  O Q テーブル  Z z ベッド  P 花びん  C お店のカウンター  E 出口のマット
export const BLOCK = new Set(['U', 'C', 'T', '~', 'R', 'H', 'h', 'W', 'D', 'Y', 'o', '#', 'w', 'v', 'K', 'S', 'O', 'Q', 'Z', 'z', 'P']);

export function tileImg(c, x, y, t) {
  const v = (x * 7 + y * 13) % 3;
  switch (c) {
    case 'L': return TILE.cliff;
    case 'T': return TILE.tree; case ',': return TILE.flower[v]; case '=': return TILE.path[(x + y) % 2];
    case '~': return TILE.water[(Math.floor(t * 2) + x) % 2]; case 'B': return TILE.bridgeT; case 'b': return TILE.bridgeB;
    case 'R': return TILE.roof; case 'U': return TILE.roofB; case 'C': return TILE.counter; case 'H': return TILE.wallU; case 'h': return TILE.wallL; case 'W': return TILE.window; case 'D': return TILE.door;
    case 'g': return TILE.fgrass[v]; case 'Y': return TILE.ftree[(x + y) % 2]; case 'm': return TILE.mush; case 'o': return TILE.bush;
    case '#': return TILE.inTop; case 'w': return TILE.inWall; case 'v': return TILE.inWin; case '_': return TILE.floor; case 'r': return TILE.rug;
    case 'K': return TILE.tansu; case 'S': return TILE.shelf; case 'O': return TILE.tableL; case 'Q': return TILE.tableR;
    case 'Z': return TILE.bedT; case 'z': return TILE.bedB; case 'P': return TILE.pot; case 'E': return TILE.mat;
    default: return TILE.grass[v];
  }
}

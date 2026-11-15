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

// --- パルル町 ---
function stone(g) { px(g, 0, 0, 16, 16, '#d8d0c0'); px(g, 0, 7, 16, 1, '#b8ae9c'); px(g, 0, 15, 16, 1, '#b8ae9c'); px(g, 7, 0, 1, 7, '#b8ae9c'); px(g, 15, 8, 1, 7, '#b8ae9c');
  for (let i = 0; i < 5; i++) px(g, rnd() * 16, rnd() * 16, 1, 1, '#e8e2d4'); }
TILE.plaza = [0, 1].map(() => mk(stone));
// ふんすい(2×2マス。 4つの ぶぶんに わけて かく)
function bigImg(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; }
function quarter(img, qx, qy) { return mk(g => g.drawImage(img, -qx * 16, -qy * 16)); }
const FOUNT = [0, 1].map(f => bigImg(32, 32, g => { for (let i = 0; i < 4; i++) g.drawImage(TILE.plaza[i % 2], (i % 2) * 16, (i >> 1) * 16);
  circle(g, 16, 17, 14, '#8a8478'); circle(g, 16, 17, 12, '#3b8fe0'); circle(g, 16, 17, 4, '#b8ae9c');
  px(g, 15, 4, 2, 10, '#9fd2ff'); px(g, 14 - f, 6 + f, 1, 4, '#cfeaff'); px(g, 17 + f, 6 + f, 1, 4, '#cfeaff');
  px(g, 6 + f * 3, 20, 3, 1, '#9fd2ff'); px(g, 22 - f * 2, 24, 3, 1, '#9fd2ff'); }));
TILE.fount = FOUNT.map(img => [[quarter(img, 0, 0), quarter(img, 1, 0)], [quarter(img, 0, 1), quarter(img, 1, 1)]]);
// トランポリン(2×2マス)
const TRAMP = bigImg(32, 32, g => { for (let i = 0; i < 4; i++) g.drawImage(TILE.grass[i % 3], (i % 2) * 16, (i >> 1) * 16);
  circle(g, 16, 16, 14, '#3a5ad8'); circle(g, 16, 16, 11, '#2a2a3a'); circle(g, 16, 16, 9, '#3a3a50');
  for (let a = 0; a < 8; a++) px(g, 16 + Math.cos(a / 8 * 6.28) * 13 | 0, 16 + Math.sin(a / 8 * 6.28) * 13 | 0, 2, 2, '#f2c230'); });
TILE.tramp = [[quarter(TRAMP, 0, 0), quarter(TRAMP, 1, 0)], [quarter(TRAMP, 0, 1), quarter(TRAMP, 1, 1)]];
TILE.roofV = mk(g => { px(g, 0, 0, 16, 16, '#9a5ac8'); for (let y = 0; y < 16; y += 4) { px(g, 0, y + 3, 16, 1, '#6a3a98'); for (let x = ((y / 4) % 2) * 4; x < 16; x += 8) px(g, x, y, 1, 3, '#7a46a8'); } px(g, 0, 0, 16, 1, '#c88af0'); });
TILE.stage = mk(g => { px(g, 0, 0, 16, 16, '#b8783e'); for (let y = 3; y < 16; y += 4) px(g, 0, y, 16, 1, '#8a5228'); px(g, 0, 0, 16, 1, '#e0a868'); px(g, 4, 0, 1, 3, '#8a5228'); px(g, 11, 4, 1, 3, '#8a5228'); });

// --- きたの もり(第2章) ---
// いろの ない もり(えかきの かけらで いろが もどる): q はいいろの くさ  i はいいろの はな  x はいいろの き  X はいいろの しげみ
function ggrass(g) { px(g, 0, 0, 16, 16, '#8e9088'); for (let i = 0; i < 10; i++) px(g, rnd() * 16, rnd() * 16, 1, 1, rnd() < .6 ? '#7a7c76' : '#a4a69e'); }
TILE.ggrass = [0, 1, 2].map(() => mk(ggrass));
TILE.gflower = mk(g => { ggrass(g); for (let i = 0; i < 3; i++) { const x = 2 + rnd() * 11 | 0, y = 2 + rnd() * 11 | 0; px(g, x, y, 3, 1, '#d8d8d4'); px(g, x + 1, y - 1, 1, 3, '#d8d8d4'); px(g, x + 1, y, 1, 1, '#6a6a66'); } });
TILE.gtree = [0, 1].map(p => mk(g => { px(g, 0, 0, 16, 16, '#4a4c48'); circle(g, 8, 8, 8, '#3a3c38'); circle(g, 7 + p, 7, 6, '#5e605a'); circle(g, 5 + p * 2, 5, 2, '#80827c'); circle(g, 11 - p, 10, 2, '#6e706a'); }));
// もりの はな(いろが もどった あと)
TILE.fflower = mk(g => { fgrass(g); const cols = ['#ff5a6e', '#ffd23f', '#ff8ad0', '#7ac8ff'];
  for (let i = 0; i < 3; i++) { const x = 2 + rnd() * 11 | 0, y = 2 + rnd() * 11 | 0, c = cols[i + (rnd() * 2 | 0)]; px(g, x, y, 3, 1, c); px(g, x + 1, y - 1, 1, 3, c); px(g, x + 1, y, 1, 1, '#fff3a0'); } });
TILE.ghedge = mk(g => { ggrass(g); circle(g, 8, 9, 7, '#4e504a'); circle(g, 7, 8, 6, '#6a6c66'); circle(g, 5, 6, 2, '#8a8c86'); circle(g, 11, 11, 2, '#5a5c56'); });
// こわれた はし(こうさくの かけらで なおる)
TILE.broken = [0, 1].map(p => mk(g => { g.drawImage(TILE.water[p], 0, 0); px(g, 1, 2, 4, 3, '#8a5a2a'); px(g, 10, 9, 5, 3, '#8a5a2a'); px(g, 11, 9, 1, 3, '#5a3a1c'); px(g, 3, 12, 3, 2, '#7a4a24'); }));
// くらい どうくつ: n ゆか  N いわかべ
TILE.cfloor = [0, 1, 2].map(() => mk(g => { px(g, 0, 0, 16, 16, '#5a4e44'); for (let i = 0; i < 9; i++) px(g, rnd() * 16, rnd() * 16, 1 + (rnd() * 2 | 0), 1, rnd() < .5 ? '#4a4036' : '#6e6254'); }));
TILE.cwall = [0, 1].map(p => mk(g => { px(g, 0, 0, 16, 16, '#2e2622'); for (const [x, y, w, h] of [[1, 1, 6, 5], [8, 2, 7, 6], [2, 8, 5, 6], [9, 10, 6, 5]]) { px(g, x + p, y, w, h, '#3e342e'); px(g, x + p, y, w, 1, '#56483e'); } }));
// ちかしつ: c にもつの はこ  u のぼりの かいだん  s くだりの かいだん(いえの ゆか)
TILE.crate = mk(g => { px(g, 0, 0, 16, 16, '#5a4e44'); px(g, 1, 2, 14, 13, '#5a3418'); px(g, 2, 3, 12, 11, '#b07a42'); px(g, 2, 8, 12, 1, '#7a4a24'); px(g, 7, 3, 1, 11, '#7a4a24'); px(g, 2, 3, 12, 1, '#d8a060'); });
TILE.stairsUp = mk(g => { px(g, 0, 0, 16, 16, '#5a4e44'); for (let i = 0; i < 4; i++) { px(g, 1, 1 + i * 4, 14, 3, ['#d8c0a0', '#b8a080', '#98805e', '#7a6448'][i]); px(g, 1, 4 + i * 4, 14, 1, '#3a2e24'); } });
TILE.stairsDown = mk(g => { floor(g); px(g, 1, 1, 14, 14, '#2a1e16'); for (let i = 0; i < 4; i++) px(g, 2, 2 + i * 3, 12, 2, ['#a87440', '#8a5a2a', '#6a4220', '#4a2e16'][i]); });
// おおきな きの みき(I)と はしご(l)・こわれた はしご(e)
function bark(g) { px(g, 0, 0, 16, 16, '#7a4a24'); for (let x = 1; x < 16; x += 4) px(g, x, 0, 1, 16, '#5a3418'); px(g, 3, 5, 2, 3, '#9a6234'); px(g, 10, 11, 2, 3, '#9a6234'); }
TILE.trunk = mk(bark);
TILE.ladder = mk(g => { bark(g); px(g, 2, 0, 2, 16, '#d8a060'); px(g, 12, 0, 2, 16, '#d8a060'); for (const y of [2, 7, 12]) { px(g, 2, y, 12, 2, '#e8b878'); px(g, 2, y + 2, 12, 1, '#8a5a2a'); } });
TILE.ladderX = mk(g => { bark(g); px(g, 2, 6, 2, 10, '#a87a4a'); px(g, 12, 0, 2, 5, '#a87a4a'); px(g, 3, 12, 7, 2, '#a87a4a'); px(g, 8, 3, 5, 2, '#a87a4a'); });

// --- あらしの のはら(第3章) ---
// a ぬれた くさ  A いわ  M ぬま  j いたの みち  d かれた き  y たおれた き
function wgrass(g) { px(g, 0, 0, 16, 16, '#4a7a52'); for (let i = 0; i < 10; i++) px(g, rnd() * 16, rnd() * 16, 1, 1 + (rnd() * 2 | 0), rnd() < .6 ? '#3e6a46' : '#5e9264'); }
TILE.wgrass = [0, 1, 2].map(i => mk(g => { wgrass(g); if (i === 2) { px(g, 3, 9, 6, 2, '#5a7aa0'); px(g, 4, 9, 3, 1, '#8aaad0'); } }));
function rockOn(g) { circle(g, 8, 9, 7, '#4a4a54'); circle(g, 7, 8, 6, '#7a7a86'); circle(g, 5, 6, 2, '#a4a4b0'); px(g, 9, 11, 3, 1, '#5a5a66'); }
TILE.rockC = mk(g => { g.drawImage(TILE.cfloor[0], 0, 0); rockOn(g); px(g, 3, 14, 10, 1, '#3a302a'); });   // ^ いわばの いわ
TILE.rock = mk(g => { wgrass(g); circle(g, 8, 9, 7, '#4a4a54'); circle(g, 7, 8, 6, '#7a7a86'); circle(g, 5, 6, 2, '#a4a4b0'); px(g, 9, 11, 3, 1, '#5a5a66'); px(g, 2, 14, 12, 1, '#2e3a32'); });
TILE.swamp = [0, 1].map(p => mk(g => { px(g, 0, 0, 16, 16, '#3a4a3a'); for (let i = 0; i < 7; i++) px(g, rnd() * 15, rnd() * 15, 2, 1, rnd() < .5 ? '#2c3a2e' : '#4a5e48');
  px(g, (3 + p * 6) % 14, 5, 3, 1, '#6a8a6a'); px(g, (10 + p * 4) % 14, 12, 2, 1, '#6a8a6a'); }));
TILE.board = mk(g => { px(g, 0, 0, 16, 16, '#3a4a3a'); px(g, 1, 0, 14, 16, '#8a6a42'); for (let y = 0; y < 16; y += 4) { px(g, 1, y, 14, 1, '#5a4228'); } px(g, 1, 0, 1, 16, '#6a4e30'); px(g, 14, 0, 1, 16, '#6a4e30'); px(g, 4, 2, 1, 1, '#3a2a1a'); px(g, 11, 6, 1, 1, '#3a2a1a'); px(g, 6, 10, 1, 1, '#3a2a1a'); });
TILE.dead = mk(g => { wgrass(g); px(g, 7, 4, 2, 12, '#4a3a2e'); px(g, 4, 3, 3, 1, '#4a3a2e'); px(g, 3, 1, 1, 2, '#4a3a2e'); px(g, 9, 6, 4, 1, '#4a3a2e'); px(g, 12, 3, 1, 3, '#4a3a2e'); px(g, 6, 2, 1, 2, '#4a3a2e'); px(g, 7, 15, 3, 1, '#2e2420'); });
TILE.log = mk(g => { wgrass(g); px(g, 0, 5, 16, 8, '#6a4224'); px(g, 0, 5, 16, 1, '#9a6234'); px(g, 0, 12, 16, 1, '#3a2210'); for (let x = 2; x < 16; x += 5) px(g, x, 7, 3, 1, '#4a2e16'); px(g, 5, 3, 1, 2, '#3a6a3a'); px(g, 11, 2, 2, 3, '#3a6a3a'); });

// --- こわい もり(第3章) ---  t つりばし  0 たにぞこ(とおれない)  % くろい きり(ゆうきの かけらで とおれる)
TILE.rope = mk(g => { px(g, 0, 0, 16, 16, '#0a0a14'); px(g, 2, 0, 12, 16, '#8a6a42'); for (let y = 0; y < 16; y += 4) px(g, 2, y + 3, 12, 1, '#4a3420'); px(g, 1, 0, 1, 16, '#c8a878'); px(g, 14, 0, 1, 16, '#c8a878'); px(g, 5, 1, 1, 1, '#3a2a1a'); px(g, 10, 9, 1, 1, '#3a2a1a'); });
TILE.chasm = [0, 1].map(p => mk(g => { px(g, 0, 0, 16, 16, '#0a0a14'); for (let i = 0; i < 4; i++) px(g, rnd() * 16, rnd() * 16, 1, 1, '#1a1a2e'); if (p) px(g, 6, 9, 3, 1, '#16162a'); }));
TILE.fog = [0, 1].map(p => mk(g => { fgrass(g); for (let i = 0; i < 26; i++) px(g, (rnd() * 16) | 0, (rnd() * 16) | 0, 3, 2, i % 3 ? '#2a1a3a' : '#4a2a5a'); px(g, 2 + p * 7, 6, 5, 2, '#6a4a8a'); }));

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
// パルル町  p 石の ひろば  F ふんすい(2×2)  J トランポリン(2×2)  V むらさきの 屋根  G ステージの ゆか
// 村  . 草  , 花  T 木  = 道  ~ 川  B b 橋  R 屋根  U 青い屋根  H h 壁  W 窓  D ドア
// 森  g 森の草  Y 森の木  m きのこ  o しげみ
// きたの もり  f もりの はな  q i x X はいいろの くさ・はな・き・しげみ  k こわれた はし  n N どうくつの ゆか・かべ  I みき  l はしご  e こわれた はしご  c はこ  u s かいだん
// あらしの のはら  a ぬれた くさ  A いわ  ^ いわばの いわ  M ぬま  j いたの みち  d かれた き  y たおれた き
// こわい もり  t つりばし  0 たにぞこ  % くろい きり(ゆうきの かけらで とおれる)
// 家  # 天井  w 壁  v 窓  _ 床  r じゅうたん  K タンス  S 本だな  O Q テーブル  Z z ベッド  P 花びん  C お店のカウンター  E 出口のマット
export const BLOCK = new Set(['F', 'J', 'V', 'U', 'C', 'T', '~', 'R', 'H', 'h', 'W', 'D', 'Y', 'o', '#', 'w', 'v', 'K', 'S', 'O', 'Q', 'Z', 'z', 'P', 'x', 'X', 'k', 'N', 'I', 'e', 'c', 'A', 'M', 'd', 'y', '^', '0']);

export function tileImg(c, x, y, t) {
  const v = (x * 7 + y * 13) % 3;
  switch (c) {
    case 'L': return TILE.cliff;
    case 'p': return TILE.plaza[(x + y) % 2]; case 'V': return TILE.roofV; case 'G': return TILE.stage;
    case 'F': return TILE.fount[Math.floor(t * 3) % 2][y % 2][x % 2]; case 'J': return TILE.tramp[y % 2][x % 2];
    case 'T': return TILE.tree; case ',': return TILE.flower[v]; case '=': return TILE.path[(x + y) % 2];
    case '~': return TILE.water[(Math.floor(t * 2) + x) % 2]; case 'B': return TILE.bridgeT; case 'b': return TILE.bridgeB;
    case 'R': return TILE.roof; case 'U': return TILE.roofB; case 'C': return TILE.counter; case 'H': return TILE.wallU; case 'h': return TILE.wallL; case 'W': return TILE.window; case 'D': return TILE.door;
    case 'g': return TILE.fgrass[v]; case 'Y': return TILE.ftree[(x + y) % 2]; case 'm': return TILE.mush; case 'o': return TILE.bush;
    case '#': return TILE.inTop; case 'w': return TILE.inWall; case 'v': return TILE.inWin; case '_': return TILE.floor; case 'r': return TILE.rug;
    case 'K': return TILE.tansu; case 'S': return TILE.shelf; case 'O': return TILE.tableL; case 'Q': return TILE.tableR;
    case 'Z': return TILE.bedT; case 'z': return TILE.bedB; case 'P': return TILE.pot; case 'E': return TILE.mat;
    case 'q': return TILE.ggrass[v]; case 'i': return TILE.gflower; case 'f': return TILE.fflower; case 'x': return TILE.gtree[(x + y) % 2]; case 'X': return TILE.ghedge;
    case 'k': return TILE.broken[(Math.floor(t * 2) + x) % 2]; case 'n': return TILE.cfloor[v]; case 'N': return TILE.cwall[(x + y) % 2];
    case 'c': return TILE.crate; case 'u': return TILE.stairsUp; case 's': return TILE.stairsDown;
    case 'I': return TILE.trunk; case 'l': return TILE.ladder; case 'e': return TILE.ladderX;
    case 'a': return TILE.wgrass[(x * 5 + y * 3) % 7 === 0 ? 2 : v % 2]; case 'A': return TILE.rock; case '^': return TILE.rockC; case 'M': return TILE.swamp[(Math.floor(t * 1.5) + x + y) % 2];
    case 't': return TILE.rope; case '0': return TILE.chasm[(x * 3 + y) % 2]; case '%': return TILE.fog[(Math.floor(t * 2) + x + y) % 2];
    case 'j': return TILE.board; case 'd': return TILE.dead; case 'y': return TILE.log;
    default: return TILE.grass[v];
  }
}

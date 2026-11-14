// 森(30×20マス)— はじめての 戦闘を する予定の場所
export default {
  bgm: 'forest',   // 流す曲(js/music.js)
  rows: [
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
    'YYYYYYgggggggggYYYYYYYYYYYYYYY',
    'YYYYYYYggggogggYYYYYYYYYYYYYYY',
    'YYYYYYYmgg==ggggYYYYYYYYYYYYYY',
    'YYYYYYmggg==gggYYYYYYYYggYggYY',
    'YYYYYgYYgg==YYgYYYYYYYYggggggY',
    'YgYYgmYYYY==ggYYmYYYYYYggggggY',
    'YmmggogYgY==ogggggYYYYgggggggY',
    'Ygoggggggg==gggggYYggYYgggoggY',
    '===========================ggY',
    '===========================ggY',
    'YggggggggYgggggmgY==YgmooggmgY',
    'YgggggggYYYmgggggY==YYYgoggggY',
    'YgggggYYYYYYYgYggg==oYgggggggY',
    'YgYYYYYYYYYYYggggg==oggggggggY',
    'YYYYYYYYYYYYYYgggg==gggYgYgggY',
    'YYYYYYYYYYYYYYgmgggggggggYYYYY',
    'YYYYYYYYYYYYYYggggggggggYYYYYY',
    'YYYYYYYYYYYYYYYgYYgggggYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  ],
  // kind: 'enemy' は てき。 party に data/enemies.csv の id を ならべる(いっしょに出てくる なかま)
  objs: [
    { kind: 'item', x: 8, y: 2, label: 'ひろう', give: 'かいふくやく',
      lines: ['♪かいふくやくを ひろった!', 'けがを したときに つかうと {元気|げんき}に なるよ。'] },
    { kind: 'item', x: 22, y: 16, label: 'ひろう', give: 'かいふくやく',
      lines: ['♪かいふくやくを ひろった!'] },
    { kind: 'enemy', x: 14, y: 10, party: 'きのこ' },
    { kind: 'enemy', x: 10, y: 5, party: 'どんぐり' },
    { kind: 'enemy', x: 19, y: 13, party: 'はっぱ きのこ' },
    { kind: 'enemy', x: 25, y: 8, party: 'きのこ きのこ' },
    { kind: 'enemy', x: 26, y: 12, party: 'どんぐり はっぱ' },
  ],
  exits: [
    { x: 0, y: 9, h: 2, to: 'village', at: [28, 9.5], dir: 'left' },  // 左はしの道 → 村
  ],
};

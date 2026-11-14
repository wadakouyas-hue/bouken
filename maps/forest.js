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
  objs: [
    { kind: 'item', x: 8, y: 2, label: 'ひろう', give: 'かいふくやく',
      lines: ['♪かいふくやくを ひろった!', 'けがを したときに つかうと {元気|げんき}に なるよ。'] },
    { kind: 'item', x: 22, y: 16, label: 'ひろう', give: 'かいふくやく',
      lines: ['♪かいふくやくを ひろった!'] },
  ],
  exits: [
    { x: 0, y: 9, h: 2, to: 'village', at: [28, 9.5], dir: 'left' },  // 左はしの道 → 村
  ],
};

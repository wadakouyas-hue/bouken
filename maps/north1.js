// きたの もり1 かわの もり(26×18マス)。 パルル町の きた → ここ → いろの ない もり
// かわは トランポリンの かけらで とびこえる(main.js の EVENTS.hop。 to: とんだ さきの マス)
export default {
  outside: true,
  bgm: 'forest',
  rows: [
    'YYYYYYYYYYYY==YYYYYYYYYYYY',
    'YYYYYYYYYYYY==YYYYYYYYYYYY',
    'YYYggggmgggg==ggggggYYYYYY',
    'YYYggYYggggg==gggggggggYYY',
    'YYYggYgggggg==ggggggoggYYY',
    'YYYgggggoggg==gggmgggggYYY',
    'YYYggggggggg==gggggggggYYY',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    'Yggggggggggg==gggggggggggY',
    'Ygmgggggoggg==ggggggggmggY',
    'YgggYYgggggg==ggggYYgggggY',
    'YgggYYgggggg==ggggYYgggggY',
    'Yggggggggggg==gggggggggogY',
    'Yggogggggggg==gggggmgggggY',
    'Yggggggggggg==gggggggggggY',
    'YYYYYYYYYYgg==ggYYYYYYYYYY',
    'YYYYYYYYYYYY==YYYYYYYYYYYY',
  ],
  objs: [
    { kind: 'deco', x: 11.5, y: 9, pic: 'furn:トランポリン', label: 'とびこえる', event: 'hop', to: [13, 6] },
    { kind: 'deco', x: 11.5, y: 6, pic: 'furn:トランポリン', label: 'とびこえる', event: 'hop', to: [13, 9] },
    { kind: 'sign', x: 14, y: 15, name: 'かんばん', label: 'よむ', lines: ['↑ きたの もり', '↓ {パルル|ぱるる}{町|まち}'] },
    // おてつだい: たんけんかの ぼうし(どうくつの たからばこ)
    { kind: 'npc', x: 8, y: 13, pal: 'shop2', name: 'たんけんかの ねこ', label: 'はなす', event: 'hat' },
    { kind: 'chest', x: 2, y: 9, label: 'あける', give: 'げんきのみず',
      lines: ['たからばこを あけた!', '♪げんきの みずを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'item', x: 22, y: 3, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'enemy', x: 5, y: 12, party: 'かえる' },
    { kind: 'enemy', x: 20, y: 13, party: 'かえる いのしし' },
    { kind: 'enemy', x: 7, y: 3, party: 'かえる かえる' },
    { kind: 'enemy', x: 19, y: 4, party: 'いのしし' },
    { kind: 'enemy', x: 5, y: 10, party: 'ゾンビねこ ゾンビねこ', night: true },
    { kind: 'enemy', x: 20, y: 5, party: 'ほねほね ほねほね', night: true },
  ],
  exits: [
    { x: 12, y: 17, w: 2, to: 'town2', at: [28.5, 1], dir: 'down' },     // した → パルル町
    { x: 12, y: 0, w: 2, to: 'north2', at: [6.5, 16], dir: 'up' },       // うえ → いろの ない もり
  ],
};

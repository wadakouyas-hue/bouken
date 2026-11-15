// いずみの もり(26×18マス)。 いずみの みずを のむと げんきに なる(ボスの まえの やすみば)
export default {
  outside: true,
  bgm: 'forest',
  rows: [
    'YYYYYYYYYYYg==gYYYYYYYYYYY',
    'YYYYYYYYYYYg==gYYYYYYYYYYY',
    'YYgggggggmYg==gYYYYYYYYYYY',
    'YYggggggggYg==gYYYYYYYYYYY',
    'YYgm~~~~gggggggYYYYYYYYYYY',
    'YYgg~~~~g=====gYYYYYYYYYYY',
    'YYmg~~~~g=====gYYYYYYYYYYY',
    'YYgggggggggggggYYYYYYYYYYY',
    'YYogggggggYg==gggggggggggg',
    'YYYYYYYYYYYg====g==g======',
    'YYYYYYYYYYYg====g==g======',
    'YYYYYYYYYYYgggggg==ggggggg',
    'YYYYYYYYYYYYYYYgg==gmgYYYY',
    'YYYYYYYYYYYYYYYgg==gmgYYYY',
    'YYYYYYYYYYYYYYYgggggggYYYY',
    'YYYYYYYYYYYYYYYggggmggYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYY',
  ],
  objs: [
    // いずみ: のむと みんな げんきに なる(main.js の EVENTS.spring)
    { kind: 'look', x: 8, y: 5, label: 'のむ', event: 'spring' },
    { kind: 'chest', x: 20, y: 14, label: 'あける', give: 'かいふくやく',
      lines: ['たからばこを あけた!', '♪かいふくやくを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'item', x: 3, y: 7, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'item', x: 16, y: 14, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'enemy', x: 20, y: 9, party: 'どんぐり どんぐり きのこ' },
    { kind: 'enemy', x: 12, y: 3, party: 'はっぱ はっぱ どんぐり' },
    { kind: 'enemy', x: 18, y: 13, party: 'ゾンビねこ ゾンビねこ', night: true },
    { kind: 'enemy', x: 12, y: 7, party: 'ほねほね', night: true },
  ],
  exits: [
    { x: 25, y: 9, h: 2, to: 'mid1', at: [1, 4.5], dir: 'right' },      // みぎ → くらい もりの みち
    { x: 11, y: 0, w: 2, to: 'deep', at: [11.5, 16], dir: 'up' },       // うえ → 森の おく
  ],
};

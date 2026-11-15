// くらい もりの みち(26×18マス)。 森 → ここ → いずみの もり → 森の おく
export default {
  outside: true,
  bgm: 'forest',
  rows: [
    'YYYYYYYYYYYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYY',
    'gggggggYYYYYYYYYgggggggYYY',
    '======gYYYYYYYYYgggggggYYY',
    '======gYYYYggggggggggogYYY',
    'gggg==gYYYYg====ggggggmYYY',
    'YYYg==gYYYYg====gggggggYYY',
    'YYYg==gYYYYg==ggggggggmYYY',
    'YYYg==gYYYYg==gYgggggggYYY',
    'YYYmgggggggg==gYYYYYYYYYYY',
    'YYYg==g====g==gYYYYYYYYYYY',
    'YYYg==g====g==gYYYYYYYYYYY',
    'Yggg==gggggggggYYYYYYYYYYY',
    'Yggg==gYYYYg==gYYYYYYYYYYY',
    'Yggg==gYYYYg==gYYYYYYYYYYY',
    'YYYggggYYYYg==gYYYYYYYYYYY',
    'YYYYYYYYYYYg==gYYYYYYYYYYY',
  ],
  objs: [
    { kind: 'chest', x: 21, y: 4, label: 'あける', give: 'かいふくやく',
      lines: ['たからばこを あけた!', '♪かいふくやくを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 2, y: 14, label: 'あける', give: 'りんご',
      lines: ['たからばこを あけた!', '♪{赤|あか}い りんごを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'item', x: 1, y: 13, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'item', x: 17, y: 8, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'enemy', x: 12, y: 14, party: 'きのこ きのこ' },
    { kind: 'enemy', x: 19, y: 6, party: 'どんぐり はっぱ' },
    { kind: 'enemy', x: 8, y: 11, party: 'はっぱ はっぱ はっぱ' },
    { kind: 'enemy', x: 4, y: 7, party: 'ゾンビねこ', night: true },
    { kind: 'enemy', x: 18, y: 8, party: 'ほねほね', night: true },
  ],
  exits: [
    { x: 12, y: 17, w: 2, to: 'forest', at: [24.5, 1], dir: 'down' },   // した → 森
    { x: 0, y: 4, h: 2, to: 'mid2', at: [24, 9.5], dir: 'left' },       // ひだり → いずみの もり
  ],
};

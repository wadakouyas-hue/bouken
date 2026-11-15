// きたの もり2 いろの ない もり(28×18マス)。 くさも きも はいいろ
// swaps: フラグが つくと マスが かわる(nfColor: えかきの かけらで いろが もどる / nfBridge: こうさくの かけらで はしが なおる)
export default {
  outside: true,
  bgm: 'forest',
  rows: [
    'xxxxxxxxxxxxxxxxxx~~xxqqxxxx',
    'xxxxxxxxxxxxxxxxxx~~xxqqxxxx',
    'xxxxxxxxxxxxxxxxxx~~xxqqxxxx',
    'xxxxxxxxxxxxxxxxxx~~qqqqqqqx',
    'xxxxxxxxxxxXXqqqqq~~qqqqqqqx',
    'xxxxxxxxxxxXXqqiqqkkqqqqqqqx',
    'xxxqqqqqqqqXXqqqqqkkqqqxqqqx',
    'xxxqqiqqqqqXXqqqqq~~qqqqqqqx',
    'xxxqqqqqqqqxxxxxxx~~qqqqqiqx',
    'xxxqqqqqqqqxxxxxxx~~iqqqqqqx',
    'xxxqqqqqqiqxxxxxxx~~qqqqqqxx',
    'xxxqqqqqqqqxxxxxxx~~qqxqqqxx',
    'xxxxxqqqqxxxxxxxxx~~qqqqqqxx',
    'xxxxxqqqixxxxxxxxx~~qqqqqqxx',
    'xxxxxqqqqxxxxxxxxx~~qqqqqqxx',
    'xxxxxqqqqxxxxxxxxx~~xxxxxxxx',
    'xxxxxqqqqxxxxxxxxx~~xxxxxxxx',
    'xxxxxxqqxxxxxxxxxx~~xxxxxxxx',
  ],
  swaps: [
    { flag: 'nfColor', chars: { q: 'g', i: 'f', x: 'Y', X: 'g' } },
    { flag: 'nfBridge', cells: [[18, 5, 'B'], [19, 5, 'B'], [18, 6, 'b'], [19, 6, 'b']] },
  ],
  objs: [
    { kind: 'deco', x: 7, y: 7.6, pic: 'flowerG', label: 'しらべる', event: 'color', hide: 'nfColor' },
    { kind: 'deco', x: 7, y: 7.6, pic: 'flowerC', label: 'しらべる', event: 'color', show: 'nfColor' },
    { kind: 'look', x: 17, y: 5.5, label: 'なおす', event: 'bridge', hide: 'nfBridge' },
    { kind: 'chest', x: 3, y: 10, label: 'あける', give: 'なおりぐさ',
      lines: ['たからばこを あけた!', '♪なおりぐさを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 25, y: 13, label: 'あける', give: 'ワープのはね',
      lines: ['たからばこを あけた!', '♪{ワープ|わーぷ}の はねを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'enemy', x: 7, y: 14, party: 'スカンク' },
    { kind: 'enemy', x: 15, y: 6, party: 'かえる スカンク' },
    { kind: 'enemy', x: 23, y: 7, party: 'いのしし スカンク' },
    { kind: 'enemy', x: 22, y: 12, party: 'いのしし いのしし' },
    { kind: 'enemy', x: 5, y: 9, party: 'ほねほね ほねほね', night: true },
    { kind: 'enemy', x: 24, y: 4, party: 'ゾンビねこ ほねほね', night: true },
  ],
  exits: [
    { x: 6, y: 17, w: 2, to: 'north1', at: [12.5, 1], dir: 'down' },     // した → かわの もり
    { x: 22, y: 0, w: 2, to: 'cave', at: [12.5, 17], dir: 'up' },        // うえ → くらい どうくつ
  ],
};

// あらしの のはら2 かみなりの ぬま(30×20マス)。 まっくら(dark)。 かみなりが ひかると まわりが みえる
// M ぬま(とおれない)  j いたの みち。 みぎうえの こや(あまやどりの こや)で やすめる
export default {
  dark: true,
  bgm: 'storm',
  rain: { stop: 'ch3' },
  lightR: 46,            // あめで あかりが ちいさい
  thunder: [3, 5],       // かみなりが ひかる かんかく(びょう)
  enter: [{ once: 'swampHint', event: 'swampHint' }],
  rows: [
    'MMMMMMMMadaaaaadaMMMMMMMMMMjjM',
    'MMMMMMMMaaaaaaaaaMMMMMMMMMMjjM',
    'MMMMMMMMMMMMjjMMMMMMMMMMMMMjjM',
    'MMMMMMMMMMMMjjMMMMMMMMMMMMMjjM',
    'MMMMMMMMMMMMjjMMMMMMMMMRRRRjjM',
    'MMMMMMMMMMMMjjMMMMMMMMaRRRRaMM',
    'MMMMMMMMMMMMjjMMMMMMMMahDhhaMM',
    'MMMMMMMMMMaaaaaMMMMMMMaaaaaaMM',
    'aaaaMMMMMMaaadajjjjjjjaaaaaaMM',
    'jaaajjjjjjaaaaajjjjjjjaaaaaaMM',
    'jaaajjjjjjaaaaaMMMMMMMaaaaaaMM',
    'adaaMMMMMMaaaaaMMMMMMMaaaaadMM',
    'aaaaMMMMMMaaaadMMMMMMMaaaaaaMM',
    'MMMMMMMMMMMjjMMMMMMMMMMMjjMMMM',
    'MMMMMMMMMMMjjMMMMMMMMMMMjjMMMM',
    'MMMMMMMMMMMjjMMMMMMMMMMMjjMMMM',
    'MMMMMMMMMMMjjMMMMMMMMMMMjjMMMM',
    'MMMMMMMMaaaaaaaMMMMMaaaaaaaaaM',
    'MMMMMMMMaadaaaaMMMMMadaaaaaaaM',
    'MMMMMMMMMMMMMMMMMMMMaaaaaaaaaM',
  ],
  objs: [
    { kind: 'chest', x: 9, y: 17, label: 'あける', give: 'げんきのみず',
      lines: ['たからばこを あけた!', '♪げんきの みずを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 11, y: 0, label: 'あける', give: 'ワープのはね',
      lines: ['たからばこを あけた!', '♪{ワープ|わーぷ}の はねを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'look', x: 26, y: 18, label: 'しらべる', gold: 400,
      lines: ['ぬまの そばに ふくろが おちている。', '♪400{円|えん} みつけた!'], after: ['もう なにも ない。'] },
    { kind: 'enemy', x: 7, y: 9.5, party: 'うなぎ' },
    { kind: 'enemy', x: 12, y: 9, party: 'あまぐも かさおばけ' },
    { kind: 'enemy', x: 11.5, y: 15, party: 'うなぎ うなぎ' },
    { kind: 'enemy', x: 18, y: 8.5, party: 'あまぐも あまぐも' },
    { kind: 'enemy', x: 24.5, y: 15, party: 'うなぎ あまぐも' },
    { kind: 'enemy', x: 24, y: 18, party: 'あまぐも うなぎ かさおばけ' },
    { kind: 'enemy', x: 12.5, y: 3, party: 'うなぎ' },
  ],
  exits: [
    { x: 0, y: 9, h: 2, to: 'storm1', at: [30, 7.5], dir: 'left' },       // ひだり → かぜの のはら
    { x: 24, y: 6, to: 'hut', at: [4.5, 6], dir: 'up' },                  // あまやどりの こや
    { x: 27, y: 0, w: 2, to: 'storm3', at: [12.5, 20], dir: 'up' },       // うえ → あれた たに
  ],
};

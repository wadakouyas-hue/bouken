// こわい もり2 ささやきの もり(26×18マス)。 ほそい みちが 2つ(ひとりで とおる)
export default {
  dark: true,
  scary: true,
  bgm: 'night',
  alone: [
    { id: 'k2a', x: 10, y: 10, w: 6, h: 1, wait: [8.6, 10.6] },
    { id: 'k2b', x: 20, y: 3, w: 1, h: 5, wait: [19.4, 8.6] },
  ],
  rows: [
    'YYYYYYYYYYYYYYYYYYYYYYYYYY',
    'YYYYYYYYYYYYYggogggggggggg',
    'YYYYYYYYYYYYYggggggggggggg',
    'YggggYYYYYYYYYYYYYYYgYYYYY',
    'YggggYYYYYYYYYYYYYYYgYYYYY',
    'YggggYYYYYYYYYYYYYYYgYYYYY',
    'YggggYYYYYYYYYYYYYYYgYYYYY',
    'YggggYYYYYYYYYYYYYYYgYYYYY',
    'YYYYgYYYYYYYYYYYggggggggYY',
    'YYYgggggggYYYYYYggggggogYY',
    'YYYgggggggggggggggggggggYY',
    'YYYgggggggYYYYYYggggggggYY',
    'YYYggggoggYYYYYYgggggmggYY',
    'YYYgggggggYYYYYYggogggggYY',
    'YYYgggggggYYYYYYggggggggYY',
    'YYYgmgggggYYYYYYggggggggYY',
    'YYYgggggggYYYYYYYYYYYYYYYY',
    'YYYYYggYYYYYYYYYYYYYYYYYYY',
  ],
  objs: [
    { kind: 'chest', x: 2, y: 4, label: 'あける', give: 'ワープのはね', lines: ['たからばこを あけた!', '♪{ワープ|わーぷ}の はねを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'look', x: 22, y: 14, label: 'しらべる', gold: 500,
      lines: ['{木|き}の ねもとに ふくろが ある。', '♪500{円|えん} みつけた!'], after: ['もう なにも ない。'] },
    { kind: 'enemy', x: 6, y: 11, party: 'もりぐも' },
    { kind: 'enemy', x: 18, y: 10, party: 'びっくりきのこ こおばけ' },
    { kind: 'enemy', x: 21, y: 14, party: 'もりぐも おばけび' },
    { kind: 'enemy', x: 17, y: 2, party: 'びっくりきのこ びっくりきのこ' },
    { kind: 'enemy', x: 23, y: 1.5, party: 'おばけび おばけび こおばけ' },
  ],
  exits: [
    { x: 5, y: 17, w: 2, to: 'kowa1', at: [14.5, 1], dir: 'down' },      // した → もりの いりぐち
    { x: 25, y: 1, h: 2, to: 'mayoi', at: [11.5, 13], dir: 'up' },       // みぎ → まよいの もり
  ],
};

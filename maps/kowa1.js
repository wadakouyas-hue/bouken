// こわい もり1 もりの いりぐち(22×18マス)。 かみなりの おかの たおれた きの さき
// scary: こわい もり(ハモが てを つないで となりを あるく。 まっくら)
// alone: ほそい みち(てを つないだ ままでは とおれない。 ハモは wait で まつ。 リズは ひとりで すすむ)
export default {
  dark: true,
  scary: true,
  bgm: 'night',
  enter: [{ once: 'scaryIntro', event: 'scaryIntro' }, { need: 'obake', once: 'feverGo', event: 'fever' }],
  alone: [
    { id: 'k1', x: 10, y: 8, w: 1, h: 5, wait: [9.4, 13.4] },
  ],
  rows: [
    'YYYYYYYYYYYYYYggYYYYYY',
    'YYYYYYYYYYYYYYggYYYYYY',
    'YYYYggggggggggggggYYYY',
    'YYYYggggggggogggggYYYY',
    'YYYYgoggggggggggggYYYY',
    'YYYYggggggggggggggYYYY',
    'YYYYggggogggggggogYYYY',
    'YYYYggggggggggggggYYYY',
    'YYYYYYYYYYgYYYYYYYYYYY',
    'YYYYYYYYYYgYYYYYYYYYYY',
    'YYgggggYYYgYYYYYYYYYYY',
    'YYgmgggYYYgYYYYYYYYYYY',
    'YYgggggYYYgYYYYYYYYYYY',
    'YYgggggggggggggYYYYYYY',
    'YYgggggggggggggYYYYYYY',
    'YYgggggggggggmgYYYYYYY',
    'YYYYYYYggggggggYYYYYYY',
    'YYYYYYYYYYggYYYYYYYYYY',
  ],
  objs: [
    { kind: 'chest', x: 3, y: 10, label: 'あける', give: 'げんきのみず', lines: ['たからばこを あけた!', '♪げんきの みずを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'enemy', x: 6, y: 4, party: 'こおばけ' },
    { kind: 'enemy', x: 15, y: 5, party: 'おばけび こおばけ' },
    { kind: 'enemy', x: 4, y: 13, party: 'おばけび' },
  ],
  exits: [
    { x: 10, y: 17, w: 2, to: 'storm4', at: [9.5, 2], dir: 'down' },     // した → かみなりの おか
    { x: 14, y: 0, w: 2, to: 'kowa2', at: [5.5, 16], dir: 'up' },        // うえ → ささやきの もり
  ],
};

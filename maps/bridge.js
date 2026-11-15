// こわい もり4 ひとりの はし(16×24マス)。 ながい つりばしを リズが ひとりで わたる(ハモは てまえで みまもる)
// alone の done: わたりきった ときの できごと(EVENTS.braveBridge → ゆうきの かけら)
export default {
  dark: true,
  scary: true,
  bgm: 'night',
  lightR: 56,
  alone: [
    { id: 'br', x: 7, y: 4, w: 1, h: 15, wait: [6.4, 19.8], done: 'braveBridge' },
  ],
  rows: [
    '00YYggggggggYY00',
    '00Yggggggggggg00',
    '00gggggggggggY00',
    '00gggggggggggg00',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '0000000t00000000',
    '00ggggggggggYg00',
    '00Yggggggggggg00',
    '00gggggggggggY00',
    '00gYgggggggggg00',
    '00YYggggggggYY00',
  ],
  objs: [
    { kind: 'sign', x: 10, y: 20, name: 'かんばん', label: 'よむ', lines: ['ひとりの はし', 'ひとりずつ わたりましょう'] },
  ],
  exits: [
    { x: 7, y: 23, w: 2, to: 'mayoi', at: [11.5, 13], dir: 'up' },       // した → まよいの もり
    { x: 7, y: 0, w: 2, to: 'kowa5', at: [9.5, 16], dir: 'up' },         // うえ → もりの おく
  ],
};

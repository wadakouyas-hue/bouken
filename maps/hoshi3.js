// ほしの どうくつ3 ほしの へや(18×14マス)。 ボス ねぼすけ モグラ
export default {
  dark: true,
  lightR: 70,
  bgm: 'cave',
  guest: true,
  rows: [
    'NNNNNNNNNNNNNNNNNN',
    'NNNNNnnnnnnnnNNNNN',
    'NNNnnnnnnnnnnnnNNN',
    'NNnnnnnnnnnnnnnnNN',
    'NnnnnnnnnnnnnnnnnN',
    'NnnnnnnnnnnnnnnnnN',
    'NnnnnnnnnnnnnnnnnN',
    'NnnnnnnnnnnnnnnnnN',
    'NnnNnnnnnnnnnNnnnN',
    'NnnnnnnnnnnnnnnnnN',
    'NNnnnnnnnnnnnnnnNN',
    'NNNnnnnnnnnnnnnNNN',
    'NNNNNNNNnnNNNNNNNN',
    'NNNNNNNNnnNNNNNNNN',
  ],
  objs: [
    { kind: 'boss', x: 8.5, y: 5, bw: 16, look: 'ねぼすけモグラ', party: 'ねぼすけモグラ', event: 'mogura', hide: 'mogura', name: 'ねぼすけ モグラ', label: 'おこす', lines: ['ぐう…… ぐう……', '……むにゃ。 だれだぁ…… ねてるのに……', 'ねむりの じゃまを するなぁ〜!'] },
    { kind: 'deco', x: 8.5, y: 3, pic: 'starOn', show: 'mogura', hide: 'starGot', label: 'もらう', event: 'starGot', light: 60 },
    { kind: 'deco', x: 3, y: 3, pic: 'starOn', light: 40, float: true }, { kind: 'deco', x: 14, y: 3, pic: 'starOn', light: 40, float: true }, { kind: 'deco', x: 2, y: 10, pic: 'starOn', light: 40, float: true }, { kind: 'deco', x: 15, y: 10, pic: 'starOn', light: 40, float: true },
  ],
  exits: [
    { x: 8, y: 13, w: 2, to: 'hoshi2', at: [20, 1.5], dir: 'left' },
  ],
};

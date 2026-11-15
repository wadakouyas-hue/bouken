// きたの もり3 くらい どうくつ(26×20マス)。 ひるでも まっくら(dark)。 ランタンに ひを つけると あかるく なる
export default {
  dark: true,
  bgm: 'cave',
  rows: [
    'NNNNNNNNNNNNNNNNnnNNNNNNNN',
    'NNNNNNNNNNNNNNNNnnNNNNNNNN',
    'NNNNNNNNNNNNNNNNnnNNNNNNNN',
    'NNNNNNNNNNnnnnnnnnnnnnnNNN',
    'NnnnnnnnnnnnnnnnnnnnnnnNNN',
    'NnnnnnNNNNnnnnnnnnnnnnnNNN',
    'NnnnnnNNNNnnnNNNNNNNnnnNNN',
    'NNNNNNNNNNnnnNNnnnnNnnnNNN',
    'NNNnnnnnnnnnnnnnnnnNnnnNNN',
    'NNNnnnnnnnnnnNNnnnnNnnnNNN',
    'NNNnnnnnnnnnnNNNNNNNnnnNNN',
    'NNNnnnNNNNNNNNNNNNNNnnnNNN',
    'NNNnnnNNNNNNNNNNnnnnnnnnnN',
    'NNNnnnNNNNNNNNNNnnnnnnnnnN',
    'NNNnnnnnnnnnnnnNnnnnnnnnnN',
    'NNNnnnnnnnnnnnnNNNNNNNNNNN',
    'NNNnnnnnnnnnnnnNNNNNNNNNNN',
    'NNNNNNNNNNNnnnnNNNNNNNNNNN',
    'NNNNNNNNNNNnnnnNNNNNNNNNNN',
    'NNNNNNNNNNNnnnnNNNNNNNNNNN',
  ],
  objs: [
    // ランタン(lamp: ひを つけた しるしの フラグ)
    ...[[14, 17, 'lamp1'], [3, 13, 'lamp2'], [9, 8, 'lamp3'], [22, 6, 'lamp4'], [18, 3, 'lamp5']].flatMap(([x, y, f]) => [
      { kind: 'deco', x, y, pic: 'lantern', label: 'ひを つける', event: 'torch', lamp: f, hide: f },
      { kind: 'deco', x, y, pic: 'lanternOn', light: 64, show: f },
    ]),
    { kind: 'chest', x: 1, y: 5, label: 'あける', give: 'ぼうし',
      lines: ['たからばこを あけた!', 'なかに ぼうしが はいっていた!', '♪たんけんかの ぼうしを {手|て}に いれた!'], after: ['もう なにも ない。'] },
    { kind: 'chest', x: 24, y: 13, label: 'あける', give: 'てつのけん',
      lines: ['たからばこを あけた!', '♪てつの けんを {手|て}に いれた!', '{メニュー|めにゅー}の 「そうび」で もてるよ。'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 17, y: 8, label: 'あける', give: 'げんきのみず',
      lines: ['たからばこを あけた!', '♪げんきの みずを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'enemy', x: 5, y: 15, party: 'こうもり' },
    { kind: 'enemy', x: 4, y: 9, party: 'こうもり こうもり' },
    { kind: 'enemy', x: 15, y: 4, party: 'スカンク こうもり' },
    { kind: 'enemy', x: 21, y: 11, party: 'こうもり こうもり こうもり' },
    { kind: 'enemy', x: 20, y: 13, party: 'いのしし こうもり' },
  ],
  exits: [
    { x: 11, y: 19, w: 4, to: 'north2', at: [22.5, 1], dir: 'down' },    // した → いろの ない もり
    { x: 16, y: 0, w: 2, to: 'nest', at: [9.5, 20], dir: 'up' },         // うえ → ミミズクの す
  ],
};

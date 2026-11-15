// あらしの のはら4 かみなりの おか(20×18マス)。 かみなりぐも(ボス)が いる。 うえの たおれた きの さきは こわい もり(第3章 2かいめ)
export default {
  outside: true,
  bgm: 'storm',
  rain: { stop: 'ch3' },
  thunder: [4, 7],
  swaps: [{ flag: 'treeMoved', cells: [[9, 0, 'n'], [10, 0, 'n'], [9, 1, 'n'], [10, 1, 'n']] }],   // たおれた きを うごかす(第3章 2かいめ)
  rows: [
    'NNNNNNNNNyyNNNNNNNNN',
    'NNNNNNNNNyyNNNNNNNNN',
    'NNNNnnnnnnnnnnnnNNNN',
    'NNNNnnnnnnnnnnnnNNNN',
    'NNNNnnnnnnnnnnnnNNNN',
    'NNnn^nnnnnnnnnnnnnNN',
    'NNnnnnnnnnnnnnn^nnNN',
    'NNnnnnnnnnnnnnnnnnNN',
    'NNnnn^nnnnnnnn^nnnNN',
    'NNnnnnnnnnnnnnnnnnNN',
    'NNnnnnnnnnnnnnnnnnNN',
    'NNnnnnnnnnnnnnnnnnNN',
    'NNnnnn^nnnnnn^nnnnNN',
    'NNNNnnnnnnnnnnnnNNNN',
    'NNNNnnnnnnnnnnnnNNNN',
    'NNNNnnnnnnnnnnnnNNNN',
    'NNNNNNNNNnnNNNNNNNNN',
    'NNNNNNNNNnnNNNNNNNNN',
  ],
  objs: [
    { kind: 'boss', x: 9.5, y: 5, bw: 16, look: 'かみなりぐも', party: 'かみなりぐも', event: 'kumo', hide: 'kumo', name: 'かみなりぐも', label: 'はなす',
      lines: ['ゴロゴロゴロ……!'.replace('ゴロゴロゴロ', '{ゴロゴロゴロ|ごろごろごろ}'), 'だれだ! ここから さきへは いかせないぞ!', 'もっと もっと あらしを おこすんだ! ゴロゴロー!'.replace('ゴロゴロー', '{ゴロゴロー|ごろごろー}')] },
    { kind: 'look', x: 9.5, y: 2, label: 'しらべる', event: 'pushTree', hide: 'treeMoved' },
    { kind: 'chest', x: 4, y: 3, label: 'あける', give: 'はがねのけん',
      lines: ['たからばこを あけた!', '♪はがねの けんを {手|て}に いれた!', '{メニュー|めにゅー}の 「そうび」で もてるよ。'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 15, y: 3, label: 'あける', give: 'げんきのみず',
      lines: ['たからばこを あけた!', '♪げんきの みずを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'enemy', x: 5, y: 10, party: 'あまぐも あまぐも' },
    { kind: 'enemy', x: 14, y: 10, party: 'いわごろ うなぎ' },
  ],
  exits: [
    { x: 9, y: 17, w: 2, to: 'storm3', at: [19.5, 1], dir: 'down' },      // した → あれた たに
    { x: 9, y: 0, w: 2, to: 'kowa1', at: [10.5, 16], dir: 'up', need: 'treeMoved' },   // うえ → こわい もり
  ],
};

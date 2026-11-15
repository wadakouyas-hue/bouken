// こおりの どうくつ2(16×14マス)
export default {
  bgm: 'cave',
  rows: [
    'NNNNNnnNNNNNNNNN',
    'NNNNNnnNNNNNNNNN',
    'N31111111111113N',
    'N11111311111311N',
    'N11111nn1111111N',
    'N13311111111113N',
    'N33111111111111N',
    'N11131111111113N',
    'N11111111111113N',
    'N11113111111111N',
    'N31111111111113N',
    'N13111311111111N',
    'N11111nnnn11111N',
    'NNNNNNNnnNNNNNNN',
  ],
  objs: [
    { kind: 'chest', x: 7, y: 4, label: 'あける', gold: 3000, lines: ['たからばこを あけた!', '♪3000{円|えん} みつけた!'], after: ['もう からっぽだ。'] },
  ],
  exits: [
    { x: 7, y: 13, w: 2, to: 'kori1', at: [9.5, 1], dir: 'down' },
    { x: 5, y: 0, w: 2, to: 'kori3', at: [7.5, 12], dir: 'up' },
  ],
};

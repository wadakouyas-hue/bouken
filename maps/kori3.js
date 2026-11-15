// こおりの どうくつ3(16×14マス)。 いちばん むずかしい
export default {
  bgm: 'cave',
  rows: [
    'NNNNnnNNNNNNNNNN',
    'NNNNnnNNNNNNNNNN',
    'N11111111111111N',
    'N11111111111111N',
    'N11311111111113N',
    'N31113111113111N',
    'N311nn111111131N',
    'N31131111111111N',
    'N13311113111111N',
    'N13111311131111N',
    'N11113111111111N',
    'N11111113111111N',
    'N11111nnnn11111N',
    'NNNNNNNnnNNNNNNN',
  ],
  objs: [
    { kind: 'chest', x: 5, y: 6, label: 'あける', give: 'げんきのみず', lines: ['たからばこを あけた!', '♪げんきの みずを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
  ],
  exits: [
    { x: 7, y: 13, w: 2, to: 'kori2', at: [5.5, 1], dir: 'down' },
    { x: 4, y: 0, w: 2, to: 'korioku', at: [4.5, 6], dir: 'up' },
  ],
};

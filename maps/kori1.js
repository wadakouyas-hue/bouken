// こおりの どうくつ1(16×14マス)。 ぬくもりの かけらで こおりの かべを とかして はいる。 すべる パズル
export default {
  bgm: 'cave',
  rows: [
    'NNNNNNNNNnnNNNNN',
    'NNNNNNNNNnnNNNNN',
    'N11111111113111N',
    'N11111111311111N',
    'N11111111111311N',
    'N11113111111111N',
    'N11111133131111N',
    'N31111111111111N',
    'N1111nn11111111N',
    'N11111111111111N',
    'N11131111111333N',
    'N11111311113111N',
    'N11111nnnn11111N',
    'NNNNNNNnnNNNNNNN',
  ],
  objs: [
    { kind: 'chest', x: 6, y: 8, label: 'あける', give: 'げんきのみず', lines: ['たからばこを あけた!', '♪げんきの みずを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
  ],
  exits: [
    { x: 7, y: 13, w: 2, to: 'snow1', at: [20, 1.2], dir: 'down' },
    { x: 9, y: 0, w: 2, to: 'kori2', at: [7.5, 12], dir: 'up' },
  ],
};

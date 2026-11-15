// まちの いえの ちかしつ(22×14マス)。 パルル町の おてつだいの ミニダンジョン。 ねずみの まものが すみついている
export default {
  bgm: 'cave',
  rows: [
    'NNNNNNNNNNNNNNNNNNNNNN',
    'NNNNNNNNNNcnnnnnnnnncN',
    'NnnnnnnnnnnnnnnnnnnnnN',
    'NnnnnnNNNNnnnnnnnnnnnN',
    'NnnnnnNNNNNNNNnnNNNNNN',
    'NnnncnNNNNNNNNnnNNNNNN',
    'NnnnnnNNNNNNnnnnnnNNNN',
    'NNNNNNNNNNNNncnncnNNNN',
    'NNNNNNNNNNNNnnnnnnNNNN',
    'NcnnnnnNNNNNnnnnnnNNNN',
    'NnnnnnnnnnnnnnnnncNNNN',
    'NnnnnnnnnnnnncnnnnNNNN',
    'NnnunncNNNNNnnnnnnNNNN',
    'NNNNNNNNNNNNNNNNNNNNNN',
  ],
  objs: [
    // おやぶん ねずみ: たおすと フラグ mouse(main.js の EVENTS.mouse)
    { kind: 'boss', x: 14.5, y: 5, bw: 16, look: 'ねずみ', party: 'おやぶんねずみ', event: 'mouse', hide: 'mouse', name: 'おやぶん ねずみ', label: 'はなす',
      lines: ['チュー! ここは おれたちの ひみつきちだ チュー!', 'オルゴールは わたさない チュー!'.replace('オルゴール', '{オルゴール|おるごーる}')] },
    { kind: 'chest', x: 19, y: 2, label: 'あける', give: 'オルゴール',
      lines: ['たからばこを あけた!', '♪おばあさんの {オルゴール|おるごーる}を {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 2, y: 3, label: 'あける', give: 'げんきのみず',
      lines: ['たからばこを あけた!', '♪げんきの みずを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 16, y: 12, label: 'あける', give: 'なおりぐさ',
      lines: ['たからばこを あけた!', '♪なおりぐさを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'enemy', x: 4, y: 10, party: 'ねずみ' },
    { kind: 'enemy', x: 10, y: 10, party: 'ねずみ ねずみ' },
    { kind: 'enemy', x: 15, y: 9, party: 'ねずみ ねずみ ねずみ' },
    { kind: 'enemy', x: 3, y: 4, party: 'ねずみ ねずみ' },
  ],
  exits: [
    { x: 3, y: 12, to: 'house3', at: [9, 6], dir: 'down' },    // かいだん → まちの いえ
  ],
};

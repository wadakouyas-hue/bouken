// こおりの どうくつの おく(10×8マス)。 パズルを ぜんぶ とけた ごほうび
export default {
  bgm: 'cave',
  rows: [
    'NNNNNNNNNN',
    'N1111111nN',
    'N1nnnnnn1N',
    'N1nnnnnn1N',
    'N1nnnnnn1N',
    'N1nnnnnn1N',
    'NnnnnnnnnN',
    'NNNNnnNNNN',
  ],
  objs: [
    { kind: 'chest', x: 4.5, y: 3, label: 'あける', give: 'ゆきのよろい', lines: ['おおきな たからばこを あけた!', '♪ゆきの よろいを {手|て}に いれた!', 'しろく ひかる、 とても かたい よろいだ。', '{メニュー|めにゅー}の 「そうび」で きられるよ。'], after: ['もう からっぽだ。'] },
    { kind: 'look', x: 7, y: 5, label: 'しらべる', lines: ['かべに ちいさな えが ほってある。', 'ねこが 3びき、 ならんで わらっている え だ。'] },
  ],
  exits: [
    { x: 4, y: 7, w: 2, to: 'kori3', at: [4.5, 1], dir: 'down' },
  ],
};

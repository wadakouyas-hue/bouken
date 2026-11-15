// こわい もり5 もりの おく(20×18マス)。 くろい きり(%)は ゆうきの かけらで とおれる。 ボス おおおばけ
export default {
  dark: true,
  scary: true,
  bgm: 'night',
  enter: [{ once: 'fogHint', event: 'fogHint' }, { need: 'obake', once: 'feverGo', event: 'fever' }],
  rows: [
    'YYYYYYYYYggYYYYYYYYY',
    'YYYYYYYYYggYYYYYYYYY',
    'YYYggggggggggggggYYY',
    'YYYggggggggggggggYYY',
    'YYYggggggggggggggYYY',
    'YYYggogggggggggggYYY',
    'YYYgggggggggggoggYYY',
    'YYYggggggggggggggYYY',
    'YYYggggggggggggggYYY',
    'YYYgoggggggggggogYYY',
    'YYYggggggggggggggYYY',
    'YYY%%%%%%%%%%%%%%YYY',
    'YYYggggggggggggggYYY',
    'YYYggggggggggogggYYY',
    'YYYgggoggggggggggYYY',
    'YYYggggggggggggggYYY',
    'YYYYYYYYYggYYYYYYYYY',
    'YYYYYYYYYggYYYYYYYYY',
  ],
  objs: [
    { kind: 'boss', x: 9.5, y: 5, bw: 16, look: 'おばけ', party: 'おおおばけ', event: 'obake', hide: 'obake', name: 'おおおばけ', label: 'はなす',
      lines: ['ヒュ〜〜 ドロドロ……'.replace('ヒュ〜〜 ドロドロ', '{ヒュ〜〜|ひゅ〜〜} {ドロドロ|どろどろ}'), 'こわいだろう〜。 かえれ〜!', 'この もりは、 だれも とおさないぞ〜!'] },
    { kind: 'look', x: 9.5, y: 1.2, label: 'しらべる', lines: ['みちの さきから、 つめたい かぜが ふいてくる。', 'とおくに、 ゆきを かぶった やまが みえる……'] },
    { kind: 'chest', x: 4, y: 3, label: 'あける', give: 'ぎんのけん', lines: ['たからばこを あけた!', '♪ぎんの けんを {手|て}に いれた!', '{メニュー|めにゅー}の 「そうび」で もてるよ。'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 15, y: 13, label: 'あける', give: 'げんきのみず', lines: ['たからばこを あけた!', '♪げんきの みずを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'enemy', x: 6, y: 13, party: 'こおばけ こおばけ' },
    { kind: 'enemy', x: 13, y: 8, party: 'もりぐも びっくりきのこ' },
  ],
  exits: [
    { x: 9, y: 17, w: 2, to: 'bridge', at: [7.5, 1], dir: 'down' },      // した → ひとりの はし
    { x: 9, y: 0, w: 2, to: 'snow1', at: [9.5, 14], dir: 'up', need: 'obake', block: ['おおきな おばけが みちを ふさいでいる……'] },   // うえ → ゆきの のはら
  ],
};

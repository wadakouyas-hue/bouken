// 森の おく(24×18マス)。 ガラガラ おおがらすが みちを ふさいでいる
export default {
  outside: true,
  bgm: 'forest',
  rows: [
    'YYYYYYYYYYY==YYYYYYYYYYY',
    'YYYYYYYYYYY==YYYYYYYYYYY',
    'YYYYYYYYYgg==ggYYYYYYYYY',
    'YYYYYYYgggg==ggggYYYYYYY',
    'YYYYYYggggg==gggggYYYYYY',
    'YYYYYYggggggggggggYYYYYY',
    'YYYYYYYgggggggggggYYYYYY',
    'YYYYYYYYYgg==ggYYYYYYYYY',
    'YYYgggYYYgg==ggYYYgggoYY',
    'YYgmggggggg==gggggggggYY',
    'YYggggYYYgg==ggYYYggmgYY',
    'YYYoggYYYgg==ggYYYgggYYY',
    'YYYYYYYYggg==gggYYYYYYYY',
    'YYYYYYYggmg==gggYYYYYYYY',
    'YYYYYYYYggg==ggYYYYYYYYY',
    'YYYYYYYYYgg==ggYYYYYYYYY',
    'YYYYYYYYYYg==gYYYYYYYYYY',
    'YYYYYYYYYYg==gYYYYYYYYYY',
  ],
  objs: [
    // ボス: たおすと フラグ crow が つく(main.js の EVENTS.crow)
    { kind: 'boss', x: 11.5, y: 3, bw: 16, look: 'からす', party: 'おおがらす', event: 'crow', hide: 'crow', name: '{ガラガラ|がらがら} おおがらす', label: 'はなす',
      lines: ['カァー! ここは おれさまの なわばりだ!', 'ピカピカの {ピック|ぴっく}は かえさないぞ! カァー!'.replace('ピカピカ', '{ピカピカ|ぴかぴか}')] },
    { kind: 'chest', x: 3, y: 8, label: 'あける', give: 'かいふくやく',
      lines: ['たからばこを あけた!', '♪かいふくやくを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 20, y: 8, label: 'あける', give: 'どうのけん',
      lines: ['たからばこを あけた!', '♪どうの けんを {手|て}に いれた!', '{メニュー|めにゅー}の 「そうび」で もてるよ。'], after: ['もう からっぽだ。'] },
    { kind: 'item', x: 2, y: 9, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'enemy', x: 11, y: 12, party: 'どんぐり はっぱ' },
    { kind: 'enemy', x: 19, y: 10, party: 'きのこ きのこ どんぐり' },
    { kind: 'enemy', x: 8, y: 9, party: 'はっぱ はっぱ' },
    { kind: 'enemy', x: 15, y: 5, party: 'ゾンビねこ', night: true },
    { kind: 'enemy', x: 5, y: 10, party: 'ほねほね ほねほね', night: true },
  ],
  exits: [
    { x: 11, y: 17, w: 2, to: 'forest', at: [24.5, 1], dir: 'down' },   // した → 森
    { x: 11, y: 0, w: 2, to: 'hill', at: [10.5, 14], dir: 'up', need: 'crow', block: ['おおがらすが みちを ふさいでいる!'] },   // うえ → みはらしの おか
  ],
};

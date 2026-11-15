// 森(30×20マス)— はじめての 戦闘を する予定の場所
export default {
  outside: true,   // そと(ひると よるが ある)
  bgm: 'forest',   // 流す曲(js/music.js)
  rows: [
    'YYYYYYYYYYYYYYYYYYYYYYYYggYYYY',
    'YYYYYYgggggggggYYYYYYYYYggYYYY',
    'YYYYYYYggggogggYYYYYYYYYggYYYY',
    'YYYYYYYmgg==ggggYYYYYYYYggYYYY',
    'YYYYYYmggg==gggYYYYYYYYgggggYY',
    'YYYYYgYYgg==YYgYYYYYYYYggggggY',
    'YgYYgmYYYY==ggYYmYYYYYYggggggY',
    'YmmggogYgY==ogggggYYYYgggggggY',
    'Ygoggggggg==gggggYYggYYgggoggY',
    '===========================ggY',
    '===========================ggY',
    'YggggggggYgggggmgY==YgmooggmgY',
    'YgggggggYYYmgggggY==YYYgoggggY',
    'YgggggYYYYYYYgYggg==oYgggggggY',
    'YgYYYYYYYYYYYggggg==oggggggggY',
    'YYYYYYYYYYYYYYgggg==gggYgYgggY',
    'YYYYYYYYYYYYYYgmgggggggggYYYYY',
    'YYYYYYYYYYYYYYggggggggggYYYYYY',
    'YYYYYYYYYYYYYYYgYYgggggYYYYYYY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  ],
  // kind: 'enemy' は てき。 party に data/enemies.csv の id を ならべる(いっしょに出てくる なかま)
  objs: [
    { kind: 'item', x: 8, y: 2, label: 'ひろう', give: 'かいふくやく',
      lines: ['♪かいふくやくを ひろった!', 'けがを したときに つかうと {元気|げんき}に なるよ。'] },
    { kind: 'item', x: 22, y: 16, label: 'ひろう', give: 'かいふくやく',
      lines: ['♪かいふくやくを ひろった!'] },
    { kind: 'chest', x: 13, y: 2, label: 'あける', give: 'きのぼう',
      lines: ['たからばこを あけた!', '♪きの ぼうを {手|て}に いれた!', '{メニュー|めにゅー}の 「そうび」で もてるよ。'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 27, y: 13, label: 'あける', give: 'かわのよろい',
      lines: ['たからばこを あけた!', '♪かわの よろいを {手|て}に いれた!', '{メニュー|めにゅー}の 「そうび」で きがえられるよ。'], after: ['もう からっぽだ。'] },
    // again: true … もりに 入りなおすと また おちている(さぎょうだいの ざいりょう)
    { kind: 'item', x: 2, y: 11, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'item', x: 16, y: 8, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'item', x: 23, y: 5, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'item', x: 17, y: 16, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'item', x: 28, y: 11, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'enemy', x: 6, y: 12, party: 'ゾンビねこ', night: true },
    { kind: 'enemy', x: 15, y: 17, party: 'ほねほね', night: true },
    { kind: 'enemy', x: 24, y: 5, party: 'ゾンビねこ ほねほね', night: true },
    { kind: 'enemy', x: 9, y: 1, party: 'ほねほね', night: true },
    { kind: 'enemy', x: 14, y: 10, party: 'きのこ' },
    { kind: 'enemy', x: 10, y: 5, party: 'どんぐり' },
    { kind: 'enemy', x: 19, y: 13, party: 'はっぱ きのこ' },
    { kind: 'enemy', x: 25, y: 8, party: 'きのこ きのこ' },
    { kind: 'enemy', x: 26, y: 12, party: 'どんぐり はっぱ' },
  ],
  exits: [
    { x: 0, y: 9, h: 2, to: 'village', at: [28, 9.5], dir: 'left' },  // 左はしの道 → 村
    { x: 24, y: 0, w: 2, to: 'deep', at: [11.5, 16], dir: 'up', need: 'hamo',   // うえ → 森の おく(ハモが なかまに なってから)
      block: ['この さきは {森|もり}の おく。 くらくて こわそう……', 'ひとりで いくのは やめておこう。'] },
  ],
};

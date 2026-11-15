// あらしの のはら1 かぜの のはら(32×16マス)。 パルル町の ひがし → ここ → かみなりの ぬま
// wind: ときどき つよい かぜが ふいて、 にしへ おしもどされる(いわの かげに いると だいじょうぶ)
export default {
  outside: true,
  bgm: 'storm',
  rain: { stop: 'ch3' },
  wind: { dx: -1, off: 2.2, on: 2.0, push: 50 },
  enter: [{ once: 'windHint', event: 'windHint' }],
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaT',
    'TaaaaaaaaadaaaAaaaaaaaaaaaaaaAaT',
    'TaaaAaaaaaaaaaaaaaaaAaaaaaaaaaaT',
    'TaaaaaaaaaaAaaaaaaaaaaaaaaaAaaaT',
    'TaaaaaaaaaaAaaaaaaaaaaaaaaaaaaaT',
    '======A=========A=======A=======',
    '======A=========A=======A=======',
    'TaaaaaaaaaaaaaadaaaaaaaaaaadaaaT',
    'TaaaaaaaaaaaAaaaaaaaadaaaaaaAaaT',
    'TaaaaaaaaAaaaaadaaaaaAaaaaaaaaaT',
    'TaaaaaaaaaaaaaaaaaAaaaaaaaAaaaaT',
    'TaaaaadaaaaaaaaaaadaaaaaaaaaaadT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  objs: [
    { kind: 'sign', x: 2, y: 6, name: 'かんばん', label: 'よむ', lines: ['→ かみなりの ぬま', '← {パルル|ぱるる}{町|まち}', 'かぜが つよい ときは いわの かげで まとう'] },
    { kind: 'chest', x: 28, y: 2, label: 'あける', give: 'げんきのみず',
      lines: ['たからばこを あけた!', '♪げんきの みずを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'chest', x: 13, y: 12, label: 'あける', give: 'なおりぐさ',
      lines: ['たからばこを あけた!', '♪なおりぐさを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
    { kind: 'enemy', x: 9, y: 4, party: 'つむじかぜ' },
    { kind: 'enemy', x: 14, y: 10, party: 'かさおばけ' },
    { kind: 'enemy', x: 19, y: 5, party: 'つむじかぜ かさおばけ' },
    { kind: 'enemy', x: 23, y: 11, party: 'かさおばけ かさおばけ' },
    { kind: 'enemy', x: 27, y: 8, party: 'つむじかぜ つむじかぜ' },
    { kind: 'enemy', x: 8, y: 11, party: 'ゾンビねこ ほねほね', night: true },
    { kind: 'enemy', x: 22, y: 3, party: 'ほねほね ほねほね', night: true },
  ],
  exits: [
    { x: 0, y: 7, h: 2, to: 'town2', at: [30, 17.5], dir: 'left' },       // ひだり → パルル町
    { x: 31, y: 7, h: 2, to: 'storm2', at: [1, 9.5], dir: 'right' },      // みぎ → かみなりの ぬま
  ],
};

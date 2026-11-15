// パルル町(32×22マス)。 ふんすいと トランポリンと ステージの ある こうえんの まち(第2章)
// ミミズクに 「おと」を ぬすまれて、 まちが しずかに なっている(quiet: この フラグが つくまで 曲が ならない)
// F ふんすい・J トランポリンは 2×2マス。 ひだりうえを 2で わりきれる ばしょに おく
export default {
  outside: true,
  bgm: 'park',
  quiet: 'owl',
  town: { name: '{パルル|ぱるる}{町|まち}', at: [15.5, 19] },
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT==TT',
    'T...........VVVVVVV..RRRRR..==.T',
    'T.RRRRR.....VVVVVVV..RRRRR..==.T',
    'T.RRRRR.....HWHWHWH..HWHWH..==.T',
    'T.HWHWH.....hhhDhhh..hhDhh..==.T',
    'T.hhDhh........=.......=....==.T',
    'T...=..........=.....,.=....==.T',
    'T...=..........=.......=UUUU==.T',
    'T...=..,ppppppppppppppp.UUUU==.T',
    'T...=====pppppppppppppp,HWHW==.T',
    'T.......ppppppFFppppppp.hhDh==.T',
    'T.......ppppppFFppppppp=======.T',
    'T.......ppppppppppppppp=======.T',
    'T.......ppppppppppppppp........T',
    'T.......ppppppppppppppp........T',
    'T...,...ppppppp==pppppp..,..T..T',
    'T...JJ.........==..............T',
    'T...JJT........==..........,...T',
    'T.............,==..............T',
    'T..............==,.............T',
    'T..............==....,.........T',
    'TTTTTTTTTTTTTTT==TTTTTTTTTTTTTTT',
  ],
  objs: [
    { kind: 'npc', x: 12, y: 12, pal: 'shop3', name: 'まちの ねこ', label: 'はなす',
      lines: ['ここは {パルル|ぱるる}{町|まち}。 ふんすいの ある こうえんの まちよ。', 'でも さいきん、 ふんすいの おとも\nとりの うたも きこえないの……'] },
    { kind: 'npc', x: 7, y: 16, pal: 'girl', name: 'こねこ', label: 'はなす', wander: true,
      lines: ['トランポリン、 たのしいよ!'.replace('トランポリン', '{トランポリン|とらんぽりん}'), 'でもね、 はねても ぽよーんって おとが しないの。 へんなの。'] },
    { kind: 'npc', x: 26.5, y: 13, pal: 'oji', name: 'としよりの ねこ', label: 'はなす',
      lines: ['よるに なると、 おおきな {ミミズク|みみずく}が\nまちの うえを とんでいくんじゃ。', 'あいつが まちの おとを もっていって しまったのかも しれん。', 'きたの もりの おくに すんでいると いう はなしじゃが……'] },
    { kind: 'sign', x: 17, y: 6, name: 'かんばん', label: 'よむ', lines: ['ステージの ある おみせ'.replace('ステージ', '{ステージ|すてーじ}'), 'まいばん たのしい えんそうかい!'] },
    { kind: 'sign', x: 17, y: 20, name: 'かんばん', label: 'よむ', lines: ['ようこそ {パルル|ぱるる}{町|まち}へ', '↓ みはらしの おか'] },
  ],
  exits: [
    { x: 15, y: 21, w: 2, to: 'hill', at: [9.5, 1], dir: 'down' },          // した → みはらしの おか
    { x: 15, y: 4, to: 'cafe', at: [6.5, 8], dir: 'up' },                   // ステージの ある おみせ
    { x: 26, y: 10, to: 'shop2', at: [6.5, 7], dir: 'up' },                 // パルル町の おみせ
    { x: 28, y: 0, w: 2, to: 'town2', at: [28.5, 2], need: 'ch2gate', block: ['この さきは きたの もり。', 'いまは まだ いけない みたい。'] },
  ],
};

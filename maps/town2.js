// パルル町(32×22マス)。 ふんすいと トランポリンと ステージの ある こうえんの まち(第2章)
// ミミズクに 「おと」を ぬすまれて、 まちが しずかに なっている(quiet: この フラグが つくまで きょくが ならない。 そのあと park)
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
      talk: [{ need: 'owl', lines: ['きこえる? ふんすいの おと! ことりの うたも!', 'ありがとう! まちが にぎやかに なったわ。'] }],
      lines: ['ここは {パルル|ぱるる}{町|まち}。 ふんすいの ある こうえんの まちよ。', 'でも さいきん、 ふんすいの おとも\nとりの うたも きこえないの……'] },
    // ===== おてつだい1: トランポリン =====
    { kind: 'npc', x: 7, y: 16, pal: 'girl', name: 'こねこ', label: 'はなす', wander: true,
      talk: [{ need: ['tramp', 'owl'], lines: ['きいて! ぽよーん! って おとが するように なったよ!', '10かい とぶ ごとに いいもの あげる! 150かいまで あるよ!'] },
        { need: 'tramp', lines: ['また いっしょに とぼうね!', '10かい とぶ ごとに いいもの あげる! 150かいまで あるよ!', 'トランポリンの まえで 「とぶ」を おしてね。'.replace('トランポリン', '{トランポリン|とらんぽりん}')] }],
      lines: ['{トランポリン|とらんぽりん}、 たのしいよ! いっしょに とぼうよ!', 'でもね、 はねても ぽよーんって おとが しないの。 へんなの。', 'トランポリンの まえで 「とぶ」を おしてね。'.replace('トランポリン', '{トランポリン|とらんぽりん}')] },
    { kind: 'look', x: 4.5, y: 18, label: 'とぶ', event: 'tramp' },
    // ===== おてつだい2: えかき(ぬりえ) =====
    { kind: 'npc', x: 6, y: 7, pal: 'paint', name: 'えかきの ねこ', label: 'はなす',
      talk: [
        { need: 'paint', then: 'paint', lines: ['また いっしょに えを かく?'] },
        { then: 'paint', lines: ['こんにちは。 わたしは えを かくのが すきなの。', 'いっしょに かかない? すきな いろで ぬってみて!'] },
      ] },
    // ===== おてつだい3: こうさく(ことりの いえ) =====
    { kind: 'npc', x: 25, y: 16, pal: 'oba', name: 'ことりずきの ねこ', label: 'はなす',
      talk: [
        { need: ['craft', 'owl'], lines: ['ことりが うたってる! {ピピピ|ぴぴぴ}……って。', 'ほんとうに ありがとう!'] },
        { need: 'craft', lines: ['ことりの いえ、 ありがとう!', 'ことりが かえって きたわ。 なきごえが きこえたら いいのにね。'] },
        { not: 'craft', set: 'birdtalk', lines: ['さいきん、 ことりが いなくなって さみしいの。', 'あの {木|き}に すむ ばしょが あれば、 かえって くるかしら……'] },
      ] },
    { kind: 'deco', x: 22, y: 18, pic: 'furn:さぎょうだい', label: 'つくる', event: 'birdhouse' },
    { kind: 'deco', x: 28, y: 15.2, pic: 'birdhouse', show: 'craft' },
    { kind: 'item', x: 2, y: 19, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    { kind: 'item', x: 20, y: 19, label: 'ひろう', give: 'きのえだ', pic: 'branch', again: true, lines: ['♪きの えだを ひろった!'] },
    // ===== キャンプ(まちの ひがしの はらっぱ) =====
    { kind: 'deco', x: 28.5, y: 18, pic: 'tent', show: 'campGo', hide: 'camp' },
    { kind: 'deco', x: 26.5, y: 17.4, pic: 'fire', light: 56, show: 'campGo', hide: 'camp' },
    { kind: 'npc', x: 25, y: 18.4, pal: 'melo', name: '{メロ|めろ}', label: 'はなす', show: 'campGo', hide: 'camp', event: 'camp', lines: [] },
    { kind: 'npc', x: 26.5, y: 13, pal: 'oji', name: 'としよりの ねこ', label: 'はなす',
      talk: [{ need: 'owl', lines: ['{ミミズク|みみずく}を ゆるして あげたんじゃな。', 'やさしい こたちじゃ。 まちの みんなも よろこんで おるよ。'] }],
      lines: ['よるに なると、 おおきな {ミミズク|みみずく}が\nまちの うえを とんでいくんじゃ。', 'あいつが まちの おとを もっていって しまったのかも しれん。', 'きたの もりの おくに すんでいると いう はなしじゃが……'] },
    { kind: 'sign', x: 17, y: 6, name: 'かんばん', label: 'よむ', lines: ['ステージの ある おみせ'.replace('ステージ', '{ステージ|すてーじ}'), 'まいばん たのしい えんそうかい!'] },
    { kind: 'sign', x: 17, y: 20, name: 'かんばん', label: 'よむ', lines: ['ようこそ {パルル|ぱるる}{町|まち}へ', '↓ みはらしの おか'] },
  ],
  exits: [
    { x: 15, y: 21, w: 2, to: 'hill', at: [9.5, 1], dir: 'down' },          // した → みはらしの おか
    { x: 15, y: 4, to: 'cafe', at: [6.5, 8], dir: 'up' },                   // ステージの ある おみせ
    { x: 26, y: 10, to: 'shop2', at: [6.5, 7], dir: 'up' },                 // パルル町の おみせ
    { x: 4, y: 5, to: 'house2', at: [5.5, 7], dir: 'up' },                  // えかきの いえ
    { x: 23, y: 4, to: 'house3', at: [5.5, 7], dir: 'up' },                 // まちの いえ(ちかしつ)
    { x: 28, y: 0, w: 2, to: 'north1', at: [12.5, 16], dir: 'up', need: 'ch2gate', block: ['この さきは きたの もり。', 'まずは まちの ねこたちを てつだって あげよう。'] },   // うえ → きたの もり
  ],
};

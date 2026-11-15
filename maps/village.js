// ネコン村(30×20マス)
// 文字の意味は js/tiles.js の「文字 → タイルの絵」を見てね
// give は data/items.csv の id。 セリフの @ は 主人公の なまえ になる
// セリフの頭に ♪ を付けると、その行で「手に入れた!」の音が鳴る
// 位置は「左から何マス目, 上から何マス目」(いちばん左上が 0, 0)
export default {
  outside: true,   // そと(ひると よるが ある)
  town: { name: '{ネコン|ねこん}{村|むら}', at: [5.5, 8] },   // ワープで いける まち(着く ばしょ)
  rows: [
    'TTTTTTTTTTTTTTTTTTTTT~~TTTTTTT',
    'T........TT..........~~......T',
    'T.................T..~~......T',
    'T..RRRRR....RRRRR....~~..T...T',
    'T..RRRRR....RRRRR....~~....T.T',
    'T..HWHWH....HWHWH....~~.UUUUUT',
    'T..hhDhh....hhDhh..T.~~.UUUUUT',
    'T....=........=......~~.HWHWHT',
    'T....=........=......~~.hhDhhT',
    'T====================BB=======',
    'T====================bb=======',
    'T....................~~......T',
    'T......,,,,..........~~......T',
    'T.T.........,,.......~~......T',
    'T........,,,.....T...~~......T',
    'T.........,,.,....T..~~...T..T',
    'T..T.......,,........~~....T.T',
    'T.T..............T...~~.T....T',
    'T....................~~......T',
    'TTTTTTTTTTTTTTTTTTTTT~~TTTTTTT',
  ],
  objs: [
    { kind: 'npc', x: 10, y: 8, pal: 'oji', name: 'むらの おじいさん', label: 'はなす',
      talk: [
        { not: 'hamo', lines: ['おや、 おはよう。', 'はしの むこうに、 みなれない ねこが すわって いたよ。', '{ギター|ぎたー}を しょって いたなあ。 たびの ねこかな?'] },
        { not: 'crow', lines: ['{森|もり}の おくに、 おおきな からすが すんで いるらしい。', 'ピカピカの ものが すきで、 なんでも もっていって しまうそうじゃ。'.replace('ピカピカ', '{ピカピカ|ぴかぴか}'), 'からすは かみなりが にがてだと きいた ことが あるのう。'] },
      ],
      lines: ['おや、おはよう。 {今日|きょう}も {元気|げんき}だね。', '{川|かわ}の むこうに、なにか ひかる ものが あったよ。', 'はしを わたって {見|み}て ごらん。'] },
    { kind: 'npc', x: 10, y: 14, pal: 'girl', name: 'おんなのこ', label: 'はなす', wander: true,
      // おてつだい: まいごの こねこ(ミィ)
      talk: [
        { need: 'lostDone', lines: ['ミィを みつけて くれて ありがとう!'.replace('ミィ', '{ミィ|みぃ}'), 'こんどは いっしょに あそぼうね!'] },
        { need: 'lostFound', set: 'lostDone', gold: 500, give: 'ワープのはね', lines: ['ミィ! おかえり!'.replace('ミィ', '{ミィ|みぃ}'), 'ほんとうに ありがとう! これ、 おれいだよ。', '♪500{円|えん}と {ワープ|わーぷ}の はねを もらった!'] },
        { need: 'lostAsk', lines: ['ミィは {森|もり}の ひだりの ほうで いなくなったの……'.replace('ミィ', '{ミィ|みぃ}')] },
        { set: 'lostAsk', lines: ['どうしよう……', 'いもうとの ミィが、 {森|もり}で まいごに なっちゃったの。'.replace('ミィ', '{ミィ|みぃ}'), '{森|もり}の ひだりの ほうで いなくなったの。 さがして くれる?'] },
      ],
      lines: ['みて! {花|はな}が いっぱい さいたの。', '{赤|あか}い {花|はな}と {白|しろ}い {花|はな}、\nどっちが すき?'] },
    { kind: 'sign', x: 19, y: 8, name: 'かんばん', label: 'よむ',
      lines: ['← {ネコン|ねこん}{村|むら}    {森|もり}の みち →'] },
    { kind: 'sign', x: 23, y: 8, name: 'かんばん', label: 'よむ',
      lines: ['おみせ\nどうぐ ・ ぶきと ぼうぐ ・ かぐ ・ ぎんこう'] },
    // ハモ(たびの ねこ)。 なかまに なると いなくなる(うしろを ついてくる)
    { kind: 'npc', x: 24, y: 11, pal: 'hamo', name: '{ギター|ぎたー}の ねこ', label: 'はなす', hide: 'hamo', dir: 'left',
      talk: [{ set: 'hamo', join: 'hamo', name: '{ハモ|はも}', lines: [
        'やあ。 ぼくは {ハモ|はも}。 たびを しながら {ギター|ぎたー}を ひいているんだ。',
        'でも…… だいじな {ピック|ぴっく}を、 おおきな からすに とられちゃって。',
        '{ピック|ぴっく}が ないと、 {ギター|ぎたー}が うまく ひけないんだ。',
        'からすは {森|もり}の おくへ とんで いったよ。',
        '@は 「いっしょに さがそう!」と いった。',
        'えっ、 ほんとう? ありがとう!\nじゃあ、 いっしょに いこう!',
        '♪{ハモ|はも}が なかまに なった!',
      ] }] },
    { kind: 'npc', x: 13, y: 13, pal: 'girl', name: '{ミィ|みぃ}', label: 'はなす', show: 'lostFound', lines: ['おねえちゃんと いっしょ! うれしい!'] },
    // night: true … よるだけ でてくる まもの(あさに なると いなくなる)
    { kind: 'enemy', x: 16, y: 2, party: 'ゾンビねこ', night: true },
    { kind: 'enemy', x: 8, y: 16, party: 'ほねほね', night: true },
    // 第4章 おまつりの じゅんび
    { kind: 'deco', x: 9, y: 7.6, pic: 'chochin', show: 'ch4start', hide: 'ch4', float: true }, { kind: 'deco', x: 18, y: 7.6, pic: 'chochin', show: 'ch4start', hide: 'ch4', float: true }, { kind: 'deco', x: 26, y: 10.9, pic: 'chochin', show: 'ch4start', hide: 'ch4', float: true },
    { kind: 'deco', x: 13.5, y: 12, pic: 'yatai', show: 'ch4start', hide: 'ch4' },
    { kind: 'deco', x: 8.5, y: 18.6, pic: 'flowers', show: 'ch4start', hide: 'ch4' },
    { kind: 'npc', x: 12, y: 15.5, pal: 'hamo', name: '{ハモ|はも}', label: 'はなす', show: 'ch4start', hide: 'prepAll', dir: 'up', event: 'hamoWork' },
    { kind: 'npc', x: 15, y: 15.5, pal: 'melo', name: '{メロ|めろ}', label: 'はなす', show: 'ch4start', hide: 'prepAll', dir: 'up', event: 'meloWork' },
    { kind: 'npc', x: 19, y: 12, pal: 'pasha', name: '{パシャ|ぱしゃ}', label: 'はなす', show: 'ch4start', dir: 'left', event: 'pasha' },
    { kind: 'npc', x: 16, y: 13, pal: 'popo', name: '{ポポ|ぽぽ}ばあちゃん', label: 'はなす', show: 'ch4start', event: 'popo' },
    { kind: 'chest', x: 26, y: 12, label: 'あける', give: 'りんご',
      lines: ['たからばこを あけた!', '♪{赤|あか}い りんごを {手|て}に いれた!'], after: ['もう からっぽだ。'] },
  ],
  // 第4章: あきの むら(もみじ・おちば)と モグの おみせ(ようしょくやさんと はなやさん)
  // あきの すがたは 第4章の あいだだけ(ch4 = 第4章 クリアで もとに もどる)。 おみせは そのまま のこる
  swaps: [{ flag: 'ch4start', not: 'ch4', chars: { T: '!', '.': ';' } }, { flag: 'ch4start', cells: [[2, 14, 'V'], [2, 15, 'V'], [3, 14, 'V'], [3, 15, 'V'], [4, 14, 'V'], [4, 15, 'V'], [5, 14, 'V'], [5, 15, 'V'], [6, 14, 'V'], [6, 15, 'V'], [7, 14, 'V'], [7, 15, 'V'], [2, 16, 'H'], [3, 16, 'W'], [4, 16, 'H'], [5, 16, 'H'], [6, 16, 'W'], [7, 16, 'H'], [2, 17, 'h'], [3, 17, 'h'], [4, 17, 'D'], [5, 17, 'h'], [6, 17, 'h'], [7, 17, 'h'], [2, 18, ','], [3, 18, ','], [6, 18, ','], [7, 18, ',']] }],
  enter: [{ need: 'ch3', once: 'autumnGo', event: 'autumn' }, { need: 'inviteGot', once: 'sneak', event: 'sneak' }],
  // 出入り口: ここに入ると 別のマップへ (to=行き先, at=着く場所, dir=着いたときの向き)
  exits: [
    { x: 5, y: 6, to: 'home', at: [5.5, 7], dir: 'up' },            // 左の家(主人公の いえ)
    { x: 14, y: 6, to: 'house', at: [5.5, 7], dir: 'up' },          // 右の家のドア
    { x: 29, y: 9, h: 2, to: 'forest', at: [1, 9.5], dir: 'right' }, // 右はしの道 → 森
    { x: 26, y: 8, to: 'shop', at: [6.5, 7], dir: 'up' },            // おみせ
    { x: 4, y: 17, to: 'mogu', at: [5.5, 7], dir: 'up', show: 'ch4start' },   // モグの おみせ(第4章)
  ],
};

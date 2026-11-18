// モグの おみせ(12×9マス)。 ようしょくやさん と はなやさん。 第4章の けっこんしきの かいじょう
export default {
  bgm: 'park',
  rows: [
    '############',
    '#wwvwwwwvww#',
    '#CCCC__PPPP#',
    '#__________#',
    '#_OQ___OQ__#',
    '#__________#',
    '#_OQ___OQ__#',
    '#__________#',
    '#####EE#####',
  ],
  objs: [
    { kind: 'npc', x: 9, y: 3, pal: 'shop3', name: 'おみせの ねこ', label: 'はなす', show: 'mogu', lines: ['いらっしゃい! {モグ|もぐ}の おみせの うりばだよ。'], shop: ['はなかんむり', 'ほかほかスープ', 'まんぷくべんとう', 'なおりぐさ', 'テント', 'ワープのはね', 'もみじのけん', 'おまつりのはっぴ'] },
    { kind: 'npc', x: 3, y: 3, pal: 'mogu', name: '{モグ|もぐ}', label: 'はなす', event: 'mogu' },
    { kind: 'look', x: 8.5, y: 2, label: 'しらべる', lines: ['いろとりどりの おはなが ならんでいる。', 'いい におい!'] },
    { kind: 'look', x: 2.5, y: 2, label: 'しらべる', lines: ['ぴかぴかの フライパンと おなべ。'.replace('フライパン', '{フライパン|ふらいぱん}')] },

    // みんなで した かざりつけ(wdE いりぐち・wdT テーブル・wdS かべ)
    { kind: 'deco', x: 4.4, y: 7.3, pic: 'leafpile', show: 'wdE:leaf', float: true }, { kind: 'deco', x: 7.6, y: 7.3, pic: 'leafpile', show: 'wdE:leaf', float: true },
    { kind: 'deco', x: 2.5, y: 4, pic: 'leafpile', show: 'wdT:leaf', float: true }, { kind: 'deco', x: 7.5, y: 6, pic: 'leafpile', show: 'wdT:leaf', float: true },
    { kind: 'deco', x: 6, y: 1.6, pic: 'leafpile', show: 'wdS:leaf', float: true },
    { kind: 'deco', x: 4.4, y: 7.3, pic: 'starOn', show: 'wdE:star', float: true }, { kind: 'deco', x: 7.6, y: 7.3, pic: 'starOn', show: 'wdE:star', float: true },
    { kind: 'deco', x: 2.5, y: 4, pic: 'starOn', show: 'wdT:star', float: true }, { kind: 'deco', x: 7.5, y: 6, pic: 'starOn', show: 'wdT:star', float: true },
    { kind: 'deco', x: 6, y: 1.6, pic: 'starOn', show: 'wdS:star', float: true },
    { kind: 'deco', x: 4.4, y: 7.3, pic: 'flowers', show: 'wdE:flower', float: true }, { kind: 'deco', x: 7.6, y: 7.3, pic: 'flowers', show: 'wdE:flower', float: true },
    { kind: 'deco', x: 2.5, y: 4, pic: 'flowers', show: 'wdT:flower', float: true }, { kind: 'deco', x: 7.5, y: 6, pic: 'flowers', show: 'wdT:flower', float: true },
    { kind: 'deco', x: 6, y: 1.6, pic: 'flowers', show: 'wdS:flower', float: true },
  ],
  enter: [{ need: 'ch4together', once: 'wedDone', event: 'wedding' }],   // ハモと メロを つれて くると けっこんしき
  exits: [
    { x: 5, y: 8, w: 2, to: 'village', at: [4, 18.2], dir: 'down' },
  ],
};

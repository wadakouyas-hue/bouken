// みはらしの おか(20×16マス)。 てっぺんの まえに たかい だんさ(L)。 のぼった さきで とおくを ながめる
export default {
  outside: true,
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'TTTTTT,......,TTTTTT',
    'TTTTT,...==...,TTTTT',
    'TTTTTLLLLLLLLLLTTTTT',
    'TTTT......==....TTTT',
    'TTT....,...==....TTT',
    'TTT..T.....==...,TTT',
    'TT.......====....TTT',
    'TT..,...==.......TTT',
    'TTT.....==...T...TTT',
    'TTT..T..==.....,TTTT',
    'TTTT....====....TTTT',
    'TTTTT.....==...TTTTT',
    'TTTTTT....==..TTTTTT',
    'TTTTTTTT..==TTTTTTTT',
    'TTTTTTTTTT==TTTTTTTT',
  ],
  objs: [
    // たかい だんさ: ハモが かたぐるま してくれる(main.js の EVENTS.kataguruma)
    { kind: 'look', x: 9.5, y: 4, label: 'のぼる', event: 'kataguruma', hide: 'kata' },
    // てっぺん: とおくを ながめる(main.js の EVENTS.view)
    { kind: 'look', x: 9.5, y: 1, label: 'ながめる', event: 'view', hide: 'ch1' },
    { kind: 'sign', x: 12, y: 1, name: 'かんばん', label: 'よむ', lines: ['みはらしの おか', 'この さきの みちは、 まだ できていない みたい。'] },
  ],
  exits: [
    { x: 10, y: 15, w: 2, to: 'deep', at: [11.5, 1], dir: 'down' },     // した → 森の おく
    { x: 9, y: 0, w: 2, to: 'deep', at: [11.5, 1], need: 'ch2', block: ['この さきは まだ いけないよ。', '(つづく)'] },
  ],
};

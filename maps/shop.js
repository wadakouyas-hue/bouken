// 村の おみせ(14×9マス)。 カウンターの むこうに 3人
// shop: うる物(data/items.csv の id)  bank: ぎんこう
export default {
  rows: [
    '##############',
    '#wwvwwwwwwvww#',
    '#S__________S#',
    '#CCCCCCCCCCCC#',
    '#____________#',
    '#__rrrrrrrr__#',
    '#____________#',
    '#____________#',
    '######EE######',
  ],
  objs: [
    { kind: 'npc', x: 2.5, y: 2.4, pal: 'shop1', name: 'どうぐや', label: 'はなす',
      lines: ['いらっしゃい! どうぐの おみせだよ。'], shop: ['かいふくやく', 'りんご'] },
    { kind: 'npc', x: 6.5, y: 2.4, pal: 'shop2', name: 'ぶきと ぼうぐの みせ', label: 'はなす',
      lines: ['ぶきと ぼうぐなら まかせて!'], shop: ['きのぼう', 'どうのけん', 'ぬののふく', 'かわのよろい', 'てつのよろい'] },
    { kind: 'npc', x: 10.5, y: 2.4, pal: 'bank', name: 'ぎんこう', label: 'はなす',
      lines: ['ここは ぎんこう。 おかねを あずかるよ。', 'あずけた おかねは、 たたかいに まけても へらないよ。'], bank: true },
  ],
  exits: [
    { x: 6, y: 8, w: 2, to: 'village', at: [26, 9.5], dir: 'down' },
  ],
};

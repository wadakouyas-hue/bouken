// やまの こや(10×8マス)。 だれも すんでいない ちいさな こや。 かぜを ひいた リズが ベッドで ねる
export default {
  bgm: 'quiet',
  town: { name: 'やまの こや', at: [4.5, 5] },
  rows: [
    '##########',
    '#wwv88vww#',
    '#Z_______#',
    '#z_______#',
    '#________#',
    '#__OQ___K#',
    '#________#',
    '####EE####',
  ],
  objs: [
    { kind: 'sick', x: 1, y: 2, label: 'ようすを みる', event: 'sickBed', show: 'sick', hide: 'genki' },
    { kind: 'look', x: 1, y: 2, label: 'しらべる', lines: ['ちいさな ベッドだ。'.replace('ベッド', '{ベッド|べっど}')] },
    { kind: 'look', x: 4.5, y: 1.4, label: 'しらべる', lines: ['あったかい だんろだ。', 'ぱちぱち ひが もえている。'] },
    { kind: 'look', x: 8, y: 5, label: 'しらべる', give: 'かいふくやく', lines: ['{タンス|たんす}を あけてみた。', '♪かいふくやくを {手|て}に いれた!'], after: ['もう なにも はいっていない。'] },
  ],
  exits: [
    { x: 4, y: 7, w: 2, to: 'snow1', at: [5, 11.2], dir: 'down' },
  ],
};

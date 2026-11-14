// なまえを いれる 画面(ゲームの さいしょ)
const $ = id => document.getElementById(id);
const MAX = 6;
// 1行に 2つの 行(5もじ ずつ)。 空白は 何もない ボタン
const PAGES = [
  ['あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの', 'はひふへほ', 'まみむめも', 'や ゆ よ', 'らりるれろ', 'わをんー '],
  ['がぎぐげご', 'ざじずぜぞ', 'だぢづでど', 'ばびぶべぼ', 'ぱぴぷぺぽ', 'ぁぃぅぇぉ', 'ゃゅょっ ', '     ', '     ', '     '],
];

export const nameEntry = { open: false };
let state = null;

export function askName() {
  return new Promise(resolve => {
    state = { name: '', page: 0, resolve };
    nameEntry.open = true;
    $('names').style.display = 'flex';
    render();
  });
}
function render() {
  const s = state;
  const cells = [...s.name].map(c => `<span>${c}</span>`).join('') + Array(MAX - s.name.length).fill('<span class="empty"></span>').join('');
  const keys = PAGES[s.page].join('');
  $('names').innerHTML =
    `<div class="nhead">なまえを いれてね</div>` +
    `<div class="nbox">${cells}</div>` +
    `<div class="ngrid">${[...keys].map(c => c === ' ' ? '<i></i>' : `<button data-k="${c}">${c}</button>`).join('')}</div>` +
    `<div class="nfoot"><button data-k="#page">${s.page ? 'あいうえお' : 'がぎぐ ぱぴぷ'}</button><button data-k="#del">けす</button>` +
    `<button data-k="#ok" class="ok${s.name ? '' : ' off'}">これで いい</button></div>`;
}
// タップされた ボタンの もじ(または #page #del #ok)
export function nameKey(k) {
  const s = state; if (!s) return;
  if (k === '#page') s.page = 1 - s.page;
  else if (k === '#del') s.name = s.name.slice(0, -1);
  else if (k === '#ok') {
    if (!s.name) return;
    nameEntry.open = false; $('names').style.display = 'none'; state = null; s.resolve(s.name); return;
  } else if (s.name.length < MAX) s.name += k;
  render();
}

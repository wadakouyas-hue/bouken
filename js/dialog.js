// 会話(ふりがな付き・1文字ずつ表示)
// 書き方: {漢字|かんじ}  {カタカナ|かたかな}  改行は \n
const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function parse(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '{') { const j = s.indexOf('}', i); const [b, r] = s.slice(i + 1, j).split('|'); out.push({ b, r, n: b.length }); i = j + 1; }
    else if (c === '\n') { out.push({ br: true, n: 0 }); i++; }
    else { out.push({ t: c === ' ' ? '　' : c, n: 1 }); i++; }
  }
  return out;
}
const tokHTML = tk => tk.br ? '<br>' : tk.r ? `<ruby>${esc(tk.b)}<rt>${esc(tk.r)}</rt></ruby>` : esc(tk.t);
// 文章を まとめて ふりがな付きのHTMLにする(名前・ヒントなど)
export const rubyHTML = s => parse(s).map(tokHTML).join('');

export const dlg = { open: false, lines: [], i: 0, tokens: [], shown: 0, timer: 0, onEnd: null };

function renderText() {
  let h = '';
  dlg.tokens.forEach((tk, i) => {
    const inner = tokHTML(tk);
    h += (i < dlg.shown || tk.br) ? inner : `<span class="hid">${inner}</span>`;   // まだ出ない文字も場所だけ確保(行がガタつかない)
  });
  $('dtext').innerHTML = h;
  $('dnext').style.display = dlg.shown >= dlg.tokens.length ? 'block' : 'none';
}
function setLine() { dlg.tokens = parse(dlg.lines[dlg.i]); dlg.shown = 0; dlg.timer = 0; renderText(); }

export function openDialog(name, lines, onEnd) {
  dlg.open = true; dlg.lines = lines; dlg.i = 0; dlg.onEnd = onEnd || null;
  $('dname').innerHTML = rubyHTML(name || ''); $('dlg').style.display = 'block'; $('act').style.display = 'none';
  setLine();
}
export function advance() {
  if (dlg.shown < dlg.tokens.length) { dlg.shown = dlg.tokens.length; renderText(); return; } // 途中なら全部出す
  dlg.i++;
  if (dlg.i < dlg.lines.length) { setLine(); return; }
  dlg.open = false; $('dlg').style.display = 'none';
  const f = dlg.onEnd; dlg.onEnd = null; if (f) f();
}
export function updateDialog(dt) {
  if (dlg.shown >= dlg.tokens.length) return;
  dlg.timer += dt * 1000; let changed = false;
  while (dlg.shown < dlg.tokens.length) {
    const cost = 60 * Math.max(1, dlg.tokens[dlg.shown].n);
    if (dlg.timer < cost) break;
    dlg.timer -= cost; dlg.shown++; changed = true;
  }
  if (changed) renderText();
}

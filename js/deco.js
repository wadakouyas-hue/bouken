// もようがえ: かぐを おく・うごかす・しまう(マスを タップして そうさする)
import { byId } from './data.js';
import { T } from './tiles.js';
import { room, canPlace, furnAt, cellsOf } from './furniture.js';
import { rubyHTML } from './dialog.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
const R = s => rubyHTML(String(s));
export const deco = { open: false };
let D = null;   // { m: マップ, list: おいてある かぐ, blocked, onChange, sel, pick: {x, y}, msg }
const HELP = 'かぐを タップすると うごかせるよ。 あいている ところを タップすると かぐを おけるよ。';

export function openDeco(m, list, blocked, onChange) {
  D = { m, list, blocked, onChange, sel: null, pick: null, msg: HELP };
  deco.open = true; $('deco').style.display = 'block'; sfx('ok'); render();
}
function close() { deco.open = false; $('deco').style.display = 'none'; D = null; }
const changed = () => { if (D.onChange) D.onChange(); };
const nameOf = id => byId('furniture', id)?.name || id;

// マップの マス(tx, ty)が タップされた
export function decoTile(tx, ty) {
  if (!D || D.pick) return;
  const f = furnAt(D.list, tx, ty);
  if (D.sel) {
    if (f === D.sel) { D.sel = null; D.msg = HELP; sfx('next'); }
    else if (canPlace(D.m, D.list, D.sel.id, tx, ty, D.sel, D.blocked)) {
      D.sel.x = tx; D.sel.y = ty; sfx('get'); D.msg = `${nameOf(D.sel.id)}を うごかしたよ。`; D.sel = null; changed();
    } else if (f) { D.sel = f; sfx('next'); D.msg = selMsg(f); }
    else { sfx('miss'); D.msg = 'そこには おけないよ。 ほかの ところを タップしてね。'; }
  } else if (f) { D.sel = f; sfx('next'); D.msg = selMsg(f); }
  else if (!room.stash.length) { sfx('miss'); D.msg = 'しまってある かぐが ないよ。 おみせの 「かぐや」で かえるよ。'; }
  else if (D.m.rows[ty]?.[tx] !== '_' || (D.m.noFurn || []).some(([a, b]) => a === tx && b === ty)) { sfx('miss'); D.msg = 'そこには おけないよ。'; }
  else { D.pick = { x: tx, y: ty }; D.pg = 0; sfx('next'); }
  render();
}
const selMsg = f => `${nameOf(f.id)}を えらんだよ。 おきたい ところを タップしてね。`;

// ボタン(data-d)
export function decoTap(k) {
  if (!D) return;
  if (k === '#done') { sfx('next'); close(); return; }
  if (k === 'put' && D.sel) {               // しまう
    D.list.splice(D.list.indexOf(D.sel), 1); room.stash.push(D.sel.id); sfx('get');
    D.msg = `${nameOf(D.sel.id)}を しまったよ。`; D.sel = null; changed();
  } else if (k === 'cancel') { D.sel = null; D.msg = HELP; sfx('next'); }
  else if (k.startsWith('pg:')) { D.pg = (D.pg || 0) + +k.slice(3); sfx('next'); }
  else if (k === 'pickclose') { D.pick = null; sfx('next'); }
  else if (k.startsWith('pick:') && D.pick) {
    const id = k.slice(5), { x, y } = D.pick;
    D.pick = null;
    if (!room.stash.includes(id)) { render(); return; }
    if (canPlace(D.m, D.list, id, x, y, null, D.blocked)) {
      room.stash.splice(room.stash.indexOf(id), 1); D.list.push({ id, x, y }); sfx('get');
      D.msg = `${nameOf(id)}を おいたよ。`; changed();
    } else { sfx('miss'); D.msg = `${nameOf(id)}は そこには はいらないよ。 ひろい ところを タップしてね。`; }
  }
  render();
}

// ながい リストは ページに わける(iPad で スクロール できなかったので ボタンで きりかえ)
const PER = 6;
function paged(arr, page, mk) {
  const pages = Math.max(1, Math.ceil(arr.length / PER)), p = Math.max(0, Math.min(pages - 1, page));
  const nav = pages > 1 ? `<div class="pnav">${mk('pg:-1', '◀ まえ', p === 0 ? 'dim' : '')}<span>${p + 1} / ${pages}</span>${mk('pg:1', 'つぎ ▶', p === pages - 1 ? 'dim' : '')}</div>` : '';
  return { items: arr.slice(p * PER, p * PER + PER), nav, page: p };
}
function render() {
  const btn = (k, html, cls = '') => `<button data-d="${k}" class="${cls}">${html}</button>`;
  let html = `<div class="dside"><div class="dtitle">もようがえ</div><div class="dmsg">${R(D.msg)}</div>` +
    (D.sel ? btn('put', 'しまう') + btn('cancel', 'やめる') : '') + btn('#done', 'おわる', 'go') + '</div>';
  if (D.pick) {
    const P = paged([...new Set(room.stash)], D.pg || 0, btn); D.pg = P.page;
    html += `<div class="dpick"><div class="dtitle">なにを おく?</div><div class="dlist">` +
      P.items.map(id => btn('pick:' + id, `${R(nameOf(id))}<small>×${room.stash.filter(s => s === id).length}</small>`)).join('') +
      `</div>${P.nav}${btn('pickclose', 'やめる')}</div>`;
  }
  $('deco').innerHTML = html;
}

// マップの うえに マス目と えらんだ かぐを かく
export function drawDeco(g, cam, tm) {
  if (!D) return;
  const m = D.m;
  g.fillStyle = 'rgba(255,255,255,.18)';
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.rows[y][x] === '_') {
    const sx = x * T - cam.x, sy = y * T - cam.y;
    g.fillRect(sx, sy, T, 1); g.fillRect(sx, sy, 1, T);
  }
  const box = (cells, col) => { g.fillStyle = col; for (const [x, y] of cells) { const sx = x * T - cam.x, sy = y * T - cam.y; g.fillRect(sx, sy, T, 2); g.fillRect(sx, sy + T - 2, T, 2); g.fillRect(sx, sy, 2, T); g.fillRect(sx + T - 2, sy, 2, T); } };
  if (D.sel && Math.floor(tm * 4) % 2 === 0) box(cellsOf(D.sel), '#ffd23f');
  if (D.pick) box([[D.pick.x, D.pick.y]], '#5ab0ff');
}

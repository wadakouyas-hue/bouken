// キーボードで ボタンを えらぶ(Macで ためす とき用。 ←↑→↓ で うごかして Enter で きめる)
// root: メニューなどの わく、 attr: ボタンの しるし(data-m など)。 えらんでいる ボタンに .kfocus が つく
const st = {};   // わくごとに いま えらんでいる ボタン { key, x, y }
const btns = (root, attr) => [...root.querySelectorAll(`[${attr}]`)];
const ctr = b => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
function current(root, attr) {
  const s = st[root.id] || (st[root.id] = {}), bs = btns(root, attr);
  if (!bs.length) return null;
  let b = s.key != null && bs.find(x => x.getAttribute(attr) === s.key);
  if (!b && s.x != null) {   // まえの ボタンが きえたら いちばん ちかい ボタン
    let best = Infinity;
    for (const x of bs) { const c = ctr(x), d = (c.x - s.x) ** 2 + (c.y - s.y) ** 2; if (d < best) { best = d; b = x; } }
  }
  return b || bs.find(x => x.classList.contains('on')) || bs[0];
}
function keep(root, attr, b) { const c = ctr(b); st[root.id] = { key: b.getAttribute(attr), x: c.x, y: c.y }; }
export function navReset(root) { delete st[root.id]; }
export function navMark(root, attr) {
  root.querySelectorAll('.kfocus').forEach(x => x.classList.remove('kfocus'));
  const b = current(root, attr); if (b) { b.classList.add('kfocus'); keep(root, attr, b); }
}
export function navMove(root, attr, dx, dy) {
  const b = current(root, attr); if (!b) return;
  const c = ctr(b); let best = Infinity, to = null;
  for (const x of btns(root, attr)) {
    if (x === b) continue;
    const p = ctr(x), along = (p.x - c.x) * dx + (p.y - c.y) * dy, side = Math.abs((p.x - c.x) * dy) + Math.abs((p.y - c.y) * dx);
    if (along <= 2) continue;                    // その むきに ない
    const score = along + side * 2;
    if (score < best) { best = score; to = x; }
  }
  if (to) keep(root, attr, to);
  navMark(root, attr);
}
export const navKey = (root, attr) => { const b = current(root, attr); return b ? b.getAttribute(attr) : null; };

// セーブ(localStorage)と、保護者用のセーブコード
const KEY = 'bouken-save';
const PREFIX = 'BK1-';

export function readSave() {
  try { const s = localStorage.getItem(KEY); return s ? check(JSON.parse(s)) : null; } catch (_) { return null; }
}
export function writeSave(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (_) { return false; }
}
export function clearSave() {
  try { localStorage.removeItem(KEY); } catch (_) {}
}

// 中身が正しい形かを確かめる(おかしければ null)
function check(d) {
  if (!d || typeof d !== 'object' || d.v !== 1) return null;
  if (typeof d.map !== 'string' || !Number.isFinite(d.x) || !Number.isFinite(d.y)) return null;
  if (!['up', 'down', 'left', 'right'].includes(d.dir)) d.dir = 'down';
  const strs = a => Array.isArray(a) ? a.filter(s => typeof s === 'string').slice(0, 500) : [];
  d.clock = Number.isFinite(d.clock) && d.clock >= 0 ? d.clock : 0;
  d.bag = strs(d.bag); d.done = strs(d.done); d.talked = !!d.talked;
  // かぐ: placed = { マップ名: [{ id, x, y }] }、 stash = しまってある かぐ
  const r = d.room && typeof d.room === 'object' ? d.room : null, placed = {};
  if (r && r.placed && typeof r.placed === 'object') for (const [k, list] of Object.entries(r.placed))
    if (Array.isArray(list)) placed[k] = list.filter(f => f && typeof f.id === 'string' && Number.isInteger(f.x) && Number.isInteger(f.y)).slice(0, 200).map(f => ({ id: f.id, x: f.x, y: f.y }));
  const paint = r && Array.isArray(r.paint) ? r.paint.filter(c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)).slice(0, 20) : null;
  d.room = r ? { placed, stash: strs(r.stash), paint: paint && paint.length ? paint : null } : null;
  const h = d.hero, num = (v, min) => Number.isFinite(v) && v >= min;
  d.hero = h && typeof h.name === 'string' && h.name && num(h.lv, 1) && num(h.exp, 0) && num(h.hp, 0) && num(h.mp, 0)
    ? { name: h.name.slice(0, 8), lv: Math.floor(h.lv), exp: h.exp, hp: h.hp, mp: h.mp,
        hamo: h.hamo && num(h.hamo.hp, 0) && num(h.hamo.mp, 0) ? { hp: h.hamo.hp, mp: h.hamo.mp } : null,
        melo: h.melo && num(h.melo.hp, 0) && num(h.melo.mp, 0) ? { hp: h.melo.hp, mp: h.melo.mp } : null,
        gold: num(h.gold, 0) ? Math.floor(h.gold) : null, bank: num(h.bank, 0) ? Math.floor(h.bank) : 0,
        equip: h.equip && typeof h.equip === 'object' ? { ぶき: typeof h.equip.ぶき === 'string' ? h.equip.ぶき : null, よろい: typeof h.equip.よろい === 'string' ? h.equip.よろい : null } : null } : null;
  return d;
}

// --- セーブコード(LINEやメモに貼って取っておける文字列) ---
function sum(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 65521; return h.toString(16).padStart(4, '0'); }
function toB64(str) { const b = new TextEncoder().encode(str); let s = ''; b.forEach(c => { s += String.fromCharCode(c); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function fromB64(b64) { const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/')); return new TextDecoder().decode(Uint8Array.from(s, c => c.charCodeAt(0))); }

export function toCode(data) { const body = toB64(JSON.stringify(data)); return PREFIX + body + '.' + sum(body); }
// 戻り値: { data } か { error: '理由' }
export function fromCode(text) {
  const c = String(text || '').replace(/\s+/g, '');
  if (!c) return { error: 'セーブコードが入っていません。' };
  if (!c.startsWith(PREFIX)) return { error: 'セーブコードではないようです。「BK1-」から始まる文字をすべて貼りつけてください。' };
  const [body, s] = c.slice(PREFIX.length).split('.');
  if (!body || sum(body) !== s) return { error: 'セーブコードの一部が欠けているか、まちがっています。もう一度すべてコピーして貼りつけてください。' };
  try { const d = check(JSON.parse(fromB64(body))); if (d) return { data: d }; } catch (_) {}
  return { error: 'セーブコードを読み取れませんでした。' };
}

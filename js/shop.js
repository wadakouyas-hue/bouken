// おみせ(かう・うる)と ぎんこう(あずける・ひきだす)と さぎょうだい(つくる)
import { DATA, byId } from './data.js';
import { hero, bag, heroStats, bagCount, bagRemove, equipped, equipOf, wearCount, members } from './hero.js';
import { room } from './furniture.js';
import { rubyHTML } from './dialog.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
const R = s => rubyHTML(String(s).replace(/@/g, hero.name));
const YEN = n => `${n}{円|えん}`;
const ONLY = { スネア: 'hero', ギター: 'hamo', マイク: 'melo' }, ONLY_NAME = { hero: '@', hamo: '{ハモ|はも}', melo: '{メロ|めろ}' };   // せんようの ぶき
export const shop = { open: false };
let S = null;   // { name, list(売る物の id), bank, craft, furn, mode, sel, ask, msg, onChange }

// id → どうぐ か かぐ
const thing = id => byId('items', id) || byId('furniture', id);
const isFurn = id => !byId('items', id) && !!byId('furniture', id);
const stashCount = id => room.stash.filter(s => s === id).length;
const have = id => isFurn(id) ? stashCount(id) : bagCount(id);
const FURN_NOTE = 'おうちの 「もようがえ」で おけるよ。';

export function openShop(npc, onChange) {
  const list = npc.shop || [];
  S = { name: npc.name, list, bank: !!npc.bank, craft: !!npc.craft, furn: list.some(isFurn), mode: npc.craft ? 'make' : 'buy', sel: null, ask: null, msg: '', onChange };
  shop.open = true; $('shop').style.display = 'flex'; render();
}
function close() { shop.open = false; $('shop').style.display = 'none'; S = null; }
const changed = () => { if (S.onChange) S.onChange(); };
const sellPrice = it => Math.floor((it.price || 0) / 2);

export function shopTap(k) {
  if (!S) return;
  sfx('next');
  if (k === '#close') { close(); return; }
  S.msg = '';
  if (k === 'mode:buy' || k === 'mode:sell') { S.mode = k.slice(5); S.sel = null; S.ask = null; }
  else if (k.startsWith('sel:')) { S.sel = k.slice(4); S.ask = null; }
  else if (k === 'buy') buy();
  else if (k === 'sell') sell();
  else if (k === 'make') make();
  else if (k.startsWith('wear')) { const it = byId('items', S.ask); if (!it) { render(); return; } const who = members().find(m => m.key === (k.slice(5) || 'hero')) || members()[0];
    const only = ONLY[it.look]; if (only && who.key !== only) { S.msg = `${it.name}は ${ONLY_NAME[only]} せんようだよ。`; render(); return; }
    equipOf(who.key)[it.kind] = it.id; sfx('get'); S.msg = `${who.name}は ${it.name}を そうびした!`; S.ask = null; changed(); }
  else if (k === 'later') { S.ask = null; S.msg = '{メニュー|めにゅー}の 「そうび」で いつでも きがえられるよ。'; }
  else if (k.startsWith('dep:')) bank(k.slice(4), +1);
  else if (k.startsWith('wd:')) bank(k.slice(3), -1);
  render();
}

function buy() {
  const it = thing(S.sel); if (!it) return;
  if (hero.gold < it.price) { S.msg = 'おかねが たりないよ。'; return; }
  hero.gold -= it.price; sfx('get');
  if (isFurn(it.id)) { room.stash.push(it.id); S.msg = `${it.name}を かった! ${FURN_NOTE}`; }
  else {
    bag.push(it.id); S.msg = `${it.name}を かった! まいど ありがとう!`;
    if (it.kind === 'ぶき' || it.kind === 'よろい' || it.kind === 'かざり') S.ask = it.id;   // いま そうびする?
  }
  changed();
}
function sell() {
  const it = thing(S.sel); if (!it || !have(it.id)) return;
  if (it.kind === 'だいじ' || !it.price) { S.msg = 'それは うれないよ。'; return; }
  if (!isFurn(it.id) && bagCount(it.id) <= wearCount(it.id)) { S.msg = 'そうびしている ものは うれないよ。'; return; }
  if (isFurn(it.id)) room.stash.splice(room.stash.indexOf(it.id), 1); else bagRemove(it.id);
  hero.gold += sellPrice(it); sfx('get');
  S.msg = `${it.name}を ${YEN(sellPrice(it))}で うった!`;
  if (!have(it.id)) S.sel = null;
  changed();
}
function bank(amount, dir) {
  const own = dir > 0 ? hero.gold : hero.bank;
  const n = amount === 'all' ? own : Math.min(+amount, own);
  if (n <= 0) { S.msg = dir > 0 ? 'あずける おかねが ないよ。' : 'あずけている おかねが ないよ。'; return; }
  hero.gold -= n * dir; hero.bank += n * dir; sfx('get');
  S.msg = dir > 0 ? `${YEN(n)} あずけたよ。` : `${YEN(n)} ひきだしたよ。`;
  changed();
}
// さぎょうだい: ざいりょうを つかって つくる
const recipe = id => DATA.recipes.find(r => r.id === id);
const canMake = r => r.mats.every(m => bagCount(m.id) >= m.n);
function make() {
  const r = recipe(S.sel), it = r && thing(r.id); if (!it) return;
  if (!canMake(r)) { S.msg = 'ざいりょうが たりないよ。 もりで あつめよう!'; return; }
  for (const m of r.mats) for (let i = 0; i < m.n; i++) bagRemove(m.id);
  sfx('get');
  if (isFurn(r.id)) { room.stash.push(r.id); S.msg = `${it.name}が できた! ${FURN_NOTE}`; }
  else { bag.push(r.id); S.msg = `${it.name}が できた!`; }
  changed();
}

// ===== 表示 =====
const btn = (k, html, cls = '') => `<button data-s="${k}" class="${cls}">${html}</button>`;
function render() {
  const head = `<div class="shead"><b>${R(S.name)}</b>${S.craft ? '' : `<span class="sgold">おかね ${R(YEN(hero.gold))}</span>`}</div>`;
  let body;
  if (S.bank) {
    const amounts = [['10', '10'], ['100', '100'], ['1000', '1000'], ['all', 'ぜんぶ']];
    body = `<div class="sbank"><div>もっている おかね<b>${R(YEN(hero.gold))}</b></div><div>あずけている おかね<b>${R(YEN(hero.bank))}</b></div></div>` +
      `<div class="srow"><span>あずける</span>${amounts.map(([k, l]) => btn('dep:' + k, l)).join('')}</div>` +
      `<div class="srow"><span>ひきだす</span>${amounts.map(([k, l]) => btn('wd:' + k, l)).join('')}</div>`;
  } else if (S.craft) {
    const list = DATA.recipes.map(r => btn('sel:' + r.id, `${R(thing(r.id).name)}<small>${canMake(r) ? 'つくれる!' : ''}</small>`, (S.sel === r.id ? 'on ' : '') + (canMake(r) ? '' : 'dim'))).join('')
      || '<div class="sempty">まだ つくりかたを しらないよ</div>';
    body = `<div class="slist">${list}</div>` + craftDetail();
  } else {
    const tabs = `<div class="stabs">${btn('mode:buy', 'かう', S.mode === 'buy' ? 'on' : '')}${btn('mode:sell', 'うる', S.mode === 'sell' ? 'on' : '')}</div>`;
    const owned = S.furn ? [...new Set(room.stash)] : [...new Set(bag)];
    const ids = S.mode === 'buy' ? S.list.filter(thing) : owned.filter(id => { const it = thing(id); return it && it.kind !== 'だいじ' && it.price; });
    const list = ids.map(id => {
      const it = thing(id), price = S.mode === 'buy' ? it.price : sellPrice(it);
      const tag = S.mode === 'sell' ? `×${have(id)}` : '';
      return btn('sel:' + id, `${R(it.name)}<small>${tag} ${R(YEN(price))}</small>`, S.sel === id ? 'on' : '');
    }).join('') || `<div class="sempty">${S.mode === 'buy' ? 'うりきれ' : S.furn ? 'しまってある かぐが ないよ' : 'うれる ものが ないよ'}</div>`;
    body = tabs + `<div class="slist">${list}</div>` + detail();
  }
  $('shop').innerHTML = head + body + `<div class="sfoot"><div class="smsg">${R(S.msg)}</div>${btn('#close', 'やめる', 'close')}</div>`;
}
function detail() {
  if (S.ask) {
    const it = byId('items', S.ask);
    const ms = members();
    return `<div class="sdetail">${ms.length > 1 ? 'だれが そうびする?' : `いま ${R(it.name)}を そうびする?`}${ms.length > 1 ? ms.map(m => btn('wear:' + m.key, R(m.name), 'go')).join('') : btn('wear', 'そうびする', 'go')}${btn('later', 'あとで')}</div>`;
  }
  const it = thing(S.sel);
  if (!it) return `<div class="sdetail shint">${S.mode === 'buy' ? 'ほしい ものを えらんでね' : 'うる ものを えらんでね'}</div>`;
  let info = R(it.desc || it.name);
  if (it.kind === 'ぶき' || it.kind === 'よろい') {
    const st = heroStats(), cur = equipped(it.kind), key = it.kind === 'ぶき' ? 'こうげき' : 'ぼうぎょ';
    const now = it.kind === 'ぶき' ? st.atk : st.def, after = now - (cur?.val || 0) + it.val;
    info += `<small>${key} ${now} → ${after}${after > now ? ' ▲' : after < now ? ' ▼' : ''}</small>`;
  } else if (isFurn(it.id) && S.mode === 'buy' && have(it.id)) info += `<small>もっている ${have(it.id)}こ</small>`;
  return `<div class="sdetail">${info}${S.mode === 'buy' ? btn('buy', 'かう', 'go') : btn('sell', 'うる', 'go')}</div>`;
}
function craftDetail() {
  const r = recipe(S.sel);
  if (!r) return '<div class="sdetail shint">つくりたい ものを えらんでね</div>';
  const mats = r.mats.map(m => { const n = bagCount(m.id), ok = n >= m.n;
    return `<span class="${ok ? 'ok' : 'ng'}">${R(byId('items', m.id).name)} ${n}/${m.n}</span>`; }).join('');
  return `<div class="sdetail"><span class="smats">${mats}</span>${btn('make', 'つくる', 'go')}</div>`;
}

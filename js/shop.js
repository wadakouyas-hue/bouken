// おみせ(かう・うる)と ぎんこう(あずける・ひきだす)
import { byId } from './data.js';
import { hero, bag, heroStats, bagCount, bagRemove, equipped } from './hero.js';
import { rubyHTML } from './dialog.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
const R = s => rubyHTML(String(s));
const YEN = n => `${n}{円|えん}`;
export const shop = { open: false };
let S = null;   // { name, list(売る物の id) or bank:true, mode, sel, ask, msg, onChange }

export function openShop(npc, onChange) {
  S = { name: npc.name, list: npc.shop || [], bank: !!npc.bank, mode: 'buy', sel: null, ask: null, msg: '', onChange };
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
  else if (k === 'wear') { const it = byId('items', S.ask); if (!it) { render(); return; } hero.equip[it.kind] = it.id; sfx('get'); S.msg = `${it.name}を そうびした!`; S.ask = null; changed(); }
  else if (k === 'later') { S.ask = null; S.msg = 'メニューの 「そうび」で いつでも きがえられるよ。'.replace('メニュー', '{メニュー|めにゅー}'); }
  else if (k.startsWith('dep:')) bank(k.slice(4), +1);
  else if (k.startsWith('wd:')) bank(k.slice(3), -1);
  render();
}

function buy() {
  const it = byId('items', S.sel); if (!it) return;
  if (hero.gold < it.price) { S.msg = 'おかねが たりないよ。'; return; }
  hero.gold -= it.price; bag.push(it.id); sfx('get');
  S.msg = `${it.name}を かった! まいど ありがとう!`;
  if (it.kind === 'ぶき' || it.kind === 'よろい') S.ask = it.id;   // いま そうびする?
  changed();
}
function sell() {
  const it = byId('items', S.sel); if (!it || !bag.includes(it.id)) return;
  if (it.kind === 'だいじ' || !it.price) { S.msg = 'それは うれないよ。'; return; }
  if (equipped(it.kind)?.id === it.id && bagCount(it.id) === 1) { S.msg = 'そうびしている ものは うれないよ。'; return; }
  bagRemove(it.id); hero.gold += sellPrice(it); sfx('get');
  S.msg = `${it.name}を ${YEN(sellPrice(it))}で うった!`;
  if (!bag.includes(it.id)) S.sel = null;
  changed();
}
function bank(amount, dir) {
  const have = dir > 0 ? hero.gold : hero.bank;
  const n = amount === 'all' ? have : Math.min(+amount, have);
  if (n <= 0) { S.msg = dir > 0 ? 'あずける おかねが ないよ。' : 'あずけている おかねが ないよ。'; return; }
  hero.gold -= n * dir; hero.bank += n * dir; sfx('get');
  S.msg = dir > 0 ? `${YEN(n)} あずけたよ。` : `${YEN(n)} ひきだしたよ。`;
  changed();
}

// ===== 表示 =====
const btn = (k, html, cls = '') => `<button data-s="${k}" class="${cls}">${html}</button>`;
function render() {
  const head = `<div class="shead"><b>${R(S.name)}</b><span class="sgold">おかね ${R(YEN(hero.gold))}</span></div>`;
  let body;
  if (S.bank) {
    const amounts = [['10', '10'], ['100', '100'], ['1000', '1000'], ['all', 'ぜんぶ']];
    body = `<div class="sbank"><div>もっている おかね<b>${R(YEN(hero.gold))}</b></div><div>あずけている おかね<b>${R(YEN(hero.bank))}</b></div></div>` +
      `<div class="srow"><span>あずける</span>${amounts.map(([k, l]) => btn('dep:' + k, l)).join('')}</div>` +
      `<div class="srow"><span>ひきだす</span>${amounts.map(([k, l]) => btn('wd:' + k, l)).join('')}</div>`;
  } else {
    const tabs = `<div class="stabs">${btn('mode:buy', 'かう', S.mode === 'buy' ? 'on' : '')}${btn('mode:sell', 'うる', S.mode === 'sell' ? 'on' : '')}</div>`;
    const ids = S.mode === 'buy' ? S.list.filter(id => byId('items', id)) : [...new Set(bag)].filter(id => { const it = byId('items', id); return it && it.kind !== 'だいじ' && it.price; });
    const list = ids.map(id => {
      const it = byId('items', id), price = S.mode === 'buy' ? it.price : sellPrice(it);
      const tag = S.mode === 'sell' ? `×${bagCount(id)}` : '';
      return btn('sel:' + id, `${R(it.name)}<small>${tag} ${R(YEN(price))}</small>`, S.sel === id ? 'on' : '');
    }).join('') || `<div class="sempty">${S.mode === 'buy' ? 'うりきれ' : 'うれる ものが ないよ'}</div>`;
    body = tabs + `<div class="slist">${list}</div>` + detail();
  }
  $('shop').innerHTML = head + body + `<div class="sfoot"><div class="smsg">${R(S.msg)}</div>${btn('#close', 'やめる', 'close')}</div>`;
}
function detail() {
  if (S.ask) {
    const it = byId('items', S.ask);
    return `<div class="sdetail">いま ${R(it.name)}を そうびする?${btn('wear', 'そうびする', 'go')}${btn('later', 'あとで')}</div>`;
  }
  const it = byId('items', S.sel);
  if (!it) return `<div class="sdetail shint">${S.mode === 'buy' ? 'ほしい ものを えらんでね' : 'うる ものを えらんでね'}</div>`;
  let info = R(it.desc || it.name);
  if (it.kind === 'ぶき' || it.kind === 'よろい') {
    const st = heroStats(), cur = equipped(it.kind), key = it.kind === 'ぶき' ? 'こうげき' : 'ぼうぎょ';
    const now = it.kind === 'ぶき' ? st.atk : st.def, after = now - (cur?.val || 0) + it.val;
    info += `<small>${key} ${now} → ${after}${after > now ? ' ▲' : after < now ? ' ▼' : ''}</small>`;
  }
  return `<div class="sdetail">${info}${S.mode === 'buy' ? btn('buy', 'かう', 'go') : btn('sell', 'うる', 'go')}</div>`;
}

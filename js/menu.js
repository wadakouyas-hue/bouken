// フィールドの メニュー(どうぐ・じゅもん・そうび・つよさ・なかま・だいじな もの)
import { DATA, byId } from './data.js';
import { hero, bag, heroStats, heal, bagCount, bagRemove, equipped, equipLook, toNext, members } from './hero.js';
import { heroSprite, charSprite } from './sprites.js';
import { rubyHTML } from './dialog.js';
import { sfx } from './audio.js';

const $ = id => document.getElementById(id);
const R = s => rubyHTML(String(s).replace(/@/g, hero.name));
export const menu = { open: false, towns: () => [], warp: null };   // towns: いける まち [{ map, name }]、 warp(map): とぶ(main.js が いれる)
const TABS = ['どうぐ', 'じゅもん', 'そうび', 'つよさ', 'なかま', 'だいじな もの'];
let tab = TABS[0], sel = null, slot = null, msg = '', onChange = null;

export function openMenu(cb) {
  onChange = cb; menu.open = true; tab = TABS[0]; sel = null; slot = null; msg = '';
  $('menu').style.display = 'flex'; render();
}
function close() { menu.open = false; $('menu').style.display = 'none'; }
const changed = () => { if (onChange) onChange(); };

// ボタンが おされた(data-m の 中身)
export function menuTap(k) {
  sfx('next');
  if (k === '#close') { close(); return; }
  if (k.startsWith('tab:')) { tab = k.slice(4); sel = null; slot = null; msg = ''; }
  else if (k.startsWith('sel:')) { sel = k.slice(4); msg = ''; }
  else if (k.startsWith('use')) useItem(k.slice(4));
  else if (k.startsWith('cast')) castSpell(k.slice(5));
  else if (k.startsWith('slot:')) { slot = k.slice(5); msg = ''; }
  else if (k.startsWith('equip:')) equip(k.slice(6));
  else if (k === 'unequip') { const it = equipped(slot); hero.equip[slot] = null; if (it) msg = `${it.name}を はずした。`; slot = null; changed(); }
  else if (k.startsWith('warp:')) { warp(k.slice(5)); return; }
  else if (k === 'back') { slot = null; sel = null; }
  render();
}

const who = key => members().find(m => m.key === key) || members()[0];
function useItem(key) {
  const it = byId('items', sel); if (!it || !bag.includes(it.id)) return;
  const m = who(key);
  if (it.kind !== 'かいふく') { msg = it.kind === 'だいじ' ? 'だいじに もっておこう。' : it.kind === 'ざいりょう' ? 'おうちの さぎょうだいで つかうよ。' : '「そうび」で つかうよ。'; return; }
  if (m.s.hp >= m.st.maxhp) { msg = `${m.name}の HPは まんたんだよ。`; return; }
  bagRemove(it.id); const n = heal(it.val, m); sfx('heal');
  msg = `${it.name}を つかった! ${m.name}の HPが ${n} かいふくした!`;
  if (!bag.includes(it.id)) sel = null;
  changed();
}
function castSpell(key) {
  const s = byId('skills', sel); if (!s) return;
  const m = who(key);
  if (s.effect !== 'かいふく') { msg = 'たたかいの ときに つかうよ。'; return; }
  if (hero.mp < s.mp) { msg = 'MPが たりないよ。'; return; }
  if (m.s.hp >= m.st.maxhp) { msg = `${m.name}の HPは まんたんだよ。`; return; }
  hero.mp -= s.mp; const n = heal(s.pow + Math.floor(heroStats().mag / 2), m); sfx('heal');
  msg = `「${s.name}」! ${m.name}の HPが ${n} かいふくした!`;
  changed();
}
// ワープ: はね(どうぐ) か ひとっとび(じゅもん)で いったことの ある まちへ
function warp(map) {
  const it = tab === 'どうぐ' ? byId('items', sel) : null, s = tab === 'じゅもん' ? byId('skills', sel) : null;
  if (it) { if (!bag.includes(it.id)) return; bagRemove(it.id); }
  else if (s) { if (hero.mp < s.mp) { msg = 'MPが たりないよ。'; render(); return; } hero.mp -= s.mp; }
  else return;
  close(); changed(); if (menu.warp) menu.warp(map);
}
const warpBtns = () => menu.towns().map(t => btn('warp:' + t.map, `${R(t.name)}へ`, 'go')).join('');
function equip(id) {
  const it = byId('items', id); if (!it) return;
  hero.equip[slot] = id; sfx('get');
  msg = `${it.name}を そうびした!`; slot = null; changed();
}

// ===== 表示 =====
const btn = (k, html, cls = '') => `<button data-m="${k}" class="${cls}">${html}</button>`;
function bar(v, m, c) { return `<span class="mbar"><span style="width:${Math.max(0, Math.min(100, v / (m || 1) * 100))}%;background:${c}"></span></span>`; }
function render() {
  const side = TABS.map(t => btn('tab:' + t, t, t === tab ? 'on' : '')).join('') + btn('#close', 'とじる', 'close');
  let body = '';
  if (tab === 'どうぐ') body = itemsView();
  else if (tab === 'じゅもん') body = spellsView();
  else if (tab === 'そうび') body = equipView();
  else if (tab === 'つよさ') body = statsView();
  else if (tab === 'なかま') body = partyView();
  else body = keyItemsView();
  $('menu').innerHTML = `<div class="mside">${side}</div><div class="mbody">${body}<div class="mmsg">${R(msg)}</div></div>`;
  $('menu').querySelectorAll('canvas[data-hero]').forEach(cv => {
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 12, 16);
    g.drawImage(heroSprite('down', 0, equipLook()), 0, 0);
  });
  $('menu').querySelectorAll('canvas[data-pal]').forEach(cv => {
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 12, 16);
    g.drawImage(charSprite(cv.dataset.pal, 'down', 0), 0, 0);
  });
}
// だれに つかう?(みかたが ふたりなら なまえの ボタン)
const forWho = (k, label) => members().length > 1 ? members().map(m => btn(`${k}:${m.key}`, `${R(m.name)}に`, 'go')).join('') : btn(k, label, 'go');
const heroCanvas = cls => `<canvas data-hero width="12" height="16" class="${cls}"></canvas>`;

function itemsView() {
  const ids = [...new Set(bag)].filter(id => byId('items', id)?.kind !== 'だいじ');
  if (!ids.length) return '<div class="mempty">まだ なにも もっていないよ</div>';
  const list = ids.map(id => {
    const it = byId('items', id), eq = Object.values(hero.equip).includes(id) && equipped(it.kind)?.id === id;
    return btn('sel:' + id, `${R(it.name)}<small>${eq ? 'そうびちゅう' : '×' + bagCount(id)}</small>`, sel === id ? 'on' : '');
  }).join('');
  const it = byId('items', sel);
  const detail = it ? `<div class="mdetail">${R(it.desc || it.name)}${it.kind === 'かいふく' ? forWho('use', 'つかう') : it.kind === 'ワープ' ? warpBtns() : ''}</div>` : '<div class="mdetail mhint">どうぐを えらんでね</div>';
  return `<div class="mtop">おかね ${R(`${hero.gold}{円|えん}`)}</div><div class="mlist">${list}</div>${detail}`;
}
function spellsView() {
  const st = heroStats();
  const list = st.skills.map(id => byId('skills', id)).filter(s => s && s.type === 'じゅもん');
  if (!list.length) return '<div class="mempty">まだ じゅもんを おぼえていないよ</div>';
  const s = byId('skills', sel);
  return `<div class="mtop">MP ${hero.mp}/${st.maxmp}</div><div class="mlist">${list.map(x => btn('sel:' + x.id, `${R(x.name)}<small>MP ${x.mp}</small>`, sel === x.id ? 'on' : '')).join('')}</div>` +
    (s ? `<div class="mdetail">${R(s.desc || s.name)}${s.effect === 'ワープ' ? warpBtns() : s.effect === 'かいふく' ? forWho('cast', 'となえる') : `<small>${s.elem !== 'なし' ? s.elem + '  ' : ''}(たたかいで つかう)</small>`}</div>` : '<div class="mdetail mhint">じゅもんを えらんでね</div>');
}
function equipView() {
  const st = heroStats();
  if (slot) {
    const own = [...new Set(bag)].map(id => byId('items', id)).filter(it => it && it.kind === slot);
    const cur = equipped(slot);
    const list = own.map(it => {
      const diff = it.val - (cur?.val || 0);
      return btn('equip:' + it.id, `${R(it.name)}<small>${slot === 'ぶき' ? 'こうげき' : 'ぼうぎょ'} +${it.val}${cur?.id === it.id ? ' そうびちゅう' : diff > 0 ? ' ▲' : diff < 0 ? ' ▼' : ''}</small>`, cur?.id === it.id ? 'on' : '');
    }).join('');
    return `<div class="mtop">${slot}を えらんでね</div><div class="mlist">${list || '<div class="mempty">もっていないよ</div>'}</div>` +
      `<div class="mrow">${cur ? btn('unequip', 'はずす') : ''}${btn('back', 'もどる')}</div>`;
  }
  const w = equipped('ぶき'), a = equipped('よろい');
  return `<div class="mequip">${heroCanvas('mbig')}<div class="mslots">` +
    btn('slot:ぶき', `ぶき<b>${w ? R(w.name) : 'なし'}</b>`) + btn('slot:よろい', `よろい<b>${a ? R(a.name) : 'なし'}</b>`) +
    `<div class="mnums">こうげき ${st.atk}  ぼうぎょ ${st.def}</div></div></div>`;
}
function statsView() {
  const st = heroStats(), nx = toNext();
  const row = (k, v) => `<div class="mstat"><span>${R(k)}</span><b>${v}</b></div>`;
  return `<div class="mequip">${heroCanvas('mbig')}<div class="mstats">` +
    `<div class="mname">${R(hero.name)}  ${R('{レベル|れべる}')} ${hero.lv}</div>` +
    `<div class="mstat"><span>HP</span><b>${hero.hp}/${st.maxhp}</b></div>${bar(hero.hp, st.maxhp, '#6cdc5a')}` +
    `<div class="mstat"><span>MP</span><b>${hero.mp}/${st.maxmp}</b></div>${bar(hero.mp, st.maxmp, '#5ab0ff')}` +
    row('こうげき', st.atk) + row('ぼうぎょ', st.def) + row('まりょく', st.mag) + row('せいしん', st.spr) + row('すばやさ', st.spd) +
    row('けいけんち', hero.exp) + row('おかね', `${hero.gold}{円|えん}`) + row('つぎの {レベル|れべる}まで', nx === null ? '-' : nx) + `</div></div>`;
}
function partyView() {
  const cards = members().map(m => `<div class="mcard">${m.key === 'hero' ? heroCanvas('msmall') : `<canvas data-pal="${m.pal}" width="12" height="16" class="msmall"></canvas>`}<div><div class="mname">${R(m.name)}</div>` +
    `<div>${R('{レベル|れべる}')} ${hero.lv}</div><div>HP ${m.s.hp}/${m.st.maxhp}</div>${bar(m.s.hp, m.st.maxhp, '#6cdc5a')}<div>MP ${m.s.mp}/${m.st.maxmp}</div>${bar(m.s.mp, m.st.maxmp, '#5ab0ff')}</div></div>`).join('');
  return `<div class="mparty">${cards}</div>` + (members().length > 1 ? '' : '<div class="mhint">いまは ひとりで ぼうけん しているよ</div>');
}
function keyItemsView() {
  const ids = [...new Set(bag)].filter(id => byId('items', id)?.kind === 'だいじ');
  if (!ids.length) return '<div class="mempty">まだ なにも ないよ</div>';
  const it = byId('items', sel);
  return `<div class="mlist">${ids.map(id => btn('sel:' + id, R(byId('items', id).name), sel === id ? 'on' : '')).join('')}</div>` +
    (it ? `<div class="mdetail">${R(it.desc || it.name)}</div>` : '');
}

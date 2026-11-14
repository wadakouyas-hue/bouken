// 主人公の つよさ と 持ち物
import { DATA, byId } from './data.js';

export const hero = { name: '', lv: 1, exp: 0, hp: -1, mp: -1, equip: { ぶき: null, よろい: null } };   // hp が -1 なら「まだ はじめていない」
export const bag = [];                                             // 持ち物(items.csv の id)

const rows = () => DATA.party.filter(r => r.id === 'hero').sort((a, b) => a.lv - b.lv);
const FALLBACK = { lv: 1, exp: 0, hp: 30, mp: 6, atk: 8, def: 4, mag: 6, spr: 4, spd: 6, learn: [] };

export function heroStats() {
  const rs = rows(); let row = rs[0] || FALLBACK;
  const skills = [];
  for (const r of rs) if (r.lv <= hero.lv) { row = r; for (const s of r.learn) if (!skills.includes(s)) skills.push(s); }
  return { maxhp: row.hp, maxmp: row.mp, atk: row.atk + (equipped('ぶき')?.val || 0), def: row.def + (equipped('よろい')?.val || 0), mag: row.mag, spr: row.spr, spd: row.spd, skills,
    baseAtk: row.atk, baseDef: row.def };
}
// そうびしている物(持っていなければ なし)
export function equipped(slot) { const id = hero.equip[slot]; return id && bag.includes(id) ? byId('items', id) : null; }
export const equipLook = () => ({ armor: equipped('よろい')?.look || '', weapon: equipped('ぶき')?.look || '' });
// つぎの レベルまでの けいけんち(もう 上がらなければ null)
export function toNext() { const n = rows().find(r => r.lv === hero.lv + 1); return n ? Math.max(0, n.exp - hero.exp) : null; }

export function healFull() { const s = heroStats(); hero.hp = s.maxhp; hero.mp = s.maxmp; }
export function heal(n) { const s = heroStats(), before = hero.hp; hero.hp = Math.min(s.maxhp, hero.hp + n); return hero.hp - before; }

// けいけんちを もらう → 上がったレベルと おぼえたわざ の一覧を返す
export function gainExp(n) {
  hero.exp += n;
  const ups = [];
  for (;;) {
    const next = rows().find(r => r.lv === hero.lv + 1);
    if (!next || hero.exp < next.exp) break;
    const before = heroStats();
    hero.lv = next.lv;
    const after = heroStats();
    hero.hp += after.maxhp - before.maxhp; hero.mp += after.maxmp - before.maxmp;   // ふえた ぶんだけ 回復
    ups.push({ lv: hero.lv, learned: next.learn.filter(s => !before.skills.includes(s)) });
  }
  return ups;
}

export const bagCount = id => bag.filter(b => b === id).length;
export function bagRemove(id) { const i = bag.indexOf(id); if (i >= 0) bag.splice(i, 1); }
// むかしの セーブ(自動そうびの ころ)を ひきつぐ: 持っている いちばん つよい物を そうびする
export function equipBest() {
  for (const slot of ['ぶき', 'よろい']) {
    const list = bag.map(id => byId('items', id)).filter(it => it && it.kind === slot).sort((a, b) => b.val - a.val);
    hero.equip[slot] = list[0]?.id || null;
  }
}

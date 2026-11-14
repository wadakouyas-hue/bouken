// 主人公の つよさ と 持ち物
import { DATA, byId } from './data.js';

export const hero = { name: '', lv: 1, exp: 0, hp: -1, mp: -1 };   // hp が -1 なら「まだ はじめていない」
export const bag = [];                                             // 持ち物(items.csv の id)

const rows = () => DATA.party.filter(r => r.id === 'hero').sort((a, b) => a.lv - b.lv);
const FALLBACK = { lv: 1, exp: 0, hp: 30, mp: 6, atk: 8, def: 4, spd: 6, learn: [] };

export function heroStats() {
  const rs = rows(); let row = rs[0] || FALLBACK;
  const skills = [];
  for (const r of rs) if (r.lv <= hero.lv) { row = r; for (const s of r.learn) if (!skills.includes(s)) skills.push(s); }
  // そうび: 持っている中で いちばん つよい よろい・ぶき を 自動で つける
  const best = kind => Math.max(0, ...bag.map(id => byId('items', id)).filter(it => it && it.kind === kind).map(it => it.val));
  return { maxhp: row.hp, maxmp: row.mp, atk: row.atk + best('ぶき'), def: row.def + best('よろい'), spd: row.spd, skills };
}

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

// 主人公の つよさ と 持ち物
import { DATA, byId } from './data.js';

export const START_GOLD = 200;   // さいしょの おかね
export const hero = { name: '', lv: 1, exp: 0, hp: -1, mp: -1, equip: { ぶき: null, よろい: null }, gold: START_GOLD, bank: 0, hamo: null };   // hamo: なかまの ハモ({hp, mp})。 いなければ null   // gold: もっている おかね  bank: ぎんこうに あずけた おかね   // hp が -1 なら「まだ はじめていない」
export const bag = [];                                             // 持ち物(items.csv の id)

const rows = (id = 'hero') => DATA.party.filter(r => r.id === id).sort((a, b) => a.lv - b.lv);
const FALLBACK = { lv: 1, exp: 0, hp: 30, mp: 6, atk: 8, def: 4, mag: 6, spr: 4, spd: 6, learn: [] };

export function heroStats() {
  const rs = rows(); let row = rs[0] || FALLBACK;
  const skills = [];
  for (const r of rs) if (r.lv <= hero.lv) { row = r; for (const s of r.learn) if (!skills.includes(s)) skills.push(s); }
  return { maxhp: row.hp, maxmp: row.mp, atk: row.atk + (equipped('ぶき')?.val || 0), def: row.def + (equipped('よろい')?.val || 0), mag: row.mag, spr: row.spr, spd: row.spd, skills,
    baseAtk: row.atk, baseDef: row.def };
}
// なかまの つよさ(レベルは 主人公と おなじ。 そうびは なし)
export function allyStats(id) {
  const rs = rows(id); let row = rs[0] || FALLBACK;
  const skills = [];
  for (const r of rs) if (r.lv <= hero.lv) { row = r; for (const s of r.learn) if (!skills.includes(s)) skills.push(s); }
  return { maxhp: row.hp, maxmp: row.mp, atk: row.atk, def: row.def, mag: row.mag, spr: row.spr, spd: row.spd, skills, baseAtk: row.atk, baseDef: row.def };
}
const ALLY_NAME = { hamo: '{ハモ|はも}' };
// パーティ: [{ key, name, pal, s(hp・mp が 入っている もの), st(つよさ) }]
export function members() {
  const list = [{ key: 'hero', name: hero.name, s: hero, st: heroStats() }];
  if (hero.hamo) list.push({ key: 'hamo', name: ALLY_NAME.hamo, pal: 'hamo', s: hero.hamo, st: allyStats('hamo') });
  return list;
}
export function joinAlly(id) { if (id === 'hamo' && !hero.hamo) { const st = allyStats('hamo'); hero.hamo = { hp: st.maxhp, mp: st.maxmp }; } }
// そうびしている物(持っていなければ なし)
export function equipped(slot) { const id = hero.equip[slot]; return id && bag.includes(id) ? byId('items', id) : null; }
export const equipLook = () => ({ armor: equipped('よろい')?.look || '', weapon: equipped('ぶき')?.look || '' });
// つぎの レベルまでの けいけんち(もう 上がらなければ null)
export function toNext() { const n = rows().find(r => r.lv === hero.lv + 1); return n ? Math.max(0, n.exp - hero.exp) : null; }

export function healFull() { for (const m of members()) { m.s.hp = m.st.maxhp; m.s.mp = m.st.maxmp; } }
// who: members() の ひとり(なければ 主人公)
export function heal(n, who) { const m = who || members()[0], before = m.s.hp; m.s.hp = Math.min(m.st.maxhp, m.s.hp + n); return m.s.hp - before; }

// けいけんちを もらう → 上がったレベルと おぼえたわざ の一覧を返す
export function gainExp(n) {
  hero.exp += n;
  const ups = [];
  for (;;) {
    const next = rows().find(r => r.lv === hero.lv + 1);
    if (!next || hero.exp < next.exp) break;
    const before = members().map(m => m.st);
    const beforeSkills = before[0].skills;
    hero.lv = next.lv;
    members().forEach((m, i) => { m.s.hp += m.st.maxhp - before[i].maxhp; m.s.mp += m.st.maxmp - before[i].maxmp; });   // ふえた ぶんだけ 回復
    ups.push({ lv: hero.lv, learned: next.learn.filter(s => !beforeSkills.includes(s)) });
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

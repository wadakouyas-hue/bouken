// 主人公の つよさ と 持ち物
import { DATA, byId } from './data.js';

export const START_GOLD = 200;   // さいしょの おかね
export const hero = { name: '', lv: 1, exp: 0, hp: -1, mp: -1, equip: { ぶき: null, よろい: null }, gold: START_GOLD, bank: 0, hamo: null, melo: null, pasha: null, mogu: null };   // hamo: なかまの ハモ({hp, mp})。 いなければ null   // gold: もっている おかね  bank: ぎんこうに あずけた おかね   // hp が -1 なら「まだ はじめていない」
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
// なかまの つよさ(レベルは 主人公と おなじ)
export function allyStats(id) {
  const rs = rows(id); let row = rs[0] || FALLBACK;
  const skills = [];
  for (const r of rs) if (r.lv <= hero.lv) { row = r; for (const s of r.learn) if (!skills.includes(s)) skills.push(s); }
  return { maxhp: row.hp, maxmp: row.mp, atk: row.atk + (equippedBy(id, 'ぶき')?.val || 0), def: row.def + (equippedBy(id, 'よろい')?.val || 0), mag: row.mag, spr: row.spr, spd: row.spd, skills, baseAtk: row.atk, baseDef: row.def };
}
const ALLY_NAME = { hamo: '{ハモ|はも}', melo: '{メロ|めろ}', pasha: '{パシャ|ぱしゃ}', mogu: '{モグ|もぐ}' };
// パーティ: [{ key, name, pal, s(hp・mp が 入っている もの), st(つよさ) }]
// away: リズが いない あいだ(第3章 かぜで ねている。 main.js が いれる)
export const party = { away: false, solo: false, guests: false };   // guests: パシャと モグが いっしょ(第4章 よりみち ダンジョン)   // solo: リズ ひとり(第4章 ないしょの じゅんび)
export function members() {
  const list = party.away ? [] : [{ key: 'hero', name: hero.name, s: hero, st: heroStats() }];
  if (party.solo) { if (party.guests) for (const k of ['pasha', 'mogu']) { joinAlly(k); list.push({ key: k, name: ALLY_NAME[k], pal: k, s: hero[k], st: allyStats(k) }); } return list; }
  for (const k of ['hamo', 'melo']) if (hero[k]) list.push({ key: k, name: ALLY_NAME[k], pal: k, s: hero[k], st: allyStats(k) });
  return list;
}
export function joinAlly(id) { if (ALLY_NAME[id] && !hero[id]) { hero[id] = { hp: 1, mp: 0, equip: { ぶき: null, よろい: null } }; const st = allyStats(id); hero[id].hp = st.maxhp; hero[id].mp = st.maxmp; } }
// ===== そうび(みかた みんな。 おなじ ものを ふたりで つかうには 2こ ひつよう) =====
const ORDER = ['hero', 'hamo', 'melo', 'pasha', 'mogu'];
export const equipOf = key => key === 'hero' ? hero.equip : hero[key] ? (hero[key].equip ||= { ぶき: null, よろい: null }) : { ぶき: null, よろい: null };
// key の ひとが そうびしている もの(もっている かずが たりなければ なし)
export function equippedBy(key, slot) {
  const id = equipOf(key)[slot]; if (!id) return null;
  const before = ORDER.slice(0, ORDER.indexOf(key)).filter(k => (k === 'hero' || hero[k]) && equipOf(k)[slot] === id).length;
  return bag.filter(b => b === id).length > before ? byId('items', id) : null;
}
// その どうぐを そうびしている ひとの かず
export const wearCount = id => ORDER.filter(k => (k === 'hero' || hero[k]) && Object.values(equipOf(k)).includes(id)).length;
// そうびしている物(主人公)
export function equipped(slot) { return equippedBy('hero', slot); }
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
    const beforeSkills = heroStats().skills;
    hero.lv = next.lv;
    members().forEach((m, i) => { m.s.hp += m.st.maxhp - before[i].maxhp; m.s.mp += m.st.maxmp - before[i].maxmp; });   // ふえた ぶんだけ 回復
    const learned = party.away ? [] : next.learn.filter(s => !beforeSkills.includes(s)).map(id => ({ id, who: hero.name }));
    for (const k of ['hamo', 'melo']) if (hero[k] && !party.solo) for (const r of rows(k)) if (r.lv === hero.lv) for (const id of r.learn) learned.push({ id, who: ALLY_NAME[k] });
    ups.push({ lv: hero.lv, learned });
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

// 戦闘(ターン制のコマンド戦闘)。 みかたは 主人公と なかま(ハモ)
import { byId } from './data.js';
import { hero, bag, members, gainExp, heal, bagCount, bagRemove, equipLook } from './hero.js';
import { heroSprite, enemySprite, charSprite } from './sprites.js';
import { sfx, playBgm } from './audio.js';
import { rubyHTML } from './dialog.js';

const $ = id => document.getElementById(id);
export const battle = { on: false };
let B = null;

const rnd = (a, b) => a + Math.random() * (b - a);
const fill = s => s.replace(/@/g, hero.name);
const alive = () => B.enemies.filter(e => e.alive);
const up = () => B.party.filter(m => m.s.hp > 0);          // たおれていない みかた
const SPOTS = [[[262, 112]], [[248, 100], [282, 138]], [[244, 94], [284, 118], [248, 144]]];     // みかたの たちいち(1人 / 2人 / 3人)

// ===== はじめる(ids: てきの id の ならび、 opt.boss: ボス せん) → 'win' / 'lose' / 'run' =====
export function startBattle(ids, opt = {}) {
  // opt.scale: つよさの ばいりつ(よるの まもの)
  const k = opt.scale || 1, mul = v => Math.round(v * k);
  const defs = ids.map(id => byId('enemies', id)).filter(Boolean)
    .map(d => k === 1 ? d : { ...d, hp: mul(d.hp), atk: mul(d.atk), def: mul(d.def), mag: mul(d.mag), spr: mul(d.spr), exp: mul(d.exp), gold: mul(d.gold) });
  if (!defs.length) return Promise.resolve('win');
  const count = {}, seen = {};
  defs.forEach(d => { count[d.id] = (count[d.id] || 0) + 1; });
  const n = defs.length;
  const enemies = defs.map((d, i) => {
    let name = d.name;
    if (count[d.id] > 1) { seen[d.id] = (seen[d.id] || 0) + 1; name += ' ' + 'ABCDE'[seen[d.id] - 1]; }
    return { d, name, cond: {}, hp: d.hp, mp: d.mp, x: 105 + (i - (n - 1) / 2) * 66, y: opt.boss ? 132 : 118, size: opt.boss ? 56 : 32, flash: 0, alpha: 1, alive: true, lunge: 0, bob: Math.random() * 6 };
  });
  const ms = members(), spots = SPOTS[Math.min(ms.length, 3) - 1];
  const party = ms.map((m, i) => ({ ...m, cond: {}, x: spots[i][0], y: spots[i][1], flash: 0, lunge: 0, guard: false }));   // cond: ステータス いじょう
  B = { enemies, party, boss: !!opt.boss, waits: [], shake: 0, fx: [], flashScreen: 0, btns: [], t: 0, turnOf: null, bg: opt.bg || null };
  battle.on = true;
  $('battle').style.display = 'block';
  setButtons([]); showMsg('');
  updateStat();
  playBgm('battle');
  return new Promise(res => { B.done = res; run(); });
}
const st = m => m.st;

// ===== 待つ(タップで とばせる) =====
function wait(sec, skip) { return new Promise(r => B.waits.push({ t: sec, r, skip })); }
function showMsg(s) { $('bmsg').innerHTML = rubyHTML(fill(s)); $('bmsg').style.display = s ? 'block' : 'none'; }
async function say(s, sec) {
  showMsg(s);
  const len = s.replace(/\{([^|}]*)\|[^}]*\}/g, '$1').length;
  await wait(sec ?? 0.9 + len * 0.045, true);
}
let noteTimer = null;
function note(s) {   // ボタンの上に 少しだけ出る お知らせ
  const el = $('bnote'); el.innerHTML = rubyHTML(fill(s)); el.style.display = 'block';
  clearTimeout(noteTimer); noteTimer = setTimeout(() => { el.style.display = 'none'; }, 1600);
}
// タップ・キーで呼ばれる
export function battleTap(btnIndex) {
  if (!B) return;
  if (btnIndex !== undefined && B.btns[btnIndex]) { sfx('next'); B.btns[btnIndex](); return; }
  for (const w of B.waits) if (w.skip) w.t = 0;
}
export const battleButtons = () => B ? B.btns.length : 0;

// ===== ボタン =====
function setButtons(items, wide) {   // items: [{html, fn, off}]
  B.btns = items.map(it => it.fn);
  const box = $('bcmd');
  box.className = typeof wide === 'string' ? wide : wide ? 'wide' : '';
  box.innerHTML = items.map((it, i) => `<button data-b="${i}"${it.off ? ' class="off"' : ''}>${it.html}</button>`).join('');
  box.style.display = items.length ? 'grid' : 'none';
  if (items.length) $('bmsg').style.display = 'none';
  document.querySelectorAll('#battle .tgt').forEach(el => el.remove());
}
// list: えらべる あいて(てき か みかた)
function targetButtons(list, onPick, back, ask) {
  setButtons([{ html: 'もどる', fn: back }], true);
  $('bnote').innerHTML = rubyHTML(ask); $('bnote').style.display = 'block'; clearTimeout(noteTimer);
  for (const e of list) {
    const b = document.createElement('button'), top = e.size ? e.y - e.size - 14 : e.y - 46;
    b.className = 'tgt'; b.dataset.b = B.btns.length;
    b.style.left = `calc(var(--u) * ${e.x - 22})`; b.style.top = `calc(var(--u) * ${top})`;
    b.innerHTML = `<span class="arrow">▼</span><span class="tname">${rubyHTML(e.name)}</span>`;
    B.btns.push(() => { $('bnote').style.display = 'none'; onPick(e); });
    $('battle').appendChild(b);
  }
}

// ===== コマンドを えらぶ(m: えらぶ みかた、 first: さいしょの ひと = にげる が えらべる) =====
function chooseCommand(m, first) {
  B.turnOf = m.key; updateStat();
  if (B.party.length > 1) note(`${m.name}は どうする?`);
  return new Promise(resolve => {
    const done = cmd => { setButtons([]); B.turnOf = null; updateStat(); resolve(cmd); };
    const pick = (then, back) => { const a = alive(); if (a.length === 1) then(a[0]); else targetButtons(a, then, back, 'どの てきに する? てきを タップしてね'); };
    // かいふくする あいて(みかたが ひとりなら じぶん)
    const pickAlly = (then, back, ask) => { if (B.party.length === 1) then(B.party[0]); else targetButtons(B.party, then, back, ask || 'だれを かいふく する? タップしてね'); };
    // がっそう: 3にん そろって うごける とき、 さいしょの ひとが えらべる(1かいの たたかいで 1かい。 3にんの MPを GASSOU_MP ずつ つかう)
    const canGassou = first && B.party.length === 3 && bag.includes('がっそうのかけら') && !B.gassou && up().length === 3 && B.party.every(x => !x.cond.ねむり && !x.cond.わらい);
    const gassouMp = canGassou && B.party.every(x => x.s.mp >= GASSOU_MP);
    const main = () => setButtons([
      ...(canGassou ? [{ html: `がっそう<small>MP${GASSOU_MP}ずつ</small>`, off: !gassouMp, fn: () => gassouMp ? done({ type: 'gassou' }) : note(`MPが ${GASSOU_MP}より すくない ひとが いるよ`) }] : []),
      { html: 'たたかう', fn: () => pick(t => done({ type: 'attack', target: t }), main) },
      { html: 'じゅもん', fn: () => skills('じゅもん') },
      { html: 'わざ', fn: () => skills('わざ') },
      { html: 'どうぐ', fn: items },
      { html: 'にげる', off: !first || B.boss, fn: () => { if (B.boss) note('ボスからは にげられない!'.replace('ボス', '{ボス|ぼす}')); else if (!first) note('にげるは さいしょの ひとが えらぶよ'); else done({ type: 'run' }); } },
    ], canGassou ? 'six' : false);
    const skills = kind => {
      const list = st(m).skills.map(id => byId('skills', id)).filter(s => s && s.type === kind && s.effect !== 'ワープ');
      if (!list.length) { note(kind === 'じゅもん' ? 'じゅもんを つかえないよ' : 'まだ わざを おぼえていないよ'); return; }
      setButtons([...list.map(s => ({
        html: `${rubyHTML(s.name)}<small>MP ${s.mp}${s.elem && s.elem !== 'なし' ? ' ' + s.elem : ''}</small>`, off: m.s.mp < s.mp,
        fn: () => {
          if (m.s.mp < s.mp) { note('MPが たりないよ'); return; }
          if ((s.effect === 'こうげき' || s.effect === 'じょうたい') && s.target === 'ひとり') pick(t => done({ type: 'skill', skill: s, target: t }), () => skills(kind));
          else if ((s.effect === 'かいふく' || s.effect === 'なおす') && s.target === 'みんな') done({ type: 'skill', skill: s });
          else if (s.effect === 'かいふく') pickAlly(t => done({ type: 'skill', skill: s, target: t }), () => skills(kind));
          else done({ type: 'skill', skill: s });
        } })), { html: 'もどる', fn: main }], true);
    };
    const items = () => {
      const ids = [...new Set(bag)].filter(id => ['かいふく', 'なおす'].includes(byId('items', id)?.kind));
      if (!ids.length) { note('つかえる どうぐが ないよ'); return; }
      setButtons([...ids.map(id => { const it = byId('items', id); return { html: `${rubyHTML(it.name)}<small>×${bagCount(id)}</small>`,
        fn: () => pickAlly(t => done({ type: 'item', item: it, target: t }), items, it.kind === 'なおす' ? 'だれを なおす? タップしてね' : undefined) }; }),
        { html: 'もどる', fn: main }], true);
    };
    main();
  });
}

// ===== ステータス いじょう(たたかいが おわると ぜんぶ なおる) =====
// ねむり: 1〜3ターン うごけない(こうげきを うけると おきる)  どく: ターンの おわりに HPが へる
// しびれ: 3ターン、 はんぶんくらい うごけない  わらい: 1かい やすみ  くさい: 3ターン こうげきが さがる
const COND_MSG = { ねむり: 'は ねむって しまった!', どく: 'は どくに かかった!', しびれ: 'は からだが しびれた!', わらい: 'は わらいだして とまらない!', くさい: 'は くさくて ちからが でない!' };
const COND_TURNS = { ねむり: () => 1 + (Math.random() * 3 | 0), どく: () => 99, しびれ: () => 3, わらい: () => 1, くさい: () => 3 };
const nameOf = x => x.name;
async function inflict(t, skill) {
  const c = skill?.status; if (!c || !(t.alive ?? t.s.hp > 0)) return;
  const resist = B.boss && t.d && B.enemies.includes(t) ? 0.4 : 1;   // ボスは じょうたい いじょうに なりにくい
  if (Math.random() * 100 >= (skill.chance || 100) * resist) return;
  if (t.cond[c]) return;
  t.cond[c] = COND_TURNS[c](); updateStat();
  await say(`${nameOf(t)}${COND_MSG[c]}`, 1.1);
}
// うごけるか(うごけなければ メッセージを だして false)
async function canAct(x) {
  if (x.cond.ねむり) { if (--x.cond.ねむり <= 0) delete x.cond.ねむり; updateStat(); await say(`${nameOf(x)}は ぐうぐう ねむっている……`, 1); return false; }
  if (x.cond.わらい) { delete x.cond.わらい; updateStat(); await say(`${nameOf(x)}は わらいころげて うごけない!`, 1); return false; }
  if (x.cond.しびれ && Math.random() < 0.5) { await say(`${nameOf(x)}は からだが しびれて うごけない!`, 1); return false; }
  return true;
}
async function wake(x) { if (x.cond.ねむり) { delete x.cond.ねむり; updateStat(); await say(`${nameOf(x)}は めを さました!`, 0.9); } }
// ターンの おわり: どくの ダメージ、 じかんで なおる もの
async function endRound() {
  for (const x of [...up(), ...alive()]) {
    if (x.cond.どく) {
      const isM = !!x.s, max = isM ? x.st.maxhp : x.d.hp, n = Math.max(1, Math.floor(max / 10));
      if (isM) x.s.hp = Math.max(0, x.s.hp - n); else x.hp -= n;
      updateStat(); popup(x.x, x.y - (x.size || 0) - 8, n, isM ? 'hurt' : '');
      await say(`${nameOf(x)}は どくで ${n}の {ダメージ|だめーじ}!`, 1);
      if (isM && x.s.hp <= 0) await say(`${nameOf(x)}は たおれてしまった…`, 1.2);
      if (!isM && x.hp <= 0) { x.alive = false; sfx('defeat'); await say(`${nameOf(x)}を やっつけた!`); }
    }
    for (const c of ['しびれ', 'くさい']) if (x.cond[c] && --x.cond[c] <= 0) { delete x.cond[c]; updateStat(); }
  }
}
const atkMul = x => x.cond?.くさい ? 0.7 : 1;

// ===== ダメージの けいさん =====
// わざ・たたかう(物理) = こうげき × いりょく ÷ 100 − あいての ぼうぎょ ÷ 2
// じゅもん(魔法)      = まりょく × いりょく ÷ 100 − あいての せいしん ÷ 2
// ぞくせい: あいての よわい ぞくせい なら 1.5倍、 つよい ぞくせい なら 半分
// user: {atk, mag}  target: {def, spr, weak, resist}
function calc(user, skill, target, mul = 1) {
  const magic = skill?.type === 'じゅもん';
  if (!magic && Math.random() < 0.05) return { miss: true };          // じゅもんは よけられない
  const pow = skill ? skill.pow : 100;
  let dmg = ((magic ? user.mag : user.atk * mul) * pow / 100 - (magic ? target.spr : target.def) / 2) * rnd(0.85, 1.15);
  let mult = 1;
  const el = skill?.elem;
  if (el && el !== 'なし') { if (target.weak?.includes(el)) mult = 1.5; else if (target.resist?.includes(el)) mult = 0.5; }
  dmg *= mult;
  const crit = !magic && mult === 1 && Math.random() < 1 / 16;
  if (crit) dmg = dmg * 1.5 + 1;
  return { dmg: Math.max(1, Math.round(dmg)), crit, mult };
}
const allyTarget = m => ({ def: st(m).def, spr: st(m).spr, weak: [], resist: [] });
// こうげきの エフェクトの しゅるい
const FX_OF = { ほのお: 'fire', みず: 'water', かみなり: 'thunder', かぜ: 'wind' };
function fxType(skill) { if (skill?.fx) return skill.fx; if (skill?.elem && FX_OF[skill.elem]) return FX_OF[skill.elem]; return skill?.type === 'じゅもん' ? 'magic' : 'slash'; }
const FX_TIME = { slash: 0.35, fire: 0.75, water: 0.7, thunder: 0.6, wind: 0.75, magic: 0.6, heal: 0.7, impact: 0.25, drum: 0.6, notes: 0.8, wave: 0.6, star: 0.9, song: 0.9, stink: 0.9, lick: 0.55, spit: 0.5, spore: 0.7, leaf: 0.7, butt: 0.7 };
async function effect(type, targets) {
  sfx({ slash: 'slash', fire: 'fire', water: 'water', thunder: 'thunder', wind: 'wind', magic: 'magic', heal: 'heal', impact: 'hurt', drum: 'drum', notes: 'note', wave: 'chord', star: 'magic', song: 'heal', stink: 'stink', lick: 'lick', spit: 'spit', spore: 'stink', leaf: 'wind', butt: 'boing' }[type]);
  for (const t of targets) B.fx.push({ type, x: t.x, y: t.y, t: 0, dur: FX_TIME[type], seed: Math.random() * 1000 });
  if (type === 'thunder') B.flashScreen = 0.18;
  await wait(FX_TIME[type] * 0.8);
}
function popup(x, y, text, cls) {
  const el = document.createElement('div');
  el.className = 'pop ' + (cls || ''); el.textContent = text;
  el.style.left = `calc(var(--u) * ${x - 20})`; el.style.top = `calc(var(--u) * ${y})`;
  $('battle').appendChild(el); setTimeout(() => el.remove(), 900);
}
function updateStat() {
  const bar = (v, m, c) => `<span class="bar"><span style="width:${Math.max(0, Math.min(100, v / (m || 1) * 100))}%;background:${c}"></span></span>`;
  $('bstat').className = ['', '', 'two', 'three'][B.party.length] || '';
  $('bstat').innerHTML = B.party.map(m => {
    const s = m.s, t = st(m);
    return `<div class="bmem${B.turnOf === m.key ? ' on' : ''}${s.hp <= 0 ? ' down' : ''}"><div class="bname">${rubyHTML(m.name)}${m.key === 'hero' ? ` <small>${rubyHTML('{レベル|れべる}')}${hero.lv}</small>` : ''}${condChips(m)}</div>` +
      `<div>HP ${s.hp}/${t.maxhp}${bar(s.hp, t.maxhp, s.hp <= t.maxhp / 4 ? '#ff5a5a' : '#6cdc5a')}</div>` +
      `<div>MP ${s.mp}/${t.maxmp}${bar(s.mp, t.maxmp, '#5ab0ff')}</div></div>`;
  }).join('');
  // てきの あたまの うえの ステータス いじょう
  document.querySelectorAll('#battle .econd').forEach(el => el.remove());
  for (const e of B.enemies) if (e.alive && Object.keys(e.cond).length) {
    const el = document.createElement('div'); el.className = 'econd';
    el.style.left = `calc(var(--u) * ${e.x - 24})`; el.style.top = `calc(var(--u) * ${e.y - e.size - 12})`;
    el.innerHTML = condChips(e); $('battle').appendChild(el);
  }
}
const condChips = x => Object.keys(x.cond || {}).map(c => `<span class="cond c-${c}">${c}</span>`).join('');
async function lunge(who) { who.lunge = 0.3; await wait(0.3); }

async function hitEnemy(t, r) {
  if (r.miss) { sfx('miss'); await say(`${t.name}は ひらりと よけた!`); return; }
  if (r.crit) await say('すごい いちげき!', 0.7);
  sfx('hit'); t.flash = 0.4; t.hp -= r.dmg; popup(t.x, t.y - t.size - 8, r.dmg, r.mult > 1 ? 'weak' : '');
  if (t.hp > 0) await wake(t);
  if (r.mult > 1) await say('よわい ところを ついた!', 0.9);
  if (r.mult < 1) await say('あまり きいていない…', 0.9);
  await say(`${t.name}に ${r.dmg}の {ダメージ|だめーじ}!`);
  if (t.hp <= 0) { t.alive = false; sfx('defeat'); await say(`${t.name}を やっつけた!`); }
}
async function cureMember(t) {
  await effect('song', [t]);
  t.cond = {}; updateStat();
  await say(`${t.name}は すっかり よくなった!`);
}
async function healMember(t, n) {
  await effect('heal', [t]);
  const revive = t.s.hp <= 0, got = heal(n, t); updateStat(); popup(t.x, t.y - 44, '+' + got, 'heal');
  await say(revive ? `${t.name}が おきあがった! HPが ${got} かいふくした!` : `${t.name}の HPが ${got} かいふくした!`);
}
async function memberAct(m, cmd) {
  const s0 = st(m);
  if (!(await canAct(m))) return;
  if (cmd.type === 'gassou') { await gassou(); return; }
  if (cmd.type === 'attack') {
    const t = cmd.target.alive ? cmd.target : alive()[0];
    await say(`${m.name}の こうげき!`, 0.6); await lunge(m);
    await effect('slash', [t]);
    await hitEnemy(t, calc(s0, null, t.d, atkMul(m)));
  } else if (cmd.type === 'skill') {
    const s = cmd.skill;
    m.s.mp -= s.mp; updateStat();
    await say(`${m.name}は 「${s.name}」を ${s.type === 'じゅもん' ? 'となえた' : 'つかった'}!`, 1.1);
    if (s.effect === 'かいふく' && s.target === 'みんな') { for (const t of up()) await healMember(t, s.pow + Math.floor(s0.mag / 2)); }
    else if (s.effect === 'かいふく') await healMember(cmd.target || m, s.pow + Math.floor(s0.mag / 2));   // かいふく = いりょく + まりょく ÷ 2
    else if (s.effect === 'なおす') { for (const t of up()) if (Object.keys(t.cond).length) await cureMember(t); else { await effect(fxType(s), [t]); } }
    else if (s.effect === 'まもる') { m.guard = true; await say(`${m.name}は みんなの まえに たった!`, 1); }
    else {
      if (s.type === 'わざ') await lunge(m);
      const targets = s.target === 'ぜんぶ' ? alive() : [cmd.target?.alive ? cmd.target : alive()[0]];
      await effect(fxType(s), targets);
      for (const t of targets) if (t.alive) {
        if (s.effect !== 'じょうたい') await hitEnemy(t, calc(s0, s, t.d, atkMul(m)));
        const before = Object.keys(t.cond).length; await inflict(t, s);
        if (s.effect === 'じょうたい' && Object.keys(t.cond).length === before) await say(`${t.name}には きかなかった!`, 0.9);
      }
    }
  } else if (cmd.type === 'item') {
    const it = cmd.item;
    if (!bag.includes(it.id)) { await say(`${it.name}は もう ないよ…`); return; }
    bagRemove(it.id);
    await say(`${m.name}は ${it.name}を つかった!`, 1);
    if (it.kind === 'なおす') await cureMember(cmd.target || m); else await healMember(cmd.target || m, it.val);
  }
}
// がっそう: 3にんで えんそうして てき ぜんぶに こうげき + みんな すこし かいふく。 かけらが おおいほど つよい
const GASSOU_MP = 4;
async function gassou() {
  for (const m of B.party) m.s.mp = Math.max(0, m.s.mp - GASSOU_MP); updateStat();
  const k = bag.filter(id => id.endsWith('のかけら')).length;
  const [h, a, b] = ['hero', 'hamo', 'melo'].map(key => B.party.find(x => x.key === key));
  await say(`みんなで 「がっそう」!`, 1.2);
  sfx('chord'); for (const m of B.party) m.lunge = 0.3; await wait(0.3);
  await effect('notes', alive()); await effect('star', alive());
  const pow = ((h ? st(h).atk : 0) + (a ? st(a).atk : 0) + (b ? st(b).mag : 0)) * 0.6 * (1 + 0.1 * k);
  for (const t of alive()) {
    const dmg = Math.max(1, Math.round((pow - t.d.def / 2) * rnd(0.9, 1.1)));
    await hitEnemy(t, { dmg, mult: 1 });
  }
  if (up().length) {
    await effect('song', up());
    for (const m of up()) { const got = heal(Math.round(st(m).maxhp * 0.15), m); popup(m.x, m.y - 44, '+' + got, 'heal'); }
    updateStat(); await say('みんなの HPが すこし かいふくした!');
  }
}
async function hurtMember(t, r) {
  if (r.miss) { sfx('miss'); await say(`${t.name}は ひらりと かわした!`); return; }
  if (r.crit) await say('いたい いちげき!', 0.7);
  sfx('hurt'); B.shake = 0.3; t.flash = 0.4;
  t.s.hp = Math.max(0, t.s.hp - r.dmg); updateStat(); popup(t.x, t.y - 44, r.dmg, 'hurt');
  await say(`${t.name}は ${r.dmg}の {ダメージ|だめーじ}を うけた!`);
  if (t.s.hp <= 0) { t.cond = {}; await say(`${t.name}は たおれてしまった…`, 1.4); }
  else await wake(t);
}
async function enemyAct(e) {
  if (!(await canAct(e))) return;
  const sk = e.d.skills.map(id => byId('skills', id)).filter(s => s && e.mp >= s.mp);
  let skill = null;
  if (sk.length && Math.random() < 0.35) {
    skill = sk[Math.random() * sk.length | 0];
    e.mp -= skill.mp;
    await say(`${e.name}の ${skill.name}!`, 0.8);
    if (skill.effect === 'かいふく') { await effect('heal', [e]); e.hp = Math.min(e.d.hp, e.hp + skill.pow + Math.floor(e.d.mag / 2)); await say(`${e.name}は げんきに なった!`); return; }
  } else await say(`${e.name}の こうげき!`, 0.6);
  if (skill?.type !== 'じゅもん') await lunge(e);
  let targets = skill?.target === 'ぜんぶ' ? up() : [up()[Math.random() * up().length | 0]];
  // まもる: ひとりを ねらった こうげきは かばう
  const guard = up().find(m => m.guard);
  if (guard && targets.length === 1 && targets[0] !== guard) { await say(`${guard.name}が ${targets[0].name}を かばった!`, 1); targets = [guard]; }
  await effect(skill ? fxType(skill) : 'impact', targets);
  for (const t of targets) {
    if (skill?.effect === 'じょうたい') { const b = Object.keys(t.cond).length; await inflict(t, skill); if (Object.keys(t.cond).length === b) await say(`${t.name}は へいきだった!`, 0.9); continue; }
    const r = calc(e.d, skill, allyTarget(t), atkMul(e));
    if (t.guard && !r.miss) r.dmg = Math.max(1, Math.round(r.dmg / 2));   // かばうと はんぶん
    await hurtMember(t, r);
    if (!r.miss) await inflict(t, skill);
  }
}

// ===== 戦闘の ながれ =====
async function run() {
  const first = B.enemies[0].d.name;
  await say(B.boss ? `${first}が おそいかかって きた!` : B.enemies.length === 1 ? `${first}が あらわれた!` : `まものたちが あらわれた!`);
  if (!battle.taught) { battle.taught = true; await say('{ボタン|ぼたん}を おして たたかおう!'); }
  for (;;) {
    const actors = [];
    let ran = false;
    for (const m of B.party) m.guard = false;
    for (const [i, m] of up().entries()) {
      if (m.cond.ねむり || m.cond.わらい) { actors.push({ who: m, spd: st(m).spd, cmd: { type: 'none' } }); continue; }   // えらべない(ねむり・わらい)
      const cmd = await chooseCommand(m, i === 0 || up().slice(0, i).every(x => x.cond.ねむり || x.cond.わらい));
      if (cmd.type === 'run') { ran = true; break; }
      if (cmd.type === 'gassou') { B.gassou = true; actors.push({ who: m, spd: 9999, cmd }); break; }   // みんなで いっしょに
      actors.push({ who: m, spd: st(m).spd * rnd(0.8, 1.2), cmd });
    }
    if (ran) {
      if (Math.random() < 0.8) { sfx('run'); await say(B.party.length > 1 ? 'みんなで にげだした!' : '@は にげだした!'); return finish('run'); }
      await say('にげられなかった!');
    }
    for (const e of alive()) actors.push({ who: e, spd: e.d.spd * rnd(0.8, 1.2) });
    actors.sort((a, b) => (b.cmd?.skill?.effect === 'まもる') - (a.cmd?.skill?.effect === 'まもる') || b.spd - a.spd);   // まもるは いちばん さきに
    for (const a of actors) {
      if (a.cmd) { if (a.who.s.hp > 0) await memberAct(a.who, a.cmd); } else if (a.who.alive) await enemyAct(a.who);
      if (!alive().length) return victory();
      if (!up().length) return defeat();
    }
    await endRound();
    if (!alive().length) return victory();
    if (!up().length) return defeat();
  }
}
async function victory() {
  playBgm(''); sfx('win');
  for (const m of B.party) if (m.s.hp <= 0) m.s.hp = 1;   // たおれた なかまも おきあがる
  updateStat();
  const exp = B.enemies.reduce((s, e) => s + e.d.exp, 0), gold = B.enemies.reduce((s, e) => s + (e.d.gold || 0), 0);
  if (B.enemies.length > 1) await say('まものを ぜんぶ やっつけた!', 1.6); else await wait(1.0);
  await say(`けいけんちを ${exp} もらった!`);
  if (gold > 0) { hero.gold += gold; await say(`おかねを ${gold}{円|えん} ひろった!`); }
  // おとしもの(enemies.csv の おとすもの・かくりつ)
  for (const e of B.enemies) {
    const it = e.d.drop && byId('items', e.d.drop);
    if (it && Math.random() * 100 < e.d.rate) { bag.push(it.id); sfx('get'); await say(`${e.d.name}は ${it.name}を おとした!`); }
  }
  for (const u of gainExp(exp)) {
    sfx('lvup'); B.party = B.party.map(m => ({ ...m, st: members().find(x => x.key === m.key)?.st || m.st })); updateStat();
    await say(`@の {レベル|れべる}が ${u.lv}に あがった!`, 2.2);
    for (const l of u.learned) { const s = byId('skills', l.id); if (s) await say(`${l.who}は 「${s.name}」を おぼえた!`, 1.8); }
  }
  finish('win');
}
async function defeat() {
  playBgm(''); sfx('lose');
  await say(B.party.length > 1 ? 'みんな たおれてしまった…' : '@は たおれてしまった…', 2.5);
  finish('lose');
}
function finish(result) {
  battle.on = false;
  $('battle').style.display = 'none';
  document.querySelectorAll('#battle .tgt, #battle .pop, #battle .econd').forEach(el => el.remove());
  const done = B.done; B = null; done(result);
}

// ===== 毎フレーム =====
export function updateBattle(dt) {
  if (!B) return;
  B.t += dt;
  for (const w of [...B.waits]) { w.t -= dt; if (w.t <= 0) { B.waits.splice(B.waits.indexOf(w), 1); w.r(); } }
  B.shake = Math.max(0, B.shake - dt); B.flashScreen = Math.max(0, B.flashScreen - dt);
  for (const f of B.fx) f.t += dt;
  B.fx = B.fx.filter(f => f.t < f.dur);
  for (const m of B.party) { m.flash = Math.max(0, m.flash - dt); m.lunge = Math.max(0, m.lunge - dt); }
  for (const e of B.enemies) {
    e.flash = Math.max(0, e.flash - dt); e.lunge = Math.max(0, e.lunge - dt);
    if (!e.alive) e.alpha = Math.max(0, e.alpha - dt * 2.5);
  }
}
export function drawBattle(ctx) {
  if (!B) return;
  const ox = B.shake > 0 ? (Math.random() * 4 - 2 | 0) : 0, oy = B.shake > 0 ? (Math.random() * 4 - 2 | 0) : 0;
  // けしき(森 / あらし)
  const rainBg = B.bg === 'storm', C = rainBg ? ['#2a3048', '#3a405a', '#2e4a3a', '#3e6a4a', '#4a7a56'] : ['#163a1a', '#1f4a22', '#2a5e2c', '#3f8f3a', '#4a9e44'];
  ctx.fillStyle = C[0]; ctx.fillRect(0, 0, 320, 200);
  ctx.fillStyle = C[1]; for (let x = -10; x < 330; x += 28) { ctx.beginPath(); ctx.arc(x + ox, 34 + (x % 3) * 6, 26, 0, 7); ctx.fill(); }
  ctx.fillStyle = C[2]; ctx.fillRect(0, 62 + oy, 320, 4);
  ctx.fillStyle = C[3]; ctx.fillRect(0, 66 + oy, 320, 134);
  ctx.fillStyle = C[4]; ctx.beginPath(); ctx.ellipse(110 + ox, 120 + oy, 120, 22, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(266 + ox, 120 + oy, 44, 26, 0, 0, 7); ctx.fill();
  if (rainBg) { ctx.fillStyle = 'rgba(190,210,255,.45)'; for (let i = 0; i < 50; i++) ctx.fillRect(((i * 71 - B.t * 20) % 330 + 330) % 330, ((i * 37 + B.t * 220) % 220) - 10, 1, 5); }
  // てき
  for (const e of B.enemies) {
    if (e.alpha <= 0) continue;
    if (e.flash > 0 && Math.floor(e.flash * 20) % 2) continue;    // ちかちか
    const lx = e.lunge > 0 ? Math.sin((1 - e.lunge / 0.3) * Math.PI) * 14 : 0;
    const by = Math.round(Math.sin(B.t * 3 + e.bob) * 1.5), z = e.size;
    ctx.globalAlpha = e.alpha;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(e.x + lx + ox, e.y + oy, z * 0.45, 4, 0, 0, 7); ctx.fill();
    ctx.drawImage(enemySprite(e.d.look), Math.round(e.x - z / 2 + lx + ox), Math.round(e.y - z + by + oy), z, z);
    ctx.globalAlpha = 1;
  }
  // みかた
  for (const m of B.party) {
    if (m.flash > 0 && Math.floor(m.flash * 20) % 2) continue;
    const lx = m.lunge > 0 ? -Math.sin((1 - m.lunge / 0.3) * Math.PI) * 18 : 0, down = m.s.hp <= 0;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(m.x + lx, m.y, 10, 3, 0, 0, 7); ctx.fill();
    const img = m.key === 'hero' ? heroSprite('left', m.lunge > 0 ? 1 : 0, equipLook()) : charSprite(m.pal, 'left', m.lunge > 0 ? 1 : 0);
    ctx.globalAlpha = down ? 0.4 : 1;
    ctx.drawImage(img, Math.round(m.x - 12 + lx), m.y - 31 + (down ? 6 : 0), 24, 32);
    ctx.globalAlpha = 1;
    if (m.guard) { ctx.fillStyle = 'rgba(160,210,255,.8)'; ctx.fillRect(Math.round(m.x - 16), m.y - 34, 2, 30); }   // まもっている しるし
  }
  // エフェクト
  for (const f of B.fx) drawFx(ctx, f);
  if (B.flashScreen > 0) { ctx.fillStyle = `rgba(255,255,230,${B.flashScreen * 3})`; ctx.fillRect(0, 0, 320, 200); }
}

// ===== エフェクトの 絵 =====
const hash = n => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
function dot(ctx, x, y, c, w = 2) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, w); }
function line(ctx, x0, y0, x1, y1, c, w = 2) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0)); for (let i = 0; i <= n; i++) dot(ctx, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c, w); }
function drawFx(ctx, f) {
  const p = f.t / f.dur, cx = f.x, cy = f.y - 16, S = f.seed;
  if (f.type === 'slash') {           // ななめの 斬りあと
    for (let k = 0; k < 2; k++) {
      const q = Math.min(1, p * 2.2 - k * 0.35); if (q <= 0) continue;
      const a = 1 - Math.max(0, p - 0.6) / 0.4, x0 = cx - 14 + k * 8, y0 = cy - 14, x1 = cx + 10 + k * 8, y1 = cy + 12;
      line(ctx, x0, y0, x0 + (x1 - x0) * q, y0 + (y1 - y0) * q, `rgba(255,255,255,${a})`, 2);
      line(ctx, x0 + 1, y0, x0 + 1 + (x1 - x0) * q, y0 + (y1 - y0) * q, `rgba(180,220,255,${a * .7})`, 1);
    }
  } else if (f.type === 'fire') {     // 下から もえあがる ほのお
    const cols = ['#fff3a0', '#ffd23f', '#ff8a2a', '#e8401a', '#a02010'];
    for (let i = 0; i < 22; i++) {
      const life = (p * 1.6 + hash(S + i)) % 1, x = cx + (hash(S + i * 3) - .5) * 26 + Math.sin(life * 6 + i) * 2, y = cy + 16 - life * 40 * (0.6 + hash(i) * .6);
      if (p > 0.85 && hash(i + 9) < (p - .85) * 6) continue;
      dot(ctx, x, y, cols[Math.min(4, life * 5 | 0)], life < .5 ? 3 : 2);
    }
  } else if (f.type === 'water') {    // はじける しぶき
    for (let r = 0; r < 2; r++) { const rr = p * 22 + r * 6; for (let a = 0; a < 16; a++) { const an = a / 16 * 6.28; dot(ctx, cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * .6, `rgba(160,215,255,${1 - p})`, 1); } }
    for (let i = 0; i < 14; i++) {
      const an = hash(S + i) * 6.28, sp = 18 + hash(S + i * 7) * 16;
      dot(ctx, cx + Math.cos(an) * sp * p, cy - 6 + Math.sin(an) * sp * p * .7 + p * p * 22, i % 2 ? '#3b8fe0' : '#9fd2ff', 2);
    }
  } else if (f.type === 'thunder') {  // 上から おちる かみなり
    if (p < 0.65 && (f.t * 30 | 0) % 3 !== 2) {
      let x = cx + (hash(S + (f.t * 20 | 0)) - .5) * 10, y = 0;
      while (y < cy + 6) { const nx = cx + (hash(S + y + (f.t * 20 | 0)) - .5) * 18, ny = y + 8; line(ctx, x, y, nx, ny, '#fffbd0', 2); line(ctx, x + 1, y, nx + 1, ny, '#ffd23f', 1); x = nx; y = ny; }
    }
    for (let i = 0; i < 8; i++) { const an = i / 8 * 6.28; dot(ctx, cx + Math.cos(an) * (6 + p * 16), cy + 6 + Math.sin(an) * (3 + p * 6), '#ffd23f', 2); }
  } else if (f.type === 'wind') {     // ぐるぐる まわる かぜ
    for (let j = 0; j < 3; j++) for (let k = 0; k < 10; k++) {
      const an = f.t * 14 + j * 2.1 + k * 0.12, r = 8 + p * 12 + j * 2;
      dot(ctx, cx + Math.cos(an) * r, cy + 4 + Math.sin(an) * r * .45 - p * 10, k < 5 ? '#e8ffe8' : '#8ae08a', 2);
    }
    for (let i = 0; i < 6; i++) dot(ctx, cx + (hash(S + i) - .5) * 30 + p * 20, cy + (hash(S + i * 5) - .5) * 24, '#cfeccf', 1);
  } else if (f.type === 'heal' || f.type === 'magic') {   // きらきら
    const c = f.type === 'heal' ? ['#ffffff', '#9affb0'] : ['#ffffff', '#c8a8ff'];
    for (let i = 0; i < 10; i++) { const an = i / 10 * 6.28 + p * 4, r = 6 + p * 22; dot(ctx, cx + Math.cos(an) * r, cy + 6 + Math.sin(an) * r * .6 - p * 14, c[i % 2], 2); }
  } else if (f.type === 'drum') {     // ドラムの おとの わ
    for (let k = 0; k < 3; k++) { const q = p * 1.6 - k * 0.25; if (q <= 0 || q > 1) continue; const r = 4 + q * 22;
      for (let a = 0; a < 20; a++) { const an = a / 20 * 6.28; dot(ctx, cx + Math.cos(an) * r, cy + 2 + Math.sin(an) * r * .5, k % 2 ? '#ffd23f' : '#ffffff', 2); } }
    for (let i = 0; i < 4; i++) { const an = hash(S + i) * 6.28; dot(ctx, cx + Math.cos(an) * 14 * p, cy - 8 + Math.sin(an) * 10 * p, '#ff8a2a', 2); }
  } else if (f.type === 'notes' || f.type === 'song') {   // おんぷが とぶ(song は みどりで うえへ)
    const up = f.type === 'song', cols = up ? ['#9affb0', '#ffffff', '#ffd23f'] : ['#ffd23f', '#f5a8cf', '#7ac8ff'];
    for (let i = 0; i < 7; i++) {
      const q = Math.min(1, Math.max(0, p * 1.4 - i * 0.07)), x = up ? cx - 14 + i * 5 + Math.sin(q * 6 + i) * 3 : cx + 40 * (1 - q) + (hash(S + i) - .5) * 24,
        y = up ? cy + 10 - q * 30 : cy - 10 + (hash(S + i * 3) - .5) * 20 - Math.sin(q * 3.14) * 10;
      if (q <= 0) continue; const c = cols[i % 3];
      dot(ctx, x, y + 4, c, 2); dot(ctx, x + 1, y + 4, c, 2); ctx.fillStyle = c; ctx.fillRect(Math.round(x + 2), Math.round(y - 2), 1, 7); ctx.fillRect(Math.round(x + 2), Math.round(y - 2), 3, 1);   // ♪
    }
  } else if (f.type === 'wave') {     // ギターの おとの なみ
    for (let k = 0; k < 3; k++) { const q = Math.min(1, p * 1.5 - k * 0.15); if (q <= 0) continue; const x0 = cx + 50 - q * 60;
      for (let y = -14; y <= 14; y++) dot(ctx, x0 + Math.sin(y * 0.5 + f.t * 20 + k) * 3 + Math.abs(y) * 0.4, cy + y, k % 2 ? '#c8a8ff' : '#ffffff', 1); }
  } else if (f.type === 'star') {     // ほしが ふる
    for (let i = 0; i < 12; i++) { const q = Math.min(1, Math.max(0, p * 1.5 - hash(S + i) * 0.5)), x = cx + (hash(S + i * 7) - .5) * 44, y = cy - 40 + q * 44;
      if (q <= 0 || q >= 1) continue; const c = i % 2 ? '#ffd23f' : '#ffffff'; dot(ctx, x, y, c, 2); dot(ctx, x - 2, y, c, 1); dot(ctx, x + 3, y, c, 1); dot(ctx, x, y - 2, c, 1); dot(ctx, x, y + 3, c, 1); }
    if (p > 0.6) { const r = (p - 0.6) * 60; for (let a = 0; a < 16; a++) { const an = a / 16 * 6.28; dot(ctx, cx + Math.cos(an) * r, cy + Math.sin(an) * r * .6, '#fff3a0', 2); } }
  } else if (f.type === 'stink' || f.type === 'spore') {   // くさい くも / ほうし
    const cols = f.type === 'stink' ? ['#8ab84a', '#6a8a3a', '#b8d870'] : ['#f2e27a', '#d8c050', '#fff3a0'];
    for (let i = 0; i < 9; i++) { const an = hash(S + i) * 6.28, r = 6 + p * 18 * hash(S + i * 3); const x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r * .6 - p * 8;
      const z = 4 + Math.round(p * 4); if (p > 0.75 && hash(S + i + 5) < (p - .75) * 4) continue; dot(ctx, x - z / 2, y - z / 2, cols[i % 3], z); dot(ctx, x - z / 2 + 1, y - z / 2 - 1, cols[(i + 2) % 3], Math.max(1, z - 2)); }
  } else if (f.type === 'lick') {     // ベロで ぺろーん
    const q = Math.sin(p * 3.14); for (let i = 0; i < 14; i++) { const x = cx - 10 + i * 1.6, y = cy - 6 + Math.sin(i / 14 * 3.14 + p * 3) * 8 * q; dot(ctx, x, y, '#f07a9a', 3); }
    dot(ctx, cx + 12, cy - 4, '#ffffff', 2);
  } else if (f.type === 'spit') {     // つばが とぶ
    for (let i = 0; i < 6; i++) { const q = Math.min(1, p * 1.4 - i * 0.05); if (q <= 0) continue; dot(ctx, cx - 40 * (1 - q) + i * 2, cy - 6 - Math.sin(q * 3.14) * 12 + i, i % 2 ? '#cfeaff' : '#ffffff', 2); }
    if (p > 0.7) for (let a = 0; a < 6; a++) dot(ctx, cx + Math.cos(a) * 8 * (p - 0.7) * 3, cy + Math.sin(a) * 5, '#9fd2ff', 1);
  } else if (f.type === 'leaf') {     // はっぱが まう
    for (let i = 0; i < 8; i++) { const an = f.t * 10 + i * .8, r = 6 + p * 16; const x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r * .5 - p * 6;
      dot(ctx, x, y, i % 2 ? '#d8f070' : '#f0a040', 2); dot(ctx, x + 2, y + 1, '#ffe080', 1); }
  } else if (f.type === 'butt') {     // おしり プリプリ(ハート)
    for (let i = 0; i < 5; i++) { const q = Math.min(1, p * 1.3 - i * 0.1); if (q <= 0) continue; const x = cx - 12 + i * 6, y = cy - q * 20;
      const c = '#ff6aa8'; dot(ctx, x, y, c, 2); dot(ctx, x + 2, y, c, 2); dot(ctx, x + 1, y + 2, c, 2); }
  } else if (f.type === 'impact') {   // ぶつかった ほし
    for (let i = 0; i < 8; i++) { const an = i / 8 * 6.28, r = 4 + p * 12; line(ctx, cx + Math.cos(an) * r * .4, cy + 4 + Math.sin(an) * r * .4, cx + Math.cos(an) * r, cy + 4 + Math.sin(an) * r, i % 2 ? '#ffffff' : '#ff6060', 1); }
  }
}
export const _drawFx = (ctx, f) => drawFx(ctx, f);   // かくにん用

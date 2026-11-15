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
const SPOTS = [[[262, 112]], [[248, 100], [282, 138]]];     // みかたの たちいち(1人 / 2人)

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
    return { d, name, hp: d.hp, mp: d.mp, x: 105 + (i - (n - 1) / 2) * 66, y: opt.boss ? 132 : 118, size: opt.boss ? 56 : 32, flash: 0, alpha: 1, alive: true, lunge: 0, bob: Math.random() * 6 };
  });
  const ms = members(), spots = SPOTS[Math.min(ms.length, 2) - 1];
  const party = ms.map((m, i) => ({ ...m, x: spots[i][0], y: spots[i][1], flash: 0, lunge: 0, guard: false }));
  B = { enemies, party, boss: !!opt.boss, waits: [], shake: 0, fx: [], flashScreen: 0, btns: [], t: 0, turnOf: null };
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
  box.className = wide ? 'wide' : '';
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
    const pickAlly = (then, back) => { if (B.party.length === 1) then(B.party[0]); else targetButtons(B.party, then, back, 'だれを かいふく する? タップしてね'); };
    const main = () => setButtons([
      { html: 'たたかう', fn: () => pick(t => done({ type: 'attack', target: t }), main) },
      { html: 'じゅもん', fn: () => skills('じゅもん') },
      { html: 'わざ', fn: () => skills('わざ') },
      { html: 'どうぐ', fn: items },
      { html: 'にげる', off: !first || B.boss, fn: () => { if (B.boss) note('ボスからは にげられない!'.replace('ボス', '{ボス|ぼす}')); else if (!first) note('にげるは さいしょの ひとが えらぶよ'); else done({ type: 'run' }); } },
    ]);
    const skills = kind => {
      const list = st(m).skills.map(id => byId('skills', id)).filter(s => s && s.type === kind && s.effect !== 'ワープ');
      if (!list.length) { note(kind === 'じゅもん' ? 'じゅもんを つかえないよ' : 'まだ わざを おぼえていないよ'); return; }
      setButtons([...list.map(s => ({
        html: `${rubyHTML(s.name)}<small>MP ${s.mp}${s.elem && s.elem !== 'なし' ? ' ' + s.elem : ''}</small>`, off: m.s.mp < s.mp,
        fn: () => {
          if (m.s.mp < s.mp) { note('MPが たりないよ'); return; }
          if (s.effect === 'こうげき' && s.target === 'ひとり') pick(t => done({ type: 'skill', skill: s, target: t }), () => skills(kind));
          else if (s.effect === 'かいふく') pickAlly(t => done({ type: 'skill', skill: s, target: t }), () => skills(kind));
          else done({ type: 'skill', skill: s });
        } })), { html: 'もどる', fn: main }], true);
    };
    const items = () => {
      const ids = [...new Set(bag)].filter(id => byId('items', id)?.kind === 'かいふく');
      if (!ids.length) { note('つかえる どうぐが ないよ'); return; }
      setButtons([...ids.map(id => { const it = byId('items', id); return { html: `${rubyHTML(it.name)}<small>×${bagCount(id)}</small>`,
        fn: () => pickAlly(t => done({ type: 'item', item: it, target: t }), items) }; }),
        { html: 'もどる', fn: main }], true);
    };
    main();
  });
}

// ===== ダメージの けいさん =====
// わざ・たたかう(物理) = こうげき × いりょく ÷ 100 − あいての ぼうぎょ ÷ 2
// じゅもん(魔法)      = まりょく × いりょく ÷ 100 − あいての せいしん ÷ 2
// ぞくせい: あいての よわい ぞくせい なら 1.5倍、 つよい ぞくせい なら 半分
// user: {atk, mag}  target: {def, spr, weak, resist}
function calc(user, skill, target) {
  const magic = skill?.type === 'じゅもん';
  if (!magic && Math.random() < 0.05) return { miss: true };          // じゅもんは よけられない
  const pow = skill ? skill.pow : 100;
  let dmg = ((magic ? user.mag : user.atk) * pow / 100 - (magic ? target.spr : target.def) / 2) * rnd(0.85, 1.15);
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
function fxType(skill) { if (skill?.elem && FX_OF[skill.elem]) return FX_OF[skill.elem]; return skill?.type === 'じゅもん' ? 'magic' : 'slash'; }
const FX_TIME = { slash: 0.35, fire: 0.75, water: 0.7, thunder: 0.6, wind: 0.75, magic: 0.6, heal: 0.7, impact: 0.25 };
async function effect(type, targets) {
  sfx({ slash: 'slash', fire: 'fire', water: 'water', thunder: 'thunder', wind: 'wind', magic: 'magic', heal: 'heal', impact: 'hurt' }[type]);
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
  const two = B.party.length > 1;
  $('bstat').className = two ? 'two' : '';
  $('bstat').innerHTML = B.party.map(m => {
    const s = m.s, t = st(m);
    return `<div class="bmem${B.turnOf === m.key ? ' on' : ''}${s.hp <= 0 ? ' down' : ''}"><div class="bname">${rubyHTML(m.name)}${m.key === 'hero' ? ` <small>${rubyHTML('{レベル|れべる}')}${hero.lv}</small>` : ''}</div>` +
      `<div>HP ${s.hp}/${t.maxhp}${bar(s.hp, t.maxhp, s.hp <= t.maxhp / 4 ? '#ff5a5a' : '#6cdc5a')}</div>` +
      `<div>MP ${s.mp}/${t.maxmp}${bar(s.mp, t.maxmp, '#5ab0ff')}</div></div>`;
  }).join('');
}
async function lunge(who) { who.lunge = 0.3; await wait(0.3); }

async function hitEnemy(t, r) {
  if (r.miss) { sfx('miss'); await say(`${t.name}は ひらりと よけた!`); return; }
  if (r.crit) await say('すごい いちげき!', 0.7);
  sfx('hit'); t.flash = 0.4; t.hp -= r.dmg; popup(t.x, t.y - t.size - 8, r.dmg, r.mult > 1 ? 'weak' : '');
  if (r.mult > 1) await say('よわい ところを ついた!', 0.9);
  if (r.mult < 1) await say('あまり きいていない…', 0.9);
  await say(`${t.name}に ${r.dmg}の {ダメージ|だめーじ}!`);
  if (t.hp <= 0) { t.alive = false; sfx('defeat'); await say(`${t.name}を やっつけた!`); }
}
async function healMember(t, n) {
  await effect('heal', [t]);
  const revive = t.s.hp <= 0, got = heal(n, t); updateStat(); popup(t.x, t.y - 44, '+' + got, 'heal');
  await say(revive ? `${t.name}が おきあがった! HPが ${got} かいふくした!` : `${t.name}の HPが ${got} かいふくした!`);
}
async function memberAct(m, cmd) {
  const s0 = st(m);
  if (cmd.type === 'attack') {
    const t = cmd.target.alive ? cmd.target : alive()[0];
    await say(`${m.name}の こうげき!`, 0.6); await lunge(m);
    await effect('slash', [t]);
    await hitEnemy(t, calc(s0, null, t.d));
  } else if (cmd.type === 'skill') {
    const s = cmd.skill;
    m.s.mp -= s.mp; updateStat();
    await say(`${m.name}は 「${s.name}」を ${s.type === 'じゅもん' ? 'となえた' : 'つかった'}!`, 1.1);
    if (s.effect === 'かいふく') await healMember(cmd.target || m, s.pow + Math.floor(s0.mag / 2));   // かいふく = いりょく + まりょく ÷ 2
    else if (s.effect === 'まもる') { m.guard = true; await say(`${m.name}は みんなの まえに たった!`, 1); }
    else {
      if (s.type === 'わざ') await lunge(m);
      const targets = s.target === 'ぜんぶ' ? alive() : [cmd.target?.alive ? cmd.target : alive()[0]];
      await effect(fxType(s), targets);
      for (const t of targets) if (t.alive) await hitEnemy(t, calc(s0, s, t.d));
    }
  } else if (cmd.type === 'item') {
    const it = cmd.item;
    if (!bag.includes(it.id)) { await say(`${it.name}は もう ないよ…`); return; }
    bagRemove(it.id);
    await say(`${m.name}は ${it.name}を つかった!`, 1);
    await healMember(cmd.target || m, it.val);
  }
}
async function hurtMember(t, r) {
  if (r.miss) { sfx('miss'); await say(`${t.name}は ひらりと かわした!`); return; }
  if (r.crit) await say('いたい いちげき!', 0.7);
  sfx('hurt'); B.shake = 0.3; t.flash = 0.4;
  t.s.hp = Math.max(0, t.s.hp - r.dmg); updateStat(); popup(t.x, t.y - 44, r.dmg, 'hurt');
  await say(`${t.name}は ${r.dmg}の {ダメージ|だめーじ}を うけた!`);
  if (t.s.hp <= 0) await say(`${t.name}は たおれてしまった…`, 1.4);
}
async function enemyAct(e) {
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
    const r = calc(e.d, skill, allyTarget(t));
    if (t.guard && !r.miss) r.dmg = Math.max(1, Math.round(r.dmg / 2));   // かばうと はんぶん
    await hurtMember(t, r);
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
      const cmd = await chooseCommand(m, i === 0);
      if (cmd.type === 'run') { ran = true; break; }
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
    for (const id of u.learned) { const s = byId('skills', id); if (s) await say(`「${s.name}」を おぼえた!`, 1.8); }
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
  document.querySelectorAll('#battle .tgt, #battle .pop').forEach(el => el.remove());
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
  // 森の けしき
  ctx.fillStyle = '#163a1a'; ctx.fillRect(0, 0, 320, 200);
  ctx.fillStyle = '#1f4a22'; for (let x = -10; x < 330; x += 28) { ctx.beginPath(); ctx.arc(x + ox, 34 + (x % 3) * 6, 26, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#2a5e2c'; ctx.fillRect(0, 62 + oy, 320, 4);
  ctx.fillStyle = '#3f8f3a'; ctx.fillRect(0, 66 + oy, 320, 134);
  ctx.fillStyle = '#4a9e44'; ctx.beginPath(); ctx.ellipse(110 + ox, 120 + oy, 120, 22, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(266 + ox, 120 + oy, 44, 26, 0, 0, 7); ctx.fill();
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
  } else if (f.type === 'impact') {   // ぶつかった ほし
    for (let i = 0; i < 8; i++) { const an = i / 8 * 6.28, r = 4 + p * 12; line(ctx, cx + Math.cos(an) * r * .4, cy + 4 + Math.sin(an) * r * .4, cx + Math.cos(an) * r, cy + 4 + Math.sin(an) * r, i % 2 ? '#ffffff' : '#ff6060', 1); }
  }
}

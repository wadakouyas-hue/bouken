// 戦闘(ターン制のコマンド戦闘)
import { byId } from './data.js';
import { hero, bag, heroStats, gainExp, heal, bagCount, bagRemove, equipLook } from './hero.js';
import { heroSprite, enemySprite } from './sprites.js';
import { sfx, playBgm } from './audio.js';
import { rubyHTML } from './dialog.js';

const $ = id => document.getElementById(id);
export const battle = { on: false };
let B = null;

const rnd = (a, b) => a + Math.random() * (b - a);
const fill = s => s.replace(/@/g, hero.name);
const alive = () => B.enemies.filter(e => e.alive);
const HERO_X = 262, HERO_Y = 112;

// ===== はじめる(ids: てきの id の ならび) → 'win' / 'lose' / 'run' を返す =====
export function startBattle(ids) {
  const defs = ids.map(id => byId('enemies', id)).filter(Boolean);
  if (!defs.length) return Promise.resolve('win');
  const count = {}, seen = {};
  defs.forEach(d => { count[d.id] = (count[d.id] || 0) + 1; });
  const n = defs.length;
  const enemies = defs.map((d, i) => {
    let name = d.name;
    if (count[d.id] > 1) { seen[d.id] = (seen[d.id] || 0) + 1; name += ' ' + 'ABCDE'[seen[d.id] - 1]; }
    return { d, name, hp: d.hp, mp: d.mp, x: 105 + (i - (n - 1) / 2) * 66, y: 118, flash: 0, alpha: 1, alive: true, lunge: 0, bob: Math.random() * 6 };
  });
  B = { enemies, waits: [], shake: 0, heroLunge: 0, heroFlash: 0, sparkle: 0, sparkX: 0, sparkY: 0, btns: [], t: 0 };
  battle.on = true;
  $('battle').style.display = 'block';
  setButtons([]); showMsg('');
  updateStat();
  playBgm('battle');
  return new Promise(res => { B.done = res; run(); });
}

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
function targetButtons(onPick, back) {
  setButtons([{ html: 'もどる', fn: back }], true);
  $('bnote').innerHTML = rubyHTML('どの てきに する? てきを タップしてね'); $('bnote').style.display = 'block'; clearTimeout(noteTimer);
  for (const e of alive()) {
    const b = document.createElement('button');
    b.className = 'tgt'; b.dataset.b = B.btns.length;
    b.style.left = `calc(var(--u) * ${e.x - 22})`; b.style.top = `calc(var(--u) * ${e.y - 46})`;
    b.innerHTML = `<span class="arrow">▼</span><span class="tname">${rubyHTML(e.name)}</span>`;
    B.btns.push(() => { $('bnote').style.display = 'none'; onPick(e); });
    $('battle').appendChild(b);
  }
}

// ===== コマンドを えらぶ =====
function chooseCommand() {
  return new Promise(resolve => {
    const st = heroStats();
    const done = cmd => { setButtons([]); resolve(cmd); };
    const pick = (then, back) => { const a = alive(); if (a.length === 1) then(a[0]); else targetButtons(then, back); };
    const main = () => setButtons([
      { html: 'たたかう', fn: () => pick(t => done({ type: 'attack', target: t }), main) },
      { html: 'じゅもん', fn: () => skills('じゅもん') },
      { html: 'わざ', fn: () => skills('わざ') },
      { html: 'どうぐ', fn: items },
      { html: 'にげる', fn: () => done({ type: 'run' }) },
    ]);
    const skills = kind => {
      const list = st.skills.map(id => byId('skills', id)).filter(s => s && s.type === kind);
      if (!list.length) { note(kind === 'じゅもん' ? 'まだ じゅもんを おぼえていないよ' : 'まだ わざを おぼえていないよ'); return; }
      setButtons([...list.map(s => ({
        html: `${rubyHTML(s.name)}<small>MP ${s.mp}</small>`, off: hero.mp < s.mp,
        fn: () => {
          if (hero.mp < s.mp) { note('MPが たりないよ'); return; }
          if (s.effect === 'こうげき' && s.target === 'ひとり') pick(t => done({ type: 'skill', skill: s, target: t }), () => skills(kind));
          else done({ type: 'skill', skill: s });
        } })), { html: 'もどる', fn: main }], true);
    };
    const items = () => {
      const ids = [...new Set(bag)].filter(id => byId('items', id)?.kind === 'かいふく');
      if (!ids.length) { note('つかえる どうぐが ないよ'); return; }
      setButtons([...ids.map(id => { const it = byId('items', id); return { html: `${rubyHTML(it.name)}<small>×${bagCount(id)}</small>`, fn: () => done({ type: 'item', item: it }) }; }),
        { html: 'もどる', fn: main }], true);
    };
    main();
  });
}

// ===== ダメージの けいさん =====
// ダメージ = こうげき × いりょく ÷ 100 − あいての ぼうぎょ ÷ 2 (すこし ばらつく)
function calc(atk, pow, def) {
  if (Math.random() < 0.05) return { miss: true };
  let dmg = Math.max(1, Math.round((atk * pow / 100 - def / 2) * rnd(0.85, 1.15)));
  const crit = Math.random() < 1 / 16;
  if (crit) dmg = Math.round(dmg * 1.5) + 1;
  return { dmg, crit };
}
function popup(x, y, text, cls) {
  const el = document.createElement('div');
  el.className = 'pop ' + (cls || ''); el.textContent = text;
  el.style.left = `calc(var(--u) * ${x - 20})`; el.style.top = `calc(var(--u) * ${y})`;
  $('battle').appendChild(el); setTimeout(() => el.remove(), 900);
}
function updateStat() {
  const st = heroStats();
  const bar = (v, m, c) => `<span class="bar"><span style="width:${Math.max(0, Math.min(100, v / m * 100))}%;background:${c}"></span></span>`;
  $('bstat').innerHTML = `<div class="bname">${rubyHTML(hero.name)} <small>{L}${hero.lv}</small></div>`.replace('{L}', rubyHTML('{レベル|れべる}')) +
    `<div>HP ${hero.hp}/${st.maxhp}${bar(hero.hp, st.maxhp, hero.hp <= st.maxhp / 4 ? '#ff5a5a' : '#6cdc5a')}</div>` +
    `<div>MP ${hero.mp}/${st.maxmp}${bar(hero.mp, st.maxmp || 1, '#5ab0ff')}</div>`;
}
async function lunge(who) { if (who === 'hero') B.heroLunge = 0.3; else who.lunge = 0.3; await wait(0.3); }

async function hitEnemy(t, r) {
  if (r.miss) { sfx('miss'); await say(`${t.name}は ひらりと よけた!`); return; }
  if (r.crit) await say('すごい いちげき!', 0.7);
  sfx('hit'); t.flash = 0.4; t.hp -= r.dmg; popup(t.x, t.y - 40, r.dmg);
  await say(`${t.name}に ${r.dmg}の {ダメージ|だめーじ}!`);
  if (t.hp <= 0) { t.alive = false; sfx('defeat'); await say(`${t.name}を やっつけた!`); }
}
async function heroAct(cmd) {
  const st = heroStats();
  if (cmd.type === 'attack') {
    const t = cmd.target.alive ? cmd.target : alive()[0];
    await say('@の こうげき!', 0.6); await lunge('hero');
    await hitEnemy(t, calc(st.atk, 100, t.d.def));
  } else if (cmd.type === 'skill') {
    const s = cmd.skill;
    hero.mp -= s.mp; updateStat();
    await say(`@は 「${s.name}」を ${s.type === 'じゅもん' ? 'となえた' : 'つかった'}!`, 1.1);
    if (s.effect === 'かいふく') {
      sfx('heal'); B.sparkle = 0.6; B.sparkX = HERO_X; B.sparkY = HERO_Y;
      const n = heal(s.pow); updateStat(); popup(HERO_X, HERO_Y - 44, '+' + n, 'heal');
      await say(`@の HPが ${n} かいふくした!`);
    } else {
      sfx(s.type === 'じゅもん' ? 'magic' : 'swing'); await lunge('hero');
      const targets = s.target === 'ぜんぶ' ? alive() : [cmd.target?.alive ? cmd.target : alive()[0]];
      for (const t of targets) if (t.alive) await hitEnemy(t, calc(st.atk, s.pow, t.d.def));
    }
  } else if (cmd.type === 'item') {
    const it = cmd.item;
    bagRemove(it.id);
    await say(`@は ${it.name}を つかった!`, 1);
    sfx('heal'); B.sparkle = 0.6; B.sparkX = HERO_X; B.sparkY = HERO_Y;
    const n = heal(it.val); updateStat(); popup(HERO_X, HERO_Y - 44, '+' + n, 'heal');
    await say(`@の HPが ${n} かいふくした!`);
  }
}
async function enemyAct(e) {
  const st = heroStats();
  const sk = e.d.skills.map(id => byId('skills', id)).filter(s => s && e.mp >= s.mp);
  let pow = 100;
  if (sk.length && Math.random() < 0.35) {
    const s = sk[Math.random() * sk.length | 0];
    e.mp -= s.mp;
    await say(`${e.name}の ${s.name}!`, 0.8);
    if (s.effect === 'かいふく') { sfx('heal'); e.hp = Math.min(e.d.hp, e.hp + s.pow); await say(`${e.name}は げんきに なった!`); return; }
    pow = s.pow;
  } else await say(`${e.name}の こうげき!`, 0.6);
  await lunge(e);
  const r = calc(e.d.atk, pow, st.def);
  if (r.miss) { sfx('miss'); await say('@は ひらりと かわした!'); return; }
  if (r.crit) await say('いたい いちげき!', 0.7);
  sfx('hurt'); B.shake = 0.3; B.heroFlash = 0.4;
  hero.hp = Math.max(0, hero.hp - r.dmg); updateStat(); popup(HERO_X, HERO_Y - 44, r.dmg, 'hurt');
  await say(`@は ${r.dmg}の {ダメージ|だめーじ}を うけた!`);
}

// ===== 戦闘の ながれ =====
async function run() {
  const first = B.enemies[0].d.name;
  await say(B.enemies.length === 1 ? `${first}が あらわれた!` : `まものたちが あらわれた!`);
  if (!battle.taught) { battle.taught = true; await say('{ボタン|ぼたん}を おして たたかおう!'); }
  for (;;) {
    const cmd = await chooseCommand();
    const actors = [];
    if (cmd.type === 'run') {
      if (Math.random() < 0.8) { sfx('run'); await say('@は にげだした!'); return finish('run'); }
      await say('にげられなかった!');
    } else actors.push({ who: 'hero', spd: heroStats().spd * rnd(0.8, 1.2), cmd });
    for (const e of alive()) actors.push({ who: e, spd: e.d.spd * rnd(0.8, 1.2) });
    actors.sort((a, b) => b.spd - a.spd);
    for (const a of actors) {
      if (a.who === 'hero') await heroAct(a.cmd); else if (a.who.alive) await enemyAct(a.who);
      if (!alive().length) return victory();
      if (hero.hp <= 0) return defeat();
    }
  }
}
async function victory() {
  playBgm(''); sfx('win');
  const exp = B.enemies.reduce((s, e) => s + e.d.exp, 0);
  if (B.enemies.length > 1) await say('まものを ぜんぶ やっつけた!', 1.6); else await wait(1.0);
  await say(`けいけんちを ${exp} もらった!`);
  for (const up of gainExp(exp)) {
    sfx('lvup'); updateStat();
    await say(`@の {レベル|れべる}が ${up.lv}に あがった!`, 2.2);
    for (const id of up.learned) { const s = byId('skills', id); if (s) await say(`「${s.name}」を おぼえた!`, 1.8); }
  }
  finish('win');
}
async function defeat() {
  playBgm(''); sfx('lose');
  await say('@は たおれてしまった…', 2.5);
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
  B.shake = Math.max(0, B.shake - dt); B.heroFlash = Math.max(0, B.heroFlash - dt);
  B.heroLunge = Math.max(0, B.heroLunge - dt); B.sparkle = Math.max(0, B.sparkle - dt);
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
  ctx.beginPath(); ctx.ellipse(HERO_X + ox, HERO_Y + 4 + oy, 36, 10, 0, 0, 7); ctx.fill();
  // てき
  for (const e of B.enemies) {
    if (e.alpha <= 0) continue;
    if (e.flash > 0 && Math.floor(e.flash * 20) % 2) continue;    // ちかちか
    const lx = e.lunge > 0 ? Math.sin((1 - e.lunge / 0.3) * Math.PI) * 14 : 0;
    const by = Math.round(Math.sin(B.t * 3 + e.bob) * 1.5);
    ctx.globalAlpha = e.alpha;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(e.x + lx + ox, e.y + oy, 14, 4, 0, 0, 7); ctx.fill();
    ctx.drawImage(enemySprite(e.d.look), Math.round(e.x - 16 + lx + ox), Math.round(e.y - 32 + by + oy), 32, 32);
    ctx.globalAlpha = 1;
  }
  // じぶん
  if (!(B.heroFlash > 0 && Math.floor(B.heroFlash * 20) % 2)) {
    const lx = B.heroLunge > 0 ? -Math.sin((1 - B.heroLunge / 0.3) * Math.PI) * 18 : 0;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(HERO_X + lx, HERO_Y, 10, 3, 0, 0, 7); ctx.fill();
    ctx.drawImage(heroSprite('left', B.heroLunge > 0 ? 1 : 0, equipLook()), Math.round(HERO_X - 12 + lx), HERO_Y - 31, 24, 32);
  }
  // きらきら
  if (B.sparkle > 0) {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + B.t * 4, r = 10 + (0.6 - B.sparkle) * 30; ctx.fillRect(Math.round(B.sparkX + Math.cos(a) * r), Math.round(B.sparkY - 16 + Math.sin(a) * r), 2, 2); }
  }
}

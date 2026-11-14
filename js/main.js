// ぼうけんの たび — 本体
import { T, BLOCK, tileImg } from './tiles.js';
import { charSprite, SPR, enemySprite, heroSprite } from './sprites.js';
import { dlg, openDialog as openDlg, advance as advanceDlg, updateDialog, rubyHTML, hooks } from './dialog.js';
import { initAudio, playBgm, sfx, getLevel, setLevel } from './audio.js';
import { ready, dataErrors, byId, DATA } from './data.js';
import { hero, bag, heroStats, healFull, equipLook, equipBest } from './hero.js';
import { menu, openMenu, menuTap } from './menu.js';
import { battle, startBattle, updateBattle, drawBattle, battleTap } from './battle.js';
import { nameEntry, askName, nameKey } from './nameentry.js';
import village from '../maps/village.js';
import house from '../maps/house.js';
import forest from '../maps/forest.js';
import { readSave, writeSave, clearSave, toCode, fromCode } from './save.js';

// ===== 基本設定 =====
const VW = 320, VH = 200;                // ゲーム内部の解像度
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const stage = document.getElementById('stage');
const $ = id => document.getElementById(id);
let S = 4;                               // 拡大倍率(Fire HD 8 の全画面で4倍)

function resize() {
  const r = Math.min(innerWidth / VW, innerHeight / VH);
  S = r >= 1 ? Math.floor(r) : r;        // ドットがにじまないよう整数倍
  stage.style.width = VW * S + 'px'; stage.style.height = VH * S + 'px';
  stage.style.setProperty('--u', S + 'px');
}
addEventListener('resize', resize); document.addEventListener('fullscreenchange', resize); resize();

// HTMLに書いた {漢字|かんじ} を ふりがなにする
document.querySelectorAll('.ruby').forEach(el => { el.innerHTML = rubyHTML(el.textContent); });

// ===== マップ =====
const at = (tx, ty) => ({ x: tx * T + 8, y: ty * T + 14 });
const MAPS = { village, house, forest };
for (const [name, m] of Object.entries(MAPS)) {
  m.w = m.rows[0].length; m.h = m.rows.length;
  m.objs = m.objs.map(o => {
    const p = at(o.x, o.y);
    const r = { dir: 'down', ...o, key: `${name}:${o.x},${o.y}`, ...p };   // key はセーブで使う名札
    if (o.kind === 'enemy') Object.assign(r, { party: o.party.split(/\s+/), hx: p.x, hy: p.y, tx: p.x, ty: p.y, timer: 0, cool: 0 });
    return r;
  });
}
let cur = village;
const mapName = () => Object.keys(MAPS).find(k => MAPS[k] === cur);
function resetEnemies(m) { for (const o of m.objs) if (o.kind === 'enemy') Object.assign(o, { gone: false, x: o.hx, y: o.hy, tx: o.hx, ty: o.hy, cool: 0, timer: 0, chase: false, notice: 0 }); }

// ===== キャラ =====
const START = { map: 'village', ...at(5, 8) };
const player = { x: START.x, y: START.y, dir: 'down', anim: 0, moving: false };
const live = () => cur.objs.filter(o => !o.gone);

// ===== 当たり判定 =====
function tileSolid(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  return tx < 0 || ty < 0 || tx >= cur.w || ty >= cur.h || BLOCK.has(cur.rows[ty][tx]);
}
function solidAt(x, y) {
  if (tileSolid(x, y)) return true;
  for (const o of live()) {
    if (o.kind === 'look' || o.kind === 'item' || o.kind === 'enemy') continue;  // 家具はタイルで止まる/落ちている物は通れる/てきは ぶつかると戦闘
    if (x > o.x - 6 && x < o.x + 6 && y > o.y - 6 && y < o.y + 1) return true;
  }
  return false;
}
const hits = (x, y) => solidAt(x - 5, y - 5) || solidAt(x + 5, y - 5) || solidAt(x - 5, y - 1) || solidAt(x + 5, y - 1);
const enemyBlocked = (x, y) => tileSolid(x - 5, y - 5) || tileSolid(x + 5, y - 5) || tileSolid(x - 5, y - 1) || tileSolid(x + 5, y - 1) || exitAt(x, y);
// 出入り口にふれたか
function exitAt(x, y) {
  for (const e of cur.exits) {
    const x0 = e.x * T, y0 = e.y * T, x1 = x0 + (e.w || 1) * T, y1 = y0 + (e.h || 1) * T;
    if (x + 5 > x0 && x - 5 < x1 && y - 1 > y0 && y - 5 < y1) return e;
  }
  return null;
}

// ===== 場面の切り替え(暗くなって → まっくらの間に fn → 明るくなって → after) =====
const FADE = 0.25;
const trans = { on: false, t: 0, fn: null, after: null };
function fadeTo(fn, after) { stickRelease(); trans.on = true; trans.t = 0; trans.fn = fn; trans.after = after || null; }
function goExit(e) {
  sfx('warp');
  fadeTo(() => {
    cur = MAPS[e.to]; resetEnemies(cur);
    Object.assign(player, at(e.at[0], e.at[1]));
    player.dir = e.dir || player.dir; player.anim = 0; player.moving = false;
    updateCamera(); save();
    playBgm(cur.bgm || 'village');
  });
}
function updateTrans(dt) {
  const before = trans.t;
  trans.t += dt;
  if (before < FADE && trans.t >= FADE && trans.fn) { const f = trans.fn; trans.fn = null; f(); }
  if (trans.t >= FADE * 2) { trans.on = false; const a = trans.after; trans.after = null; if (a) a(); }
}
const fadeAlpha = () => !trans.on ? 0 : trans.t < FADE ? trans.t / FADE : Math.max(0, 2 - trans.t / FADE);

// ===== 戦闘へ =====
function encounter(o) {
  sfx('encounter');
  fadeTo(() => {
    startBattle(o.party).then(result => fadeTo(() => {
      if (result === 'win') o.gone = true;
      if (result === 'run') o.cool = 3;          // にげたあと 少しの間は ぶつからない
      if (result === 'lose') {                   // まけたら 村で 目が さめる
        cur = MAPS[START.map]; Object.values(MAPS).forEach(resetEnemies);
        Object.assign(player, { x: START.x, y: START.y, dir: 'down' });
        healFull();
      }
      updateCamera(); save();
      playBgm(cur.bgm || 'village');
    }, result === 'lose' ? () => openDialog('', ['……はっ!', '{目|め}が さめた。 むらの ひとが はこんで くれたみたい。', '@の HPが ぜんぶ もどった!']) : null));
  });
}

// ===== 入力:擬似スティック =====
const stick = { id: null, bx: 0, by: 0, x: 0, y: 0, vx: 0, vy: 0 };
const sbase = $('sbase'), sknob = $('sknob');
function local(e) { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
function stickShow(on) { sbase.style.display = sknob.style.display = on ? 'block' : 'none'; }
function stickRelease() { stick.id = null; stick.vx = stick.vy = 0; stickShow(false); }
function stickMove(p) {
  const R = S * 14; let dx = p.x - stick.bx, dy = p.y - stick.by, len = Math.hypot(dx, dy);
  if (len > R) { stick.bx = p.x - dx / len * R; stick.by = p.y - dy / len * R; dx = p.x - stick.bx; dy = p.y - stick.by; len = R; } // 指について土台も動く
  const mag = len / R;
  if (mag < 0.18) { stick.vx = stick.vy = 0; } else { stick.vx = dx / len * mag; stick.vy = dy / len * mag; }
  stick.x = p.x; stick.y = p.y;
  sbase.style.left = stick.bx + 'px'; sbase.style.top = stick.by + 'px';
  sknob.style.left = stick.x + 'px'; sknob.style.top = stick.y + 'px';
}
// セリフの @ は 主人公の なまえ になる
function openDialog(name, lines, onEnd) { stickRelease(); openDlg(name, lines.map(l => l.replace(/@/g, hero.name)), onEnd); }

let started = false, near = null;
const cam = { x: 0, y: 0 };
const hold = { timer: null };            // タイトル右上の長押し
stage.addEventListener('pointerdown', e => {
  if (e.target.closest('#parent')) return;            // 保護者メニューは ふつうに操作できるように
  e.preventDefault();
  if (parentOpen()) return;
  if (!started) {
    if (e.target.closest('#pcorner')) { holdStart(); return; }
    start(); return;
  }
  if (nameEntry.open) { const b = e.target.closest('#names button'); if (b) { sfx('next'); nameKey(b.dataset.k); } return; }
  if (battle.on) { const b = e.target.closest('[data-b]'); battleTap(b ? +b.dataset.b : undefined); return; }
  if (menu.open) { const b = e.target.closest('[data-m]'); if (b) menuTap(b.dataset.m); return; }
  if (trans.on) return;
  if (dlg.open) { advance(); return; }
  if (e.target.closest('#menubtn')) { openFieldMenu(); return; }
  if (e.target.closest('#act') || e.target.closest('#actbtn')) { if (near) interact(near); return; }
  const p = local(e), wx = p.x / S + cam.x, wy = p.y / S + cam.y;
  if (near && Math.abs(wx - near.x) < 10 && wy > near.y - 18 && wy < near.y + 3) { interact(near); return; } // 近くの人や物を直接タップ
  if (stick.id !== null) return;
  stick.id = e.pointerId; stick.bx = p.x; stick.by = p.y; stickMove(p); stickShow(true);
});
addEventListener('pointermove', e => { if (e.pointerId === stick.id) stickMove(local(e)); });
addEventListener('pointerup', e => { if (e.pointerId === stick.id) stickRelease(); holdCancel(); }); // 3秒より前に離したら やめる
addEventListener('pointercancel', e => { if (e.pointerId === stick.id) stickRelease(); holdCancel(); });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', e => e.preventDefault());

// キーボード(Macで確認する用)
const keys = {};
addEventListener('keydown', e => {
  if (parentOpen()) return;              // 保護者メニューで文字を打っているとき
  const ok = e.key === ' ' || e.key === 'Enter' || e.key === 'z';
  if (nameEntry.open) { if (e.key === 'Backspace') nameKey('#del'); else if (e.key === 'Enter') nameKey('#ok'); return; }
  if (battle.on) { if (/^[1-9]$/.test(e.key)) battleTap(+e.key - 1); else if (ok) battleTap(); return; }
  if (e.key === 'm' || e.key === 'Escape') { if (menu.open) menuTap('#close'); else if (started && hero.name && !dlg.open && !trans.on) openFieldMenu(); return; }
  if (menu.open) return;
  keys[e.key] = true;
  if (ok) {
    if (!started) start(); else if (trans.on) return; else if (dlg.open) advance(); else if (near) interact(near);
  }
});
addEventListener('keyup', e => { keys[e.key] = false; });

function openFieldMenu() { stickRelease(); sfx('ok'); for (const k in keys) keys[k] = false; openMenu(() => { chipText = ''; save(); }); }

// ===== 調べる・話す・ひろう =====
let talkedOnce = false;
function interact(o) {
  talkedOnce = true; $('hint2').style.display = 'none';
  sfx('ok');
  if (o.kind === 'npc') {
    const dx = player.x - o.x, dy = player.y - o.y;
    o.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const lines = o.ifHave && bag.includes(o.ifHave.item) ? o.ifHave.lines : o.lines;
    openDialog(o.name, lines, o.heal ? () => healAt(o) : null);
    return;
  }
  if (o.taken) { openDialog(o.name, o.after || ['もう なにも ない。']); return; }
  if (o.give) {
    o.taken = true; bag.push(o.give);
    markTaken(o);
    save();
  }
  openDialog(o.name, o.lines);
}
// HP・MPを ぜんぶ もどしてくれる人
function healAt(o) {
  const st = heroStats();
  if (hero.hp >= st.maxhp && hero.mp >= st.maxmp) return;
  healFull(); sfx('heal'); save();
  openDialog(o.name, ['つかれた かおを しているね。 すこし やすんで いきな。', '@の {体|からだ}が げんきに なった!']);
}
function advance() { sfx('next'); advanceDlg(); }
hooks.onType = () => sfx('type');
hooks.onJingle = () => sfx('get');
function markTaken(o) {
  o.taken = true;
  if (o.kind === 'item') o.gone = true;
  if (o.kind === 'chest') o.label = 'しらべる';
}

// ===== セーブ(自動) =====
function allObjs() { return Object.values(MAPS).flatMap(m => m.objs); }
function save() {
  if (!started || !hero.name) return;
  writeSave({
    v: 1, map: mapName(),
    x: Math.round(player.x), y: Math.round(player.y), dir: player.dir,
    bag: [...bag], done: allObjs().filter(o => o.taken).map(o => o.key), talked: talkedOnce,
    hero: { ...hero },
  });
}
function load(d) {
  cur = MAPS[d.map] || village;
  Object.assign(player, { x: d.x, y: d.y, dir: d.dir });
  if (!MAPS[d.map] || hits(player.x, player.y) || exitAt(player.x, player.y)) {  // マップを作り直して 入れない場所になっていたら 村の最初の場所へ
    cur = MAPS[START.map]; Object.assign(player, { x: START.x, y: START.y });
  }
  // 持ち物: むかしの セーブは 名前で 入っているので id に なおす
  for (const b of d.bag) { const it = byId('items', b) || DATA.items.find(i => i.name === b); bag.push(it ? it.id : b); }
  const done = new Set(d.done);
  for (const o of allObjs()) if (done.has(o.key)) markTaken(o);
  talkedOnce = d.talked;
  if (d.hero) Object.assign(hero, d.hero);
  if (!d.hero || !d.hero.equip) { hero.equip = { ぶき: null, よろい: null }; equipBest(); }   // 自動そうびの ころの セーブ
  const st = heroStats();
  hero.hp = Math.min(hero.hp, st.maxhp); hero.mp = Math.min(hero.mp, st.maxmp);
  updateCamera();
}
let autoT = 0;
addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

// ===== はじめる =====
let hintPhase = 0, walked = 0;
const saved = readSave();
if (saved) $('taptxt').innerHTML = rubyHTML('{タップ|たっぷ}して つづきから');
const boot = ready.then(() => {
  for (const [name, m] of Object.entries(MAPS)) for (const o of m.objs) if (o.kind === 'enemy')
    for (const id of o.party) if (!byId('enemies', id)) dataErrors.push(`maps/${name}.js の てき「${id}」が enemies.csv に ありません。`);
  if (saved) load(saved);
  if (dataErrors.length) {
    const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const list = dataErrors.slice(0, 6).map(esc).join('<br>') + (dataErrors.length > 6 ? `<br>(ほかに ${dataErrors.length - 6}件)` : '');
    $('dataerr').innerHTML = '<b>data フォルダの CSV に まちがいがあります(ゲームは そのまま遊べます)</b><br>' + list;
    $('dataerr').style.display = 'block';
  }
});
function start() {
  if (started) return;
  started = true; $('title').style.display = 'none';
  initAudio();
  const el = document.documentElement;
  try { const p = el.requestFullscreen && el.requestFullscreen({ navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (_) {}
  try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => {}); } catch (_) {}
  boot.then(async () => {
    if (!hero.name) hero.name = await askName();
    if (hero.hp < 0) healFull();
    playBgm(cur.bgm || 'village');
    if (saved) { hintPhase = 2; save(); return; }   // つづきからは すぐ遊べる
    save();
    setTimeout(() => openDialog('', ['{目|め}が さめた。 いい {天気|てんき}だ!', 'どこへ いこうかな?'], () => { hintPhase = 1; $('hint1').style.display = 'block'; }), 300);
  });
}

// ===== 保護者メニュー =====
const parentOpen = () => $('parent').style.display === 'flex';
function holdStart() {
  holdCancel();
  $('pcorner').classList.add('holding');
  hold.timer = setTimeout(() => { hold.timer = null; $('pcorner').classList.remove('holding'); openParent(); }, 3000);
}
function holdCancel() { if (hold.timer) { clearTimeout(hold.timer); hold.timer = null; } $('pcorner').classList.remove('holding'); }
let armed = null;                        // 「もう一度押してください」の確認待ち
function pmsg(t, err) { $('pMsg').textContent = t; $('pMsg').className = err ? 'err' : ''; }
function openParent() { armed = null; pmsg(''); $('pCode').value = ''; $('parent').style.display = 'flex'; }
$('pClose').addEventListener('click', () => { $('parent').style.display = 'none'; });
const soundBtns = [...document.querySelectorAll('#pSound button')];
const showLevel = () => soundBtns.forEach(b => b.classList.toggle('on', +b.dataset.l === getLevel()));
soundBtns.forEach(b => b.addEventListener('click', () => { setLevel(+b.dataset.l); showLevel(); }));
showLevel();
$('pExport').addEventListener('click', () => {
  armed = null;
  const d = readSave();
  if (!d) { pmsg('まだセーブがありません。少し遊ぶと自動でセーブされます。', true); return; }
  const code = toCode(d), ta = $('pCode');
  ta.value = code;
  const fallback = () => { ta.focus(); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    pmsg(ok ? 'コピーしました。LINEやメモに貼って保存してください。' : '上の文字をすべて選んでコピーし、LINEやメモに保存してください。'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(() => pmsg('コピーしました。LINEやメモに貼って保存してください。'), fallback);
  else fallback();
});
$('pImport').addEventListener('click', () => {
  const r = fromCode($('pCode').value);
  if (r.error) { armed = null; pmsg(r.error, true); return; }
  if (readSave() && armed !== 'import') { armed = 'import'; pmsg('今のセーブは上書きされます。よければ、もう一度「読み込む」を押してください。', true); return; }
  writeSave(r.data); location.reload();
});
$('pNew').addEventListener('click', () => {
  if (armed !== 'new') { armed = 'new'; pmsg('今のセーブが消えます。(先にセーブコードを取っておくと安心です)よければ、もう一度「はじめから」を押してください。', true); return; }
  clearSave(); location.reload();
});

// ===== カメラ(マップが画面より小さいときは まん中に) =====
function updateCamera() {
  const mw = cur.w * T, mh = cur.h * T;
  cam.x = mw <= VW ? Math.round((mw - VW) / 2) : Math.round(Math.max(0, Math.min(mw - VW, player.x - VW / 2)));
  cam.y = mh <= VH ? Math.round((mh - VH) / 2) : Math.round(Math.max(0, Math.min(mh - VH, player.y - 8 - VH / 2)));
}

// ===== 毎フレームの更新 =====
let tm = 0, chipText = '';
function updateChip() {
  const show = started && hero.name && !battle.on && !nameEntry.open && !menu.open;
  $('hpchip').style.display = show ? 'block' : 'none';
  $('menubtn').style.display = show && !dlg.open ? 'block' : 'none';
  if (!show) return;
  const st = heroStats(), t = `${hero.name}  HP ${hero.hp}/${st.maxhp}  MP ${hero.mp}/${st.maxmp}`;
  if (t !== chipText) { chipText = t; $('hpchip').textContent = t; $('hpchip').classList.toggle('low', hero.hp <= st.maxhp / 4); }
}
function update(dt) {
  tm += dt;
  if (trans.on) updateTrans(dt);
  updateChip();
  if (battle.on) { updateBattle(dt); $('act').style.display = 'none'; return; }
  const hideAct = () => { $('act').style.display = 'none'; $('actbtn').classList.remove('show'); };
  if (trans.on || nameEntry.open || menu.open) { hideAct(); return; }
  if (dlg.open) { hideAct(); updateDialog(dt); return; }
  if (!started || !hero.name) return;
  autoT += dt; if (autoT > 30) { autoT = 0; save(); }   // 30秒ごとに自動セーブ
  // 入力
  let vx = stick.vx, vy = stick.vy;
  const kx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
  const ky = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
  if (kx || ky) { const l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l; }
  const mag = Math.hypot(vx, vy);
  player.moving = mag > 0;
  if (player.moving) {
    const sp = 62 * dt;
    player.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
    const nx = player.x + vx * sp;
    let ex = exitAt(nx, player.y); if (ex) { goExit(ex); return; }
    if (!hits(nx, player.y)) player.x = nx;
    const ny = player.y + vy * sp;
    ex = exitAt(player.x, ny); if (ex) { goExit(ex); return; }
    if (!hits(player.x, ny)) player.y = ny;
    player.anim += dt * mag;
    walked += sp * mag;
    if (hintPhase === 1 && walked > 40) { hintPhase = 2; $('hint1').style.display = 'none'; }
  } else player.anim = 0;
  // ときどき向きを変える人
  for (const o of cur.objs) if (o.wander && Math.random() < dt * .4) o.dir = ['down', 'left', 'right'][Math.random() * 3 | 0];
  // てきは うろうろ歩く。 ぶつかったら 戦闘
  for (const o of live()) {
    if (o.kind !== 'enemy') continue;
    o.cool = Math.max(0, o.cool - dt); o.notice = Math.max(0, (o.notice || 0) - dt);
    // うごき: うろうろ / ゆっくり(おいかける) / はやい(主人公と おなじ はやさで おいかける)
    const mv = byId('enemies', o.party[0])?.move || 'うろうろ', dp = Math.hypot(player.x - o.x, player.y - o.y);
    o.giveup = Math.max(0, (o.giveup || 0) - dt);
    if (mv !== 'うろうろ' && !o.cool && !o.giveup) {
      if (!o.chase && dp < 80) { o.chase = true; o.notice = 0.7; }                         // 気づいた!
      else if (o.chase && (dp > 140 || Math.hypot(o.x - o.hx, o.y - o.hy) > 220)) { o.chase = false; o.timer = 0; }   // あきらめる
    } else o.chase = false;
    o.timer -= dt;
    if (o.chase) { o.tx = player.x; o.ty = player.y; }
    else if (o.timer <= 0) { o.timer = 1.5 + Math.random() * 2; const a = Math.random() * 6.28, r = Math.random() * 24; o.tx = o.hx + Math.cos(a) * r; o.ty = o.hy + Math.sin(a) * r; }
    const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy);
    o.moving = d > 1;
    if (o.moving && !(o.notice > 0.3)) {
      const speed = !o.chase ? 18 : mv === 'はやい' ? 62 : 28;
      const s = Math.min(d, speed * dt), nx = o.x + dx / d * s, ny = o.y + dy / d * s;
      const ox = o.x, oy = o.y;
      if (!enemyBlocked(nx, o.y)) o.x = nx; else o.timer = 0;
      if (!enemyBlocked(o.x, ny)) o.y = ny; else o.timer = 0;
      // 木などに ひっかかって 進めないときは、少しの間 おいかけるのを やめる
      o.stuck = Math.hypot(o.x - ox, o.y - oy) < s * 0.3 ? (o.stuck || 0) + dt : 0;
      if (o.chase && o.stuck > 0.5) { o.chase = false; o.giveup = 2; o.timer = 0; o.stuck = 0; }
    }
    if (!o.cool && Math.hypot(o.x - player.x, o.y - player.y) < 12) { encounter(o); return; }
  }
  updateCamera();
  // 近くにあるものを探す
  near = null; let best = 24;
  for (const o of live()) { if (o.kind === 'enemy') continue; const d = Math.hypot(o.x - player.x, o.y - player.y); if (d < best) { best = d; near = o; } }
  const act = $('act');
  $('actbtn').classList.toggle('show', !!near);
  if (near) { $('actbtnlbl').textContent = near.label; }
  if (near) {
    act.style.display = 'block';
    act.style.left = (near.x - cam.x) * S + 'px';
    act.style.top = Math.max(0, (near.y - 36 - cam.y) * S) + 'px';
    $('actlbl').textContent = near.label;
    if (!talkedOnce && hintPhase >= 2) $('hint2').style.display = 'block';
  } else { act.style.display = 'none'; $('hint2').style.display = 'none'; }
}

// ===== 描画 =====
function draw() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
  if (battle.on) drawBattle(ctx); else drawField();
  const a = fadeAlpha();
  if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, VW, VH); }
}
function drawField() {
  const x0 = Math.max(0, Math.floor(cam.x / T)), y0 = Math.max(0, Math.floor(cam.y / T));
  for (let ty = y0; ty <= y0 + Math.ceil(VH / T); ty++) for (let tx = x0; tx <= x0 + Math.ceil(VW / T); tx++) {
    if (tx >= cur.w || ty >= cur.h) continue;
    ctx.drawImage(tileImg(cur.rows[ty][tx], tx, ty, tm), tx * T - cam.x, ty * T - cam.y);
  }
  const ents = [player, ...live().filter(o => o.kind !== 'look')].sort((a, b) => a.y - b.y);
  for (const e of ents) {
    const sx = Math.round(e.x - cam.x), sy = Math.round(e.y - cam.y);
    if (e.kind === 'enemy' && e.cool > 0 && Math.floor(tm * 10) % 2) continue;   // にげたあとは ちかちか
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(sx - 4, sy - 1, 8, 2); ctx.fillRect(sx - 3, sy - 2, 6, 4);   // 影
    if (e.kind === 'enemy') {
      const hop = e.moving ? Math.round(Math.abs(Math.sin(tm * 8 + e.hx)) * -2) : 0;
      ctx.drawImage(enemySprite(byId('enemies', e.party[0])?.look), sx - 8, sy - 16 + hop);
      if (e.notice > 0) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(sx - 1, sy - 26, 3, 6); ctx.fillRect(sx - 1, sy - 19, 3, 2); ctx.fillStyle = '#2a1e1a'; ctx.fillRect(sx, sy - 25, 1, 4); ctx.fillRect(sx, sy - 19, 1, 1); }  // 「!」
      continue;
    }
    let img;
    if (e === player) img = heroSprite(e.dir, e.moving ? Math.floor(e.anim * 9) % 4 : 0, equipLook());
    else if (e.kind === 'npc') img = charSprite(e.pal, e.dir, 0);
    else if (e.kind === 'sign') img = SPR.sign;
    else if (e.kind === 'item') img = SPR.potion;
    else img = e.taken ? SPR.chestOpen : SPR.chest;
    ctx.drawImage(img, sx - 6, sy - 15);
    if ((e.kind === 'chest' && !e.taken || e.kind === 'item') && (tm % 1.4) < .35) { ctx.fillStyle = '#fff'; ctx.fillRect(sx + 3, sy - 14, 1, 3); ctx.fillRect(sx + 2, sy - 13, 3, 1); } // きらっ
  }
}

// 確認用(Macのブラウザの開発ツールから bouken.player などを見られる)
globalThis.bouken = { player, bag, hero, battle, get map() { return mapName(); }, get near() { return near; }, get objs() { return cur.objs; } };

let last = performance.now();
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
updateCamera();
requestAnimationFrame(loop);

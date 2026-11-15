// ぼうけんの たび — 本体
import { T, BLOCK, tileImg } from './tiles.js';
import { charSprite, SPR, enemySprite, heroSprite, eyeColor, DECO } from './sprites.js';
import { paint, openPaint, paintTap, paintAt } from './paint.js';
import { clock, tick, toMorning, darkness, isNight, hourNow, timeWords, dayLen } from './clock.js';
import { dlg, openDialog as openDlg, advance as advanceDlg, updateDialog, rubyHTML, hooks } from './dialog.js';
import { initAudio, playBgm, sfx, getLevel, setLevel } from './audio.js';
import { ready, dataErrors, byId, DATA } from './data.js';
import { hero, bag, heroStats, healFull, equipLook, equipBest, START_GOLD, members, joinAlly } from './hero.js';
import { shop, openShop, shopTap } from './shop.js';
import { menu, openMenu, menuTap } from './menu.js';
import { room, furnImg, furnLook, furnSize, furnWork, isFlat, solidCells, canPlace } from './furniture.js';
import { deco, openDeco, decoTile, decoTap, drawDeco } from './deco.js';
import { battle, startBattle, updateBattle, drawBattle, battleTap } from './battle.js';
import { nameEntry, askName, nameKey } from './nameentry.js';
import village from '../maps/village.js';
import house from '../maps/house.js';
import forest from '../maps/forest.js';
import shopMap from '../maps/shop.js';
import home from '../maps/home.js';
import deep from '../maps/deep.js';
import hill from '../maps/hill.js';
import mid1 from '../maps/mid1.js';
import mid2 from '../maps/mid2.js';
import town2 from '../maps/town2.js';
import cafe from '../maps/cafe.js';
import shop2 from '../maps/shop2.js';
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
const MAPS = { village, house, forest, shop: shopMap, home, deep, hill, mid1, mid2, town2, cafe, shop2 };
for (const [name, m] of Object.entries(MAPS)) {
  m.w = m.rows[0].length; m.h = m.rows.length;
  m.objs = m.objs.map(o => {
    const p = at(o.x, o.y);
    const r = { dir: 'down', ...o, key: `${name}:${o.x},${o.y}`, ...p };   // key はセーブで使う名札
    if (o.kind === 'enemy') Object.assign(r, { gone: !!o.night, party: o.party.split(/\s+/), hx: p.x, hy: p.y, tx: p.x, ty: p.y, timer: 0, cool: 0 });
    return r;
  });
  m.base = m.objs;   // かぐ いがいの 人や物
}
let cur = home;
const mapName = () => Object.keys(MAPS).find(k => MAPS[k] === cur);
function resetEnemies(m) {
  for (const o of m.objs) {
    if (o.night) { Object.assign(o, { gone: true, spawnT: isNight() ? 1 + Math.random() * 6 : null }); continue; }
    if (o.kind === 'enemy') Object.assign(o, { gone: false, x: o.hx, y: o.hy, tx: o.hx, ty: o.hy, cool: 0, timer: 0, chase: false, notice: 0 });
    if (o.again) { o.taken = false; o.gone = false; }   // また おちている もの(きの えだ など)
  }
}

// ===== ひると よる =====
// そとの よるは よるの きょく
const bgmFor = () => cur.quiet && !flags.has(cur.quiet) ? 'silence' : cur.outside && isNight() ? 'night' : cur.bgm || 'village';   // quiet: おとを ぬすまれた まち
let wasNight = false;
// よるに なった / あさに なった
function nightChanged() {
  wasNight = isNight();
  for (const m of Object.values(MAPS)) for (const o of m.objs) if (o.night) { o.gone = true; o.spawnT = wasNight ? 1 + Math.random() * 10 : null; }
  if (cur.outside && !battle.on) playBgm(bgmFor());
}

// よるの まものは じめんから でてくる(ばしょは ランダム。 主人公から すこし はなれた ところ)
function spawnSpot() {
  for (let i = 0; i < 60; i++) {
    const tx = 1 + Math.random() * (cur.w - 2) | 0, ty = 1 + Math.random() * (cur.h - 2) | 0, p = at(tx, ty);
    if (Math.hypot(p.x - player.x, p.y - player.y) < 96 || hits(p.x, p.y) || exitAt(p.x, p.y)) continue;
    if (cur.rows[ty][tx] === '=' && Math.random() < 0.5) continue;   // みちの うえは すこし でにくく
    return p;
  }
  return null;
}
function updateSpawns(dt) {
  for (const o of cur.objs) if (o.night && o.gone && o.spawnT != null && (o.spawnT -= dt) <= 0) {
    const p = spawnSpot();
    if (!p) { o.spawnT = 1; continue; }
    Object.assign(o, { gone: false, x: p.x, y: p.y, hx: p.x, hy: p.y, tx: p.x, ty: p.y, cool: 0, timer: 0, chase: false, notice: 0, rise: RISE, spawnT: null });
    if (Math.hypot(p.x - player.x, p.y - player.y) < 200) sfx('rise');
  }
}
const RISE = 1.4;   // でてくるまでの びょうすう
// よるの まものの つよさ: レベル3までは そのまま、 それより うえは 1レベル ごとに 15% つよく
const nightScale = () => Math.max(1, 1 + 0.15 * (hero.lv - 3));

// ===== かぐ(もようがえ が できる マップ) =====
const placed = m => room.placed[Object.keys(MAPS).find(k => MAPS[k] === m)] || [];
// かぐの 当たり判定と、しらべる ための 印を つくりなおす
function refreshRoom(m) {
  if (!m.deco) return;
  const list = placed(m);
  m.solid = solidCells(list);
  m.objs = [...m.base, ...list.filter(f => !isFlat(furnLook(f.id))).map(f => {
    const [w, h] = furnSize(furnLook(f.id)), work = furnWork(furnLook(f.id));
    return { kind: 'furn', furn: f, work, label: work || 'しらべる', ...at(f.x + (w - 1) / 2, f.y + h - 1) };
  })];
}
// セーブの かぐを たしかめて(へんな ものは しまう)、 ない マップは さいしょの おきかたに
function setupRooms(saved) {
  room.stash = (saved?.stash || []).filter(id => byId('furniture', id));
  room.paint = saved?.paint || null;
  for (const [name, m] of Object.entries(MAPS)) {
    if (!m.deco) continue;
    const src = saved?.placed?.[name] || (m.furniture || []).map(f => ({ ...f }));
    const list = [];
    for (const f of src) {
      if (!byId('furniture', f.id)) continue;
      if (canPlace(m, list, f.id, f.x, f.y, null, () => false)) list.push({ id: f.id, x: f.x, y: f.y }); else room.stash.push(f.id);
    }
    room.placed[name] = list;
    refreshRoom(m);
  }
}

// ===== キャラ =====
const START = { map: 'home', ...at(5.5, 7) };   // はじめる ばしょ・まけたら もどる ばしょ(じぶんの いえ)
const player = { x: START.x, y: START.y, dir: 'down', anim: 0, moving: false };
// ===== おはなしの すすみぐあい(フラグ) =====
// マップの 人や物に show: 'フラグ'(その フラグが あると でる) / hide: 'フラグ'(あると きえる) が 書ける
const flags = new Set();
const has = f => !f || (Array.isArray(f) ? f.every(x => flags.has(x)) : flags.has(f));
const shown = o => (!o.show || has(o.show)) && (!o.hide || !flags.has(o.hide));
const live = () => cur.objs.filter(o => !o.gone && shown(o));

// ===== 当たり判定 =====
function tileSolid(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  if (tx < 0 || ty < 0 || tx >= cur.w || ty >= cur.h) return true;
  const c = cur.rows[ty][tx];
  if (c === 'L') return !bag.includes('かたぐるまのかけら');      // たかい だんさ: かたぐるまの かけらが あると のぼれる
  return BLOCK.has(c) || !!cur.solid?.has(tx + ',' + ty);
}
function solidAt(x, y) {
  if (tileSolid(x, y)) return true;
  for (const o of live()) {
    if (o.kind === 'look' || o.kind === 'item' || o.kind === 'enemy' || o.kind === 'furn') continue;  // 家具はタイルで止まる/落ちている物は通れる/てきは ぶつかると戦闘
    const bw = o.bw || 6;   // bw: よこはばの はんぶん(ボスは おおきい)
    if (x > o.x - bw && x < o.x + bw && y > o.y - 6 && y < o.y + 1) return true;
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
  if (e.need && !has(e.need)) {           // まだ とおれない 出入り口
    Object.assign(player, back); player.moving = false; stickRelease(); for (const k in keys) keys[k] = false;
    openDialog('', e.block || ['まだ いけないみたい。']); return;
  }
  sfx('warp');
  fadeTo(() => {
    cur = MAPS[e.to]; resetEnemies(cur);
    Object.assign(player, at(e.at[0], e.at[1]));
    player.dir = e.dir || player.dir; player.anim = 0; player.moving = false; trail.length = 0;
    updateCamera(); visit(); save();
    playBgm(bgmFor());
  });
}
function updateTrans(dt) {
  const before = trans.t;
  trans.t += dt;
  if (before < FADE && trans.t >= FADE && trans.fn) { const f = trans.fn; trans.fn = null; f(); }
  if (trans.t >= FADE * 2) { trans.on = false; const a = trans.after; trans.after = null; if (a) a(); }
}
const fadeAlpha = () => !trans.on ? 0 : trans.t < FADE ? trans.t / FADE : Math.max(0, 2 - trans.t / FADE);

// ===== ワープ(いったことの ある まちへ) =====
const visit = () => { const n = mapName(); if (cur.town && !flags.has('visit:' + n)) flags.add('visit:' + n); };
menu.towns = () => Object.entries(MAPS).filter(([n, m]) => m.town && (flags.has('visit:' + n) || n === 'village')).map(([n, m]) => ({ map: n, name: m.town.name }));
// テント: そとで ねる(よるなら あさに、 みんな げんきに)
menu.canRest = () => !!cur.outside;
menu.rest = () => {
  const night = darkness() > 0; sfx('heal');
  fadeTo(() => { healFull(); if (night) { toMorning(); nightChanged(); } save(); },
    () => openDialog('', ['{テント|てんと}を はって、 みんなで ひとやすみ……', ...(night ? ['あさに なった!'] : []), 'みんなの HPと MPが ぜんぶ もどった!']));
};
menu.warp = name => {
  const m = MAPS[name]; if (!m?.town) return;
  sfx('warp');
  fadeTo(() => {
    cur = m; resetEnemies(cur);
    Object.assign(player, at(m.town.at[0], m.town.at[1]), { dir: 'down', anim: 0, moving: false }); trail.length = 0;
    updateCamera(); visit(); save(); playBgm(bgmFor());
  }, () => openDialog('', [`${m.town.name}に ついた!`]));
};

// ===== 戦闘へ =====
function encounter(o, opt = {}) {
  let lost = 0;
  sfx('encounter');
  fadeTo(() => {
    startBattle(o.party, opt).then(result => fadeTo(() => {
      if (result === 'win') { if (opt.onWin) opt.onWin(); else { o.gone = true; o.spawnT = null; } }
      if (result === 'run') o.cool = 3;          // にげたあと 少しの間は ぶつからない
      if (result === 'lose') {                   // まけたら 村で 目が さめる。 もっている おかねは はんぶんに
        cur = MAPS[START.map]; Object.values(MAPS).forEach(resetEnemies);
        Object.assign(player, { x: START.x, y: START.y, dir: 'up' }); trail.length = 0;
        healFull();
        lost = hero.gold - Math.floor(hero.gold / 2); hero.gold -= lost;
      }
      updateCamera(); save();
      playBgm(bgmFor());
    }, result === 'lose' ? () => openDialog('', ['……はっ!', 'おうちで {目|め}が さめた。 だれかが はこんで くれたみたい。', 'みんなの HPが ぜんぶ もどった!',
      ...(lost > 0 ? [`でも、 おかねを ${lost}{円|えん} おとして しまった…`] : [])]) : result === 'win' && opt.afterWin ? opt.afterWin : null));
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
const back = { x: 0, y: 0 };      // ひとつ まえの ばしょ(とおれない 出入り口で もどす)
const trail = [];                 // 主人公の あしあと(ハモが ついてくる)
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
  if (shop.open) { const b = e.target.closest('[data-s]'); if (b) shopTap(b.dataset.s); return; }
  if (tg.on) { tgTap(); return; }
  if (paint.open) {
    const b = e.target.closest('[data-p]'); if (b) { paintTap(b.dataset.p); return; }
    const cv = e.target.closest('#paintcv'); if (cv) { const r = cv.getBoundingClientRect(); paintAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }
    return;
  }
  if (trans.on) return;
  if (deco.open) {
    const b = e.target.closest('[data-d]'); if (b) { decoTap(b.dataset.d); return; }
    if (e.target.closest('#deco .dpick, #deco .dside')) return;
    const p = local(e); decoTile(Math.floor((p.x / S + cam.x) / T), Math.floor((p.y / S + cam.y) / T)); return;
  }
  if (dlg.open) { advance(); return; }
  if (e.target.closest('#menubtn')) { openFieldMenu(); return; }
  if (e.target.closest('#clockcv')) { sfx('ok'); openDialog('', [timeWords()]); return; }   // とけいの こたえあわせ
  if (e.target.closest('#decobtn')) { startDeco(); return; }
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
  if (shop.open) { if (e.key === 'Escape') shopTap('#close'); return; }
  if (tg.on) { if (ok) tgTap(); return; }
  if (paint.open) { if (e.key === 'Escape') paintTap('#close'); return; }
  if (deco.open) { if (e.key === 'Escape') decoTap('#done'); return; }
  if (e.key === 'm' || e.key === 'Escape') { if (menu.open) menuTap('#close'); else if (started && hero.name && !dlg.open && !trans.on) openFieldMenu(); return; }
  if (menu.open) return;
  keys[e.key] = true;
  if (ok) {
    if (!started) start(); else if (trans.on) return; else if (dlg.open) advance(); else if (near) interact(near);
  }
});
addEventListener('keyup', e => { keys[e.key] = false; });

// もようがえ を はじめる(人が いる マスには おけない)
function startDeco() {
  stickRelease(); for (const k in keys) keys[k] = false;
  const m = cur, people = [player, ...m.base.filter(o => o.kind === 'npc')];
  const blocked = (x, y) => people.some(p => p.x + 5 > x * T && p.x - 5 < (x + 1) * T && p.y - 1 > y * T && p.y - 6 < (y + 1) * T);
  openDeco(m, placed(m), blocked, () => { refreshRoom(m); save(); });
}
function openFieldMenu() { stickRelease(); sfx('ok'); for (const k in keys) keys[k] = false; openMenu(() => { chipText = ''; save(); }); }

// ===== 調べる・話す・ひろう =====
let talkedOnce = false;
function interact(o) {
  talkedOnce = true; $('hint2').style.display = 'none';
  sfx('ok');
  if (o.kind === 'npc') {
    const dx = player.x - o.x, dy = player.y - o.y;
    o.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    // talk: [{ need, not, lines, set, join, give, then }] … フラグで かわる セリフ(うえから じゅんに しらべる)
    const t = (o.talk || []).find(e => has(e.need) && !(e.not && has(e.not)));
    if (t) { doTalk(o, t); return; }
    if (o.event) { EVENTS[o.event]?.(o); return; }   // はなすと すぐ できごと
    const lines = o.ifHave && bag.includes(o.ifHave.item) ? o.ifHave.lines : o.lines;
    const after = o.heal ? () => healAt(o) : (o.shop || o.bank) ? () => openShop(o, () => { chipText = ''; save(); }) : null;
    openDialog(o.name, lines || ['……'], after);
    return;
  }
  if (o.kind === 'boss') { openDialog(o.name, o.lines, () => EVENTS[o.event]?.(o)); return; }
  if (o.event) { EVENTS[o.event]?.(o); return; }
  if (o.kind === 'furn') { useFurn(o); return; }
  if (o.taken) { openDialog(o.name, o.after || ['もう なにも ない。']); return; }
  if (o.give) {
    o.taken = true; bag.push(o.give);
    markTaken(o);
    save();
  }
  openDialog(o.name, o.lines);
}
// ===== おはなしの できごと =====
const say = (name, lines) => new Promise(r => openDialog(name, lines, r));
const fade = fn => new Promise(r => fadeTo(fn, r));
const HAMO = '{ハモ|はも}';
const view = { on: false };       // おかの うえからの けしき
const jump = { on: false, t: 0 };     // トランポリンで とんでいる
// ===== トランポリンの ミニゲーム: おりてきて つく ときに タップ =====
const rec = {};                       // きろく(セーブ される)
const tg = { on: false };
const TG_EARLY = 0.12, TG_LATE = 0.08;   // タップが まにあう はば(びょう。 ぜんぶで 0.2びょう)
function playTramp() {
  return new Promise(res => {
    Object.assign(tg, { on: true, t: 0, ph: 0, n: 0, h: 20, early: -9, pending: null, msg: '', msgT: 0, wait: 1.6, done: res });
    tgShow('じゅんび……');
  });
}
// たかさは まいかい ランダム。 たかいほど ながく とぶ(タイミングが かわる)。 かいすうが ふえると すこし はやく
const tgPeriod = () => (0.45 + (tg.h - 10) / 30 * 0.6) * Math.max(0.75, 1 - tg.n * 0.004);
const tgHeight = () => tg.h;
function tgShow(hint) { $('mini').style.display = 'block'; $('mini').innerHTML = `<div class="mcount">${tg.n}<small>かい</small></div><div class="mhint">${rubyHTML(hint)}</div>` + (tg.msg ? `<div class="mpop">${rubyHTML(tg.msg)}</div>` : ''); }
function tgTap() {
  if (!tg.on || tg.wait > 0) return;
  if (tg.pending != null && tg.t - tg.pending <= TG_LATE) { tgOk(tg.t - tg.pending); return; }
  if (tg.ph > 1 - TG_EARLY / tgPeriod()) tg.early = tg.t;     // おりてくる とちゅうの タップ
  else if (tg.ph > 0.12) { tg.msg = 'はやすぎ!'; tgShow(''); tgEnd(); }   // まだ たかい ときに タップ(れんだ よけ)
}
function tgOk(off) {
  tg.n++; tg.pending = null; tg.early = -9; tg.ph = 0; tg.h = 10 + Math.random() * 30;
  tg.msg = Math.abs(off) < 0.07 ? 'ぴったり!' : 'ぽよーん!'; tg.msgT = 0.6;
  sfx('next'); if (flags.has('owl')) sfx('boing');            // まちの おとが もどったら ぽよん
  tgShow('おりてきて つく ときに タップ!');
}
function tgEnd() {
  tg.on = false; $('mini').style.display = 'none';
  sfx('miss'); const cb = tg.done; tg.done = null; setTimeout(() => cb(tg.n), 600);
}
function updateTramp(dt) {
  tg.t += dt; tg.msgT -= dt;
  if (tg.wait > 0) { tg.wait -= dt; if (tg.wait <= 0) tgShow('おりてきて つく ときに タップ!'); return; }
  if (tg.pending != null) { if (tg.t - tg.pending > TG_LATE) tgEnd(); return; }
  tg.ph += dt / tgPeriod();
  if (tg.ph >= 1) {                                          // ちゃくち
    tg.ph = 1;
    if (tg.t - tg.early <= TG_EARLY) tgOk(-(tg.t - tg.early)); else tg.pending = tg.t;
  }
  if (tg.msgT <= 0 && tg.msg) { tg.msg = ''; tgShow('おりてきて つく ときに タップ!'); }
}
const campNight = { on: false };      // キャンプの よる(たきびの まわりが あかるい)
const wait = sec => new Promise(r => setTimeout(r, sec * 1000));
// おてつだいが 3つ おわったら、 ハモが キャンプに さそう
async function campCheck() {
  if (['tramp', 'paint', 'craft'].every(f => flags.has(f)) && !flags.has('campInvite')) {
    flags.add('campInvite'); save();
    await say(HAMO, ['ねえ、 @。 こんど みんなで {キャンプ|きゃんぷ} しない?', '{メロ|めろ}さんも さそって、 まちの ひがしの はらっぱで!', 'いちど おうちに かえって、 {メロ|めろ}さんに はなして みようよ。']);
  }
}
const EVENTS = {
  // ガラガラ おおがらすと たたかう
  crow(o) {
    encounter({ party: [o.party] }, { boss: true, onWin: () => { flags.add('crow'); bag.push('ハモのピック'); save(); },
      afterWin: async () => {
        await say(o.name, ['カァ…… まいった まいった。', 'ピカピカした ものが だいすきで、\nつい もって きちゃうんだ。 ごめんよ。']);
        await say('', ['♪{ハモ|はも}の {ピック|ぴっく}を とりかえした!']);
        await say(HAMO, ['ありがとう、 @! これで また ひけるよ。', 'おれいに いっきょく。']);
        sfx('guitar');
        await say(HAMO, ['ジャラ〜ン……♪'.replace('ジャラ〜ン', '{ジャラ〜ン|じゃら〜ん}'), 'この むらは いい ところだね。\nしばらく ここに いようかな。']);
        await say('', ['おおがらすは どこかへ とんでいった。', 'みはらしの おかへの みちが ひらいた!']);
      } });
  },
  // ===== 第2章: パルル町の おてつだい =====
  // トランポリン: こねこと いっしょに とぶ
  async tramp(o) {
    const back = { x: player.x, y: player.y }, first = !rec.tramp && !flags.has('tramp');
    if (first) await say('こねこ', ['{トランポリン|とらんぽりん}の あそびかたを おしえて あげる!', 'おりてきて、 {トランポリン|とらんぽりん}に つく ときに タップ してね。', 'じょうずに タップ できたら、 また とべるよ。 なんかい とべるかな?']);
    await fade(() => { Object.assign(player, { x: 5 * T, y: 17 * T + 6, dir: 'down' }); trail.length = 0; jump.on = true; jump.t = 0; });
    const n = await playTramp();
    await fade(() => { jump.on = false; Object.assign(player, back, { dir: 'up' }); trail.length = 0; });
    const best = n > (rec.tramp || 0);
    if (best) rec.tramp = n;
    save();
    await say('こねこ', n === 0 ? ['あれれ、 もういちど やってみよう!', 'おりてきて、 つく ときに タップ だよ。'] : [`${n}かい とべたね!`, best ? 'すごい! さいこう きろく だよ!' : `さいこう きろくは ${rec.tramp}かい だよ。`]);
    if (!flags.has('tramp') && n > 0) {
      flags.add('tramp'); bag.push('トランポリンのかけら'); save();
      await say('', ['@の むねの なかで、 なにかが あたたかく ひかった。', '♪「{トランポリン|とらんぽりん}」の かけらを {手|て}に いれた!', 'あなや かわを とびこえられる ように なった!']);
      await campCheck();
    }
    // ごほうび(data/tramp.csv)
    for (const r of DATA.tramp) { const need = +r.id, k = 'tramp' + need; if (!(n >= need) || flags.has(k)) continue;
      const it = byId('items', r.prize), fu = !it && byId('furniture', r.prize); if (!it && !fu) continue;
      flags.add(k); if (it) bag.push(it.id); else room.stash.push(fu.id); save();
      await say('こねこ', [`${need}かいも とべた! これ あげる!`, `♪${(it || fu).name}を もらった!`, ...(fu ? ['おうちの 「もようがえ」で おけるよ。'] : [])]);
    }
  },
  // えかき: ぬりえを する
  async paint(o) {
    const first = !flags.has('paint');
    const cols = await new Promise(r => openPaint(room.paint, r));
    if (!cols) { await say(o.name, ['また いつでも かきに きてね。']); return; }
    room.paint = cols; chipText = '';
    if (first) room.stash.push('え');
    save();
    await say(o.name, ['すてきな え! とっても いい いろだね。', ...(first ? ['この えは あなたに あげる。 おうちに かざってね。', '♪「ぬりえ」(かぐ)を もらった!', 'おうちの 「もようがえ」で おけるよ。'] : ['おうちの え も かきかえて おいたよ。'])]);
    if (first) {
      flags.add('paint'); bag.push('えかきのかけら'); save();
      await say('', ['@の むねの なかで、 なにかが あたたかく ひかった。', '♪「えかき」の かけらを {手|て}に いれた!', 'いろの きえた ばしょに いろを もどせる ように なった!']);
      await campCheck();
    }
  },
  // こうさく: さぎょうだいで ことりの いえを つくる
  async birdhouse(o) {
    if (flags.has('craft')) { await say('', ['ことりの いえが {木|き}に かかっている。']); return; }
    if (!flags.has('birdtalk')) { await say('', ['こうえんの さぎょうだいだ。']); return; }
    const n = bag.filter(b => b === 'きのえだ').length;
    if (n < 3) { await say(HAMO, [`ことりの いえは、 きの えだが 3ぼん あれば つくれるよ。(いま ${n}ほん)`, 'もりで ひろって こよう!']); return; }
    for (let i = 0; i < 3; i++) bag.splice(bag.indexOf('きのえだ'), 1);
    await say('', ['@と {ハモ|はも}は、 いっしょに ことりの いえを つくった。', 'トントン、 カンカン……'.replace('トントン、 カンカン', '{トントン|とんとん}、 {カンカン|かんかん}'), '……あれ? かなづちの おとも しない。']);
    await say(HAMO, ['できた! {木|き}に かけて こよう。']);
    flags.add('craft'); bag.push('こうさくのかけら'); save();
    await say('', ['ことりが やってきた!', 'でも、 なきごえは きこえない……', '@の むねの なかで、 なにかが あたたかく ひかった。', '♪「こうさく」の かけらを {手|て}に いれた!', 'こわれた はしや はしごを なおせる ように なった!']);
    await campCheck();
  },
  // キャンプ: みんなで よるを すごす → メロが なかまに
  async camp(o) {
    await say('{メロ|めろ}', ['いらっしゃい。 テントも たきびも じゅんび できたわよ。'.replace('テント', '{テント|てんと}')]);
    await fade(() => { clock.t = dayLen() + 10; nightChanged(); Object.assign(player, at(26.5, 19), { dir: 'up' }); trail.length = 0; campNight.on = true; });
    await say('', ['よるに なった。 たきびが ゆらゆら もえている。', 'ぱちぱちの おとは しないけれど、 とっても あったかい。']);
    await say('{メロ|めろ}', ['ほら、 みて。 ほしが いっぱい。']);
    await say(HAMO, ['ぼくは ずっと ひとりで たびを してきたけど……', 'こうして みんなで いると、 あったかいね。']);
    await say('{メロ|めろ}', ['……ねえ、 @。 ミミズクを さがしに いくんでしょう?'.replace('ミミズク', '{ミミズク|みみずく}'), 'わたしも いっしょに いくわ。\n{歌|うた}で みんなを まもって あげる。']);
    flags.add('melo'); joinAlly('melo'); chipText = ''; sfx('get');
    await say('', ['♪{メロ|めろ}が なかまに なった!']);
    await fade(() => { toMorning(); nightChanged(); campNight.on = false; });
    flags.add('camp'); bag.push('キャンプのかけら'); healFull(); save();
    await say('', ['あさに なった! みんな げんき いっぱいだ。', '@の むねの なかで、 なにかが あたたかく ひかった。', '♪「{キャンプ|きゃんぷ}」の かけらを {手|て}に いれた!', 'よるや くらい ところでも、 まわりが あかるく みえる ように なった!']);
    flags.add('ch2gate'); save();
    await say(HAMO, ['さあ、 きたの もりへ いこう!', '{ミミズク|みみずく}から まちの おとを とりかえすんだ!']);
  },
  // ===== 第1章の おてつだい =====
  // おばあさんの きのこスープ(きのこ 3こ)
  async soup(o) {
    const n = bag.filter(b => b === 'きのこ').length;
    if (n < 3) { await say(o.name, [`きのこを 3こ もってきて くれるかい?(いま ${n}こ)`, 'きのこぼうを たおすと ときどき おとすよ。']); return; }
    for (let i = 0; i < 3; i++) bag.splice(bag.indexOf('きのこ'), 1);
    flags.add('soup'); bag.push('かいふくやく', 'かいふくやく'); hero.gold += 300; chipText = ''; save(); sfx('get');
    await say(o.name, ['まあ、 りっぱな きのこ! ありがとうね。', 'おいしい きのこスープが できるよ。'.replace('スープ', '{スープ|すーぷ}'), 'これは おれいだよ。']);
    await say('', ['♪かいふくやくを 2こ もらった!', '♪300{円|えん} もらった!']);
  },
  async spring() {
    const tired = members().some(m => m.s.hp < m.st.maxhp || m.s.mp < m.st.maxmp);
    if (tired) { healFull(); sfx('heal'); save(); }
    await say('', ['すきとおった いずみだ。', tired ? 'つめたい みずを のんだ。\nみんなの {体|からだ}が げんきに なった!' : 'つめたくて おいしい みずだ。']);
  },
  // みはらしの おかの たかい だんさ: ハモが かたぐるま → かけらが ひかって のぼれる ように なる
  async kataguruma() {
    await say('', ['@は だんさを のぼろうと した。', 'でも、 たかくて とどかない……']);
    await say(HAMO, ['よし、 ぼくに まかせて!', 'せーの……!']);
    sfx('get');
    await say('', ['{ハモ|はも}が かたぐるま してくれた!', 'わあ、 たかい!']);
    flags.add('kata'); bag.push('かたぐるまのかけら'); save();
    await say('', ['@の むねの なかで、 なにかが あたたかく ひかった。', '♪「かたぐるま」の かけらを {手|て}に いれた!', 'たかい だんさを のぼれる ように なった!']);
  },
  // おかの てっぺん: とおくの けしきを ながめて 第1章 おしまい
  async view() {
    await say('', ['ここが みはらしの おかの てっぺんだ!']);
    await say(HAMO, ['もういちど かたぐるま しよう。\nもっと とおくまで みえるよ!']);
    await fade(() => { view.on = true; });
    sfx('get');
    await say('', ['たかい! とおくまで みえる!', 'ふんすいの ある まちが みえる。\nとおくの そらには、 くろい くもも……', 'もっと むこうに、 おまつりの ような あかりが ひかっている。']);
    await say(HAMO, ['いつか みんなで、 あそこまで いってみたいね。']);
    await fade(() => { view.on = false; });
    flags.add('ch1'); save();
    await say('', ['だい1しょう 「ふたりの いえ」 おしまい。', 'つづく……']);
  },
};
function doTalk(o, t) {
  if (t.set) [].concat(t.set).forEach(f => flags.add(f));
  if (t.join) { joinAlly(t.join); chipText = ''; }
  for (const g of [].concat(t.give || [])) bag.push(g);
  if (t.gold) { hero.gold += t.gold; chipText = ''; }
  save();
  const then = t.then ? () => EVENTS[t.then]?.(o) : o.heal && t.heal !== false ? () => healAt(o) : null;
  openDialog(t.name || o.name, t.lines, then);
}
// HP・MPを ぜんぶ もどしてくれる人
function healAt(o) {
  if (members().every(m => m.s.hp >= m.st.maxhp && m.s.mp >= m.st.maxmp)) return;
  healFull(); sfx('heal'); save();
  openDialog(o.name, o.healLines || ['つかれた かおを しているね。 すこし やすんで いきな。', 'みんなの {体|からだ}が げんきに なった!']);
}
// かぐを しらべる: ベッドで ねる / さぎょうだいで つくる / ほかは せつめい
function useFurn(o) {
  const f = byId('furniture', o.furn.id);
  if (o.work === 'ねる') {
    sfx('heal');
    const night = darkness() > 0;            // よるに ねると あさに なる
    fadeTo(() => { healFull(); if (night) { toMorning(); nightChanged(); } save(); },
      () => openDialog('', ['ぐっすり ねむった…', ...(night ? ['あさに なった! いい {天気|てんき}だ!'] : []), '@の HPと MPが ぜんぶ もどった!', 'きょうの ぼうけんを きろくしたよ。']));
  } else if (o.work === 'つくる') openShop({ name: f?.name || 'さぎょうだい', craft: true }, () => { chipText = ''; save(); });
  else openDialog('', [f?.desc || 'かぐ']);
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
    v: 1, map: mapName(), clock: Math.round(clock.t),
    x: Math.round(player.x), y: Math.round(player.y), dir: player.dir,
    bag: [...bag], done: allObjs().filter(o => o.taken && !o.again).map(o => o.key), talked: talkedOnce,
    room: { placed: room.placed, stash: [...room.stash], paint: room.paint }, flags: [...flags], rec: { ...rec },
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
  for (const f of d.flags || []) flags.add(f);
  if (d.rec && typeof d.rec === 'object') for (const [k, v] of Object.entries(d.rec)) if (Number.isFinite(v)) rec[k] = v;
  clock.t = d.clock || 0; wasNight = isNight(); Object.values(MAPS).forEach(resetEnemies);
  if (d.hero) Object.assign(hero, d.hero);
  if (!d.hero || !d.hero.equip) { hero.equip = { ぶき: null, よろい: null }; equipBest(); }   // 自動そうびの ころの セーブ
  if (!d.hero || d.hero.gold == null) hero.gold = START_GOLD;                               // おかねが なかった ころの セーブ
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
  for (const [name, m] of Object.entries(MAPS)) for (const o of m.objs) for (const id of [...(o.shop || []), ...(o.give ? [o.give] : [])])
    if (!byId('items', id) && !byId('furniture', id)) dataErrors.push(`maps/${name}.js の どうぐ「${id}」が items.csv に ありません。`);
  setupRooms(saved?.room);
  for (const [name, m] of Object.entries(MAPS)) for (const f of m.furniture || []) if (!byId('furniture', f.id)) dataErrors.push(`maps/${name}.js の かぐ「${f.id}」が furniture.csv に ありません。`);
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
    playBgm(bgmFor());
    if (saved) { hintPhase = 2; save(); return; }   // つづきからは すぐ遊べる
    save();
    setTimeout(() => openDialog('', ['ふぁ〜あ。 {目|め}が さめた。 いい {天気|てんき}だ!', 'メロが よんでいる。 はなしかけて みよう。'.replace('メロ', '{メロ|めろ}')], () => { hintPhase = 1; $('hint1').style.display = 'block'; }), 300);
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
  const show = started && hero.name && !battle.on && !nameEntry.open && !menu.open && !shop.open && !deco.open && !paint.open && !jump.on;
  $('hpchip').style.display = show ? 'block' : 'none';
  $('menubtn').style.display = show && !dlg.open ? 'block' : 'none';
  $('decobtn').style.display = show && !dlg.open && cur.deco ? 'block' : 'none';
  $('clockcv').style.display = show ? 'block' : 'none';
  $('clockcv').classList.toggle('two', members().length === 2); $('clockcv').classList.toggle('three', members().length >= 3);   // ひょうじが ふえたら とけいを したに
  if (show) drawClock();
  if (!show) return;
  const st = heroStats();
  const t = `${hero.name}  HP ${hero.hp}/${st.maxhp}  MP ${hero.mp}/${st.maxmp}  ${hero.gold}{円|えん}` + members().slice(1).map(m => `\n${m.name}  HP ${m.s.hp}/${m.st.maxhp}  MP ${m.s.mp}/${m.st.maxmp}`).join('');
  if (t !== chipText) { chipText = t; $('hpchip').innerHTML = rubyHTML(t); $('hpchip').classList.toggle('low', hero.hp <= st.maxhp / 4); }
}
function update(dt) {
  tm += dt;
  if (trans.on) updateTrans(dt);
  updateChip();
  if (battle.on) { updateBattle(dt); $('act').style.display = 'none'; return; }
  const hideAct = () => { $('act').style.display = 'none'; $('actbtn').classList.remove('show'); };
  if (tg.on) updateTramp(dt);
  if (trans.on || nameEntry.open || menu.open || shop.open || deco.open || paint.open || jump.on) { hideAct(); if (jump.on) jump.t += dt; return; }
  if (dlg.open) { hideAct(); updateDialog(dt); return; }
  if (!started || !hero.name) return;
  autoT += dt; if (autoT > 30) { autoT = 0; save(); }   // 30秒ごとに自動セーブ
  if (cur.outside) tick(dt);                              // じかんは そとに いる ときだけ すすむ
  if (isNight() !== wasNight) nightChanged();
  // 入力
  let vx = stick.vx, vy = stick.vy;
  const kx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
  const ky = (keys.ArrowDown || keys.s ? 1 : 0) - (keys.ArrowUp || keys.w ? 1 : 0);
  if (kx || ky) { const l = Math.hypot(kx, ky); vx = kx / l; vy = ky / l; }
  const mag = Math.hypot(vx, vy);
  player.moving = mag > 0;
  if (player.moving) {
    const sp = 62 * dt;
    back.x = player.x; back.y = player.y;
    player.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
    const nx = player.x + vx * sp;
    let ex = exitAt(nx, player.y); if (ex) { goExit(ex); return; }
    if (!hits(nx, player.y)) player.x = nx;
    const ny = player.y + vy * sp;
    ex = exitAt(player.x, ny); if (ex) { goExit(ex); return; }
    if (!hits(player.x, ny)) player.y = ny;
    player.anim += dt * mag;
    const last = trail[0];
    if (!last || Math.hypot(last.x - player.x, last.y - player.y) >= 2) { trail.unshift({ x: player.x, y: player.y, dir: player.dir }); trail.length = Math.min(trail.length, 20); }
    walked += sp * mag;
    if (hintPhase === 1 && walked > 40) { hintPhase = 2; $('hint1').style.display = 'none'; }
  } else player.anim = 0;
  // ときどき向きを変える人
  for (const o of cur.objs) if (o.wander && Math.random() < dt * .4) o.dir = ['down', 'left', 'right'][Math.random() * 3 | 0];
  // てきは うろうろ歩く。 ぶつかったら 戦闘
  updateSpawns(dt);
  for (const o of live()) {
    if (o.kind !== 'enemy') continue;
    if (o.rise > 0) { o.rise -= dt; continue; }   // じめんから でてくる とちゅう
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
    // よるの まものが おいかけて くると あしおと
    if (o.night && o.chase && dp < 130 && (o.stepT = (o.stepT || 0) - dt) <= 0) { o.stepT = mv === 'はやい' ? 0.26 : 0.45; sfx('step'); }
    if (!o.cool && Math.hypot(o.x - player.x, o.y - player.y) < 12) { encounter(o, o.night ? { scale: nightScale() } : {}); return; }
  }
  updateCamera();
  // 近くにあるものを探す
  near = null; let best = 24;
  for (const o of live()) { if (o.kind === 'enemy' || (o.kind === 'deco' && !o.label)) continue; const d = Math.hypot(o.x - player.x, o.y - player.y); if (d < best) { best = d; near = o; } }
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
  if (battle.on) drawBattle(ctx); else if (view.on) drawView(); else drawField();
  if (!battle.on) drawDark();
  const a = fadeAlpha();
  if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, VW, VH); }
}
// とけい(はりで よむ。 タップで こたえあわせ)
let clockKey = '';
function drawClock() {
  const cvs = $('clockcv'), px = Math.round(36 * S * (globalThis.devicePixelRatio || 1));
  const h = Math.floor(hourNow() * 12) / 12, night = isNight(), key = `${px}|${h}|${night}`;   // はりは 5ふん ずつ うごく
  if (key === clockKey) return;
  clockKey = key;
  if (cvs.width !== px) { cvs.width = px; cvs.height = px; }
  const g = cvs.getContext('2d'), r = px / 2, c = r;
  g.clearRect(0, 0, px, px);
  g.beginPath(); g.arc(c, c, r * 0.96, 0, Math.PI * 2); g.fillStyle = night ? '#1a2350' : '#ffffff'; g.fill();
  g.lineWidth = r * 0.07; g.strokeStyle = night ? '#ffd23f' : '#18224f'; g.stroke();
  const ink = night ? '#e8ecff' : '#18224f';
  for (let i = 0; i < 60; i++) {           // めもり
    const a = i / 60 * Math.PI * 2, big = i % 5 === 0, r0 = r * (big ? 0.8 : 0.85);
    g.beginPath(); g.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); g.lineTo(c + Math.sin(a) * r * 0.9, c - Math.cos(a) * r * 0.9);
    g.lineWidth = r * (big ? 0.045 : 0.02); g.strokeStyle = ink; g.stroke();
  }
  g.fillStyle = ink; g.font = `bold ${Math.round(r * 0.26)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let n = 1; n <= 12; n++) { const a = n / 12 * Math.PI * 2; g.fillText(String(n), c + Math.sin(a) * r * 0.62, c - Math.cos(a) * r * 0.62 + r * 0.02); }
  g.font = `${Math.round(r * 0.22)}px sans-serif`; g.fillText(night ? '🌙' : '☀', c, c + r * 0.36);
  const hand = (turn, len, w, col) => { const a = turn * Math.PI * 2; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len);
    g.lineWidth = w; g.lineCap = 'round'; g.strokeStyle = col; g.stroke(); };
  hand((h % 12) / 12, r * 0.45, r * 0.12, '#e04848');     // みじかい はり(なんじ)
  hand((h % 1), r * 0.72, r * 0.07, '#3a7ae0');           // ながい はり(なんぷん)
  g.beginPath(); g.arc(c, c, r * 0.07, 0, Math.PI * 2); g.fillStyle = ink; g.fill();
}

// よるの くらやみ: 主人公(と ランプ)の まわりだけ あかるい
const darkCv = document.createElement('canvas'); darkCv.width = VW; darkCv.height = VH;
const dg = darkCv.getContext('2d');
function drawDark() {
  const k = darkness(), a = (cur.outside ? 1 : cur.deco ? 0.7 : 0) * k;   // そとの よるは 明るい丸の そとは まっくら
  if (a <= 0.01) return;
  const lights = [{ x: player.x - cam.x, y: player.y - 8 - cam.y, r: bag.includes('キャンプのかけら') ? 80 : 40 }];
  for (const o of live()) if (o.light) lights.push({ x: o.x - cam.x, y: o.y - 6 - cam.y, r: o.light + Math.sin(tm * 9) * 2 });   // たきび など
  if (cur.deco) for (const f of placed(cur)) if (furnLook(f.id) === 'ランプ') lights.push({ x: f.x * T + 8 - cam.x, y: f.y * T + 6 - cam.y, r: 72 });
  dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, VW, VH);
  dg.fillStyle = `rgba(6,8,32,${a})`; dg.fillRect(0, 0, VW, VH);
  dg.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    const gr = dg.createRadialGradient(l.x, l.y, l.r * 0.4, l.x, l.y, l.r);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    dg.fillStyle = gr; dg.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  dg.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkCv, 0, 0);
  // くらやみで 光る 目(ときどき まばたき)
  for (const o of live()) if (o.kind === 'enemy' && o.night && Math.floor(tm * 3 + o.hx) % 9) {
    const rh = o.rise > 0 ? Math.round(16 * (1 - o.rise / RISE)) : 16; if (rh < 9) continue;   // でてくる とちゅうは 目が でてから
    const sx = Math.round(o.x - cam.x) - 8, sy = Math.round(o.y - cam.y) - rh, hop = o.moving && !(o.rise > 0) ? Math.round(Math.abs(Math.sin(tm * 8 + o.hx)) * -2) : 0;
    ctx.fillStyle = eyeColor(byId('enemies', o.party[0])?.look);
    ctx.fillRect(sx + 4, sy + 6 + hop, 2, 2); ctx.fillRect(sx + 10, sy + 6 + hop, 2, 2);
  }
}
// おかの うえからの けしき(かたぐるま)
function drawView() {
  const g = ctx;
  for (let y = 0; y < 120; y++) { const k = y / 120; g.fillStyle = `rgb(${90 + k * 120 | 0},${170 + k * 60 | 0},${255 - k * 20 | 0})`; g.fillRect(0, y, VW, 1); }
  g.fillStyle = '#ffffff'; for (const [x, y] of [[40, 20], [52, 18], [64, 22], [200, 30], [214, 27]]) { g.beginPath(); g.arc(x + (tm * 2) % 20, y, 8, 0, 7); g.fill(); }
  g.fillStyle = '#4a4a6a'; for (const [x, y] of [[268, 28], [282, 24], [296, 30], [276, 34]]) { g.beginPath(); g.arc(x, y, 10, 0, 7); g.fill(); }   // くろい くも
  g.fillStyle = '#8ab8d8'; g.beginPath(); g.ellipse(160, 120, 200, 30, 0, 0, 7); g.fill();       // とおくの やま
  g.fillStyle = '#6aa858'; g.beginPath(); g.ellipse(80, 132, 120, 26, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(250, 136, 110, 26, 0, 0, 7); g.fill();
  // ふんすいの まち(ひだり)
  for (let i = 0; i < 5; i++) { g.fillStyle = ['#cf4b3b', '#3a6ad0', '#e8a040'][i % 3]; g.fillRect(50 + i * 10, 112, 7, 5); g.fillStyle = '#f1e2c3'; g.fillRect(51 + i * 10, 117, 5, 4); }
  g.fillStyle = '#9fd2ff'; g.fillRect(72, 106 - Math.abs(Math.sin(tm * 4)) * 3, 2, 6);
  // おまつりの あかり(みぎ)
  for (let i = 0; i < 7; i++) { g.fillStyle = (Math.floor(tm * 4) + i) % 3 ? '#ffd23f' : '#ff8a5a'; g.fillRect(222 + i * 7, 118 + (i % 2) * 2, 2, 2); }
  g.fillStyle = '#3f8f3a'; g.fillRect(0, 150, VW, 50);
  g.fillStyle = '#58a83a'; g.beginPath(); g.ellipse(160, 160, 120, 16, 0, 0, 7); g.fill();
  // かたぐるま(うしろすがた)
  g.drawImage(charSprite('hamo', 'up', 0), 148, 152, 24, 32);
  g.drawImage(heroSprite('up', 0, equipLook()), 148, 124, 24, 32);
}
function drawField() {
  const x0 = Math.max(0, Math.floor(cam.x / T)), y0 = Math.max(0, Math.floor(cam.y / T));
  for (let ty = y0; ty <= y0 + Math.ceil(VH / T); ty++) for (let tx = x0; tx <= x0 + Math.ceil(VW / T); tx++) {
    if (tx >= cur.w || ty >= cur.h) continue;
    ctx.drawImage(tileImg(cur.rows[ty][tx], tx, ty, tm), tx * T - cam.x, ty * T - cam.y);
  }
  // かぐ(じゅうたん → ほかの かぐ の じゅん)
  if (cur.deco) for (const flat of [true, false]) for (const f of placed(cur)) {
    const lk = furnLook(f.id); if (isFlat(lk) !== flat) continue;
    ctx.drawImage(furnImg(lk), f.x * T - cam.x, f.y * T - cam.y);
  }
  if (deco.open) drawDeco(ctx, cam, tm);
  // なかま(ハモ)は 主人公の すこし うしろを ついてくる
  const followers = members().slice(1).map((m, i) => {
    const f = trail[7 + i * 7] || trail[trail.length - 1] || { x: player.x, y: player.y + 1, dir: player.dir };
    if (jump.on) return { kind: 'follower', pal: m.pal, x: player.x + (i ? -14 : 14), y: player.y + 2, dir: 'down', moving: false, hop: i + 1 };
    return { kind: 'follower', pal: m.pal, x: f.x, y: f.y + (trail.length ? 0 : i), dir: f.dir, moving: player.moving };
  });
  const ents = [player, ...followers, ...live().filter(o => o.kind !== 'look' && o.kind !== 'furn')].sort((a, b) => a.y - b.y);
  for (const e of ents) {
    const sx = Math.round(e.x - cam.x), sy = Math.round(e.y - cam.y);
    if (e.kind === 'enemy' && e.cool > 0 && Math.floor(tm * 10) % 2) continue;   // にげたあとは ちかちか
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(sx - 4, sy - 1, 8, 2); ctx.fillRect(sx - 3, sy - 2, 6, 4);   // 影
    if (e.kind === 'enemy') {
      const img = enemySprite(byId('enemies', e.party[0])?.look);
      if (e.rise > 0) {                        // じめんから すこしずつ でてくる + つちが とぶ
        const h = Math.max(1, Math.round(16 * (1 - e.rise / RISE))), shake = Math.round(Math.sin(tm * 40));
        ctx.drawImage(img, 0, 0, 16, h, sx - 8 + shake, sy - h, 16, h);
        ctx.fillStyle = '#5a3a22'; ctx.fillRect(sx - 7, sy - 1, 14, 2);
        for (let i = 0; i < 6; i++) { const a = tm * 5 + i * 1.7, r = (tm * 30 + i * 7) % 10; ctx.fillStyle = i % 2 ? '#7a5230' : '#a07040'; ctx.fillRect(sx + Math.round(Math.cos(a) * r), sy - 2 - Math.round(Math.abs(Math.sin(a)) * r), 1, 1); }
        continue;
      }
      const hop = e.moving ? Math.round(Math.abs(Math.sin(tm * 8 + e.hx)) * -2) : 0;
      ctx.drawImage(img, sx - 8, sy - 16 + hop);
      if (e.notice > 0) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(sx - 1, sy - 26, 3, 6); ctx.fillRect(sx - 1, sy - 19, 3, 2); ctx.fillStyle = '#2a1e1a'; ctx.fillRect(sx, sy - 25, 1, 4); ctx.fillRect(sx, sy - 19, 1, 1); }  // 「!」
      continue;
    }
    let img;
    if (e.kind === 'deco') {                   // かざり(テント・たきび・ことりの いえ など)
      const img = e.pic === 'fire' ? DECO.fire[Math.floor(tm * 6) % 2] : e.pic?.startsWith('furn:') ? furnImg(e.pic.slice(5)) : DECO[e.pic];
      if (img) ctx.drawImage(img, sx - (img.width >> 1), sy - img.height + 2);
      if (e.pic === 'birdhouse' && flags.has('craft')) ctx.drawImage(DECO.bird, sx + 4, sy - 16 + Math.round(Math.sin(tm * 3)));
      continue;
    }
    const jy = tg.on && e === player ? -Math.round(tgHeight() * 4 * tg.ph * (1 - tg.ph)) : jump.on && e.hop ? 0 : 0;
    if (e.kind === 'boss') { ctx.drawImage(enemySprite(e.look), sx - 16, sy - 30 + Math.round(Math.sin(tm * 3) * 1.5), 32, 32); continue; }
    if (e === player) img = heroSprite(e.dir, e.moving ? Math.floor(e.anim * 9) % 4 : 0, equipLook());
    else if (e.kind === 'follower') img = charSprite(e.pal, e.dir, e.moving ? Math.floor(player.anim * 9) % 4 : 0);
    else if (e.kind === 'npc') img = charSprite(e.pal, e.dir, 0);
    else if (e.kind === 'sign') img = SPR.sign;
    else if (e.kind === 'item') img = SPR[e.pic] || SPR.potion;
    else img = e.taken ? SPR.chestOpen : SPR.chest;
    ctx.drawImage(img, sx - 6, sy - 15 + jy);
    if ((e.kind === 'chest' && !e.taken || e.kind === 'item') && (tm % 1.4) < .35) { ctx.fillStyle = '#fff'; ctx.fillRect(sx + 3, sy - 14, 1, 3); ctx.fillRect(sx + 2, sy - 13, 3, 1); } // きらっ
  }
  // トランポリンの ミニゲーム: タップの タイミングで わが きいろく ひかる
  if (tg.on && tg.wait <= 0) {
    const now = tg.pending != null || tg.ph > 1 - TG_EARLY / tgPeriod(), sx = Math.round(player.x - cam.x), sy = Math.round(player.y - cam.y);
    const r = 7 + Math.round((1 - 4 * tg.ph * (1 - tg.ph)) * 5);
    ctx.fillStyle = now ? '#ffd23f' : 'rgba(255,255,255,.5)';
    for (let a = 0; a < 24; a++) { const an = a / 24 * 6.28; ctx.fillRect(sx + Math.round(Math.cos(an) * r), sy - 1 + Math.round(Math.sin(an) * r * .4), 2, 1); }
  }
}

// 確認用(Macのブラウザの開発ツールから bouken.player などを見られる)
globalThis.bouken = { get tg() { return tg; }, player, bag, hero, battle, get map() { return mapName(); }, get near() { return near; }, get objs() { return cur.objs; } };

let last = performance.now();
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
updateCamera();
requestAnimationFrame(loop);

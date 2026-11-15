// ぼうけんの たび — 本体
import { T, BLOCK, tileImg } from './tiles.js';
import { charSprite, SPR, enemySprite, heroSprite, eyeColor, eyePos, DECO } from './sprites.js';
import { paint, openPaint, paintTap, paintAt } from './paint.js';
import { concert, startConcert, concertTap, updateConcert, drawConcert, rankOf } from './concert.js';
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
import north1 from '../maps/north1.js';
import north2 from '../maps/north2.js';
import cave from '../maps/cave.js';
import nest from '../maps/nest.js';
import cellar from '../maps/cellar.js';
import house2 from '../maps/house2.js';
import house3 from '../maps/house3.js';
import storm1 from '../maps/storm1.js';
import storm2 from '../maps/storm2.js';
import hut from '../maps/hut.js';
import storm3 from '../maps/storm3.js';
import storm4 from '../maps/storm4.js';
import kowa1 from '../maps/kowa1.js';
import kowa2 from '../maps/kowa2.js';
import mayoi from '../maps/mayoi.js';
import bridge from '../maps/bridge.js';
import kowa5 from '../maps/kowa5.js';
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
const MAPS = { village, house, forest, shop: shopMap, home, deep, hill, mid1, mid2, town2, cafe, shop2, north1, north2, cave, nest, cellar, house2, house3, storm1, storm2, hut, storm3, storm4, kowa1, kowa2, mayoi, bridge, kowa5 };
for (const [name, m] of Object.entries(MAPS)) {
  m.w = m.rows[0].length; m.h = m.rows.length; m.rows0 = m.rows;
  m.objs = m.objs.map(o => {
    const p = at(o.x, o.y);
    const r = { dir: 'down', ...o, key: `${name}:${o.x},${o.y}`, ...p };   // key はセーブで使う名札
    if (o.kind === 'enemy') Object.assign(r, { gone: !!o.night, party: o.party.split(/\s+/), hx: p.x, hy: p.y, tx: p.x, ty: p.y, timer: 0, cool: 0 });
    return r;
  });
  m.base = m.objs;   // かぐ いがいの 人や物
}
let cur = home;
// swaps: フラグが つくと マスが かわる(いろが もどる・はしが なおる など)
function applySwaps(m) {
  if (!m.swaps) return;
  const rows = m.rows0.map(r => r.split(''));
  for (const sw of m.swaps) if (flags.has(sw.flag)) {
    if (sw.chars) for (const r of rows) for (let i = 0; i < r.length; i++) if (sw.chars[r[i]]) r[i] = sw.chars[r[i]];
    for (const [x, y, c] of sw.cells || []) rows[y][x] = c;
  }
  m.rows = rows.map(r => r.join(''));
}
const mapName = () => Object.keys(MAPS).find(k => MAPS[k] === cur);
function resetEnemies(m) {
  for (const o of m.objs) {
    if (o.night) { Object.assign(o, { gone: true, spawnT: isNight() ? 1 + Math.random() * 6 : null }); continue; }
    if (o.kind === 'enemy') Object.assign(o, { gone: false, x: o.hx, y: o.hy, tx: o.hx, ty: o.hy, cool: 0, timer: 0, chase: false, notice: 0 });
    if (o.again) { o.taken = false; o.gone = false; }   // また おちている もの(きの えだ など)
  }
}

// ===== あめ・かみなり・かぜ(第3章 あらし) =====
// rain: { need, stop } … need の フラグが あって stop の フラグが ない あいだ あめが ふる
const rainy = () => !!cur.rain && has(cur.rain.need) && !flags.has(cur.rain.stop);
const storm = { next: 4, flash: 0, wind: 0 };
function updateWeather(dt) {
  storm.flash = Math.max(0, storm.flash - dt);
  if (rainy()) {
    const [a, b] = cur.thunder || (cur.town ? [12, 20] : [6, 11]);
    if ((storm.next -= dt) <= 0) { storm.next = a + Math.random() * (b - a); storm.flash = 0.6; sfx('thunder'); }
  }
  if (!cur.wind) return;
  const w = cur.wind, was = gusting();
  storm.wind = (storm.wind + dt) % (w.off + w.on);
  if (!was && gusting()) sfx('wind');
  if (gusting() && !sheltered()) {
    const nx = player.x + w.dx * w.push * dt;
    if (!hits(nx, player.y) && !exitAt(nx, player.y)) { player.x = nx; const l = trail[0]; if (!l || Math.abs(l.x - nx) >= 2) { trail.unshift({ x: nx, y: player.y, dir: player.dir }); trail.length = Math.min(trail.length, 20); } }
  }
}
const gusting = () => !!cur.wind && storm.wind >= cur.wind.off;
const gustSoon = () => !!cur.wind && storm.wind >= cur.wind.off - 0.7;
// かぜよけ: かぜが ふいてくる ほう(2マス いない)に いわや きが あると おされない
function sheltered() {
  const tx = Math.floor(player.x / T), ty = Math.floor((player.y - 3) / T);
  if (ty < 0 || ty >= cur.h) return false;
  for (let k = 1; k <= 2; k++) { const x = tx - cur.wind.dx * k; if (x < 0 || x >= cur.w) break; if (BLOCK.has(cur.rows[ty][x])) return true; }
  return false;
}

// ===== こわい もり(第3章): ハモが てを つなぐ / ほそい みちは ひとりで =====
// マップの scary: てを つないで となりを あるく。 alone: [{ id, x, y, w, h, wait: [x, y], done }] ほそい みち(ハモは wait で まつ)
// ゆうきの かけらを もらった あとは、 ほそい みちも みんなで とおれる
const hand = { alone: null, whisper: 1.5 };
function zoneAt() {
  if (!cur.scary || flags.has('yuuki')) return null;
  const tx = Math.floor(player.x / T), ty = Math.floor((player.y - 3) / T);
  return (cur.alone || []).find(z => tx >= z.x && tx < z.x + (z.w || 1) && ty >= z.y && ty < z.y + (z.h || 1)) || null;
}
function updateHand(dt) {
  const z = zoneAt();
  if (z && hand.alone !== z) {
    hand.alone = z; hand.whisper = 1.2;
    if (!flags.has('alone:' + z.id)) { flags.add('alone:' + z.id); save(); EVENTS.aloneStart(z); }
  } else if (!z && hand.alone) {
    const z0 = hand.alone, w = at(...z0.wait); hand.alone = null; trail.length = 0;
    if (Math.hypot(player.x - w.x, player.y - w.y) > 44) {           // むこうがわに でた
      if (z0.done) EVENTS[z0.done](z0);
      else if (!flags.has('aloneOk:' + z0.id)) { flags.add('aloneOk:' + z0.id); save(); EVENTS.aloneEnd(z0); }
    }
  }
  if (hand.alone && (hand.whisper -= dt) <= 0) { hand.whisper = 2.6 + Math.random() * 2; sfx('whisper'); }
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
const shown = o => (!o.show || has(o.show)) && (!o.hide || !flags.has(o.hide)) && (o.step == null || o.step === maze.step);   // step: まよいの もりの だんかい
const live = () => cur.objs.filter(o => !o.gone && shown(o));

// ===== 当たり判定 =====
function tileSolid(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  if (tx < 0 || ty < 0 || tx >= cur.w || ty >= cur.h) return true;
  const c = cur.rows[ty][tx];
  if (c === 'L') return !bag.includes('かたぐるまのかけら');      // たかい だんさ: かたぐるまの かけらが あると のぼれる
  if (c === '%') return !bag.includes('ゆうきのかけら');          // くろい きり: ゆうきの かけらが あると とおれる
  return BLOCK.has(c) || !!cur.solid?.has(tx + ',' + ty);
}
function solidAt(x, y) {
  if (tileSolid(x, y)) return true;
  for (const o of live()) {
    if (o.kind === 'look' || o.kind === 'item' || o.kind === 'enemy' || o.kind === 'furn' || o.float) continue;   // float: とんでいる もの(ホタル)は とおれる  // 家具はタイルで止まる/落ちている物は通れる/てきは ぶつかると戦闘
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
// まよいの もり: ただしい でぐちなら つぎの だんかいへ、 まちがえたら さいしょから
const maze = { step: 0 };
function goMaze(e) {
  const mz = cur.maze, ok = e.maze === mz.route[maze.step], last = ok && maze.step === mz.route.length - 1;
  sfx('warp');
  fadeTo(() => {
    maze.step = ok && !last ? maze.step + 1 : 0;
    if (last) { cur = MAPS[mz.next.to]; Object.assign(player, at(...mz.next.at), { dir: mz.next.dir }); }
    else Object.assign(player, at(...mz.start), { dir: 'up' });
    resetEnemies(cur); player.anim = 0; player.moving = false; trail.length = 0;
    updateCamera(); save(); playBgm(bgmFor());
  }, ok ? (last ? runEnter : null) : () => openDialog('', ['あれ? さっきの ばしょに もどって きた みたい……', 'ホタルが とんでいく ほうへ いってみよう。']));
}
function goExit(e) {
  if (e.maze) { goMaze(e); return; }
  if (e.need && !has(e.need)) {           // まだ とおれない 出入り口
    Object.assign(player, back); player.moving = false; stickRelease(); for (const k in keys) keys[k] = false;
    openDialog('', e.block || ['まだ いけないみたい。']); return;
  }
  sfx('warp');
  fadeTo(() => {
    cur = MAPS[e.to]; resetEnemies(cur); maze.step = 0;
    Object.assign(player, at(e.at[0], e.at[1]));
    player.dir = e.dir || player.dir; player.anim = 0; player.moving = false; trail.length = 0;
    updateCamera(); visit(); save();
    playBgm(bgmFor());
  }, runEnter);
}
// マップに はいった ときの できごと(enter: [{ need, once, event }]。 once の フラグが つくと もう おきない)
function runEnter() {
  const e = (cur.enter || []).find(e => has(e.need) && !flags.has(e.once));
  if (e) { flags.add(e.once); save(); EVENTS[e.event]?.(); }
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
  }, () => openDialog('', [`${m.town.name}に ついた!`], runEnter));
};

// ===== 戦闘へ =====
function encounter(o, opt = {}) {
  let lost = 0;
  sfx('encounter');
  fadeTo(() => {
    startBattle(o.party, { bg: rainy() ? 'storm' : null, ...opt }).then(result => fadeTo(() => {
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
function openDialog(name, lines, onEnd) { stickRelease(); openDlg((name || '').replace(/@/g, hero.name), lines.map(l => l.replace(/@/g, hero.name)), onEnd); }

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
  if (concert.on) { concertTap(); return; }
  if (paint.open) {
    const b = e.target.closest('[data-p]'); if (b) { paintTap(b.dataset.p); return; }
    const cv = e.target.closest('#paintcv'); if (cv) { const r = cv.getBoundingClientRect(); paintAt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }
    return;
  }
  if (trans.on || leap.on) return;
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
  if (concert.on) { if (ok) concertTap(); return; }
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
  if (o.give || o.gold) {            // gold: おかねが もらえる(つぼ など)
    o.taken = true; if (o.give) bag.push(o.give);
    if (o.gold) { hero.gold += o.gold; chipText = ''; }
    markTaken(o);
    save();
  }
  openDialog(o.name, o.lines);
}
// ===== おはなしの できごと =====
const say = (name, lines) => new Promise(r => openDialog(name, lines, r));
const fade = fn => new Promise(r => fadeTo(fn, r));
const HAMO = '{ハモ|はも}';
const view = { on: false, kind: null, t0: 0 };       // おかの うえからの けしき(kind 'storm': 第3章の よこく)
const stageShow = { on: false };  // がっそうの ステージの え
const jump = { on: false, t: 0 };     // トランポリンで とんでいる
// かわを とびこえる(ひとっとびの ジャンプ)
const leap = { on: false };
const LEAP_T = 0.75;
function hopTo(tx, ty) { const p = at(tx, ty); return new Promise(r => Object.assign(leap, { on: true, t: 0, fx: player.x, fy: player.y, x: p.x, y: p.y, done: r })); }
function updateLeap(dt) {
  leap.t += dt; const k = Math.min(1, leap.t / LEAP_T);
  player.x = leap.fx + (leap.x - leap.fx) * k; player.y = leap.fy + (leap.y - leap.fy) * k; player.anim += dt; player.moving = true;
  trail.length = 0; updateCamera();
  if (k >= 1) { leap.on = false; player.moving = false; player.anim = 0; const cb = leap.done; leap.done = null; save(); cb(); }
}
const leapY = () => leap.on ? -Math.round(Math.sin(Math.min(1, leap.t / LEAP_T) * Math.PI) * 26) : 0;
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
  // ===== 第2章: きたの もり =====
  // トランポリンで かわを とびこえる
  async hop(o) {
    if (!bag.includes('トランポリンのかけら')) { await say('', ['ちいさな {トランポリン|とらんぽりん}が ある。', 'でも、 どう つかえば いいのかな?']); return; }
    if (!flags.has('hop')) {
      flags.add('hop');
      await say('', ['かわの まえに ちいさな {トランポリン|とらんぽりん}が ある。']);
      await say(HAMO, ['こうえんで とんだ みたいに、 とびこえよう!']);
      await say('', ['{トランポリン|とらんぽりん}の かけらが ひかった!']);
    }
    sfx(flags.has('owl') ? 'boing' : 'next');
    player.dir = o.to[1] * T < o.y ? 'up' : 'down';
    await hopTo(o.to[0], o.to[1]);
  },
  // いろの ない もり: えかきの かけらで いろを もどす
  async color(o) {
    if (flags.has('nfColor')) { await say('', ['おおきな はなが いろとりどりに さいている。']); return; }
    await say('', ['おおきな はなが ある。', 'でも、 はなも くさも きも、 いろが ぜんぶ きえている……']);
    if (!bag.includes('えかきのかけら')) return;
    await say('{メロ|めろ}', ['@、 えかきの かけらで いろを ぬって あげましょう!']);
    sfx('magic');
    await fade(() => { flags.add('nfColor'); applySwaps(cur); });
    sfx('get'); save();
    await say('', ['えかきの かけらが ひかった!', 'もりに いろが もどった!', 'しげみの むこうに、 みちが みえる!']);
    await say(HAMO, ['ミミズクが、 おとと いっしょに いろも すいとって いたのかな。'.replace('ミミズク', '{ミミズク|みみずく}')]);
  },
  // こわれた はしを なおす
  async bridge(o) {
    await say('', ['はしが こわれていて わたれない……']);
    if (!bag.includes('こうさくのかけら')) return;
    await say(HAMO, ['ことりの いえを つくった みたいに、 みんなで なおそう!']);
    await fade(() => { flags.add(o.flag || 'nfBridge'); applySwaps(cur); });
    sfx('get'); save();
    await say('', ['こうさくの かけらが ひかった!', '{トントン|とんとん}、 {カンカン|かんかん}……', 'はしが なおった!']);
  },
  // こわれた はしごを なおす
  async ladder() {
    await say('', ['おおきな {木|き}に はしごが かかっている。', 'でも、 はしごが こわれていて のぼれない……']);
    if (!bag.includes('こうさくのかけら')) return;
    await say(HAMO, ['よし、 また なおそう! @は そっちを もって!']);
    await fade(() => { flags.add('nestLadder'); applySwaps(cur); });
    sfx('get'); save();
    await say('', ['こうさくの かけらが ひかった!', '{トントン|とんとん}、 {カンカン|かんかん}……', 'はしごが なおった! うえに のぼれる!']);
    await say('{メロ|めろ}', ['うえから、 ホーホーって こえが きこえる……'.replace('ホーホー', '{ホーホー|ほーほー}')]);
  },
  // どうくつの ランタンに ひを つける
  async torch(o) {
    if (!bag.includes('キャンプのかけら')) { await say('', ['ひの きえた ランタンだ。'.replace('ランタン', '{ランタン|らんたん}')]); return; }
    flags.add(o.lamp); save(); sfx('fire');
    await say('', [flags.has('lamp1') && flags.has('lamp2') && flags.has('lamp3') && flags.has('lamp4') && flags.has('lamp5') ? 'ぜんぶの {ランタン|らんたん}に ひが ついた! どうくつが あかるく なった。' : '{キャンプ|きゃんぷ}の かけらが ぽっと ひかって、 {ランタン|らんたん}に ひが ついた!']);
  },
  // たんけんかの ねこ: どうくつで おとした ぼうし
  async hat(o) {
    if (flags.has('hatDone')) { await say(o.name, ['ぼうし、 ほんとうに ありがとう!', 'これで また たんけん できるよ。']); return; }
    if (bag.includes('ぼうし')) {
      bag.splice(bag.indexOf('ぼうし'), 1); bag.push('げんきのみず', 'げんきのみず'); hero.gold += 500; flags.add('hatDone'); chipText = ''; save(); sfx('get');
      await say(o.name, ['あっ! それ、 ぼくの ぼうし!', 'くらい どうくつに はいって くれたんだね。 ありがとう!', 'これは おれいだよ。']);
      await say('', ['♪げんきの みずを 2こ もらった!', '♪500{円|えん} もらった!']);
      return;
    }
    flags.add('hatAsk'); save();
    await say(o.name, ['こんにちは。 ぼくは たんけんかの ねこ。', 'この さきの くらい どうくつで、\nだいじな ぼうしを おとして しまったんだ。', 'くらくて こわくて、 とりに いけないの……', 'もし みつけたら、 もってきて くれる?']);
  },
  // おとどろぼうの ミミズク
  owl(o) {
    encounter({ party: [o.party] }, { boss: true, onWin: () => { flags.add('owl'); save(); },
      afterWin: async () => {
        await say(o.name, ['ホー…… まいった。 きみたちは つよいなあ。', 'わたしは、 まちの いろんな おとが だいすきでね。', 'ふんすいの おと、 ことりの うた、 えんそうかい……\nひとりじめ したくて、 ぜんぶ もってきて しまったんだ。']);
        await say(HAMO, ['だったら、 まちに ききに くれば いいよ!', 'おとは みんなで きくと、 もっと たのしいんだ。']);
        await say('{メロ|めろ}', ['そうよ。 こんど おみせの {ステージ|すてーじ}で、\nわたしたちが えんそうするわ。 ききに きてね。']);
        await say(o.name, ['……いいのかい? ホー、 うれしいなあ。', 'じゃあ、 おとは ぜんぶ かえすよ。']);
        sfx('chord');
        await say('', ['ミミズクが つばさを ひろげると、'.replace('ミミズク', '{ミミズク|みみずく}'), 'たくさんの おとが きらきら ひかりながら、\nまちの ほうへ とんでいった!', '♪まちの おとが もどった!']);
        await say(HAMO, ['やったね、 @!', '{パルル|ぱるる}{町|まち}へ かえろう!']);
      } });
  },
  // ===== 第2章 さいご: ステージで はじめての がっそう =====
  async concert() {
    const MASTER = '{マスター|ますたー}', first = !flags.has('ch2');
    if (first) {
      await say(HAMO, ['@、 やろうよ! ぼくが {ギター|ぎたー}、 {メロ|めろ}さんが うた。', '@は {スネア|すねあ}だ!']);
      await say('{メロ|めろ}', ['みんなで いっしょに えんそうするの、 はじめてね。', 'ドキドキするけど…… たのしみ!'.replace('ドキドキ', '{ドキドキ|どきどき}')]);
    }
    await say('', ['ひかる しかくが、 まるい わに きたら タップ!', '{スネア|すねあ}を たたいて、 みんなと あわせよう!']);
    await fade(() => { stageShow.on = true; });
    if (first) { sfx('clap'); await say(MASTER, ['みなさん、 おまたせ しました!', 'こんやの えんそうは、 この 3にんです!']); }
    const r = await startConcert();
    sfx('clap');
    const best = r.score > (rec.concert || 0); if (best) rec.concert = r.score;
    save();
    await say('', [rankOf(r.score), `${r.score}てん!(ぴったり ${r.great}かい・いいね ${r.good}かい)`]);
    if (first) {
      await say('', ['パチパチパチ……! おおきな はくしゅ!'.replace('パチパチパチ', '{パチパチパチ|ぱちぱちぱち}')]);
      await say('おとどろぼうの {ミミズク|みみずく}', ['ホー! みんなで きく おとは、 こんなに たのしいんだね!']);
      await say(HAMO, ['みんなで えんそうするって、 いいね。', 'ぼく、 ずっと ひとりで ひいてたから……\nいま、 すごく うれしいんだ。']);
      await say('{メロ|めろ}', ['わたしも。 また 3にんで えんそう しましょうね。']);
    } else await say(MASTER, [best ? 'さいこう きろくだ! すばらしい!' : `さいこう きろくは ${rec.concert}てん だよ。 また きいて いきたいなあ。`]);
    await fade(() => { stageShow.on = false; });
    // ごほうび(data/concert.csv)
    for (const row of DATA.concert) { const need = +row.id, k = 'concert' + need; if (!(r.score >= need) || flags.has(k)) continue;
      const it = byId('items', row.prize), fu = !it && byId('furniture', row.prize); if (!it && !fu) continue;
      flags.add(k); if (it) bag.push(it.id); else room.stash.push(fu.id); save();
      await say(MASTER, [`${need}てん いじょう! これは おれいだよ。`, `♪${(it || fu).name}を もらった!`, ...(fu ? ['おうちの 「もようがえ」で おけるよ。'] : [])]);
    }
    if (!first) return;
    flags.add('ch2'); bag.push('がっそうのかけら'); save();
    await say('', ['@の むねの なかで、 なにかが あたたかく ひかった。', '♪「がっそう」の かけらを {手|て}に いれた!', '3にん そろうと、 たたかいで 「がっそう」が できる ように なった!']);
    // 第3章の よこく
    await fade(() => { view.on = true; view.kind = 'storm'; view.t0 = tm; });
    await say('', ['……その よる。', 'とおくの そらに、 くろい くもが ゆっくりと ひろがっていた。']);
    sfx('thunder');
    await say('', ['ゴロゴロ……'.replace('ゴロゴロ', '{ゴロゴロ|ごろごろ}')]);
    await fade(() => { view.on = false; view.kind = null; });
    await say('', ['だい2しょう 「たのしい まいにち」 おしまい。', 'つづく……']);
  },
  // ===== 第3章: あらしの せかい =====
  // パルル町に あらしが くる(第2章の あと、 まちに でた とき)
  async stormCome() {
    storm.flash = 0.6; sfx('thunder');
    await say('', ['{ゴロゴロ|ごろごろ}…… ピシャーン!'.replace('ピシャーン', '{ピシャーン|ぴしゃーん}'), 'くろい くもが、 まちの うえまで きていた。', 'つめたい あめが ふりだした……']);
    await say(HAMO, ['すごい あらしだ……', 'ひがしの のはらの ほうから、 くもが どんどん くるよ。']);
    await say('{メロ|めろ}', ['このままじゃ、 まちの みんなが こまって しまうわ。']);
    await say(HAMO, ['あらしの もとを さがしに いこう!', 'まちの ひがしから、 のはらへ でられるよ。']);
  },
  async windHint() {
    await say(HAMO, ['うわっ、 かぜが つよい!', 'かぜが ふくと、 うしろに おされちゃう。', 'いわの かげに かくれながら すすもう!']);
  },
  async swampHint() {
    await say('', ['あたりは まっくらだ。 あめで あかりも ちいさい……']);
    await say('{メロ|めろ}', ['かみなりが ひかると、 まわりが よく みえるわ。', 'いたの みちを よく みて すすみましょう。']);
  },
  // かみなりぐも(ボス)
  kumo(o) {
    encounter({ party: [o.party] }, { boss: true, onWin: () => { flags.add('kumo'); bag.push('げんきのみず', 'げんきのみず'); save(); },
      afterWin: async () => {
        await say(o.name, ['ゴロ…… まいった……'.replace('ゴロ', '{ゴロ|ごろ}'), 'ほんとうは ぼく、 あばれたく なかったんだ。', 'くろい かげが やってきて、\n「もっと あらしを おこせ」って いうから……']);
        await say(HAMO, ['くろい かげ?']);
        await say(o.name, ['かげは、 あの くらい もりの おくへ いったよ。', 'かげが いる かぎり、 あらしは やまないんだ。', 'ごめんね。 これ、 おわびの しるし。']);
        await say('', ['♪げんきの みずを 2こ もらった!']);
        await say('', ['かみなりぐもは、 ちいさく なって とんでいった。', '@は、 くらい もりを みて すこし ふるえていた。']);
        await say('{メロ|めろ}', ['だいじょうぶよ、 @。']);
        await say(HAMO, ['うん。 みんな いっしょだよ。', 'きょうは いちど まちへ もどって、 じゅんびを しよう。']);
      } });
  },
  // ===== 第3章 2かいめ: こわい もり(ゆうき) =====
  async pushTree() {
    if (!flags.has('kumo')) { await say('', ['おおきな {木|き}が たおれていて、 とおれない。', 'むこうに、 くらい もりが みえる……']); return; }
    await say('', ['おおきな {木|き}が たおれている。 むこうに くらい もりが みえる。']);
    await say(HAMO, ['みんなで おせば、 うごくかも!', 'せーの……!']);
    sfx('rise');
    await fade(() => { flags.add('treeMoved'); applySwaps(cur); });
    save();
    await say('', ['{ゴゴゴ|ごごご}…… {木|き}が うごいた!', 'くらい もりへの みちが ひらいた。']);
  },
  async scaryIntro() {
    await say('', ['くらくて、 しんと した もりだ。', '{ヒュウウ|ひゅうう}…… どこかで へんな おとが する。', '@は {ハモ|はも}の うしろに かくれた。']);
    await say('@', ['……こわいよう。']);
    await say(HAMO, ['だいじょうぶ。 ぼくが {手|て}を つないでるから。']);
    sfx('get');
    await say('', ['♪{ハモ|はも}と {手|て}を つないだ!']);
    await say('{メロ|めろ}', ['わたしも うしろに いるからね。']);
  },
  async aloneStart(z) {
    const L = {
      k1: [[HAMO, ['ここは みちが ほそくて、 ふたりで ならんで とおれないね。', 'ぼくは ここで まってる。 ちゃんと みてるから、 だいじょうぶ。']],
        ['', ['@は {ハモ|はも}の {手|て}を はなした……', '{ヒソヒソ|ひそひそ}…… こわい こえが きこえる。', '@は なきそうに なりながら、 いっぽ ふみだした。']]],
      k2a: [[HAMO, ['また ほそい みちだ。', '@、 いける? ぼくは ここで みてるよ。']], ['', ['@は ぐっと {手|て}を にぎって、 あるきだした。']]],
      k2b: [['{メロ|めろ}', ['@、 ゆっくりで いいのよ。']], [HAMO, ['ここで みてるからね。']]],
      br: [[HAMO, ['この はしは、 ひとりずつ しか わたれないんだって。', '@…… こわかったら、 もどって きても いいんだよ。']],
        ['', ['@は、 くびを よこに ふった。']], [HAMO, ['……うん。 ぼくは ここで、 ずっと みてる。', '@なら できるよ。']]],
    }[z.id] || [[HAMO, ['ぼくは ここで まってるよ。']]];
    for (const [n, l] of L) await say(n, l);
  },
  async aloneEnd(z) {
    const L = { k1: [HAMO, ['えらかったね、 @! ちゃんと みてたよ。']], k2a: [HAMO, ['すごい! どんどん つよく なってるね。']], k2b: ['{メロ|めろ}', ['よく がんばったわね、 @。']] }[z.id] || [HAMO, ['えらかったね!']];
    sfx('ok');
    await say('', ['{ハモ|はも}と {メロ|めろ}が おいついてきた。']);
    await say(...L);
    await say('', ['@は また {ハモ|はも}と {手|て}を つないだ。']);
  },
  // ひとりの はしを わたりきった → ゆうきの かけら
  async braveBridge() {
    if (flags.has('yuuki')) return;
    await say('@', ['{ハモ|はも}ー! わたれたよー!']);
    await fade(() => { trail.length = 0; });
    await say('', ['{ハモ|はも}と {メロ|めろ}が、 はしを わたって きた。']);
    await say(HAMO, ['すごいよ、 @! ひとりで わたれたね!']);
    await say('@', ['こわかった……', 'でも、 {ハモ|はも}が ずっと みてて くれたから いけた。']);
    await say(HAMO, ['……うん。 ずっと みてたよ。']);
    await say('{メロ|めろ}', ['@、 とっても かっこよかったわ。']);
    flags.add('yuuki'); bag.push('ゆうきのかけら'); save(); sfx('get');
    await say('', ['@の むねの なかで、 なにかが あたたかく ひかった。', '♪「ゆうき」の かけらを {手|て}に いれた!', 'こわい ばしょも、 すすめる ように なった!']);
  },
  async mayoiHint() {
    await say('{メロ|めろ}', ['あら、 みちが いくつも あるわ……']);
    await say(HAMO, ['みて! ホタルが いる。'.replace('ホタル', '{ホタル|ほたる}'), '{ホタル|ほたる}が とんでいく ほうへ いってみよう!']);
  },
  async fogHint() {
    await say('', ['くろい きりが たちこめている……', 'ゆうきの かけらが ぽっと ひかった。']);
    await say('@', ['……もう こわくない。 いこう!']);
  },
  // おおおばけ(ボス): おおきくて こうげきが ききにくい → 「ゆうき」で ちいさく なる
  obake(o) {
    encounter({ party: [o.party] }, { boss: true, scary: true, onWin: () => { flags.add('obake'); save(); },
      afterWin: async () => {
        await say(o.name, ['うわあん、 まいった〜……', 'ほんとうは ぼく、 こわがられて ばかりで、\nずっと ひとりぼっち だったんだ……', 'そしたら くろい かげが きて、\n「もっと みんなを こわがらせろ」って……']);
        await say('{メロ|めろ}', ['ひとりぼっちは、 さびしいわよね。']);
        await say(HAMO, ['こんどは こわがらせないで、\n「いっしょに あそぼう」って いってごらん。']);
        await say(o.name, ['……うん! やってみる!', 'くろい かげは、 きたの さむい やまの ほうへ とんでいったよ。']);
        await say('', ['おおおばけは ちいさく なって、 にこにこ {手|て}を ふった。']);
        await say('', ['……くしゅん!', '@の {体|からだ}が ぶるっと ふるえた。']);
        await say('{メロ|めろ}', ['あら、 @、 ほっぺが あついわ。 だいじょうぶ?']);
        await say(HAMO, ['あめに ぬれたからかな……', 'いちど まちへ もどって、 あったかく して やすもう。']);
      } });
  },
  // ===== パルル町の おてつだい: ちかしつの オルゴール =====
  async orgel(o) {
    const OR = '{オルゴール|おるごーる}';
    if (flags.has('orgelDone')) {
      if (flags.has('owl')) { sfx('note'); await say(o.name, [`きいて。 ${OR}が なるように なったのよ。`, '♪ ポロン ポロロン……'.replace('ポロン ポロロン', '{ポロン|ぽろん} {ポロロン|ぽろろん}'), 'ありがとうね。']); }
      else await say(o.name, [`${OR}、 ありがとうね。`, 'まちの おとが もどったら、 きっと また なるわ。']);
      return;
    }
    if (bag.includes('オルゴール')) {
      bag.splice(bag.indexOf('オルゴール'), 1); bag.push('げんきのみず'); hero.gold += 800; flags.add('orgelDone'); chipText = ''; save(); sfx('get');
      await say(o.name, [`まあ、 わたしの ${OR}! ありがとう!`, 'ねずみたちを おいはらって くれたのね。', 'ならして みようかしら…… あら、 おとが でないわ。', 'まちの おとが もどったら、 きっと なるわね。 これは おれいよ。']);
      await say('', ['♪げんきの みずを もらった!', '♪800{円|えん} もらった!']);
      return;
    }
    if (flags.has('orgelAsk')) { await say(o.name, [`ちかしつの おくに ${OR}が あるの。`, 'ねずみの まものに きを つけてね。']); return; }
    flags.add('orgelAsk'); save();
    await say(o.name, ['いらっしゃい。 ちょっと こまって いるの。', 'ちかしつに、 ねずみの まものが すみついて しまったのよ。', `おくに だいじな ${OR}を しまって あるの。\nとってきて くれないかしら?`, 'かいだんは あそこよ。']);
  },
  // おやぶん ねずみ
  mouse(o) {
    encounter({ party: [o.party] }, { boss: true, onWin: () => { flags.add('mouse'); save(); },
      afterWin: async () => {
        await say(o.name, ['ま、 まいった チュー!', 'そとが さむくて、 ここに すみついて しまった チュー……', 'ごめんなさい チュー!']);
        await say(HAMO, ['そうだったんだ。 こんどは ちゃんと おばあさんに たのんでみなよ。']);
        await say('', ['ねずみたちは チューチュー いいながら にげていった。'.replace('チューチュー', '{チューチュー|ちゅーちゅー}'), 'おくに たからばこが ある!']);
      } });
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
  for (const f of d.flags || []) flags.add(f);
  Object.values(MAPS).forEach(applySwaps);
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

// すべりこみ(axis: よせる むき、 dir: すすみたい むき)。 となりの マスも ふくめて、 すすめる マスの まんなかが 10ドット いないなら そっちへ
function slide(axis, dir, sp) {
  const X = axis === 'x', v = X ? player.x : player.y - 2, t = Math.floor(v / T);
  let best = null;
  for (const c of [t - 1, t, t + 1]) {
    const cv = c * T + 8, d = cv - v; if (Math.abs(d) >= 10) continue;
    const ok = X ? !hits(cv, player.y + dir * 3) : !hits(player.x + dir * 3, cv + 2);
    if (ok && (best === null || Math.abs(d) < Math.abs(best))) best = d;
  }
  if (best === null || Math.abs(best) < 0.3) return;
  const m = Math.sign(best) * Math.min(Math.abs(best), sp);
  if (X) { if (!hits(player.x + m, player.y)) player.x += m; } else if (!hits(player.x, player.y + m)) player.y += m;
}
// ===== カメラ(マップが画面より小さいときは まん中に) =====
function updateCamera() {
  const mw = cur.w * T, mh = cur.h * T;
  cam.x = mw <= VW ? Math.round((mw - VW) / 2) : Math.round(Math.max(0, Math.min(mw - VW, player.x - VW / 2)));
  cam.y = mh <= VH ? Math.round((mh - VH) / 2) : Math.round(Math.max(0, Math.min(mh - VH, player.y - 8 - VH / 2)));
}

// ===== 毎フレームの更新 =====
let tm = 0, chipText = '';
function updateChip() {
  const show = started && hero.name && !battle.on && !nameEntry.open && !menu.open && !shop.open && !deco.open && !paint.open && !jump.on && !stageShow.on;
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
  if (leap.on) { updateLeap(dt); hideAct(); return; }
  if (concert.on) { updateConcert(dt); hideAct(); return; }
  if (trans.on || nameEntry.open || menu.open || shop.open || deco.open || paint.open || jump.on) { hideAct(); if (jump.on) jump.t += dt; return; }
  if (dlg.open) { hideAct(); updateDialog(dt); return; }
  if (!started || !hero.name) return;
  autoT += dt; if (autoT > 30) { autoT = 0; save(); }   // 30秒ごとに自動セーブ
  if (cur.outside) tick(dt);                              // じかんは そとに いる ときだけ すすむ
  updateWeather(dt); updateHand(dt);
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
    const okX = !hits(nx, player.y); if (okX) player.x = nx;
    const ny = player.y + vy * sp;
    ex = exitAt(player.x, ny); if (ex) { goExit(ex); return; }
    const okY = !hits(player.x, ny); if (okY) player.y = ny;
    // すべりこみ: ほそい みちの いりぐちで すこし ずれていたら、 みちの まんなかへ よせる
    if (!okY && Math.abs(vy) >= Math.abs(vx)) slide('x', Math.sign(vy), sp);
    else if (!okX && Math.abs(vx) > Math.abs(vy)) slide('y', Math.sign(vx), sp);
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
  if (battle.on) drawBattle(ctx); else if (stageShow.on) drawConcert(ctx, tm); else if (view.on) (view.kind === 'storm' ? drawStorm() : drawView()); else drawField();
  if (!battle.on && !stageShow.on && !view.on) { if (rainy()) drawRain(); drawDark(); if (storm.flash > 0.4) { ctx.fillStyle = `rgba(255,255,240,${(storm.flash - 0.4) * 2.5})`; ctx.fillRect(0, 0, VW, VH); } }
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
  const k = darkness(), a = (cur.dark ? 1 : (cur.outside ? 1 : cur.deco ? 0.7 : 0) * k) * (1 - Math.min(1, storm.flash / 0.3));   // そとの よると どうくつ(dark)は 明るい丸の そとは まっくら(かみなりが ひかると みえる)
  if (a <= 0.01) return;
  const lights = [{ x: player.x - cam.x, y: player.y - 8 - cam.y, r: hand.alone ? 30 : cur.lightR || (bag.includes('キャンプのかけら') ? 80 : 40) }];
  if (hand.alone) { const w = at(...hand.alone.wait); lights.push({ x: w.x - cam.x, y: w.y - 8 - cam.y, r: 30 }); }   // まっている ハモの ところも すこし あかるい
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
  for (const o of live()) if (o.kind === 'enemy' && (o.night || cur.dark) && Math.floor(tm * 3 + o.hx) % 9) {
    const rh = o.rise > 0 ? Math.round(16 * (1 - o.rise / RISE)) : 16; if (rh < 9) continue;   // でてくる とちゅうは 目が でてから
    const sx = Math.round(o.x - cam.x) - 8, sy = Math.round(o.y - cam.y) - rh, hop = o.moving && !(o.rise > 0) ? Math.round(Math.abs(Math.sin(tm * 8 + o.hx)) * -2) : 0;
    const look = byId('enemies', o.party[0])?.look, [ex1, ex2, ey] = eyePos(look);
    ctx.fillStyle = eyeColor(look);
    ctx.fillRect(sx + ex1, sy + ey + hop, 2, 2); ctx.fillRect(sx + ex2, sy + ey + hop, 2, 2);
  }
}
// あめ(と かぜの すじ)
function drawRain() {
  ctx.fillStyle = 'rgba(20,30,60,.22)'; ctx.fillRect(0, 0, VW, VH);
  const g = gusting(), side = cur.wind ? cur.wind.dx * (g ? 60 : 12) : -8;
  ctx.fillStyle = 'rgba(190,210,255,.55)';
  for (let i = 0; i < 70; i++) {
    const y = ((i * 37 + tm * 230) % 230) - 20, x = ((i * 71 + 400 + (y + 20) * side / 230 + tm * side) % 340 + 340) % 340 - 10;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 5);
  }
  if (gustSoon()) {            // かぜの すじ(ふく まえに うすく みえる)
    ctx.fillStyle = g ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.2)';
    for (let i = 0; i < 14; i++) { const y = (i * 53) % 190 + 4, x = ((i * 97 - tm * 260 * -cur.wind.dx) % 360 + 360) % 360 - 30; ctx.fillRect(Math.round(x), y, 22 + (i % 3) * 8, 1); }
  }
}
// 第3章の よこく: とおくの そらに くろい くもが ひろがる
function drawStorm() {
  const g = ctx, k = Math.min(1, (tm - view.t0) / 6);
  for (let y = 0; y < 130; y++) { const f = y / 130; g.fillStyle = `rgb(${70 + f * 150 | 0},${50 + f * 60 | 0},${110 - f * 30 | 0})`; g.fillRect(0, y, VW, 1); }
  g.fillStyle = '#3a3050'; g.beginPath(); g.ellipse(160, 140, 220, 34, 0, 0, 7); g.fill();
  g.fillStyle = '#2a2440'; g.fillRect(0, 140, VW, 60);
  // パルル町の あかり(ひだり)
  for (let i = 0; i < 6; i++) { g.fillStyle = '#1a1830'; g.fillRect(30 + i * 12, 128 - (i % 2) * 4, 9, 12 + (i % 2) * 4); g.fillStyle = (Math.floor(tm * 2) + i) % 4 ? '#ffd23f' : '#ff9a3a'; g.fillRect(33 + i * 12, 132, 2, 2); }
  // くろい くも(みぎから ひろがる)
  for (let i = 0; i < 18; i++) { const x = 330 - (i / 17) * 280 * k - Math.sin(tm + i) * 4, y = 20 + (i % 4) * 12 + Math.sin(i * 1.7) * 6;
    g.fillStyle = i % 3 ? '#1e1a2a' : '#2c2638'; g.beginPath(); g.arc(x, y, 16 + (i % 3) * 5, 0, 7); g.fill(); }
  // かみなり
  if (k > 0.5 && (tm * 0.7) % 2 < 0.08) { g.fillStyle = 'rgba(255,255,230,.5)'; g.fillRect(0, 0, VW, VH); g.fillStyle = '#fff6a0'; let x = 240, y = 50; for (let i = 0; i < 6; i++) { const nx = x + (i % 2 ? 8 : -6); g.fillRect(Math.min(x, nx), y, Math.abs(nx - x) + 2, 2); g.fillRect(nx, y, 2, 12); x = nx; y += 12; } }
  // うしろすがたの 3にん
  g.drawImage(charSprite('hamo', 'up', 0), 120, 156, 24, 32); g.drawImage(heroSprite('up', 0, equipLook()), 148, 158, 24, 32); g.drawImage(charSprite('melo', 'up', 0), 176, 156, 24, 32);
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
    if (hand.alone) { const w = at(hand.alone.wait[0] + i * 0.9, hand.alone.wait[1] + i * 0.2), dx = player.x - w.x, dy = player.y - w.y;   // ほそい みちの てまえで まっている
      return { kind: 'follower', pal: m.pal, x: w.x, y: w.y, dir: Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'), moving: false }; }
    if (cur.scary && i === 0 && !jump.on) {                           // こわい もり: ハモが となりで てを つなぐ
      const side = player.dir === 'left' || player.dir === 'right';
      return { kind: 'follower', pal: m.pal, x: player.x + (side ? (player.dir === 'left' ? 3 : -3) : 11), y: player.y + (side ? 5 : 0), dir: player.dir, moving: player.moving, hand: true };
    }
    const f = trail[(cur.scary ? 7 : 7 + i * 7)] || trail[trail.length - 1] || { x: player.x, y: player.y + 1, dir: player.dir };
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
    const jy = tg.on && e === player ? -Math.round(tgHeight() * 4 * tg.ph * (1 - tg.ph)) : leap.on && (e === player || e.kind === 'follower') ? leapY() : 0;
    if (e.kind === 'boss') { ctx.drawImage(enemySprite(e.look), sx - 16, sy - 30 + Math.round(Math.sin(tm * 3) * 1.5), 32, 32); continue; }
    if (e === player) { img = heroSprite(e.dir, e.moving ? Math.floor(e.anim * 9) % 4 : 0, equipLook()); }
    if (e.hand && (e.dir === 'up' || e.dir === 'down')) { ctx.fillStyle = '#ffe2b8'; ctx.fillRect(sx - 7, sy - 7, 4, 1); }   // つないだ て
    else if (e.kind === 'follower') img = charSprite(e.pal, e.dir, e.moving ? Math.floor(player.anim * 9) % 4 : 0);
    else if (e.kind === 'npc') img = charSprite(e.pal, e.dir, 0);
    else if (e.kind === 'sign') img = SPR.sign;
    else if (e.kind === 'item') img = SPR[e.pic] || SPR.potion;
    else img = e.taken ? SPR.chestOpen : SPR.chest;
    ctx.drawImage(img, sx - 6 + (e === player && hand.alone ? Math.floor(tm * 18) % 2 : 0), sy - 15 + jy);   // ひとりの ときは ぶるぶる
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
globalThis.bouken = { get tg() { return tg; }, player, bag, hero, battle, get map() { return mapName(); }, get near() { return near; }, get objs() { return cur.objs; }, get rows() { return cur.rows; } };

let last = performance.now();
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
updateCamera();
requestAnimationFrame(loop);

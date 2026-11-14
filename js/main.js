// ぼうけんの たび — 本体
import { T, BLOCK, tileImg } from './tiles.js';
import { charSprite, SPR } from './sprites.js';
import { dlg, openDialog as openDlg, advance, updateDialog, rubyHTML } from './dialog.js';
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
  m.objs = m.objs.map(o => ({ dir: 'down', ...o, key: `${name}:${o.x},${o.y}`, ...at(o.x, o.y) }));  // key はセーブで使う名札
}
let cur = village;
const bag = [];                          // 手に入れた物(戦闘で使う予定)

// ===== キャラ =====
const START = { map: 'village', ...at(5, 8) };
const player = { x: START.x, y: START.y, dir: 'down', anim: 0, moving: false };
const live = () => cur.objs.filter(o => !o.gone);

// ===== 当たり判定 =====
function solidAt(x, y) {
  const tx = Math.floor(x / T), ty = Math.floor(y / T);
  if (tx < 0 || ty < 0 || tx >= cur.w || ty >= cur.h) return true;
  if (BLOCK.has(cur.rows[ty][tx])) return true;
  for (const o of live()) {
    if (o.kind === 'look' || o.kind === 'item') continue;  // 家具はタイルで止まる/落ちている物は通れる
    if (x > o.x - 6 && x < o.x + 6 && y > o.y - 6 && y < o.y + 1) return true;
  }
  return false;
}
const hits = (x, y) => solidAt(x - 5, y - 5) || solidAt(x + 5, y - 5) || solidAt(x - 5, y - 1) || solidAt(x + 5, y - 1);
// 出入り口にふれたか
function exitAt(x, y) {
  for (const e of cur.exits) {
    const x0 = e.x * T, y0 = e.y * T, x1 = x0 + (e.w || 1) * T, y1 = y0 + (e.h || 1) * T;
    if (x + 5 > x0 && x - 5 < x1 && y - 1 > y0 && y - 5 < y1) return e;
  }
  return null;
}

// ===== 場面の切り替え(暗くなって → 明るくなる) =====
const FADE = 0.25;
const trans = { on: false, t: 0, exit: null };
function goExit(e) {
  stickRelease();
  trans.on = true; trans.t = 0; trans.exit = e;
}
function updateTrans(dt) {
  const before = trans.t;
  trans.t += dt;
  if (before < FADE && trans.t >= FADE) {        // まっくらの間に マップを入れかえる
    const e = trans.exit;
    cur = MAPS[e.to];
    Object.assign(player, at(e.at[0], e.at[1]));
    player.dir = e.dir || player.dir; player.anim = 0; player.moving = false;
    updateCamera();
    save();
  }
  if (trans.t >= FADE * 2) trans.on = false;
}
const fadeAlpha = () => !trans.on ? 0 : trans.t < FADE ? trans.t / FADE : Math.max(0, 2 - trans.t / FADE);

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
function openDialog(name, lines, onEnd) { stickRelease(); openDlg(name, lines, onEnd); }

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
  if (trans.on) return;
  if (dlg.open) { advance(); return; }
  if (e.target.closest('#act')) { if (near) interact(near); return; }
  const p = local(e), wx = p.x / S + cam.x, wy = p.y / S + cam.y;
  if (near && Math.abs(wx - near.x) < 10 && wy > near.y - 18 && wy < near.y + 3) { interact(near); return; } // 近くの人や物を直接タップ
  if (stick.id !== null) return;
  stick.id = e.pointerId; stick.bx = p.x; stick.by = p.y; stickMove(p); stickShow(true);
});
addEventListener('pointermove', e => { if (e.pointerId === stick.id) stickMove(local(e)); });
addEventListener('pointerup', e => { if (e.pointerId === stick.id) stickRelease(); if (hold.timer) { holdCancel(); start(); } }); // 短く押しただけなら ふつうに始める
addEventListener('pointercancel', e => { if (e.pointerId === stick.id) stickRelease(); holdCancel(); });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
document.addEventListener('contextmenu', e => e.preventDefault());

// キーボード(Macで確認する用)
const keys = {};
addEventListener('keydown', e => {
  if (parentOpen()) return;              // 保護者メニューで文字を打っているとき
  keys[e.key] = true;
  if (e.key === ' ' || e.key === 'Enter' || e.key === 'z') {
    if (!started) start(); else if (trans.on) return; else if (dlg.open) advance(); else if (near) interact(near);
  }
});
addEventListener('keyup', e => { keys[e.key] = false; });

// ===== 調べる・話す・ひろう =====
let talkedOnce = false;
function interact(o) {
  talkedOnce = true; $('hint2').style.display = 'none';
  if (o.kind === 'npc') {
    const dx = player.x - o.x, dy = player.y - o.y;
    o.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    if (o.ifHave && bag.includes(o.ifHave.item)) { openDialog(o.name, o.ifHave.lines); return; }
  }
  if (o.taken) { openDialog(o.name, o.after || ['もう なにも ない。']); return; }
  if (o.give) {
    o.taken = true; bag.push(o.give);
    markTaken(o);
    save();
  }
  openDialog(o.name, o.lines);
}
function markTaken(o) {
  o.taken = true;
  if (o.kind === 'item') o.gone = true;
  if (o.kind === 'chest') o.label = 'しらべる';
}

// ===== セーブ(自動) =====
function allObjs() { return Object.values(MAPS).flatMap(m => m.objs); }
function save() {
  if (!started) return;
  writeSave({
    v: 1, map: Object.keys(MAPS).find(k => MAPS[k] === cur),
    x: Math.round(player.x), y: Math.round(player.y), dir: player.dir,
    bag: [...bag], done: allObjs().filter(o => o.taken).map(o => o.key), talked: talkedOnce,
  });
}
function load(d) {
  cur = MAPS[d.map] || village;
  Object.assign(player, { x: d.x, y: d.y, dir: d.dir });
  if (!MAPS[d.map] || hits(player.x, player.y) || exitAt(player.x, player.y)) {  // マップを作り直して 入れない場所になっていたら 村の最初の場所へ
    cur = MAPS[START.map]; Object.assign(player, { x: START.x, y: START.y });
  }
  bag.push(...d.bag);
  const done = new Set(d.done);
  for (const o of allObjs()) if (done.has(o.key)) markTaken(o);
  talkedOnce = d.talked;
  updateCamera();
}
let autoT = 0;
addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

// ===== はじめる =====
let hintPhase = 0, walked = 0;
const saved = readSave();
if (saved) { load(saved); $('taptxt').innerHTML = rubyHTML('{タップ|たっぷ}して つづきから'); }
function start() {
  if (started) return;
  started = true; $('title').style.display = 'none';
  const el = document.documentElement;
  try { const p = el.requestFullscreen && el.requestFullscreen({ navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (_) {}
  try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => {}); } catch (_) {}
  if (saved) { hintPhase = 2; return; }   // つづきからは すぐ遊べる
  setTimeout(() => openDialog('', ['{目|め}が さめた。 いい {天気|てんき}だ!', 'どこへ いこうかな?'], () => { hintPhase = 1; $('hint1').style.display = 'block'; }), 300);
}

// ===== 保護者メニュー =====
const parentOpen = () => $('parent').style.display === 'flex';
function holdStart() { holdCancel(); hold.timer = setTimeout(() => { hold.timer = null; openParent(); }, 3000); }
function holdCancel() { if (hold.timer) { clearTimeout(hold.timer); hold.timer = null; } }
let armed = null;                        // 「もう一度押してください」の確認待ち
function pmsg(t, err) { $('pMsg').textContent = t; $('pMsg').className = err ? 'err' : ''; }
function openParent() { armed = null; pmsg(''); $('pCode').value = ''; $('parent').style.display = 'flex'; }
$('pClose').addEventListener('click', () => { $('parent').style.display = 'none'; });
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
let tm = 0;
function update(dt) {
  tm += dt;
  if (trans.on) { updateTrans(dt); $('act').style.display = 'none'; return; }
  if (dlg.open) { updateDialog(dt); return; }
  if (!started) return;
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
  updateCamera();
  // 近くにあるものを探す
  near = null; let best = 24;
  for (const o of live()) { const d = Math.hypot(o.x - player.x, o.y - player.y); if (d < best) { best = d; near = o; } }
  const act = $('act');
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
  const x0 = Math.max(0, Math.floor(cam.x / T)), y0 = Math.max(0, Math.floor(cam.y / T));
  for (let ty = y0; ty <= y0 + Math.ceil(VH / T); ty++) for (let tx = x0; tx <= x0 + Math.ceil(VW / T); tx++) {
    if (tx >= cur.w || ty >= cur.h) continue;
    ctx.drawImage(tileImg(cur.rows[ty][tx], tx, ty, tm), tx * T - cam.x, ty * T - cam.y);
  }
  const ents = [player, ...live().filter(o => o.kind !== 'look')].sort((a, b) => a.y - b.y);
  for (const e of ents) {
    const sx = Math.round(e.x - cam.x), sy = Math.round(e.y - cam.y);
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(sx - 4, sy - 1, 8, 2); ctx.fillRect(sx - 3, sy - 2, 6, 4);   // 影
    let img;
    if (e === player) img = charSprite('hero', e.dir, e.moving ? Math.floor(e.anim * 9) % 4 : 0);
    else if (e.kind === 'npc') img = charSprite(e.pal, e.dir, 0);
    else if (e.kind === 'sign') img = SPR.sign;
    else if (e.kind === 'item') img = SPR.potion;
    else img = e.taken ? SPR.chestOpen : SPR.chest;
    ctx.drawImage(img, sx - 6, sy - 15);
    if ((e.kind === 'chest' && !e.taken || e.kind === 'item') && (tm % 1.4) < .35) { ctx.fillStyle = '#fff'; ctx.fillRect(sx + 3, sy - 14, 1, 3); ctx.fillRect(sx + 2, sy - 13, 3, 1); } // きらっ
  }
  const a = fadeAlpha();
  if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, VW, VH); }
}

// 確認用(Macのブラウザの開発ツールから bouken.player などを見られる)
globalThis.bouken = { player, bag, get map() { return Object.keys(MAPS).find(k => MAPS[k] === cur); }, get near() { return near; } };

let last = performance.now();
function loop(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }
updateCamera();
requestAnimationFrame(loop);

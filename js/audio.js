// 音(Web Audio で FM音源ふうに鳴らす)
import { SONGS } from './music.js';

let ac = null, master, musicBus, sfxBus, reverb, noise;
const LEVELS = [0, 0.35, 0.65, 1];         // 音量: オフ / 小 / 中 / 大
let level = 2;
const SETTINGS_KEY = 'bouken-settings';
try { const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); if ([0, 1, 2, 3].includes(s.level)) level = s.level; } catch (_) {}

export const getLevel = () => level;
export function setLevel(n) {
  level = n;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ level })); } catch (_) {}
  if (master) master.gain.setTargetAtTime(LEVELS[level], ac.currentTime, 0.05);
}

// 最初のタップのときに呼ぶ(ブラウザの決まりで、それまでは音を出せない)
export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.gain.value = LEVELS[level];
  const comp = ac.createDynamicsCompressor();
  master.connect(comp).connect(ac.destination);
  musicBus = ac.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
  sfxBus = ac.createGain(); sfxBus.gain.value = 0.8; sfxBus.connect(master);
  // ひびき(リバーブ)
  reverb = ac.createConvolver();
  const len = ac.sampleRate * 1.6 | 0, ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  reverb.buffer = ir;
  const wet = ac.createGain(); wet.gain.value = 0.22; reverb.connect(wet).connect(musicBus);
  // ノイズ(ドラム用)
  noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  // 画面を消したら止め、戻ったら再開
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') ac.suspend(); else ac.resume(); });
  setInterval(tick, 25);
}

// ===== 音色 =====
const freqOf = m => 440 * Math.pow(2, (m - 69) / 12);
// FM の1音: 変調の強さ(index)が だんだん弱まることで「カーン → ぽわーん」と変わる
function fm(t, f, dur, o, dest) {
  const car = ac.createOscillator(); car.frequency.value = f;
  const amp = ac.createGain();
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(o.vol, t + o.atk);
  amp.gain.setTargetAtTime(0, t + o.atk, o.dec);
  amp.gain.setTargetAtTime(0, t + dur, o.rel);
  const end = t + dur + o.rel * 6;
  for (const [ratio, i0, i1, it] of o.mods) {
    const mod = ac.createOscillator(); mod.frequency.value = f * ratio;
    const mg = ac.createGain();
    mg.gain.setValueAtTime(f * ratio * i0, t);
    mg.gain.exponentialRampToValueAtTime(Math.max(0.01, f * ratio * i1), t + it);
    mod.connect(mg).connect(car.frequency); mod.start(t); mod.stop(end);
  }
  if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * o.vib, t + 0.4); l.connect(lg).connect(car.frequency); l.start(t); l.stop(end); }
  car.connect(amp); amp.connect(dest);
  if (o.send) { const s = ac.createGain(); s.gain.value = o.send; amp.connect(s).connect(reverb); }
  car.start(t); car.stop(end);
}
//            mods: [倍率, 最初の強さ, 最後の強さ, 何秒で]
const EP   = { vol: .07, atk: .004, dec: .9, rel: .15, send: 1, mods: [[1, 1.8, .2, .6], [14, .5, .01, .08]] };          // エレピ
const BASS = { vol: .32, atk: .006, dec: .45, rel: .05, mods: [[1, 1.3, .3, .25]] };                                     // ベース
const LEAD = { vol: .10, atk: .03, dec: 1.4, rel: .12, send: 1.2, vib: .004, mods: [[2, .9, .35, .5]] };               // メロディ
const SLAP = { vol: .30, atk: .004, dec: .22, rel: .04, mods: [[1, 2.4, .4, .12]] };                                     // はねるベース
const GTR  = { vol: .035, atk: .002, dec: .05, rel: .03, mods: [[3, 2.2, .4, .05], [1, 1, .3, .05]] };               // 刻むギター
const BLIP = { vol: .04, atk: .002, dec: .03, rel: .02, mods: [[1, .6, .2, .03]] };

function kick(t, v) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .12);
  g.gain.setValueAtTime(.8 * v, t); g.gain.exponentialRampToValueAtTime(.001, t + .3);
  o.connect(g).connect(musicBus); o.start(t); o.stop(t + .32);
}
function hiss(t, v, type, freq, q, dur, dest) {
  const s = ac.createBufferSource(); s.buffer = noise;
  const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f).connect(g).connect(dest); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  return g;
}
function snare(t, v) {
  const g = hiss(t, .3 * v, 'bandpass', 1800, .8, .14, musicBus);
  const s = ac.createGain(); s.gain.value = .5; g.connect(s).connect(reverb);
  const o = ac.createOscillator(), og = ac.createGain(); o.type = 'triangle'; o.frequency.value = 190;
  og.gain.setValueAtTime(.18 * v, t); og.gain.exponentialRampToValueAtTime(.001, t + .08);
  o.connect(og).connect(musicBus); o.start(t); o.stop(t + .1);
}
const hat = (t, v, open) => hiss(t, .09 * v, 'highpass', 7000, .5, open ? .14 : .035, musicBus);

// ===== 楽譜を読む =====
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(name) {
  const m = /^([A-G])([b#]?)(-?\d)$/.exec(name); if (!m) return null;
  return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
function line(str) {   // 'A4:4 C5:2' → [{step, m, len}]
  const out = []; let s = 0;
  for (const tk of (str || '').trim().split(/\s+/).filter(Boolean)) {
    const [n, l] = tk.split(':'); const len = +l || 1;
    if (n !== 'r') { const m = midi(n); if (m !== null) out.push({ step: s, m, len }); }
    s += len;
  }
  return out;
}
function compile(song) {
  const bars = Math.max(song.melody.length, song.chords.length, song.bass.length);
  const ev = [];   // {step, fn}
  for (let b = 0; b < bars; b++) {
    const base = b * 16;
    const mel = song.melody[b % song.melody.length];
    const chordStr = song.chords[b % song.chords.length].split('|');
    const chordAt = st => line(chordStr[st >= 8 && chordStr[1] ? 1 : 0].trim().split(/\s+/).map(n => n + ':1').join(' ')).map(x => x.m);
    // エレピ
    const pat = mel ? song.comp : song.comp2;
    const hits = [...pat].map((c, i) => c === 'x' ? i : -1).filter(i => i >= 0);
    hits.forEach((st, k) => {
      const len = (hits[k + 1] ?? 16) - st;
      chordAt(st).forEach((m, j) => ev.push({ step: base + st, fn: (t, sd) => fm(t + j * .008, freqOf(m), len * sd * .9, EP, musicBus) }));
    });
    // ベース
    for (const n of line(song.bass[b % song.bass.length])) ev.push({ step: base + n.step, fn: (t, sd) => fm(t, freqOf(n.m), n.len * sd * .85, song.bassSound === 'slap' ? SLAP : BASS, musicBus) });
    // ギター(ある曲だけ)
    if (song.gtr) [...song.gtr].forEach((c, i) => { if (c === '.') return; chordAt(i).slice(-3).forEach((m, j) => ev.push({ step: base + i, fn: (t, sd) => fm(t + j * .004, freqOf(m), sd * .6, { ...GTR, vol: GTR.vol * (c === 'g' ? .5 : 1) }, musicBus) })); });
    // メロディ
    for (const n of line(mel)) ev.push({ step: base + n.step, fn: (t, sd) => fm(t, freqOf(n.m), n.len * sd * .95, LEAD, musicBus) });
    // ドラム
    const fill = (b % 8) === 7, d = song.drums;
    [...(fill ? d.kickFill : d.kick)].forEach((c, i) => { if (c !== '.') ev.push({ step: base + i, fn: t => kick(t, c === 'g' ? .5 : 1) }); });
    [...(fill ? d.snareFill : d.snare)].forEach((c, i) => { if (c !== '.') ev.push({ step: base + i, fn: t => snare(t, c === 'g' ? .35 : 1) }); });
    [...d.hat].forEach((c, i) => { if (c !== '.') ev.push({ step: base + i, fn: t => hat(t, i % 4 === 0 ? 1 : .6, c === 'o') }); });
  }
  const byStep = Array.from({ length: bars * 16 }, () => []);
  for (const e of ev) byStep[e.step].push(e.fn);
  return { byStep, len: bars * 16, sd: 60 / song.bpm / 4, swing: song.swing || 0 };
}
const compiled = {};

// ===== 曲を流す(先読みして予約する) =====
const play = { song: null, name: null, step: 0, next: 0, gain: null };
function tick() {
  if (!play.song || ac.state !== 'running') return;
  const s = play.song;
  if (play.next < ac.currentTime) play.next = ac.currentTime + .05;   // 止まっていたら 今から
  while (play.next < ac.currentTime + .15) {
    const i = play.step % s.len;
    const t = play.next + (i % 2 ? s.swing * s.sd : 0);
    for (const fn of s.byStep[i]) fn(t, s.sd);
    play.next += s.sd; play.step++;
  }
}
export function playBgm(name) {
  if (!ac || play.name === name) return;
  play.name = name;
  if (!SONGS[name]) { play.song = null; return; }
  play.song = compiled[name] || (compiled[name] = compile(SONGS[name]));
  play.step = 0; play.next = ac.currentTime + .1;
}

// ===== 効果音 =====
function duck(sec) {   // 効果音の間だけ 曲を小さく
  const g = musicBus.gain, t = ac.currentTime;
  g.cancelScheduledValues(t); g.setTargetAtTime(.15, t, .03); g.setTargetAtTime(.55, t + sec, .3);
}
let typeCount = 0;
export function sfx(name) {
  if (!ac || ac.state !== 'running') return;
  const t = ac.currentTime + .01;
  switch (name) {
    case 'type':   // 文字が出る音(2文字に1回)
      if (typeCount++ % 2) return;
      fm(t, 1180 + (typeCount % 3) * 60, .025, BLIP, sfxBus); break;
    case 'ok':     // 話しかける・調べる
      fm(t, 660, .05, { ...BLIP, vol: .12, dec: .08 }, sfxBus); fm(t + .06, 990, .07, { ...BLIP, vol: .12, dec: .1 }, sfxBus); break;
    case 'next':   // 会話を進める
      fm(t, 880, .04, { ...BLIP, vol: .07, dec: .05 }, sfxBus); break;
    case 'get':    // 物を手に入れた!
      duck(1.3);
      [72, 76, 79, 84].forEach((m, i) => fm(t + i * .09, freqOf(m), .12, { ...LEAD, vol: .16, send: .6, vib: 0 }, sfxBus));
      [72, 76, 79, 83].forEach(m => fm(t + .38, freqOf(m), .7, { ...EP, vol: .09 }, sfxBus)); break;
    case 'encounter': // てきに ぶつかった
      [76, 72, 76, 72, 79].forEach((m, i) => fm(t + i * .06, freqOf(m), .05, { ...BLIP, vol: .12, dec: .06 }, sfxBus)); break;
    case 'hit':    // こうげきが あたった
      hiss(t, .35, 'bandpass', 1200, .7, .12, sfxBus);
      { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(60, t + .1);
        g.gain.setValueAtTime(.3, t); g.gain.exponentialRampToValueAtTime(.001, t + .15); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .16); } break;
    case 'hurt': { // じぶんが ダメージを うけた
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square';
      o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(110, t + .2);
      g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.001, t + .25); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .26);
      hiss(t, .2, 'lowpass', 800, .7, .15, sfxBus); break;
    }
    case 'guitar': // ハモの ギター(ジャラ〜ン)
      duck(2.5);
      [52, 59, 62, 66, 71, 74].forEach((m, i) => fm(t + i * .06, freqOf(m), 2, { ...EP, vol: .1, send: .7 }, sfxBus));
      [64, 66, 71, 69].forEach((m, i) => fm(t + 1 + i * .25, freqOf(m), .5, { ...EP, vol: .08, send: .7 }, sfxBus)); break;
    case 'rise':   // よるの まものが じめんから でてくる(ゴゴゴ)
      hiss(t, .22, 'lowpass', 180, 1, .9, sfxBus); hiss(t + .3, .16, 'lowpass', 140, 1, .8, sfxBus); break;
    case 'drum':   // スネア
      hiss(t, .35, 'highpass', 1500, .7, .12, sfxBus); hiss(t + .09, .3, 'highpass', 1500, .7, .1, sfxBus); hiss(t + .18, .4, 'bandpass', 900, .8, .2, sfxBus); break;
    case 'note':   // おんぷ
      [79, 83, 86, 91].forEach((m, i) => fm(t + i * .08, freqOf(m), .12, { ...LEAD, vol: .07, send: 1, vib: 0 }, sfxBus)); break;
    case 'chord':  // ギターの コード
      [52, 59, 64, 67, 71].forEach((m, i) => fm(t + i * .015, freqOf(m), .6, { ...EP, vol: .08 }, sfxBus)); hiss(t, .1, 'bandpass', 2000, 1, .1, sfxBus); break;
    case 'stink':  // ぷしゅ〜
      hiss(t, .18, 'lowpass', 500, 1, .8, sfxBus); break;
    case 'lick': { // ぺろーん
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(900, t + .3);
      g.gain.setValueAtTime(.08, t); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .36); break; }
    case 'spit':   // ぺっ
      hiss(t, .25, 'bandpass', 3000, 1.5, .06, sfxBus); break;
    case 'boing': { // ぽよん
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(500, t + .1); o.frequency.exponentialRampToValueAtTime(250, t + .3);
      g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .36); break; }
    case 'step':   // よるの まものの あしおと(ざっ)
      hiss(t, .14, 'bandpass', 650, 1.2, .09, sfxBus); hiss(t + .02, .18, 'lowpass', 250, .7, .08, sfxBus); break;
    case 'miss':   // よけた
      { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(400, t); o.frequency.exponentialRampToValueAtTime(1200, t + .15);
        g.gain.setValueAtTime(.07, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .2); } break;
    case 'swing':  // わざ
      hiss(t, .18, 'bandpass', 2500, 1.5, .18, sfxBus); break;
    case 'magic':  // じゅもんを となえた
    case 'heal':   // かいふく
      [72, 76, 79, 84, 88].forEach((m, i) => fm(t + i * .05, freqOf(m + (name === 'magic' ? -5 : 0)), .1, { ...LEAD, vol: .07, send: 1, vib: 0 }, sfxBus)); break;
    case 'defeat': // てきを やっつけた
      [84, 79, 76, 72].forEach((m, i) => fm(t + i * .045, freqOf(m), .04, { ...BLIP, vol: .09, dec: .05 }, sfxBus)); break;
    case 'run':    // にげる
      [60, 64, 67, 72].forEach((m, i) => fm(t + i * .04, freqOf(m), .04, { ...BLIP, vol: .08, dec: .05 }, sfxBus)); break;
    case 'win':    // かった!
      [67, 72, 76, 79].forEach((m, i) => fm(t + i * .1, freqOf(m), .1, { ...LEAD, vol: .14, send: .6, vib: 0 }, sfxBus));
      [72, 76, 79, 84].forEach(m => fm(t + .42, freqOf(m), 1.1, { ...EP, vol: .08 }, sfxBus));
      fm(t + .42, freqOf(84), 1.1, { ...LEAD, vol: .14, send: .8 }, sfxBus); break;
    case 'lvup':   // レベルアップ
      duck(1.6);
      [72, 74, 76, 77, 79, 81, 83, 84].forEach((m, i) => fm(t + i * .06, freqOf(m), .07, { ...LEAD, vol: .12, send: .6, vib: 0 }, sfxBus));
      [72, 76, 79, 84].forEach(m => fm(t + .5, freqOf(m), .9, { ...EP, vol: .09 }, sfxBus)); break;
    case 'lose':   // まけた
      [67, 66, 65, 64].forEach((m, i) => fm(t + i * .3, freqOf(m), .28, { ...LEAD, vol: .1, send: 1 }, sfxBus)); break;
    case 'slash':  // 斬る
      { const s = hiss(t, .25, 'bandpass', 3000, 2, .14, sfxBus); } hiss(t + .05, .12, 'highpass', 5000, .7, .08, sfxBus); break;
    case 'fire': { // ほのお: ゴォーッと もえる
      const s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = 'lowpass';
      f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2400, t + .35); f.frequency.exponentialRampToValueAtTime(500, t + .7);
      const g = ac.createGain(); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.5, t + .1); g.gain.exponentialRampToValueAtTime(.001, t + .75);
      s.connect(f).connect(g).connect(sfxBus); s.start(t); s.stop(t + .8);
      for (let i = 0; i < 6; i++) hiss(t + .1 + Math.random() * .5, .15, 'highpass', 3000, .5, .02, sfxBus);   // パチパチ
      break;
    }
    case 'water':  // みず: ザバーン + あわ
      hiss(t, .35, 'bandpass', 900, .6, .45, sfxBus);
      for (let i = 0; i < 6; i++) { const o = ac.createOscillator(), g = ac.createGain(), tt = t + .1 + i * .07, f0 = 500 + Math.random() * 700;
        o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(f0 * 2.2, tt + .06);
        g.gain.setValueAtTime(.06, tt); g.gain.exponentialRampToValueAtTime(.001, tt + .07); o.connect(g).connect(sfxBus); o.start(tt); o.stop(tt + .08); }
      break;
    case 'thunder': { // かみなり: バリッ + ゴロゴロ
      hiss(t, .6, 'highpass', 1500, .5, .12, sfxBus);
      const s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
      const g = ac.createGain(); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.9, t + .08); g.gain.exponentialRampToValueAtTime(.001, t + .8);
      s.connect(f).connect(g).connect(sfxBus); s.start(t); s.stop(t + .85); break;
    }
    case 'wind': { // かぜ: ヒュルルー
      const s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6;
      f.frequency.setValueAtTime(600, t); f.frequency.exponentialRampToValueAtTime(2600, t + .3); f.frequency.exponentialRampToValueAtTime(900, t + .7);
      const g = ac.createGain(); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.7, t + .15); g.gain.exponentialRampToValueAtTime(.001, t + .75);
      s.connect(f).connect(g).connect(sfxBus); s.start(t); s.stop(t + .8); break;
    }
    case 'warp': { // 場面が切り替わる
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(160, t + .25);
      g.gain.setValueAtTime(.09, t); g.gain.exponentialRampToValueAtTime(.001, t + .3);
      o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .32);
      hiss(t, .05, 'lowpass', 900, .7, .3, sfxBus); break;
    }
  }
}

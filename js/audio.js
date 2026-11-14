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
    case 'warp': { // 場面が切り替わる
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(160, t + .25);
      g.gain.setValueAtTime(.09, t); g.gain.exponentialRampToValueAtTime(.001, t + .3);
      o.connect(g).connect(sfxBus); o.start(t); o.stop(t + .32);
      hiss(t, .05, 'lowpass', 900, .7, .3, sfxBus); break;
    }
  }
}

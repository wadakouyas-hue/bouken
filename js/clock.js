// ゲームの なかの じかん(ひる と よる)。 ながさは data/time.csv
import { byId } from './data.js';

export const clock = { t: 0 };   // あさから なんびょう たったか
const DUSK = 20, DAWN = 15;      // ゆうがた・あけがたに くらく/あかるく なる びょうすう
const mins = (id, def) => { const r = byId('time', id); return r && r.min > 0 ? r.min : def; };
export const dayLen = () => mins('ひる', 6) * 60;
export const nightLen = () => mins('よる', 2) * 60;

export function tick(dt) { clock.t = (clock.t + dt) % (dayLen() + nightLen()); }
export function toMorning() { clock.t = 0; }
// くらさ(0 = ひる 〜 1 = まよなか)
export function darkness() {
  const D = dayLen(), N = nightLen(), t = clock.t;
  if (t < D - DUSK) return 0;
  if (t < D) return (t - (D - DUSK)) / DUSK;
  if (t < D + N - DAWN) return 1;
  return Math.max(0, 1 - (t - (D + N - DAWN)) / DAWN);
}
// とけいの じこく(あさ 6じに はじまる。 ひる 6〜18じ、 よる 18〜6じ)。 h は 0〜24 の 小数
export function hourNow() {
  const D = dayLen(), N = nightLen(), t = clock.t;
  return (t < D ? 6 + 12 * t / D : 18 + 12 * (t - D) / N) % 24;
}
// こたえあわせの ことば(5ふん きざみ)
export function timeWords() {
  let mins = Math.floor(hourNow() * 12) * 5, h = Math.floor(mins / 60) % 24, m = mins % 60;
  const ampm = h === 12 ? 'おひるの' : h === 0 ? 'よなかの' : h < 12 ? '{午前|ごぜん}' : '{午後|ごご}', h12 = h % 12 || 12;
  if (m === 0) return `いま ${ampm} ${h12}{時|じ} ちょうど だよ。`;
  const fun = [10, 20, 30, 40, 50].includes(m) ? 'ぷん' : 'ふん';
  return `いま ${ampm} ${h12}{時|じ} ${m}{分|${fun}} だよ。` + (m === 30 ? `\n(${h12}じはん)` : '');
}
// よる(よるの まものが でる じかん)
export const isNight = () => darkness() >= 0.5;

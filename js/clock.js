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
// よる(よるの まものが でる じかん)
export const isNight = () => darkness() >= 0.5;

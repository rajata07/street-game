/** Road scroll speed in px/s after `t` seconds of play. */
export function speedAt(t: number): number {
  return Math.min(780, 340 + 9 * t);
}

/** Base seconds between traffic rows. */
export function spawnIntervalAt(t: number): number {
  return Math.max(0.6, 1.3 - 0.0125 * t);
}

/** Probability that a traffic row blocks two lanes instead of one. */
export function doubleBlockChanceAt(t: number): number {
  return Math.min(0.55, Math.max(0, t / 150));
}

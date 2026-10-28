import obstacleData from '../data/obstacles.json';
import { LANE_COUNT } from './config';
import { doubleBlockChanceAt, spawnIntervalAt } from './difficulty';
import { weightedPick, type Rng } from './rng';
import type { ObstacleType } from './types';

export const obstacleTypes: ObstacleType[] = obstacleData;

export interface SpawnRow {
  /** Seconds since the previous row. */
  gap: number;
  blocked: { lane: number; typeId: string }[];
  pickupLane: number | null;
}

/** Gaps shorter than this force the open lane to be adjacent to the previous open lane. */
const FREE_REACH_GAP = 1.0;
const PICKUP_CHANCE = 0.2;

export class Spawner {
  private timer = 0.8;
  private lastGap = 1.5;
  private prevFree: number[];

  constructor(
    private rng: Rng,
    private types: ObstacleType[] = obstacleTypes,
    private laneCount = LANE_COUNT,
  ) {
    this.prevFree = Array.from({ length: laneCount }, (_, i) => i);
  }

  holdOff(seconds: number): void {
    this.timer = Math.max(this.timer, seconds);
  }

  update(dt: number, t: number): SpawnRow | null {
    this.timer -= dt;
    if (this.timer > 0) return null;
    const interval = spawnIntervalAt(t) * (0.9 + 0.3 * this.rng());
    const row = this.buildRow(t, this.lastGap);
    this.lastGap = interval;
    this.timer += interval;
    return row;
  }

  /** Always leaves at least one open lane, reachable from a previously open lane when gaps are short. */
  buildRow(t: number, gap: number): SpawnRow {
    const lanes = Array.from({ length: this.laneCount }, (_, i) => i);
    const wantsDouble = this.rng() < doubleBlockChanceAt(t) && this.laneCount > 2;
    let blockedLanes: number[] = [];
    let free: number[] = lanes;

    for (let attempt = 0; attempt < 12; attempt++) {
      // With one blocked lane the row is always reachable, so the loop always terminates.
      const count = wantsDouble && attempt < 8 ? 2 : 1;
      blockedLanes = this.shuffle(lanes).slice(0, count);
      free = lanes.filter((l) => !blockedLanes.includes(l));
      const reachable = free.some((f) => this.prevFree.some((p) => Math.abs(f - p) <= 1));
      if (gap >= FREE_REACH_GAP || reachable) break;
    }

    const common = free.filter((l) => this.prevFree.includes(l));
    const pickupLane =
      common.length > 0 && this.rng() < PICKUP_CHANCE
        ? common[Math.floor(this.rng() * common.length)]
        : null;

    this.prevFree = free;
    const spawnable = this.types.filter((type) => type.weight > 0);
    return {
      gap,
      blocked: blockedLanes.map((lane) => ({
        lane,
        typeId: weightedPick(this.rng, spawnable, (type) => type.weight).id,
      })),
      pickupLane,
    };
  }

  private shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

import { describe, expect, it } from 'vitest';
import { overlaps, shrink } from '../src/core/collision';
import { doubleBlockChanceAt, spawnIntervalAt, speedAt } from '../src/core/difficulty';
import { createRng, weightedPick } from '../src/core/rng';
import { HighScoreStore } from '../src/core/highscore';
import { roadLaneCenterX, ROAD_WIDTH, LANE_COUNT } from '../src/core/config';
import obstacles from '../src/data/obstacles.json';
import events from '../src/data/events.json';

describe('collision', () => {
  it('detects overlap and separation', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('shrinks around the center', () => {
    expect(shrink({ x: 1, y: 2, w: 10, h: 20 }, 0.5)).toEqual({ x: 1, y: 2, w: 5, h: 10 });
  });
});

describe('difficulty', () => {
  it('speeds up and caps', () => {
    expect(speedAt(0)).toBe(340);
    expect(speedAt(10)).toBeGreaterThan(speedAt(0));
    expect(speedAt(10_000)).toBe(780);
  });

  it('shortens spawn interval down to a floor', () => {
    expect(spawnIntervalAt(0)).toBeCloseTo(1.3);
    expect(spawnIntervalAt(10_000)).toBe(0.6);
  });

  it('only double-blocks later in the run', () => {
    expect(doubleBlockChanceAt(0)).toBe(0);
    expect(doubleBlockChanceAt(10_000)).toBe(0.55);
  });
});

describe('weightedPick', () => {
  it('respects weights and rejects empty input', () => {
    const rng = createRng(3);
    for (let i = 0; i < 50; i++) {
      expect(weightedPick(rng, ['a', 'b'], (x) => (x === 'a' ? 0 : 1))).toBe('b');
    }
    expect(() => weightedPick(rng, [], () => 1)).toThrow();
  });
});

describe('HighScoreStore', () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    };
  };

  it('stores only new records', () => {
    const store = new HighScoreStore(memory());
    expect(store.get()).toBe(0);
    expect(store.submit(120)).toBe(true);
    expect(store.submit(80)).toBe(false);
    expect(store.get()).toBe(120);
  });

  it('survives missing or throwing storage', () => {
    expect(new HighScoreStore(null).get()).toBe(0);
    const broken = {
      getItem: () => {
        throw new Error('no');
      },
      setItem: () => {
        throw new Error('no');
      },
    };
    const store = new HighScoreStore(broken);
    expect(store.get()).toBe(0);
    expect(store.submit(10)).toBe(true);
  });
});

describe('game data', () => {
  const laneWidth = ROAD_WIDTH / LANE_COUNT;

  it('has valid obstacle definitions', () => {
    for (const o of obstacles) {
      expect(o.crashLines.length).toBeGreaterThan(0);
      expect(o.width).toBeGreaterThan(0);
      if (o.weight > 0) expect(o.width).toBeLessThanOrEqual(laneWidth - 10);
    }
    expect(obstacles.some((o) => o.id === 'band')).toBe(true);
    expect(obstacles.some((o) => o.id === 'cow')).toBe(true);
  });

  it('has valid, unique events', () => {
    const ids = events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of events) expect(e.caption.length).toBeGreaterThan(0);
  });

  it('keeps lane centers inside the road', () => {
    expect(roadLaneCenterX(0)).toBe(120);
    expect(roadLaneCenterX(2)).toBe(360);
  });
});

import { describe, expect, it } from 'vitest';
import { LANE_COUNT } from '../src/core/config';
import { EventDirector, eventDefs } from '../src/core/events';
import { createRng } from '../src/core/rng';
import { Spawner } from '../src/core/spawner';

describe('Spawner fairness', () => {
  it('always leaves a reachable open lane across many seeds and times', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const spawner = new Spawner(createRng(seed));
      let prevFree = [0, 1, 2];
      for (let t = 0; t < 300; t += 1.5) {
        const gap = 0.6 + (seed % 7) * 0.1;
        const row = spawner.buildRow(t, gap);
        const blocked = row.blocked.map((b) => b.lane);
        const free = [0, 1, 2].filter((l) => !blocked.includes(l));

        expect(new Set(blocked).size).toBe(blocked.length);
        expect(free.length).toBeGreaterThanOrEqual(1);
        expect(blocked.length).toBeLessThan(LANE_COUNT);
        if (gap < 1.0) {
          expect(free.some((f) => prevFree.some((p) => Math.abs(f - p) <= 1))).toBe(true);
        }
        if (row.pickupLane !== null) expect(free).toContain(row.pickupLane);
        prevFree = free;
      }
    }
  });

  it('never blocks two lanes at the very start', () => {
    for (let seed = 1; seed <= 100; seed++) {
      expect(new Spawner(createRng(seed)).buildRow(0, 1.5).blocked).toHaveLength(1);
    }
  });

  it('spawns rows over time and honors holdOff', () => {
    const spawner = new Spawner(createRng(5));
    spawner.holdOff(5);
    expect(spawner.update(1, 0)).toBeNull();
    expect(spawner.update(4.5, 0)).not.toBeNull();
  });

  it('is deterministic per seed', () => {
    const a = new Spawner(createRng(9)).buildRow(30, 1.2);
    const b = new Spawner(createRng(9)).buildRow(30, 1.2);
    expect(a).toEqual(b);
  });
});

describe('EventDirector', () => {
  it('waits, then fires events without immediate repeats', () => {
    const director = new EventDirector(createRng(4));
    expect(director.update(5, 5)).toBeNull();
    let last: string | null = null;
    let fired = 0;
    for (let time = 12; time < 600; time += 1) {
      const event = director.update(1, time);
      if (event) {
        expect(event.id).not.toBe(last);
        last = event.id;
        fired++;
      }
    }
    expect(fired).toBeGreaterThan(10);
  });

  it('holds back late-game events early on', () => {
    const director = new EventDirector(createRng(8));
    for (let time = 0; time < 19; time += 1) {
      const event = director.update(1, time);
      if (event) expect(event.id).not.toBe('wedding_band');
    }
    expect(eventDefs.find((e) => e.id === 'wedding_band')?.minTime).toBeGreaterThan(0);
  });
});

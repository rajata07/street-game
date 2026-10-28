import { describe, expect, it } from 'vitest';
import { PLAYER_Y, roadLaneCenterX } from '../src/core/config';
import { eventDefs } from '../src/core/events';
import { World } from '../src/core/world';

const event = (id: string) => {
  const def = eventDefs.find((e) => e.id === id);
  if (!def) throw new Error(id);
  return def;
};

function placeObstacle(world: World, typeId: string, x: number, y: number): void {
  world.obstacles.push({ uid: 9999, typeId, emoji: 'x', fontSize: 10, x, y, w: 70, h: 70, vx: 0 });
}

describe('World', () => {
  it('starts running in the middle lane', () => {
    const world = new World(1);
    expect(world.status).toBe('running');
    expect(world.playerLane).toBe(1);
    expect(world.score).toBe(0);
  });

  it('clamps lane changes and emits lane events', () => {
    const world = new World(1);
    world.moveLane(-1);
    world.moveLane(-1);
    expect(world.playerLane).toBe(0);
    world.moveLane(1);
    world.moveLane(1);
    world.moveLane(1);
    expect(world.playerLane).toBe(2);
    expect(world.takeEvents().filter((e) => e.kind === 'lane')).toHaveLength(3);
    expect(world.takeEvents()).toHaveLength(0);
  });

  it('slides the player toward the target lane', () => {
    const world = new World(1);
    world.moveLane(1);
    world.update(0.01);
    expect(world.playerX).toBeGreaterThan(roadLaneCenterX(1));
    for (let i = 0; i < 20; i++) world.update(0.016);
    expect(world.playerX).toBeCloseTo(roadLaneCenterX(2));
  });

  it('scores distance over time', () => {
    const world = new World(1);
    world.obstacles = [];
    for (let i = 0; i < 100; i++) {
      world.obstacles = [];
      world.update(0.05);
    }
    expect(world.score).toBeGreaterThan(10);
  });

  it('crashes on collision, reports a line, and stops updating', () => {
    const world = new World(1);
    placeObstacle(world, 'cow', roadLaneCenterX(1), PLAYER_Y);
    world.update(0.016);
    expect(world.status).toBe('over');
    const crash = world.takeEvents().find((e) => e.kind === 'crash');
    expect(crash && crash.kind === 'crash' && crash.typeId).toBe('cow');
    const time = world.time;
    world.update(0.016);
    expect(world.time).toBe(time);
    world.moveLane(1);
    expect(world.playerLane).toBe(1);
  });

  it('does not crash into obstacles in other lanes', () => {
    const world = new World(1);
    placeObstacle(world, 'bus', roadLaneCenterX(0), PLAYER_Y);
    world.update(0.016);
    expect(world.status).toBe('running');
  });

  it('collects chai for bonus points', () => {
    const world = new World(1);
    world.pickups.push({
      uid: 1,
      emoji: '☕',
      fontSize: 30,
      x: roadLaneCenterX(1),
      y: PLAYER_Y,
      w: 30,
      h: 30,
      points: 25,
    });
    world.update(0.016);
    expect(world.pickups).toHaveLength(0);
    expect(world.score).toBeGreaterThanOrEqual(25);
    expect(world.takeEvents().some((e) => e.kind === 'pickup')).toBe(true);
  });

  it('culls obstacles that leave the screen', () => {
    const world = new World(1);
    placeObstacle(world, 'cow', roadLaneCenterX(0), 5000);
    world.update(0.016);
    expect(world.obstacles.find((o) => o.uid === 9999)).toBeUndefined();
  });

  it('is deterministic for a seed', () => {
    const run = (seed: number) => {
      const w = new World(seed);
      for (let i = 0; i < 600 && w.status === 'running'; i++) w.update(0.016);
      return { status: w.status, score: w.score, n: w.obstacles.length };
    };
    expect(run(7)).toEqual(run(7));
  });
});

describe('World events', () => {
  it('cow crossing spawns a sideways-moving cow', () => {
    const world = new World(2);
    world.triggerEvent(event('cow_crossing'));
    const cow = world.obstacles.find((o) => o.typeId === 'cow');
    expect(cow).toBeDefined();
    expect(Math.abs(cow?.vx ?? 0)).toBeGreaterThan(0);
  });

  it('wedding band blocks two lanes but leaves one open', () => {
    const world = new World(3);
    world.triggerEvent(event('wedding_band'));
    const band = world.obstacles.find((o) => o.typeId === 'band');
    expect(band).toBeDefined();
    const left = (band?.x ?? 0) - (band?.w ?? 0) / 2;
    const right = (band?.x ?? 0) + (band?.w ?? 0) / 2;
    const open = [0, 1, 2].filter((l) => roadLaneCenterX(l) < left || roadLaneCenterX(l) > right);
    expect(open).toHaveLength(1);
  });

  it('chai break spawns a line of chai in one lane', () => {
    const world = new World(4);
    world.triggerEvent(event('chai_break'));
    expect(world.pickups).toHaveLength(5);
    expect(new Set(world.pickups.map((p) => p.x)).size).toBe(1);
  });

  it('dog chase doubles points temporarily', () => {
    const world = new World(5);
    expect(world.multiplier).toBe(1);
    world.triggerEvent(event('dog_chase'));
    expect(world.multiplier).toBe(2);
    for (let i = 0; i < 200; i++) {
      world.obstacles = [];
      world.update(0.05);
    }
    expect(world.multiplier).toBe(1);
  });

  it('honk chorus only announces itself', () => {
    const world = new World(6);
    world.triggerEvent(event('honk_chorus'));
    const events = world.takeEvents();
    expect(events).toHaveLength(1);
    expect(world.obstacles).toHaveLength(0);
  });
});

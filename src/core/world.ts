import { overlaps, shrink } from './collision';
import {
  GAME_HEIGHT,
  LANE_COUNT,
  PLAYER_Y,
  ROAD_LEFT,
  ROAD_WIDTH,
  roadLaneCenterX,
} from './config';
import { speedAt } from './difficulty';
import { EventDirector } from './events';
import { createRng, type Rng } from './rng';
import { obstacleTypes, Spawner, type SpawnRow } from './spawner';
import type { Box, EventDef, Obstacle, ObstacleType, Pickup, WorldEvent } from './types';

export const PLAYER_BOX = { w: 34, h: 54 };
export const DOG_DURATION = 6;
const HITBOX_SCALE = 0.85;
const LANE_SWITCH_SPEED = 1400;
const MAX_DT = 0.05;
const PICKUP_POINTS = 25;
const COW_CROSS_SPEED = 240;

export class World {
  status: 'running' | 'over' = 'running';
  time = 0;
  speed = speedAt(0);
  playerLane = 1;
  playerX = roadLaneCenterX(1);
  obstacles: Obstacle[] = [];
  pickups: Pickup[] = [];
  dogUntil = 0;
  private scoreDistance = 0;
  private bonus = 0;
  private uid = 0;
  private pending: WorldEvent[] = [];
  private rng: Rng;
  private spawner: Spawner;
  private director: EventDirector;

  constructor(
    seed: number,
    private types: ObstacleType[] = obstacleTypes,
  ) {
    this.rng = createRng(seed);
    this.spawner = new Spawner(this.rng, types);
    this.director = new EventDirector(this.rng);
  }

  get multiplier(): number {
    return this.time < this.dogUntil ? 2 : 1;
  }

  get score(): number {
    return Math.floor(this.scoreDistance) + this.bonus;
  }

  get playerBox(): Box {
    return { x: this.playerX, y: PLAYER_Y, ...PLAYER_BOX };
  }

  takeEvents(): WorldEvent[] {
    const events = this.pending;
    this.pending = [];
    return events;
  }

  moveLane(direction: -1 | 1): void {
    if (this.status !== 'running') return;
    const next = Math.min(LANE_COUNT - 1, Math.max(0, this.playerLane + direction));
    if (next === this.playerLane) return;
    this.playerLane = next;
    this.pending.push({ kind: 'lane' });
  }

  update(rawDt: number): void {
    if (this.status !== 'running') return;
    const dt = Math.min(rawDt, MAX_DT);
    this.time += dt;
    this.speed = speedAt(this.time);
    const dy = this.speed * dt;
    this.scoreDistance += (dy / 50) * this.multiplier;

    const target = roadLaneCenterX(this.playerLane);
    const step = LANE_SWITCH_SPEED * dt;
    this.playerX += Math.max(-step, Math.min(step, target - this.playerX));

    for (const o of this.obstacles) {
      o.y += dy;
      o.x += o.vx * dt;
    }
    for (const p of this.pickups) p.y += dy;

    const row = this.spawner.update(dt, this.time);
    if (row) this.applyRow(row);
    const event = this.director.update(dt, this.time);
    if (event) this.triggerEvent(event);

    this.collide();
    this.cull();
  }

  /** Fires a funny street event immediately (also used by tests). */
  triggerEvent(def: EventDef): void {
    this.pending.push({ kind: 'event', id: def.id, caption: def.caption });
    switch (def.id) {
      case 'cow_crossing': {
        const fromLeft = this.rng() < 0.5;
        const x = fromLeft ? ROAD_LEFT - 30 : ROAD_LEFT + ROAD_WIDTH + 30;
        this.addObstacle('cow', x, -60, fromLeft ? COW_CROSS_SPEED : -COW_CROSS_SPEED);
        this.spawner.holdOff(0.6);
        break;
      }
      case 'wedding_band': {
        const start = this.rng() < 0.5 ? 0 : 1;
        const x = (roadLaneCenterX(start) + roadLaneCenterX(start + 1)) / 2;
        const band = this.typeOf('band');
        this.addObstacle('band', x, -band.height / 2 - 10, 0);
        this.spawner.holdOff(1.0);
        break;
      }
      case 'chai_break': {
        const lane = Math.floor(this.rng() * LANE_COUNT);
        for (let i = 0; i < 5; i++) this.addPickup(roadLaneCenterX(lane), -30 - i * 70);
        this.spawner.holdOff(1.0);
        break;
      }
      case 'dog_chase':
        this.dogUntil = this.time + DOG_DURATION;
        break;
      default:
        break;
    }
  }

  private typeOf(id: string): ObstacleType {
    const type = this.types.find((t) => t.id === id);
    if (!type) throw new Error(`Unknown obstacle type: ${id}`);
    return type;
  }

  private addObstacle(typeId: string, x: number, y: number, vx: number): void {
    const type = this.typeOf(typeId);
    this.obstacles.push({
      uid: this.uid++,
      typeId,
      emoji: type.emoji,
      fontSize: type.fontSize,
      x,
      y,
      w: type.width,
      h: type.height,
      vx,
    });
  }

  private addPickup(x: number, y: number): void {
    this.pickups.push({
      uid: this.uid++,
      emoji: '☕',
      fontSize: 34,
      x,
      y,
      w: 34,
      h: 34,
      points: PICKUP_POINTS,
    });
  }

  private applyRow(row: SpawnRow): void {
    let tallest = 0;
    for (const b of row.blocked) {
      const type = this.typeOf(b.typeId);
      tallest = Math.max(tallest, type.height);
      this.addObstacle(b.typeId, roadLaneCenterX(b.lane), -type.height / 2 - 10, 0);
    }
    if (row.pickupLane !== null) {
      this.addPickup(roadLaneCenterX(row.pickupLane), -tallest / 2 - 10 + 0.5 * row.gap * this.speed);
    }
  }

  private collide(): void {
    const player = shrink(this.playerBox, 1);
    this.pickups = this.pickups.filter((p) => {
      if (!overlaps(player, p)) return true;
      const points = p.points * this.multiplier;
      this.bonus += points;
      this.pending.push({ kind: 'pickup', points, x: p.x, y: p.y });
      return false;
    });

    for (const o of this.obstacles) {
      if (overlaps(player, shrink(o, HITBOX_SCALE))) {
        this.crash(o);
        return;
      }
    }
  }

  private crash(o: Obstacle): void {
    this.status = 'over';
    const lines = this.typeOf(o.typeId).crashLines;
    const line = lines[Math.floor(this.rng() * lines.length)];
    this.pending.push({ kind: 'crash', typeId: o.typeId, line });
  }

  private cull(): void {
    this.obstacles = this.obstacles.filter((o) => o.y - o.h / 2 < GAME_HEIGHT);
    this.pickups = this.pickups.filter((p) => p.y - p.h / 2 < GAME_HEIGHT);
  }
}

import eventData from '../data/events.json';
import { weightedPick, type Rng } from './rng';
import type { EventDef } from './types';

export const eventDefs: EventDef[] = eventData;

/** Schedules random funny street events, never repeating the same one back to back. */
export class EventDirector {
  private next = 12;
  private lastId: string | null = null;

  constructor(
    private rng: Rng,
    private defs: EventDef[] = eventDefs,
  ) {}

  update(dt: number, time: number): EventDef | null {
    this.next -= dt;
    if (this.next > 0) return null;
    this.next = 9 + this.rng() * 7;

    let candidates = this.defs.filter((d) => d.minTime <= time);
    if (candidates.length > 1) candidates = candidates.filter((d) => d.id !== this.lastId);
    if (candidates.length === 0) return null;

    const picked = weightedPick(this.rng, candidates, (d) => d.weight);
    this.lastId = picked.id;
    return picked;
  }
}

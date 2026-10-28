export interface ObstacleType {
  id: string;
  emoji: string;
  fontSize: number;
  width: number;
  height: number;
  weight: number;
  crashLines: string[];
}

export interface EventDef {
  id: string;
  caption: string;
  weight: number;
  minTime: number;
}

/** Center-based box. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Obstacle extends Box {
  uid: number;
  typeId: string;
  emoji: string;
  fontSize: number;
  vx: number;
}

export interface Pickup extends Box {
  uid: number;
  emoji: string;
  fontSize: number;
  points: number;
}

export type WorldEvent =
  | { kind: 'lane' }
  | { kind: 'pickup'; points: number; x: number; y: number }
  | { kind: 'event'; id: string; caption: string }
  | { kind: 'crash'; typeId: string; line: string };

import type { Box } from './types';

export function overlaps(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
}

export function shrink(box: Box, factor: number): Box {
  return { x: box.x, y: box.y, w: box.w * factor, h: box.h * factor };
}

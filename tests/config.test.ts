import { describe, expect, it } from 'vitest';
import { laneCenterX } from '../src/core/config';

describe('laneCenterX', () => {
  it('centers lanes evenly', () => {
    expect(laneCenterX(0, 300, 3)).toBe(50);
    expect(laneCenterX(1, 300, 3)).toBe(150);
    expect(laneCenterX(2, 300, 3)).toBe(250);
  });

  it('rejects invalid lanes', () => {
    expect(() => laneCenterX(-1)).toThrow(RangeError);
    expect(() => laneCenterX(3)).toThrow(RangeError);
    expect(() => laneCenterX(1.5)).toThrow(RangeError);
  });
});

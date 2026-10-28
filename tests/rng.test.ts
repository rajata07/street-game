import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';

describe('createRng', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('differs across seeds and stays in [0,1)', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a()).not.toBe(b());
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

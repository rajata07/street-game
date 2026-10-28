import { describe, expect, it } from 'vitest';
import {
  getPlayerFace,
  PLAYER_FACES,
  PLAYER_FACE_STORAGE_KEY,
  setPlayerFace,
} from '../src/core/player';

describe('player face selection', () => {
  it('defaults to the original face and accepts saved face options', () => {
    const storage = { getItem: () => '😎' };

    expect(getPlayerFace(null)).toBe('🏃');
    expect(getPlayerFace(storage)).toBe('😎');
    expect(PLAYER_FACES.length).toBeGreaterThan(1);
  });

  it('falls back for invalid values and unavailable storage', () => {
    expect(getPlayerFace({ getItem: () => 'unknown' })).toBe('🏃');
    expect(
      getPlayerFace({
        getItem: () => {
          throw new Error('storage unavailable');
        },
      }),
    ).toBe('🏃');
  });

  it('persists the selected face without failing when storage is unavailable', () => {
    let savedKey = '';
    let savedFace = '';
    setPlayerFace(
      {
        setItem: (key, face) => {
          savedKey = key;
          savedFace = face;
        },
      },
      '🤠',
    );

    expect(savedKey).toBe(PLAYER_FACE_STORAGE_KEY);
    expect(savedFace).toBe('🤠');
    expect(() => setPlayerFace(null, '😎')).not.toThrow();
    expect(() =>
      setPlayerFace(
        {
          setItem: () => {
            throw new Error('storage unavailable');
          },
        },
        '😎',
      ),
    ).not.toThrow();
  });
});

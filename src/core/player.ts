export const PLAYER_FACES = ['🏃', '😀', '😎', '🤠', '🥸', '🤓'] as const;
export const PLAYER_FACE_STORAGE_KEY = 'fancy-game-player-face';

export type PlayerFace = (typeof PLAYER_FACES)[number];

export function getPlayerFace(storage: Pick<Storage, 'getItem'> | null): PlayerFace {
  try {
    const stored = storage?.getItem(PLAYER_FACE_STORAGE_KEY);
    return PLAYER_FACES.find((face) => face === stored) ?? PLAYER_FACES[0];
  } catch {
    return PLAYER_FACES[0];
  }
}

export function setPlayerFace(storage: Pick<Storage, 'setItem'> | null, face: PlayerFace): void {
  try {
    storage?.setItem(PLAYER_FACE_STORAGE_KEY, face);
  } catch {
    // Choosing a face should still work when browser storage is unavailable.
  }
}

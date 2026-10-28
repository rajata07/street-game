export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;
export const LANE_COUNT = 3;
export const ROAD_LEFT = 60;
export const ROAD_WIDTH = 360;
export const PLAYER_Y = 650;

/** Returns the x-center of a lane (0-based), lanes evenly split across the width. */
export function laneCenterX(
  lane: number,
  width = ROAD_WIDTH,
  laneCount = LANE_COUNT,
  left = 0,
): number {
  if (!Number.isInteger(lane) || lane < 0 || lane >= laneCount) {
    throw new RangeError(`lane ${lane} out of range 0..${laneCount - 1}`);
  }
  const laneWidth = width / laneCount;
  return left + laneWidth * lane + laneWidth / 2;
}

export function roadLaneCenterX(lane: number): number {
  return laneCenterX(lane, ROAD_WIDTH, LANE_COUNT, ROAD_LEFT);
}

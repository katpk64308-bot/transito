import { startPts } from './config.js';

export const state = {
  x: startPts[0][0],
  z: startPts[0][1],
  heading: Math.atan2(startPts[1][0] - startPts[0][0], startPts[1][1] - startPts[0][1]),
  speed: 0,
  raceStarted: false,
  raceFinished: false,
  startTime: 0,
  elapsed: 0
};

export const keys = {};
export function isDown(...names) { return names.some(name => keys[name]); }

import { startPts } from './config.js';

// Começa na faixa correta, deslocado para o lado esquerdo do sentido do
// traçado (a faixa usada pela regra atual de mão da pista).
const startTangentX = startPts[1][0] - startPts[0][0];
const startTangentZ = startPts[1][1] - startPts[0][1];
const startLength = Math.hypot(startTangentX, startTangentZ) || 1;
const startLaneOffset = 5;

export const state = {
  x: startPts[0][0] + (-startTangentZ / startLength) * startLaneOffset,
  z: startPts[0][1] + (startTangentX / startLength) * startLaneOffset,
  heading: Math.atan2(startPts[1][0] - startPts[0][0], startPts[1][1] - startPts[0][1]),
  speed: 0,
  raceStarted: false,
  raceFinished: false,
  contramao: false,
  startTime: 0,
  elapsed: 0
};

export const keys = {};
export function isDown(...names) { return names.some(name => keys[name]); }

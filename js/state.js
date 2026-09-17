import { startPts } from './config.js';

const startTangentX =
  startPts[1][0] - startPts[0][0];

const startTangentZ =
  startPts[1][1] - startPts[0][1];

const startLength =
  Math.hypot(
    startTangentX,
    startTangentZ
  ) || 1;

const laneOffset = 7;

const leftX =
  -startTangentZ / startLength;

const leftZ =
  startTangentX / startLength;

export const state = {
  x:
    startPts[0][0] +
    leftX * laneOffset,

  z:
    startPts[0][1] +
    leftZ * laneOffset,

  heading: Math.atan2(
    startPts[1][0] - startPts[0][0],
    startPts[1][1] - startPts[0][1]
  ),

  speed: 0,
  raceStarted: false,
  raceFinished: false,
  contramao: false,
  foraEstrada: false,
  collisionAlert: null,
  alertUntil: 0,
  lawAlerts: [],
  lawHistory: [],
  lawBroken: false,
  startTime: 0,
  elapsed: 0,
  cameraInvertY: false,
  drivingMode: 'eco',
  maxSpeed: 22
};

export const keys = {};

export function isDown(...names) {
  return names.some(name => keys[name]);
}

export function getCurrentMaxSpeed() {
  return state.drivingModes[state.drivingMode]?.maxSpeed
    ?? physics.MAX_SPEED;
}

export function setDrivingMode(mode) {
  if (!state.drivingModes[mode]) return false;

  state.drivingMode = mode;
  return true;
}

export function cycleDrivingMode() {
  const modes = ['eco', 'comfort', 'sport'];

  const currentIndex = modes.indexOf(state.drivingMode);
  const nextIndex = (currentIndex + 1) % modes.length;

  state.drivingMode = modes[nextIndex];

  return state.drivingMode;
}
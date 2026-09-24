import { startPts, physics } from './config.js';

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

const initialX =
  startPts[0][0] +
  leftX * laneOffset;

const initialZ =
  startPts[0][1] +
  leftZ * laneOffset;

const initialHeading =
  Math.atan2(
    startPts[1][0] - startPts[0][0],
    startPts[1][1] - startPts[0][1]
  );

export const state = {
  x: initialX,
  z: initialZ,

  heading: initialHeading,

  speed: 0,

  phase: 1,

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
  playerLightEnabled: false,
  drivingMode: 'eco',
  maxSpeed: physics.MODES.eco,

  pedestriansYielded: 0,

  buildingEditorActive: false
};

export const keys = {};

export function isDown(...names) {
  return names.some(name => keys[name]);
}

export function getCurrentMaxSpeed() {
  return (
    physics.MODES?.[state.drivingMode] ??
    physics.MAX_SPEED
  );
}

export function setDrivingMode(mode) {
  if (!physics.MODES?.[mode]) {
    return false;
  }

  state.drivingMode = mode;
  state.maxSpeed = physics.MODES[mode];

  return true;
}

export function cycleDrivingMode() {
  const modes = [
    'eco',
    'comfort',
    'sport'
  ];

  const currentIndex =
    modes.indexOf(state.drivingMode);

  const nextIndex =
    (currentIndex + 1) % modes.length;

  state.drivingMode =
    modes[nextIndex];

  state.maxSpeed =
    physics.MODES[state.drivingMode];

  return state.drivingMode;
}

export function resetRaceState(
  phase = 1
) {
  state.phase = phase;

  state.x = initialX;
  state.z = initialZ;
  state.heading = initialHeading;

  state.speed = 0;

  state.raceStarted = false;
  state.raceFinished = false;

  state.contramao = false;
  state.foraEstrada = false;

  state.collisionAlert = null;
  state.alertUntil = 0;

  state.lawAlerts = [];
  state.lawHistory = [];
  state.lawBroken = false;

  state.startTime = 0;
  state.elapsed = 0;

  state.pedestriansYielded = 0;

  Object.keys(keys).forEach(key => {
    keys[key] = false;
  });

  state.maxSpeed =
    physics.MODES[state.drivingMode] ??
    physics.MAX_SPEED;
}

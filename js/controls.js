import { keys, state } from './state.js';

export function setupControls(startRace) {
  addEventListener('keydown', event => {
    keys[event.key.toLowerCase()] = true;
    if (!state.raceStarted && !state.raceFinished) startRace();
  });

  addEventListener('keyup', event => {
    keys[event.key.toLowerCase()] = false;
  });
}

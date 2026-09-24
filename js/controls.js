import { keys, state } from './state.js';

const modeOrder = [
  'comfort',
  'sport',
  'eco'
];

export function setupControls(startRace) {

  addEventListener('keydown', event => {

    const key = event.key.toLowerCase();

    if (event.key === 'F3') return;
    if (state.buildingEditorActive) return;

    if (key === 'r' && !event.repeat) {
      state.playerLightEnabled = !state.playerLightEnabled;
    }

    if (key === 'm') {

      const currentIndex =
        modeOrder.indexOf(state.drivingMode || 'comfort');

      const nextIndex =
        (currentIndex + 1) % modeOrder.length;

      state.drivingMode =
        modeOrder[nextIndex];

      window.dispatchEvent(
        new CustomEvent('drivingModeChanged', {
          detail: state.drivingMode
        })
      );

      return;
    }

    keys[key] = true;

    if (
      !state.raceStarted &&
      !state.raceFinished
    ) {
      startRace();
    }
  });

  addEventListener('keyup', event => {

    keys[event.key.toLowerCase()] = false;

  });
}

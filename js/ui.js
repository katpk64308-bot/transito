import { state } from './state.js';

export function createUI() {
  const speedElement = document.getElementById('speedval');
  const timerElement = document.getElementById('timerval');
  const introOverlay = document.getElementById('introOverlay');
  const finishOverlay = document.getElementById('finishOverlay');
  const finishTimeElement = document.getElementById('finishTime');

  function startRace() {
    if (state.raceStarted) return;
    state.raceStarted = true;
    state.startTime = performance.now();
    introOverlay.classList.add('hidden');
  }

  function finishRace() {
    state.raceFinished = true;
    finishTimeElement.textContent = `${state.elapsed.toFixed(1)}s`;
    finishOverlay.classList.remove('hidden');
  }

  document.getElementById('startBtn').addEventListener('click', startRace);
  document.getElementById('restartBtn').addEventListener('click', () => location.reload());

  return {
    startRace,
    finishRace,
    update() {
      speedElement.textContent = Math.round(Math.abs(state.speed));
      if (state.raceStarted && !state.raceFinished) state.elapsed = (performance.now() - state.startTime) / 1000;
      timerElement.textContent = `${state.elapsed.toFixed(1)}s`;
    }
  };
}

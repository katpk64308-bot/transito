import { state } from './state.js';

export function createUI() {
  const speedElement = document.getElementById('speedval');
  const timerElement = document.getElementById('timerval');
  const introOverlay = document.getElementById('introOverlay');
  const mainMenu = document.getElementById('mainMenu');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const finishOverlay = document.getElementById('finishOverlay');
  const finishTimeElement = document.getElementById('finishTime');
  const wrongWayElement = document.getElementById('wrongway');
  const trafficStatus = document.getElementById('traffic-status');
  const trafficStatusValue = document.getElementById('traffic-status-value');

  function showPanel(panelId) {
    document.querySelectorAll('.overlay').forEach(panel => panel.classList.add('hidden'));
    document.getElementById(panelId).classList.remove('hidden');
  }
  let lastUpdate = 0;

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
  document.getElementById('playBtn').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');
    // Dá tempo para os modelos 3D terminarem de carregar antes de iniciar.
    window.setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      introOverlay.classList.remove('hidden');
    }, 12000);
  });
  document.querySelectorAll('[data-panel]').forEach(button => {
    button.addEventListener('click', () => showPanel(button.dataset.panel));
  });
  document.querySelectorAll('.backBtn').forEach(button => {
    button.addEventListener('click', () => showPanel('mainMenu'));
  });
  document.getElementById('restartBtn').addEventListener('click', () => location.reload());

  return {
    startRace,
    finishRace,
    update() {
      if (state.raceStarted && !state.raceFinished) state.elapsed = (performance.now() - state.startTime) / 1000;
      const now = performance.now();
      if (now - lastUpdate < 80) return;
      lastUpdate = now;
      speedElement.textContent = Math.round(Math.abs(state.speed));
      timerElement.textContent = `${state.elapsed.toFixed(1)}s`;
      wrongWayElement.classList.toggle('hidden', !state.contramao);
      trafficStatus.classList.toggle('wrong', state.contramao);
      trafficStatus.classList.toggle('correct', !state.contramao);
      trafficStatusValue.textContent = state.contramao ? 'CONTRAMÃO' : 'MÃO CORRETA';
    }
  };
}

import { state } from './state.js';

export function createUI() {
  const speedElement = document.getElementById('speedval');
  const timerElement = document.getElementById('timerval');
  const mainMenu = document.getElementById('mainMenu');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingTipElement = document.getElementById('loadingTip');
  const finishOverlay = document.getElementById('finishOverlay');
  const finishTimeElement = document.getElementById('finishTime');
  const trafficStatus = document.getElementById('traffic-status');
  const shadowsToggle = document.getElementById('shadowsToggle');
  const gameElements = document.querySelectorAll('.game-element');
  const achievementElements = {
    first: document.getElementById('achievement-first'),
    speed: document.getElementById('achievement-speed'),
    clean: document.getElementById('achievement-clean')
  };
  const achievementStorageKey = 'rotaZeroAchievements';
  let unlockedAchievements = JSON.parse(localStorage.getItem(achievementStorageKey) || '{}');

  function renderAchievements() {
    Object.entries(achievementElements).forEach(([id, element]) => {
      const unlocked = Boolean(unlockedAchievements[id]);
      element.classList.toggle('unlocked', unlocked);
      element.querySelector('.achievement-icon').textContent = unlocked ? '✅' : '🔒';
    });
  }

  function unlockAchievements() {
    unlockedAchievements = {
      ...unlockedAchievements,
      first: true,
      speed: unlockedAchievements.speed || state.elapsed < 84,
      clean: unlockedAchievements.clean || !state.lawBroken
    };
    localStorage.setItem(achievementStorageKey, JSON.stringify(unlockedAchievements));
    renderAchievements();
  }

  renderAchievements();

  function getLawAlert(type) {
    const alerts = {
      car: ['COLISÃO', 'VOCÊ BATEU NO CARRO', 'Lei: o condutor deve manter domínio do veículo e atenção permanente. Respeite as regras de circulação para bicicletas elétricas. CTB, art. 28, e Resolução CONTRAN 996/2023, art. 11.', 'collision'],
      train: ['COLISÃO', 'VOCÊ BATEU NO TREM', 'Lei: antes de transpor uma linha férrea, o condutor deve parar o veículo. Para bicicletas elétricas, valem as regras do CTB para bicicletas. CTB, art. 212, e Resolução CONTRAN 996/2023, art. 11.', 'collision'],
      offroad: ['ATENÇÃO', 'FORA DA ESTRADA', 'Lei: a circulação da bicicleta elétrica deve respeitar a regulamentação do órgão responsável pela via. Volte para a estrada permitida. Resolução CONTRAN 996/2023, arts. 6º e 11.', 'offroad'],
      wrong: ['ATENÇÃO', 'ENTROU NA CONTRAMÃO', 'Lei: esta bicicleta elétrica pedal-assistida, limitada a 30 km/h, está dentro do limite legal de 32 km/h e deve seguir as regras do CTB. Transitar na contramão é infração. Resolução CONTRAN 996/2023, art. 11, e CTB, art. 186.', 'wrong']
    };
    return alerts[type];
  }

  shadowsToggle.checked = localStorage.getItem('shadowsEnabled') !== 'false';
  shadowsToggle.addEventListener('change', () => {
    localStorage.setItem('shadowsEnabled', String(shadowsToggle.checked));
    window.dispatchEvent(new CustomEvent('shadowsChanged', { detail: shadowsToggle.checked }));
  });

  function showPanel(panelId) {
    document.querySelectorAll('.overlay').forEach(panel => panel.classList.add('hidden'));
    document.getElementById(panelId).classList.remove('hidden');
  }
  let lastUpdate = 0;
  let gameVisible = false;
  let loadingTipTimer;
  const loadingTips = [
    'Se você entrar e o jogo não tiver carregado, não se mexa.',
    'Para andar, use as setas ou W A S D.',
    'Aperte F3 para ver as coordenadas.'
  ];

  function showRandomLoadingTip() {
    const currentTip = loadingTipElement.textContent;
    const availableTips = loadingTips.filter(tip => tip !== currentTip);
    loadingTipElement.textContent = availableTips[Math.floor(Math.random() * availableTips.length)];
  }

  function startRace() {
    if (!gameVisible || state.raceStarted) return;
    state.raceStarted = true;
    state.startTime = performance.now();
  }

  function showGame() {
    gameElements.forEach(element => element.classList.remove('game-hidden'));
    gameVisible = true;
    startRace();
  }

  function finishRace() {
    state.raceFinished = true;
    state.elapsed = (performance.now() - state.startTime) / 1000;
    unlockAchievements();
    finishTimeElement.textContent = `${state.elapsed.toFixed(1)}s`;
    finishOverlay.classList.remove('hidden');
  }

  document.getElementById('playBtn').addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    loadingOverlay.classList.remove('hidden');
    showRandomLoadingTip();
    loadingTipTimer = window.setInterval(showRandomLoadingTip, 6000);
    // Dá tempo para os modelos 3D terminarem de carregar antes de iniciar.
    window.setTimeout(() => {
      window.clearInterval(loadingTipTimer);
      loadingOverlay.classList.add('hidden');
      showGame();
    }, 15000);
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
      const alertNow = performance.now();
      state.lawAlerts = state.lawAlerts.filter(alert => alert.expiresAt > alertNow);
      trafficStatus.replaceChildren();
      trafficStatus.classList.toggle('hidden', state.lawAlerts.length === 0);
      state.lawAlerts.forEach(alert => {
        const copy = getLawAlert(alert.type);
        if (!copy) return;
        const card = document.createElement('div');
        card.className = `traffic-alert ${copy[3]}`;
        card.innerHTML = `<span class="traffic-status-label">${copy[0]}</span><strong>${copy[1]}</strong><p>${copy[2]}</p>`;
        trafficStatus.appendChild(card);
      });
    }
  };
}

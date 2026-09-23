import { state } from './state.js';

export function createUI(
  onRaceStart = null,
  onRaceFinish = null,
  onBuildingEditorStart = null
) {
  const speedElement =
    document.getElementById('speedval');

  const timerElement =
    document.getElementById('timerval');

  const modeElement =
    document.getElementById('mode-label');

  const mainMenu =
    document.getElementById('mainMenu');

  const loadingOverlay =
    document.getElementById('loadingOverlay');

  const loadingTipElement =
    document.getElementById('loadingTip');

  const introOverlay =
    document.getElementById('introOverlay');

  const finishOverlay =
    document.getElementById('finishOverlay');

  const finishTimeElement =
    document.getElementById('finishTime');

  const violationHistoryElement =
    document.getElementById('violationHistory');

  const trafficStatus =
    document.getElementById('traffic-status');

  const shadowsToggle =
    document.getElementById('shadowsToggle');

  const invertCamera =
    document.getElementById('invertCamera');

  const gameElements =
    document.querySelectorAll('.game-element');

  const achievementElements = {
    first: document.getElementById(
      'achievement-first'
    ),
    speed: document.getElementById(
      'achievement-speed'
    ),
    clean: document.getElementById(
      'achievement-clean'
    )
  };

  const achievementStorageKey =
    'rotaZeroAchievements';

  const drivingModes = {
    eco: 'ECO',
    comfort: 'COMFORT',
    sport: 'SPORT'
  };

  let lastDrivingMode =
    state.drivingMode || 'comfort';

  let unlockedAchievements =
    JSON.parse(
      localStorage.getItem(
        achievementStorageKey
      ) || '{}'
    );

  function updateDrivingMode(
    animate = false
  ) {
    if (!modeElement) return;

    const mode =
      state.drivingMode || 'comfort';

    const modeName =
      drivingModes[mode];

    if (!modeName) return;

    modeElement.textContent =
      modeName;

    if (!animate) return;

    modeElement.classList.remove(
      'mode-changing'
    );

    void modeElement.offsetWidth;

    modeElement.classList.add(
      'mode-changing'
    );

    window.setTimeout(() => {
      modeElement.classList.remove(
        'mode-changing'
      );
    }, 450);
  }

  function renderAchievements() {
    Object.entries(
      achievementElements
    ).forEach(([id, element]) => {
      const unlocked =
        Boolean(
          unlockedAchievements[id]
        );

      element.classList.toggle(
        'unlocked',
        unlocked
      );

      element
        .querySelector(
          '.achievement-icon'
        )
        .textContent =
        unlocked ? '✅' : '🔒';
    });
  }

  function unlockAchievements() {
    unlockedAchievements = {
      ...unlockedAchievements,
      first: true,
      speed:
        unlockedAchievements.speed ||
        state.elapsed < 84,
      clean:
        unlockedAchievements.clean ||
        !state.lawBroken
    };

    localStorage.setItem(
      achievementStorageKey,
      JSON.stringify(
        unlockedAchievements
      )
    );

    renderAchievements();
  }

  renderAchievements();

  updateDrivingMode();

  function getLawAlert(type) {
    const alerts = {
      car: [
        'COLISÃO',
        'VOCÊ BATEU NO CARRO',
        'Lei: o condutor deve manter domínio do veículo e atenção permanente. Respeite as regras de circulação para bicicletas elétricas. CTB, art. 28, e Resolução CONTRAN 996/2023, art. 11.',
        'collision'
      ],

      train: [
        'COLISÃO',
        'VOCÊ BATEU NO TREM',
        'Lei: antes de transpor uma linha férrea, o condutor deve parar o veículo. Para bicicletas elétricas, valem as regras do CTB para bicicletas. CTB, art. 212, e Resolução CONTRAN 996/2023, art. 11.',
        'collision'
      ],

      offroad: [
        'ATENÇÃO',
        'FORA DA ESTRADA',
        'Lei: a circulação da bicicleta elétrica deve respeitar a regulamentação do órgão responsável pela via. Volte para a estrada permitida. Resolução CONTRAN 996/2023, arts. 6º e 11.',
        'offroad'
      ],

      wrong: [
        'ATENÇÃO',
        'ENTROU NA CONTRAMÃO',
        'Lei: esta bicicleta elétrica pedal-assistida, limitada a 30 km/h, está dentro do limite legal de 32 km/h e deve seguir as regras do CTB. Transitar na contramão é infração. Resolução CONTRAN 996/2023, art. 11, e CTB, art. 186.',
        'wrong'
      ]
    };

    return alerts[type];
  }

  shadowsToggle.checked =
    localStorage.getItem(
      'shadowsEnabled'
    ) !== 'false';

  shadowsToggle.addEventListener(
    'change',
    () => {
      localStorage.setItem(
        'shadowsEnabled',
        String(
          shadowsToggle.checked
        )
      );

      window.dispatchEvent(
        new CustomEvent(
          'shadowsChanged',
          {
            detail:
              shadowsToggle.checked
          }
        )
      );
    }
  );

  function showPanel(panelId) {
    document
      .querySelectorAll('.overlay')
      .forEach(panel =>
        panel.classList.add('hidden')
      );

    document
      .getElementById(panelId)
      .classList.remove('hidden');
  }

  let lastUpdate = 0;
  let gameVisible = false;
  let loadingTipTimer;

  const loadingTips = [
    'Se você entrar e o jogo não tiver carregado, não se mexa.',
    'Para andar, use as setas ou W A S D.',
    'Aperte F3 para ver as coordenadas.',
    'Aperte M durante a corrida para mudar o modo.'
  ];

  function showRandomLoadingTip() {
    const currentTip =
      loadingTipElement.textContent;

    const availableTips =
      loadingTips.filter(
        tip => tip !== currentTip
      );

    loadingTipElement.textContent =
      availableTips[
        Math.floor(
          Math.random() *
          availableTips.length
        )
      ];
  }

  function startRace() {
    if (
      !gameVisible ||
      state.raceStarted
    ) {
      return;
    }

    if (invertCamera) {
      state.cameraInvertY =
        invertCamera.checked;
    }

    state.raceStarted = true;

    state.startTime =
      performance.now();

    introOverlay.classList.add(
      'hidden'
    );

    onRaceStart?.();
  }

  function showGame() {
    gameElements.forEach(
      element =>
        element.classList.remove(
          'game-hidden'
        )
    );

    gameVisible = true;

    introOverlay.classList.remove(
      'hidden'
    );

    updateDrivingMode();
  }

  function finishRace() {
    state.raceFinished = true;

    state.elapsed =
      (
        performance.now() -
        state.startTime
      ) / 1000;

    onRaceFinish?.();

    unlockAchievements();

    finishTimeElement.textContent =
      `${state.elapsed.toFixed(1)}s`;

    violationHistoryElement.replaceChildren();

    const lawHistory =
      state.lawHistory || [];

    if (lawHistory.length === 0) {
      const cleanMessage =
        document.createElement('p');

      cleanMessage.className =
        'clean-race';

      cleanMessage.textContent =
        'Nenhuma infração registrada.';

      violationHistoryElement.appendChild(
        cleanMessage
      );
    } else {
      lawHistory.forEach(type => {
        const copy =
          getLawAlert(type);

        if (!copy) return;

        const item =
          document.createElement('div');

        item.className =
          `violation-item ${copy[3]}`;

        item.textContent =
          copy[1];

        violationHistoryElement.appendChild(
          item
        );
      });
    }

    finishOverlay.classList.remove(
      'hidden'
    );
  }

  document
    .getElementById('playBtn')
    .addEventListener(
      'click',
      () => {
        mainMenu.classList.add(
          'hidden'
        );

        loadingOverlay.classList.remove(
          'hidden'
        );

        showRandomLoadingTip();

        loadingTipTimer =
          window.setInterval(
            showRandomLoadingTip,
            6000
          );

        window.setTimeout(
          () => {
            window.clearInterval(
              loadingTipTimer
            );

            loadingOverlay.classList.add(
              'hidden'
            );

            showGame();
          },
          15000
        );
      }
    );

  document
    .getElementById('editBuildingsBtn')
    .addEventListener('click', () => {
      mainMenu.classList.add('hidden');
      showGame();
      introOverlay.classList.add('hidden');
      onBuildingEditorStart?.();
    });

  document
    .getElementById('startBtn')
    .addEventListener(
      'click',
      startRace
    );

  document
    .querySelectorAll('[data-panel]')
    .forEach(button => {
      button.addEventListener(
        'click',
        () =>
          showPanel(
            button.dataset.panel
          )
      );
    });

  document
    .querySelectorAll('.backBtn')
    .forEach(button => {
      button.addEventListener(
        'click',
        () =>
          showPanel('mainMenu')
      );
    });

  document
    .getElementById('restartBtn')
    .addEventListener(
      'click',
      () => location.reload()
    );

  return {
    startRace,

    finishRace,

    update() {
      if (
        state.raceStarted &&
        !state.raceFinished
      ) {
        state.elapsed =
          (
            performance.now() -
            state.startTime
          ) / 1000;
      }

      if (
        state.drivingMode !==
        lastDrivingMode
      ) {
        lastDrivingMode =
          state.drivingMode;

        updateDrivingMode(true);
      }

      const now =
        performance.now();

      if (
        now - lastUpdate < 80
      ) {
        return;
      }

      lastUpdate = now;

      speedElement.textContent =
        Math.round(
          Math.abs(state.speed)
        );

      timerElement.textContent =
        `${state.elapsed.toFixed(1)}s`;

      const alertNow =
        performance.now();

      state.lawAlerts =
        state.lawAlerts.filter(
          alert =>
            alert.expiresAt >
            alertNow
        );

      trafficStatus.replaceChildren();

      trafficStatus.classList.toggle(
        'hidden',
        state.lawAlerts.length === 0
      );

      state.lawAlerts.forEach(
        alert => {
          const copy =
            getLawAlert(alert.type);

          if (!copy) return;

          const card =
            document.createElement(
              'div'
            );

          card.className =
            `traffic-alert ${copy[3]}`;

          card.innerHTML =
            `<span class="traffic-status-label">${copy[0]}</span><strong>${copy[1]}</strong><p>${copy[2]}</p>`;

          trafficStatus.appendChild(
            card
          );
        }
      );
    }
  };
}

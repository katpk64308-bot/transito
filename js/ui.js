import { state } from './state.js';

export function createUI(
  onRaceStart = null,
  onRaceFinish = null,
  onBuildingEditorStart = null,
  onPhase2Start = null
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

  const phase2Btn =
    document.getElementById('phase2Btn');

  const phase2Note =
    document.getElementById('phase2Note');

  const trafficStatus =
    document.getElementById('traffic-status');

  const shadowsToggle =
    document.getElementById('shadowsToggle');

  const invertCamera =
    document.getElementById('invertCamera');

  /*
    ELEMENTOS DA PAUSA
  */

  const pauseMenu =
    document.getElementById('pauseMenu');

  const continueBtn =
    document.getElementById('continueBtn');

  const menuBtn =
    document.getElementById('menuBtn');

  const restartPauseBtn =
    document.getElementById('restartPauseBtn');

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

  /*
    MODO DE PILOTAGEM
  */

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

  /*
    CONQUISTAS
  */

  function renderAchievements() {
    Object.entries(
      achievementElements
    ).forEach(([id, element]) => {
      if (!element) return;

      const unlocked =
        Boolean(
          unlockedAchievements[id]
        );

      element.classList.toggle(
        'unlocked',
        unlocked
      );

      const icon =
        element.querySelector(
          '.achievement-icon'
        );

      if (icon) {
        icon.textContent =
          unlocked
            ? '✅'
            : '🔒';
      }
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

  /*
    ALERTAS DE INFRAÇÃO
  */

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

  /*
    CONFIGURAÇÃO DE SOMBRAS
  */

  if (shadowsToggle) {
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
  }

  /*
    CÂMERA INVERTIDA
  */

  const savedCameraInvert =
    localStorage.getItem(
      'cameraInvertY'
    ) === 'true';

  if (invertCamera) {
    invertCamera.checked =
      savedCameraInvert;
  }

  state.cameraInvertY =
    savedCameraInvert;

  if (invertCamera) {
    invertCamera.addEventListener(
      'change',
      () => {
        state.cameraInvertY =
          invertCamera.checked;

        localStorage.setItem(
          'cameraInvertY',
          String(
            invertCamera.checked
          )
        );
      }
    );
  }

  /*
    PAUSA
  */

  function showPanel(panelId) {
    const panel =
      document.getElementById(
        panelId
      );

    if (!panel) {
      console.warn(
        `Painel não encontrado: ${panelId}`
      );
      return;
    }

    document
      .querySelectorAll('.overlay')
      .forEach(panelElement => {
        panelElement.classList.add(
          'hidden'
        );
      });

    panel.classList.remove(
      'hidden'
    );
  }

  function setPaused(paused) {
    /*
      A pausa só funciona durante
      uma corrida ativa.
    */

    if (!state.raceStarted) {
      return;
    }

    if (state.raceFinished) {
      return;
    }

    /*
      PAUSAR
    */

    if (paused) {
      if (state.paused) {
        return;
      }

      state.paused = true;

      state.pauseStarted =
        performance.now();

      /*
        Informa o main.js que o jogo
        entrou em pausa.
      */

      window.dispatchEvent(
        new CustomEvent(
          'pauseChanged',
          {
            detail: true
          }
        )
      );

      /*
        Mostra o menu de pausa.
      */

      if (pauseMenu) {
        showPanel('pauseMenu');
      }

      return;
    }

    /*
      CONTINUAR
    */

    if (state.pauseStarted) {
      state.startTime +=
        performance.now() -
        state.pauseStarted;
    }

    state.pauseStarted = 0;

    state.paused = false;

    /*
      Informa o main.js que o jogo
      voltou a funcionar.
    */

    window.dispatchEvent(
      new CustomEvent(
        'pauseChanged',
        {
          detail: false
        }
      )
    );

    if (pauseMenu) {
      pauseMenu.classList.add(
        'hidden'
      );
    }
  }

  function togglePause() {
    if (
      !state.raceStarted ||
      state.raceFinished
    ) {
      return;
    }

    setPaused(
      !state.paused
    );
  }

  /*
    LOADING
  */

  let lastUpdate = 0;

  let gameVisible = false;

  let loadingTipTimer;

  const loadingTips = [
    'Se você entrar e o jogo não tiver carregado, não se mexa.',
    'Para andar, use as setas ou W A S D.',
    'Aperte F3 para ver as coordenadas.',
    'Aperte M durante a corrida para mudar o modo.',
    'Aperte P durante a corrida para pausar.'
  ];

  function showRandomLoadingTip() {
    if (!loadingTipElement) return;

    const currentTip =
      loadingTipElement.textContent;

    const availableTips =
      loadingTips.filter(
        tip =>
          tip !== currentTip
      );

    loadingTipElement.textContent =
      availableTips[
        Math.floor(
          Math.random() *
          availableTips.length
        )
      ];
  }

  /*
    INICIAR CORRIDA
  */

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

    state.raceFinished = false;

    state.paused = false;

    state.pauseStarted = 0;

    state.startTime =
      performance.now();

    state.elapsed = 0;

    if (introOverlay) {
      introOverlay.classList.add(
        'hidden'
      );
    }

    onRaceStart?.();
  }

  /*
    MOSTRAR JOGO
  */

  function showGame() {
    gameElements.forEach(
      element =>
        element.classList.remove(
          'game-hidden'
        )
    );

    gameVisible = true;

    if (introOverlay) {
      introOverlay.classList.remove(
        'hidden'
      );
    }

    updateDrivingMode();
  }

  /*
    FINALIZAR CORRIDA
  */

  function finishRace() {
    state.raceFinished = true;

    state.paused = false;

    state.pauseStarted = 0;

    state.elapsed =
      (
        performance.now() -
        state.startTime
      ) / 1000;

    onRaceFinish?.();

    unlockAchievements();

    if (finishTimeElement) {
      finishTimeElement.textContent =
        `${state.elapsed.toFixed(1)}s`;
    }

    if (violationHistoryElement) {
      violationHistoryElement.replaceChildren();

      const lawHistory =
        state.lawHistory || [];

      if (lawHistory.length === 0) {
        const cleanMessage =
          document.createElement(
            'p'
          );

        cleanMessage.className =
          'clean-race';

        cleanMessage.textContent =
          'Nenhuma infração registrada.';

        violationHistoryElement.appendChild(
          cleanMessage
        );
      } else {
        lawHistory.forEach(
          type => {
            const copy =
              getLawAlert(type);

            if (!copy) return;

            const item =
              document.createElement(
                'div'
              );

            item.className =
              `violation-item ${copy[3]}`;

            item.textContent =
              copy[1];

            violationHistoryElement.appendChild(
              item
            );
          }
        );
      }

      const cleanRun =
        lawHistory.length === 0;

      if (phase2Btn) {
        phase2Btn.disabled =
          !cleanRun;

        phase2Btn.classList.toggle(
          'locked',
          !cleanRun
        );
      }

      if (phase2Note) {
        phase2Note.textContent =
          cleanRun
            ? 'Fase 2 liberada! Bom trabalho, nenhuma infração.'
            : 'Você cometeu infrações nesta tentativa. Corra de novo sem infrações para liberar a Fase 2.';

        phase2Note.classList.toggle(
          'note-ok',
          cleanRun
        );
      }
    }

    if (finishOverlay) {
      finishOverlay.classList.remove(
        'hidden'
      );
    }
  }

  /*
    BOTÃO JOGAR
  */

  const playBtn =
    document.getElementById(
      'playBtn'
    );

  if (playBtn) {
    playBtn.addEventListener(
      'click',
      () => {
        if (mainMenu) {
          mainMenu.classList.add(
            'hidden'
          );
        }

        if (loadingOverlay) {
          loadingOverlay.classList.remove(
            'hidden'
          );
        }

        showRandomLoadingTip();

        loadingTipTimer =
          window.setInterval(
            showRandomLoadingTip,
            6000
          );

        window.setTimeout(() => {
          window.clearInterval(
            loadingTipTimer
          );

          if (loadingOverlay) {
            loadingOverlay.classList.add(
              'hidden'
            );
          }

          showGame();
        }, 15000);
      }
    );
  }

  /*
    EDITAR PRÉDIOS
  */

  const editBuildingsBtn =
    document.getElementById(
      'editBuildingsBtn'
    );

  if (editBuildingsBtn) {
    editBuildingsBtn.addEventListener(
      'click',
      () => {
        if (mainMenu) {
          mainMenu.classList.add(
            'hidden'
          );
        }

        showGame();

        if (introOverlay) {
          introOverlay.classList.add(
            'hidden'
          );
        }

        onBuildingEditorStart?.();
      }
    );
  }

  /*
    COMEÇAR CORRIDA
  */

  const startBtn =
    document.getElementById(
      'startBtn'
    );

  if (startBtn) {
    startBtn.addEventListener(
      'click',
      startRace
    );
  }

  /*
    CONTINUAR DA PAUSA
  */

  if (continueBtn) {
    continueBtn.addEventListener(
      'click',
      () => {
        setPaused(false);
      }
    );
  }

  /*
    VOLTAR AO MENU
  */

  if (menuBtn) {
    menuBtn.addEventListener(
      'click',
      () => {
        location.reload();
      }
    );
  }

  /*
    REINICIAR PELA PAUSA
  */

  if (restartPauseBtn) {
    restartPauseBtn.addEventListener(
      'click',
      () => {
        location.replace(
          `${location.pathname}?restart=1`
        );
      }
    );
  }

  /*
    PAINÉIS DO MENU
  */

  document
    .querySelectorAll(
      '[data-panel]'
    )
    .forEach(button => {
      button.addEventListener(
        'click',
        () => {
          showPanel(
            button.dataset.panel
          );
        }
      );
    });

  /*
    BOTÕES VOLTAR
  */

  document
    .querySelectorAll(
      '.backBtn'
    )
    .forEach(button => {
      button.addEventListener(
        'click',
        () => {
          showPanel(
            state.paused
              ? 'pauseMenu'
              : 'mainMenu'
          );
        }
      );
    });

  /*
    CORRER DE NOVO
  */

  const restartBtn =
    document.getElementById(
      'restartBtn'
    );

  if (restartBtn) {
    restartBtn.addEventListener(
      'click',
      () => {
        location.reload();
      }
    );
  }

  /*
    FASE 2
  */

  if (phase2Btn) {
    phase2Btn.addEventListener(
      'click',
      () => {
        if (phase2Btn.disabled) {
          return;
        }

        onPhase2Start?.();
      }
    );
  }

  /*
    RETOMAR AUTOMATICAMENTE APÓS
    ?restart=1
  */

  if (
    new URLSearchParams(
      location.search
    ).get('restart') === '1'
  ) {
    if (mainMenu) {
      mainMenu.classList.add(
        'hidden'
      );
    }

    if (loadingOverlay) {
      loadingOverlay.classList.remove(
        'hidden'
      );
    }

    showRandomLoadingTip();

    loadingTipTimer =
      window.setInterval(
        showRandomLoadingTip,
        6000
      );

    window.setTimeout(() => {
      window.clearInterval(
        loadingTipTimer
      );

      if (loadingOverlay) {
        loadingOverlay.classList.add(
          'hidden'
        );
      }

      showGame();

      if (introOverlay) {
        introOverlay.classList.add(
          'hidden'
        );
      }

      startRace();
    }, 15000);
  }

  /*
    RETORNO DA UI
  */

  return {
    startRace,

    togglePause,

    finishRace,

    update() {
      /*
        O cronômetro para enquanto
        o jogo está pausado.
      */

      if (
        state.raceStarted &&
        !state.raceFinished &&
        !state.paused
      ) {
        state.elapsed =
          (
            performance.now() -
            state.startTime
          ) / 1000;
      }

      /*
        Atualiza o modo de pilotagem.
      */

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

      if (speedElement) {
        speedElement.textContent =
          Math.round(
            Math.abs(state.speed)
          );
      }

      if (timerElement) {
        timerElement.textContent =
          `${state.elapsed.toFixed(1)}s`;
      }

      /*
        ALERTAS DE TRÂNSITO
      */

      const alertNow =
        performance.now();

      state.lawAlerts =
        state.lawAlerts.filter(
          alert =>
            alert.expiresAt >
            alertNow
        );

      if (trafficStatus) {
        trafficStatus.replaceChildren();

        trafficStatus.classList.toggle(
          'hidden',
          state.lawAlerts.length === 0
        );

        state.lawAlerts.forEach(
          alert => {
            const copy =
              getLawAlert(
                alert.type
              );

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
    }
  };
}
import { keys, state } from './state.js';

const modeOrder = ['comfort', 'sport', 'eco'];

export function setupControls(startRace, togglePause) {
  const touchControls =
    document.getElementById('touch-controls');

  function enterFullscreen() {
    const root = document.documentElement;

    const request =
      root.requestFullscreen ||
      root.webkitRequestFullscreen;

    if (
      !request ||
      document.fullscreenElement ||
      document.webkitFullscreenElement
    ) {
      return;
    }

    try {
      const result = request.call(root);

      result?.catch?.(() => {});

      screen.orientation?.lock?.('landscape').catch?.(() => {});
    } catch {
      // O navegador pode não permitir tela cheia ou rotação neste dispositivo.
    }
  }

  /*
    Tela cheia ao iniciar a corrida
  */
  document
    .getElementById('startBtn')
    ?.addEventListener(
      'click',
      enterFullscreen
    );

  /*
    CONTROLES TOUCH
  */
  touchControls
    ?.querySelectorAll('[data-control]')
    .forEach(button => {
      const control = button.dataset.control;

      const release = () => {
        keys[control] = false;
        button.classList.remove('is-pressed');
      };

      button.addEventListener(
        'pointerdown',
        event => {
          event.preventDefault();

          if (
            state.buildingEditorActive ||
            state.paused
          ) {
            return;
          }

          enterFullscreen();

          button.setPointerCapture?.(
            event.pointerId
          );

          keys[control] = true;

          button.classList.add(
            'is-pressed'
          );

          if (
            !state.raceStarted &&
            !state.raceFinished
          ) {
            startRace();
          }
        }
      );

      [
        'pointerup',
        'pointercancel',
        'lostpointercapture'
      ].forEach(type => {
        button.addEventListener(
          type,
          release
        );
      });
    });

  /*
    CONTROLES DO TECLADO
  */
  addEventListener(
    'keydown',
    event => {
      const key =
        event.key.toLowerCase();

      /*
        F3 é tratado por outro sistema.
      */
      if (event.key === 'F3') {
        return;
      }

      /*
        No editor de prédios,
        os controles da corrida ficam desativados.
      */
      if (state.buildingEditorActive) {
        return;
      }

      /*
        PAUSAR / CONTINUAR
        P
      */
      if (
        key === 'p' &&
        !event.repeat
      ) {
        event.preventDefault();

        togglePause?.();

        /*
          Evita que alguma tecla de movimento
          fique presa ao abrir a pausa.
        */
        Object.keys(keys).forEach(
          pressedKey => {
            keys[pressedKey] = false;
          }
        );

        return;
      }

      /*
        Enquanto estiver pausado,
        não aceita comandos de pilotagem.
      */
      if (state.paused) {
        return;
      }

      /*
        FAROL
        R
      */
      if (
        key === 'r' &&
        !event.repeat
      ) {
        state.playerLightEnabled =
          !state.playerLightEnabled;
      }

      /*
        MUDAR MODO DE PILOTAGEM
        M
      */
      if (key === 'm') {
        const currentIndex =
          modeOrder.indexOf(
            state.drivingMode || 'comfort'
          );

        const nextIndex =
          (currentIndex + 1) %
          modeOrder.length;

        state.drivingMode =
          modeOrder[nextIndex];

        window.dispatchEvent(
          new CustomEvent(
            'drivingModeChanged',
            {
              detail:
                state.drivingMode
            }
          )
        );

        return;
      }

      /*
        Movimento normal
      */
      keys[key] = true;

      /*
        A primeira tecla de movimento
        inicia a corrida.
      */
      if (
        !state.raceStarted &&
        !state.raceFinished
      ) {
        startRace();
      }
    }
  );

  /*
    SOLTAR TECLA
  */
  addEventListener(
    'keyup',
    event => {
      keys[
        event.key.toLowerCase()
      ] = false;
    }
  );
}
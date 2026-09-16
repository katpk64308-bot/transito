export function createCameraController(
  camera,
  state,
  domElement = document.getElementById('three-canvas')
) {
  const position = new THREE.Vector3(state.x, 6, state.z - 10);
  const lookTarget = new THREE.Vector3();
  const desiredPosition = new THREE.Vector3();
  const desiredLook = new THREE.Vector3();

  const SENSITIVITY_X = 0.0024;
  const SENSITIVITY_Y = 0.0018;
  const MAX_PITCH_HEIGHT = 2.5;

  const CAMERA_RETURN_DELAY = 3;
  const CAMERA_RETURN_SPEED = 1.5;

  let mouseYaw = 0;
  let mousePitch = 0;
  let smoothedYaw = 0;
  let smoothedPitch = 0;
  let reverseAngle = 0;
  let mouseIdleTime = 0;

  function requestLock() {
    if (
      state.raceStarted &&
      !state.raceFinished &&
      document.pointerLockElement !== domElement
    ) {
      domElement?.requestPointerLock?.();
    }
  }

  function releaseLock() {
    if (document.pointerLockElement === domElement) {
      document.exitPointerLock();
    }
  }

  function onMouseMove(e) {
    if (document.pointerLockElement !== domElement) return;

    if (Math.abs(e.movementX) > 0 || Math.abs(e.movementY) > 0) {
      mouseIdleTime = 0;
    }

    mouseYaw -= e.movementX * SENSITIVITY_X;

    if (state.cameraInvertY) {
      mousePitch += e.movementY * SENSITIVITY_Y;
    } else {
      mousePitch -= e.movementY * SENSITIVITY_Y;
    }

    mousePitch = Math.max(-1, Math.min(1, mousePitch));
  }

  function onCanvasClick() {
    requestLock();
  }

  domElement?.addEventListener('mousemove', onMouseMove);
  domElement?.addEventListener('click', onCanvasClick);

  function lerpAngle(current, target, t) {
    let diff = target - current;

    diff =
      ((diff + Math.PI) % (Math.PI * 2) + Math.PI * 2) %
        (Math.PI * 2) -
      Math.PI;

    return current + diff * t;
  }

  const updateCamera = function(dt) {
    if (
      state.raceStarted &&
      !state.raceFinished &&
      document.pointerLockElement === domElement
    ) {
      mouseIdleTime += dt;
    }

    if (mouseIdleTime >= CAMERA_RETURN_DELAY) {
      mouseYaw +=
        (0 - mouseYaw) *
        Math.min(1, dt * CAMERA_RETURN_SPEED);

      mousePitch +=
        (0 - mousePitch) *
        Math.min(1, dt * CAMERA_RETURN_SPEED);
    }

    const isReversing = state.speed < -0.1;

    reverseAngle = lerpAngle(
      reverseAngle,
      isReversing ? Math.PI : 0,
      Math.min(1, dt * 2.5)
    );

    smoothedYaw +=
      (mouseYaw - smoothedYaw) *
      Math.min(1, dt * 10);

    smoothedPitch +=
      (mousePitch - smoothedPitch) *
      Math.min(1, dt * 8);

    const camYaw =
      state.heading +
      reverseAngle +
      smoothedYaw;

    const forwardX = Math.sin(camYaw);
    const forwardZ = Math.cos(camYaw);

    const camHeight =
      4.6 +
      smoothedPitch * MAX_PITCH_HEIGHT;

    desiredPosition.set(
      state.x - forwardX * 9,
      camHeight,
      state.z - forwardZ * 9
    );

    position.lerp(
      desiredPosition,
      Math.min(1, dt * 4.5)
    );

    camera.position.copy(position);

    desiredLook.set(
      state.x + forwardX * 5,
      1.6,
      state.z + forwardZ * 5
    );

    lookTarget.lerp(
      desiredLook,
      Math.min(1, dt * 6)
    );

    camera.lookAt(lookTarget);
  };

  updateCamera.requestLock = requestLock;
  updateCamera.releaseLock = releaseLock;

  updateCamera.dispose = () => {
    domElement?.removeEventListener(
      'mousemove',
      onMouseMove
    );

    domElement?.removeEventListener(
      'click',
      onCanvasClick
    );

    releaseLock();
  };

  return updateCamera;
}
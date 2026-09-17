import { createScene } from './scene.js';
import { createTrack } from './track.js';
import { buildBike } from './bike.js';
import { state } from './state.js';
import { setupControls } from './controls.js';
import { updatePhysics } from './physics.js';
import { createCameraController } from './camera.js';
import { createMinimap } from './minimap.js';
import { createUI } from './ui.js';
import { createCoordinates } from './coordinates.js';
import { createModels } from './modelos.js';
import { createTrafficCar, createTrafficTrain } from './NPCs/veiculoNPC.js';

const { renderer, scene, camera } = createScene();

const track = createTrack(scene);

const models = createModels(scene);

const updateTrafficTrain = createTrafficTrain(scene, track);

const updateTrafficCar = createTrafficCar(
  scene,
  track,
  updateTrafficTrain.getHitboxes,
  track.getRailwaySignalStates
);

const bike = buildBike();

scene.add(bike.group);

const updateCamera = createCameraController(camera, state);

const ui = createUI(
  () => {
    updateCamera.requestLock();
  },
  () => {
    updateCamera.releaseLock();
  }
);

window.addEventListener('shadowsChanged', event => {
  renderer.shadowMap.enabled = event.detail;
});

const updateCoordinates = createCoordinates(scene);

setupControls(ui.startRace);

const drawMinimap = createMinimap(
  track.samples,
  updateTrafficTrain.getMinimapState
);

const clock = new THREE.Clock();

const stage = document.getElementById('stage');

let previousViolation = null;

const drivingModes = {
  eco: {
    name: 'ECO',
    maxSpeed: 22
  },

  comfort: {
    name: 'COMFORT',
    maxSpeed: 27
  },

  sport: {
    name: 'SPORT',
    maxSpeed: 32
  }
};

if (!state.drivingMode) {
  state.drivingMode = 'comfort';
}

state.maxSpeed =
  drivingModes[state.drivingMode].maxSpeed;

function updateDrivingModeDisplay(animate = false) {
  const modeElement =
    document.getElementById('drivingMode');

  if (!modeElement) return;

  const mode =
    drivingModes[state.drivingMode];

  if (!mode) return;

  modeElement.textContent =
    mode.name;

  if (!animate) return;

  modeElement.classList.remove(
    'mode-changing'
  );

  void modeElement.offsetWidth;

  modeElement.classList.add(
    'mode-changing'
  );

  setTimeout(() => {
    modeElement.classList.remove(
      'mode-changing'
    );
  }, 450);
}

window.addEventListener(
  'drivingModeChanged',
  event => {
    const mode = event.detail;

    if (!drivingModes[mode]) return;

    state.drivingMode = mode;

    state.maxSpeed =
      drivingModes[mode].maxSpeed;

    updateDrivingModeDisplay(true);
  }
);

updateDrivingModeDisplay();

function checkTrafficCollisions() {
  const hitboxes = [
    ...updateTrafficCar.getHitboxes(),
    ...updateTrafficTrain.getHitboxes()
  ];

  const bikeRadius = 1.4;

  return hitboxes.map(hitbox => {
    let dx = state.x - hitbox.x;
    let dz = state.z - hitbox.z;
    let collisionDistance;

    if (
      hitbox.halfWidth &&
      hitbox.halfLength
    ) {
      const cos =
        Math.cos(hitbox.heading);

      const sin =
        Math.sin(hitbox.heading);

      const localX =
        dx * cos - dz * sin;

      const localZ =
        dx * sin + dz * cos;

      const closestX =
        Math.max(
          -hitbox.halfWidth,
          Math.min(
            hitbox.halfWidth,
            localX
          )
        );

      const closestZ =
        Math.max(
          -hitbox.halfLength,
          Math.min(
            hitbox.halfLength,
            localZ
          )
        );

      const closestWorldX =
        hitbox.x +
        closestX * cos +
        closestZ * sin;

      const closestWorldZ =
        hitbox.z -
        closestX * sin +
        closestZ * cos;

      dx =
        state.x - closestWorldX;

      dz =
        state.z - closestWorldZ;

      collisionDistance =
        Math.hypot(dx, dz);

      if (collisionDistance < .001) {
        const distanceToSide =
          hitbox.halfWidth -
          Math.abs(localX);

        const distanceToEnd =
          hitbox.halfLength -
          Math.abs(localZ);

        if (
          distanceToSide <
          distanceToEnd
        ) {
          const side =
            Math.sign(localX) || 1;

          dx =
            side * cos;

          dz =
            -side * sin;
        } else {
          const side =
            Math.sign(localZ) || 1;

          dx =
            side * sin;

          dz =
            side * cos;
        }

        collisionDistance = 0;
      }
    } else {
      collisionDistance =
        Math.hypot(dx, dz);
    }

    const overlap =
      hitbox.halfWidth &&
      hitbox.halfLength
        ? bikeRadius -
          collisionDistance
        : bikeRadius +
          hitbox.radius -
          collisionDistance;

    return {
      ...hitbox,
      dx,
      dz,
      distance: collisionDistance,
      overlap
    };
  }).find(
    collision =>
      collision.overlap >= 0
  ) || null;
}

function resolveTrafficCollision(
  collision
) {
  let normalX = collision.dx;
  let normalZ = collision.dz;

  const distance =
    collision.distance || 1;

  if (collision.distance < .001) {
    const normalLength =
      Math.hypot(
        normalX,
        normalZ
      );

    if (normalLength > .001) {
      normalX /= normalLength;
      normalZ /= normalLength;
    } else {
      normalX =
        -Math.sin(state.heading);

      normalZ =
        -Math.cos(state.heading);
    }
  } else {
    normalX /= distance;
    normalZ /= distance;
  }

  const separation =
    Math.max(
      collision.overlap,
      0
    ) + .15;

  state.x +=
    normalX * separation;

  state.z +=
    normalZ * separation;

  const reboundSpeed =
    Math.min(
      10,
      Math.max(
        3.5,
        Math.abs(state.speed) * .55
      )
    );

  state.speed =
    -reboundSpeed;

  bike.group.position.set(
    state.x,
    0,
    state.z
  );
}

function animate() {
  requestAnimationFrame(animate);

  if (
    stage.classList.contains(
      'game-hidden'
    )
  ) {
    clock.getDelta();
    return;
  }

  const dt =
    Math.min(
      clock.getDelta(),
      0.05
    );

  if (!state.raceFinished) {
    updatePhysics(
      dt,
      bike,
      track,
      ui.finishRace,
      models.colliders
    );
  }

  updateTrafficTrain(dt);

  track.updateRailwaySignals(
    updateTrafficTrain.getSignalState()
  );

  updateTrafficCar(dt);

  const trafficCollision =
    checkTrafficCollisions();

  if (trafficCollision) {
    resolveTrafficCollision(
      trafficCollision
    );
  }

  const currentViolation =
    trafficCollision?.type ||
    (
      state.foraEstrada
        ? 'offroad'
        : (
          state.contramao
            ? 'wrong'
            : null
        )
    );

  if (
    currentViolation &&
    currentViolation !==
      previousViolation
  ) {
    if (
      !state.lawHistory.includes(
        currentViolation
      )
    ) {
      state.lawHistory.push(
        currentViolation
      );
    }

    state.collisionAlert =
      currentViolation;

    state.alertUntil =
      performance.now() + 10000;

    const alertNow =
      performance.now();

    state.lawAlerts =
      state.lawAlerts.filter(
        alert =>
          alert.type !==
            currentViolation &&
          alert.expiresAt >
            alertNow
      );

    state.lawAlerts.push({
      type: currentViolation,
      expiresAt:
        alertNow + 5000
    });
  }

  if (currentViolation) {
    state.lawBroken = true;
  }

  previousViolation =
    currentViolation;

  updateCamera(dt);

  drawMinimap();

  updateCoordinates(state);

  ui.update();

  renderer.render(
    scene,
    camera
  );
}

animate();
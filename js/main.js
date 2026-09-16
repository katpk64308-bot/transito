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
import { createTrafficCar, createTrafficTrain } from './veiculoNPC.js';

const { renderer, scene, camera } = createScene();

const track = createTrack(scene);

const models = createModels(scene);

const updateTrafficCar = createTrafficCar(scene, track);

const updateTrafficTrain = createTrafficTrain(scene, track);

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

const drawMinimap = createMinimap(track.samples);

const clock = new THREE.Clock();

const stage = document.getElementById('stage');

let previousViolation = null;

function checkTrafficCollisions() {
  const hitboxes = [
    ...updateTrafficCar.getHitboxes(),
    ...updateTrafficTrain.getHitboxes()
  ];

  const bikeRadius = 2.4;

  return hitboxes.find(hitbox => {
    const dx = state.x - hitbox.x;
    const dz = state.z - hitbox.z;

    return Math.hypot(dx, dz) <= bikeRadius + hitbox.radius;
  }) || null;
}

function animate() {
  requestAnimationFrame(animate);

  if (stage.classList.contains('game-hidden')) {
    clock.getDelta();
    return;
  }

  const dt = Math.min(clock.getDelta(), 0.05);

  if (!state.raceFinished) {
    updatePhysics(
      dt,
      bike,
      track,
      ui.finishRace,
      models.colliders
    );
  }

  updateTrafficCar(dt);

  updateTrafficTrain(dt);

  const trafficCollision = checkTrafficCollisions();

  if (trafficCollision) {
    state.speed = 0;
  }

  const currentViolation =
    trafficCollision?.type ||
    (
      state.foraEstrada
        ? 'offroad'
        : (state.contramao ? 'wrong' : null)
    );

  if (
    currentViolation &&
    currentViolation !== previousViolation
  ) {
    state.collisionAlert = currentViolation;
    state.alertUntil = performance.now() + 10000;

    const alertNow = performance.now();

    state.lawAlerts = state.lawAlerts.filter(alert =>
      alert.type !== currentViolation &&
      alert.expiresAt > alertNow
    );

    state.lawAlerts.push({
      type: currentViolation,
      expiresAt: alertNow + 5000
    });
  }

  if (currentViolation) {
    state.lawBroken = true;
  }

  previousViolation = currentViolation;

  updateCamera(dt);

  drawMinimap();

  updateCoordinates(state);

  ui.update();

  renderer.render(scene, camera);
}

animate();
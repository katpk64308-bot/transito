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
import { createTrafficCar } from './veiculoNPC.js';

const { renderer, scene, camera } = createScene();
const track = createTrack(scene);
const models = createModels(scene);
const updateTrafficCar = createTrafficCar(scene, track);
const bike = buildBike();
scene.add(bike.group);

const ui = createUI();
const updateCoordinates = createCoordinates(scene);
setupControls(ui.startRace);
const updateCamera = createCameraController(camera, state);
const drawMinimap = createMinimap(track.samples);
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);

  if (!state.raceFinished) updatePhysics(dt, bike, track, ui.finishRace, models.colliders);
  updateTrafficCar(dt);
  updateCamera(dt);
  drawMinimap();
  updateCoordinates(state);
  ui.update();
  renderer.render(scene, camera);
}

animate();

import { createScene } from './scene.js';
import { createTrack } from './track.js';
import { buildBike } from './bike.js';
import { state } from './state.js';
import { setupControls } from './controls.js';
import { updatePhysics } from './physics.js';
import { createCameraController } from './camera.js';
import { createMinimap } from './minimap.js';
import { createUI } from './ui.js';

const { renderer, scene, camera } = createScene();
const track = createTrack(scene);
const bike = buildBike();
scene.add(bike.group);

const ui = createUI();
setupControls(ui.startRace);
const updateCamera = createCameraController(camera, state);
const drawMinimap = createMinimap(track.samples);
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);

  if (!state.raceFinished) updatePhysics(dt, bike, track, ui.finishRace);
  updateCamera(dt);
  drawMinimap();
  ui.update();
  renderer.render(scene, camera);
}

animate();

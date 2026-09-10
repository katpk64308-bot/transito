const GRID_MIN = -300;
const GRID_MAX = 500;
const GRID_STEP = 25;
const LABEL_STEP = 50;

function makeLabel(text, color = '#ffd166') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  context.font = 'bold 24px Segoe UI, Arial, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.strokeStyle = '#111a';
  context.lineWidth = 7;
  context.strokeText(text, 128, 32);
  context.fillStyle = color;
  context.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(18, 4.5, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function addCoordinateLabel(group, text, x, z, color) {
  const label = makeLabel(text, color);
  label.position.set(x, .35, z);
  group.add(label);
}

export function createCoordinates(scene) {
  const group = new THREE.Group();
  group.name = 'temporary-coordinate-grid';

  for (let value = GRID_MIN; value <= GRID_MAX; value += GRID_STEP) {
    const major = value % LABEL_STEP === 0;
    const material = new THREE.LineBasicMaterial({
      color: value === 0 ? 0xffb020 : (major ? 0xd7e3e8 : 0x9bb0b8),
      transparent: true,
      opacity: value === 0 ? .9 : (major ? .38 : .16),
      depthTest: false
    });

    const xLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(value, .08, GRID_MIN),
        new THREE.Vector3(value, .08, GRID_MAX)
      ]), material
    );
    const zLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(GRID_MIN, .08, value),
        new THREE.Vector3(GRID_MAX, .08, value)
      ]), material.clone()
    );
    xLine.renderOrder = zLine.renderOrder = 9;
    group.add(xLine, zLine);

    if (major) {
      addCoordinateLabel(group, `X ${value}`, value, GRID_MIN + 9, '#ffd166');
      addCoordinateLabel(group, `Z ${value}`, GRID_MIN + 9, value, '#8ee3f7');
    }
  }

  scene.add(group);
  const panel = document.getElementById('coordinates');
  let visible = false;
  group.visible = false;
  panel.classList.add('hidden');

  addEventListener('keydown', event => {
    if (event.key === 'F3') {
      event.preventDefault();
      visible = !visible;
      group.visible = visible;
      panel.classList.toggle('hidden', !visible);
    }
  });

  return function updateCoordinates(state) {
    if (!visible) return;
    panel.textContent = `X: ${state.x.toFixed(1)}   Z: ${state.z.toFixed(1)}  (F3 ocultar)`;
  };
}

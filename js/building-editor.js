import { state } from './state.js';
import { MODEL_CONFIG } from './modelos.js';

const BUILDING_NAMES = ['predio1', 'predio2', 'predio3', 'predio4'];

function formatNumber(value) {
  if (Math.abs(value) < .0005) return '0';
  if (Math.abs(value + Math.PI / 2) < .0005) return '-Math.PI / 2';
  if (Math.abs(value - Math.PI / 2) < .0005) return 'Math.PI / 2';
  if (Math.abs(value - Math.PI) < .0005) return 'Math.PI';
  return Number(value.toFixed(3)).toString();
}

function formatVector(vector) {
  return `{ x: ${formatNumber(vector.x)}, y: ${formatNumber(vector.y)}, z: ${formatNumber(vector.z)} }`;
}

function formatPath(path) {
  return `'${path.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function getBuildingInstances(name, buildings) {
  const config = MODEL_CONFIG[name];
  const records = buildings
    .filter(record => record.modelName === name)
    .sort((a, b) => a.instanceIndex - b.instanceIndex);

  if (records.length) {
    return records.map(record => ({
      position: {
        x: record.object.position.x,
        y: 0,
        z: record.object.position.z
      },
      rotation: {
        x: record.baseRotation.x,
        y: record.object.rotation.y,
        z: record.baseRotation.z
      }
    }));
  }

  const configuredInstances = config.instances ||
    [{ position: config.position, rotation: config.rotation }];
  return configuredInstances.map(instance => ({
    position: { ...instance.position },
    rotation: instance.rotation || config.rotation
  }));
}

function generateBuildingConfig(buildings) {
  return BUILDING_NAMES.map((name, index) => {
    const config = MODEL_CONFIG[name];
    const instances = getBuildingInstances(name, buildings);
    const firstPosition = instances[0]?.position || config.position;
    const lines = [
      `  ${name}: {`,
      `    file: ${formatPath(config.file)},`
    ];

    if (config.mtl) lines.push(`    mtl: ${formatPath(config.mtl)},`);
    lines.push(
      `    position: ${formatVector(firstPosition)},`,
      `    scale: ${formatVector(config.scale)},`,
      `    rotation: ${formatVector(config.rotation)},`,
      '    instances: ['
    );

    instances.forEach((instance, instanceIndex) => {
      lines.push(
        `      { position: ${formatVector(instance.position)}, rotation: ${formatVector(instance.rotation)} }${instanceIndex < instances.length - 1 ? ',' : ''}`
      );
    });

    lines.push(
      '    ],',
      `    castShadow: ${config.castShadow ?? false},`,
      `    collision: { enabled: ${config.collision?.enabled ?? false} },`,
      `    alignGround: ${config.alignGround ?? false}`,
      `  }${index < BUILDING_NAMES.length - 1 ? ',' : ''}`
    );

    return lines.join('\n');
  }).join('\n');
}

export function createBuildingEditor(buildings, cameraController, onExit = null) {
  const panel = document.createElement('aside');
  panel.id = 'buildingEditor';
  panel.className = 'building-editor hidden';
  panel.innerHTML = `
    <h2>Editor de prédios</h2>
    <p>Escolha um prédio e ajuste a posição. A câmera acompanha o prédio selecionado.</p>
    <label class="editor-field">
      Prédio
      <select id="buildingEditorSelect"></select>
    </label>
    <div class="editor-fields">
      <label class="editor-field">X <input id="buildingEditorX" type="number" step="1"></label>
      <label class="editor-field">Z <input id="buildingEditorZ" type="number" step="1"></label>
      <label class="editor-field">Giro horizontal (°) <input id="buildingEditorRotation" type="number" step="5"></label>
    </div>
    <div class="editor-buttons">
      <button id="buildingEditorFocus" type="button">Focar</button>
      <button id="buildingEditorExport" type="button">Gerar código completo</button>
      <button id="buildingEditorClose" type="button">Voltar</button>
    </div>
    <textarea id="buildingEditorOutput" readonly placeholder="Os blocos predio1 a predio4 aparecerão aqui."></textarea>
    <small>Copie o código e substitua os blocos predio1 até predio4 dentro de MODEL_CONFIG em js/modelos.js.</small>
  `;
  document.body.appendChild(panel);

  const select = panel.querySelector('#buildingEditorSelect');
  const xInput = panel.querySelector('#buildingEditorX');
  const zInput = panel.querySelector('#buildingEditorZ');
  const rotationInput = panel.querySelector('#buildingEditorRotation');
  const output = panel.querySelector('#buildingEditorOutput');
  let selectedName = null;
  let lastCount = -1;

  function getRecords() {
    return buildings.slice().sort((a, b) => a.order - b.order);
  }

  function selectedRecord() {
    return getRecords().find(record => record.object.name === selectedName) || null;
  }

  function refreshFields(record) {
    if (!record) return;
    xInput.value = record.object.position.x.toFixed(2);
    zInput.value = record.object.position.z.toFixed(2);
    rotationInput.value = (record.object.rotation.y * 180 / Math.PI).toFixed(0);
    cameraController.setEditorFocus(record.object);
  }

  function updateFootprint(record) {
    record.object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(record.object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);
    record.footprint.radius = Math.hypot(size.x / 2, size.z / 2);
    record.footprint.offsetX = center.x - record.object.position.x;
    record.footprint.offsetZ = center.z - record.object.position.z;
  }

  function applyFields() {
    const record = selectedRecord();
    if (!record) return;
    if ([xInput, zInput, rotationInput].some(input => input.value.trim() === '')) {
      return;
    }

    const x = Number(xInput.value);
    const z = Number(zInput.value);
    const rotationDegrees = Number(rotationInput.value);
    if (![x, z, rotationDegrees].every(Number.isFinite)) return;

    record.object.position.x = x;
    record.object.position.z = z;
    record.object.rotation.y = rotationDegrees * Math.PI / 180;
    record.anchor.x = x;
    record.anchor.z = z;
    updateFootprint(record);
  }

  function syncList() {
    const records = getRecords();
    if (records.length === lastCount) return;
    lastCount = records.length;

    const previousName = selectedName;
    select.replaceChildren();
    records.forEach(record => {
      const option = document.createElement('option');
      option.value = record.object.name;
      option.textContent = `${record.modelName} — prédio ${record.instanceIndex + 1}`;
      select.appendChild(option);
    });

    if (records.length === 0) {
      selectedName = null;
      const option = document.createElement('option');
      option.textContent = 'Carregando prédios...';
      select.appendChild(option);
      return;
    }

    selectedName = records.some(record => record.object.name === previousName)
      ? previousName
      : records[0].object.name;
    select.value = selectedName;
    refreshFields(selectedRecord());
  }

  select.addEventListener('change', () => {
    selectedName = select.value;
    refreshFields(selectedRecord());
  });
  [xInput, zInput, rotationInput].forEach(input =>
    input.addEventListener('input', applyFields)
  );

  panel.querySelector('#buildingEditorFocus').addEventListener('click', () => {
    refreshFields(selectedRecord());
  });

  panel.querySelector('#buildingEditorExport').addEventListener('click', () => {
    output.value = generateBuildingConfig(getRecords());
    output.focus();
    output.select();
    output.setSelectionRange(0, output.value.length);
  });

  function deactivate() {
    state.buildingEditorActive = false;
    panel.classList.add('hidden');
    cameraController.clearEditorFocus();
    onExit?.();
  }

  panel.querySelector('#buildingEditorClose').addEventListener('click', deactivate);
  window.addEventListener('keydown', event => {
    if (state.buildingEditorActive && event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      deactivate();
    }
  });

  return {
    activate() {
      state.buildingEditorActive = true;
      panel.classList.remove('hidden');
      syncList();
    },
    update: syncList,
    deactivate
  };
}

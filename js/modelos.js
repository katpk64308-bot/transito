import { ROAD_W_MAIN, ROAD_W_OUTER, ROAD_W_SHORT } from './config.js';
import { registerNightGlow, registerNightLight } from './scene.js';

function addStreetlightEmitter(scene, streetlight, index, lightStride) {
  streetlight.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(streetlight);
  const position = new THREE.Vector3(
    (bounds.min.x + bounds.max.x) / 2,
    bounds.max.y - 0.35,
    (bounds.min.z + bounds.max.z) / 2
  );
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 8),
    new THREE.MeshBasicMaterial({
      color: 0xfff0c7,
      transparent: true,
      opacity: 1
    })
  );
  bulb.position.copy(position);

  const poolGeometry = new THREE.CircleGeometry(7, 24);
  const poolColors = new Float32Array(
    poolGeometry.attributes.position.count * 4
  );
  for (let vertex = 0; vertex < poolGeometry.attributes.position.count; vertex += 1) {
    const offset = vertex * 4;
    poolColors[offset] = 1;
    poolColors[offset + 1] = 0.78;
    poolColors[offset + 2] = 0.48;
    poolColors[offset + 3] = vertex === 0 ? 1 : 0;
  }
  poolGeometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(poolColors, 4)
  );
  const pool = new THREE.Mesh(
    poolGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xffd08a,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(position.x, 0.12, position.z);

  scene.add(bulb, pool);
  registerNightGlow(scene, [bulb, pool]);

  // Reduz a quantidade de luzes locais e mant�m brilho visivel entre elas.
  // Distribui os emissores pela cidade sem criar uma luz para cada poste.
  if (index % lightStride === 0) {
    const light = new THREE.PointLight(0xffd58a, 140, 65, 2);
    light.position.copy(position);
    scene.add(light);
    registerNightLight(scene, light);
  }
}


const MODEL_CONFIG = {
  escola: {
    file: 'modelo/escola.fbx',
    position: { x: 100, y: 0, z: 200 },
    scale: { x: .15, y: .17, z: .15 },
     rotation: { x: 0, y:16 , z: 0 },
    castShadow: false,
    collision: {
      enabled: true,
      size: { x: 42, z: 24 },
      offset: { x: 0, z: 0 }
    }
  },
  poste1: {
    file: 'modelo/cidade/poste1/Streetlight/Fbx/LoD_Streetlight.fbx',
    scale: { x: .035, y: .035, z: .035 },
    rotation: { x: 0, y: 0, z: 0 },
    castShadow: false,
    collision: { enabled: false },
    instances: [
      { position: { x: 30, y: 0, z: -18 } },
      { position: { x: -20, y: 0, z: 18 }, rotation: { x: 0, y: Math.PI, z: 0 } },
      { position: { x: -75, y: 0, z: -18 } },
      { position: { x: -135, y: 0, z: 18 }, rotation: { x: 0, y: Math.PI, z: 0 } },
      { position: { x: -195, y: 0, z: -15 } },
      { position: { x: -170, y: 0, z: 82 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } },
      { position: { x: -135, y: 0, z: 150 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } },
      { position: { x: -75, y: 0, z: 205 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } },
      { position: { x: 0, y: 0, z: 240 }, rotation: { x: 0, y: Math.PI / 2, z: 0 } },
      { position: { x: 75, y: 0, z: 240 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 } },
      { position: { x: 145, y: 0, z: 205 }, rotation: { x: 0, y: -Math.PI / 4, z: 0 } },
      { position: { x: 220, y: 0, z: 160 }, rotation: { x: 0, y: -Math.PI / 4, z: 0 } },
      { position: { x: 290, y: 0, z: 115 }, rotation: { x: 0, y: -Math.PI / 4, z: 0 } },
      { position: { x: 350, y: 0, z: 65 }, rotation: { x: 0, y: -Math.PI / 4, z: 0 } },
      { position: { x: 420, y: 0, z: 20 }, rotation: { x: 0, y: -Math.PI / 4, z: 0 } }
    ]
  },
      predio1: {
    file: 'modelo/cidade/predio1/Flatiron_Building_v1_L1.123cb356d0cd-9f00-4bc4-be97-260db4c03d17/13943_Flatiron_Building_v1_l1.obj',
    mtl: 'modelo/cidade/predio1/Flatiron_Building_v1_L1.123cb356d0cd-9f00-4bc4-be97-260db4c03d17/13943_Flatiron_Building_v1_l1.mtl',
    position: { x: 227, y: 0, z: 32 },
    scale: { x: 0.007, y: 0.007, z: 0.007 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    instances: [
      { position: { x: 227, y: 0, z: 32 }, rotation: { x: -Math.PI / 2, y: 2.356, z: 0 } },
      { position: { x: -221, y: 0, z: -18 }, rotation: { x: -Math.PI / 2, y: -1.745, z: 0 } },
      { position: { x: -189, y: 0, z: 228 }, rotation: { x: -Math.PI / 2, y: -0.698, z: 0 } },
      { position: { x: 133, y: 0, z: 355 }, rotation: { x: -Math.PI / 2, y: -0.785, z: 0 } },
      { position: { x: 364.17, y: 0, z: 60.17 }, rotation: { x: -Math.PI / 2, y: 1.309, z: 0 } },
      { position: { x: 215, y: 0, z: 18 }, rotation: { x: -Math.PI / 2, y: 13.788, z: 0 } }
    ],
    castShadow: true,
    manualPlacement: true,
    collision: { enabled: false },
    alignGround: true
  },
  predio2: {
    file: 'modelo/cidade/predio2/chrysler_building_v1_L1.123c61b463a0-1adf-4cf0-9acf-5e8e8f908a80/13942_Chrysler_Building_V1_l1.obj',
    mtl: 'modelo/cidade/predio2/chrysler_building_v1_L1.123c61b463a0-1adf-4cf0-9acf-5e8e8f908a80/13942_Chrysler_Building_V1_l1.mtl',
    position: { x: 413.71, y: 0, z: 320.707 },
    scale: { x: 0.002, y: 0.002, z: 0.002 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    instances: [
      { position: { x: 413.71, y: 0, z: 320.707 }, rotation: { x: -Math.PI / 2, y: 0.785, z: 0 } },
      { position: { x: 345.203, y: 0, z: 350.218 }, rotation: { x: -Math.PI / 2, y: -3.927, z: 0 } },
      { position: { x: 185.212, y: 0, z: 400.31 }, rotation: { x: -Math.PI / 2, y: -1.484, z: 0 } },
      { position: { x: -70.813, y: 0, z: 414.013 }, rotation: { x: -Math.PI / 2, y: -0.611, z: 0 } },
      { position: { x: -204, y: 0, z: 41 }, rotation: { x: -Math.PI / 2, y: -1.658, z: 0 } },
      { position: { x: 150, y: 0, z: 320.71 }, rotation: { x: -Math.PI / 2, y: 0.96, z: 0 } }
    ],
    castShadow: true,
    manualPlacement: true,
    collision: { enabled: false },
    alignGround: true
  },
  predio3: {
    file: 'modelo/cidade/predio3/Massachussetshall.obj',
    mtl: 'modelo/cidade/predio3/Massachussetshall.mtl',
    position: { x: -193, y: 0, z: 251 },
    scale: { x: 0.22, y: 0.22, z: 0.22 },
    rotation: { x: 0, y: 0, z: 0 },
    instances: [
      { position: { x: -193, y: 0, z: 251 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: -150, y: 0, z: 360 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 80, y: 0, z: 430 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 300, y: 0, z: 260 }, rotation: { x: 0, y: 0, z: 0 } },
      { position: { x: 430, y: 0, z: 70 }, rotation: { x: 0, y: 0, z: 0 } }
    ],
    castShadow: true,
    manualPlacement: true,
    collision: { enabled: false },
    alignGround: true
  },
  predio4: {
    file: 'modelo/cidade/predio4/Hospital_Building_V2_L3.123c3359fae7-7089-4dd3-993b-ce8739108426/10075_Hospital Building_V1_L3.obj',
    mtl: 'modelo/cidade/predio4/Hospital_Building_V2_L3.123c3359fae7-7089-4dd3-993b-ce8739108426/10075_Hospital Building_V1_L3.mtl',
    position: { x: 244.22, y: 0, z: -29 },
    scale: { x: 0.009, y: 0.009, z: 0.009 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    instances: [
      { position: { x: 244.22, y: 0, z: -29 }, rotation: { x: -Math.PI / 2, y: -0.087, z: 0 } },
      { position: { x: -13, y: 0, z: -24 }, rotation: { x: -Math.PI / 2, y: 0, z: 0 } },
      { position: { x: -122.45, y: 0, z: -26 }, rotation: { x: -Math.PI / 2, y: 0, z: 0 } },
      { position: { x: -238, y: 0, z: 96 }, rotation: { x: -Math.PI / 2, y: 2.705, z: 0 } },
      { position: { x: 473.425, y: 0, z: 1.153 }, rotation: { x: -Math.PI / 2, y: -0.698, z: 0 } },
      { position: { x: 401, y: 0, z: 211 }, rotation: { x: -Math.PI / 2, y: 1.484, z: 0 } }
    ],
    castShadow: true,
    manualPlacement: true,
    collision: { enabled: false },
    alignGround: true
  },
};
//=========================================================
function createSidewalkStreetlights(trackSamples) {
  if (!trackSamples) return null;

  const roads = [
    { samples: trackSamples.start, width: 27, step: 18 },
    { samples: trackSamples.outer, width: 25, step: 22 },
    { samples: trackSamples.shortcut, width: ROAD_W_SHORT, step: 18 },
    { samples: trackSamples.final, width: 27, step: 24 }
  ];

  const instances = [];
  let side = 1;

  roads.forEach(({ samples, width, step }) => {
    // A calçada começa após a pista e o meio dela fica a 16 unidades da
    // linha central. Deixar uma margem nas pontas evita cruzamentos.
    const sidewalkCenter = width / 2 + .55 + Math.min(width * .25, 4.5) / 2;

    for (let index = step; index < samples.length - step; index += step) {
      const previous = samples[index - 1];
      const next = samples[index + 1];
      const point = samples[index];
      const tangentX = next.x - previous.x;
      const tangentZ = next.z - previous.z;
      const length = Math.hypot(tangentX, tangentZ) || 1;
      const normalX = -tangentZ / length;
      const normalZ = tangentX / length;

      instances.push({
        position: {
          x: point.x + normalX * sidewalkCenter * side,
          y: 0,
          z: point.z + normalZ * sidewalkCenter * side
        },
        rotation: { x: 0, y: Math.atan2(tangentX, tangentZ), z: 0 }
      });

      side *= -1;
    }
  });

  return instances;
}

function measureBuildingFootprint(model, config) {
  const measuredModel = model.clone(true);
  measuredModel.position.set(0, 0, 0);
  measuredModel.scale.set(config.scale.x, config.scale.y, config.scale.z);
  measuredModel.rotation.set(config.rotation.x, 0, config.rotation.z);

  const measuredRoot = new THREE.Group();
  measuredRoot.rotation.y = config.rotation.y;
  measuredRoot.add(measuredModel);
  measuredRoot.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(measuredRoot);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bounds.getSize(size);
  bounds.getCenter(center);

  return {
    radius: Math.hypot(size.x / 2, size.z / 2),
    offsetX: center.x,
    offsetZ: center.z
  };
}

function closestPointOnPath(position, samples) {
  let nearest = null;

  for (let index = 0; index < samples.length - 1; index += 1) {
    const a = samples[index];
    const b = samples[index + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const lengthSquared = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1,
      ((position.x - a.x) * dx + (position.z - a.z) * dz) / lengthSquared));
    const point = { x: a.x + dx * t, z: a.z + dz * t };
    const distance = Math.hypot(position.x - point.x, position.z - point.z);

    if (!nearest || distance < nearest.distance) {
      nearest = { point, distance, tangentX: dx, tangentZ: dz };
    }
  }

  return nearest;
}

function moveOutsidePath(position, samples, clearance, seed) {
  const nearest = closestPointOnPath(position, samples);
  if (!nearest || nearest.distance >= clearance) return;

  let dx = position.x - nearest.point.x;
  let dz = position.z - nearest.point.z;
  let distance = nearest.distance;

  if (distance < .001) {
    const length = Math.hypot(nearest.tangentX, nearest.tangentZ) || 1;
    const side = seed % 2 === 0 ? 1 : -1;
    dx = -nearest.tangentZ / length * side;
    dz = nearest.tangentX / length * side;
    distance = 1;
  }

  const moveDistance = clearance - nearest.distance;
  position.x += dx / distance * moveDistance;
  position.z += dz / distance * moveDistance;
}

function moveOutsideBuilding(position, other, clearance, seed) {
  let dx = position.x - other.x;
  let dz = position.z - other.z;
  let distance = Math.hypot(dx, dz);
  if (distance >= clearance) return;

  if (distance < .001) {
    const angle = seed * 2.399963229728653;
    dx = Math.cos(angle);
    dz = Math.sin(angle);
    distance = 1;
  }

  const moveDistance = clearance - Math.hypot(position.x - other.x, position.z - other.z);
  position.x += dx / distance * moveDistance;
  position.z += dz / distance * moveDistance;
}

function placeBuildingsBesideRoads(trackSamples, buildings) {
  if (!trackSamples) return;

  const roads = [
    { samples: trackSamples.start, width: ROAD_W_MAIN },
    { samples: trackSamples.outer, width: ROAD_W_OUTER },
    { samples: trackSamples.shortcut, width: ROAD_W_SHORT },
    { samples: trackSamples.final, width: ROAD_W_MAIN }
  ].filter(road => road.samples?.length > 1);
  const railway = trackSamples.train || [];
  const placed = [];
  const orderedBuildings = buildings.slice().sort((a, b) => a.order - b.order);

  orderedBuildings.forEach(building => {
    const { footprint, anchor, object, order } = building;
    const position = {
      x: anchor.x + footprint.offsetX,
      z: anchor.z + footprint.offsetZ
    };
    if (building.manualPlacement) {
      object.position.x = anchor.x;
      object.position.z = anchor.z;
      placed.push({ position, radius: footprint.radius, order });
      return;
    }
    let nearestRoad = null;

    roads.forEach(road => {
      const nearest = closestPointOnPath(position, road.samples);
      if (nearest && (!nearestRoad || nearest.distance < nearestRoad.distance)) {
        nearestRoad = { ...nearest, width: road.width };
      }
    });

    if (nearestRoad) {
      const sidewalkWidth = Math.min(nearestRoad.width * .25, 4.5);
      const roadClearance =
        nearestRoad.width / 2 + .55 + sidewalkWidth + footprint.radius + 2;

      // Bring distant buildings back to the nearest street while keeping their
      // original side of it. Nearby buildings stay at their authored position.
      if (nearestRoad.distance > roadClearance + 18) {
        const tangentLength =
          Math.hypot(nearestRoad.tangentX, nearestRoad.tangentZ) || 1;
        const normalX = -nearestRoad.tangentZ / tangentLength;
        const normalZ = nearestRoad.tangentX / tangentLength;
        const offsetX = position.x - nearestRoad.point.x;
        const offsetZ = position.z - nearestRoad.point.z;
        const sideOffset = offsetX * normalX + offsetZ * normalZ;
        const side = sideOffset === 0
          ? (order % 2 === 0 ? 1 : -1)
          : Math.sign(sideOffset);

        position.x = nearestRoad.point.x + normalX * roadClearance * side;
        position.z = nearestRoad.point.z + normalZ * roadClearance * side;
      }
    }

    for (let pass = 0; pass < 32; pass += 1) {
      const previousX = position.x;
      const previousZ = position.z;

      roads.forEach(road => {
        const sidewalkWidth = Math.min(road.width * .25, 4.5);
        const clearance =
          road.width / 2 + .55 + sidewalkWidth + footprint.radius + 2;
        moveOutsidePath(position, road.samples, clearance, order);
      });

      if (railway.length > 1) {
        moveOutsidePath(position, railway, footprint.radius + 4, order + 1);
      }

      placed.forEach(other => {
        moveOutsideBuilding(
          position,
          other.position,
          footprint.radius + other.radius + 3,
          order + other.order
        );
      });

      if (Math.hypot(position.x - previousX, position.z - previousZ) < .01) break;
    }

    object.position.x = position.x - footprint.offsetX;
    object.position.z = position.z - footprint.offsetZ;
    placed.push({ position, radius: footprint.radius, order });
  });
}

function configureModel(model, config) {
  model.position.set(config.position.x, config.position.y, config.position.z);
  model.scale.set(config.scale.x, config.scale.y, config.scale.z);
  model.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
  model.updateMatrixWorld(true);

  if (config.alignGround) {
    const bounds = new THREE.Box3().setFromObject(model);
    model.position.y -= bounds.min.y;
  }

  model.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = config.castShadow ?? false;
    object.receiveShadow = config.receiveShadow ?? config.castShadow ?? false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => {
      if (!material) return;
      // Renderizar as duas faces dobra o trabalho de fragmentos. Os modelos
      // do cenário são fechados, portanto a face frontal é suficiente.
      material.side = THREE.FrontSide;
      material.needsUpdate = true;
    });
  });
}

function loadModel(config, onLoad, onError) {
  const extension = config.file.split('.').pop().toLowerCase();

  if (extension === 'fbx') {
    new THREE.FBXLoader().load(config.file, onLoad, undefined, onError);
    return;
  }

  if (extension === 'obj') {
    const loadObj = materials => {
      const loader = new THREE.OBJLoader();
      if (materials) {
        materials.preload();
        loader.setMaterials(materials);
      }
      loader.load(config.file, onLoad, undefined, onError);
    };

    if (config.mtl) {
      new THREE.MTLLoader().load(config.mtl, loadObj, undefined, onError);
    } else {
      loadObj();
    }
    return;
  }

  if (extension === 'max') {
    onError(new Error('Arquivos .max precisam ser exportados para .obj, .fbx ou .glb.'));
    return;
  }

  onError(new Error(`Formato de modelo não suportado: .${extension}`));
}

export function createModels(scene, trackSamples = null) {
  const colliders = [];
  const buildingRecords = [];
  const modelOrder = Object.keys(MODEL_CONFIG);

  Object.entries(MODEL_CONFIG).forEach(([name, config]) => {
    if (config.collision?.enabled) {
      const angle = config.rotation.y;
      const offsetX = config.collision.offset?.x || 0;
      const offsetZ = config.collision.offset?.z || 0;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      colliders.push({
        name,
        x: config.position.x + offsetX * cos + offsetZ * sin,
        z: config.position.z - offsetX * sin + offsetZ * cos,
        halfX: config.collision.size.x / 2,
        halfZ: config.collision.size.z / 2,
        angle
      });
    }

    loadModel(
      config,
      model => {
        if (name.startsWith('predio')) {
          const modelInstances = config.instances ||
            [{ position: config.position, rotation: config.rotation }];

          modelInstances.forEach((instance, index) => {
            const instanceConfig = {
              ...config,
              position: instance.position,
              rotation: instance.rotation || config.rotation,
              scale: instance.scale || config.scale
            };
            const modelObject = index === 0 ? model : model.clone(true);
            const object = new THREE.Group();
            object.name = `${name}-${index + 1}`;
            const footprint = measureBuildingFootprint(modelObject, instanceConfig);
            object.position.set(
              instance.position.x,
              instance.position.y ?? 0,
              instance.position.z
            );
            object.rotation.y = instanceConfig.rotation.y;

            const modelConfig = {
              ...instanceConfig,
              position: {
                x: 0,
                y: 0,
                z: 0
              },
              rotation: {
                ...instanceConfig.rotation,
                y: 0
              }
            };
            configureModel(modelObject, modelConfig);
            object.add(modelObject);
            scene.add(object);
            buildingRecords.push({
              object,
              footprint,
              anchor: { ...instance.position },
              modelName: name,
              instanceIndex: index,
              baseRotation: { ...instanceConfig.rotation },
              manualPlacement: config.manualPlacement === true || Boolean(
                config.instances?.length && config.instances.every(item => item.rotation)
              ),
              order: modelOrder.indexOf(name) * 100 + index
            });
          });

          placeBuildingsBesideRoads(trackSamples, buildingRecords);
          return;
        }

        const sidewalkStreetlights =
          name === 'poste1'
            ? createSidewalkStreetlights(trackSamples)
            : null;
        const instances = sidewalkStreetlights ||
          config.instances || [{ position: config.position, rotation: config.rotation }];
        const streetlightLightStride = Math.max(
          1,
          Math.ceil(instances.length / 12)
        );
        instances.forEach((instance, index) => {
          const instanceConfig = {
            ...config,
            position: instance.position,
            rotation: instance.rotation || config.rotation,
            scale: instance.scale || config.scale
          };
          const object = index === 0 ? model : model.clone(true);
          object.name = `${name}-${index + 1}`;
          configureModel(object, instanceConfig);
          scene.add(object);
          if (name === 'poste1') {
            addStreetlightEmitter(
              scene,
              object,
              index,
              streetlightLightStride
            );
          }
        });
      },
      error => console.error(`Não foi possível carregar o modelo ${name}:`, error)
    );
  });

  return { colliders, buildings: buildingRecords };
}

export { MODEL_CONFIG };

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
    position: { x: 174, y: 0, z: 85 },
    scale: { x: .007, y: .007, z: .007 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    instances: [
      { position: { x: 174, y: 0, z: 85 } },
      { position: { x: -230, y: 0, z: -30 } },
      { position: { x: -220, y: 0, z: 220 } },
      { position: { x: 80, y: 0, z: 315 } },
      { position: { x: 360, y: 0, z: 100 } }
    ],
    castShadow: false,
    collision: { enabled: false },
    alignGround: true
  },
  predio2: {
    file: 'modelo/cidade/predio2/chrysler_building_v1_L1.123c61b463a0-1adf-4cf0-9acf-5e8e8f908a80/13942_Chrysler_Building_V1_l1.obj',
    mtl: 'modelo/cidade/predio2/chrysler_building_v1_L1.123c61b463a0-1adf-4cf0-9acf-5e8e8f908a80/13942_Chrysler_Building_V1_l1.mtl',
    position: { x: 428, y: 0, z: 282 },
    scale: { x: .002, y: .002, z: .002 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    instances: [
      { position: { x: 428, y: 0, z: 282 } },
      { position: { x: 340, y: 0, z: 350 } },
      { position: { x: 210, y: 0, z: 400 } },
      { position: { x: -80, y: 0, z: 420 } },
      { position: { x: -250, y: 0, z: 150 } }
    ],
    castShadow: false,
    collision: { enabled: false },
    alignGround: true
  },
  predio3: {
    file: 'modelo/cidade/predio3/Massachussetshall.obj',
    mtl: 'modelo/cidade/predio3/Massachussetshall.mtl',
    position: { x: -193, y: 0, z: 251 },
    scale: { x: .22, y: .22, z: .22 },
    rotation: { x: 0, y: 0, z: 0 },
    instances: [
      { position: { x: -193, y: 0, z: 251 } },
      { position: { x: -150, y: 0, z: 360 } },
      { position: { x: 80, y: 0, z: 430 } },
      { position: { x: 300, y: 0, z: 260 } },
      { position: { x: 430, y: 0, z: 70 } }
    ],
    castShadow: false,
    collision: { enabled: false },
    alignGround: true
  },
  predio4: {
    file: 'modelo/cidade/predio4/Hospital_Building_V2_L3.123c3359fae7-7089-4dd3-993b-ce8739108426/10075_Hospital Building_V1_L3.obj',
    mtl: 'modelo/cidade/predio4/Hospital_Building_V2_L3.123c3359fae7-7089-4dd3-993b-ce8739108426/10075_Hospital Building_V1_L3.mtl',
    position: { x: 246, y: 0, z: -27 },
    scale: { x: .009, y: .009, z: .009 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    instances: [
      { position: { x: 246, y: 0, z: -27 } },
      { position: { x: 90, y: 0, z: -30 } },
      { position: { x: -100, y: 0, z: -27 } },
      { position: { x: -240, y: 0, z: 80 } },
      { position: { x: 450, y: 0, z: 40 } }
    ],
    castShadow: false,
    collision: { enabled: false },
    alignGround: true
  }
};

function createSidewalkStreetlights(trackSamples) {
  if (!trackSamples) return null;

  const roads = [
    { samples: trackSamples.start, width: 27, step: 18 },
    { samples: trackSamples.outer, width: 25, step: 22 },
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
    // Os modelos de cenário são grandes; receber sombras neles custa muitos
    // pixels por quadro e não muda a jogabilidade.
    object.receiveShadow = false;

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
        const sidewalkStreetlights =
          name === 'poste1'
            ? createSidewalkStreetlights(trackSamples)
            : null;
        const instances = sidewalkStreetlights || config.instances || [{ position: config.position, rotation: config.rotation }];
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
        });
      },
      error => console.error(`Não foi possível carregar o modelo ${name}:`, error)
    );
  });

  return { colliders };
}

export { MODEL_CONFIG };

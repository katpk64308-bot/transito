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
    position: { x: 170, y: 0, z: 80 },
    scale: { x: .007, y: .007, z: .007 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    castShadow: false,
    collision: { enabled: false },
    alignGround: true
  }
};

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
      material.side = THREE.DoubleSide;
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

export function createModels(scene) {
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
        const instances = config.instances || [{ position: config.position, rotation: config.rotation }];
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

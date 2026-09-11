// Configuração dos modelos do cenário.
// Para mover um modelo, altere position, scale e rotation.
const MODEL_CONFIG = {
  escola: {
    file: 'modelo/escola.fbx',
    position: { x: 100, y: 0, z: 200 },
    scale: { x: .15, y: .17, z: .15 },
    rotation: { x: 0, y: 60, z: 0 },
    castShadow: false,
    collision: {
      enabled: true,
      size: { x: 42, z: 24 },
      offset: { x: 0, z: 0 }
    }
  },
  evermontanha: {
    file: 'modelo/montanha.fbx',
    position: { x: 0, y: -10, z: 100 },
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 80, z: 0 },
    collision: {
      enabled: false,
      size: { x: 30, z: 25 },
      offset: { x: 0, z: 0 }
    }
  }
};

function configureModel(model, config) {
  model.position.set(config.position.x, config.position.y, config.position.z);
  model.scale.set(config.scale.x, config.scale.y, config.scale.z);
  model.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);

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
        model.name = name;
        configureModel(model, config);
        scene.add(model);
      },
      error => console.error(`Não foi possível carregar o modelo ${name}:`, error)
    );
  });

  return { colliders };
}

export { MODEL_CONFIG };

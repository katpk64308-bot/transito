import { state } from './state.js';

function createCar(color = 0xd93636) {
  const car = new THREE.Group();
  const bodyMaterial = new THREE.MeshLambertMaterial({ color });
  const darkMaterial = new THREE.MeshLambertMaterial({ color: 0x15171b });
  const glassMaterial = new THREE.MeshLambertMaterial({ color: 0x8ed1e8 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, .75, 4.8), bodyMaterial);
  body.position.y = .75;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.25, .75, 2.25), glassMaterial);
  cabin.position.set(0, 1.35, -.15);
  cabin.castShadow = true;
  car.add(cabin);

  const wheelGeometry = new THREE.CylinderGeometry(.48, .48, .28, 12);
  for (const x of [-1.48, 1.48]) {
    for (const z of [-1.45, 1.45]) {
      const wheel = new THREE.Mesh(wheelGeometry, darkMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, .48, z);
      car.add(wheel);
    }
  }

  return car;
}

function getRouteOffset(route, index, side) {
  const previousIndex = Math.max(0, Math.floor(index));
  const nextIndex = Math.min(route.length - 1, previousIndex + 1);
  const blend = index - previousIndex;
  const previous = route[previousIndex];
  const next = route[nextIndex];
  const centerX = previous.x + (next.x - previous.x) * blend;
  const centerZ = previous.z + (next.z - previous.z) * blend;
  const tangentX = next.x - previous.x;
  const tangentZ = next.z - previous.z;
  const length = Math.hypot(tangentX, tangentZ) || 1;
  return {
    x: centerX + (-tangentZ / length) * side,
    z: centerZ + (tangentX / length) * side,
    heading: Math.atan2(tangentX, tangentZ)
  };
}

export function createTrafficCar(scene, track) {
  const route = track.samples.outer;
  const colors = [0xd93636, 0x2764c7, 0xe0a51b, 0x2c9b62, 0x8a45ad, 0xe16d2f];
  const traffic = colors.map((color, carIndex) => {
    const car = createCar(color);
    scene.add(car);
    return { car, index: 8 + carIndex * 27, direction: carIndex % 2 === 0 ? 1 : -1 };
  });
  // Velocidade em unidades do mundo por segundo.
  const speed = 9;
  const laneWidth = 5;

  function update(dt) {
    traffic.forEach(vehicle => {
      const nextIndex = vehicle.index + vehicle.direction;
      if (nextIndex >= route.length - 2 || nextIndex <= 1) vehicle.direction *= -1;

    // Sem um avanço mínimo por frame: esse era o motivo do carro disparar
    // mesmo quando a velocidade configurada era baixa.
      const side = vehicle.direction > 0 ? laneWidth : -laneWidth;
      const point = getRouteOffset(route, vehicle.index, side);
      const heading = point.heading + (vehicle.direction < 0 ? Math.PI : 0);
      const forwardX = Math.sin(heading);
      const forwardZ = Math.cos(heading);
      const relativeX = state.x - point.x;
      const relativeZ = state.z - point.z;
      const distanceAhead = relativeX * forwardX + relativeZ * forwardZ;
      const distanceSide = Math.abs(relativeX * forwardZ - relativeZ * forwardX);
      const playerAhead = distanceAhead > 0 && distanceAhead < 15 && distanceSide < 4.5;
      const carAhead = traffic.some(other => {
        if (other === vehicle) return false;
        const otherRelativeX = other.car.position.x - point.x;
        const otherRelativeZ = other.car.position.z - point.z;
        const otherAhead = otherRelativeX * forwardX + otherRelativeZ * forwardZ;
        const otherSide = Math.abs(otherRelativeX * forwardZ - otherRelativeZ * forwardX);
        return otherAhead > 0 && otherAhead < 15 && otherSide < 4.5;
      });

      // Mantém uma distância segura: o carro fica parado enquanto a
      // bicicleta continuar ocupando o corredor à frente.
      if (!playerAhead && !carAhead) {
        vehicle.index += vehicle.direction * speed * dt / 2.5;
        vehicle.index = Math.max(1, Math.min(route.length - 2, vehicle.index));
      }

      const stoppedPoint = getRouteOffset(route, vehicle.index, side);
      vehicle.car.position.set(stoppedPoint.x, 0, stoppedPoint.z);
      vehicle.car.rotation.y = stoppedPoint.heading + (vehicle.direction < 0 ? Math.PI : 0);
    });
  }

  update(0);
  update.getHitboxes = () => traffic.map(vehicle => ({
    type: 'car',
    x: vehicle.car.position.x,
    z: vehicle.car.position.z,
    radius: 3.1
  }));
  return update;
}

function createFallbackTrain() {
  const train = new THREE.Group();
  const redMaterial = new THREE.MeshLambertMaterial({ color: 0x9e2525 });
  const redLightMaterial = new THREE.MeshLambertMaterial({ color: 0xc63b32 });
  const darkMaterial = new THREE.MeshLambertMaterial({ color: 0x202329 });
  const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x81c9dc });
  const metalMaterial = new THREE.MeshLambertMaterial({ color: 0x777b82 });
  // A bitola da via fica a 1.8 unidades do centro. O trem usa a mesma
  // medida para que as rodas fiquem visualmente apoiadas nos dois trilhos.
  const wheelGeometry = new THREE.CylinderGeometry(.68, .68, .38, 16);

  function addWheelPair(car, z) {
    for (const x of [-1.8, 1.8]) {
      const wheel = new THREE.Mesh(wheelGeometry, darkMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, .98, z);
      wheel.castShadow = true;
      car.add(wheel);
    }
  }

  const locomotive = new THREE.Group();
  const boiler = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.8, 6.1), redMaterial);
  boiler.position.y = 2.15;
  boiler.castShadow = true;
  locomotive.add(boiler);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.2, 2.5), darkMaterial);
  cabin.position.set(0, 3.0, -1.75);
  cabin.castShadow = true;
  locomotive.add(cabin);

  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(.68, .84, 2.8, 12), metalMaterial);
  chimney.position.set(0, 4.75, 1.55);
  chimney.castShadow = true;
  locomotive.add(chimney);
  addWheelPair(locomotive, -1.35);
  addWheelPair(locomotive, 1.35);
  locomotive.userData.distanceBehind = 0;
  train.add(locomotive);

  // Quatorze vagões, com um vão maior entre cada carroceria.
  for (let wagonIndex = 0; wagonIndex < 14; wagonIndex++) {
    const z = -7.8 - wagonIndex * 7.8;
    const wagonMaterial = wagonIndex % 2 === 0 ? redMaterial : redLightMaterial;
    const wagon = new THREE.Group();
    // Cada vagão tem chassi e carroceria próprios, com um pequeno espaço
    // visível entre eles para não parecer um único bloco/container.
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(6.2, .5, 5.3), darkMaterial);
    chassis.position.y = .68;
    chassis.castShadow = true;
    wagon.add(chassis);

    const body = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.4, 5.35), wagonMaterial);
    body.position.y = 2.35;
    body.castShadow = true;
    wagon.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(7.1, .36, 5.65), darkMaterial);
    roof.position.y = 4.15;
    roof.castShadow = true;
    wagon.add(roof);

    // Janelas dos dois lados, para diferenciar cada vagão da locomotiva.
    for (const x of [-3.43, 3.43]) {
      for (const zWindow of [-1.55, 0, 1.55]) {
        const window = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.12, .92), windowMaterial);
        window.position.set(x, 2.65, zWindow);
        window.castShadow = true;
        wagon.add(window);
      }
    }

    addWheelPair(wagon, -1.45);
    addWheelPair(wagon, 1.45);

    // Engates independentes: o vão entre as peças fica evidente nas curvas.
    const coupler = new THREE.Mesh(new THREE.BoxGeometry(.5, .28, .55), metalMaterial);
    coupler.position.set(0, .75, 2.95);
    coupler.castShadow = true;
    wagon.add(coupler);
    wagon.position.z = z;
    wagon.userData.distanceBehind = -z;
    train.add(wagon);
  }

  return train;
}

function createLegacyTrain() {
  const train = new THREE.Group();

  new THREE.FBXLoader().load(
    'modelo/trem.fbx',
    model => {
      const initialBox = new THREE.Box3().setFromObject(model);
      const initialSize = initialBox.getSize(new THREE.Vector3());
      const horizontalSize = Math.max(initialSize.x, initialSize.z) || 1;

      // Normaliza o tamanho do FBX para caber na bitola e nos vagões da rota.
      model.scale.setScalar(22 / horizontalSize);
      if (initialSize.x > initialSize.z) model.rotation.y = Math.PI / 2;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.y -= box.min.y;
      model.position.z -= center.z;

      model.traverse(object => {
        // Alguns FBX trazem luzes da cena original junto com o modelo.
        // Elas não devem alterar a iluminação do jogo inteiro.
        if (object.isLight) {
          object.visible = false;
          object.intensity = 0;
          return;
        }
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => {
          if (!material) return;
          material.side = THREE.DoubleSide;
          if (material.emissive) {
            material.emissive.set(0x000000);
            material.emissiveIntensity = 0;
          }
          material.needsUpdate = true;
        });
      });

      train.add(model);
    },
    undefined,
    error => {
      console.error('Não foi possível carregar o modelo modelo/trem.fbx:', error);
      train.add(createFallbackTrain());
    }
  );

  return train;
}

function prepareTrainModel(model, targetLength) {
  const initialBox = new THREE.Box3().setFromObject(model);
  const initialSize = initialBox.getSize(new THREE.Vector3());
  const horizontalSize = Math.max(initialSize.x, initialSize.z) || 1;

  model.scale.setScalar(targetLength / horizontalSize);
  if (initialSize.x > initialSize.z) model.rotation.y = Math.PI / 2;

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.y -= box.min.y;
  model.position.z -= center.z;

  model.traverse(object => {
    if (object.isLight) {
      object.visible = false;
      object.intensity = 0;
      return;
    }
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => {
      if (!material) return;
      material.side = THREE.DoubleSide;
      if (material.emissive) {
        material.emissive.set(0x000000);
        material.emissiveIntensity = 0;
      }
      material.needsUpdate = true;
    });
  });

  return model;
}

function createTrain() {
  const train = new THREE.Group();
  train.userData.parts = [];

  // O arquivo trem.fbx não faz mais parte do projeto. Mantemos um modelo 3D
  // completo feito com geometrias do Three.js e o registramos como parte móvel
  // desde o início (antes ele era adicionado fora de userData.parts e ficava
  // parado na origem).
  const model = createFallbackTrain();
  // Cada carro vira uma parte independente. Assim, em uma curva, cada
  // vagão calcula seu próprio ponto e sua própria rotação sobre os trilhos.
  model.children.slice().forEach(part => {
    const distanceBehind = part.userData.distanceBehind || 0;
    part.position.set(0, 0, 0);
    part.userData.distanceBehind = distanceBehind;
    train.userData.parts.push({ model: part, distanceBehind });
    train.add(part);
  });

  return train;
}

function getLoopPoint(route, index) {
  const last = route.length - 1;
  const baseIndex = Math.floor(index) % last;
  const nextIndex = (baseIndex + 1) % last;
  const blend = index - Math.floor(index);
  const current = route[baseIndex];
  const next = route[nextIndex];
  const tangentX = next.x - current.x;
  const tangentZ = next.z - current.z;
  return {
    x: current.x + (next.x - current.x) * blend,
    z: current.z + (next.z - current.z) * blend,
    heading: Math.atan2(tangentX, tangentZ)
  };
}

export function createTrafficTrain(scene, track) {
  const route = track.samples.train;
  const train = createTrain();
  scene.add(train);

  const routeLength = route.length - 1;
  let averageSegmentLength = 0;
  for (let i = 0; i < routeLength; i++) {
    averageSegmentLength += route[i].distanceTo(route[i + 1]);
  }
  averageSegmentLength /= routeLength;

  let index = routeLength * .2;
  const speed = 22;

  function update(dt) {
    index = (index + speed * dt / averageSegmentLength) % routeLength;

    // Cada trem encontra o próprio ponto da curva. Assim, nas curvas,
    // nenhum deles corta caminho ou sai dos trilhos.
    train.userData.parts.forEach(part => {
      const partIndex = (index - part.distanceBehind / averageSegmentLength + routeLength) % routeLength;
      const point = getLoopPoint(route, partIndex);
      // y=.02 deixa as rodas sobre os trilhos, sem afundar no terreno.
      part.model.position.set(point.x, .02, point.z);
      part.model.rotation.y = point.heading;
    });
  }

  update(0);
  update.getHitboxes = () => train.userData.parts.map(part => ({
    type: 'train',
    x: part.model.position.x,
    z: part.model.position.z,
    radius: 4.3
  }));
  return update;
}

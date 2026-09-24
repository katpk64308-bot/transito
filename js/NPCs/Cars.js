import { state } from '../state.js';
import { isRedRailwaySignalAhead } from './semaforo.js';
import { registerNightLight } from '../scene.js';

/* ------------------------------------------------------------------ */
/*  MODELOS 3D (GLB)                                                   */
/* ------------------------------------------------------------------ */

// true  = converte os materiais para MeshLambertMaterial (leve, combina com
//         o resto do jogo e não fica escuro sem envMap).
// false = mantém os materiais PBR originais (mais bonito, mas precisa de
//         boa iluminação/envMap; aqui a metalicidade é limitada).
const USE_LAMBERT = true;

// Multiplicador do tamanho dos carros (1 = tamanho original).
// Ajuste aqui para deixá-los maiores ou menores.
const CAR_SCALE = 1.5;

// Distância (em unidades do mundo) a partir da qual o carro freia
// por causa de outro carro/jogador à frente.
const LOOK_AHEAD = 20;

// Espaçamento (em unidades) dos pontos da rota suavizada.
const PATH_STEP = 1;

/*
  length     -> comprimento final do carro no jogo (unidades do mundo)
  rotationY  -> giro para a FRENTE do modelo apontar para +Z
  paint      -> regex do nome do material da pintura (recebe cor aleatória).
                Só use em materiais sem textura de pintura.
*/
const CAR_MODELS = [
  {
    file: 'modelo/model-car/porsche_gt3_rs.glb',
    length: 4.8,
    rotationY: 0,
    paint: /carPaint\.003$/i
  },
  {
    file: 'modelo/model-car/lb-works_ferrari_f40__www.vecarz.com.glb',
    length: 4.7,
    rotationY: 0,
    paint: null // pintura tem textura: mantém o vermelho original
  },
  {
    file: 'modelo/model-car/lamborghini_aventador.glb',
    length: 4.9,
    rotationY: 0,
    paint: null // textura única: mantém a cor original
  },
  {
    file: 'modelo/model-car/low_poly_fiat_uno.glb',
    length: 4.0,
    rotationY: Math.PI / 2, // modelo original olha para -X
    paint: /^carro$/i
  }
];

const templateCache = new Map(); // arquivo -> Promise<template | null>
const materialCache = new Map(); // chave   -> material convertido
let gltfLoader = null;

function getLoader() {
  if (!gltfLoader && THREE.GLTFLoader) {
    gltfLoader = new THREE.GLTFLoader();
  }

  return gltfLoader;
}

function loadTemplate(config) {
  if (templateCache.has(config.file)) {
    return templateCache.get(config.file);
  }

  const promise = new Promise(resolve => {
    const loader = getLoader();

    if (!loader) {
      console.warn(
        'THREE.GLTFLoader não encontrado; usando carros de caixa.'
      );
      resolve(null);
      return;
    }

    // config.file já é o caminho completo a partir do HTML.
    // encodeURI (e não encodeURIComponent) preserva as barras "/".
    const url = encodeURI(config.file);

    loader.load(
      url,
      gltf => {
        // holder: aplica a rotação para a frente apontar para +Z
        const holder = new THREE.Group();
        gltf.scene.rotation.y = config.rotationY || 0;
        holder.add(gltf.scene);
        holder.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(holder);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const scale = (config.length * CAR_SCALE) / size.z;

        resolve({
          holder,
          scale,
          // centraliza em X/Z e apoia as rodas em y = 0
          offset: new THREE.Vector3(
            -center.x * scale,
            -box.min.y * scale,
            -center.z * scale
          ),
          width: size.x * scale,
          length: size.z * scale
        });
      },
      undefined,
      error => {
        console.warn(
          `[Cars.js] Falha ao carregar ${url} (confira o nome/caminho do arquivo):`,
          error
        );
        resolve(null);
      }
    );
  });

  templateCache.set(config.file, promise);

  return promise;
}

function isGlass(material) {
  return (
    material.transmission > 0 ||
    (/glass|window|windshield/i.test(material.name || '') &&
      !/light/i.test(material.name || ''))
  );
}

function convertMaterial(source, config, paintColor) {
  const isPaint =
    config.paint && config.paint.test(source.name || '');

  const key = `${source.uuid}|${isPaint ? paintColor : ''}`;

  if (materialCache.has(key)) {
    return materialCache.get(key);
  }

  let material;

  if (USE_LAMBERT) {
    material = new THREE.MeshLambertMaterial({
      color: source.color
        ? source.color.clone()
        : new THREE.Color(0xffffff),
      map: source.map || null,
      emissive: source.emissive
        ? source.emissive.clone()
        : new THREE.Color(0x000000),
      emissiveMap: source.emissiveMap || null,
      emissiveIntensity: source.emissiveIntensity ?? 1,
      transparent: source.transparent,
      opacity: source.opacity,
      alphaTest: source.alphaTest,
      vertexColors: source.vertexColors,
      side: source.side
    });
  } else {
    material = source.clone();

    if (material.metalness !== undefined) {
      material.metalness = Math.min(material.metalness, 0.4);
    }

    if (material.roughness !== undefined) {
      material.roughness = Math.max(material.roughness, 0.35);
    }
  }

  if (isPaint) {
    material.color.set(paintColor);
  }

  if (isGlass(source)) {
    material.color.set(0x1d2b36);
    material.transparent = true;
    material.opacity = 0.6;
    material.depthWrite = false;
  }

  materialCache.set(key, material);

  return material;
}

function instantiateModel(template, config, paintColor) {
  const model = template.holder.clone(true);

  model.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;

      object.material = Array.isArray(object.material)
        ? object.material.map(m =>
            convertMaterial(m, config, paintColor)
          )
        : convertMaterial(object.material, config, paintColor);
    }
  });

  const fit = new THREE.Group();
  fit.scale.setScalar(template.scale);
  fit.position.copy(template.offset);
  fit.add(model);

  return fit;
}

// Sorteia em "sacola embaralhada": totalmente aleatório, mas só repete
// um modelo depois de todos já terem aparecido (mais variedade na pista).
// Se preferir sorteio puro, troque o corpo por:
//   return CAR_MODELS[Math.floor(Math.random() * CAR_MODELS.length)];
function createModelPicker() {
  let bag = [];

  return function pickModel() {
    if (bag.length === 0) {
      bag = [...CAR_MODELS];

      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }

    return bag.pop();
  };
}

/* ------------------------------------------------------------------ */
/*  CARRO DE CAIXAS (fallback se o GLB não carregar)                   */
/* ------------------------------------------------------------------ */

function createCar(color = 0xd93636) {
  const car = new THREE.Group();

  const bodyMaterial = new THREE.MeshLambertMaterial({ color });
  const darkMaterial = new THREE.MeshLambertMaterial({
    color: 0x15171b
  });
  const glassMaterial = new THREE.MeshLambertMaterial({
    color: 0x8ed1e8
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.75, 4.8),
    bodyMaterial
  );

  body.position.y = 0.75;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 0.75, 2.25),
    glassMaterial
  );

  cabin.position.set(0, 1.35, -0.15);
  cabin.castShadow = true;
  car.add(cabin);

  const wheelGeometry = new THREE.CylinderGeometry(
    0.48,
    0.48,
    0.28,
    12
  );

  for (const x of [-1.48, 1.48]) {
    for (const z of [-1.45, 1.45]) {
      const wheel = new THREE.Mesh(
        wheelGeometry,
        darkMaterial
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.48, z);
      car.add(wheel);
    }
  }

  return car;
}

/* ------------------------------------------------------------------ */
/*  TRÁFEGO                                                            */
/* ------------------------------------------------------------------ */

// Reamostra a rota numa curva suave com pontos igualmente espaçados
// (por distância) e tangentes contínuas. Isso elimina os "soquinhos"
// nas curvas: antes a direção mudava de uma vez a cada ponto da rota.
function buildSmoothPath(route) {
  const curve = new THREE.CatmullRomCurve3(
    route.map(point => new THREE.Vector3(point.x, 0, point.z)),
    false,
    'catmullrom',
    0.5
  );

  curve.arcLengthDivisions = 2000;
  curve.updateArcLengths();

  const length = curve.getLength();
  const count = Math.max(2, Math.round(length / PATH_STEP));
  const points = [];

  for (let i = 0; i <= count; i++) {
    const u = i / count;
    const position = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u);

    points.push({
      x: position.x,
      z: position.z,
      tx: tangent.x,
      tz: tangent.z
    });
  }

  return { points, length, step: length / count };
}

function getRouteOffset(route, index, side) {
  const previousIndex = Math.max(
    0,
    Math.min(route.length - 2, Math.floor(index))
  );

  const blend = Math.max(
    0,
    Math.min(1, index - previousIndex)
  );

  const previous = route[previousIndex];
  const next = route[previousIndex + 1];

  const centerX =
    previous.x + (next.x - previous.x) * blend;

  const centerZ =
    previous.z + (next.z - previous.z) * blend;

  // tangente interpolada e normalizada (contínua ao longo da curva)
  let tangentX =
    previous.tx + (next.tx - previous.tx) * blend;

  let tangentZ =
    previous.tz + (next.tz - previous.tz) * blend;

  const length =
    Math.hypot(tangentX, tangentZ) || 1;

  tangentX /= length;
  tangentZ /= length;

  return {
    x: centerX + -tangentZ * side,
    z: centerZ + tangentX * side,
    heading: Math.atan2(tangentX, tangentZ)
  };
}

function lerpAngle(current, target, amount) {
  let difference = target - current;

  difference =
    ((difference + Math.PI) %
      (Math.PI * 2)) -
    Math.PI;

  return current + difference * amount;
}

function addCarNightLights(scene, car) {
  [-0.62, 0.62].forEach(x => {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 10, 8),
      new THREE.MeshBasicMaterial({
        color: 0xfff0c4,
        transparent: true,
        opacity: 1
      })
    );
    glow.position.set(x, 0.82, 2.05);
    car.add(glow);

    const light = new THREE.SpotLight(
      0xffedc4,
      48,
      52,
      Math.PI / 7,
      0.55,
      1.4
    );
    light.position.set(x, 0.82, 2.05);

    const target = new THREE.Object3D();
    target.position.set(x, 0.35, 28);
    car.add(light, target);
    light.target = target;
    registerNightLight(scene, light, glow);
  });
}

export function createTrafficCar(
  scene,
  track,
  getTrainHitboxes = () => [],
  getRailwaySignalStates = () => []
) {
  const sourceRoute = track.samples.outer;
  const path = buildSmoothPath(sourceRoute);
  const route = path.points;

  // quantas unidades do mundo valia cada ponto da rota original
  const unitsPerSample =
    path.length / (sourceRoute.length - 1);

  // fator para converter "pontos originais" em pontos da rota suave
  const sampleToIndex = unitsPerSample / path.step;

  // margem nas pontas da rota (onde o carro dá meia-volta)
  const endMargin = Math.max(1, Math.round(sampleToIndex));

  const colors = [
    0xd93636,
    0x2764c7,
    0xe0a51b,
    0x2c9b62,
    0x8a45ad,
    0xe16d2f
  ];

  const pickModel = createModelPicker();

  const traffic = colors.map((color, carIndex) => {
    // O grupo já entra na cena; o modelo é encaixado quando carregar.
    const car = new THREE.Group();

    scene.add(car);
    addCarNightLights(scene, car);

    const vehicle = {
      car,
      index: (8 + carIndex * 27) * sampleToIndex,
      direction: carIndex % 2 === 0 ? 1 : -1,
      heading: null,
      motionSpeed: 0,
      lean: 0,
      ready: false,
      halfWidth: 1.62,
      halfLength: 2.4,
      radius: 3.1
    };

    const config = pickModel();

    loadTemplate(config).then(template => {
      if (template) {
        car.add(instantiateModel(template, config, color));

        // hitbox acompanha o tamanho real do modelo (+ folga)
        vehicle.halfWidth = template.width / 2 + 0.25;
        vehicle.halfLength = template.length / 2 + 0.25;
        vehicle.radius =
          Math.hypot(vehicle.halfWidth, vehicle.halfLength) +
          0.2;
      } else {
        const box = createCar(color);
        box.scale.setScalar(CAR_SCALE);
        car.add(box);

        vehicle.halfWidth *= CAR_SCALE;
        vehicle.halfLength *= CAR_SCALE;
        vehicle.radius *= CAR_SCALE;
      }

      vehicle.ready = true;
    });

    return vehicle;
  });

  const speed = 9;
  const cruiseSpeed = (speed / 2.5) * sampleToIndex;
  const laneWidth = 5;

  function update(dt) {
    traffic.forEach(vehicle => {
      const nextIndex =
        vehicle.index + vehicle.direction;

      if (
        nextIndex >= route.length - 1 - endMargin ||
        nextIndex <= endMargin
      ) {
        vehicle.direction *= -1;
      }

      const side =
        vehicle.direction > 0
          ? laneWidth
          : -laneWidth;

      const point = getRouteOffset(
        route,
        vehicle.index,
        side
      );

      const desiredHeading =
        point.heading +
        (vehicle.direction < 0
          ? Math.PI
          : 0);

      if (vehicle.heading === null) {
        vehicle.heading = desiredHeading;
      }

      vehicle.heading = lerpAngle(
        vehicle.heading,
        desiredHeading,
        1 - Math.exp(-dt * 8)
      );

      const heading = vehicle.heading;

      const forwardX = Math.sin(heading);
      const forwardZ = Math.cos(heading);

      const relativeX =
        state.x - point.x;

      const relativeZ =
        state.z - point.z;

      const distanceAhead =
        relativeX * forwardX +
        relativeZ * forwardZ;

      const distanceSide =
        Math.abs(
          relativeX * forwardZ -
          relativeZ * forwardX
        );

      const playerAhead =
        distanceAhead > 0 &&
        distanceAhead < LOOK_AHEAD &&
        distanceSide < 4.5;

      const carAhead = traffic.some(other => {
        if (other === vehicle) {
          return false;
        }

        const otherRelativeX =
          other.car.position.x - point.x;

        const otherRelativeZ =
          other.car.position.z - point.z;

        const otherAhead =
          otherRelativeX * forwardX +
          otherRelativeZ * forwardZ;

        const otherSide =
          Math.abs(
            otherRelativeX * forwardZ -
            otherRelativeZ * forwardX
          );

        return (
          otherAhead > 0 &&
          otherAhead < LOOK_AHEAD &&
          otherSide < 4.5
        );
      });

      const trainAhead =
        getTrainHitboxes().some(trainPart => {
          const trainRelativeX =
            trainPart.x - point.x;

          const trainRelativeZ =
            trainPart.z - point.z;

          const trainAheadDistance =
            trainRelativeX * forwardX +
            trainRelativeZ * forwardZ;

          const trainSideDistance =
            Math.abs(
              trainRelativeX * forwardZ -
              trainRelativeZ * forwardX
            );

          return (
            trainAheadDistance > -6 &&
            trainAheadDistance < 32 &&
            trainSideDistance < 11
          );
        });

      const redRailwaySignal =
        isRedRailwaySignalAhead(
          getRailwaySignalStates(),
          point,
          forwardX,
          forwardZ
        );

      const shouldStop =
        playerAhead ||
        carAhead ||
        trainAhead ||
        redRailwaySignal;

      const targetSpeed =
        shouldStop ? 0 : cruiseSpeed;

      const speedChange =
        targetSpeed < vehicle.motionSpeed
          ? 7
          : 3.5;

      vehicle.motionSpeed +=
        (targetSpeed - vehicle.motionSpeed) *
        Math.min(1, dt * speedChange);

      vehicle.index +=
        vehicle.direction *
        vehicle.motionSpeed *
        dt;

      vehicle.index = Math.max(
        endMargin,
        Math.min(
          route.length - 1 - endMargin,
          vehicle.index
        )
      );

      const stoppedPoint =
        getRouteOffset(
          route,
          vehicle.index,
          side
        );

      vehicle.car.position.set(
        stoppedPoint.x,
        0,
        stoppedPoint.z
      );

      const turnAmount =
        (
          (desiredHeading -
            vehicle.heading +
            Math.PI) %
            (Math.PI * 2)
        ) -
        Math.PI;

      const targetLean =
        Math.max(
          -0.1,
          Math.min(
            0.1,
            turnAmount * 1.8
          )
        );

      vehicle.lean +=
        (targetLean - vehicle.lean) *
        Math.min(1, dt * 6);

      vehicle.car.rotation.y =
        vehicle.heading;

      vehicle.car.rotation.z =
        vehicle.lean;
    });
  }

  update(0);

  update.getHitboxes = () =>
    traffic
      .filter(vehicle => vehicle.ready)
      .map(vehicle => ({
        type: 'car',
        x: vehicle.car.position.x,
        z: vehicle.car.position.z,
        heading: vehicle.car.rotation.y,
        halfWidth: vehicle.halfWidth,
        halfLength: vehicle.halfLength,
        radius: vehicle.radius
      }));

  return update;
}
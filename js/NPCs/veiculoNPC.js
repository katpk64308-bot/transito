import { state } from '../state.js';

function createCar(color = 0xd93636) {
  const car = new THREE.Group();
  const bodyMaterial = new THREE.MeshLambertMaterial({ color });
  const darkMaterial = new THREE.MeshLambertMaterial({ color: 0x15171b });
  const glassMaterial = new THREE.MeshLambertMaterial({ color: 0x8ed1e8 });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, .75, 4.8),
    bodyMaterial
  );

  body.position.y = .75;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, .75, 2.25),
    glassMaterial
  );

  cabin.position.set(0, 1.35, -.15);
  cabin.castShadow = true;
  car.add(cabin);

  const wheelGeometry = new THREE.CylinderGeometry(.48, .48, .28, 12);

  for (const x of [-1.48, 1.48]) {
    for (const z of [-1.45, 1.45]) {
      const wheel = new THREE.Mesh(
        wheelGeometry,
        darkMaterial
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, .48, z);
      car.add(wheel);
    }
  }

  return car;
}

function getRouteOffset(route, index, side) {
  const previousIndex = Math.max(0, Math.floor(index));
  const nextIndex = Math.min(
    route.length - 1,
    previousIndex + 1
  );

  const blend = index - previousIndex;

  const previous = route[previousIndex];
  const next = route[nextIndex];

  const centerX =
    previous.x +
    (next.x - previous.x) * blend;

  const centerZ =
    previous.z +
    (next.z - previous.z) * blend;

  const tangentX = next.x - previous.x;
  const tangentZ = next.z - previous.z;

  const length =
    Math.hypot(tangentX, tangentZ) || 1;

  return {
    x: centerX + (-tangentZ / length) * side,
    z: centerZ + (tangentX / length) * side,
    heading: Math.atan2(tangentX, tangentZ)
  };
}

function lerpAngle(current, target, amount) {
  let difference = target - current;

  difference =
    ((difference + Math.PI) % (Math.PI * 2)) -
    Math.PI;

  return current + difference * amount;
}

export function createTrafficCar(
  scene,
  track,
  getTrainHitboxes = () => [],
  getRailwaySignalStates = () => []
) {
  const route = track.samples.outer;

  const colors = [
    0xd93636,
    0x2764c7,
    0xe0a51b,
    0x2c9b62,
    0x8a45ad,
    0xe16d2f
  ];

  const traffic = colors.map((color, carIndex) => {
    const car = createCar(color);

    scene.add(car);

    return {
      car,
      index: 8 + carIndex * 27,
      direction: carIndex % 2 === 0 ? 1 : -1,
      heading: null,
      motionSpeed: 0,
      lean: 0
    };
  });

  const speed = 9;
  const laneWidth = 5;

  function update(dt) {
    traffic.forEach(vehicle => {
      const nextIndex =
        vehicle.index + vehicle.direction;

      if (
        nextIndex >= route.length - 2 ||
        nextIndex <= 1
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
        (vehicle.direction < 0 ? Math.PI : 0);

      if (vehicle.heading === null) {
        vehicle.heading = desiredHeading;
      }

      vehicle.heading = lerpAngle(
        vehicle.heading,
        desiredHeading,
        Math.min(1, dt * 7)
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
        distanceAhead < 15 &&
        distanceSide < 4.5;

      const carAhead = traffic.some(other => {
        if (other === vehicle) return false;

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
          otherAhead < 15 &&
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
        getRailwaySignalStates().some(signal => {
          if (!signal.red) return false;

          const signalRelativeX =
            signal.x - point.x;

          const signalRelativeZ =
            signal.z - point.z;

          const signalAhead =
            signalRelativeX * forwardX +
            signalRelativeZ * forwardZ;

          const signalSide =
            Math.abs(
              signalRelativeX * forwardZ -
              signalRelativeZ * forwardX
            );

          return (
            signalAhead > -4 &&
            signalAhead < 48 &&
            signalSide < 13
          );
        });

      const shouldStop =
        playerAhead ||
        carAhead ||
        trainAhead ||
        redRailwaySignal;

      const targetSpeed =
        shouldStop ? 0 : speed / 2.5;

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
        1,
        Math.min(
          route.length - 2,
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
          -.1,
          Math.min(.1, turnAmount * 1.8)
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
    traffic.map(vehicle => ({
      type: 'car',
      x: vehicle.car.position.x,
      z: vehicle.car.position.z,
      heading: vehicle.car.rotation.y,
      halfWidth: 1.62,
      halfLength: 2.4,
      radius: 3.1
    }));

  return update;
}

function createFallbackTrain() {
  const train = new THREE.Group();

  const redMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x9e2525
    });

  const redLightMaterial =
    new THREE.MeshLambertMaterial({
      color: 0xc63b32
    });

  const darkMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x202329
    });

  const windowMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x81c9dc
    });

  const metalMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x777b82
    });

  const wheelGeometry =
    new THREE.CylinderGeometry(
      .68,
      .68,
      .38,
      16
    );

  function addWheelPair(car, z) {
    for (const x of [-1.8, 1.8]) {
      const wheel = new THREE.Mesh(
        wheelGeometry,
        darkMaterial
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, .98, z);
      wheel.castShadow = true;

      car.add(wheel);
    }
  }

  const locomotive = new THREE.Group();

  const boiler = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 2.8, 6.1),
    redMaterial
  );

  boiler.position.y = 2.15;
  boiler.castShadow = true;
  locomotive.add(boiler);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 4.2, 2.5),
    darkMaterial
  );

  cabin.position.set(
    0,
    3.0,
    -1.75
  );

  cabin.castShadow = true;
  locomotive.add(cabin);

  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(
      .68,
      .84,
      2.8,
      12
    ),
    metalMaterial
  );

  chimney.position.set(
    0,
    4.75,
    1.55
  );

  chimney.castShadow = true;
  locomotive.add(chimney);

  addWheelPair(locomotive, -1.35);
  addWheelPair(locomotive, 1.35);

  locomotive.userData.distanceBehind = 0;

  train.add(locomotive);

  for (
    let wagonIndex = 0;
    wagonIndex < 14;
    wagonIndex++
  ) {
    const z =
      -7.8 -
      wagonIndex * 7.8;

    const wagonMaterial =
      wagonIndex % 2 === 0
        ? redMaterial
        : redLightMaterial;

    const wagon = new THREE.Group();

    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(
        6.2,
        .5,
        5.3
      ),
      darkMaterial
    );

    chassis.position.y = .68;
    chassis.castShadow = true;
    wagon.add(chassis);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(
        6.8,
        3.4,
        5.35
      ),
      wagonMaterial
    );

    body.position.y = 2.35;
    body.castShadow = true;
    wagon.add(body);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(
        7.1,
        .36,
        5.65
      ),
      darkMaterial
    );

    roof.position.y = 4.15;
    roof.castShadow = true;
    wagon.add(roof);

    for (const x of [-3.43, 3.43]) {
      for (
        const zWindow of [-1.55, 0, 1.55]
      ) {
        const window = new THREE.Mesh(
          new THREE.BoxGeometry(
            .08,
            1.12,
            .92
          ),
          windowMaterial
        );

        window.position.set(
          x,
          2.65,
          zWindow
        );

        window.castShadow = true;
        wagon.add(window);
      }
    }

    addWheelPair(wagon, -1.45);
    addWheelPair(wagon, 1.45);

    const coupler = new THREE.Mesh(
      new THREE.BoxGeometry(
        .5,
        .28,
        .55
      ),
      metalMaterial
    );

    coupler.position.set(
      0,
      .75,
      2.95
    );

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
      const initialBox =
        new THREE.Box3().setFromObject(model);

      const initialSize =
        initialBox.getSize(
          new THREE.Vector3()
        );

      const horizontalSize =
        Math.max(
          initialSize.x,
          initialSize.z
        ) || 1;

      model.scale.setScalar(
        22 / horizontalSize
      );

      if (
        initialSize.x >
        initialSize.z
      ) {
        model.rotation.y =
          Math.PI / 2;
      }

      const box =
        new THREE.Box3().setFromObject(model);

      const center =
        box.getCenter(
          new THREE.Vector3()
        );

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

        const materials =
          Array.isArray(object.material)
            ? object.material
            : [object.material];

        materials.forEach(material => {
          if (!material) return;

          material.side =
            THREE.DoubleSide;

          if (material.emissive) {
            material.emissive.set(
              0x000000
            );

            material.emissiveIntensity = 0;
          }

          material.needsUpdate = true;
        });
      });

      train.add(model);
    },
    undefined,
    error => {
      console.error(
        'Não foi possível carregar o modelo modelo/trem.fbx:',
        error
      );

      train.add(
        createFallbackTrain()
      );
    }
  );

  return train;
}

function prepareTrainModel(
  model,
  targetLength
) {
  const initialBox =
    new THREE.Box3().setFromObject(model);

  const initialSize =
    initialBox.getSize(
      new THREE.Vector3()
    );

  const horizontalSize =
    Math.max(
      initialSize.x,
      initialSize.z
    ) || 1;

  model.scale.setScalar(
    targetLength / horizontalSize
  );

  if (
    initialSize.x >
    initialSize.z
  ) {
    model.rotation.y =
      Math.PI / 2;
  }

  const box =
    new THREE.Box3().setFromObject(model);

  const center =
    box.getCenter(
      new THREE.Vector3()
    );

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

    const materials =
      Array.isArray(object.material)
        ? object.material
        : [object.material];

    materials.forEach(material => {
      if (!material) return;

      material.side =
        THREE.DoubleSide;

      if (material.emissive) {
        material.emissive.set(
          0x000000
        );

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

  const model =
    createFallbackTrain();

  model.children
    .slice()
    .forEach(part => {
      const distanceBehind =
        part.userData.distanceBehind || 0;

      part.position.set(0, 0, 0);

      part.userData.distanceBehind =
        distanceBehind;

      train.userData.parts.push({
        model: part,
        distanceBehind
      });

      train.add(part);
    });

  return train;
}

function getLoopPoint(
  route,
  index
) {
  const last =
    route.length - 1;

  const baseIndex =
    Math.floor(index) % last;

  const nextIndex =
    (baseIndex + 1) % last;

  const blend =
    index - Math.floor(index);

  const current =
    route[baseIndex];

  const next =
    route[nextIndex];

  const tangentX =
    next.x - current.x;

  const tangentZ =
    next.z - current.z;

  return {
    x:
      current.x +
      (next.x - current.x) *
      blend,

    z:
      current.z +
      (next.z - current.z) *
      blend,

    heading:
      Math.atan2(
        tangentX,
        tangentZ
      )
  };
}

export function createTrafficTrain(
  scene,
  track
) {
  const route =
    track.samples.train;

  const train =
    createTrain();

  scene.add(train);

  const routeLength =
    route.length - 1;

  let averageSegmentLength = 0;

  for (
    let i = 0;
    i < routeLength;
    i++
  ) {
    averageSegmentLength +=
      route[i].distanceTo(
        route[i + 1]
      );
  }

  averageSegmentLength /=
    routeLength;

  let index =
    routeLength * .2;

  const speed = 22;

  function update(dt) {
    index =
      (
        index +
        speed * dt /
        averageSegmentLength
      ) % routeLength;

    train.userData.parts.forEach(
      part => {
        const partIndex =
          (
            index -
            part.distanceBehind /
              averageSegmentLength +
            routeLength
          ) % routeLength;

        const point =
          getLoopPoint(
            route,
            partIndex
          );

        part.model.position.set(
          point.x,
          .02,
          point.z
        );

        part.model.rotation.y =
          point.heading;
      }
    );
  }

  update(0);

  update.getHitboxes = () =>
    train.userData.parts.map(
      part => ({
        type: 'train',
        x: part.model.position.x,
        z: part.model.position.z,
        radius: 4.3
      })
    );

  update.getSignalState = () => ({
    index,
    routeLength,
    averageSegmentLength,
    speed
  });

  update.getMinimapState = () => {
    const locomotive =
      train.userData.parts[0].model;

    return {
      x: locomotive.position.x,
      z: locomotive.position.z,
      heading: locomotive.rotation.y
    };
  };

  return update;
}

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

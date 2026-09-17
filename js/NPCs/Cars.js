import { state } from '../state.js';
import { isRedRailwaySignalAhead } from './semaforo.js';

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

function getRouteOffset(route, index, side) {
  const previousIndex = Math.max(
    0,
    Math.floor(index)
  );

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
    ((difference + Math.PI) %
      (Math.PI * 2)) -
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
        (vehicle.direction < 0
          ? Math.PI
          : 0);

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
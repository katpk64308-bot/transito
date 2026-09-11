function createCar() {
  const car = new THREE.Group();
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xd93636 });
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
  const car = createCar();
  scene.add(car);

  let index = 8;
  let direction = 1;
  // Velocidade em unidades do mundo por segundo.
  const speed = 4;
  const laneWidth = 5;

  function update(dt) {
    const nextIndex = index + direction;
    if (nextIndex >= route.length - 2 || nextIndex <= 1) direction *= -1;

    // Sem um avanço mínimo por frame: esse era o motivo do carro disparar
    // mesmo quando a velocidade configurada era baixa.
    index += direction * speed * dt / 2.5;
    index = Math.max(1, Math.min(route.length - 2, index));
    const side = direction > 0 ? laneWidth : -laneWidth;
    const point = getRouteOffset(route, index, side);
    car.position.set(point.x, 0, point.z);
    car.rotation.y = point.heading + (direction < 0 ? Math.PI : 0);
  }

  update(0);
  return update;
}

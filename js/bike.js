export function buildBike() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xd4291f });
  const darkMaterial = new THREE.MeshLambertMaterial({ color: 0x1b1b1b });
  const metalMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });

  function addMesh(geometry, material, position, castShadow = true) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = castShadow;
    group.add(mesh);
    return mesh;
  }

  addMesh(new THREE.BoxGeometry(.65, .6, 2.1), bodyMaterial, [0, .75, 0]);
  addMesh(new THREE.BoxGeometry(.5, .22, .9), darkMaterial, [0, 1.05, -.35]);
  addMesh(new THREE.BoxGeometry(.55, .4, .7), bodyMaterial, [0, 1.02, .35]);

  function createWheel(z) {
    const wheel = addMesh(new THREE.CylinderGeometry(.42, .42, .32, 20), darkMaterial, [0, .42, z]);
    wheel.rotation.z = Math.PI / 2;
    return wheel;
  }

  const wheelFront = createWheel(1.05);
  const wheelBack = createWheel(-1);
  const fork = addMesh(new THREE.CylinderGeometry(.05, .05, .9, 8), metalMaterial, [0, .85, 1.05]);
  fork.rotation.x = .35;
  addMesh(new THREE.BoxGeometry(.85, .06, .1), metalMaterial, [0, 1.28, 1.15]);
  addMesh(new THREE.SphereGeometry(.12, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfff6cc }), [0, .95, 1.35], false);

  const exhaust = addMesh(new THREE.CylinderGeometry(.08, .1, .9, 10), metalMaterial, [.28, .5, -.75]);
  exhaust.rotation.z = Math.PI / 2;

  const rider = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(.4, .6, .35), new THREE.MeshLambertMaterial({ color: 0x2255aa }));
  torso.position.set(0, 1.45, -.15);
  torso.rotation.x = .25;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.24, 14, 14), new THREE.MeshLambertMaterial({ color: 0x191919 }));
  helmet.position.set(0, 1.9, .05);
  rider.add(torso, helmet);
  group.add(rider);

  return { group, wheelFront, wheelBack };
}

export function createScene() {
  const canvas = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fc7e8);
  scene.fog = new THREE.Fog(0x8fc7e8, 140, 420);
  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .1, 1000);

  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }

  addEventListener('resize', resize);
  resize();
  scene.add(new THREE.AmbientLight(0xffffff, .55));

  const sun = new THREE.DirectionalLight(0xfff2d6, 1.05);
  sun.position.set(-60, 110, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -160;
  sun.shadow.camera.right = 160;
  sun.shadow.camera.top = 160;
  sun.shadow.camera.bottom = -160;
  sun.shadow.camera.far = 320;
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshLambertMaterial({ color: 0x4c8a4a }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(45, 0, 45);
  ground.receiveShadow = true;
  scene.add(ground);

  const patchMaterial = new THREE.MeshLambertMaterial({ color: 0x477f45 });
  for (let i = 0; i < 70; i++) {
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(6 + Math.random() * 14, 6 + Math.random() * 14), patchMaterial);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(-60 + Math.random() * 260, .01, -20 + Math.random() * 220);
    patch.receiveShadow = true;
    scene.add(patch);
  }

  return { renderer, scene, camera };
}

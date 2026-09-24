const DAY_PHASES = [
  {
    duration: 4 * 60,
    sky: new THREE.Color(0x8fc7e8),
    fog: new THREE.Color(0x8fc7e8),
    ambient: new THREE.Color(0xffffff),
    ambientIntensity: 0.55,
    nightFactor: 0,
    sunlight: new THREE.Color(0xfff2d6),
    sunlightIntensity: 1.05,
    sunPosition: new THREE.Vector3(-60, 110, 40)
  },
  {
    duration: 2 * 60,
    sky: new THREE.Color(0xf2a36b),
    fog: new THREE.Color(0xe8aa7c),
    ambient: new THREE.Color(0xffcfaa),
    ambientIntensity: 0.42,
    nightFactor: 0.35,
    sunlight: new THREE.Color(0xff9850),
    sunlightIntensity: 0.85,
    sunPosition: new THREE.Vector3(70, 55, -35)
  },
  {
    duration: 3 * 60,
    sky: new THREE.Color(0x111a38),
    fog: new THREE.Color(0x202b49),
    ambient: new THREE.Color(0x7185bd),
    ambientIntensity: 0.24,
    nightFactor: 1,
    sunlight: new THREE.Color(0x9eb5ff),
    sunlightIntensity: 0.28,
    sunPosition: new THREE.Vector3(-25, 48, 30)
  }
];

const DAY_TRANSITION_SECONDS = 35;
const DAY_CYCLE_SECONDS = DAY_PHASES.reduce((total, phase) => total + phase.duration, 0);
const MAX_NIGHT_LIGHTS = 12;

export function registerNightLight(scene, light, glow = null) {
  const nightLights = scene.userData.nightLights ||
    (scene.userData.nightLights = []);

  if (glow) registerNightGlow(scene, glow);

  // Evita dezenas de PointLights/SpotLights entrando no shader de uma vez
  // quando anoitece. Os emissores visuais continuam aparecendo normalmente.
  if (nightLights.length >= MAX_NIGHT_LIGHTS) {
    light.intensity = 0;
    light.visible = false;
    return;
  }

  nightLights.push({
    light,
    baseIntensity: light.intensity
  });

  light.intensity = 0;
  // Mantém a contagem de luzes constante para não recompilar shaders
  // exatamente no começo da noite.
  light.visible = true;
}

export function registerNightGlow(scene, glow) {
  if (!glow) return;

  const nightGlows = scene.userData.nightGlows ||
    (scene.userData.nightGlows = []);
  const meshes = Array.isArray(glow) ? glow : [glow];
  meshes.forEach(mesh => {
    if (!mesh) return;
    mesh.visible = false;
    nightGlows.push(mesh);
  });
}

export function createScene() {
  const canvas = document.getElementById('three-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  // Limita a resolução interna: telas com alta densidade de pixels são uma
  // das causas mais comuns de queda de FPS no WebGL.
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
  renderer.shadowMap.enabled = localStorage.getItem('shadowsEnabled') !== 'false';
  // O PCF normal evita o custo alto do filtro suave a cada quadro.
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = DAY_PHASES[0].sky.clone();
  // A névoa combina com o céu; o limite da câmera logo depois dela também
  // evita desenhar objetos que já não precisam aparecer.
  scene.fog = new THREE.Fog(DAY_PHASES[0].fog.clone(), 75, 260);
  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .1, 320);

  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }

  addEventListener('resize', resize);
  resize();
  const ambientLight = new THREE.AmbientLight(0xffffff, .55);
  scene.add(ambientLight);

  const sun = new THREE.DirectionalLight(0xfff2d6, 1.05);
  sun.position.copy(DAY_PHASES[0].sunPosition);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -520;
  sun.shadow.camera.right = 520;
  sun.shadow.camera.top = 520;
  sun.shadow.camera.bottom = -520;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 850;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 2;
  scene.add(sun);

  let elapsedDaySeconds = 0;
  function updateDayNight(deltaSeconds) {
    elapsedDaySeconds = (elapsedDaySeconds + Math.max(0, deltaSeconds)) % DAY_CYCLE_SECONDS;

    let phaseIndex = 0;
    let phaseStart = 0;
    while (elapsedDaySeconds >= phaseStart + DAY_PHASES[phaseIndex].duration) {
      phaseStart += DAY_PHASES[phaseIndex].duration;
      phaseIndex = (phaseIndex + 1) % DAY_PHASES.length;
    }

    const phase = DAY_PHASES[phaseIndex];
    const nextPhase = DAY_PHASES[(phaseIndex + 1) % DAY_PHASES.length];
    const phaseElapsed = elapsedDaySeconds - phaseStart;
    const transitionStart = phase.duration - DAY_TRANSITION_SECONDS;
    const blend = phaseElapsed <= transitionStart
      ? 0
      : THREE.MathUtils.clamp((phaseElapsed - transitionStart) / DAY_TRANSITION_SECONDS, 0, 1);

    scene.background.copy(phase.sky).lerp(nextPhase.sky, blend);
    scene.fog.color.copy(phase.fog).lerp(nextPhase.fog, blend);
    ambientLight.color.copy(phase.ambient).lerp(nextPhase.ambient, blend);
    ambientLight.intensity = THREE.MathUtils.lerp(phase.ambientIntensity, nextPhase.ambientIntensity, blend);
    sun.color.copy(phase.sunlight).lerp(nextPhase.sunlight, blend);
    sun.intensity = THREE.MathUtils.lerp(phase.sunlightIntensity, nextPhase.sunlightIntensity, blend);
    sun.position.copy(phase.sunPosition).lerp(nextPhase.sunPosition, blend);

    const nightFactor = THREE.MathUtils.lerp(
      phase.nightFactor,
      nextPhase.nightFactor,
      blend
    );
    scene.userData.nightLights?.forEach(({ light, baseIntensity }) => {
      light.intensity = baseIntensity * nightFactor;
    });
    scene.userData.nightGlows?.forEach(glow => {
      glow.visible = nightFactor > 0.001;
      const materials = Array.isArray(glow.material)
        ? glow.material
        : [glow.material];
      materials.forEach(material => {
        if (material?.transparent) material.opacity = nightFactor;
      });
    });

    return nightFactor;
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshLambertMaterial({ color: 0x4c8a4a }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(45, 0, 45);
  ground.receiveShadow = true;
  scene.add(ground);

  const patchGeometry = new THREE.PlaneGeometry(1, 1);
  const patchMaterial = new THREE.MeshLambertMaterial({ color: 0x477f45 });
  const patches = new THREE.InstancedMesh(patchGeometry, patchMaterial, 70);
  const patchMatrix = new THREE.Matrix4();
  const patchQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  for (let i = 0; i < 70; i++) {
    patchMatrix.compose(
      new THREE.Vector3(-60 + Math.random() * 260, .01, -20 + Math.random() * 220),
      patchQuaternion,
      new THREE.Vector3(6 + Math.random() * 14, 6 + Math.random() * 14, 1)
    );
    patches.setMatrixAt(i, patchMatrix);
  }
  patches.instanceMatrix.needsUpdate = true;
  scene.add(patches);

  return { renderer, scene, camera, updateDayNight };
}

// js/fase2.js
// ---------------------------------------------------------------------------
// FASE 2 - Cidade movimentada
//
// O que este arquivo faz:
//   1. Define um NOVO LAYOUT de prédios (usado pelo modelos.js).
//   2. Cria FAIXAS DE PEDESTRE com pedestres que atravessam a rua.
//   3. Cria uma ZONA ESCOLAR com limite de velocidade perto da chegada.
//   4. Cria o HUD da fase (faixa, aviso de pedestre, placa de velocidade).
//   5. Informa ao main.js as colisões e infrações novas.
// ---------------------------------------------------------------------------

import {
  ROAD_W_MAIN,
  ROAD_W_OUTER,
  ROAD_W_SHORT
} from './config.js';

import { state } from './state.js';

const THREE = window.THREE;


/* =========================================================
   1. LAYOUT DOS PRÉDIOS NA FASE 2
========================================================= */

/*
   Posições aproximadas. Como manualPlacement é false, o modelos.js
   empurra cada prédio para fora das ruas e da ferrovia e evita que
   um prédio fique em cima do outro. Para ajustar no olho, use o botão
   "EDITAR PRÉDIOS" com ?fase=2 na URL e copie as instâncias geradas.
*/

const FLAT = -Math.PI / 2;

const at = (x, z, rotationY, rotationX = FLAT) => ({
  position: { x, y: 0, z },
  rotation: { x: rotationX, y: rotationY, z: 0 }
});

export const PHASE2_BUILDING_LAYOUT = {

  escola: {
    position: { x: -190, y: 0, z: 320 }
  },

  predio1: {
    manualPlacement: false,
    position: { x: -60, y: 0, z: -50 },
    instances: [
      at(-60, -50, 0.6),
      at(170, -45, -2.2),
      at(-300, 120, 1.1),
      at(95, 290, 2.6),
      at(300, 210, -0.9),
      at(-20, 420, 3.5)
    ]
  },

  predio2: {
    manualPlacement: false,
    position: { x: 120, y: 0, z: 80 },
    instances: [
      at(120, 80, -0.4),
      at(-300, -20, 1.9),
      at(-260, 330, -2.6),
      at(230, 440, 0.3),
      at(450, 160, 2.2),
      at(60, 215, -1.3)
    ]
  },

  predio3: {
    manualPlacement: false,
    position: { x: -180, y: 0, z: -60 },
    instances: [
      at(-180, -60, 1.6, 0),
      at(30, -90, 0, 0),
      at(330, -30, -1.6, 0),
      at(-60, 330, 3.1, 0),
      at(370, 420, 0.8, 0)
    ]
  },

  predio4: {
    manualPlacement: false,
    position: { x: 200, y: 0, z: 90 },
    instances: [
      at(200, 90, 1.2),
      at(-30, 120, -2.0),
      at(-350, 200, 0.4),
      at(120, 400, 2.9),
      at(500, 300, -1.1),
      at(300, -70, 3.4)
    ]
  }
};


/* =========================================================
   2. CONFIGURAÇÃO DA FASE
========================================================= */

const ROAD_WIDTHS = {
  start: ROAD_W_MAIN,
  outer: ROAD_W_OUTER,
  shortcut: ROAD_W_SHORT,
  final: ROAD_W_MAIN
};

// Onde ficam as faixas: qual estrada e em que ponto dela (0 = começo,
// 1 = fim). Se cair perto da ferrovia, a posição é deslocada sozinha.
const CROSSWALK_SPECS = [
  { road: 'start', fraction: 0.2 },
  { road: 'start', fraction: 0.55 },
  { road: 'shortcut', fraction: 0.28 },
  { road: 'outer', fraction: 0.5 }
];

// Velocidade dos pedestres (unidades por segundo).
const PEDESTRIAN_SPEED = 4.5;

// Os pedestres só começam a atravessar quando o jogador chega perto.
const TRIGGER_DISTANCE = 95;

// Tempo de espera entre uma travessia e a próxima.
const COOLDOWN_SECONDS = 6;

// Zona escolar (perto da chegada).
const SCHOOL_ZONE = {
  x: -190,
  z: 320,
  radius: 55,
  limit: 15,
  graceSeconds: 1.2
};

const SPEED_BUMP_SPECS = [
  { road: 'start', fraction: 0.78 },
  { road: 'shortcut', fraction: 0.58 },
  { road: 'outer', fraction: 0.78 }
];

const PEDESTRIAN_COLORS = [
  0xd94f4f, 0x3f8fd9, 0xe0b73a, 0x58b368, 0xa564c9, 0xe27d3f
];


/* =========================================================
   3. INTERFACE (HUD E TEXTOS)
========================================================= */

function injectStyles() {
  const style = document.createElement('style');

  style.textContent = `
    .p2-banner {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 6;
      padding: 6px 16px;
      border: 1px solid #ffb02088;
      border-radius: 999px;
      background: #101114c9;
      color: #ffb020;
      font: 800 11px 'Segoe UI', Arial, sans-serif;
      letter-spacing: 3px;
      pointer-events: none;
    }

    .p2-hint,
    .p2-toast {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      z-index: 6;
      padding: 10px 18px;
      border-radius: 9px;
      color: #fff;
      font: 800 15px 'Segoe UI', Arial, sans-serif;
      letter-spacing: .5px;
      text-align: center;
      pointer-events: none;
      opacity: 0;
      transition: opacity .25s ease;
    }

    .p2-hint {
      top: 96px;
      background: #8e1818e8;
      border: 2px solid #ff4d4d;
    }

    .p2-toast {
      top: 146px;
      background: #146b3ae8;
      border: 2px solid #5be37a;
    }

    .p2-hint.on,
    .p2-toast.on {
      opacity: 1;
    }

    .p2-score {
      position: fixed; top: 54px; left: 50%; transform: translateX(-50%); z-index: 6;
      padding: 9px 16px; border: 1px solid #5be37a88; border-radius: 10px;
      background: #101114e8; color: #fff; font: 800 12px 'Segoe UI', Arial, sans-serif;
      letter-spacing: 1px; pointer-events: none;
    }
    .p2-score b { color: #5be37a; font-size: 20px; margin-left: 6px; }

    .p2-sign {
      position: fixed;
      right: 22px;
      bottom: 22px;
      z-index: 6;
      width: 92px;
      height: 92px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 8px solid #d62920;
      border-radius: 50%;
      background: #fff;
      color: #111;
      opacity: 0;
      transform: scale(.85);
      transition: opacity .25s ease, transform .25s ease;
      pointer-events: none;
    }

    .p2-sign b {
      font: 900 34px 'Segoe UI', Arial, sans-serif;
      line-height: 1;
    }

    .p2-sign span {
      margin-top: 2px;
      font: 800 8px 'Segoe UI', Arial, sans-serif;
      letter-spacing: .5px;
    }

    .p2-sign.on {
      opacity: 1;
      transform: scale(1);
    }

    .p2-sign.over {
      animation: p2-blink .5s infinite alternate;
    }

    @keyframes p2-blink {
      from { box-shadow: 0 0 0 0 #ff4d4d00; }
      to   { box-shadow: 0 0 22px 6px #ff4d4dcc; }
    }
  `;

  document.head.appendChild(style);
}

function applyPhase2Texts() {
  const kicker = document.querySelector('.menu-kicker');

  if (kicker) {
    kicker.textContent = 'FASE 2 · CIDADE MOVIMENTADA';
  }

  const introTitle =
    document.querySelector('#introOverlay h1');

  if (introTitle) {
    introTitle.textContent = '🏍 ROTA ZERO — FASE 2';
  }

  const introText =
    document.querySelector('#introOverlay .card > p');

  if (introText) {
    introText.textContent =
      'A cidade está mais movimentada e os prédios mudaram de lugar. ' +
      'Agora existem faixas de pedestre: pare e espere os pedestres ' +
      'atravessarem. Perto da escola vale o limite de ' +
      `${SCHOOL_ZONE.limit} km/h. Lombadas: passe devagar. Infracoes tiram pontos; dar preferencia ao pedestre soma pontos.`;
  }
}

function createHud() {
  // As classes "game-element game-hidden" fazem estes elementos
  // aparecerem só quando o jogo começa (o ui.js remove a classe).
  function make(className, html = '') {
    const element = document.createElement('div');
    element.className = `${className} game-element game-hidden`;
    element.innerHTML = html;
    document.body.appendChild(element);
    return element;
  }

  const banner = make('p2-banner', 'FASE 2 · CIDADE MOVIMENTADA');
  const hint = make('p2-hint', '🚶 PEDESTRE NA FAIXA — PARE!');
  const toast = make('p2-toast');
  const sign = make(
    'p2-sign',
    `<b>${SCHOOL_ZONE.limit}</b><span>ZONA ESCOLAR</span>`
  );

  const score = make('p2-score', 'PONTOS <b>1000</b>');
  let toastTimer = null;

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('on');

    window.clearTimeout(toastTimer);

    toastTimer = window.setTimeout(() => {
      toast.classList.remove('on');
    }, 3500);
  }

  return { banner, hint, sign, score, showToast };
}


/* =========================================================
   4. PEDESTRE (modelo simples feito com formas geométricas)
========================================================= */

function createPedestrian(shirtColor) {
  const person = new THREE.Group();

  const skin =
    new THREE.MeshLambertMaterial({ color: 0xf0c8a0 });

  const shirt =
    new THREE.MeshLambertMaterial({ color: shirtColor });

  const pants =
    new THREE.MeshLambertMaterial({ color: 0x2b3a55 });

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.7, 0.32),
    shirt
  );

  torso.position.y = 1.15;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 12, 8),
    skin
  );

  head.position.y = 1.75;

  // Braços e pernas giram a partir de um pivô (quadril / ombro).
  function limb(width, height, depth, material, x, y) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material
    );

    mesh.position.y = -height / 2;
    pivot.add(mesh);

    return pivot;
  }

  const legL = limb(0.2, 0.8, 0.22, pants, -0.14, 0.8);
  const legR = limb(0.2, 0.8, 0.22, pants, 0.14, 0.8);
  const armL = limb(0.14, 0.65, 0.16, shirt, -0.38, 1.45);
  const armR = limb(0.14, 0.65, 0.16, shirt, 0.38, 1.45);

  person.add(torso, head, legL, legR, armL, armR);

  person.traverse(object => {
    if (object.isMesh) object.castShadow = true;
  });

  person.scale.setScalar(1.4);
  person.userData.limbs = { legL, legR, armL, armR };

  return person;
}


/* =========================================================
   5. FAIXA DE PEDESTRE
========================================================= */

function buildCrosswalk(
  scene,
  samples,
  roadWidth,
  fraction,
  railway,
  railwaySignals,
  colorOffset
) {
  if (!samples || samples.length < 8) return null;

  const last = samples.length - 2;

  let index = Math.max(2, Math.round(fraction * last));

  // Não coloca faixa em cima da linha do trem nem do semáforo ferroviário.
  const blocked = point =>
    railway.some(
      r => Math.hypot(r.x - point.x, r.z - point.z) < 40
    ) ||
    railwaySignals.some(
      s => Math.hypot(s.x - point.x, s.z - point.z) < 40
    );

  let guard = 0;

  while (
    blocked(samples[index]) &&
    guard++ < 30 &&
    index < last - 1
  ) {
    index += 2;
  }

  const point = samples[index];

  if (blocked(point)) return null;

  const previous = samples[index - 1];
  const next = samples[index + 1];

  const tangentX = next.x - previous.x;
  const tangentZ = next.z - previous.z;
  const length = Math.hypot(tangentX, tangentZ) || 1;

  const tx = tangentX / length;
  const tz = tangentZ / length;

  // Normal: aponta para o lado da rua (de calçada a calçada).
  const nx = tz;
  const nz = -tx;

  const heading = Math.atan2(tx, tz);
  const halfWidth = roadWidth / 2;


  /* ---------- listras no asfalto ---------- */

  const group = new THREE.Group();

  group.position.set(point.x, 0, point.z);
  group.rotation.y = heading;

  const stripeMaterial =
    new THREE.MeshLambertMaterial({ color: 0xf4f4f4 });

  const stripeGeometry =
    new THREE.BoxGeometry(1.1, 0.04, 4.4);

  const stripeCount = Math.floor(roadWidth / 2.4);
  const stripeSpacing = roadWidth / stripeCount;

  for (let i = 0; i < stripeCount; i++) {
    const stripe =
      new THREE.Mesh(stripeGeometry, stripeMaterial);

    stripe.position.set(
      -halfWidth + stripeSpacing * (i + 0.5),
      0.28,
      0
    );

    stripe.receiveShadow = true;
    group.add(stripe);
  }


  /* ---------- placas de travessia ---------- */

  const poleMaterial =
    new THREE.MeshLambertMaterial({ color: 0x20242a });

  const plateMaterial =
    new THREE.MeshLambertMaterial({ color: 0x1e5fd6 });

  const whiteMaterial =
    new THREE.MeshLambertMaterial({ color: 0xffffff });

  [-1, 1].forEach(side => {
    const sign = new THREE.Group();

    // Uma placa para cada sentido do trânsito.
    sign.position.set(
      side * (halfWidth + 2.4),
      0,
      side > 0 ? -5.5 : 5.5
    );

    sign.rotation.y = side > 0 ? Math.PI : 0;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8),
      poleMaterial
    );

    pole.position.y = 1.6;

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 0.1),
      plateMaterial
    );

    plate.position.y = 3.2;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.6, 0.04),
      whiteMaterial
    );

    body.position.set(0, 3.1, 0.07);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      whiteMaterial
    );

    head.position.set(0, 3.6, 0.07);

    sign.add(pole, plate, body, head);
    group.add(sign);
  });

  scene.add(group);


  /* ---------- pedestres ---------- */

  const edge = halfWidth + 2.6;

  const peds = [0, 1].map(i => {
    const model = createPedestrian(
      PEDESTRIAN_COLORS[
        (colorOffset * 2 + i) % PEDESTRIAN_COLORS.length
      ]
    );

    scene.add(model);

    return { model, alongOffset: i === 0 ? -1.1 : 1.1 };
  });

  const side = colorOffset % 2 === 0 ? 1 : -1;

  return {
    x: point.x,
    z: point.z,
    tx,
    tz,
    nx,
    nz,
    halfWidth,
    edge,
    peds,

    // 'waiting' = esperando na calçada | 'crossing' = atravessando
    phase: 'waiting',
    side,
    across: side * edge,
    cooldown: 2,
    yielded: false,

    // Usado pelos carros NPC: enquanto "red" for true, eles param.
    signal: { x: point.x, z: point.z, red: false }
  };
}


function buildSpeedBumps(scene, track) {
  const bumps = [];
  SPEED_BUMP_SPECS.forEach(spec => {
    const samples = track.samples[spec.road];
    if (!samples || samples.length < 4) return;
    const index = Math.max(1, Math.min(samples.length - 2, Math.round(spec.fraction * (samples.length - 1))));
    const point = samples[index];
    const prev = samples[index - 1];
    const next = samples[index + 1];
    const heading = Math.atan2(next.x - prev.x, next.z - prev.z);
    const width = ROAD_WIDTHS[spec.road];
    const group = new THREE.Group();
    group.position.set(point.x, 0.08, point.z);
    group.rotation.y = heading;
    const black = new THREE.MeshLambertMaterial({ color: 0x171717 });
    const yellow = new THREE.MeshLambertMaterial({ color: 0xffd22e });
    const count = Math.ceil(width / 3);
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width / count + 0.04, 0.34, 3.2), i % 2 ? black : yellow);
      mesh.position.set(-width / 2 + width * (i + 0.5) / count, 0.17, 0);
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    scene.add(group);
    bumps.push({ x: point.x, z: point.z, used: false, group });
  });
  return bumps;
}

/* =========================================================
   6. CRIAR A FASE 2
========================================================= */

export function createPhase2(scene, track) {
  injectStyles();
  applyPhase2Texts();

  const hud = createHud();

  const railway = track.samples.train || [];
  const railwaySignals = track.getRailwaySignalStates();

  const crosswalks = CROSSWALK_SPECS
    .map((spec, index) =>
      buildCrosswalk(
        scene,
        track.samples[spec.road],
        ROAD_WIDTHS[spec.road],
        spec.fraction,
        railway,
        railwaySignals,
        index
      )
    )
    .filter(Boolean);

  const stopSignals =
    crosswalks.map(crosswalk => crosswalk.signal);

  state.pedestriansYielded = 0;
  const speedBumps = buildSpeedBumps(scene, track);

  let schoolOverTime = 0;

  // O jogador está em cima da faixa?
  function playerOnCrosswalk(crosswalk) {
    const dx = state.x - crosswalk.x;
    const dz = state.z - crosswalk.z;

    const along = dx * crosswalk.tx + dz * crosswalk.tz;
    const across = dx * crosswalk.nx + dz * crosswalk.nz;

    return (
      Math.abs(along) < 3.6 &&
      Math.abs(across) < crosswalk.halfWidth
    );
  }

  function placePedestrians(crosswalk, time) {
    const walking = crosswalk.phase === 'crossing';

    // Sempre olham na direção da rua que vão atravessar.
    const facingX = crosswalk.nx * -crosswalk.side;
    const facingZ = crosswalk.nz * -crosswalk.side;
    const facing = Math.atan2(facingX, facingZ);

    crosswalk.peds.forEach((ped, i) => {
      ped.model.position.set(
        crosswalk.x +
          crosswalk.nx * crosswalk.across +
          crosswalk.tx * ped.alongOffset,
        0.12,
        crosswalk.z +
          crosswalk.nz * crosswalk.across +
          crosswalk.tz * ped.alongOffset
      );

      ped.model.rotation.y = facing;

      const { legL, legR, armL, armR } =
        ped.model.userData.limbs;

      const swing =
        walking ? Math.sin(time * 8 + i) * 0.6 : 0;

      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing;
      armR.rotation.x = swing;
    });
  }

  function update(dt) {
    const time = performance.now() / 1000;

    const playing =
      state.raceStarted && !state.raceFinished;

    let pedestrianNearby = false;

    crosswalks.forEach(crosswalk => {
      const dx = state.x - crosswalk.x;
      const dz = state.z - crosswalk.z;
      const distance = Math.hypot(dx, dz);

      if (crosswalk.phase === 'waiting') {
        crosswalk.cooldown -= dt;

        if (
          crosswalk.cooldown <= 0 &&
          playing &&
          distance < TRIGGER_DISTANCE
        ) {
          crosswalk.phase = 'crossing';
          crosswalk.yielded = false;
        }
      } else {
        crosswalk.across -=
          crosswalk.side * PEDESTRIAN_SPEED * dt;

        // Chegou do outro lado da rua.
        if (crosswalk.side * crosswalk.across <= -crosswalk.edge) {
          crosswalk.across = -crosswalk.side * crosswalk.edge;
          crosswalk.side = -crosswalk.side;
          crosswalk.phase = 'waiting';
          crosswalk.cooldown = COOLDOWN_SECONDS;
        }

        if (distance < 55) pedestrianNearby = true;

        // Decisão correta: parou antes da faixa e deu preferência.
        if (!crosswalk.yielded && playing) {
          const along =
            dx * crosswalk.tx + dz * crosswalk.tz;

          const across =
            dx * crosswalk.nx + dz * crosswalk.nz;

          if (
            Math.abs(along) > 4 &&
            Math.abs(along) < 34 &&
            Math.abs(across) < crosswalk.halfWidth + 8 &&
            Math.abs(state.speed) < 2
          ) {
            crosswalk.yielded = true;
            state.pedestriansYielded += 1;
            state.score += 100;
            hud.showToast('✅ Muito bem! Você deu preferência ao pedestre.');
          }
        }
      }

      crosswalk.signal.red = crosswalk.phase === 'crossing';

      placePedestrians(crosswalk, time);
    });

    hud.hint.classList.toggle('on', pedestrianNearby && playing);

    speedBumps.forEach(bump => {
      const distance = Math.hypot(state.x - bump.x, state.z - bump.z);
      if (distance > 10) bump.used = false;
      if (!playing || bump.used || distance > 4.5) return;
      bump.used = true;
      if (Math.abs(state.speed) > 12) {
        state.speed *= 0.72;
        state.score = Math.max(0, state.score - 35);
        hud.showToast('Lombada em alta velocidade: -35 pontos.');
      } else if (Math.abs(state.speed) > 0.5) {
        state.score += 25;
        hud.showToast('Boa! Passou devagar pela lombada: +25 pontos.');
      }
    });
    hud.score.innerHTML = 'PONTOS <b>' + state.score + '</b>';

    // Zona escolar.
    const inSchoolZone =
      Math.hypot(
        state.x - SCHOOL_ZONE.x,
        state.z - SCHOOL_ZONE.z
      ) < SCHOOL_ZONE.radius;

    const overLimit =
      Math.abs(state.speed) > SCHOOL_ZONE.limit;

    hud.sign.classList.toggle('on', inSchoolZone);
    hud.sign.classList.toggle('over', inSchoolZone && overLimit);

    schoolOverTime =
      inSchoolZone && overLimit && playing
        ? schoolOverTime + dt
        : 0;
  }

  // Pedestres que estão atravessando podem ser atropelados.
  function getHitboxes() {
    const hitboxes = [];

    crosswalks.forEach(crosswalk => {
      if (crosswalk.phase !== 'crossing') return;

      crosswalk.peds.forEach(ped => {
        hitboxes.push({
          type: 'pedestrian',
          x: ped.model.position.x,
          z: ped.model.position.z,
          radius: 0.55
        });
      });
    });

    return hitboxes;
  }

  // Devolve o tipo da infração atual (ou null).
  function getViolation() {
    if (!state.raceStarted || state.raceFinished) return null;

    const ranRedCrosswalk = crosswalks.some(
      crosswalk =>
        crosswalk.phase === 'crossing' &&
        playerOnCrosswalk(crosswalk) &&
        Math.abs(state.speed) > 1.5
    );

    if (ranRedCrosswalk) return 'crosswalk';

    if (schoolOverTime > SCHOOL_ZONE.graceSeconds) {
      return 'schoolzone';
    }

    return null;
  }

  return {
    update,
    getHitboxes,
    getViolation,
    getCarStopSignals: () => stopSignals,
    getScore: () => state.score
  };
}

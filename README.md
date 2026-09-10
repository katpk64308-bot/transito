## Como executar

Abra o \`index.html\` por meio de um servidor local para que os módulos JavaScript e os modelos \`.fbx\` sejam carregados corretamente.

Controles: \`W\`/\`A\`/\`S\`/\`D\` ou as setas do teclado. A tecla \`F3\` mostra ou oculta a grade de coordenadas.

## Arquivos JavaScript

### \`js/main.js\`

É o ponto de entrada do jogo. Inicializa a cena, pista, moto, modelos, interface, controles, câmera e o loop de animação.

Exemplos usados no projeto:

~~~js
const { renderer, scene, camera } = createScene();
const track = createTrack(scene);
const bike = buildBike();
~~~

~~~js
setupControls(ui.startRace);
const updateCamera = createCameraController(camera, state);
const drawMinimap = createMinimap(track.samples);
~~~

~~~js
function animate() {
  requestAnimationFrame(animate);
  updatePhysics(dt, bike, track, ui.finishRace, models.colliders);
  renderer.render(scene, camera);
}
~~~

### \`js/scene.js\`

Cria a cena 3D, o renderer, a câmera, a iluminação, o chão, a névoa e elementos decorativos do ambiente.

Exemplos usados no projeto:

~~~js
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
~~~

~~~js
scene.background = new THREE.Color(0x8fc7e8);
scene.fog = new THREE.Fog(0x8fc7e8, 140, 420);
~~~

~~~js
scene.add(new THREE.AmbientLight(0xffffff, .55));
scene.add(sun);
~~~

### \`js/config.js\`

Centraliza as coordenadas da pista, o ponto de chegada, as larguras das estradas e os parâmetros da física.

Exemplos usados no projeto:

~~~js
export const startPts = scalePoints([
  [20, 0], [-30, 0], [-80, 0]
]);
~~~

~~~js
export const finishPoint = scalePoints([[35, 70]])[0];
export const ROAD_W_MAIN = 27;
~~~

~~~js
export const physics = {
  MAX_SPEED: 30,
  ACCEL: 20,
  BRAKE: 28,
  TURN_RATE: 2
};
~~~

### \`js/state.js\`

Guarda o estado compartilhado da partida: posição, direção, velocidade, início, tempo e conclusão da corrida. Também registra as teclas pressionadas.

Exemplos usados no projeto:

~~~js
export const state = {
  x: startPts[0][0],
  z: startPts[0][1],
  speed: 0
};
~~~

~~~js
export const keys = {};
~~~

~~~js
export function isDown(...names) {
  return names.some(name => keys[name]);
}
~~~

### \`js/controls.js\`

Configura os eventos de teclado. Marca teclas pressionadas, remove a marca quando são soltas e inicia a corrida no primeiro comando.

Exemplos usados no projeto:

~~~js
keys[event.key.toLowerCase()] = true;
~~~

~~~js
keys[event.key.toLowerCase()] = false;
~~~

~~~js
if (!state.raceStarted && !state.raceFinished) startRace();
~~~

### \`js/physics.js\`

Atualiza a movimentação da moto, aceleração, frenagem, atrito, direção, inclinação, rotação das rodas, colisão com modelos e detecção da chegada.

Exemplos usados no projeto:

~~~js
const throttle = isDown('w', 'arrowup');
const brake = isDown('s', 'arrowdown');
~~~

~~~js
if (throttle) state.speed += physics.ACCEL * grip * dt;
else if (brake) state.speed -= physics.BRAKE * dt;
~~~

~~~js
if (collidesWithModel(state.x, state.z, colliders)) {
  state.x = previousX;
  state.z = previousZ;
  state.speed = 0;
}
~~~

### \`js/bike.js\`

Constrói visualmente a moto com objetos geométricos do Three.js. Retorna o grupo da moto e as duas rodas para que a física possa movimentá-las.

Exemplos usados no projeto:

~~~js
const group = new THREE.Group();
~~~

~~~js
addMesh(new THREE.BoxGeometry(.65, .6, 2.1), bodyMaterial, [0, .75, 0]);
~~~

~~~js
const wheelFront = createWheel(1.05);
const wheelBack = createWheel(-1);
return { group, wheelFront, wheelBack };
~~~

### \`js/camera.js\`

Mantém a câmera acompanhando a moto suavemente e aponta sua visão para a direção em que o jogador está seguindo.

Exemplos usados no projeto:

~~~js
const position = new THREE.Vector3(state.x, 6, state.z - 10);
~~~

~~~js
position.lerp(desiredPosition, Math.min(1, dt * 4.5));
camera.position.copy(position);
~~~

~~~js
lookTarget.lerp(desiredLook, Math.min(1, dt * 6));
camera.lookAt(lookTarget);
~~~

### \`js/track.js\`

Cria as estradas a partir dos pontos configurados, adiciona a faixa de chegada, a bandeira e fornece a distância entre a moto e a pista.

Exemplos usados no projeto:

~~~js
const samples = {
  start: sampleCurve(startPts, 100),
  outer: sampleCurve(outerPts, 180),
  shortcut: sampleCurve(shortcutPts, 100)
};
~~~

~~~js
buildRoad(samples.start, ROAD_W_MAIN, roadMaterial, true);
buildRoad(samples.shortcut, ROAD_W_SHORT, shortcutMaterial, false);
~~~

~~~js
const { dist, halfWidth } = track.distanceToRoad(state.x, state.z);
const offRoad = dist > halfWidth;
~~~

### \`js/minimap.js\`

Desenha o minimapa 2D no canvas: caminhos da pista, ponto de largada, chegada e a posição/direção atual da moto.

Exemplos usados no projeto:

~~~js
const canvas = document.getElementById('minimap');
const context = canvas.getContext('2d');
~~~

~~~js
drawPath(samples.shortcut, '#ffb020d9', 3);
drawPath(samples.final, '#e6e6e6d9', 4);
~~~

~~~js
context.save();
context.translate(x, y);
context.rotate(state.heading);
context.restore();
~~~

### \`js/ui.js\`

Controla a interface da corrida: botão de início, botão de reinício, cronômetro, velocidade e telas de introdução e chegada.

Exemplos usados no projeto:

~~~js
state.raceStarted = true;
state.startTime = performance.now();
~~~

~~~js
speedElement.textContent = Math.round(Math.abs(state.speed));
timerElement.textContent = state.elapsed.toFixed(1) + 's';
~~~

~~~js
finishOverlay.classList.remove('hidden');
finishTimeElement.textContent = state.elapsed.toFixed(1) + 's';
~~~

### \`js/coordinates.js\`

Cria uma grade de coordenadas no cenário para facilitar a edição e o posicionamento dos objetos. A grade é alternada pela tecla \`F3\`.

Exemplos usados no projeto:

~~~js
const group = new THREE.Group();
group.name = 'temporary-coordinate-grid';
~~~

~~~js
addCoordinateLabel(group, 'X ' + value, value, GRID_MIN + 9, '#ffd166');
addCoordinateLabel(group, 'Z ' + value, GRID_MIN + 9, value, '#8ee3f7');
~~~

~~~js
if (event.key === 'F3') {
  visible = !visible;
  group.visible = visible;
}
~~~

### \`js/modelos.js\`

Configura e carrega os modelos externos do cenário, como a escola e a montanha. Também cria áreas de colisão para os modelos que bloqueiam a moto.

Exemplos usados no projeto:

~~~js
escola: {
  file: 'modelo/escola.fbx',
  position: { x: 100, y: 0, z: 200 }
}
~~~

~~~js
new THREE.FBXLoader().load(config.file, onLoad, undefined, onError);
~~~

~~~js
if (config.collision?.enabled) {
  colliders.push({ name, x, z, halfX, halfZ, angle });
}
~~~

### \`js/cenario.js\`

Este arquivo ainda não possui implementação: contém apenas um comentário (\`//......\`). Atualmente, o cenário é criado diretamente em \`scene.js\` e os modelos externos são carregados por \`modelos.js\`.

Quando receber código, este módulo poderá concentrar a criação de árvores, prédios, placas ou outros elementos decorativos do cenário. No estado atual do projeto, não há exemplos de uso desse arquivo.

## Adicionando modelos e colisões

Os modelos ficam na pasta `modelo` e são configurados em `js/modelos.js`. O sistema aceita arquivos `.fbx` e `.obj`; um OBJ pode usar um arquivo `.mtl` opcional para carregar materiais. Arquivos `.max` precisam ser exportados para um formato compatível antes de serem usados no navegador.

Exemplo de configuração de um prédio:

~~~js
predio: {
  file: 'modelo/predio.fbx',
  position: { x: 120, y: 0, z: 80 },
  scale: { x: .1, y: .1, z: .1 },
  rotation: { x: 0, y: 0, z: 0 },
  collision: {
    enabled: true,
    size: { x: 30, z: 25 },
    offset: { x: 0, z: 0 }
  }
}
~~~

`position` define a posição do modelo, `scale` define o tamanho e `rotation` usa radianos. `collision.size` define a largura e a profundidade da caixa invisível de colisão; `offset` move essa caixa em relação ao centro do modelo. Para deixar um modelo atravessável, use `collision: { enabled: false }`.

## Fluxo principal

~~~text
main.js
  ├─ scene.js       → cena, iluminação e chão
  ├─ track.js       → pista e linha de chegada
  ├─ bike.js        → modelo da moto
  ├─ modelos.js     → escola, montanha e colisores
  ├─ controls.js    → teclado
  ├─ physics.js     → movimento e colisões
  ├─ camera.js      → câmera seguindo a moto
  ├─ minimap.js     → mapa 2D
  ├─ coordinates.js  → grade de depuração
  └─ ui.js           → HUD, cronômetro e telas
~~~

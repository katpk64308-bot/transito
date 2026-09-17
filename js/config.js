// Pontos e larguras da pista.

// Circuito amplo: reta inferior, setor esquerdo, trecho técnico superior
// e retorno pelo lado direito até a chegada.

const MAP_SCALE = 2.5;

const scalePoints = points =>
  points.map(([x, z]) => [
    x * MAP_SCALE,
    z * MAP_SCALE
  ]);

export const startPts = scalePoints([
  [20, 0],
  [-30, 0],
  [-80, 0],
  [-105, 12],
  [-95, 28],
  [-60, 42],
  [-45, 60]
]);

export const forkPoint = [
  -45 * MAP_SCALE,
  60 * MAP_SCALE
];

// Traçado externo, mais longo e sinuoso.

export const outerPts = scalePoints([
  [-45, 60],
  [-65, 85],
  [-70, 125],
  [-55, 160],
  [-20, 185],
  [30, 185],
  [60, 175],
  [62, 145],
  [85, 125],
  [110, 140],
  [140, 125],
  [165, 145],
  [185, 120],
  [170, 85],
  [190, 60],
  [185, 25],
  [160, 10],
  [130, 5],
  [115, 0]
]);

// Atalho interno, inspirado na área de pit lane do desenho enviado.

export const shortcutPts = scalePoints([
  [-45, 60],
  [-5, 75],
  [35, 70],
  [70, 50],
  [95, 25],
  [115, 0],
  [117.7, -3.5]
]);

// Reta final até a bandeirada.

export const finalPts = scalePoints([
  [115, 0],
  [80, -2],
  [45, 0],
  [10, 0]
]);

// Traçado da linha de trem indicado no minimapa.

export const trainPts = scalePoints([
  [-120, 170],
  [-75, 145],
  [-25, 120],
  [10, 112],
  [50, 96],
  [95, 76],
  [140, 48],
  [185, 20],
  [225, 0],
  [260, 30],
  [285, 100],
  [280, 180],
  [240, 260],
  [180, 320],
  [100, 340],
  [20, 320],
  [-60, 280],
  [-110, 230]
]);

// A chegada fica no ponto indicado na imagem.

export const finishPoint =
  scalePoints([[35, 70]])[0];

// Pista mais larga para facilitar as curvas
// e deixar a condução mais confortável.

export const ROAD_W_MAIN = 27;

export const ROAD_W_OUTER = 25;

export const ROAD_W_SHORT = 23;

// Parâmetros de movimentação.
// Os valores originais são mantidos no formato esperado
// pelo restante do jogo.

export const physics = {

  MAX_SPEED: 27,

  OFFROAD_MAX_SPEED: 28,

  MAX_REVERSE: -12,

  ACCEL: 15,

  BRAKE: 22,

  FRICTION: 8,

  TURN_RATE: 2,

  LEAN_MAX: .42,

  MODES: {
    eco: 22,
    comfort: 27,
    sport: 32
  }

};
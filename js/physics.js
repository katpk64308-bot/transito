import { finishPoint, physics } from './config.js';
import { isDown, state } from './state.js';

function collidesWithModel(x, z, colliders) {
  const bikeRadius = 2.5;
  return colliders.some(collider => {
    const cos = Math.cos(collider.angle);
    const sin = Math.sin(collider.angle);
    const relativeX = x - collider.x;
    const relativeZ = z - collider.z;
    const localX = relativeX * cos - relativeZ * sin;
    const localZ = relativeX * sin + relativeZ * cos;

    return Math.abs(localX) <= collider.halfX + bikeRadius &&
      Math.abs(localZ) <= collider.halfZ + bikeRadius;
  });
}

export function updatePhysics(dt, bike, track, onFinish, colliders = []) {
  const throttle = isDown('w', 'arrowup');
  const brake = isDown('s', 'arrowdown');
  const left = isDown('a', 'arrowleft');
  const right = isDown('d', 'arrowright');
  const roadPosition = track.drivingSideAt(state.x, state.z);
  const roadLimit = roadPosition ? roadPosition.halfWidth + (roadPosition.roadMargin || 0) : 0;
  const offRoad = !roadPosition || roadPosition.distance > roadLimit;
  state.foraEstrada = offRoad;
  const grip = offRoad ? .45 : 1;
  const topSpeed = offRoad ? physics.OFFROAD_MAX_SPEED : physics.MAX_SPEED;

  if (throttle) state.speed += physics.ACCEL * grip * dt;
  else if (brake) state.speed -= physics.BRAKE * dt;
  else if (state.speed > 0) state.speed = Math.max(0, state.speed - physics.FRICTION * dt);
  else if (state.speed < 0) state.speed = Math.min(0, state.speed + physics.FRICTION * dt);

  state.speed = Math.max(physics.MAX_REVERSE, Math.min(topSpeed, state.speed));
  let steer = 0;

  if (left) steer += 1;
  if (right) steer -= 1;

  const speedFactor = state.speed / physics.MAX_SPEED;
  if (Math.abs(state.speed) > .3) {
    state.heading += steer * physics.TURN_RATE * dt * Math.min(1, Math.abs(speedFactor) + .25) * Math.sign(state.speed || 1);
  }

  const previousX = state.x;
  const previousZ = state.z;
  state.x += Math.sin(state.heading) * state.speed * dt;
  state.z += Math.cos(state.heading) * state.speed * dt;

  if (collidesWithModel(state.x, state.z, colliders)) {
    state.x = previousX;
    state.z = previousZ;
    state.speed = 0;
  }

  bike.group.position.set(state.x, 0, state.z);
  bike.group.rotation.y = state.heading;

  const targetLean = -steer * physics.LEAN_MAX * Math.min(1, Math.abs(speedFactor) * 1.3);
  bike.group.rotation.z += (targetLean - bike.group.rotation.z) * Math.min(1, dt * 8);
  const wheelSpin = state.speed * dt * 2.2;
  bike.wheelFront.rotation.x -= wheelSpin;
  bike.wheelBack.rotation.x -= wheelSpin;

  // A faixa da direita segue o sentido dos pontos da pista; a faixa da
  // esquerda é reservada para quem vem no sentido contrário.
  if (roadPosition && roadPosition.distance <= roadLimit && Math.abs(state.speed) > .5) {
    // Durante a curva a direção da moto ainda não acompanha a nova rua.
    // Espera terminar a manobra para evitar um falso aviso na entrada.
    if (Math.abs(steer) > .15) {
      state.contramao = false;
    } else {
    const movingWithRoute = state.speed * (
      Math.sin(state.heading) * roadPosition.tangentX +
      Math.cos(state.heading) * roadPosition.tangentZ
    ) > 0;

    if (roadPosition.oneWay) {
      // A rua amarela é mão única: só é permitido seguir o traçado dela.
      state.contramao = !movingWithRoute;
    } else {
      // Nas ruas de mão dupla, cada sentido usa um lado da linha central.
      // O offset positivo é o lado esquerdo da direção desenhada na pista.
      const onLeftSide = roadPosition.offset > 1.5;
      state.contramao = onLeftSide !== movingWithRoute;
    }
    }
  } else {
    state.contramao = false;
  }

  const distanceToFinish = Math.hypot(state.x - finishPoint[0], state.z - finishPoint[1]);
  if (state.raceStarted && !state.raceFinished && distanceToFinish < 7) onFinish();
}

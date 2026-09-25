import { finalPts, finishPoint, phase2FinishPoint, outerPts, shortcutPts, startPts, trainPts, ROAD_W_MAIN, ROAD_W_OUTER } from './config.js';
import { state } from './state.js';

export function createMinimap(samples, getTrainState, phase = 1) {
  const finishTarget = phase === 2 ? phase2FinishPoint : finishPoint;
  const canvas = document.getElementById('minimap');
  const context = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio, 1.5);
  canvas.width = 190 * dpr;
  canvas.height = 190 * dpr;
  context.scale(dpr, dpr);

  const allPoints = [...startPts, ...outerPts, ...shortcutPts, ...finalPts, ...trainPts];
  const minX = Math.min(...allPoints.map(point => point[0])) - 10;
  const maxX = Math.max(...allPoints.map(point => point[0])) + 10;
  const minZ = Math.min(...allPoints.map(point => point[1])) - 10;
  const maxZ = Math.max(...allPoints.map(point => point[1])) + 10;

  function project(x, z) {
    return [14 + ((x - minX) / (maxX - minX)) * 162, 14 + ((z - minZ) / (maxZ - minZ)) * 162];
  }

  function drawPath(target, points, color, width) {
    target.strokeStyle = color;
    target.lineWidth = width;
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.beginPath();
    points.forEach((point, index) => {
      const [x, y] = project(point.x, point.z);
      if (index === 0) target.moveTo(x, y);
      else target.lineTo(x, y);
    });
    target.stroke();
  }

  const staticMap = document.createElement('canvas');
  staticMap.width = canvas.width;
  staticMap.height = canvas.height;
  const staticContext = staticMap.getContext('2d');
  staticContext.scale(dpr, dpr);
  drawPath(staticContext, samples.start, '#e6e6e6d9', 4);
  drawPath(staticContext, samples.outer, '#e6e6e6d9', 4);
  drawPath(staticContext, samples.shortcut, '#ffb020d9', 3);
  drawPath(staticContext, samples.final, '#e6e6e6d9', 4);
  drawPath(staticContext, samples.train, '#b62b2bd9', 3);

  let [staticX, staticY] = project(...startPts[0]);
  staticContext.fillStyle = '#ffcc33';
  staticContext.beginPath(); staticContext.arc(staticX, staticY, 4, 0, Math.PI * 2); staticContext.fill();
  const finishRoad = phase === 2 ? samples.outer : samples.final;
  let finishX = finishTarget[0];
  let finishZ = finishTarget[1];
  let finishTangentX = 0;
  let finishTangentZ = 1;
  let finishRoadDistance = Infinity;
  for (let i = 0; i < finishRoad.length - 1; i += 1) {
    const a = finishRoad[i];
    const b = finishRoad[i + 1];
    const segmentX = b.x - a.x;
    const segmentZ = b.z - a.z;
    const segmentLengthSquared = segmentX * segmentX + segmentZ * segmentZ || 1;
    const amount = Math.max(0, Math.min(1,
      ((finishTarget[0] - a.x) * segmentX +
        (finishTarget[1] - a.z) * segmentZ) / segmentLengthSquared
    ));
    const projectedX = a.x + segmentX * amount;
    const projectedZ = a.z + segmentZ * amount;
    const distance = Math.hypot(projectedX - finishTarget[0], projectedZ - finishTarget[1]);
    if (distance < finishRoadDistance) {
      finishRoadDistance = distance;
      finishTangentX = segmentX;
      finishTangentZ = segmentZ;
      if (phase === 2) {
        finishX = projectedX;
        finishZ = projectedZ;
      }
    }
  }

  const tangentLength = Math.hypot(finishTangentX, finishTangentZ) || 1;
  const halfFinishWidth = (phase === 2 ? ROAD_W_OUTER : ROAD_W_MAIN) / 2;
  const finishAcrossX = -finishTangentZ / tangentLength * halfFinishWidth;
  const finishAcrossZ = finishTangentX / tangentLength * halfFinishWidth;
  const [finishLeftX, finishLeftY] = project(
    finishX - finishAcrossX,
    finishZ - finishAcrossZ
  );
  const [finishRightX, finishRightY] = project(
    finishX + finishAcrossX,
    finishZ + finishAcrossZ
  );
  staticContext.lineCap = 'butt';
  staticContext.strokeStyle = '#fff';
  staticContext.lineWidth = 4;
  staticContext.beginPath();
  staticContext.moveTo(finishLeftX, finishLeftY);
  staticContext.lineTo(finishRightX, finishRightY);
  staticContext.stroke();
  staticContext.strokeStyle = '#111';
  staticContext.lineWidth = 2;
  staticContext.beginPath();
  staticContext.moveTo(finishLeftX, finishLeftY);
  staticContext.lineTo(finishRightX, finishRightY);
  staticContext.stroke();

  [staticX, staticY] = project(finishX, finishZ);
  staticContext.fillStyle = '#111'; staticContext.strokeStyle = '#fff'; staticContext.lineWidth = 1.5;
  staticContext.beginPath(); staticContext.arc(staticX, staticY, 4, 0, Math.PI * 2); staticContext.fill(); staticContext.stroke();

  return function drawMinimap() {
    context.clearRect(0, 0, 190, 190);
    context.drawImage(staticMap, 0, 0, 190, 190);

    const trainState = getTrainState();
    const [trainX, trainY] = project(trainState.x, trainState.z);
    context.save();
    context.translate(trainX, trainY);
    context.rotate(Math.PI - trainState.heading);
    context.fillStyle = '#43b5ff';
    context.beginPath();
    context.moveTo(0, -6);
    context.lineTo(4, 5);
    context.lineTo(-4, 5);
    context.closePath();
    context.fill();
    context.restore();

    const [x, y] = project(state.x, state.z);
    context.save();
    context.translate(x, y);
    context.rotate(Math.PI - state.heading);
    context.fillStyle = '#ff4d4d';
    context.beginPath();
    context.moveTo(0, -6);
    context.lineTo(4, 5);
    context.lineTo(-4, 5);
    context.closePath();
    context.fill();
    context.restore();
  };
}

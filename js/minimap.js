import { finalPts, finishPoint, phase2FinishPoint, outerPts, shortcutPts, startPts, trainPts } from './config.js';
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
  [staticX, staticY] = project(...finishTarget);
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
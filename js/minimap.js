import { finalPts, finishPoint, outerPts, shortcutPts, startPts } from './config.js';
import { state } from './state.js';

export function createMinimap(samples) {
  const canvas = document.getElementById('minimap');
  const context = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = 190 * dpr;
  canvas.height = 190 * dpr;
  context.scale(dpr, dpr);

  const allPoints = [...startPts, ...outerPts, ...shortcutPts, ...finalPts];
  const minX = Math.min(...allPoints.map(point => point[0])) - 10;
  const maxX = Math.max(...allPoints.map(point => point[0])) + 10;
  const minZ = Math.min(...allPoints.map(point => point[1])) - 10;
  const maxZ = Math.max(...allPoints.map(point => point[1])) + 10;

  function project(x, z) {
    return [14 + ((x - minX) / (maxX - minX)) * 162, 14 + ((z - minZ) / (maxZ - minZ)) * 162];
  }

  function drawPath(points, color, width) {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    points.forEach((point, index) => {
      const [x, y] = project(point.x, point.z);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }

  return function drawMinimap() {
    context.clearRect(0, 0, 190, 190);
    drawPath(samples.start, '#e6e6e6d9', 4);
    drawPath(samples.outer, '#e6e6e6d9', 4);
    drawPath(samples.shortcut, '#ffb020d9', 3);
    drawPath(samples.final, '#e6e6e6d9', 4);

    let [x, y] = project(...startPts[0]);
    context.fillStyle = '#ffcc33';
    context.beginPath(); context.arc(x, y, 4, 0, Math.PI * 2); context.fill();

    [x, y] = project(...finishPoint);
    context.fillStyle = '#111'; context.strokeStyle = '#fff'; context.lineWidth = 1.5;
    context.beginPath(); context.arc(x, y, 4, 0, Math.PI * 2); context.fill(); context.stroke();

    [x, y] = project(state.x, state.z);
    context.save(); context.translate(x, y); context.rotate(state.heading);
    context.fillStyle = '#ff4d4d'; context.beginPath(); context.moveTo(0, -6); context.lineTo(4, 5); context.lineTo(-4, 5); context.closePath(); context.fill();
    context.restore();
  };
}

import {
  finalPts, finishPoint, outerPts, ROAD_W_MAIN, ROAD_W_OUTER,
  ROAD_W_SHORT, shortcutPts, startPts
} from './config.js';

function sampleCurve(points, divisions) {
  const vectors = points.map(point => new THREE.Vector3(point[0], 0, point[1]));
  const curve = new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', .5);
  return curve.getPoints(divisions);
}

function buildRoad(samples, width, material, dashed) {
  const group = new THREE.Group();

  // Uma faixa contínua evita os buracos que apareciam entre os blocos
  // retangulares nas curvas mais abertas.
  const vertices = [];
  const indices = [];
  const halfWidth = width / 2;

  samples.forEach((point, index) => {
    const previous = samples[Math.max(0, index - 1)];
    const next = samples[Math.min(samples.length - 1, index + 1)];
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const length = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / length;
    const normalZ = tangentX / length;

    vertices.push(
      point.x + normalX * halfWidth, .1, point.z + normalZ * halfWidth,
      point.x - normalX * halfWidth, .1, point.z - normalZ * halfWidth
    );

    if (index < samples.length - 1) {
      const current = index * 2;
      const nextPair = (index + 1) * 2;
      indices.push(current, nextPair, current + 1, current + 1, nextPair, nextPair + 1);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const roadMesh = new THREE.Mesh(geometry, material);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  if (dashed) {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(
      samples.map(point => new THREE.Vector3(point.x, .24, point.z))
    );
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0xf2e9d0,
      dashSize: 5,
      gapSize: 4,
      scale: 1
    });
    const centerLine = new THREE.Line(lineGeometry, lineMaterial);
    centerLine.computeLineDistances();
    group.add(centerLine);
  }
  return group;
}

function createCheckerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      context.fillStyle = (x + y) % 2 ? '#f5f5f5' : '#111';
      context.fillRect(x * 8, y * 8, 8, 8);
    }
  }
  return new THREE.CanvasTexture(canvas);
}

export function createTrack(scene) {
  const samples = {
    start: sampleCurve(startPts, 100),
    outer: sampleCurve(outerPts, 180),
    shortcut: sampleCurve(shortcutPts, 100),
    final: sampleCurve(finalPts, 100)
  };

  const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x35363b });
  const shortcutMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3a34 });
  scene.add(
    buildRoad(samples.start, ROAD_W_MAIN, roadMaterial, true),
    buildRoad(samples.outer, ROAD_W_OUTER, roadMaterial, true),
    buildRoad(samples.shortcut, ROAD_W_SHORT, shortcutMaterial, false),
    buildRoad(samples.final, ROAD_W_MAIN, roadMaterial, true)
  );

  const roadSegments = [];
  [[samples.start, ROAD_W_MAIN], [samples.outer, ROAD_W_OUTER], [samples.shortcut, ROAD_W_SHORT], [samples.final, ROAD_W_MAIN]]
    .forEach(([road, width]) => {
      for (let i = 0; i < road.length - 1; i++) {
        roadSegments.push({ a: road[i], b: road[i + 1], halfWidth: width / 2 });
      }
    });

  const finish = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W_MAIN, 4), new THREE.MeshBasicMaterial({ map: createCheckerTexture() }));
  finish.rotation.x = -Math.PI / 2;
  finish.position.set(finishPoint[0], .16, finishPoint[1]);
  const previous = finalPts[finalPts.length - 2];
  const last = finalPts[finalPts.length - 1];
  finish.rotation.z = Math.atan2(last[0] - previous[0], last[1] - previous[1]);
  scene.add(finish);

  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 7, 8), new THREE.MeshLambertMaterial({ color: 0x222222 }));
  flagPole.position.set(finishPoint[0] + 6, 3.5, finishPoint[1]);
  flagPole.castShadow = true;
  scene.add(flagPole);

  const flag = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }));
  flag.position.set(finishPoint[0] + 7.5, 6, finishPoint[1]);
  scene.add(flag);

  return {
    samples,
    distanceToRoad(x, z) {
      let closestDistance = Infinity;
      let closestHalfWidth = 5;

      roadSegments.forEach(({ a, b, halfWidth }) => {
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const lengthSquared = dx * dx + dz * dz;
        const projection = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / lengthSquared));
        const nearestX = a.x + projection * dx;
        const nearestZ = a.z + projection * dz;
        const distance = (x - nearestX) ** 2 + (z - nearestZ) ** 2;

        if (distance < closestDistance) {
          closestDistance = distance;
          closestHalfWidth = halfWidth;
        }
      });
      return { dist: Math.sqrt(closestDistance), halfWidth: closestHalfWidth };
    }
  };
}

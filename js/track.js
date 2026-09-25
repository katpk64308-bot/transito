import {
  finalPts, finishPoint, phase2FinishPoint, outerPts, ROAD_W_MAIN, ROAD_W_OUTER,
  ROAD_W_SHORT, shortcutPts, startPts, trainPts
} from './config.js';

function sampleCurve(points, divisions, closed = false) {
  const vectors = points.map(point => new THREE.Vector3(point[0], 0, point[1]));
  const curve = new THREE.CatmullRomCurve3(vectors, closed, 'catmullrom', .5);
  return curve.getPoints(divisions);
}

function buildRoad(samples, width, material, dashed) {
  const group = new THREE.Group();

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
      indices.push(
        current, nextPair, current + 1,
        current + 1, nextPair, nextPair + 1
      );
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const roadMesh = new THREE.Mesh(geometry, material);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);

  const sidewalkMaterial =
    new THREE.MeshLambertMaterial({ color: 0x858585 });

  const curbMaterial =
    new THREE.MeshLambertMaterial({ color: 0xd5aa32 });

  sidewalkMaterial.side = THREE.DoubleSide;
  curbMaterial.side = THREE.DoubleSide;

  const sidewalkWidth = Math.min(width * .25, 4.5);
  const curbWidth = .55;

  function addRoadSide(
    sideSign,
    innerDistance,
    outerDistance,
    sideMaterial
  ) {
    const sideVertices = [];
    const sideIndices = [];

    samples.forEach((point, index) => {
      const previous = samples[Math.max(0, index - 1)];
      const next = samples[Math.min(samples.length - 1, index + 1)];

      const tangentX = next.x - previous.x;
      const tangentZ = next.z - previous.z;

      const length =
        Math.hypot(tangentX, tangentZ) || 1;

      const normalX =
        -tangentZ / length;

      const normalZ =
        tangentX / length;

      sideVertices.push(
        point.x +
          normalX *
          innerDistance *
          sideSign,
        .08,
        point.z +
          normalZ *
          innerDistance *
          sideSign,

        point.x +
          normalX *
          outerDistance *
          sideSign,
        .08,
        point.z +
          normalZ *
          outerDistance *
          sideSign
      );

      if (index < samples.length - 1) {
        const current = index * 2;
        const nextPair = (index + 1) * 2;

        sideIndices.push(
          current,
          nextPair,
          current + 1,
          current + 1,
          nextPair,
          nextPair + 1
        );
      }
    });

    const sideGeometry =
      new THREE.BufferGeometry();

    sideGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        sideVertices,
        3
      )
    );

    sideGeometry.setIndex(sideIndices);
    sideGeometry.computeVertexNormals();

    const sideMesh =
      new THREE.Mesh(
        sideGeometry,
        sideMaterial
      );

    sideMesh.receiveShadow = true;
    group.add(sideMesh);
  }

  [1, -1].forEach(side => {
    addRoadSide(
      side,
      halfWidth + .05,
      halfWidth + curbWidth,
      curbMaterial
    );

    addRoadSide(
      side,
      halfWidth + curbWidth,
      halfWidth +
        curbWidth +
        sidewalkWidth,
      sidewalkMaterial
    );
  });

  if (dashed) {
    const lineGeometry =
      new THREE.BufferGeometry().setFromPoints(
        samples.map(
          point =>
            new THREE.Vector3(
              point.x,
              .24,
              point.z
            )
        )
      );

    const lineMaterial =
      new THREE.LineDashedMaterial({
        color: 0xf2e9d0,
        dashSize: 5,
        gapSize: 4,
        scale: 1
      });

    const centerLine =
      new THREE.Line(
        lineGeometry,
        lineMaterial
      );

    centerLine.computeLineDistances();
    group.add(centerLine);
  }

  return group;
}

function createCheckerTexture() {
  const canvas =
    document.createElement('canvas');

  canvas.width =
    canvas.height =
    64;

  const context =
    canvas.getContext('2d');

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      context.fillStyle =
        (x + y) % 2
          ? '#f5f5f5'
          : '#111';

      context.fillRect(
        x * 8,
        y * 8,
        8,
        8
      );
    }
  }

  return new THREE.CanvasTexture(canvas);
}

function buildRailway(samples) {
  const railway =
    new THREE.Group();

  const railMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x303238
    });

  const sleeperMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x62442f
    });

  const railWidth = 1.8;

  for (
    let i = 0;
    i < samples.length - 1;
    i++
  ) {
    const a = samples[i];
    const b = samples[i + 1];

    const dx = b.x - a.x;
    const dz = b.z - a.z;

    const length =
      Math.hypot(dx, dz) || 1;

    const heading =
      Math.atan2(dx, dz);

    const normalX =
      -dz / length;

    const normalZ =
      dx / length;

    const centerX =
      (a.x + b.x) / 2;

    const centerZ =
      (a.z + b.z) / 2;

    for (const side of [-1, 1]) {
      const rail =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            .28,
            .22,
            length
          ),
          railMaterial
        );

      rail.position.set(
        centerX +
          normalX *
          railWidth *
          side,
        .22,
        centerZ +
          normalZ *
          railWidth *
          side
      );

      rail.rotation.y =
        heading;

      rail.receiveShadow = true;
      railway.add(rail);
    }

    if (i % 3 === 0) {
      const sleeper =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            5.2,
            .16,
            .65
          ),
          sleeperMaterial
        );

      sleeper.position.set(
        centerX,
        .13,
        centerZ
      );

      sleeper.rotation.y =
        heading;

      sleeper.receiveShadow = true;
      railway.add(sleeper);
    }
  }

  return railway;
}

function createRailwaySignals(
  scene,
  roads,
  trainRoute
) {
  const crossings = [];

  // Segundos de antecedência com que o sinal fecha antes
  // da locomotiva chegar ao cruzamento.
  const SIGNAL_WARNING_SECONDS = 9;

  // Folga em segundos depois que o ÚLTIMO vagão sai do cruzamento.
  const SIGNAL_CLEARANCE_SECONDS = 2;

  // Distância acumulada ao longo da rota do trem.
  // É o mesmo cálculo do Train.js, que descarta o último
  // ponto (duplicado, porque a curva é fechada).
  const routePoints =
    trainRoute.slice(
      0,
      trainRoute.length - 1
    );

  const routeCumDist = [0];

  for (let i = 1; i < routePoints.length; i++) {
    routeCumDist[i] =
      routeCumDist[i - 1] +
      routePoints[i - 1].distanceTo(
        routePoints[i]
      );
  }

  roads.forEach(({ samples, width }) => {
    samples.forEach((point, index) => {
      let closestTrainPoint = null;
      let closestTrainIndex = 0;
      let closestDistance = Infinity;

      trainRoute.forEach(
        (trainPoint, trainIndex) => {
          const distance =
            Math.hypot(
              point.x - trainPoint.x,
              point.z - trainPoint.z
            );

          if (
            distance <
            closestDistance
          ) {
            closestDistance =
              distance;

            closestTrainPoint =
              trainPoint;

            closestTrainIndex =
              trainIndex;
          }
        }
      );

      if (
        closestDistance > 10 ||
        crossings.some(crossing =>
          Math.hypot(
            crossing.x - point.x,
            crossing.z - point.z
          ) < 18
        )
      ) {
        return;
      }

      const previous =
        samples[
          Math.max(0, index - 1)
        ];

      const next =
        samples[
          Math.min(
            samples.length - 1,
            index + 1
          )
        ];

      const tangentX =
        next.x - previous.x;

      const tangentZ =
        next.z - previous.z;

      const length =
        Math.hypot(
          tangentX,
          tangentZ
        ) || 1;

      const normalX =
        -tangentZ / length;

      const normalZ =
        tangentX / length;

      const signal = {
        x: closestTrainPoint.x,
        z: closestTrainPoint.z,
        trainIndex: closestTrainIndex,

        // Posição do cruzamento medida ao longo da rota
        // (mesma escala do distanceTraveled do trem).
        distance:
          routeCumDist[
            closestTrainIndex %
            routePoints.length
          ],

        red: false
      };

      [-1, 1].forEach(side => {
        const pole =
          new THREE.Group();

        pole.position.set(
          signal.x +
            normalX *
            side *
            (width / 2 + 2.5),

          0,

          signal.z +
            normalZ *
            side *
            (width / 2 + 2.5)
        );

        const roadHeading =
          Math.atan2(
            tangentX,
            tangentZ
          );

        // Corrigido: semáforo girado 180°
        pole.rotation.y =
          roadHeading +
          (side < 0 ? Math.PI : 0) +
          Math.PI;

        const poleMesh =
          new THREE.Mesh(
            new THREE.CylinderGeometry(
              .12,
              .16,
              3.8,
              8
            ),
            new THREE.MeshLambertMaterial({
              color: 0x20242a
            })
          );

        poleMesh.position.y = 1.9;
        pole.add(poleMesh);

        const housing =
          new THREE.Mesh(
            new THREE.BoxGeometry(
              .7,
              1.15,
              .42
            ),
            new THREE.MeshLambertMaterial({
              color: 0x17191d
            })
          );

        housing.position.y = 3.55;
        pole.add(housing);

        const redMaterial =
          new THREE.MeshLambertMaterial({
            color: 0x3b1111,
            emissive: 0x000000
          });

        const greenMaterial =
          new THREE.MeshLambertMaterial({
            color: 0x123d1d,
            emissive: 0x000000
          });

        const redLight =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              .22,
              12,
              8
            ),
            redMaterial
          );

        redLight.position.set(
          0,
          3.82,
          .25
        );

        pole.add(redLight);

        const greenLight =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              .22,
              12,
              8
            ),
            greenMaterial
          );

        greenLight.position.set(
          0,
          3.28,
          .25
        );

        pole.add(greenLight);

        pole.userData.redMaterial =
          redMaterial;

        pole.userData.greenMaterial =
          greenMaterial;

        signal.poles =
          signal.poles || [];

        signal.poles.push(pole);

        scene.add(pole);
      });

      crossings.push(signal);
    });
  });

  return {
    update(trainState) {
      const {
        distanceTraveled,
        totalLength,
        speed,
        trainLength
      } = trainState;

      crossings.forEach(
        crossing => {
          // Distância que a locomotiva ainda precisa andar
          // até chegar ao cruzamento.
          const distanceToCrossing =
            (
              crossing.distance -
              distanceTraveled +
              totalLength
            ) % totalLength;

          // Distância que a locomotiva já passou do cruzamento.
          const distanceSinceCrossing =
            (
              distanceTraveled -
              crossing.distance +
              totalLength
            ) % totalLength;

          // Trem se aproximando: fecha o sinal com antecedência.
          const approaching =
            distanceToCrossing <=
            speed * SIGNAL_WARNING_SECONDS;

          // Trem passando: continua vermelho até o último
          // vagão sair, mais uma pequena folga.
          const crossingNow =
            distanceSinceCrossing <=
            trainLength +
            speed * SIGNAL_CLEARANCE_SECONDS;

          crossing.red =
            approaching ||
            crossingNow;

          crossing.poles.forEach(
            pole => {
              pole.userData.redMaterial.color.set(
                crossing.red
                  ? 0xff2020
                  : 0x3b1111
              );

              pole.userData.redMaterial.emissive.set(
                crossing.red
                  ? 0xff0000
                  : 0x000000
              );

              pole.userData.redMaterial.emissiveIntensity =
                crossing.red
                  ? 1.6
                  : 0;

              pole.userData.redMaterial.needsUpdate =
                true;

              pole.userData.greenMaterial.color.set(
                crossing.red
                  ? 0x123d1d
                  : 0x32e66a
              );

              pole.userData.greenMaterial.emissive.set(
                crossing.red
                  ? 0x000000
                  : 0x18c957
              );

              pole.userData.greenMaterial.emissiveIntensity =
                crossing.red
                  ? 0
                  : 1.2;

              pole.userData.greenMaterial.needsUpdate =
                true;
            }
          );
        }
      );
    },

    getStates() {
      return crossings;
    }
  };
}

const ROAD_DETECTION_MARGIN = 8;

export function createTrack(scene, phase = 1) {
  const finishTarget = phase === 2 ? phase2FinishPoint : finishPoint;
  const samples = {
    start: sampleCurve(
      startPts,
      100
    ),

    outer: sampleCurve(
      outerPts,
      180
    ),

    shortcut: sampleCurve(
      shortcutPts,
      100
    ),

    final: sampleCurve(
      finalPts,
      100
    ),

    train: sampleCurve(
      trainPts,
      180,
      true
    )
  };

  const roadMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x35363b
    });

  const shortcutMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x3d3a34
    });

  scene.add(
    buildRoad(
      samples.start,
      ROAD_W_MAIN,
      roadMaterial,
      true
    ),

    buildRoad(
      samples.outer,
      ROAD_W_OUTER,
      roadMaterial,
      true
    ),

    buildRoad(
      samples.shortcut,
      ROAD_W_SHORT,
      shortcutMaterial,
      false
    ),

    buildRoad(
      samples.final,
      ROAD_W_MAIN,
      roadMaterial,
      true
    )
  );

  scene.add(
    buildRailway(
      samples.train
    )
  );

  const railwaySignals =
    createRailwaySignals(
      scene,
      [
        {
          samples: samples.start,
          width: ROAD_W_MAIN
        },

        {
          samples: samples.outer,
          width: ROAD_W_OUTER
        },

        {
          samples: samples.shortcut,
          width: ROAD_W_SHORT
        },

        {
          samples: samples.final,
          width: ROAD_W_MAIN
        }
      ],
      samples.train
    );

  const roadSegments = [];

  [
    [
      samples.start,
      ROAD_W_MAIN,
      false
    ],

    [
      samples.outer,
      ROAD_W_OUTER,
      false
    ],

    [
      samples.shortcut,
      ROAD_W_SHORT,
      true
    ],

    [
      samples.final,
      ROAD_W_MAIN,
      false
    ]
  ].forEach(
    ([road, width, oneWay]) => {
      for (
        let i = 0;
        i < road.length - 1;
        i++
      ) {
        roadSegments.push({
          a: road[i],
          b: road[i + 1],
          halfWidth: width / 2,
          oneWay
        });
      }
    }
  );

  const finish =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        phase === 2 ? ROAD_W_OUTER : ROAD_W_MAIN,
        4
      ),
      new THREE.MeshBasicMaterial({
        map: createCheckerTexture()
      })
    );

  finish.rotation.x =
    -Math.PI / 2;

  const finishRoad = phase === 2 ? samples.outer : samples.final;
  let finishX = finishTarget[0];
  let finishZ = finishTarget[1];
  let finishTangentX = 0;
  let finishTangentZ = 1;
  let nearestFinishDistance = Infinity;
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
    const distance = Math.hypot(
      projectedX - finishTarget[0],
      projectedZ - finishTarget[1]
    );
    if (distance < nearestFinishDistance) {
      nearestFinishDistance = distance;
      finishTangentX = segmentX;
      finishTangentZ = segmentZ;
      if (phase === 2) {
        finishX = projectedX;
        finishZ = projectedZ;
      }
    }
  }

  const finishHeading = Math.atan2(finishTangentX, finishTangentZ);
  finish.position.set(finishX, .16, finishZ);
  // PlaneGeometry is built in XY. Rotate it inside its own plane first,
  // then lay it flat; Z rotation aligns its width across the road.
  finish.rotation.set(-Math.PI / 2, 0, finishHeading);

  scene.add(finish);

  const flagPole =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        .15,
        .15,
        7,
        8
      ),
      new THREE.MeshLambertMaterial({
        color: 0x222222
      })
    );

  const finishTangentLength = Math.hypot(finishTangentX, finishTangentZ) || 1;
  const finishNormalX = -finishTangentZ / finishTangentLength;
  const finishNormalZ = finishTangentX / finishTangentLength;
  const finishSide = phase === 2 ? -1 : 1;

  flagPole.position.set(
    phase === 2
      ? finishX + finishNormalX * finishSide * (ROAD_W_OUTER / 2 + 1)
      : finishTarget[0] + 6,
    3.5,
    phase === 2
      ? finishZ + finishNormalZ * finishSide * (ROAD_W_OUTER / 2 + 1)
      : finishTarget[1]
  );

  flagPole.castShadow = true;
  scene.add(flagPole);

  const flag =
    new THREE.Mesh(
      new THREE.PlaneGeometry(
        3,
        2
      ),
      new THREE.MeshBasicMaterial({
        color: 0x111111,
        side: THREE.DoubleSide
      })
    );

  flag.position.set(
    phase === 2
      ? finishX + finishNormalX * finishSide * (ROAD_W_OUTER / 2 + 1.5)
      : finishTarget[0] + 7.5,
    6,
    phase === 2
      ? finishZ + finishNormalZ * finishSide * (ROAD_W_OUTER / 2 + 1.5)
      : finishTarget[1]
  );
  if (phase === 2) flag.rotation.y = finishHeading;

  scene.add(flag);

  return {
    samples,
    finishPosition: { x: finishX, z: finishZ },

    updateRailwaySignals:
      railwaySignals.update,

    getRailwaySignalStates:
      railwaySignals.getStates,

    distanceToRoad(x, z) {
      let closestDistance =
        Infinity;

      let closestHalfWidth = 5;

      roadSegments.forEach(
        ({ a, b, halfWidth }) => {
          const dx =
            b.x - a.x;

          const dz =
            b.z - a.z;

          const lengthSquared =
            dx * dx +
            dz * dz;

          const projection =
            Math.max(
              0,
              Math.min(
                1,
                (
                  (x - a.x) * dx +
                  (z - a.z) * dz
                ) /
                lengthSquared
              )
            );

          const nearestX =
            a.x +
            projection * dx;

          const nearestZ =
            a.z +
            projection * dz;

          const distance =
            (x - nearestX) ** 2 +
            (z - nearestZ) ** 2;

          if (
            distance <
            closestDistance
          ) {
            closestDistance =
              distance;

            closestHalfWidth =
              halfWidth;
          }
        }
      );

      return {
        dist:
          Math.sqrt(
            closestDistance
          ),

        halfWidth:
          closestHalfWidth
      };
    },

    drivingSideAt(x, z) {
      let closestDistance =
        Infinity;

      let closestSegment = null;
      let prioritySegment = null;

      roadSegments.forEach(
        segment => {
          const dx =
            segment.b.x -
            segment.a.x;

          const dz =
            segment.b.z -
            segment.a.z;

          const lengthSquared =
            dx * dx +
            dz * dz ||
            1;

          const projection =
            Math.max(
              0,
              Math.min(
                1,
                (
                  (x - segment.a.x) *
                    dx +
                  (z - segment.a.z) *
                    dz
                ) /
                lengthSquared
              )
            );

          const nearestX =
            segment.a.x +
            projection * dx;

          const nearestZ =
            segment.a.z +
            projection * dz;

          const distance =
            (x - nearestX) ** 2 +
            (z - nearestZ) ** 2;

          if (
            segment.oneWay &&
            distance <=
              (
                segment.halfWidth +
                ROAD_DETECTION_MARGIN
              ) ** 2
          ) {
            if (
              !prioritySegment ||
              distance <
                prioritySegment.distanceSquared
            ) {
              const length =
                Math.sqrt(
                  lengthSquared
                );

              prioritySegment = {
                tangentX:
                  dx / length,

                tangentZ:
                  dz / length,

                offset:
                  (
                    (x - nearestX) *
                      (-dz) +
                    (z - nearestZ) *
                      dx
                  ) / length,

                distance:
                  Math.sqrt(distance),

                distanceSquared:
                  distance,

                halfWidth:
                  segment.halfWidth,

                roadMargin:
                  ROAD_DETECTION_MARGIN,

                oneWay: true
              };
            }
          }

          if (
            distance <
            closestDistance
          ) {
            closestDistance =
              distance;

            const length =
              Math.sqrt(
                lengthSquared
              );

            closestSegment = {
              tangentX:
                dx / length,

              tangentZ:
                dz / length,

              offset:
                (
                  (x - nearestX) *
                    (-dz) +
                  (z - nearestZ) *
                    dx
                ) / length,

              distance:
                Math.sqrt(distance),

              halfWidth:
                segment.halfWidth,

              roadMargin:
                ROAD_DETECTION_MARGIN,

              oneWay:
                segment.oneWay
            };
          }
        }
      );

      if (prioritySegment) {
        delete prioritySegment.distanceSquared;
      }

      return (
        prioritySegment ||
        closestSegment
      );
    }
  };
}

const THREE = window.THREE;

/* =========================================================
   CONFIGURAÇÃO DOS MODELOS 3D
========================================================= */

// Ajuste esta pasta para o local onde você colocou os .glb
// extraídos do Modular_Train_Pack-glb.zip. Os nomes de arquivo
// abaixo são EXATAMENTE os nomes originais do pacote (com espaços).
const TRAIN_MODEL_PATH =
  'modelo/Train/Locomotive Front by Quaternius - WY84FHug9s.glb';

const WAGON_MODEL_PATH =
  'modelo/Train/Locomotive Wagon.glb';


/* =========================================================
   CONFIGURAÇÃO DO TREM
========================================================= */

// Comprimento da locomotiva
const TRAIN_MODEL_LENGTH = 15;

// Largura da locomotiva
const TRAIN_MODEL_WIDTH = 3.6;

// Altura da locomotiva
const TRAIN_MODEL_HEIGHT = 5;


// Comprimento dos vagões
const WAGON_MODEL_LENGTH = 15;

// Largura dos vagões
const WAGON_MODEL_WIDTH = 3.6;

// Altura dos vagões
const WAGON_MODEL_HEIGHT = 5;


/*
   VÃO LIVRE ENTRE OS VEÍCULOS.

   Este valor representa o espaço REAL entre:
   - locomotiva e primeiro vagão
   - primeiro vagão e segundo vagão
   - segundo vagão e terceiro vagão
   - etc.

   Aumente este valor para separar mais.
*/
const WAGON_COUPLING_GAP = 0.2;


/*
   ESCALA UNIFORME.

   true  = mantém a proporção original do modelo
           (usa apenas o comprimento como referência,
           largura/altura são calculadas automaticamente).
           Evita que o modelo fique esmagado/deformado.

   false = força largura e altura exatas definidas acima
           (pode distorcer modelos com proporções diferentes
           das do modelo original usado para calibrar esses
           números).
*/
const UNIFORM_SCALE_MODELS = true;


// Quantidade de vagões
const WAGON_COUNT = 14;


/* =========================================================
   ROTAÇÃO DOS MODELOS
========================================================= */

const TRAIN_MODEL_ROTATION_OFFSET = Math.PI / 2;

const WAGON_MODEL_ROTATION_OFFSET = Math.PI / 2;


/* =========================================================
   OBJETO ESPECÍFICO DO VAGÃO
========================================================= */

/*
   null = utiliza o modelo inteiro.
*/
const WAGON_MODEL_NODE_NAME = null;


/* =========================================================
   COR DOS VAGÕES
========================================================= */

/*
   false = mantém as cores originais do GLB.
   true  = aplica WAGON_TINT_COLOR.
*/

const USE_WAGON_TINT = false;

const WAGON_TINT_COLOR = 0x9e2525;


/* =========================================================
   CONFIGURAÇÃO DOS MATERIAIS
========================================================= */

/*
   Brilho da locomotiva.
*/
const TRAIN_BRIGHTNESS = 1.0;


/*
   Pequeno aumento no brilho dos vagões.

   1.0 = original
   1.15 = ligeiramente mais claro
   1.3 = mais claro
*/
const WAGON_BRIGHTNESS = 1.15;


/*
   Limita o metalness.

   Materiais com metalness muito alto podem
   ficar quase pretos quando não existe
   environment map/HDRI na cena.
*/
const MAX_METALNESS = 0.25;


/*
   Evita roughness muito baixa.
*/
const MIN_ROUGHNESS = 0.55;


/*
   Os vagões não recebem sombras.

   Isso evita que 14 vagões em sequência
   fiquem excessivamente escuros.
*/
const WAGON_RECEIVE_SHADOW = false;


/* =========================================================
   CACHE DOS MODELOS
========================================================= */

let trainModelCache = null;

let wagonModelCache = null;


/* =========================================================
   CLONAR MODELO
========================================================= */

function cloneModel(model) {

  const clone =
    model.clone(true);

  clone.traverse(object => {

    if (!object.isMesh) {
      return;
    }

    object.castShadow = true;

    object.receiveShadow = true;


    if (!object.material) {
      return;
    }


    const materials =
      Array.isArray(object.material)
        ? object.material
        : [object.material];


    /*
       Clona os materiais.

       Isso é importante porque existem
       vários vagões independentes.
    */

    const clonedMaterials =
      materials.map(material => {

        if (!material) {
          return material;
        }

        const newMaterial =
          material.clone();

        newMaterial.side =
          THREE.DoubleSide;

        newMaterial.needsUpdate =
          true;

        return newMaterial;
      });


    object.material =
      clonedMaterials.length === 1
        ? clonedMaterials[0]
        : clonedMaterials;

  });


  return clone;
}


/* =========================================================
   APLICAR COR
========================================================= */

function applyModelTint(
  model,
  color
) {

  model.traverse(object => {

    if (
      !object.isMesh ||
      !object.material
    ) {
      return;
    }


    const materials =
      Array.isArray(object.material)
        ? object.material
        : [object.material];


    materials.forEach(material => {

      if (
        !material ||
        !material.color
      ) {
        return;
      }


      material.color.setHex(
        color
      );

      material.needsUpdate =
        true;

    });

  });
}


/* =========================================================
   NORMALIZAR MATERIAIS
========================================================= */

function normalizeMaterials(
  model,
  options = {}
) {

  const brightness =
    options.brightness ?? 1;


  const receiveShadow =
    options.receiveShadow ?? true;


  model.traverse(object => {


    /* =====================================================
       DESATIVAR LUZES DO GLB
    ===================================================== */

    if (object.isLight) {

      object.visible = false;

      object.intensity = 0;

      return;
    }


    if (
      !object.isMesh ||
      !object.material
    ) {
      return;
    }


    /* =====================================================
       SOMBRAS
    ===================================================== */

    object.castShadow = true;

    object.receiveShadow =
      receiveShadow;


    /* =====================================================
       MATERIAIS
    ===================================================== */

    const materials =
      Array.isArray(object.material)
        ? object.material
        : [object.material];


    materials.forEach(material => {

      if (!material) {
        return;
      }


      /*
         Permite visualizar corretamente
         as faces do modelo.
      */

      material.side =
        THREE.DoubleSide;


      /* ===================================================
         METALNESS
      =================================================== */

      if (
        material.metalness !== undefined
      ) {

        material.metalness =
          Math.min(
            material.metalness,
            MAX_METALNESS
          );
      }


      /* ===================================================
         ROUGHNESS
      =================================================== */

      if (
        material.roughness !== undefined
      ) {

        material.roughness =
          Math.max(
            material.roughness,
            MIN_ROUGHNESS
          );
      }


      /* ===================================================
         ENVIRONMENT MAP
      =================================================== */

      if (
        material.envMapIntensity !== undefined
      ) {

        material.envMapIntensity =
          1;
      }


      /* ===================================================
         EMISSIVE
      =================================================== */

      /*
         Não apagamos o emissive original.

         Apenas diminuímos valores exagerados.
      */

      if (
        material.emissiveIntensity !==
        undefined
      ) {

        if (
          material.emissiveIntensity >
          1.5
        ) {

          material.emissiveIntensity =
            1;
        }
      }


      /* ===================================================
         BRILHO DA COR BASE
      =================================================== */

      if (
        material.color &&
        brightness !== 1
      ) {

        material.color.multiplyScalar(
          brightness
        );


        /*
           Impede que RGB passe de 1.
        */

        material.color.r =
          Math.min(
            material.color.r,
            1
          );

        material.color.g =
          Math.min(
            material.color.g,
            1
          );

        material.color.b =
          Math.min(
            material.color.b,
            1
          );
      }


      material.needsUpdate =
        true;

    });

  });
}


/* =========================================================
   PREPARAR MODELO 3D
========================================================= */

function prepareModel(
  model,
  targetLength,
  targetWidth = null,
  targetHeight = null,
  rotationOffset = 0,
  materialOptions = {}
) {

  const pivot =
    new THREE.Group();


  /* =====================================================
     LIMPAR TRANSFORMAÇÕES ORIGINAIS
  ===================================================== */

  model.rotation.set(
    0,
    rotationOffset,
    0
  );


  model.scale.set(
    1,
    1,
    1
  );


  model.position.set(
    0,
    0,
    0
  );


  model.updateMatrixWorld(
    true
  );


  /* =====================================================
     MEDIR MODELO ORIGINAL
  ===================================================== */

  const originalBox =
    new THREE.Box3()
      .setFromObject(model);


  const originalSize =
    originalBox.getSize(
      new THREE.Vector3()
    );


  /* =====================================================
     ESCALA INDEPENDENTE
  ===================================================== */

  const scaleZ =
    targetLength /
    (originalSize.z || 1);


  const scaleX =
    targetWidth
      ? targetWidth /
        (originalSize.x || 1)
      : scaleZ;


  const scaleY =
    targetHeight
      ? targetHeight /
        (originalSize.y || 1)
      : scaleZ;


  model.scale.set(
    scaleX,
    scaleY,
    scaleZ
  );


  model.updateMatrixWorld(
    true
  );


  /* =====================================================
     MEDIR DEPOIS DA ESCALA
  ===================================================== */

  const finalBox =
    new THREE.Box3()
      .setFromObject(model);


  const center =
    finalBox.getCenter(
      new THREE.Vector3()
    );


  /* =====================================================
     CENTRALIZAR X E Z
  ===================================================== */

  model.position.x -=
    center.x;


  model.position.z -=
    center.z;


  /* =====================================================
     COLOCAR NO CHÃO
  ===================================================== */

  model.position.y -=
    finalBox.min.y;


  /* =====================================================
     NORMALIZAR MATERIAIS
  ===================================================== */

  normalizeMaterials(
    model,
    materialOptions
  );


  /* =====================================================
     COLOCAR MODELO NO PIVÔ
  ===================================================== */

  pivot.add(model);


  return pivot;
}


/* =========================================================
   PEGAR OBJETO ESPECÍFICO DO MODELO
========================================================= */

function extractNode(
  model,
  nodeName
) {

  if (!nodeName) {
    return model;
  }


  const node =
    model.getObjectByName(
      nodeName
    );


  if (!node) {

    console.warn(
      `Objeto "${nodeName}" não encontrado. ` +
      `Usando o modelo inteiro.`
    );


    return model;
  }


  return node;
}


/* =========================================================
   CARREGAR GLB / GLTF
========================================================= */

function loadModel(path) {

  return new Promise(resolve => {


    /* =====================================================
       VERIFICAR GLTFLoader
    ===================================================== */

    if (!THREE.GLTFLoader) {

      console.error(
        'GLTFLoader não encontrado. ' +
        'Verifique se o script do GLTFLoader ' +
        'foi carregado antes deste arquivo.'
      );


      resolve(null);

      return;
    }


    const loader =
      new THREE.GLTFLoader();


    /*
       Nomes de arquivo com espaços (ex: "Cargo Train Front.glb")
       precisam ser codificados na URL, senão o carregamento
       pode falhar silenciosamente em alguns navegadores/servidores.
    */

    const encodedPath =
      encodeURI(path);


    /* =====================================================
       CARREGAR
    ===================================================== */

    loader.load(

      encodedPath,


      /* ===================================================
         SUCESSO
      =================================================== */

      gltf => {

        console.log(
          `Modelo carregado: ${path}`
        );


        resolve(
          gltf.scene
        );
      },


      /* ===================================================
         PROGRESSO
      =================================================== */

      undefined,


      /* ===================================================
         ERRO
      =================================================== */

      error => {

        console.error(
          `Erro ao carregar modelo: ${path} ` +
          `(URL usada: ${encodedPath})`,
          error
        );


        resolve(null);
      }

    );

  });
}


/* =========================================================
   FALLBACK DA LOCOMOTIVA
========================================================= */

function createFallbackLocomotive() {

  const locomotive =
    new THREE.Group();


  const redMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x9e2525
    });


  const darkMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x202329
    });


  const metalMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x777b82
    });


  /* =====================================================
     CORPO
  ===================================================== */

  const body =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        5.6,
        2.8,
        6.1
      ),

      redMaterial
    );


  body.position.y =
    2.15;


  body.castShadow =
    true;


  locomotive.add(body);


  /* =====================================================
     CABINE
  ===================================================== */

  const cabin =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        6.4,
        4.2,
        2.5
      ),

      darkMaterial
    );


  cabin.position.set(
    0,
    3,
    -1.75
  );


  cabin.castShadow =
    true;


  locomotive.add(cabin);


  /* =====================================================
     CHAMINÉ
  ===================================================== */

  const chimney =
    new THREE.Mesh(

      new THREE.CylinderGeometry(
        0.68,
        0.84,
        2.8,
        12
      ),

      metalMaterial
    );


  chimney.position.set(
    0,
    4.75,
    1.55
  );


  chimney.castShadow =
    true;


  locomotive.add(chimney);


  return locomotive;
}


/* =========================================================
   FALLBACK DOS VAGÕES
========================================================= */

function createFallbackWagon() {

  const wagon =
    new THREE.Group();


  const bodyMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x9e2525
    });


  const darkMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x202329
    });


  const windowMaterial =
    new THREE.MeshLambertMaterial({
      color: 0x81c9dc
    });


  /* =====================================================
     CORPO
  ===================================================== */

  const body =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        6.8,
        3.4,
        5.35
      ),

      bodyMaterial
    );


  body.position.y =
    2.35;


  body.castShadow =
    true;


  wagon.add(body);


  /* =====================================================
     TETO
  ===================================================== */

  const roof =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        7.1,
        0.36,
        5.65
      ),

      darkMaterial
    );


  roof.position.y =
    4.15;


  roof.castShadow =
    true;


  wagon.add(roof);


  /* =====================================================
     JANELAS
  ===================================================== */

  for (
    const x of [-3.43, 3.43]
  ) {

    for (
      const z of [-1.55, 0, 1.55]
    ) {

      const window =
        new THREE.Mesh(

          new THREE.BoxGeometry(
            0.08,
            1.12,
            0.92
          ),

          windowMaterial
        );


      window.position.set(
        x,
        2.65,
        z
      );


      window.castShadow =
        true;


      wagon.add(window);
    }
  }


  return wagon;
}


/* =========================================================
   CRIAR TREM
========================================================= */

function createTrain() {

  const train =
    new THREE.Group();


  train.userData.parts =
    [];


  /* =======================================================
     LOCOMOTIVA FALLBACK
  ======================================================= */

  const locomotive =
    createFallbackLocomotive();


  train.userData.parts.push({

    model: locomotive,

    distanceBehind: 0

  });


  train.add(
    locomotive
  );


  /* =======================================================
     VAGÕES FALLBACK
  ======================================================= */

  /*
     A distância é calculada utilizando:

     metade do veículo anterior
     +
     vão livre
     +
     metade do veículo atual

     Dessa forma o vão é exatamente
     WAGON_COUPLING_GAP.
  */

  let cumulativeDistance =
    0;


  let previousHalfLength =
    TRAIN_MODEL_LENGTH / 2;


  for (
    let i = 0;
    i < WAGON_COUNT;
    i++
  ) {

    const wagon =
      createFallbackWagon();


    const wagonHalfLength =
      WAGON_MODEL_LENGTH / 2;


    cumulativeDistance +=
      previousHalfLength +
      WAGON_COUPLING_GAP +
      wagonHalfLength;


    previousHalfLength =
      wagonHalfLength;


    train.userData.parts.push({

      model: wagon,

      distanceBehind:
        cumulativeDistance

    });


    train.add(wagon);
  }


  /* =======================================================
     CARREGAR LOCOMOTIVA REAL
  ======================================================= */

  loadModel(
    TRAIN_MODEL_PATH
  ).then(model => {


    if (!model) {

      console.warn(
        'Locomotiva GLB não carregada. ' +
        'Usando fallback.'
      );


      return;
    }


    trainModelCache =
      model;


    const oldLocomotive =
      train.userData.parts[0].model;


    /* =====================================================
       PREPARAR LOCOMOTIVA REAL
    ===================================================== */

    const realLocomotive =
      prepareModel(

        cloneModel(
          trainModelCache
        ),

        TRAIN_MODEL_LENGTH,

        UNIFORM_SCALE_MODELS
          ? null
          : TRAIN_MODEL_WIDTH,

        UNIFORM_SCALE_MODELS
          ? null
          : TRAIN_MODEL_HEIGHT,

        TRAIN_MODEL_ROTATION_OFFSET,

        {
          brightness:
            TRAIN_BRIGHTNESS,

          receiveShadow:
            true
        }
      );


    /* =====================================================
       MANTER POSIÇÃO
    ===================================================== */

    realLocomotive.position.copy(
      oldLocomotive.position
    );


    realLocomotive.rotation.y =
      oldLocomotive.rotation.y;


    /* =====================================================
       REMOVER FALLBACK
    ===================================================== */

    train.remove(
      oldLocomotive
    );


    /* =====================================================
       ADICIONAR MODELO REAL
    ===================================================== */

    train.add(
      realLocomotive
    );


    /* =====================================================
       ATUALIZAR REFERÊNCIA
    ===================================================== */

    train.userData.parts[0].model =
      realLocomotive;


    console.log(
      'Locomotiva 3D substituída com sucesso.'
    );

  });


  /* =======================================================
     CARREGAR VAGÕES REAIS
  ======================================================= */

  loadModel(
    WAGON_MODEL_PATH
  ).then(model => {


    if (!model) {

      console.warn(
        'Vagão GLB não carregado. ' +
        'Usando fallback.'
      );


      return;
    }


    wagonModelCache =
      model;


    /* =====================================================
       SUBSTITUIR TODOS OS VAGÕES
    ===================================================== */

    for (
      let i = 1;
      i < train.userData.parts.length;
      i++
    ) {

      const part =
        train.userData.parts[i];


      const oldWagon =
        part.model;


      /* ===================================================
         CLONAR MODELO
      =================================================== */

      const clonedModel =
        cloneModel(
          wagonModelCache
        );


      /* ===================================================
         PEGAR NODE
      =================================================== */

      const source =
        extractNode(
          clonedModel,
          WAGON_MODEL_NODE_NAME
        );


      /* ===================================================
         PREPARAR VAGÃO
      =================================================== */

      const realWagon =
        prepareModel(

          source,

          WAGON_MODEL_LENGTH,

          UNIFORM_SCALE_MODELS
            ? null
            : WAGON_MODEL_WIDTH,

          UNIFORM_SCALE_MODELS
            ? null
            : WAGON_MODEL_HEIGHT,

          WAGON_MODEL_ROTATION_OFFSET,

          {
            brightness:
              WAGON_BRIGHTNESS,

            receiveShadow:
              WAGON_RECEIVE_SHADOW
          }
        );


      /* ===================================================
         COR OPCIONAL
      =================================================== */

      if (
        USE_WAGON_TINT
      ) {

        applyModelTint(
          realWagon,
          WAGON_TINT_COLOR
        );
      }


      /* ===================================================
         MANTER POSIÇÃO
      =================================================== */

      realWagon.position.copy(
        oldWagon.position
      );


      realWagon.rotation.y =
        oldWagon.rotation.y;


      /* ===================================================
         REMOVER FALLBACK
      =================================================== */

      train.remove(
        oldWagon
      );


      /* ===================================================
         ADICIONAR MODELO REAL
      =================================================== */

      train.add(
        realWagon
      );


      /* ===================================================
         ATUALIZAR REFERÊNCIA
      =================================================== */

      part.model =
        realWagon;
    }


    console.log(
      `${WAGON_COUNT} vagões 3D carregados com sucesso.`
    );

  });


  return train;
}


/* =========================================================
   ROTA COM DISTÂNCIA REAL ACUMULADA
========================================================= */

function buildRouteDistances(
  points
) {

  const count =
    points.length;


  /*
     cumDist[i] =
     distância acumulada até o ponto i.
  */

  const cumDist =
    new Array(
      count + 1
    );


  cumDist[0] =
    0;


  /* =====================================================
     DISTÂNCIA DOS SEGMENTOS
  ===================================================== */

  for (
    let i = 1;
    i < count;
    i++
  ) {

    cumDist[i] =
      cumDist[i - 1] +
      points[i - 1]
        .distanceTo(
          points[i]
        );
  }


  /* =====================================================
     FECHAR O LAÇO
  ===================================================== */

  cumDist[count] =
    cumDist[count - 1] +
    points[count - 1]
      .distanceTo(
        points[0]
      );


  return cumDist;
}


/* =========================================================
   PEGAR PONTO PELA DISTÂNCIA
========================================================= */

function getPointAtDistance(
  points,
  cumDist,
  distance
) {

  const totalLength =
    cumDist[
      cumDist.length - 1
    ];


  /* =====================================================
     NORMALIZAR DISTÂNCIA
  ===================================================== */

  let d =
    distance %
    totalLength;


  if (d < 0) {
    d += totalLength;
  }


  /* =====================================================
     BUSCA BINÁRIA
  ===================================================== */

  let lo = 0;

  let hi =
    cumDist.length - 1;


  while (
    lo < hi - 1
  ) {

    const mid =
      (lo + hi) >> 1;


    if (
      cumDist[mid] <= d
    ) {

      lo = mid;

    } else {

      hi = mid;
    }
  }


  /* =====================================================
     SEGMENTO
  ===================================================== */

  const segStart =
    cumDist[lo];


  const segEnd =
    cumDist[lo + 1];


  const segLength =
    (segEnd - segStart) ||
    1;


  const blend =
    (d - segStart) /
    segLength;


  const current =
    points[
      lo % points.length
    ];


  const next =
    points[
      (lo + 1) %
      points.length
    ];


  /* =====================================================
     DIREÇÃO
  ===================================================== */

  const tangentX =
    next.x -
    current.x;


  const tangentZ =
    next.z -
    current.z;


  return {

    x:
      current.x +
      tangentX * blend,


    z:
      current.z +
      tangentZ * blend,


    heading:
      Math.atan2(
        tangentX,
        tangentZ
      )

  };
}


/* =========================================================
   TREM DE TRÂNSITO
========================================================= */

export function createTrafficTrain(
  scene,
  track
) {


  /* =====================================================
     PEGAR ROTA
  ===================================================== */

  const rawRoute =
    track.samples.train;


  /* =====================================================
     VERIFICAÇÃO
  ===================================================== */

  if (
    !rawRoute ||
    rawRoute.length < 2
  ) {

    console.error(
      'A rota do trem não foi encontrada.'
    );


    return () => {};
  }


  /* =====================================================
     REMOVER ÚLTIMO PONTO DUPLICADO
  ===================================================== */

  const routePoints =
    rawRoute.slice(
      0,
      rawRoute.length - 1
    );


  /* =====================================================
     CRIAR TREM
  ===================================================== */

  const train =
    createTrain();


  scene.add(
    train
  );


  /* =====================================================
     CALCULAR DISTÂNCIAS
  ===================================================== */

  const cumDist =
    buildRouteDistances(
      routePoints
    );


  const totalLength =
    cumDist[
      cumDist.length - 1
    ];


  /* =====================================================
     POSIÇÃO INICIAL
  ===================================================== */

  let distanceTraveled =
    totalLength * 0.2;


  /* =====================================================
     VELOCIDADE
  ===================================================== */

  const speed =
    22;


  /* =====================================================
     ATUALIZAR TREM
  ===================================================== */

  function update(dt) {


    /* ===================================================
       AVANÇAR
    =================================================== */

    distanceTraveled =
      (
        distanceTraveled +
        speed * dt
      ) %
      totalLength;


    /* ===================================================
       ATUALIZAR CADA PARTE
    =================================================== */

    train.userData.parts.forEach(
      part => {


        /*
           A locomotiva fica na posição
           distanceTraveled.

           Os vagões ficam atrás dela.
        */

        const partDistance =
          distanceTraveled -
          part.distanceBehind;


        /* =================================================
           PEGAR POSIÇÃO NA ROTA
        ================================================= */

        const point =
          getPointAtDistance(

            routePoints,

            cumDist,

            partDistance
          );


        /* =================================================
           POSICIONAR
        ================================================= */

        part.model.position.set(

          point.x,

          0.02,

          point.z

        );


        /* =================================================
           ROTACIONAR
        ================================================= */

        part.model.rotation.y =
          point.heading;

      }
    );
  }


  /* =====================================================
     POSICIONAMENTO INICIAL
  ===================================================== */

  update(0);


  /* =========================================================
     HITBOXES
  ========================================================= */

  update.getHitboxes =
    () => {

      return train.userData.parts.map(
        part => ({

          type:
            'train',

          x:
            part.model.position.x,

          z:
            part.model.position.z,

          radius:
            4.3

        })
      );

    };


  /* =========================================================
     ESTADO DO TREM
  ========================================================= */

  update.getSignalState =
    () => ({

      distanceTraveled,

      totalLength,

      speed

    });


  /* =========================================================
     MINIMAPA
  ========================================================= */

  update.getMinimapState =
    () => {


      const locomotive =
        train.userData.parts[0].model;


      return {

        x:
          locomotive.position.x,

        z:
          locomotive.position.z,

        heading:
          locomotive.rotation.y

      };

    };


  /* =====================================================
     RETORNAR FUNÇÃO DE UPDATE
  ===================================================== */

  return update;
}
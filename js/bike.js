// bike.js
// ---------------------------------------------------------------------------
// MOTO 3D - Rota Zero: Missão Segura
// Carrega a moto 3D em formato GLB.
// Somente este arquivo precisa ser alterado.
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// CONFIGURAÇÕES
// ---------------------------------------------------------------------------

// O arquivo está em:
// transito-main/
// ├── index.html
// ├── assets/
// │   └── models/
// │       └── cyberpunk_bike.glb
// └── js/
//     └── bike.js

const MODEL_URL = "modelo/modelo_bike/scene.gltf";


// Comprimento aproximado da moto dentro do jogo
const TARGET_LENGTH = 3.8;


// Rotação da moto.
// Se ela aparecer andando de costas, troque para 0.
const MODEL_ROTATION_Y = Math.PI / 2;


// ---------------------------------------------------------------------------
// GLTFLOADER
// ---------------------------------------------------------------------------

let loaderPromise = null;

function carregarGLTFLoader() {

    // Se já estiver carregado
    if (window.THREE && THREE.GLTFLoader) {
        return Promise.resolve();
    }

    // Se já estiver carregando
    if (loaderPromise) {
        return loaderPromise;
    }

    loaderPromise = new Promise((resolve, reject) => {

        const script = document.createElement("script");

        script.src =
            "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js";

        script.onload = () => {

            console.log(
                "[bike.js] GLTFLoader carregado."
            );

            if (THREE.GLTFLoader) {
                resolve();
            } else {
                reject(
                    new Error(
                        "GLTFLoader não foi encontrado depois do carregamento."
                    )
                );
            }
        };

        script.onerror = () => {

            reject(
                new Error(
                    "Não foi possível carregar o GLTFLoader."
                )
            );

        };

        document.head.appendChild(script);
    });

    return loaderPromise;
}


// ---------------------------------------------------------------------------
// BUILD BIKE
// ---------------------------------------------------------------------------

export function buildBike() {

    // -----------------------------------------------------------------------
    // GRUPO PRINCIPAL
    // -----------------------------------------------------------------------

    // Este é o grupo que o restante do jogo movimenta.
    const group = new THREE.Group();

    group.name = "ElectricBike";


    // Grupo onde o modelo 3D será colocado.
    const modelHolder = new THREE.Group();

    modelHolder.name = "BikeModel";

    group.add(modelHolder);


    // -----------------------------------------------------------------------
    // RODAS
    // -----------------------------------------------------------------------
    // Essas duas propriedades precisam existir porque a física do jogo
    // pode acessá-las.
    // -----------------------------------------------------------------------

    const wheelFront = new THREE.Object3D();
    const wheelBack = new THREE.Object3D();

    wheelFront.name = "wheelFront";
    wheelBack.name = "wheelBack";

    group.add(
        wheelFront,
        wheelBack
    );


    // -----------------------------------------------------------------------
    // MOTO DE EMERGÊNCIA
    // -----------------------------------------------------------------------
    // Caso o GLB não carregue, cria uma moto simples para o jogo não ficar
    // completamente sem veículo.
    // -----------------------------------------------------------------------

    function criarFallback() {

        const moto = new THREE.Group();

        moto.name = "FallbackBike";


        const vermelho =
            new THREE.MeshLambertMaterial({
                color: 0xd62920
            });


        const preto =
            new THREE.MeshLambertMaterial({
                color: 0x151515
            });


        const metal =
            new THREE.MeshLambertMaterial({
                color: 0x777777
            });


        // Corpo
        const corpo =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.65,
                    0.55,
                    1.8
                ),
                vermelho
            );

        corpo.position.set(
            0,
            0.8,
            0
        );

        corpo.castShadow = true;

        moto.add(corpo);


        // Banco
        const banco =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.48,
                    0.2,
                    0.8
                ),
                preto
            );

        banco.position.set(
            0,
            1.1,
            -0.25
        );

        banco.castShadow = true;

        moto.add(banco);


        // Rodas
        function criarRoda(z) {

            const roda =
                new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        0.38,
                        0.38,
                        0.18,
                        16
                    ),
                    preto
                );

            roda.rotation.z =
                Math.PI / 2;

            roda.position.set(
                0,
                0.4,
                z
            );

            roda.castShadow = true;

            moto.add(roda);

            return roda;
        }


        criarRoda(0.9);
        criarRoda(-0.9);


        // Guidão
        const guidao =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.75,
                    0.07,
                    0.07
                ),
                metal
            );

        guidao.position.set(
            0,
            1.35,
            0.85
        );

        guidao.castShadow = true;

        moto.add(guidao);


        // Farol
        const farol =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.11,
                    12,
                    12
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xffffdd
                })
            );

        farol.position.set(
            0,
            1.05,
            1
        );

        moto.add(farol);


        return moto;
    }

    // Exibe uma moto simples imediatamente. Ela só é substituída quando o
    // arquivo externo terminar de carregar com sucesso, evitando que o
    // jogador fique sem veículo durante uma falha ou download lento.
    const fallback = criarFallback();
    modelHolder.add(fallback);

    function manterFallback() {
        if (!modelHolder.children.includes(fallback)) {
            modelHolder.add(fallback);
        }
    }


    // -----------------------------------------------------------------------
    // PREPARAR MODELO
    // -----------------------------------------------------------------------

    function prepararModelo(modelo) {

        console.log(
            "[bike.js] Preparando modelo 3D..."
        );


        // ---------------------------------------------------------------
        // IMPORTANTE
        // ---------------------------------------------------------------
        // O GLB possui uma transformação própria.
        // Primeiro zeramos posição/rotação do objeto raiz.
        // ---------------------------------------------------------------

        modelo.position.set(
            0,
            0,
            0
        );

        modelo.rotation.set(
            0,
            0,
            0
        );


        // Mantemos a escala original do GLB neste momento.


        modelo.updateMatrixWorld(
            true
        );


        // ---------------------------------------------------------------
        // CALCULAR TAMANHO
        // ---------------------------------------------------------------

        let caixa =
            new THREE.Box3().setFromObject(
                modelo
            );


        const tamanho =
            new THREE.Vector3();

        caixa.getSize(
            tamanho
        );


        console.log(
            "[bike.js] Tamanho original:",
            tamanho.x,
            tamanho.y,
            tamanho.z
        );


        // ---------------------------------------------------------------
        // ESCALA AUTOMÁTICA
        // ---------------------------------------------------------------

        const comprimento =
            Math.max(
                tamanho.x,
                tamanho.z
            );


        if (
            comprimento > 0 &&
            isFinite(comprimento)
        ) {

            const escala =
                TARGET_LENGTH /
                comprimento;


            modelo.scale.multiplyScalar(
                escala
            );


            console.log(
                "[bike.js] Escala aplicada:",
                escala
            );
        }


        modelo.updateMatrixWorld(
            true
        );


        // ---------------------------------------------------------------
        // ROTACIONAR
        // ---------------------------------------------------------------

        modelo.rotation.y =
            MODEL_ROTATION_Y;


        modelo.updateMatrixWorld(
            true
        );


        // ---------------------------------------------------------------
        // CENTRALIZAR NOVAMENTE DEPOIS DA ROTAÇÃO
        // ---------------------------------------------------------------

        caixa =
            new THREE.Box3().setFromObject(
                modelo
            );


        const centro =
            new THREE.Vector3();

        caixa.getCenter(
            centro
        );


        // Centraliza X
        modelo.position.x -=
            centro.x;


        // Centraliza Z
        modelo.position.z -=
            centro.z;


        modelo.updateMatrixWorld(
            true
        );


        // ---------------------------------------------------------------
        // COLOCAR NO CHÃO
        // ---------------------------------------------------------------

        caixa =
            new THREE.Box3().setFromObject(
                modelo
            );


        modelo.position.y -=
            caixa.min.y;


        // Pequeno espaço para não ficar enterrada no chão
        modelo.position.y +=
            0.03;


        // ---------------------------------------------------------------
        // SOMBRAS
        // ---------------------------------------------------------------

        modelo.traverse(
            function (objeto) {

                if (
                    objeto.isMesh
                ) {

                    objeto.castShadow =
                        true;

                    objeto.receiveShadow =
                        true;


                    // Mantém os materiais originais
                    // do modelo.
                    if (
                        objeto.material
                    ) {

                        objeto.material.side =
                            THREE.FrontSide;
                    }
                }

            }
        );


        modelo.updateMatrixWorld(
            true
        );


        console.log(
            "[bike.js] Modelo centralizado."
        );

        console.log(
            "[bike.js] Posição final:",
            modelo.position
        );

    }


    // -----------------------------------------------------------------------
    // CARREGAR MODELO
    // -----------------------------------------------------------------------

    carregarGLTFLoader()

        .then(() => {

            console.log(
                "[bike.js] Iniciando carregamento da moto..."
            );

            console.log(
                "[bike.js] Arquivo:",
                MODEL_URL
            );


            const loader =
                new THREE.GLTFLoader();


            loader.load(

                MODEL_URL,


                // -----------------------------------------------------------
                // SUCESSO
                // -----------------------------------------------------------

                function (gltf) {

                    console.log(
                        "[bike.js] MODELO GLB CARREGADO!"
                    );


                    const modelo =
                        gltf.scene ||
                        gltf.scenes[0];


                    if (!modelo) {

                        console.error(
                            "[bike.js] O GLB não possui uma cena."
                        );

                        manterFallback();

                        return;
                    }


                    modelo.name =
                        "CyberpunkElectricBike";


                    prepararModelo(
                        modelo
                    );

                    modelHolder.remove(fallback);
                    modelHolder.add(
                        modelo
                    );


                    console.log(
                        "[bike.js] MOTO 3D ADICIONADA AO JOGO!"
                    );

                },


                // -----------------------------------------------------------
                // PROGRESSO
                // -----------------------------------------------------------

                function (progresso) {

                    if (
                        progresso &&
                        progresso.total
                    ) {

                        const porcentagem =
                            (
                                progresso.loaded /
                                progresso.total
                            ) * 100;


                        console.log(
                            "[bike.js] Carregando:",
                            porcentagem.toFixed(0) + "%"
                        );
                    }

                },


                // -----------------------------------------------------------
                // ERRO
                // -----------------------------------------------------------

                function (erro) {

                    console.error(
                        "================================="
                    );

                    console.error(
                        "[bike.js] ERRO AO CARREGAR A MOTO!"
                    );

                    console.error(
                        erro
                    );

                    console.error(
                        "Arquivo:",
                        MODEL_URL
                    );

                    console.error(
                        "================================="
                    );


                    // Não deixa o jogador sem moto.
                    manterFallback();

                }

            );

        })


        .catch(
            function (erro) {

                console.error(
                    "[bike.js] ERRO NO GLTFLoader:",
                    erro
                );


                manterFallback();

            }
        );


    // -----------------------------------------------------------------------
    // RETORNAR INTERFACE
    // -----------------------------------------------------------------------

    return {

        group,

        wheelFront,

        wheelBack

    };

}

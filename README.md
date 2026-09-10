# Como adicionar modelos e colisões

Os modelos ficam na pasta `modelo` e são configurados em `js/modelos.js`.

O sistema aceita `.fbx` e `.obj`. Um OBJ pode usar um arquivo `.mtl` opcional para carregar materiais:

```js
predio: {
  file: 'modelo/predio.obj',
  mtl: 'modelo/predio.mtl',
  position: { x: 120, y: 0, z: 80 },
  scale: { x: 1, y: 1, z: 1 },
  rotation: { x: 0, y: 0, z: 0 },
  collision: {
    enabled: true,
    size: { x: 30, z: 25 },
    offset: { x: 0, z: 0 }
  }
}
```

Arquivos `.max` não são carregados diretamente pelo navegador. Abra-os no 3ds Max e exporte como `.obj`, `.fbx` ou `.glb`.

## Adicionando um prédio

Coloque `predio.fbx` dentro da pasta `modelo` e acrescente uma entrada em `MODEL_CONFIG`:

```js
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
```

`position` define o ponto do modelo no mundo. `scale` define o tamanho. A rotação usa radianos; para girar 90 graus, use `Math.PI / 2`.

## Configurando a colisão

`size.x` e `size.z` são a largura e a profundidade da caixa invisível que bloqueia a moto. Ajuste esses valores para cobrir a construção. A caixa acompanha automaticamente o `rotation.y` do modelo.

`offset` move somente a caixa de colisão em relação ao centro do modelo. A colisão é retangular e não depende da geometria interna do FBX.

Para deixar um modelo atravessável:

```js
collision: { enabled: false }
```

Quando a moto encosta na caixa, ela para e não atravessa o modelo.

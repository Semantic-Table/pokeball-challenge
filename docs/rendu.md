# Pipeline visuel

Direction artistique cosy / vitrine de Centre Pokémon. La scène est composée d'un **dais flottant blanc**, d'un **socle indigo** sur lequel repose une **cage ouverte** (4 poteaux chromés + 8 arêtes néon), le tout éclairé et reflété par un **HDR équirectangulaire** de Centre Pokémon.

## Environment — HDR Centre Pokémon

```jsx
<Environment files="./pokemon_center.hdr" background blur={0.15} />
```

Le fichier `public/pokemon_center.hdr` est lu en équirectangulaire par drei. Il fournit :

- **Le fond visible** (`background` activé)
- **L'IBL** (image-based lighting) qui éclaire indirectement tous les `MeshStandardMaterial` / `MeshPhysicalMaterial`
- **La cubemap de reflets** sur le chrome des poteaux, les balls, la surface réfléchissante du dais

Le `blur={0.15}` lisse légèrement la cubemap pour gommer les artefacts de l'HDR source (peu coûteux, drei utilise un blur séparable).

Conséquence : **plus besoin d'éclairer la scène à la main**. Les lumières directes restantes ne sont là que pour la **direction** (key light) et les **ombres portées** (l'HDR ne projette pas d'ombre).

## Lumières directes

```jsx
<ambientLight intensity={0.18} />
<directionalLight
    position={[6, 9, 5]}
    intensity={0.55}
    color={'#ffe8c7'}
    castShadow
    shadow-mapSize={[1024, 1024]}
    shadow-camera-left={-6} shadow-camera-right={6}
    shadow-camera-top={6} shadow-camera-bottom={-6}
    shadow-bias={-0.0005}
/>
```

- `ambientLight` faible pour ne pas écraser l'IBL
- `directionalLight` chaude qui crée la direction principale et les ombres portées sur le dais
- `shadow-bias` négatif évite le shadow acne sur les surfaces planes

`<Canvas shadows>` (dans `App.jsx`) est requis pour activer le pipeline d'ombres.

## ContactShadows

```jsx
<ContactShadows position={[0, 0.08, 0]} opacity={0.55} scale={9} blur={2.4} far={5} resolution={512} />
```

Drei rend une ombre plane douce sous le socle. Complète les shadow maps directionnelles avec une ombre de contact plus définie sous la cage, sans coût de shadow map supplémentaire.

## Le dais flottant

Dans `Playground.jsx`. 4 strates empilées sur l'axe Y :

| Y | Élément | Matériau |
|---|---------|----------|
| `-0.18` | Corps cylindrique (rayon 5/5.4) | `MeshStandard` blanc cassé `#ece6d8`, metalness 0.15, roughness 0.45 |
| `+0.001` | Disque réfléchissant (rayon 5) | `MeshReflectorMaterial` (resolution 512, mixStrength 0.55) |
| `+0.005` | Anneau néon contour | `emissive cyan #7ad9ff`, `toneMapped:false`, intensity 2.4 |
| `+0.04` à `+0.10` | Socle indigo + ring émissif violet | `MeshStandard` |

Le `MeshReflectorMaterial` rend une seconde passe pour calculer la réflexion plane. Sur un disque blanc clair, on garde `mixStrength` bas (0.55) — sinon le dais devient grisâtre par mélange avec le ciel ou le contenu sombre de l'HDR.

## La cage

Pas de faces pleines (versions précédentes avaient une vitrine de verre `MeshPhysicalMaterial transmission` qui pénalisait la visibilité). À la place, **un châssis ouvert** :

- **4 poteaux verticaux** chromés (`metalness: 1`, `roughness: 0.18`) aux coins, hauteur 4
- **8 arêtes** en `boxGeometry` fine (0.04 d'épaisseur) :
  - 4 du haut : néon **rose** `#ff7ad6`, intensity 2.2, `toneMapped:false`
  - 4 du bas : néon **cyan** `#7ad9ff`, intensity 2.0

Les arêtes émissives passent au-dessus du seuil de bloom (`luminanceThreshold: 0.55` avec `toneMapped:false`) → halo rose/cyan automatique.

## Pokéballs — matériaux

Dans `materials.js`. Chaque type a sa texture PNG, chargée en `SRGBColorSpace` avec `anisotropy: 8` :

```js
new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 0.25,
    roughness: 0.4,
    envMapIntensity: 1.1,
})
```

Cas spécial — la **Masterball** :

```js
metalness: 0.55, roughness: 0.25,
emissive: new THREE.Color('#7a3df0'),
emissiveIntensity: 0.35,
```

Plus métallique, plus polie, et légèrement émissive violette (halo subtil qui la rend reconnaissable au premier coup d'œil).

⚠️ **Ne pas utiliser `MeshBasicMaterial`** sur les balls : il ignore l'éclairage et les reflets de l'HDR, et redonne l'aspect "sticker plat" qu'on avait dans les premières versions.

## Réticule

Un `<group>` qui se déplace avec la ball fantôme :

```jsx
<group ref={reticule}>
    <mesh position={[0, 2.25, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 4.5, 16]} />
        <meshBasicMaterial color={'#ffffff'} transparent opacity={0.45} />
    </mesh>
    <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.24, 48]} />
        <meshBasicMaterial color={'#ffffff'} transparent opacity={0.85} toneMapped={false} />
    </mesh>
</group>
```

La ligne sert de guide visuel à la trajectoire ; la bague de réception au sol indique l'endroit exact où la ball va atterrir. Les deux suivent automatiquement quand on met à jour le `position.x/z` du groupe parent.

## Postprocessing

```jsx
<EffectComposer multisampling={4}>
    <Bloom intensity={0.8} luminanceThreshold={0.55} luminanceSmoothing={0.25} mipmapBlur />
    <Vignette eskil={false} offset={0.2} darkness={0.7} />
</EffectComposer>
```

- **Bloom** : seuil à 0.55 — accroche les highlights PBR et tout ce qui est `emissive + toneMapped:false` (les arêtes néon, le ring du socle). `mipmapBlur` active un blur multi-étages plus stable que le blur séparable par défaut.
- **Vignette** : assombrissement léger des coins, donne plus de présence au sujet central.

## Setup Canvas

Dans `App.jsx` :

```jsx
<Canvas
    shadows
    camera={{ position: [0, 5, 8], fov: 45 }}
    gl={{ antialias: true }}
>
```

- `shadows` active le pipeline d'ombres (requis pour que les `castShadow`/`receiveShadow` aient un effet)
- `fov: 45` un peu serré pour un sentiment de "vitrine" plutôt que de grand-angle
- `antialias: true` puisqu'on est sur des arêtes fines (chrome posts à 0.04)

## Performance — leviers à connaître

- **`MeshReflectorMaterial`** est le poste le plus coûteux. Si le framerate chute : baisser `resolution` (512 → 256) ou supprimer le disque réfléchissant.
- **`Bloom`** avec `mipmapBlur` est cheap. Pas un goulet en général.
- **`Environment` HDR** : coût négligeable une fois généré. Le `blur` ajoute un coût marginal de pré-calcul.
- **Ombres** : un seul `castShadow` avec `shadow-mapSize: 1024`. Confortable, peut descendre à 512 sur mobile.

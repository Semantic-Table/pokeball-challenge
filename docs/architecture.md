# Architecture

## Stack

| Couche | Outil |
|--------|-------|
| UI / cycle de vie | React 18 + Vite |
| Rendu 3D | Three.js via [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) |
| Helpers 3D | [@react-three/drei](https://github.com/pmndrs/drei) (Environment, OrbitControls, KeyboardControls, MeshReflectorMaterial, ContactShadows…) |
| Physique | [@react-three/rapier](https://github.com/pmndrs/react-three-rapier) (wrapper Rapier WebAssembly) |
| Postpro | [@react-three/postprocessing](https://github.com/pmndrs/postprocessing) (Bloom, Vignette) |
| State global | [Zustand](https://github.com/pmndrs/zustand) |
| Shaders | inline dans `materials.js` (shader des particules de fusion) |
| Perf | `r3f-perf` (overlay en dev) |

## Arborescence des composants

```
main.jsx
└── App.jsx                       ← <KeyboardControls> + <Canvas> (shadows, camera init) + <Physics>
      ├── Ui.jsx                  ← HUD (score, écran Game Over) — DOM, hors Canvas
      └── Experience.jsx          ← scène 3D, boucle de jeu, postpro
            ├── Environment HDR   ← pokemon_center.hdr (fond + IBL)
            ├── Lumières         ← directional (key, castShadow) + ambient
            ├── OrbitControls
            ├── ContactShadows
            ├── EffectComposer    ← Bloom + Vignette
            ├── Pokeball (× N)    ← <RigidBody> + détection sortie de zone
            ├── reticule (group)  ← ligne verticale + bague de réception
            └── Playground.jsx    ← dais, socle, cage (poteaux + arêtes néon)
```

## Store Zustand — `src/stores/useGame.jsx`

Un seul store global. Crée avec `subscribeWithSelector` (permet `useGame.subscribe` selon une slice).

```js
{
  score: number,
  setScore, addScore,
  phase: 'playing' | 'ended' | 'menu',

  pokeballsOutOfBounds: pokeballId[],
  pushPokeball, removePokeball,

  particles: { position, type, key }[],   // désactivé (JSX retiré)
  addParticle, removeParticle,

  start(),   // ended/menu → playing, score reset
  end(),     // playing → ended, écrit le highscore en localStorage
}
```

**Phases** : `'playing'` est l'état initial. Pas de menu de démarrage : on entre directement dans la partie.

## Boucle de jeu — `useFrame` dans `Experience.jsx`

Toute la logique tourne dans un seul `useFrame`. Le code se branche sur la phase :

### En `playing`

1. **Lecture des inputs** via `useKeyboardControls`
2. **Calcul du déplacement camera-relatif** : récupère le forward de la caméra, projette sur XZ, calcule right par produit vectoriel avec worldUp. Le déplacement `move = input.x * right + input.z * forward` est clampé aux bornes axis-aligned `[±horizontalBorder, ±verticalBorder]`. Voir [`controles.md`](./controles.md) pour le détail.
3. **Synchro réticule** : `reticule.current.position.x/z` est aligné sur la ball fantôme (le groupe contient la ligne ET la bague de réception, les deux suivent).
4. **Drop** : si `Space` est pressée et que `pokeballsOutOfBounds.length === 0`, ajoute une vraie `Pokeball` dans le state local `pokeballs` à la position du fantôme (avec un léger jitter aléatoire pour éviter les piles parfaites). Sélectionne ensuite un nouveau `pokeballType` aléatoire entre 0 et 4.

### En `ended`

- Touche `R` → vide `pokeballs` et appelle `useGame.getState().start()`.

## Flux des collisions (fusion)

```
[Rapier] collision détectée
    │
    ▼
Pokeball.jsx → <RigidBody onCollisionEnter={...}>
    │
    ▼
Experience.jsx → onPokeballCollide(manifold, target, other)
    │
    │  if (target.rigidBodyObject.name === other.rigidBodyObject.name)
    │
    ▼
setPokeballs([...filtré, nouvelle ball])
```

Le state `pokeballs` vit dans `Experience.jsx` (pas dans le store Zustand). Conséquence : les `addParticle` et tout ce qui se déclenche à la fusion doit être appelé depuis `onPokeballCollide`.

## Réticule

`Experience.jsx:262` — un `<group ref={reticule}>` qui contient :
- une `cylinderGeometry` verticale (la ligne de visée)
- une `ringGeometry` posée au sol (la bague de réception)

Le `useFrame` met à jour le `position.x/z` du **groupe** — les deux enfants suivent. Y reste à 0 (les enfants ont leur propre Y local).

## Caméra

Initialisée à `[0, 5, 8]` (dans `App.jsx` via la prop `camera` du Canvas, et de nouveau dans `Experience.jsx:useEffect` pour la cohérence quand HMR remet le composant). Target d'OrbitControls : `[0, 2, 0]`. Polar angle clampé entre 0.4 rad (~23°) et `π/2 - 0.05` (~87°) pour éviter la vue strictement zénithale et la traversée du sol.

Zoom et pan désactivés (`enableZoom={false}`, `enablePan={false}`). L'utilisateur peut uniquement orbiter, pas s'approcher ni se déplacer latéralement.

## Particules (désactivées)

Le composant `Particles.jsx` et les actions `addParticle`/`removeParticle` du store existent toujours mais ne sont plus appelés. Le JSX a été retiré de `Experience.jsx`. Réactivation = remettre :

1. `const particles = useGame(state => state.particles)` dans le composant
2. `useGame.getState().addParticle({...})` dans `onPokeballCollide`
3. Le bloc `{particles.map(...)}` dans le JSX

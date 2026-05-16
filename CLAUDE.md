# CLAUDE.md

Notes pour Claude Code lorsqu'il intervient sur ce repo.

## Contexte projet

**Pokeball Challenge** est un clone 3D de *Suika Game* (jeu de fusion de fruits) thématisé Pokémon. Le joueur lâche des Pokéballs depuis le haut d'une cage cubique ; deux balls du même type qui se touchent fusionnent en la ball suivante de l'échelle. Objectif final : la Masterball. Game Over si une ball reste hors zone plus de 2 s.

Le code est en français côté nommage des Pokéballs (`Rapideball`, `Soinball`, `Honorball`, `Luxeball`, `Sombreball`, `Étrangeball`…). Le reste est en anglais.

## Stack

- React 18 + Vite 4
- **React Three Fiber** (`@react-three/fiber`) pour le rendu 3D déclaratif
- **@react-three/drei** : `KeyboardControls`, `useKeyboardControls`, `useTexture`
- **@react-three/rapier** : physique rigide, `RigidBody`, `CuboidCollider`
- **@react-three/postprocessing** : Bloom
- **Zustand** (avec `subscribeWithSelector`) pour l'état global
- **leva** (importé mais non utilisé actuellement dans `Playground.jsx`)
- **r3f-perf** pour le moniteur de perf en dev
- Les shaders sont **inline** dans `materials.js` (shader des particules de fusion). Pas de plugin GLSL, pas de fichiers `.glsl` externes.

## Architecture

```
src/main.jsx
  └── App.jsx                 ← KeyboardControls + Canvas + Physics
        ├── Ui.jsx            ← HUD (score, Game Over) — hors Canvas
        └── Experience.jsx    ← Boucle de jeu (useFrame)
              ├── Pokeball.jsx (× N)   ← RigidBody + détection hors-zone
              ├── Particles.jsx (× N)  ← burst à la fusion
              └── Playground.jsx       ← murs / sol / colliders
```

### Boucle de jeu

Tout passe par `useFrame` dans `Experience.jsx` :
1. Lecture des keyboard controls (`get()`)
2. Récupération du **forward** caméra via `camera.getWorldDirection()`, projection sur le plan XZ, calcul du **right** par produit vectoriel avec `worldUp`. Le déplacement du mesh fantôme (`pokeballToPlace`) est ensuite `input.x * right + input.z * forward`, clampé sur les bornes axis-aligned `±horizontalBorder` / `±verticalBorder`.
3. Déplacement du **réticule** vertical (cylindre fin) sous la ball fantôme
4. Si `drop` est pressée → ajout d'une vraie `Pokeball` dans le state local `pokeballs`
5. Sélection d'un nouveau type aléatoire pour la prochaine (uniquement parmi les 5 premiers)

La caméra est gérée par `<OrbitControls>` (drei) avec `enableZoom={false}`, `enablePan={false}`, `target=[0,2,0]` et `polarAngle` clampé pour empêcher la vue en plongée totale ou la traversée du sol.

### Fusion

Implémentée dans `onPokeballCollide(manifold, target, other)` :
- Détection de l'égalité de type via `target.rigidBodyObject.name === other.rigidBodyObject.name`
  → **le `name` du RigidBody sert littéralement à stocker l'entier de type**.
- Position de la nouvelle ball = moyenne du `solverContactPoint(0)` et de la position de `other`.
- Type suivant : `name + 1`, **mais on early-return si `targetType >= MASTERBALL`** — la Masterball est le rang final, deux Masters ne fusionnent pas (elles se touchent normalement). Sans ce check, l'ancien code wrappait à `0` (Pokéball minuscule à la place de deux Master énormes — bug confirmé en jeu).
- Les deux balls fusionnées sont retirées du state local via `pokeballs.filter(...)`.
- Un burst de particules est poussé dans le store Zustand.

### Game Over

Logique dans `Pokeball.jsx` :
- `isInBounds(pos)` : `y < 4 && -2 < x < 2 && -1.2 < z < 1.2`
- Chaque ball trace son temps de vie (`timeToActive`). Une fois `>= 2000 ms`, **si elle est encore hors-zone, `useGame.getState().end()` est appelé**.
- En parallèle, `pokeballsOutOfBounds` (dans le store) sert à bloquer le drop tant qu'une ball est en train de sortir.

### Store Zustand (`stores/useGame.jsx`)

```js
{
  score, addScore, setScore,
  phase: 'playing' | 'ended' | 'menu',
  pokeballsOutOfBounds: [keys],
  particles: [{position, type, key}],
  start(), end()  // end() écrit le highscore en localStorage
}
```

## Conventions et pièges

- **Pas de TypeScript** — tout est en `.jsx` simple.
- Les **identifiants de balls** sont des `Math.random()` (`pokeball.key`). Pas de risque de collision en pratique, mais c'est fragile.
- Les **types** sont des entiers (0 → 10). Le wrap `10 → 0` est probablement une régression à corriger.
- La **cage** : surface intérieure des colliders et poteaux visibles alignés à `±1.5` (X) et `±0.9` (Z), hauteur 4. Les **bornes de mouvement** du fantôme sont à `±1.3` (`horizontalBorder`) et `±0.7` (`verticalBorder`).
- Le déplacement est **relatif à la caméra** : `forward` et `right` sont recalculés chaque frame à partir de `camera.getWorldDirection()`. La cage reste axis-aligned en world space, donc les bornes (`±1.6` / `±0.8`) ne tournent pas avec la caméra — c'est voulu.
- `Playground.jsx` importe `useControls` de leva **sans s'en servir** : import mort, peut être supprimé.
- Le **highscore** est lu/écrit en `localStorage` (`'highscore'`).
- L'effet `Bloom` est paramétré à `luminanceThreshold: 0.55` (mipmapBlur) : il accroche les highlights des matériaux PBR et les liserés néon `emissive`+`toneMapped:false` de `Playground.jsx`.
- Les Pokéballs utilisent `MeshStandardMaterial` avec des `CanvasTexture` peintes programmatiquement dans `textureFactory.js` (équirectangulaires 1024×512). Plus de PNG dans `public/`. Les matériaux **dépendent du `<Environment>` de drei** pour leurs reflets — sans Environment les balls deviennent plates.
- L'`<Environment>` charge un **HDR** (`public/pokemon_center.hdr`) en `background` : il sert à la fois de fond visible **et** de source de reflets/illumination pour tous les matériaux PBR. Si le HDR est remplacé, ajuster `directionalLight.intensity` et `ambientLight.intensity` en conséquence (un HDR très lumineux suffit à éclairer la scène à lui seul).
- Les ombres dépendent de `shadows` sur `<Canvas>` + `castShadow` sur la lumière directionnelle + `castShadow`/`receiveShadow` sur les meshes concernés. Tout est déjà câblé ; ne pas oublier ces flags sur tout nouveau mesh.
- Le sol utilise `MeshReflectorMaterial` (resolution 512) — coûteux. Si la perf chute, baisser à 256 ou supprimer la réflexion.
- La cage est un **châssis** : 4 poteaux chromés (chrome `MeshStandard` metalness 1) + 8 arêtes néon (rose en haut, cyan en bas, `emissive + toneMapped:false` → bloomées). Pas de faces pleines : la visibilité à travers la cage est totale, et c'est volontaire (sinon viser est pénible).
- Le **réticule** est un `<group>` qui contient deux meshes : la ligne verticale + un anneau de réception posé au sol. Le `useFrame` met à jour le `position.x` et `position.z` du groupe, les deux enfants suivent automatiquement.
- L'**environnement** est un **HDR équirectangulaire** (`public/pokemon_center.hdr`) chargé via `<Environment files="./pokemon_center.hdr" background />`. C'est lui qui fournit le fond visible **et** la cubemap de reflets. Plus de `PokeDome`, plus de `<Stars>`, plus de fog (l'HDR donne déjà sa propre ambiance de profondeur).
- Les `<Sparkles>` ambiantes restent **désactivées**. Les bursts de `Particles` à la fusion sont **réactivés** et colorés via `typeToGlowColor` (palette dans `Pokeball.jsx`).
- À chaque fusion, `onPokeballCollide` déclenche **3 effets de juice** (en plus du spawn pop de la nouvelle ball) : un `MergeRing` (anneau néon billboard qui grandit et fade en ~380ms), un `ScorePopup` (HTML overlay drei `<Html>` qui remonte et fade en ~850ms), et un burst de `Particles`. Le state `mergeEffects` est local à `Experience.jsx` et auto-nettoyé par `setTimeout(900)`.
- **Spawn pop** dans `Pokeball.jsx` : le mesh interne de chaque ball s'anime de scale 0 → 1 avec easeOutBack en 220 ms à la naissance. La physique reste à pleine taille dès le spawn (collider sur le RigidBody, le pop n'affecte que le visuel).
- `Particles` est démonté après 200 ms (`setTimeout`) — court, à ne pas allonger sans réfléchir, car les particules s'éloignent vite à cause du shader (`position * uTime * 100 * aVelocity`).

## Scripts

| Commande | Effet |
|----------|-------|
| `npm run dev` | Dev server Vite (port 5173 par défaut) |
| `npm run build` | Build production dans `dist/` |
| `npm run preview` | Sert le build local |
| `npm run lint` | ESLint (max 0 warning) |
| `npm run deploy` | Déploiement Vercel (`vercel --prod`) |

## Quand tu modifies du code

- **Avant de changer la fusion** : vérifier le bug `name === 10 ? 0 : name + 1` (probablement `name === 10 ? 10 : name + 1`).
- **Avant de toucher au déplacement** : input → world conversion passe par le forward/right de la caméra. Si tu modifies le sens des axes, vérifier les 4 directions (gauche/droite + avant/arrière) APRÈS rotation orbitale, pas seulement avec la vue par défaut.
- **Si tu ajoutes des types de balls** : mettre à jour `PokeballType`, `typeToScore`, `typeToColor`, `typeToMaterial`, `materials.js` (passer par `makeBallMaterial(key)`), ajouter un `paintXxx` dans `textureFactory.js` et l'exposer dans `ballAssets`, et mettre à jour l'`evolutionChain` dans `Ui.jsx`.
- **Si tu veux séparer les shaders dans des fichiers `.glsl`** : il faudra réinstaller `vite-plugin-glsl` et le réajouter dans `vite.config.js`. Actuellement les shaders sont inline dans `materials.js`.
- **Ne pas ajouter** de README/CLAUDE.md/docs supplémentaires sans demande explicite.
- **Ne pas commit** sans demande explicite de l'utilisateur.

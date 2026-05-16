# Physique

Rapier (via `@react-three/rapier`) gère la simulation. Les balls sont des sphères solides soumises à la gravité, contenues par les murs de la cage. La détection de fusion utilise les callbacks de collision Rapier.

## Setup

Dans `App.jsx` :

```jsx
<Physics debug={false}>
    <Experience />
</Physics>
```

Toute la simulation tourne à l'intérieur. Passer `debug={true}` affiche les wireframes des colliders (utile pour visualiser les bornes).

## Colliders du Playground

Dans `Playground.jsx`. 5 colliders statiques (sans `<RigidBody>` — ce sont des `<CuboidCollider>` directs, donc immobiles) :

| Rôle | `args` (half-extents) | `position` |
|------|----------------------|------------|
| Sol | `[10, 0.2, 10]` | `[0, -0.1, 0]` |
| Mur gauche | `[0.2, 2, 0.8]` | `[-1.7, 2, 0]` |
| Mur droite | `[0.2, 2, 0.8]` | `[1.7, 2, 0]` |
| Mur fond | `[1.7, 2, 0.2]` | `[0, 2, -1.1]` |
| Mur avant | `[1.7, 2, 0.2]` | `[0, 2, 1.1]` |

⚠️ `args` est exprimé en **demi-extensions** (Rapier convention). Un mur latéral `args=[0.2, 2, 0.8]` mesure donc 0.4 × 4 × 1.6.

Les murs sont positionnés pour que leur **surface intérieure** (côté cage) coïncide exactement avec les poteaux chromés visibles. Par exemple, le mur gauche à `position.x = -1.7` avec `half-width = 0.2` a sa face interne à `x = -1.5` — la position des poteaux. L'**intérieur jouable** est donc `[-1.5, 1.5] × [0, 4] × [-0.9, 0.9]`, soit le volume visible de la cage. Les bornes de déplacement de la ball fantôme restent volontairement plus serrées (`±1.3`, `±0.7`) pour conserver une marge de spawn confortable contre les murs.

Pas de **toit** — le haut est ouvert, c'est par là que les balls entrent (et accessoirement c'est par là qu'elles peuvent sortir → Game Over).

## RigidBody des balls

Dans `Pokeball.jsx` :

```jsx
<RigidBody
    name={type}
    pokeballId={pokeballId}
    onCollisionEnter={({ manifold, target, other }) => onCollisionEnter(manifold, target, other)}
    position={position}
    colliders={'ball'}
    scale={adaptScale(type)}
>
    <mesh geometry={sphereGeometry} material={material} castShadow receiveShadow />
</RigidBody>
```

Détails :
- **`name={type}`** : la propriété `name` de la RigidBody Rapier stocke **directement l'entier de type** (0 à 10). C'est lu lors de la collision pour décider si deux balls fusionnent.
- **`pokeballId={pokeballId}`** : identifiant unique (`Math.random()`) injecté en propriété custom — permet de retrouver la ball dans le state local quand on doit la filtrer après fusion.
- **`colliders='ball'`** : Rapier génère automatiquement un collider sphérique calibré sur le `<mesh>` enfant.
- **`scale={adaptScale(type)}`** : la taille augmente avec le rang. `(type + 5) * 0.3` (Pokéball ×1.5 → Masterball ×4.5).
- **`castShadow` / `receiveShadow`** sur le mesh : nécessaires pour les ombres directionnelles.

## Détection de fusion

Le callback `onCollisionEnter` de Rapier fournit `manifold`, `target` (la ball qui reçoit l'event) et `other` (l'autre acteur de la collision).

Dans `Experience.jsx` → `onPokeballCollide` :

```js
if (other.rigidBodyObject && other.rigidBodyObject.name === target.rigidBodyObject.name) {
    const collisionPosition = manifold.solverContactPoint(0)
    const averagePosition = [
        (collisionPosition.x + other.rigidBodyObject.position.x) / 2,
        (collisionPosition.y + other.rigidBodyObject.position.y) / 2,
        (collisionPosition.z + other.rigidBodyObject.position.z) / 2
    ]
    const newType = target.rigidBodyObject.name === 10 ? 0 : target.rigidBodyObject.name + 1
    // ... filtre target et other du state, ajoute une nouvelle ball au newType
}
```

Points subtils :
- **Garde `other.rigidBodyObject &&`** : la collision peut être avec un collider statique (mur) qui n'a pas de `rigidBodyObject`. Sans la garde, accès à `.name` sur `undefined`.
- **Comparaison stricte** : `name === name`. Comme le `name` est un entier, c'est de l'égalité numérique.
- **Position moyenne entre contact et `other.position`** : le contact point est la surface, la position de `other` est son centre. La moyenne place la ball fusionnée à mi-chemin — visuellement plausible.
- **Cap au rang Master** : si `targetType >= MASTERBALL` (10), on early-return avant la création. Deux Master balls qui se touchent ne fusionnent pas — elles se contentent de collider. Sans ce check, l'ancien code wrappait à `0` (`name === 10 ? 0 : name + 1`) → une Pokéball minuscule (r=0.3) apparaissait à la place de deux Master (r=0.9) qui fusionnaient. Le name est coercé en int via `parseInt(..., 10)` par sécurité (Three.js peut sérialiser le nom d'un Object3D en string).

## Double-comptage des collisions

Quand deux balls A et B s'entrechoquent, Rapier déclenche `onCollisionEnter` sur **les deux** : A reçoit un event avec `target=A, other=B`, et B reçoit `target=B, other=A`. Sans précaution, on traiterait la fusion deux fois.

**Mitigation** (en place dans `onPokeballCollide`) : on ne traite que l'event où `target.pokeballId < other.pokeballId`. L'autre event est ignoré. Garantit qu'**une seule** fusion (et un seul jeu d'effets de juice — ring, popup, particules) est déclenchée par paire.

```js
if (target.rigidBodyObject.pokeballId > other.rigidBodyObject.pokeballId) {
    return  // l'autre event traitera la fusion
}
```

## Détection de sortie de zone

Dans `Pokeball.jsx`, dans le `useFrame` :

```js
const radius = 0.2 * adaptScale(type)  // rayon monde de la ball
const isInBounds = (pos) =>
    pos.y + radius < OOB_CEILING      // top de la ball sous le plafond (4.3)
    && pos.x > -1.5 && pos.x < 1.5    // centre dans l'empreinte XZ
    && pos.z > -0.9 && pos.z < 0.9
```

Le check de hauteur est **radius-aware**. Le plafond OOB (`OOB_CEILING = 4.3`) est volontairement au-dessus du toit visible (y=4) : il y a une zone tampon d'environ 30 cm où une ball peut dépasser visuellement sans déclencher le compteur — c'est plus fair, on voit la situation se profiler avant le timer. Le check XZ reste sur le centre — les murs solides empêchent en pratique le centre de sortir, c'est une sécurité défensive.

Chaque ball maintient :
- `spawnStart` — timestamp `performance.now()` au spawn. Une **grâce de 1500 ms** (`SPAWN_GRACE_MS`) suit pendant laquelle la ball ne peut pas activer le compteur (elle est en train de tomber dans la cage depuis y=5).
- `oobSince` — timestamp où la ball a passé le plafond après la grâce, sinon `null`.

Logique par frame :
- **In bounds** (insideXZ && belowCeiling) : si `oobSince ≠ null` → reset + `removePokeball`.
- **Au-dessus du plafond inside XZ, grâce écoulée** : si `oobSince === null`, démarre le timer + `pushPokeball({id, since: now})` + `setShowOOB(true)`. Si `now - oobSince >= OOB_GRACE_MS` (3000 ms), `useGame.end()`.

⚠️ Variante précédente avec `hasEnteredBounds` retirée : un latch "ball entrée au moins une fois" laissait passer les grosses balls (Master Ball r=0.9) qui spawnent sur une pile déjà trop haute — leur centre n'atteignait jamais `y + r < OOB_CEILING`, le latch ne se déclenchait jamais, le timer non plus. La grâce temporelle garantit qu'**après 1.5s** toute ball au-dessus du plafond compte, peu importe son historique.

Chaque ball OOB rend son **propre chiffre flottant** (drei `<Html>` enfant d'un `<group>` dont la position monde est mise à jour chaque frame par `getWorldPosition`). Le texte est écrit directement dans le DOM (`textContent`) sans re-render React. Style : blanc, gros, glow ambré chaud (CSS `.oob-floating`). Le store `pokeballsOutOfBounds` (`{id, since}[]`) reste utilisé en interne pour bloquer le drop tant qu'une ball est dehors.

Game Over peut être appelé depuis le `useFrame` de **plusieurs** balls simultanément ; `useGame.end()` est idempotent (no-op si `phase !== 'playing'`).

## Blocage du drop pendant une sortie

Tant qu'une ball est dehors mais pas encore Game Over, son `pokeballId` est dans `pokeballsOutOfBounds`. La logique de drop dans `Experience.jsx` consulte ce tableau :

```js
if (get().drop && !dropPressed && pokeballsOutOfBounds.length === 0) { ... }
```

Évite d'enchaîner les drops pendant qu'une ball est en train de tomber dehors (sinon le joueur "perd" plusieurs balls d'un coup avant le Game Over).

Le tableau est rempli/vidé en continu par le `useFrame` de chaque `Pokeball` (`pushPokeball` / `removePokeball`).

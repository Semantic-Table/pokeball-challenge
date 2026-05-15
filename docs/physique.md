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
| Mur gauche | `[0.2, 2, 1]` | `[-2, 2, 0]` |
| Mur droite | `[0.2, 2, 1]` | `[2, 2, 0]` |
| Mur fond | `[2, 2, 0.2]` | `[0, 2, -1.2]` |
| Mur avant | `[2, 2, 0.2]` | `[0, 2, 1.2]` |

⚠️ `args` est exprimé en **demi-extensions** (Rapier convention). Une cage de 4 × 4 × 2.4 dimensionne ses murs latéraux à `args=[0.2, 2, 1]` (donc 0.4 × 4 × 2 chacun).

L'**intérieur jouable** est `[-1.8, 1.8] × [0, 4] × [-1, 1]` en pratique (en retirant l'épaisseur des murs). Les bornes de déplacement de la ball fantôme sont volontairement plus serrées (`±1.6`, `±0.8`) pour éviter qu'une ball spawne en contact direct avec un mur.

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
- **Wrap `10 → 0`** : la Masterball relance la chaîne à Pokéball. Probablement un bug (devrait être `name === 10 ? 10 : name + 1` ou similaire pour stopper l'évolution).

## Double-comptage des collisions

Quand deux balls A et B s'entrechoquent, Rapier déclenche `onCollisionEnter` sur **les deux** : A reçoit un event avec `target=A, other=B`, et B reçoit `target=B, other=A`. Sans précaution, on traiterait la fusion deux fois.

Mitigation actuelle : le `setPokeballs([...filtré, nouvelle])` qui filtre par `pokeballId` opère sur un state React. Le second event utilisera un state stale (les deux balls toujours présentes), mais le filtre virera quand même les deux IDs, et ajoutera une seconde nouvelle ball. Résultat possible : **deux balls fusionnées créent deux balls du type supérieur**, pas une.

⚠️ Ce bug n'a pas été observé en pratique car le second event arrive après que React ait re-rendu — au moment où il s'exécute, la ball de l'event n'existe plus dans la simulation. Mais c'est une zone fragile.

Si ça pose problème : ajouter un `processedCollisions: Set<string>` dans le store, hasher `(target.pokeballId, other.pokeballId)` triés, et ne traiter qu'une fois par paire.

## Détection de sortie de zone

Dans `Pokeball.jsx`, dans le `useFrame` :

```js
const isInBounds = (parentPosition) => {
    return parentPosition.y < 4
        && parentPosition.x > -2 && parentPosition.x < 2
        && parentPosition.z > -1.2 && parentPosition.z < 1.2
}

useFrame((state, delta) => {
    if (timeToActive < 2000) setTimeToActive(timeToActive + delta * 1000)

    if (ball.current && !isInBounds(ball.current.parent.position) && timeToActive >= 2000) {
        useGame.getState().end()
    }
    // ... pushPokeball / removePokeball pour bloquer le drop
})
```

- `timeToActive` accumule en **millisecondes**. Le seuil de 2000 ms donne 2 secondes de grâce au spawn (sinon le `isInBounds` faux au tout début déclencherait Game Over immédiat).
- `ball.current.parent.position` accède à la position de la `RigidBody` (le parent du mesh).
- Game Over déclenché **dans la boucle de jeu d'une ball individuelle**, pas dans un système centralisé. Plusieurs balls peuvent appeler `end()` simultanément ; `useGame.end()` est idempotent (si `phase !== 'playing'`, no-op).

## Blocage du drop pendant une sortie

Tant qu'une ball est dehors mais pas encore Game Over, son `pokeballId` est dans `pokeballsOutOfBounds`. La logique de drop dans `Experience.jsx` consulte ce tableau :

```js
if (get().drop && !dropPressed && pokeballsOutOfBounds.length === 0) { ... }
```

Évite d'enchaîner les drops pendant qu'une ball est en train de tomber dehors (sinon le joueur "perd" plusieurs balls d'un coup avant le Game Over).

Le tableau est rempli/vidé en continu par le `useFrame` de chaque `Pokeball` (`pushPokeball` / `removePokeball`).

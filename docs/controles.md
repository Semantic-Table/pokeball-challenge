# Contrôles

## Mapping clavier

Défini dans `App.jsx` via `<KeyboardControls>` de drei.

| Action | Touches | Effet |
|--------|---------|-------|
| `left` | `←` / `A` | Déplacement gauche (camera-relatif) |
| `right` | `→` / `D` | Déplacement droite (camera-relatif) |
| `up` | `↑` / `W` | Déplacement avant (camera-relatif) |
| `down` | `↓` / `S` | Déplacement arrière (camera-relatif) |
| `drop` | `Espace` | Lâcher la ball fantôme |
| `restart` | `R` | Redémarrer (en phase `ended`) |

Pas de rotation de caméra au clavier : la caméra est gérée par `<OrbitControls>` à la souris (drag).

## Caméra orbitale — `<OrbitControls>`

Configuration dans `Experience.jsx` :

```jsx
<OrbitControls
    target={[0, 2, 0]}
    enableZoom={false}
    enablePan={false}
    enableDamping
    minPolarAngle={0.4}
    maxPolarAngle={Math.PI / 2 - 0.05}
    rotateSpeed={0.7}
/>
```

| Param | Valeur | Pourquoi |
|-------|--------|----------|
| `target` | `[0, 2, 0]` | Centre de la cage (la cage va de y=0 à y=4) |
| `enableZoom` | `false` | Aucun zoom : préserve la distance choisie à l'init |
| `enablePan` | `false` | Empêche de translater le centre d'orbite |
| `enableDamping` | `true` | Lissage de l'orbite (déclenche un re-render continu) |
| `minPolarAngle` | `0.4` (~23°) | Empêche la vue strictement top-down |
| `maxPolarAngle` | `~87°` | Empêche de descendre sous l'horizon (traverser le sol) |
| `rotateSpeed` | `0.7` | Légèrement plus lent que défaut pour un feel posé |

La position initiale de la caméra est `[0, 5, 8]` (distance ~8.5 au target), fixée par `App.jsx` (`<Canvas camera={...}>`) et un `useEffect` dans `Experience.jsx` (pour résister à HMR).

## Déplacement camera-relatif

Le piège des caméras orbitales : si on déplace la ball fantôme selon des axes monde fixes (X/Z), la flèche "gauche" ne pointe pas vers la gauche de l'écran après rotation. Solution : projeter l'input sur les axes **caméra**, recalculés à chaque frame.

### Math

À chaque frame, dans `Experience.jsx:useFrame` :

```js
camera.getWorldDirection(_forward)   // direction où la caméra regarde
_forward.y = 0                        // projection sur le plan XZ
_forward.normalize()                  // re-normalise après projection
_right.copy(_forward).cross(_worldUp) // right = forward × Y_up
```

Les `_forward`, `_right`, `_move` et `_worldUp` sont déclarés au niveau du module pour éviter d'allouer un Vector3 à chaque frame.

### Combinaison de l'input

```js
let inputX = 0, inputZ = 0;
if (get().left)  inputX -= 1;
if (get().right) inputX += 1;
if (get().up)    inputZ += 1;   // up = forward (vers où la caméra regarde)
if (get().down)  inputZ -= 1;

_move.set(0, 0, 0)
    .addScaledVector(_right, inputX)
    .addScaledVector(_forward, inputZ)
    .normalize()
    .multiplyScalar(moveSpeed * delta);
```

Le `.normalize()` permet aux diagonales de ne pas être plus rapides que les déplacements axiaux.

### Bornes axis-aligned

La cage est rectangulaire et **fixe en world space** — elle ne tourne pas avec la caméra. Donc on clampe le résultat en coordonnées monde, indépendamment de la caméra :

```js
next.x = THREE.MathUtils.clamp(next.x + _move.x, -horizontalBorder, horizontalBorder)
next.z = THREE.MathUtils.clamp(next.z + _move.z, -verticalBorder, verticalBorder)
```

`horizontalBorder = 1.3`, `verticalBorder = 0.7` (cage de 2.6 × 1.4 en surface utile, soit légèrement inférieure aux colliders à ±1.5 / ±0.9 pour garder une marge).

Conséquence visuelle : quand la caméra est orientée selon l'axe long de la cage, l'utilisateur a 2.6 m de course ; tournée de 90°, il n'a plus que 1.4 m. C'est voulu et physiquement cohérent (la cage ne tourne pas).

## Vecteur de droite — sens du produit vectoriel

Convention three.js : caméra qui regarde vers `-Z` par défaut, `up = +Y`.

`right = forward × up`, en suivant la règle de la main droite :
- forward = `(0, 0, -1)` (la caméra regarde vers -Z)
- up = `(0, 1, 0)`
- right = `(0, 0, -1) × (0, 1, 0)` = `(1, 0, 0)` ✓ (+X est bien à droite quand on regarde vers -Z)

Si on inverse (`up × forward`), on obtient `(-1, 0, 0)` — "gauche" du joueur. Donc l'ordre `_forward.cross(_worldUp)` est important.

# Gameplay

Pokeball Challenge est un clone 3D de **Suika Game** (le jeu de pastèques japonais) thématisé Pokémon. Le joueur lâche des Pokéballs depuis le haut d'une cage cubique. Deux balls **du même type** qui s'entrechoquent fusionnent en la ball suivante de la chaîne d'évolution, jusqu'à la Masterball.

## Boucle de jeu

1. Une Pokéball "fantôme" flotte au-dessus de la cage à `y = 4.5`. Le joueur la déplace au clavier dans le plan XZ.
2. `Espace` lâche la ball. Elle devient une `RigidBody` Rapier, soumise à la gravité, et chute dans la cage.
3. Quand deux balls du même type entrent en collision, elles disparaissent et sont remplacées par une ball du type **immédiatement supérieur** à leur position moyenne.
4. La prochaine ball fantôme est choisie aléatoirement parmi les **5 premiers** types (Pokéball → Safariball). Les rangs au-dessus ne s'obtiennent **que** par fusion.
5. La partie continue tant qu'aucune ball ne déborde durablement du haut de la cage.

## Chaîne d'évolution

11 types de balls, du plus petit/faible au plus rare. Le score est cumulatif au moment où chaque ball apparaît (voir `Pokeball.jsx` → `typeToScore`).

| Rang | Type | Taille (×) | Score |
|------|------|------------|-------|
| 0 | Pokéball | 1.5 | +1 |
| 1 | Superball | 1.8 | +2 |
| 2 | Hyperball | 2.1 | +4 |
| 3 | Rapidball | 2.4 | +6 |
| 4 | Safariball | 2.7 | +12 |
| 5 | Soinball | 3.0 | +20 |
| 6 | Honorball | 3.3 | +28 |
| 7 | Luxeball | 3.6 | +36 |
| 8 | Sombreball | 3.9 | +44 |
| 9 | Étrangeball | 4.2 | +52 |
| 10 | **Masterball** | 4.5 | +110 |

L'échelle est donnée par la formule `adaptScale(type) = (type + 5) * 0.3` (`Pokeball.jsx:124`).

## Règle de fusion

Implémentée dans `Experience.jsx` → `onPokeballCollide`. Détection :
- `target.rigidBodyObject.name === other.rigidBodyObject.name`
- La propriété `name` de la `RigidBody` Rapier **stocke directement l'entier de type** de la ball — c'est la clé de comparaison.

Quand la collision matche :
1. Position de la nouvelle ball = moyenne entre le `solverContactPoint(0)` du manifold et la position de l'autre ball.
2. Type suivant = `name === 10 ? 0 : name + 1`.
3. Les deux balls fusionnées sont retirées du state local `pokeballs` (filtrage par `pokeballId`).
4. Une nouvelle ball du type suivant est insérée.

✅ La fusion **s'arrête au rang Master** : deux Master balls qui se touchent ne fusionnent pas. Une vérification `if (targetType >= MASTERBALL) return` dans `onPokeballCollide` cap la chaîne au rang final.

## Game Over

Logique dans `Pokeball.jsx`. Chaque ball trace son temps de vie via `timeToActive`. Quand :

- `timeToActive >= 2000ms` (2 secondes après spawn)
- ET `isInBounds(parentPosition)` est `false` (ball hors `[-2, 2] × [0, 4] × [-1.2, 1.2]`)

alors `useGame.getState().end()` est appelé. La phase du store passe à `'ended'`, et le score actuel est comparé au high score sauvegardé dans `localStorage` :

```js
localStorage.setItem('highscore', Math.max(state.score, localStorage.getItem('highscore') || 0))
```

Le délai de 2 secondes laisse le temps à une ball qui rebondit brièvement au-dessus du bord de retomber sans déclencher fin de partie.

## Blocage du drop pendant une sortie

Tant qu'une ball est hors zone (présente dans `pokeballsOutOfBounds` du store), le joueur **ne peut pas lâcher** une nouvelle ball :

```js
if (get().drop && !dropPressed && pokeballsOutOfBounds.length === 0) { ... }
```

Évite que le joueur empile des balls pendant qu'une est en train de tomber dehors.

## High score

Sauvegardé en `localStorage` sous la clé `'highscore'`. Lu et affiché dans `Ui.jsx` à l'écran Game Over. Aucune persistance côté serveur.

## Redémarrage

Touche `R` (en phase `ended`) :
- vide le state local `pokeballs`
- appelle `useGame.getState().start()`, qui repasse la phase à `'playing'` et remet le score à 0

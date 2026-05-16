# Pokeball Challenge

Un clone 3D du **Suika Game** (le fameux jeu de pastèques japonais) revisité sous forme de défi Pokémon. Empile, fais tomber et fusionne des Pokéballs dans une cage en lévitation jusqu'à obtenir la **Masterball**.

Réalisé avec React, Three.js (via React Three Fiber) et le moteur physique Rapier.

## Gameplay

- Une Pokéball flotte au-dessus d'une arène cubique : tu la déplaces, tu la lâches, elle tombe.
- Deux balls du **même type** qui se touchent **fusionnent** en la ball suivante de l'échelle, libèrent un burst de particules et rapportent des points.
- Plus la ball est haute dans la chaîne d'évolution, plus elle vaut cher au score.
- **Game Over** : si une ball dépasse les limites supérieures de la cage pendant plus de 2 secondes, la partie s'arrête. Le high score est sauvegardé localement.

### Chaîne d'évolution

| Rang | Ball | Score |
|------|------|-------|
| 0 | Pokéball | 1 |
| 1 | Superball | 2 |
| 2 | Hyperball | 4 |
| 3 | Rapidball | 6 |
| 4 | Safariball | 12 |
| 5 | Soinball | 20 |
| 6 | Honorball | 28 |
| 7 | Luxeball | 36 |
| 8 | Sombreball | 44 |
| 9 | Étrangeball | 52 |
| 10 | **Masterball** | 110 |

Seuls les 5 premiers types peuvent apparaître à la main du joueur — les rangs supérieurs ne s'obtiennent qu'en fusionnant.

## Contrôles

| Touche | Action |
|--------|--------|
| `←` / `A` · `→` / `D` | Déplacement (relatif à la caméra) |
| `↑` / `W` · `↓` / `S` | Déplacement en profondeur (relatif à la caméra) |
| Drag souris | Rotation orbitale de la caméra autour de la cage |
| `Espace` | Lâcher la ball |
| `R` | Recommencer (écran Game Over) |

## Stack technique

- **React 18** + **Vite 6**
- **@react-three/fiber** — rendu Three.js déclaratif
- **@react-three/drei** — helpers (KeyboardControls, OrbitControls, Environment, Html, Billboard, MeshReflectorMaterial…)
- **@react-three/rapier** — physique rigide pour les collisions
- **@react-three/postprocessing** — effets Bloom + Vignette
- **Zustand** — store global (score, phase, particules, balls hors-zone)
- **Tone.js** — synthés procéduraux pour les SFX (drop, merge, gameOver, start)

## Installation

```bash
npm install
npm run dev
```

L'app tourne ensuite sur [http://localhost:5173](http://localhost:5173).

## Scripts

| Commande | Effet |
|----------|-------|
| `npm run dev` | Serveur de dev Vite avec HMR |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualisation du build local |
| `npm run lint` | ESLint (React + hooks, max 0 warnings) |
| `npm run login` | Connexion Vercel CLI (`npx vercel login`) |
| `npm run deploy` | Déploiement production sur Vercel (`npx vercel --prod`) |

## Structure du projet

```
src/
├── main.jsx              # Point d'entrée React
├── App.jsx               # Canvas R3F + KeyboardControls + Physics
├── Experience.jsx        # Boucle de jeu, contrôles, logique de fusion, effets
├── Pokeball.jsx          # Composant ball (RigidBody) + types + scoring
├── Playground.jsx        # Cage de jeu (dais, socle, murs, poteaux, néons)
├── Particles.jsx         # Bursts de particules à la fusion
├── Ui.jsx                # HUD score, menu démarrage, settings, écran Game Over
├── audio.js              # Tone.js : SFX procéduraux + musique d'ambiance
├── textureFactory.js     # Génération canvas des 11 textures Pokéball
├── materials.js          # Matériaux PBR + shader inline des particules
├── stores/useGame.jsx    # Store Zustand (score, phase, isNewRecord…)
└── index.css             # Style global, HUD, animations menu/score/game-over

public/
├── pokemon_center.hdr    # Env map équirectangulaire (background + IBL)
└── hot_spring_town.mp3   # Musique d'ambiance (CC0, opengameart)
```

## Déploiement

Le projet est configuré pour Vercel. `vercel` est installé via `npx` (pas de dep runtime) : authentification une fois avec `npm run login`, puis `npm run deploy` pousse en prod.

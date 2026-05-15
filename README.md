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

- **React 18** + **Vite**
- **@react-three/fiber** — rendu Three.js déclaratif
- **@react-three/drei** — helpers (KeyboardControls, OrbitControls, useTexture…)
- **@react-three/rapier** — physique rigide pour les collisions
- **@react-three/postprocessing** — effet Bloom sur la scène
- **Zustand** — store global (score, phase, particules, balls hors-zone)
- **r3f-perf** — moniteur de performance en dev
- **vite-plugin-glsl** — chargement de shaders GLSL

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
| `npm run login` | Connexion Vercel CLI |
| `npm run deploy` | Déploiement production sur Vercel |

## Structure du projet

```
src/
├── main.jsx              # Point d'entrée React
├── App.jsx               # Canvas R3F + KeyboardControls + Physics
├── Experience.jsx        # Boucle de jeu, contrôles, logique de fusion
├── Pokeball.jsx          # Composant ball (RigidBody) + types + scoring
├── Playground.jsx        # Cage de jeu (sols, murs, colliders, poteaux)
├── Particles.jsx         # Bursts de particules à la fusion
├── Ui.jsx                # HUD score + écran Game Over
├── materials.js          # Textures et matériaux (dont shader des particules)
├── stores/useGame.jsx    # Store Zustand (score, phase, particules)
├── shaders/particles/    # Fichiers GLSL (vertex + fragment)
└── index.css             # Style global et HUD

public/
└── *.png                 # Textures des 11 Pokéballs
```

## Déploiement

Le projet est configuré pour Vercel. Une fois authentifié (`npm run login`), un `npm run deploy` pousse en production.

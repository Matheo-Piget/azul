# Azul - Implémentation Web

Une implémentation web complète du jeu de société Azul, développée avec React et TypeScript.


## À propos du jeu

Azul est un jeu de société basé sur les azulejos portugais, ces carreaux de céramique décoratifs. Les joueurs collectent des tuiles et les placent stratégiquement sur leur plateau pour marquer des points. Inspiré du jeu de société primé de Michael Kiesling, cette version numérique offre la même expérience captivante avec une interface élégante et intuitive.

## Règles du jeu

Azul se joue de 2 à 4 joueurs. Chaque joueur a un plateau individuel représentant un mur où il placera des tuiles. Le but est de marquer le plus de points possible en complétant des motifs sur le mur. Le jeu se déroule en plusieurs tours, chacun composé de trois phases : sélection des tuiles, placement sur le plateau et scoring. Les joueurs choisissent des tuiles de différentes couleurs depuis des fabriques ou le centre, puis les placent sur leur plateau en respectant certaines règles. À la fin de chaque tour, les points sont comptés en fonction des tuiles placées et des motifs complétés.

### Objectif

Marquer le plus de points en complétant des motifs de tuiles sur votre mur.

### Déroulement

1. **Phase de sélection** : Les joueurs choisissent des tuiles de même couleur depuis les fabriques ou le centre
2. **Phase de placement**: Les tuiles sont placées sur les lignes de motif
3. **Phase de score**: À la fin du tour, les tuiles complètes sont transférées au mur et les points sont calculés

### Scoring

- +1 point pour chaque tuile placée dans une série horizontale ou verticale continue
- Bonus pour compléter des rangées, colonnes et ensembles de couleurs
- Pénalités pour les tuiles non utilisées

## Fonctionnalités

- 🎮 Jeu complet implémentant toutes les règles officielles d'Azul
- 🤖 Mode contre l'IA avec plusieurs niveaux de difficulté
- 🎵 Effets sonores immersifs
- 🎨 Interface utilisateur soignée et animations fluides
- 📱 Design responsive pour tous les appareils

## Installation et lancement

### Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/azul.git
cd azul

# Installer les dépendances
npm install
# ou
yarn install
```

### Lancement de l'application

```bash
# Lancer le serveur de développement
npm start
# ou
yarn start
```

Ouvrez votre navigateur et accédez à `http://localhost:3000` pour jouer au jeu.

### Tests

```bash
# Lancer les tests unitaires
npm test
# ou
yarn test
```

### Architecture du code

src/
├── components/       # Composants React d'interface utilisateur
│   ├── Board/        # Composants liés au plateau de jeu
│   ├── Factory/      # Fabriques de tuiles
│   ├── PlayerBoard/  # Plateau individuel des joueurs
│   ├── Tile/         # Composants de tuiles
│   └── UI/           # Éléments d'interface générique
├── game-logic/       # Logique du jeu
│   ├── ai/           # Intelligence artificielle
│   ├── moves.ts      # Validation des mouvements
│   ├── scoring.ts    # Calcul des scores
│   └── setup.ts      # Initialisation du jeu
├── models/           # Types et interfaces
├── state/            # Gestion d'état (Context API)
└── utils/            # Utilitaires (son, etc.)

## Technologies utilisées

- **React**: Bibliothèque UI
- **TypeScript**: Typage statique
- **CSS Modules**: Styles modulaires
- **Jest**: Framework de test

## Développement futur

- [ ] Mode multijoueur en ligne
- [ ] Statistiques de jeu et suivi des performances
- [ ] Mode tutoriel interactif
- [ ] Variantes de jeu (Azul: Summer Pavilion, etc.)
- [ ] Thèmes visuels alternatifs

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## Crédits

- Jeu original conçu par Michael Kiesling
- Édité par Plan B Games / Next Move Games

Cette implémentation web a été créée à des fins éducatives et personnelles. Tous les droits sur le jeu original appartiennent à leurs propriétaires respectifs.


# 🚌 Générateur de Fiches Voitures RATP

Un générateur d'horaires théoriques pour les lignes de bus, conçu pour créer des fiches de service détaillées avec système de codes TM (Transport Management) intégré.

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646cff.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1.8-06b6d4.svg)

## 📋 Table des matières

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Système TM](#-système-tm)
- [Technologies](#-technologies)
- [Structure du projet](#-structure-du-projet)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)
- [Licence](#-licence)

## 🎯 Aperçu

Cette application web permet de générer automatiquement des fiches de service pour les conducteurs de bus, similaires à celles utilisées par la RATP. Elle calcule les horaires théoriques optimaux en fonction des paramètres de ligne configurés et génère des codes TM uniques pour chaque configuration.

### Captures d'écran

```
┌─────────────────────────────────────────────────────────────┐
│  🚌 Générateur de Fiches Voitures                          │
├─────────────────────────────────────────────────────────────┤
│  Configuration de la ligne                                  │
│  ┌─────────┬─────────┬─────────┬─────────┐                │
│  │ Ligne   │ Term. 1 │ Term. 2 │ Dépôt   │                │
│  │ 73      │ MO      │ CG      │ CHA     │                │
│  └─────────┴─────────┴─────────┴─────────┘                │
│                                                             │
│  Points de régulation                                       │
│  MO → CG: RPC(9min) → ET1(12min) → PN(5min) → GAA(8min)  │
│  CG → MO: GAA(7min) → PN(11min) → ET2(14min) → RPC(8min) │
│                                                             │
│  TM: 1730MOCGRPC92ET1C5PN58GAA84GAA7PN0BET2E8RPC8...      │
│  [Générer les fiches] [Copier TM] [Imprimer]              │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Fonctionnalités

### 🔧 Configuration avancée
- **Points de régulation** : Ajout/suppression dynamique des points d'arrêt
- **Temps de trajet** : Configuration précise des temps entre points
- **Haut-le-pied** : Gestion des trajets dépôt ↔ terminus
- **Paramètres de service** : Fréquence, premier départ, dernier retour
- **Pause minimale** : Respect des temps de repos obligatoires

### 📊 Génération intelligente
- **Calcul automatique** : Nombre optimal de véhicules nécessaires
- **Battements équilibrés** : Distribution intelligente des temps d'attente
- **Horaires formatés** : Affichage selon les standards RATP
- **Validation temps réel** : Vérification de cohérence des paramètres

### 🎫 Fiches de service
- **Format authentique** : Reproduction fidèle des fiches RATP
- **Multi-véhicules** : Génération pour toute la flotte
- **Agents numérotés** : Attribution automatique des agents
- **Prêt à imprimer** : Optimisé pour impression A4

### 🔐 Système TM (Transport Management)
- **Codes compacts** : Encodage de tous les paramètres en ~50-100 caractères
- **Validation intégrée** : Système de checksum pour vérifier l'intégrité
- **Copie facile** : Bouton dédié avec feedback visuel
- **Décodeur Luau** : Reconstruction complète des horaires depuis le code

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Git

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/realmaitreal/fiches-voiture-ratp.git
cd fiches-voiture-ratp

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Ouvrir http://localhost:5173
```

### Installation des dépendances principales

```bash
# React et outils de développement
npm install react@^19.1.0 react-dom@^19.1.0
npm install -D @vitejs/plugin-react vite typescript

# UI et styles
npm install lucide-react@^0.511.0
npm install -D tailwindcss@^4.1.8 autoprefixer postcss

# Outils de développement
npm install -D eslint typescript-eslint
```

## 📖 Utilisation

### 1. Configuration de base

```typescript
// Paramètres minimaux requis
const config = {
  lineNumber: "73",           // Numéro de ligne
  terminus1: "MO",            // Premier terminus
  terminus2: "CG",            // Second terminus
  depotCode: "CHA",           // Code du dépôt
  frequency: 20,              // Fréquence en minutes
  firstDeparture: "06:00",    // Premier départ
  lastReturn: "20:30"         // Dernier retour
};
```

### 2. Points de régulation

Configurez les points d'arrêt et leurs temps de trajet :

- **MO → CG** : RPC (9min) → ET1 (12min) → PN (5min) → GAA (8min)
- **CG → MO** : GAA (7min) → PN (11min) → ET2 (14min) → RPC (8min)

### 3. Génération des fiches

1. Cliquez sur **"Générer les fiches"**
2. Vérifiez les horaires générés
3. Utilisez **"Copier TM"** pour sauvegarder la configuration
4. Imprimez avec **"Imprimer"**

### 4. Décodage TM (Luau/Roblox)

```lua
local TMDecoder = require(path.to.TMDecoder)

-- Décoder un TM
local schedules = TMDecoder.decode("1730MOCGRPC92ET1C5...")

-- Utiliser les horaires
for _, vehicle in ipairs(schedules) do
    print("Véhicule:", vehicle.vehicleNumber)
    for _, point in ipairs(vehicle.schedulePoints) do
        print("  ", point.point, ":", point.formatted)
    end
end
```

## 🔐 Système TM

### Format du code TM

Le code TM encode tous les paramètres de configuration :

```
1730MOCGRPC92ET1C5PN58GAA84GAA7PN0BET2E8RPC822221105170C0606K14K00CZ
│└┬┘└┬┘└┬┘└─────────┬─────────┘└─────────┬─────────┘└─┬─┘└─┬─┘└─┬─┘└┬┘
│ │  │  │           │                   │              │    │    │   │
│ │  │  │           │                   │              │    │    │   └─ Checksum
│ │  │  │           │                   │              │    │    └───── Pause min
│ │  │  │           │                   │              │    └────────── Fréquence  
│ │  │  │           │                   │              └─────────────── Horaires
│ │  │  │           │                   └────────────────────────────── Haut-le-pied
│ │  │  │           └────────────────────────────────────────────────── Régulation 2→1
│ │  │  └────────────────────────────────────────────────────────────── Régulation 1→2
│ │  └───────────────────────────────────────────────────────────────── Dépôt
│ └──────────────────────────────────────────────────────────────────── Terminus
└────────────────────────────────────────────────────────────────────── Version
```

### Avantages du système TM

- **Compact** : Configuration complète en ~50-100 caractères
- **Portable** : Facile à partager et sauvegarder
- **Versionné** : Support des mises à jour futures
- **Sécurisé** : Validation par checksum
- **Interopérable** : Compatible frontend TypeScript ↔ backend Luau

## 🛠️ Technologies

### Frontend
- **React 19.1** - Framework UI avec les dernières fonctionnalités
- **TypeScript 5.8** - Typage statique et sécurité du code
- **Vite 6.3** - Build tool ultra-rapide avec HMR
- **Tailwind CSS 4.1** - Framework CSS utility-first
- **Lucide React** - Icônes modernes et cohérentes

### Outils de développement
- **ESLint 9.25** - Linting et standards de code
- **TypeScript ESLint** - Règles spécifiques TypeScript
- **PostCSS** - Traitement CSS avancé
- **Autoprefixer** - Compatibilité navigateurs

### Backend/Intégration
- **Luau** - Décodeur pour écosystème Roblox
- **Base36 encoding** - Compression efficace des données
- **Checksum validation** - Intégrité des données

## 📁 Structure du projet

```
fiches-voiture-ratp/
├── 📁 .github/workflows/     # Actions GitHub (CI/CD)
│   └── deploy.yml           # Déploiement automatique
├── 📁 public/               # Fichiers statiques
│   └── vite.svg
├── 📁 src/                  # Code source
│   ├── 📄 App.tsx           # Composant principal
│   ├── 📄 App.css           # Styles de l'application
│   ├── 📄 TMEncoder.ts      # Système d'encodage TM
│   ├── 📄 main.tsx          # Point d'entrée React
│   └── 📄 index.css         # Styles globaux
├── 📁 luau/                 # Décodeur Luau (séparé)
│   ├── 📄 TMDecoder.luau    # Module de décodage
│   └── 📄 Example.luau      # Exemple d'utilisation
├── 📄 package.json          # Dépendances et scripts (v3.0.0)
├── 📄 tsconfig.json         # Configuration TypeScript
├── 📄 vite.config.ts        # Configuration Vite
├── 📄 eslint.config.js      # Configuration ESLint
├── 📄 .gitignore           # Fichiers ignorés par Git
└── 📄 README.md            # Ce fichier
```

### Composants principaux

```typescript
// App.tsx - Architecture
├── BusScheduleGenerator (Composant principal)
│   ├── Configuration
│   │   ├── Paramètres de ligne
│   │   ├── Points de régulation  
│   │   ├── Haut-le-pied
│   │   └── Paramètres de génération
│   ├── Système TM
│   │   ├── Génération automatique
│   │   ├── Affichage temps réel
│   │   └── Copie vers presse-papiers
│   └── Fiches de service
│       ├── Calcul des horaires
│       ├── Génération multi-véhicules
│       └── Formatage pour impression
```

## 🚀 Déploiement

### GitHub Pages (automatique)

Le projet est configuré pour un déploiement automatique sur GitHub Pages :

```yaml
# .github/workflows/deploy.yml
- Trigger: Push sur main
- Build: npm run build  
- Deploy: GitHub Pages
- URL: https://realmaitreal.github.io/fiches-voiture-ratp/
```

### Déploiement manuel

```bash
# Build de production
npm run build

# Prévisualisation locale
npm run preview

# Les fichiers sont dans dist/
```

### Variables d'environnement

```bash
# .env (optionnel)
VITE_APP_TITLE="Générateur de Fiches Voitures"
VITE_BASE_URL="/fiches-voiture-ratp/"
```

## 🧪 Tests et développement

### Scripts disponibles

```bash
# Développement
npm run dev          # Serveur de développement
npm run build        # Build de production  
npm run preview      # Prévisualisation du build
npm run lint         # Vérification ESLint

# Personnalisés
npm run dev:host     # Serveur accessible sur réseau
npm run build:watch  # Build en mode watch
```

### Développement local

```bash
# Mode développement avec rechargement automatique
npm run dev

# Vérification des types TypeScript
npx tsc --noEmit

# Correction automatique ESLint
npm run lint -- --fix
```

## 🤝 Contribution

### Comment contribuer

1. **Fork** le repository
2. **Créer** une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Commiter** les changements (`git commit -m 'Ajout: nouvelle fonctionnalité'`)
4. **Pousser** vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Ouvrir** une Pull Request

### Standards de code

- **TypeScript strict** : Typage complet obligatoire
- **ESLint** : Respect des règles configurées
- **Commentaires** : Documentation des fonctions complexes
- **Tests** : Validation des nouvelles fonctionnalités

### Issues et bugs

Utilisez les templates GitHub pour :
- 🐛 **Bug reports** : Description détaillée du problème
- ✨ **Feature requests** : Proposition d'améliorations
- 📖 **Documentation** : Améliorations de la doc

## 📝 Changelog

### Version 3.0.0 (Actuelle)
- ✨ Interface complète de configuration
- 🚀 Génération automatique des fiches
- 🔐 Système TM avec encodage/décodage
- 📱 Design responsive et moderne
- 🖨️ Optimisation pour impression
- 🔧 Décodeur Luau pour Roblox
- 🎯 Algorithme de génération optimisé
- 💡 Interface utilisateur améliorée

### Prochaines versions prévues
- 📊 Export Excel/CSV des horaires
- 🌐 Mode multi-langues
- 💾 Sauvegarde locale des configurations
- 📱 Progressive Web App (PWA)
- 🎨 Thèmes personnalisables

## 📞 Support

### Documentation
- **README** : Guide complet (ce fichier)
- **Code** : Commentaires inline détaillés
- **Types** : Interfaces TypeScript documentées

### Communauté
- **Issues GitHub** : Questions et bugs
- **Discussions** : Échanges et propositions
- **Wiki** : Documentation étendue (à venir)

### Contact
- **Snapchat** : kirito2dsc
- **Discord** : mrr.beast
- **GitHub** : [@realmaitreal](https://github.com/realmaitreal)

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

**🚌 Fait avec ❤️ pour optimiser les transports en commun**

[![GitHub stars](https://img.shields.io/github/stars/realmaitreal/fiches-voiture-ratp.svg?style=social&label=Star)](https://github.com/realmaitreal/fiches-voiture-ratp)
[![GitHub forks](https://img.shields.io/github/forks/realmaitreal/fiches-voiture-ratp.svg?style=social&label=Fork)](https://github.com/realmaitreal/fiches-voiture-ratp/fork)

[🏠 Accueil](https://realmaitreal.github.io/fiches-voiture-ratp/) • [📖 Documentation](https://github.com/realmaitreal/fiches-voiture-ratp/wiki) • [🐛 Issues](https://github.com/realmaitreal/fiches-voiture-ratp/issues) • [💬 Discussions](https://github.com/realmaitreal/fiches-voiture-ratp/discussions)

</div>
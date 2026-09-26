// ============================================
// STARCruiser CLICKER - MAIN SCRIPT
// Version 2.1.0
// ============================================

// ============================================
// GLOBAL TOOLTIP
// ============================================
const tooltip = document.createElement('div');
tooltip.className = 'upgrade-tooltip';
document.body.appendChild(tooltip);
let tooltipAnchor = null;

function showTooltip(text, x, y, options) {
    tooltip.textContent = text;
    tooltip.style.width = '';
    tooltip.style.maxWidth = '';
    if (options && options.width) {
        tooltip.style.width = options.width + 'px';
        tooltip.style.maxWidth = options.width + 'px';
    }
    tooltip.classList.add('visible');
    const rect = tooltip.getBoundingClientRect();
    const margin = 8;
    // leftEdge : bord gauche reel du tooltip une fois le centrage (-50%) applique
    const leftEdge = options && options.align === 'left' ? x : x - rect.width / 2;
    const clampedLeft = Math.max(margin, Math.min(leftEdge, window.innerWidth - rect.width - margin));
    // Clamp vertical : si le tooltip ne tient pas au-dessus (trophees proches
    // du haut d'ecran), il bascule sous l'element via options.anchorBottom.
    const anchorBottom = options && options.anchorBottom ? options.anchorBottom : y;
    if (y - rect.height - margin >= 0) {
        tooltip.style.transform = 'translate(0, -120%)';
        tooltip.style.top = y + 'px';
    } else {
        tooltip.style.transform = 'translate(0, 0)';
        tooltip.style.top = Math.min(anchorBottom + margin, window.innerHeight - rect.height - margin) + 'px';
    }
    tooltip.style.left = clampedLeft + 'px';
    tooltipAnchor = { x, y, options: options || null };
}

function hideTooltip() {
    tooltip.classList.remove('visible');
    tooltipLiveRefresh = null;
    tooltipAnchor = null;
}

// Rafraichissement en continu du tooltip affiche (production qui evolue).
// Fontion qui regenere le texte; appelee periodiquement par la boucle de jeu.
let tooltipLiveRefresh = null;
function refreshLiveTooltip() {
    if (tooltipLiveRefresh && tooltip.classList.contains('visible')) {
        tooltip.textContent = tooltipLiveRefresh();
        if (tooltipAnchor) {
            const rect = tooltip.getBoundingClientRect();
            const margin = 8;
            const leftEdge = tooltipAnchor.options && tooltipAnchor.options.align === 'left'
                ? tooltipAnchor.x : tooltipAnchor.x - rect.width / 2;
            const clampedLeft = Math.max(margin, Math.min(leftEdge, window.innerWidth - rect.width - margin));
            tooltip.style.left = clampedLeft + 'px';
            if (tooltipAnchor.y - rect.height - margin < 0) {
                const anchorBottom = tooltipAnchor.options && tooltipAnchor.options.anchorBottom
                    ? tooltipAnchor.options.anchorBottom : tooltipAnchor.y;
                tooltip.style.top = Math.min(anchorBottom + margin, window.innerHeight - rect.height - margin) + 'px';
            }
        }
    }
}

// Détection d'un écran tactile (mobile / tablette)
const IS_TOUCH = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    || 'ontouchstart' in window
    || navigator.maxTouchPoints > 0;

// ============================================
// GLOBAL CONSTANTS
// ============================================
// Croissance du prix d'un même bâtiment à l'achat : ×1.15 par bâtiment possédé
// (identique à Cookie Clicker — le prix double tous les ~5 achats).
const BUILDING_PRICE_GROWTH_RATE = 1.15;
const GAME_LOOP_FPS = 10;
const GAME_LOOP_INTERVAL_MS = 100;
const BONUS_SPAWN_INTERVAL_MS = 30000;
const SAVE_INTERVAL_MS = 30000;
const TOAST_DURATION_MS = 3000;
const MAX_BUILDING_DISPLAY = 100;
const BUILDING_UPDATE_INTERVAL_MS = 500;
const SPACE_UPDATE_INTERVAL_MS = 500;

// ============================================
// GAME DATA
// ============================================

// ============================================
// ============================================
// ROCKET_PARTS avec tailles proportionnelles
// Hauteur totale: 454px (centrée verticalement)
// ============================================
// ============================================
// BÂTIMENTS DE PRODUCTION
// Achetables en masse, génèrent des Parts/s. Boucle clicker.
// ============================================
// Les noms/descriptions sont en FR (cles i18n) : affiches via t()/tf().
const PRODUCTION_BUILDINGS = [
    { id: "workshop",      name: "Atelier",                  description: "Tout commence ici", baseCost: 15,            gain: 0.1,      count: 0, image: "🛠️", imgPath: "images/buildings/workshop.png",  unlockCondition: () => true,            totalGenerated: 0 },
    { id: "factory",       name: "Usine",                    description: "Construit les ateliers", baseCost: 100,           gain: 1,         count: 0, image: "🏭",       imgPath: "images/buildings/factory.png",  unlockCondition: () => score >= 50,       totalGenerated: 0 },
    { id: "mine",          name: "Mine stellaire",           description: "Nourrit les usines", baseCost: 1100,          gain: 8,        count: 0, image: "⛏️",       imgPath: "images/buildings/stellar-mine.png", unlockCondition: () => score >= 500,      totalGenerated: 0 },
    { id: "solar",         name: "Centrale solaire",         description: "Alimente le complexe", baseCost: 12000,         gain: 47,       count: 0, image: "☀️",       imgPath: "images/buildings/solar-central.png", unlockCondition: () => score >= 6000,     totalGenerated: 0 },
    { id: "foundry",       name: "Autofab orbitale",        description: "Usines qui s'assemblent seules", baseCost: 130000,       gain: 260,     count: 0, image: "🛰️", imgPath: "images/buildings/orbital_autofab.png", unlockCondition: () => score >= 65000,   totalGenerated: 0 },
    { id: "station",       name: "Essaim de sondes",         description: "Sondes auto-réplicantes", baseCost: 1400000,      gain: 1400,    count: 0, image: "📡", imgPath: "images/buildings/essaim-sonde.png", unlockCondition: () => score >= 700000, totalGenerated: 0 },
    { id: "nanoforge",     name: "Nanoforge",                description: "L'atome devient matière première", baseCost: 20000000,     gain: 7800,   count: 0, image: "⚙️", imgPath: "images/buildings/nanoforge.png", unlockCondition: () => score >= 10000000, totalGenerated: 0 },
    { id: "synth",         name: "Imprimeur quantique",  description: "La matière sur mesure", baseCost: 330000000,    gain: 44000,  count: 0, image: "🧬", imgPath: "images/buildings/quantic_printer.png", unlockCondition: () => score >= 150000000, totalGenerated: 0 },
    { id: "antimatter",   name: "Collecteur d'antimatière",  description: "Ressource ultime", baseCost: 5100000000,   gain: 260000, count: 0, image: "🌀", imgPath: "images/buildings/antimatter_collector.png", unlockCondition: () => score >= 2500000000, totalGenerated: 0 },
    { id: "voidrig",       name: "Forge de vide",           description: "Extrait l'énergie du vide quantique", baseCost: 75000000000,          gain: 1600000,      count: 0, image: "⚫",       imgPath: "images/buildings/voidforge.png", unlockCondition: () => score >= 35000000000,       totalGenerated: 0 },
    { id: "quasar",        name: "Moteur à quasar",           description: "Énergie de quasar", baseCost: 1000000000000,        gain: 10000000,    count: 0, image: "💫",       imgPath: "images/buildings/quasar_motor.png", unlockCondition: () => score >= 500000000000,    totalGenerated: 0 },
    { id: "nebula",        name: "Fonderie stellaire",   description: "Coule des étoiles entières", baseCost: 14000000000000,          gain: 65000000,      count: 0, image: "🌟",       imgPath: "images/buildings/stellar_fundry.png", unlockCondition: () => score >= 7500000000000,      totalGenerated: 0 },
    { id: "pulsar",        name: "Horloger de pulsar",          description: "Règle les battements de l'univers", baseCost: 170000000000000,          gain: 430000000,      count: 0, image: "⭐",       imgPath: "images/buildings/pulsar-clock.png", unlockCondition: () => score >= 100000000000000,    totalGenerated: 0 },
    { id: "blackhole",     name: "Trou noir industriel",     description: "L'ultime moteur", baseCost: 2100000000000000,          gain: 2900000000,      count: 0, image: "🕳️",       unlockCondition: () => score >= 1500000000000000,    totalGenerated: 0 },
];

// Bâtiments de production = liste utilisée par la boucle clicker (achat en masse, gain Parts/s)
const BUILDINGS = PRODUCTION_BUILDINGS;

// ============================================
// PIÈCES DE FUSÉE
// Achats uniques par run (payés en Parts). Compléter les 10 = lancement.
// ============================================
const ROCKET_PARTS = [
    { id: "nozzles",       name: "Tuyères",        description: "Propulsion", cost: 50,           image: "🎯",       imgPath: "images/rocket/nozzles.PNG",       x: 50,    y: 646, width: 40,  height: 20,  order: 2,  purchased: false },
    { id: "engines",       name: "Moteurs",        description: "Moteurs principaux", cost: 150,          image: "🔥",       imgPath: "images/rocket/engines.png",       x: 50,    y: 595, width: 40,  height: 51,  order: 3,  purchased: false },
    { id: "fuel-tank",     name: "Réservoir",     description: "Carburant", cost: 450,          image: "⛽",       imgPath: "images/rocket/fuel-tank.png",     x: 50,    y: 537, width: 40,  height: 58,  order: 4,  purchased: false },
    { id: "rocket-body",   name: "Corps",          description: "Structure", cost: 1300,         image: "🏭",       imgPath: "images/rocket/body.png",          x: 50,    y: 337, width: 40,  height: 200, order: 5,  purchased: false },
    { id: "boosters-left", name: "Boosters Gauche", description: "Propulsion supplémentaire", cost: 3800,         image: "🚀",       imgPath: "images/rocket/boosters-left.png", x: 45.8,  y: 373, width: 50,  height: 300, order: 6,  purchased: false },
    { id: "boosters-right",name: "Boosters Droit",  description: "Propulsion supplémentaire", cost: 11000,        image: "🚀",       imgPath: "images/rocket/boosters-right.png",x: 54.2,  y: 373, width: 50,  height: 300, order: 6,  purchased: false },
    { id: "cockpit",       name: "Cockpit",        description: "Poste de pilotage", cost: 32000,        image: "👨‍🚀", imgPath: "images/rocket/cockpit.png",        x: 50,    y: 292, width: 45,  height: 45,  order: 7,  purchased: false },
    { id: "shield",        name: "Bouclier",       description: "Protection", cost: 93000,        image: "🛡️",       imgPath: "images/rocket/shield.png",        x: 50,    y: 233, width: 45,  height: 59,  order: 8,  purchased: false },
    { id: "launch-pad",    name: "Pas de tir",     description: "Lancement", cost: 270000,       image: "🚀",       imgPath: "images/rocket/launch-pad.png",    x: 60.2,  y: 205, width: 190, height: 481, order: 9,  purchased: false },
    { id: "astronaut",     name: "Astronaute",    description: "Pilote", cost: 638000,       image: "👩‍🚀", imgPath: "images/rocket/astronaut.png",     x: 40,    y: 635, width: 25,  height: 60,  order: 10, purchased: false }
];




// Ameliorations de clic inspirees de Cookie Clicker :
// - Chacune double la valeur de base du clic (x2, comme Reinforced finger / Carpal tunnel).
// - A partir de la 2e, debloque un bonus par bâtiment possede ( Thousand Fingers).
// - Les couts suivent l'echelle ~x10 de Cookie Clicker.
const CLICK_UPGRADES = [
    // Deblocage par Parts gagnees via les clics uniquement, cumulees depuis
    // le debut du run (reset au lancement comme les upgrades). Le cout reste
    // le vrai verrou, decalant chaque achat dans le temps.
    { threshold: 100,       name: "Doigt renforcé",        cost: 100 },
    { threshold: 500,       name: "Précision laser",       cost: 500 },
    { threshold: 2500,      name: "Lancement puissant",   cost: 10000 },
    { threshold: 10000,     name: "Ingénieur expert",     cost: 50000 },
    { threshold: 50000,     name: "Scientifique spatial",  cost: 1000000 },
    { threshold: 250000,    name: "Pionnier galactique",  cost: 5000000 },
    { threshold: 1000000,   name: "Click galactique",     cost: 100000000 },
    { threshold: 5000000,   name: "Maître cosmique",      cost: 500000000 },
    { threshold: 25000000,  name: "Puissance interstellaire", cost: 10000000000 },
    { threshold: 100000000, name: "Main de l'univers",   cost: 50000000000 }
];

const BUILDING_UPGRADE_THRESHOLDS = [1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];

const UPGRADE_COLORS = [
    '#88c9ee', '#66b2ff', '#4499ff', '#2288ff', '#1177ff',
    '#0066ff', '#4444ff', '#6622ff', '#8800ff', '#aa00dd',
    '#cc00bb', '#ee0099', '#ff0077', '#ff0055', '#ff2233',
    '#ff4411', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00',
    '#ffee00', '#ffff00'
];

const RANDOM_BONUSES = [
    { id: "meteor", symbol: "🌠", name: "Pluie de météores", effect: "instant", type: "meteor", colorClass: "meteor" },
    { id: "flare", symbol: "☀️", name: "Éruption solaire", effect: "multiplier", type: "flare", multiplier: 5, duration: 15000, colorClass: "flare" }
];

const SAVE_VERSION = "2.2.0";

// ============================================
// TROPH\u0009ES
// ============================================
const TROPHY_COLORS = {
    pps: ['#88c9ee', '#4499ff', '#1177ff', '#0066ff', '#6622ff', '#aa00dd', '#ff0055'],
    planets: ['#94a3b8', '#ef4444', '#06b6d4', '#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#fbbf24', '#ec4899', '#a855f7'],
    launches: ['#66b2ff', '#2288ff', '#8800ff', '#ff8800'],
    stardust: ['#6622ff', '#cc00bb', '#ffcc00'],
    'building-upgrade': ['#88c9ee', '#2288ff', '#aa00dd', '#ff4411'],
    'click-upgrade': ['#1177ff', '#ffaa00'],
    building: ['#88c9ee', '#2288ff', '#8800ff', '#ff0055'],
    score: ['#ffcc00', '#ff8800', '#ffee00'],
    bonus: ['#f59e0b', '#ff2233'],
    'building-types': ['#a855f7'],
    cards: ['#94a3b8', '#a855f7']
};
const TROPHIES = [
    // Parts par seconde (icônes: bâtiments du jeu, du plus humble au plus puissant)
    { id: "pps-1", name: "First Parts", description: "Atteindre 1 Parts par seconde", icon: "images/parts.png", threshold: 1, type: "pps" },
    { id: "pps-10", name: "Liftoff", description: "Atteindre 10 Parts par seconde", icon: "images/parts.png", threshold: 10, type: "pps" },
    { id: "pps-100", name: "Orbit Achieved", description: "Atteindre 100 Parts par seconde", icon: "images/parts.png", threshold: 100, type: "pps" },
    { id: "pps-1000", name: "Space Speed", description: "Atteindre 1 000 Parts par seconde", icon: "images/parts.png", threshold: 1000, type: "pps" },
    { id: "pps-10000", name: "Galactic Speed", description: "Atteindre 10 000 Parts par seconde", icon: "images/parts.png", threshold: 10000, type: "pps" },
    { id: "pps-100000", name: "Warp Speed", description: "Atteindre 100 000 Parts par seconde", icon: "images/parts.png", threshold: 100000, type: "pps" },
    { id: "pps-1000000", name: "Light Speed", description: "Atteindre 1 000 000 Parts par seconde", icon: "images/parts.png", threshold: 1000000, type: "pps" },
    { id: "pps-10000000", name: "Hyperdrive", description: "Atteindre 10 000 000 Parts par seconde", icon: "images/parts.png", threshold: 10000000, type: "pps" },
    { id: "pps-100000000", name: "Star Forge", description: "Atteindre 100 000 000 Parts par seconde", icon: "images/parts.png", threshold: 100000000, type: "pps" },
    { id: "pps-1000000000", name: "Cosmic Engine", description: "Atteindre 1 000 000 000 Parts par seconde", icon: "images/parts.png", threshold: 1000000000, type: "pps" },
    { id: "pps-10000000000", name: "Reality Bender", description: "Atteindre 10 000 000 000 Parts par seconde", icon: "images/parts.png", threshold: 10000000000, type: "pps" },

    // Progression spatiale (icônes: images des planètes)
    { id: "planet-moon", name: "Premier Pas", description: "Atteindre la Lune", icon: "images/planets/moon.png", threshold: 1, type: "planets" },
    { id: "planet-mars", name: "Explorateur Martien", description: "Atteindre Mars", icon: "images/planets/mars.png", threshold: 2, type: "planets" },
    { id: "planet-neptune", name: "Lointaine Neptune", description: "Atteindre Neptune", icon: "images/planets/neptune.png", threshold: 3, type: "planets" },
    { id: "planet-pluto", name: "Aux Confins du Système", description: "Atteindre Pluton", icon: "images/planets/pluto.png", threshold: 4, type: "planets" },
    { id: "planet-proxima", name: "Voyageur Interstellaire", description: "Atteindre Proxima Centauri", icon: "images/planets/proxima-centauri.png", threshold: 5, type: "planets" },
    { id: "planet-sirius", name: "Éclat de Sirius", description: "Atteindre Sirius", icon: "images/planets/sirius.png", threshold: 6, type: "planets" },
    { id: "planet-oort", name: "Le Grand Nuage", description: "Atteindre le Nuage d'Oort", icon: "images/planets/oort-cloud.png", threshold: 7, type: "planets" },
    { id: "planet-milky", name: "Cœur de la Galaxie", description: "Atteindre le Centre de la Voie lactée", icon: "images/planets/milky-way-center.png", threshold: 8, type: "planets" },
    { id: "planet-andromeda", name: "Galaxie Voisine", description: "Atteindre Andromède", icon: "images/planets/andromeda.png", threshold: 9, type: "planets" },
    { id: "planet-virgo", name: "Conquérant de l'Univers", description: "Atteindre l'Amas de Virgo", icon: "images/planets/virgo-cluster.png", threshold: 10, type: "planets" },

    // Lancements de fusée (icônes: pièces de fusée)
    { id: "launch-1", name: "Décollage !", description: "Réaliser votre premier lancement", icon: "images/rocket/engines.png", threshold: 1, type: "launches" },
    { id: "launch-5", name: "Pilote Confirmé", description: "Réaliser 5 lancements", icon: "images/rocket/cockpit.png", threshold: 5, type: "launches" },
    { id: "launch-15", name: "Escadron Spatial", description: "Réaliser 15 lancements", icon: "images/rocket/boosters-left.png", threshold: 15, type: "launches" },
    { id: "launch-30", name: "Flotte Interstellaire", description: "Réaliser 30 lancements", icon: "images/rocket/astronaut.png", threshold: 30, type: "launches" },
    { id: "launch-50", name: "Vétéran des Étoiles", description: "Réaliser 50 lancements", icon: "images/rocket/astronaut.png", threshold: 50, type: "launches" },
    { id: "launch-100", name: "Légende Cosmique", description: "Réaliser 100 lancements", icon: "images/rocket/astronaut.png", threshold: 100, type: "launches" },

    // Poussière d'étoiles (icônes: cartes du jeu)
    { id: "dust-1", name: "Première Poussière", description: "Gagner 1 Poussière d'Étoiles", icon: "images/cards/collection/comet-card.png", threshold: 1, type: "stardust" },
    { id: "dust-100", name: "Collectionneur Cosmique", description: "Gagner 100 Poussière d'Étoiles au total", icon: "images/cards/collection/nova-card.png", threshold: 100, type: "stardust" },
    { id: "dust-1000", name: "Maître de la Poussière", description: "Gagner 1 000 Poussière d'Étoiles au total", icon: "images/cards/collection/supernova-card.png", threshold: 1000, type: "stardust" },
    { id: "dust-10000", name: "Semeur d'Étoiles", description: "Gagner 10 000 Poussière d'Étoiles au total", icon: "images/cards/collection/comet-card.png", threshold: 10000, type: "stardust" },
    { id: "dust-100000", name: "Architecte Céleste", description: "Gagner 100 000 Poussière d'Étoiles au total", icon: "images/cards/collection/nova-card.png", threshold: 100000, type: "stardust" },

    // Améliorations de bâtiments (icônes: bâtiments)
    { id: "first-upgrade", name: "First Upgrade", description: "Acheter votre première amélioration de bâtiment", icon: "images/buildings/workshop.png", threshold: 1, type: "building-upgrade" },
    { id: "five-upgrades", name: "Upgrade Master", description: "Avoir 5 améliorations de bâtiment", icon: "images/buildings/factory.png", threshold: 5, type: "building-upgrade" },
    { id: "ten-upgrades", name: "Engineering Genius", description: "Avoir 10 améliorations de bâtiment", icon: "images/buildings/essaim-sonde.png", threshold: 10, type: "building-upgrade" },
    { id: "twenty-upgrades", name: "Upgrade Legend", description: "Avoir 20 améliorations de bâtiment", icon: "images/buildings/antimatter_collector.png", threshold: 20, type: "building-upgrade" },
    { id: "fifty-upgrades", name: "Génie de l'Ingénierie", description: "Avoir 50 améliorations de bâtiment", icon: "images/buildings/nanoforge.png", threshold: 50, type: "building-upgrade" },
    { id: "hundred-upgrades", name: "Ingénieur Cosmique", description: "Avoir 100 améliorations de bâtiment", icon: "images/buildings/quantic_printer.png", threshold: 100, type: "building-upgrade" },

    // Améliorations de clic (icônes: pièce fusée + astronaute)
    { id: "first-click-upgrade", name: "First Launch", description: "Acheter votre première amélioration de clic", icon: "images/rocket/nozzles.PNG", threshold: 1, type: "click-upgrade" },
    { id: "all-click-upgrades", name: "Launch Master", description: "Débloquer toutes les améliorations de clic", icon: "images/rocket/astronaut.png", threshold: CLICK_UPGRADES.length, type: "click-upgrade" },

    // Bâtiments possédés (icônes: bâtiments)
    { id: "first-building", name: "First Component", description: "Acheter votre premier bâtiment", icon: "images/buildings/workshop.png", threshold: 1, type: "building" },
    { id: "ten-buildings", name: "Space Builder", description: "Posséder 10 bâtiments au total", icon: "images/buildings/factory.png", threshold: 10, type: "building" },
    { id: "hundred-buildings", name: "Space Architect", description: "Posséder 100 bâtiments au total", icon: "images/buildings/stellar-mine.png", threshold: 100, type: "building" },
    { id: "thousand-buildings", name: "Galactic Builder", description: "Posséder 1 000 bâtiments au total", icon: "images/buildings/nanoforge.png", threshold: 1000, type: "building" },
    { id: "five-thousand-buildings", name: "Bâtisseur Stellaire", description: "Posséder 5 000 bâtiments au total", icon: "images/buildings/antimatter_collector.png", threshold: 5000, type: "building" },
    { id: "ten-thousand-buildings", name: "Empereur du Vide", description: "Posséder 10 000 bâtiments au total", icon: "images/buildings/essaim-sonde.png", threshold: 10000, type: "building" },

    // Score total (icônes: parts et cartes)
    { id: "score-1000", name: "Small Start", description: "Atteindre 1 000 Parts", icon: "images/parts.png", threshold: 1000, type: "score" },
    { id: "score-1000000", name: "Millionaire", description: "Atteindre 1 000 000 Parts", icon: "images/cards/collection/earth-card.png", threshold: 1000000, type: "score" },
    { id: "score-1000000000", name: "Billionaire", description: "Atteindre 1 000 000 000 Parts", icon: "images/cards/collection/sirius-card.png", threshold: 1000000000, type: "score" },
    { id: "score-1000000000000", name: "Trillionaire", description: "Atteindre 1 000 000 000 000 Parts", icon: "images/cards/collection/oort-card.png", threshold: 1000000000000, type: "score" },
    { id: "score-1000000000000000", name: "Quadrillionaire", description: "Atteindre 1 000 000 000 000 000 Parts", icon: "images/cards/collection/supernova-card.png", threshold: 1000000000000000, type: "score" },
    { id: "score-10000000000000000", name: "Maître de l'Univers", description: "Atteindre 10 000 000 000 000 000 Parts", icon: "images/cards/collection/blackhole-card.png", threshold: 10000000000000000, type: "score" },
    { id: "score-100000000000000000", name: "Au-delà de l'Univers", description: "Atteindre 100 000 000 000 000 000 Parts", icon: "images/planets/milky-way-center.png", threshold: 100000000000000000, type: "score" },

    // Bonus cliqués (icônes: comète)
    { id: "first-bonus", name: "First Bonus", description: "Cliquer votre premier bonus aléatoire", icon: "images/effects/comète.png", threshold: 1, type: "bonus" },
    { id: "ten-bonuses", name: "Bonus Hunter", description: "Cliquer 10 bonus aléatoires", icon: "images/cards/collection/comet-card.png", threshold: 10, type: "bonus" },
    { id: "fifty-bonuses", name: "Chasseur de Comètes", description: "Cliquer 50 bonus aléatoires", icon: "images/effects/comète.png", threshold: 50, type: "bonus" },
    { id: "hundred-bonuses", name: "Cerveau Cosmique", description: "Cliquer 100 bonus aléatoires", icon: "images/effects/comète.png", threshold: 100, type: "bonus" },

    // Collection (icône: carte trou noir)
    { id: "all-buildings", name: "Space Collector", description: "Débloquer tous les types de bâtiments", icon: "images/cards/collection/blackhole-card.png", threshold: BUILDINGS.length, type: "building-types" },
    { id: "cards-10", name: "Cartothécaire", description: "Posséder 10 cartes de collection", icon: "images/cards/collection/moon-card.png", threshold: 10, type: "cards" },
    { id: "cards-20", name: "Collection Complète", description: "Posséder toutes les cartes de collection", icon: "images/cards/collection/oort-card.png", threshold: 20, type: "cards" },
];

// ============================================
// GLOBAL VARIABLES
// ============================================
let score = 0;
let partsPerSecond = 0;
let partsSinceLaunch = 0;
let autoMultiplier = 1;
let clickMultiplier = 1;
let activeRandomBonuses = [];
let autoMultipliers = [1];
let clickMultipliers = [1];
let buildingUpgrades = {};
let buildingUpgradeCosts = {};
let totalPartsFromClicks = 0;
let activatedClickUpgrades = [];
let unlockedBuildings = new Set();
let totalGeneratedByBuilding = {};
let lastSaveTime = 0;
let lastBuildingsUpdate = 0;
let lastRocketPartsUpdate = 0;
let lastSpaceProgressUpdate = 0;
let gameStartTime = 0;
let startupBonusApplied = false;
let buyMultiplier = 1;
let clickedBonusesCount = 0;
let unlockedTrophies = new Set();

// ============================================
// ROCKET LAUNCH SYSTEM (Prestige)
// ============================================
let maxDistance = 0;
let prestigeMultiplier = 1;
let rocketsLaunched = 0;
// Horodatage du dernier lancement confirme (0 = jamais lance)
let lastLaunchAt = 0;
let lastLaunchDistance = 0;
let starDust = 0; // Poussière d'Étoiles : monnaie de prestige persistante
let totalStardustEarned = 0; // Cumul de toutes les Poussière d'Étoiles gagnées (trophées)


// ============================================
// ROCKET CONSTRUCTION DATA
// ============================================
const ROCKET_PART_POSITIONS = {
    'nozzles': { position: 'bottom', emoji: '⛽', name: 'Tuyères', class: 'rocket-engine' },
    'engines': { position: 'bottom', emoji: '⛽', name: 'Moteurs', class: 'rocket-engine' },
    'fuel-tank': { position: 'middle', emoji: '⛽', name: 'Réservoir', class: 'rocket-body' },
    'rocket-body': { position: 'middle', emoji: '⛽', name: 'Corps', class: 'rocket-body' },
    'wings': { position: 'sides', emoji: '✈️', name: 'Stabilisateurs', class: 'rocket-wings' },
    'cockpit': { position: 'top', emoji: '♁', name: 'Cockpit', class: 'rocket-nose' },
    'shield': { position: 'top', emoji: '♁', name: 'Bouclier', class: 'rocket-nose' },
    'launch-pad': { position: 'bottom', emoji: '♁', name: 'Pas de tir', class: 'rocket-engine' },
    'astronaut': { position: 'top', emoji: '♁', name: 'Astronaute', class: 'rocket-nose' }
};

let isLaunching = false;
let launchSequenceActive = false;

// ============================================
// SPACE MAP SYSTEM (Planets & Bonuses)
// ============================================
const PLANETS = [
    { id: 'earth', name: 'Terre', emoji: '\uD83C\uDF0D', distanceRequired: 0, bonusPercent: 0, color: '#10b981', imgPath: 'images/planets/earth.png' },
    { id: 'moon', name: 'Lune', emoji: '\uD83D\uDD11', distanceRequired: 384400, bonusPercent: 30, color: '#a9a9a9', imgPath: 'images/planets/moon.png' },
    { id: 'mars', name: 'Mars', emoji: '\u2642', distanceRequired: 4120000, bonusPercent: 35, color: '#ef4444', imgPath: 'images/planets/mars.png' },
    { id: 'neptune', name: 'Neptune', emoji: '\u2645', distanceRequired: 47800000, bonusPercent: 40, color: '#06b6d4', imgPath: 'images/planets/neptune.png' },
    { id: 'pluto', name: 'Pluton', emoji: '\u2646', distanceRequired: 563000000, bonusPercent: 45, color: '#8b5cf6', imgPath: 'images/planets/pluto.png' },
    { id: 'oort-cloud', name: "Nuage d'Oort", emoji: '\u2728', distanceRequired: 6100000000, bonusPercent: 50, color: '#f59e0b', imgPath: 'images/planets/oort-cloud.png' },
    { id: 'proxima-centauri', name: 'Proxima Centauri', emoji: '\u2609', distanceRequired: 72500000000, bonusPercent: 55, color: '#10b981', imgPath: 'images/planets/proxima-centauri.png' },
    { id: 'sirius', name: 'Sirius', emoji: '\u2609', distanceRequired: 891000000000, bonusPercent: 60, color: '#3b82f6', imgPath: 'images/planets/sirius.png' },
    { id: 'milky-way-center', name: 'Centre Voie lactée', emoji: '\uD83C\uDF0C', distanceRequired: 12800000000000, bonusPercent: 65, color: '#fbbf24', imgPath: 'images/planets/milky-way-center.png' },
    { id: 'andromeda', name: 'Andromède', emoji: '\uD83C\uDF0C', distanceRequired: 156000000000000, bonusPercent: 75, color: '#ec4899', imgPath: 'images/planets/andromeda.png' },
    { id: 'virgo-cluster', name: 'Amas de Virgo', emoji: '\u2728', distanceRequired: 2010000000000000, bonusPercent: 90, color: '#a855f7', imgPath: 'images/planets/virgo-cluster.png' }
];

let unlockedPlanets = new Set(['earth']);
let planetBonuses = {}; // {planetId: bonusMultiplier}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function initLanguageSafe() { if (typeof initLanguage === 'function') initLanguage(); }
function initGlobals() {
    BUILDINGS.forEach(building => {
        totalGeneratedByBuilding[building.id] = totalGeneratedByBuilding[building.id] || 0;
        buildingUpgrades[building.id] = buildingUpgrades[building.id] || [];
    });
}

function findBuildingById(buildingId) {
    return BUILDINGS.find(b => b.id === buildingId);
}

function getPrestigeProductionBoost() {
    const p = isNaN(prestigeMultiplier) ? 1 : prestigeMultiplier;
    return 1 + (p - 1) / 2;
}
function getPlanetProductionBonus() {
    return 1 + getTotalPlanetBonus() + unlockedTrophies.size * 0.01;
}
function getTotalProductionMultiplier() {
    const auto = isNaN(autoMultiplier) || autoMultiplier === undefined ? 1 : autoMultiplier;
    return auto
        * getCollectionMultiplier()
        * getProductionBonus()
        * getPrestigeProductionBoost()
        * getPlanetProductionBonus();
}

function calculateBuildingGain(building) {
    const upgradeMultiplier = getBuildingUpgradeMultiplier(building.id);
    return building.gain * building.count * autoMultiplier * upgradeMultiplier * getContractBuildingMultiplier(building.id) * getCollectionMultiplier() * getProductionBonus() * getPrestigeProductionBoost() * getPlanetProductionBonus();
}

function calculateUnitBuildingGain(building) {
    const upgradeMultiplier = getBuildingUpgradeMultiplier(building.id);
    return building.gain * autoMultiplier * upgradeMultiplier * getContractBuildingMultiplier(building.id) * getCollectionMultiplier() * getProductionBonus() * getPrestigeProductionBoost() * getPlanetProductionBonus();
}
// Multiplicateur propre du batiment : upgrades (x2 par palier) x bonus de contrat.
// Exclut les bonus globaux (planets, trophees, prestige, collection, boost temporaire).
function getBuildingOwnMultiplier(building) {
    return getBuildingUpgradeMultiplier(building.id) * getContractBuildingMultiplier(building.id);
}

// Production hors boost temporaire (autoMultiplier exclu) : base de calcul des quotas
// de contrat, pour qu'une offre generee pendant un x5 reste atteignable ensuite.
function calculateBuildingBaseGain(building) {
    const upgradeMultiplier = getBuildingUpgradeMultiplier(building.id);
    return building.gain * building.count * upgradeMultiplier * getContractBuildingMultiplier(building.id) * getCollectionMultiplier() * getProductionBonus() * getPrestigeProductionBoost() * getPlanetProductionBonus();
}
// PPS total hors boost temporaire : base de calcul du prix des contrats, pour
// qu'une offre generee pendant un x5 ne coute pas 5 fois trop cher.
function getBasePartsPerSecond() {
    let total = 0;
    BUILDINGS.forEach(building => { total += calculateBuildingBaseGain(building); });
    return total;
}

// Chaque upgrade de bâtiment double sa production (×2 par palier),
// comme les tiered upgrades de Cookie Clicker.
function getBuildingUpgradeMultiplier(buildingId) {
    const upgrades = buildingUpgrades[buildingId] || [];
    return Math.pow(2, upgrades.length);
}

function isBuildingUpgradeAvailable(buildingId, threshold) {
    const building = findBuildingById(buildingId);
    if (!building) return false;
    
    const upgrades = buildingUpgrades[buildingId] || [];
    const thresholdIndex = BUILDING_UPGRADE_THRESHOLDS.indexOf(threshold);
    
    return building.count >= threshold &&
           !upgrades.includes(threshold) &&
           (thresholdIndex === 0 || upgrades.includes(BUILDING_UPGRADE_THRESHOLDS[thresholdIndex - 1]));
}

function getBuildingTooltip(building) {
    const unitGain = calculateUnitBuildingGain(building);
    const totalGain = calculateBuildingGain(building);
    const percent = partsPerSecond > 0 ? ((totalGain / partsPerSecond) * 100).toFixed(2) : 0;
    return tf('{flavor}: +{gain} Parts/s\nMultiplicateur: x{mult}\n% de la production: {percent}%\nTotal g\u00e9n\u00e9r\u00e9: {total} Parts', {
        flavor: t(building.description),
        gain: formatNumber(unitGain),
        mult: getBuildingOwnMultiplier(building).toFixed(2),
        percent: percent,
        total: formatNumber(totalGeneratedByBuilding[building.id] || 0)
    });
}

// Coût d'un upgrade de bâtiment au palier `threshold` : baseCost × 10^(index du palier)
// (style Cookie Clicker : chaque palier coûte ~10× le précédent, proportionnel au bâtiment).
// Déterministe : ne dépend d'aucun état de jeu, donc pas de cache figé.
const BUILDING_UPGRADE_COST_GROWTH = 10;
const BUILDING_UPGRADE_COST_DIVISOR = 2;

function getBuildingUpgradeFixedCost(buildingId, threshold) {
    const building = findBuildingById(buildingId);
    if (!building) return 0;
    const tierIndex = BUILDING_UPGRADE_THRESHOLDS.indexOf(threshold);
    const tier = tierIndex === -1 ? 0 : tierIndex;
    return Math.floor(building.baseCost * Math.pow(BUILDING_UPGRADE_COST_GROWTH, tier) / BUILDING_UPGRADE_COST_DIVISOR);
}

// Prix du prochain bâtiment : baseCost × 1.15^(bâtiments possédés)
// (formule exacte de Cookie Clicker). Pour count=0 le multiplicateur vaut 1.
function calculateBuildingCost(building) {
    const reduction = getBuildingCostReduction();
    return Math.floor(building.baseCost * Math.pow(BUILDING_PRICE_GROWTH_RATE, building.count) * (1 - reduction));
}

// Fonction de formatage optimisée
function groupThousands(n) {
    return Math.round(n).toLocaleString('fr-FR').replace(/[\u202F\u00A0]/g, ' ');
}

function formatNumber(num, isTotalScore) {
    if (num === 0) return "0";
    
    const absNum = Math.abs(num);
    
    // Nombres < 1000
    if (absNum < 1000) {
        return num % 1 === 0 ? Math.round(num).toString() : num.toFixed(1);
    }
    
    // Nombres entre 1000 et 999999
    if (absNum < 1000000) {
        if (num % 1 === 0) return groupThousands(num);
        const intPart = Math.floor(num);
        const decPart = (num - intPart).toFixed(1).slice(2);
        return groupThousands(intPart) + '.' + decPart;
    }
    
    // Nombres >= 1M avec suffixes
    const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De", "Ud", "Dd", "Td", "Qad", "Qid", "Sd", "Spd"];
    const tier = Math.min(Math.floor(Math.log10(absNum) / 3), suffixes.length - 1);
    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = num / scale;
    
    // Déterminer le nombre de décimales
    const scaledAbs = Math.abs(scaled);
    const decimals = scaledAbs >= 100 ? (isTotalScore ? 3 : 2) : (scaledAbs >= 10 ? 3 : 3);
    
    return scaled.toFixed(decimals) + " " + suffix;
}

function updateAutoMultiplier() {
    autoMultiplier = autoMultipliers.reduce((a, b) => a * b, 1);
}

function updateClickMultiplier() {
    clickMultiplier = clickMultipliers.reduce((a, b) => a * b, 1);
}

function resetMultipliers() {
    autoMultipliers = [1];
    clickMultipliers = [1];
    updateAutoMultiplier();
    updateClickMultiplier();
}

let toastHideTimer = null;
function showToast(message, icon, durationMs) {
    const toast = document.getElementById('toast');
    toast.innerHTML = '';
    if (icon) {
        const iconEl = document.createElement('span');
        iconEl.className = 'toast-icon';
        if (icon.startsWith('images/')) {
            const img = document.createElement('img');
            img.src = icon;
            img.alt = '';
            iconEl.appendChild(img);
        } else {
            iconEl.textContent = icon;
        }
        toast.appendChild(iconEl);
    }
    const textEl = document.createElement('span');
    textEl.textContent = message;
    toast.appendChild(textEl);
    toast.classList.add('active');
    if (toastHideTimer) clearTimeout(toastHideTimer);
    toastHideTimer = setTimeout(() => toast.classList.remove('active'), durationMs || TOAST_DURATION_MS);
}
// Un clic sur la notification la fait disparaitre immediatement.
document.addEventListener('click', (e) => {
    const toast = e.target.closest('#toast');
    if (toast && toast.classList.contains('active')) {
        if (toastHideTimer) clearTimeout(toastHideTimer);
        toast.classList.remove('active');
    }
});

// ============================================
// SAVE / LOAD
// ============================================

function saveGame() {
    const saveData = {
        score: score,
        partsPerSecond: partsPerSecond,
        partsSinceLaunch: partsSinceLaunch,
        autoMultiplier: autoMultiplier,
        clickMultiplier: clickMultiplier,
        totalPartsFromClicks: totalPartsFromClicks,
        activatedClickUpgrades: [...activatedClickUpgrades],
        unlockedBuildings: Array.from(unlockedBuildings),
        autoMultipliers: [...autoMultipliers],
        clickMultipliers: [...clickMultipliers],
        buildingUpgrades: {},
        buildingUpgradeCosts: {},
        totalGeneratedByBuilding: {},
        clickedBonusesCount: clickedBonusesCount,
        unlockedTrophies: Array.from(unlockedTrophies),
        maxDistance: maxDistance,
        prestigeMultiplier: prestigeMultiplier,
        starDust: starDust,
        totalStardustEarned: totalStardustEarned,
        galacticUpgrades: {...galacticUpgrades},
        rocketsLaunched: rocketsLaunched,
        lastLaunchAt: lastLaunchAt,
        unlockedPlanets: Array.from(unlockedPlanets),
        planetBonuses: {...planetBonuses},
        cardCollection: {...cardCollection},
        activeRandomBonuses: activeRandomBonuses.map(bonus => ({
            id: bonus.id,
            effect: bonus.effect,
            multiplier: bonus.multiplier,
            endTime: bonus.endTime
        })),
        buildings: BUILDINGS.map(building => ({
            id: building.id,
            count: building.count
        })),
        rocketParts: ROCKET_PARTS.map(part => ({
            id: part.id,
            purchased: part.purchased
        })),
        startupBonusApplied: startupBonusApplied,
        contractState: {
            offers: contractState.offers,
            active: contractState.active,
            buildingBonuses: contractState.buildingBonuses,
            nextRotationAt: contractState.nextRotationAt,
            unlockedSeen: contractState.unlockedSeen
        },
        lastSave: Date.now(),
        gameStartTime: gameStartTime,
        version: SAVE_VERSION
    };

    for (const buildingId in buildingUpgrades) {
        saveData.buildingUpgrades[buildingId] = [...buildingUpgrades[buildingId]];
    }
    for (const buildingId in totalGeneratedByBuilding) {
        saveData.totalGeneratedByBuilding[buildingId] = totalGeneratedByBuilding[buildingId];
    }
    for (const buildingId in buildingUpgradeCosts) {
        saveData.buildingUpgradeCosts[buildingId] = {...buildingUpgradeCosts[buildingId]};
    }

    localStorage.setItem('starcruiserClickerSave', JSON.stringify(saveData));
    lastSaveTime = Date.now();
}

function loadGame() {
    const legacySave = localStorage.getItem('starshipClickerSave');
    if (legacySave !== null && localStorage.getItem('starcruiserClickerSave') === null) {
        localStorage.setItem('starcruiserClickerSave', legacySave);
    }
    if (legacySave !== null) localStorage.removeItem('starshipClickerSave');

    const saveData = localStorage.getItem('starcruiserClickerSave');
    if (!saveData) return;

    try {
        const parsed = JSON.parse(saveData);

        if (parsed.version && parsed.version !== SAVE_VERSION) {
            console.warn("Version de sauvegarde différente, migration possible");
        }

        // Charger les variables principales
        score = parsed.score || 0;
        partsPerSecond = parsed.partsPerSecond || parsed.autoGain || 0;
        partsSinceLaunch = parsed.partsSinceLaunch || score;
        autoMultiplier = parsed.autoMultiplier || 1;
        clickMultiplier = parsed.clickMultiplier || 1;
        totalPartsFromClicks = parsed.totalPartsFromClicks || parsed.clickPartsTotal || 0;
        clickedBonusesCount = parsed.clickedBonusesCount || 0;
        unlockedTrophies = new Set(parsed.unlockedTrophies || []);
        
        // Charger le système de prestige
        maxDistance = parsed.maxDistance || 0;
        prestigeMultiplier = parsed.prestigeMultiplier || 1;
        starDust = parsed.starDust || 0;
        totalStardustEarned = parsed.totalStardustEarned || 0;
        galacticUpgrades = parsed.galacticUpgrades || {};
        // V2.2: les upgrades galactiques sont uniques (maxLevel=1).
        // Cap les niveaux anciens pour eviter des bonus excesifs.
        Object.keys(galacticUpgrades).forEach(uid => {
            const u = GALACTIC_UPGRADES.find(x => x.id === uid);
            if (!u) {
                delete galacticUpgrades[uid];
            } else if (galacticUpgrades[uid] > u.maxLevel) {
                galacticUpgrades[uid] = u.maxLevel;
            }
        });
        rocketsLaunched = parsed.rocketsLaunched || 0;
        lastLaunchAt = parsed.lastLaunchAt || 0;
        
        activatedClickUpgrades = parsed.activatedClickUpgrades || [];
        unlockedBuildings = new Set(parsed.unlockedBuildings || []);
        gameStartTime = parsed.gameStartTime || 0;
        startupBonusApplied = !!parsed.startupBonusApplied;
        if (parsed.contractState) {
            contractState.offers = parsed.contractState.offers || [];
            contractState.active = parsed.contractState.active || null;
            contractState.buildingBonuses = parsed.contractState.buildingBonuses || {};
            contractState.nextRotationAt = parsed.contractState.nextRotationAt || 0;
            contractState.unlockedSeen = !!parsed.contractState.unlockedSeen;
        }

        if (parsed.cardCollection) {
            cardCollection = {...parsed.cardCollection};
            // Migration : la carte Laboratoire n'existe plus, remplacee par Comete.
            if (cardCollection['lab-card']) {
                cardCollection['comet-card'] = (cardCollection['comet-card'] || 0) + cardCollection['lab-card'];
                delete cardCollection['lab-card'];
            }
        }

        // Charger les multiplicateurs
        autoMultipliers = parsed.autoMultipliers || [1];
        clickMultipliers = parsed.clickMultipliers || [1];
        updateAutoMultiplier();
        updateClickMultiplier();

        // Charger les upgrades des buildings
        if (parsed.buildingUpgrades) {
            for (const buildingId in parsed.buildingUpgrades) {
                buildingUpgrades[buildingId] = [...parsed.buildingUpgrades[buildingId]];
            }
        }

        // Charger les coûts fixes des upgrades
        if (parsed.buildingUpgradeCosts) {
            for (const buildingId in parsed.buildingUpgradeCosts) {
                buildingUpgradeCosts[buildingId] = {...parsed.buildingUpgradeCosts[buildingId]};
            }
        }

        // Charger le total généré par building
        if (parsed.totalGeneratedByBuilding) {
            for (const buildingId in parsed.totalGeneratedByBuilding) {
                totalGeneratedByBuilding[buildingId] = parsed.totalGeneratedByBuilding[buildingId] || 0;
            }
        }

        // Charger les bonus actifs
        if (parsed.activeRandomBonuses) {
            activeRandomBonuses = parsed.activeRandomBonuses.map(bonus => ({
                id: bonus.id,
                effect: bonus.effect,
                multiplier: bonus.multiplier,
                endTime: bonus.endTime
            }));

            activeRandomBonuses.forEach(bonus => {
                if (bonus.effect === "auto" || bonus.effect === "both" || bonus.effect === "multiplier") {
                    if (bonus.multiplier && !autoMultipliers.includes(bonus.multiplier)) {
                        autoMultipliers.push(bonus.multiplier);
                    }
                }
                if (bonus.effect === "click" || bonus.effect === "both") {
                    if (bonus.multiplier && !clickMultipliers.includes(bonus.multiplier)) {
                        clickMultipliers.push(bonus.multiplier);
                    }
                }
            });
            updateAutoMultiplier();
            updateClickMultiplier();
        }

        // Charger les comptes des buildings
        if (parsed.buildings) {
            parsed.buildings.forEach(savedBuilding => {
                const building = BUILDINGS.find(b => b.id === savedBuilding.id);
                if (building) {
                    building.count = savedBuilding.count || 0;
                }
            });
        } else if (parsed.eras) {
            parsed.eras.forEach(savedEra => {
                savedEra.buildings.forEach(savedBuilding => {
                    const building = BUILDINGS.find(b => b.id === savedBuilding.id);
                    if (building) {
                        building.count = savedBuilding.count || 0;
                    }
                });
            });
        }

        // Charger l'état des pièces de fusée (achats uniques)
        if (parsed.rocketParts) {
            parsed.rocketParts.forEach(savedPart => {
                const part = ROCKET_PARTS.find(p => p.id === savedPart.id);
                if (part) {
                    part.purchased = !!savedPart.purchased;
                }
            });
        }

        // Restaurer les planetes atteintes et leurs bonus de production
        if (parsed.unlockedPlanets) {
            unlockedPlanets = new Set(parsed.unlockedPlanets);
            PLANETS.forEach(planet => {
                if (unlockedPlanets.has(planet.id)) {
                    planetBonuses[planet.id] = planet.bonusPercent / 100;
                }
            });
        }

        // Filtrer les bonus expirés et recalculer les multiplicateurs
        const now = Date.now();
        activeRandomBonuses = activeRandomBonuses.filter(bonus => bonus.endTime >= now);
        
        resetMultipliers();
        activeRandomBonuses.forEach(bonus => {
            if (bonus.effect === "auto" || bonus.effect === "both" || bonus.effect === "multiplier") {
                if (bonus.multiplier) autoMultipliers.push(bonus.multiplier);
            }
            if (bonus.effect === "click" || bonus.effect === "both") {
                if (bonus.multiplier) clickMultipliers.push(bonus.multiplier);
            }
        });
        updateAutoMultiplier();
        updateClickMultiplier();
        
        if (autoMultipliers.length === 1) autoMultiplier = 1;
        if (clickMultipliers.length === 1) clickMultiplier = 1;

        initGlobals();
        applyOfflineEarnings(parsed.lastSave);

    } catch (e) {
        console.error("Erreur de chargement :", e);
        localStorage.removeItem('starcruiserClickerSave');
        showToast("\u26a0\ufe0f " + t("Sauvegarde corrompue. Nouvelle partie."));
    }
}

function exportSave() {
    const saveData = localStorage.getItem('starcruiserClickerSave');
    if (saveData) {
        navigator.clipboard.writeText(saveData)
            .then(() => showToast("\u2705 " + t("Sauvegarde copiée !")))
            .catch(() => showToast("\u274c " + t("Échec de la copie.")));
    } else {
        showToast("\u274c " + t("Aucune sauvegarde."));
    }
}

function importSave() {
    const importText = document.getElementById('import-textarea').value.trim();
    if (!importText) { showToast("\u274c " + t("Rien à importer.")); return; }
    try {
        const testParse = JSON.parse(importText);
        if (testParse.version && testParse.buildings && testParse.buildingUpgrades) {
            localStorage.setItem('starcruiserClickerSave', importText);
            showToast("\u2705 " + t("Importé ! Redémarrage..."));
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast("\u274c " + t("Format invalide."));
        }
    } catch (e) {
        showToast("\u274c " + t("Format invalide."));
    }
}

function confirmDeleteSave() {
    if (confirm("\u26a0\ufe0f " + t("Supprimer la sauvegarde ? Tous vos progrès seront PERDUS !"))) {
        deleteSave();
    }
}

function deleteSave() {
    localStorage.removeItem('starcruiserClickerSave');
    showToast("\ud83d\uddd1\ufe0f " + t("Supprimé !"));
    setTimeout(() => window.location.reload(), 1000);
}

// ============================================
// BUILDINGS MANAGEMENT
// ============================================

function setBuyMultiplier(multiplier) {
    buyMultiplier = multiplier;
    
    document.querySelectorAll('.multiplier-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (multiplier === 'max') {
        document.getElementById('multiplier-max').classList.add('active');
        showToast(t("Multiplicateur:") + " Max");
    } else {
        document.getElementById(`multiplier-x${multiplier}`).classList.add('active');
        showToast(t("Multiplicateur:") + ` x${multiplier}`);
    }
    
    updateAllBuildingButtons();
}

function buyBuilding(buildingId) {
    const building = findBuildingById(buildingId);
    if (!building) return;

    const buildingsToBuy = buyMultiplier === 'max' ? calculateMaxAffordable(building) : buyMultiplier;
    
    let totalCost = 0;
    for (let i = 0; i < buildingsToBuy; i++) {
        totalCost += calculateBuildingCost({...building, count: building.count + i});
    }

    if (buildingsToBuy > 0) {
        score -= totalCost;
        building.count += buildingsToBuy;
        unlockedBuildings.add(building.id);
        updateDisplay();
        updateConstructionScene();
        saveGame();
        updateAllBuildingButtons();
        renderUpgrades();
        checkBuildingUnlocks();
        const maxText = buyMultiplier === 'max' ? ' (Max)' : '';
        showToast(`\u2705 +${buildingsToBuy} ${t(building.name)}${maxText}`);
        checkTrophies();
    } else {
        showToast("\u274c " + t("Pas assez de Parts"));
    }
}

function calculateMaxAffordable(building) {
    let maxAffordable = 0;
    let cumulativeCost = 0;
    let i = 0;
    while (true) {
        const costForOne = calculateBuildingCost({...building, count: building.count + i});
        if (cumulativeCost + costForOne <= score) {
            cumulativeCost += costForOne;
            maxAffordable++;
            i++;
        } else {
            break;
        }
        if (i > 100000) break; // Sécurité
    }
    return maxAffordable;
}

function buyClickUpgrade(threshold) {
    const upgrade = CLICK_UPGRADES.find(u => u.threshold === threshold);
    if (!upgrade) return;
    
    if (activatedClickUpgrades.includes(threshold)) {
        showToast("\u2705 " + t("Already activated!"));
        return;
    }
    
    if (score < upgrade.cost) {
        showToast("\u274c " + t("Pas assez de Parts"));
        return;
    }
    
    score -= upgrade.cost;
    activatedClickUpgrades.push(threshold);
    updateDisplay();
    saveGame();
    hideTooltip();
    renderUpgrades();
    updateAllBuildingButtons();
    showToast(`\u2705 ${t(upgrade.name)} ${t("activated")}`);
}

function buyBuildingUpgrade(buildingId, threshold) {
    const building = findBuildingById(buildingId);
    if (!building || !isBuildingUpgradeAvailable(buildingId, threshold)) return;
    
    const cost = getBuildingUpgradeFixedCost(buildingId, threshold);
    
    if (score < cost) {
        showToast("\u274c " + t("Pas assez de Parts"));
        return;
    }
    
    score -= cost;
    
    if (!buildingUpgrades[buildingId]) {
        buildingUpgrades[buildingId] = [];
    }
    
    buildingUpgrades[buildingId].push(threshold);
    updateDisplay();
    saveGame();
    hideTooltip();
    renderUpgrades();
    updateAllBuildingButtons();
    checkTrophies();
    showToast('+ ' + t(building.name) + ' ' + t('am\u00e9lior\u00e9 x2') + ' (-' + formatNumber(cost) + ' Parts)');
}

function updateBuildingButton(buildingId) {
    const element = document.getElementById(`building-${buildingId}`);
    if (!element) return;

    const building = findBuildingById(buildingId);
    if (!building) return;

    const buildingsToShow = buyMultiplier === 'max' ? calculateMaxAffordable(building) : buyMultiplier;
    const buildingsToShowLimited = Math.min(buildingsToShow, MAX_BUILDING_DISPLAY);
    
    let totalCost = 0;
    for (let i = 0; i < buildingsToShowLimited; i++) {
        totalCost += calculateBuildingCost({...building, count: building.count + i});
    }
    
    const totalGain = calculateBuildingGain(building);
    const isAffordable = score >= totalCost;
    
    const displayCost = buyMultiplier === 'max' && calculateMaxAffordable(building) > MAX_BUILDING_DISPLAY
        ? formatNumber(totalCost) + "+"
        : formatNumber(totalCost);

    if (building.count > 0) {
        element.classList.remove('not-purchased');
    } else {
        element.classList.add('not-purchased');
    }

    const button = element.querySelector('button');
    const productionSpan = element.querySelector('.building-production');
    const ownershipDiv = element.querySelector('.building-ownership');

    if (button) {
        button.disabled = !isAffordable || buildingsToShow === 0;
        button.textContent = `${displayCost} ${t("Parts")}`;
    }
    if (productionSpan) productionSpan.textContent = `${formatNumber(totalGain)}/s`;
    if (ownershipDiv) ownershipDiv.textContent = `${t("Owned:")} ${building.count}`;

    element.setAttribute('data-tooltip', getBuildingTooltip(building));
}

function updateAllBuildingButtons() {
    document.querySelectorAll('.building-item').forEach(element => {
        const buildingId = element.id.replace('building-', '');
        updateBuildingButton(buildingId);
    });
}

function isBuildingUnlocked(building) {
    return building.unlockCondition ? building.unlockCondition() : true;
}

function checkBuildingUnlocks() {
    let needsRerender = false;
    BUILDINGS.forEach((building) => {
        if (isBuildingUnlocked(building) && !unlockedBuildings.has(building.id)) {
            unlockedBuildings.add(building.id);
            needsRerender = true;
        }
    });
    if (needsRerender) {
        renderBuildings();
    }
}

function renderBuildings() {
    const container = document.getElementById('buildings-list');
    container.innerHTML = '';

    BUILDINGS.forEach((building) => {
        if (isBuildingUnlocked(building) || unlockedBuildings.has(building.id)) {
            renderBuilding(building);
        }
    });
}

function renderBuilding(building) {
    const container = document.getElementById('buildings-list');
    const currentCost = calculateBuildingCost(building);
    const totalGain = calculateBuildingGain(building);
    const isAffordable = score >= currentCost;

    const buildingElement = document.createElement('div');
    buildingElement.className = 'building-item ' + building.id + (building.count === 0 ? ' not-purchased' : '');
    buildingElement.id = `building-${building.id}`;
    buildingElement.setAttribute('data-tooltip', getBuildingTooltip(building));

    // Créer la structure avec l'image ou l'emoji du bâtiment
    const imageUrl = building.imgPath || '';
    const imageHtml = imageUrl
        ? `<img src="${imageUrl}" class="building-image" alt="${building.name}" width="${building.width || 84}" height="${building.height || 84}">`
        : `<span class="building-emoji">${building.image || ''}</span>`;

    buildingElement.innerHTML = `
        <div class="building-left">
            <div class="building-name-icon">
                <span class="building-name">${t(building.name)}</span>
            </div>
            <div class="building-ownership">
                ${t("Owned:")} ${building.count}
            </div>
        </div>
        <div class="building-center">
            ${imageHtml}
        </div>
        <div class="building-right">
            <button onclick="buyBuilding('${building.id}')" ${!isAffordable ? 'disabled' : ''}>
                ${formatNumber(currentCost)} ${t("Parts")}
            </button>
            <div class="building-production">${formatNumber(totalGain)}/s</div>
        </div>
    `;

    if (!IS_TOUCH) {
        buildingElement.addEventListener('mouseenter', (e) => {
            const rect = buildingElement.getBoundingClientRect();
            showTooltip(getBuildingTooltip(building), rect.left, rect.top, {
                align: 'left',
                width: Math.round(rect.width * 0.75)
            });
            tooltipLiveRefresh = () => getBuildingTooltip(building);
        });
        buildingElement.addEventListener('mouseleave', hideTooltip);
    }
    if (IS_TOUCH) {
        buildingElement.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            showTouchTooltip(buildingElement, getBuildingTooltip(building));
            tooltipLiveRefresh = () => getBuildingTooltip(building);
        });
    }

    container.appendChild(buildingElement);
    relocateBuildingProductions();
}

function relocateBuildingProductions() {
    document.querySelectorAll('.building-item').forEach(item => {
        const prod = item.querySelector('.building-production');
        const left = item.querySelector('.building-left');
        const right = item.querySelector('.building-right');
        if (!prod || !left || !right) return;
        if (isMobileLayout() && prod.parentElement !== left) {
            left.appendChild(prod);
        } else if (!isMobileLayout() && prod.parentElement !== right) {
            right.appendChild(prod);
        }
    });
}

// ============================================
// ROCKET LAUNCH SYSTEM
// ============================================

function checkRocketReady() {
    // Vérifier si toutes les pièces de fusée sont achetées
    return ROCKET_PARTS.every(part => part.purchased);
}

const PIECE_DISTANCE_MULT = 1.0;
const MOON_DISTANCE = 384400;
// Parts cumulees produites lors du premier lancement d'une nouvelle partie.
// Ce point d'ancrage calibre le debut de la courbe de distance.
// 10.5M parts pour la Lune: debut de partie rapide meme en jeu casual
// (la moitie du cumul d'un premier lancement, soit ~20-30 min de jeu).
const DISTANCE_MOON_PARTS = 1.05e7;
// Distance en deux segments:
// - jusqu'a DISTANCE_MOON_PARTS parts : croissance lineaire (Lune atteignable
//   des le premier lancement, debut de partie rapide et gratifiant)
// - au-dela : croissance lineaire, distance proportionnelle aux parts
//   (exposant 1 = aucun effet).
const DISTANCE_SCORE_EXP = 1.0;
// Gain de Poussière d'Étoiles par lancement, en deux segments:
// - jusqu'au Nuage d'Oort : (d / Lune)^0.44 (identique a avant)
// - au-dela : croissance ralentie (exposant 0.35) ancree sur la valeur a Oort,
//   pour que les derniers lancements ne donnent pas des montants enormes.
// Calibré pour : Lune = 1 PE minimum, arbre complet atteignable vers Andromède.
const STARDUST_DISTANCE_EXP = 0.44;
const STARDUST_TAIL_EXP = 0.35;
const STARDUST_TAIL_START_KM = 891000000000; // Nuage d'Oort

// Croissance du coût des pièces de fusée entre les lancements.
// Douce (×1.15) pour que la fusée se reconstruise vite après un reset,
// comme dans Cookie Clicker où l'ascension est toujours accessible.
const ROCKET_PART_COST_GROWTH = 1.15;

function calculateDistance() {
    const partsUnlocked = ROCKET_PARTS.filter(part => part.purchased).length;
    const totalParts = Math.max(partsSinceLaunch, 0);
    const partsMult = Math.pow(PIECE_DISTANCE_MULT, partsUnlocked);
    const scoreFactor = totalParts > 0
        ? (totalParts <= DISTANCE_MOON_PARTS
            ? MOON_DISTANCE * (totalParts / DISTANCE_MOON_PARTS)
            : MOON_DISTANCE * Math.pow(totalParts / DISTANCE_MOON_PARTS, DISTANCE_SCORE_EXP))
        : 0;
    const baseDistance = partsMult * scoreFactor;

    // Le prestige aide la distance mais de façon amortie (logarithmique) pour que
    // chaque planète reste plus difficile à atteindre que la précédente.
    const prestige = isNaN(prestigeMultiplier) ? 1 : prestigeMultiplier;
    const prestigeDistanceBoost = 1 + (prestige - 1) / 2;

    return baseDistance * prestigeDistanceBoost * getDistanceBonus();
}

function getCurrentDistance() {
    // Retourne la dernière distance calculée au lancement
    return lastLaunchDistance;
}

function launchRocket() {
    if (!checkRocketReady()) {
        showToast("❌ " + t("Fusée pas encore prête ! Il manque des pièces."));
        return;
    }
    
    if (isLaunching) {
        showToast("⏳ " + t("Lancement en cours..."));
        return;
    }
    
    isLaunching = true;
    
    // Calculer la distance
    const distance = calculateDistance();
    
    playLaunchSequence(() => {
        lastLaunchDistance = distance;
        // Animation de voyage Terre -> Lune, puis carte de l'espace
        playTravelAnimation(distance, () => {
            showSpaceMap(distance);
            updateSpaceProgress();
            updateConstructionScene();
            isLaunching = false;
            showToast(`🚀 ${t("Fusée lancée ! Distance atteinte:")} ${formatNumber(distance)} ${t("km")}`);
        });
    });
}

// Séquence cinématique de lancement : compte à rebours avec tremblement,
// allumage des moteurs avec flammes et fumée, puis décollage accéléré
// de la fusée complète au centre du panneau. `onDone` est appelé quand la
// fusée a quitté l'écran.
function playLaunchSequence(onDone) {
    const scene = document.getElementById('construction-scene');
    const container = document.getElementById('rocket-parts-container');
    if (!scene || !container) { onDone(); return; }

    // Bloquer le clic et le recalcul d'échelle pendant la séquence
    const medal = document.getElementById('medal');
    if (medal) medal.style.pointerEvents = 'none';
    launchSequenceActive = true;

    // Gel du transform d'échelle de base pour composer proprement l'animation
    const baseTransform = container.style.transform || '';
    const baseOrigin = container.style.transformOrigin || '';

    const overlay = document.createElement('div');
    overlay.className = 'launch-overlay';
    const countdown = document.createElement('div');
    countdown.className = 'launch-countdown';
    overlay.appendChild(countdown);
    scene.appendChild(overlay);

    // Wrapper d'animation : la fusée vole dedans. Le pas de tir et l'astronaute
    // restent au sol (pièces « ground ») : ils ne décollent pas.
    const GROUND_PARTS = ['launch-pad', 'astronaut'];
    const rocketWrap = document.createElement('div');
    rocketWrap.className = 'launch-rocket-wrap';
    rocketWrap.style.transform = baseTransform;
    if (baseOrigin) rocketWrap.style.transformOrigin = baseOrigin;
    const groundPieces = [];
    Array.from(container.children).forEach(child => {
        const isGround = GROUND_PARTS.some(id => child.classList && child.classList.contains(id));
        if (isGround) groundPieces.push(child);
        else rocketWrap.appendChild(child);
    });
    container.appendChild(rocketWrap);

    const finish = () => {
        overlay.remove();
        Array.from(rocketWrap.children).forEach(child => {
            if (child.classList && child.classList.contains('rocket-piece')) container.appendChild(child);
        });
        rocketWrap.remove();
        const smoke = scene.querySelector('.launch-smoke');
        if (smoke) smoke.remove();
        const astronaut = container.querySelector('.rocket-piece.astronaut');
        if (astronaut) {
            astronaut.classList.remove('astronaut-running');
            astronaut.style.opacity = '';
        }
        if (medal) medal.style.pointerEvents = '';
        launchSequenceActive = false;
        onDone();
    };

    // Étape 1 : compte à rebours 3..2..1. Seule la fusée tremble ;
    // l'astronaute, lui, court hors du pas de tir dès le clic.
    const steps = ['3', '2', '1'];
    let stepIndex = 0;
    const stepMs = 700;
    rocketWrap.classList.add('launch-shaking');
    const astronaut = container.querySelector('.rocket-piece.astronaut');
    if (astronaut) astronaut.classList.add('astronaut-running');
    countdown.textContent = steps[0];
    countdown.classList.add('pulsing');
    const stepTimer = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
            countdown.textContent = steps[stepIndex];
        } else {
            clearInterval(stepTimer);
            // Étape 2 : allumage moteurs
            countdown.textContent = t('Décollage !');
            rocketWrap.classList.remove('launch-shaking');
            igniteLaunchFlames(rocketWrap, scene);
            setTimeout(() => {
                // Étape 3 : décollage — la fusée s'envole (l'astronaute court déjà)
                countdown.classList.add('fading');
                rocketWrap.classList.add('lift-off');
                setTimeout(finish, 1900);
            }, 700);
        }
    }, stepMs);
}

// Flammes + fumée sous la fusée pendant le décollage
function igniteLaunchFlames(rocketWrap, sceneEl) {
    // Flammes dans le repere de la fusee : elles suivent le vol.
    // Positionnement calcule depuis ROCKET_PARTS (plus de valeurs CSS en
    // dur) : un jet sous chaque tuyere de booster + le jet central sous
    // les moteurs. Tolerie de proximite pour relier tuyere et jet.
    const flames = document.createElement('div');
    flames.className = 'launch-flames';
    rocketWrap.appendChild(flames);
    const nozzles = ROCKET_PARTS.filter(p => p.id === 'nozzles');
    const boosters = ROCKET_PARTS.filter(p => p.id.startsWith('boosters-'));
    const centerX = 50; // axe central de la fusee en %
    // Decalage du centre VISUEL des tuyeres dans chaque image de booster :
    // le contenu PNG n'est pas centre dans le canevas (boosters-left a du
    // remplissage transparent a droite, boosters-right a gauche).
    const BOOSTER_JET_OFFSET_PX = { 'boosters-left': -5, 'boosters-right': 4 };
    const jets = [];
    nozzles.forEach(n => jets.push({ cx: n.x, off: 0 }));
    boosters.forEach(b => jets.push({ cx: b.x, off: BOOSTER_JET_OFFSET_PX[b.id] || 0 }));
    if (jets.length === 0) {
        jets.push({ cx: centerX, off: 0 }, { cx: centerX, off: 0 }, { cx: centerX, off: 0 });
    }
    jets.forEach((j, i) => {
        const jet = document.createElement('div');
        jet.className = 'launch-flame-jet';
        jet.style.left = 'calc(' + j.cx + '% + ' + (j.off || 0) + 'px - 13px)'; // 13px = demi-largeur du jet
        jet.style.animationDelay = (i * 0.12) + 's';
        flames.appendChild(jet);
    });
    // Fumée au sol sur le pas de tir : elle ne décolle pas.
    // Ajoutée dans le monde scene-world pour suivre la meme echelle que la fusée.
    const world = document.getElementById('scene-world');
    if (world) {
        const smoke = document.createElement('div');
        smoke.className = 'launch-smoke';
        world.appendChild(smoke);
    }
}

function showLaunchResults(distance) {
    const modal = document.getElementById('launch-results-modal');
    const distanceElement = document.getElementById('launch-results-distance');
    const multiplierElement = document.getElementById('launch-results-multiplier');
    const rocketsElement = document.getElementById('launch-results-rockets');
    
    // Protéger contre NaN et undefined
    const safeDistance = isNaN(distance) || distance === undefined ? 0 : distance;
    const safeMultiplier = isNaN(prestigeMultiplier) || prestigeMultiplier === undefined ? 1 : prestigeMultiplier;
    const safeRockets = rocketsLaunched === undefined ? 0 : rocketsLaunched;
    
    distanceElement.textContent = formatNumber(safeDistance) + ' km';
    multiplierElement.textContent = safeMultiplier.toFixed(2);
    rocketsElement.textContent = safeRockets;
    const stardustEl = document.getElementById('launch-results-stardust');
    if (stardustEl) {
        const dustGained = calculateStardustGain(safeDistance);
        stardustEl.textContent = '+' + formatNumber(dustGained) + '  (total: ' + formatNumber(starDust) + ')';
    }
    
    modal.classList.add('active');
}

function closeLaunchResults() {
    document.getElementById('launch-results-modal').classList.remove('active');
}

// ============================================
// ANIMATION DE VOYAGE (apres decollage, avant la carte de l'espace)
// Plein ecran, verticale, pensee mobile : la fusee monte de la Terre
// (bas de l'ecran) vers la Lune (haut). Le compteur de km defile de 0
// jusqu'a la distance reellement atteinte par le lancer.
// ============================================
const TRAVEL_ANIM_LEG_MS = 6000;    // duree par troncon (Terre -> Lune = 1 troncon)
let travelAnimFrame = 0;
let travelStarsData = [];

// ============================================
// MOTEUR DE PROJECTION PERSPECTIVE (voyage spatial pseudo-3D)
// Axe de voyage : vertical, la fusee vise le HAUT de l'ecran. La
// profondeur z croit vers le haut. La camera (chase cam) est legerement
// AU-DESSUS et DERRIERE la fusee : la fusee est rendue au tiers inferieur,
// les astres proches apparaissent bas et gros, les astres lointains
// remontent vers l'horizon en rapetissant (parallaxe reelle).
// Unite de profondeur : 1 = distance camera->fusee (REL_ROCKET).
// ============================================

// Construit la fusee COMPLETE dans le holder, a l'echelle cible.
function buildTravelRocketInto(holder, targetH) {
    // Fusee du voyage : image dediee (Fusee-travel.png, 768x1376),
    // verticale et droite. Largeur deduite du ratio de l'image.
    const ROCKET_TRAVEL_IMG = 'images/rocket/Fusee-travel.png';
    const ROCKET_TRAVEL_RATIO = 768 / 1376;
    holder.innerHTML = '';
    const h = Math.max(1, targetH);
    const w = h * ROCKET_TRAVEL_RATIO;
    holder.style.width = w + 'px';
    holder.style.height = h + 'px';
    const img = document.createElement('img');
    img.src = ROCKET_TRAVEL_IMG;
    img.alt = '';
    img.style.position = 'absolute';
    img.style.inset = '0';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    holder.appendChild(img);
    // Flammes des TROIS moteurs : structure dediee proportionnelle a la
    // fusee. Positions mesurees sur Fusee-travel.png (tuyeres a 20.8%,
    // 50.3% et 79.8% de la largeur, sortie a ~86% de la hauteur). Chaque
    // jet = lueur externe + flamme principale (coeur blanc-jaune, colonne
    // orange) + base bleue + pointe fumeuse, animees independamment.
    const JETS = [
        { left: 20.8, scale: 0.9 },   // booster gauche
        { left: 50.3, scale: 1.0 },   // moteur central
        { left: 79.8, scale: 0.9 }    // booster droit
    ];
    const flames = document.createElement('div');
    flames.className = 'travel-flames';
    JETS.forEach((j, idx) => {
        const jet = document.createElement('div');
        jet.className = 'travel-jet';
        jet.style.left = j.left + '%';
        jet.style.setProperty('--jet-scale', String(j.scale));
        jet.style.setProperty('--jet-delay', (idx * 0.06) + 's');
        const glow = document.createElement('div');
        glow.className = 'travel-flame-glow';
        const core = document.createElement('div');
        core.className = 'travel-flame-core';
        const blue = document.createElement('div');
        blue.className = 'travel-flame-blue';
        const tip = document.createElement('div');
        tip.className = 'travel-flame-tip';
        core.appendChild(blue);
        core.appendChild(tip);
        jet.appendChild(glow);
        jet.appendChild(core);
        flames.appendChild(jet);
    });
    holder.appendChild(flames);
}

// Projection d'un astre (decalage lateral lat, profondeur z) sur
// l'ecran pour une camera a la profondeur cameraZ. Tous les astres
// restent proches de l'axe central (composition mobile).
function travelProject(lat, z, cameraZ, W, horizonY, pitchK, baseSize) {
    const rel = z - cameraZ;                 // profondeur relative
    if (rel <= 0.08) return { visible: false };
    const inv = 1 / rel;                     // 1 = profondeur de la fusee
    return {
        x: W / 2 + lat * 0.5 * W * inv,      // parallaxe laterale
        y: horizonY + pitchK * inv,          // proche = bas, loin = horizon
        size: baseSize * inv,                 // echelle perspective
        inv: inv,
        visible: true
    };
}

function playTravelAnimation(distance, onDone) {
    const overlay = document.getElementById('travel-overlay');
    if (!overlay || typeof distance !== 'number' || isNaN(distance)) {
        if (onDone) onDone();
        return;
    }
    cancelAnimationFrame(travelAnimFrame);
    const deepEl = document.getElementById('travel-deep');
    const rocketEl = document.getElementById('travel-rocket');
    const distanceEl = document.getElementById('travel-distance-value');
    const skipBtn = document.getElementById('travel-skip');
    const safeDistance = Math.max(0, distance);

    const H = window.innerHeight || 800;
    const W = window.innerWidth || 400;

    // --- Chase cam legerement au-dessus et derriere la fusee ---
    // La fusee est le point focal : fixe au tiers inferieur, inclinee
    // dans son axe de voyage (nez vers la destination), avec un leger
    // abaissement d'arriere (vue surelevee, pas un sprite 2D plat).
    const rocketX = W * 0.5;
    // Cam plus HAUTE au-dessus de l'axe : la fusee est rendue plus bas,
    // l'horizon descend, la pente fusee->horizon s'accentue (vue plongeante
    // plus marquee sur la ligne de planetes).
    const rocketY = H * 0.70;
    const horizonY = H * 0.20;
    // pitchK : ecart vertical fusee->horizon pour un astre a la profondeur
    // de la fusee (rel=1) -> l'astre affleure la fusee.
    const pitchK = (rocketY - horizonY);
    // Facteur global d'echelle des planetes : -20% (vue un peu plus
    // reculee, comme si la camera etait plus loin de l'axe).
    const PLANET_SCALE = 0.8;
    const baseSize = W * 0.52 * PLANET_SCALE;
    // Fusee VERTICALE et DROITE (image dediee, aucune inclinaison).

    if (rocketEl) buildTravelRocketInto(rocketEl, H * 0.24);

    // --- Itineraire : planetes de PLANETS jusqu'a la destination atteinte
    // (structure du jeu inchangee : Terre -> Lune -> Mars -> ...).
    const reached = PLANETS.filter(p => safeDistance >= p.distanceRequired);
    const target = reached[reached.length - 1] || PLANETS[0];
    const itinerary = PLANETS.slice(0, PLANETS.indexOf(target) + 1);
    // Etapes espacees : 5 unites de profondeur par planete -> la
    // destination demarre tres loin (point minuscule a l'horizon), les
    // intermediaires demandent un vrai trajet. zMax = profondeur de la cible.
    const DEPTH_STEP = 5;
    // Fenetre de visibilite : au plus deux planetes devant la camera
    // (la suivante en micro-point a l'horizon), rien au-dela.
    const TRAVEL_LOOKAHEAD = 2 * DEPTH_STEP + 1.15;
    const zMax = (itinerary.length - 1) * DEPTH_STEP;

    // Trajet de la camera : demarre PRES de la Terre (gros bout de
    // planet en bas d'ecran, comme juste apres le decollage), accelere
    // puis maintient sa vitesse de croisiere jusqu'a la cible (aucune
    // deceleration, meme a l'arrivee).
    const CAM_START = -0.85;                 // Terre a rel ~0.85 au depart
    const CAM_END = zMax - 1.15;             // cible a rel ~1.15 a l'arrivee
    // Temps EQUIVALENT par troncon : Terre -> Lune garde sa duree, chaque
    // planete supplementaire ajoute un troncon de meme duree (Mars = deux
    // fois Terre -> Lune).
    const legs = itinerary.length - 1;
    const animMs = Math.max(1, legs) * TRAVEL_ANIM_LEG_MS;

    // Corps celestes generes dynamiquement (calque de profondeur)
    // Le Nuage d'Oort n'a PAS de sprite : il est remplace par le champ
    // volumetrique procedural (oortField) -- troncon, timing et km
    // inchanges, uniquement la representation visuelle.
    deepEl.innerHTML = '';
    // Index du Nuage d'Oort dans l'itineraire (calcule AVANT bodies :
    // sert a rendre la planete suivante plus discrete en sortie de nuage).
    const oortIdx = itinerary.findIndex(p => p.id === 'oort-cloud');
    const bodies = itinerary.map((p, i) => {
        if (p.id === 'oort-cloud') {
            return { el: null, z: i * DEPTH_STEP, lat: 0, scale: 1, hidden: true };
        }
        const el = document.createElement('div');
        el.className = 'travel-body';
        const img = document.createElement('img');
        img.src = p.imgPath;
        img.alt = '';
        el.appendChild(img);
        deepEl.appendChild(el);
        // Composition : toutes les planetes sur l'axe central, sans
        // decalage laterale (meme la Terre).
        const lat = 0;
        // La Terre un peu plus petite que l'echelle globale des planetes.
        const scale = (i === 0) ? 0.75 : 1;
        // La planete qui suit le Nuage d'Oort est plus discrete : elle
        // se reveille en tout petit seulement apres la traversee, pour
        // ne pas gacher l'immersion dans le nuage.
        const afterOort = i === oortIdx + 1;
        return { el, z: i * DEPTH_STEP, lat, scale, distant: afterOort };
    });

    // --- Nuage d'Oort : champ volumetrique de debris glaces ---
    // La camera traverse un VOLUME 3D d'objets : les 5 images dediees
    // de l'utilisateur (images/effects/) remplacee les modeles proceduraux.
    // Trois couches de profondeur, densite progressive (aucune apparition
    // brutale), projection et z-index identiques aux planetes. Aucune
    // logique de voyage modifiee -- uniquement la representation visuelle.
    let oortDensity = () => 0;
    const oortField = [];
    const smooth01 = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    if (oortIdx >= 0) {
        const oortZ = oortIdx * DEPTH_STEP;
        // Champ elargi et montee plus douce : les premiers cailloux
        // apparaissent PLUS TOT (des le passage de Pluton), la densite
        // monte progressivement vers le plein regime au milieu du
        // nuage, puis redescent doucement -- jamais de mur de rochers.
        // Champ confine a la region du nuage : la traversee commence
        // avant la position Oort (premiers cailloux anticipes) mais
        // s'ARRETE pile a la position du nuage -- au-dela on en ressort
        // et l'espace redevient vide.
        const FIELD_Z0 = oortZ - 7.5;
        const FIELD_Z1 = oortZ + 0.5;
        oortDensity = (cam) => {
            if (cam <= FIELD_Z0 || cam >= FIELD_Z1) return 0;
            return Math.min(smooth01((cam - FIELD_Z0) / 5.5), smooth01((FIELD_Z1 - cam) / 1.6));
        };
        const rand = (a, b) => a + Math.random() * (b - a);
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        // Les 5 modeles d'objets du nuage (images dediees, tailles
        // natives heterogenes -- les tailles ecran sont fixees par couche).
        const OORT_MODELS = [
            { cls: 'oort-ice', img: 'images/effects/Small irregular icy nucleus.png', ar: 197 / 184 },
            { cls: 'oort-comet', img: 'images/effects/Small comet nucleus.png', ar: 182 / 165 },
            { cls: 'oort-fragment', img: 'images/effects/Ice-rock fragment.png', ar: 218 / 244 },
            { cls: 'oort-asteroid', img: 'images/effects/Dark rocky asteroid.png', ar: 159 / 156 },
            { cls: 'oort-large', img: 'images/effects/Large rare Oort Cloud body.png', ar: 289 / 281 }
        ];
        const addObj = (layer, model, size, op, ox, oy, z) => {
            const el = document.createElement('div');
            el.className = 'travel-oort ' + model.cls;
            const img = document.createElement('img');
            img.src = model.img;
            img.alt = '';
            img.draggable = false;
            el.appendChild(img);
            el.style.display = 'none';
            deepEl.appendChild(el);
            oortField.push({
                el, layer, z, ox, oy, size, op, on: false, ar: model.ar,
                gate: layer === 0 ? 0.02 : (layer === 1 ? 0.14 : 0.30),
                stag: Math.random(),
                rot: rand(0, 360),
                spin: rand(-40, 40)
            });
        };
        // Petits modeles (4) pour les couches lointaine et moyenne.
        const SMALLS = OORT_MODELS.slice(0, 4);
        // Couche 1 -- tres loin : minuscules points glaces (immensite,
        // quasi immobiles, ils habillent la profondeur).
        for (let i = 0; i < 140; i++) {
            addObj(0, pick(SMALLS),
                rand(5, 11), rand(0.25, 0.55),
                rand(-1.15, 1.15) * W, rand(-0.85, 0.85) * H,
                rand(FIELD_Z0, FIELD_Z1));
        }
        // Couche 2 -- distance moyenne : fragments et asteroides
        // visibles, tailles variees, parallaxe marquee -- repartis sur
        // TOUT l'ecran, pas seulement l'axe central.
        for (let i = 0; i < 110; i++) {
            addObj(1, pick(SMALLS),
                rand(16, 44), rand(0.5, 0.85),
                rand(-1.05, 1.05) * W, rand(-0.75, 0.75) * H,
                rand(FIELD_Z0 + 0.5, FIELD_Z1 - 0.5));
        }
        // Couche 3 -- fly-by proches : gros blocs rares qui traversent
        // vite le champ de vision, avec streak radial (motion blur).
        for (let i = 0; i < 36; i++) {
            addObj(2, pick(OORT_MODELS),
                rand(45, 110), rand(0.75, 0.95),
                (Math.random() < 0.5 ? -1 : 1) * rand(0.16, 0.46) * W,
                rand(-0.26, 0.26) * H,
                rand(FIELD_Z0 + 1.5, FIELD_Z1 - 1.5));
        }
        // Couche 4 -- AUTOUR DE LA CAMERA : gros blocs derives sur les
        // bords de l'ecran, au niveau de la camera elle-meme (rel tres
        // faible). La camera est DANS le nuage : des cailloux l'entourent,
        // passent devant la fusee et derriere elle.
        for (let i = 0; i < 24; i++) {
            addObj(2, pick(OORT_MODELS),
                rand(50, 130), rand(0.6, 0.9),
                (Math.random() < 0.5 ? -1 : 1) * rand(0.55, 1.15) * W,
                rand(-0.7, 0.7) * H,
                rand(FIELD_Z0 + 0.3, FIELD_Z1 - 0.3));
        }
    }

    // --- Couche vitesse : trainees de vitesse radiales 3D ---
    // Chaque trainee vit dans le volume devant la camera (comme les
    // etoiles et le nuage d'Oort) : elle coule depuis le point de fuite
    // vers les bords de l'ecran, alignee sur l'axe camera -> trainee,
    // et s'allonge avec la vitesse et la proximite.
    const streaksEl = document.createElement('div');
    streaksEl.className = 'travel-streaks';
    const oldStreaks = overlay.querySelectorAll('.travel-streaks');
    for (let i = 0; i < oldStreaks.length; i++) oldStreaks[i].remove();
    overlay.appendChild(streaksEl);
    const streaks = [];
    const streakCount = 78;
    for (let i = 0; i < streakCount; i++) {
        const s = document.createElement('div');
        s.className = 'travel-streak';
        s.style.opacity = '0';
        streaksEl.appendChild(s);
        streaks.push({
            el: s,
            ox: (Math.random() * 2 - 1) * 0.8,
            oy: (Math.random() * 2 - 1) * 0.65,
            rel: 0.3 + Math.random() * 3.2,
            depth: 0.35 + Math.random() * 0.75
        });
    }

    const startTime = performance.now();
    let lastNow = startTime;
    let finished = false;

    const cleanup = () => {
        cancelAnimationFrame(travelAnimFrame);
        overlay.classList.remove('active');
        if (skipBtn) skipBtn.removeEventListener('click', skipHandler);
        if (finished) {
            if (onDone) onDone();
        }
    };
    const skipHandler = () => finish();

    function finish() {
        if (finished) return;
        finished = true;
        if (distanceEl) distanceEl.textContent = formatNumber(safeDistance);
        setTimeout(cleanup, 240);
    }

    const lerp = (a, b, t) => a + (b - a) * t;
    const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    // Profil de vitesse : ACCELERATION CONSTANTE du depart a la cible.
    // Vitesse calibree sur la route GLOBALE Terre -> Virgo : la vitesse
    // finale d'un voyage depend de sa position sur la route complete
    // (Lune = lente, Virgo = vitesse MAX). Chaque nouveau record va donc
    // plus vite que le precedent -- la vitesse max n'est atteinte QUE
    // lors de l'arrivee a Virgo.
    const totalLegs = PLANETS.length - 1; // Terre -> Virgo (route complete)
    // Multiplicateur de vitesse du fond : LINEAIRE sur la position absolue
    // de la fusee sur la route Terre -> Virgo (pas sur le voyage en cours).
    // Passer Mars dans un voyage long montre exactement les memes effets
    // que l'arrivee a Mars d'un voyage court : coherent partout.
    // Plafond volontairement INSENSE : la vitesse finale (Virgo) est
    // abstraitement enorme -- le fond doit donner l'impression d'un
    // trou de ver, quitte a defier la realite. Reste lineaire et ancre
    // a la position absolue : Terre = 1, Virgo = 8.
    const VIRGO_SPEED_MAX = 8;
    // Vitesse camera CONSTANTE PAR TRONCON : chaque troncon dure
    // exactement TRAVEL_ANIM_LEG_MS (6s), de l'echapement de la planete
    // au passage de la suivante. La fusee croise chaque planete pile a
    // la frontiere 6s/6s -- la sensation d'acceleration vient du fond,
    // du compteur km (distances reelles croissantes) et des trainees.
    const camAt = (t) => {
        if (legs <= 0) return CAM_START;
        const scaled = Math.min(t, 1) * legs;
        const k = Math.min(legs - 1, Math.floor(scaled));
        // Le premier troncon part de CAM_START (derriere la Terre, bien
        // visible au depart) ; les suivants de la planete k a la k+1.
        const from = (k === 0) ? CAM_START : k * DEPTH_STEP;
        const to = (k === legs - 1) ? CAM_END : (k + 1) * DEPTH_STEP;
        return lerp(from, to, scaled - k);
    };
    // Position absolue normalisee sur la route COMPLETE (0 Terre, 1 Virgo) :
    // troncons deja franchis + avancement dans le troncon courant.
    const posAt = (t) => {
        if (legs <= 0) return 0;
        const scaled = Math.min(t, 1) * legs;
        const k = Math.min(legs - 1, Math.floor(scaled));
        return Math.min(1, (k + (scaled - k)) / totalLegs);
    };
    // Compteur km : interpolation REELLE entre planetes. Quand la camera
    // croise la Lune, le compteur lit exactement 384 400 km, quel que soit
    // le voyage ; la vitesse en km/s s'adapte donc a chaque troncon. Le
    // troncon final se termine sur la distance reellement atteinte.
    const kmAt = (cam) => {
        if (cam <= CAM_START) return 0;
        const last = itinerary.length - 1;
        const bounds = [];
        for (let i = 1; i <= last - 1; i++) bounds.push(i * DEPTH_STEP);
        bounds.push(CAM_END);
        for (let i = 0; i < bounds.length; i++) {
            // Le premier troncon part de CAM_START : le compteur monte
            // des la premiere image, fini le 0 km fige alors qu'on avance.
            const z0 = (i === 0) ? CAM_START : bounds[i - 1];
            const z1 = bounds[i];
            if (cam < z1 || i === bounds.length - 1) {
                const d0 = itinerary[i].distanceRequired;
                const d1 = (i === last - 1) ? safeDistance : itinerary[i + 1].distanceRequired;
                const f = Math.max(0, Math.min(1, (cam - z0) / (z1 - z0)));
                return d0 + (d1 - d0) * f;
            }
        }
        return itinerary[last].distanceRequired;
    };

    const tick = (now) => {
        if (finished) return;
        const linear = Math.min(1, (now - startTime) / animMs);
        const cameraZ = camAt(linear);
        // Vitesse visuelle du fond : LINEAIRE, ancree a la position absolue
        // sur la route (troncon courant + avancement dedans). Quasi
        // immobile pres de la Terre, plein regime uniquement a Virgo --
        // et identique a toute passe precedente, quel que soit le voyage.
        const dt = Math.min(0.05, (now - lastNow) / 1000);
        lastNow = now;
        const posNow = Math.min(1, posAt(linear));
        const speedNorm = posNow;                      // 0 Terre -> 1 Virgo
        const speed = 1 + speedNorm * (VIRGO_SPEED_MAX - 1);

        // ---- Fusee : point focal ----
        // Leger balancement organique : derive latérale douce + avance/
        // recul dans l'axe de voyage (fleche verticale + tres legere
        // variation d'echelle pour la profondeur). Fusée toujours
        // verticale et droite, aucun tangage -- juste assez de vie pour
        // que la scene ne soit pas statique.
        if (rocketEl) {
            const ph = (now - startTime) / 1000;
            const swayX = Math.sin(ph * 0.9 + 0.4) * 14 + Math.sin(ph * 1.7) * 6;
            const swayY = Math.sin(ph * 0.6) * 10;
            const breathe = 1 + Math.sin(ph * 0.6 + 1.2) * 0.024;
            rocketEl.style.left = (rocketX + swayX) + 'px';
            rocketEl.style.top = (rocketY + swayY) + 'px';
            rocketEl.style.transform = 'translate(-50%, -50%) scale(' + breathe.toFixed(4) + ')';
        }

        // ---- Compteur de km : distances reelles, synchronisees au
        // passage effectif de chaque planete ----
        if (distanceEl) distanceEl.textContent = formatNumber(Math.floor(legs > 0 ? kmAt(cameraZ) : safeDistance * easeInOut(linear)));

        // ---- Fond en parallaxe RADIALE 3D : chaque etoile vit dans le
        // volume devant la camera. Elle s'approche a une vitesse
        // proportionnelle a la vitesse reelle (les proches filent plus
        // vite que les lointaines) et coule depuis le point de fuite
        // (horizon) vers les bords -- coherent avec la vue chase-cam
        // et la projection des planetes / du nuage d'Oort.
        travelStarsData.forEach(st => {
            st.rel -= speed * st.depth * 0.7 * dt;
            if (st.rel < 0.12) {
                // Recyclage : l'etoile a depasse la camera, on la renvoie
                // au fond du volume avec un nouvel angle.
                st.rel = 2.6 + Math.random() * 0.9;
                st.ox = (Math.random() * 2 - 1) * 0.85;
                st.oy = (Math.random() * 2 - 1) * 0.7;
            }
            const inv = 1 / st.rel;
            const x = W / 2 + st.ox * 0.5 * W * inv;
            const y = horizonY + pitchK * inv + st.oy * H * 0.85 * inv;
            st.el.style.left = x.toFixed(1) + 'px';
            st.el.style.top = y.toFixed(1) + 'px';
            // Grossit en s'approchant, scintillement conserve.
            const sz = Math.min(5, st.size * (0.6 + inv * 0.55));
            st.el.style.width = sz.toFixed(1) + 'px';
            st.el.style.height = sz.toFixed(1) + 'px';
            // Sorties d'ecran masquees (l'etoile reapparaitra au recyclage).
            if (x < -6 || x > W + 6 || y < -6 || y > H + 6) {
                st.el.style.opacity = '0';
            } else {
                st.el.style.opacity = '';
            }
        });
        // ---- Trainees de vitesse RADIALES : chaque trainee vit dans le
        // volume devant la camera. Elle coule depuis le point de fuite,
        // alignee sur son propre axe camera -> trainee, et s'allonge
        // avec la vitesse et la proximite -- meme physique que les
        // etoiles et le nuage d'Oort.
        streaks.forEach(s => {
            s.rel -= speed * s.depth * 0.8 * dt;
            if (s.rel < 0.15) {
                s.rel = 2.6 + Math.random() * 0.9;
                s.ox = (Math.random() * 2 - 1) * 0.8;
                s.oy = (Math.random() * 2 - 1) * 0.65;
            }
            const inv = 1 / s.rel;
            const x = W / 2 + s.ox * 0.5 * W * inv;
            const y = horizonY + pitchK * inv + s.oy * H * 0.85 * inv;
            // Direction du flot au point projete : vecteur point de
            // fuite -> trainee, normalise.
            const dx = x - W / 2;
            const dy = y - horizonY;
            const len = Math.max(1, Math.hypot(dx, dy));
            const ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
            // Longueur : croit avec la vitesse et la proximite.
            const streakLen = (16 + speedNorm * 150) * (0.35 + inv * 0.5);
            s.el.style.left = x.toFixed(1) + 'px';
            s.el.style.top = y.toFixed(1) + 'px';
            s.el.style.height = streakLen.toFixed(1) + 'px';
            s.el.style.transform = 'translate(-50%, -50%) rotate(' + ang.toFixed(1) + 'deg)';
            // Opacite : visible des les premieres planetes, LINEAIRE
            // sur la position absolue, pleine a haute vitesse.
            const op = Math.min(1, 0.32 + 0.68 * speedNorm) * (0.3 + s.depth * 0.7) * Math.min(1, inv * 0.9);
            if (x < -20 || x > W + 20 || y < -20 || y > H + 20) {
                s.el.style.opacity = '0';
            } else {
                s.el.style.opacity = op.toFixed(2);
            }
        });

        // ---- Astres : projection perspective + fondu de depassement ----
        bodies.forEach(b => {
            if (b.hidden) return;
            // Fenetre de visibilite : on ne montre pas toute la ligne de
            // planetes, seulement les deux prochaines (la 2e en micro-point).
            // La planete qui suit le Nuage d'Oort apparait PLUS TARD et
            // PLUS PETITE (fenetre resserree).
            // TOUTES les planetes apparaissent en DOUCEUR : meme fondu
            // d'entree que Proxima (smoothstep sur l'opacite des
            // premieres unites de profondeur apres l'entree en fenetre),
            // puis croissance perspective purement monotone.
            const lookahead = b.distant ? 9 : TRAVEL_LOOKAHEAD;
            if (b.z - cameraZ > lookahead) {
                b.el.style.display = 'none';
                return;
            }
            b.el.style.display = '';
            const pr = travelProject(b.lat, b.z, cameraZ, W, horizonY, pitchK, baseSize);
            if (!pr.visible) {
                b.el.style.opacity = '0';
                return;
            }
            b.el.style.left = pr.x.toFixed(1) + 'px';
            b.el.style.top = pr.y.toFixed(1) + 'px';
            // Entree en douceur generalisee : fondu d'opacite au moment
            // ou la planete entre dans sa fenetre de visibilite, taille
            // de depart reduite pour la planete post-Oort.
            const rel = b.z - cameraZ;
            const fadeIn = Math.max(0, Math.min(1, (lookahead - rel) / 2.5));
            b.el.style.opacity = (fadeIn * fadeIn * (3 - 2 * fadeIn)).toFixed(2);
            b.el.style.width = Math.max(6, pr.size * (b.scale || 1) * (b.distant ? 0.85 : 1)).toFixed(1) + 'px';
            b.el.style.transform = 'translate(-50%, -50%)';
            // Ordre de peinture par profondeur : plus un astre est proche,
            // plus il est peint au-dessus (z eleve). Les astres passes
            // derriere la camera gardent leur ordre naturel.
            b.el.style.zIndex = String(Math.max(1, Math.round(pr.inv * 10) + 1));
            // A la sortie : l'astre depasse la camera en grossissant et
            // sort naturellement de l'ecran par le bas, plein echelle.
        });

        // ---- Nuage d'Oort : traverssee volumetrique ----
        // Densite progressive : vide -> premiers objets -> immersion.
        // Chaque objet n'apparait que si la densite locale depasse son
        // seuil (reparti par couche + alea de staging) -> montee douce,
        // jamais un mur de rochers d'un coup.
        if (oortField.length > 0) {
            const density = oortDensity(cameraZ);
            oortField.forEach(o => {
                const rel = o.z - cameraZ;
                // Un objet depasse par la camera (rel <= 0) n'est PLUS
                // rendu : le rendu miroir le faisait retr ecir apres le
                // passage, comme s'il filait dans le meme sens que la
                // fusee. Il grossit, croise la camera, disparait --
                // exactement comme les planetes.
                if (density <= 0 || rel <= 0.05 || rel > TRAVEL_LOOKAHEAD * 1.6) {
                    if (o.on) { o.el.style.display = 'none'; o.on = false; }
                    return;
                }
                const local = Math.max(0, Math.min(1, (density - o.gate * 0.55) / (1 - o.gate * 0.55)));
                const appear = smooth01(local - o.stag * 0.85);
                if (appear <= 0.01) {
                    if (o.on) { o.el.style.display = 'none'; o.on = false; }
                    return;
                }
                const inv = 1 / Math.max(0.12, rel);
                const sx = W / 2 + o.ox * inv;
                const sy = horizonY + pitchK * inv + o.oy * inv;
                const size = Math.max(1.5, o.size * inv);
                const op = o.op * appear * Math.min(1, rel * 2.2);
                if (!o.on) { o.el.style.display = ''; o.on = true; }
                o.el.style.left = sx.toFixed(1) + 'px';
                o.el.style.top = sy.toFixed(1) + 'px';
                o.el.style.width = size.toFixed(1) + 'px';
                o.el.style.height = (size / o.ar).toFixed(1) + 'px';
                o.el.style.opacity = op.toFixed(2);
                o.el.style.transform = 'translate(-50%, -50%) rotate(' + (o.rot + o.spin * (o.layer === 2 ? 2.2 : 0.5)) + 'deg)';
                // Ordre de peinture identique aux planetes : plus c'est
                // proche, plus c'est peint au-dessus. Les fly-by proches
                // passent devant la fusee (z-index 12+).
                // Ordre de peinture identique aux planetes : plus c'est
                // proche, plus c'est peint au-dessus.
                o.el.style.zIndex = String(Math.min(30, Math.round(inv * 10) + 1));
                // Streak de motion blur sur les objets proches : le halo
                // s'allonge avec la proximite (sensation de vitesse).
                if (o.layer === 2) {
                    o.el.style.setProperty('--streak', Math.min(1, (inv - 1) / 1.6).toFixed(2));
                }
            });
        }

        if (linear >= 1) {
            finish();
            return;
        }
        travelAnimFrame = requestAnimationFrame(tick);
    };

    // Initialisation
    if (rocketEl) {
        rocketEl.style.left = rocketX + 'px';
        rocketEl.style.top = rocketY + 'px';
        rocketEl.style.transform = 'translate(-50%, -50%)';
    }
    if (distanceEl) distanceEl.textContent = '0';
    fillTravelStars(overlay);
    overlay.classList.add('active');
    if (skipBtn) skipBtn.addEventListener('click', skipHandler);
    travelAnimFrame = requestAnimationFrame(tick);
}

function fillTravelStars(overlay) {
    // Etoiles reconstruites a chaque voyage : positions pilotees en JS
    // (parallaxe selon la profondeur propre a chaque etoile).
    const starsEl = overlay.querySelector('.travel-stars');
    if (!starsEl) return;
    starsEl.innerHTML = '';
    travelStarsData = [];
    const count = 210;
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'travel-star';
        if (Math.random() < 0.5) star.classList.add('twinkle');
        const size = Math.random() * 2.2 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.animationDelay = (Math.random() * 1.6) + 's';
        starsEl.appendChild(star);
        // Champ 3D radial : chaque etoile vit dans le volume devant la
        // camera (decalage ox/oy + profondeur rel). Projettee depuis le
        // point de fuite (horizon) comme les planetes et le nuage d'Oort,
        // elle coule vers la camera -- coherent avec la chase-cam.
        travelStarsData.push({
            el: star,
            ox: (Math.random() * 2 - 1) * 0.85,
            oy: (Math.random() * 2 - 1) * 0.7,
            rel: 0.25 + Math.random() * 3.25,
            depth: 0.35 + Math.random() * 0.75,
            size: size
        });
    }
}

// ============================================
// SPACE MAP FUNCTIONS
// ============================================

function calculatePlanetProgress(distance) {
    // Trouver quelle planète on atteint et le pourcentage entre les planètes
    let currentPlanetIndex = -1;
    let nextPlanetIndex = -1;
    let progressPercent = 0;

    for (let i = PLANETS.length - 1; i >= 0; i--) {
        if (distance >= PLANETS[i].distanceRequired) {
            currentPlanetIndex = i;
            break;
        }
    }

    // Earth (index 0) est le point de départ, pas un objectif.
    // On la traite comme si on n'avait pas encore atteint de planète.
    if (currentPlanetIndex <= 0) {
        return {
            currentPlanet: null,
            nextPlanet: PLANETS[1],
            progressPercent: Math.round((distance / PLANETS[1].distanceRequired) * 100)
        };
    }

    if (currentPlanetIndex === PLANETS.length - 1) {
        // Amas de la Vierge atteint (max)
        return {
            currentPlanet: PLANETS[currentPlanetIndex],
            nextPlanet: null,
            progressPercent: 100
        };
    }

    // Calculer le progrès vers la prochaine planète
    const currentPlanet = PLANETS[currentPlanetIndex];
    const nextPlanet = PLANETS[currentPlanetIndex + 1];
    const distanceBetween = nextPlanet.distanceRequired - currentPlanet.distanceRequired;
    const distanceFromCurrent = distance - currentPlanet.distanceRequired;
    progressPercent = Math.round((distanceFromCurrent / distanceBetween) * 100);

    return {
        currentPlanet: currentPlanet,
        nextPlanet: nextPlanet,
        progressPercent: progressPercent
    };
}

function getNextTwoPlanets(distance) {
    // Retourne uniquement les 2 prochaines planètes à atteindre
    const progress = calculatePlanetProgress(distance);
    const currentIndex = progress.currentPlanet ? PLANETS.findIndex(p => p.id === progress.currentPlanet.id) : -1;
    
    let nextPlanets = [];
    
    if (currentIndex === -1) {
        // Pas encore atteint la Lune, afficher Lune et Mars
        nextPlanets = [PLANETS[1], PLANETS[2]];
    } else if (currentIndex >= PLANETS.length - 2) {
        // A atteint ou dépassé l'avant-dernière planète
        nextPlanets = [PLANETS[PLANETS.length - 2], PLANETS[PLANETS.length - 1]];
    } else {
        // Afficher la planète actuelle et la prochaine
        nextPlanets = [PLANETS[currentIndex], PLANETS[currentIndex + 1]];
    }
    
    return nextPlanets;
}

function checkNewPlanetsUnlocked(distance) {
    const newlyUnlocked = [];
    
    PLANETS.forEach(planet => {
        if (planet.id === 'earth') return;
        if (distance >= planet.distanceRequired && !unlockedPlanets.has(planet.id)) {
            newlyUnlocked.push(planet);
        }
    });
    
    return newlyUnlocked;
}

function applyNewPlanets(newlyUnlocked) {
    newlyUnlocked.forEach(planet => {
        unlockedPlanets.add(planet.id);
        planetBonuses[planet.id] = planet.bonusPercent / 100;
    });
}

function getTotalPlanetBonus() {
    let total = 0;
    Object.values(planetBonuses).forEach(bonus => {
        total += bonus;
    });
    return total;
}

function showSpaceMap(distance) {
    const modal = document.getElementById('space-map-modal');
    const mapContainer = document.getElementById('space-map-container');
    const progressText = document.getElementById('space-progress-text');
    const newUnlocksContainer = document.getElementById('new-planets-unlocked');
    
    // Calculer la progression
    const progress = calculatePlanetProgress(distance);
    
    // Mettre à jour le texte de progression
    if (progress.currentPlanet) {
        if (progress.nextPlanet) {
            progressText.innerHTML = `${t("Tu as atteint")} <strong>${t(progress.currentPlanet.name)}</strong> ! ${t("En route vers")} ${t(progress.nextPlanet.name)} (${progress.progressPercent}%)`;
        } else {
            progressText.innerHTML = `${t("F\u00e9licitations ! Tu as atteint")} <strong>${t(progress.currentPlanet.name)}</strong>, ${t("la dernière planète !")}`;
        }
    } else {
        progressText.innerHTML = `${t("En route vers")} <strong>${t(progress.nextPlanet.name)}</strong> (${progress.progressPercent}%)`;
    }
    
    // Vérifier les nouvelles planètes débloquées
    const newlyUnlocked = checkNewPlanetsUnlocked(distance);
    
    // Afficher les nouvelles planètes débloquées
    newUnlocksContainer.innerHTML = '';
    if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach(planet => {
            const planetElement = document.createElement('div');
            planetElement.className = 'new-planet-item';
            planetElement.innerHTML = `
                <span class="planet-name">${planet.name}</span>
                <span class="planet-bonus">+${planet.bonusPercent}% ${t("Parts")}/s</span>
            `;
            planetElement.style.borderColor = planet.color;
            planetElement.style.color = planet.color;
            newUnlocksContainer.appendChild(planetElement);
        });
    } else {
        newUnlocksContainer.innerHTML = '<p class="no-new-planets">' + t('Aucune nouvelle planète débloquée') + '</p>';
    }
    
    // Dessiner la carte de l'espace
    drawSpaceMap(distance);
    
    // Afficher le modal
    modal.classList.add('active');
}

function drawSpaceMap(distance) {
    const container = document.getElementById('space-map-container');
    const progress = calculatePlanetProgress(distance);
    
    container.innerHTML = '';
    
    // Espacement fixe entre planètes (px) pour éviter le chevauchement
    const planetSpacing = 140;
    const planetSize = 80;
    const labelSpace = 50;
    const totalWidth = PLANETS.length * planetSpacing;
    container.style.width = `${totalWidth}px`;
    
    // Index de la planète actuelle (base pour le flou des planètes lointaines)
    const currentPlanetIndex = progress.currentPlanet
        ? PLANETS.findIndex(p => p.id === progress.currentPlanet.id)
        : 0;
    
    PLANETS.forEach((planet, index) => {
        const planetElement = document.createElement('div');
        planetElement.className = 'space-planet';
        
        const isUnlocked = unlockedPlanets.has(planet.id) || distance >= planet.distanceRequired;
        const isCurrent = progress.currentPlanet && progress.currentPlanet.id === planet.id;
        const isNext = progress.nextPlanet && progress.nextPlanet.id === planet.id;
        const isHidden = index > currentPlanetIndex + 2;
        
        let className = 'space-planet';
        if (isUnlocked) className += ' unlocked';
        if (isCurrent) className += ' current';
        if (isNext) className += ' next';
        if (isHidden) className += ' hidden';
        
        planetElement.className = className;
        
        // Planètes cachées: cercle noir avec point d'interrogation
        if (isHidden) {
            planetElement.innerHTML = `
                <div class="planet-unknown" style="width: ${planetSize}px; height: ${planetSize}px;">?</div>
                <span class="planet-name">???</span>
                <span class="planet-distance">???</span>
            `;
        } else {
            // Utiliser l'image si disponible, sinon l'emoji
            let planetHtml = '';
            if (planet.imgPath) {
                planetHtml = `<img src="${planet.imgPath}" class="planet-image" alt="${planet.name}" style="width: ${planetSize}px; height: ${planetSize}px;">`;
            } else {
                planetHtml = `<span class="planet-emoji">${planet.emoji}</span>`;
            }
            
            planetElement.innerHTML = `
                ${planetHtml}
                <span class="planet-name">${planet.name}</span>
                <span class="planet-distance">${formatNumber(planet.distanceRequired)} ${t("km")}</span>
            `;
        }
        
        planetElement.style.setProperty('--planet-color', planet.color);
        
        // Positionner les planètes (layout horizontal en px)
        const position = index * planetSpacing + planetSpacing / 2;
        planetElement.style.left = `${position}px`;
        
        // Ajouter la ligne de connexion (sauf pour la dernière)
        if (index < PLANETS.length - 1) {
            const nextPlanet = PLANETS[index + 1];
            const isNextUnlocked = unlockedPlanets.has(nextPlanet.id) || distance >= nextPlanet.distanceRequired;
            
            const line = document.createElement('div');
            line.className = 'space-connection';
            if (isUnlocked && isNextUnlocked) {
                line.classList.add('active');
            }
            line.style.left = `${position}px`;
            line.style.width = `${planetSpacing}px`;
            container.appendChild(line);
        }
        
        container.appendChild(planetElement);
    });
    
    // Ajouter le vaisseau spatial
    if (progress.currentPlanet || progress.progressPercent > 0) {
        const spaceship = document.createElement('div');
        spaceship.className = 'spaceship';
        spaceship.innerHTML = '\u{1F680}';
        
        // Calculer la position du vaisseau
        let shipPosition = planetSpacing / 2;
        if (progress.currentPlanet) {
            const currentIndex = PLANETS.findIndex(p => p.id === progress.currentPlanet.id);
            const nextIndex = currentIndex + 1;
            
            if (nextIndex < PLANETS.length && progress.nextPlanet) {
                // Entre deux planètes
                const startPos = currentIndex * planetSpacing + planetSpacing / 2;
                const endPos = nextIndex * planetSpacing + planetSpacing / 2;
                shipPosition = startPos + (endPos - startPos) * (progress.progressPercent / 100);
            } else {
                // Sur la dernière planète
                shipPosition = (PLANETS.length - 1) * planetSpacing + planetSpacing / 2;
            }
        } else {
            // Avant la première planète
            const firstPlanetPos = planetSpacing / 2;
            const secondPlanetPos = planetSpacing + planetSpacing / 2;
            shipPosition = firstPlanetPos + (secondPlanetPos - firstPlanetPos) * (progress.progressPercent / 100);
        }
        
        spaceship.style.left = `${shipPosition}px`;
        container.appendChild(spaceship);
    }
}

function confirmSpaceMapAndReset() {
    closeSpaceMap();
    
    // Appliquer le reset avec les bonus
    if (lastLaunchDistance > maxDistance) {
        maxDistance = lastLaunchDistance;
    }
    rocketsLaunched++;
    lastLaunchAt = Date.now();
    prestigeMultiplier = 1 + Math.log(1 + (isNaN(maxDistance) ? 0 : maxDistance) / MOON_DISTANCE) / 2;

    // Gain de Poussière d'Étoiles (monnaie de prestige persistante)
    const dustGained = calculateStardustGain(isNaN(lastLaunchDistance) ? 0 : lastLaunchDistance);
    if (dustGained > 0) {
        starDust += dustGained;
        totalStardustEarned += dustGained;
    }

    // Debloquer les planetes atteintes uniquement a la confirmation du reset
    applyNewPlanets(checkNewPlanetsUnlocked(lastLaunchDistance));

    // Reset du score, des bâtiments et des pièces de fusée (garde les bonus/prestige)
    score = 0;
    BUILDINGS.forEach(b => b.count = 0);
    ROCKET_PARTS.forEach(p => p.purchased = false);
    constructedParts = new Set();
    const scene = document.getElementById('rocket-parts-container');
    if (scene) scene.innerHTML = '';
    unlockedBuildings = new Set();
    startupBonusApplied = false;
    applyStartupBonus();
    totalPartsFromClicks = 0;
    activatedClickUpgrades = [];
    buildingUpgrades = {};
    buildingUpgradeCosts = {};
    totalGeneratedByBuilding = {};
    partsSinceLaunch = 0;
    resetContractState();
    
    updateDisplay();
    saveGame();
    checkBuildingUnlocks();
    renderBuildings();
    renderUpgrades();
    renderRocketPartsShop();
    
    // Afficher le modal de résultats
    showLaunchResults(lastLaunchDistance);
    isLaunching = false;
        updateSpaceProgress();
        updateConstructionScene();
}

function closeSpaceMap() {
    document.getElementById('space-map-modal').classList.remove('active');
}

// ============================================
// ATELIER GALACTIQUE (upgrades permanents)
// ============================================

function getGalacticUpgradeLevel(upgradeId) {
    return galacticUpgrades[upgradeId] || 0;
}

function getGalacticUpgradeCost(upgrade) {
    const level = getGalacticUpgradeLevel(upgrade.id);
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level));
}

function isGalacticUpgradeLocked(upgrade) {
    if (!upgrade.requires) return false;
    return upgrade.requires.some(req => getGalacticUpgradeLevel(req) === 0);
}

function buyGalacticUpgrade(upgradeId) {
    const upgrade = GALACTIC_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;
    const level = getGalacticUpgradeLevel(upgradeId);
    if (level >= upgrade.maxLevel) return;
    if (isGalacticUpgradeLocked(upgrade)) {
        showToast("\u274c " + t("Prérequis non rempli"));
        return;
    }
    const cost = getGalacticUpgradeCost(upgrade);
    if (starDust < cost) {
        showToast("\u274c " + t("Pas assez de Poussière d'Étoiles"));
        return;
    }
    starDust -= cost;
    galacticUpgrades[upgradeId] = level + 1;
    updateStardustDisplay();
    renderGalacticShop();

    // rock1 donne des ateliers gratuits: les ajouter immediatement en cours de run
    if (upgradeId === 'rock1') {
        const extra = getUpgradeEffect('rock1') - (level * (GALACTIC_UPGRADES.find(u => u.id === 'rock1').effectPerLevel));
        if (extra > 0) {
            const atelier = BUILDINGS.find(b => b.id === 'workshop');
            if (atelier) {
                atelier.count += extra;
                unlockedBuildings.add(atelier.id);
                startupBonusApplied = true;
                renderBuildings();
                updateDisplay();
            }
        }
    }

    saveGame();
    showToast("\u2728 " + t(upgrade.name) + " " + t("niveau") + " " + (level + 1));
}

// Getters d'effets (utilisés par la boucle de jeu)
// ============================================
// PRODUCTION HORS-LIGNE (atelier galactique, branche Hors-ligne)
// Credit la production accumulée pendant l'absence, plafonnée au palier débloqué.
// ============================================

function getOfflineCapHours() {
    let hours = 0;
    for (const up of GALACTIC_UPGRADES) {
        if (up.branch === 'offline' && getGalacticUpgradeLevel(up.id) > 0) {
            hours = Math.max(hours, up.effectPerLevel);
        }
    }
    return hours;
}

function applyOfflineEarnings(lastSave) {
    if (!lastSave) return;
    const capHours = getOfflineCapHours();
    if (capHours <= 0) return;
    const elapsedSec = (Date.now() - lastSave) / 1000;
    if (elapsedSec < 60) return;
    const cappedSec = Math.min(elapsedSec, capHours * 3600);
    let totalGain = 0;
    BUILDINGS.forEach(building => {
        if (building.count > 0) {
            const g = calculateBuildingGain(building) * cappedSec;
            totalGeneratedByBuilding[building.id] = (totalGeneratedByBuilding[building.id] || 0) + g;
            totalGain += g;
        }
    });
    if (totalGain <= 0) return;
    score += totalGain;
    partsSinceLaunch += totalGain;
    const capped = cappedSec < elapsedSec;
    const timeStr = formatDurationHMS(cappedSec * 1000);
    showToast('\ud83c\udf19 ' + t('Production hors-ligne (') + timeStr + (capped ? ', ' + t('plafonn\u00e9e)') : '') + ' +' + formatNumber(totalGain) + ' ' + t('Parts'));
    updateDisplay();
}

function getUpgradeEffect(upgradeId) {
    const u = GALACTIC_UPGRADES.find(x => x.id === upgradeId);
    return u ? getGalacticUpgradeLevel(upgradeId) * u.effectPerLevel : 0;
}

function getProductionBonus() {
    return 1
        + getUpgradeEffect('prod1')
        + getUpgradeEffect('prod2')
        + getUpgradeEffect('prod3')
        + getUpgradeEffect('prod4')
        + getUpgradeEffect('prod5')
        + getUpgradeEffect('prod6')
        + getUpgradeEffect('prod7')
        + getUpgradeEffect('prod8');
}
function getBuildingCostReduction() {
    return 0;
}
function getRocketPartDiscount() {
    return 0;
}
function getStartupAteliers() {
    return getUpgradeEffect('rock1');
}
function getCometFrequencyBonus() {
    return 0;
}
function getStardustGainBonus() {
    return 1;
}
function calculateStardustGainExact(distanceKm) {
    const safeDistance = (isNaN(distanceKm) || distanceKm < 0) ? 0 : distanceKm;
    const anchor = Math.pow(STARDUST_TAIL_START_KM / MOON_DISTANCE, STARDUST_DISTANCE_EXP);
    const base = safeDistance <= STARDUST_TAIL_START_KM
        ? Math.pow(safeDistance / MOON_DISTANCE, STARDUST_DISTANCE_EXP)
        : anchor * Math.pow(safeDistance / STARDUST_TAIL_START_KM, STARDUST_TAIL_EXP);
    return base * getStardustGainBonus();
}

function calculateStardustGain(distanceKm) {
    return Math.floor(calculateStardustGainExact(distanceKm));
}
function getDistanceBonus() {
    let mult = 1;
    if (getGalacticUpgradeLevel('rock2') > 0) mult *= 1.20;
    if (getGalacticUpgradeLevel('rock4') > 0) mult *= 1.30;
    return mult;
}
function getClickPowerBonus() {
    let mult = 1;
    if (getGalacticUpgradeLevel('click1') > 0) mult *= 1.5;
    if (getGalacticUpgradeLevel('click3') > 0) mult *= 1.75;
    if (getGalacticUpgradeLevel('click5') > 0) mult *= 2;
    return mult;
}
function getCritChance() {
    return Math.min(0.50, getUpgradeEffect('click2') + getUpgradeEffect('click4'));
}
function getBoosterDiscount() {
    let discount = 1;
    if (getGalacticUpgradeLevel('coll1') > 0) discount *= 0.90;
    if (getGalacticUpgradeLevel('coll3') > 0) discount *= 0.90;
    if (getGalacticUpgradeLevel('coll5') > 0) discount *= 0.85;
    return 1 - discount;
}
function getCollectionUpgradeBonus() {
    return getUpgradeEffect('coll4');
}
function getRarityBoost() {
    return Math.min(0.50, getUpgradeEffect('coll2'));
}

function applyStartupBonus() {
    const freeAteliers = getStartupAteliers();
    if (startupBonusApplied || freeAteliers <= 0) return;
    const atelier = BUILDINGS.find(b => b.id === 'workshop');
    if (atelier) {
        atelier.count += freeAteliers;
        unlockedBuildings.add(atelier.id);
        startupBonusApplied = true;
    }
    const freeUsines = getGalacticUpgradeLevel('rock3');
    if (freeUsines > 0) {
        const usine = BUILDINGS.find(b => b.id === 'factory');
        if (usine) {
            usine.count += freeUsines;
            unlockedBuildings.add(usine.id);
        }
    }
}

function renderGalacticShop() {
    const container = document.getElementById('galactic-shop-list');
    if (!container) return;
    container.innerHTML = '';
    GALACTIC_BRANCHES.forEach(branch => {
        const branchEl = document.createElement('div');
        branchEl.className = 'galactic-branch';
        branchEl.style.setProperty('--branch-color', branch.color);

        const header = document.createElement('div');
        header.className = 'galactic-branch-header';
        header.innerHTML = '<span class="galactic-branch-icon">' + branch.icon + '</span><span class="galactic-branch-name">' + t(branch.name) + '</span>';
        branchEl.appendChild(header);

        const treeEl = document.createElement('div');
        treeEl.className = 'galactic-tree';

        const upgrades = GALACTIC_UPGRADES.filter(u => u.branch === branch.id);
        upgrades.forEach(upgrade => {
            const level = getGalacticUpgradeLevel(upgrade.id);
            const maxed = level >= upgrade.maxLevel;
            const locked = isGalacticUpgradeLocked(upgrade);
            const cost = getGalacticUpgradeCost(upgrade);
            const affordable = starDust >= cost && !locked;
            const el = document.createElement('div');
            el.className = 'galactic-node' + (maxed ? ' maxed' : '') + (locked ? ' locked' : '') + (!affordable && !maxed && !locked ? ' too-expensive' : '');

            let reqHtml = '';
            if (upgrade.requires) {
                const reqNames = upgrade.requires.map(r => {
                    const ru = GALACTIC_UPGRADES.find(u => u.id === r);
                    return ru ? ru.name : r;
                });
                reqHtml = '<span class="galactic-req">⛔ ' + t('Prérequis:') + ' ' + reqNames.map(r => t(r)).join(', ') + '</span>';
            }

            el.innerHTML =
                '<div class="galactic-node-top">' +
                    '<span class="galactic-node-name">' + t(upgrade.name) + '</span>' +
                    (maxed ? '<span class="galactic-node-max">MAX</span>' : '') +
                '</div>' +
                '<span class="galactic-node-desc">' + t(upgrade.desc) + '</span>' +
                '<div class="galactic-node-bottom">' +
                    '<span class="galactic-node-level">' + t('Niv.') + ' ' + level + '/' + upgrade.maxLevel + '</span>' +
                    (maxed
                        ? ''
                        : locked
                            ? reqHtml
                            : '<button class="galactic-btn" onclick="buyGalacticUpgrade(\'' + upgrade.id + '\')"' + (!affordable ? ' disabled' : '') + '>' + formatNumber(cost) + ' ✨</button>') +
                '</div>';
            treeEl.appendChild(el);
        });

        branchEl.appendChild(treeEl);
        container.appendChild(branchEl);
    });
}

function toggleGalacticShop() {
    showExclusiveModal('galactic-shop-modal', renderGalacticShop);
}

// ============================================
// SPACE PROGRESS SIDEBAR UPDATE
// ============================================

function updateSpaceProgress() {
    // Distance atteignable en temps réel (estimation)
    const reachableDistance = calculateDistance();
    // Distance réellement parcourue (ne change qu'au lancement)
    const traveledDistance = maxDistance;
    const progress = calculatePlanetProgress(reachableDistance);

    // Afficher la progression vers la PROCHAINE planète (basé sur distance parcourue)
    const planetDisplay = document.getElementById('current-planet-display');
    if (planetDisplay) {
        const traveledProgress = calculatePlanetProgress(traveledDistance);
        if (traveledProgress.nextPlanet) {
            planetDisplay.innerHTML = `${t(traveledProgress.nextPlanet.name)}: ${Math.min(100, Math.max(0, traveledProgress.progressPercent))}%`;
        } else {
            planetDisplay.innerHTML = `${t(traveledProgress.currentPlanet.name)}: 100%`;
        }
    }

    // Mettre à jour la mini-carte (basé sur distance parcourue)
    updateMiniSpaceMap(traveledDistance);

    // Mettre à jour les stats
    const sidebarDistance = document.getElementById('sidebar-distance');
    const sidebarDistanceMax = document.getElementById('sidebar-distance-max');
    const sidebarBonus = document.getElementById('sidebar-bonus');
    const sidebarPlanets = document.getElementById('sidebar-planets');

    if (sidebarDistance) {
        sidebarDistance.textContent = formatNumber(reachableDistance) + ' ' + t('km');
    }
    if (sidebarDistanceMax) {
        sidebarDistanceMax.textContent = formatNumber(traveledDistance) + ' ' + t('km');
    }
    if (sidebarBonus) {
        const totalBonus = 1 + getTotalPlanetBonus();
        sidebarBonus.textContent = 'x' + totalBonus.toFixed(2);
    }
    if (sidebarPlanets) {
        const unlockedCount = unlockedPlanets.size - (unlockedPlanets.has('earth') ? 1 : 0);
        sidebarPlanets.textContent = unlockedCount + '/10';
    }
}

function updateMiniSpaceMap(distance) {
    const container = document.getElementById('mini-space-map');
    if (!container) return;
    
    const progress = calculatePlanetProgress(distance);
    
    // Position des planètes dans la mini-map
    const planetPositions = [15, 50, 85];
    
    // Déterminer les planètes à afficher
    const planetsToShow = [];
    if (progress.currentPlanet) {
        const currentIndex = PLANETS.findIndex(p => p.id === progress.currentPlanet.id);
        if (currentIndex !== -1) {
            planetsToShow.push(PLANETS[currentIndex]);
            if (currentIndex + 1 < PLANETS.length) planetsToShow.push(PLANETS[currentIndex + 1]);
            if (currentIndex + 2 < PLANETS.length) planetsToShow.push(PLANETS[currentIndex + 2]);
        }
    } else {
        // Avant la Lune : afficher Terre (départ), Lune, Mars
        planetsToShow.push(PLANETS[0]);
        if (PLANETS.length > 1) planetsToShow.push(PLANETS[1]);
        if (PLANETS.length > 2) planetsToShow.push(PLANETS[2]);
    }
    
    // Clé pour détecter si les planètes affichées ont changé
    const planetsKey = planetsToShow.map(p => p.id).join(',');
    
    // Ne recréer le DOM (planètes + connexions) que si les planètes changent.
    // Sinon, mettre à jour uniquement la position du vaisseau pour éviter
    // que l'animation CSS ne redémarre toutes les 500ms.
    if (container.dataset.planetsKey !== planetsKey) {
        container.dataset.planetsKey = planetsKey;
        container.innerHTML = '';
        
        // Dessiner les planètes
        planetsToShow.forEach((planet, index) => {
            const planetElement = document.createElement('div');
            planetElement.className = 'space-planet';
            
            const isUnlocked = unlockedPlanets.has(planet.id) || distance >= planet.distanceRequired;
            const isCurrent = progress.currentPlanet && progress.currentPlanet.id === planet.id;
            
            if (isUnlocked) planetElement.classList.add('unlocked');
            if (isCurrent) planetElement.classList.add('current');
            if (planet.id === 'earth') planetElement.classList.add('origin');
            
            let planetHtml = '';
            if (planet.imgPath) {
                planetHtml = `<img src="${planet.imgPath}" class="planet-image" alt="${planet.name}">`;
            } else {
                planetHtml = `<span class="planet-emoji">${planet.emoji}</span>`;
            }
            planetHtml += `<div class="planet-name">${t(planet.name)}</div>`;
            const planetDist = planet.distanceRequired;
            const distLabel = planet.id === 'earth' ? t('Départ') : `${formatNumber(planetDist)} ${t('km')}`;
            planetHtml += `<div class="planet-distance">${distLabel}</div>`;
            
            planetElement.innerHTML = planetHtml;
            planetElement.style.setProperty('--planet-color', planet.color);
            
            const position = planetPositions[index] || (index * 40 + 15);
            planetElement.style.left = `${position}%`;
            planetElement.style.transform = 'translateX(-50%)';
            planetElement.style.textAlign = 'center';
            
            container.appendChild(planetElement);
        });
        
        // Ajouter les lignes de connexion entre les planètes
        for (let i = 0; i < planetsToShow.length - 1; i++) {
            const currentPlanet = planetsToShow[i];
            const nextPlanet = planetsToShow[i + 1];
            
            const isCurrentUnlocked = unlockedPlanets.has(currentPlanet.id) || distance >= currentPlanet.distanceRequired;
            const isNextUnlocked = unlockedPlanets.has(nextPlanet.id) || distance >= nextPlanet.distanceRequired;
            
            const line = document.createElement('div');
            line.className = 'space-connection';
            if (isCurrentUnlocked && isNextUnlocked) {
                line.classList.add('active');
            }
            
            const startPos = planetPositions[i] || (i * 40 + 15);
            const endPos = planetPositions[i + 1] || ((i + 1) * 40 + 15);
            line.style.left = `${startPos}%`;
            line.style.width = `${endPos - startPos}%`;
            container.appendChild(line);
        }
    }
    
    // Mettre à jour ou créer le vaisseau
    let spaceship = container.querySelector('.spaceship');
    const shouldShowShip = true;
    
    if (shouldShowShip) {
        // Calculer la position du vaisseau
        let shipPosition = 15;
        
        if (progress.currentPlanet) {
            const currentIndex = PLANETS.findIndex(p => p.id === progress.currentPlanet.id);
            
            if (currentIndex > 0 && progress.nextPlanet) {
                const nextIndex = PLANETS.findIndex(p => p.id === progress.nextPlanet.id);
                
                if (nextIndex > currentIndex && nextIndex < currentIndex + 3) {
                    const startPos = planetPositions[0] || 15;
                    const endPos = planetPositions[1] || 50;
                    shipPosition = startPos + (endPos - startPos) * (progress.progressPercent / 100);
                } else {
                    shipPosition = planetPositions[Math.min(currentIndex, 2)] || 50;
                }
            } else if (currentIndex === 0) {
                shipPosition = 15;
            } else {
                shipPosition = planetPositions[Math.min(currentIndex, 2)] || 85;
            }
        } else {
            const firstPlanetPos = planetPositions[0] || 15;
            const secondPlanetPos = planetPositions[1] || 50;
            shipPosition = firstPlanetPos + (secondPlanetPos - firstPlanetPos) * (progress.progressPercent / 100);
        }
        
        if (!spaceship) {
            spaceship = document.createElement('div');
            spaceship.className = 'spaceship';
            spaceship.innerHTML = '\u{1F680}';
            container.appendChild(spaceship);
        }
        spaceship.style.left = `${shipPosition}%`;
    } else if (spaceship) {
        spaceship.remove();
    }
}





// ============================================
// UPGRADES MANAGEMENT
// ============================================

// Affiche les nouveaux upgrades des qu'un seuil de production est franchi,
// sans reconstruire la barre a chaque tick (seulement si du nouveau apparait).
function checkNewUpgrades() {
    const container = document.getElementById('upgrades-container');
    if (!container) return;
    const newClickUps = CLICK_UPGRADES.filter(u => totalPartsFromClicks >= u.threshold && !activatedClickUpgrades.includes(u.threshold)).length;
    const newBuildingUps = BUILDING_UPGRADE_THRESHOLDS.reduce((acc, threshold) =>
        acc + BUILDINGS.filter(b => isBuildingUpgradeAvailable(b.id, threshold)).length, 0);
    if (container.childElementCount !== newClickUps + newBuildingUps) {
        renderUpgrades();
    }
}

function renderUpgrades() {
    const container = document.getElementById('upgrades-container');
    container.innerHTML = '';

    const available = [];

    // Upgrades de clic
    // Deblocage par les Parts gagnees uniquement en cliquant, cumulees depuis
    // le debut du run. Le cout reste le vrai verrou.
    CLICK_UPGRADES.forEach(upgrade => {
        if (totalPartsFromClicks >= upgrade.threshold && !activatedClickUpgrades.includes(upgrade.threshold)) {
            const upgradeIndex = CLICK_UPGRADES.indexOf(upgrade);
            const color = UPGRADE_COLORS[upgradeIndex % UPGRADE_COLORS.length];
            available.push({
                cost: upgrade.cost,
                render: () => {
                    const el = createUpgradeElement(color, 'images/cursor.svg', upgrade.name, upgrade.threshold);
                    attachTooltip(el, `${t(upgrade.name)} — ×2 ${t('clic')} — ${formatNumber(upgrade.cost)} ${t('Parts')}`);
                    el.onclick = () => buyClickUpgrade(upgrade.threshold);
                    return el;
                }
            });
        }
    });

    // Upgrades de buildings
    BUILDING_UPGRADE_THRESHOLDS.forEach(threshold => {
        BUILDINGS.forEach(building => {
            if (isBuildingUpgradeAvailable(building.id, threshold)) {
                const thresholdIndex = BUILDING_UPGRADE_THRESHOLDS.indexOf(threshold);
                const color = UPGRADE_COLORS[thresholdIndex];
                const cost = getBuildingUpgradeFixedCost(building.id, threshold);
                available.push({
                    cost,
                    render: () => {
                        const el = createUpgradeElement(color, building.imgPath || '', building.name, threshold);
                        attachTooltip(el, `${t(building.name)} — ${t('Palier')} ${threshold} — ×2 ${t('production')} — ${formatNumber(cost)} ${t('Parts')}`);
                        el.onclick = () => buyBuildingUpgrade(building.id, threshold);
                        return el;
                    }
                });
            }
        });
    });

    // Tri du moins chere au plus chere
    available.sort((a, b) => a.cost - b.cost);
    available.forEach(item => container.appendChild(item.render()));
}

function createUpgradeElement(color, imgSrc, altText, levelBadgeText) {
    const el = document.createElement('div');
    el.className = 'upgrade-icon';
    el.style.borderColor = color;
    el.style.boxShadow = `var(--shadow), 0 0 6px ${color}`;

    const img = document.createElement('img');
    img.className = 'upgrade-img';
    img.src = imgSrc;
    img.alt = altText;
    el.appendChild(img);

    const levelBadge = document.createElement('span');
    levelBadge.className = 'upgrade-level';
    levelBadge.textContent = levelBadgeText;
    el.appendChild(levelBadge);

    return el;
}

function attachTooltip(element, text) {
    if (!IS_TOUCH) {
        element.addEventListener('mouseenter', (e) => {
            const rect = e.target.getBoundingClientRect();
            showTooltip(text, rect.left + rect.width / 2, rect.top);
        });
        element.addEventListener('mouseleave', hideTooltip);
    }
    if (IS_TOUCH) {
        element.addEventListener('click', (e) => {
            if (touchTooltipElement !== element) {
                // 1er tap : afficher l'info, bloquer l'achat
                showTouchTooltip(element, text);
                e.stopImmediatePropagation();
                e.preventDefault();
            } else {
                // 2e tap : acheter (laisser passer le onclick)
                touchTooltipElement = null;
            }
        });
    }
}

// Tooltip tactile : sur mobile, le 1er tap affiche l'info, le 2e achète.
let touchTooltipElement = null;
function showTouchTooltip(element, text) {
    const rect = element.getBoundingClientRect();
    showTooltip(text, rect.left + rect.width / 2, rect.top);
    touchTooltipElement = element;
}
document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.upgrade-icon') && !e.target.closest('.building-item')) {
        hideTooltip();
        touchTooltipElement = null;
    }
}, { passive: true });

// ============================================
// BONUSES MANAGEMENT
// ============================================

function rebuildAutoMultipliers() {
    resetMultipliers();
    activeRandomBonuses.forEach(bonus => {
        if ((bonus.effect === 'auto' || bonus.effect === 'both' || bonus.effect === 'multiplier') && bonus.multiplier) {
            autoMultipliers.push(bonus.multiplier);
        }
        if ((bonus.effect === 'click' || bonus.effect === 'both') && bonus.multiplier) {
            clickMultipliers.push(bonus.multiplier);
        }
    });
    updateAutoMultiplier();
    updateClickMultiplier();
}

function spawnRandomBonus(shower) {
    // Pluie de comètes : bonus instantané uniquement (pas de flare, pas de
    // cumul de multiplicateurs), look distinct, récompense généreuse.
    let bonus = shower
        ? { id: "meteor", symbol: "\ud83c\udf20", name: "Pluie de météores", effect: "instant", type: "meteor", colorClass: "meteor" }
        : RANDOM_BONUSES[Math.floor(Math.random() * RANDOM_BONUSES.length)];
    // Si ce bonus est déjà actif, prendre l'autre pour ne pas bloquer le spawn
    if (!shower && activeRandomBonuses.some(b => b.id === bonus.id)) {
        const other = RANDOM_BONUSES.find(b => b.id !== bonus.id);
        if (activeRandomBonuses.some(b => b.id === other.id)) return;
        bonus = other;
    }

    // La comète traverse l'écran en diagonale de haut en bas
    // La traînée part du haut et descend jusqu'en bas
    const containerTopOffset = document.getElementById('random-bonuses').getBoundingClientRect().top;
    const containerHeight = window.innerHeight - containerTopOffset;
    const startY = -180;
    const endY = containerHeight + 180;
    const verticalTravel = endY - startY;
    // À 45°, déplacement horizontal = déplacement vertical
    const horizontalTravel = verticalTravel;
    // Direction aléatoire: gauche→droite ou droite→gauche
    const goRight = Math.random() < 0.5;
    let startX, endX;
    if (goRight) {
        // Gauche→droite: départ à gauche, visible jusqu'à la sortie à droite
        const maxStartX = Math.max(0, window.innerWidth * 0.5 - 100);
        startX = Math.random() * maxStartX;
        endX = startX + horizontalTravel;
    } else {
        // Droite→gauche: départ à droite, visible dès le début
        const minStartX = window.innerWidth - window.innerWidth * 0.5;
        startX = minStartX + Math.random() * Math.max(0, window.innerWidth - minStartX - 100);
        endX = startX - horizontalTravel;
    }
    const duration = 6000;

    const bonusElement = document.createElement('div');
    bonusElement.className = `random-bonus comet ${bonus.colorClass}` + (shower ? ' shower' : '');
    if (!goRight) bonusElement.classList.add('reverse');
    // Structure detaillee inspiree des vraies cometes :
    // - chevelure (coma) : halo diffus autour du noyau
    // - queue de plasma continue attachee derriere le noyau, orientee
    //   dans l'axe oppose au vol
    // - queue de poussiere : particules qui derivent vers l'arriere
    bonusElement.innerHTML = '<img src="images/effects/com\u00e8te.png" class="comet-img" alt="Comete">'
        + '<div class="comet-coma"></div>'
        + '<div class="comet-tail-plasma"></div>'
        + '<div class="comet-tail-dust"></div>';
    bonusElement.style.left = `${startX}px`;
    bonusElement.style.top = `${startY}px`;

    document.getElementById('random-bonuses').appendChild(bonusElement);

    // Animation de traversée en diagonale
    requestAnimationFrame(() => {
        bonusElement.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
        bonusElement.style.left = `${endX}px`;
        bonusElement.style.top = `${endY}px`;
    });

    // Queue de poussiere : particules frequentes a vie longue, qui
    // DERIVENT vers l'arriere du noyau (rejetees dans l'axe oppose au
    // vol) et s'ecartent legerement sur les cotes -- comme la queue
    // reelle d'une comete, courbee et diffuse, pas un chapelet de
    // cercles fixes.
    const TRAIL_INTERVAL_MS = 16;
    const TRAIL_LIFE_MS = 900;
    const dirX = goRight ? 1 : -1;
    const trailInterval = setInterval(() => {
        const rect = bonusElement.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // 2 particules par tick : une coeur brillant, une poussiere
        for (let i = 0; i < 2; i++) {
            const trail = document.createElement('div');
            trail.className = 'comet-trail' + (i === 0 ? ' core' : ' dust');
            trail.style.left = `${cx}px`;
            trail.style.top = `${cy}px`;
            document.body.appendChild(trail);
            const drift = 40 + Math.random() * 70;   // poussee vers l'arriere
            const spread = (Math.random() * 2 - 1) * 26; // ecart lateral
            requestAnimationFrame(() => {
                trail.style.opacity = '0';
                trail.style.transform = `translate(-50%, -50%) translate(${-dirX * drift + spread * 0.4}px, ${-drift * 0.72 + spread * 0.6}px) scale(0.2)`;
            });
            setTimeout(() => trail.remove(), TRAIL_LIFE_MS);
        }
    }, TRAIL_INTERVAL_MS);

    const timeout = setTimeout(() => {
        clearInterval(trailInterval);
        bonusElement.remove();
    }, duration);

    bonusElement.onclick = () => {
        if (bonusElement.dataset.collected === '1') return;
        bonusElement.dataset.collected = '1';
        clearTimeout(timeout);
        clearInterval(trailInterval);
        // IMPORTANT : lire la position AVANT de couper la transition, sinon
        // l'annulation de la transition teleporte la comete a sa position
        // d'arrivee (hors ecran) et le missile frappe dans le vide.
        const frozenRect = bonusElement.getBoundingClientRect();
        const contRect = document.getElementById('random-bonuses').getBoundingClientRect();
        bonusElement.classList.add('locked');
        bonusElement.style.transition = 'none';
        bonusElement.style.left = (frozenRect.left - contRect.left) + 'px';
        bonusElement.style.top = (frozenRect.top - contRect.top) + 'px';
        interceptCometWithMissile(bonusElement, () => {
        bonusElement.classList.add('clicked');
        clickedBonusesCount++;

        if (bonus.id === "meteor") {
            const instantProduction = partsPerSecond * (shower ? 5 : 10);
            score += instantProduction;
            partsSinceLaunch += instantProduction;
            showToast(`\u2705 ${t(bonus.name)}: +${formatNumber(instantProduction)} ${t("Parts")}!`);
        } 
        else if (bonus.id === "flare") {
            activeRandomBonuses.push({
                id: bonus.id,
                effect: bonus.effect,
                multiplier: bonus.multiplier,
                endTime: Date.now() + bonus.duration
            });
            rebuildAutoMultipliers();
            showToast(`\u2705 ${t(bonus.name)}: ×${bonus.multiplier} ${t("Parts")}/s ${t("for")} ${bonus.duration/1000}s`);

            setTimeout(() => {
                activeRandomBonuses = activeRandomBonuses.filter(b => b.id !== bonus.id);
                rebuildAutoMultipliers();
                updateDisplay();
                showToast(`\u23f0 ${t(bonus.name)} ${t("expir\u00e9")}`);
            }, bonus.duration);
        }

        setTimeout(() => bonusElement.remove(), 500);
        checkTrophies();
        });
    };
}
// Missile d'interception : quand le joueur clique sur une comète, un missile
// part du bord de l'écran et la percute en trajectoire perpendiculaire à la
// sienne. Vol très rapide (180-320 ms), puis explosion et destruction.
function interceptCometWithMissile(cometEl, onDestroy) {
    const cometRect = cometEl.getBoundingClientRect();
    const cx = cometRect.left + cometRect.width / 2;
    const cy = cometRect.top + cometRect.height / 2;
    // La comète descend en diagonale à 45° : le missile arrive sur l'autre
    // diagonale (montante), côté opposé à son sens de vol, exactement à 90°.
    const goRight = !cometEl.classList.contains('reverse');
    const fromLeft = goRight;
    // Départ au bord de l'écran : on descend la diagonale perpendiculaire
    // passant par la comète jusqu'à la frontière de l'écran (bas ou côté
    // opposé à son sens de vol). |dx| = |dy| garantit l'angle droit, et la
    // distance maximale laisse le temps de voir le missile arriver.
    const sBottom = window.innerHeight - cy;
    const sSide = fromLeft ? cx : (window.innerWidth - cx);
    const reach = Math.max(60, Math.min(sBottom, sSide)) + 40;
    const launchY = cy + reach;
    const launchXadj = cx + (fromLeft ? -reach : reach);
    let vx = cx - launchXadj;
    let vy = cy - launchY;
    const dist = Math.hypot(vx, vy);
    const angle = Math.atan2(vy, vx);
    const missile = document.createElement('div');
    missile.className = 'comet-missile';
    missile.innerHTML = '<img src="images/effects/missile.png" alt="">';
    document.body.appendChild(missile);
    const mRect = missile.getBoundingClientRect();
    const mW = mRect.width || 46;
    const mH = mRect.height || 14;
    missile.style.left = (launchXadj - mW / 2) + 'px';
    missile.style.top = (launchY - mH / 2) + 'px';
    missile.style.transform = `rotate(${angle}rad)`;
    // Vol rapide mais lisible : borné entre 240 et 600 ms selon la distance.
    const duration = Math.max(240, Math.min(600, dist / 2.2));
    requestAnimationFrame(() => {
        missile.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
        missile.style.left = (cx - mW / 2) + 'px';
        missile.style.top = (cy - mH / 2) + 'px';
    });
    setTimeout(() => {
        if (!missile.isConnected) return;
        missile.remove();
        spawnCometExplosion(cx, cy);
        onDestroy();
    }, duration + 20);
}
// Explosion de la comète à l'impact : lueur, flash blanc, boule de feu,
// ondes de choc, gerbe d'étincelles et fumée. Chaque couche est un div
// positionné au point d'impact, animée en CSS puis nettoyée.
function spawnCometExplosion(cx, cy) {
    const explosion = document.createElement('div');
    explosion.className = 'comet-explosion';
    explosion.style.left = cx + 'px';
    explosion.style.top = cy + 'px';
    document.body.appendChild(explosion);

    const layer = (cls) => {
        const el = document.createElement('div');
        el.className = cls;
        explosion.appendChild(el);
        return el;
    };

    layer('exp-light');
    layer('exp-core');
    layer('exp-fireball');

    // Deux ondes de choc, la seconde légèrement en retard
    layer('exp-ring');
    const ring2 = layer('exp-ring');
    ring2.style.animationDelay = '0.12s';
    ring2.style.animationDuration = '0.7s';

    // Gerbe d'étincelles : directions et portées variées
    const SPARKS = 16;
    for (let i = 0; i < SPARKS; i++) {
        const spark = layer('exp-spark');
        const theta = (i / SPARKS) * Math.PI * 2 + Math.random() * 0.35;
        const dist = 50 + Math.random() * 110;
        const sx = Math.cos(theta) * dist;
        const sy = Math.sin(theta) * dist;
        spark.style.setProperty('--sx', sx.toFixed(1) + 'px');
        spark.style.setProperty('--sy', sy.toFixed(1) + 'px');
        spark.style.setProperty('--sr', (Math.random() * 220 - 110).toFixed(0) + 'deg');
        spark.style.setProperty('--ssize', (3 + Math.random() * 3.5).toFixed(1) + 'px');
        spark.style.setProperty('--sd', (0.5 + Math.random() * 0.35).toFixed(2) + 's');
    }

    // Fumée : bouffées décalées, majoritairement vers le haut
    for (let i = 0; i < 6; i++) {
        const smoke = layer('exp-smoke');
        const theta = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
        const dist = 26 + Math.random() * 60;
        smoke.style.setProperty('--sx', (Math.cos(theta) * dist).toFixed(1) + 'px');
        smoke.style.setProperty('--sy', (Math.sin(theta) * dist).toFixed(1) + 'px');
        smoke.style.setProperty('--sscale', (0.7 + Math.random() * 0.9).toFixed(2));
        smoke.style.setProperty('--sdelay', (0.05 + Math.random() * 0.2).toFixed(2) + 's');
    }

    setTimeout(() => explosion.remove(), 1400);
}

// ============================================
// VISUAL EFFECTS
// ============================================

function getClickComponents() {
    const nbUpgrades = activatedClickUpgrades.length;
    // Base qui double a chaque upgrade de clic (comme Reinforced finger / Carpal tunnel).
    const baseCpC = Math.pow(2, nbUpgrades);
    // Bonus par bâtiment possede (equivalent Thousand Fingers) : +0.1 par bâtiment,
    // multiplie par un facteur croissant avec les upgrades (Million/Billion Fingers).
    const fingerMult = nbUpgrades >= 2 ? (1 + (nbUpgrades - 1) * 0.5) : 0;
    const buildingBonus = fingerMult * 0.1 * getTotalBuildingsOwned();
    // Bonus lie a la production (1% des Parts/s par upgrade).
    const cpsBonus = nbUpgrades * 0.01 * partsPerSecond;
    return { baseCpC, buildingBonus, cpsBonus };
}

function addScore(points, event) {
    const { baseCpC, buildingBonus, cpsBonus } = getClickComponents();
    const basePoints = baseCpC + buildingBonus + cpsBonus;
    const critMult = (Math.random() < getCritChance()) ? 3 : 1;
    const totalPoints = basePoints * getClickPowerBonus() * critMult;
    if (getGalacticUpgradeLevel('click6') > 0 && Math.random() < 0.05) {
        spawnRandomBonus();
    }

    score += totalPoints;
    partsSinceLaunch += totalPoints;
    totalPartsFromClicks += totalPoints;

    showClickEffect(Math.round(totalPoints), event);
    spawnFallingCoin(event);

    const medal = document.getElementById('medal');
    // Direction du clic par rapport au centre de la piece (normalisee), pour
    // tordre l'animation vers l'endroit clique. Fallback: centre.
    if (medal && event && event.clientX !== undefined) {
        const rect = medal.getBoundingClientRect();
        const halfW = rect.width / 2;
        const halfH = rect.height / 2;
        const dx = event.clientX - (rect.left + halfW);
        const dy = event.clientY - (rect.top + halfH);
        const dist = Math.min(1, Math.hypot(dx, dy) / halfW);
        const nx = (dx / halfW) * dist;
        const ny = (dy / halfH) * dist;
        medal.style.setProperty('--click-nx', nx.toFixed(3));
        medal.style.setProperty('--click-ny', ny.toFixed(3));
    }
    medal.classList.remove('bounce');
    void medal.offsetWidth;
    medal.classList.add('bounce');

    updateDisplay();
    saveGame();
    updateAllBuildingButtons();
    renderUpgrades();
    checkBuildingUnlocks();
    checkTrophies();
}

function showClickEffect(value, event) {
    const container = document.getElementById('click-effects');

    const containerRect = container.getBoundingClientRect();
    let x, y;
    if (event && event.clientX !== undefined) {
        x = event.clientX;
        y = event.clientY;
    } else {
        const medal = document.getElementById('medal');
        const medalRect = medal.getBoundingClientRect();
        x = medalRect.left + medalRect.width / 2;
        y = medalRect.top + medalRect.height / 2;
    }
    x -= containerRect.left;
    y = y - containerRect.top - 10;

    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${formatNumber(value)}`;
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;

    container.appendChild(effect);
    setTimeout(() => effect.remove(), 1200);
}

// Piece qui tombe depuis le point clique : apparait sur place (pop),
// saute de quelques pixels au-dessus du clic (vitesse initiale vers le haut
// qui s'amortit), puis retombe tout doucement avec une acceleration
// gravitationnelle, en tournoyant lentement. Disparait hors ecran en bas.
// Gravite faible (~3x plus lente qu'avant en duree de chute).
const FALL_GRAVITY = 260; // px/s^2
const HOP_MIN = 18; // px
const HOP_MAX = 40; // px

function spawnFallingCoin(event) {
    const container = document.getElementById('falling-coins');
    if (!container) return;

    let x, y;
    if (event && event.clientX !== undefined) {
        x = event.clientX;
        y = event.clientY;
    } else {
        const medal = document.getElementById('medal');
        const medalRect = medal.getBoundingClientRect();
        x = medalRect.left + medalRect.width / 2;
        y = medalRect.top + medalRect.height / 2;
    }

    const coin = document.createElement('div');
    coin.className = 'falling-coin';

    const img = document.createElement('img');
    img.src = 'images/parts.png';
    img.alt = '';
    img.draggable = false;
    coin.appendChild(img);

    const size = 24 + Math.random() * 32;
    const drift = (Math.random() - 0.5) * 440;
    const spinDir = Math.random() < 0.5 ? 1 : -1;

    // Petit saut vers le haut depuis le point clique, puis chute douce
    const hop = HOP_MIN + Math.random() * (HOP_MAX - HOP_MIN);
    const fallDist = window.innerHeight - y + size + 20;
    const tUp = Math.sqrt(2 * hop / FALL_GRAVITY);
    const tDown = Math.sqrt(2 * (fallDist + hop) / FALL_GRAVITY);
    const total = tUp + tDown;
    const startDelay = 0.05 + Math.random() * 0.07;
    // Rotation reguliere : exactement 1 tour toutes les 12 secondes sur
    // toute la duree de vie de la piece (chute ~2-4s -> ~0.2-0.3 tour)
    const SPIN_PERIOD = 12;
    const spinDeg = spinDir * 360 * (total / SPIN_PERIOD);

    coin.style.width = size + 'px';
    coin.style.height = size + 'px';
    coin.style.left = x + 'px';
    coin.style.top = y + 'px';
    coin.style.setProperty('--fall-drift', drift + 'px');
    coin.style.setProperty('--fall-spin', spinDeg + 'deg');
    coin.style.setProperty('--fall-duration', total + 's');
    coin.style.setProperty('--fall-delay', startDelay + 's');

    container.appendChild(coin);

    // Trajectoire balistique en 2 phases : montee amortie (ease-out) puis
    // chute accelerante (ease-in). Les durees decoulent de la physique.
    if (coin.animate) {
        const anim = coin.animate([
            { transform: 'translate(-50%, -50%)', easing: 'cubic-bezier(0.25, 0.6, 0.4, 1)' },
            { transform: `translate(-50%, calc(-50% - ${hop.toFixed(1)}px))`, easing: 'cubic-bezier(0.5, 0, 0.85, 0.45)', offset: tUp / total },
            { transform: `translate(calc(-50% + ${drift.toFixed(1)}px), calc(-50% + ${fallDist.toFixed(1)}px))`, offset: 1 }
        ], { duration: total * 1000, delay: startDelay * 1000, fill: 'forwards' });
        anim.onfinish = () => coin.remove();
    } else {
        setTimeout(() => coin.remove(), (startDelay + total) * 1000);
    }
}

// ============================================
// MAIN GAME LOOP
// ============================================

function gameLoop() {
    let totalGain = 0;

    BUILDINGS.forEach(building => {
        const buildingGain = calculateBuildingGain(building);
        totalGain += buildingGain;
    });

    partsPerSecond = totalGain;
    const now = Date.now();
    const dtSeconds = (now - lastGameTick) / 1000;
    lastGameTick = now;
    const tickGain = partsPerSecond * dtSeconds;
    score += tickGain;
    partsSinceLaunch += tickGain;
    updateLaunchTimer();

    if (dtSeconds > 0) {
        BUILDINGS.forEach(building => {
            if (building.count > 0) {
                totalGeneratedByBuilding[building.id] = (totalGeneratedByBuilding[building.id] || 0) + (calculateBuildingGain(building) * dtSeconds);
            }
        });
    }

    if (Date.now() - lastBuildingsUpdate > BUILDING_UPDATE_INTERVAL_MS) {
        lastBuildingsUpdate = Date.now();
        updateAllBuildingButtons();
        refreshLiveTooltip();
        checkNewUpgrades();
    }
    if (Date.now() - lastRocketPartsUpdate > BUILDING_UPDATE_INTERVAL_MS) {
        lastRocketPartsUpdate = Date.now();
        renderRocketPartsShop();
    }
    updateDisplay();
    if (Date.now() - lastSpaceProgressUpdate > SPACE_UPDATE_INTERVAL_MS) {
        lastSpaceProgressUpdate = Date.now();
        updateSpaceProgress();
    }
    checkBuildingUnlocks();
    refreshStatsLive();
    checkTrophies();
}

// ============================================
// STATISTICS
// ============================================

function calculateTotalGenerated() {
    let total = 0;
    for (const key in totalGeneratedByBuilding) {
        total += totalGeneratedByBuilding[key];
    }
    return total;
}

function getClickPower() {
    const { baseCpC, buildingBonus, cpsBonus } = getClickComponents();
    return (baseCpC + buildingBonus + cpsBonus) * getClickPowerBonus();
}

function getTotalBuildingsOwned() {
    return BUILDINGS.reduce((total, building) => total + building.count, 0);
}

function getGameDuration() {
    if (!gameStartTime) return "N/A";
    
    const durationMs = Date.now() - gameStartTime;
    
    const totalSec = Math.floor(durationMs / 1000);
    const days = Math.floor(totalSec / 86400);
    if (days > 0) return days + t("jours") + ' ' + formatDurationHMS((totalSec % 86400) * 1000);
    return formatDurationHMS(durationMs);
}

// ============================================
// GESTION DES TROPH\u001aES
// ============================================

function getTotalStardustEarned() {
    return totalStardustEarned;
}
function getTotalBuildingUpgrades() {
    let count = 0;
    for (const buildingId in buildingUpgrades) {
        count += buildingUpgrades[buildingId].length;
    }
    return count;
}

function getUnlockedBuildingTypes() {
    return BUILDINGS.filter(b => b.count > 0).length;
}

function checkTrophies() {
    let changed = false;
    
    TROPHIES.forEach(trophy => {
        if (!unlockedTrophies.has(trophy.id)) {
            let unlocked = false;
            
            switch (trophy.type) {
                case 'pps':
                    unlocked = partsPerSecond >= trophy.threshold;
                    break;
                case 'building-upgrade':
                    unlocked = getTotalBuildingUpgrades() >= trophy.threshold;
                    break;
                case 'click-upgrade':
                    unlocked = activatedClickUpgrades.length >= trophy.threshold;
                    break;
                case 'building':
                    unlocked = getTotalBuildingsOwned() >= trophy.threshold;
                    break;
                case 'score':
                    unlocked = score >= trophy.threshold;
                    break;
                case 'bonus':
                    unlocked = clickedBonusesCount >= trophy.threshold;
                    break;
                case 'building-types':
                    unlocked = getUnlockedBuildingTypes() >= trophy.threshold;
                    break;
                case 'planets':
                    unlocked = unlockedPlanets.size - (unlockedPlanets.has('earth') ? 1 : 0) >= trophy.threshold;
                    break;
                case 'launches':
                    unlocked = rocketsLaunched >= trophy.threshold;
                    break;
                case 'stardust':
                    unlocked = getTotalStardustEarned() >= trophy.threshold;
                    break;
                case 'cards':
                    unlocked = Object.keys(cardCollection).filter(id => cardCollection[id] > 0).length >= trophy.threshold;
                    break;
            }
            
            if (unlocked) {
                unlockedTrophies.add(trophy.id);
                changed = true;
                showToast(`${t("Troph\u00e9e d\u00e9bloqu\u00e9 :")} ${t(trophy.name)}!`, trophy.icon, 5000);
            }
        }
    });
    
    return changed;
}

function renderTrophies() {
    const container = document.createElement('div');
    container.style.marginTop = '8px';
    
    const trophiesGrid = document.createElement('div');
    trophiesGrid.style.display = 'grid';
    trophiesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(60px, 1fr))';
    trophiesGrid.style.gap = '8px';
    trophiesGrid.style.marginTop = '8px';
    
    const familyOrder = ['pps', 'planets', 'launches', 'stardust', 'building-upgrade', 'click-upgrade', 'building', 'score', 'bonus', 'building-types', 'cards'];
    const trophiesByFamily = {};
    TROPHIES.forEach(trophy => {
        (trophiesByFamily[trophy.type] = trophiesByFamily[trophy.type] || []).push(trophy);
    });
    const orderedTrophies = [];
    familyOrder.forEach(family => {
        if (trophiesByFamily[family]) orderedTrophies.push(...trophiesByFamily[family]);
    });
    Object.keys(trophiesByFamily).forEach(family => {
        if (!familyOrder.includes(family)) orderedTrophies.push(...trophiesByFamily[family]);
    });

    const colorCounters = {};
    orderedTrophies.forEach(trophy => {
        const trophyElement = document.createElement('div');
        trophyElement.className = 'trophy-icon';
        trophyElement.style.width = '50px';
        trophyElement.style.height = '50px';
        trophyElement.style.borderRadius = '50%';
        trophyElement.style.display = 'flex';
        trophyElement.style.alignItems = 'center';
        trophyElement.style.justifyContent = 'center';
        trophyElement.style.fontSize = '1.5rem';
        trophyElement.style.cursor = 'pointer';
        trophyElement.style.position = 'relative';
        trophyElement.style.transition = 'all 0.2s';
        const colors = TROPHY_COLORS[trophy.type] || ['#94a3b8'];
        const idx = colorCounters[trophy.type] || 0;
        colorCounters[trophy.type] = idx + 1;
        const color = colors[idx % colors.length];
        trophyElement.style.border = '2px solid #e2e8f0';
        trophyElement.style.background = '#f8fafc';
        trophyElement.style.isolation = 'isolate';
        
        if (unlockedTrophies.has(trophy.id)) {
            trophyElement.style.background = '#dbeafe';
            trophyElement.style.boxShadow = 'var(--shadow), 0 0 6px ' + color;
            trophyElement.style.opacity = '1';
        } else {
            trophyElement.style.opacity = '0.4';
            trophyElement.style.filter = 'grayscale(100%)';
        }
        
        const imgSize = (trophy.id === 'launch-1' || trophy.id === 'launch-5' || trophy.id === 'first-click-upgrade') ? '80%'
            : trophy.icon === 'images/parts.png' ? '100%'
            : '100%';
        trophyElement.innerHTML = trophy.icon.startsWith('images/')
            ? `<img src="${trophy.icon}" alt="${trophy.name}" style="width: ${imgSize}; height: ${imgSize}; object-fit: contain;">`
            : trophy.icon;
        const tint = document.createElement('span');
        tint.style.cssText = `position: absolute; inset: 0; border-radius: 50%; pointer-events: none; mix-blend-mode: color; opacity: 0.65; background: ${color};`;
        trophyElement.appendChild(tint);
        
        trophyElement.addEventListener('mouseenter', (e) => {
            const rect = e.target.getBoundingClientRect();
            const name = t(trophy.name);
            const description = t(trophy.description);
            const isUnlocked = unlockedTrophies.has(trophy.id);
            const status = isUnlocked ? t('D\u00e9bloqu\u00e9') : t('Verrouill\u00e9');
            showTooltip(`${name}\n${description}\n${status}`, rect.left + rect.width/2, rect.top, { anchorBottom: rect.bottom });
        });
        trophyElement.addEventListener('mouseleave', hideTooltip);
        
        trophiesGrid.appendChild(trophyElement);
    });
    
    container.appendChild(trophiesGrid);
    return container;
}

let lastStatsRender = 0;

function statsStructureKey() {
    return [
        gameLanguage,
        activatedClickUpgrades.join(','),
        Object.keys(buildingUpgrades).map(id => id + ':' + ((buildingUpgrades[id] || []).length)).join(','),
        unlockedTrophies.size,
        [...unlockedTrophies].join(',')
    ].join('|');
}

function refreshStatsLive() {
    const modal = document.getElementById('stats-modal');
    if (!modal || !modal.classList.contains('active')) return;
    const now = Date.now();
    const container = document.getElementById('stats-body');
    if (!container) return;
    const key = statsStructureKey();
    if (container.dataset.structureKey !== key) {
        const scrollTop = container.scrollTop;
        renderStats();
        container.dataset.structureKey = key;
        container.scrollTop = scrollTop;
        return;
    }
    if (now - lastStatsRender < 1000) return;
    lastStatsRender = now;
    updateStatsDynamicValues(container);
}

function updateStatsDynamicValues(container) {
    const values = [
        formatNumber(score, true),
        formatNumber(calculateTotalGenerated()),
        formatNumber(partsPerSecond),
        'x' + getTotalProductionMultiplier().toFixed(2),
        formatNumber(getClickPower()),
        formatNumber(getTotalBuildingsOwned()),
        getGameDuration(),
        String(clickedBonusesCount)
    ];
    container.querySelectorAll('[data-stat-value]').forEach(el => {
        const idx = parseInt(el.dataset.statValue, 10);
        if (!Number.isNaN(idx) && values[idx] !== undefined) el.textContent = values[idx];
    });
    const bonusTitle = container.querySelector('[data-trophies-bonus]');
    if (bonusTitle) bonusTitle.textContent = '(+' + (unlockedTrophies.size * 1) + '%)';
}

function renderStats() {
    const container = document.getElementById('stats-body');
    container.innerHTML = '';
    container.innerHTML += '<h4 style="margin: 0 0 8px; color: #2563eb; font-size: 1.1rem;">' + t('Statistiques Globales') + '</h4>';
    const globalStats = [
        { label: t("Parts actuelles"), value: formatNumber(score, true) },
        { label: t("Total Parts g\u00e9n\u00e9r\u00e9s"), value: formatNumber(calculateTotalGenerated()) },
        { label: t("Parts par seconde"), value: formatNumber(partsPerSecond) },
        { label: t("Multiplicateur de production"), value: 'x' + getTotalProductionMultiplier().toFixed(2) },
        { label: t("Parts par clic"), value: formatNumber(getClickPower()) },
        { label: t("B\u00e2timents poss\u00e9d\u00e9s au total"), value: formatNumber(getTotalBuildingsOwned()) },
        { label: t("Partie commenc\u00e9e"), value: getGameDuration() },
        { label: t("Bonus cliqu\u00e9s"), value: clickedBonusesCount }
    ];

    globalStats.forEach(stat => {
        const statElement = document.createElement('div');
        statElement.style.display = 'flex';
        statElement.style.justifyContent = 'space-between';
        statElement.style.padding = '8px 0';
        statElement.style.borderBottom = '1px solid #e2e8f0';
        statElement.innerHTML = `
            <span style="color: #64748b; font-size: 0.9rem;">${stat.label}</span>
            <span style="color: #2563eb; font-weight: 600;" data-stat-value="${globalStats.indexOf(stat)}">${stat.value}</span>
        `;
        container.appendChild(statElement);
    });

    container.innerHTML += '<h4 style="margin: 16px 0 8px; color: #2563eb; font-size: 1.1rem;">' + t('Upgrades') + '</h4>';
    container.innerHTML += '<h5 style="margin: 8px 0 4px; color: #64748b; font-size: 0.9rem;">' + t('Améliorations de Clic:') + '</h5>';
    
    if (activatedClickUpgrades.length > 0) {
        const line = document.createElement('div');
        line.style.display = 'flex';
        line.style.flexWrap = 'wrap';
        line.style.gap = '6px';
        line.style.alignItems = 'center';
        line.style.padding = '4px 0';
        activatedClickUpgrades.forEach(threshold => {
            const upgrade = CLICK_UPGRADES.find(u => u.threshold === threshold);
            if (upgrade) {
                const upgradeIndex = CLICK_UPGRADES.indexOf(upgrade);
                const color = UPGRADE_COLORS[upgradeIndex % UPGRADE_COLORS.length];
                const badge = document.createElement('span');
                badge.style.display = 'inline-flex';
                badge.style.alignItems = 'center';
                badge.style.gap = '4px';
                badge.style.padding = '2px 8px';
                badge.style.borderRadius = '999px';
                badge.style.border = '1px solid ' + color;
                badge.style.background = 'rgba(255, 255, 255, 0.6)';
                badge.style.color = '#64748b';
                badge.style.fontSize = '0.8rem';
                badge.innerHTML = `<img src="images/cursor.svg" alt="" style="width: 14px; height: 14px;"> ${t(upgrade.name)}`;
                line.appendChild(badge);
            }
        });
        container.appendChild(line);
    } else {
        const statElement = document.createElement('div');
        statElement.style.padding = '4px 0';
        statElement.style.fontSize = '0.85rem';
        statElement.style.color = '#94a3b8';
        statElement.textContent = t('Aucune am\u00e9lioration de clic');
        container.appendChild(statElement);
    }

    container.innerHTML += '<h5 style="margin: 12px 0 4px; color: #64748b; font-size: 0.9rem;">' + t('Am\u00e9liorations de B\u00e2timents:') + '</h5>';
    
    let hasBuildingUpgrades = false;
    BUILDINGS.forEach(building => {
        const upgrades = buildingUpgrades[building.id] || [];
        if (upgrades.length > 0) {
            hasBuildingUpgrades = true;
            const statElement = document.createElement('div');
            statElement.style.display = 'flex';
            statElement.style.justifyContent = 'space-between';
            statElement.style.padding = '4px 0';
            statElement.style.fontSize = '0.85rem';
            statElement.style.color = '#64748b';
            const levelColor = UPGRADE_COLORS[(upgrades.length - 1) % UPGRADE_COLORS.length];
            statElement.innerHTML = `<span>${t(building.name)}: <span style="color: ${levelColor}; font-weight: 700;">${upgrades.length}</span> ${t('niveau(x)')}</span>`;
            container.appendChild(statElement);
        }
    });

    if (!hasBuildingUpgrades) {
        const statElement = document.createElement('div');
        statElement.style.padding = '4px 0';
        statElement.style.fontSize = '0.85rem';
        statElement.style.color = '#94a3b8';
        statElement.textContent = t('Aucune am\u00e9lioration de b\u00e2timent');
        container.appendChild(statElement);
    }

    container.innerHTML += '<h4 style="margin: 16px 0 8px; color: #2563eb; font-size: 1.1rem;">' + t('Troph\u00e9es') + ' <span style="color: #16a34a;" data-trophies-bonus>(+' + (unlockedTrophies.size * 1) + '%)</span>' + '</h4>';
    const trophiesSection = renderTrophies();
    container.appendChild(trophiesSection);
    container.dataset.structureKey = statsStructureKey();
}

// ============================================
// MODALS
// ============================================

const EXCLUSIVE_MODALS = ['stats-modal', 'settings-modal', 'contracts-modal', 'card-collection-modal', 'galactic-shop-modal'];
function showExclusiveModal(modalId, onOpen) {
    const target = document.getElementById(modalId);
    const wasActive = target.classList.contains('active');
    EXCLUSIVE_MODALS.forEach(id => {
        if (id !== modalId) document.getElementById(id).classList.remove('active');
    });
    if (wasActive) {
        target.classList.remove('active');
    } else {
        if (onOpen) onOpen();
        target.classList.add('active');
    }
}
function toggleSettings() {
    showExclusiveModal('settings-modal');
}

function toggleStats() {
    showExclusiveModal('stats-modal', renderStats);
}

// ============================================
// DISPLAY
// ============================================

function updateDisplay() {
    document.getElementById('score-value').textContent = formatNumber(score, true);
    document.getElementById('gain-value').textContent = formatNumber(partsPerSecond);
    updateModalPartsCounter();
    updateStardustDisplay();
    updateStardustPreview();
    updateBonusTimer();
}

function updateModalPartsCounter() {
    const scoreText = formatNumber(score, true);
    const gainText = formatNumber(partsPerSecond);
    document.querySelectorAll('.modal-parts-value').forEach(el => { el.textContent = scoreText; });
    document.querySelectorAll('.modal-parts-gain').forEach(el => { el.textContent = gainText; });
}

function updateStardustDisplay() {
    const text = formatNumber(starDust);
    document.querySelectorAll('#stardust-value, #stardust-value-2').forEach(el => { el.textContent = text; });
}

function updateStardustPreview() {
    const previewValue = document.getElementById('stardust-preview-value');
    const previewBar = document.getElementById('stardust-preview-bar');
    if (!previewValue || !previewBar) return;

    const reachableDistance = calculateDistance();
    const safeDistance = (isNaN(reachableDistance) || reachableDistance < 0) ? 0 : reachableDistance;
    const potentialDust = calculateStardustGainExact(safeDistance);
    const intPart = Math.floor(potentialDust);
    const fracPart = potentialDust - intPart;

    previewValue.textContent = formatNumber(intPart);
    previewBar.style.width = (fracPart * 100) + '%';
}

function updateBonusTimer() {
    const timerElement = document.getElementById('bonus-timer');
    if (!timerElement) return;

    const activeBonuses = activeRandomBonuses.filter(b => b.effect === 'multiplier' || b.id === 'flare');
    if (activeBonuses.length === 0) {
        timerElement.textContent = '';
        timerElement.style.display = 'none';
        return;
    }

    const labels = activeBonuses.map(bonus => {
        const remainingTime = Math.max(0, bonus.endTime - Date.now());
        return `\u23f3 \u00d7${bonus.multiplier} (${formatDurationHMS(remainingTime)})`;
    });
    timerElement.innerHTML = labels.join('<br>');
    timerElement.style.display = 'block';
}

// ============================================
// CONTRATS DE FABRICATION (mini-jeu)
// On achete un contrat ciblant un batiment precise; si on produit le quota
// de Parts avec CE batiment dans le temps imparti, il gagne un bonus de
// production permanent (+50% cumulable). Rotation des contrats toutes les
// 2 minutes. Les contrats ciblent en priorite les batiments negliges.
// Quota volontaire Faisable : production normale du batiment sur la duree
// +5% seulement -- pas besoin de boost ni d'achat pour reussir.
// ============================================
const CONTRACT_ROTATION_MS = 2 * 60 * 1000;
const CONTRACT_DURATION_MS = 3 * 60 * 1000;
const CONTRACT_QUOTA_RATIO = 1.05;
const CONTRACT_REWARD_MULT = 0.50;
const CONTRACT_REWARD_MAX_STACKS = 10;
const CONTRACT_PRICE_PPS_SECONDS = 20;

let contractState = {
    offers: [],
    nextRotationAt: 0,
    active: null,
    buildingBonuses: {},
    unlockedSeen: false
};

const CONTRACT_UNLOCK_BUILDING_TYPES = 3;
function areContractsUnlocked() {
    return getUnlockedBuildingTypes() >= CONTRACT_UNLOCK_BUILDING_TYPES;
}
function getContractEligibleBuildings() {
    if (!areContractsUnlocked()) return [];
    return BUILDINGS.filter(b => b.count > 0 && b.unlockCondition());
}

function pickContractTargets() {
    const eligible = getContractEligibleBuildings();
    if (eligible.length === 0) return [];
    const totalPps = Math.max(1e-9, partsPerSecond);
    const scored = eligible.map(b => {
        const share = calculateBuildingGain(b) / totalPps;
        const stacks = contractState.buildingBonuses[b.id] || 0;
        const targetScore = (1 - share) + (CONTRACT_REWARD_MAX_STACKS - stacks) * 0.02 + Math.random() * 0.3;
        return { b, targetScore, share };
    });
    scored.sort((x, y) => y.targetScore - x.targetScore);
    const n = Math.min(2, scored.length);
    return scored.slice(0, n).map(s => s.b);
}

function getContractPrice() {
    return Math.max(50, Math.floor(getBasePartsPerSecond() * CONTRACT_PRICE_PPS_SECONDS));
}

function generateContractOffers() {
    const targets = pickContractTargets();
    const now = Date.now();
    contractState.offers = targets.map(b => {
        const ppsBuilding = calculateBuildingBaseGain(b);
        const quota = Math.max(10, Math.floor(ppsBuilding * (CONTRACT_DURATION_MS / 1000) * CONTRACT_QUOTA_RATIO));
        return {
            id: 'contract-' + b.id + '-' + now + '-' + Math.floor(Math.random() * 1e6),
            buildingId: b.id,
            price: getContractPrice(),
            quota: quota,
            expiresAt: now + CONTRACT_DURATION_MS
        };
    });
    contractState.nextRotationAt = now + CONTRACT_ROTATION_MS;
    if (typeof renderContracts === 'function' && document.getElementById('contracts-modal').classList.contains('active')) {
        renderContracts();
    }
}
function openContracts() {
    if (!areContractsUnlocked()) {
        showToast('\uD83D\uDD12 ' + tf('Debloque {count} types de batiments pour les contrats', { count: CONTRACT_UNLOCK_BUILDING_TYPES }));
        return;
    }
    showExclusiveModal('contracts-modal', renderContracts);
}

function closeContracts() {
    document.getElementById('contracts-modal').classList.remove('active');
}

function acceptContract(offerId) {
    const offer = contractState.offers.find(o => o.id === offerId);
    if (!offer) return;
    // Contrat accepte : rotation en pause tant qu'il n'est pas termine.
    if (contractState.active) {
        showToast('\u26a0\ufe0f ' + t('Un contrat a la fois !'));
        return;
    }
    if (score < offer.price) {
        showToast('\u274c ' + t('Pas assez de Parts'));
        return;
    }
    score -= offer.price;
    partsSinceLaunch = Math.max(0, partsSinceLaunch - offer.price);
    const building = findBuildingById(offer.buildingId);
    contractState.active = {
        offerId: offer.id,
        buildingId: offer.buildingId,
        quota: offer.quota,
        progress: 0,
        startTotal: totalGeneratedByBuilding[offer.buildingId] || 0,
        acceptedAt: Date.now(),
        expiresAt: Date.now() + CONTRACT_DURATION_MS
    };
    contractState.offers = contractState.offers.filter(o => o.id !== offer.id);
    showToast('\u2705 ' + tf('Contrat accepte : {building} !', { building: t(building.name) }), building.imgPath);
    renderContracts();
    saveGame();
}

function updateContractProgress() {
    const c = contractState.active;
    if (!c) return;
    const totalNow = totalGeneratedByBuilding[c.buildingId] || 0;
    c.progress = Math.max(0, totalNow - c.startTotal);
    if (c.progress >= c.quota) {
        completeContract();
    }
}

function completeContract() {
    const c = contractState.active;
    if (!c) return;
    const building = findBuildingById(c.buildingId);
    const stacks = (contractState.buildingBonuses[c.buildingId] || 0);
    const maxed = stacks >= CONTRACT_REWARD_MAX_STACKS;
    if (!maxed) {
        contractState.buildingBonuses[c.buildingId] = stacks + 1;
    }
    const mult = getContractBuildingMultiplier(c.buildingId);
    showToast('\uD83E\uDDF1 ' + tf('Contrat rempli ! {building} x{mult}', { building: t(building.name), mult: mult.toFixed(2) }), building.imgPath);
    contractState.active = null;
    contractState.offers = [];
    // Contrat termine : le timer repart de zero, prochaine offre dans 2 min.
    contractState.nextRotationAt = Date.now() + CONTRACT_ROTATION_MS;
    checkTrophies();
    saveGame();
}

function failContract() {
    const c = contractState.active;
    if (!c) return;
    const building = findBuildingById(c.buildingId);
    showToast('\u23f3 ' + tf('Contrat echoue pour {building}...', { building: t(building.name) }), building.imgPath);
    contractState.active = null;
    contractState.offers = [];
    // Contrat echoue : le timer repart de zero, prochaine offre dans 2 min.
    contractState.nextRotationAt = Date.now() + CONTRACT_ROTATION_MS;
    saveGame();
}

function getContractBuildingMultiplier(buildingId) {
    const stacks = contractState.buildingBonuses[buildingId] || 0;
    return Math.pow(1 + CONTRACT_REWARD_MULT, stacks);
}

function tickContracts() {
    const now = Date.now();
    // Deblocage au 3e batiment : la premiere offre arrive immediatement,
    // puis le timer de rotation (2 min) cadence les suivantes.
    if (areContractsUnlocked() && !contractState.unlockedSeen) {
        contractState.unlockedSeen = true;
        if (contractState.offers.length === 0 && !contractState.active) {
            generateContractOffers();
        }
    }
    // Le timer de rotation se met en pause tant qu'un contrat est en cours.
    // nextRotationAt a 0 (apres un lancement/reset ou une sauvegarde ancienne) :
    // on genere des offres immediatement des que les contrats sont debloques,
    // sinon le timer resterait bloque a 00:00 sans jamais rien proposer.
    const rotationPaused = !!contractState.active;
    if (!rotationPaused && areContractsUnlocked()
        && (contractState.nextRotationAt === 0 || now >= contractState.nextRotationAt)) {
        generateContractOffers();
    }
    if (contractState.active) {
        updateContractProgress();
        if (contractState.active && now >= contractState.active.expiresAt) {
            failContract();
        }
    }
    if (document.getElementById('contracts-modal').classList.contains('active')) {
        renderContracts();
    }
    renderContractsCardStatus();
}

function renderContractsCardStatus() {
    const statusEl = document.getElementById('contracts-card-status');
    if (!statusEl) return;
    const now = Date.now();
    if (!areContractsUnlocked()) {
        statusEl.className = 'game-status visible';
        statusEl.textContent = '\uD83D\uDD12 ' + t('3 batiments requis');
        return;
    }
    if (contractState.active) {
        const c = contractState.active;
        const building = findBuildingById(c.buildingId);
        const remaining = Math.max(0, c.expiresAt - now);
        const pct = Math.min(100, (c.progress / c.quota) * 100);
        statusEl.className = 'game-status visible';
        statusEl.innerHTML = t(building.name)
            + ' <span class="status-timer">' + formatContractTime(remaining) + '</span>'
            + '<span class="status-bar"><div style="width:' + pct + '%"></div></span>';
    } else if (contractState.offers.length > 0) {
        const nextIn = Math.max(0, contractState.nextRotationAt - now);
        statusEl.className = 'game-status visible';
        statusEl.innerHTML = '<span class="status-offers">' + contractState.offers.length + ' ' + t('contrat(s) propose(s)') + '</span>'
            + ' \u00b7 ' + tf('nouveaux contrats dans {time}', { time: formatContractTime(nextIn) });
    } else {
        statusEl.className = 'game-status';
        statusEl.textContent = '';
    }
}

function contractsStructureKey() {
    if (contractState.active) return 'active:' + contractState.active.offerId;
    return 'offers:' + contractState.offers.map(o => o.id).join(',');
}
function renderContracts() {
    const modal = document.getElementById('contracts-modal');
    if (!modal.classList.contains('active')) return;
    const listEl = document.getElementById('contracts-list');
    if (!listEl) return;
    const now = Date.now();
    const key = contractsStructureKey();
    // Reconstruire le DOM seulement si la structure change (nouvelles offres,
    // contrat actif/termine). Sinon mise a jour ciblee des valeurs dynamiques :
    // reconstruire innerHTML detruirait le bouton sous le curseur (flicker).
    if (listEl.dataset.structureKey !== key) {
        listEl.dataset.structureKey = key;
        listEl.innerHTML = buildContractsHtml();
    }
    updateContractsDynamicValues(listEl, now);
}
function buildContractsHtml() {
    let html = '<div class="contract-rotation">\u23f3 ' + tf('nouveaux contrats dans {time}', { time: '<span class="contract-rotation-timer">' + formatContractTime(Math.max(0, contractState.nextRotationAt - Date.now())) + '</span>' }) + '</div>';
    if (contractState.active) {
        const c = contractState.active;
        const building = findBuildingById(c.buildingId);
        html += '<div class="contract-card active">'
            + '<div class="contract-head"><img src="' + building.imgPath + '" alt=""><div><div class="contract-title">' + t(building.name) + '</div>'
            + '<div class="contract-sub">' + t('Contrat en cours') + '</div></div></div>'
            + '<div class="contract-progress"><div class="contract-progress-fill" style="width:0%"></div></div>'
            + '<div class="contract-meta"><span class="contract-progress-text"></span>'
            + '<span class="contract-timer"></span></div>'
            + '</div>';
    } else if (contractState.offers.length === 0) {
        html += '<div class="contract-empty">' + t('Aucun contrat disponible') + '</div>';
    } else {
        contractState.offers.forEach(offer => {
            const building = findBuildingById(offer.buildingId);
            const stacks = contractState.buildingBonuses[offer.buildingId] || 0;
            const rewardMult = getContractBuildingMultiplier(offer.buildingId) * (1 + CONTRACT_REWARD_MULT);
            html += '<div class="contract-card">'
                + '<div class="contract-head"><img src="' + building.imgPath + '" alt=""><div>'
                + '<div class="contract-title">' + t(building.name) + '</div>'
                + '<div class="contract-sub">' + tf('Produis {quota} Parts avec ce batiment en 3 min', { quota: formatNumber(offer.quota) }) + '</div></div></div>'
                + '<div class="contract-reward">+' + Math.round(CONTRACT_REWARD_MULT * 100) + '% ' + t('production permanente') + ' (x' + rewardMult.toFixed(2) + ')'
                + (stacks > 0 ? ' \u00b7 ' + t('deja') + ' x' + getContractBuildingMultiplier(offer.buildingId).toFixed(2) : '')
                + (stacks >= CONTRACT_REWARD_MAX_STACKS ? ' \u00b7 ' + t('palier max') : '')
                + '</div>'
                + '<button class="contract-buy-btn" data-offer-id="' + offer.id + '" onclick="acceptContract(\'' + offer.id + '\')">'
                + '<img src="images/parts.png" class="coin-icon" alt=""> ' + formatNumber(offer.price) + ' ' + t('Parts') + '</button>'
                + '</div>';
        });
    }
    return html;
}
function updateContractsDynamicValues(listEl, now) {
    const rotationEl = listEl.querySelector('.contract-rotation-timer');
    if (rotationEl) rotationEl.textContent = formatContractTime(Math.max(0, contractState.nextRotationAt - now));
    if (contractState.active) {
        const c = contractState.active;
        const remaining = Math.max(0, c.expiresAt - now);
        const pct = Math.min(100, (c.progress / c.quota) * 100);
        const fill = listEl.querySelector('.contract-progress-fill');
        if (fill) fill.style.width = pct + '%';
        const text = listEl.querySelector('.contract-progress-text');
        if (text) text.textContent = formatNumber(Math.floor(c.progress)) + ' / ' + formatNumber(c.quota) + ' ' + t('Parts');
        const timer = listEl.querySelector('.contract-timer');
        if (timer) timer.textContent = formatContractTime(remaining);
    } else {
        contractState.offers.forEach(offer => {
            const btn = listEl.querySelector('.contract-buy-btn[data-offer-id="' + offer.id + '"]');
            if (btn) btn.disabled = score < offer.price;
        });
    }
}

function formatContractTime(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    const mm = (m < 10 ? '0' : '') + m;
    const rr = (r < 10 ? '0' : '') + r;
    return (h > 0 ? h + ':' : '') + mm + ':' + rr;
}

function resetContractState() {
    contractState.offers = [];
    contractState.active = null;
    contractState.buildingBonuses = {};
    contractState.nextRotationAt = 0;
    // unlockedSeen reste true : les contrats restent debloques d'un run a l'autre.
}

// ============================================
// CARD COLLECTION MINI-GAME
// ============================================

const CARD_RARITIES = {
    common:     { name: 'Commune',     color: '#94a3b8', glow: 'rgba(148,163,184,0.4)', bonusMult: 0.01 },
    rare:       { name: 'Rare',        color: '#3b82f6', glow: 'rgba(59,130,246,0.5)',  bonusMult: 0.03 },
    epic:       { name: 'Épique',     color: '#a855f7', glow: 'rgba(168,85,247,0.6)',  bonusMult: 0.08 },
    legendary:  { name: 'Légendaire',  color: '#fbbf24', glow: 'rgba(251,191,36,0.7)', bonusMult: 0.20 },
    alternative:{ name: 'Alternative', color: '#f43f5e', glow: 'rgba(244,63,94,0.8)',  bonusMult: 0.50 }
};

const COLLECTIBLE_CARDS = [    { id: 'earth-card',     name: 'Terre',                 rarity: 'common',     icon: '🌍', imgPath: 'images/cards/collection/earth-card.png' },    { id: 'moon-card',      name: 'Lune',                  rarity: 'common',     icon: '🌙', imgPath: 'images/cards/collection/moon-card.png' },    { id: 'mars-card',      name: 'Mars',                  rarity: 'common',     icon: '🐀', imgPath: 'images/cards/collection/mars-card.png' },    { id: 'wrench-card',    name: 'Atelier',               rarity: 'common',     icon: '🔧', imgPath: 'images/cards/collection/workshop-card.png' },    { id: 'factory-card',   name: 'Usine',                 rarity: 'common',     icon: '🏭', imgPath: 'images/cards/collection/factory-card.png' },    { id: 'mining-card',    name: 'Mine stellaire',        rarity: 'common',     icon: '⛏️', imgPath: 'images/cards/collection/stellar-mine-card.png' },    { id: 'solar-card',     name: 'Centrale solaire',      rarity: 'common',     icon: '☀️', imgPath: 'images/cards/collection/solar-factory-card.png' },    { id: 'comet-card',     name: 'Comète',                rarity: 'common',     icon: '☄', imgPath: 'images/cards/collection/comet-card.png' },    { id: 'neptune-card',   name: 'Neptune',               rarity: 'rare',       icon: '🌊', imgPath: 'images/cards/collection/neptune-card.png' },    { id: 'pluto-card',     name: 'Pluton',                rarity: 'rare',       icon: '❄️', imgPath: 'images/cards/collection/pluto-card.png' },    { id: 'proxima-card',   name: 'Proxima Centauri',      rarity: 'rare',       icon: '☉', imgPath: 'images/cards/collection/proxima-card.png' },    { id: 'foundry-card',   name: 'Autofab orbitale',      rarity: 'rare',       icon: '🛰️', imgPath: 'images/cards/collection/foundry-card.png' },    { id: 'station-card',   name: 'Essaim de sondes',      rarity: 'rare',       icon: '📡', imgPath: 'images/cards/collection/station-card.png' },    { id: 'nanoforge-card', name: 'Nanoforge',             rarity: 'rare',       icon: '⚙️', imgPath: 'images/cards/collection/nanoforge-card.png' },    { id: 'sirius-card',    name: 'Sirius',                rarity: 'epic',       icon: '⭐', imgPath: 'images/cards/collection/sirius-card.png' },    { id: 'oort-card',      name: "Nuage d'Oort",           rarity: 'epic',       icon: '🌀', imgPath: 'images/cards/collection/oort-card.png' },    { id: 'synth-card',     name: 'Imprimeur quantique',   rarity: 'epic',       icon: '🧬', imgPath: 'images/cards/collection/synth-card.png' },    { id: 'milkyway-card',  name: 'Centre Voie lactée',  rarity: 'legendary',  icon: '🌌', imgPath: 'images/cards/collection/milkyway-card.png' },    { id: 'blackhole-card', name: 'Trou noir industriel',   rarity: 'legendary',  icon: '🕳️', imgPath: 'images/cards/collection/blackhole-card.png' },    { id: 'andromeda-card', name: 'Andromède',            rarity: 'alternative', icon: '🔭', imgPath: 'images/cards/collection/andromeda-card.png' }];

const BOOSTERS = {
    standard:  { name: 'Standard',   cardCount: 1, cost: () => Math.max(100, Math.floor(getBasePartsPerSecond() * 8)),     rarities: { common: 0.80, rare: 0.18, epic: 0.02 } },
    premium:   { name: 'Premium',    cardCount: 2, cost: () => Math.max(500, Math.floor(getBasePartsPerSecond() * 40)),    rarities: { common: 0.50, rare: 0.30, epic: 0.15, legendary: 0.04, alternative: 0.01 } },
    legendary: { name: 'Légendaire', cardCount: 3, cost: () => Math.max(2000, Math.floor(getBasePartsPerSecond() * 160)),  rarities: { common: 0.25, rare: 0.30, epic: 0.25, legendary: 0.15, alternative: 0.05 } }
};

// ============================================
// ATELIER GALACTIQUE - 23 upgrades uniques en 4 branches
// Ne se reset jamais. Progression meta entre les runs.
// ============================================
const GALACTIC_BRANCHES = [
    { id: 'production',   name: 'Production',    icon: '\u2699',  color: '#3b82f6' },
    { id: 'rocket',       name: 'Fus\u00e9e',          icon: '\ud83d\ude80', color: '#f59e0b' },
    { id: 'collection',   name: 'Collection',     icon: '\ud83c\udccf', color: '#ec4899' },
    { id: 'click',        name: 'Clic',            icon: '\ud83d\udc46', color: '#10b981' },
    { id: 'offline',      name: 'Hors-ligne',      icon: '\ud83c\udf19', color: '#64748b' }
];

const GALACTIC_UPGRADES = [
    // === BRANCHE PRODUCTION (8) - un upgrade par planete ===
    { id: 'prod1',  branch: 'production', tier: 1, name: 'R\u00e9acteur \u00e0 fusion',        desc: '+25% production globale.',        baseCost: 2,    costMult: 1.0, maxLevel: 1, effectPerLevel: 0.25 },
    { id: 'prod2',  branch: 'production', tier: 2, name: 'Optimisation \u00e9nerg\u00e9tique',  desc: '+35% production globale.',        baseCost: 5,    costMult: 1.0, maxLevel: 1, effectPerLevel: 0.35, requires: ['prod1'] },
    { id: 'prod3',  branch: 'production', tier: 3, name: 'Surcharge industrielle',   desc: '+45% production globale.',        baseCost: 15,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.45, requires: ['prod2'] },
    { id: 'prod4',  branch: 'production', tier: 4, name: 'Automatisation avanc\u00e9e',    desc: '+55% production globale.',       baseCost: 45,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.55, requires: ['prod3'] },
    { id: 'prod5',  branch: 'production', tier: 5, name: 'Nanotechnologie',          desc: '+65% production globale.',       baseCost: 130,  costMult: 1.0, maxLevel: 1, effectPerLevel: 0.65, requires: ['prod4'] },
    { id: 'prod6',  branch: 'production', tier: 6, name: 'Synth\u00e8se de mati\u00e8re noire', desc: '+75% production globale.',      baseCost: 380,  costMult: 1.0, maxLevel: 1, effectPerLevel: 0.75, requires: ['prod5'] },
    { id: 'prod7',  branch: 'production', tier: 7, name: 'Singularit\u00e9 technologique', desc: '+85% production globale.',      baseCost: 800, costMult: 1.0, maxLevel: 1, effectPerLevel: 0.85, requires: ['prod6'] },
    { id: 'prod8',  branch: 'production', tier: 8, name: 'Forge stellaire',          desc: '+100% production globale.',       baseCost: 2200, costMult: 1.0, maxLevel: 1, effectPerLevel: 1.0, requires: ['prod7'] },

    // === BRANCHE FUS\u00c9E (5) - upgrades uniques ===
    { id: 'rock1',  branch: 'rocket', tier: 1, name: 'D\u00e9marrage assist\u00e9',        desc: '+5 Ateliers gratuits au d\u00e9but de chaque run.', baseCost: 1,   costMult: 1.0, maxLevel: 1, effectPerLevel: 5 },
    { id: 'rock2',  branch: 'rocket', tier: 2, name: 'Propulsion am\u00e9lior\u00e9e',      desc: '+20% distance de lancement.',       baseCost: 3,    costMult: 1.0, maxLevel: 1, effectPerLevel: 0.20, requires: ['rock1'] },
    { id: 'rock3',  branch: 'rocket', tier: 3, name: 'Cha\u00eene de production',     desc: '+1 Usine gratuite au d\u00e9but de chaque run.',  baseCost: 10,   costMult: 1.0, maxLevel: 1, effectPerLevel: 1, requires: ['rock2'] },
    { id: 'rock4',  branch: 'rocket', tier: 4, name: 'Propulsion quantique',      desc: '+30% distance de lancement.',       baseCost: 40,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.30, requires: ['rock3'] },

    // === BRANCHE COLLECTION (5) - upgrades uniques ===
    { id: 'coll1',  branch: 'collection', tier: 1, name: 'Carte de commerçant',     desc: '-10% coût des boosters.',          baseCost: 1,    costMult: 1.0, maxLevel: 1, effectPerLevel: 0.10 },
    { id: 'coll2',  branch: 'collection', tier: 2, name: 'Chance de collection',   desc: '+15% chance de rareté supérieure dans le booster Standard.',  baseCost: 8,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.15, requires: ['coll1'] },
    { id: 'coll3',  branch: 'collection', tier: 3, name: 'Marché noir',           desc: '-10% coût des boosters.',          baseCost: 30,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.10, requires: ['coll2'] },
    { id: 'coll4',  branch: 'collection', tier: 4, name: 'Boosters renforcés',      desc: '+20% au bonus des cartes possédées.',              baseCost: 80,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.20, requires: ['coll3'] },
    { id: 'coll5',  branch: 'collection', tier: 5, name: 'Réseau de contrebande',  desc: '-15% coût des boosters.',          baseCost: 200,  costMult: 1.0, maxLevel: 1, effectPerLevel: 0.15, requires: ['coll4'] },
    { id: 'coll6',  branch: 'collection', tier: 6, name: 'Album cosmique',          desc: '+1 carte dans tous les boosters.',     baseCost: 500,  costMult: 1.0, maxLevel: 1, effectPerLevel: 1, requires: ['coll5'] },

    // === BRANCHE CLIC (5) - upgrades uniques ===
    { id: 'click1', branch: 'click', tier: 1, name: 'Gants renforc\u00e9s',      desc: 'x1.5 puissance de clic.',              baseCost: 1,   costMult: 1.0, maxLevel: 1, effectPerLevel: 1.5 },
    { id: 'click2', branch: 'click', tier: 2, name: 'Frappe critique',       desc: '+2.5% chance de coup critique (x3).',   baseCost: 5,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.025, requires: ['click1'] },
    { id: 'click3', branch: 'click', tier: 3, name: 'Main cybern\u00e9tique',     desc: 'x1.75 puissance de clic.',             baseCost: 25,  costMult: 1.0, maxLevel: 1, effectPerLevel: 1.75, requires: ['click2'] },
    { id: 'click4', branch: 'click', tier: 4, name: 'Surcharge neuronale',    desc: '+10% chance de coup critique (x3).',    baseCost: 60,  costMult: 1.0, maxLevel: 1, effectPerLevel: 0.10, requires: ['click3'] },
    { id: 'click5', branch: 'click', tier: 5, name: 'Main de l\'univers',      desc: 'x2 puissance de clic.',                baseCost: 150, costMult: 1.0, maxLevel: 1, effectPerLevel: 2, requires: ['click4'] },
    { id: 'click6', branch: 'click', tier: 6, name: 'Appel cosmique',         desc: '5% de chance de d\u00e9clencher une com\u00e8te \u00e0 chaque clic.', baseCost: 400, costMult: 1.0, maxLevel: 1, effectPerLevel: 0.05, requires: ['click5'] },
    // === BRANCHE HORS-LIGNE (5) - production pendant l'absence ===
    { id: 'off1', branch: 'offline', tier: 1, name: 'Pilote automatique',          desc: 'Production continue jusqu\u0027\u00e0 20min apr\u00e8s fermeture du jeu.',  baseCost: 1,   costMult: 1.0, maxLevel: 1, effectPerLevel: 1/3 },
    { id: 'off2', branch: 'offline', tier: 2, name: 'Drone de maintenance',         desc: 'Production continue jusqu\u0027\u00e0 40min apr\u00e8s fermeture du jeu.',  baseCost: 3,   costMult: 1.0, maxLevel: 1, effectPerLevel: 2/3, requires: ['off1'] },
    { id: 'off3', branch: 'offline', tier: 3, name: 'IA de bord',                  desc: 'Production continue jusqu\u0027\u00e0 1h20 apr\u00e8s fermeture du jeu.',  baseCost: 8,  costMult: 1.0, maxLevel: 1, effectPerLevel: 4/3, requires: ['off2'] },
    { id: 'off4', branch: 'offline', tier: 4, name: 'Colonie autonome',            desc: 'Production continue jusqu\u0027\u00e0 2h40 apr\u00e8s fermeture du jeu.',  baseCost: 20,  costMult: 1.0, maxLevel: 1, effectPerLevel: 8/3, requires: ['off3'] },
    { id: 'off5', branch: 'offline', tier: 5, name: 'Civilisation robotis\u00e9e', desc: 'Production continue jusqu\u0027\u00e0 5h20 apr\u00e8s fermeture du jeu.', baseCost: 50, costMult: 1.0, maxLevel: 1, effectPerLevel: 16/3, requires: ['off4'] }
];

let galacticUpgrades = {};

let cardCollection = {};

function openCardCollection() {
    showExclusiveModal('card-collection-modal', () => {
        updateCardCollectionDisplay();
        showCardShop();
    });
}

function closeCardCollection() {
    document.getElementById('card-collection-modal').classList.remove('active');
}

function showCardShop() {
    document.getElementById('cc-booster-screen').style.display = 'block';
    document.getElementById('cc-reveal-screen').style.display = 'none';
    document.getElementById('cc-album-screen').style.display = 'none';
    document.getElementById('cc-back-btn').style.display = 'none';
    updateBoosterPrices();
}

function showCardAlbum() {
    document.getElementById('cc-booster-screen').style.display = 'none';
    document.getElementById('cc-reveal-screen').style.display = 'none';
    document.getElementById('cc-album-screen').style.display = 'block';
    document.getElementById('cc-back-btn').style.display = 'inline-flex';
    renderCardAlbum();
}

function showCardReveal() {
    document.getElementById('cc-booster-screen').style.display = 'none';
    document.getElementById('cc-reveal-screen').style.display = 'flex';
    document.getElementById('cc-album-screen').style.display = 'none';
    document.getElementById('cc-back-btn').style.display = 'inline-flex';
}

function updateBoosterPrices() {
    for (const key in BOOSTERS) {
        const costEl = document.getElementById('cc-cost-' + key);
        if (costEl) { costEl.textContent = ''; const coinImg = document.createElement('img'); coinImg.src = 'images/parts.png'; coinImg.className = 'coin-icon'; coinImg.alt = ''; costEl.appendChild(coinImg); costEl.appendChild(document.createTextNode(' ' + formatNumber(Math.floor(BOOSTERS[key].cost() * (1 - getBoosterDiscount()))))); }
    }
}

function updateCardCollectionDisplay() {
    const collected = Object.keys(cardCollection).filter(id => cardCollection[id] > 0);
    document.getElementById('cc-collected-count').textContent = collected.length;
    document.getElementById('cc-total-count').textContent = COLLECTIBLE_CARDS.length;
    document.getElementById('cc-bonus-display').textContent = '×' + getCollectionMultiplier().toFixed(2);
}

function isCollectionComplete() {
    return COLLECTIBLE_CARDS.every(c => cardCollection[c.id] > 0);
}

function getCollectionBonus() {
    let bonus = 0;
    for (const card of COLLECTIBLE_CARDS) {
        if (cardCollection[card.id] > 0) {
            bonus += CARD_RARITIES[card.rarity].bonusMult;
        }
    }
    if (isCollectionComplete()) {
        bonus += 0.20;
    }
    return bonus;
}

function getCollectionMultiplier() {
    return 1 + getCollectionBonus() * (1 + getCollectionUpgradeBonus());
}

function buyBooster(type) {
    const booster = BOOSTERS[type];
    if (!booster) return;
    const cost = Math.floor(booster.cost() * (1 - getBoosterDiscount()));
    if (score < cost) {
        showToast('❌ ' + t('Pas assez de Parts pour ce booster !'));
        return;
    }
    score -= cost;
    updateDisplay();

    const drawn = [];
    let cardCount = booster.cardCount;
    cardCount += getGalacticUpgradeLevel('coll6');
    for (let i = 0; i < cardCount; i++) {
        drawn.push(drawCard(booster.rarities));
    }

    for (const card of drawn) {
        cardCollection[card.id] = (cardCollection[card.id] || 0) + 1;
    }

    renderRevealCards(drawn);
    showCardReveal();
    updateCardCollectionDisplay();
    saveGame();
}

function drawCard(rarities) {
    const boost = getRarityBoost();
    const adjusted = {};
    let total = 0;
    const order = Object.keys(rarities);
    for (const r of order) { adjusted[r] = rarities[r]; total += rarities[r]; }
    if (boost > 0) {
        const boosted = adjusted['common'] * boost;
        adjusted['common'] -= boosted;
        for (let i = 1; i < order.length; i++) {
            adjusted[order[i]] += boosted / (order.length - 1);
        }
    }
    const roll = Math.random() * total;
    let cumul = 0;
    let chosenRarity = 'common';
    for (const rarity of order) {
        cumul += adjusted[rarity];
        if (roll < cumul) { chosenRarity = rarity; break; }
    }
    const pool = COLLECTIBLE_CARDS.filter(c => c.rarity === chosenRarity);
    if (pool.length === 0) {
        const fallback = COLLECTIBLE_CARDS.filter(c => c.rarity === 'common');
        return fallback[Math.floor(Math.random() * fallback.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

function renderRevealCards(cards) {
    const container = document.getElementById('cc-reveal-cards');
    container.innerHTML = '';
    container.style.setProperty('--card-count', cards.length);
    document.getElementById('cc-reveal-shop-btn').style.display = 'none';
    document.getElementById('cc-reveal-album-btn').style.display = 'none';
    const total = cards.length;
    let revealed = 0;
    const checkAllRevealed = function () {
        if (revealed >= total) {
            document.getElementById('cc-reveal-shop-btn').style.display = 'inline-flex';
            document.getElementById('cc-reveal-album-btn').style.display = 'inline-flex';
        }
    };
    cards.forEach((card, idx) => {
        const isNew = (cardCollection[card.id] || 0) <= 1;
        const el = document.createElement('div');
        el.className = 'cc-reveal-card rarity-' + card.rarity;
        el.style.animationDelay = (idx * 0.15) + 's';
        el.innerHTML =
            '<div class="cc-reveal-inner">' +
                '<div class="cc-reveal-front"><img src="images/cards/backs/card-back.png" class="cc-card-img" alt="Dos de carte"></div>' +
                '<div class="cc-reveal-back">' +
                    '<img src="' + card.imgPath + '" class="cc-card-img" alt="' + card.name + '">' +
                    (isNew ? '<div class="cc-card-new">' + t('NOUVELLE !') + '</div>' : '') +
                '</div>' +
            '</div>';
        el.addEventListener('click', function () {
            if (el.classList.contains('flipped')) return;
            el.classList.add('flipped');
            revealed++;
            checkAllRevealed();
        });
        container.appendChild(el);
    });
}

function revealAllCards() {
    document.querySelectorAll('#cc-reveal-cards .cc-reveal-card:not(.flipped)').forEach(function (el) {
        el.classList.add('flipped');
    });
    document.getElementById('cc-reveal-shop-btn').style.display = 'inline-flex';
    document.getElementById('cc-reveal-album-btn').style.display = 'inline-flex';
}

function renderCardAlbum() {
    const grid = document.getElementById('cc-album-grid');
    grid.innerHTML = '';

    const complete = isCollectionComplete();
    if (complete) {
        const banner = document.createElement('div');
        banner.className = 'cc-set-complete';
        banner.textContent = '🚀 ' + t('Collection complète ! +20% prod');
        grid.appendChild(banner);
    }
    COLLECTIBLE_CARDS.forEach(card => {
        const owned = cardCollection[card.id] > 0;
        const el = document.createElement('div');
        el.className = 'cc-album-card' + (owned ? '' : ' locked') + ' rarity-' + card.rarity;
        el.innerHTML =
            (owned
                ? '<img src="' + card.imgPath + '" class="cc-card-img" alt="' + card.name + '"><div class="cc-card-count">\u00d7' + cardCollection[card.id] + '</div>'
                : '<div class="cc-card-icon">?</div>');
        if (owned) {
            el.addEventListener('click', function () { openCardLightbox(card); });
        }
        grid.appendChild(el);
    });
}

function openCardLightbox(card) {
    const lightbox = document.getElementById('cc-lightbox');
    const img = document.getElementById('cc-lightbox-img');
    img.src = card.imgPath;
    img.alt = card.name;
    document.getElementById('cc-lightbox-name').textContent = t(card.name);
    const rarity = CARD_RARITIES[card.rarity];
    const bonus = Math.round(CARD_RARITIES[card.rarity].bonusMult * 100);
    const count = cardCollection[card.id] || 0;
    document.getElementById('cc-lightbox-sub').textContent = t(rarity.name) + ' \u00b7 +' + bonus + '% ' + t('production') + ' \u00b7 \u00d7' + count;
    document.getElementById('cc-lightbox-name').style.color = rarity.color;
    lightbox.classList.add('open');
    lightbox.dataset.cardId = card.id;
}

function closeCardLightbox() {
    const lightbox = document.getElementById('cc-lightbox');
    lightbox.classList.remove('open');
    lightbox.dataset.cardId = '';
}

// ============================================
// MOBILE / RESPONSIVE
// ============================================
// Vue active sur mobile : 'center' (fusée), 'right' (bâtiments), 'left' (espace)
let mobileActiveView = 'center';

function isMobileLayout() {
    return window.matchMedia('(max-width: 1024px)').matches;
}

function setMobileView(view) {
    mobileActiveView = view;
    const grid = document.querySelector('.main-grid');
    const nav = document.getElementById('mobile-nav');
    if (!grid) return;
    grid.classList.remove('mobile-view-left', 'mobile-view-center', 'mobile-view-right');
    grid.classList.add('mobile-view-' + view);
    if (nav) {
        nav.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    }
    if (view === 'center') applySceneScale();
}

// Mise à l'échelle de la scène de construction : la fusée fait ~700px
// de haut en taille réelle (pièces positionnées en pixels fixes). On applique
// un transform: scale() pour qu'elle tienne toujours dans l'écran.
function applySceneScale() {
    // Le monde scene-world (1024x744, dimensions natives du fond) contient le
    // decor ET la fusée dans le meme repere : une seule echelle uniforme,
    // jamais de desynchronisation au redimensionnement.
    const world = document.getElementById('scene-world');
    if (!world || launchSequenceActive) return;
    const scene = world.parentElement;
    if (!scene) return;
    const sceneHeight = scene.clientHeight;
    const sceneWidth = scene.clientWidth;
    if (!sceneHeight || !sceneWidth) return;
    const WORLD_WIDTH = 1024;
    const WORLD_HEIGHT = 744;
    // Sommet de la fusée dans le repere monde (piece la plus haute : pas de tir).
    const ROCKET_TOP_Y = 205;
    const rocketAboveGround = WORLD_HEIGHT - ROCKET_TOP_Y;
    const MARGIN = 24;
    // 1) Echelle "cover" : le decor remplit toujours la scene (ancré bas-centre,
    //    le debordement part vers le ciel).
    let scale = Math.max(sceneWidth / WORLD_WIDTH, sceneHeight / WORLD_HEIGHT);
    // 2) Garde-fou : le sommet de la fusée reste toujours visible avec une
    //    marge, même sur des ecrans tres larges et bas.
    scale = Math.min(scale, (sceneHeight - MARGIN) / rocketAboveGround);
    world.style.transformOrigin = '50% 100%';
    world.style.transform = 'translateX(-50%) scale(' + scale + ')';
    // Prolongation du sol : le decor a sa ligne de sol vers y=480 (sur 744).
    // On aligne le remplissage sur cette ligne pour une jonction invisible.
    const GROUND_LINE_Y = 480;
    const groundFill = document.getElementById('scene-ground-fill');
    if (groundFill) groundFill.style.height = (scale * (WORLD_HEIGHT - GROUND_LINE_Y)) + 'px';
}

function initMobileNav() {
    const nav = document.getElementById('mobile-nav');
    if (!nav) return;
    nav.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => setMobileView(btn.dataset.view));
    });
    if (isMobileLayout()) setMobileView(mobileActiveView);
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            relocateBuildingProductions();
            if (isMobileLayout()) {
                setMobileView(mobileActiveView);
            }
            // La scène se recale à toutes les tailles d'écran (desktop inclus)
            applySceneScale();
        }, 150);
    });
    window.addEventListener('orientationchange', () => {
        setTimeout(applySceneScale, 250);
    });
}

// --- Chronometre depuis le dernier lancement ---
// Format de duree complet : toutes les unites non nulles sont affichees,
// avec zero non significatif quand une unite superieure est presente.
// 3h45m50s / 45m50s / 50s / jamais une seule unite tronquee.
function formatDurationHMS(ms) {
    if (ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return h + 'h' + String(m).padStart(2, '0') + 'm' + String(s).padStart(2, '0') + 's';
    if (m > 0) return m + 'm' + String(s).padStart(2, '0') + 's';
    return s + 's';
}
function formatLaunchTimer(ms) {
    return formatDurationHMS(ms);
}

function updateLaunchTimer() {
    const el = document.getElementById('launch-timer');
    if (!el) return;
    // Avant le premier lancement, le chrono court depuis le debut de la partie
    const start = lastLaunchAt || gameStartTime || 0;
    if (!start) return;
    el.textContent = formatLaunchTimer(Date.now() - start);
    el.classList.toggle('has-launch', !!lastLaunchAt);
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    initGlobals();
    loadGame();
    applyStartupBonus();

    updateDisplay();
    renderBuildings();
    renderUpgrades();
    renderRocketPartsShop();
    updateConstructionScene();
    checkBuildingUnlocks();
    checkTrophies();
    initMobileNav();
    const ccLightbox = document.getElementById('cc-lightbox');
    if (ccLightbox) {
        ccLightbox.addEventListener('click', function (e) { if (e.target !== document.getElementById('cc-lightbox-img')) closeCardLightbox(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCardLightbox(); });
    }
    if (isMobileLayout()) {
        setMobileView(mobileActiveView);
        applySceneScale();
    }
}

// ============================================
// TIMERS
// ============================================

function scheduleBonusSpawn() {
    const bonus = getCometFrequencyBonus();
    const delay = Math.max(800, BONUS_SPAWN_INTERVAL_MS / (1 + bonus));
    setTimeout(() => {
        if (!cometShowerActive) spawnRandomBonus();
        scheduleBonusSpawn();
    }, delay);
}
scheduleBonusSpawn();

// ============================================
// PLUIE DE COMÈTES (événement régulier)
// ============================================
// Toutes les 4 à 6 minutes, une cascade de comètes dorées traverse
// l'écran : chacune ne donne que du bonus instantané (jamais de flare),
// pour éviter tout cumul de multiplicateurs.
let cometShowerActive = false;
function scheduleCometShower() {
    const delay = 240000 + Math.random() * 120000;
    setTimeout(() => {
        startCometShower();
        scheduleCometShower();
    }, delay);
}
function startCometShower() {
    if (cometShowerActive) return;
    cometShowerActive = true;
    showToast('\ud83c\udf20 ' + t('Pluie de com\u00e8tes ! Attrapez-les !'));
    const COUNT = 12;
    const SPREAD_MS = 8000;
    for (let i = 0; i < COUNT; i++) {
        setTimeout(() => spawnRandomBonus(true), (i / COUNT) * SPREAD_MS + Math.random() * 400);
    }
    setTimeout(() => { cometShowerActive = false; }, SPREAD_MS + 8000);
}
scheduleCometShower();
let lastGameTick = Date.now();

setInterval(gameLoop, GAME_LOOP_INTERVAL_MS);
setInterval(tickContracts, 500);
setInterval(() => {
    if (Date.now() - lastSaveTime > SAVE_INTERVAL_MS) {
        saveGame();
    }
}, 10000);

window.onload = function() {
    if (typeof initLanguage === 'function') initLanguage();
    init();
    if (!gameStartTime) {
        gameStartTime = Date.now();
    }
    initDebugMode();
    // Recalage de la scene une fois les polices/images stabilisees :
    // la hauteur de la top-bar peut encore changer au premier rendu.
    setTimeout(applySceneScale, 100);
};

// ============================================
// MODE DEBUG (test de progression rapide)
// Activer via ?debug=1 dans l'URL.
// Commandes globales: Debug.addScore(n), Debug.addStardust(n),
// Debug.buyAllParts(), Debug.launch(), Debug.fast(n),
// Debug.giveBuildings(id, n), Debug.reset(), Debug.setPlanet(index)
// ============================================
const DEBUG_MODE = new URLSearchParams(window.location.search).has('debug');

function debugSimulateTime(seconds) {
    // Avance une horloge virtuelle et rejoue gameLoop pas a pas
    // (gameLoop se base sur Date.now, on le decale d'un offset croissant).
    const stepMs = 2000;
    let remaining = seconds * 1000;
    const realNow = Date.now;
    let offset = 0;
    Date.now = () => realNow() + offset;
    try {
        while (remaining > 0) {
            const dt = Math.min(stepMs, remaining);
            offset += dt;
            gameLoop();
            remaining -= dt;
        }
    } finally {
        Date.now = realNow;
    }
    // Resynchroniser toutes les horloges de throttling sur le temps reel,
    // sinon elles restent bloquees dans le futur virtuel et les mises a jour
    // UI (prix, distance, sauvegarde) s'arretent pendant des heures.
    const now = Date.now();
    lastGameTick = now;
    lastBuildingsUpdate = 0;
    lastRocketPartsUpdate = 0;
    lastSpaceProgressUpdate = 0;
    lastSaveTime = 0;
}

function debugRenderAll() {
    updateDisplay();
    updateAllBuildingButtons();
    renderBuildings();
    renderUpgrades();
    renderRocketPartsShop();
    updateConstructionScene();
    updateSpaceProgress();
    updateStardustDisplay();
    renderGalacticShop();
}

// --- Estimateur de temps reel jusqu'a la prochaine planete ---
// Snapshot/restaure l'etat du jeu, simule l'avenir avec une politique
// d'achat "meilleur rendement" et retourne le temps de jeu actif requis.
function debugSnapshotState() {
    return {
        score, partsSinceLaunch, partsPerSecond, starDust,
        maxDistance, prestigeMultiplier, rocketsLaunched, lastLaunchDistance,
        buildings: BUILDINGS.map(b => ({ id: b.id, count: b.count })),
        buildingUpgrades: JSON.parse(JSON.stringify(buildingUpgrades)),
        parts: ROCKET_PARTS.map(p => ({ id: p.id, purchased: p.purchased })),
        constructed: new Set(constructedParts),
        galactic: JSON.parse(JSON.stringify(galacticUpgrades)),
        clickUps: [...activatedClickUpgrades],
        autoMultiplier, clickMultiplier
    };
}

function debugRestoreState(s) {
    score = s.score;
    partsSinceLaunch = s.partsSinceLaunch;
    partsPerSecond = s.partsPerSecond;
    starDust = s.starDust;
    maxDistance = s.maxDistance;
    prestigeMultiplier = s.prestigeMultiplier;
    rocketsLaunched = s.rocketsLaunched;
    lastLaunchDistance = s.lastLaunchDistance;
    s.buildings.forEach(sb => { const b = findBuildingById(sb.id); if (b) b.count = sb.count; });
    buildingUpgrades = JSON.parse(JSON.stringify(s.buildingUpgrades));
    s.parts.forEach(sp => { const p = ROCKET_PARTS.find(x => x.id === sp.id); if (p) p.purchased = sp.purchased; });
    constructedParts = new Set(s.constructed);
    galacticUpgrades = JSON.parse(JSON.stringify(s.galactic));
    activatedClickUpgrades = [...s.clickUps];
    autoMultiplier = s.autoMultiplier;
    clickMultiplier = s.clickMultiplier;
}

// Politique d'achat du bot: a chaque pas, depense le score au meilleur
// rendement (batiment le plus rentable, upgrade de batiment, piece de fusee).
function debugSimulateToTarget(targetDistanceKm, clickRatePerSec = 4, maxHours = 24) {
    const progress = calculatePlanetProgress(lastLaunchDistance);
    const next = progress.nextPlanet;
    const targetDist = targetDistanceKm || (next ? next.distanceRequired : null);
    if (!targetDist) return { error: 'Plus de planète à atteindre.' };
    // Cumul de parts requis: dist = LUNE * (cum / DISTANCE_MOON_PARTS)^EXP * boostDistance
    const boost = (1 + (prestigeMultiplier - 1) / 2) * getDistanceBonus();
    const cumRequired = DISTANCE_MOON_PARTS * Math.pow(targetDist / (boost * MOON_DISTANCE), 1 / DISTANCE_SCORE_EXP);
    if (partsSinceLaunch >= cumRequired) return { error: 'Objectif déjà atteint.' };

    const dt = 1; // pas de 1 s
    const maxSteps = maxHours * 3600;
    let cum = partsSinceLaunch;
    let scoreSpendable = score;
    let steps = 0;
    // copie des counts pour la simulation
    const counts = BUILDINGS.map(b => b.count);
    const ups = BUILDINGS.map(b => (buildingUpgrades[b.id] || []).length);
    let partsBought = ROCKET_PARTS.filter(p => p.purchased).length;
    const partCosts = ROCKET_PARTS.map(p => getRocketPartCost(p));
    const clickUpsN = activatedClickUpgrades.length;

    function prodPerSec() {
        let total = 0;
        BUILDINGS.forEach((b, i) => {
            total += b.gain * counts[i] * Math.pow(2, ups[i]);
        });
        return total * autoMultiplier * getCollectionMultiplier() * getProductionBonus()
             * getPrestigeProductionBoost() * getPlanetProductionBonus();
    }

    for (steps = 0; steps < maxSteps && cum < cumRequired; steps++) {
        const pps = prodPerSec();
        // clics actifs (4/s) tant qu'ils sont significatifs (< 50% de la prod)
        const totB = counts.reduce((a, b) => a + b, 0);
        const fm = clickUpsN >= 2 ? (1 + (clickUpsN - 1) * 0.5) : 0;
        const clickVal = Math.pow(2, clickUpsN) + fm * 0.1 * totB + clickUpsN * 0.01 * pps;
        const inc = pps * dt + (clickRatePerSec * clickVal > pps * 0.1 ? clickRatePerSec * clickVal * dt : 0);
        cum += inc;
        scoreSpendable += inc;
        // achats: on depense au mieux, ordonne par payback
        // (batiment / upgrade de batiment / piece de fusee)
        let bought = true;
        while (bought) {
            bought = false;
            let bestPayback = Infinity, action = null;
            BUILDINGS.forEach((b, i) => {
                const c = Math.floor(b.baseCost * Math.pow(BUILDING_PRICE_GROWTH_RATE, counts[i]));
                const unitGain = b.gain * Math.pow(2, ups[i]) * getProductionBonus() * getPrestigeProductionBoost() * getPlanetProductionBonus() * getCollectionMultiplier();
                if (scoreSpendable >= c && unitGain > 0) {
                    const pb = c / unitGain;
                    if (pb < bestPayback) { bestPayback = pb; action = { type: 'b', i, c }; }
                }
                // upgrade de batiment si palier atteint
                if (counts[i] >= BUILDING_UPGRADE_THRESHOLDS[ups[i]]) {
                    const uc = getBuildingUpgradeFixedCost(b.id, BUILDING_UPGRADE_THRESHOLDS[ups[i]]);
                    const marginalGain = unitGain * counts[i]; // x2 la prod du batiment
                    if (scoreSpendable >= uc && counts[i] > 0) {
                        const pb = uc / marginalGain;
                        if (pb < bestPayback) { bestPayback = pb; action = { type: 'u', i, c: uc }; }
                    }
                }
            });
            if (action) {
                scoreSpendable -= action.c;
                if (action.type === 'b') counts[action.i]++;
                else ups[action.i]++;
                bought = true;
            }
        }
        // pieces de fusee des que le score le permet (objectif du run)
        while (partsBought < 10 && scoreSpendable >= partCosts[partsBought]) {
            scoreSpendable -= partCosts[partsBought];
            partsBought++;
        }
    }
    if (cum >= cumRequired) {
        return { seconds: steps, planet: next ? next.name : '?', targetDistance: targetDist };
    }
    return { error: 'Non atteint en ' + maxHours + ' h de jeu actif.' };
}

function debugEstimateTime() {
    const snap = debugSnapshotState();
    let result;
    try {
        result = debugSimulateToTarget();
    } finally {
        debugRestoreState(snap);
        debugRenderAll();
    }
    if (result.error) return result;
    return { ...result, formatted: formatDurationHMS(result.seconds * 1000) };
}

const Debug = {
    addScore(n) {
        score += n;
        partsSinceLaunch += n;
        updateDisplay();
    },
    addStardust(n) {
        starDust += n;
        totalStardustEarned += n;
        updateStardustDisplay();
        renderGalacticShop();
    },
    buyAllParts() {
        ROCKET_PARTS.forEach(p => {
            if (!p.purchased) {
                p.purchased = true;
                constructedParts = new Set(ROCKET_PARTS.map(x => x.id));
                updateConstructionScene();
            }
        });
        renderRocketPartsShop();
    },
    launch() {
        if (!checkRocketReady()) { this.buyAllParts(); }
        launchRocket();
    },
    fast(seconds) {
        debugSimulateTime(seconds);
        debugRenderAll();
    },
    giveBuildings(buildingId, n) {
        const b = findBuildingById(buildingId);
        if (!b) { console.warn('Bâtiment inconnu:', buildingId); return; }
        b.count += n;
        unlockedBuildings.add(b.id);
        debugRenderAll();
    },
    reset() {
        localStorage.removeItem('starcruiserClickerSave');
        location.search = '?debug=1';
    },
    estimate() {
        const r = debugEstimateTime();
        if (r.error) { console.warn('[DEBUG] ' + r.error); showToast('[DEBUG] ' + r.error); return r; }
        console.log('[DEBUG] Prochaine planète: ' + r.planet + ' dans ~' + r.formatted + ' de jeu actif');
        showToast('[DEBUG] ' + r.planet + ' dans ~' + r.formatted);
        return r;
    },
    breakdown() {
        const factors = {
            temporaire: autoMultiplier,
            cartes: getCollectionMultiplier(),
            atelier_production: getProductionBonus(),
            prestige: getPrestigeProductionBoost(),
            planetes: getPlanetProductionBonus()
        };
        let total = 1;
        Object.entries(factors).forEach(([k, v]) => {
            total *= v;
            console.log('[DEBUG] ' + k.padEnd(18) + ' x' + v.toFixed(2));
        });
        console.log('[DEBUG] TOTAL              x' + total.toFixed(2));
        return { ...factors, total };
    },
    setPlanet(index) {
        const p = PLANETS[index];
        if (!p) { console.warn('Index invalide. 0=Terre ... ' + (PLANETS.length - 1) + '=' + PLANETS[PLANETS.length - 1].name); return; }
        const dust = calculateStardustGain(p.distanceRequired);
        if (dust > 0) { starDust += dust; totalStardustEarned += dust; }
        maxDistance = Math.max(maxDistance, p.distanceRequired);
        prestigeMultiplier = 1 + Math.log(1 + maxDistance / MOON_DISTANCE) / 2;
        unlockedPlanets = new Set(PLANETS.slice(0, index + 1).map(x => x.id));
        updateSpaceProgress();
        updateStardustDisplay();
        renderGalacticShop();
        console.log('Positionné sur ' + p.name + ' (+' + dust + ' PE, prestige x' + prestigeMultiplier.toFixed(2) + ')');
    }
};

window.Debug = Debug;

function initDebugMode() {
    if (!DEBUG_MODE) return;
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = 'position:fixed;bottom:10px;left:10px;z-index:99999;background:rgba(0,0,0,.85);color:#0f0;font-family:monospace;font-size:12px;padding:10px;border-radius:8px;display:flex;flex-direction:column;gap:6px;max-height:90vh;overflow:auto;';
    const btn = (label, fn) => {
        const b = document.createElement('button');
        b.textContent = label;
        b.onclick = fn;
        b.style.cssText = 'background:#111;color:#0f0;border:1px solid #0f0;padding:4px 8px;border-radius:4px;cursor:pointer;font-family:monospace;font-size:11px;';
        return b;
    };
    panel.appendChild(btn('+100k Parts', () => Debug.addScore(1e5)));
    panel.appendChild(btn('+1M Parts', () => Debug.addScore(1e6)));
    panel.appendChild(btn('+100 PE', () => Debug.addStardust(100)));
    panel.appendChild(btn('Toutes pièces fusée', () => Debug.buyAllParts()));
    panel.appendChild(btn('Lancer la fusée', () => Debug.launch()));
    panel.appendChild(btn('+1 min de jeu', () => Debug.fast(60)));
    panel.appendChild(btn('+10 min de jeu', () => Debug.fast(600)));
    panel.appendChild(btn('+1 h de jeu', () => Debug.fast(3600)));
    panel.appendChild(btn('⏱ Temps réel estimé', () => Debug.estimate()));
    panel.appendChild(btn('Reset complet', () => Debug.reset()));
    const close = document.createElement('button');
    close.textContent = '×';
    close.onclick = () => panel.remove();
    close.style.cssText = 'background:#111;color:#f00;border:1px solid #f00;padding:2px 6px;border-radius:4px;cursor:pointer;position:absolute;top:4px;right:4px;';
    panel.appendChild(close);
    document.body.appendChild(panel);
    console.log('%c[DEBUG] mode test actif. Console: Debug.addScore(n), Debug.addStardust(n), Debug.buyAllParts(), Debug.launch(), Debug.fast(sec), Debug.giveBuildings(id, n), Debug.setPlanet(i), Debug.reset()', 'color:#0f0');
}


// ============================================
// ROCKET PARTS SHOP (achats uniques)
// ============================================

function getRocketPartCost(part) {
    const discount = Math.min(0.5, getRocketPartDiscount());
    return Math.floor(part.cost * Math.pow(ROCKET_PART_COST_GROWTH, rocketsLaunched) * (1 - discount));
}

function buyRocketPart(partId) {
    const part = ROCKET_PARTS.find(p => p.id === partId);
    if (!part || part.purchased) return;
    const cost = getRocketPartCost(part);
    if (score < cost) {
        showToast("\u274c " + t("Pas assez de Parts pour") + " " + t(part.name));
        return;
    }
    score -= cost;
    part.purchased = true;
    updateDisplay();
    updateConstructionScene();
    renderRocketPartsShop();
    checkBuildingUnlocks();
    saveGame();
    showToast("\u2705 " + t(part.name) + " " + t("construit !"));
    checkTrophies();
}

function renderRocketPartsShop() {
    const container = document.getElementById('rocket-parts-shop');
    if (!container) return;
    const nextPart = ROCKET_PARTS.find(p => !p.purchased);
    if (!nextPart) {
        if (container.dataset.partId !== '__complete__') {
            container.dataset.partId = '__complete__';
            container.innerHTML =
                '<div class="rocket-part-frame complete">' +
                    '<div class="rocket-part-frame-title">' + t('Pi\u00e8ces compl\u00e8tes') + '</div>' +
                    '<div class="rocket-part-frame-complete">\u2713 ' + t('Fus\u00e9e pr\u00eate \u00e0 lancer') + '</div>' +
                '</div>';
        }
        return;
    }
    const cost = getRocketPartCost(nextPart);
    const isAffordable = score >= cost;
    // Ne recrerer le DOM que si la piece affichee change. Sinon, mettre a jour
    // uniquement le cout et l'etat du bouton pour eviter le clignotement du hover.
    if (container.dataset.partId !== nextPart.id) {
        container.dataset.partId = nextPart.id;
        const imageUrl = nextPart.imgPath || '';
        const imageHtml = imageUrl
            ? '<img src="' + imageUrl + '" class="rocket-part-icon" alt="' + nextPart.name + '">'
            : '<span class="rocket-part-icon-placeholder"></span>';
        const purchasedCount = ROCKET_PARTS.filter(p => p.purchased).length;
        container.innerHTML =
            '<div class="rocket-part-frame' + (!isAffordable ? ' locked' : '') + '">' +
                '<div class="rocket-part-frame-title">' + t('Pi\u00e8ce') + ' ' + (purchasedCount + 1) + ' / ' + ROCKET_PARTS.length + '</div>' +
                '<div class="rocket-part-left">' + imageHtml + '</div>' +
                '<div class="rocket-part-info">' +
                    '<span class="rocket-part-name">' + t(nextPart.name) + '</span>' +
                    '<span class="rocket-part-cost">' + formatNumber(cost) + ' ' + t('Parts') + '</span>' +
                '</div>' +
                '<button class="rocket-part-btn" onclick="buyRocketPart(\'' + nextPart.id + '\')"' + (!isAffordable ? ' disabled' : '') + '>' + t('Construire') + '</button>' +
            '</div>';
    } else {
        const costEl = container.querySelector('.rocket-part-cost');
        if (costEl) costEl.textContent = formatNumber(cost) + ' ' + t('Parts');
        const btn = container.querySelector('.rocket-part-btn');
        if (btn) {
            btn.disabled = !isAffordable;
        }
        const frame = container.querySelector('.rocket-part-frame');
        if (frame) {
            if (isAffordable) frame.classList.remove('locked');
            else frame.classList.add('locked');
        }
    }
}

// ============================================
// ROCKET CONSTRUCTION SCENE
// ============================================

// Track constructed parts
let constructedParts = new Set();

function updateConstructionScene() {
    const container = document.getElementById('rocket-parts-container');
    if (!container) return;

    // Ne pas vider le conteneur, on va juste ajouter les nouvelles pièces
    // container.innerHTML = '';

    ROCKET_PARTS.forEach(part => {
        // Les pièces de fusée s'affichent une fois achetées
        const shouldDisplay = part.purchased;
        
        // Vérifier si la pièce existe déjà dans le DOM
        const existingPiece = container.querySelector(`.rocket-piece.${part.id}`);
        
        if (shouldDisplay && !existingPiece) {
            // La pièce n'existe pas encore, la créer
            const piece = document.createElement('div');
            piece.className = `rocket-piece ${part.id}`;
            piece.title = part.name;
            
            // Positionnement en pixels pour empilement parfait
            const x = part.x || 50;
            const y = part.y || 0;
            const width = part.width || 150;
            const height = part.height || 150;
            
            // Appliquer les styles de position
            piece.style.left = x + '%';
            piece.style.top = y + 'px';
            piece.style.width = width + 'px';
            piece.style.height = height + 'px';
            piece.style.zIndex = '3';
            applySceneScale();
            
            // Use image if available, fallback to emoji
            if (part.imgPath) {
                const img = document.createElement('img');
                img.src = part.imgPath;
                img.alt = part.name;
                img.loading = 'lazy';
                piece.appendChild(img);
            } else {
                piece.textContent = part.image;
            }
            

            // Animation de chute depuis le haut
            piece.style.opacity = '0';
            piece.style.transform = 'translate(-50%, -200px) scale(0.8)';
            
            requestAnimationFrame(() => {
                piece.style.transition = 'all 0.6s ease-out';
                piece.style.opacity = '1';
                piece.style.transform = 'translate(-50%, 0) scale(1)';
            });
            
            // Marquer comme construite
            if (!constructedParts.has(part.id)) {
                constructedParts.add(part.id);
                piece.classList.add('new', 'unlocked');
                setTimeout(() => {
                    piece.classList.remove('new');
                }, 600);
            } else {
                piece.classList.add('unlocked');
            }
            
            container.appendChild(piece);
        }
    });
    
    // Check if rocket is complete
    checkRocketComplete();
}

function checkRocketComplete() {
    const allConstructed = ROCKET_PARTS.every(p => constructedParts.has(p.id));
    
    const scene = document.getElementById('construction-scene');
    if (allConstructed && scene) {
        scene.classList.add('rocket-complete');
        showToast("🚀 " + t("Fusée complète ! Prête pour le décollage !"));
    } else if (scene) {
        scene.classList.remove('rocket-complete');
    }
}

// Call in buyBuilding
// (À intégrer dans la fonction existante)

// Call in gameLoop
// (À intégrer dans la fonction existante)

// Initialize on start
// (À intégrer dans initGame)

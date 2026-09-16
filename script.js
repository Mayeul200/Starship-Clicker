// ============================================
// STARSHIP CLICKER - MAIN SCRIPT
// Version 2.1.0
// ============================================

// ============================================
// GLOBAL TOOLTIP
// ============================================
const tooltip = document.createElement('div');
tooltip.className = 'upgrade-tooltip';
document.body.appendChild(tooltip);

function showTooltip(text, x, y) {
    tooltip.textContent = text;
    tooltip.style.top = y + 'px';
    tooltip.style.left = x + 'px';
    tooltip.style.transform = 'translate(-50%, -120%)';
    tooltip.classList.add('visible');
}

function hideTooltip() {
    tooltip.classList.remove('visible');
}

// ============================================
// GLOBAL CONSTANTS
// ============================================
// Croissance du prix d'un même bâtiment à l'achat : ×1.15 par bâtiment possédé
// (identique à Cookie Clicker — le prix double tous les ~5 achats).
const BUILDING_PRICE_GROWTH_RATE = 1.15;
const GAME_LOOP_FPS = 10;
const GAME_LOOP_INTERVAL_MS = 100;
const BONUS_SPAWN_INTERVAL_MS = 5000; // TEST: comètes toutes les 5s (normalement 20000)
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
const PRODUCTION_BUILDINGS = [
    { id: "workshop",      name: "Atelier",                  description: "Fabrique des pièces: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 15,            gain: 0.1,      count: 0, image: "🛠️", imgPath: "images/rocket/workshop.png",  unlockCondition: () => true,            totalGenerated: 0 },
    { id: "factory",       name: "Usine",                    description: "Production de masse: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 100,           gain: 1,         count: 0, image: "🏭",       unlockCondition: () => score >= 50,       totalGenerated: 0 },
    { id: "mine",          name: "Mine stellaire",           description: "Extraction de minerai: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 1100,          gain: 8,        count: 0, image: "⛏️",       unlockCondition: () => score >= 500,      totalGenerated: 0 },
    { id: "solar",         name: "Centrale solaire",         description: "Énergie: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 12000,         gain: 47,       count: 0, image: "☀️",       unlockCondition: () => score >= 6000,     totalGenerated: 0 },
    { id: "lab",           name: "Laboratoire",              description: "Recherche: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 130000,        gain: 260,      count: 0, image: "🧪",       unlockCondition: () => score >= 65000,    totalGenerated: 0 },
    { id: "foundry",       name: "Fonderie orbitale",        description: "Raffinage: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 1400000,       gain: 1400,     count: 0, image: "🔥",       unlockCondition: () => score >= 700000,   totalGenerated: 0 },
    { id: "station",       name: "Station spatiale",         description: "Logistique: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 20000000,      gain: 7800,    count: 0, image: "🚀",       unlockCondition: () => score >= 10000000, totalGenerated: 0 },
    { id: "nanoforge",     name: "Nanoforge",                description: "Fabrication avancée: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 330000000,     gain: 44000,   count: 0, image: "⚙️",       unlockCondition: () => score >= 150000000, totalGenerated: 0 },
    { id: "synth",         name: "Synthétiseur de matière",  description: "Matière exotique: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 5100000000,    gain: 260000,  count: 0, image: "✨",       unlockCondition: () => score >= 2500000000, totalGenerated: 0 },
    { id: "antimatter",   name: "Collecteur d'antimatière",  description: "Ressource ultime: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 75000000000,   gain: 1600000, count: 0, image: "🌀",       unlockCondition: () => score >= 35000000000, totalGenerated: 0 },
    { id: "voidrig",       name: "Foreuse du vide",           description: "Forage du vide: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 1e12,          gain: 10000000.0,      count: 0, image: "⛏️",       unlockCondition: () => score >= 5e11,       totalGenerated: 0 },
    { id: "quasar",        name: "Moteur à quasar",           description: "Énergie de quasar: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 1.4e13,        gain: 65000000.0,    count: 0, image: "💫",       unlockCondition: () => score >= 7.5e12,    totalGenerated: 0 },
    { id: "nebula",        name: "Raffinerie de nébuleuse",   description: "Raffinage de nébuleuse: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 1.7e14,          gain: 430000000.0,      count: 0, image: "🌌",       unlockCondition: () => score >= 1e14,      totalGenerated: 0 },
    { id: "pulsar",        name: "Moulure à pulsar",          description: "Moulure à pulsar: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 2.1e15,          gain: 2900000000.0,      count: 0, image: "⭐",       unlockCondition: () => score >= 1.5e15,    totalGenerated: 0 },
    { id: "blackhole",     name: "Trous noir industriel",     description: "Trous noir industriel: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 2.6e16,          gain: 21000000000.0,      count: 0, image: "🕳️",       unlockCondition: () => score >= 2.5e16,    totalGenerated: 0 },
    { id: "darkmatter",    name: "Extracteur de matière sombre", description: "Matière sombre: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 3.1e17,          gain: 150000000000.0,      count: 0, image: "🌑",       unlockCondition: () => score >= 4e17,      totalGenerated: 0 },
    { id: "wormhole",      name: "Usine à trou de ver",       description: "Trou de ver: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 7.1e18,        gain: 1.1e12,    count: 0, image: "🌀",       unlockCondition: () => score >= 6e18,      totalGenerated: 0 },
    { id: "supernova",     name: "Réacteur à supernova",      description: "Supernova: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 1.2e20,          gain: 8.3e12,      count: 0, image: "🌟",       unlockCondition: () => score >= 1e20,      totalGenerated: 0 },
    { id: "bigbang",       name: "Forge cosmique",           description: "Forge cosmique: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 1.9e21,          gain: 6.4e13,      count: 0, image: "💥",       unlockCondition: () => score >= 1.5e21,    totalGenerated: 0 },
    { id: "singularity",   name: "Singularité productive",    description: "Singularité: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", baseCost: 5.4e23,          gain: 5.1e14,      count: 0, image: "🔮",       unlockCondition: () => score >= 2.5e22,    totalGenerated: 0 }
];

// Bâtiments de production = liste utilisée par la boucle clicker (achat en masse, gain Parts/s)
const BUILDINGS = PRODUCTION_BUILDINGS;

// ============================================
// PIÈCES DE FUSÉE
// Achats uniques par run (payés en Parts). Compléter les 10 = lancement.
// ============================================
const ROCKET_PARTS = [
    { id: "nozzles",       name: "Tuyères",        description: "Propulsion: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", cost: 50,           image: "🎯",       imgPath: "images/rocket/nozzles.PNG",       x: 50,    y: 646, width: 40,  height: 20,  order: 2,  purchased: false },
    { id: "engines",       name: "Moteurs",        description: "Moteurs principaux: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", cost: 150,          image: "🔥",       imgPath: "images/rocket/engines.png",       x: 50,    y: 595, width: 40,  height: 51,  order: 3,  purchased: false },
    { id: "fuel-tank",     name: "Réservoir",     description: "Carburant: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", cost: 450,          image: "⛽",       imgPath: "images/rocket/fuel-tank.png",     x: 50,    y: 537, width: 40,  height: 58,  order: 4,  purchased: false },
    { id: "rocket-body",   name: "Corps",          description: "Structure: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", cost: 1300,         image: "🏭",       imgPath: "images/rocket/body.png",          x: 50,    y: 337, width: 40,  height: 200, order: 5,  purchased: false },
    { id: "boosters-left", name: "Boosters Gauche", description: "Propulsion supplémentaire: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", cost: 3800,         image: "🚀",       imgPath: "images/rocket/boosters-left.png", x: 45.8,  y: 373, width: 50,  height: 300, order: 6,  purchased: false },
    { id: "boosters-right",name: "Boosters Droit",  description: "Propulsion supplémentaire: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", cost: 11000,        image: "🚀",       imgPath: "images/rocket/boosters-right.png",x: 54.2,  y: 373, width: 50,  height: 300, order: 6,  purchased: false },
    { id: "cockpit",       name: "Cockpit",        description: "Poste de pilotage: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", cost: 32000,        image: "👨‍🚀", imgPath: "images/rocket/cockpit.png",        x: 50,    y: 292, width: 45,  height: 45,  order: 7,  purchased: false },
    { id: "shield",        name: "Bouclier",       description: "Protection: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", cost: 93000,        image: "🛡️",       imgPath: "images/rocket/shield.png",        x: 50,    y: 233, width: 45,  height: 59,  order: 8,  purchased: false },
    { id: "launch-pad",    name: "Pas de tir",     description: "Lancement: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", cost: 270000,       image: "🚀",       imgPath: "images/rocket/launch-pad.png",    x: 60.2,  y: 205, width: 190, height: 481, order: 9,  purchased: false },
    { id: "astronaut",     name: "Astronaute",    description: "Pilote: +{gain} Parts/s\n% de la production: {percent}%\nTotal généré: {total} Parts", cost: 638000,       image: "👩‍🚀", imgPath: "images/rocket/astronaut.png",     x: 40,    y: 635, width: 25,  height: 60,  order: 10, purchased: false }
];




// Ameliorations de clic inspirees de Cookie Clicker :
// - Chacune double la valeur de base du clic (x2, comme Reinforced finger / Carpal tunnel).
// - A partir de la 2e, debloque un bonus par bâtiment possede ( Thousand Fingers).
// - Les couts suivent l'echelle ~x10 de Cookie Clicker.
const CLICK_UPGRADES = [
    { threshold: 50,     name: "Doigt renforcé",        cost: 100 },
    { threshold: 200,    name: "Précision laser",       cost: 500 },
    { threshold: 500,    name: "Lancement puissant",   cost: 10000 },
    { threshold: 1000,   name: "Ingénieur expert",     cost: 50000 },
    { threshold: 2500,   name: "Scientifique spatial",  cost: 1000000 },
    { threshold: 5000,   name: "Pionnier galactique",  cost: 5000000 },
    { threshold: 10000,  name: "Click galactique",     cost: 100000000 },
    { threshold: 25000, name: "Maître cosmique",      cost: 500000000 },
    { threshold: 50000,  name: "Puissance interstellaire", cost: 10000000000 },
    { threshold: 100000, name: "Main de l'univers",   cost: 50000000000 }
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
    { id: "meteor", symbol: "🌠", name: "Meteor Shower", effect: "instant", type: "meteor", colorClass: "meteor" },
    { id: "flare", symbol: "☀️", name: "Solar Flare", effect: "multiplier", type: "flare", multiplier: 5, duration: 15000, colorClass: "flare" }
];

const SAVE_VERSION = "2.2.0";

// ============================================
// TROPH\u0009ES
// ============================================
const TROPHIES = [
    // Parts per second milestones
    { id: "pps-1", name: "First Parts", description: "Reach 1 Parts per second", icon: "🚀", threshold: 1, type: "pps", unlocked: false },
    { id: "pps-10", name: "Liftoff", description: "Reach 10 Parts per second", icon: "🚀", threshold: 10, type: "pps", unlocked: false },
    { id: "pps-100", name: "Orbit Achieved", description: "Reach 100 Parts per second", icon: "🛰️", threshold: 100, type: "pps", unlocked: false },
    { id: "pps-1000", name: "Space Speed", description: "Reach 1,000 Parts per second", icon: "💨", threshold: 1000, type: "pps", unlocked: false },
    { id: "pps-10000", name: "Galactic Speed", description: "Reach 10,000 Parts per second", icon: "🌌", threshold: 10000, type: "pps", unlocked: false },
    { id: "pps-100000", name: "Warp Speed", description: "Reach 100,000 Parts per second", icon: "⚡", threshold: 100000, type: "pps", unlocked: false },
    { id: "pps-1000000", name: "Light Speed", description: "Reach 1,000,000 Parts per second", icon: "💫", threshold: 1000000, type: "pps", unlocked: false },
    
    // Building upgrades
    { id: "first-upgrade", name: "First Upgrade", description: "Buy your first building upgrade", icon: "🪚", threshold: 1, type: "building-upgrade", unlocked: false },
    { id: "five-upgrades", name: "Upgrade Master", description: "Have 5 building upgrades", icon: "👷‍♂️", threshold: 5, type: "building-upgrade", unlocked: false },
    { id: "ten-upgrades", name: "Engineering Genius", description: "Have 10 building upgrades", icon: "👨‍🔬", threshold: 10, type: "building-upgrade", unlocked: false },
    { id: "twenty-upgrades", name: "Upgrade Legend", description: "Have 20 building upgrades", icon: "🏆", threshold: 20, type: "building-upgrade", unlocked: false },
    
    // Click upgrades
    { id: "first-click-upgrade", name: "First Launch", description: "Buy your first click upgrade", icon: "🚀", threshold: 1, type: "click-upgrade", unlocked: false },
    { id: "all-click-upgrades", name: "Launch Master", description: "Unlock all click upgrades", icon: "👨‍🚀", threshold: CLICK_UPGRADES.length, type: "click-upgrade", unlocked: false },
    
    // Buildings
    { id: "first-building", name: "First Component", description: "Buy your first building", icon: "⚙️", threshold: 1, type: "building", unlocked: false },
    { id: "ten-buildings", name: "Space Builder", description: "Own 10 buildings in total", icon: "🏗️", threshold: 10, type: "building", unlocked: false },
    { id: "hundred-buildings", name: "Space Architect", description: "Own 100 buildings in total", icon: "🏭", threshold: 100, type: "building", unlocked: false },
    { id: "thousand-buildings", name: "Galactic Builder", description: "Own 1,000 buildings in total", icon: "🌌", threshold: 1000, type: "building", unlocked: false },
    
    // Total score
    { id: "score-1000", name: "Small Start", description: "Reach 1,000 Parts", icon: "🪐", threshold: 1000, type: "score", unlocked: false },
    { id: "score-1000000", name: "Millionaire", description: "Reach 1,000,000 Parts", icon: "💰", threshold: 1000000, type: "score", unlocked: false },
    { id: "score-1000000000", name: "Billionaire", description: "Reach 1,000,000,000 Parts", icon: "💎", threshold: 1000000000, type: "score", unlocked: false },
    
    // Bonus
    { id: "first-bonus", name: "First Bonus", description: "Click your first random bonus", icon: "🌠", threshold: 1, type: "bonus", unlocked: false },
    { id: "ten-bonuses", name: "Bonus Hunter", description: "Click 10 random bonuses", icon: "🎯", threshold: 10, type: "bonus", unlocked: false },
    
    // Special
    { id: "all-buildings", name: "Space Collector", description: "Unlock all building types", icon: "🌌", threshold: BUILDINGS.length, type: "building-types", unlocked: false }
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
let buyMultiplier = 1;
let clickedBonusesCount = 0;
let unlockedTrophies = new Set();

// ============================================
// ROCKET LAUNCH SYSTEM (Prestige)
// ============================================
let maxDistance = 0;
let prestigeMultiplier = 1;
let rocketsLaunched = 0;
let lastLaunchDistance = 0;
let starDust = 0; // Poussière d'Étoiles : monnaie de prestige persistante


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

// ============================================
// SPACE MAP SYSTEM (Planets & Bonuses)
// ============================================
const PLANETS = [
    { id: 'earth', name: 'Earth', emoji: '\uD83C\uDF0D', distanceRequired: 0, bonusPercent: 0, color: '#10b981', imgPath: 'images/planets/earth.png' },
    { id: 'moon', name: 'Moon', emoji: '\uD83D\uDD11', distanceRequired: 384400, bonusPercent: 10, color: '#a9a9a9', imgPath: 'images/planets/moon.png' },
    { id: 'mars', name: 'Mars', emoji: '\u2642', distanceRequired: 4120000, bonusPercent: 15, color: '#ef4444', imgPath: 'images/planets/mars.png' },
    { id: 'neptune', name: 'Neptune', emoji: '\u2645', distanceRequired: 47800000, bonusPercent: 20, color: '#06b6d4', imgPath: 'images/planets/neptune.png' },
    { id: 'pluto', name: 'Pluto', emoji: '\u2646', distanceRequired: 563000000, bonusPercent: 25, color: '#8b5cf6', imgPath: 'images/planets/pluto.png' },
    { id: 'proxima-centauri', name: 'Proxima Centauri', emoji: '\u2609', distanceRequired: 6100000000, bonusPercent: 30, color: '#10b981', imgPath: 'images/planets/proxima-centauri.png' },
    { id: 'sirius', name: 'Sirius', emoji: '\u2609', distanceRequired: 72500000000, bonusPercent: 35, color: '#3b82f6', imgPath: 'images/planets/sirius.png' },
    { id: 'oort-cloud', name: 'Oort Cloud', emoji: '\u2728', distanceRequired: 891000000000, bonusPercent: 40, color: '#f59e0b', imgPath: 'images/planets/oort-cloud.png' },
    { id: 'milky-way-center', name: 'Milky Way Center', emoji: '\uD83C\uDF0C', distanceRequired: 12800000000000, bonusPercent: 50, color: '#fbbf24', imgPath: 'images/planets/milky-way-center.png' },
    { id: 'andromeda', name: 'Andromeda', emoji: '\uD83C\uDF0C', distanceRequired: 156000000000000, bonusPercent: 60, color: '#ec4899', imgPath: 'images/planets/andromeda.png' },
    { id: 'virgo-cluster', name: 'Virgo Cluster', emoji: '\u2728', distanceRequired: 2010000000000000, bonusPercent: 75, color: '#a855f7', imgPath: 'images/planets/virgo-cluster.png' }
];

let unlockedPlanets = new Set(['earth']);
let planetBonuses = {}; // {planetId: bonusMultiplier}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
    return p;
}
function getPlanetProductionBonus() {
    return 1 + getTotalPlanetBonus();
}

function calculateBuildingGain(building) {
    const upgradeMultiplier = getBuildingUpgradeMultiplier(building.id);
    return building.gain * building.count * autoMultiplier * upgradeMultiplier * getCollectionMultiplier() * getProductionBonus() * getPrestigeProductionBoost() * getPlanetProductionBonus();
}

function calculateUnitBuildingGain(building) {
    const upgradeMultiplier = getBuildingUpgradeMultiplier(building.id);
    return building.gain * autoMultiplier * upgradeMultiplier * getCollectionMultiplier() * getProductionBonus() * getPrestigeProductionBoost() * getPlanetProductionBonus();
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
    return building.description
        .replace('{gain}', formatNumber(unitGain))
        .replace('{percent}', percent)
        .replace('{total}', formatNumber(totalGeneratedByBuilding[building.id] || 0));
}

// Coût d'un upgrade de bâtiment au palier `threshold` : baseCost × 10^(index du palier)
// (style Cookie Clicker : chaque palier coûte ~10× le précédent, proportionnel au bâtiment).
// Déterministe : ne dépend d'aucun état de jeu, donc pas de cache figé.
const BUILDING_UPGRADE_COST_GROWTH = 10;

function getBuildingUpgradeFixedCost(buildingId, threshold) {
    const building = findBuildingById(buildingId);
    if (!building) return 0;
    const tierIndex = BUILDING_UPGRADE_THRESHOLDS.indexOf(threshold);
    const tier = tierIndex === -1 ? 0 : tierIndex;
    return Math.floor(building.baseCost * Math.pow(BUILDING_UPGRADE_COST_GROWTH, tier));
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

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), TOAST_DURATION_MS);
}

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
        galacticUpgrades: {...galacticUpgrades},
        rocketsLaunched: rocketsLaunched,
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

    localStorage.setItem('starshipClickerSave', JSON.stringify(saveData));
    lastSaveTime = Date.now();
}

function loadGame() {
    const saveData = localStorage.getItem('starshipClickerSave');
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
        galacticUpgrades = parsed.galacticUpgrades || {};
        // V2.2: les upgrades galactiques sont uniques (maxLevel=1).
        // Cap les niveaux anciens pour eviter des bonus excesifs.
        Object.keys(galacticUpgrades).forEach(uid => {
            const u = GALACTIC_UPGRADES.find(x => x.id === uid);
            if (u && galacticUpgrades[uid] > u.maxLevel) {
                galacticUpgrades[uid] = u.maxLevel;
            }
        });
        rocketsLaunched = parsed.rocketsLaunched || 0;
        
        activatedClickUpgrades = parsed.activatedClickUpgrades || [];
        unlockedBuildings = new Set(parsed.unlockedBuildings || []);
        gameStartTime = parsed.gameStartTime || 0;

        if (parsed.cardCollection) {
            cardCollection = {...parsed.cardCollection};
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

    } catch (e) {
        console.error("Erreur de chargement :", e);
        localStorage.removeItem('starshipClickerSave');
        showToast("\u26a0\ufe0f Sauvegarde corrompue. Nouvelle partie.");
    }
}

function exportSave() {
    const saveData = localStorage.getItem('starshipClickerSave');
    if (saveData) {
        navigator.clipboard.writeText(saveData)
            .then(() => showToast("\u2705 Sauvegarde copiée !"))
            .catch(() => showToast("\u274c Échec de la copie."));
    } else {
        showToast("\u274c Aucune sauvegarde.");
    }
}

function importSave() {
    const importText = document.getElementById('import-textarea').value.trim();
    if (!importText) { showToast("\u274c Rien à importer."); return; }
    try {
        const testParse = JSON.parse(importText);
        if (testParse.version && testParse.buildings && testParse.buildingUpgrades) {
            localStorage.setItem('starshipClickerSave', importText);
            showToast("\u2705 Importé ! Redémarrage...");
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast("\u274c Format invalide.");
        }
    } catch (e) {
        showToast("\u274c Format invalide.");
    }
}

function confirmDeleteSave() {
    if (confirm("\u26a0\ufe0f Delete la sauvegarde ? Tous vos progrès seront PERDUS !")) {
        deleteSave();
    }
}

function deleteSave() {
    localStorage.removeItem('starshipClickerSave');
    showToast("\ud83d\uddd1\ufe0f Supprimé !");
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
        showToast("Multiplicateur: Max");
    } else {
        document.getElementById(`multiplier-x${multiplier}`).classList.add('active');
        showToast(`Multiplicateur: x${multiplier}`);
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
        hideTooltip();
        updateAllBuildingButtons();
        renderUpgrades();
        checkBuildingUnlocks();
        const maxText = buyMultiplier === 'max' ? ' (Max)' : '';
        showToast(`\u2705 +${buildingsToBuy} ${building.name}${maxText}`);
        checkTrophies();
    } else {
        showToast("\u274c Pas assez de Parts");
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
        showToast("\u2705 Already activated!");
        return;
    }
    
    if (score < upgrade.cost) {
        showToast("\u274c Pas assez de Parts");
        return;
    }
    
    score -= upgrade.cost;
    activatedClickUpgrades.push(threshold);
    updateDisplay();
    saveGame();
    hideTooltip();
    renderUpgrades();
    updateAllBuildingButtons();
    showToast(`\u2705 ${upgrade.name} activated`);
}

function buyBuildingUpgrade(buildingId, threshold) {
    const building = findBuildingById(buildingId);
    if (!building || !isBuildingUpgradeAvailable(buildingId, threshold)) return;
    
    const cost = getBuildingUpgradeFixedCost(buildingId, threshold);
    
    if (score < cost) {
        showToast("\u274c Pas assez de Parts");
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
    showToast('+ ' + building.name + ' improved x2 (-' + formatNumber(cost) + ' G)');
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
        button.textContent = `${displayCost} Parts`;
    }
    if (productionSpan) productionSpan.textContent = `${formatNumber(totalGain)}/s`;
    if (ownershipDiv) ownershipDiv.textContent = `Owned: ${building.count}`;

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
                <span class="building-name">${building.name}</span>
            </div>
            <div class="building-ownership">
                Owned: ${building.count}
            </div>
        </div>
        <div class="building-center">
            ${imageHtml}
        </div>
        <div class="building-right">
            <button onclick="buyBuilding('${building.id}')" ${!isAffordable ? 'disabled' : ''}>
                ${formatNumber(currentCost)} Parts
            </button>
            <div class="building-production">${formatNumber(totalGain)}/s</div>
        </div>
    `;

    buildingElement.addEventListener('mouseenter', () => {
        buildingElement.setAttribute('data-tooltip', getBuildingTooltip(building));
    });

    container.appendChild(buildingElement);
}

// ============================================
// ROCKET LAUNCH SYSTEM
// ============================================

function checkRocketReady() {
    // Vérifier si toutes les pièces de fusée sont achetées
    return ROCKET_PARTS.every(part => part.purchased);
}

const PIECE_DISTANCE_MULT = 1.0;
const DISTANCE_SCORE_EXP = 1.05;
const MOON_DISTANCE = 384400;
// Facteur de calibration : les parts générées sont divisées avant l'exposant
// pour que la distance ne décolle pas trop vite en début de partie.
const DISTANCE_PART_DIVISOR = 10;
// Croissance du coût des pièces de fusée entre les lancements.
// Douce (×1.15) pour que la fusée se reconstruise vite après un reset,
// comme dans Cookie Clicker où l'ascension est toujours accessible.
const ROCKET_PART_COST_GROWTH = 1.15;

function calculateDistance() {
    const partsUnlocked = ROCKET_PARTS.filter(part => part.purchased).length;
    const totalParts = Math.max(partsSinceLaunch, 0);
    const partsMult = Math.pow(PIECE_DISTANCE_MULT, partsUnlocked);
    const scoreFactor = totalParts > 0 ? Math.pow(totalParts / DISTANCE_PART_DIVISOR, DISTANCE_SCORE_EXP) : 0;
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
        showToast("❌ Fusée pas encore prête ! Il manque des pièces.");
        return;
    }
    
    if (isLaunching) {
        showToast("⏳ Lancement en cours...");
        return;
    }
    
    isLaunching = true;
    
    // Calculer la distance
    const distance = calculateDistance();
    
    // Animation de lancement (à améliorer plus tard)
    const medal = document.getElementById('medal');
    medal.style.transform = 'scale(0.8)';
    medal.style.transition = 'transform 0.5s';
    
    setTimeout(() => {
        medal.style.transform = 'translateY(-200px) scale(1.5)';
        medal.style.opacity = '0';
        medal.style.transition = 'all 2s';
    }, 500);
    
    // Après l'animation, afficher la carte spatiale AVANT le reset
    setTimeout(() => {
        medal.style.transform = 'scale(1)';
        medal.style.opacity = '1';
        medal.style.transition = 'none';
        
        // Afficher la carte spatiale avec la progression
        lastLaunchDistance = distance;
        showSpaceMap(distance);
        updateSpaceProgress();
        updateConstructionScene();
        isLaunching = false;
        showToast(`🚀 Fusée lancée ! Distance atteinte: ${formatNumber(distance)} km`);
    }, 2500);
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
        const dustGained = Math.floor(Math.sqrt(safeDistance / MOON_DISTANCE) * getStardustGainBonus());
        stardustEl.textContent = '+' + formatNumber(dustGained) + '  (total: ' + formatNumber(starDust) + ')';
    }
    
    modal.classList.add('active');
}

function closeLaunchResults() {
    document.getElementById('launch-results-modal').classList.remove('active');
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
            unlockedPlanets.add(planet.id);
            planetBonuses[planet.id] = planet.bonusPercent / 100;
            newlyUnlocked.push(planet);
        }
    });
    
    return newlyUnlocked;
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
            progressText.innerHTML = `Tu as atteint <strong>${progress.currentPlanet.emoji} ${progress.currentPlanet.name}</strong> ! En route vers ${progress.nextPlanet.emoji} ${progress.nextPlanet.name} (${progress.progressPercent}%)`;
        } else {
            progressText.innerHTML = `F\u00e9licitations ! Tu as atteint <strong>${progress.currentPlanet.emoji} ${progress.currentPlanet.name}</strong>, la dernière planète !`;
        }
    } else {
        progressText.innerHTML = `En route vers <strong>${progress.nextPlanet.emoji} ${progress.nextPlanet.name}</strong> (${progress.progressPercent}%)`;
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
                <span class="planet-emoji">${planet.emoji}</span>
                <span class="planet-name">${planet.name}</span>
                <span class="planet-bonus">+${planet.bonusPercent}% Parts/s</span>
            `;
            planetElement.style.borderColor = planet.color;
            planetElement.style.color = planet.color;
            newUnlocksContainer.appendChild(planetElement);
        });
    } else {
        newUnlocksContainer.innerHTML = '<p class="no-new-planets">Aucune nouvelle planète débloquée</p>';
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
                <span class="planet-distance">${formatNumber(planet.distanceRequired)} km</span>
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
    prestigeMultiplier = 1 + Math.log(1 + (isNaN(maxDistance) ? 0 : maxDistance) / MOON_DISTANCE) / 2;

    // Gain de Poussière d'Étoiles (monnaie de prestige persistante)
    const dustGained = Math.floor(Math.sqrt((isNaN(lastLaunchDistance) ? 0 : lastLaunchDistance) / MOON_DISTANCE) * getStardustGainBonus());
    if (dustGained > 0) {
        starDust += dustGained;
    }
    
    // Reset du score, des bâtiments et des pièces de fusée (garde les bonus/prestige)
    score = 0;
    BUILDINGS.forEach(b => b.count = 0);
    ROCKET_PARTS.forEach(p => p.purchased = false);
    constructedParts = new Set();
    const scene = document.getElementById('rocket-parts-container');
    if (scene) scene.innerHTML = '';
    unlockedBuildings = new Set();
    applyStartupBonus();
    totalPartsFromClicks = 0;
    activatedClickUpgrades = [];
    buildingUpgrades = {};
    buildingUpgradeCosts = {};
    totalGeneratedByBuilding = {};
    partsSinceLaunch = 0;
    
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
        showToast("\u274c Prérequis non rempli");
        return;
    }
    const cost = getGalacticUpgradeCost(upgrade);
    if (starDust < cost) {
        showToast("\u274c Pas assez de Poussière d'Étoiles");
        return;
    }
    starDust -= cost;
    galacticUpgrades[upgradeId] = level + 1;
    updateStardustDisplay();
    renderGalacticShop();
    saveGame();
    showToast("\u2728 " + upgrade.name + " niveau " + (level + 1));
}

// Getters d'effets (utilisés par la boucle de jeu)
function getUpgradeEffect(upgradeId) {
    const u = GALACTIC_UPGRADES.find(x => x.id === upgradeId);
    return u ? getGalacticUpgradeLevel(upgradeId) * u.effectPerLevel : 0;
}

function getProductionBonus() {
    return 1
        + getUpgradeEffect('prod1')
        + getUpgradeEffect('prod3')
        + getUpgradeEffect('prod4')
        + getUpgradeEffect('prod5')
        + getUpgradeEffect('prod6')
        + getUpgradeEffect('prod7');
}
function getBuildingCostReduction() {
    return Math.min(0.80, getUpgradeEffect('prod2'));
}
function getRocketPartDiscount() {
    return Math.min(0.50, getUpgradeEffect('rock1') + getUpgradeEffect('rock3'));
}
function getStartupAteliers() {
    return getUpgradeEffect('rock2');
}
function getCometFrequencyBonus() {
    return getUpgradeEffect('exp1') + getUpgradeEffect('exp3') + getUpgradeEffect('exp5');
}
function getStardustGainBonus() {
    return 1 + getUpgradeEffect('exp2') + getUpgradeEffect('exp4') + getUpgradeEffect('exp6');
}
function getDistanceBonus() {
    return 1 + getUpgradeEffect('rock4') + getUpgradeEffect('rock5') + getUpgradeEffect('rock6');
}
function getClickPowerBonus() {
    return 1
        + getUpgradeEffect('click1')
        + getUpgradeEffect('click2')
        + getUpgradeEffect('click4')
        + getUpgradeEffect('click5');
}
function getCritChance() {
    return Math.min(0.50, getUpgradeEffect('click3'));
}
function getBoosterDiscount() {
    return Math.min(0.50, getUpgradeEffect('coll4'));
}
function getCollectionUpgradeBonus() {
    return getUpgradeEffect('coll3') + getUpgradeEffect('coll5');
}
function getRarityBoost() {
    return Math.min(0.50, getUpgradeEffect('coll2'));
}

function applyStartupBonus() {
    const freeAteliers = getStartupAteliers();
    if (freeAteliers > 0) {
        const atelier = BUILDINGS.find(b => b.id === 'workshop');
        if (atelier) {
            atelier.count += freeAteliers;
            unlockedBuildings.add(atelier.id);
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
        header.innerHTML = '<span class="galactic-branch-icon">' + branch.icon + '</span><span class="galactic-branch-name">' + branch.name + '</span>';
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
                reqHtml = '<span class="galactic-req">⛔ Prérequis: ' + reqNames.join(', ') + '</span>';
            }

            el.innerHTML =
                '<div class="galactic-node-top">' +
                    '<span class="galactic-node-name">' + upgrade.name + '</span>' +
                    (maxed ? '<span class="galactic-node-max">MAX</span>' : '') +
                '</div>' +
                '<span class="galactic-node-desc">' + upgrade.desc + '</span>' +
                '<div class="galactic-node-bottom">' +
                    '<span class="galactic-node-level">Niv. ' + level + '/' + upgrade.maxLevel + '</span>' +
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
    const modal = document.getElementById('galactic-shop-modal');
    if (modal.classList.contains('active')) {
        modal.classList.remove('active');
    } else {
        renderGalacticShop();
        modal.classList.add('active');
    }
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

    // Mettre à jour l'affichage de la planète actuelle (basé sur distance parcourue)
    const planetDisplay = document.getElementById('current-planet-display');
    if (planetDisplay) {
        const traveledProgress = calculatePlanetProgress(traveledDistance);
        if (traveledProgress.currentPlanet) {
            if (traveledProgress.nextPlanet) {
                planetDisplay.innerHTML = `${traveledProgress.currentPlanet.emoji} ${traveledProgress.currentPlanet.name}: ${traveledProgress.progressPercent}%`;
            } else {
                planetDisplay.innerHTML = `${traveledProgress.currentPlanet.emoji} ${traveledProgress.currentPlanet.name}: 100%`;
            }
        } else if (traveledProgress.nextPlanet) {
            planetDisplay.innerHTML = `${traveledProgress.nextPlanet.emoji} ${traveledProgress.nextPlanet.name}: ${traveledProgress.progressPercent}%`;
        } else {
            planetDisplay.innerHTML = `🌍 Terre: 0%`;
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
        sidebarDistance.textContent = formatNumber(reachableDistance) + ' km';
    }
    if (sidebarDistanceMax) {
        sidebarDistanceMax.textContent = formatNumber(traveledDistance) + ' km';
    }
    if (sidebarBonus) {
        const totalBonus = getPlanetProductionBonus();
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
            planetHtml += `<div class="planet-name">${planet.name}</div>`;
            const planetDist = planet.distanceRequired;
            const distLabel = planet.id === 'earth' ? 'Départ' : `${formatNumber(planetDist)} km`;
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

function renderUpgrades() {
    const container = document.getElementById('upgrades-container');
    container.innerHTML = '';

    const available = [];

    // Upgrades de clic
    CLICK_UPGRADES.forEach(upgrade => {
        if (totalPartsFromClicks >= upgrade.threshold && !activatedClickUpgrades.includes(upgrade.threshold)) {
            const upgradeIndex = CLICK_UPGRADES.indexOf(upgrade);
            const color = UPGRADE_COLORS[upgradeIndex % UPGRADE_COLORS.length];
            available.push({
                cost: upgrade.cost,
                render: () => {
                    const el = createUpgradeElement(color, 'images/cursor.svg', upgrade.name, upgrade.threshold);
                    attachTooltip(el, `${upgrade.name} — ×2 clic — ${formatNumber(upgrade.cost)} Parts`);
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
                        attachTooltip(el, `${building.name} — Palier ${threshold} — ×2 production — ${formatNumber(cost)} Parts`);
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
    element.addEventListener('mouseenter', (e) => {
        const rect = e.target.getBoundingClientRect();
        showTooltip(text, rect.left + rect.width / 2, rect.top);
    });
    element.addEventListener('mouseleave', hideTooltip);
}

// ============================================
// BONUSES MANAGEMENT
// ============================================

function spawnRandomBonus() {
    let bonusIndex = Math.floor(Math.random() * RANDOM_BONUSES.length);
    let bonus = RANDOM_BONUSES[bonusIndex];
    // Si ce bonus est déjà actif, prendre l'autre pour ne pas bloquer le spawn
    if (activeRandomBonuses.some(b => b.id === bonus.id)) {
        bonusIndex = (bonusIndex + 1) % RANDOM_BONUSES.length;
        bonus = RANDOM_BONUSES[bonusIndex];
        if (activeRandomBonuses.some(b => b.id === bonus.id)) return;
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
    bonusElement.className = `random-bonus comet ${bonus.colorClass}`;
    if (!goRight) bonusElement.classList.add('reverse');
    bonusElement.innerHTML = '<img src="images/effects/com\u00e8te.png" class="comet-img" alt="Comete">';
    bonusElement.style.left = `${startX}px`;
    bonusElement.style.top = `${startY}px`;

    document.getElementById('random-bonuses').appendChild(bonusElement);

    // Animation de traversée en diagonale
    requestAnimationFrame(() => {
        bonusElement.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
        bonusElement.style.left = `${endX}px`;
        bonusElement.style.top = `${endY}px`;
    });

    const trailInterval = setInterval(() => {
        const rect = bonusElement.getBoundingClientRect();
        const trail = document.createElement('div');
        trail.className = 'comet-trail';
        trail.style.left = `${rect.left + rect.width / 2}px`;
        trail.style.top = `${rect.top + rect.height / 2}px`;
        document.body.appendChild(trail);
        requestAnimationFrame(() => {
            trail.style.opacity = '0';
            trail.style.transform = 'translate(-50%, -50%) scale(2.5)';
        });
        setTimeout(() => trail.remove(), 1000);
    }, 80);

    const timeout = setTimeout(() => {
        clearInterval(trailInterval);
        bonusElement.remove();
    }, duration);

    bonusElement.onclick = () => {
        clearTimeout(timeout);
        clearInterval(trailInterval);
        bonusElement.classList.add('clicked');
        clickedBonusesCount++;

        if (bonus.id === "meteor") {
            const instantProduction = partsPerSecond * 10;
            score += instantProduction;
            partsSinceLaunch += instantProduction;
            showToast(`\u2705 ${bonus.name}: +${formatNumber(instantProduction)} Parts!`);
        } 
        else if (bonus.id === "flare") {
            activeRandomBonuses.push({
                id: bonus.id,
                effect: bonus.effect,
                multiplier: bonus.multiplier,
                endTime: Date.now() + bonus.duration
            });
            rebuildAutoMultipliers();
            showToast(`\u2705 ${bonus.name}: ×${bonus.multiplier} Parts/s for ${bonus.duration/1000}s`);

            setTimeout(() => {
                activeRandomBonuses = activeRandomBonuses.filter(b => b.id !== bonus.id);
                rebuildAutoMultipliers();
                updateDisplay();
                showToast(`\u23f0 ${bonus.name} expir\u00e9`);
            }, bonus.duration);
        }

        setTimeout(() => bonusElement.remove(), 500);
        checkTrophies();
    };
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

function addScore(points) {
    const { baseCpC, buildingBonus, cpsBonus } = getClickComponents();
    const basePoints = baseCpC + buildingBonus + cpsBonus;
    const critMult = (Math.random() < getCritChance()) ? 3 : 1;
    const totalPoints = basePoints * getClickPowerBonus() * critMult;

    score += totalPoints;
    partsSinceLaunch += totalPoints;
    totalPartsFromClicks += 1;

    showClickEffect(Math.round(totalPoints));

    const medal = document.getElementById('medal');
    medal.style.transform = 'scale(0.95)';
    setTimeout(() => { medal.style.transform = 'scale(1)'; }, 100);

    updateDisplay();
    saveGame();
    updateAllBuildingButtons();
    renderUpgrades();
    checkBuildingUnlocks();
    checkTrophies();
}

function showClickEffect(value) {
    const container = document.getElementById('click-effects');
    const medal = document.getElementById('medal');
    const medalRect = medal.getBoundingClientRect();
    const centerX = medalRect.left + medalRect.width / 2;
    const centerY = medalRect.top + medalRect.height / 2;

    // Envoyer dans toutes les directions (N, S, E, W) depuis le centre
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 100;  // 50-150px
    const offsetX = Math.cos(angle) * distance;
    const offsetY = Math.sin(angle) * distance;

    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${formatNumber(value)}`;
    effect.style.left = `${centerX + offsetX}px`;
    effect.style.top = `${centerY + offsetY}px`;

    container.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
}

// ============================================
// MAIN GAME LOOP
// ============================================

function gameLoop() {
    let totalGain = 0;

    BUILDINGS.forEach(building => {
        const buildingGain = calculateBuildingGain(building);
        totalGain += buildingGain;

        if (building.count > 0) {
            totalGeneratedByBuilding[building.id] = (totalGeneratedByBuilding[building.id] || 0) + (buildingGain * 0.1);
        }
    });

    partsPerSecond = totalGain;
    const tickGain = partsPerSecond / GAME_LOOP_FPS;
    score += tickGain;
    partsSinceLaunch += tickGain;

    if (Date.now() - lastBuildingsUpdate > BUILDING_UPDATE_INTERVAL_MS) {
        lastBuildingsUpdate = Date.now();
        updateAllBuildingButtons();
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
    
    if (durationMs < 60000) return Math.floor(durationMs / 1000) + "s";
    if (durationMs < 3600000) return Math.floor(durationMs / 60000) + "min";
    if (durationMs < 86400000) return Math.floor(durationMs / 3600000) + "h";
    return Math.floor(durationMs / 86400000) + "j";
}

// ============================================
// GESTION DES TROPH\u001aES
// ============================================

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
            }
            
            if (unlocked) {
                unlockedTrophies.add(trophy.id);
                changed = true;
                showToast(`Trophee debloque : ${trophy.name}!`);
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
    
    TROPHIES.forEach(trophy => {
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
        trophyElement.style.border = '2px solid #e2e8f0';
        trophyElement.style.background = '#f8fafc';
        
        if (unlockedTrophies.has(trophy.id)) {
            trophyElement.style.background = '#dbeafe';
            trophyElement.style.borderColor = '#2563eb';
            trophyElement.style.opacity = '1';
        } else {
            trophyElement.style.opacity = '0.4';
            trophyElement.style.filter = 'grayscale(100%)';
        }
        
        trophyElement.innerHTML = trophy.icon;
        
        trophyElement.addEventListener('mouseenter', (e) => {
            const rect = e.target.getBoundingClientRect();
            const name = trophy.name;
            const description = trophy.description;
            const isUnlocked = unlockedTrophies.has(trophy.id);
            const status = isUnlocked ? 'Debloque' : 'Verrouille';
            showTooltip(`${name}\n${description}\n${status}`, rect.left + rect.width/2, rect.top);
        });
        trophyElement.addEventListener('mouseleave', hideTooltip);
        
        trophiesGrid.appendChild(trophyElement);
    });
    
    container.appendChild(trophiesGrid);
    return container;
}

function renderStats() {
    const container = document.getElementById('stats-body');
    container.innerHTML = '';
    container.innerHTML += '<h4 style="margin: 0 0 8px; color: #2563eb; font-size: 1.1rem;">Global Stats</h4>';
    const globalStats = [
        { label: "Current Parts", value: formatNumber(score, true) },
        { label: "Total Parts generated", value: formatNumber(calculateTotalGenerated()) },
        { label: "Parts per second", value: formatNumber(partsPerSecond) },
        { label: "Parts per Click", value: formatNumber(getClickPower()) },
        { label: "Total Buildings Owned", value: formatNumber(getTotalBuildingsOwned()) },
        { label: "Game started", value: getGameDuration() },
        { label: "Bonuses clicked", value: clickedBonusesCount }
    ];

    globalStats.forEach(stat => {
        const statElement = document.createElement('div');
        statElement.style.display = 'flex';
        statElement.style.justifyContent = 'space-between';
        statElement.style.padding = '8px 0';
        statElement.style.borderBottom = '1px solid #e2e8f0';
        statElement.innerHTML = `
            <span style="color: #64748b; font-size: 0.9rem;">${stat.label}</span>
            <span style="color: #2563eb; font-weight: 600;">${stat.value}</span>
        `;
        container.appendChild(statElement);
    });

    container.innerHTML += '<h4 style="margin: 16px 0 8px; color: #2563eb; font-size: 1.1rem;">Upgrades</h4>';
    container.innerHTML += '<h5 style="margin: 8px 0 4px; color: #64748b; font-size: 0.9rem;">Upgrades de Clic:</h5>';
    
    if (activatedClickUpgrades.length > 0) {
        activatedClickUpgrades.forEach(threshold => {
            const upgrade = CLICK_UPGRADES.find(u => u.threshold === threshold);
            if (upgrade) {
                const statElement = document.createElement('div');
                statElement.style.display = 'flex';
                statElement.style.justifyContent = 'space-between';
                statElement.style.padding = '4px 0';
                statElement.style.fontSize = '0.85rem';
                statElement.style.color = '#64748b';
                statElement.innerHTML = `<span>\u2713 ${upgrade.name}</span>`;
                container.appendChild(statElement);
            }
        });
    } else {
        const statElement = document.createElement('div');
        statElement.style.padding = '4px 0';
        statElement.style.fontSize = '0.85rem';
        statElement.style.color = '#94a3b8';
        statElement.textContent = 'Aucune upgrade de clic';
        container.appendChild(statElement);
    }

    container.innerHTML += '<h5 style="margin: 12px 0 4px; color: #64748b; font-size: 0.9rem;">Upgrades de Buildings:</h5>';
    
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
            statElement.innerHTML = `<span>${building.image} ${building.name}: ${upgrades.length} niveau(x)</span>`;
            container.appendChild(statElement);
        }
    });

    if (!hasBuildingUpgrades) {
        const statElement = document.createElement('div');
        statElement.style.padding = '4px 0';
        statElement.style.fontSize = '0.85rem';
        statElement.style.color = '#94a3b8';
        statElement.textContent = 'Aucune upgrade de building';
        container.appendChild(statElement);
    }

    container.innerHTML += '<h4 style="margin: 16px 0 8px; color: #2563eb; font-size: 1.1rem;">Trophies</h4>';
    const trophiesSection = renderTrophies();
    container.appendChild(trophiesSection);
}

// ============================================
// MODALS
// ============================================

function toggleSettings() {
    document.getElementById('settings-modal').classList.toggle('active');
}

function toggleStats() {
    const modal = document.getElementById('stats-modal');
    modal.classList.toggle('active');
    if (modal.classList.contains('active')) {
        renderStats();
    }
}

// ============================================
// DISPLAY
// ============================================

function updateDisplay() {
    document.getElementById('score-value').textContent = formatNumber(score, true);
    document.getElementById('gain-value').textContent = formatNumber(partsPerSecond);
    updateModalPartsCounter();
    updateStardustDisplay();
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
        const seconds = Math.ceil(remainingTime / 1000);
        return `\u23f3 \u00d7${bonus.multiplier} (${seconds}s)`;
    });
    timerElement.innerHTML = labels.join('<br>');
    timerElement.style.display = 'block';
}

// ============================================
// PLANETARY SURVEY MINI-GAME
// ============================================

const SURVEY_BET_OPTIONS = [1, 10, 100];

// Mises calquées sur la production: 1s, 30s, 5min
function getSurveyBetAmount(type) {
    const pps = Math.max(1, partsPerSecond);
    switch (type) {
        case '1s': return Math.max(1, Math.floor(pps * 1));
        case '30s': return Math.max(1, Math.floor(pps * 30));
        case '5m': return Math.max(1, Math.floor(pps * 300));
        default: return Math.max(1, Math.floor(pps * 1));
    }
}

// Récompenses possibles (poids relatif). Les multiplicateurs de Parts sont appliqués à la mise.
const SURVEY_REWARDS = [
    { type: 'parts', weight: 35, minMult: 1, maxMult: 3, icon: '💰', label: 'Parts gagnés', imgPath: 'images/cards/casino/parts.png' },
    { type: 'multiplier', weight: 20, minMult: 2, maxMult: 4, duration: 30000, icon: '⭐', label: 'Multiplicateur temporaire', imgPath: 'images/cards/casino/multiplier.png' },
    { type: 'bigParts', weight: 8, minMult: 5, maxMult: 10, icon: '💎', label: 'Gros lot de Parts', imgPath: 'images/cards/casino/bigParts.png' },
    { type: 'nothing', weight: 37, icon: '🌑', label: 'Pot divisé par 2', imgPath: 'images/cards/casino/nothing.png' }
];

// Malus: apparaît à partir du palier 1 (tour 6+), de plus en plus avec la difficulté
const SURVEY_MALUS = [
    { type: 'bust', weight: 15, icon: '💀', label: 'Tout perdu !', imgPath: 'images/cards/casino/bust.png' },
    { type: 'halve', weight: 20, icon: '⚔️', label: 'Pot réduit de moitié', imgPath: 'images/cards/casino/halve.png' }
];

// Palier de difficulté (tous les 5 tours): 0 = tour 1-5, 1 = tour 6-10, 2 = tour 11-15, etc.
function getSurveyDifficulty(round) {
    return Math.floor((round - 1) / 5);
}
// Nombre de cartes: 3 + palier (capé à 8)
function getSurveyCardCount(round) {
    return Math.min(8, 3 + getSurveyDifficulty(round));
}
// Probabilité de tirer un malus augmente avec la difficulté (0 au palier 0)
function getSurveyMalusChance(round) {
    const diff = getSurveyDifficulty(round);
    return diff === 0 ? 0 : Math.min(0.55, 0.08 * diff);
}
// Bonus de puissance des récompenses selon le palier
function getSurveyRewardMultiplier(round) {
    const diff = getSurveyDifficulty(round);
    return 1 + diff * 0.5;
}
// Durée du multiplicateur temporaire selon le palier
function getSurveyMultiplierDuration(round) {
    const diff = getSurveyDifficulty(round);
    return 30000 + diff * 10000;
}

let surveyState = {
    bet: 0,
    round: 0,
    pot: 0,
    currentReward: null,
    canChoose: false,
    doubling: false
};

function openPlanetarySurvey() {
    document.getElementById('planetary-survey-modal').classList.add('active');
    resetPlanetarySurvey();
}

function closePlanetarySurvey() {
    document.getElementById('planetary-survey-modal').classList.remove('active');
}

function resetPlanetarySurvey() {
    surveyState = { bet: 0, round: 0, pot: 0, currentReward: null, canChoose: false, doubling: false };
    showSurveyScreen('bet');
    document.getElementById('survey-intro').textContent = 'Choisis une carte et révèle un bonus ! Mode infini : encaisse ou remise à chaque tour.';
    updateBetButtons();
}

function updateBetButtons() {
    document.querySelectorAll('.survey-bet-btn[data-bet-type]').forEach(btn => {
        const amount = getSurveyBetAmount(btn.dataset.betType);
        btn.textContent = `${btn.dataset.betType === '1s' ? '⏱️ 1s' : btn.dataset.betType === '30s' ? '⏱️ 30s' : '⏱️ 5 min'} (${formatNumber(amount)})`;
        btn.disabled = score < amount;
    });
}

function showSurveyScreen(screen) {
    document.getElementById('survey-bet-screen').style.display = screen === 'bet' ? 'block' : 'none';
    document.getElementById('survey-play-screen').style.display = screen === 'play' ? 'block' : 'none';
}

function startPlanetarySurveyWithBet(bet) {
    bet = Math.max(1, Math.floor(bet));
    if (score < bet) {
        showToast(`❌ Pas assez de pièces ! Il faut ${formatNumber(bet)} Parts.`);
        return;
    }
    score -= bet;
    updateDisplay();

    surveyState.bet = bet;
    surveyState.round = 0;
    surveyState.pot = bet;
    surveyState.doubling = false;

    showSurveyScreen('play');
    nextSurveyRound();
}

function startPlanetarySurveyFromType(type) {
    startPlanetarySurveyWithBet(getSurveyBetAmount(type));
}

function startPlanetarySurveyCustom() {
    const input = document.getElementById('survey-custom-bet-input');
    const val = parseInt(input.value);
    if (!val || val < 1) {
        showToast('❌ Entre une mise valide.');
        return;
    }
    input.value = '';
    startPlanetarySurveyWithBet(val);
}

function nextSurveyRound() {
    surveyState.round++;
    surveyState.canChoose = true;
    surveyState.currentReward = null;

    const difficulty = getSurveyDifficulty(surveyState.round);
    const cardCount = getSurveyCardCount(surveyState.round);
    const malusChance = getSurveyMalusChance(surveyState.round);

    document.getElementById('survey-round').textContent = surveyState.round;
    document.getElementById('survey-pot').textContent = formatNumber(surveyState.pot);
    const diffLabel = difficulty > 0 ? ` (Palier ${difficulty + 1})` : '';
    document.getElementById('survey-play-intro').textContent = `Tour ${surveyState.round}${diffLabel} — Choisis une carte !`;
    document.getElementById('survey-result').textContent = '';
    document.getElementById('survey-result').className = 'survey-result';
    document.getElementById('survey-collect-btn').style.display = 'none';
    document.getElementById('survey-continue-btn').style.display = 'none';

    const container = document.getElementById('survey-cards');
    container.innerHTML = '';

    for (let i = 0; i < cardCount; i++) {
        const card = document.createElement('div');
        card.className = 'survey-card';
        card.innerHTML = `
            <div class="survey-card-inner">
                <div class="survey-card-front"><img src="images/cards/backs/card-back.png" class="survey-card-img" alt="Carte"></div>
                <div class="survey-card-back">
                    <div class="reward-icon">❓</div>
                    <div class="reward-text">?</div>
                </div>
            </div>
        `;
        // Tirer un malus selon la probabilité, sinon une récompense
        const isMalus = Math.random() < malusChance;
        card.dataset.reward = JSON.stringify(isMalus ? pickSurveyMalus() : pickSurveyReward());
        card.dataset.isMalus = isMalus ? '1' : '0';
        card.onclick = () => revealSurveyCard(card);
        container.appendChild(card);
    }
}

function pickSurveyMalus() {
    const totalWeight = SURVEY_MALUS.reduce((sum, m) => sum + m.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const malus of SURVEY_MALUS) {
        roll -= malus.weight;
        if (roll <= 0) return malus;
    }
    return SURVEY_MALUS[0];
}

function pickSurveyReward() {
    const diff = getSurveyDifficulty(surveyState.round);
    const adjusted = SURVEY_REWARDS.map(r => {
        let w = r.weight;
        if (r.type === 'parts') w = r.weight + (diff === 0 ? 18 : Math.max(0, 10 - diff));
        else if (r.type === 'bigParts') w = r.weight + diff * 4;
        else if (r.type === 'multiplier') w = r.weight + diff * 3;
        else if (r.type === 'nothing') w = r.weight + diff * 6;
        return { ...r, weight: Math.max(1, w) };
    });
    const totalWeight = adjusted.reduce((sum, r) => sum + r.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const reward of adjusted) {
        roll -= reward.weight;
        if (roll <= 0) return reward;
    }
    return adjusted[0];
}

function revealSurveyCard(chosenCard) {
    if (!surveyState.canChoose) return;
    surveyState.canChoose = false;

    const allCards = document.querySelectorAll('.survey-card');
    allCards.forEach(card => {
        card.classList.add('disabled');
        card.onclick = null;
    });

    const reward = JSON.parse(chosenCard.dataset.reward);
    surveyState.currentReward = reward;

    chosenCard.classList.add('flipped');
    if (chosenCard.dataset.isMalus === '1') chosenCard.classList.add('malus');
    displayRewardOnCard(chosenCard, reward);

    // Révéler les autres cartes
    setTimeout(() => {
        allCards.forEach(card => {
            if (card !== chosenCard) {
                const otherReward = JSON.parse(card.dataset.reward);
                card.classList.add('flipped');
                if (card.dataset.isMalus === '1') card.classList.add('malus');
                displayRewardOnCard(card, otherReward);
            }
        });
    }, 600);

    // Calculer l'effet sur le pot
    const result = document.getElementById('survey-result');
    if (reward.type === 'bust') {
        surveyState.pot = 0;
        result.textContent = '💀 TOUT PERDU ! Le pot est vide.';
        result.className = 'survey-result miss';
    } else if (reward.type === 'halve') {
        surveyState.pot = Math.max(0, Math.floor(surveyState.pot * 0.5));
        result.textContent = '⚔️ Malus ! Le pot est réduit de moitié.';
        result.className = 'survey-result miss';
    } else if (reward.type === 'nothing') {
        surveyState.pot = Math.max(0, Math.floor(surveyState.pot * 0.5));
        result.textContent = '🌑 Pot divisé par 2 !';
        result.className = 'survey-result miss';
    } else if (reward.type === 'parts' || reward.type === 'bigParts') {
        const rewardBonus = getSurveyRewardMultiplier(surveyState.round);
        const baseMult = reward.minMult + Math.floor(Math.random() * (reward.maxMult - reward.minMult + 1));
        const mult = Math.max(2, Math.floor(baseMult * rewardBonus));
        surveyState.pot = Math.floor(surveyState.pot * mult);
        result.textContent = `${reward.icon} ×${mult} ! Le pot augmente !`;
        result.className = 'survey-result win';
    } else if (reward.type === 'multiplier') {
        const rewardBonus = getSurveyRewardMultiplier(surveyState.round);
        const baseMult = reward.minMult + Math.floor(Math.random() * (reward.maxMult - reward.minMult + 1));
        const mult = Math.max(2, Math.floor(baseMult * rewardBonus));
        surveyState.pot = Math.floor(surveyState.pot * mult);
        result.textContent = `${reward.icon} ×${mult} ! Bonus de production encaissé.`;
        result.className = 'survey-result win';
        applySurveyMultiplier(mult, getSurveyMultiplierDuration(surveyState.round));
    }

    document.getElementById('survey-pot').textContent = formatNumber(surveyState.pot);
    updateDisplay();

    // Proposer encaisser ou remiser (mode infini)
    setTimeout(() => {
        if (surveyState.pot > 0) {
            document.getElementById('survey-collect-btn').style.display = 'block';
            document.getElementById('survey-continue-btn').style.display = 'block';
        } else {
            // Pot vide: partie perdue, retour à la mise
            document.getElementById('survey-result').textContent = '💔 Partie perdue... le pot est vide.';
            document.getElementById('survey-result').className = 'survey-result miss';
            setTimeout(() => resetPlanetarySurvey(), 1800);
        }
    }, 1200);
}

function displayRewardOnCard(card, reward) {
    const back = card.querySelector('.survey-card-back');
    const iconEl = back.querySelector('.reward-icon');
    iconEl.innerHTML = reward.imgPath
        ? `<img src="${reward.imgPath}" class="survey-reward-img" alt="${reward.label}">`
        : reward.icon;
    back.querySelector('.reward-text').textContent = reward.label;
    const existing = back.querySelector('.reward-amount');
    if (existing) existing.remove();
}

function surveyCollectWinnings() {
    if (surveyState.pot > 0) {
        score += surveyState.pot;
        partsSinceLaunch += surveyState.pot;
        showToast(`💰 Tu encaisses ${formatNumber(surveyState.pot)} Parts !`);
        surveyState.pot = 0;
        updateDisplay();
    }
    resetPlanetarySurvey();
}

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

function applySurveyMultiplier(mult, duration) {
    const bonusId = 'survey-mult-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    activeRandomBonuses.push({
        id: bonusId,
        effect: 'multiplier',
        multiplier: mult,
        endTime: Date.now() + duration
    });
    rebuildAutoMultipliers();
    updateDisplay();
    setTimeout(() => {
        activeRandomBonuses = activeRandomBonuses.filter(b => b.id !== bonusId);
        rebuildAutoMultipliers();
        updateDisplay();
    }, duration);
}

// Attacher les boutons de mise
(function attachSurveyBetButtons() {
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.survey-bet-btn[data-bet-type]').forEach(btn => {
            btn.addEventListener('click', () => {
                startPlanetarySurveyFromType(btn.dataset.betType);
            });
        });
        const customBtn = document.getElementById('survey-custom-bet-btn');
        if (customBtn) {
            customBtn.addEventListener('click', startPlanetarySurveyCustom);
        }
    });
})();

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

const COLLECTIBLE_CARDS = [
    { id: 'earth-card',     name: 'Terre',            rarity: 'common',      icon: '🌍', imgPath: 'images/cards/collection/earth-card.png' },
    { id: 'moon-card',      name: 'Lune',             rarity: 'common',      icon: '🌙', imgPath: 'images/cards/collection/moon-card.png' },
    { id: 'meteor-card',    name: 'Pluie de météores', rarity: 'common',      icon: '💫', imgPath: 'images/cards/collection/meteor-card.png' },
    { id: 'wrench-card',    name: 'Atelier',          rarity: 'common',      icon: '🔧', imgPath: 'images/cards/collection/wrench-card.png' },
    { id: 'factory-card',   name: 'Usine',            rarity: 'common',      icon: '🏭', imgPath: 'images/cards/collection/factory-card.png' },
    { id: 'hq-card',        name: 'QG Spatial',       rarity: 'common',      icon: '🏛️', imgPath: 'images/cards/collection/hq-card.png' },
    { id: 'nova-card',      name: 'Nova',             rarity: 'common',      icon: '🌟', imgPath: 'images/cards/collection/nova-card.png' },
    { id: 'mining-card',    name: 'Mine stellaire',   rarity: 'common',      icon: '⛏️', imgPath: 'images/cards/collection/mining-card.png' },
    { id: 'mars-card',      name: 'Mars',             rarity: 'rare',        icon: '💫', imgPath: 'images/cards/collection/mars-card.png' },
    { id: 'neptune-card',   name: 'Neptune',          rarity: 'rare',        icon: '💫', imgPath: 'images/cards/collection/neptune-card.png' },
    { id: 'lab-card',       name: 'Laboratoire',      rarity: 'rare',        icon: '🧪', imgPath: 'images/cards/collection/lab-card.png' },
    { id: 'launchpad-card', name: 'Pas de tir',       rarity: 'rare',        icon: '🚀', imgPath: 'images/cards/collection/launchpad-card.png' },
    { id: 'flare-card',     name: 'Éruption solaire', rarity: 'rare',   icon: '☀️', imgPath: 'images/cards/collection/flare-card.png' },
    { id: 'comet-card',     name: 'Comète',          rarity: 'rare',        icon: '💫', imgPath: 'images/cards/collection/comet-card.png' },
    { id: 'pluto-card',     name: 'Pluton',           rarity: 'epic',        icon: '💫', imgPath: 'images/cards/collection/pluto-card.png' },
    { id: 'oort-card',      name: 'Nuage d\'Oort',     rarity: 'epic',        icon: '🌀', imgPath: 'images/cards/collection/oort-card.png' },
    { id: 'blackhole-card', name: 'Trou noir',        rarity: 'epic',        icon: '🌀', imgPath: 'images/cards/collection/blackhole-card.png' },
    { id: 'proxima-card',   name: 'Proxima Centauri', rarity: 'legendary',   icon: '☀️', imgPath: 'images/cards/collection/proxima-card.png' },
    { id: 'supernova-card', name: 'Supernova',        rarity: 'legendary',   icon: '🌟', imgPath: 'images/cards/collection/supernova-card.png' },
    { id: 'sirius-card',    name: 'Sirius',           rarity: 'alternative', icon: '⭐', imgPath: 'images/cards/collection/sirius-card.png' }
];

const BOOSTERS = {
    standard:  { name: 'Standard',   cardCount: 1, cost: () => Math.max(100, Math.floor(partsPerSecond * 30)),     rarities: { common: 0.80, rare: 0.18, epic: 0.02 } },
    premium:   { name: 'Premium',    cardCount: 2, cost: () => Math.max(500, Math.floor(partsPerSecond * 150)),    rarities: { common: 0.50, rare: 0.30, epic: 0.15, legendary: 0.04, alternative: 0.01 } },
    legendary: { name: 'Légendaire', cardCount: 3, cost: () => Math.max(2000, Math.floor(partsPerSecond * 600)),  rarities: { common: 0.25, rare: 0.30, epic: 0.25, legendary: 0.15, alternative: 0.05 } }
};

// ============================================
// ATELIER GALACTIQUE - 29 upgrades uniques en 5 branches
// Ne se reset jamais. Progression meta entre les runs.
// ============================================
const GALACTIC_BRANCHES = [
    { id: 'production',   name: 'Production',    icon: '⚙',  color: '#3b82f6' },
    { id: 'rocket',       name: 'Fusée',          icon: '🚀', color: '#f59e0b' },
    { id: 'exploration',  name: 'Exploration',    icon: '🌌', color: '#a855f7' },
    { id: 'collection',   name: 'Collection',     icon: '🃏', color: '#ec4899' },
    { id: 'click',        name: 'Clic',            icon: '👆', color: '#10b981' }
];

const GALACTIC_UPGRADES = [
    // === BRANCHE PRODUCTION (7) - upgrades uniques ===
    { id: 'prod1',  branch: 'production', tier: 1, name: 'R\u00e9acteur \u00e0 fusion',       desc: '+25% production globale.',                  baseCost: 15,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.25 },
    { id: 'prod2',  branch: 'production', tier: 2, name: 'Optimisation \u00e9nerg\u00e9tique', desc: '-30% co\u00fbt des b\u00e2timents.',        baseCost: 30,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.30, requires: ['prod1'] },
    { id: 'prod3',  branch: 'production', tier: 3, name: 'Surcharge industrielle',  desc: '+50% production globale.',                  baseCost: 60,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.50, requires: ['prod1'] },
    { id: 'prod4',  branch: 'production', tier: 4, name: 'Automatisation avanc\u00e9e',  desc: '+75% production globale.',                  baseCost: 120,  costMult: 1.0, maxLevel: 1, effectPerLevel: 0.75, requires: ['prod2', 'prod3'] },
    { id: 'prod5',  branch: 'production', tier: 5, name: 'Nanotechnologie',         desc: '+100% production globale.',                 baseCost: 250,  costMult: 1.0, maxLevel: 1, effectPerLevel: 1.0, requires: ['prod4'] },
    { id: 'prod6',  branch: 'production', tier: 6, name: 'Synth\u00e8se de mati\u00e8re noire', desc: '+150% production globale.',                baseCost: 500,  costMult: 1.0, maxLevel: 1, effectPerLevel: 1.5, requires: ['prod5'] },
    { id: 'prod7',  branch: 'production', tier: 7, name: 'Singularit\u00e9 technologique', desc: '+200% production globale.',                 baseCost: 1000, costMult: 1.0, maxLevel: 1, effectPerLevel: 2.0, requires: ['prod6'] },

    // === BRANCHE FUS\u00c9E (6) - upgrades uniques ===
    { id: 'rock1',  branch: 'rocket', tier: 1, name: 'Ing\u00e9nierie optimis\u00e9e',     desc: '-30% co\u00fbt des pi\u00e8ces de fus\u00e9e.',         baseCost: 10,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.30 },
    { id: 'rock2',  branch: 'rocket', tier: 2, name: 'D\u00e9marrage assist\u00e9',        desc: '+5 Ateliers gratuits au d\u00e9but de chaque run.', baseCost: 20,   costMult: 1.0, maxLevel: 1, effectPerLevel: 5, requires: ['rock1'] },
    { id: 'rock3',  branch: 'rocket', tier: 3, name: 'Mat\u00e9riaux composites',     desc: '-50% co\u00fbt des pi\u00e8ces de fus\u00e9e.',         baseCost: 40,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.50, requires: ['rock1'] },
    { id: 'rock4',  branch: 'rocket', tier: 4, name: 'Propulsion quantique',     desc: '+100% distance de lancement.',              baseCost: 100,  costMult: 1.0, maxLevel: 1, effectPerLevel: 1.0, requires: ['rock2', 'rock3'] },
    { id: 'rock5',  branch: 'rocket', tier: 5, name: 'T\u00e9l\u00e9portation spatiale',   desc: '+200% distance de lancement.',              baseCost: 300,  costMult: 1.0, maxLevel: 1, effectPerLevel: 2.0, requires: ['rock4'] },
    { id: 'rock6',  branch: 'rocket', tier: 6, name: 'Moteur \u00e0 distorsion',      desc: '+500% distance de lancement.',              baseCost: 800,  costMult: 1.0, maxLevel: 1, effectPerLevel: 5.0, requires: ['rock5'] },

    // === BRANCHE EXPLORATION (6) - upgrades uniques ===
    { id: 'exp1',   branch: 'exploration', tier: 1, name: 'Flotte de reconnaissance', desc: '+100% fr\u00e9quence des com\u00e8tes.',       baseCost: 8,    costMult: 1.0, maxLevel: 1, effectPerLevel: 1.0 },
    { id: 'exp2',   branch: 'exploration', tier: 2, name: 'Capteurs longue port\u00e9e',   desc: '+100% gain de Poussi\u00e8re d\'\u00c9toiles.', baseCost: 25,   costMult: 1.0, maxLevel: 1, effectPerLevel: 1.0, requires: ['exp1'] },
    { id: 'exp3',   branch: 'exploration', tier: 3, name: 'Boosters de lancement',   desc: '+150% fr\u00e9quence des com\u00e8tes.',      baseCost: 50,   costMult: 1.0, maxLevel: 1, effectPerLevel: 1.5, requires: ['exp1'] },
    { id: 'exp4',   branch: 'exploration', tier: 4, name: 'Cartographie stellaire',   desc: '+200% gain de Poussi\u00e8re d\'\u00c9toiles.', baseCost: 100,  costMult: 1.0, maxLevel: 1, effectPerLevel: 2.0, requires: ['exp2', 'exp3'] },
    { id: 'exp5',   branch: 'exploration', tier: 5, name: 'Voyage interstellaire',   desc: '+200% fr\u00e9quence des com\u00e8tes.',      baseCost: 250,  costMult: 1.0, maxLevel: 1, effectPerLevel: 2.0, requires: ['exp4'] },
    { id: 'exp6',   branch: 'exploration', tier: 6, name: 'Trou de ver',              desc: 'x3 gain de Poussi\u00e8re d\'\u00c9toiles.',   baseCost: 600,  costMult: 1.0, maxLevel: 1, effectPerLevel: 2.0, requires: ['exp5'] },

    // === BRANCHE COLLECTION (5) - upgrades uniques ===
    { id: 'coll1',  branch: 'collection', tier: 1, name: 'March\u00e9 noir',           desc: '+2 cartes par booster Premium/L\u00e9gendaire.', baseCost: 30,   costMult: 1.0, maxLevel: 1, effectPerLevel: 2 },
    { id: 'coll2',  branch: 'collection', tier: 2, name: 'Chance de collection',   desc: '+25% chance de raret\u00e9 sup\u00e9rieure.',  baseCost: 60,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.25, requires: ['coll1'] },
    { id: 'coll3',  branch: 'collection', tier: 3, name: 'Boosters renforc\u00e9s',      desc: '+50% bonus de collection.',              baseCost: 100,  costMult: 1.0, maxLevel: 1, effectPerLevel: 0.50, requires: ['coll1'] },
    { id: 'coll4',  branch: 'collection', tier: 4, name: 'Carte de commer\u00e7ant',     desc: '-40% co\u00fbt des boosters.',          baseCost: 200,  costMult: 1.0, maxLevel: 1, effectPerLevel: 0.40, requires: ['coll2', 'coll3'] },
    { id: 'coll5',  branch: 'collection', tier: 5, name: 'Album cosmique',          desc: 'x2 bonus de collection complet.',        baseCost: 500,  costMult: 1.0, maxLevel: 1, effectPerLevel: 1.0, requires: ['coll4'] },

    // === BRANCHE CLIC (5) - upgrades uniques ===
    { id: 'click1', branch: 'click', tier: 1, name: 'Gants renforc\u00e9s',      desc: '+50% puissance de clic.',                baseCost: 10,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.50 },
    { id: 'click2', branch: 'click', tier: 2, name: 'Main cybern\u00e9tique',     desc: '+100% puissance de clic.',              baseCost: 40,   costMult: 1.0, maxLevel: 1, effectPerLevel: 1.0, requires: ['click1'] },
    { id: 'click3', branch: 'click', tier: 3, name: 'Frappe critique',       desc: '+25% chance de coup critique (x3).',    baseCost: 80,   costMult: 1.0, maxLevel: 1, effectPerLevel: 0.25, requires: ['click1'] },
    { id: 'click4', branch: 'click', tier: 4, name: 'Surcharge neuronale',    desc: '+200% puissance de clic.',              baseCost: 150,  costMult: 1.0, maxLevel: 1, effectPerLevel: 2.0, requires: ['click2', 'click3'] },
    { id: 'click5', branch: 'click', tier: 5, name: 'Main de l\'univers',    desc: 'x5 puissance de clic.',                 baseCost: 400,  costMult: 1.0, maxLevel: 1, effectPerLevel: 4.0, requires: ['click4'] }
];

let galacticUpgrades = {};

let cardCollection = {};

function openCardCollection() {
    document.getElementById('card-collection-modal').classList.add('active');
    updateCardCollectionDisplay();
    showCardShop();
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
        if (costEl) costEl.textContent = '💰 ' + formatNumber(Math.floor(BOOSTERS[key].cost() * (1 - getBoosterDiscount())));
    }
}

function updateCardCollectionDisplay() {
    const collected = Object.keys(cardCollection).filter(id => cardCollection[id] > 0);
    document.getElementById('cc-collected-count').textContent = collected.length;
    document.getElementById('cc-total-count').textContent = COLLECTIBLE_CARDS.length;
    document.getElementById('cc-bonus-display').textContent = '×' + (1 + getCollectionBonus()).toFixed(2);
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
    return (1 + getCollectionBonus()) * (1 + getCollectionUpgradeBonus());
}

function buyBooster(type) {
    const booster = BOOSTERS[type];
    if (!booster) return;
    const cost = Math.floor(booster.cost() * (1 - getBoosterDiscount()));
    if (score < cost) {
        showToast('❌ Pas assez de Parts pour ce booster !');
        return;
    }
    score -= cost;
    updateDisplay();

    const drawn = [];
    let cardCount = booster.cardCount;
    if (type === 'premium' || type === 'legendary') {
        cardCount += getGalacticUpgradeLevel('coll1');
    }
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
                    (isNew ? '<div class="cc-card-new">NOUVELLE !</div>' : '') +
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
        banner.textContent = '🚀 Collection complète ! +20% prod';
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
        grid.appendChild(el);
    });
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
}

// ============================================
// TIMERS
// ============================================

function scheduleBonusSpawn() {
    const bonus = getCometFrequencyBonus();
    const delay = Math.max(800, BONUS_SPAWN_INTERVAL_MS / (1 + bonus));
    setTimeout(() => {
        spawnRandomBonus();
        scheduleBonusSpawn();
    }, delay);
}
scheduleBonusSpawn();
setInterval(gameLoop, GAME_LOOP_INTERVAL_MS);
setInterval(() => {
    if (Date.now() - lastSaveTime > SAVE_INTERVAL_MS) {
        saveGame();
    }
}, 10000);

window.onload = function() {
    init();
    if (!gameStartTime) {
        gameStartTime = Date.now();
    }
};


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
        showToast("\u274c Pas assez de Parts pour " + part.name);
        return;
    }
    score -= cost;
    part.purchased = true;
    updateDisplay();
    updateConstructionScene();
    renderRocketPartsShop();
    checkBuildingUnlocks();
    saveGame();
    showToast("\u2705 " + part.name + " construit !");
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
                    '<div class="rocket-part-frame-title">Pi\u00e8ces compl\u00e8tes</div>' +
                    '<div class="rocket-part-frame-complete">\u2713 Fus\u00e9e pr\u00eate \u00e0 lancer</div>' +
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
                '<div class="rocket-part-frame-title">Pi\u00e8ce ' + (purchasedCount + 1) + ' / ' + ROCKET_PARTS.length + '</div>' +
                '<div class="rocket-part-left">' + imageHtml + '</div>' +
                '<div class="rocket-part-info">' +
                    '<span class="rocket-part-name">' + nextPart.name + '</span>' +
                    '<span class="rocket-part-cost">' + formatNumber(cost) + ' Parts</span>' +
                '</div>' +
                '<button class="rocket-part-btn" onclick="buyRocketPart(\'' + nextPart.id + '\')"' + (!isAffordable ? ' disabled' : '') + '>Construire</button>' +
            '</div>';
    } else {
        const costEl = container.querySelector('.rocket-part-cost');
        if (costEl) costEl.textContent = formatNumber(cost) + ' Parts';
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
        showToast("🚀 Fusée complète ! Prête pour le décollage !");
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

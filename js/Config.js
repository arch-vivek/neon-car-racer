export const CONFIG = Object.freeze({
  FPS_CAP_MS: 100,
  BASE_SCORE_RATE: 0.05,
  ACCELERATION: 0.00002,
  ROAD_LOOP_HEIGHT: 80,
  SPAWN_DIVISOR: 4,
  COLLISION_PADDING: { x: 10, y: 15 },
  AI_SWERVE_SPEED: 0.15,
  MAX_TILT: 10,
  MAX_SKIDS: 40,
  MAX_PARTICLES: 30,
  MAX_COLLECTIBLES: 10,
});

export const ENEMY_TYPES = Object.freeze([
  {
    type: 'standard',
    width: 50,
    height: 100,
    speedMod: 0.9,
    cssClass: 'enemy-standard',
    isNemesis: false,
  },
  {
    type: 'police',
    width: 55,
    height: 115,
    speedMod: 1.25,
    cssClass: 'enemy-police',
    isNemesis: false,
  },
  {
    type: 'hard',
    width: 70,
    height: 140,
    speedMod: 0.5,
    cssClass: 'enemy-hard',
    isNemesis: false,
  },
  {
    type: 'nemesis',
    width: 55,
    height: 115,
    speedMod: 1.35,
    cssClass: 'enemy-nemesis',
    isNemesis: true,
  },
]);

export const COLLECTIBLE_TYPES = Object.freeze([
  { type: 'coin', width: 25, height: 25, cssClass: 'col-coin', weight: 80 },
  { type: 'shield', width: 30, height: 30, cssClass: 'col-shield', weight: 20 },
]);

export const CAMPAIGN_STAGES = Object.freeze([
  {
    id: 1,
    name: 'Night Run',
    targetScore: 200,
    maxSpeed: 0.8,
    theme: 'theme-night',
    baseSpawn: 1500,
  },
  {
    id: 2,
    name: 'Twilight Zone',
    targetScore: 350,
    maxSpeed: 1.1,
    theme: 'theme-twilight',
    baseSpawn: 1200,
  },
  {
    id: 3,
    name: 'Redline Sunset',
    targetScore: 500,
    maxSpeed: 1.4,
    theme: 'theme-sunset',
    baseSpawn: 1000,
  },
  {
    id: 4,
    name: 'Daylight Rush',
    targetScore: 700,
    maxSpeed: 1.7,
    theme: 'theme-day',
    baseSpawn: 700,
  },
  {
    id: 5,
    name: 'Hyper-Neon',
    targetScore: 1000,
    maxSpeed: 2.2,
    theme: 'theme-neon',
    baseSpawn: 450,
  },
]);

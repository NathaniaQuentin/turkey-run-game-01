// Gobble Run — tuning and palette in one place.
//
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size. Distances are in metres,
// speeds in pixels per second, and the world advances in fixed 1/60 s steps.
export const FIELD = { width: 1280, height: 720, groundY: 612 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Pixels the turkey covers for one metre of escape distance. */
export const PX_PER_METRE = 18;

/** How far the turkey must run to reach the forest gate and escape. */
export const ESCAPE_DISTANCE = 1800;

/** Stage boundaries in metres: farmyard, barn, kitchen, then the forest gate. */
export const STAGES = [
  { name: 'Farmyard', from: 0, to: 600, sky: ['#ffd98a', '#ff9e5e'], ground: '#7a9a4d' },
  { name: 'Barn', from: 600, to: 1200, sky: ['#e8a06a', '#8a4b3a'], ground: '#6b4a2f' },
  { name: 'Kitchen', from: 1200, to: 1800, sky: ['#f7c873', '#c96f3f'], ground: '#8a5a34' },
];

export const TURKEY = {
  x: 300,
  width: 74,
  height: 62,
  slideHeight: 34,
  /** Base running speed; holding right sprints, holding left dawdles. */
  speed: 300,
  sprint: 420,
  dawdle: 190,
  jumpVelocity: -880,
  flapVelocity: -640,
  gravity: 2100,
  /** Seconds of mercy after a hit before another can land. */
  invulnerable: 1.6,
};

export const FARMER = {
  /** Gap in pixels between the farmer and the turkey at the start of a run. */
  startGap: 300,
  maxGap: 430,
  /** Gap lost on every stumble, and gained while sprinting or dashing. */
  stumbleLoss: 85,
  dashGain: 55,
  /** Gap the farmer claws back each second the turkey dawdles. */
  dawdleLossPerSecond: 26,
  cleanGainPerSecond: 7,
};

export const LIVES = 3;

export const DASH = { seconds: 0.35, cooldown: 2.0, speed: 560 };

/** Seconds of play before the next stage's spawns get denser. */
export const DIFFICULTY = { spawnStart: 1.35, spawnEnd: 0.75, minGapPx: 330 };

export const POINTS = { corn: 10, goldCorn: 50, metre: 1, stageBonus: 250, escapeBonus: 1000 };

export const PALETTE = {
  text: '#fff7e8',
  muted: '#ffe9bd',
  dark: '#3a2415',
  panel: 'rgba(58, 36, 21, 0.82)',
  panelEdge: '#ffb347',
  heart: '#ff5a5a',
  heartEmpty: 'rgba(255,255,255,0.25)',
  gapGood: '#7ee081',
  gapBad: '#ff5a5a',
  corn: '#ffd94d',
  gold: '#ffb700',
  feather: '#ffffff',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#5a3a22',
  ovenBody: '#4a4a55',
  ovenDoor: '#2c2c34',
  flame: '#ff8c1a',
  turkeyBody: '#8a5a2e',
  turkeyDark: '#6b4423',
  turkeyTail: ['#b5651d', '#d2691e', '#e8a33c', '#a0522d', '#c96f2e'],
  turkeyHead: '#e8ecf2',
  turkeyWattle: '#e5534b',
  turkeyBeak: '#ffb347',
  farmerShirt: '#4a7ec2',
  farmerOveralls: '#3a5a8a',
  farmerHat: '#d9b36a',
  farmerSkin: '#e8b98a',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-run.best';

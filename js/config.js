export const PHYSICS = {
  GRAVITY: 980,
  MAX_VELOCITY: 1200,
  FRICTION: 0.98,
  JUMP_FORCE: 450,
  DETACH_SLOPE_THRESHOLD: -1.2,
  LANDING_ANGLE_TOLERANCE: 0.4,
  LANDING_IMPACT_DEATH: 800,
  AIRTIME_DEATH_SECONDS: 4,
};

export const CAMERA = {
  LOOKAHEAD_POINTS: 30,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.0,
  ZOOM_SPEED: 0.02,
  VERTICAL_OFFSET: 0.3,
};

export const RENDERING = {
  LINE_WIDTH: 3,
  PARALLAX_STRENGTH: 0.15,
  MOBILE_PARALLAX: false,
  TERRAIN_WIDTH: 10000,
  TERRAIN_HEIGHT: 1000,
  RIDER_SCALE: 50,
  SPLINE_RESOLUTION: 2000,
  MOBILE_SPLINE_RESOLUTION: 500,
};

export const TIMEFRAMES = {
  '1D': { interval: '1m', range: '1d' },
  '1M': { interval: '1d', range: '1mo' },
  '6M': { interval: '1d', range: '6mo' },
  '1Y': { interval: '1d', range: '1y' },
  '5Y': { interval: '1wk', range: '5y' },
};

export const STATES = {
  MENU: 'MENU',
  LOADING: 'LOADING',
  RIDING: 'RIDING',
  DEAD: 'DEAD',
};

export const DIFFICULTY = {
  // Minimum forward speed ramps up as you progress through the terrain
  BASE_MIN_SPEED: 30,
  MAX_MIN_SPEED: 200,

  // Constant forward push (acceleration px/s²) that increases with progress
  SPEED_BOOST_START: 0,
  SPEED_BOOST_END: 180,

  // Landing angle tolerance tightens as you progress (radians)
  LANDING_TOLERANCE_START: 0.4,
  LANDING_TOLERANCE_END: 0.22,
};

export const RIDER_STATES = {
  ON_TERRAIN: 'ON_TERRAIN',
  AIRBORNE: 'AIRBORNE',
  DEAD: 'DEAD',
};

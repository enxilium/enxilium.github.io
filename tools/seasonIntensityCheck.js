const { MathUtils, Color } = require('three');

const FOREST_MAX_DISTANCE = 1150;
const SPRING_ONLY_END = 200;
const SPRING_SUMMER_TRANSITION_END = 300;
const SUMMER_ONLY_END = 500;
const SUMMER_AUTUMN_TRANSITION_END = 600;
const AUTUMN_ONLY_END = 800;
const AUTUMN_WINTER_TRANSITION_END = 900;
const SEASON_TRANSITION_BIAS = 1.55;

const HORIZON_Z = -FOREST_MAX_DISTANCE - 120;
const createHorizonPosition = (xOffset = 0, height = 18, depthOffset = 0) => [
  xOffset,
  height,
  HORIZON_Z + depthOffset,
];

const DEFAULT_SUN_POSITION = createHorizonPosition(0, 128, 60);
const DEFAULT_MOON_POSITION = createHorizonPosition(0, 138, 52);
const DEFAULT_SUN_ORBIT = {
  center: [0, 130],
  radius: 48,
  depth: HORIZON_Z + 42,
  phaseOffset: MathUtils.degToRad(-40),
  clockwise: false,
  duration: 110,
};
const DEFAULT_MOON_ORBIT = {
  center: [0, 140],
  radius: 52,
  depth: HORIZON_Z + 44,
  phaseOffset: MathUtils.degToRad(140),
  clockwise: false,
  duration: 110,
};

const SEASONS = [
  {
    key: 'spring',
    snowIntensity: 0,
    rainIntensity: 0.36,
    petalIntensity: 0,
    leafIntensity: 0,
  },
  {
    key: 'summer',
    snowIntensity: 0,
    rainIntensity: 0,
    petalIntensity: 0.78,
    leafIntensity: 0,
  },
  {
    key: 'autumn',
    snowIntensity: 0,
    rainIntensity: 0,
    petalIntensity: 0,
    leafIntensity: 0.9,
  },
  {
    key: 'winter',
    snowIntensity: 1,
    rainIntensity: 0,
    petalIntensity: 0,
    leafIntensity: 0,
  },
];

const SEASON_BY_KEY = SEASONS.reduce((map, season) => {
  map[season.key] = season;
  return map;
}, {});

const lerpNumber = (from, to, t) => from + (to - from) * t;
const lerpVector = (from = [0, 0, 0], to = [0, 0, 0], t) => {
  if (t <= 0) return [...from];
  if (t >= 1) return [...to];
  const length = Math.min(from.length, to.length);
  return Array.from({ length }, (_, index) => lerpNumber(from[index] ?? 0, to[index] ?? 0, t));
};

const getSeasonBlend = (distance) => {
  const clamped = MathUtils.clamp(distance, 0, FOREST_MAX_DISTANCE);
  const createResult = (currentKey, nextKey, progress = 0) => ({
    current: SEASON_BY_KEY[currentKey],
    next: SEASON_BY_KEY[nextKey],
    progress,
  });

  if (clamped < SPRING_ONLY_END) return createResult('spring', 'spring', 0);
  if (clamped < SPRING_SUMMER_TRANSITION_END) {
    const t = (clamped - SPRING_ONLY_END) / (SPRING_SUMMER_TRANSITION_END - SPRING_ONLY_END);
    return createResult('spring', 'summer', MathUtils.smootherstep(t, 0, 1));
  }
  if (clamped < SUMMER_ONLY_END) return createResult('summer', 'summer', 0);
  if (clamped < SUMMER_AUTUMN_TRANSITION_END) {
    const t = (clamped - SUMMER_ONLY_END) / (SUMMER_AUTUMN_TRANSITION_END - SUMMER_ONLY_END);
    return createResult('summer', 'autumn', MathUtils.smootherstep(t, 0, 1));
  }
  if (clamped < AUTUMN_ONLY_END) return createResult('autumn', 'autumn', 0);
  if (clamped < AUTUMN_WINTER_TRANSITION_END) {
    const t = (clamped - AUTUMN_ONLY_END) / (AUTUMN_WINTER_TRANSITION_END - AUTUMN_ONLY_END);
    return createResult('autumn', 'winter', MathUtils.smootherstep(t, 0, 1));
  }
  return createResult('winter', 'winter', 0);
};

const computePalette = (distance) => {
  const { current, next, progress } = getSeasonBlend(distance);

  if (current.key === next.key) {
    return { ...current, key: current.key, progress };
  }

  const mixSeasonalIntensity = (a = 0, b = 0) => {
    if (progress <= 0) return a ?? 0;
    if (progress >= 1) return b ?? 0;
    if ((a ?? 0) === (b ?? 0)) return a ?? 0;
    const increasing = (b ?? 0) > (a ?? 0);
    const biasedProgress = increasing
      ? Math.pow(progress, 1 / SEASON_TRANSITION_BIAS)
      : Math.pow(progress, SEASON_TRANSITION_BIAS);
    return lerpNumber(a ?? 0, b ?? 0, MathUtils.clamp(biasedProgress, 0, 1));
  };

  return {
    snowIntensity: mixSeasonalIntensity(current.snowIntensity, next.snowIntensity),
    rainIntensity: mixSeasonalIntensity(current.rainIntensity ?? 0, next.rainIntensity ?? 0),
    petalIntensity: mixSeasonalIntensity(current.petalIntensity ?? 0, next.petalIntensity ?? 0),
    leafIntensity: mixSeasonalIntensity(current.leafIntensity ?? 0, next.leafIntensity ?? 0),
  };
};

const distances = [0, 199, 250, 400, 550, 650, 850, 950, 1075];
for (const d of distances) {
  console.log(d, computePalette(d));
}

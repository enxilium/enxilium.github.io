import { Color, MathUtils } from "three";

export const clamp01 = (value) => MathUtils.clamp(value, 0, 1);

export const TAU = Math.PI * 2;
export const CELESTIAL_CENTER_X = 0;
export const CELESTIAL_HORIZON_Y = 72;
export const CELESTIAL_ORBIT_RADIUS = 54;
export const CELESTIAL_ORBIT_CENTER_Y = CELESTIAL_HORIZON_Y + 46;
export const CELESTIAL_FADE_START = CELESTIAL_HORIZON_Y + 16;
export const CELESTIAL_FADE_END = CELESTIAL_HORIZON_Y;
export const CELESTIAL_HORIZON_ANGLE = Math.asin(
  MathUtils.clamp((CELESTIAL_FADE_END - CELESTIAL_ORBIT_CENTER_Y) / CELESTIAL_ORBIT_RADIUS, -1, 1)
);
export const SUN_FADE_IN_START = 0.16;
export const SUN_FADE_IN_END = 0.27;
export const SUN_FADE_OUT_START = 0.7;
export const SUN_FADE_OUT_END = 0.86;
export const SUN_ANGLE_ANCHORS = [
  { progress: 0, angle: -Math.PI / 2 },
  { progress: 0.18, angle: CELESTIAL_HORIZON_ANGLE },
  { progress: 0.25, angle: Math.PI / 2 },
  { progress: 0.55, angle: Math.PI / 2 },
  { progress: 0.72, angle: CELESTIAL_HORIZON_ANGLE + Math.PI },
  { progress: 0.86, angle: (3 * Math.PI) / 2 },
  { progress: 1, angle: -Math.PI / 2 + TAU },
];
export const SUN_DOMINANCE_THRESHOLD = 0.48;
export const SUN_ALTITUDE_WEIGHT = 0.85;
export const HORIZON_EXCLUSION_MARGIN = 2.2;

const lerpColor = (from, to, t) => {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const color = new Color(from);
  return color.lerp(new Color(to), t).getStyle();
};

export const getSunAngleForProgress = (progress) => {
  if (!Array.isArray(SUN_ANGLE_ANCHORS) || SUN_ANGLE_ANCHORS.length === 0) {
    return -Math.PI / 2;
  }

  const normalized = clamp01(progress ?? 0);

  if (normalized <= SUN_ANGLE_ANCHORS[0].progress) {
    return SUN_ANGLE_ANCHORS[0].angle;
  }

  for (let index = 0; index < SUN_ANGLE_ANCHORS.length - 1; index += 1) {
    const start = SUN_ANGLE_ANCHORS[index];
    const end = SUN_ANGLE_ANCHORS[index + 1];

    if (normalized <= end.progress) {
      const range = Math.max(end.progress - start.progress, 0.0001);
      const rawT = (normalized - start.progress) / range;
      const eased = MathUtils.smootherstep(rawT, 0, 1);
      return MathUtils.lerp(start.angle, end.angle, eased);
    }
  }

  const last = SUN_ANGLE_ANCHORS[SUN_ANGLE_ANCHORS.length - 1];
  return last.angle;
};

export const getOrbitPositionForAngle = (angle, depth) => [
  CELESTIAL_CENTER_X + Math.cos(angle) * CELESTIAL_ORBIT_RADIUS,
  CELESTIAL_ORBIT_CENTER_Y + Math.sin(angle) * CELESTIAL_ORBIT_RADIUS,
  depth,
];

export const computeSunActivation = (progress) => {
  const t = clamp01(progress ?? 0);
  const fadeIn = MathUtils.clamp(MathUtils.smootherstep(t, SUN_FADE_IN_START, SUN_FADE_IN_END), 0, 1);
  const fadeOut = 1 - MathUtils.clamp(MathUtils.smootherstep(t, SUN_FADE_OUT_START, SUN_FADE_OUT_END), 0, 1);
  return clamp01(fadeIn * fadeOut);
};

export const computeMoonActivation = (sunActivation, sunVisibility = 1, sunAltitude = CELESTIAL_FADE_END) => {
  const effectiveSunVisibility = clamp01(sunVisibility ?? 0);
  const sunPresence = clamp01((sunActivation ?? 0) * effectiveSunVisibility);
  const altitudeSpan = Math.max(CELESTIAL_FADE_START - CELESTIAL_FADE_END, 0.0001);
  const altitudePresence = clamp01(((sunAltitude ?? CELESTIAL_FADE_END) - CELESTIAL_FADE_END) / altitudeSpan);
  const dominance = Math.max(sunPresence, altitudePresence * SUN_ALTITUDE_WEIGHT);

  if (dominance >= SUN_DOMINANCE_THRESHOLD) {
    return 0;
  }

  const release = clamp01((SUN_DOMINANCE_THRESHOLD - dominance) / SUN_DOMINANCE_THRESHOLD);
  if (release <= 0) {
    return 0;
  }

  return Math.pow(MathUtils.smootherstep(release, 0, 1), 1.08);
};

const createCelestialBody = (type, season, angle, activation, depth, positionOverride) => {
  const visibilityKey = `${type}Visibility`;
  const sizeKey = `${type}Size`;
  const colorKey = `${type}Color`;
  const glowKey = `${type}GlowColor`;

  const baseVisibility = clamp01(season?.[visibilityKey] ?? 0);
  if (baseVisibility <= 0.0005 || activation <= 0.001) {
    return null;
  }

  const size = season?.[sizeKey] ?? (type === "sun" ? 11 : 9);
  const baseColor = season?.[colorKey] ?? (type === "sun" ? "#ffd27f" : "#e5ecff");
  const baseGlowColor = season?.[glowKey] ?? baseColor;
  const position = positionOverride ?? getOrbitPositionForAngle(angle, depth);
  const fadeRange = Math.max(CELESTIAL_FADE_START - CELESTIAL_FADE_END, 0.0001);
  const altitudeFactor = clamp01((position[1] - CELESTIAL_FADE_END) / fadeRange);
  const opacity = baseVisibility * activation * altitudeFactor;

  if (opacity <= 0.001) {
    return null;
  }

  const skyLowColor = season?.skyBottomColor ?? season?.backgroundColor ?? baseColor;
  const skyHighColor = season?.skyTopColor ?? season?.backgroundColor ?? skyLowColor;
  const altitudeBlend = Math.pow(altitudeFactor, type === "sun" ? 0.82 : 0.68);
  const glowBlend = Math.pow(altitudeFactor, type === "sun" ? 0.76 : 0.6);
  const horizonBlendPivot = lerpColor(skyLowColor, skyHighColor, Math.pow(altitudeFactor, 0.72));
  const color = lerpColor(skyLowColor, baseColor, altitudeBlend);
  const glowColor = lerpColor(horizonBlendPivot, baseGlowColor, glowBlend);

  return {
    position,
    radius: size,
    opacity,
    color,
    glowColor,
  };
};

export const computeCelestialState = (season, travelProgress = 0, { orbitDepth } = {}) => {
  const safeSeason = season ?? {};
  const normalizedTravel = clamp01(travelProgress ?? 0);
  const sunAngle = getSunAngleForProgress(normalizedTravel);
  const depth = typeof orbitDepth === "number" ? orbitDepth : 0;
  const sunPosition = getOrbitPositionForAngle(sunAngle, depth);
  const moonAngle = sunAngle + Math.PI;
  const moonPosition = getOrbitPositionForAngle(moonAngle, depth);
  const sunActivation = computeSunActivation(normalizedTravel);
  const moonActivation = computeMoonActivation(
    sunActivation,
    safeSeason.sunVisibility,
    sunPosition?.[1]
  );

  let sun = createCelestialBody("sun", safeSeason, sunAngle, sunActivation, depth, sunPosition);
  let moon = createCelestialBody("moon", safeSeason, moonAngle, moonActivation, depth, moonPosition);

  if (sun && moon) {
    const sunAbove = sun.position[1] > CELESTIAL_FADE_END + HORIZON_EXCLUSION_MARGIN && sun.opacity > 0.015;
    const moonAbove = moon.position[1] > CELESTIAL_FADE_END + HORIZON_EXCLUSION_MARGIN && moon.opacity > 0.015;

    if (sunAbove && moonAbove) {
      if (sun.opacity >= moon.opacity) {
        moon = null;
      } else {
        sun = null;
      }
    } else if (sunAbove && !moonAbove) {
      moon = null;
    } else if (moonAbove && !sunAbove) {
      sun = null;
    }
  }

  return {
    sun,
    moon,
  };
};

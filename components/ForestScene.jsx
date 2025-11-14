"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { AdaptiveDpr, PerspectiveCamera, Sparkles, useGLTF } from "@react-three/drei";
import Link from "next/link";
import Socials from "@/components/Socials";
import {
  AdditiveBlending,
  NormalBlending,
  BufferAttribute,
  BufferGeometry,
  Box3,
  CanvasTexture,
  Color,
  DynamicDrawUsage,
  Euler,
  Float32BufferAttribute,
  FogExp2,
  MathUtils,
  Quaternion,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
} from "three";
import { FOREST_MAX_DISTANCE, FOREST_SCROLL_LIMIT, FOREST_RETURN_STORAGE_KEY, useSceneController } from "@/context/SceneContext";
import { MODEL_BASE_PATH, ROAD_MODEL_FILE } from "@/lib/forestAssets";
import { clamp01, computeCelestialState } from "@/lib/celestial";
import { EXPERIENCES, EXPERIENCE_LINKS } from "@/lib/experiences";
import { PROJECTS, PROJECT_LINKS } from "@/lib/projects";

const ROAD_LENGTH = FOREST_MAX_DISTANCE;
const WORLD_UNITS_PER_METER = ROAD_LENGTH / Math.max(FOREST_MAX_DISTANCE, 1);
const CAMERA_TRAVEL_SCALE = WORLD_UNITS_PER_METER;
const CAMERA_BASE_Z = -18;
const CAMERA_BASE_HEIGHT = 1.82;
const CAMERA_BASE_PITCH = MathUtils.degToRad(-4);
const CAMERA_YAW_RANGE = MathUtils.degToRad(20);
const CAMERA_PITCH_RANGE = MathUtils.degToRad(12);
const CAMERA_POINTER_RESPONSE = 8.2;
const CAMERA_POSITION_RESPONSE = 6.2;
const CAMERA_ROTATION_RESPONSE = 7.1;
const BOBBING_FREQUENCY = 0.55;
const BOBBING_AMPLITUDE = 0.02;
const POINTER_LIMIT_X = 0.85;
const POINTER_LIMIT_Y = 0.75;
const ROAD_HORIZON_PADDING = 120;
const HORIZON_Z = -ROAD_LENGTH - ROAD_HORIZON_PADDING;
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

const CELESTIAL_ORBIT_DEPTH = HORIZON_Z + 44;
const MAX_SNOW_PARTICLES = 680;
const MAX_RAIN_PARTICLES = 920;
const MAX_PETAL_PARTICLES = 640;
const MAX_LEAF_PARTICLES = 660;
const SHOOTING_STAR_POOL = 24;
const MIN_SEASONAL_INTENSITY = {
  petals: 0.35,
  leaves: 0.42,
  snow: 0.45,
};

const RESUME_DOWNLOAD_PATH = "/JaceMu_Resume7.pdf";

const colorToRgba = (value, alpha = 1) => {
  const color = value instanceof Color ? value : new Color(value ?? "#ffffff");
  const r = Math.round(MathUtils.clamp(color.r, 0, 1) * 255);
  const g = Math.round(MathUtils.clamp(color.g, 0, 1) * 255);
  const b = Math.round(MathUtils.clamp(color.b, 0, 1) * 255);
  return `rgba(${r}, ${g}, ${b}, ${MathUtils.clamp(alpha, 0, 1)})`;
};

const adjustColor = (value, saturationDelta = 0, lightnessDelta = 0) => {
  const color = value instanceof Color ? value.clone() : new Color(value ?? "#ffffff");
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  hsl.s = MathUtils.clamp(hsl.s + saturationDelta, 0, 1);
  hsl.l = MathUtils.clamp(hsl.l + lightnessDelta, 0, 1);
  color.setHSL(hsl.h, hsl.s, hsl.l);
  return color;
};

const seededRandom = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const createCanvasTexture = (size, painter) => {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  painter(ctx, size);
  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.flipY = false;
  texture.anisotropy = 8;
  return texture;
};

const createSunTextures = (coreColor, glowColor) => {
  const coreTexture = createCanvasTexture(512, (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.46;

    const baseGradient = ctx.createRadialGradient(cx, cy, size * 0.08, cx, cy, radius);
    baseGradient.addColorStop(0, colorToRgba(adjustColor(coreColor, 0.05, 0.18), 1));
    baseGradient.addColorStop(0.45, colorToRgba(coreColor, 0.95));
    baseGradient.addColorStop(0.75, colorToRgba(adjustColor(coreColor, -0.08, -0.06), 0.85));
    baseGradient.addColorStop(1, colorToRgba(adjustColor(coreColor, -0.12, -0.22), 0.8));

    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.08 + (i % 2) * 0.03;
      const streakGradient = ctx.createRadialGradient(0, 0, size * 0.05, 0, 0, radius * 0.75);
      streakGradient.addColorStop(0, colorToRgba(adjustColor(coreColor, 0.08, 0.25), 0.55));
      streakGradient.addColorStop(1, colorToRgba(coreColor, 0));
      ctx.fillStyle = streakGradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.82, radius * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.globalAlpha = 0.3;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 24; i += 1) {
      const rand = seededRandom(i + 1);
      const angle = rand * Math.PI * 2;
      const dist = seededRandom((i + 1) * 2) * radius * 0.85;
      const px = cx + Math.cos(angle) * dist;
      const py = cy + Math.sin(angle) * dist;
      const sparkleRadius = size * (0.008 + seededRandom((i + 1) * 3) * 0.022);
      const sparkle = ctx.createRadialGradient(px, py, 0, px, py, sparkleRadius);
      sparkle.addColorStop(0, colorToRgba("#ffffff", 0.7));
      sparkle.addColorStop(1, colorToRgba(coreColor, 0));
      ctx.fillStyle = sparkle;
      ctx.beginPath();
      ctx.arc(px, py, sparkleRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
  });

  const glowTexture = createCanvasTexture(512, (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.48;
    const gradient = ctx.createRadialGradient(cx, cy, size * 0.12, cx, cy, radius);
    gradient.addColorStop(0, colorToRgba(glowColor, 0.42));
    gradient.addColorStop(0.35, colorToRgba(glowColor, 0.26));
    gradient.addColorStop(0.65, colorToRgba(glowColor, 0.12));
    gradient.addColorStop(1, colorToRgba(glowColor, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });

  const flareTexture = createCanvasTexture(512, (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.48;
    const radial = ctx.createRadialGradient(cx, cy, size * 0.05, cx, cy, radius);
    radial.addColorStop(0, colorToRgba(adjustColor(glowColor, 0.08, 0.18), 0.28));
    radial.addColorStop(0.6, colorToRgba(glowColor, 0.12));
    radial.addColorStop(1, colorToRgba(glowColor, 0));
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, size, size);

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.14;
    for (let i = 0; i < 4; i += 1) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((i * Math.PI) / 4);
      const flareGradient = ctx.createLinearGradient(-radius, 0, radius, 0);
      flareGradient.addColorStop(0, colorToRgba(glowColor, 0));
      flareGradient.addColorStop(0.45, colorToRgba(glowColor, 0.35));
      flareGradient.addColorStop(0.55, colorToRgba("#ffffff", 0.4));
      flareGradient.addColorStop(1, colorToRgba(glowColor, 0));
      ctx.fillStyle = flareGradient;
      ctx.fillRect(-radius, -radius * 0.08, radius * 2, radius * 0.16);
      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  });

  return {
    coreTexture,
    glowTexture,
    flareTexture,
  };
};

const createMoonTextures = (baseColor, glowColor) => {
  const coreTexture = createCanvasTexture(512, (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.46;

    const primaryGradient = ctx.createRadialGradient(cx - size * 0.08, cy - size * 0.12, size * 0.1, cx, cy, radius);
    primaryGradient.addColorStop(0, colorToRgba(adjustColor(baseColor, -0.04, 0.22), 1));
    primaryGradient.addColorStop(0.45, colorToRgba(baseColor, 0.98));
    primaryGradient.addColorStop(0.78, colorToRgba(adjustColor(baseColor, 0.02, -0.12), 0.95));
    primaryGradient.addColorStop(1, colorToRgba(adjustColor(baseColor, -0.08, -0.28), 0.92));
    ctx.fillStyle = primaryGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "multiply";
    const shadowGradient = ctx.createRadialGradient(cx + size * 0.22, cy + size * 0.04, size * 0.08, cx + size * 0.22, cy + size * 0.04, radius * 1.05);
    shadowGradient.addColorStop(0, colorToRgba("#1d2735", 0));
    shadowGradient.addColorStop(0.35, colorToRgba("#1d2735", 0.25));
    shadowGradient.addColorStop(0.8, colorToRgba("#0b111d", 0.7));
    shadowGradient.addColorStop(1, colorToRgba("#05070c", 0.85));
    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    const highlight = ctx.createRadialGradient(cx - size * 0.2, cy - size * 0.18, size * 0.02, cx - size * 0.2, cy - size * 0.18, radius * 0.75);
    highlight.addColorStop(0, colorToRgba("#ffffff", 0.7));
    highlight.addColorStop(1, colorToRgba(baseColor, 0));
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.85;
    const craterConfigs = [
      { seed: 1.2, size: 0.08 },
      { seed: 2.8, size: 0.06 },
      { seed: 4.4, size: 0.05 },
      { seed: 5.6, size: 0.04 },
      { seed: 7.1, size: 0.045 },
      { seed: 8.8, size: 0.035 },
      { seed: 9.6, size: 0.05 },
      { seed: 11.3, size: 0.04 },
      { seed: 13.7, size: 0.032 },
      { seed: 15.9, size: 0.028 },
    ];

    craterConfigs.forEach(({ seed, size: craterScale }, index) => {
      const rand = seededRandom(seed + index);
      const angle = rand * Math.PI * 2;
      const distance = radius * (0.25 + seededRandom(seed * 2.1) * 0.55);
      const craterRadius = radius * craterScale;
      const px = cx + Math.cos(angle) * distance;
      const py = cy + Math.sin(angle) * distance;

      const craterHighlight = ctx.createRadialGradient(px - craterRadius * 0.45, py - craterRadius * 0.35, craterRadius * 0.15, px, py, craterRadius);
      craterHighlight.addColorStop(0, colorToRgba("#ffffff", 0.32));
      craterHighlight.addColorStop(1, colorToRgba(baseColor, 0));

      const craterShadow = ctx.createRadialGradient(px + craterRadius * 0.35, py + craterRadius * 0.25, craterRadius * 0.1, px + craterRadius * 0.35, py + craterRadius * 0.25, craterRadius * 1.1);
      craterShadow.addColorStop(0, colorToRgba("#0d1420", 0.35));
      craterShadow.addColorStop(1, colorToRgba("#000000", 0));

      ctx.globalAlpha = 0.65;
      ctx.fillStyle = craterShadow;
      ctx.beginPath();
      ctx.arc(px, py, craterRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.9;
      ctx.fillStyle = craterHighlight;
      ctx.beginPath();
      ctx.arc(px, py, craterRadius * 0.92, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  });

  const glowTexture = createCanvasTexture(512, (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.45;
    const gradient = ctx.createRadialGradient(cx, cy, size * 0.1, cx, cy, radius);
    gradient.addColorStop(0, colorToRgba(glowColor, 0.24));
    gradient.addColorStop(0.45, colorToRgba(glowColor, 0.16));
    gradient.addColorStop(0.8, colorToRgba(glowColor, 0.06));
    gradient.addColorStop(1, colorToRgba(glowColor, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  });

  const rimTexture = createCanvasTexture(512, (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.46;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    const rimGradient = ctx.createRadialGradient(cx - size * 0.12, cy - size * 0.18, radius * 0.65, cx, cy, radius * 1.02);
    rimGradient.addColorStop(0, colorToRgba("#ffffff", 0));
    rimGradient.addColorStop(0.6, colorToRgba("#e2f0ff", 0.18));
    rimGradient.addColorStop(1, colorToRgba(glowColor, 0));
    ctx.fillStyle = rimGradient;
    ctx.fill();
  });

  return {
    coreTexture,
    glowTexture,
    rimTexture,
  };
};

const QUALITY_PRESETS = {
  low: {
    label: "Low",
    fireflyCount: 0,
    starCount: 180,
    enableShadows: false,
    shadowResolution: 1024,
    shadowCameraFar: 58,
    pointerLook: false,
    enableBobbing: false,
    fogDensity: 0.032,
    maxDpr: 1,
    mainLightIntensity: 0.58,
    secondaryLightIntensity: 0,
    hemisphereIntensity: 0.28,
    ambientIntensity: 0.12,
    secondaryLightColor: 0x193654,
  },
  medium: {
    label: "Medium",
    fireflyCount: 48,
    starCount: 420,
    enableShadows: true,
    shadowResolution: 1536,
    shadowCameraFar: 64,
    pointerLook: true,
    enableBobbing: false,
    fogDensity: 0.04,
    maxDpr: 1.35,
    mainLightIntensity: 0.78,
    secondaryLightIntensity: 0.18,
    hemisphereIntensity: 0.32,
    ambientIntensity: 0.16,
    secondaryLightColor: 0x193654,
  },
  high: {
    label: "High",
    fireflyCount: 110,
    starCount: 640,
    enableShadows: true,
    shadowResolution: 2048,
    shadowCameraFar: 70,
    pointerLook: true,
    enableBobbing: true,
    fogDensity: 0.045,
    maxDpr: 1.75,
    mainLightIntensity: 0.9,
    secondaryLightIntensity: 0.25,
    hemisphereIntensity: 0.35,
    ambientIntensity: 0.18,
    secondaryLightColor: 0x193654,
  },
};

const SPRING_ONLY_END = 200;
const SPRING_SUMMER_TRANSITION_END = 300;
const SUMMER_ONLY_END = 500;
const SUMMER_AUTUMN_TRANSITION_END = 600;
const AUTUMN_ONLY_END = 800;
const AUTUMN_WINTER_TRANSITION_END = 900;
const SEASON_TRANSITION_BIAS = 1.55;

const EXPERIENCE_BLURBS = EXPERIENCES.map((experience) => {
  const marker = experience.marker ?? {};
  const href = EXPERIENCE_LINKS[experience.id] ?? null;

  return {
    id: experience.id,
    type: "experience",
    distance: marker.distance ?? FOREST_MAX_DISTANCE,
    alignment: marker.alignment ?? "left",
    height: marker.height ?? 3.6,
    tag: experience.tag ?? "Experience",
    title: experience.title,
    subtitle: experience.subtitle,
    body: experience.body,
    href,
    ctaLabel: href ? experience.ctaLabel ?? "Check it Out" : null,
  };
});

const PROJECT_BLURBS = PROJECTS.map((project) => {
  const href = PROJECT_LINKS[project.slug] ?? null;

  return {
    id: `project-${project.slug}`,
    type: "project",
    distance: project.feature?.distance ?? FOREST_MAX_DISTANCE,
    alignment: project.feature?.alignment ?? "right",
    height: project.feature?.height ?? 3.6,
    tag: "Project",
    title: project.title,
    subtitle: project.timeframe,
    body: project.feature?.body ?? project.summary,
    href,
    ctaLabel: href ? "Open project" : null,
  };
});

const EDUCATION_BLURB = {
  id: "uoft-hbsc",
  distance: 1000,
  alignment: "right",
  height: 3.8,
  tag: "Education",
  title: "University of Toronto · Honours B.Sc.",
  subtitle: "Computer Science Major · Mathematics & Statistics Minors",
  body: "Maintaining a 4.00/4.00 GPA across enriched theory, algorithms, and software design while building AI-first products.",
  persistUntilEnd: true,
};

const BLURB_DATA = [...EXPERIENCE_BLURBS, ...PROJECT_BLURBS, EDUCATION_BLURB]
  .filter(Boolean)
  .sort((a, b) => a.distance - b.distance);

const BLURB_LEAD_IN_DISTANCE = 110;
const BLURB_FALLOFF_DISTANCE = 85;

const computeBlurbActivation = (markerDistance, currentDistance) => {
  const distanceAhead = markerDistance - currentDistance;
  const approaching = distanceAhead >= 0;
  const influenceRange = approaching ? BLURB_LEAD_IN_DISTANCE : BLURB_FALLOFF_DISTANCE;
  const proximity = 1 - MathUtils.clamp(Math.abs(distanceAhead) / influenceRange, 0, 1);
  const smoothed = MathUtils.clamp(MathUtils.smootherstep(proximity, 0, 1), 0, 1);
  const eased = Math.pow(smoothed, approaching ? 0.88 : 1.2);
  const priority = approaching ? eased * 1.18 + proximity * 0.08 : eased * 0.82;

  return {
    distanceAhead,
    proximity,
    eased,
    priority,
  };
};

const SEASONS = [
  {
    key: "spring",
    label: "Spring",
    backgroundColor: "#050b17",
    fogColor: "#0b162b",
    groundColor: "#0a221a",
    roadColor: "#1b262d",
    roadRimColor: "#f4ffe0",
    starColor: "#dcecff",
    moonColor: "#fef9e8",
    ambientColor: "#7f93d4",
    hemisphereSkyColor: "#253a63",
    hemisphereGroundColor: "#101f19",
    mainLightColor: "#f5d6a4",
    secondaryLightColor: "#1a4f6e",
    mainLightIntensityMultiplier: 0.58,
    ambientIntensityMultiplier: 0.62,
    hemisphereIntensityMultiplier: 0.68,
    secondaryLightIntensityMultiplier: 0.52,
    fogDensityMultiplier: 1.2,
    skyTopColor: "#091638",
    skyBottomColor: "#030913",
    starVisibility: 1,
    moonVisibility: 1,
    sunVisibility: 0.01,
    sunColor: "#f6d0a0",
    sunGlowColor: "#e9a76a",
    sunSize: 6.5,
    sunPosition: createHorizonPosition(0, 132, 56),
    sunOrbit: {
      center: [0, 126],
      radius: 42,
      depth: HORIZON_Z + 40,
      phaseOffset: MathUtils.degToRad(-65),
      clockwise: false,
    },
    moonGlowColor: "#dfe8ff",
    moonSize: 9.5,
    moonPosition: createHorizonPosition(0, 148, 48),
    moonOrbit: {
      center: [0, 140],
      radius: 48,
      depth: HORIZON_Z + 42,
      phaseOffset: MathUtils.degToRad(90),
      clockwise: false,
    },
  snowIntensity: 0,
  rainIntensity: 0.36,
  petalIntensity: 0,
  leafIntensity: 0,
    shootingStarRate: 0.56,
    shootingStarColor: "#9fd4ff",
    firefly: {
      base: "#8dfcd5",
      accent: "#b5ffe9",
      lightIntensity: 0.78,
      flareOpacity: 0.75,
      lightDistance: 3.6,
    },
    milestone: {
      panelBase: "#7ceee2",
      panelReached: "#dffef5",
      emissiveBase: "#4bc7b3",
      emissiveReached: "#9fffd6",
      textBase: "#082224",
      textReached: "#0a1a1a",
      outline: "#72f5d8",
      ringBase: "#65e4d1",
      ringReached: "#b1ffe5",
      standColor: "#0b1f2b",
      standEmissive: "#1e7563",
    },
    hudAccent: "#9dfde2",
  },
  {
    key: "summer",
    label: "Summer",
    backgroundColor: "#98d6ff",
    fogColor: "#c3e4ff",
    groundColor: "#0f3136",
    roadColor: "#223239",
    roadRimColor: "#fff0c1",
    starColor: "#f7fbff",
    moonColor: "#fff2d6",
    ambientColor: "#d0e7ff",
    hemisphereSkyColor: "#4f79a8",
    hemisphereGroundColor: "#27423a",
    mainLightColor: "#ffe2aa",
    secondaryLightColor: "#2a6ca8",
    mainLightIntensityMultiplier: 1.38,
    ambientIntensityMultiplier: 1.28,
    hemisphereIntensityMultiplier: 1.22,
    secondaryLightIntensityMultiplier: 1,
    fogDensityMultiplier: 0.65,
    skyTopColor: "#74c0ff",
    skyBottomColor: "#fdf7f2",
    starVisibility: 0.05,
    moonVisibility: 0,
    sunVisibility: 1,
    sunColor: "#fff3bf",
    sunGlowColor: "#ffe7a4",
    sunSize: 12,
    sunPosition: createHorizonPosition(0, 152, 66),
    sunOrbit: {
      center: [0, 146],
      radius: 56,
      depth: HORIZON_Z + 42,
      phaseOffset: 0,
      clockwise: false,
    },
    moonGlowColor: "#fefae8",
    moonSize: 7,
    moonPosition: createHorizonPosition(0, 132, 50),
    moonOrbit: {
      center: [0, 138],
      radius: 54,
      depth: HORIZON_Z + 44,
      phaseOffset: MathUtils.degToRad(150),
      clockwise: false,
    },
    snowIntensity: 0,
    rainIntensity: 0,
  petalIntensity: 0.78,
  leafIntensity: 0,
    shootingStarRate: 0,
    shootingStarColor: "#f7fbff",
    firefly: {
      base: "#ffd563",
      accent: "#ffef9a",
      lightIntensity: 0.82,
      flareOpacity: 0.78,
      lightDistance: 3.9,
    },
    milestone: {
      panelBase: "#ffe9a6",
      panelReached: "#fff7d6",
      emissiveBase: "#f7c05a",
      emissiveReached: "#ffe68a",
      textBase: "#3d2a07",
      textReached: "#2b1700",
      outline: "#ffde7a",
      ringBase: "#ffcc6a",
      ringReached: "#ffe49c",
      standColor: "#2a1705",
      standEmissive: "#b35a12",
    },
    hudAccent: "#ffd873",
  },
  {
    key: "autumn",
    label: "Autumn",
    backgroundColor: "#ff9964",
    fogColor: "#3d1c2a",
    groundColor: "#21160f",
    roadColor: "#2f1e17",
    roadRimColor: "#ffd4a1",
    starColor: "#ffd8bb",
    moonColor: "#ffe0b5",
    ambientColor: "#ffcfaa",
    hemisphereSkyColor: "#5a3b64",
    hemisphereGroundColor: "#23130d",
    mainLightColor: "#ffbe7f",
    secondaryLightColor: "#b6462f",
    mainLightIntensityMultiplier: 1.12,
    ambientIntensityMultiplier: 1.05,
    hemisphereIntensityMultiplier: 1.08,
    secondaryLightIntensityMultiplier: 1.25,
    fogDensityMultiplier: 1.1,
    skyTopColor: "#ff8c5a",
    skyBottomColor: "#3b1a4a",
    starVisibility: 0.35,
    moonVisibility: 0.35,
    sunVisibility: 0.65,
    sunColor: "#ffaf6f",
    sunGlowColor: "#ff8b3d",
    sunSize: 9,
    sunPosition: createHorizonPosition(0, 80, 60),
    sunOrbit: {
      center: [0, 126],
      radius: 58,
      depth: HORIZON_Z + 41,
      phaseOffset: MathUtils.degToRad(80),
      clockwise: false,
    },
    moonGlowColor: "#ffd9b0",
    moonSize: 8.5,
    moonPosition: createHorizonPosition(0, 128, 50),
    moonOrbit: {
      center: [0, 134],
      radius: 52,
      depth: HORIZON_Z + 43,
      phaseOffset: MathUtils.degToRad(170),
      clockwise: false,
    },
  snowIntensity: 0,
  rainIntensity: 0,
  petalIntensity: 0,
  leafIntensity: 0.9,
    shootingStarRate: 0,
    shootingStarColor: "#ffd8bb",
    firefly: {
      base: "#ff9c4f",
      accent: "#ffd0a3",
      lightIntensity: 0.68,
      flareOpacity: 0.7,
      lightDistance: 3.3,
    },
    milestone: {
      panelBase: "#ffb47a",
      panelReached: "#ffd8b3",
      emissiveBase: "#ff8840",
      emissiveReached: "#ffc27c",
      textBase: "#3c1604",
      textReached: "#2a0d02",
      outline: "#ffad68",
      ringBase: "#ff9050",
      ringReached: "#ffc28e",
      standColor: "#301206",
      standEmissive: "#a93a16",
    },
    hudAccent: "#ffb072",
  },
  {
    key: "winter",
    label: "Winter",
    backgroundColor: "#071628",
    fogColor: "#0b2138",
    groundColor: "#0f1e27",
    roadColor: "#1b2530",
    roadRimColor: "#d7ecff",
    starColor: "#c7dcff",
    moonColor: "#e6f4ff",
    ambientColor: "#d9edff",
    hemisphereSkyColor: "#264268",
    hemisphereGroundColor: "#0b1721",
    mainLightColor: "#cfdfff",
    secondaryLightColor: "#4c7fd1",
  mainLightIntensityMultiplier: 0.82,
  ambientIntensityMultiplier: 0.9,
  hemisphereIntensityMultiplier: 0.94,
  secondaryLightIntensityMultiplier: 1.05,
  fogDensityMultiplier: 0.9,
  skyTopColor: "#0c2242",
  skyBottomColor: "#040a14",
  starVisibility: 0.3,
  moonVisibility: 0.9,
  sunVisibility: 0.12,
    sunColor: "#f0f4ff",
    sunGlowColor: "#c6daf9",
    sunSize: 10,
    sunPosition: createHorizonPosition(0, 128, 62),
    sunOrbit: {
      center: [0, 132],
      radius: 50,
      depth: HORIZON_Z + 42,
      phaseOffset: MathUtils.degToRad(-55),
      clockwise: false,
    },
    moonGlowColor: "#cfe6ff",
    moonSize: 8,
    moonPosition: createHorizonPosition(0, 150, 52),
    moonOrbit: {
      center: [0, 146],
      radius: 54,
      depth: HORIZON_Z + 44,
      phaseOffset: MathUtils.degToRad(180),
      clockwise: false,
    },
  snowIntensity: 1,
  rainIntensity: 0,
  petalIntensity: 0,
  leafIntensity: 0,
    shootingStarRate: 0.68,
    shootingStarColor: "#c3e7ff",
    firefly: {
      base: "#7ac7ff",
      accent: "#c1e7ff",
      lightIntensity: 0.7,
      flareOpacity: 0.72,
      lightDistance: 3.8,
    },
    milestone: {
      panelBase: "#9ec9ff",
      panelReached: "#d4ecff",
      emissiveBase: "#6aa6ff",
      emissiveReached: "#b6dcff",
      textBase: "#01152a",
      textReached: "#00101f",
      outline: "#8cc3ff",
      ringBase: "#76b6ff",
      ringReached: "#c1e1ff",
      standColor: "#08131f",
      standEmissive: "#1c4f82",
    },
    hudAccent: "#8cc6ff",
  },
];

const SEASON_BY_KEY = SEASONS.reduce((map, season) => {
  map[season.key] = season;
  return map;
}, {});

const lerpNumber = (from, to, t) => from + (to - from) * t;

const lerpColor = (from, to, t) => {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const color = new Color(from);
  return color.lerp(new Color(to), t).getStyle();
};

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

  if (clamped < SPRING_ONLY_END) {
    return createResult("spring", "spring", 0);
  }

  if (clamped < SPRING_SUMMER_TRANSITION_END) {
    const t = (clamped - SPRING_ONLY_END) / (SPRING_SUMMER_TRANSITION_END - SPRING_ONLY_END);
    const eased = MathUtils.smootherstep(t, 0, 1);
    return createResult("spring", "summer", eased);
  }

  if (clamped < SUMMER_ONLY_END) {
    return createResult("summer", "summer", 0);
  }

  if (clamped < SUMMER_AUTUMN_TRANSITION_END) {
    const t = (clamped - SUMMER_ONLY_END) / (SUMMER_AUTUMN_TRANSITION_END - SUMMER_ONLY_END);
    const eased = MathUtils.smootherstep(t, 0, 1);
    return createResult("summer", "autumn", eased);
  }

  if (clamped < AUTUMN_ONLY_END) {
    return createResult("autumn", "autumn", 0);
  }

  if (clamped < AUTUMN_WINTER_TRANSITION_END) {
    const t = (clamped - AUTUMN_ONLY_END) / (AUTUMN_WINTER_TRANSITION_END - AUTUMN_ONLY_END);
    const eased = MathUtils.smootherstep(t, 0, 1);
    return createResult("autumn", "winter", eased);
  }

  return createResult("winter", "winter", 0);
};

const computeSeasonPalette = (distance) => {
  const { current, next, progress } = getSeasonBlend(distance);

  if (current.key === next.key) {
    return {
      ...current,
      key: current.key,
      label: current.label,
      activeLabel: current.label,
      progress,
      primarySeasonKey: current.key,
      nextSeasonKey: next.key,
      transitionProgress: progress,
    };
  }

  const mixColor = (a, b) => lerpColor(a, b, progress);
  const mixNumber = (a, b) => lerpNumber(a, b, progress);
  const mixVector = (a, b) => lerpVector(a, b, progress);
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
  const activeLabel =
    progress <= 0 || current.key === next.key
      ? current.label
      : progress >= 0.9
        ? next.label
        : `${current.label} → ${next.label}`;

  return {
    key: progress < 0.5 ? current.key : next.key,
    label: progress < 0.5 ? current.label : next.label,
    activeLabel,
    backgroundColor: mixColor(current.backgroundColor, next.backgroundColor),
    fogColor: mixColor(current.fogColor, next.fogColor),
    groundColor: mixColor(current.groundColor, next.groundColor),
    roadColor: mixColor(current.roadColor, next.roadColor),
    roadRimColor: mixColor(current.roadRimColor, next.roadRimColor),
    starColor: mixColor(current.starColor, next.starColor),
    moonColor: mixColor(current.moonColor, next.moonColor),
    moonGlowColor: mixColor(current.moonGlowColor, next.moonGlowColor),
    moonVisibility: mixNumber(current.moonVisibility ?? 0, next.moonVisibility ?? 0),
    moonSize: mixNumber(current.moonSize ?? 8, next.moonSize ?? 8),
    moonPosition: mixVector(current.moonPosition ?? DEFAULT_MOON_POSITION, next.moonPosition ?? DEFAULT_MOON_POSITION),
    moonOrbit: {
      center: mixVector(current.moonOrbit?.center ?? DEFAULT_MOON_ORBIT.center, next.moonOrbit?.center ?? DEFAULT_MOON_ORBIT.center),
      radius: mixNumber(current.moonOrbit?.radius ?? DEFAULT_MOON_ORBIT.radius, next.moonOrbit?.radius ?? DEFAULT_MOON_ORBIT.radius),
      depth: mixNumber(current.moonOrbit?.depth ?? DEFAULT_MOON_ORBIT.depth, next.moonOrbit?.depth ?? DEFAULT_MOON_ORBIT.depth),
      phaseOffset: mixNumber(
        current.moonOrbit?.phaseOffset ?? DEFAULT_MOON_ORBIT.phaseOffset,
        next.moonOrbit?.phaseOffset ?? DEFAULT_MOON_ORBIT.phaseOffset
      ),
      duration: mixNumber(current.moonOrbit?.duration ?? DEFAULT_MOON_ORBIT.duration, next.moonOrbit?.duration ?? DEFAULT_MOON_ORBIT.duration),
      clockwise:
        progress < 0.5
          ? current.moonOrbit?.clockwise ?? DEFAULT_MOON_ORBIT.clockwise
          : next.moonOrbit?.clockwise ?? DEFAULT_MOON_ORBIT.clockwise,
    },
    ambientColor: mixColor(current.ambientColor, next.ambientColor),
    hemisphereSkyColor: mixColor(current.hemisphereSkyColor, next.hemisphereSkyColor),
    hemisphereGroundColor: mixColor(current.hemisphereGroundColor, next.hemisphereGroundColor),
    mainLightColor: mixColor(current.mainLightColor, next.mainLightColor),
    secondaryLightColor: mixColor(current.secondaryLightColor, next.secondaryLightColor),
    skyTopColor: mixColor(current.skyTopColor, next.skyTopColor),
    skyBottomColor: mixColor(current.skyBottomColor, next.skyBottomColor),
    sunColor: mixColor(current.sunColor, next.sunColor),
    sunGlowColor: mixColor(current.sunGlowColor, next.sunGlowColor),
    sunVisibility: mixNumber(current.sunVisibility ?? 0, next.sunVisibility ?? 0),
    sunSize: mixNumber(current.sunSize ?? 8, next.sunSize ?? 8),
    sunPosition: mixVector(current.sunPosition ?? DEFAULT_SUN_POSITION, next.sunPosition ?? DEFAULT_SUN_POSITION),
    sunOrbit: {
      center: mixVector(current.sunOrbit?.center ?? DEFAULT_SUN_ORBIT.center, next.sunOrbit?.center ?? DEFAULT_SUN_ORBIT.center),
      radius: mixNumber(current.sunOrbit?.radius ?? DEFAULT_SUN_ORBIT.radius, next.sunOrbit?.radius ?? DEFAULT_SUN_ORBIT.radius),
      depth: mixNumber(current.sunOrbit?.depth ?? DEFAULT_SUN_ORBIT.depth, next.sunOrbit?.depth ?? DEFAULT_SUN_ORBIT.depth),
      phaseOffset: mixNumber(
        current.sunOrbit?.phaseOffset ?? DEFAULT_SUN_ORBIT.phaseOffset,
        next.sunOrbit?.phaseOffset ?? DEFAULT_SUN_ORBIT.phaseOffset
      ),
      duration: mixNumber(current.sunOrbit?.duration ?? DEFAULT_SUN_ORBIT.duration, next.sunOrbit?.duration ?? DEFAULT_SUN_ORBIT.duration),
      clockwise:
        progress < 0.5
          ? current.sunOrbit?.clockwise ?? DEFAULT_SUN_ORBIT.clockwise
          : next.sunOrbit?.clockwise ?? DEFAULT_SUN_ORBIT.clockwise,
    },
    mainLightIntensityMultiplier: mixNumber(current.mainLightIntensityMultiplier, next.mainLightIntensityMultiplier),
    ambientIntensityMultiplier: mixNumber(current.ambientIntensityMultiplier, next.ambientIntensityMultiplier),
    hemisphereIntensityMultiplier: mixNumber(current.hemisphereIntensityMultiplier, next.hemisphereIntensityMultiplier),
    secondaryLightIntensityMultiplier: mixNumber(
      current.secondaryLightIntensityMultiplier,
      next.secondaryLightIntensityMultiplier
    ),
    fogDensityMultiplier: mixNumber(current.fogDensityMultiplier, next.fogDensityMultiplier),
    starVisibility: mixNumber(current.starVisibility, next.starVisibility),
    snowIntensity: mixSeasonalIntensity(current.snowIntensity, next.snowIntensity),
    rainIntensity: mixSeasonalIntensity(current.rainIntensity ?? 0, next.rainIntensity ?? 0),
  petalIntensity: mixSeasonalIntensity(current.petalIntensity ?? 0, next.petalIntensity ?? 0),
  leafIntensity: mixSeasonalIntensity(current.leafIntensity ?? 0, next.leafIntensity ?? 0),
    shootingStarRate: mixNumber(current.shootingStarRate ?? 0, next.shootingStarRate ?? 0),
    shootingStarColor: mixColor(
      current.shootingStarColor ?? current.starColor ?? "#ffffff",
      next.shootingStarColor ?? next.starColor ?? "#ffffff"
    ),
    firefly: {
      base: mixColor(current.firefly.base, next.firefly.base),
      accent: mixColor(current.firefly.accent, next.firefly.accent),
      lightIntensity: mixNumber(current.firefly.lightIntensity, next.firefly.lightIntensity),
      flareOpacity: mixNumber(current.firefly.flareOpacity, next.firefly.flareOpacity),
      lightDistance: mixNumber(current.firefly.lightDistance, next.firefly.lightDistance),
    },
    milestone: {
      panelBase: mixColor(current.milestone.panelBase, next.milestone.panelBase),
      panelReached: mixColor(current.milestone.panelReached, next.milestone.panelReached),
      emissiveBase: mixColor(current.milestone.emissiveBase, next.milestone.emissiveBase),
      emissiveReached: mixColor(current.milestone.emissiveReached, next.milestone.emissiveReached),
      textBase: mixColor(current.milestone.textBase, next.milestone.textBase),
      textReached: mixColor(current.milestone.textReached, next.milestone.textReached),
      outline: mixColor(current.milestone.outline, next.milestone.outline),
      ringBase: mixColor(current.milestone.ringBase, next.milestone.ringBase),
      ringReached: mixColor(current.milestone.ringReached, next.milestone.ringReached),
      standColor: mixColor(current.milestone.standColor, next.milestone.standColor),
      standEmissive: mixColor(current.milestone.standEmissive, next.milestone.standEmissive),
    },
    hudAccent: mixColor(current.hudAccent, next.hudAccent),
    progress,
    primarySeasonKey: current.key,
    nextSeasonKey: next.key,
    transitionProgress: progress,
  };
};

const useSmoothedProgress = (progress, response = 3.8, precision = 0.0002) => {
  const initial = clamp01(progress ?? 0);
  const targetRef = useRef(initial);
  const valueRef = useRef(initial);
  const [, forceRender] = useState(0);

  useEffect(() => {
    targetRef.current = clamp01(progress ?? 0);
  }, [progress]);

  useFrame((_, delta) => {
    const target = targetRef.current;
    const current = valueRef.current;
    const next = MathUtils.damp(current, target, response, delta);
    if (Math.abs(next - current) > precision) {
      valueRef.current = next;
      forceRender((count) => count + 1);
    } else if (current !== target && Math.abs(target - current) <= precision) {
      valueRef.current = target;
      forceRender((count) => count + 1);
    }
  });

  return valueRef.current;
};

const getQualityConfig = (qualitySetting, performance) => {
  const preset = QUALITY_PRESETS[qualitySetting] ?? QUALITY_PRESETS.medium;
  const fireflyCount =
    performance.isLow && qualitySetting === "high"
      ? Math.round(preset.fireflyCount * 0.75)
      : preset.fireflyCount;

  return {
    ...preset,
    fireflyCount,
    maxDpr: Math.min(preset.maxDpr, performance.maxDpr),
  };
};

const detectPerformanceProfile = () => {
  if (typeof window === "undefined") {
    return { isLow: false, maxDpr: 1.75 };
  }

  const dpr = window.devicePixelRatio || 1;
  const hardware = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 8 : 8;
  const memory = typeof navigator !== "undefined" && "deviceMemory" in navigator ? navigator.deviceMemory || 8 : 8;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const isLow =
    reducedMotion ||
    hardware <= 4 ||
    (typeof memory === "number" && memory <= 4) ||
    (dpr >= 2.5 && hardware <= 6);

  const maxDpr = isLow ? Math.min(1.15, Math.max(1, dpr)) : Math.min(1.75, Math.max(1, dpr));

  return { isLow, maxDpr };
};

const usePerformanceProfile = () => {
  const [profile, setProfile] = useState(() => detectPerformanceProfile());

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => setProfile(detectPerformanceProfile());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return profile;
};

const Lighting = ({ config, season, sunState }) => {
  const {
    enableShadows,
    shadowResolution,
    shadowCameraFar,
    mainLightIntensity,
    secondaryLightIntensity,
    hemisphereIntensity,
    ambientIntensity,
  } = config;

  const visibilityFactor = season?.sunVisibility != null ? MathUtils.lerp(0.35, 1, MathUtils.clamp(season.sunVisibility, 0, 1)) : 1;
  const mainIntensity = mainLightIntensity * (season?.mainLightIntensityMultiplier ?? 1) * visibilityFactor;
  const secondaryIntensity =
    secondaryLightIntensity * (season?.secondaryLightIntensityMultiplier ?? 1) * MathUtils.clamp(0.5 + visibilityFactor * 0.5, 0.3, 1.5);
  const hemiIntensity = hemisphereIntensity * (season?.hemisphereIntensityMultiplier ?? 1);
  const ambientValue = ambientIntensity * (season?.ambientIntensityMultiplier ?? 1);
  const mainColor = season?.mainLightColor ?? 0xffedcf;
  const secondaryColor = season?.secondaryLightColor ?? config.secondaryLightColor;
  const hemisphereSky = season?.hemisphereSkyColor ?? 0x324a7a;
  const hemisphereGround = season?.hemisphereGroundColor ?? 0x102617;
  const ambientColor = season?.ambientColor ?? 0x8fa9ff;
  const lightPosition = sunState?.position ?? season?.sunPosition ?? DEFAULT_SUN_POSITION;

  return (
    <>
      <hemisphereLight intensity={hemiIntensity} skyColor={hemisphereSky} groundColor={hemisphereGround} />
      <ambientLight intensity={ambientValue} color={ambientColor} />
      <directionalLight
        intensity={mainIntensity}
        position={lightPosition}
        castShadow={enableShadows}
        shadow-mapSize-width={shadowResolution}
        shadow-mapSize-height={shadowResolution}
        shadow-camera-far={shadowCameraFar}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={32}
        shadow-camera-bottom={-28}
        color={mainColor}
      />
      {secondaryIntensity > 0 && (
        <directionalLight intensity={secondaryIntensity} position={[-12, 8, -20]} color={secondaryColor} />
      )}
    </>
  );
};

const Ground = ({ shadowsEnabled, color }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={shadowsEnabled} position={[0, -0.01, -ROAD_LENGTH / 2]}>
    <planeGeometry args={[120, ROAD_LENGTH]} />
    <meshStandardMaterial color={new Color(color ?? "#07151d")} roughness={0.96} metalness={0.03} />
  </mesh>
);

const Road = ({ shadowsEnabled }) => {
  const { scene: loadedScene } = useGLTF(`${MODEL_BASE_PATH}${ROAD_MODEL_FILE}`, true, true);
  const roadData = useMemo(() => {
    if (!loadedScene) return null;

    const clone = loadedScene.clone(true);
  const rootBounds = new Box3().setFromObject(clone);
  const roadMesh = clone.getObjectByName("Main");
  const focusBounds = roadMesh ? new Box3().setFromObject(roadMesh) : rootBounds;
  const size = new Vector3();
  focusBounds.getSize(size);

  const length = Math.max(size.x, size.y, size.z, 1);
  const scale = ROAD_LENGTH / length;

    const lateralCenter = (focusBounds.min.x + focusBounds.max.x) * 0.5;
    const forwardCenter = (focusBounds.min.z + focusBounds.max.z) * 0.5;
    const baseY = focusBounds.min.y;

    const translation = [-lateralCenter, -baseY, -forwardCenter];

    return {
      scene: clone,
      translation,
      scale,
    };
  }, [loadedScene]);

  useEffect(() => {
    if (!roadData?.scene) return;
    roadData.scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = Boolean(shadowsEnabled);
      child.receiveShadow = true;
      child.frustumCulled = false;
      if (child.material?.map) {
        child.material.map.colorSpace = SRGBColorSpace;
      }
    });
  }, [roadData, shadowsEnabled]);

  if (!roadData) return null;

  const { scene: roadScene, translation, scale } = roadData;

  return (
    <group position={[0, 0, -ROAD_LENGTH / 2]} scale={scale}>
      <primitive object={roadScene} position={translation} dispose={null} />
    </group>
  );
};
useGLTF.preload(`${MODEL_BASE_PATH}${ROAD_MODEL_FILE}`, true, true);

const Fireflies = ({ count, palette }) => {
  const fireflyPalette = useMemo(
    () =>
      palette ?? {
        base: "#8dfcd5",
        accent: "#b5ffe9",
        lightIntensity: 0.75,
        flareOpacity: 0.75,
        lightDistance: 3.6,
      },
    [palette]
  );
  const positions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i += 1) {
      arr.push([
        Math.sin(i * 12.3) * 12,
        1.4 + (i % 5) * 0.45 + Math.cos(i * 1.7) * 0.25,
        -i * 3.5,
      ]);
    }
    return arr;
  }, [count]);

  return (
    <group>
      {positions.map(([x, y, z], index) => {
        const baseColor = new Color(fireflyPalette.base);
        const accentColor = new Color(fireflyPalette.accent);
        const lerpFactor = (index % 7) / 6;
        const color = baseColor.clone().lerp(accentColor, lerpFactor);
        const intensityVariation = 0.85 + (index % 5) * 0.05;
        const lightIntensity = fireflyPalette.lightIntensity * intensityVariation;
        return (
          <group key={`firefly-${index}`} position={[x, y, z]}>
            <pointLight
              intensity={lightIntensity}
              distance={fireflyPalette.lightDistance}
              decay={2.6}
              color={color}
            />
            <mesh>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial color={color} transparent opacity={fireflyPalette.flareOpacity} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

const ForestAtmosphere = ({ fogDensity, season }) => {
  const { scene } = useThree();

  useEffect(() => {
    const backgroundColor = new Color(season?.skyTopColor ?? season?.backgroundColor ?? "#050d1f");
    const fogColor = season?.fogColor ?? "#0c162f";
    const density = fogDensity * (season?.fogDensityMultiplier ?? 1);

    scene.background = backgroundColor;
    scene.fog = new FogExp2(fogColor, density);

    return () => {
      scene.fog = null;
      scene.background = null;
    };
  }, [scene, fogDensity, season?.skyTopColor, season?.backgroundColor, season?.fogColor, season?.fogDensityMultiplier]);

  return null;
};

const Starfield = ({ count, season }) => {
  const geometry = useMemo(() => {
    const starGeometry = new BufferGeometry();
    const positions = new Float32Array(count * 3);

    const depthRange = ROAD_LENGTH + 340;
    for (let i = 0; i < count; i += 1) {
      const horizonBand = Math.random() < 0.28;
      if (horizonBand) {
        positions[i * 3] = (Math.random() - 0.5) * 90;
        positions[i * 3 + 1] = 6 + Math.random() * 14;
        positions[i * 3 + 2] = HORIZON_Z + Math.random() * 180 - 80;
      } else {
        positions[i * 3] = (Math.random() - 0.5) * 160;
        positions[i * 3 + 1] = 12 + Math.pow(Math.random(), 0.45) * 70;
        positions[i * 3 + 2] = -Math.random() * depthRange - 80;
      }
    }

    starGeometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return starGeometry;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const starColor = season?.starColor ?? "#cce6ff";
  const visibility = MathUtils.clamp(season?.starVisibility ?? 1, 0, 1);
  const opacityBase = 0.18;
  const starOpacity = MathUtils.clamp(opacityBase + visibility * 0.65, opacityBase, 0.86);
  const starSize = MathUtils.lerp(0.26, 0.42, Math.sqrt(visibility));

  return (
    <points geometry={geometry} rotation={[0, 0, 0]} visible={visibility > 0.02}>
      <pointsMaterial
        color={new Color(starColor)}
  size={starSize}
        sizeAttenuation
        depthWrite={false}
        transparent
        opacity={starOpacity}
        blending={AdditiveBlending}
      />
    </points>
  );
};

const Sun = ({ state }) => {
  const textures = useMemo(() => {
    if (!state) return null;
    return createSunTextures(state.color, state.glowColor ?? state.color);
  }, [state]);

  useEffect(() => () => {
    textures?.coreTexture?.dispose?.();
    textures?.glowTexture?.dispose?.();
    textures?.flareTexture?.dispose?.();
  }, [textures]);

  if (!state || state.opacity <= 0.01) return null;

  const { position, radius, opacity } = state;
  const fade = MathUtils.clamp(opacity, 0, 1);

  return (
    <group position={position} renderOrder={-10}>
      {textures?.glowTexture && (
        <sprite scale={[radius * 5.2, radius * 5.2, 1]}>
          <spriteMaterial
            map={textures.glowTexture}
            transparent
            opacity={fade * 0.85}
            depthWrite={false}
            depthTest
            toneMapped={false}
            fog={false}
            blending={AdditiveBlending}
          />
        </sprite>
      )}
      {textures?.flareTexture && (
        <sprite scale={[radius * 3.4, radius * 3.4, 1]}>
          <spriteMaterial
            map={textures.flareTexture}
            transparent
            opacity={fade * 0.65}
            depthWrite={false}
            depthTest
            toneMapped={false}
            fog={false}
            blending={AdditiveBlending}
          />
        </sprite>
      )}
      {textures?.coreTexture && (
        <sprite scale={[radius * 2.45, radius * 2.45, 1]}>
          <spriteMaterial
            map={textures.coreTexture}
            transparent
            opacity={fade}
            depthWrite={false}
            depthTest
            toneMapped={false}
            fog={false}
          />
        </sprite>
      )}
    </group>
  );
};

const Moon = ({ state }) => {
  const moonTexture = useLoader(TextureLoader, "/Images/moon.png");
  const proceduralTextures = useMemo(() => {
    if (!state) return null;
    return createMoonTextures(state.color, state.glowColor ?? state.color);
  }, [state]);

  useEffect(() => {
    if (!moonTexture) return undefined;
    moonTexture.colorSpace = SRGBColorSpace;
    moonTexture.anisotropy = Math.max(moonTexture.anisotropy ?? 0, 8);
    moonTexture.center.set(0.5, 0.5);
    moonTexture.needsUpdate = true;
    return undefined;
  }, [moonTexture]);

  useEffect(
    () => () => {
      proceduralTextures?.coreTexture?.dispose?.();
      proceduralTextures?.glowTexture?.dispose?.();
      proceduralTextures?.rimTexture?.dispose?.();
    },
    [proceduralTextures]
  );

  if (!state || state.opacity <= 0.01 || !moonTexture) return null;

  const { position, radius, opacity, color, glowColor } = state;
  const fade = MathUtils.clamp(opacity, 0, 1);
  const tint = new Color(color ?? "#e7f0ff");
  const glowTint = new Color(glowColor ?? color ?? "#b8d2ff");

  return (
    <group position={position} renderOrder={-8}>
      {proceduralTextures?.glowTexture && (
        <sprite scale={[radius * 4.6, radius * 4.6, 1]}>
          <spriteMaterial
            map={proceduralTextures.glowTexture}
            color={glowTint.clone().convertSRGBToLinear()}
            transparent
            opacity={fade * 0.58}
            depthWrite={false}
            depthTest
            toneMapped={false}
            fog={false}
            blending={AdditiveBlending}
          />
        </sprite>
      )}
      <sprite scale={[radius * 2.8, radius * 2.8, 1]}>
        <spriteMaterial
          map={moonTexture}
          transparent
          opacity={fade}
          depthWrite={false}
          depthTest
          toneMapped={false}
          fog={false}
          color={tint.clone().convertSRGBToLinear()}
        />
      </sprite>
      {proceduralTextures?.rimTexture && (
        <sprite scale={[radius * 3.05, radius * 3.05, 1]}>
          <spriteMaterial
            map={proceduralTextures.rimTexture}
            transparent
            opacity={fade * 0.68}
            depthWrite={false}
            depthTest
            toneMapped={false}
            fog={false}
          />
        </sprite>
      )}
    </group>
  );
};

const ForestCameraRig = ({ isLookActive, enableBobbing }) => {
  const { distanceRef } = useSceneController();
  const pointerTarget = useRef(new Vector2());
  const pointerSmoothed = useRef(new Vector2());
  const smoothedZ = useRef(CAMERA_BASE_Z);
  const targetPosition = useRef(new Vector3(0, CAMERA_BASE_HEIGHT, CAMERA_BASE_Z));
  const orientation = useRef(new Euler(CAMERA_BASE_PITCH, 0, 0, "YXZ"));
  const targetQuaternion = useRef(new Quaternion().setFromEuler(orientation.current));

  useEffect(() => {
    if (!isLookActive) {
      pointerTarget.current.set(0, 0);
    }
  }, [isLookActive]);

  useFrame((state, delta) => {
    const { camera, pointer, clock } = state;

    const travel = MathUtils.clamp(
      distanceRef.current * CAMERA_TRAVEL_SCALE,
      0,
      FOREST_MAX_DISTANCE * CAMERA_TRAVEL_SCALE
    );
    const desiredZ = CAMERA_BASE_Z - travel;
    smoothedZ.current = MathUtils.damp(smoothedZ.current, desiredZ, 4.2, delta);

    const allowLook = isLookActive;
    const limitedX = allowLook ? MathUtils.clamp(pointer.x, -POINTER_LIMIT_X, POINTER_LIMIT_X) : 0;
    const limitedY = allowLook ? MathUtils.clamp(pointer.y, -POINTER_LIMIT_Y, POINTER_LIMIT_Y) : 0;

    pointerTarget.current.set(limitedX, limitedY);
    pointerSmoothed.current.lerp(pointerTarget.current, 1 - Math.exp(-CAMERA_POINTER_RESPONSE * delta));

    const horizontal = pointerSmoothed.current.x;
    const vertical = pointerSmoothed.current.y;

    const yaw = -horizontal * CAMERA_YAW_RANGE;
    const pitch = CAMERA_BASE_PITCH + vertical * CAMERA_PITCH_RANGE;

    const bobbing = enableBobbing ? Math.sin(clock.elapsedTime * BOBBING_FREQUENCY) * BOBBING_AMPLITUDE : 0;

    targetPosition.current.set(0, CAMERA_BASE_HEIGHT + bobbing, smoothedZ.current);

    camera.position.lerp(targetPosition.current, 1 - Math.exp(-CAMERA_POSITION_RESPONSE * delta));

    orientation.current.set(pitch, yaw, 0, "YXZ");
    targetQuaternion.current.setFromEuler(orientation.current);
    camera.quaternion.slerp(targetQuaternion.current, 1 - Math.exp(-CAMERA_ROTATION_RESPONSE * delta));
    camera.updateMatrixWorld();
  });

  return null;
};

const SEASON_EFFECT_PRESETS = {
  spring: { color: "#ffffff", count: 42, size: 6.6, speed: 0.24, noise: 1.8, opacity: 0.55 },
  summer: { color: "#ffd873", count: 32, size: 7.2, speed: 0.32, noise: 1.6, opacity: 0.5 },
  autumn: { color: "#ff9a53", count: 28, size: 6.8, speed: 0.18, noise: 1.3, opacity: 0.48 },
  winter: { color: "#d8f0ff", count: 38, size: 7.1, speed: 0.2, noise: 1.7, opacity: 0.58 },
};

const BLURB_LATERAL_OFFSET = 5.1;

const SeasonalBlurbEffect = ({ seasonKey, intensity }) => {
  const preset = SEASON_EFFECT_PRESETS[seasonKey] ?? SEASON_EFFECT_PRESETS.spring;
  const effectIntensity = MathUtils.clamp(intensity, 0, 1);
  const scale = MathUtils.lerp(0.4, 1.2, effectIntensity);

  return (
    <group scale={[scale, scale, scale]}>
      <Sparkles
        count={Math.max(4, Math.round(preset.count * Math.max(effectIntensity, 0.1)))}
        speed={preset.speed}
        size={preset.size}
        opacity={preset.opacity * effectIntensity}
        color={preset.color}
        scale={[3.4, 3.6, 2.4]}
        noise={preset.noise}
      />
      <Sparkles
        count={Math.max(3, Math.round((preset.count / 2) * Math.max(effectIntensity, 0.08)))}
        speed={preset.speed * 0.6}
        size={preset.size * 0.7}
        opacity={(preset.opacity * 0.6) * effectIntensity}
        color={preset.color}
        scale={[2.6, 2.8, 2.2]}
        noise={preset.noise * 0.8}
        position={[0, 0.85, 0.18]}
      />
    </group>
  );
};

const SeasonalBlurb = ({ blurb, currentDistance }) => {
  const { eased } = computeBlurbActivation(blurb.distance, currentDistance);
  const seasonAtMarker = useMemo(() => computeSeasonPalette(blurb.distance), [blurb.distance]);
  const seasonKey = seasonAtMarker?.primarySeasonKey ?? seasonAtMarker?.key ?? "spring";

  if (eased <= 0.02) {
    return null;
  }

  const cameraZ = CAMERA_BASE_Z - currentDistance * WORLD_UNITS_PER_METER;
  const worldZ = CAMERA_BASE_Z - blurb.distance * WORLD_UNITS_PER_METER;
  const z = MathUtils.lerp(worldZ, cameraZ - 9, eased);

  const lateralBase = blurb.alignment === "right" ? BLURB_LATERAL_OFFSET : -BLURB_LATERAL_OFFSET;
  const lateralFocus = blurb.alignment === "right" ? 3.4 : -3.4;
  const lateral = MathUtils.lerp(lateralBase, lateralFocus, eased);
  const scale = 0.78 + eased * 0.3;
  const height = blurb.height ?? 3.6;

  return (
    <group position={[lateral, height, z]} scale={[scale, scale, scale]}>
      <SeasonalBlurbEffect seasonKey={seasonKey} intensity={eased} />
    </group>
  );
};

const SeasonalBlurbs = ({ distance }) => (
  <group>
    {BLURB_DATA.map((blurb) => (
      <SeasonalBlurb key={blurb.id} blurb={blurb} currentDistance={distance} />
    ))}
  </group>
);

const FireflyTrail = ({ alignment, accentColor, progress }) => {
  const flies = useMemo(() => {
    const baseSeed = alignment === "right" ? 240 : 120;
    return Array.from({ length: 7 }, (_, index) => {
      const seed = baseSeed + index * 11;
      const offsetY = (seededRandom(seed) - 0.5) * 90;
      const travel = 180 + seededRandom(seed + 1) * 190;
      const delay = seededRandom(seed + 2) * 0.85;
      const duration = 1.3 + seededRandom(seed + 3) * 1.1;
      return {
        id: `${alignment}-${index}`,
        offsetY,
        travel,
        delay,
        duration,
      };
    });
  }, [alignment]);

  if (progress <= 0.05) return null;

  const direction = alignment === "right" ? -1 : 1;
  const intensity = MathUtils.clamp(progress * 0.9, 0.22, 0.95);

  return (
    <>
      {flies.map((fly, index) => (
        <motion.span
          key={fly.id}
          className="pointer-events-none absolute h-2 w-2 rounded-full mix-blend-screen"
          style={{
            background: accentColor,
            boxShadow: `0 0 14px ${accentColor}, 0 0 32px ${accentColor}80`,
            top: `calc(50% + ${fly.offsetY}px)`,
            left: alignment === "right" ? "auto" : "0%",
            right: alignment === "right" ? "0%" : "auto",
          }}
          initial={{ opacity: 0, scale: 0.5, x: direction * (fly.travel + 60) }}
          animate={{
            opacity: [0, intensity, 0],
            scale: [0.5, 1.18, 0.7],
            x: [direction * (fly.travel + 60), 0, direction * -40],
          }}
          transition={{
            duration: fly.duration,
            delay: fly.delay + index * 0.06,
            repeat: Infinity,
            repeatDelay: 0.55,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
};

const SeasonalBlurbOverlay = ({ distance, seasonPalette }) => {
  const defaultAccent = seasonPalette?.hudAccent ?? "#9dfde2";

  const activeEntry = useMemo(() => {
    let best = null;

    for (const blurb of BLURB_DATA) {
      const activation = computeBlurbActivation(blurb.distance, distance);
      const { distanceAhead } = activation;
      const persistentActive = Boolean(blurb.persistUntilEnd && distance >= blurb.distance);
      const influenceRange = distanceAhead >= 0 ? BLURB_LEAD_IN_DISTANCE : BLURB_FALLOFF_DISTANCE;
      const withinRange = Math.abs(distanceAhead) <= influenceRange;
      const hasSufficientPresence = activation.eased > 0.02;

      if (!persistentActive && (!withinRange || !hasSufficientPresence)) {
        continue;
      }

      const candidate = persistentActive
        ? {
            ...blurb,
            ...activation,
            distanceAhead,
            eased: Math.max(activation.eased, 0.96),
            priority: Number.POSITIVE_INFINITY,
          }
        : { ...blurb, ...activation };

      if (!best) {
        best = candidate;
        continue;
      }

      const hasHigherPriority = candidate.priority > best.priority;
      const priorityDifference = Math.abs(candidate.priority - best.priority);
      const isCloser = Math.abs(distanceAhead) < Math.abs(best.distanceAhead ?? Infinity);

      if (hasHigherPriority || (priorityDifference < 0.001 && isCloser)) {
        best = candidate;
      }
    }

    return best;
  }, [distance]);

  const activePalette = useMemo(() => {
    if (!activeEntry) return null;
    return computeSeasonPalette(activeEntry.distance);
  }, [activeEntry]);

  const rememberReturnPoint = useCallback(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      FOREST_RETURN_STORAGE_KEY,
      JSON.stringify({ distance })
    );
  }, [distance]);

  const accentColor = activePalette?.hudAccent ?? defaultAccent;
  const progress = activeEntry?.eased ?? 0;
  const alignment = activeEntry?.alignment ?? "left";
  const headlineOpacity = 0.55 + progress * 0.45;
  const headlineColor = colorToRgba("#ffffff", headlineOpacity);
  const distanceLabelColor = `${accentColor}d8`;
  const justifyClass = alignment === "right" ? "justify-end" : "justify-start";
  const textAlignClass = alignment === "right" ? "items-end text-right" : "items-start text-left";
  const direction = alignment === "right" ? -1 : 1;
  const label = activeEntry?.tag ?? (activeEntry?.type === "project" ? "Project" : undefined);
  const title = activeEntry?.title ?? activeEntry?.text ?? "";
  const subtitle = activeEntry?.subtitle ?? null;
  const bodyContent = activeEntry?.body ?? activeEntry?.text ?? "";
  const ctaHref = activeEntry?.href;
  const ctaLabel = typeof activeEntry?.ctaLabel === "string" ? activeEntry?.ctaLabel : null;
  const isExternalCta = typeof ctaHref === "string" && /^https?:\/\//i.test(ctaHref);
  const isFinalStop = activeEntry?.id === "uoft-hbsc";
  const showProjectCta = !isFinalStop && Boolean(ctaHref && ctaLabel);
  const isExperience = activeEntry?.type === "experience";

  const { headlineTitle, experienceRole } = useMemo(() => {
    if (!isExperience || typeof title !== "string") {
      return { headlineTitle: title, experienceRole: null };
    }

    const parts = title
      .split("·")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      return { headlineTitle: title, experienceRole: null };
    }

    return {
      headlineTitle: parts[0],
      experienceRole: parts.slice(1).join(" · ") || null,
    };
  }, [isExperience, title]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[18%] z-30 flex w-full items-end px-6 md:px-12">
      <AnimatePresence mode="wait">
        {activeEntry ? (
          <motion.div
            key={activeEntry.id}
            className={`relative flex w-full items-end ${justifyClass}`}
            initial={{ opacity: 0, x: direction * 80 }}
            animate={{ opacity: 0.4 + progress * 0.6, x: 0 }}
            exit={{ opacity: 0, x: direction * -80 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={`relative flex max-w-2xl flex-col gap-5 ${textAlignClass} md:max-w-3xl`}>
              <FireflyTrail alignment={alignment} accentColor={accentColor} progress={progress} />
              {label ? (
                <motion.span
                  className="text-xs uppercase tracking-[0.42em] text-white/70"
                  style={{ color: distanceLabelColor, letterSpacing: "0.42em" }}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 0.9, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  {label}
                </motion.span>
              ) : null}
              <motion.h3
                className="relative text-[2rem] font-semibold leading-tight text-white drop-shadow-[0_12px_45px_rgba(6,13,24,0.82)] md:text-[2.35rem]"
                style={{
                  color: headlineColor,
                  textShadow:
                    "0 10px 38px rgba(6,13,24,0.65), 0 0 24px rgba(157,253,226,0.25)",
                }}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              >
                {headlineTitle}
              </motion.h3>
              {experienceRole ? (
                <motion.div
                  className="flex items-center gap-3 text-base font-medium text-white/80 md:text-lg"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 0.95, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span
                    aria-hidden
                    className="h-5 w-1 rounded-full"
                    style={{
                      background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}00 100%)`,
                      boxShadow: `0 0 12px ${accentColor}50`,
                    }}
                  />
                  <span
                    className="bg-clip-text text-transparent tracking-[0.18em] uppercase"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${accentColor} 0%, rgba(255,255,255,0.82) 65%)`,
                    }}
                  >
                    {experienceRole}
                  </span>
                </motion.div>
              ) : null}
              {subtitle ? (
                <motion.p
                  className="text-sm uppercase tracking-[0.32em] text-white/55"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                >
                  {subtitle}
                </motion.p>
              ) : null}
              {bodyContent ? (
                <motion.p
                  className="text-lg leading-relaxed text-white/85 md:text-xl"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 0.95, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                >
                  {bodyContent}
                </motion.p>
              ) : null}
              {isFinalStop ? (
                <motion.div
                  className="mt-3 flex flex-wrap items-center gap-4 pointer-events-none"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={RESUME_DOWNLOAD_PATH}
                    download
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/85 transition hover:border-emerald-200/60 hover:text-emerald-200/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70"
                  >
                    Download Resume
                    <span aria-hidden className="text-base">↓</span>
                  </Link>
                  <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.26em] text-white/70">
                    <span>Socials</span>
                    <Socials
                      containerStyles="flex items-center gap-3"
                      iconStyles="text-lg text-white/80 transition hover:text-emerald-200/90"
                    />
                  </div>
                </motion.div>
              ) : null}
              {showProjectCta ? (
                <motion.div
                  className="mt-2"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={ctaHref}
                    onClick={rememberReturnPoint}
                    target={isExternalCta ? "_blank" : undefined}
                    rel={isExternalCta ? "noreferrer" : undefined}
                    className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80 transition hover:border-emerald-200/60 hover:text-emerald-200/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70"
                  >
                    {ctaLabel}
                    <span aria-hidden className="text-base">→</span>
                  </Link>
                </motion.div>
              ) : null}
              <motion.span
                className="relative text-xs uppercase tracking-[0.42em] text-white/70"
                style={{ color: distanceLabelColor, letterSpacing: "0.42em" }}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 0.9, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {`${activeEntry.distance}m marker`}
              </motion.span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const TravelMinimap = ({ distance, limit, accentColor, onReturnToStart }) => {
  const progress = MathUtils.clamp(distance / Math.max(limit, 1), 0, 1);
  const indicatorTop = 78 - progress * 60;
  const safeAccent = accentColor ?? "#9dfde2";
  const secondaryAccent = `${safeAccent}90`;
  const primaryBorder = `${safeAccent}40`;
  const atStart = distance <= 1;

  const handleReturnToStart = useCallback(() => {
    if (typeof onReturnToStart === "function") {
      onReturnToStart();
    }
  }, [onReturnToStart]);

  return (
    <div className="pointer-events-none absolute left-6 top-6 z-40">
      <div className="pointer-events-auto w-44 rounded-2xl border border-white/10 bg-[#050b1d]/85 px-4 py-3 text-white shadow-[0_24px_60px_rgba(3,10,26,0.45)] backdrop-blur-xl">
        <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.32em] text-white/60">
          <span>Navigate</span>
          <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[0.55rem] tracking-[0.38em] text-white/75">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="relative mt-3 h-24 w-full overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_top,#132239_0%,#050b1d_70%)]">
          <div
            className="absolute inset-y-4 left-1/2 w-9 -translate-x-1/2 rounded-full border border-white/10"
            style={{
              background:
                "linear-gradient(180deg, rgba(18,34,57,0.95) 0%, rgba(7,13,28,0.85) 60%, rgba(4,9,18,0.9) 100%)",
            }}
          >
            <div className="absolute inset-x-[43%] h-full border-l border-dashed border-white/15" />
          </div>
          <div
            className="absolute left-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2"
            style={{
              top: `${indicatorTop}%`,
              borderColor: primaryBorder,
              background: `radial-gradient(circle, ${secondaryAccent} 0%, rgba(8,18,24,0.95) 65%)`,
              boxShadow: `0 0 16px ${safeAccent}40`,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l6.5 18-6.5-4-6.5 4L12 3z" fill={safeAccent} fillOpacity="0.85" />
            </svg>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReturnToStart}
          disabled={atStart}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-white/75 transition hover:border-emerald-200/60 hover:text-emerald-200/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/35 disabled:hover:border-white/10 disabled:hover:text-white/35"
          style={{ boxShadow: atStart ? undefined : `0 0 16px ${safeAccent}25` }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5l-7 7m0 0 7 7m-7-7h14" stroke={safeAccent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back to Start</span>
        </button>
      </div>
    </div>
  );
};

const Rainfall = ({ intensity, onImpact = () => {} }) => {
  const groupRef = useRef();
  const createDirection = useCallback(
    () =>
      new Vector3(
        -0.38 - Math.random() * 0.18,
        -1,
        (Math.random() * 0.14) - 0.07
      ).normalize(),
    []
  );

  const data = useMemo(() => {
    const drops = Array.from({ length: MAX_RAIN_PARTICLES }, () => ({
      position: new Vector3((Math.random() - 0.5) * 40, Math.random() * 26 + 24, -Math.random() * 190 - 18),
      speed: 8.4 + Math.random() * 9.5,
      direction: createDirection(),
      length: 1.45 + Math.random() * 2.4,
      seed: Math.random() * Math.PI * 2,
    }));
    const positions = new Float32Array(MAX_RAIN_PARTICLES * 6);
    const geometry = new BufferGeometry();
    const attribute = new BufferAttribute(positions, 3);
    attribute.setUsage(DynamicDrawUsage);
    geometry.setAttribute("position", attribute);
    geometry.setDrawRange(0, 0);
    geometry.computeBoundingSphere();
    return { drops, positions, geometry, activeCount: 0 };
  }, [createDirection]);

  const intensityRef = useRef(intensity);
  const movementRef = useRef(new Vector3());
  const tailRef = useRef(new Vector3());

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(
    () => () => {
      data.geometry.dispose();
    },
    [data]
  );

  useFrame((state, delta) => {
    const offsetZ = state.camera.position.z - CAMERA_BASE_Z;

    if (groupRef.current) {
      groupRef.current.position.set(0, 0, offsetZ);
    }

    const activeIntensity = MathUtils.clamp(intensityRef.current, 0, 1);
    const desiredCount = activeIntensity === 0 ? 0 : Math.floor(MAX_RAIN_PARTICLES * MathUtils.lerp(0.12, 0.48, activeIntensity));

    if (desiredCount !== data.activeCount) {
      data.activeCount = desiredCount;
      data.geometry.setDrawRange(0, desiredCount * 2);
    }

    if (desiredCount === 0 || delta <= 0) {
      return;
    }

  const { drops, positions } = data;
  const time = state.clock.getElapsedTime();
    const fallMultiplier = MathUtils.lerp(26, 44, activeIntensity) * delta * 0.05;
    const swayStrength = 0.05 + activeIntensity * 0.1;

    for (let i = 0; i < desiredCount; i += 1) {
      const drop = drops[i];
      const movement = movementRef.current.copy(drop.direction);
      const sway = Math.sin(time * 1.3 + drop.seed) * swayStrength;
      movement.x += sway;
      movement.normalize();

      drop.position.addScaledVector(movement, drop.speed * fallMultiplier);
      drop.position.z += Math.cos(time * 0.48 + drop.seed * 1.9) * delta * 0.6;

      if (drop.position.y <= 0.02) {
        const impactPoint = drop.position.clone();
        impactPoint.z += offsetZ;
        onImpact({ position: impactPoint, intensity: activeIntensity });
        drop.position.set((Math.random() - 0.5) * 36, Math.random() * 28 + 26, -Math.random() * 190 - 18);
        drop.speed = 8.4 + Math.random() * 9.5;
        drop.direction = createDirection();
        drop.length = 1.45 + Math.random() * 2.4;
        drop.seed = Math.random() * Math.PI * 2;
      }

      const base = i * 6;
      const tail = tailRef.current
        .copy(drop.position)
        .addScaledVector(movement, -drop.length);

      positions[base] = tail.x;
      positions[base + 1] = tail.y;
      positions[base + 2] = tail.z;
      positions[base + 3] = drop.position.x;
      positions[base + 4] = drop.position.y;
      positions[base + 5] = drop.position.z;
    }

    data.geometry.attributes.position.needsUpdate = true;
    data.geometry.computeBoundingSphere();
  });

  const normalized = MathUtils.clamp(intensity, 0, 1);
  const opacity = MathUtils.lerp(0.22, 0.48, normalized);

  return (
    <group ref={groupRef}>
      <lineSegments geometry={data.geometry} frustumCulled={false} visible={normalized > 0.01}>
        <lineBasicMaterial
          color="#5ab6ff"
          transparent
          opacity={opacity}
          depthWrite={false}
          depthTest={false}
          blending={NormalBlending}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
};

const RAIN_RIPPLE_POOL = 22;

const RainRipples = ({ intensity, impactQueueRef }) => {
  const rippleTexture = useMemo(
    () =>
      createCanvasTexture(512, (ctx, size) => {
        const center = size / 2;
        ctx.clearRect(0, 0, size, size);

        const fill = ctx.createRadialGradient(center, center, size * 0.06, center, center, size * 0.48);
        fill.addColorStop(0, "rgba(255, 255, 255, 0.65)");
        fill.addColorStop(0.28, "rgba(255, 255, 255, 0.32)");
        fill.addColorStop(0.62, "rgba(255, 255, 255, 0.12)");
        fill.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(center, center, size * 0.48, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = size * 0.015;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
        for (let ring = 0; ring < 3; ring += 1) {
          const radius = size * (0.22 + ring * 0.1);
          ctx.beginPath();
          ctx.arc(center, center, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }),
    []
  );

  const rippleRefs = useRef([]);
  const rippleState = useRef(
    Array.from({ length: RAIN_RIPPLE_POOL }, () => ({
      active: false,
      progress: 0,
      duration: 1.8,
      maxScale: 2.4,
      opacityBase: 0.26,
      offset: Math.random() * Math.PI * 2,
      position: new Vector3(),
    }))
  );
  const intensityRef = useRef(intensity);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(
    () => () => {
      rippleTexture?.dispose?.();
    },
    [rippleTexture]
  );

  useFrame((state, delta) => {
    const rain = MathUtils.clamp(intensityRef.current, 0, 1);
    const clampedDelta = Math.min(Math.max(delta, 0.0001), 0.05);
    const states = rippleState.current;
    const cameraZ = state.camera.position.z;

    const queue = impactQueueRef?.current;
    if (queue && queue.length) {
      while (queue.length) {
        const event = queue.shift();
        if (!event) continue;
        const spawnPosition = event.position;

        if (Math.abs(spawnPosition.x) > 4.4) {
          continue;
        }

        const distanceAhead = cameraZ - spawnPosition.z;
        if (distanceAhead < -6 || distanceAhead > 36) {
          continue;
        }

        let slot = null;
        for (let index = 0; index < states.length; index += 1) {
          if (!states[index].active) {
            slot = states[index];
            break;
          }
        }

        if (!slot) {
          queue.unshift(event);
          break;
        }

        const spawnIntensity = event.intensity ?? rain;
        slot.active = true;
        slot.progress = 0;
        slot.duration = MathUtils.lerp(1.2, 2.6, 0.35 + Math.random() * 0.65);
  slot.maxScale = MathUtils.lerp(2.1, 4.6, spawnIntensity * (0.8 + Math.random() * 0.45));
        slot.opacityBase = MathUtils.lerp(0.16, 0.38, spawnIntensity) * (0.75 + Math.random() * 0.35);
        slot.offset = Math.random() * Math.PI * 2;
  const clampedX = MathUtils.clamp(spawnPosition.x + (Math.random() - 0.5) * 0.35, -3.75, 3.75);
  slot.position.set(clampedX, 0.003, spawnPosition.z + (Math.random() - 0.5) * 0.4);
      }
    }

    states.forEach((ripple, index) => {
      const mesh = rippleRefs.current[index];
      if (!mesh) return;

      if (!ripple.active) {
        mesh.visible = false;
        return;
      }

      ripple.progress += clampedDelta / ripple.duration;

      if (ripple.progress >= 1) {
        ripple.active = false;
        mesh.visible = false;
        return;
      }

      const eased = MathUtils.smootherstep(ripple.progress, 0, 1);
      const wobble = Math.sin(ripple.offset + ripple.progress * Math.PI * 2) * 0.08;
      const scale = MathUtils.lerp(0.42, ripple.maxScale, eased);

      mesh.visible = true;
      mesh.position.set(ripple.position.x + wobble, ripple.position.y, ripple.position.z);
      mesh.scale.set(scale, scale, scale);

      const material = mesh.material;
      if (material) {
        const fade = 1 - Math.pow(eased, 1.4);
        material.opacity = ripple.opacityBase * fade;
      }
    });
  });

  return (
    <group position={[0, 0.0025, 0]}>
      {Array.from({ length: RAIN_RIPPLE_POOL }).map((_, index) => (
        <mesh
          key={`rain-ripple-${index}`}
          ref={(instance) => {
            rippleRefs.current[index] = instance ?? undefined;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={rippleTexture ?? undefined}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={false}
            color="#72c6ff"
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

const ShootingStars = ({ rate, color }) => {
  const data = useMemo(() => {
    const stars = Array.from({ length: SHOOTING_STAR_POOL }, () => ({
      active: false,
      life: 0,
      duration: 1.5,
      position: new Vector3(),
      velocity: new Vector3(),
      direction: new Vector3(1, 0, 0),
      length: 6,
    }));
    const positions = new Float32Array(SHOOTING_STAR_POOL * 6);
    const geometry = new BufferGeometry();
    const attribute = new BufferAttribute(positions, 3);
    attribute.setUsage(DynamicDrawUsage);
    geometry.setAttribute("position", attribute);
    geometry.setDrawRange(0, 0);
    geometry.computeBoundingSphere();
    return { stars, positions, geometry, activeCount: 0 };
  }, []);

  const spawnAccumulator = useRef(0);
  const tailVectorRef = useRef(new Vector3());

  useEffect(
    () => () => {
      data.geometry.dispose();
    },
    [data]
  );

  useFrame((state, delta) => {
    const activeRate = Math.max(rate, 0);
    const spawnRate = activeRate * 1.6;
    spawnAccumulator.current += spawnRate * delta;

    const { stars, positions, geometry } = data;
    const time = state.clock.getElapsedTime();

    const spawnStar = () => {
      for (let index = 0; index < stars.length; index += 1) {
        const star = stars[index];
        if (!star.active) {
          star.active = true;
          star.life = 0;
          star.duration = MathUtils.lerp(1.1, 2.3, Math.random());
          const startX = (Math.random() - 0.5) * 160;
          const startY = 28 + Math.random() * 34;
          const startZ = -Math.random() * 260 - 60;
          star.position.set(startX, startY, startZ);
          const direction = new Vector3(
            0.6 + Math.random() * 0.6,
            -0.35 - Math.random() * 0.28,
            Math.random() * 0.16 - 0.08
          ).normalize();
          const speed = MathUtils.lerp(42, 96, Math.random());
          star.velocity.copy(direction).multiplyScalar(speed);
          star.direction.copy(direction);
          star.length = MathUtils.lerp(5.5, 10.5, Math.random());
          return;
        }
      }
    };

    if (spawnRate > 0 && spawnAccumulator.current >= 1) {
      const spawns = Math.min(Math.floor(spawnAccumulator.current), stars.length);
      spawnAccumulator.current -= spawns;
      for (let s = 0; s < spawns; s += 1) {
        spawnStar();
      }
    }

    let writeIndex = 0;

    for (let index = 0; index < stars.length; index += 1) {
      const star = stars[index];
      if (!star.active) continue;

      star.life += delta;
      if (star.life > star.duration) {
        star.active = false;
        continue;
      }

      star.position.addScaledVector(star.velocity, delta);
      star.velocity.y -= delta * 12;
      star.velocity.x += delta * 1.2;
      star.velocity.z -= delta * 0.6;
      star.direction.copy(star.velocity).normalize();

      const progress = MathUtils.clamp(star.life / star.duration, 0, 1);
      const lengthScale = MathUtils.lerp(1.25, 0.75, progress);
      const tail = tailVectorRef.current.copy(star.position).addScaledVector(star.direction, -star.length * lengthScale);

      const base = writeIndex * 6;
      positions[base] = tail.x;
      positions[base + 1] = tail.y;
      positions[base + 2] = tail.z;
      positions[base + 3] = star.position.x;
      positions[base + 4] = star.position.y;
      positions[base + 5] = star.position.z;

      writeIndex += 1;

      if (star.position.y < 2 || star.position.z > -20 || star.position.x > 180) {
        star.active = false;
      }
    }

    if (data.activeCount !== writeIndex) {
      data.activeCount = writeIndex;
      geometry.setDrawRange(0, writeIndex * 2);
    }

    if (writeIndex > 0) {
      geometry.attributes.position.needsUpdate = true;
      geometry.computeBoundingSphere();
    }
  });

  const normalized = MathUtils.clamp(rate, 0, 1);
  const opacity = MathUtils.lerp(0.35, 0.85, normalized);

  return (
    <lineSegments geometry={data.geometry} frustumCulled={false} visible={normalized > 0.01}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </lineSegments>
  );
};

const Snowfall = ({ intensity }) => {
  const groupRef = useRef();
  const snowflakeTexture = useMemo(
    () =>
      createCanvasTexture(256, (ctx, size) => {
        const center = size / 2;
        const gradient = ctx.createRadialGradient(center, center, size * 0.05, center, center, size * 0.5);
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.7)");
        gradient.addColorStop(0.75, "rgba(255, 255, 255, 0.25)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        ctx.lineWidth = size * 0.024;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        const arms = 6;
        for (let i = 0; i < arms; i += 1) {
          const angle = (i / arms) * Math.PI * 2;
          const x = center + Math.cos(angle) * size * 0.42;
          const y = center + Math.sin(angle) * size * 0.42;
          ctx.beginPath();
          ctx.moveTo(center, center);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }),
    []
  );

  const data = useMemo(() => {
    const positions = new Float32Array(MAX_SNOW_PARTICLES * 3);
    const speeds = new Float32Array(MAX_SNOW_PARTICLES);
    const sway = new Float32Array(MAX_SNOW_PARTICLES);
    const offsets = new Float32Array(MAX_SNOW_PARTICLES);
    const spin = new Float32Array(MAX_SNOW_PARTICLES);

    for (let i = 0; i < MAX_SNOW_PARTICLES; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = Math.random() * 32 + 6;
      positions[i * 3 + 2] = -Math.random() * 210 - 18;
      speeds[i] = 0.75 + Math.random() * 1.95;
      sway[i] = 0.4 + Math.random() * 1.15;
      offsets[i] = Math.random() * Math.PI * 2;
      spin[i] = (Math.random() * 2 - 1) * 0.6;
    }

    const geometry = new BufferGeometry();
    const positionAttribute = new BufferAttribute(positions, 3);
    positionAttribute.setUsage(DynamicDrawUsage);
    geometry.setAttribute("position", positionAttribute);
    geometry.setDrawRange(0, 0);
    geometry.computeBoundingSphere();

    return { geometry, positions, speeds, sway, offsets, spin, activeCount: 0 };
  }, []);

  const pointsRef = useRef();
  const intensityRef = useRef(intensity);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(
    () => () => {
      data.geometry.dispose();
      snowflakeTexture?.dispose?.();
    },
    [data, snowflakeTexture]
  );

  useFrame((state, delta) => {
    if (groupRef.current) {
      const offsetZ = state.camera.position.z - CAMERA_BASE_Z;
      groupRef.current.position.set(0, 0, offsetZ);
    }

    if (!pointsRef.current) return;
    const activeIntensity = MathUtils.clamp(intensityRef.current, 0, 1);
    const baseRatio = activeIntensity === 0 ? 0 : MathUtils.lerp(0.22, 1, activeIntensity);
    const desiredCount = Math.floor(MAX_SNOW_PARTICLES * baseRatio);

    if (data.activeCount !== desiredCount) {
      data.activeCount = desiredCount;
      data.geometry.setDrawRange(0, desiredCount);
    }

    if (desiredCount === 0) return;

    const { positions, speeds, sway, offsets, spin, geometry } = data;
    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(Math.max(delta, 0.0005), 0.033);
    const fallRate = MathUtils.lerp(2.15, 4.9, activeIntensity);
    const driftRate = MathUtils.lerp(0.6, 1.55, activeIntensity);
    const depthRate = MathUtils.lerp(0.38, 1, activeIntensity);
    const gustStrength = Math.sin(time * 0.28) * 0.55 + Math.cos(time * 0.41) * 0.34;
    const gustLateral = Math.sin(time * 0.19) * 0.36;
    const gustPulse = Math.sin(time * 0.72) * 0.26;

    for (let i = 0; i < desiredCount; i += 1) {
      const baseIndex = i * 3;
      const xIndex = baseIndex;
      const yIndex = baseIndex + 1;
      const zIndex = baseIndex + 2;

      const swaySpeed = sway[i];
      const fallVelocity = (speeds[i] * fallRate + 0.6) * clampedDelta;
      const lateralWave = Math.sin(time * (swaySpeed * 0.95) + offsets[i]) * 0.42;
      const depthWave = Math.cos(time * (swaySpeed * 0.62) + offsets[i] * 0.82) * 0.28;

      positions[yIndex] -= fallVelocity;
      positions[xIndex] += (lateralWave + gustStrength * 0.68) * driftRate * clampedDelta;
      positions[zIndex] += (depthWave + gustLateral * 0.74 + gustPulse) * depthRate * clampedDelta;

      offsets[i] += spin[i] * clampedDelta * 0.38;

      if (positions[yIndex] < -6) {
        positions[xIndex] = (Math.random() - 0.5) * 44;
        positions[yIndex] = Math.random() * 34 + 16;
        positions[zIndex] = -Math.random() * 220 - 18;
        speeds[i] = 0.85 + Math.random() * 2.45;
        sway[i] = 0.48 + Math.random() * 1.35;
        offsets[i] = Math.random() * Math.PI * 2;
        spin[i] = (Math.random() * 2 - 1) * 0.68;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  const normalized = MathUtils.clamp(intensity, 0, 1);
  const snowSize = MathUtils.lerp(0.22, 0.4, normalized);
  const opacity = MathUtils.lerp(0.32, 0.85, normalized);

  return (
    <group ref={groupRef}>
      <points
        ref={pointsRef}
        geometry={data.geometry}
        frustumCulled={false}
        visible={normalized > 0.02}
      >
        <pointsMaterial
          color={new Color("#ffffff")}
          size={snowSize}
          sizeAttenuation
          depthWrite={false}
          depthTest={false}
          transparent
          opacity={opacity}
          map={snowflakeTexture ?? undefined}
          alphaMap={snowflakeTexture ?? undefined}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
};

const PetalFall = ({ intensity }) => {
  const groupRef = useRef();
  const petalTexture = useMemo(
    () =>
      createCanvasTexture(192, (ctx, size) => {
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate((Math.PI / 180) * 18);
        const gradient = ctx.createRadialGradient(0, 0, size * 0.12, 0, 0, size * 0.48);
        gradient.addColorStop(0, "rgba(255, 220, 235, 0.95)");
        gradient.addColorStop(0.35, "rgba(255, 178, 208, 0.75)");
        gradient.addColorStop(0.75, "rgba(255, 128, 173, 0.34)");
        gradient.addColorStop(1, "rgba(255, 90, 150, 0)");
        ctx.fillStyle = gradient;
        ctx.scale(1.1, 0.75);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.42, size * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }),
    []
  );

  const data = useMemo(() => {
    const positions = new Float32Array(MAX_PETAL_PARTICLES * 3);
    const speeds = new Float32Array(MAX_PETAL_PARTICLES);
    const sway = new Float32Array(MAX_PETAL_PARTICLES);
    const offsets = new Float32Array(MAX_PETAL_PARTICLES);
    const twirl = new Float32Array(MAX_PETAL_PARTICLES);

    for (let i = 0; i < MAX_PETAL_PARTICLES; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 46;
      positions[i * 3 + 1] = Math.random() * 26 + 6;
      positions[i * 3 + 2] = -Math.random() * 110 - 18;
      speeds[i] = 0.6 + Math.random() * 1.35;
      sway[i] = 0.45 + Math.random() * 1.2;
      offsets[i] = Math.random() * Math.PI * 2;
      twirl[i] = (Math.random() * 2 - 1) * 0.9;
    }

    const geometry = new BufferGeometry();
    const positionAttribute = new BufferAttribute(positions, 3);
    positionAttribute.setUsage(DynamicDrawUsage);
    geometry.setAttribute("position", positionAttribute);
    geometry.setDrawRange(0, 0);
    geometry.computeBoundingSphere();

    return { geometry, positions, speeds, sway, offsets, twirl, activeCount: 0 };
  }, []);

  const pointsRef = useRef();
  const intensityRef = useRef(intensity);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(
    () => () => {
      data.geometry.dispose();
      petalTexture?.dispose?.();
    },
    [data, petalTexture]
  );

  useFrame((state, delta) => {
    if (groupRef.current) {
      const offsetZ = state.camera.position.z - CAMERA_BASE_Z;
      groupRef.current.position.set(0, 0, offsetZ);
    }

    if (!pointsRef.current) return;
    const clampedIntensity = MathUtils.clamp(intensityRef.current, 0, 1);
    const activeIntensity = clampedIntensity <= 0 ? 0 : Math.max(clampedIntensity, MIN_SEASONAL_INTENSITY.petals);
    const desiredCount = activeIntensity === 0 ? 0 : Math.floor(MAX_PETAL_PARTICLES * MathUtils.lerp(0.18, 1, activeIntensity));

    if (data.activeCount !== desiredCount) {
      data.activeCount = desiredCount;
      data.geometry.setDrawRange(0, desiredCount);
    }

    if (desiredCount === 0) return;

    const { positions, speeds, sway, offsets, twirl, geometry } = data;
    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(Math.max(delta, 0.0005), 0.033);
    const fallRate = MathUtils.lerp(1.1, 2.4, activeIntensity);
    const swirlStrength = MathUtils.lerp(0.45, 1.25, activeIntensity);
  const depthStrength = MathUtils.lerp(0.22, 0.52, activeIntensity);
    const breeze = Math.sin(time * 0.38) * 0.6 + Math.cos(time * 0.21) * 0.42;
    const gust = Math.sin(time * 0.64) * 0.35;

    for (let i = 0; i < desiredCount; i += 1) {
      const baseIndex = i * 3;
      const xIndex = baseIndex;
      const yIndex = baseIndex + 1;
      const zIndex = baseIndex + 2;

      const wave = Math.sin(time * (sway[i] * 0.9) + offsets[i]) * swirlStrength;
      const depthWave = Math.cos(time * (sway[i] * 0.7) + offsets[i] * 0.78) * depthStrength;

      positions[yIndex] -= (speeds[i] * fallRate + 0.35) * clampedDelta;
      positions[xIndex] += (wave + breeze) * clampedDelta;
  positions[zIndex] += (depthWave + gust * 0.58) * clampedDelta;

      offsets[i] += twirl[i] * clampedDelta * 0.6;

      if (positions[yIndex] < -4) {
        positions[xIndex] = (Math.random() - 0.5) * 46;
        positions[yIndex] = Math.random() * 24 + 12;
        positions[zIndex] = -Math.random() * 120 - 20;
        speeds[i] = 0.56 + Math.random() * 1.45;
        sway[i] = 0.48 + Math.random() * 1.25;
        offsets[i] = Math.random() * Math.PI * 2;
        twirl[i] = (Math.random() * 2 - 1) * 0.9;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  const normalized = MathUtils.clamp(intensity, 0, 1);
  const size = MathUtils.lerp(0.3, 0.54, normalized);
  const opacity = MathUtils.lerp(0.34, 0.76, normalized);

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={data.geometry} frustumCulled={false} visible={normalized > 0.02}>
        <pointsMaterial
          color={new Color("#ff9fc9")}
          size={size}
          sizeAttenuation
          depthWrite={false}
          depthTest={false}
          transparent
          opacity={opacity}
          map={petalTexture ?? undefined}
          alphaMap={petalTexture ?? undefined}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
};

const LeafFall = ({ intensity }) => {
  const groupRef = useRef();
  const leafTexture = useMemo(
    () =>
      createCanvasTexture(192, (ctx, size) => {
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate((Math.PI / 180) * -12);
        const gradient = ctx.createLinearGradient(-size * 0.4, -size * 0.4, size * 0.45, size * 0.45);
        gradient.addColorStop(0, "rgba(255, 194, 102, 0.95)");
        gradient.addColorStop(0.45, "rgba(255, 147, 57, 0.82)");
        gradient.addColorStop(1, "rgba(196, 66, 28, 0.0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.45);
        ctx.quadraticCurveTo(size * 0.42, -size * 0.2, 0, size * 0.48);
        ctx.quadraticCurveTo(-size * 0.4, -size * 0.1, 0, -size * 0.45);
        ctx.fill();
        ctx.restore();
      }),
    []
  );

  const data = useMemo(() => {
    const positions = new Float32Array(MAX_LEAF_PARTICLES * 3);
    const speeds = new Float32Array(MAX_LEAF_PARTICLES);
    const sway = new Float32Array(MAX_LEAF_PARTICLES);
    const offsets = new Float32Array(MAX_LEAF_PARTICLES);
    const tumble = new Float32Array(MAX_LEAF_PARTICLES);

    for (let i = 0; i < MAX_LEAF_PARTICLES; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 44;
      positions[i * 3 + 1] = Math.random() * 28 + 8;
      positions[i * 3 + 2] = -Math.random() * 120 - 18;
      speeds[i] = 0.8 + Math.random() * 1.8;
      sway[i] = 0.52 + Math.random() * 1.1;
      offsets[i] = Math.random() * Math.PI * 2;
      tumble[i] = (Math.random() * 2 - 1) * 1.15;
    }

    const geometry = new BufferGeometry();
    const positionAttribute = new BufferAttribute(positions, 3);
    positionAttribute.setUsage(DynamicDrawUsage);
    geometry.setAttribute("position", positionAttribute);
    geometry.setDrawRange(0, 0);
    geometry.computeBoundingSphere();

    return { geometry, positions, speeds, sway, offsets, tumble, activeCount: 0 };
  }, []);

  const pointsRef = useRef();
  const intensityRef = useRef(intensity);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(
    () => () => {
      data.geometry.dispose();
      leafTexture?.dispose?.();
    },
    [data, leafTexture]
  );

  useFrame((state, delta) => {
    if (groupRef.current) {
      const offsetZ = state.camera.position.z - CAMERA_BASE_Z;
      groupRef.current.position.set(0, 0, offsetZ);
    }

    if (!pointsRef.current) return;
    const clampedIntensity = MathUtils.clamp(intensityRef.current, 0, 1);
    const activeIntensity = clampedIntensity <= 0 ? 0 : Math.max(clampedIntensity, MIN_SEASONAL_INTENSITY.leaves);
    const desiredCount = activeIntensity === 0 ? 0 : Math.floor(MAX_LEAF_PARTICLES * MathUtils.lerp(0.18, 1, activeIntensity));

    if (data.activeCount !== desiredCount) {
      data.activeCount = desiredCount;
      data.geometry.setDrawRange(0, desiredCount);
    }

    if (desiredCount === 0) return;

    const { positions, speeds, sway, offsets, tumble, geometry } = data;
    const time = state.clock.getElapsedTime();
    const clampedDelta = Math.min(Math.max(delta, 0.0005), 0.033);
    const fallRate = MathUtils.lerp(1.4, 3.1, activeIntensity);
    const swayStrength = MathUtils.lerp(0.6, 1.35, activeIntensity);
    const depthStrength = MathUtils.lerp(0.24, 0.62, activeIntensity);
    const gust = Math.sin(time * 0.23) * 0.55 + Math.cos(time * 0.41) * 0.48;
    const swirl = Math.sin(time * 0.57) * 0.38;

    for (let i = 0; i < desiredCount; i += 1) {
      const baseIndex = i * 3;
      const xIndex = baseIndex;
      const yIndex = baseIndex + 1;
      const zIndex = baseIndex + 2;

      const wave = Math.sin(time * (sway[i] * 0.85) + offsets[i]) * swayStrength;
      const depthWave = Math.cos(time * (sway[i] * 0.68) + offsets[i] * 0.74) * depthStrength;

      positions[yIndex] -= (speeds[i] * fallRate + 0.5) * clampedDelta;
      positions[xIndex] += (wave + gust) * clampedDelta;
      positions[zIndex] += (depthWave + swirl) * clampedDelta;

      offsets[i] += tumble[i] * clampedDelta * 0.5;

      if (positions[yIndex] < -5) {
        positions[xIndex] = (Math.random() - 0.5) * 44;
        positions[yIndex] = Math.random() * 26 + 14;
        positions[zIndex] = -Math.random() * 125 - 20;
        speeds[i] = 0.85 + Math.random() * 1.75;
        sway[i] = 0.52 + Math.random() * 1.1;
        offsets[i] = Math.random() * Math.PI * 2;
        tumble[i] = (Math.random() * 2 - 1) * 1.15;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  const normalized = MathUtils.clamp(intensity, 0, 1);
  const size = MathUtils.lerp(0.32, 0.62, normalized);
  const opacity = MathUtils.lerp(0.38, 0.82, normalized);

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} geometry={data.geometry} frustumCulled={false} visible={normalized > 0.02}>
        <pointsMaterial
          color={new Color("#ffb153")}
          size={size}
          sizeAttenuation
          depthWrite={false}
          depthTest={false}
          transparent
          opacity={opacity}
          map={leafTexture ?? undefined}
          alphaMap={leafTexture ?? undefined}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
};

const ThreeForest = ({ qualityConfig, pointerLookActive, distance, season, onReady }) => {
  const { fireflyCount, starCount, enableShadows, fogDensity, enableBobbing } = qualityConfig;
  const snowIntensity = season?.snowIntensity ?? 0;
  const rainIntensity = season?.rainIntensity ?? 0;
  const petalIntensity = season?.petalIntensity ?? 0;
  const leafIntensity = season?.leafIntensity ?? 0;
  const shootingStarRate = season?.shootingStarRate ?? 0;
  const shootingStarColor = season?.shootingStarColor ?? season?.starColor ?? "#ffffff";
  const travelProgressTarget = MathUtils.clamp(distance / FOREST_MAX_DISTANCE, 0, 1);
  const travelProgress = useSmoothedProgress(travelProgressTarget);
  const celestialState = useMemo(
    () => computeCelestialState(season, travelProgress, { orbitDepth: CELESTIAL_ORBIT_DEPTH }),
    [season, travelProgress]
  );
  const rainImpactQueueRef = useRef([]);

  useEffect(() => {
    if (!onReady) return;
    const frame = requestAnimationFrame(() => {
      onReady();
    });
    return () => cancelAnimationFrame(frame);
  }, [onReady, qualityConfig]);

  const handleRainImpact = useCallback(
    (event) => {
      if (!event || !event.position) return;
      const queue = rainImpactQueueRef.current;
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
      }
      queue.push({
        position: event.position.clone ? event.position.clone() : new Vector3().copy(event.position),
        intensity: event.intensity,
      });
    },
    []
  );

  return (
    <>
      <ForestAtmosphere fogDensity={fogDensity} season={season} />
      <Lighting config={qualityConfig} season={season} sunState={celestialState.sun} />
      <Sun state={celestialState.sun} />
      {starCount > 0 && <Starfield count={starCount} season={season} />}
      <Moon state={celestialState.moon} />
      <Ground shadowsEnabled={enableShadows} color={season?.groundColor} />
      <Road shadowsEnabled={enableShadows} />
  <RainRipples intensity={rainIntensity} impactQueueRef={rainImpactQueueRef} />
      {fireflyCount > 0 && <Fireflies count={fireflyCount} palette={season?.firefly} />}
      <SeasonalBlurbs distance={distance} />
  <PetalFall intensity={petalIntensity} />
  <Rainfall intensity={rainIntensity} onImpact={handleRainImpact} />
  <Snowfall intensity={snowIntensity} />
  <LeafFall intensity={leafIntensity} />
      <ShootingStars rate={shootingStarRate} color={shootingStarColor} />
      <ForestCameraRig isLookActive={pointerLookActive} enableBobbing={enableBobbing} />
    </>
  );
};

const SceneTintOverlay = ({ rainIntensity, season }) => {
  const normalized = MathUtils.clamp(rainIntensity ?? 0, 0, 1);
  const baseColor = new Color(
    season?.ambientColor ??
      season?.hemisphereSkyColor ??
      season?.backgroundColor ??
      "#1a293f"
  );
  const highlight = colorToRgba(adjustColor(baseColor, 0.08, 0.14), MathUtils.lerp(0.12, 0.28, normalized));
  const mid = colorToRgba(baseColor, MathUtils.lerp(0.1, 0.24, normalized));
  const shadow = colorToRgba(adjustColor(baseColor, -0.08, -0.28), MathUtils.lerp(0.25, 0.48, normalized));
  const edge = colorToRgba("#000000", MathUtils.lerp(0.4, 0.68, normalized));

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 mix-blend-soft-light transition-[opacity,background] duration-700 ease-out"
      style={{
        opacity: normalized > 0.02 ? MathUtils.lerp(0.22, 0.58, normalized) : 0,
        background: `radial-gradient(circle at 50% 18%, ${highlight} 0%, transparent 55%), linear-gradient(180deg, ${mid} 0%, ${shadow} 65%, ${edge} 100%)`,
      }}
    />
  );
};

const HudOverlay = ({ qualityLabel, seasonLabel, seasonAccent, onRequestQualityChange }) => {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(33,51,98,0.4),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#030814]/90 via-[#071129]/45 to-transparent" />

      <div className="absolute right-12 top-12 flex w-48 flex-col gap-3 rounded-2xl border border-white/15 bg-[#040a1c]/70 px-6 py-4 text-white/80 backdrop-blur-md shadow-[0_18px_55px_rgba(4,9,25,0.45)]">
        <div>
          <p
            className="text-[0.6rem] uppercase tracking-[0.45em]"
            style={{ color: (seasonAccent ?? "#9dfde2") + "c0" }}
          >
            Quality preset
          </p>
          <p className="mt-1 text-lg font-semibold text-white">{qualityLabel}</p>
        </div>
        <button
          type="button"
          onClick={onRequestQualityChange}
          className="self-start rounded-full border border-white/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-white/75 transition hover:border-emerald-200/60 hover:text-emerald-200/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70"
        >
          Change
        </button>
      </div>

      <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-[#040a1c]/70 px-6 py-3 text-sm uppercase tracking-[0.35em] text-white/80 backdrop-blur-md">
        <span
          className="inline-block h-2 w-2 animate-pulse rounded-full"
          style={{
            backgroundColor: seasonAccent ?? "#9dfde2",
            boxShadow: `0 0 10px ${seasonAccent ?? "#9dfde2"}`,
          }}
        />
        <span>Scroll to move</span>
      </div>
    </>
  );
};

const ForestScene = () => {
  const {
    forestRigRef,
    distance,
    scene,
    qualitySetting,
    setQualitySetting,
    setForestReady,
    resetForest,
  } = useSceneController();
  const performance = usePerformanceProfile();
  const readinessReportedRef = useRef(false);

  const qualityConfig = useMemo(() => {
    if (!qualitySetting) return null;
    return getQualityConfig(qualitySetting, performance);
  }, [qualitySetting, performance]);

  useEffect(() => {
    readinessReportedRef.current = false;
    if (!qualityConfig) {
      setForestReady(false);
    }
  }, [qualityConfig, setForestReady]);

  const seasonPalette = useMemo(() => computeSeasonPalette(distance), [distance]);
  const containerStyle = useMemo(() => {
    const top = seasonPalette.skyTopColor ?? seasonPalette.backgroundColor ?? "#050b18";
    const bottom = seasonPalette.skyBottomColor ?? seasonPalette.backgroundColor ?? "#050b18";
    return {
      background: `linear-gradient(180deg, ${top} 0%, ${bottom} 90%)`,
      transition: "background 0.8s ease, background-color 0.8s ease",
    };
  }, [seasonPalette.skyTopColor, seasonPalette.skyBottomColor, seasonPalette.backgroundColor]);

  const sceneLookActive = scene === "forest-entry" || scene === "forest-travel";
  const pointerLookActive = qualityConfig ? sceneLookActive && qualityConfig.pointerLook : false;

  const handleChangeQuality = useCallback(() => {
    setQualitySetting(null);
  }, [setQualitySetting]);

  const handleReturnToStart = useCallback(() => {
    resetForest();
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(FOREST_RETURN_STORAGE_KEY);
    }
  }, [resetForest]);

  const handleForestReady = useCallback(() => {
    if (readinessReportedRef.current) return;
    readinessReportedRef.current = true;
    setForestReady(true);
  }, [setForestReady]);

  if (!qualityConfig) {
    return <div ref={forestRigRef} className="relative h-full w-full" />;
  }

  return (
    <div ref={forestRigRef} className="relative h-full w-full" style={containerStyle}>
      <Canvas shadows={qualityConfig.enableShadows} dpr={[1, qualityConfig.maxDpr]}>
        <PerspectiveCamera
          makeDefault
          position={[0, CAMERA_BASE_HEIGHT, CAMERA_BASE_Z]}
          fov={55}
          near={0.1}
          far={1800}
        />
        <AdaptiveDpr pixelated />
        <Suspense fallback={null}>
          <ThreeForest
            qualityConfig={qualityConfig}
            pointerLookActive={pointerLookActive}
            distance={distance}
            season={seasonPalette}
            onReady={handleForestReady}
          />
        </Suspense>
      </Canvas>
      <SceneTintOverlay rainIntensity={seasonPalette?.rainIntensity ?? 0} season={seasonPalette} />
      <SeasonalBlurbOverlay distance={distance} seasonPalette={seasonPalette} />
      <TravelMinimap
        distance={distance}
        limit={FOREST_SCROLL_LIMIT}
        accentColor={seasonPalette?.hudAccent}
        onReturnToStart={handleReturnToStart}
      />
      <HudOverlay
        qualityLabel={qualityConfig.label}
        seasonLabel={seasonPalette.activeLabel}
        seasonAccent={seasonPalette.hudAccent}
        onRequestQualityChange={handleChangeQuality}
      />
    </div>
  );
};

export default ForestScene;

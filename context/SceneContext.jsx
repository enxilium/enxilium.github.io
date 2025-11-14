"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { preloadForestAssets } from "@/lib/forestAssets";

export const FOREST_MAX_DISTANCE = 1150;
export const FOREST_SCROLL_LIMIT = 1075;
export const FOREST_RETURN_STORAGE_KEY = "jm-forest-return";
const QUALITY_STORAGE_KEY = "jm-forest-quality";

const SceneContext = createContext(null);

export const SceneProvider = ({ children }) => {
  const heroRef = useRef(null);
  const forestRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const forestRigRef = useRef(null);
  const [scene, setScene] = useState("hero");
  const [forestFadeComplete, setForestFadeComplete] = useState(false);
  const programmaticScrollRef = useRef(false);
  const distanceRef = useRef(0);
  const [distance, setDistance] = useState(0);
  const [qualitySetting, setQualitySettingState] = useState("low");
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [forestReady, setForestReady] = useState(false);
  const [restoredFromReturn, setRestoredFromReturn] = useState(false);

  const scrollToHero = useCallback(() => {
    if (!heroRef.current) return;
    programmaticScrollRef.current = true;
    heroRef.current.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToForest = useCallback(() => {
    if (!forestRef.current) return;
    programmaticScrollRef.current = true;
    forestRef.current.scrollIntoView({ behavior: "smooth" });
  }, []);

  const registerProgrammaticScrollEnd = useCallback(() => {
    programmaticScrollRef.current = false;
  }, []);

  const updateDistance = useCallback((value) => {
    distanceRef.current = value;
    setDistance(value);
  }, []);

  const resetForest = useCallback(() => {
    distanceRef.current = 0;
    setDistance(0);
    if (forestRigRef.current) {
      forestRigRef.current.style.transform = "";
    }
  }, []);

  const setQualitySetting = useCallback((level) => {
    setQualitySettingState((previous) => {
      if (previous === level) {
        if (level) {
          setForestReady(true);
        }
        return previous;
      }
      setForestReady(false);
      return level;
    });
    if (typeof window === "undefined") return;
    if (level) {
      window.localStorage.setItem(QUALITY_STORAGE_KEY, level);
    } else {
      window.localStorage.removeItem(QUALITY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    console.log("[SceneContext] scene changed", { scene, timestamp: Date.now() });
  }, [scene]);

  useEffect(() => {
    console.log("[SceneContext] forestFadeComplete changed", {
      forestFadeComplete,
      timestamp: Date.now(),
    });
  }, [forestFadeComplete]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const stored = window.localStorage.getItem(QUALITY_STORAGE_KEY);
    if (stored === "low" || stored === "medium" || stored === "high") {
      setQualitySettingState(stored);
    } else {
      window.localStorage.setItem(QUALITY_STORAGE_KEY, "low");
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const stored = window.sessionStorage.getItem(FOREST_RETURN_STORAGE_KEY);
    if (!stored) return undefined;

    try {
      const parsed = JSON.parse(stored);
      const storedDistance = typeof parsed?.distance === "number" ? parsed.distance : null;

      if (storedDistance != null && Number.isFinite(storedDistance)) {
        const clampedDistance = Math.max(0, Math.min(FOREST_SCROLL_LIMIT, storedDistance));
        distanceRef.current = clampedDistance;
        setDistance(clampedDistance);
        setScene("forest-travel");
        setForestFadeComplete(true);
        setRestoredFromReturn(true);
      }
    } catch (error) {
      console.error("[SceneContext] Failed to parse return state", error);
    } finally {
      window.sessionStorage.removeItem(FOREST_RETURN_STORAGE_KEY);
    }

    return undefined;
  }, []);

  useEffect(() => {
    let cancelled = false;

    preloadForestAssets()
      .catch(() => null)
      .finally(() => {
        if (!cancelled) {
          setAssetsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      scene,
      setScene,
      heroRef,
      forestRef,
      scrollContainerRef,
      forestRigRef,
      scrollToHero,
      scrollToForest,
      programmaticScrollRef,
      registerProgrammaticScrollEnd,
      forestFadeComplete,
      setForestFadeComplete,
      distance,
      distanceRef,
      updateDistance,
      resetForest,
      qualitySetting,
      setQualitySetting,
      forestReady,
      setForestReady,
      assetsLoaded,
      restoredFromReturn,
      forestMaxDistance: FOREST_MAX_DISTANCE,
      forestScrollLimit: FOREST_SCROLL_LIMIT,
    }),
    [
      scene,
      scrollToHero,
      scrollToForest,
      registerProgrammaticScrollEnd,
      forestFadeComplete,
      setForestFadeComplete,
      distance,
      updateDistance,
      resetForest,
      qualitySetting,
      setQualitySetting,
      forestReady,
      setForestReady,
      assetsLoaded,
      restoredFromReturn,
    ]
  );

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
};

export const useSceneController = () => {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error("useSceneController must be used within a SceneProvider");
  }
  return context;
};

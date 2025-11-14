import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export const MODEL_BASE_PATH = "/models/";
export const ROAD_MODEL_FILE = "PortfolioRoad.glb";

let preloadPromise;

export const preloadForestAssets = () => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (!preloadPromise) {
    const loadRoadModel = () => {
      const gltfLoader = new GLTFLoader();
      gltfLoader.setPath(MODEL_BASE_PATH);
      return gltfLoader.loadAsync(ROAD_MODEL_FILE);
    };
    preloadPromise = loadRoadModel()
      .then(() => null)
      .catch((error) => {
        console.error("[ForestAssets] Failed to preload road model", error);
        return null;
      });
  }

  return preloadPromise;
};

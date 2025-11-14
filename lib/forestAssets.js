import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export const MODEL_BASE_PATH = "/models/";
export const ROAD_MODEL_FILE = "PortfolioRoad.glb";

let preloadPromise;

const createLoader = () => {
  const loader = new GLTFLoader();

  if (typeof window !== "undefined") {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(dracoLoader);

    if (MeshoptDecoder) {
      loader.setMeshoptDecoder(MeshoptDecoder);
    }
  }

  loader.setPath(MODEL_BASE_PATH);
  return loader;
};

export const preloadForestAssets = () => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (!preloadPromise) {
    const loader = createLoader();
    const loadRoadModel = () => {
      return loader.loadAsync(ROAD_MODEL_FILE);
    };
    const schedule = (executor) => {
      if (typeof window.requestIdleCallback === "function") {
        return new Promise((resolve, reject) => {
          window.requestIdleCallback(() => {
            executor().then(resolve).catch(reject);
          });
        });
      }

      return executor();
    };

    preloadPromise = schedule(loadRoadModel)
      .then(() => null)
      .catch((error) => {
        console.error("[ForestAssets] Failed to preload road model", error);
        return null;
      });
  }

  return preloadPromise;
};

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useSceneController } from "@/context/SceneContext";
import { cn } from "@/lib/utils";

const QUALITY_OPTIONS = [
  {
    id: "low",
    title: "Low",
    subtitle: "Best for integrated graphics and battery saver modes",
    highlights: [
      "Lower tree density",
      "Shadows disabled",
      "Minimal atmospheric effects",
    ],
  },
  {
    id: "medium",
    title: "Medium",
    subtitle: "Balanced visuals for most modern laptops",
    highlights: [
      "Moderate tree density",
      "Soft dynamic lighting",
      "Selective particles",
    ],
  },
  {
    id: "high",
    title: "High",
    subtitle: "Full fidelity for dedicated GPUs",
    highlights: [
      "Maximum tree density",
      "Dynamic shadows and fireflies",
      "Rich atmospheric depth",
    ],
  },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const RESUME_LINK = "/JaceMu_Resume7.pdf";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (index) => ({ opacity: 1, y: 0, transition: { delay: 0.1 + index * 0.08, type: "spring", stiffness: 120, damping: 18 } }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

const QualityGate = () => {
  const { assetsLoaded, qualitySetting, setQualitySetting, forestReady } = useSceneController();
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    if (!assetsLoaded) return undefined;

    const timer = window.setTimeout(() => {
      setLoadingComplete(true);
    }, 600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [assetsLoaded]);

  const shouldRender = !loadingComplete || !qualitySetting || !forestReady;
  const showSelector = loadingComplete && !qualitySetting;

  const loadingMessage = useMemo(() => {
    if (!assetsLoaded) return "Preparing 3D assets";
    if (!qualitySetting) return "Warming up lighting and effects";
    if (!forestReady) return "Please wait...";
    return "Finalizing";
  }, [assetsLoaded, qualitySetting, forestReady]);

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="quality-gate"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#040713]"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(51,84,160,0.35),rgba(3,7,16,0.95))]" />
          <div className="relative z-10 w-full max-w-5xl px-6 py-12">
            {!showSelector && (
              <motion.div
                key="loading"
                className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-12 text-white/80 backdrop-blur-md shadow-[0_30px_80px_rgba(4,10,24,0.45)]"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
              >
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/40 border-t-emerald-200/80" />
                <div className="text-center">
                  <p className="text-sm uppercase tracking-[0.5em] text-emerald-200/70">Loading</p>
                  <p className="mt-3 text-xl text-white">{loadingMessage}</p>
                </div>
                <p className="max-w-xl text-center text-sm text-white/70">
                  Rendering a full 3D forest can take a moment, especially on integrated graphics. Hang tight while the site optimizes for your device. In the meantime, feel free to check out my links below!
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-emerald-200/80">
                  <a href="https://github.com/enxilium" target="_blank" rel="noreferrer" className="transition hover:text-emerald-100">
                    GitHub
                  </a>
                  <span className="text-white/40">·</span>
                  <a href="https://www.linkedin.com/in/jace-mu/" target="_blank" rel="noreferrer" className="transition hover:text-emerald-100">
                    LinkedIn
                  </a>
                  <span className="text-white/40">·</span>
                  <a href={RESUME_LINK} target="_blank" rel="noreferrer" className="transition hover:text-emerald-100">
                    Resume
                  </a>
                </div>
              </motion.div>
            )}

            {showSelector && (
              <motion.div
                key="selector"
                className="rounded-3xl border border-white/10 bg-[#050b1d]/80 p-10 text-white shadow-[0_40px_120px_rgba(3,9,24,0.55)] backdrop-blur-xl"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
              >
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.45em] text-emerald-200/70">Choose your experience</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Select a quality preset</h2>
                  <p className="mt-2 text-sm text-white/60">You can revisit this choice later from the forest HUD.</p>
                </div>

                <div className="mt-10 grid gap-6 md:grid-cols-3">
                  {QUALITY_OPTIONS.map((option, index) => (
                    <motion.button
                      key={option.id}
                      type="button"
                      className={cn(
                        "group flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-[0_18px_45px_rgba(5,13,35,0.35)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70",
                        "hover:border-emerald-200/60 hover:bg-emerald-200/10"
                      )}
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      onClick={() => setQualitySetting(option.id)}
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.45em] text-emerald-200/75">{option.title}</p>
                        <h3 className="mt-3 text-2xl font-semibold text-white">{option.subtitle}</h3>
                      </div>
                      <ul className="flex flex-1 list-disc flex-col gap-2 pl-4 text-sm text-white/70">
                        {option.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                      <span className="text-sm font-semibold uppercase tracking-[0.32em] text-white/80 group-hover:text-emerald-200/90">
                        Start
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QualityGate;

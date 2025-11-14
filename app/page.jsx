"use client";

import "@styles/home.css";
import ParallaxHero from "@/components/ParallaxHero";
import ForestExperience from "@/components/ForestExperience";
import QualityGate from "@/components/QualityGate";
import { SceneProvider, useSceneController } from "@/context/SceneContext";
import { useEffect, useRef } from "react";

const ScrollScenes = () => {
  const {
    heroRef,
    forestRef,
    scrollContainerRef,
    setScene,
    scene,
    programmaticScrollRef,
    registerProgrammaticScrollEnd,
  } = useSceneController();
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const heroSection = heroRef.current;
    const forestSection = forestRef.current;

    if (!container || !heroSection || !forestSection) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const sectionId = entry.target.id || entry.target.getAttribute("data-debug-id") || "unknown";

          if (entry.isIntersecting) {
            console.log("[ScrollScenes] Intersection observed", {
              sectionId,
              scene,
              programmatic: programmaticScrollRef.current,
              timestamp: Date.now(),
            });
          }

          if (entry.target === heroSection) {
            if (scene === "forest-entry") return;
            setScene("hero");
          } else if (entry.target === forestSection && scene !== "forest-travel") {
            setScene("forest-entry");
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    observer.observe(heroSection);
    observer.observe(forestSection);

    return () => {
      observer.disconnect();
    };
  }, [forestRef, heroRef, scrollContainerRef, scene, setScene, programmaticScrollRef]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      if (!programmaticScrollRef.current) return;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        registerProgrammaticScrollEnd();
      }, 180);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [programmaticScrollRef, registerProgrammaticScrollEnd, scrollContainerRef]);

  return (
    <main
      ref={scrollContainerRef}
      tabIndex={0}
      className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth"
    >
      <ParallaxHero ref={heroRef} />
      <ForestExperience ref={forestRef} />
    </main>
  );
};

const Home = () => {
  return (
    <SceneProvider>
      <QualityGate />
      <ScrollScenes />
    </SceneProvider>
  );
};

export default Home;

    
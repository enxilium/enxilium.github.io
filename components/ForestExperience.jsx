"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { FOREST_SCROLL_LIMIT, useSceneController } from "@/context/SceneContext";
import { cn } from "@/lib/utils";
import ForestScene from "@/components/ForestScene";

const FADE_DELAY_MS = 1000;
const FADE_DURATION_MS = 0;
const TRAVEL_SENSITIVITY = 0.052;
const TOUCH_SENSITIVITY = 0.11;
const HERO_RETURN_DELAY_MS = 450;

const clampDistance = (value) => Math.max(0, Math.min(FOREST_SCROLL_LIMIT, value));

const ForestExperience = forwardRef(function ForestExperience(_, ref) {
	const {
		scene,
		setScene,
		forestFadeComplete,
		setForestFadeComplete,
		resetForest,
		scrollContainerRef,
		distanceRef,
		updateDistance,
		scrollToHero,
		restoredFromReturn,
		forestReady,
	} = useSceneController();

	const [overlayHidden, setOverlayHidden] = useState(() => restoredFromReturn);
	const returnGuardRef = useRef(false);
	const touchStartRef = useRef(null);

	useEffect(() => {
		let delayTimeout;
		let completeTimeout;

		if (scene === "forest-entry") {
			if (restoredFromReturn) return;
			setForestFadeComplete(false);
			setOverlayHidden(false);
			console.log("[ForestExperience] forest-entry detected", {
				timestamp: Date.now(),
				fadeDelay: FADE_DELAY_MS,
				fadeDuration: FADE_DURATION_MS,
				forestReady,
			});

			if (forestReady) {
				delayTimeout = setTimeout(() => {
					setOverlayHidden(true);
					console.log("[ForestExperience] overlay hidden", { timestamp: Date.now() });
				}, FADE_DELAY_MS);

				completeTimeout = setTimeout(() => {
					setForestFadeComplete(true);
					console.log("[ForestExperience] fade complete", { timestamp: Date.now() });
				}, FADE_DELAY_MS + FADE_DURATION_MS);
			}
		}

		if (scene === "hero") {
			setForestFadeComplete(false);
			setOverlayHidden(false);
			resetForest();
			console.log("[ForestExperience] reset to hero", { timestamp: Date.now() });
			returnGuardRef.current = false;
		}

		return () => {
			if (delayTimeout) clearTimeout(delayTimeout);
			if (completeTimeout) clearTimeout(completeTimeout);
			if (delayTimeout || completeTimeout) {
				console.log("[ForestExperience] cleared fade timeouts", { timestamp: Date.now() });
			}
		};
		}, [forestReady, resetForest, scene, setForestFadeComplete, restoredFromReturn]);

		useEffect(() => {
			if (!restoredFromReturn) return;
			setOverlayHidden(true);
			setForestFadeComplete(true);
		}, [restoredFromReturn, setForestFadeComplete]);

		useEffect(() => {
			if (forestFadeComplete && scene === "forest-entry") {
				console.log("[ForestExperience] advancing to forest-travel", { timestamp: Date.now() });
				setScene("forest-travel");
			}
		}, [forestFadeComplete, scene, setScene]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return undefined;

		if (scene !== "forest-travel") {
			container.style.overflowY = "";
			container.style.scrollSnapType = "";
			container.style.touchAction = "";
			return undefined;
		}

		const previousOverflow = container.style.overflowY;
		const previousSnapType = container.style.scrollSnapType;
		const previousTouchAction = container.style.touchAction;

		const adjustDistance = (delta) => {
			const next = clampDistance(distanceRef.current + delta);

			if (next <= 0 && delta < 0) {
				if (returnGuardRef.current) return;
				returnGuardRef.current = true;
				updateDistance(0);
				setOverlayHidden(false);
				setForestFadeComplete(false);
				setScene("hero");
				setTimeout(() => {
					scrollToHero();
				}, HERO_RETURN_DELAY_MS);
				return;
			}

			if (next !== distanceRef.current) {
				updateDistance(next);
			}
		};

		const handleWheel = (event) => {
				event.preventDefault();
				const deltaDistance = event.deltaY * TRAVEL_SENSITIVITY;
				adjustDistance(deltaDistance);
			};

		const handleTouchStart = (event) => {
			touchStartRef.current = event.touches[0]?.clientY ?? null;
		};

		const handleTouchMove = (event) => {
			if (touchStartRef.current == null) return;
			const currentY = event.touches[0]?.clientY ?? touchStartRef.current;
			const deltaY = touchStartRef.current - currentY;
			if (Math.abs(deltaY) < 2) return;
			event.preventDefault();
			adjustDistance(deltaY * TOUCH_SENSITIVITY);
		};

		const handleTouchEnd = () => {
			touchStartRef.current = null;
		};

		container.addEventListener("wheel", handleWheel, { passive: false });
		container.addEventListener("touchstart", handleTouchStart, { passive: false });
		container.addEventListener("touchmove", handleTouchMove, { passive: false });
		container.addEventListener("touchend", handleTouchEnd);

		container.style.overflowY = "hidden";
		container.style.scrollSnapType = "none";
		container.style.touchAction = "none";

		return () => {
			container.removeEventListener("wheel", handleWheel);
			container.removeEventListener("touchstart", handleTouchStart);
			container.removeEventListener("touchmove", handleTouchMove);
			container.removeEventListener("touchend", handleTouchEnd);
			container.style.overflowY = previousOverflow;
			container.style.scrollSnapType = previousSnapType;
			container.style.touchAction = previousTouchAction;
		};
	}, [distanceRef, scene, scrollContainerRef, scrollToHero, setForestFadeComplete, setScene, updateDistance, setOverlayHidden]);

	return (
		<section
			ref={ref}
			id="forest"
			className="relative flex h-screen w-screen snap-start items-center justify-center bg-[#050b08]"
		>
			<div
				className={cn(
					"pointer-events-none absolute inset-0 z-20 bg-black transition-opacity ease-out",
					overlayHidden ? "opacity-0" : "opacity-100"
				)}
				style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
			/>

			<div
				className={cn(
					"relative z-10 h-full w-full transition-opacity duration-700 ease-out",
					overlayHidden ? "opacity-100" : "opacity-0"
				)}
			>
				<ForestScene />
			</div>
		</section>
	);
});

export default ForestExperience;

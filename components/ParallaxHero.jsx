"use client";

import Image from "next/image";
import { useEffect, forwardRef } from "react";

const ParallaxHero = forwardRef(function ParallaxHero(_, ref) {
	useEffect(() => {
		const handleMouseMove = (event) => {
			const xValue = event.clientX - window.innerWidth / 2;
			const yValue = event.clientY - window.innerHeight / 2;

			const parallaxElements = document.querySelectorAll(".parallax");
			parallaxElements.forEach((el) => {
				const speedX = Number(el.dataset.speedx || 0);
				const speedY = Number(el.dataset.speedy || 0);
				el.style.transform = `translateX(calc(-50% + ${-xValue * speedX}px)) translateY(calc(-50% + ${yValue * speedY}px))`;
			});
		};

		document.addEventListener("mousemove", handleMouseMove);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
		};
	}, []);

	return (
		<section
			ref={ref}
			id="hero"
			className="relative flex h-screen w-screen snap-start items-center justify-center overflow-hidden bg-black"
		>
			<div className="vignette" />
			<span className="shootingStar" />
			<span className="shootingStar" />
			<Image
				src="/Images/Layer 7.png"
				data-speedx="0.027"
				data-speedy="0.027"
				data-distance={-200}
			 className="parallax layer7"
				alt="bg"
				width={2560}
				height={1920}
				priority
			/>
			<Image
				src="/Images/Layer 6.png"
				data-speedx="0.059"
				data-speedy="0.059"
				data-distance={850}
				className="parallax layer6"
				width={2560}
				height={844}
				alt="layer"
			/>
			<Image
				src="/Images/Layer 5.png"
				data-speedx="0.08"
				data-speedy="0.08"
				data-distance={-200}
				className="parallax layer5"
				width={3389}
				height={716}
				alt="layer"
			/>
			<Image
				src="/Images/Layer 4.png"
				data-speedx="0.065"
				data-speedy="0.065"
				data-distance={-200}
				className="parallax layer4"
				width={3280}
				height={788}
				alt="layer"
			/>
			<Image
				src="/Images/fog.png"
				data-speedx="0.25"
				data-speedy="0.25"
				data-distance={-200}
				className="parallax fog"
				width={2560}
				height={1204}
				alt="layer"
			/>
			<Image
				src="/Images/Layer 3.png"
				data-speedx="0.1"
				data-speedy="0.1"
				data-distance={-200}
				className="parallax layer3"
				width={605}
				height={366}
				alt="layer"
			/>
			<div
				data-speedx="0.125"
				data-speedy="0.125"
				data-distance={-200}
				className="parallax name text-[6.5rem] lg:text-[10.5rem]"
			>
				<span className="select-none">Jace Mu</span>
			</div>
			<Image
				src="/Images/Layer 2.png"
				data-speedx="0.15"
				data-speedy="0.15"
				data-distance={-200}
				className="parallax layer2"
				width={2560}
				height={726}
				alt="layer"
			/>
			<Image
				src="/Images/Layer 1.png"
				data-speedx="0.22"
				data-speedy="0.22"
				data-distance={-200}
				className="parallax layer1"
				width={2560}
				height={602}
				alt="layer"
			/>
			<div
				data-speedx="0.125"
				data-speedy="0.125"
				data-distance={-200}
				className="parallax slogan flex items-center justify-center text-[1.5rem] lg:text-[2.5rem]"
			>
				<p id="sloganText">Welcome to my story.</p>
			</div>
			<Image
				src="/Images/moon.png"
				data-speedx="0.027"
				data-speedy="0.027"
				data-distance={-100}
				className="parallax moon"
				width={264}
				height={264}
				alt="layer"
			/>
			<Image src="/Images/light.png" className="light" width={2560} height={1308} alt="layer" />
			<Image src="/Images/scrollArrow.png" className="scrollArrow" width={2560} height={1308} alt="layer" />
		</section>
	);
});

export default ParallaxHero;

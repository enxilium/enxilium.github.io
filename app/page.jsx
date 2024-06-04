/* eslint-disable react/no-unescaped-entities */
"use client"

import Image from 'next/image';
import '@styles/home.css';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import React from 'react';

/* Components */
import { Button } from '@/components/ui/button'
import { FiDownload } from "react-icons/fi";
import Social from '@/components/Socials'
import MainCarousel from '@/components/MainCarousel'
import { TypeAnimation } from 'react-type-animation';

const Home = () => {

  const [color, setColor] = useState("#66b088");

  useEffect(() => {
    const handleMouseMove = (event) => {
      const xValue = event.clientX - window.innerWidth/2;
      const yValue = event.clientY - window.innerHeight/2;

      const parallaxElements = document.querySelectorAll('.parallax');
      parallaxElements.forEach((el) => {
        let speedX = el.dataset.speedx;
        let speedY = el.dataset.speedy;
        el.style.transform = `translateX(calc(-50% + ${-xValue * speedX}px)) 
        translateY(calc(-50% + ${yValue * speedY}px))`;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };

  }, []);

  return (
    <div>
      {
        <>
          <div className="vignette" />
          <span className="shootingStar"></span>
          <span className="shootingStar"></span>
          <Image
            src="/Images/Layer 7.png"
            data-speedx="0.027"
            data-speedy="0.027"
            animation-direction="vertical"
            data-distance={-200}
            className="parallax layer7"
            alt="bg"
            width={2560}
            height={1920}
          />
          <Image
            src="/Images/Layer 6.png"
            data-speedx="0.059"
            data-speedy="0.059"
            animation-direction="vertical"
            data-distance={850}
            className="parallax layer6"
            width={2560}
            height={844}
            alt = "layer"
          />
          <Image
            src="/Images/Layer 5.png"
            data-speedx="0.08"
            data-speedy="0.08"
            animation-direction="horizontal"
            data-distance={-200}
            className="parallax layer5"
            width={3389}
            height={716}
            alt = "layer"
          />
          <Image
            src="/Images/Layer 4.png"
            data-speedx="0.065"
            data-speedy="0.065"
            animation-direction="horizontal"
            data-distance={-200}
            className="parallax layer4"
            width={3280}
            height={788}
            alt = "layer"
          />
          <Image
            src="/Images/fog.png"
            data-speedx="0.25"
            data-speedy="0.25"
            animation-direction="horizontal"
            data-distance={-200}
            className="parallax fog"
            width={2560}
            height={1204}
            alt = "layer"
          />
          <Image
            src="/Images/Layer 3.png"
            data-speedx="0.1"
            data-speedy="0.1"
            animation-direction="horizontal"
            data-distance={-200}
            className="parallax layer3"
            width={605}
            height={366}
            alt = "layer"
          />
          <div
            data-speedx="0.125"
            data-speedy="0.125"
            animation-direction="text"
            data-distance={-200}
            className="parallax name"
          >
            <span>Jace Mu</span>
          </div>
          <Image
            src="/Images/Layer 2.png"
            data-speedx="0.15"
            data-speedy="0.15"
            animation-direction="horizontal"
            data-distance={-200}
            className="parallax layer2"
            width={2560}
            height={726}
            alt = "layer"
          />
          <Image
            src="/Images/Layer 1.png"
            data-speedx="0.22"
            data-speedy="0.22"
            animation-direction="horizontal"
            data-distance={-200}
            className="parallax layer1"
            width={2560}
            height={602}
            alt = "layer"
          />
          <div
            data-speedx="0.125"
            data-speedy="0.125"
            animation-direction="text"
            data-distance={-200}
            className="parallax slogan"
          >
            <p id="sloganText">Welcome to my story.</p>
          </div>
          <Image
            src="/Images/moon.png"
            data-speedx="0.027"
            data-speedy="0.027"
            animation-direction="vertical"
            data-distance={-100}
            className="parallax moon"
            width={264}
            height={264}
            alt = "layer"
          />
          <Image src="/Images/light.png" className="light" 
            width={2560}
            height={1308}
            alt = "layer"
          />
          <Image src="/Images/scrollArrow.png" className="scrollArrow" 
            width={2560}
            height={1308}
            alt = "layer"
          />

          {/* Content */}

          <div className="absolute h-[200vh] w-screen">
            <div className="absolute h-screen w-screen bottom-0 z-50 bg-black">
              <div className="container mx-auto mt-[5%] h-full">
                <div className="flex flex-col xl:flex-row items-center justify-between xl:pt-8 xl:pb-24">
                  {/* Text */}
                  <div className="text-center xl:text-left">
                    <div className="container p-0 text-xl" style={{color: color}}>
                      <TypeAnimation
                        sequence={[
                          "Software Developer",
                          500,
                          () => {
                            setColor("#66b088");
                          },
                          "Data Engineer",
                          900,
                          () => {
                            setColor("#66b088");
                          },
                          "Creative Author",
                          400,
                          () => {
                            setColor("#66b088");
                          },
                          "Music Producer",
                          500,
                          () => {
                            setColor("#66b088");
                          },
                        ]}
                        repeat={Infinity}
                        speed={{
                          type: "keyStrokeDelayInMs",
                          value: 100, //the higher the value the slower the letters
                        }} //This is the speed of typing in milliseconds
                        deletionSpeed={50}
                        wrapper="span"
                        className="ml-1"
                      />
                    </div>
                    <h1 className="h1">
                      Hey! I'm <br /> <span className="text-accent"> Jace </span>
                    </h1>
                    <p className="max-w-[500px] mb-9 mt-5 text-white/80">
                      I am an aspiring leader and life-long learner, seeking to pursue my passions while advancing my career and bringing change to the world with my own two hands.
                    </p>
                    {/* Button/Social Links */}
                    <div className="flex flex-col xl:flex-row items-center gap-8">
                      <Button 
                        variants="outline" 
                        size="lg" 
                        className="uppercase flex items-center gap-2"
                      >
                        <span>Resume</span>
                        <FiDownload className="text-xl"/>
                      </Button>

                      <div className="mb-8 xl:mb-0">
                        <Social 
                          containerStyles="flex gap-6" 
                          iconStyles="w-9 h-9 border border-accent 
                          rounded-full flex justify-center items-center 
                          text-accent text-base hover:bg-accent hover:text-primary 
                          hover:text-primary hover:transition-all duration-500"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Image */}
                  <div className="flex justify-center items-center mb-8 xl:mb-0">
                    <MainCarousel />
                  </div>
                </div>
              </div>
            </div>
          </div>
      </>      
      }
    </div>
  )
}

export default Home

    
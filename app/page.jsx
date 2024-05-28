"use client"

import Image from 'next/image';
import '@styles/home.css';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

const Home = () => {

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
        <main>
          <div className="vignette" />
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
            unoptimized
          />
          <Image
            src="/Images/Layer 5.png"
            data-speedx="0.08"
            data-speedy="0.08"
            animation-direction="horizontal"
            data-distance={-200}
            className="parallax layer5"
            width={2560}
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
            width={2560}
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
          <img
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
          <section className="introduction">
            <div className="profile-pic">
              ! insert image here
            </div>
            <h1>Jace Mu</h1>
            <h2>Web Developer</h2>
            <p className="introduction">
              I'm a passionate web developer based in Brisbane, Australia. I love
              using the latest technologies to create beautiful and functional
              websites. When I'm not coding, I enjoy playing video games, hiking, and
              cooking.
            </p>
            <ul className="skills">
              <li>HTML</li>
              <li>CSS</li>
              <li>JavaScript</li>
              <li>React</li>
              <li>Gatsby</li>
              <li>WordPress</li>
            </ul>
            <a href="#" className="resume-link">
              View Resume
            </a>
          </section>
        </main>
      </>      
      }
    </div>
  )
}

export default Home

    
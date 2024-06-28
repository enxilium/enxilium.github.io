"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  slideInFromLeft,
  slideInFromRight,
  slideInFromTop,
} from "@/utils/motion";
import Image from "next/image";

import { SiNextdotjs, SiTailwindcss, SiPython, SiCsharp, SiTensorflow } from "react-icons/si";
import Photo from "@components/Photo";


const hobbies = [
    {
        num: '01',
        title: 'Software Developer',
        description: 
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        href: ""
    },
    {
        num: '02',
        title: 'ML Enthusiast',
        description: 
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        href: ""
    },
    {
        num: '03',
        title: 'Music Producer',
        description: 
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        href: ""
    },
    {
        num: '04',
        title: 'Creative Author',
        description: 
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        href: ""
    },
];

const About = () => {
    return (
        <div className="mt-[114px] xl:mt-[146px]">
            <section className="min-h-[80vh] flex flex-col justify-center py-12 mx-4 xl:py-0">
                <div className="container mx-auto">
                    <div className="flex flex-col xl:flex-row items-center justify-between xl:pt-8 mx-10">
                        {/* Text */}
                        <div className="h-full w-content flex flex-col gap-5 justify-center text-start min-w-0 order-2 xl:order-none">
                            <div className="Welcome-box py-[8px] px-[7px] border border-accent">
                                <div class="logos">
                                    <div class="logos-slide">
                                        <SiNextdotjs size="25" className="inline-block mx-3" />
                                        <SiTensorflow size="25" className="inline-block mx-3"/>
                                        <SiCsharp size="25" className="inline-block mx-3"/>
                                        <SiPython size="25" className="inline-block mx-3"/>
                                        <SiTailwindcss size="25" className="inline-block mx-3"/>
                                    </div>

                                    <div class="logos-slide">
                                        <SiNextdotjs size="25" className="inline-block mx-3"/>
                                        <SiTensorflow size="25" className="inline-block mx-3"/>
                                        <SiCsharp size="25" className="inline-block mx-3"/>
                                        <SiPython size="25" className="inline-block mx-3"/>
                                        <SiTailwindcss size="25" className="inline-block mx-3"/>
                                    </div>
                                </div>
                            </div>

                            <motion.div
                            className="flex flex-col gap-6 mt-6 text-6xl font-bold text-white max-w-[600px] w-auto h-auto"
                            >
                            <span>
                                Turning
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#adc3c0] to-[#66b088]">
                                {" "}
                                ideas{" "}
                                </span>
                                into
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#66b088] to-[#adc3c0]">
                                {" "}
                                reality.{" "}
                                </span>
                            </span>
                            </motion.div>

                            <motion.p
                            className="text-lg text-gray-400 my-5 max-w-[600px]"
                            >
                            Whether it be in the form of books or code, I write to bring my visions to life. Fueled by curiosity, I am a versatile and proactive learner, dabbling in fields such as competitive programming, machine learning, and web development.
                            </motion.p>
                        </div>
                        
                        {/* Image */}
                        <div className="order-1 xl:order-none mb-8 xl:mb-0">
                            <Photo/>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default About

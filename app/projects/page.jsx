"use client";

import { motion } from "framer-motion";
import React, { useState } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react';
import "swiper/css";

import { BsArrowUpRight, BsGithub } from 'react-icons/bs';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@components/ui/tooltip";

import WorkSliderBtns from "@components/ui/WorkSliderBtns";

import Link from "next/link";
import Image from 'next/image';

const CSprojects = [
    {
        num: '01',
        category: "Full-stack",
        title: "Internflow",
        description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        stack: [{ name: "MongoDB"}, { name: "Express.js"}, { name: "React.js"}, { name: "Node.js"}],
        image: '/Images/internflow.png',
        live: '',
        github: ''
    },
    {
        num: '02',
        category: "Web development",
        title: "Placeholder",
        description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        stack: [{ name: "Vue.js"}],
        image: '/Images/internflow.png',
        live: '',
        github: ''
    },
    {
        num: '03',
        category: "Web development",
        title: "Placeholder",
        description:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        stack: [{ name: "Vue.js"}],
        image: '/Images/internflow.png',
        live: '',
        github: ''
    },
];

const Projects = () => {
    const [CSproject, setProject] = useState(CSprojects[0]);

    const handleSlideChange = (swiper) => {
        const currentIndex = swiper.activeIndex;

        setProject(CSprojects[currentIndex]);
    }

    return ( 
        <div className="mt-[114px]">
            <motion.section 
                initial={{opacity: 0}}
                animate={{opacity: 1, transition: {delay: 2.4, duration: 0.4, ease: 'easeIn'}
                }}
                className="min-h-[80vh] flex flex-col justify-center py-12 mx-4 xl:px-0"
            >
                <div className="container mx-auto">
                    <div className="flex flex-col xl:flex-row xl:gap-[80px]">
                        <div clasName="w-full xl:w-[50%] xl:h-[460px] flex flex-col xl:justify-between
                        order-2 xl:order-none">
                            <div className="flex flex-col gap-[30px] h-[50%]">
                                {/* outline */}
                                <div className="text-8xl leading-none font-extrabold text-transparent text-outline">
                                    {CSproject.num}
                                </div>
                                {/* outline */}
                                <h2 className="text-[42px] font-bold leading-none text-white group-hover:text-accent transition-all duration-500 capitalize">
                                    {CSproject.category}
                                </h2>
                                {/* description */}
                                <p className="text-white/60">{CSproject.description}</p>
                                {/* stack */}
                                <ul className="flex gap-4">
                                    {CSproject.stack.map((item, index) => {
                                        return <li key={index} className="text-xl text-accent">
                                                {item.name}
                                                {index !== CSproject.stack.length - 1 && ","}
                                            </li>
                                    })}
                                </ul>
                                {/* border */}
                                <div className="border border-white/20"></div>
                                {/* buttons */}
                                    <div className="flex items-center gap-4 mb-8">
                                        <Link href={CSproject.live}>
                                            <TooltipProvider delayDuration={100}>
                                                <Tooltip>
                                                    <TooltipTrigger className="w-[50px] h-[50px] rounded-full bg-white/5 flex justify-center items-center group">
                                                        <BsArrowUpRight className="text-white text-2xl group-hover:text-accent"/>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-black text-accent border-accent">
                                                        <p>Live project</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </Link>

                                        <Link href={CSproject.github}>
                                            <TooltipProvider delayDuration={100}>
                                                <Tooltip>
                                                    <TooltipTrigger className="w-[50px] h-[50px] rounded-full bg-white/5 flex justify-center items-center group">
                                                        <BsGithub className="text-white text-3xl group-hover:text-accent"/>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-black text-accent border-accent">
                                                        <p>Github repo</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </Link>
                                    </div>
                            </div>
                        </div>
                        <div className="w-full xl:w-[50%]">
                            <Swiper 
                                spaceBetween={30} 
                                slidesPerView={1}
                                className="xl:h-[520px] mb-12"
                                onSlideChange={handleSlideChange}
                            >
                                {CSprojects.map((project, index) => {
                                    return <SwiperSlide key={index} className="w-full">
                                                <div className="h-[460px] relative group flex justify-center items-center bg-pink-50/20 rounded-lg">
                                                    {/* overlay */}
                                                    <div className="absolute top-0 bottom-0 w-full h-full bg-black/10 z-10 "></div>
                                                    {/* image */}
                                                    <div className="relative w-full h-full">
                                                        <Image src={project.image} alt="project image" fill className="object-cover rounded-lg"/>
                                                    </div>
                                                </div>
                                            </SwiperSlide>;
                                })}
                                {/* slider buttons */}
                                <div className="flex items-center justify-center">
                                    <WorkSliderBtns 
                                        containerStyles="flex gap-2 absolute bottom-[calc(50%_-_22px)] 
                                        xl:bottom-0 z-20 w-full justify-between xl:w-max xl:justify-none" 
                                        btnStyles="bg-none text-faded hover:text-white rounded-md text-[22px] w-[44px]
                                        h-[44px] flex justify-center items-center transition-all"
                                    />
                                </div>
                            </Swiper>
                        </div>
                    </div>
                </div>
            </motion.section>
        </div>
    )
}

export default Projects;

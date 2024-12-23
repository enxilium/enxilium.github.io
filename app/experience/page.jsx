"use client";

import Image from 'next/image'
import {BsArrowDownRight} from "react-icons/bs"
import Link from "next/link";

const experiences = [
    {
        num: '01',
        title: 'Software Developer',
        description: 
            'A passionate creator and developer, using my skills and experience to make a positive impact on the world, one step at a time.',
        href: "https://github.com/enxilium"
    },
    {
        num: '02',
        title: 'Data Enthusiast',
        description: 
            'Data is everywhere, and so are their patterns. Visualizing the connections between each entry is the key to the future (and my free time).',
        href: "https://www.overleaf.com/read/tbbgjzkzmjvy#f1f1c7"
    },
    {
        num: '03',
        title: 'Music Producer',
        description: 
            'In a way, coding and music are similar. They both involve taking small, seemingly mundane parts, and elegantly combining them to create something truly amazing.',
        href: "a"
    },
    {
        num: '04',
        title: 'Creative Author',
        description: 
            'Every word is a story, and my writing is the story of my creativity.',
        href: "a"
    },
];



import { motion } from "framer-motion";

const Experience = () => {
    return ( 
        <div className="mt-[114px] xl:mt-[146px]">
            <section className="min-h-[80vh] flex flex-col justify-center py-12 mx-4 xl:py-0">
                <div className="container mx-auto">
                    <div className="flex items-center justify-center mb-10">
                        <h2 className="h2 mb-8 xl:mb-0">
                            My past <span className="text-accent">stories.</span>
                        </h2>
                    </div>
                    <motion.div 
                        initial={{opacity: 0}} 
                        animate={{
                            opacity: 1,
                            transition: {
                                delay: 2.4,
                                duration: 0.4,
                                ease: "easeIn"
                            }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-[60px]"
                    >
                        {experiences.map((experience, index) => {
                            return <div key={index} className="flex-1 flex flex-col justify-center gap-6 group">
                                <div className="w-full flex justify-between items-center">
                                    <div className="text-5xl font-extrabold text-outline text-transparent group-hover:text-outline-hover transition-all duration-500">{experience.num}</div>
                                    <Link href={experience.href} target="_blank" className ="w-[70px] h-[70px] rounded-full
                                    bg-transparent group-hover:bg-accent transition-all duration-500 flex justify-center items-center hover:-rotate-45">
                                        <BsArrowDownRight className="text-white text-3xl group-hover:text-primary"/>
                                    </Link>
                                </div>

                                <h2 className="text-[42px] font-bold leading-none text-white group-hover:text-accent transition-all duration-250">{experience.title}</h2>
                                <p className="text-white/60">{experience.description}</p>

                                <div className="border-b border-white/20 w-full"></div>

                            </div>
                        })}
                    </motion.div>
                </div>
            </section>
        </div>
    )
}

export default Experience;

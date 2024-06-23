"use client";

import Image from 'next/image'
import {BsArrowDownRight} from "react-icons/bs"
import Link from "next/link";

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

import { motion } from "framer-motion";

const About = () => {
    return (
        <div className="mt-[114px]">
            <section className="min-h-[80vh] flex flex-col justify-center py-12 mx-4 xl:py-0">
                <div className="container mx-auto">
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
                        {hobbies.map((hobby, index) => {
                            return <div key={index} className="flex-1 flex flex-col justify-center gap-6 group">
                                <div className="w-full flex justify-between items-center">
                                    <div className="text-5xl font-extrabold text-outline text-transparent group-hover:text-outline-hover transition-all duration-500">{hobby.num}</div>
                                    <Link href={hobby.href} className="w-[70px] h-[70px] rounded-full
                                    bg-transparent group-hover:bg-accent transition-all duration-500 flex justify-center items-center hover:-rotate-45">
                                        <BsArrowDownRight className="text-white text-3xl group-hover:text-primary"/>
                                    </Link>
                                </div>

                                <h2 className="text-[42px] font-bold leading-none text-white group-hover:text-accent transition-all duration-250">{hobby.title}</h2>
                                <p className="text-white/60">{hobby.description}</p>

                                <div className="border-b border-white/20 w-full"></div>

                            </div>
                        })}
                    </motion.div>
                </div>
            </section>
        </div>
    )
}

export default About
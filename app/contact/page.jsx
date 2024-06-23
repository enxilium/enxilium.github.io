"use client";

import {FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

import {motion} from "framer-motion";
import ContactForm from "@/components/ContactForm";

const info = [
    {
        icon: <FaPhoneAlt />,
        title: 'Phone',
        description: '(+1) 437-261-7822'
    },
    {
        icon: <FaEnvelope />,
        title: 'Email',
        description: 'jace.zkm@gmail.com'
    },
    {
        icon: <FaMapMarkerAlt />,
        title: 'Location',
        description: 'Toronto, Canada'
    },
]

const Contact = () => {
    
    return (
        <div className="mt-[154px]">
            <motion.section initial={{opacity: 0}}
            animate={{
                opacity: 1,
                transition: {
                    delay: 2.4, 
                    duration: 0.4, 
                    ease: 'easeIn'
                }
            }}
            className="py-6 mx-4"
            >
                <div className="container mx-auto">
                    <div className="flex flex-col xl:flex-row gap-[30px]">
                        <div className="xl:h-[54%] order-2 xl:order-none">
                            <ContactForm/>
                        </div>
                        <div className="flex-1 flex items-center xl:justify-end order-1 xl:order-none mb-8 xl:mb-0">
                            <ul className="flex flex-col gap-10">
                                {info.map((item, index) => {
                                    return <li key={index} className="flex items-center gap-6">
                                        <div className="w-[52px] h-[52px] xl:w-[72px] xl:h-[72px] bg-[#27272c] rounded-md text-accent flex items-center justify-center">
                                            <div className="text-[28px]">{item.icon}</div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white/60">{item.title}</p>
                                            <h3 className="text-xl">{item.description}</h3>
                                        </div>
                                        <div>

                                        </div>
                                    </li>
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </motion.section>
        </div> 
    )
}

export default Contact;

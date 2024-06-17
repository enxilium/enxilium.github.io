"use client";
import Image from 'next/image'
import { FaHtml5, FaCss3, FaJs, FaFigma, FaPython, FaRProject} from 'react-icons/fa';
import { TbSql } from 'react-icons/tb';
import { SiTailwindcss, SiNextdotjs } from "react-icons/si";

const about = {
    title: 'About me',
    description: 
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    info: [
        {
            fieldName: "Name",
            fieldValue: "Jace Mu",
        },
        {
            fieldName: "Phone",
            fieldValue: "(+1) 437-261-7822",
        },
        {
            fieldName: "Experience",
            fieldValue: "None",
        },
        {
            fieldName: "Email",
            fieldValue: "jace.zkm@gmail.com",
        },
        {
            fieldName: "Languages",
            fieldValue: "English, Chinese",
        },
    ]
}   

const experience = {
    icon: ''
}

const Resume = () => {
    return ( 
        <div>
            {
            <main>
                <div>Resume</div>
            </main>
            }
        </div>
    )
}

export default Resume;

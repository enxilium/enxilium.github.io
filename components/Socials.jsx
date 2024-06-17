import Link from "next/link";

import {FaGithub, FaLinkedinIn, FaInstagram, FaTwitter } from "react-icons/fa"

const socials = [
    { icon: <FaGithub />, path: "https://github.com/enxilium" },
    { icon: <FaLinkedinIn />, path: "https://www.linkedin.com/in/jace-mu-168835257/" },
    { icon: <FaInstagram />, path: "https://www.instagram.com/jace.zk/" },
    { icon: <FaTwitter />, path: "https://twitter.com/enxilium" },
]

const Socials = ({containerStyles, iconStyles}) => {
  return (
    <div className={containerStyles}>
      {socials.map((item, index) => {
        return (
            <Link 
                key={index}
                href={item.path}
                className={iconStyles}
                target="_blank"
            >
                {item.icon}
            </Link>
        );
    })}
    </div>
  )
}

export default Socials

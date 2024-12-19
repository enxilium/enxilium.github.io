"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
    {
        name: "HOME",
        path: "/",
    },
    {
        name: "ABOUT",
        path: "/about",
    },
    {
        name: "EXPERIENCE",
        path: "/experience",
    },
    {
        name: "CONTACT",
        path: "/contact",
    }
]

const Nav = () => {
    const pathname = usePathname();
  return (
    <nav className="flex gap-8">
        {links.map((link, index) => {
            return (
                <Link 
                    href={link.path} 
                    key={index} 
                    className={`${link.path === pathname && "text-accent border-b-2 border-accent"}
                    capitalize text-2xl font-large hover:text-accent transition-all`}
                    >
                    {link.name}
                </Link>
            );
        })}
    </nav>
  )
}

export default Nav

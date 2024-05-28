import Image from 'next/image'
import Link from 'next/link'

const Nav = () => {
  return (
    <header>
      <nav className="desktop-navbar">
            <div className="navbar-logo">
                <Image
                    src="/Images/logo (white).png"
                    alt="Jace Logo"
                    width={50}
                    height={50}
                />
            </div>
            <div>
                <ul className="nav-links">
                    <li>
                        <a href="#about">About</a>
                    </li>
                    <li>
                        <a href="#Experience">Experience</a>
                    </li>
                    <li>
                        <a href="#Projects">Projects</a>
                    </li>
                    <li>
                        <a href="#Contact">Contact</a>
                    </li>
                </ul>
            </div>
        </nav>
    </header>
  )
}

export default Nav

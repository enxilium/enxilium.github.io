import '@styles/globals.css';
import Nav from '@components/Nav.jsx';

export const metadata = {
  title: "Enxilium's Portfolio",
  description: "A personal website created with Next.js and Tailwind CSS"
}

const BaseLayout = ({children}) => {
  return (
    <html lang="en">
      <body>
        <div className="main">
          <div className="gradient" />
        </div>

        <main className="app">
          <Nav />
          {children}
        </main>
      </body>
    </html>
  )
}

export default BaseLayout;

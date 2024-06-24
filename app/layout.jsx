import '@styles/globals.css';
import Header from '@components/Header.jsx';
import { Poppins } from 'next/font/google';
import PageTransition from '@components/PageTransition';
import StairTransition from '@components/StairTransition';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
})

export const metadata = {
  title: "Jace Mu | Portfolio",
  description: "A personal website created with Next.js and Tailwind CSS"
}

const BaseLayout = ({children}) => {
  
  return (
    <html lang="en">
      <body className={poppins.variable}>
        <Header/>
        <StairTransition></StairTransition>
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  )
}

export default BaseLayout;

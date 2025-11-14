/* eslint-disable react/no-unescaped-entities */
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from '@/components/ui/button'

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import Autoplay from "embla-carousel-autoplay"

const MainCarousel = () => {

  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  )

  const projects = [
    {
      title: "ANTITETRIS",
      description: "NewHacks 2024 First Place Winner: A Tetris-inspired, pure JavaScript game involving trading cyberattacks to raise awareness about cybersecurity.",
      techStack: "JavaScript, Next.js, WebSockets",
      imageURL: "/Images/antitetris.png",
      demoURL: "https://antitetris.vercel.app",
      GitHubURL: "https://github.com/enxilium/antitetris",
    },
    {
      title: "LunaAI",
      description: "A fully-responsive voice-controlled desktop AI assistant capable of controlling music playback, adding events to your calendar, and more.",
      techStack: "Python, SpaCy, Flask",
      imageURL: "/Images/lunaAI.gif",
      demoURL: "https://github.com/enxilium/LunaAI",
      GitHubURL: "https://github.com/enxilium/LunaAI",
    },
    {
      title: "Paletteflow",
      description: "A lightweight color palette generator that leverages AI to generate custom, aesthetic color palettes based on user input to quiz responses.",
      techStack: "C#, .NET, Windows Presentation Foundation Framework",
      imageURL: "/Images/paletteflowPreview.png",
      demoURL: "https://github.com/enxilium/paletteflow/releases/tag/v1.0.0",
      GitHubURL: "https://github.com/enxilium/paletteflow",
    },
    {
      title: "Focus Wizard (WIP)",
      description: "A mobile app that gamifies productivity by offering RPG-style rewards for completing focus tasks in real life that incentivize a healthier lifestyle.",
      techStack: "React Native, Expo, Appwrite",
      imageURL: "/Images/FocusWizard.png",
      demoURL: "https://github.com/enxilium/Focus-Wizard",
      GitHubURL: "https://github.com/enxilium/Focus-Wizard",
    }
  ];

  return (
    <div className="w-[80%] xl:w-[40%] align-middle">
      <div className="flex items-center justify-center w-full">
        <h1 className="hidden xl:block h2 mt-8 text-3xl">HIGHLIGHTS</h1>
      </div>
      <Carousel plugins={[plugin.current]}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      className="w-full mt-4">
    <CarouselContent>
      {projects.map((project) => (
        <CarouselItem key={project.title}>
                  <div className="p-1">
                    <Card className="bg-black text-white border-faded border-opacity-0">
                      <CardHeader>
                        <CardTitle>{project.title}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className=" flex items-center space-x-4 rounded-md border border-faded border-opacity-50 p-4">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              Languages & Frameworks
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {project.techStack}
                            </p>
                          </div>
                        </div>
                        <Link href={project.demoURL} target="_blank" className="group">
                        <div className="relative flex justify-center items-center h-72 overflow-hidden">
                          <Image
                            src={project.imageURL}
                            width={1080}
                            height={1920}
                            className="rounded-md hover:brightness-[.3] transition-all object-fill"
                            alt={`${project.title} preview`}
                          />
                          <span className="pointer-events-none invisible absolute align-middle group-hover:visible">View</span>
                        </div>  
                        </Link>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" asChild>
                          <Link target="_blank" className="mr-2 h-10 w-10" href={project.GitHubURL}>GitHub</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
        </CarouselContent>
        <CarouselPrevious className="bg-transparent text-accent border-accent hover:border-white"/>
        <CarouselNext className="bg-transparent text-accent border-accent hover:border-white"/>
      </Carousel>
    </div>
  )
};

export default MainCarousel

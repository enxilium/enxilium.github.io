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

  const project1 = [
    {
      title: "Allows users without Internet access to still receive weather notifications",
    },
    {
      title: "Scheduled script activation times can be configured to the user's liking",
    },
    {
      title: "Convenient and user-friendly",
    },
    {
      title: "First coding side project!",
    },
  ]

  const project2 = [
    {
      title: "Prevents the need for an online image converter which can be both time consuming and unsafe",
    },
    {
      title: "Runs in background with low resource usage with high reliability and runtime efficiency",
    },
    {
      title: "Natively supports WebP to PNG conversion, but can easily be modified to the user's liking",
    },
  ]

  const project3 = [
    {
      title: "Your call has been confirmed.",
    },
    {
      title: "You have a new message!",
    },
    {
      title: "Your subscription is expiring soon!",
    },
  ]

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

            {/* Project 1 */}
            <CarouselItem>
              <div className="p-1">
                <Card className="bg-black text-white border-faded border-opacity-0">
                  <CardHeader>
                    <CardTitle>Internflow</CardTitle>
                    <CardDescription>A free-to-use online platform for high schoolers to unlock their potential and secure their dreams.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className=" flex items-center space-x-4 rounded-md border border-faded border-opacity-50 p-4">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Languages & Frameworks
                        </p>
                        <p className="text-sm text-muted-foreground">
                          React, Vite, MongoDB, SCSS.
                        </p>
                      </div>
                    </div>
                    <Link href="https://internflow.org" target="_blank" className="group">
                      <div className="relative flex justify-center items-center">
                        <Image
                          src="/Images/internflow.png"
                          width={1080}
                          height={1920}
                          alt="Internflow capture"
                          className="rounded-md hover:brightness-[.3] transition-all"
                        />
                        <span className="pointer-events-none invisible absolute align-middle group-hover:visible">View</span>
                      </div>
                      
                    </Link>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <Link target="_blank" className="mr-2 h-10 w-10" href="https://github.com/enxilium/internflow">GitHub</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </CarouselItem>
            

            {/* Project 2 */}
            <CarouselItem>  
              <div className="p-1">
                  <Card className="bg-black text-white border-faded border-opacity-0">
                    <CardHeader>
                      <CardTitle>Automatic File Converter</CardTitle>
                      <CardDescription>A utility script that automatically scans for new downloads and converts them to the specified format.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className=" flex items-center space-x-4 rounded-md border border-faded border-opacity-50 p-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Languages & Libraries
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Python, Watchdog, PIL.
                          </p>
                        </div>
                      </div>
                      <div>
                        {project2.map((project2, index) => (
                          <div
                            key={index}
                            className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0 align-middle"
                          >
                            <span className="flex h-2 w-2 translate-y-1 rounded-full bg-accent align-middle" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {project2.title}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col space-y-3">
                      <Button className="w-full" asChild>
                        <Link className="mr-2 h-10 w-10" target="_blank" href="https://github.com/enxilium/automatic-webp-to-png-converter">GitHub</Link>
                      </Button>
                      <Button className="w-full bg-[#E2E2E2] text-primary hover:bg-faded" asChild>
                        <Link className="mr-2 h-10 w-10" href="/projects">Read more →</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CarouselItem> 
              
              {/* Project 3 */}
              <CarouselItem>
                <div className="p-1">
                  <Card className="bg-black text-white border-faded border-opacity-0">
                    <CardHeader>
                      <CardTitle>Weather to SMS</CardTitle>
                      <CardDescription>A utility script that sends daily weather alerts to the user's phone as an SMS.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className=" flex items-center space-x-4 rounded-md border border-faded border-opacity-50 p-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            Languages & Libraries
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Python, smtplib, MIME.
                          </p>
                        </div>
                      </div>
                      <div>
                        {project1.map((project1, index) => (
                          <div
                            key={index}
                            className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0 align-middle"
                          >
                            <span className="flex h-2 w-2 translate-y-1 rounded-full bg-accent align-middle" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {project1.title}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col space-y-3">
                      <Button className="w-full" asChild>
                        <Link className="mr-2 h-10 w-10" target="_blank" href="https://github.com/enxilium/weather-to-sms">GitHub</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CarouselItem>

        </CarouselContent>
        <CarouselPrevious className="bg-transparent text-accent border-accent hover:border-white"/>
        <CarouselNext className="bg-transparent text-accent border-accent hover:border-white"/>
      </Carousel>
    </div>
  )
};

export default MainCarousel

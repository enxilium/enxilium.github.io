import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import Image from 'next/image';
import React from 'react';
import Autoplay from "embla-carousel-autoplay"

const MainCarousel = () => {

  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  )

  return (
    <div className="flex items-center justify-center">
      <Carousel plugins={[plugin.current]}
      className="w-[100%]"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}>
        <CarouselContent>
          {Array.from({ length: 5 }).map((_, index) => (
            <CarouselItem key={index}>
              <div className="p-1 w-[200%] aspect-square object-fill">
                <Card>
                  <CardContent className="flex aspect-square w-50 items-center justify-center p-6 ">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
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

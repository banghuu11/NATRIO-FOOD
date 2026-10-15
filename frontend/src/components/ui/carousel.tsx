"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CarouselContextProps {
  currentIndex: number
  totalItems: number
  canScrollPrev: boolean
  canScrollNext: boolean
  scrollPrev: () => void
  scrollNext: () => void
  setTotalItems: React.Dispatch<React.SetStateAction<number>>
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }
  return context
}

interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  opts?: {
    loop?: boolean
    autoPlay?: boolean
    interval?: number
  }
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ opts, className, children, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [totalItems, setTotalItems] = React.useState(0)

    const canScrollPrev = opts?.loop ? true : currentIndex > 0
    const canScrollNext = opts?.loop ? true : currentIndex < totalItems - 1

    const scrollPrev = React.useCallback(() => {
      setCurrentIndex((prev) => {
        if (prev > 0) return prev - 1
        return opts?.loop ? Math.max(0, totalItems - 1) : 0
      })
    }, [opts?.loop, totalItems])

    const scrollNext = React.useCallback(() => {
      setCurrentIndex((prev) => {
        if (prev < totalItems - 1) return prev + 1
        return opts?.loop ? 0 : prev
      })
    }, [opts?.loop, totalItems])

    // Autoplay optional
    React.useEffect(() => {
      if (!opts?.autoPlay || totalItems <= 1) return
      const timer = setInterval(() => {
        scrollNext()
      }, opts.interval || 4000)
      return () => clearInterval(timer)
    }, [opts?.autoPlay, opts?.interval, totalItems, scrollNext])

    return (
      <CarouselContext.Provider
        value={{
          currentIndex,
          totalItems,
          canScrollPrev,
          canScrollNext,
          scrollPrev,
          scrollNext,
          setTotalItems,
          setCurrentIndex,
        }}
      >
        <div
          ref={ref}
          className={cn("relative overflow-hidden group", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { currentIndex, setTotalItems } = useCarousel()
  const itemsCount = React.Children.count(children)

  React.useEffect(() => {
    setTotalItems(itemsCount)
  }, [itemsCount, setTotalItems])

  return (
    <div className="overflow-hidden w-full">
      <div
        ref={ref}
        className={cn(
          "flex transition-transform duration-500 ease-out",
          className
        )}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        {...props}
      >
        {children}
      </div>
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-full shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full shadow-md bg-white/90 backdrop-blur-xs border-slate-200 dark:bg-slate-800/90 dark:border-slate-700",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full shadow-md bg-white/90 backdrop-blur-xs border-slate-200 dark:bg-slate-800/90 dark:border-slate-700",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}

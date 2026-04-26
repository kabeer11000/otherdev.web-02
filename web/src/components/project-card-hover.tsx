'use client'

import { cva } from 'class-variance-authority'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const cardVariants = cva(
  'relative aspect-square overflow-hidden rounded-[5px] transition-all duration-300 group-hover:motion-scale-in-102 group-hover:motion-shadow-in-6 flex items-center justify-center',
  {
    variants: {
      variant: {
        home: 'bg-stone-200',
        broll: '',
      },
    },
    defaultVariants: { variant: 'home' },
  }
)

const imageContainerVariants = cva('relative w-full h-full bg-stone-200', {
  variants: {
    variant: {
      home: 'px-[24px] py-[36px]',
      broll: '',
    },
  },
  defaultVariants: { variant: 'home' },
})

const imageVariants = cva('transition-all duration-300 group-hover:motion-scale-in-102', {
  variants: {
    variant: {
      home: 'object-contain group-hover:motion-translate-y-in-[-2px] p-6 group-hover:motion-shadow-in-8',
      work: 'object-contain group-hover:scale-[0.99] p-6',
      broll: 'object-cover',
    },
  },
  defaultVariants: { variant: 'home' },
})

interface ProjectCardHoverProps {
  title: string
  slug: string
  image: string
  variant: 'home' | 'broll'
  priority?: boolean
  sizes?: string
}

export function ProjectCardHover({
  title,
  slug,
  image,
  variant,
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw',
}: ProjectCardHoverProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  return (
    <>
      <Link
        href={variant === 'broll' ? (slug ?? '#') : `/work/${slug}`}
        className="block group"
        onMouseMove={e => setMousePosition({ x: e.clientX, y: e.clientY })}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cardVariants({ variant })}>
          <div className={imageContainerVariants({ variant })}>
            <Image
              src={image}
              alt={title}
              fill
              sizes={sizes}
              className={imageVariants({ variant })}
              priority={priority}
            />
          </div>
        </div>
      </Link>

      {isHovered && (
        <div
          className="fixed pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-200"
          style={{
            left: `${mousePosition.x + 15}px`,
            top: `${mousePosition.y + 15}px`,
          }}
        >
          <div className="rounded-md backdrop-blur-sm bg-stone-200/70 px-3 py-1.5">
            <p className="text-[#686868] text-[11px] font-normal leading-[14px] whitespace-nowrap">
              {title}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

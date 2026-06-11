'use client'

import { Tooltip } from '@base-ui/react/tooltip'
import Image from 'next/image'
import Link from 'next/link'

const cardVariants =
  'relative aspect-square overflow-hidden rounded-[5px] transition-all duration-300 group-hover:scale-102 group-hover:shadow-md flex items-center justify-center'
const imageContainerVariants = 'relative w-full h-full bg-stone-200'
const imageVariants = 'transition-all duration-300 group-hover:scale-102'
const homeImageClass =
  'object-contain group-hover:-translate-y-[2px] p-6 group-hover:shadow-lg'

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
  const href = variant === 'broll' ? (slug ?? '#') : `/work/${slug}`
  const imgClass = variant === 'home' ? homeImageClass : 'object-cover'

  return (
    <Tooltip.Root trackCursorAxis="both">
      <Tooltip.Trigger render={<Link href={href} className="block group" />}>
        <div className={cardVariants}>
          <div className={imageContainerVariants}>
            <Image
              src={image}
              alt={title}
              fill
              sizes={sizes}
              className={`${imageVariants} ${imgClass}`}
              priority={priority}
            />
          </div>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={15}>
          <Tooltip.Popup className="rounded-md backdrop-blur-sm bg-stone-200/70 px-3 py-1.5 z-50">
            <p className="text-[#686868] text-[11px] font-normal leading-[14px] whitespace-nowrap">
              {title}
            </p>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

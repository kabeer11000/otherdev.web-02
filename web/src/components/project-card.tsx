/** @jsxImportSource react */
import { qwikify$ } from '@builder.io/qwik-react'
import { useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const cardVariants = cva(
  'relative aspect-square overflow-hidden rounded-[5px] transition-all flex items-center justify-center',
  {
    variants: {
      variant: {
        home: 'bg-stone-200 hover:shadow-lg',
        work: 'bg-stone-200',
        broll: '',
      },
    },
    defaultVariants: {
      variant: 'home',
    },
  }
)

const imageContainerVariants = cva('relative w-full h-full bg-stone-200', {
  variants: {
    variant: {
      home: 'px-[24px] py-[36px]',
      work: 'px-[50px] py-[60px]',
      broll: '',
    },
  },
  defaultVariants: {
    variant: 'home',
  },
})

const imageVariants = cva('transition-transform duration-300', {
  variants: {
    variant: {
      home: 'object-contain group-hover:scale-[1.02] p-6',
      work: 'object-contain group-hover:scale-[0.99] p-6',
      broll: 'object-cover',
    },
  },
  defaultVariants: {
    variant: 'home',
  },
})

interface ProjectCardProps extends VariantProps<typeof cardVariants> {
  title: string
  slug: string
  image: string
  description?: string
  showText?: boolean
  priority?: boolean
  sizes?: string
}

function ProjectCardComponent({
  title,
  slug,
  image,
  description,
  variant,
  showText = false,
  priority = false,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const useHover = variant === 'home' || variant === 'broll'

  return (
    <div className="flex flex-col gap-[13px]">
      <div className="relative">
        <a
          href={`/work/${slug}`}
          className="block group"
          onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className={cardVariants({ variant })}>
            <div className={imageContainerVariants({ variant })}>
              <img
                src={image}
                alt={title}
                className={imageVariants({ variant })}
                loading={priority ? 'eager' : 'lazy'}
              />
            </div>
          </div>
        </a>

        {/* Hover Tooltip with CSS Transition */}
        {useHover && (
          <div
            className={`fixed pointer-events-none z-50 transition-all duration-200 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
            style={{
              left: `${mousePosition.x + 15}px`,
              top: `${mousePosition.y + 15}px`,
            }}
          >
            <div className="rounded-md backdrop-blur-sm bg-stone-200/70 px-3 py-1.5">
              <p className="text-muted-foreground text-[11px] font-normal leading-[14px] whitespace-nowrap">
                {title}
              </p>
            </div>
          </div>
        )}
      </div>

      {showText && (
        <a
          href={`/work/${slug}`}
          className="box-border flex flex-col items-start pb-[3px] pt-0 px-0 relative shrink-0"
        >
          <div className="box-border flex flex-col items-start mb-[-3px] relative shrink-0 w-full">
            <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[11.4px] text-black tracking-[-0.24px] w-full">
              <p className="leading-[14px] whitespace-pre-wrap">{title}</p>
            </div>
          </div>
          <div className="box-border flex flex-col items-start mb-[-3px] pb-0 pt-[9px] px-0 relative shrink-0 w-full">
            <div className="flex flex-col font-normal justify-center leading-[14px] not-italic relative shrink-0 text-[#686868] text-[11.1px] tracking-[-0.24px] w-full whitespace-pre-wrap">
              <p className="mb-0">{description}</p>
            </div>
          </div>
        </a>
      )}
    </div>
  )
}

export const ProjectCard = qwikify$(ProjectCardComponent)
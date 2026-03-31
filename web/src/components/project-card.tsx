"use client";

import Image from "next/image";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const cardVariants = cva(
  "relative aspect-square overflow-hidden rounded-[5px] transition-all flex items-center justify-center",
  {
    variants: {
      variant: {
        home: "bg-stone-200 -hover:shadow-lg",
        work: "bg-stone-200",
        broll: "",
      },
    },
    defaultVariants: {
      variant: "home",
    },
  },
);

const imageContainerVariants = cva("relative w-full h-full bg-stone-200", {
  variants: {
    variant: {
      home: "px-[24px] py-[36px]",
      work: "px-[50px] py-[60px]",
      broll: "",
    },
  },
  defaultVariants: {
    variant: "home",
  },
});

const imageVariants = cva("transition-transform duration-300", {
  variants: {
    variant: {
      home: "object-contain group-hover:scale-[1.02] p-6",
      work: "object-contain group-hover:scale-[0.99] p-6",
      broll: "object-cover",
    },
  },
  defaultVariants: {
    variant: "home",
  },
});

interface ProjectCardProps extends VariantProps<typeof cardVariants> {
  title: string;
  slug: string;
  image: string;
  description?: string;
  showText?: boolean;
  priority?: boolean;
}

export function ProjectCard({
  title,
  slug,
  image,
  description,
  variant,
  showText = false,
  priority = false,
}: ProjectCardProps) {
  const showHoverTitle = variant === "home" || variant === "broll";
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div className="flex flex-col gap-[13px]">
      <Link
        href={variant === "broll" ? (slug ?? "#") : `/work/${slug}`}
        className="block group"
        onMouseMove={showHoverTitle ? handleMouseMove : undefined}
        onMouseEnter={showHoverTitle ? handleMouseEnter : undefined}
        onMouseLeave={showHoverTitle ? handleMouseLeave : undefined}
      >
        <div className={cardVariants({ variant })}>
          <div className={imageContainerVariants({ variant })}>
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              className={imageVariants({ variant })}
              priority={priority}
            />
          </div>
        </div>
      </Link>

      <AnimatePresence>
        {showHoverTitle && isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed pointer-events-none z-50"
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
          </motion.div>
        )}
      </AnimatePresence>

      {showText && (
        <Link
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
        </Link>
      )}
    </div>
  );
}

import { component$, useSignal, $ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

interface ProjectCardProps {
  title: string;
  slug?: string;
  image?: string;
  description?: string;
  showText?: boolean;
  priority?: boolean;
  variant?: "home" | "work" | "broll";
}

export const ProjectCard = component$<ProjectCardProps>(({
  title,
  slug,
  image,
  description,
  showText = false,
  priority = false,
  variant = "home",
}) => {
  const isHovered = useSignal(false);
  const mousePosition = useSignal({ x: 0, y: 0 });

  const useHover = variant === "home" || variant === "broll";

  const handleMouseMove = $((e: MouseEvent) => {
    mousePosition.value = { x: e.clientX, y: e.clientY };
  });

  const handleMouseEnter = $(() => {
    isHovered.value = true;
  });

  const handleMouseLeave = $(() => {
    isHovered.value = false;
  });

  const cardContent = (
    <div class={[
      "relative aspect-square overflow-hidden rounded-[5px] transition-all flex items-center justify-center bg-stone-200",
      variant !== "work" ? "group-hover:shadow-lg" : "",
    ]}>
      <div
        class={[
          "relative w-full h-full bg-stone-200",
          variant === "home" ? "px-[24px] py-[36px]" : "",
          variant === "work" ? "px-[50px] py-[60px]" : "",
        ]}
      >
        {image ? (
          <img
            src={image}
            alt={title}
            class={[
              "transition-transform duration-300",
              variant === "home" ? "object-contain group-hover:scale-[1.02] p-6" : "",
              variant === "work" ? "object-contain group-hover:scale-[0.99] p-6" : "",
              variant === "broll" ? "object-cover" : "",
            ]}
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div class="w-full h-full" />
        )}
      </div>
    </div>
  );

  return (
    <div class="flex flex-col gap-[13px]">
      {useHover ? (
        <div
          onMouseMove$={handleMouseMove}
          onMouseEnter$={handleMouseEnter}
          onMouseLeave$={handleMouseLeave}
        >
          <Link
            href={variant === "broll" ? (slug ?? "#") : `/work/${slug}`}
            class="block group"
          >
            {cardContent}
          </Link>

          {isHovered.value && (
            <div
              class="fixed pointer-events-none z-50 rounded-md backdrop-blur-sm bg-stone-200/70 px-3 py-1.5"
              style={{
                left: `${mousePosition.value.x + 15}px`,
                top: `${mousePosition.value.y + 15}px`,
              }}
            >
              <p class="text-[#686868] text-[11px] font-normal leading-[14px] whitespace-nowrap">
                {title}
              </p>
            </div>
          )}
        </div>
      ) : (
        <Link href={`/work/${slug}`} class="block group">
          {cardContent}
        </Link>
      )}

      {showText && slug && (
        <Link
          href={`/work/${slug}`}
          class="box-border flex flex-col items-start pb-[3px] pt-0 px-0 relative shrink-0"
        >
          <div class="box-border flex flex-col items-start mb-[-3px] relative shrink-0 w-full">
            <div class="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[11.4px] text-black tracking-[-0.24px] w-full">
              <p class="leading-[14px] whitespace-pre-wrap">{title}</p>
            </div>
          </div>
          <div class="box-border flex flex-col items-start mb-[-3px] pb-0 pt-[9px] px-0 relative shrink-0 w-full">
            <div class="flex flex-col font-normal justify-center leading-[14px] not-italic relative shrink-0 text-[#686868] text-[11.1px] tracking-[-0.24px] w-full whitespace-pre-wrap">
              <p class="mb-0">{description}</p>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
});
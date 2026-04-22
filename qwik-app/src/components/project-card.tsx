import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

interface ProjectCardProps {
  title: string;
  href?: string;
  image?: string;
  priority?: boolean;
  variant?: "home" | "broll";
}

export const ProjectCard = component$<ProjectCardProps>(({
  title,
  href,
  image,
  priority,
  variant = "home",
}) => {
  const cardContent = (
    <div class="w-[255px] h-[255px] bg-stone-200 rounded-[5px] overflow-hidden">
      {image ? (
        <img
          src={image}
          alt={title}
          class={variant === "broll" ? "w-full h-full object-cover" : "w-full h-full object-contain p-6"}
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <div class="w-full h-full" />
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
});
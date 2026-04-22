import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

interface ProjectCardProps {
  title: string;
  href?: string;
  image?: string;
}

export const ProjectCard = component$<ProjectCardProps>(({ title, href, image }) => {
  const cardContent = (
    <div class="w-[255px] h-[255px] bg-stone-200 rounded-[5px] overflow-hidden">
      {image ? (
        <img
          src={image}
          alt={title}
          class="w-full h-full object-cover"
          loading="lazy"
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
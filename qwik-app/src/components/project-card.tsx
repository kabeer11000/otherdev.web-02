import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

interface ProjectCardProps {
  title: string;
  href?: string;
}

export const ProjectCard = component$<ProjectCardProps>(({ title, href }) => {
  const cardContent = (
    <div class="w-[255px] h-[255px] bg-stone-200 rounded-[5px] p-4 flex items-start">
      <span class="font-[var(--twk-lausanne)] text-[8px] text-stone-400 tracking-tight">
        {title}
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
});

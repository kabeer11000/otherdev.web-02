"use client";

import { useEffect, useState } from "react";
import { ProjectCard } from "@/components/project-card";
import { shuffle } from "@/lib/utils";
import type { PlaylistOrImage } from "@/lib/playlists-and-images";
import type { Project } from "@/lib/projects";

interface ShuffledProjectGridProps {
  initialData: (PlaylistOrImage | Project)[];
}

export function ShuffledProjectGrid({ initialData }: ShuffledProjectGridProps) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(shuffle([...initialData]));
  }, [initialData]);

  return (
    <div className="mt-[30px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px] gap-y-[15px]">
      {data.map((project) => (
        <ProjectCard
          key={project.id}
          title={project.title}
          slug={project?.slug ?? project.url}
          image={project.image}
          description={project.description}
          variant={project?.isPlaylistOrImage ? "broll" : "home"}
        />
      ))}
    </div>
  );
}

"use client";

import { m, Variants } from "framer-motion";
import ProjectCard, { Project } from "./ProjectCard";
import styles from "./ProjectGrid.module.css";

interface ProjectGridProps {
  projects: Project[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

export default function ProjectGrid({ projects }: ProjectGridProps) {
  return (
    <m.div
      className={styles.grid}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {projects.map((project) => (
        <m.div key={project.id} variants={itemVariants}>
          <ProjectCard project={project} />
        </m.div>
      ))}
    </m.div>
  );
}
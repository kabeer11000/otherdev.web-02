"use client";

import { m } from "framer-motion";
import { useState } from "react";
import styles from "./ProjectCard.module.css";

interface Project {
  id: string;
  title: string;
  company: string;
  year: string;
  description: string;
  imageSrc: string;
  url: string;
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <m.div
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={styles.imageContainer}>
        <m.img
          src={project.imageSrc}
          alt={project.title}
          className={styles.image}
          animate={{
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
        <m.div
          className={styles.overlay}
          animate={{
            opacity: isHovered ? 0.8 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
        <m.div
          className={styles.content}
          animate={{
            y: isHovered ? 0 : 20,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        >
          <h3 className={styles.title}>{project.title}</h3>
          <p className={styles.company}>{project.company}</p>
          <p className={styles.year}>{project.year}</p>
        </m.div>
      </div>
    </m.div>
  );
}

export type { Project };
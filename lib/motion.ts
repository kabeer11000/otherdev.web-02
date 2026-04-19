// Framer's animation patterns - GPU accelerated (transform/opacity only)
export const fadeInUp = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { 
    duration: 0.5, 
    ease: [0.19, 1, 0.22, 1] // Framer's ease-out
  }
}

export const staggerChildren = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
        ease: [0.19, 1, 0.22, 1]
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: [0.19, 1, 0.22, 1] 
      }
    }
  }
}

export const scrollReveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { 
    duration: 0.5, 
    ease: [0.19, 1, 0.22, 1] 
  }
}

export const magneticHover = {
  scale: 1.02,
  transition: { 
    type: "spring", 
    stiffness: 300, 
    damping: 20,
    mass: 0.8
  }
}

// Additional Framer patterns
export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  transition: { 
    duration: 0.5, 
    ease: [0.19, 1, 0.22, 1] 
  }
}

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  transition: { 
    duration: 0.5, 
    ease: [0.19, 1, 0.22, 1] 
  }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { 
    duration: 0.5, 
    ease: [0.175, 0.885, 0.32, 1.275] // Framer's ease-spring
  }
}
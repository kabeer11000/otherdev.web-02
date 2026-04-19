'use client'

import { useRef, useEffect, useState } from 'react'
import { m, useScroll, useTransform, useMotionValue } from 'framer-motion'
import styles from './Hero.module.css'

const ScrollIndicator = ({ scrollY }: { scrollY: any }) => {
  const opacity = useTransform(scrollY, [0, 100], [1, 0])
  const y = useTransform(scrollY, [0, 100], [0, -20])

  return (
    <m.div
      className={styles.scrollIndicator}
      style={{ opacity, y }}
    >
      <m.div
        className={styles.mouseIcon}
        animate={{
          y: [0, 8, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg width="24" height="40" viewBox="0 0 24 40" fill="none">
          <rect
            x="1"
            y="1"
            width="22"
            height="38"
            rx="11"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <m.circle
            cx="12"
            cy="12"
            r="3"
            fill="currentColor"
            animate={{
              y: [0, 12, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </svg>
      </m.div>
      <span className={styles.scrollText}>Scroll</span>
    </m.div>
  )
}

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const [isMobile, setIsMobile] = useState(false)

  // Desktop scroll transforms
  const scale = useTransform(scrollY, [0, 500], [1, 1.2])
  const opacity = useTransform(scrollY, [0, 500], [1, 0])
  const y = useTransform(scrollY, [0, 500], [0, -50])
  
  // Mobile scroll transforms (reduced animation distance)
  const mobileScale = useTransform(scrollY, [0, 300], [1, 1.1])
  const mobileOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const mobileY = useTransform(scrollY, [0, 300], [0, -25])

  // Parallax background
  const backgroundY = useTransform(scrollY, [0, 500], [0, -250])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 810)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Choose transforms based on device
  const currentScale = isMobile ? mobileScale : scale
  const currentOpacity = isMobile ? mobileOpacity : opacity
  const currentY = isMobile ? mobileY : y

  return (
    <section className={styles.heroSection} ref={containerRef}>
      {/* Parallax Background */}
      <m.div
        className={styles.heroBackground}
        style={{ y: isMobile ? 0 : backgroundY }}
      />

      {/* Hero Content */}
      <m.div
        className={styles.heroContent}
        style={{
          scale: currentScale,
          opacity: currentOpacity,
          y: currentY
        }}
      >
        {/* Main Headline with SVG Fit Text Approach */}
        <div className={styles.heroHeadline}>
          <m.h1 className={styles.headlineText}>
            <span className={styles.headlineLine}>Create</span>
            <span className={styles.headlineLine}>Amazing</span>
            <span className={styles.headlineLine}>Software</span>
          </m.h1>
        </div>

        {/* Subtitle */}
        <m.p className={styles.heroSubtitle}>
          We bring ideas to life through thoughtful design and powerful code.
          Building the future, one pixel at a time.
        </m.p>

        {/* CTA Button */}
        <m.div
          className={styles.heroCta}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          <a href="/work" className={styles.ctaButton}>
            View Our Work
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M1 15L15 1M15 1H1M15 1V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </m.div>
      </m.div>

      {/* Scroll Indicator */}
      <ScrollIndicator scrollY={scrollY} />

    </section>
  )
}
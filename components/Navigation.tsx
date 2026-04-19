'use client'

import { useRef, useState } from 'react'
import { m, useMotionValue } from 'framer-motion'
import styles from './Navigation.module.css'

const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path 
      d="M1 11L11 1M11 1H1M11 1V11" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

const MagneticLink = ({ children, href, className = "", target, rel }: { 
  children: React.ReactNode
  href: string
  className?: string
  target?: string
  rel?: string
}) => {
  const magnetic = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouse = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    if (!magnetic.current) return
    
    const { left, top, width, height } = magnetic.current.getBoundingClientRect()
    const middleX = clientX - (left + width / 2)
    const middleY = clientY - (top + height / 2)
    x.set(middleX * 0.1)
    y.set(middleY * 0.1)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <m.a
      ref={magnetic}
      href={href}
      className={className}
      target={target}
      rel={rel}
      style={{ x, y }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </m.a>
  )
}

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={styles.navigationDesktop}>
        <div className={styles.navigationContainer}>
          {/* Logo */}
          <div className={styles.navigationLogo}>
            <MagneticLink href="/" className={styles.logoLink}>
              Other Dev®
            </MagneticLink>
          </div>

          {/* Center Navigation */}
          <div className={styles.navigationCenter}>
            <span className={styles.navigationTagline}>Software + Design</span>
            <MagneticLink href="/work" className={styles.navLink}>
              Work
            </MagneticLink>
            <MagneticLink href="/expertise" className={styles.navLink}>
              Expertise
            </MagneticLink>
            <MagneticLink href="/about" className={styles.navLink}>
              About
            </MagneticLink>
          </div>

          {/* Right Section */}
          <div className={styles.navigationRight}>
            <MagneticLink href="/contact" className={`${styles.navLink} ${styles.navLinkPrimary}`}>
              Let's Meet
              <ArrowIcon />
            </MagneticLink>
            
            {/* Social Links */}
            <div className={styles.navigationSocial}>
              <MagneticLink 
                href="https://linkedin.com" 
                className={`${styles.navLink} ${styles.navLinkSocial}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
                <ArrowIcon />
              </MagneticLink>
              <MagneticLink 
                href="https://instagram.com" 
                className={`${styles.navLink} ${styles.navLinkSocial}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
                <ArrowIcon />
              </MagneticLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className={styles.navigationMobile}>
        <div className={styles.navigationContainer}>
          {/* Logo */}
          <div className={styles.navigationLogo}>
            <a href="/" className={styles.logoLink}>
              Other Dev®
            </a>
          </div>

          {/* Menu Button */}
          <button
            className={styles.menuButton}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <m.span
              animate={{
                opacity: isMenuOpen ? 0 : 1,
              }}
              transition={{ duration: 0.2 }}
              className={styles.menuText}
            >
              Menu
            </m.span>
            <m.span
              animate={{
                opacity: isMenuOpen ? 1 : 0,
              }}
              transition={{ duration: 0.2, delay: isMenuOpen ? 0.1 : 0 }}
              className={`${styles.menuText} ${styles.menuTextClose}`}
            >
              Close
            </m.span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <m.div
          className={styles.mobileMenuOverlay}
          initial={{ y: "100%" }}
          animate={{
            y: isMenuOpen ? "0%" : "100%",
          }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <div className={styles.mobileMenuContent}>
            <div className={styles.mobileMenuLinks}>
              <a href="/work" className={styles.mobileNavLink} onClick={toggleMenu}>
                Work
              </a>
              <a href="/expertise" className={styles.mobileNavLink} onClick={toggleMenu}>
                Expertise
              </a>
              <a href="/about" className={styles.mobileNavLink} onClick={toggleMenu}>
                About
              </a>
              <a href="/contact" className={`${styles.mobileNavLink} ${styles.mobileNavLinkPrimary}`} onClick={toggleMenu}>
                Let's Meet
                <ArrowIcon />
              </a>
            </div>

            {/* Mobile Social Links */}
            <div className={styles.mobileSocialBar}>
              <a 
                href="https://linkedin.com" 
                className={styles.mobileSocialLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
                <ArrowIcon />
              </a>
              <a 
                href="https://instagram.com" 
                className={styles.mobileSocialLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
                <ArrowIcon />
              </a>
            </div>
          </div>
        </m.div>
      </nav>

    </>
  )
}
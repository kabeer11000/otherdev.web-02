'use client'

import { LazyMotion, MotionConfig } from 'framer-motion'

const loadFeatures = () =>
  import('../../lib/motion-features').then(res => res.default)

interface MotionProvidersProps {
  children: React.ReactNode
}

export default function MotionProviders({ children }: MotionProvidersProps) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{
          duration: 0.5,
          ease: [0.19, 1, 0.22, 1] // Framer's ease-out
        }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
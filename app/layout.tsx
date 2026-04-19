import type { Metadata } from 'next'
import './globals.css'
import './design-system.css'
import MotionProviders from '@/components/motion/providers'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'OtherDev - Creative Software Agency',
  description: 'Software + Design that brings ideas to life',
  metadataBase: new URL('https://otherdev.com'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              /* Framer's Color System */
              --color-primary: #000000;
              --color-background: #ffffff;
              --color-text: #000000;
              --color-text-secondary: #666666;
              --color-accent: #0099ff;
              --color-border: rgba(0, 0, 0, 0.1);
              
              /* Framer's Spacing (8px base) */
              --space-1: 0.5rem;
              --space-2: 1rem;
              --space-3: 1.5rem;
              --space-4: 2rem;
              --space-6: 3rem;
              --space-8: 4rem;
              --space-12: 6rem;
              --space-16: 8rem;
              
              /* Framer's Animation Timing */
              --duration-instant: 100ms;
              --duration-fast: 200ms;
              --duration-normal: 500ms;
              --duration-slow: 800ms;
              
              /* Framer's Easing */
              --ease-out: cubic-bezier(0.19, 1, 0.22, 1);
              --ease-in-out: cubic-bezier(0.87, 0, 0.13, 1);
              --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
              
              /* Framer's Border Radius */
              --radius-sm: 8px;
              --radius-md: 12px;
              --radius-lg: 20px;
              --radius-xl: 28px;
            }
            
            /* Font loading optimization */
            @font-display: swap;
          `
        }} />
      </head>
      <body>
        <MotionProviders>
          <Navigation />
          {children}
        </MotionProviders>
      </body>
    </html>
  )
}
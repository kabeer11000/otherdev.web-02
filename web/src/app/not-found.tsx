'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <h2 className="mb-6 text-5xl font-semibold">404</h2>
        <h3 className="mb-1.5 text-3xl font-semibold">Page not found</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          The page you&apos;re looking for isn&apos;t found. It might have been moved or
          doesn&apos;t exist.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6"
        >
          Back to home page
        </a>
      </div>

      <div className="relative flex h-[400px] max-h-screen w-full p-2 lg:h-full">
        <div className="h-full w-full rounded-2xl bg-black" />
        {/* biome-ignore lint/performance/noImgElement: External CDN image for 404 illustration */}
        <img
          src="https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/error/image-1.png"
          alt="404 illustration"
          className="absolute top-1/2 left-1/2 h-[clamp(200px,40vw,406px)] -translate-x-1/2 -translate-y-1/2 lg:h-[clamp(260px,25vw,406px)]"
        />
      </div>
    </div>
  )
}

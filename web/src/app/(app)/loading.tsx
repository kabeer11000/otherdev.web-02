'use client'

import { Navigation } from '@/components/navigation'

export default function Loading() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
        {/* Hero skeleton */}
        <div className="animate-pulse">
          <div className="grid grid-cols-12 mb-8">
            <div className="col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
              <div className="h-[14px] w-3/4 bg-neutral-200 rounded mb-4" />
            </div>
          </div>

          {/* Content cards skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px] gap-y-[15px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[4/5] bg-neutral-200 rounded-[5px]" />
                <div className="h-[12px] w-3/4 bg-neutral-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
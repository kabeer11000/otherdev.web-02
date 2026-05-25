import { Navigation } from '@/components/navigation'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
        <div className="grid grid-cols-12 mb-8">
            <div className="col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
              <Skeleton className="h-[14px] w-3/4 mb-4" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px] gap-y-[15px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/5] rounded-[5px]" />
                <Skeleton className="h-[12px] w-3/4" />
              </div>
            ))}
          </div>
      </main>
    </div>
  )
}
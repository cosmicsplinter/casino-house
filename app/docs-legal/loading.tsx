import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-6">
      <Skeleton className="h-10 w-64" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? "w-5/6" : i % 3 === 1 ? "w-2/3" : "w-3/4"}`} />
        ))}
      </div>
    </div>
  )
}

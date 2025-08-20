import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-var(--header-height,0px))] w-full overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 shrink-0 border-r md:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex-1 overflow-auto p-2">
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md p-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-7 w-7 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main column */}
      <div className="grid min-w-0 min-h-0 flex-1 grid-rows-[auto_1fr_auto] overflow-hidden">
        {/* Header */}
        <div className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex min-w-0 flex-col">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="min-h-0 overflow-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-6 lg:px-6">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 7 }).map((_, i) => {
                const isUser = i % 2 === 1
                return (
                  <div key={i} className={`group flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && <Skeleton className="mt-0.5 h-8 w-8 rounded-full" />}
                    <div className={`flex max-w-[80%] flex-col ${isUser ? "items-end" : "items-start"}`}>
                      <Skeleton className="mb-1 h-3 w-16" />
                      <div className={`rounded-md p-3 shadow-sm ${isUser ? "bg-primary/20" : "bg-muted/50"}`}>
                        <Skeleton className="h-3 w-56" />
                        <Skeleton className="mt-2 h-3 w-44" />
                        <Skeleton className="mt-2 h-3 w-64" />
                      </div>
                    </div>
                    {isUser && <Skeleton className="mt-0.5 h-8 w-8 rounded-full" />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="border-t bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-5 lg:px-6">
            <div className="relative rounded-lg border bg-background/60 p-2 shadow-sm">
              <Skeleton className="h-10 w-full" />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-end p-2">
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

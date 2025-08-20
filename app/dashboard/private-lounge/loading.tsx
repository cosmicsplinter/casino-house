export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-var(--header-height))] w-full overflow-hidden">
      <div className="hidden w-64 shrink-0 border-r bg-background/80 md:block">
        <div className="flex h-full flex-col">
          <div className="h-9 border-b" />
          <div className="flex-1 space-y-2 p-2">
            <div className="h-8 animate-pulse rounded bg-muted/50" />
            <div className="h-8 animate-pulse rounded bg-muted/50" />
            <div className="h-8 animate-pulse rounded bg-muted/50" />
          </div>
          <div className="h-12 border-t" />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-12 border-b" />
        <div className="flex-1 p-4">
          <div className="mx-auto w-full max-w-3xl space-y-3">
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted/50" />
            <div className="h-20 w-2/3 animate-pulse rounded bg-muted/50" />
            <div className="h-16 w-1/2 animate-pulse rounded bg-muted/50" />
            <div className="h-24 w-3/4 animate-pulse rounded bg-muted/50" />
          </div>
        </div>
        <div className="h-20 border-t" />
      </div>
    </div>
  )
}

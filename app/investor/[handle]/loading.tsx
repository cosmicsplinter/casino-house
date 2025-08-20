export default function LoadingInvestorProfile() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-12">
      <div className="animate-pulse rounded-xl border p-6">
        <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-muted" />
        <div className="mx-auto mb-2 h-6 w-40 rounded bg-muted" />
        <div className="mx-auto h-4 w-24 rounded bg-muted" />
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="h-16 rounded-md border bg-muted/40" />
          <div className="h-16 rounded-md border bg-muted/40" />
        </div>
      </div>
    </div>
  )
}

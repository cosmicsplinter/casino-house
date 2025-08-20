"use client"

import * as React from "react"
import { IconPresentation } from "@tabler/icons-react"
import { Separator } from "@/components/ui/separator"

export default function TableBlueprintPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 px-4 py-4 lg:px-6">
          <IconPresentation className="h-6 w-6" />
          <h1 className="text-xl font-semibold tracking-tight">Table Blueprint</h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 lg:px-6">
        <p className="text-muted-foreground">
          Coming soon. This standalone page will host the SplitBet pitch deck and product blueprint, built directly in Next.js.
        </p>
        <Separator className="my-6" />
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-lg font-medium">What to expect</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Slide-based presentation with smooth transitions</li>
            <li>Embeddable media and interactive charts</li>
            <li>Mobile-friendly layout</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

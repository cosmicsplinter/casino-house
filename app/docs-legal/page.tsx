"use client"

import * as React from "react"
import { IconScale } from "@tabler/icons-react"
import { Separator } from "@/components/ui/separator"
import { AgreementSign } from "@/components/agreement-sign"

export default function DocsLegalPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 px-4 py-4 lg:px-6">
          <IconScale className="h-6 w-6" />
          <h1 className="text-xl font-semibold tracking-tight">Docs & Legal</h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 lg:px-6">
        <section id="legal">
          <h2 className="text-lg font-medium">Digital Asset Agreement</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Please review the agreement and sign to continue.
          </p>
          <div className="mt-4 rounded-lg border p-6">
            <div className="text-sm">
              View the agreement document: {" "}
              <a className="underline" href="/digital-asset-agreement.md" target="_blank" rel="noreferrer">
                digital-asset-agreement.md
              </a>
            </div>
            <AgreementSign />
          </div>
        </section>

        <Separator className="my-10" />

        <section>
          <h2 className="mb-2 text-lg font-medium">Planned sections</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Ecosystem overview</li>
            <li>Whitepaper</li>
            <li>Tokenomics</li>
            <li>Legal & compliance</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

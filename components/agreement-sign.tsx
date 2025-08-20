"use client"

import * as React from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAgreementSign } from "@/hooks/use-agreement-sign"

export function AgreementSign({ cid }: { cid?: string }) {
  const { signing, signed, error, payload, signAgreement } = useAgreementSign(cid)

  return (
    <div className="mt-4 grid gap-3">
      <div className="text-sm text-muted-foreground">
        By proceeding, you agree to cryptographically sign a message that permanently links your wallet to the Digital Asset Agreement (CID).
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={signAgreement} disabled={signing || signed}>
          {signing ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Requesting signature…</span>
          ) : signed ? (
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Agreement signed</span>
          ) : (
            "Sign Agreement & Continue"
          )}
        </Button>
        {signed && (
          <div className="text-sm text-emerald-400 inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Agreement successfully signed on-chain!
          </div>
        )}
      </div>
      {error ? <div className="text-sm text-rose-400">{error}</div> : null}
      {payload ? (
        <div className="text-xs text-muted-foreground">
          Address: {payload.address.slice(0, 6)}…{payload.address.slice(-4)} • CID: {payload.cid} • Signed: {new Date(payload.signedAt).toLocaleString()}
        </div>
      ) : null}
    </div>
  )
}

"use client"

import * as React from "react"

export type AgreementSignature = {
  address: string
  cid: string
  signature: string
  signedAt: string // ISO string
}

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

const STORAGE_KEY = "agreement_signature_v1"
const DEFAULT_CID = process.env.NEXT_PUBLIC_AGREEMENT_IPFS_CID || "QmPLACEHOLDERCID"

export function useAgreementSign(cid: string = DEFAULT_CID) {
  const [signing, setSigning] = React.useState(false)
  const [signed, setSigned] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [payload, setPayload] = React.useState<AgreementSignature | null>(null)

  // Hydrate from storage
  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as AgreementSignature
      if (parsed && parsed.cid === cid && parsed.signature) {
        setPayload(parsed)
        setSigned(true)
      }
    } catch {
      /* ignore */
    }
  }, [cid])

  const signAgreement = React.useCallback(async () => {
    setError(null)
    setSigning(true)
    try {
      const w = window as unknown as { ethereum?: EthereumProvider }
      if (!w.ethereum) {
        throw new Error("Wallet not detected. Please install or open MetaMask.")
      }

      // Request accounts (prompts unlock if needed)
      const accounts = (await w.ethereum.request({ method: "eth_requestAccounts" })) as string[]
      const address = accounts?.[0]
      if (!address) throw new Error("No wallet address found.")

      const timestamp = new Date().toISOString()
      const message = [
        "SplitBet Digital Asset Agreement",
        `CID: ${cid}`,
        `Address: ${address}`,
        `Timestamp: ${timestamp}`,
      ].join("\n")

      // personal_sign expects params [message, address]
      const signature = (await w.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      })) as string

      const record: AgreementSignature = { address, cid, signature, signedAt: timestamp }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
      } catch {}

      setPayload(record)
      setSigned(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to sign agreement"
      setError(msg)
    } finally {
      setSigning(false)
    }
  }, [cid])

  const reset = React.useCallback(() => {
    setError(null)
    setSigned(false)
    setPayload(null)
  }, [])

  return { signing, signed, error, payload, signAgreement, reset }
}

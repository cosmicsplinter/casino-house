"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

// Minimal MetaMask typing kept generic to avoid global conflicts elsewhere
type EthereumProvider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
declare global { interface Window { ethereum?: EthereumProvider } }

const STORAGE_KEY = "wallet_connected_flag"
const WALLET_ADDR_KEYS = ["wallet_address", "primary_wallet"] as const

export function WalletGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true)
  const [connected, setConnected] = React.useState(false)

  const check = React.useCallback(async () => {
    if (typeof window === "undefined") return
    const hasEth = !!window.ethereum
    if (!hasEth) { setLoading(false); setConnected(false); return }
    try {
      const accounts = (await window.ethereum!.request({ method: "eth_accounts" })) as string[]
      const ok = !!accounts && accounts.length > 0
      setConnected(ok)
      if (ok) {
        try {
          for (const k of WALLET_ADDR_KEYS) localStorage.setItem(k, accounts[0])
        } catch {}
      }
    } catch {
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { check() }, [check])

  // React to provider events and custom header events
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const eth = window.ethereum

    const onAccountsChanged = (accs: string[]) => {
      const ok = !!accs && accs.length > 0
      setConnected(ok)
      try {
        if (ok) {
          for (const k of WALLET_ADDR_KEYS) localStorage.setItem(k, accs[0])
        } else {
          for (const k of WALLET_ADDR_KEYS) localStorage.removeItem(k)
        }
      } catch {}
    }
    const onDisconnect = () => {
      setConnected(false)
      try { for (const k of WALLET_ADDR_KEYS) localStorage.removeItem(k) } catch {}
    }
    const onFocus = () => { check() }
    const onCustomDisconnect = () => { setConnected(false) }

    // @ts-expect-error EIP-1193 style events not typed here
    eth?.on?.("accountsChanged", onAccountsChanged)
    // @ts-expect-error EIP-1193 style events not typed here
    eth?.on?.("disconnect", onDisconnect)
    window.addEventListener("focus", onFocus)
    window.addEventListener("wallet:disconnected", onCustomDisconnect as EventListener)

    return () => {
      // @ts-expect-error EIP-1193 style events not typed here
      eth?.removeListener?.("accountsChanged", onAccountsChanged)
      // @ts-expect-error EIP-1193 style events not typed here
      eth?.removeListener?.("disconnect", onDisconnect)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("wallet:disconnected", onCustomDisconnect as EventListener)
    }
  }, [check])

  const onConnect = React.useCallback(async () => {
    if (!window.ethereum) return
    try {
      // Try permission prompt first
      try {
        await window.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] })
      } catch {}
      const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[]
      if (accounts && accounts.length) {
        window.localStorage.setItem(STORAGE_KEY, "1")
        setConnected(true)
        try { for (const k of WALLET_ADDR_KEYS) localStorage.setItem(k, accounts[0]) } catch {}
      }
    } catch {
      // ignore
    }
  }, [])

  if (loading) return null
  if (!connected) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-xl font-semibold mb-2">Connect your wallet</h2>
          <p className="text-sm text-muted-foreground mb-4">You must connect your wallet to access this page.</p>
          <Button onClick={onConnect}>Connect Wallet</Button>
        </div>
      </div>
    )
  }
  return <>{children}</>
}

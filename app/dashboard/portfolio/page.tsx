"use client"

import * as React from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ExternalLink, FileText, Download, Copy as CopyIcon, Check as CheckIcon, LogOut as LogOutIcon, ShieldCheck, Coins, Crown, BadgeDollarSign, Percent, Info } from "lucide-react"
import { useAgreementSign } from "@/hooks/use-agreement-sign"
import { AuroraBg } from "@/components/aurora-bg"
import { useUser } from "@/components/user-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Toggle } from "@/components/ui/toggle"
import { supabase } from "@/lib/supabase-client"

export default function PortfolioPage() {
  const { user, updateUser } = useUser()
  const [isPublic, setIsPublic] = React.useState<boolean>(Boolean(user.isPublic))
  const [authUserId, setAuthUserId] = React.useState<string | null>(null)
  const [linkCopied, setLinkCopied] = React.useState(false)
  React.useEffect(() => { setIsPublic(Boolean(user.isPublic)) }, [user.isPublic])
  React.useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => { if (!mounted) return; setAuthUserId(data.user?.id ?? null) })
    return () => { mounted = false }
  }, [])
  // Agreement dialog state
  const [agreementOpen, setAgreementOpen] = React.useState(false)
  const [agreementLoading, setAgreementLoading] = React.useState(false)
  const [agreementText, setAgreementText] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const AGREEMENT_CID = process.env.NEXT_PUBLIC_AGREEMENT_IPFS_CID || "QmPLACEHOLDERCID"
  const { payload: sigPayload } = useAgreementSign(AGREEMENT_CID)
  const [mintTxHash, setMintTxHash] = React.useState<string | null>(null)
  const SAMPLE_TX_HASH = "0x9f1c3a5b2d9f0c0f4b6a0e2a3d4c5b6a7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"

  // Wallet detection
  type EthereumProvider = {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    on?: (event: string, handler: (...args: unknown[]) => void) => void
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
  }
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null)
  const [chainId, setChainId] = React.useState<string | null>(null)
  const [walletProviderName, setWalletProviderName] = React.useState<string | null>(null)
  const shorten = React.useCallback((v?: string | null, head = 6, tail = 4) => {
    if (!v) return ""
    return v.length > head + tail + 3 ? `${v.slice(0, head)}…${v.slice(-tail)}` : v
  }, [])
  const STORAGE_KEY = "wallet_connected_flag"
  const connected = Boolean(walletAddress)
  const POLYGON_CHAIN_ID = "0x89"
  const isPolygon = chainId === POLYGON_CHAIN_ID
  const chainName = React.useMemo(() => {
    switch (chainId) {
      case "0x1": return "Ethereum"
      case "0x5": return "Goerli"
      case "0xaa36a7": return "Sepolia"
      case "0x89": return "Polygon"
      case "0x13881": return "Polygon Mumbai"
      case "0xe708":
      case "0xE708":
        return "Linea"
      default: return chainId ? `Chain ${parseInt(chainId, 16)}` : "Unknown"
    }
  }, [chainId])

  React.useEffect(() => {
    const w = window as unknown as { ethereum?: EthereumProvider & { isMetaMask?: boolean } }
    if (!w.ethereum) return
    let mounted = true

    const load = async () => {
      try {
        const acc = (await w.ethereum!.request({ method: "eth_accounts" })) as string[]
        const cid = (await w.ethereum!.request({ method: "eth_chainId" })) as string
        if (!mounted) return
        setWalletAddress(acc?.[0] ?? null)
        setChainId(cid || null)
        setWalletProviderName(w.ethereum?.isMetaMask ? "MetaMask" : null)
      } catch {
        /* noop */
      }
    }
    load()

    const onAccountsChanged = (...args: unknown[]) => {
      const accounts = (args[0] as string[] | undefined) ?? []
      setWalletAddress(accounts[0] ?? null)
    }
    const onChainChanged = (...args: unknown[]) => {
      const cid = (args[0] as string | undefined) ?? null
      setChainId(cid)
    }
    w.ethereum.on?.("accountsChanged", onAccountsChanged)
    w.ethereum.on?.("chainChanged", onChainChanged)
    return () => {
      mounted = false
      w.ethereum?.removeListener?.("accountsChanged", onAccountsChanged)
      w.ethereum?.removeListener?.("chainChanged", onChainChanged)
    }
  }, [])

  // Load possible mint transaction hash from localStorage when dialog opens
  React.useEffect(() => {
    if (!agreementOpen) return
    try {
      if (typeof window === "undefined") return
      const keys = [
        "agreement_mint_tx_hash",
        "mint_tx_hash",
        "last_mint_tx_hash",
        "portfolio_mint_tx_hash",
      ]
      for (const k of keys) {
        const v = window.localStorage.getItem(k)
        if (v) {
          setMintTxHash(v)
          return
        }
      }
      setMintTxHash(null)
    } catch {
      setMintTxHash(null)
    }
  }, [agreementOpen])

  const onConnect = React.useCallback(async () => {
    const w = window as unknown as { ethereum?: EthereumProvider & { isMetaMask?: boolean } }
    if (!w.ethereum) return
    try {
      try {
        await w.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] })
      } catch { /* fallback below */ }
      const accounts = (await w.ethereum.request({ method: "eth_requestAccounts" })) as string[]
      const cid = (await w.ethereum.request({ method: "eth_chainId" })) as string
      setWalletAddress(accounts && accounts.length ? accounts[0] : null)
      setChainId(cid || null)
      setWalletProviderName(w.ethereum?.isMetaMask ? "MetaMask" : null)
      if (typeof window !== "undefined" && accounts && accounts.length) {
        window.localStorage.setItem(STORAGE_KEY, "1")
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to connect wallet")
    }
  }, [])

  const switchToPolygon = React.useCallback(async () => {
    const w = window as unknown as { ethereum?: EthereumProvider & { isMetaMask?: boolean } }
    if (!w.ethereum) {
      setChainId(POLYGON_CHAIN_ID)
      toast.message("Switched (simulated) to Polygon")
      return
    }
    try {
      await w.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: POLYGON_CHAIN_ID }] })
      setChainId(POLYGON_CHAIN_ID)
      toast.success("Switched to Polygon")
    } catch (err: unknown) {
      const e = err as { code?: number | string; message?: string }
      if (e && (e.code === 4902 || e.message?.includes("Unrecognized chain ID"))) {
        try {
          await w.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: POLYGON_CHAIN_ID,
              chainName: "Polygon",
              nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
              rpcUrls: ["https://polygon-rpc.com"],
              blockExplorerUrls: ["https://polygonscan.com"],
            }],
          })
          setChainId(POLYGON_CHAIN_ID)
          toast.success("Polygon added and switched")
          return
        } catch {}
      }
      toast.error("Failed to switch network")
    }
  }, [])

  const onDisconnectWallet = React.useCallback(async () => {
    const w = window as unknown as { ethereum?: EthereumProvider }
    try {
      await w.ethereum?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] })
    } catch {}
    setWalletAddress(null)
    try {
      const cid = (await w.ethereum?.request({ method: "eth_chainId" })) as string | undefined
      setChainId(cid ?? null)
    } catch {
      setChainId(null)
    }
    try { if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY) } catch {}
    try { if (typeof window !== "undefined") window.dispatchEvent(new Event("wallet:disconnected")) } catch {}
    toast.success("Wallet disconnected")
  }, [])

  const maskedAddr = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "0xAbCd...1234"
  const polygonScanUrl = walletAddress ? `https://polygonscan.com/address/${walletAddress}` : "#"
  const openSeaUrl = walletAddress ? `https://opensea.io/${walletAddress}` : "#"
  const agreementUrl = "/digital-asset-agreement.md"
  const tierMock = { name: "Chairman", req: "Requires 1,000+ shares" }
  const votingPower = 42
  const totalHoldings = 37

  return (
    <div className="@container/main flex flex-1 flex-col">
      <div className="flex flex-col py-4 md:py-6">
        <div className="px-4 lg:px-6 grid gap-5 md:gap-6">
          <section className="grid gap-4">
            <div>
              <h3 className="text-base md:text-lg font-semibold">My Portfolio</h3>
              <p className="text-muted-foreground text-sm">Your on-chain identity and holdings.</p>
            </div>
            {/* Card A: Public profile controls and link */}
            <Card>
              <CardContent className="grid gap-4 md:gap-5 px-6 py-5">
                {/* Identity header from profile */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 rounded-xl">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.handle || user.name || "User"} />
                    <AvatarFallback className="rounded-xl">🎲</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium">{user.displayName || user.name || user.handle || "Investor"}</div>
                    <div className="truncate text-sm text-muted-foreground">@{(user.handle || "").replace(/^@+/, "")}</div>
                  </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          aria-label="What is the public investor page?"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-80 text-sm">
                        <div className="space-y-2">
                          <div className="font-medium">Public investor page</div>
                          <p className="text-muted-foreground">
                            When enabled, anyone with your link can view a read-only profile that shows your avatar, handle, short bio, tier and non-sensitive stats. Wallet
                            addresses and private data are never exposed.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Toggle
                    aria-label="Toggle public profile"
                    pressed={isPublic}
                    onPressedChange={async (v) => {
                      const normalized = (user.handle || "").replace(/^@+/, "").toLowerCase()
                      if (!normalized) {
                        toast.error("Set a handle first to enable public profile")
                        return
                      }
                      setIsPublic(v)
                      updateUser({ isPublic: v, handle: normalized })
                      try {
                        let uid = authUserId
                        if (!uid) {
                          const { data } = await supabase.auth.getUser()
                          uid = data.user?.id ?? null
                          if (uid) setAuthUserId(uid)
                        }
                        if (!uid) return
                        const { error: pubErr } = await supabase.from("profiles").upsert({ id: uid, handle: normalized, is_public: v })
                        if (pubErr) {
                          console.error("profiles public toggle error", pubErr)
                          toast.error("Failed to update public profile setting")
                          setIsPublic(!v)
                          updateUser({ isPublic: !v })
                          return
                        }
                        toast.success(v ? "Public profile enabled" : "Public profile disabled")
                      } catch {
                        setIsPublic(!v)
                        updateUser({ isPublic: !v })
                      }
                    }}
                  >
                    {isPublic ? "Public" : "Private"}
                  </Toggle>
                  </div>
                </div>
                {isPublic && (
                  <div className="-mt-2 grid gap-2 rounded-md border p-3">
                    {(() => {
                      const normalized = (user.handle || "").replace(/^@+/, "").toLowerCase()
                      const href = typeof window !== "undefined" && normalized
                        ? `${window.location.origin}/investor/@${normalized}`
                        : (normalized ? `/investor/@${normalized}` : "")
                      return (
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-xs">
                            <span className="text-muted-foreground">Public link:</span>
                            {normalized ? (
                              <a
                                className="ml-1 inline-flex max-w-[55vw] items-center truncate rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground no-underline"
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {href}
                              </a>
                            ) : (
                              <span className="ml-1 text-amber-400">Set a handle to generate a link.</span>
                            )}
                          </div>
                          {normalized && (
                            <div className="flex items-center gap-2">
                              <Button asChild size="sm" variant="secondary" className="group inline-flex items-center gap-2">
                                <a href={href} target="_blank" rel="noreferrer">
                                  <span>Open</span>
                                  <ExternalLink className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                                </a>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="group relative inline-flex h-8 w-20 items-center justify-center overflow-hidden"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(href)
                                    setLinkCopied(true)
                                    setTimeout(() => setLinkCopied(false), 1000)
                                    toast.success("Link copied")
                                  } catch {
                                    toast.error("Failed to copy")
                                  }
                                }}
                              >
                                <span className="absolute inset-0 flex items-center justify-center gap-1 transition-opacity duration-200" style={{ opacity: linkCopied ? 0 : 1 }}>
                                  <CopyIcon className="h-3.5 w-3.5" />
                                  <span>Copy</span>
                                </span>
                                <span className="absolute inset-0 flex items-center justify-center gap-1 transition-opacity duration-200" style={{ opacity: linkCopied ? 1 : 0 }}>
                                  <CheckIcon className="h-4 w-4 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </span>
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card B: Wallet connection and on-chain details */}
            <Card>
              <CardContent className="grid gap-4 md:gap-5 px-6 py-5">
                {connected ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" aria-hidden="true" />
                        <span className="text-sm font-medium">Connected{walletProviderName ? `: ${walletProviderName}` : ""}</span>
                        {walletProviderName === "MetaMask" && (
                          <Image src="/logo-metamask.svg" alt="MetaMask" width={16} height={16} className="opacity-90" />
                        )}
                      </div>
                      <Badge variant="outline" className="h-5 px-2 text-[10px] font-mono">{chainName}</Badge>
                      {connected && !isPolygon && (
                        <>
                          <Badge variant="outline" className="h-5 px-2 text-[10px] font-mono border-rose-500/40 text-rose-400">Wrong network</Badge>
                          <Button type="button" variant="outline" onClick={switchToPolygon}>Switch to Polygon</Button>
                        </>
                      )}
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="wallet">Wallet Address</Label>
                      <div className="flex gap-2">
                        <Input id="wallet" value={maskedAddr} readOnly className="flex-1" />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 w-9 p-0 relative overflow-hidden"
                          aria-label={copied ? "Copied" : "Copy address"}
                          onClick={async () => {
                            try {
                              if (walletAddress) {
                                await navigator.clipboard.writeText(walletAddress)
                                setCopied(true)
                                setTimeout(() => setCopied(false), 1000)
                                toast.success("Address copied")
                              } else {
                                toast.error("No wallet connected")
                              }
                            } catch {
                              toast.error("Copy failed")
                            }
                          }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-200" style={{ opacity: copied ? 0 : 1 }}>
                            <CopyIcon className="h-4 w-4" />
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-200" style={{ opacity: copied ? 1 : 0 }}>
                            <CheckIcon className="h-4 w-4 text-emerald-400" />
                          </span>
                        </Button>
                        <Button type="button" variant="destructive" onClick={onDisconnectWallet}>
                          <LogOutIcon className="mr-2 h-4 w-4" />
                          Disconnect
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="h-8 px-3 text-xs font-mono" asChild>
                          <a href={polygonScanUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                            PolygonScan
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        </Badge>
                        <Badge variant="secondary" className="h-8 px-3 text-xs font-mono" asChild>
                          <a href={openSeaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                            OpenSea
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        </Badge>
                      </div>
                    </div>

                    {/* Stats grid (match Overview number widgets) */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Total Ante Holdings</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold">{totalHoldings} shares</div>
                        </CardContent>
                      </Card>
                      <Card className="relative overflow-hidden">
                        {/* Aurora covers the entire card (header + content) */}
                        <div className="absolute inset-0 z-10 overflow-hidden">
                          <AuroraBg speed={3} blend={1} fixed={false} />
                        </div>
                        <CardHeader className="relative z-20">
                          <CardTitle className="text-sm">Current Tier</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-20 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md border border-white/20 bg-white/5 backdrop-blur-sm shadow-inner flex items-center justify-center overflow-hidden">
                              <Image src="/icon-tier-chairman.svg" alt="Chairman icon" width={24} height={24} className="opacity-90" />
                            </div>
                            <div>
                              <div className="font-medium">{tierMock.name}</div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Badge variant="outline" className="mt-1 h-5 px-2 text-[10px] font-mono cursor-pointer transition-colors hover:bg-accent/40">Benefits</Badge>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-72">
                                  <div className="space-y-2">
                                    <div className="text-xs font-medium">Chairman Benefits</div>
                                    <ul className="space-y-2 text-xs">
                                      <li className="flex items-start gap-2"><Crown className="h-3.5 w-3.5 mt-0.5" /> Priority access to private lounge & events</li>
                                      <li className="flex items-start gap-2"><ShieldCheck className="h-3.5 w-3.5 mt-0.5" /> Enhanced governance voting weight</li>
                                      <li className="flex items-start gap-2"><Coins className="h-3.5 w-3.5 mt-0.5" /> Revenue share distributions</li>
                                      <li className="flex items-start gap-2"><BadgeDollarSign className="h-3.5 w-3.5 mt-0.5" /> Exclusive buy-in opportunities</li>
                                      <li className="flex items-start gap-2"><Percent className="h-3.5 w-3.5 mt-0.5" /> Reduced house edge promotions</li>
                                    </ul>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Voting Power</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                          <div className="text-2xl font-semibold">{votingPower}</div>
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="h-5 px-2 text-[10px] font-mono">What is this?</Badge>
                              </TooltipTrigger>
                              <TooltipContent><p>Voting power determines influence in proposals.</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Connect your wallet to view on-chain details.</div>
                    <Button type="button" variant="default" onClick={onConnect}>Connect Wallet</Button>
                  </div>
                )}

                {/* Divider and agreement actions: only when connected */}
                {connected && (
                  <>
                    <Separator />
                    <div className="mt-2">
                      <div className="mb-1">
                        <div className="text-sm font-medium">Verifiable On-Chain Agreement</div>
                        <div className="text-xs text-muted-foreground">Your investment agreement, permanently stored on the blockchain.</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="group inline-flex items-center gap-2"
                        onClick={async () => {
                          try {
                            setAgreementOpen(true)
                            if (!agreementText) {
                              setAgreementLoading(true)
                              const res = await fetch(agreementUrl)
                              const text = await res.text()
                              setAgreementText(text)
                            }
                          } catch {
                            setAgreementText("Failed to load agreement.")
                          } finally {
                            setAgreementLoading(false)
                          }
                        }}
                      >
                        <span>Digital Asset Agreement</span>
                        <FileText className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                      </Button>
                      <Button variant="outline" asChild className="group inline-flex items-center gap-2">
                        <a href={agreementUrl} download>
                          <span>Download</span>
                          <Download className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden="true" />
                        </a>
                      </Button>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Your investment agreement, permanently stored on the blockchain. Your signature is a verifiable, on-chain record that cannot be altered.
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      {/* Agreement Dialog */}
      <Dialog open={agreementOpen} onOpenChange={setAgreementOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Digital Asset Agreement</DialogTitle>
            <DialogDescription>Review the latest version of the agreement.</DialogDescription>
          </DialogHeader>
          {/* Provenance / Signature metadata */}
          <div className="mb-3 rounded-md border p-4 text-sm">
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" aria-hidden="true" />
                <span className="font-medium">Who signed:</span>
                <span className="font-mono text-xs">
                  {(sigPayload?.address || walletAddress) ? shorten(sigPayload?.address || walletAddress) : "Not available"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">When it was signed:</span>
                <span className="font-mono text-xs">
                  {sigPayload?.signedAt ? new Date(sigPayload.signedAt).toLocaleString() : "Not signed yet"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Transaction Hash:</span>
                {(() => {
                  const tx = mintTxHash || SAMPLE_TX_HASH
                  const isSample = !mintTxHash
                  const short = tx.length > 20 ? `${tx.slice(0, 10)}…${tx.slice(-8)}` : tx
                  return (
                    <span className="inline-flex items-center gap-2">
                      <a
                        href={`https://polygonscan.com/tx/${tx}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs inline-flex items-center gap-1 underline-offset-2 hover:underline"
                      >
                        {short}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                      {isSample && <span className="text-xs text-muted-foreground">(sample)</span>}
                    </span>
                  )
                })()}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">IPFS Hash:</span>
                <span className="font-mono text-xs">{shorten(AGREEMENT_CID, 8, 6)}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 max-h-[55vh] overflow-auto rounded-md border p-4 text-sm whitespace-pre-wrap">
            {agreementLoading ? "Loading…" : (agreementText ?? "")}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

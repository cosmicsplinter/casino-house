"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useAgreementSign } from "@/hooks/use-agreement-sign"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  shares: number
  totalPrice: number
}

export function InvestmentFlowDialog({ open, onOpenChange, shares, totalPrice }: Props) {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1)
  const [agreeEnabled, setAgreeEnabled] = React.useState(false)
  const [agreeChecked, setAgreeChecked] = React.useState(false)
  const [progress, setProgress] = React.useState(15)
  const [countdown, setCountdown] = React.useState(10)
  const { signing, signed, error, signAgreement } = useAgreementSign()

  const gasFee = 3.25 // mock USD
  const balance = 12.34 // ETH (mock)
  const txCost = (totalPrice / 2500).toFixed(4) // mock ETH calc
  const txHash = "0x7b1f7b1f7b1f7b1f7b1f7b1f7b1f7b1f7b1f7b1f7b1f7b1f"

  // Wallet/Network state
  type EthereumProvider = {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    on?: (event: string, handler: (...args: unknown[]) => void) => void
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
  }
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null)
  const [chainId, setChainId] = React.useState<string | null>(null)
  const POLYGON_CHAIN_ID = "0x89"
  const isPolygon = chainId === POLYGON_CHAIN_ID
  const connected = Boolean(walletAddress)
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

  // Read provider state when dialog opens and react to changes
  React.useEffect(() => {
    if (!open) return
    const w = window as unknown as { ethereum?: EthereumProvider }
    if (!w.ethereum) return
    let mounted = true
    const load = async () => {
      try {
        const acc = (await w.ethereum!.request({ method: "eth_accounts" })) as string[]
        const cid = (await w.ethereum!.request({ method: "eth_chainId" })) as string
        if (!mounted) return
        setWalletAddress(acc?.[0] ?? null)
        setChainId(cid || null)
      } catch { /* noop */ }
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
  }, [open])

  const onConnect = React.useCallback(async () => {
    const w = window as unknown as { ethereum?: EthereumProvider }
    if (!w.ethereum) return
    try {
      const acc = (await w.ethereum.request({ method: "eth_requestAccounts" })) as string[]
      const cid = (await w.ethereum.request({ method: "eth_chainId" })) as string
      setWalletAddress(acc?.[0] ?? null)
      setChainId(cid || null)
    } catch { /* ignore */ }
  }, [])

  const switchToPolygon = React.useCallback(async () => {
    const w = window as unknown as { ethereum?: EthereumProvider }
    if (!w.ethereum) {
      setChainId(POLYGON_CHAIN_ID)
      return
    }
    try {
      await w.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: POLYGON_CHAIN_ID }] })
      setChainId(POLYGON_CHAIN_ID)
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
          return
        } catch { /* ignore */ }
      }
    }
  }, [])

  React.useEffect(() => {
    if (!open) {
      // reset when closed
      setStep(1)
      setAgreeEnabled(false)
      setAgreeChecked(false)
      setProgress(15)
      setCountdown(10)
    }
  }, [open])

  // Step 3 simulated progress
  React.useEffect(() => {
    if (open && step === 3) {
      setProgress(25)
      const t1 = setTimeout(() => setProgress(55), 800)
      const t2 = setTimeout(() => setProgress(85), 1600)
      const t3 = setTimeout(() => setProgress(100), 2400)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }
  }, [open, step])

  // Step 4 countdown auto close
  React.useEffect(() => {
    if (open && step === 4 && countdown > 0) {
      const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
      return () => clearTimeout(id)
    }
    if (open && step === 4 && countdown === 0) {
      onOpenChange(false)
    }
  }, [open, step, countdown, onOpenChange])

  // Agreement scroll tracking
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const onScrollCheck = React.useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4
    if (atBottom) setAgreeEnabled(true)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Confirm your investment</DialogTitle>
              <DialogDescription>Review the summary before proceeding.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ante Shares</span>
                <span className="font-medium tabular-nums">{shares.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Price</span>
                <span className="font-semibold tabular-nums">${totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated Gas Fee</span>
                <span className="tabular-nums">${gasFee.toFixed(2)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => setStep(2)}>Proceed to agreement</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Digital Asset Agreement</DialogTitle>
              <DialogDescription>Please scroll through and read the agreement. You must scroll to the end to enable the checkbox.</DialogDescription>
            </DialogHeader>

            {/* Info alert about why the agreement matters */}
            <Alert variant="info">
              <AlertTitle>Why this matters</AlertTitle>
              <AlertDescription>
                The Digital Asset Agreement is your guarantee of ownership. It outlines your rights as a stakeholder, permanently linked to your NFT on the blockchain for total transparency and trust.
              </AlertDescription>
            </Alert>

            <ScrollArea
              ref={viewportRef}
              onScroll={onScrollCheck}
              className="h-56 rounded-md border p-4 text-sm leading-relaxed"
            >
              <p className="font-semibold">Digital Asset Agreement for Ante NFT</p>
              <p className="mt-2">This Digital Asset Agreement (&quot;Agreement&quot;) is made and entered into by and between you, the User and NFT Holder (hereafter referred to as the &quot;Investor&quot;), and the Aceberg Project (hereafter referred to as the &quot;Project&quot;). This Agreement is a binding, on-chain contract that governs the rights and responsibilities associated with the ownership of the Ante Non-Fungible Token (&quot;NFT&quot;).</p>
              <ol className="mt-3 list-decimal pl-5 space-y-2">
                <li>
                  <span className="font-medium">Acknowledgment of Digital Asset:</span> The Investor acknowledges and agrees that the Ante NFT is a unique digital asset, represented by a cryptographic token on the Polygon blockchain. This Agreement is permanently linked to the metadata of the NFT and is accessible via the InterPlanetary File System (IPFS) network.
                </li>
                <li>
                  <span className="font-medium">Profit Sharing &amp; Not Equity:</span> The Investor understands and agrees that ownership of an Ante NFT grants a right to a perpetual share in the profits of the Project. The Investor further acknowledges that this Agreement and the ownership of the NFT do not constitute an equity stake in any legal entity or corporation. The Investor is a profit-sharing partner, not a traditional shareholder with ownership rights to the Project&#39;s assets.
                </li>
                <li>
                  <span className="font-medium">The Dividend Pool:</span> The Project agrees to allocate a portion of the casino&#39;s net profits to a public, on-chain smart contract known as The Vault. The Project will make every effort to allocate profits to The Vault on a recurring basis.
                </li>
                <li>
                  <span className="font-medium">Investor Rights:</span> As an owner of an Ante NFT, the Investor has the right to:
                  <ul className="mt-1 list-disc pl-5 space-y-1">
                    <li><span className="font-medium">Claim Dividends:</span> Claim their proportional share of the profits from The Vault at their own discretion.</li>
                    <li><span className="font-medium">Vote:</span> Participate in governance votes on The Floor, where their voting power is proportional to their shareholding.</li>
                    <li><span className="font-medium">Transfer Ownership:</span> Freely sell or transfer their Ante NFT on any compatible secondary marketplace. The rights and benefits of this Agreement are automatically transferred with the NFT to the new owner.</li>
                  </ul>
                </li>
                <li>
                  <span className="font-medium">Investor Responsibilities:</span> The Investor is responsible for all associated blockchain transaction costs (gas fees) related to the purchase, sale, or claim of dividends.
                </li>
                <li>
                  <span className="font-medium">Limitation of Liability:</span> The Project makes no guarantee of future profits or return on investment. The Investor acknowledges that this is an investment in a commercial venture with inherent risks and that the value of the Ante NFT and its associated profit share may fluctuate.
                </li>
                <li>
                  <span className="font-medium">Consent to Terms:</span> By proceeding with the purchase of an Ante NFT, the Investor explicitly agrees to the terms of this Agreement and acknowledges that they have read and understood its contents. This on-chain transaction serves as the final, immutable record of their consent.
                </li>
              </ol>
              <p className="mt-3">This Agreement is effective upon the successful completion of the on-chain transaction.</p>
            </ScrollArea>

            <div className="flex items-center gap-2">
              <Checkbox
                id="agree-check"
                disabled={!agreeEnabled}
                checked={agreeChecked}
                onCheckedChange={(v) => setAgreeChecked(Boolean(v))}
              />
              <Label htmlFor="agree-check" className={!agreeEnabled ? "text-muted-foreground" : ""}>
                I have read and agree to the Digital Asset Agreement.
              </Label>
            </div>

            {/* Wallet signature */}
            <div className={cn(
              "flex items-center justify-between rounded-md border p-3",
              signed && "border-emerald-500 bg-emerald-500/10"
            )}>
              <div className={cn("text-sm", signed && "text-emerald-600")}> 
                <div className="font-medium">Wallet Signature</div>
                <div className={cn("text-muted-foreground text-xs", signed && "text-emerald-600/80")}>Sign the agreement with your wallet to continue.</div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={signAgreement}
                  disabled={signing || signed}
                  size="sm"
                  className={cn(
                    signed && "bg-emerald-600 text-white hover:bg-emerald-600 disabled:opacity-100"
                  )}
                >
                  {signing ? (
                    <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing…</span>
                  ) : signed ? (
                    <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Signed</span>
                  ) : (
                    "Sign the agreement"
                  )}
                </Button>
              </div>
            </div>
            {error ? <div className="text-rose-400 text-xs">{error}</div> : null}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!agreeChecked || !signed}>Confirm and pay</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Processing {shares.toLocaleString()} Shares</DialogTitle>
              <DialogDescription>Connecting wallet and preparing your transaction…</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* Connection & Network status */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="h-5 px-2 text-[10px]">{connected ? "Connected" : "Disconnected"}</Badge>
                <Badge variant="outline" className="h-5 px-2 text-[10px]">{chainName}</Badge>
                {connected && !isPolygon && (
                  <>
                    <Badge variant="outline" className="h-5 px-2 text-[10px] border-rose-500/40 text-rose-400">Wrong network</Badge>
                    <Button size="sm" variant="outline" onClick={switchToPolygon}>Switch to Polygon</Button>
                  </>
                )}
                {!connected && (
                  <Button size="sm" onClick={onConnect}>Connect Wallet</Button>
                )}
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${progress}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground text-xs">Wallet</div>
                  <div className="font-medium">{walletAddress ? `${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}` : "—"}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground text-xs">Network</div>
                  <div className="font-medium">{chainName}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground text-xs">Balance</div>
                  <div className="font-medium">{balance} ETH</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-muted-foreground text-xs">Transaction Cost</div>
                  <div className="font-medium">~{txCost} ETH</div>
                </div>
              </div>
              <div className={cn("text-sm", connected && isPolygon ? "text-green-500" : "text-amber-500")}>{connected && isPolygon ? "Ready to approve on Polygon." : "Please connect your wallet and switch to Polygon to continue."}</div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} disabled={!connected || !isPolygon}>Approve transaction</Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>Transaction Confirmed!</DialogTitle>
              <DialogDescription>
                Your Ante Shares have been minted. A copy of your Digital Asset Agreement has been sent to your registered email address.
              </DialogDescription>
            </DialogHeader>

            <Alert variant="success" className="flex items-start justify-center text-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <div className="text-left">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>Your transaction was confirmed on-chain and your shares are now active.</AlertDescription>
                </div>
              </div>
            </Alert>

            <div className="space-y-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground text-xs">Transaction Hash</div>
                <div className="font-mono text-xs break-all">{txHash}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard?.writeText(txHash)}
                >
                  Copy hash
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, "_blank")}
                >
                  View on explorer
                </Button>
              </div>
              <div className="text-muted-foreground text-xs">This message will be closed in {countdown} seconds.</div>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

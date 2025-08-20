"use client"

import * as React from "react"
// no Separator here to match overview spacing
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RippleGridBG from "@/components/ripple-grid"
import { InvestmentFlowDialog } from "@/components/investment-flow-dialog"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { IconCurrencyEthereum } from "@tabler/icons-react"

export default function ShareOfferingPage() {
  // Known offering numbers
  const TOTAL_SHARES = 100_000
  const PRICE_PER_SHARE = 25

  // New progress snapshot requested: $2.5M goal, $275k raised
  const PROGRESS_GOAL = 2_500_000
  const PROGRESS_RAISED = 275_000
  const PROGRESS_PCT = (PROGRESS_RAISED / PROGRESS_GOAL) * 100
  const PROGRESS_SOLD = Math.min(TOTAL_SHARES, Math.floor(PROGRESS_RAISED / PRICE_PER_SHARE))

  // Animate percent and timeline on mount
  const [animPct, setAnimPct] = React.useState(0)
  const [animT, setAnimT] = React.useState(0) // 0..1 eased timeline for number animations
  React.useEffect(() => {
    let start: number | null = null
    const duration = 800
    const target = PROGRESS_PCT
    let raf = 0
    const step = (ts: number) => {
      if (start === null) start = ts
      const t = Math.min(1, (ts - start) / duration)
      // easeInOutQuad
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      setAnimPct(target * eased)
      setAnimT(eased)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [PROGRESS_PCT])

  // Animated shares derived from animT
  const ANIM_SHARES_SOLD = Math.round(PROGRESS_SOLD * animT)
  const ANIM_SHARES_REMAINING = Math.max(0, TOTAL_SHARES - ANIM_SHARES_SOLD)

  // Reveal animations for cards on scroll
  React.useEffect(() => {
    const els = document.querySelectorAll('[data-reveal="card"]')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // NFT constants (hoisted)
  const NFT_NAME = "ANTE Founders NFT"
  const NFT_DESC = "Your stake in the casino ecosystem and member benefits."
  const USD_PRICE = 25
  const ETH_USD = 2400 // static snapshot for display; replace with live price when available
  const ETH_AMOUNT = USD_PRICE / ETH_USD

  // Calculator state (hoisted to satisfy React Hooks rules)
  // Input value with formatting; and numeric value used for math
  const [sharesStr, setSharesStr] = React.useState("1")
  const [sharesNum, setSharesNum] = React.useState<number>(1)
  const sanitizeNumber = (s: string) => s.replace(/,/g, "").replace(/[^0-9.]/g, "")
  const formatNumber = (n: number) =>
    isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : ""
  // Benefits per share (central knobs)
  const CHIP_PER_SHARE = 10
  const EDGE_PER_SHARE = 100
  const GOV_PER_SHARE = 1
  // Estimation assumptions
  const EST_INCOME_PER_SHARE = 5 // $ per share per year (example)
  const EST_ROI_PCT = 235
  // Derived values
  const chip = sharesNum * CHIP_PER_SHARE
  const edge = sharesNum * EDGE_PER_SHARE
  const gov = sharesNum * GOV_PER_SHARE
  const totalPrice = sharesNum * PRICE_PER_SHARE
  const estIncome = sharesNum * EST_INCOME_PER_SHARE
  const tier = (() => {
    if (sharesNum >= 10_000) return "Chairman"
    if (sharesNum >= 1_000) return "Executive"
    if (sharesNum >= 100) return "Ambassador"
    if (sharesNum >= 10) return "Insider"
    if (sharesNum >= 1) return "Seat Holder"
    return "—"
  })()

  // Invest flow dialog state
  const [investOpen, setInvestOpen] = React.useState(false)

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      {/* Keep background constrained to the content area (not the sidebar) */}
      <RippleGridBG className="opacity-60" color="#22d3ee" fixed={false} />
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Funding progress (goal $2.5M, raised $275k) - top section */}
          <div className="px-4 lg:px-6">
            <Card className="overflow-hidden rounded-2xl border border-white/10 bg-background/20 backdrop-blur supports-[backdrop-filter]:bg-background/20 py-0">
              <div className="relative px-4 py-4">
              <div className="relative overflow-hidden rounded-full bg-muted/70 p-1">
                {/* aurora glow layer inside progress area */}
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-full">
                  <span className="absolute -left-8 -top-8 h-24 w-24 rounded-full blur-2xl" style={{ background: "radial-gradient(circle at 50% 50%, #5227FF55, transparent 70%)" }} />
                  <span className="absolute -right-6 top-1/2 h-20 w-28 -translate-y-1/2 rounded-full blur-2xl" style={{ background: "radial-gradient(circle at 50% 50%, #7CFF6755, transparent 70%)" }} />
                </div>
                {/* bar track */}
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-transparent">
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, animPct))}%` }}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Number(animPct.toFixed(1))}
                    role="progressbar"
                  >
                    {/* progress dot with pulse */}
                    <span className="absolute -right-1 top-1/2 block h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-md" />
                    <span className="absolute -right-2 top-1/2 block h-5 w-5 -translate-y-1/2 rounded-full bg-cyan-400/40 blur-[2px]" />
                    {/* percent label above dot */}
                    <span className="absolute right-0 -top-2.5 -translate-y-full translate-x-1 text-[11px] leading-none text-muted-foreground">
                      {animPct.toFixed(1)}%
                    </span>
                  </div>
                  {/* goal caption at end (no tick to avoid white artifact) */}
                  <span className="absolute right-0 -top-1.5 -translate-y-full translate-x-1 text-[11px] leading-none text-muted-foreground">Goal</span>
                </div>
              </div>
              {/* Shares first summary (animated) */}
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Shares Sold</div>
                  <div className="text-3xl font-semibold tabular-nums md:text-4xl">{ANIM_SHARES_SOLD.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Shares Remaining</div>
                  <div className="text-3xl font-semibold tabular-nums md:text-4xl">{ANIM_SHARES_REMAINING.toLocaleString()}</div>
                </div>
              </div>
              {/* Financials secondary */}
              <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                <span>Raised ${PROGRESS_RAISED.toLocaleString()} • {PROGRESS_PCT.toFixed(1)}% of goal</span>
                <span>Goal ${PROGRESS_GOAL.toLocaleString()}</span>
              </div>
              </div>
            </Card>
          </div>

          {/* NFT Card and Calculator */}
          <div className="px-4 lg:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* NFT Card (col 1) */}
              <Card className="overflow-hidden rounded-2xl border border-white/10 bg-background/20 pt-0 backdrop-blur supports-[backdrop-filter]:bg-background/20">
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src="/ante-nft.png"
                    alt={`${NFT_NAME} preview`}
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2">
                    <div className="relative flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur">
                      <span className="absolute -inset-3 -z-10 rounded-full bg-cyan-400/25 blur-lg animate-pulse" />
                      <IconCurrencyEthereum className="h-4 w-4" />
                      <span>{ETH_AMOUNT.toFixed(4)} ETH</span>
                    </div>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{NFT_NAME}</CardTitle>
                  <CardDescription>{NFT_DESC}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full">Learn more</Button>
                </CardFooter>
              </Card>

              {/* Calculator spanning cols 2-4 */}
              <Card className="lg:col-span-3 overflow-hidden rounded-2xl border border-white/10 bg-background/20 backdrop-blur supports-[backdrop-filter]:bg-background/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Investment Calculator</CardTitle>
                  <CardDescription>Enter Ante share amount to see your benefits and totals.</CardDescription>
                </CardHeader>
                <CardFooter className="flex-col items-stretch gap-5">
                  {/* Input */}
                  <div className="space-y-2">
                    <Label htmlFor="shares-input">Number of Ante Shares</Label>
                    <Input
                      id="shares-input"
                      inputMode="decimal"
                      value={sharesStr}
                      onChange={(e) => {
                        const raw = sanitizeNumber(e.target.value)
                        setSharesStr(raw)
                        const n = Number.parseFloat(raw || "0")
                        setSharesNum(isNaN(n) ? 0 : Math.max(0, n))
                      }}
                      onBlur={() => setSharesStr(formatNumber(sharesNum))}
                      placeholder="e.g. 25.5"
                    />
                  </div>

                  {/* What you get */}
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">What you get</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border border-white/10 bg-background/30 p-3">
                        <div className="text-muted-foreground text-xs">Chip Tokens</div>
                        <div className="text-lg font-semibold tabular-nums">{chip.toLocaleString()} $CHIP</div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-background/30 p-3">
                        <div className="text-muted-foreground text-xs">Governance Power</div>
                        <div className="text-lg font-semibold tabular-nums">{gov.toLocaleString()}</div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-background/30 p-3">
                        <div className="text-muted-foreground text-xs">Edge Points</div>
                        <div className="text-lg font-semibold tabular-nums">{edge.toLocaleString()}</div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-background/30 p-3">
                        <div className="text-muted-foreground text-xs">Tier</div>
                        <div className="text-lg font-semibold">{tier}</div>
                      </div>
                    </div>
                  </div>

                  {/* Estimations & Total */}
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Estimations</div>
                    <div className="grid gap-3 text-sm grid-cols-1 md:grid-cols-3">
                      <div className="rounded-md border border-white/10 bg-background/30 p-3">
                        <div className="text-muted-foreground text-xs">Estimated Income / year</div>
                        <div className="text-lg font-semibold tabular-nums">${estIncome.toLocaleString()}</div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-background/30 p-3">
                        <div className="text-muted-foreground text-xs">Estimated ROI</div>
                        <div className="text-lg font-semibold">{EST_ROI_PCT}%</div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-background/30 p-3">
                        <div className="text-muted-foreground text-xs">Total Price</div>
                        <div className="text-lg font-semibold tabular-nums">${totalPrice.toLocaleString()}</div>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      disabled={sharesNum <= 0}
                      onClick={() => setInvestOpen(true)}
                    >
                      Invest now
                    </Button>
                    {sharesNum <= 0 && (
                      <div className="text-xs text-muted-foreground">Enter a number of shares greater than 0 to continue.</div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* (moved) Funding progress now lives above */}

          {/* Metrics section removed per request */}
          
        </div>
        {/* Modal: Investment Flow */}
        <InvestmentFlowDialog
          open={investOpen}
          onOpenChange={setInvestOpen}
          shares={sharesNum}
          totalPrice={totalPrice}
        />
      </div>
    </div>
  )
}

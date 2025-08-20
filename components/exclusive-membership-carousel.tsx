"use client"

import Image from "next/image"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// Data shaped from the provided spec (values approximated from the screenshot)
const TIERS = [
  {
    id: "staker",
    title: "Staker",
    logo: "/em-staker.svg",
    seats: "60,000",
    sharesRequired: 1,
    pricePerShare: 25,
    totalInvestment: 25,
    votes: 10,
    edgePoints: 0,
    chipTokens: 0,
    color: "from-blue-500/15 to-blue-500/5",
  },
  {
    id: "insider",
    title: "Insider",
    logo: "/em-insider.svg",
    seats: "1,000",
    sharesRequired: 10,
    pricePerShare: 25,
    totalInvestment: 250,
    votes: 100,
    edgePoints: 100,
    chipTokens: 500,
    color: "from-amber-400/15 to-amber-400/5",
  },
  {
    id: "ambassador",
    title: "Ambassador",
    logo: "/em-ambassador.svg",
    seats: "100",
    sharesRequired: 100,
    pricePerShare: 25,
    totalInvestment: 2500,
    votes: 1000,
    edgePoints: 1500,
    chipTokens: 5000,
    color: "from-sky-400/15 to-sky-400/5",
  },
  {
    id: "executive",
    title: "Executive",
    logo: "/em-executive.svg",
    seats: "10",
    sharesRequired: 1000,
    pricePerShare: 25,
    totalInvestment: 25000,
    votes: 10000,
    edgePoints: 20000,
    chipTokens: 50000,
    color: "from-fuchsia-400/15 to-fuchsia-400/5",
  },
  {
    id: "chairman",
    title: "Chairman",
    logo: "/em-chairman.svg",
    seats: "1",
    sharesRequired: 10000,
    pricePerShare: 25,
    totalInvestment: 250000,
    votes: 100000,
    edgePoints: 250000,
    chipTokens: 500000,
    color: "from-rose-500/15 to-rose-500/5",
  },
] as const

function formatCurrency(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

function SafeLogo({ src, alt }: { src: string; alt: string }) {
  // Graceful fallback if a logo image is missing in /public
  const [error, setError] = React.useState(false)
  const fallback = "/file.svg"
  return (
    <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-xl bg-muted/30 ring-1 ring-inset ring-white/10">
      <Image
        src={error ? fallback : src}
        alt={alt}
        fill
        sizes="64px"
        className="object-contain p-3"
        onError={() => setError(true)}
      />
    </div>
  )
}

export function ExclusiveMembershipCarousel({ className }: { className?: string }) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  const scrollBy = (dir: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * (el.clientWidth * 0.9), behavior: "smooth" })
  }

  return (
    <section id="pricing" className={cn("relative w-full py-16 md:py-24", className)}>
      <div className="container mx-auto px-4">
        {/* Small looping icon-like video above the title */}
        <div className="mx-auto mb-4 flex items-center justify-center">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl md:h-20 md:w-20">
            <video
              src="/exclusive-membership.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Exclusive Membership Structure</h2>
          <p className="text-muted-foreground mt-2">
            Choose your tier by number of shares. Each level unlocks voting power, $CHIP rewards, and exclusive benefits.
          </p>
        </div>

        <div className="relative">
          <div className="mb-4 flex items-center justify-end gap-2">
            <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label="Previous">
              <span aria-hidden>←</span>
            </Button>
            <Button variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label="Next">
              <span aria-hidden>→</span>
            </Button>
          </div>

          <ScrollArea className="w-full">
            <div ref={scrollRef} className="flex w-full snap-x snap-mandatory overflow-x-auto gap-4 pb-4">
              {TIERS.map((t) => (
                <Card
                  key={t.id}
                  className={cn(
                    "snap-center w-[85%] shrink-0 sm:w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b backdrop-blur supports-[backdrop-filter]:bg-background/30",
                    t.color,
                  )}
                >
                  <CardHeader className="relative">
                    <div className="absolute right-4 top-4 rounded-full bg-background/70 px-2 py-1 text-xs ring-1 ring-white/10">
                      Max Seats: {t.seats}
                    </div>
                    <div className="flex flex-col items-center gap-4 pt-2">
                      <SafeLogo src={t.logo} alt={`${t.title} logo`} />
                      <div className="text-center">
                        <CardTitle className="text-2xl font-semibold">{t.title}</CardTitle>
                        <CardDescription>Exclusive tier for committed investors</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="grid grid-cols-1 gap-2 text-sm">
                      <li className="flex items-center justify-between rounded-md bg-background/40 px-3 py-2">
                        <span className="text-muted-foreground">Shares Required</span>
                        <span className="font-medium tabular-nums">{t.sharesRequired.toLocaleString()}</span>
                      </li>
                      <li className="flex items-center justify-between rounded-md bg-background/40 px-3 py-2">
                        <span className="text-muted-foreground">Price per Share</span>
                        <span className="font-medium">{formatCurrency(t.pricePerShare)}</span>
                      </li>
                      <li className="flex items-center justify-between rounded-md bg-background/40 px-3 py-2">
                        <span className="text-muted-foreground">Total Investment</span>
                        <span className="font-semibold">{formatCurrency(t.totalInvestment)}</span>
                      </li>
                      <li className="flex items-center justify-between rounded-md bg-background/40 px-3 py-2">
                        <span className="text-muted-foreground">Total Votes per Tier</span>
                        <span className="font-medium tabular-nums">{t.votes.toLocaleString()}</span>
                      </li>
                    </ul>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-lg border border-white/10 bg-background/40 p-3">
                        <div className="text-xs text-muted-foreground">EDGE Points</div>
                        <div className="text-xl font-semibold tabular-nums">{t.edgePoints.toLocaleString()}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-background/40 p-3">
                        <div className="text-xs text-muted-foreground">$CHIP Tokens</div>
                        <div className="text-xl font-semibold tabular-nums">{t.chipTokens.toLocaleString()}</div>
                      </div>
                    </div>

                    <Button className="w-full">Select {t.title}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Note: our ScrollArea doesn't ship a ScrollBar. If we want shadcn Carousel, I can add it with embla. */}
          </ScrollArea>
        </div>
      </div>
    </section>
  )
}

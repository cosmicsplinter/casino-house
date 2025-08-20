"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { IconBriefcase, IconCrown, IconBrandX, IconBrandDiscord, IconBrandTelegram } from "@tabler/icons-react"
import { BadgeCheck, ExternalLink, Copy as CopyIcon, Check as CheckIcon, QrCode } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

type PublicProfile = {
  handle: string
  displayName?: string
  avatarUrl?: string | null
  isPublic: boolean
  tier?: string
  wallet?: string | null
  shares?: number
  dividends?: number
  socials?: Record<string, string> | null
  bio?: string | null
}

// Phase 1 does not need wallet formatting

// helper
function shorten(v?: string | null, head = 6, tail = 4) {
  if (!v) return ""
  return v.length > head + tail + 3 ? `${v.slice(0, head)}…${v.slice(-tail)}` : v
}

export function InvestorPublicCard({ profile }: { profile?: PublicProfile | null }) {
  // Strictly use server-provided data for consistency with dashboard
  const p = profile ?? null
  const [copied, setCopied] = React.useState(false)

  if (!p) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Profile not found</CardTitle>
            <CardDescription>This profile does not exist. Check the handle or updated link.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!p.isPublic) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-12">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Profile unavailable</CardTitle>
            <CardDescription>This user’s profile is set to private.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const display = p.displayName || p.handle
  // Default tier to Chairman per request
  const tierToShow = p.tier || "Chairman"
  // Phase 1: no shares/dividends UI
  
  // Phase 1 removes socials, wallet, stats
  const socials = p.socials || null
  const twitter = typeof socials?.twitter === "string" && socials.twitter.trim().length > 0 ? socials.twitter.trim() : null
  const discord = typeof socials?.discord === "string" && socials.discord.trim().length > 0 ? socials.discord.trim() : null
  const telegram = typeof socials?.telegram === "string" && socials.telegram.trim().length > 0 ? socials.telegram.trim() : null
  function toTwitterUrl(v: string) {
    const h = v.replace(/^@+/, "")
    return `https://x.com/${h}`
  }
  function toTelegramUrl(v: string) {
    const h = v.replace(/^@+/, "")
    return `https://t.me/${h}`
  }
  const explorerUrl = p.wallet ? `https://polygonscan.com/address/${p.wallet}` : null
  const qrUrl = p.wallet ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(p.wallet)}` : null

  return (
    <div className="relative mx-auto w-full max-w-2xl">

      {/* Brand logo at top */}
      <div className="mb-4 flex justify-center">
        <Image
          src="/house-inc-logo-white.svg"
          alt="House Inc. logo"
          width={120}
          height={24}
          className="h-6 w-auto opacity-90"
          priority
        />
      </div>

      {/* Slogan */}
      <p className="mb-4 text-center text-sm text-muted-foreground">
        The house always wins
      </p>

      <Card className="relative overflow-hidden rounded-2xl border border-white/5 bg-background/10 backdrop-blur-sm supports-[backdrop-filter]:bg-background/10 shadow-xl py-0">
        {/* Cover */}
        <div className="relative h-44 w-full overflow-hidden rounded-t-[inherit]">
          <video
            src="/investor-cover.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
          {/* Badges on cover (top-right) */}
          <div className="absolute right-3 top-3 z-30 flex items-center gap-2">
            <Badge variant="secondary" className="inline-flex items-center gap-1 px-2 py-1 font-mono bg-emerald-500 text-white">
              <IconBriefcase className="h-3.5 w-3.5" /> Staker
            </Badge>
            <Badge
              variant="secondary"
              className="inline-flex items-center gap-1 px-2 py-1 font-mono text-black"
              style={{ backgroundColor: "hsl(37.7 92.1% 50.2%)" }}
            >
              <IconCrown className="h-3.5 w-3.5" /> {tierToShow}
            </Badge>
          </div>
        </div>

        {/* Avatar positioned relative to the Card to avoid clipping by cover radius */}
        <div className="absolute left-4 top-28 z-20 md:left-6">
          <Avatar className="h-24 w-24 rounded-full ring-2 ring-white/20 border border-white/10 md:h-28 md:w-28">
            <AvatarImage src={p.avatarUrl || undefined} alt={display} />
            <AvatarFallback>{display.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        {/* Header content (remove default p-6 from CardHeader) */}
        <CardHeader className="p-0">
          <div className="px-4 pt-6">
          {/* Display name with verified icon; handle secondary */}
          <div className="flex items-center gap-1 pt-4">
            <CardTitle className="text-2xl font-semibold">{display}</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center text-blue-500/90">
                    <BadgeCheck className="h-5 w-5" aria-label="Verified On-Chain" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Verified On-Chain</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">@{p.handle}</div>
          {typeof p.bio === "string" && p.bio.trim().length > 0 && (
            <CardDescription className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words text-foreground">
              {p.bio.trim()}
            </CardDescription>
          )}
          {(twitter || discord || telegram) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {twitter && (
                <a
                  href={toTwitterUrl(twitter)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-accent"
                >
                  <IconBrandX className="h-4 w-4" />
                  <span className="hidden sm:inline">X</span>
                </a>
              )}
              {discord && (
                <a
                  href={discord.startsWith("http") ? discord : `https://discord.com/users/${discord.replace(/^@+/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-accent"
                >
                  <IconBrandDiscord className="h-4 w-4" />
                  <span className="hidden sm:inline">Discord</span>
                </a>
              )}
              {telegram && (
                <a
                  href={toTelegramUrl(telegram)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm hover:bg-accent"
                >
                  <IconBrandTelegram className="h-4 w-4" />
                  <span className="hidden sm:inline">Telegram</span>
                </a>
              )}
            </div>
          )}
          {/* Badges moved onto cover */}
          {/* Stats widgets (3 blocks) */}
          <div className="mt-6 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 md:grid-cols-3 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Shares/NFTs Owned</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">2,455</CardTitle>
              </CardHeader>
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Dividends Claimed</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">$32,098</CardTitle>
              </CardHeader>
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Voting Power</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">12.3%</CardTitle>
              </CardHeader>
            </Card>
          </div>
          </div>
        </CardHeader>
        {/* Wallet section (public) inside the card */}
        {p.wallet && (
          <CardContent className="px-4 pb-6">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Wallet</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm">{shorten(p.wallet)}</span>
                  {explorerUrl && (
                    <a href={explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline">
                      View
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="secondary" className="group inline-flex items-center gap-2">
                      <span>QR</span>
                      <QrCode className="h-4 w-4 transition-transform duration-200 group-hover:rotate-6" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-3">
                    {qrUrl ? (
                      <Image src={qrUrl} alt="Wallet QR" width={176} height={176} unoptimized className="h-44 w-44" />
                    ) : (
                      <div className="text-sm text-muted-foreground">No wallet</div>
                    )}
                  </PopoverContent>
                </Popover>
                <Button
                  size="sm"
                  variant="outline"
                  className="relative inline-flex h-8 w-24 items-center justify-center overflow-hidden"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(p.wallet!)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1000)
                      toast.success("Address copied")
                    } catch {
                      toast.error("Copy failed")
                    }
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center gap-1 transition-opacity duration-200" style={{ opacity: copied ? 0 : 1 }}>
                    <CopyIcon className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center gap-1 transition-opacity duration-200" style={{ opacity: copied ? 1 : 0 }}>
                    <CheckIcon className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

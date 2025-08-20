"use client"

import * as React from "react"
import { Check, X, Clock, ChevronRight, Waypoints, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { WalletGate } from "@/components/wallet-gate"

// Types
type VoteTally = { yes: number; no: number }

type ProposalStatus = "active" | "passed" | "failed"

type Proposal = {
  id: string
  title: string
  summary: string
  descriptionMd: string
  status: ProposalStatus
  endsAt: number // timestamp
  votes: VoteTally
}

type VoteRecord = {
  userId: string
  power: number
  vote: "yes" | "no"
  at: number
}

// Seed data
const now = Date.now()
const seedProposals: Proposal[] = [
  {
    id: "P-001",
    title: "Adjust Casino Payouts",
    summary: "Revise RTP by +0.5% across slots",
    descriptionMd:
      "# Adjust Casino Payouts\n\nIncrease slot RTP by +0.5% to improve player retention.\n\n- Phase-in over 2 weeks\n- Monitor ARPU and churn\n- Sunset if KPIs drop by >10%\n",
    status: "active",
    endsAt: now + 1000 * 60 * 60 * 24 * 2, // +2 days
    votes: { yes: 5400, no: 2600 },
  },
  {
    id: "P-002",
    title: "Treasury Allocation to $CHIP LP",
    summary: "Deploy 10% treasury to DEX LP to tighten spreads",
    descriptionMd:
      "# Treasury Allocation\n\nAllocate 10% of idle treasury to $CHIP/USDC LP to improve liquidity and lower slippage.",
    status: "passed",
    endsAt: now - 1000 * 60 * 60 * 24 * 3, // ended
    votes: { yes: 8800, no: 1200 },
  },
  {
    id: "P-003",
    title: "Introduce VIP Table",
    summary: "High-stakes table with dynamic limits",
    descriptionMd:
      "# VIP Table\n\nAdd a high-stakes table with dynamic limits and risk controls.",
    status: "failed",
    endsAt: now - 1000 * 60 * 60 * 24 * 10,
    votes: { yes: 3000, no: 5200 },
  },
]

export default function TheFloorPage() {
  const [proposals, setProposals] = React.useState<Proposal[]>(seedProposals)
  const [activeId, setActiveId] = React.useState<string>(proposals[0]?.id)

  // Simulated user context
  const userId = "you"
  const [votingPower] = React.useState<number>(1200)
  const [votes, setVotes] = React.useState<Record<string, VoteRecord | undefined>>({})

  const active = React.useMemo(() => proposals.find((p) => p.id === activeId)!, [proposals, activeId])
  const nowTs = React.useMemo(() => Date.now(), []) // static for SSR parity

  const hasEnded = active.endsAt <= nowTs
  const alreadyVoted = !!votes[active.id]
  const total = active.votes.yes + active.votes.no
  const yesPct = total ? Math.round((active.votes.yes / total) * 100) : 0
  const noPct = 100 - yesPct

  function castVote(v: "yes" | "no") {
    if (hasEnded || alreadyVoted) return
    setVotes((prev) => ({
      ...prev,
      [active.id]: { userId, power: votingPower, vote: v, at: Date.now() },
    }))
    setProposals((prev) =>
      prev.map((p) =>
        p.id === active.id
          ? {
              ...p,
              votes: {
                yes: p.votes.yes + (v === "yes" ? votingPower : 0),
                no: p.votes.no + (v === "no" ? votingPower : 0),
              },
            }
          : p
      )
    )
  }

  const voters: VoteRecord[] = React.useMemo(() => {
    const base: VoteRecord[] = [
      { userId: "WhaleMax", power: 5000, vote: "yes", at: now - 3600_000 },
      { userId: "Investor42", power: 1200, vote: "no", at: now - 7200_000 },
      { userId: "AnteClub", power: 900, vote: "yes", at: now - 8200_000 },
    ]
    return votes[active.id] ? [votes[active.id]!, ...base] : base
  }, [active.id, votes])

  const activeProposals = proposals.filter((p) => p.status === "active")
  const pastProposals = proposals.filter((p) => p.status !== "active")

  return (
    <WalletGate>
    <div className="flex h-[calc(100vh-var(--header-height))] w-full overflow-hidden">
      <ScrollArea className="min-h-0 w-full">
        <div className="px-4 py-4 lg:px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Left column: list */}
          <Card className="md:col-span-5 p-3">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <Waypoints className="h-4 w-4" />
                <h2 className="text-sm font-semibold">The Floor — Proposals</h2>
              </div>
              <Badge variant="secondary" className="text-[10px]">Governance</Badge>
            </div>
            <Separator className="my-2" />

            <Tabs defaultValue="active" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                <TabsTrigger value="past" className="flex-1">Past</TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <ScrollArea className="h-[60vh] pr-2">
                  <div className="space-y-2 py-2">
                    {activeProposals.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setActiveId(p.id)}
                        className={cn(
                          "w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/50",
                          p.id === activeId && "border-primary bg-muted/60"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium leading-tight">{p.title}</div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] capitalize">{p.status}</Badge>
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {timeLeft(p.endsAt, nowTs)}</span>
                          <span>ID: {p.id}</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.summary}</div>
                        <div className="mt-3">
                          <VoteBar yes={p.votes.yes} no={p.votes.no} />
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="past">
                <ScrollArea className="h-[60vh] pr-2">
                  <div className="space-y-2 py-2">
                    {pastProposals.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setActiveId(p.id)}
                        className={cn(
                          "w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/50",
                          p.id === activeId && "border-primary bg-muted/60"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium leading-tight">{p.title}</div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] capitalize">{p.status}</Badge>
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Ended</span>
                          <span>ID: {p.id}</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.summary}</div>
                        <div className="mt-3">
                          <VoteBar yes={p.votes.yes} no={p.votes.no} />
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Right column: details */}
          <Card className="md:col-span-7 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold leading-tight">{active.title}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] capitalize">{active.status}</Badge>
                  <span>ID: {active.id}</span>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {active.status === "active" ? (
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {timeLeft(active.endsAt, nowTs)}</span>
                ) : (
                  <span>Voting ended</span>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                {/* Markdown-like description (rendered raw) */}
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                  {active.descriptionMd}
                </div>
              </div>
              <div className="md:col-span-1">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Current Tally</div>
                  <div className="mt-2"><VoteBar yes={active.votes.yes} no={active.votes.no} /></div>
                  <div className="mt-2 text-xs text-muted-foreground">Yes {yesPct}% · No {noPct}%</div>
                  <div className="mt-4 text-xs">Your voting power</div>
                  <div className="text-2xl font-semibold">{votingPower.toLocaleString()}</div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="flex-1" disabled={hasEnded || alreadyVoted} onClick={() => castVote("yes")}>
                      <Check className="mr-1 h-4 w-4" /> Yes
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" disabled={hasEnded || alreadyVoted} onClick={() => castVote("no")}>
                      <X className="mr-1 h-4 w-4" /> No
                    </Button>
                  </div>
                  {alreadyVoted && (
                    <div className="mt-2 text-xs text-emerald-400">
                      You voted {votes[active.id]?.vote.toUpperCase()} with {votes[active.id]?.power.toLocaleString()} power.
                    </div>
                  )}
                  {hasEnded && (
                    <div className="mt-2 text-xs text-muted-foreground">Voting has ended for this proposal.</div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4" /> Recent Voters
              </div>
              <div className="space-y-2">
                {voters.map((v, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-6 w-6 rounded-full text-[10px] font-medium text-center leading-6", v.vote === "yes" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300")}>{v.userId.slice(0,2).toUpperCase()}</div>
                      <div>
                        <div className="font-medium">{v.userId}</div>
                        <div className="text-xs text-muted-foreground">Power: {v.power.toLocaleString()}</div>
                      </div>
                    </div>
                    <Badge variant={v.vote === "yes" ? "secondary" : "destructive"} className="capitalize">{v.vote}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
        </div>
      </ScrollArea>
    </div>
    </WalletGate>
  )
}

function VoteBar({ yes, no }: { yes: number; no: number }) {
  const total = Math.max(yes + no, 1)
  const yesPct = Math.round((yes / total) * 100)
  const noPct = 100 - yesPct
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-emerald-500" style={{ width: `${yesPct}%` }} />
      <div className="-mt-2 h-2 bg-red-500" style={{ width: `${noPct}%` }} />
    </div>
  )
}

function timeLeft(endsAt: number, nowTs: number) {
  const ms = Math.max(0, endsAt - nowTs)
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  if (ms <= 0) return "Ended"
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

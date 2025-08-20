"use client"

import * as React from "react"
import { Hash, MessageSquare, Send, UserCircle2, Paperclip, Smile, Users, Search, Bell, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { WalletGate } from "@/components/wallet-gate"
import { useUser } from "@/components/user-context"

// Access control flag (wire to your real investor check)
const IS_INVESTOR_DEFAULT = true

type Channel = {
  id: string
  name: string
  icon: "hash" | "chat"
  description?: string
}

type Msg = {
  id: string
  channelId: string
  author: string
  tier: "Chairman" | "Insider" | "Seat Holder" | "Ambassador" | "Executive"
  avatarUrl?: string
  content: string
  createdAt: number
  reactions?: { emoji: string; count: number; mine?: boolean }[]
}

const initialChannels: Channel[] = [
  { id: "general", name: "general", icon: "hash", description: "Welcome to the main chat" },
  { id: "tokenomics", name: "tokenomics", icon: "hash", description: "Discuss $CHIP and economics" },
  { id: "governance", name: "governance", icon: "hash", description: "Proposals and voting" },
]

// Use fixed timestamps to avoid SSR/CSR drift
const seedMessages: Msg[] = [
  // General channel examples
  { id: "m1", channelId: "general", author: "PitCrew", tier: "Executive", content: "Welcome to the Private Lounge!", createdAt: 1710000000000 },
  { id: "m2", channelId: "general", author: "Investor42", tier: "Insider", content: "GM everyone ✨", createdAt: 1710003600000 },
  { id: "m3", channelId: "general", author: "Ambra", tier: "Ambassador", content: "If you need access help, ping me.", createdAt: 1710004200000 },
  { id: "m4", channelId: "general", author: "SeatAlpha", tier: "Seat Holder", content: "Loving the vibe here.", createdAt: 1710004800000 },

  // Tokenomics examples
  { id: "m5", channelId: "tokenomics", author: "WhaleMax", tier: "Seat Holder", content: "$CHIP staking looks great.", createdAt: 1710005400000 },
  { id: "m6", channelId: "tokenomics", author: "Analyst101", tier: "Insider", content: "APY projections updated in the doc.", createdAt: 1710007200000 },
  { id: "m7", channelId: "tokenomics", author: "ExecJane", tier: "Executive", content: "Treasury report tomorrow.", createdAt: 1710009000000 },

  // Governance examples
  { id: "m8", channelId: "governance", author: "Ambra", tier: "Ambassador", content: "Proposal #12 discussion starts at 5pm UTC.", createdAt: 1710010000000 },
]

// Helper to render colored tier badges
const TierBadge = ({ tier }: { tier: Msg["tier"] }) => {
  const common = "px-1.5 py-0 text-[10px] h-5"
  switch (tier) {
    case "Chairman":
      return <Badge className={`${common} border-red-400/30 bg-red-500/15 text-red-400`} variant="outline">Chairman</Badge>
    case "Executive":
      return <Badge className={`${common} border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-300`} variant="outline">Executive</Badge>
    case "Ambassador":
      return <Badge className={`${common} border-sky-400/30 bg-sky-500/15 text-sky-300`} variant="outline">Ambassador</Badge>
    case "Insider":
      return <Badge className={`${common} border-amber-400/30 bg-amber-500/15 text-amber-300`} variant="outline">Insider</Badge>
    case "Seat Holder":
    default:
      return <Badge className={`${common} border-slate-400/30 bg-slate-500/15 text-slate-300`} variant="outline">Seat Holder</Badge>
  }
}

export default function PrivateLoungePage() {
  const { user } = useUser()
  const [isInvestor] = React.useState(IS_INVESTOR_DEFAULT)
  const [active, setActive] = React.useState<Channel>(initialChannels[0])
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState<Msg[]>(seedMessages)
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  // Unread counts and scroll position per channel
  const [unread, setUnread] = React.useState<Record<string, number>>({})
  const scrollPositions = React.useRef<Record<string, number>>({})
  const atBottomRef = React.useRef(true)
  const lastReadRef = React.useRef<Record<string, number>>({})
  const [reactionOpenId, setReactionOpenId] = React.useState<string | null>(null)

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString()
  const isSameDay = (a: number, b: number) => {
    const da = new Date(a), db = new Date(b)
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
  }

  const channelMessages = React.useMemo(() => messages.filter((m) => m.channelId === active.id), [messages, active])

  // Track unread counts whenever messages or active channel changes
  React.useEffect(() => {
    const map: Record<string, number> = {}
    for (const c of initialChannels) {
      if (c.id === active.id) { map[c.id] = 0; continue }
      const lastRead = lastReadRef.current[c.id] || 0
      map[c.id] = messages.filter((m) => m.channelId === c.id && m.createdAt > lastRead).length
    }
    setUnread(map)
  }, [messages, active])

  // Mark channel as read when it becomes active
  React.useEffect(() => {
    lastReadRef.current[active.id] = Date.now()
    setUnread((u) => ({ ...u, [active.id]: 0 }))
  }, [active])

  const send = React.useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    const me = user.displayName || user.name || "You"
    const msg: Msg = {
      id: crypto.randomUUID(),
      channelId: active.id,
      author: me,
      tier: "Chairman",
      avatarUrl: user.avatarUrl || undefined,
      content: trimmed,
      createdAt: Date.now(),
      reactions: [
        { emoji: "👍", count: 0, mine: false },
        { emoji: "🔥", count: 0, mine: false },
        { emoji: "🎉", count: 0, mine: false },
      ],
    }
    setMessages((prev) => [...prev, msg])
    setInput("")
    // scroll to bottom next tick if at bottom
    setTimeout(() => {
      if (!viewportRef.current) return
      if (atBottomRef.current) {
        viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: "smooth" })
      }
    }, 0)
  }, [input, active.id, user])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (!isInvestor) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] items-center justify-center">
        <div className="text-center">
          <UserCircle2 className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">You do not have access to this lounge</h2>
          <p className="mt-1 text-muted-foreground">Investors only. Please connect your wallet to verify access.</p>
        </div>
      </div>
    )
  }

  return (
    <WalletGate>
    <div className="flex h-[calc(100vh-var(--header-height))] w-full overflow-hidden">
      {/* Left: channels (desktop) */}
      <div className="hidden w-64 shrink-0 border-r bg-background/80 md:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Hash className="h-4 w-4" />
            <div className="text-sm font-medium">Channels</div>
          </div>
          <ScrollArea className="min-h-0">
            <div className="px-2 py-2">
              {initialChannels.map((c) => (
                <Button
                  key={c.id}
                  variant={active.id === c.id ? "secondary" : "ghost"}
                  className={cn("mb-1 w-full justify-start", active.id === c.id && "bg-muted")}
                  onClick={() => {
                    // save previous scroll
                    if (viewportRef.current) {
                      scrollPositions.current[active.id] = viewportRef.current.scrollTop
                    }
                    // reset unread on open
                    setUnread((u) => ({ ...u, [c.id]: 0 }))
                    setActive(c)
                    // restore scroll after a tick
                    setTimeout(() => {
                      if (viewportRef.current) {
                        viewportRef.current.scrollTop = scrollPositions.current[c.id] || viewportRef.current.scrollHeight
                      }
                    }, 0)
                  }}
                >
                  {c.icon === "hash" ? <Hash className="mr-2 h-4 w-4" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                  <span className="truncate">{c.name}</span>
                  {!!unread[c.id] && (
                    <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1 text-[10px]">
                      {unread[c.id]}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </ScrollArea>
          <div className="mt-auto border-t p-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback>🎲</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium flex items-center gap-2">
                  {mounted ? (user.displayName || user.name || "User") : "User"}
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Chairman</Badge>
                </div>
                <div className="text-xs text-emerald-500">● online</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header with channel toggle */}
        <div className="flex items-center justify-between px-3 py-2 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Hash className="mr-2 h-4 w-4" /> Channels
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="border-b px-3 py-2">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4" /> Channels
                </SheetTitle>
              </SheetHeader>
              <div className="p-2">
                {initialChannels.map((c) => (
                  <Button
                    key={c.id}
                    variant={active.id === c.id ? "secondary" : "ghost"}
                    className={cn("mb-1 w-full justify-start", active.id === c.id && "bg-muted")}
                    onClick={() => {
                      setActive(c)
                      setMobileOpen(false)
                    }}
                  >
                    {c.icon === "hash" ? <Hash className="mr-2 h-4 w-4" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                    <span className="truncate">{c.name}</span>
                  </Button>
                ))}
              </div>
              <div className="mt-auto border-t p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback>🎲</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium flex items-center gap-2">
                      {mounted ? (user.displayName || user.name || "User") : "User"}
                      <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Chairman</Badge>
                    </div>
                    <div className="text-xs text-emerald-500">● online</div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 px-2">
            <div className="truncate text-sm font-medium">#{active.name}</div>
            <div className="truncate text-xs text-muted-foreground">{active.description || "Welcome to the main chat"}</div>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost"><Users className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Members</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost"><Search className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Search</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost"><Bell className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost"><Info className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Channel info</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden items-center justify-between px-4 py-3 md:flex">
          <div>
            <div className="text-sm font-semibold">#{active.name}</div>
            <div className="text-xs text-muted-foreground">{active.description || "Welcome to the main chat"}</div>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost"><Users className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Members</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost"><Search className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Search</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost"><Bell className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost"><Info className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>Channel info</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Chat history */}
        <ScrollArea className="min-h-0 flex-1">
          <div
            ref={viewportRef}
            className="mx-auto w-full max-w-3xl px-4 py-4"
            onScroll={(e) => {
              const el = e.currentTarget
              const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48
              atBottomRef.current = nearBottom
            }}
          >
            {/* Day separators and grouped bubbles */}
            {channelMessages.map((m, idx) => {
              const meName = mounted ? (user.displayName || user.name || "You") : undefined
              const mine = !!meName && m.author === meName
              const prev = channelMessages[idx - 1]
              const showDay = !prev || !isSameDay(prev.createdAt, m.createdAt)
              const fiveMin = 5 * 60 * 1000
              const grouped = prev && prev.author === m.author && m.createdAt - prev.createdAt < fiveMin
              return (
                <div key={m.id}>
                  {showDay && (
                    <div className="my-4 flex items-center gap-3">
                      <Separator className="flex-1" />
                      <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toDateString()}</div>
                      <Separator className="flex-1" />
                    </div>
                  )}
                  <div className={cn("flex items-start gap-3 mt-2") }>
                    {grouped ? (
                      <div className="h-8 w-8" />
                    ) : (
                      <Avatar className="h-8 w-8 self-start">
                        <AvatarImage src={m.avatarUrl || undefined} />
                        <AvatarFallback>🎲</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-[72%]") }>
                      {!grouped && (
                        <div className={cn("mb-0.5 flex items-center gap-2 text-xs") }>
                          <>
                            <div className="font-medium">{m.author}</div>
                            <TierBadge tier={m.tier} />
                            <div className="text-muted-foreground">
                              <span suppressHydrationWarning>{formatTime(m.createdAt)}</span>
                            </div>
                          </>
                        </div>
                      )}
                      <DropdownMenu open={reactionOpenId === m.id} onOpenChange={(o) => !o && setReactionOpenId((id) => (id === m.id ? null : id))}>
                        <DropdownMenuTrigger asChild>
                          <div
                            className={cn(
                              "inline-block rounded-lg px-3 py-2 text-sm leading-relaxed select-text",
                              "bg-muted/60 rounded-tl-none"
                            )}
                            onMouseDown={(e) => {
                              const targetId = m.id
                              const timer = window.setTimeout(() => setReactionOpenId(targetId), 450)
                              const clear = () => window.clearTimeout(timer)
                              const up = () => { clear(); document.removeEventListener("mouseup", up); }
                              document.addEventListener("mouseup", up)
                              e.currentTarget.addEventListener("mouseleave", clear, { once: true })
                            }}
                            onTouchStart={() => {
                              const targetId = m.id
                              const timer = window.setTimeout(() => setReactionOpenId(targetId), 450)
                              const cancel = () => window.clearTimeout(timer)
                              document.addEventListener("touchend", cancel, { once: true })
                            }}
                          >
                            {m.content}
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={mine ? "end" : "start"} className="flex gap-1 p-1">
                          {["👍","🔥","🎉","❤️","😂"].map((emo) => (
                            <DropdownMenuItem
                              key={emo}
                              className="h-8 w-8 cursor-pointer items-center justify-center p-0 text-base"
                              onClick={() => {
                                setReactionOpenId(null)
                                setMessages((prev) => prev.map((pm) => {
                                  if (pm.id !== m.id) return pm
                                  const list = pm.reactions ? [...pm.reactions] : []
                                  const idx = list.findIndex((x) => x.emoji === emo)
                                  if (idx === -1) list.push({ emoji: emo, count: 1, mine: true })
                                  else {
                                    const cur = list[idx]
                                    const mine = !cur.mine
                                    const count = Math.max(0, (cur.count || 0) + (mine ? 1 : -1))
                                    list[idx] = { ...cur, mine, count }
                                  }
                                  return { ...pm, reactions: list }
                                }))
                              }}
                            >
                              {emo}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* Reactions row (only show when any count > 0) */}
                      <div className={cn("mt-1 flex flex-wrap gap-1") }>
                        {(m.reactions || []).filter((r) => r.count > 0).map((r, rIdx) => (
                          <Button
                            key={r.emoji}
                            size="sm"
                            variant={r.mine ? "secondary" : "ghost"}
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={() => {
                              setMessages((prev) => prev.map((pm) => {
                                if (pm.id !== m.id) return pm
                                const rx = (pm.reactions || []).map((ri, i) => {
                                  if (i !== rIdx) return ri
                                  const mine = !ri.mine
                                  const count = Math.max(0, (ri.count || 0) + (mine ? 1 : -1))
                                  return { ...ri, mine, count }
                                })
                                return { ...pm, reactions: rx }
                              }))
                            }}
                          >
                            <span>{r.emoji}</span>
                            {r.count > 0 && <span className="text-xs text-muted-foreground">{r.count}</span>}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* Input - Grok style integrated controls */}
        <div className="bg-background/80 pb-6 md:pb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <div className="mx-auto w-full max-w-3xl p-3">
              <div className="rounded-2xl border bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-2">
                  {/* Attach (left) */}
                  <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full" title="Attach">
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  {/* Textarea (grow) */}
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message #${active.name}...`}
                    className="flex-1 min-h-0 h-10 w-full resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    onKeyDown={onKeyDown}
                    style={{ fontFamily: 'inherit, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji' }}
                  />

                  {/* Emoji (right) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full" aria-label="Insert emoji">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[240px] p-2">
                      <div className="grid grid-cols-8 gap-1 text-base">
                        {['😀','😁','😂','🤣','😊','😍','😘','😎','🤗','🤔','👍','🔥','🎉','✨','💎','🚀','🧠','📈','💰','🤝','😅','😇','🙌','🙏','🥳','🤩','😤','😴','😮','😜','🤙','👀']
                          .map((emo) => (
                            <button
                              key={emo}
                              type="button"
                              className="h-7 w-7 rounded hover:bg-muted"
                              onClick={() => {
                                setInput((prev) => prev + emo)
                                setTimeout(() => inputRef.current?.focus(), 0)
                              }}
                            >
                              {emo}
                            </button>
                          ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Send (right) */}
                  <Button type="submit" size="icon" className="h-9 w-9 rounded-full">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    </WalletGate>
  )
}

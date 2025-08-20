"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Send, MoreVertical } from "lucide-react"
import { useUser } from "@/components/user-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { WalletGate } from "@/components/wallet-gate"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Message = {
  id: string
  role: "user" | "ai"
  content: string
  createdAt: number
}

type Chat = {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export default function PitBossPage() {
  const { user } = useUser()
  // Chats state with persistence
  const [chats, setChats] = React.useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = React.useState<string>("")
  const activeChat = React.useMemo(() => chats.find((c) => c.id === activeChatId) || null, [chats, activeChatId])
  const messages = React.useMemo(() => activeChat?.messages ?? [], [activeChat])
  const [input, setInput] = React.useState("")
  const [typing, setTyping] = React.useState(false)
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null)
  const [hotMessage, setHotMessage] = React.useState<{ id: string; index: number; role: Message["role"]; content: string } | null>(null)

  // Confirm dialog state
  const [confirm, setConfirm] = React.useState<
    | { type: "chat"; chatId: string }
    | { type: "message"; chatId: string; messageId: string }
    | null
  >(null)

  // --- Local persistence (load/save) ---
  const STORAGE_KEY = "pitboss_chats_v1"
  React.useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null
      if (raw) {
        const parsed = JSON.parse(raw) as { chats: Chat[]; activeChatId?: string }
        if (parsed?.chats?.length) {
          // Migration: ensure chats start with a user message. Drop any leading AI-only messages.
          const cleaned = parsed.chats.map((c) => {
            const firstUserIdx = c.messages.findIndex((m) => m.role === "user")
            let msgs: Message[] = []
            if (firstUserIdx === 0) msgs = c.messages
            else if (firstUserIdx > 0) msgs = c.messages.slice(firstUserIdx)
            // if no user yet, keep empty so only hero shows
            return { ...c, messages: msgs }
          })
          setChats(cleaned)
          setActiveChatId(parsed.activeChatId || cleaned[0]?.id || "")
          return
        }
      }
    } catch {}
    // If nothing in storage, create first chat
    const chat: Chat = {
      id: crypto.randomUUID(),
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setChats([chat])
    setActiveChatId(chat.id)
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const payload = JSON.stringify({ chats, activeChatId })
    window.localStorage.setItem(STORAGE_KEY, payload)
  }, [chats, activeChatId])

  React.useEffect(() => {
    // Use a bottom sentinel to ensure smooth, consistent autoscroll
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [messages, typing])

  

  // Chat ops
  function renameChat(chatId: string) {
    const current = chats.find((c) => c.id === chatId)
    const next = window.prompt("Rename chat", current?.title || "")
    if (next && next.trim()) {
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: next.trim(), updatedAt: Date.now() } : c)))
    }
  }

  function requestDeleteChat(chatId: string) {
    setConfirm({ type: "chat", chatId })
  }

  function requestDeleteMessage(chatId: string, messageId: string) {
    setConfirm({ type: "message", chatId, messageId })
  }

  function onConfirmDelete() {
    if (!confirm) return
    if (confirm.type === "chat") {
      setChats((prev) => prev.filter((c) => c.id !== confirm.chatId))
      if (activeChatId === confirm.chatId) {
        const remaining = chats.filter((c) => c.id !== confirm.chatId)
        setActiveChatId(remaining[0]?.id || "")
      }
    } else if (confirm.type === "message") {
      setChats((prev) =>
        prev.map((c) =>
          c.id === confirm.chatId
            ? { ...c, messages: c.messages.filter((m) => m.id !== confirm.messageId), updatedAt: Date.now() }
            : c
        )
      )
    }
    setConfirm(null)
  }

  const fetchAI = React.useCallback(async (history: Message[], profile?: { name?: string | null; displayName?: string | null }) => {
    const payload = {
      messages: history.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
      profile,
    }
    const res = await fetch("/api/pitboss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(t || "Request failed")
    }
    const json = await res.json()
    return (json?.content as string) ?? "Sorry, I couldn't generate a response."
  }, [])

  // Send a message programmatically (used by suggestions and manual send)
  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    // Ensure there is an active chat; if none, create one immediately
    let chatId = activeChat?.id
    if (!chatId) {
      const chat: Chat = {
        id: crypto.randomUUID(),
        title: "New chat",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setChats((prev) => [chat, ...prev])
      setActiveChatId(chat.id)
      chatId = chat.id
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed, createdAt: Date.now() }
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, messages: [...c.messages, userMsg], updatedAt: Date.now(), title: c.title === "New chat" ? trimmed.slice(0, 40) : c.title }
          : c
      )
    )
    setInput("")
    setTyping(true)
    // Create AI placeholder immediately so typing indicator shows right away
    const aiId = crypto.randomUUID()
    const startMsg: Message = { id: aiId, role: "ai", content: "", createdAt: Date.now() }
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, startMsg], updatedAt: Date.now() } : c)))
    try {
      const convo = activeChat ? [...messages, userMsg] : [userMsg]
      const aiText = await fetchAI(convo, { name: user.name || user.displayName })
      const chunk = 3
      const intervalMs = 15
      let i = 0
      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          i = Math.min(i + chunk, aiText.length)
          setChats((prev) => prev.map((c) =>
            c.id === chatId
              ? { ...c, messages: c.messages.map((m) => (m.id === aiId ? { ...m, content: aiText.slice(0, i) } : m)), updatedAt: Date.now() }
              : c
          ))
          if (i >= aiText.length) {
            clearInterval(timer)
            resolve()
          }
        }, intervalMs)
      })
    } catch {
      // Replace the placeholder with an error message
      setChats((prev) => prev.map((c) => (
        c.id === chatId
          ? { ...c, messages: c.messages.map((m) => (m.id === aiId ? { ...m, content: "I had trouble reaching the model. Please try again in a moment." } : m)), updatedAt: Date.now() }
          : c
      )))
    } finally {
      setTyping(false)
    }
  }

  // Regenerate last AI response for a given user message index
  const regenerateFrom = React.useCallback(async (userMsgIndex: number) => {
    if (!activeChat) return
    const msgs = activeChat.messages
    // Find next AI after user index
    const aiIndex = msgs.findIndex((m, i) => i > userMsgIndex && m.role === "ai")
    const cutIndex = aiIndex >= 0 ? aiIndex : msgs.length
    const history = msgs.slice(0, cutIndex)
    // Replace chat messages up to cutIndex
    setChats((prev) => prev.map((c) => (c.id === activeChat.id ? { ...c, messages: history } : c)))
    setTyping(true)
    try {
      const aiText = await fetchAI(history, { name: user.name || user.displayName })
      const aiId = crypto.randomUUID()
      const startMsg: Message = { id: aiId, role: "ai", content: "", createdAt: Date.now() }
      setChats((prev) => prev.map((c) => (c.id === activeChat.id ? { ...c, messages: [...history, startMsg], updatedAt: Date.now() } : c)))
      const chunk = 3
      const intervalMs = 15
      let i = 0
      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          i = Math.min(i + chunk, aiText.length)
          setChats((prev) => prev.map((c) => (
            c.id === activeChat.id
              ? { ...c, messages: c.messages.map((m) => (m.id === aiId ? { ...m, content: aiText.slice(0, i) } : m)), updatedAt: Date.now() }
              : c
          )))
          if (i >= aiText.length) {
            clearInterval(timer)
            resolve()
          }
        }, intervalMs)
      })
    } catch {
      const aiMsg: Message = { id: crypto.randomUUID(), role: "ai", content: "Retry failed. Please try again.", createdAt: Date.now() }
      setChats((prev) => prev.map((c) => (c.id === activeChat.id ? { ...c, messages: [...history, aiMsg], updatedAt: Date.now() } : c)))
    } finally {
      setTyping(false)
    }
  }, [activeChat, fetchAI, setChats, setTyping, user.displayName, user.name])

  // Edit & resend a user message: put it back to input
  function editAndResend(content: string) {
    setInput(content)
  }

  // Global keyboard shortcuts (placed after regenerateFrom to avoid use-before-declare)
  React.useEffect(() => {
    function isEditable(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      const editable = (target as HTMLElement).isContentEditable
      return editable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
    }

    function onGlobalKeyDown(e: KeyboardEvent) {
      // Block when confirm dialog is open
      if (confirm) return

      // Cmd/Ctrl+K focuses the input regardless of current focus
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        inputRef.current?.focus()
        return
      }

      // Do not trigger other shortcuts while typing in inputs/contenteditable
      if (isEditable(e.target)) return

      // C/E/R should not use modifiers
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return

      // C = copy hovered/last message
      if ((e.key === "c" || e.key === "C") && hotMessage) {
        e.preventDefault()
        navigator.clipboard?.writeText(hotMessage.content)
        return
      }

      // E = edit & resend (only for user messages)
      if ((e.key === "e" || e.key === "E") && hotMessage?.role === "user") {
        e.preventDefault()
        setInput(hotMessage.content)
        setTimeout(() => inputRef.current?.focus(), 0)
        return
      }

      // R = regenerate (only for AI messages)
      if ((e.key === "r" || e.key === "R") && hotMessage?.role === "ai") {
        e.preventDefault()
        const idx = hotMessage.index
        if (typeof idx === "number") {
          const prevUserIndex = messages
            .slice(0, idx)
            .map((m, i) => ({ m, i }))
            .reverse()
            .find(({ m }) => m.role === "user")?.i
          if (prevUserIndex != null) {
            regenerateFrom(prevUserIndex)
          }
        }
      }
    }

    window.addEventListener("keydown", onGlobalKeyDown)
    return () => window.removeEventListener("keydown", onGlobalKeyDown)
  }, [confirm, hotMessage, messages, regenerateFrom])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || typing) return

    await sendMessage(trimmed)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function newChat() {
    const chat: Chat = {
      id: crypto.randomUUID(),
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setChats((prev) => [chat, ...prev])
    setActiveChatId(chat.id)
  }

  const suggestions = [
    "What is the Digital Asset Agreement?",
    "How is my ownership and dividend payout verified?",
    "Can I sell my NFT shares?",
    "What is the purpose of the $CHIP token?",
  ]

  const MAX_SUGGESTION_LEN = 44
  const hasUser = React.useMemo(() => messages.some((m) => m.role === "user"), [messages])
  const labelFor = React.useCallback((s: string) => (s.length > MAX_SUGGESTION_LEN ? s.slice(0, MAX_SUGGESTION_LEN - 1) + "…" : s), [])
  // When streaming, the last AI message begins as an empty string. Skip rendering that empty
  // ChatBubble and show a single TypingIndicator instead to prevent duplicate avatar/typing rows.
  const hasPendingAI = React.useMemo(() => {
    if (!typing || messages.length === 0) return false
    const last = messages[messages.length - 1]
    return last.role === "ai" && last.content === ""
  }, [typing, messages])

  return (
    <WalletGate>
    <div className="flex h-[calc(100vh-var(--header-height))] w-full overflow-hidden">
      {/* Chats sidebar */}
      <div className="hidden w-64 shrink-0 border-r md:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="font-medium">Chats</div>
            <Button size="sm" variant="outline" onClick={newChat}>New</Button>
          </div>
          <div className="flex-1 overflow-auto">
            {chats.map((c) => (
              <div key={c.id} className={cn("flex items-center gap-2 px-3 py-2 hover:bg-muted/30", c.id === activeChatId && "bg-muted/40")}
              >
                <button
                  onClick={() => setActiveChatId(c.id)}
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                >
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.title || "Untitled"}</div>
                    <div className="truncate text-xs text-muted-foreground">{new Date(c.updatedAt).toLocaleString()}</div>
                  </div>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Chat options">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => setActiveChatId(c.id)}>Open</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => renameChat(c.id)}>Rename</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => requestDeleteChat(c.id)} className="text-red-600 focus:text-red-600">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat column */}
      <div className="grid min-w-0 min-h-0 flex-1 grid-rows-[auto_1fr_auto] overflow-hidden">
        <div className="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/pitboss-avatar.jpg" alt="Pit Boss" />
              <AvatarFallback>PB</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight">Pit Boss</h1>
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 font-mono text-[10px] uppercase tracking-wide border bg-amber-500/15 text-amber-400 border-amber-500/20"
                >
                  BETA
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">Your SplitBet AI assistant. Ask about SplitBet, profits, dividends, shares, and more.</p>
            </div>
            {/* header right actions removed to keep suggestions near prompt */}
          </div>
        </div>

        <ScrollArea className="min-h-0">
          <div
            ref={viewportRef}
            className={cn(
              "mx-auto w-full max-w-3xl px-4 py-6 pb-6 lg:px-6"
            )}
          >
            {/* Hero area before first user message */}
            {!hasUser && (
              <div className="relative mb-8 flex min-h-[56vh] items-center justify-center overflow-hidden">
                {/* animated glow */}
                <div className="pointer-events-none absolute inset-0 -z-[1]">
                  <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-500/15 via-violet-500/15 to-emerald-500/15 blur-3xl animate-pulse" />
                </div>
                <div className="text-center">
                  <h2 className="bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400 bg-clip-text text-3xl font-semibold text-transparent sm:text-4xl">
                    Hello there!
                  </h2>
                  <p className="text-muted-foreground mt-2 text-base">How can I help you today?</p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4">
              {messages.some((m) => m.role === "user") && (() => {
                const firstUserIdx = messages.findIndex((m) => m.role === "user")
                const visible = messages.slice(firstUserIdx)
                return (
                  <>
                    {visible.map((m, idx) => {
                      const origIdx = firstUserIdx + idx
                      // Skip rendering an empty AI message (stream placeholder)
                      if (m.role === "ai" && m.content === "") {
                        return null
                      }
                      return (
                        <ChatBubble
                          key={m.id}
                          role={m.role}
                          content={m.content}
                          createdAt={m.createdAt}
                          userName={user.displayName || user.name}
                          onCopy={() => navigator.clipboard.writeText(m.content)}
                          onEditResend={m.role === "user" ? () => editAndResend(m.content) : undefined}
                          onRegenerate={m.role === "ai" ? () => regenerateFrom(Math.max(0, origIdx - 1)) : undefined}
                          onDelete={() => activeChat && requestDeleteMessage(activeChat.id, m.id)}
                          onHover={() => setHotMessage({ id: m.id, index: origIdx, role: m.role, content: m.content })}
                        />
                      )
                    })}
                    {typing && hasPendingAI && <TypingIndicator />}
                  </>
                )
              })()}
            </div>
            {/* Bottom sentinel for autoscroll */}
            <div ref={bottomRef} className="h-0" />
          </div>
        </ScrollArea>

        <div className="bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto w-full max-w-3xl px-4 pt-3 pb-5 lg:px-6">
            {/* Suggested prompts row */}
            {!messages.some((m) => m.role === "user") && (
              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {suggestions.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    className="justify-start overflow-hidden whitespace-nowrap text-ellipsis"
                    onClick={() => sendMessage(s)}
                    title={s}
                  >
                    {labelFor(s)}
                  </Button>
                ))}
              </div>
            )}
            {/* Prompt field with embedded send button */}
            <div className={cn(
              "group relative",
              !hasUser &&
                "rounded-lg p-[1.5px] bg-[linear-gradient(90deg,theme(colors.sky.500/.35),theme(colors.violet.500/.35),theme(colors.emerald.500/.35))] animate-pulse"
            )}>
              <div className="relative rounded-lg border bg-background/60 shadow-sm overflow-hidden">
                {/* Hover/focus subtle border glow once chat has started */}
                {hasUser && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[10px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100"
                    style={{
                      padding: "1.5px",
                      background:
                        "linear-gradient(90deg, rgba(56,189,248,.35), rgba(139,92,246,.35), rgba(16,185,129,.35))",
                      WebkitMask:
                        "linear-gradient(#000,#000) content-box, linear-gradient(#000,#000)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                  />
                )}
                <Textarea
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  ref={inputRef}
                  placeholder="Ask the Pit Boss anything..."
                  className="min-h-[56px] w-full resize-none border-0 bg-transparent pr-16 focus-visible:ring-0 focus:outline-none focus-visible:outline-none placeholder:text-muted-foreground focus:placeholder-transparent"
                  style={{ fontFamily: 'inherit, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji' }}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-end p-2">
                  <Button
                    onClick={handleSend}
                    disabled={typing || !input.trim()}
                    size="sm"
                    className="pointer-events-auto h-9 px-3"
                  >
                    <Send className="mr-1.5 h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
            {/* bottom spacer removed to prevent page overflow */}
          </div>
        </div>
      </div>
      {/* Confirm dialog */}
      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === "chat" ? "Delete chat?" : "Delete message?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === "chat"
                ? "This will permanently delete the chat and all its messages. This action cannot be undone."
                : "This will permanently delete the selected message. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirm(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </WalletGate>
  )
}

function ChatBubble({
  role,
  content,
  createdAt,
  userName,
  onCopy,
  onEditResend,
  onRegenerate,
  onDelete,
  onHover,
}: {
  role: Message["role"]
  content: string
  createdAt: number
  userName?: string | null
  onCopy?: () => void | Promise<void>
  onEditResend?: () => void
  onRegenerate?: () => void | Promise<void>
  onDelete?: () => void
  onHover?: () => void
}) {
  const isUser = role === "user"
  const { user } = useUser()
  return (
    <div className={cn("group flex w-full gap-3", isUser ? "justify-end" : "justify-start")} onMouseEnter={onHover}>
      {!isUser && (
        <Avatar className="mt-0.5 h-8 w-8">
          <AvatarImage src="/pitboss-avatar.jpg" alt="Pit Boss" />
          <AvatarFallback className="bg-sky-700 text-white">PB</AvatarFallback>
        </Avatar>
      )}
      <div className={cn("relative flex max-w-[80%] flex-col items-start", isUser && "items-end")}>
        <div className={cn("mb-1 text-xs font-medium text-white/90", isUser && "self-end")}>{isUser ? (userName || "You") : "Pit Boss"}</div>
        <div
          className={cn(
            "relative w-fit rounded-md px-3 py-2 text-sm leading-relaxed shadow-sm",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted/70 text-foreground"
          )}
        >
          <div className="chat-markdown prose prose-invert prose-sm max-w-none prose-p:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-headings:mt-4 prose-headings:mb-2">
            <Markdown content={content} />
          </div>
          <style jsx global>{`
            /* Nested list tuning for chat markdown */
            .chat-markdown ul ul,
            .chat-markdown ol ol,
            .chat-markdown ul ol,
            .chat-markdown ol ul {
              margin-top: 0.25rem;
              margin-bottom: 0.25rem;
              margin-left: 1rem;
            }
            .chat-markdown li { margin-top: 0.25rem; margin-bottom: 0.25rem; }
            .chat-markdown blockquote { font-style: italic; }
            /* Max readable line length */
            .chat-markdown p { max-width: 70ch; }
            .chat-markdown li > p { margin-top: 0.125rem; margin-bottom: 0.125rem; }
          `}</style>
          {/* Hover actions: single 3-dot dropdown to avoid overflow */}
          <div
            className={cn(
              "pointer-events-auto absolute top-1 z-10 opacity-0 transition-opacity group-hover:opacity-100",
              // Place the trigger away from the avatar:
              // - User (right-aligned): put trigger to the LEFT of the bubble
              // - AI   (left-aligned):  put trigger to the RIGHT of the bubble
              isUser ? "right-full mr-2" : "left-full ml-2"
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground bg-background/60 hover:bg-background/80 border border-border/40" aria-label="Message options">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isUser ? "left" : "right"}
                sideOffset={6}
                align={isUser ? "start" : "end"}
                className="w-44"
              >
                {onCopy && <DropdownMenuItem onClick={onCopy}>Copy (C)</DropdownMenuItem>}
                {onEditResend && <DropdownMenuItem onClick={onEditResend}>Edit & Resend (E)</DropdownMenuItem>}
                {onRegenerate && <DropdownMenuItem onClick={onRegenerate}>Regenerate (R)</DropdownMenuItem>}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className={cn("mt-1 text-[11px]", isUser ? "text-muted-foreground" : "text-white/70")}>{new Date(createdAt).toLocaleTimeString()}</div>
      </div>
      {isUser && (
        <Avatar className="mt-0.5 h-8 w-8">
          <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.name || "User"} />
          <AvatarFallback className="bg-amber-700 text-white">🎲</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex w-full gap-3 justify-start">
      <Avatar className="mt-0.5 h-8 w-8">
        <AvatarImage src="/pitboss-avatar.jpg" alt="Pit Boss" />
        <AvatarFallback className="bg-sky-700 text-white">PB</AvatarFallback>
      </Avatar>
      <div className="flex max-w-[80%] flex-col items-start">
        <div className="mb-1 text-xs font-medium text-white/90">Pit Boss</div>
        <div className="rounded-md bg-muted/70 text-foreground px-3 py-2 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="sr-only">Typing…</span>
            <span className="inline-block h-2 w-2 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="inline-block h-2 w-2 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '120ms' }} />
            <span className="inline-block h-2 w-2 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '240ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Markdown({ content }: { content: string }) {
  const html = React.useMemo(() => {
    let c = content
      // Normalize newlines and strip trailing spaces
      .replace(/\r\n?/g, "\n")
      .replace(/[\t ]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    // Fenced code blocks ``` ```
    c = c.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre class="rounded bg-background/40 p-3 overflow-x-auto"><code>${code}</code></pre>`)
    // Inline code
    c = c.replace(/`([^`]+)`/g, '<code class="rounded bg-background/40 px-1 py-0.5">$1</code>')
    // ATX headings (# to ####)
    c = c.replace(/^####\s*(.*)$/gm, '<h4>$1</h4>')
    c = c.replace(/^###\s*(.*)$/gm, '<h3>$1</h3>')
    c = c.replace(/^##\s*(.*)$/gm, '<h2>$1</h2>')
    c = c.replace(/^#\s*(.*)$/gm, '<h1>$1</h1>')
    c = c.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    c = c.replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // Convert lines like "1. Label:" that introduce a bullet section into bold paragraph labels (avoid many single-item 1.'s)
    c = c.replace(/^\s*1\.\s+(.+?:)\s*(?=\n\s*[\-•–—])/gm, '<p><strong>$1<\/strong><\/p>')
    // Ordered list items (use temporary <ol-item> wrapper)
    c = c.replace(/^\s*\d+\. (.*)$/gm, '<ol-item>$1<\/ol-item>')
    c = c.replace(/(<ol-item>.*<\/ol-item>(?:\n{1,2})?)+/g, function(m) {
      return '<ol class="ml-5 pl-1 list-decimal space-y-1">' + m
        .replace(/<ol-item>/g, '<li>')
        .replace(/<\/ol-item>/g, '<\/li>') + '<\/ol>'
    })
    // Unordered list items (use temporary <ul-item> wrapper). Support -, •, – (en dash), — (em dash)
    c = c.replace(/^\s*[\-•–—] (.*)$/gm, '<ul-item>$1<\/ul-item>')
    c = c.replace(/(<ul-item>.*<\/ul-item>(?:\n{1,2})?)+/g, function(m) {
      return '<ul class="ml-5 list-disc space-y-1">' + m
        .replace(/<ul-item>/g, '<li>')
        .replace(/<\/ul-item>/g, '<\/li>') + '<\/ul>'
    }) 
    c = c.replace(/^> (.*)$/gm, '<blockquote class="border-l pl-3 rounded-sm italic text-muted-foreground/80 bg-background\/30 py-1">$1<\/blockquote>')
    // Wrap tables with scroll container for better UX
    c = c.replace(/<table[\s\S]*?<\/table>/g, (m) => `<div class="table-scroll">${m}<\/div>`)    
    c = c.replace(/(https?:\/\/[^\s]+)/g, '<a class="underline" href="$1" target="_blank" rel="noreferrer noopener">$1<\/a>')
    return c
  }, [content])

  return (
    <div
      className="prose prose-invert prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base"
      style={{ fontFamily: 'inherit, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// ... (rest of the code remains the same)

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Aperture, Bot, Send } from "lucide-react"

type Message = {
  id: string
  role: "user" | "ai"
  content: string
}

export default function PitBossPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: "ai",
      content:
        "Hello — I’m Pit Boss. Ask me about profit, dividends, shares, or anything finance-related.",
    },
  ])
  const [input, setInput] = React.useState("")
  const [typing, setTyping] = React.useState(false)
  const viewportRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    // Scroll to bottom whenever messages or typing change
    const el = viewportRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, typing])

  function aiReply(userText: string): string {
    const t = userText.toLowerCase()
    if (t.includes("profit")) {
      return `Based on the latest ledger snapshots, net profit is trending up week-over-week.\n\n• Last 7 days: +3.4%\n• MTD: +8.1%\n• 30‑day run rate: ~$2.1M`;
    }
    if (t.includes("dividend") || t.includes("dividends")) {
      return `Projected dividends remain stable.\n\n- Next declaration window: Q4\n- Coverage ratio: 1.6x\n- Payout target: 35–45% of FCF`;
    }
    if (t.includes("share") || t.includes("shares")) {
      return `Outstanding shares are unchanged. Float remains tight with low daily turnover.\n\n> Tip: Consolidate odd lots before month-end to reduce transfer fees.`;
    }
    if (t.includes("hello") || t.includes("hi")) {
      return `Hi there — how can I help? Try asking about profit, dividends, or shares.`
    }
    return `I can help with P&L trends, cash flow, dividends, and share structure. Try keywords like **profit**, **dividends**, or **shares**.`
  }

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || typing) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setTyping(true)

    const response = aiReply(trimmed)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", content: response },
      ])
      setTyping(false)
    }, 900 + Math.min(2200, Math.max(300, response.length * 12)))
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height))] w-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
            <Aperture className="h-5 w-5 text-primary" />
          </div>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-xl font-semibold tracking-tight">Pit Boss</h1>
            <p className="text-muted-foreground text-sm">Your personal financial assistant for Aceberg.</p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1">
        <div ref={viewportRef} className="mx-auto w-full max-w-3xl px-4 py-6 lg:px-6">
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <ChatBubble key={m.id} role={m.role} content={m.content} />
            ))}
            {typing && <TypingBubble />}
          </div>
        </div>
      </ScrollArea>

      <Separator />

      {/* Input */}
      <div className="sticky bottom-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4 py-3 lg:px-6">
          <Textarea
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask the Pit Boss anything..."
            className="min-h-[56px] flex-1 resize-none bg-muted/30"
          />
          <Button onClick={handleSend} disabled={typing || !input.trim()} className="h-[40px] px-3">
            <Send className="mr-1.5 h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ role, content }: { role: Message["role"]; content: string }) {
  const isUser = role === "user"
  return (
    <div className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}> 
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-md px-3 py-2 text-sm leading-relaxed",
          isUser ? "bg-muted/60" : "bg-muted/40"
        )}
      >
        <Markdown content={content} />
      </div>
      {isUser && <div className="h-8 w-8" />}
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-center gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-md bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="inline-block animate-pulse">typing</span>
          <span className="inline-block animate-pulse">.</span>
          <span className="inline-block animate-pulse">.</span>
          <span className="inline-block animate-pulse">.</span>
        </div>
      </div>
    </div>
  )
}

// Minimal markdown renderer (bold, italics, code, lists, breaks, quotes, links)
function Markdown({ content }: { content: string }) {
  const html = React.useMemo(() => {
    let c = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    // code
    c = c.replace(/`([^`]+)`/g, '<code class="rounded bg-background/40 px-1 py-0.5">$1</code>')
    // bold and italics
    c = c.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    c = c.replace(/\*([^*]+)\*/g, "<em>$1</em>")
    // lists
    c = c.replace(/^\s*[-•] (.*)$/gm, "<li>$1</li>")
    c = c.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul class="ml-5 list-disc">${m}</ul>`) 
    // blockquote
    c = c.replace(/^> (.*)$/gm, '<blockquote class="border-l pl-3 text-muted-foreground">$1</blockquote>')
    // line breaks
    c = c.replace(/\n/g, "<br/>")
    // links (basic)
    c = c.replace(/(https?:\/\/[^\s]+)/g, '<a class="underline" href="$1" target="_blank" rel="noreferrer noopener">$1</a>')
    return c
  }, [content])

  return (
    <div
      className="prose prose-invert prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

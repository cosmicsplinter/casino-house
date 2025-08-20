import { NextRequest } from "next/server"
import { readFile } from "fs/promises"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, profile } = body as {
      messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
      profile?: { name?: string | null; displayName?: string | null; email?: string | null }
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENROUTER_API_KEY. Set it in .env.local" }),
        { status: 500, headers: { "content-type": "application/json" } }
      )
    }

    const kbPath = process.cwd() + "/lib/knowledge/splitbet.md"
    const splitbet = await readFile(kbPath, "utf8").catch(() => "")

    const system = `You are Pit Boss, the helpful assistant for SplitBet. Use the SplitBet knowledge below as authoritative when users ask about SplitBet. If information is not present, respond helpfully without fabricating details and say you'll follow up.

--- SplitBet Knowledge ---\n${splitbet}\n-------------------------\n
User profile (may be empty): name=${profile?.displayName || profile?.name || ""}, email=${profile?.email || ""}`

    const model = process.env.OPENROUTER_MODEL || "mistralai/mistral-small-3.2-24b-instruct:free"
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "SplitBet PitBoss Assistant",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          ...messages,
        ],
        temperature: 0.7,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      return new Response(JSON.stringify({ error: "OpenRouter error", detail: text }), {
        status: 500,
        headers: { "content-type": "application/json" },
      })
    }

    const data = await resp.json()
    const content: string = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response."

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  } catch (err: unknown) {
    const maybe = err as { message?: unknown } | null
    const message = maybe && typeof maybe.message === "string" ? maybe.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}

"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormEvent, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"

// Minimal EIP-1193 typings for window.ethereum
type EthereumProvider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
declare global { interface Window { ethereum?: EthereumProvider } }

export function AuthMagicForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const [remember, setRemember] = useState(true)
  const [hasRequestedLink, setHasRequestedLink] = useState(false)

  // Use env-defined base URL in production to avoid localhost links in emails
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")

  // cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (typeof window !== "undefined") localStorage.setItem("remember_me", remember ? "1" : "0")
      const redirectTo = baseUrl ? `${baseUrl}/dashboard?remember=${remember ? 1 : 0}` : undefined
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
      if (error) throw error
      toast.success("Magic link sent. Check your email.")
      setHasRequestedLink(true)
      setCooldown(60)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>We’ll email you a magic link to sign in</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Primary: Social / Wallet buttons */}
          <div className="grid gap-2 pt-2">
            <Button
              type="button"
              variant="default"
              className="w-full justify-start gap-2"
              onClick={async () => {
                try {
                  const redirectTo = baseUrl ? `${baseUrl}/dashboard` : undefined
                  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } })
                  if (error) throw error
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : "Google sign-in failed"
                  toast.error(message)
                }
              }}
            >
              <Image src="/logo-google.svg" alt="Google" width={16} height={16} />
              <span>Continue with Google</span>
            </Button>
            <Button
              type="button"
              variant="default"
              className="w-full justify-start gap-2"
              onClick={async () => {
                try {
                  if (!window.ethereum) throw new Error("No Ethereum provider found")
                  await window.ethereum.request({ method: "eth_requestAccounts" })
                  toast.success("Wallet connected")
                  router.push("/dashboard")
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : "MetaMask sign-in failed"
                  toast.error(message)
                }
              }}
            >
              <Image src="/logo-metamask.svg" alt="MetaMask" width={16} height={16} />
              <span>Continue with MetaMask</span>
            </Button>
          </div>
          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or continue with Email</span>
            </div>
          </div>
          {/* Email Magic Link form */}
          <form onSubmit={onSubmit} data-mode="magic">
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@splitbet.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input id="remember1" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <Label htmlFor="remember1">Remember me</Label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send magic link"}
              </Button>
              {hasRequestedLink && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={cooldown > 0 || resending}
                  onClick={async () => {
                    try {
                      setResending(true)
                      if (typeof window !== "undefined") localStorage.setItem("remember_me", remember ? "1" : "0")
                      const redirectTo = baseUrl ? `${baseUrl}/dashboard?remember=${remember ? 1 : 0}` : undefined
                      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
                      if (error) throw error
                      toast.success("Magic link re-sent")
                      setHasRequestedLink(true)
                      setCooldown(60)
                    } catch (err: unknown) {
                      const message = err instanceof Error ? err.message : "Failed to resend"
                      toast.error(message)
                    } finally {
                      setResending(false)
                    }
                  }}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Resending..." : "Resend magic link"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By continuing, you agree to our <a href="#">Terms of Service</a> and
        <a href="#"> Privacy Policy</a>.
      </div>
    </div>
  )
}

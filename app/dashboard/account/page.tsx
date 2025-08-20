"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Toggle } from "@/components/ui/toggle"
import { useUser } from "@/components/user-context"
import { toast } from "sonner"
import { IconX, IconCircleCheck, IconAlertCircle, IconLock, IconUpload, IconMail } from "@tabler/icons-react"
import { supabase } from "@/lib/supabase-client"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Select not used here; country/timezone use custom searchable components
import { CountrySelect } from "@/components/country-select"
import { TimezoneSelect } from "@/components/timezone-select"
// import { Checkbox } from "@/components/ui/checkbox" // not used currently

function FormRow({
  label,
  labelFor,
  description,
  inlineLabelExtra,
  children,
}: {
  label: string
  labelFor?: string
  description?: React.ReactNode
  inlineLabelExtra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:items-start md:gap-6">
      <div className="pt-1.5 md:col-span-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={labelFor}>{label}</Label>
          {inlineLabelExtra}
        </div>
        {description ? (
          <div className="mt-1 text-xs text-muted-foreground">{description}</div>
        ) : null}
      </div>
      <div className="grid gap-2 md:col-span-2">{children}</div>
    </div>
  )
}

export default function AccountPage() {
  const { user, updateUser } = useUser()
  const router = useRouter()
  // Handle permanence: once set, it cannot be changed
  const handleLocked = React.useMemo(() => Boolean((user.handle || "").trim().length > 0), [user.handle])
  const [showHandleConfirm, setShowHandleConfirm] = React.useState(false)
  const pendingHandleRef = React.useRef<string>("")

  // Account Details
  const [displayName, setDisplayName] = React.useState(user.displayName || user.name)
  const email = user.email
  const [handle, setHandle] = React.useState(user.handle || "")
  const [handleStatus, setHandleStatus] = React.useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle")
  const [authUserId, setAuthUserId] = React.useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined | null>(user.avatarUrl)
  const [bio, setBio] = React.useState(user.bio || "")

  // New: country and timezone (UI only for now)
  const [country, setCountry] = React.useState<string>("")
  const [timezone, setTimezone] = React.useState<string>("")
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const AVATARS_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET || "avatars"
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false)
  const [emailVerified, setEmailVerified] = React.useState<boolean>(false)
  // Public profile toggle
  const [isPublic, setIsPublic] = React.useState<boolean>(Boolean(user.isPublic))

  // Keep local avatarUrl in sync with global user context
  React.useEffect(() => {
    setAvatarUrl(user.avatarUrl ?? null)
  }, [user.avatarUrl])

  // Avatar upload helpers
  async function uploadAvatarFile(file: File) {
    try {
      setUploadingAvatar(true)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const who = (user.handle || user.email || 'user').replace(/[^a-zA-Z0-9-_@.]/g, '')
      const path = `${who}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (upErr) throw upErr
      const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)
      const publicUrl = data.publicUrl
      setAvatarUrl(publicUrl)
      updateUser({ avatarUrl: publicUrl })

      // Persist avatar to profiles immediately so public page reflects it
      try {
        let uid = authUserId
        if (!uid) {
          const { data: authData } = await supabase.auth.getUser()
          uid = authData.user?.id ?? null
          if (uid) setAuthUserId(uid)
        }
        if (uid) {
          const { error: avatarUpsertErr } = await supabase
            .from('profiles')
            .upsert({ id: uid, avatar_url: publicUrl })
          if (avatarUpsertErr) {
            console.warn('profiles avatar_url upsert error', avatarUpsertErr)
          }
        }
      } catch (persistErr) {
        console.warn('profiles avatar_url upsert exception', persistErr)
      }
      toast.success('Avatar uploaded')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar'
      toast.error(message)
    } finally {
      setUploadingAvatar(false)
    }
  }
  React.useEffect(() => {
    setBio(user.bio || "")
  }, [user.bio])

  // Keep local public flag in sync
  React.useEffect(() => {
    setIsPublic(Boolean(user.isPublic))
  }, [user.isPublic])

  // Dirty state for Save Changes
  const initialRef = React.useRef({
    displayName: displayName || "",
    handle: handle || "",
    bio: bio || "",
    country: country || "",
    timezone: timezone || "",
  })
  const dirty =
    (displayName || "") !== initialRef.current.displayName ||
    (handle || "") !== initialRef.current.handle ||
    (bio || "") !== initialRef.current.bio ||
    (country || "") !== initialRef.current.country ||
    (timezone || "") !== initialRef.current.timezone

  // Sync local form state from hydrated user profile once, and whenever not dirty
  const formInitializedRef = React.useRef(false)
  React.useEffect(() => {
    const currentUserDisplay = (user.displayName || user.name || "") as string
    const currentUserHandle = (user.handle || "") as string
    const currentUserBio = user.bio || ""
    // country/timezone are UI-only for now; do not derive from user type
    const localDirty = (displayName || "") !== initialRef.current.displayName || (handle || "") !== initialRef.current.handle
    if (!formInitializedRef.current || !localDirty) {
      setDisplayName(currentUserDisplay)
      setHandle(currentUserHandle)
      setBio(currentUserBio)
      initialRef.current = { displayName: currentUserDisplay, handle: currentUserHandle, bio: currentUserBio, country: initialRef.current.country, timezone: initialRef.current.timezone }
      formInitializedRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.displayName, user.name, user.handle])

  // Debounced handle availability check (inside component)
  React.useEffect(() => {
    let alive = true
    const raw = (handle || "").trim()
    const normalized = raw.replace(/^@+/, "").toLowerCase()

    // validation: 3-20 chars, lowercase letters and numbers only
    const valid = normalized.length === 0 || /^[a-z0-9]{3,20}$/.test(normalized)
    if (!valid) {
      setHandleStatus("invalid")
      return
    }
    if (normalized.length === 0 || handleLocked) {
      setHandleStatus("idle")
      return
    }
    // Suppress availability UI if unchanged from saved handle
    const currentSaved = (user.handle || "").toLowerCase()
    if (normalized === currentSaved) {
      setHandleStatus("idle")
      return
    }
    setHandleStatus("checking")

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .ilike("handle", normalized)

        if (!alive) return

        if (error) {
          setHandleStatus("available")
          return
        }

        const list = (data as { id: string }[] | null) || []
        const others = list.filter((row) => row.id !== authUserId)
        setHandleStatus(others.length > 0 ? "taken" : "available")
      } catch {
        if (!alive) return
        setHandleStatus("available")
      }
    }, 400)

    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [handle, authUserId, user.handle, handleLocked])

  const handleHelper = React.useMemo(() => {
    switch (handleStatus) {
      case "checking":
        return { text: "Checking availability…", className: "text-muted-foreground" }
      case "available":
        return { text: "Handle is available", className: "text-emerald-400" }
      case "taken":
        return { text: "Handle is already taken", className: "text-amber-400" }
      case "invalid":
        return { text: "3–20 chars, lowercase letters and numbers only", className: "text-rose-400" }
      default:
        return { text: "", className: "" }
    }
  }, [handleStatus])
  // Socials
  const [twitter, setTwitter] = React.useState(user.socials?.twitter || "")
  const [discord, setDiscord] = React.useState(user.socials?.discord || "")
  const [telegram, setTelegram] = React.useState(user.socials?.telegram || "")
  const socialsInitialRef = React.useRef({ twitter, discord, telegram })
  const [savingSocials, setSavingSocials] = React.useState(false)
  const socialsDirty =
    twitter !== socialsInitialRef.current.twitter ||
    discord !== socialsInitialRef.current.discord ||
    telegram !== socialsInitialRef.current.telegram
  const canSave = dirty && handleStatus !== "checking" && handleStatus !== "taken" && handleStatus !== "invalid"
  // Keep socials inputs synced with loaded profile unless the form is dirty
  React.useEffect(() => {
    const s = user.socials || {}
    const nextTwitter = s.twitter || ""
    const nextDiscord = s.discord || ""
    const nextTelegram = s.telegram || ""
    if (!savingSocials && !socialsDirty && (
      nextTwitter !== twitter ||
      nextDiscord !== discord ||
      nextTelegram !== telegram
    )) {
      setTwitter(nextTwitter)
      setDiscord(nextDiscord)
      setTelegram(nextTelegram)
      socialsInitialRef.current = { twitter: nextTwitter, discord: nextDiscord, telegram: nextTelegram }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.socials, socialsDirty, savingSocials])
  function saveSocials() {
    // Normalize inputs (trim and drop empty)
    const norm = (v: string) => (typeof v === 'string' ? v.trim() : '')
    const t = norm(twitter)
    const d = norm(discord)
    const g = norm(telegram)
    const socials: Record<string, string> = { ...(user.socials || {}) }
    if (t) socials.twitter = t
    else delete socials.twitter
    if (d) socials.discord = d
    else delete socials.discord
    if (g) socials.telegram = g
    else delete socials.telegram

    // Persist to Supabase 'profiles'
    ;(async () => {
      try {
        setSavingSocials(true)
        let uid = authUserId
        if (!uid) {
          const { data } = await supabase.auth.getUser()
          uid = data.user?.id ?? null
          if (uid) setAuthUserId(uid)
        }
        if (!uid) {
          toast.error('Not signed in. Please re-login and try again.')
          return
        }
        const { error } = await supabase.from("profiles").upsert({ id: uid, socials })
        if (error) {
          console.error('profiles socials upsert error', error)
          toast.error('Failed to save social links')
          return
        }
        // Re-fetch authoritative socials from DB to avoid stale context
        const { data: refreshed, error: fetchErr } = await supabase
          .from('profiles')
          .select('socials')
          .eq('id', uid)
          .maybeSingle()
        if (fetchErr) {
          console.warn('profiles socials fetch after save failed, falling back to local', fetchErr)
          updateUser({ socials })
          socialsInitialRef.current = { twitter: t, discord: d, telegram: g }
        } else {
          const s = (refreshed?.socials ?? {}) as Record<string, string>
          updateUser({ socials: s })
          socialsInitialRef.current = {
            twitter: s.twitter || '',
            discord: s.discord || '',
            telegram: s.telegram || ''
          }
          // Also sync input fields to the DB state
          setTwitter(s.twitter || '')
          setDiscord(s.discord || '')
          setTelegram(s.telegram || '')
        }
        toast.success("Social links saved")
      } catch (e) {
        console.error('profiles socials upsert exception', e)
        toast.error('Failed to save social links')
      } finally { setSavingSocials(false) }
    })()
  }

  // Communications preferences removed in this layout pass (no UI currently)

  // Security & Privacy (mock data)
  const [twoFAEnabled, setTwoFAEnabled] = React.useState(false)
  const [show2FASetup, setShow2FASetup] = React.useState(false)
  const [lastSignInAt, setLastSignInAt] = React.useState<string | null>(null)

  // Simple client-side device label
  const deviceLabel = React.useMemo(() => {
    if (typeof navigator === 'undefined') return 'This device'
    const ua = navigator.userAgent || ''
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS Device'
    if (/Android/i.test(ua)) return 'Android Device'
    if (/Macintosh/i.test(ua)) return 'Mac'
    if (/Windows/i.test(ua)) return 'Windows PC'
    if (/Linux/i.test(ua)) return 'Linux Machine'
    return 'This device'
  }, [])

  function onChooseAvatar() {
    fileInputRef.current?.click()
  }
  async function onAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0]
      if (!file) return
      await uploadAvatarFile(file)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar'
      toast.error(message)
    }
  }
  function onRemoveAvatar() {
    // Only update local state; user clicks Save Changes to persist
    setAvatarUrl(null)
    updateUser({ avatarUrl: undefined })
    toast.success("Avatar removed")
  }
  // manage2FA removed; handled inline with Toggle

  // Removed password management to support magic-link only auth

  // Email verified status from Supabase
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      if (!mounted) return
      const u = data.user
      setEmailVerified(Boolean(u?.email_confirmed_at))
      const uid = u?.id ?? null
      setAuthUserId(uid)
      setLastSignInAt(u?.last_sign_in_at ?? null)
      if (uid) {
        type ProfileSubset = { country: string | null; timezone: string | null } | null
        const { data: prof } = await supabase
          .from('profiles')
          .select('country, timezone')
          .eq('id', uid)
          .maybeSingle<ProfileSubset>()
        if (!mounted) return
        const c = prof?.country ?? ''
        const t = prof?.timezone ?? ''
        setCountry(c)
        setTimezone(t)
        initialRef.current = { ...initialRef.current, country: c || '', timezone: t || '' }
      }
    })()
    return () => { mounted = false }
  }, [])

  // Wallet & Investment moved to Portfolio page

  // Persist only General Profile fields (no socials here)
  function doPersist(normalizedHandle: string) {
    updateUser({
      displayName,
      email,
      handle: normalizedHandle,
      avatarUrl: avatarUrl ?? undefined,
      bio,
      isPublic,
    })
    ;(async () => {
      try {
        let uid = authUserId
        if (!uid) {
          const { data } = await supabase.auth.getUser()
          uid = data.user?.id ?? null
          if (uid) setAuthUserId(uid)
        }
        if (!uid) return
        let walletAddress: string | null = null
        try {
          const addr = localStorage.getItem("wallet_address")
          walletAddress = addr || null
        } catch {}
        const { error: upsertErr } = await supabase
          .from("profiles")
          .upsert({
            id: uid,
            handle: normalizedHandle,
            display_name: displayName || null,
            avatar_url: avatarUrl ?? null,
            is_public: Boolean(isPublic),
            wallet_address: walletAddress ?? undefined,
            bio: bio || null,
            country: country || null,
            timezone: timezone || null,
          })
        if (upsertErr) {
          console.error("profiles upsert error", upsertErr)
          toast.error("Failed to save profile. Please try again.")
          return
        }
      } catch {}
    })()
    toast.success("Account details updated")
    initialRef.current = {
      displayName: displayName || "",
      handle: normalizedHandle || "",
      bio: bio || "",
      country: country || "",
      timezone: timezone || "",
    }
  }

  function saveAccountDetails() {
    const normalized = (handle || "").replace(/^@+/, "").toLowerCase()
    const prev = (initialRef.current.handle || "").trim().toLowerCase()
    // If previously set, block any changes
    if (prev) {
      if (normalized !== prev) {
        toast.error("Handle is permanent and cannot be changed once set.")
        setHandle(initialRef.current.handle)
        return
      }
      doPersist(prev)
      return
    }
    // First-time set
    if (!normalized) {
      doPersist("")
      return
    }
    // Validate pattern before confirmation
    if (!/^[a-z0-9]{3,20}$/.test(normalized)) {
      toast.error("Handle must be 3–20 lowercase letters or numbers")
      return
    }
    pendingHandleRef.current = normalized
    setShowHandleConfirm(true)
  }

  return (
    <div className="container/main flex flex-1 flex-col gap-2 p-0">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6 grid gap-6">
          <section className="grid gap-4">
            <div>
              <h3 className="text-base md:text-lg font-semibold">Account Settings</h3>
              <p className="text-muted-foreground text-sm">Manage your profile, security, notifications, and more.</p>
            </div>
          </section>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <Card className="bg-transparent border-0 shadow-none">
                <CardContent className="grid gap-6 pt-6 w-full">
                  <FormRow label="Profile Photo" description={<span className="text-xs text-muted-foreground">PNG, JPG, GIF. Max 800x400px.</span>}>
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        <Avatar className="h-20 w-20 rounded-xl">
                          <AvatarImage src={avatarUrl || undefined} alt={displayName || "User"} />
                          <AvatarFallback className="rounded-xl text-lg">🎲</AvatarFallback>
                        </Avatar>
                        <button
                          type="button"
                          onClick={onRemoveAvatar}
                          className={cn(
                            "absolute -top-2 -right-2 inline-flex items-center justify-center rounded-full border bg-background p-1.5 shadow-sm hover:bg-accent",
                            !avatarUrl && "invisible pointer-events-none"
                          )}
                          aria-label="Remove avatar"
                        >
                          <IconX className="size-3.5" />
                        </button>
                      </div>
                      <div
                        onClick={onChooseAvatar}
                        onDragOver={(e) => { e.preventDefault() }}
                        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) uploadAvatarFile(f) }}
                        className={cn("flex-1 cursor-pointer rounded-xl border-2 border-dashed border-border p-6 text-center hover:bg-accent/30", uploadingAvatar && "pointer-events-none opacity-70")}
                        role="button"
                        aria-label="Upload avatar"
                        aria-busy={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                            <IconUpload className="h-6 w-6 animate-pulse" />
                            <div className="text-muted-foreground">Uploading…</div>
                          </div>
                        ) : (
                          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                            <IconUpload className="h-6 w-6" />
                            <div>
                              <span className="font-medium text-primary">Click to upload</span>
                              <span className="text-muted-foreground"> or drag and drop</span>
                            </div>
                            <div className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (max. 800×400px)</div>
                          </div>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarSelected} />
                    </div>
                  </FormRow>
                  <Separator />
                  <FormRow label="Display Name" labelFor="displayName" description={<span className="text-xs text-muted-foreground">Shown on your public investor profile.</span>}>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </FormRow>
                  <Separator />
                  <FormRow
                    label="Email"
                    labelFor="email"
                    description={<span className="text-xs text-muted-foreground">Managed by authentication. You cannot change this email here.</span>}
                    inlineLabelExtra={
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconLock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          </TooltipTrigger>
                          <TooltipContent>Managed by authentication</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    }
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <IconMail className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <Input id="email" type="email" value={email} disabled aria-readonly="true" className="pl-8 pr-10" />
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={cn(
                                "pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full",
                                emailVerified ? "text-emerald-400" : "text-amber-400"
                              )}
                              aria-label={emailVerified ? "Email verified" : "Email unverified"}
                              role="img"
                            >
                              {emailVerified ? <IconCircleCheck className="h-4 w-4" /> : <IconAlertCircle className="h-4 w-4" />}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{emailVerified ? "Verified email" : "Unverified email"}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </FormRow>
                  <Separator />
                  <FormRow
                    label="Handle"
                    labelFor="handle"
                    description={handleLocked ? (
                      <span className="text-xs text-muted-foreground">Your handle is permanent and cannot be changed.</span>
                    ) : (
                      <span className="text-[11px] text-amber-400">For security reasons, your handle can be set only once and will be permanent.</span>
                    )}
                    inlineLabelExtra={handleLocked ? (
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconLock className="h-4 w-4 text-muted-foreground" aria-label="Handle locked" />
                          </TooltipTrigger>
                          <TooltipContent>Handle is permanent</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  >
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <Input
                        id="handle"
                        className="pl-6"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        disabled={handleLocked}
                        placeholder="username"
                      />
                    </div>
                    {handleHelper.text && handle !== initialRef.current.handle ? (
                      <span className={`text-xs ${handleHelper.className}`}>{handleHelper.text}</span>
                    ) : null}
                  </FormRow>
                  <Separator />
                  <FormRow label="Country" labelFor="country">
                    <CountrySelect value={country} onChange={setCountry} />
                  </FormRow>
                  <Separator />
                  <FormRow label="Timezone" labelFor="timezone">
                    <TimezoneSelect value={timezone} onChange={setTimezone} />
                  </FormRow>
                  <Separator />
                  <FormRow label="Short Bio" labelFor="bio" description={<span className="text-xs text-muted-foreground">Keep it concise. This appears under your name on the public profile.</span>}>
                    <Textarea id="bio" maxLength={160} rows={3} placeholder="A sentence about you (shown on your public profile)" value={bio} onChange={(e) => setBio(e.target.value)} />
                    <span className="text-[10px] text-muted-foreground">{bio.length}/160</span>
                  </FormRow>
                  <div className="flex justify-end">
                    <Button variant="default" onClick={saveAccountDetails} disabled={!canSave}>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="mt-4">
              <Card className="bg-transparent border-0 shadow-none">
                <CardContent className="grid gap-6 pt-6 w-full">
                  <FormRow label="Discord ID" labelFor="discord">
                    <Input id="discord" placeholder="username#1234 or @name" value={discord} onChange={(e) => setDiscord(e.target.value)} />
                  </FormRow>
                  <Separator />
                  <FormRow label="X Handle" labelFor="twitter">
                    <Input id="twitter" placeholder="@handle" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
                  </FormRow>
                  <Separator />
                  <FormRow label="Telegram" labelFor="telegram">
                    <Input id="telegram" placeholder="@username" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end">
                    <Button variant="default" onClick={saveSocials} disabled={!socialsDirty}>Save Social Links</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <Card className="bg-transparent border-0 shadow-none">
                <CardContent className="grid gap-6 pt-6 w-full">
                  <FormRow label="Two-Factor Authentication (2FA)" description={<span className="text-sm text-muted-foreground">Status: {twoFAEnabled ? "Enabled" : "Disabled"}</span>}>
                    <div className="ml-auto w-fit">
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Toggle
                              size="sm"
                              className="w-16 justify-center"
                              aria-label="Toggle 2FA"
                              pressed={twoFAEnabled}
                              onPressedChange={(v) => {
                                if (v) {
                                  setShow2FASetup(true)
                                  return
                                }
                                setTwoFAEnabled(false)
                                toast.success("2FA disabled")
                              }}
                            >
                              {twoFAEnabled ? "ON" : "OFF"}
                            </Toggle>
                          </TooltipTrigger>
                          <TooltipContent><p>Add a second step to secure your account.</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </FormRow>
                  <Separator />
                  <section className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Logged-in Devices</h4>
                        <p className="text-xs text-muted-foreground">Monitor active sessions and revoke access if needed.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const { data } = await supabase.auth.getUser()
                              setLastSignInAt(data.user?.last_sign_in_at ?? null)
                              toast.success('Refreshed')
                            } catch {}
                          }}
                        >
                          Refresh
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              // Attempt global sign-out to revoke tokens across devices; fallback to normal signOut
                              type SignOutWithScope = (opts?: { scope?: 'global' | 'local' }) => Promise<{ error?: unknown } | void>
                              const signOut = supabase.auth.signOut as unknown as SignOutWithScope
                              const result = await signOut({ scope: 'global' })
                              if (result && typeof result === 'object' && 'error' in result && (result as { error?: unknown }).error) {
                                await supabase.auth.signOut()
                              }
                              toast.success('All sessions revoked')
                              router.push('/auth')
                              router.refresh()
                            } catch {
                              toast.error('Failed to revoke sessions')
                            }
                          }}
                        >
                          Sign out all sessions
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{deviceLabel}</div>
                          <div className="text-xs text-muted-foreground">This device • Last sign-in: {lastSignInAt ? new Date(lastSignInAt).toLocaleString() : '—'}</div>
                        </div>
                        <Button size="sm" variant="secondary" onClick={async () => { await supabase.auth.signOut(); router.push('/auth'); router.refresh() }}>Sign out this device</Button>
                      </div>
                    </div>
                  </section>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        try { await supabase.auth.signOut() } catch {}
                        try { if (typeof window !== "undefined") localStorage.removeItem("user_profile") } catch {}
                        toast.success("Logged out")
                        router.push("/auth")
                        router.refresh()
                      }}
                    >
                      Log Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
      {/* 2FA setup modal */}
      <AlertDialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set up Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              Scan a QR code in your authenticator app and enter the 6-digit code to complete setup. (MVP placeholder)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setTwoFAEnabled(true)
                setShow2FASetup(false)
                toast.success("2FA enabled")
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* One-time Handle Confirmation */}
      <AlertDialog open={showHandleConfirm} onOpenChange={setShowHandleConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set your handle permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Your handle <span className="font-medium">@{pendingHandleRef.current}</span> will be permanent and cannot be changed later for security reasons.
              Make sure it is correct.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const chosen = pendingHandleRef.current || ""
                if (!chosen) {
                  setShowHandleConfirm(false)
                  return
                }
                doPersist(chosen)
                // Lock local state and baseline
                setHandle(chosen)
                initialRef.current = { ...initialRef.current, handle: chosen }
                setShowHandleConfirm(false)
                toast.success(`Handle set to @${chosen}`)
              }}
            >
              Confirm & Set Handle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

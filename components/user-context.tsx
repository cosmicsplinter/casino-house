"use client"

import * as React from "react"
import { supabase } from "@/lib/supabase-client"

export type UserProfile = {
  name: string
  email: string
  handle?: string
  displayName?: string
  avatarUrl?: string | null
  bio?: string
  // Whether the investor's profile is publicly visible at /investor/@handle
  isPublic?: boolean
  socials?: {
    twitter?: string
    discord?: string
    telegram?: string
  }
}

const defaultUser: UserProfile = {
  name: "",
  email: "",
  handle: "",
  displayName: "",
  avatarUrl: null,
  bio: "",
  isPublic: false,
  socials: { twitter: "", discord: "", telegram: "" },
}

export type UserContextValue = {
  user: UserProfile
  authed: boolean
  updateUser: (patch: Partial<UserProfile>) => void
}

const UserContext = React.createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Important: initialize with SSR-stable default; hydrate from localStorage in an effect
  const [user, setUser] = React.useState<UserProfile>(defaultUser)

  const [authed, setAuthed] = React.useState(false)

  // Client-only hydration from localStorage to avoid SSR mismatches
  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return
      const raw = localStorage.getItem("user_profile")
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<UserProfile>
      setUser((prev) => ({
        ...prev,
        ...parsed,
        // Replace socials entirely if provided in storage to avoid resurrecting deleted keys
        socials: Object.prototype.hasOwnProperty.call(parsed, 'socials')
          ? (parsed.socials || {})
          : (prev.socials || {}),
      }))
    } catch {
      // ignore
    }
  }, [])

  // Supabase session hydration and auth listener
  React.useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const s = data.session
      setAuthed(Boolean(s))
      if (s?.user) {
        setUser((prev) => ({
          ...prev,
          email: s.user.email || prev.email,
          name: prev.name || (s.user.user_metadata?.name as string | undefined) || prev.name,
        }))
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session))
      if (!session) return
      const u = session.user
      setUser((prev) => ({
        ...prev,
        email: u.email || prev.email,
        name: prev.name || (u.user_metadata?.name as string | undefined) || prev.name,
      }))
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const updateUser = React.useCallback((patch: Partial<UserProfile>) => {
    setUser((prev) => {
      const hasSocials = Object.prototype.hasOwnProperty.call(patch, 'socials')
      const next: UserProfile = {
        ...prev,
        ...patch,
        // Replace socials wholesale when provided, so removed keys stay removed
        socials: hasSocials ? (patch.socials || {}) : (prev.socials || {}),
      }
      try {
        if (typeof window !== "undefined") localStorage.setItem("user_profile", JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return next
    })
  }, [])

  // Also persist whenever user changes (fallback persistence)
  React.useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("user_profile", JSON.stringify(user))
    } catch {
      // ignore
    }
  }, [user])

  const value = React.useMemo(() => ({ user, authed, updateUser }), [user, authed, updateUser])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = React.useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used within a UserProvider")
  return ctx
}

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

function shouldRemember(): boolean {
  try {
    if (typeof window === "undefined") return false
    const url = new URL(window.location.href)
    const rememberParam = url.searchParams.get("remember")
    const remembered = rememberParam ?? window.localStorage.getItem("remember_me")
    return remembered === null || remembered === "1" || remembered === "true"
  } catch {
    return true
  }
}

const dynamicStorage = typeof window === "undefined"
  ? undefined
  : {
      getItem(key: string) {
        try {
          const storage = shouldRemember() ? window.localStorage : window.sessionStorage
          return storage.getItem(key)
        } catch {
          return null
        }
      },
      setItem(key: string, value: string) {
        try {
          const storage = shouldRemember() ? window.localStorage : window.sessionStorage
          storage.setItem(key, value)
        } catch {
          // ignore
        }
      },
      removeItem(key: string) {
        try {
          const storage = shouldRemember() ? window.localStorage : window.sessionStorage
          storage.removeItem(key)
        } catch {
          // ignore
        }
      },
    }

export const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: dynamicStorage as unknown as Storage,
  },
})

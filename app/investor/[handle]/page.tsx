import { supabase } from "@/lib/supabase-client"
import { InvestorPublicCard } from "@/components/investor-public-card"
import RippleGridBG from "@/components/ripple-grid"
import { Button } from "@/components/ui/button"

// Always render dynamically so public profile reflects latest data
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "default-no-store"

type ProfileRow = {
  handle: string | null
  display_name?: string | null
  avatar_url?: string | null
  is_public?: boolean | null
  tier?: string | null
  wallet_address?: string | null
  shares_owned?: number | null
  dividends_total?: number | null
  socials?: Record<string, string> | null
  bio?: string | null
}

async function getProfile(normalizedHandle: string) {
  // Try exact case-insensitive match without '@'
  const first = await supabase
    .from("profiles")
    .select("*")
    .ilike("handle", normalizedHandle)
    .maybeSingle<ProfileRow>()
  let row = first.data
  if (!row) {
    // Try same with leading '@' to tolerate stored values like '@mamuka'
    const second = await supabase
      .from("profiles")
      .select("*")
      .ilike("handle", "@" + normalizedHandle)
      .maybeSingle<ProfileRow>()
    row = second.data ?? null
    if (!row) return null
  }
  return {
    handle: (row.handle ?? normalizedHandle)!.replace(/^@+/, ""),
    displayName: row.display_name ?? "",
    avatarUrl: row.avatar_url ?? null,
    isPublic: Boolean(row.is_public ?? false),
    tier: row.tier ?? "",
    wallet: row.wallet_address ?? null,
    shares: typeof row.shares_owned === "number" ? row.shares_owned : undefined,
    dividends: typeof row.dividends_total === "number" ? row.dividends_total : undefined,
    socials: row.socials ?? null,
    bio: typeof row.bio === "string" ? row.bio.trim() : row.bio ?? null,
  }
}

type PublicProfile = {
  handle: string
  displayName: string
  avatarUrl: string | null
  isPublic: boolean
  tier: string
  wallet: string | null
  shares?: number
  dividends?: number
  socials: Record<string, string> | null
  bio?: string | null
}

export default async function InvestorPublicPage({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { handle: handleParam } = await params
  const sp = ((await (searchParams ?? Promise.resolve({}))) || {}) as Record<string, string | string[] | undefined>
  const debug = sp.debug === "1"
  const raw = handleParam || ""
  // Decode in case '@' is URL-encoded as '%40'
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {}
  const normalized = decoded.replace(/^@+/, "").toLowerCase()

  const profile = await getProfile(normalized)
  // Pass through whatever we find; the client card will decide how to render
  const effective: PublicProfile | null = (profile as PublicProfile | null)
  if (debug) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-background">
        <RippleGridBG className="opacity-60" color="#22d3ee" />
        <div className="mx-auto w-full max-w-2xl px-4 py-6">
          <pre className="mb-4 rounded-md border bg-muted/30 p-4 text-sm">
{JSON.stringify({
  handleParam: raw,
  normalized,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^(https?:\/\/)(.{3}).+?(\..+)$/, "$1$2***$3") ?? null,
  query: { table: "profiles", filter: { handle: normalized } },
  found: Boolean(profile),
  isPublic: profile?.isPublic ?? null,
  profile: profile ? { handle: profile.handle, displayName: profile.displayName, bio: profile.bio, avatarUrl: profile.avatarUrl } : null,
}, null, 2)}
          </pre>
          <InvestorPublicCard profile={effective} />
          {/* CTA Banner */}
          <div className="mt-6">
            <div className="rounded-2xl border border-white/10 bg-background/20 p-6 text-center shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/20">
              <h3 className="text-xl font-semibold">Become a Stakeholder, Not a Spectator</h3>
              <p className="mt-2 text-sm text-muted-foreground">Join a community that is reshaping the future of gaming. Our trustless, on-chain model gives you a permanent share in the profits. Start building a portfolio with real-world, decentralized assets.</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button className="min-w-40">Become an Investor</Button>
                <Button variant="outline" className="min-w-32">Learn More</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <RippleGridBG className="opacity-60" color="#22d3ee" />
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-4 py-10">
        <InvestorPublicCard profile={effective} />
        {/* CTA Banner */}
        <div className="w-full">
          <div className="rounded-2xl border border-white/10 bg-background/20 p-6 text-center shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/20">
            <h3 className="text-xl font-semibold">Become a Stakeholder, Not a Spectator</h3>
            <p className="mt-2 text-sm text-muted-foreground">Join a community that is reshaping the future of gaming. Our trustless, on-chain model gives you a permanent share in the profits. Start building a portfolio with real-world, decentralized assets.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button className="min-w-40">Become an Investor</Button>
              <Button variant="outline" className="min-w-32">Learn More</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

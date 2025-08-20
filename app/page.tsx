"use client"

import Link from "next/link"
import Image from "next/image"
import { HouseIncLogoAnimated } from "@/components/house-inc-logo"
import { Button } from "@/components/ui/button"
// Removed AuroraBg to keep landing clean
import { useUser } from "@/components/user-context"
import { ExclusiveMembershipCarousel } from "@/components/exclusive-membership-carousel"
import { LandingNavigation } from "@/components/landing-navigation"

export default function Home() {
  const { authed } = useUser()
  return (
    <div className="min-h-screen flex flex-col relative bg-black">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-medium text-white">
              <HouseIncLogoAnimated width={120} height={24} className="block" />
            </Link>
            <div className="hidden md:block relative">
              <LandingNavigation />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authed ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 px-4">
        <div className="container mx-auto">
          <section className="grid items-center gap-8 py-16 md:grid-cols-2 md:gap-12 md:py-24">
            {/* Left: Serif heading + subtext + buttons */}
            <div className="flex flex-col gap-6 order-2 md:order-1">
              <h1 className="font-serif text-4xl leading-tight md:text-6xl md:leading-[1.1]">
                AI for casino operators
              </h1>
              <p className="text-muted-foreground max-w-prose">
                The fastest way to build, track, and optimize casino strategies with real-time insights.
                Deliver investor-grade analytics and player intelligence at scale.
              </p>
              <div className="flex items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/auth">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/dashboard">Documentation</Link>
                </Button>
              </div>
            </div>

            {/* Right: Hero image */}
            <div className="order-1 mx-auto w-full max-w-md md:order-2 md:max-w-xl">
              <Image
                src="/hero-image.png"
                alt="Casino AI hero"
                width={1200}
                height={900}
                priority
                className="w-full h-auto"
              />
            </div>
          </section>
          {/* Exclusive Membership Structure (pricing-like carousel) */}
          <ExclusiveMembershipCarousel className="pt-4" />
        </div>
      </main>
    </div>
  )
}

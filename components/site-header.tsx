"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function SiteHeader() {
  const pathname = usePathname()
  

  const segments = React.useMemo(() => {
    // e.g. /dashboard/chip/performance -> ["dashboard","chip","performance"]
    return pathname.split("/").filter(Boolean)
  }, [pathname])

  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    chip: "$CHIP Token",
    investors: "Investors",
    "investors-vault": "Investors Vault",
    "private-lounge": "Private Lounge",
    marketplace: "Marketplace",
    rewards: "Rewards",
    referrals: "Referrals",
    daily: "Daily Rewards",
    pitboss: "PitBoss AI",
  }

  function toLabel(slug: string) {
    return labelMap[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
  }

  function segHref(index: number) {
    return "/" + segments.slice(0, index + 1).join("/")
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {segments.slice(1).map((seg, i, arr) => {
              const isLast = i === arr.length - 1
              const href = segHref(i + 1)
              const label = toLabel(seg)
              return (
                <React.Fragment key={href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href}>{label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto" />
      </div>
    </header>
  )
}

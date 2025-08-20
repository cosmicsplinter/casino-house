"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconCamera,
  IconHome,
  IconFileAi,
  IconFileDescription,
  IconRobot,
  IconLock,
  IconCoin,
  IconGift,
  IconPresentation,
  IconScale,
  IconBook,
  IconBriefcase,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useUser } from "@/components/user-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    // Share Offering (default landing of /dashboard via redirect)
    {
      title: "Share Offering",
      url: "/dashboard/share-offering",
      icon: IconPresentation,
    },
    // The House (Dashboard) with submenus
    {
      title: "The House",
      url: "/dashboard",
      icon: IconHome,
      items: [
        { title: "Key Metrics", url: "/dashboard/overview" },
        { title: "Vault", url: "/dashboard/vault" },
        { title: "The Floor (Governance)", url: "/dashboard/the-floor" },
      ],
    },
    // My Portfolio
    {
      title: "My Portfolio",
      url: "/dashboard/portfolio",
      icon: IconBriefcase,
    },
    // $CHIP Token with 3 submenus
    {
      title: "$CHIP Token",
      url: "/dashboard/chip",
      icon: IconCoin,
      items: [
        { title: "Performance", url: "/dashboard/chip/performance" },
        { title: "Tokenomics & Utility", url: "/dashboard/chip/tokenomics" },
        { title: "Buy $CHIP", url: "/dashboard/chip/buy" },
      ],
    },
    // Rewards (moved to primary, below $CHIP Token)
    {
      title: "Rewards",
      url: "/dashboard/rewards",
      icon: IconGift,
      items: [
        { title: "Referrals", url: "/dashboard/rewards/referrals" },
        { title: "Daily Rewards", url: "/dashboard/rewards/daily" },
      ],
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "House Guide",
      url: "/docs-legal#house-guide",
      icon: IconBook,
      external: true,
    },
    {
      title: "Table Blueprint",
      url: "/table-blueprint",
      icon: IconPresentation,
      external: true,
    },
    {
      title: "Docs & Legal",
      url: "/docs-legal",
      icon: IconScale,
      external: true,
    },
  ],
  documents: [
    {
      name: "Private Lounge",
      url: "/dashboard/private-lounge",
      icon: IconLock,
    },
    {
      name: "Pit Boss AI",
      url: "/dashboard/pitboss",
      icon: IconRobot,
      badge: "BETA",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-emerald-500 text-white flex aspect-square size-8 items-center justify-center rounded-md">
                  <Image
                    src="/house-inc-logo-square-dark.svg"
                    alt="House Inc. logo"
                    width={20}
                    height={20}
                    className="h-5 w-auto"
                    priority
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">house.inc</span>
                  <span className="text-xs text-muted-foreground">The House Always Wins</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user.displayName || user.name, email: user.email, avatar: user.avatarUrl || undefined }} />
      </SidebarFooter>
    </Sidebar>
  )
}

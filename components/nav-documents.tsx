"use client"

import * as React from "react"
import { type Icon, IconChevronDown } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function NavDocuments({
  items,
}: {
  items: {
    name: string
    url: string
    icon: Icon
    badge?: string
    disabled?: boolean
    items?: { title: string; url: string }[]
  }[]
}) {
  const pathname = usePathname()
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    const initial: Record<string, boolean> = {}
    for (const item of items) {
      if (item.items?.length) {
        const anyActive = item.items.some((s) => pathname.startsWith(s.url)) || pathname.startsWith(item.url)
        if (anyActive) initial[item.name] = true
      }
    }
    setOpenMap((prev) => ({ ...prev, ...initial }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggle = (name: string) => setOpenMap((m) => ({ ...m, [name]: !m[name] }))
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Community & Support</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = !!item.items?.length
          const isActiveTop = !item.disabled && (pathname === item.url || pathname.startsWith(item.url + "/") || (hasChildren && item.items!.some((s) => pathname === s.url)))
          return (
            <SidebarMenuItem key={item.name}>
              {!hasChildren ? (
                <SidebarMenuButton
                  asChild
                  isActive={isActiveTop}
                >
                  <a
                    href={item.disabled ? "#" : item.url}
                    className={`flex items-center gap-2 ${item.disabled ? "pointer-events-auto cursor-not-allowed opacity-70" : ""}`}
                    aria-disabled={item.disabled ? true : undefined}
                    onClick={(e) => {
                      if (item.disabled) {
                        e.preventDefault()
                        e.stopPropagation()
                      }
                    }}
                  >
                    <item.icon />
                    <span>{item.name}</span>
                    {item.badge ? (
                      <Badge
                        variant="secondary"
                        className={
                          "ml-auto h-5 px-1.5 font-mono text-[10px] uppercase tracking-wide border " +
                          (item.badge === "NEW"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                            : item.badge === "BETA"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                            : item.badge === "SOON"
                            ? "bg-sky-500/15 text-sky-300 border-sky-500/20"
                            : "")
                        }
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </a>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  isActive={isActiveTop}
                  onClick={() => toggle(item.name)}
                  data-state={openMap[item.name] ? "open" : "closed"}
                >
                  <item.icon />
                  <span>{item.name}</span>
                  <IconChevronDown className={`ml-auto transition-transform ${openMap[item.name] ? "rotate-180" : "rotate-0"}`} />
                </SidebarMenuButton>
              )}
              {item.items && item.items.length > 0 && openMap[item.name] && (
                <SidebarMenuSub>
                  {item.items.map((sub) => (
                    <SidebarMenuSubItem key={sub.title}>
                      <SidebarMenuSubButton href={sub.url} isActive={pathname === sub.url}>
                        <span>{sub.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

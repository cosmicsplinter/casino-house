"use client"

import * as React from "react"
import { type Icon, IconChevronDown } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    items?: { title: string; url: string }[]
  }[]
}) {
  const pathname = usePathname()
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    // Open a group if any of its subroutes is active or direct match
    const initial: Record<string, boolean> = {}
    for (const item of items) {
      if (item.items?.length) {
        const anyActive = item.items.some((s) => pathname.startsWith(s.url)) || pathname === item.url
        if (anyActive) initial[item.title] = true
      }
    }
    setOpenMap((prev) => ({ ...prev, ...initial }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggle = (title: string) =>
    setOpenMap((m) => ({ ...m, [title]: !m[title] }))

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Ecosystem</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const hasChildren = !!item.items?.length
            const isActiveTop = pathname === item.url || (hasChildren && item.items!.some((s) => pathname.startsWith(s.url)))
            return (
            <SidebarMenuItem key={item.title}>
              {!hasChildren ? (
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActiveTop}
                >
                  <a href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => toggle(item.title)}
                  data-state={openMap[item.title] ? "open" : "closed"}
                  isActive={isActiveTop}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <IconChevronDown
                    className={`ml-auto transition-transform ${openMap[item.title] ? "rotate-180" : "rotate-0"}`}
                  />
                </SidebarMenuButton>
              )}
              {item.items && item.items.length > 0 && openMap[item.title] && (
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
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

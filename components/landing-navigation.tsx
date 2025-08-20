"use client"

import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"

export function LandingNavigation() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* The House (dropdown) */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>The House</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid min-w-[240px] gap-1 p-2">
              <NavigationMenuLink asChild>
                <Link href="/#about" className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                  About
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link href="/#philosophy" className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                  Philosophy
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link href="/#careers" className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                  Careers
                </Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link href="/#media-kit" className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                  Media Kit
                </Link>
              </NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Ecosystem (single link) */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/#ecosystem" className="group inline-flex h-9 items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              Ecosystem
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Docs & Legal removed per request */}

        {/* Community (single link) */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/#community" className="group inline-flex h-9 items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              Community
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Blog (single link) */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/#blog" className="group inline-flex h-9 items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
              Blog
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

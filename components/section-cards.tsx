"use client"

import * as React from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SectionCards() {
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => setLoading(false), [])

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          {loading ? (
            <Skeleton className="h-7 w-32 rounded" />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              $1,250.00
            </CardTitle>
          )}
          {!loading && (
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +12.5%
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {loading ? (
            <>
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="mt-2 h-3 w-52 rounded" />
            </>
          ) : (
            <>
              <div className="line-clamp-1 flex gap-2 font-medium">
                Trending up this month <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">Visitors for the last 6 months</div>
            </>
          )}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          {loading ? (
            <Skeleton className="h-7 w-24 rounded" />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">1,234</CardTitle>
          )}
          {!loading && (
            <CardAction>
              <Badge variant="outline">
                <IconTrendingDown />
                -20%
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {loading ? (
            <>
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="mt-2 h-3 w-56 rounded" />
            </>
          ) : (
            <>
              <div className="line-clamp-1 flex gap-2 font-medium">
                Down 20% this period <IconTrendingDown className="size-4" />
              </div>
              <div className="text-muted-foreground">Acquisition needs attention</div>
            </>
          )}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          {loading ? (
            <Skeleton className="h-7 w-28 rounded" />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">45,678</CardTitle>
          )}
          {!loading && (
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +12.5%
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {loading ? (
            <>
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="mt-2 h-3 w-40 rounded" />
            </>
          ) : (
            <>
              <div className="line-clamp-1 flex gap-2 font-medium">
                Strong user retention <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">Engagement exceed targets</div>
            </>
          )}
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          {loading ? (
            <Skeleton className="h-7 w-16 rounded" />
          ) : (
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">4.5%</CardTitle>
          )}
          {!loading && (
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                +4.5%
              </Badge>
            </CardAction>
          )}
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {loading ? (
            <>
              <Skeleton className="h-4 w-60 rounded" />
              <Skeleton className="mt-2 h-3 w-44 rounded" />
            </>
          ) : (
            <>
              <div className="line-clamp-1 flex gap-2 font-medium">
                Steady performance increase <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">Meets growth projections</div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

import * as React from "react"
import { cn } from "@/lib/utils"

export type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement>

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative overflow-y-auto", className)}
      {...props}
    />
  )
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }

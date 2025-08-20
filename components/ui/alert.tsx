import * as React from "react"
import { cn } from "@/lib/utils"

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "info" | "success" | "destructive"
}

const variantClasses: Record<NonNullable<AlertProps["variant"]>, string> = {
  info: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  destructive: "border-red-500/30 bg-red-500/10 text-red-200",
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "w-full rounded-md border p-4",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  )
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm leading-relaxed", className)} {...props} />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

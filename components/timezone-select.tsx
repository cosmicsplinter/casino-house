"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

type IntlWithSupported = typeof Intl & { supportedValuesOf?: (key: string) => string[] }

function getAllTimezones(): string[] {
  // Prefer IANA from Intl API if available
  const intl = Intl as IntlWithSupported
  if (typeof intl.supportedValuesOf === 'function') {
    try {
      const vals = intl.supportedValuesOf("timeZone")
      if (Array.isArray(vals) && vals.length) return vals
    } catch {}
  }
  // Fallback minimal curated list (kept short to avoid bundle bloat); if you want fully exhaustive fallback, we can import a JSON.
  return [
    "UTC",
    "Etc/GMT+12","Pacific/Honolulu","America/Anchorage","America/Los_Angeles","America/Denver","America/Chicago","America/New_York",
    "America/Sao_Paulo","Atlantic/Azores","Europe/London","Europe/Berlin","Europe/Paris","Europe/Madrid","Europe/Rome","Europe/Warsaw",
    "Europe/Moscow","Asia/Dubai","Asia/Tbilisi","Asia/Tehran","Asia/Karachi","Asia/Calcutta","Asia/Bangkok","Asia/Shanghai","Asia/Tokyo",
    "Australia/Sydney","Pacific/Auckland"
  ]
}

function formatTZLabel(tz: string) {
  try {
    const formatter = new Intl.DateTimeFormat(undefined, { timeZone: tz, timeZoneName: "short" })
    const parts = formatter.formatToParts(new Date())
    const tn = parts.find(p => p.type === "timeZoneName")?.value || ""
    return `${tz} (${tn})`
  } catch {
    return tz
  }
}

export type TimezoneSelectProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function TimezoneSelect({ value, onChange, placeholder = "Select timezone", className }: TimezoneSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const all = React.useMemo(() => getAllTimezones(), [])

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return all
      .filter(tz => !q || tz.toLowerCase().includes(q))
      .map(tz => ({ tz, label: formatTZLabel(tz) }))
  }, [all, query])

  const selected = React.useMemo(() => (value ? { tz: value, label: formatTZLabel(value) } : null), [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className={cn("w-full justify-between", className)}>
          {selected ? selected.label : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
        <div className="flex items-center gap-2 p-1">
          <Input
            placeholder="Search timezone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-64">
          <ul className="divide-y divide-border">
            {items.map(({ tz, label }) => (
              <li key={tz}>
                <button
                  type="button"
                  className={cn("w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground", value === tz && "bg-accent")}
                  onClick={() => { onChange(tz); setOpen(false) }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

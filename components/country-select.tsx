"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// Minimal country codes list (ISO 3166-1 alpha-2). Full list provided.
const COUNTRY_CODES = [
  "AF","AX","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB",
  "BY","BE","BZ","BJ","BM","BT","BO","BQ","BA","BW","BV","BR","IO","BN","BG","BF","BI","CV","KH","CM",
  "CA","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CD","CK","CR","CI","HR","CU","CW","CY","CZ",
  "DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FK","FO","FJ","FI","FR","GF","PF","TF",
  "GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN",
  "HK","HU","IS","IN","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR",
  "KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MG","MW","MY","MV","ML","MT","MH","MQ",
  "MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI",
  "NE","NG","NU","NF","MK","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR",
  "QA","RE","RO","RU","RW","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL",
  "SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SE","CH","SY","TW","TJ","TZ",
  "TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","GB","US","UM","UY","UZ","VU",
  "VE","VN","VG","VI","WF","EH","YE","ZM","ZW"
]

function flagEmojiFromISO(code: string) {
  if (!code || code.length !== 2) return "";
  const base = 127397; // 0x1F1E6 - 'A'
  const chars = code.toUpperCase().split("").map(c => String.fromCodePoint(base + c.charCodeAt(0)));
  return chars.join("")
}

type DisplayNamesCtor = new (
  locales: string | string[],
  options: { type: 'region' }
) => { of(code: string): string | undefined }

function getCountryName(code: string) {
  try {
    const DN = (Intl as unknown as { DisplayNames?: DisplayNamesCtor }).DisplayNames
    if (DN) {
      const display = new DN(["en"], { type: "region" })
      return display.of(code) || code
    }
    return code
  } catch {
    return code
  }
}

export type CountrySelectProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CountrySelect({ value, onChange, placeholder = "Select country", className }: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return COUNTRY_CODES.map(code => ({ code, name: getCountryName(code), flag: flagEmojiFromISO(code) }))
      .filter(({ name, code }) => !q || name.toLowerCase().includes(q) || code.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [query])

  const selected = React.useMemo(() => {
    if (!value) return null
    const code = value.toUpperCase()
    return { code, name: getCountryName(code), flag: flagEmojiFromISO(code) }
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className={cn("w-full justify-between", className)}>
          {selected ? (
            <span className="inline-flex items-center gap-2">
              <span className="text-lg leading-none">{selected.flag}</span>
              <span>{selected.name}</span>
              <span className="text-muted-foreground text-xs">({selected.code})</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
        <div className="flex items-center gap-2 p-1">
          <Input
            placeholder="Search country..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-64">
          <ul className="divide-y divide-border">
            {items.map(({ code, name, flag }) => (
              <li key={code}>
                <button
                  type="button"
                  className={cn("w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground flex items-center gap-2", value?.toUpperCase() === code && "bg-accent")}
                  onClick={() => { onChange(code); setOpen(false) }}
                >
                  <span className="text-lg leading-none">{flag}</span>
                  <span className="flex-1">{name}</span>
                  <span className="text-muted-foreground text-xs">{code}</span>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

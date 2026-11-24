import { useState } from "react"
import { Check, Copy, FileText, Hotel, Plane, Route } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Markdown } from "@/components/markdown"
import type { TripPlan } from "@/lib/api"
import { cn } from "@/lib/utils"

type TabId = "plan" | "itinerary" | "flights" | "hotels"

const TABS = [
  { id: "plan", label: "Trip plan", icon: FileText },
  { id: "itinerary", label: "Itinerary", icon: Route },
  { id: "flights", label: "Flights", icon: Plane },
  { id: "hotels", label: "Hotels", icon: Hotel },
] as const

/** Tabbed view of everything the agents produced for one request. */
export function TripResult({ plan }: { plan: TripPlan }) {
  const [tab, setTab] = useState<TabId>("plan")
  const [copied, setCopied] = useState(false)

  async function copyAnswer() {
    await navigator.clipboard.writeText(plan.answer)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b p-2">
        <div role="tablist" className="flex flex-wrap gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              role="tab"
              aria-selected={tab === id}
              variant={tab === id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTab(id)}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={copyAnswer}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy plan"}
        </Button>
      </div>

      <div role="tabpanel" className={cn("p-5", tab === "flights" && "p-3")}>
        {tab === "plan" && <Markdown>{plan.answer}</Markdown>}
        {tab === "itinerary" && <Markdown>{plan.itinerary}</Markdown>}
        {tab === "hotels" && <Markdown>{plan.hotel_results}</Markdown>}
        {tab === "flights" && (
          <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {plan.flight_results}
          </pre>
        )}
      </div>
    </section>
  )
}

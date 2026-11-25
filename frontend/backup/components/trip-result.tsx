import { useState } from "react"
import { Check, Copy, Printer } from "lucide-react"

import { Markdown } from "@/components/markdown"
import { FlightsCard, HotelsCard, WeatherCard } from "@/components/side-cards"
import { Button } from "@/components/ui/button"
import type { TripPlan } from "@/lib/api"
import { cn } from "@/lib/utils"

type TabId = "plan" | "itinerary"

const TABS: { id: TabId; label: string }[] = [
  { id: "plan", label: "Full plan" },
  { id: "itinerary", label: "Day by day" },
]

/** The plan on the left, flights / hotels / weather on the right. */
export function TripResult({ plan }: { plan: TripPlan }) {
  const [tab, setTab] = useState<TabId>("plan")
  const [copied, setCopied] = useState(false)

  const text = tab === "plan" ? plan.answer : plan.itinerary

  async function copyText() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] print:block">
      <section className="min-w-0">
        <div className="mb-3 flex items-end justify-between gap-2 border-b print:hidden">
          <div role="tablist" className="flex gap-5">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  "-mb-px border-b-2 pb-2 text-sm transition-colors",
                  tab === id
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 pb-1.5">
            <Button variant="ghost" size="sm" onClick={copyText}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.print()}>
              <Printer />
              Print
            </Button>
          </div>
        </div>

        <article className="rounded-lg border bg-card p-5 sm:p-7">
          {text.trim() ? (
            <Markdown>{text}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to show here.</p>
          )}
        </article>
      </section>

      <aside className="space-y-4 print:mt-6">
        <WeatherCard text={plan.weather_results} />
        <FlightsCard text={plan.flight_results} />
        <HotelsCard text={plan.hotel_results} />
      </aside>
    </div>
  )
}

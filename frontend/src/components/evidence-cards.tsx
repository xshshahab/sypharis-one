import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { ArrowRight, BedDouble, Check, CloudSun, Compass, ExternalLink, Plane, Wallet } from "lucide-react"

import { Markdown } from "@/components/markdown"
import type { TripPlan } from "@/lib/api"
import {
  agentLabel,
  formatForecastTime,
  isUnavailableNote,
  parseFlights,
  parseHotels,
  parseWeather,
} from "@/lib/parse"
import { cn } from "@/lib/utils"

function Card({
  id,
  icon,
  title,
  note,
  badge,
  children,
  className,
}: {
  id?: string
  icon: ReactNode
  title: string
  note?: string
  badge?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn("surface scroll-mt-24 p-5 sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight sm:text-base">
            <span aria-hidden className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
            <span>{title}</span>
          </h3>
          {note && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>}
        </div>
        {badge && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** Long content is cut at a comfortable height with a subtle fade and "Show more" toggle. */
function Expandable({ children, collapsedHeight = 320 }: { children: ReactNode; collapsedHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const check = () => setOverflowing(element.scrollHeight > collapsedHeight + 24)
    check()

    const observer = new ResizeObserver(check)
    observer.observe(element)
    return () => observer.disconnect()
  }, [collapsedHeight, children])

  return (
    <div>
      <div className="relative">
        <div
          ref={ref}
          className="overflow-hidden"
          style={open || !overflowing ? undefined : { maxHeight: collapsedHeight }}
        >
          {children}
        </div>
        {overflowing && !open && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-card via-card/80 to-transparent"
          />
        )}
      </div>
      {overflowing && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="mt-3 inline-flex items-center rounded-full border border-border bg-muted/50 px-3.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          {open ? "Show less" : "Show full details"}
        </button>
      )}
    </div>
  )
}

function Unavailable({ what }: { what: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      {what} isn&apos;t available right now. The plan uses general guidance instead.
    </p>
  )
}

// ------------------------------------------------------------ how we read the request

export function UnderstoodCard({ plan }: { plan: TripPlan }) {
  const c = plan.trip_constraints

  const rows: [string, string][] = (
    [
      ["Destination", c.destination],
      ["From", c.origin],
      ["Duration", c.duration],
      ["Budget", c.budget],
      ["Style", c.travel_style],
      ["Preferences", c.special_preferences?.join(", ")],
    ] as [string, string | undefined][]
  ).filter((row): row is [string, string] => Boolean(row[1]?.trim()))

  const researched = plan.selected_agents.filter((agent) => agent !== "itinerary_agent")

  return (
    <Card
      icon={<Compass className="size-4" />}
      title="How we read your request"
      note="Check these constraints before you approve. If anything looks off, request changes."
    >
      {rows.length > 0 ? (
        <dl className="divide-y divide-border/60 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-3 py-2 first:pt-0 last:pb-0">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium break-words text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing specific was picked out of your request.</p>
      )}

      {researched.length > 0 && (
        <div className="mt-4 border-t border-border/70 pt-3.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Researched</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {researched.map((agent) => (
              <li
                key={agent}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                <Check className="size-3" aria-hidden />
                {agentLabel(agent)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.supervisor_reasoning.trim() && (
        <details className="group mt-3.5 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-2.5 text-sm">
          <summary className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
            Why these steps?
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plan.supervisor_reasoning}</p>
        </details>
      )}
    </Card>
  )
}

// ------------------------------------------------------------ budget

export function BudgetCard({ text }: { text: string }) {
  if (!text.trim()) return null

  return (
    <Card
      id="budget"
      icon={<Wallet className="size-4" />}
      title="Budget check"
      note="Estimated breakdown from the research agent — not a live booking quote."
      badge="Estimate"
    >
      <Expandable collapsedHeight={420}>
        <Markdown variant="card">{text}</Markdown>
      </Expandable>
    </Card>
  )
}

// ------------------------------------------------------------ weather

export function WeatherCard({ text }: { text: string }) {
  if (!text.trim()) return null

  if (isUnavailableNote(text)) {
    return (
      <Card id="weather" icon={<CloudSun className="size-4" />} title="Weather">
        <Unavailable what="Live weather" />
      </Card>
    )
  }

  const weather = parseWeather(text)

  return (
    <Card
      id="weather"
      icon={<CloudSun className="size-4" />}
      title="Weather"
      note="Live from OpenWeather. Forecast times are UTC."
      badge="Live"
    >
      {weather ? (
        <>
          <div className="flex items-end justify-between gap-4 rounded-xl bg-muted/45 px-4 py-3.5">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{weather.city}</p>
              <p className="mt-0.5 text-4xl leading-none font-light tabular-nums">
                {Math.round(weather.temperature)}°C
              </p>
              <p className="mt-1.5 text-sm font-medium first-letter:uppercase">{weather.condition}</p>
            </div>
            <div className="space-y-1 text-right text-xs text-muted-foreground tabular-nums">
              <p>Feels like {Math.round(weather.feelsLike)}°</p>
              <p>Humidity {weather.humidity}%</p>
              <p>Wind {weather.wind} m/s</p>
            </div>
          </div>

          {weather.forecast.length > 0 && (
            <ul className="mt-3.5 divide-y divide-border/60 text-xs">
              {weather.forecast.map((entry) => (
                <li key={entry.time} className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                  <span className="text-muted-foreground tabular-nums">{formatForecastTime(entry.time)}</span>
                  <span className="truncate text-foreground/90 first-letter:uppercase">{entry.weather}</span>
                  <span className="font-semibold tabular-nums">{Math.round(entry.temperature)}°</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <Expandable collapsedHeight={240}>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{text.trim()}</p>
        </Expandable>
      )}
    </Card>
  )
}

// ------------------------------------------------------------ flights

const FLIGHTS_SHOWN = 4

export function FlightsCard({ text }: { text: string }) {
  const [showAll, setShowAll] = useState(false)

  if (!text.trim()) return null

  if (isUnavailableNote(text)) {
    return (
      <Card id="flights" icon={<Plane className="size-4" />} title="Flights">
        <Unavailable what="Flight information" />
      </Card>
    )
  }

  const live = parseFlights(text)

  return (
    <Card
      id="flights"
      icon={<Plane className="size-4" />}
      title="Flights"
      note={live ? "Live flight status. Ticket prices are not included." : "Route guidance only — verify live fares before booking."}
      badge={live ? "Live status" : "Guidance"}
    >
      {live ? (
        <>
          {live.heading && <p className="mb-3 text-sm font-medium">{live.heading}</p>}
          <ul className="divide-y divide-border/70">
            {(showAll ? live.flights : live.flights.slice(0, FLIGHTS_SHOWN)).map((flight, index) => (
              <li key={`${flight.number}-${index}`} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{flight.number}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground capitalize">
                    {flight.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{flight.airline}</p>
                <p className="mt-1.5 flex items-center gap-2 text-sm tabular-nums">
                  <span className="font-semibold">{flight.from}</span>
                  <span className="text-muted-foreground">{flight.departs}</span>
                  <ArrowRight className="size-3.5 text-primary/70" aria-hidden />
                  <span className="font-semibold">{flight.to}</span>
                  <span className="text-muted-foreground">{flight.arrives}</span>
                </p>
              </li>
            ))}
          </ul>
          {live.flights.length > FLIGHTS_SHOWN && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="mt-3 inline-flex items-center rounded-full border border-border bg-muted/50 px-3.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              {showAll ? "Show fewer" : `Show all ${live.flights.length}`}
            </button>
          )}
        </>
      ) : (
        <Expandable collapsedHeight={300}>
          <Markdown variant="card">{text}</Markdown>
        </Expandable>
      )}
    </Card>
  )
}

// ------------------------------------------------------------ hotels

export function HotelsCard({ text }: { text: string }) {
  if (!text.trim()) return null

  if (isUnavailableNote(text)) {
    return (
      <Card id="hotels" icon={<BedDouble className="size-4" />} title="Hotels">
        <Unavailable what="Live hotel search" />
      </Card>
    )
  }

  const hotels = parseHotels(text)

  return (
    <Card
      id="hotels"
      icon={<BedDouble className="size-4" />}
      title="Hotels"
      note="From live web search. Check rates and cancellation policies on the provider's site."
      badge={hotels ? `${hotels.length} found` : "Guidance"}
    >
      {hotels ? (
        <Expandable collapsedHeight={320}>
          <ul className="divide-y divide-border/70">
            {hotels.map((hotel) => (
              <li key={hotel.url} className="py-3 first:pt-0 last:pb-0">
                <a
                  href={hotel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-2 text-sm font-medium text-foreground hover:text-primary hover:underline"
                >
                  <span>{hotel.title}</span>
                  <ExternalLink
                    className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    aria-label="opens in a new tab"
                  />
                </a>
                <p className="mt-0.5 text-xs font-medium text-primary/80">{hotel.site}</p>
                {hotel.snippet && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{hotel.snippet}</p>
                )}
              </li>
            ))}
          </ul>
        </Expandable>
      ) : (
        <Expandable collapsedHeight={300}>
          <Markdown variant="card">{text}</Markdown>
        </Expandable>
      )}
    </Card>
  )
}

// ------------------------------------------------------------ grouped layouts

/** Spacious research & verification cards rendered below the itinerary in the main column. */
export function ResearchSection({ plan }: { plan: TripPlan }) {
  const hasBudget = Boolean(plan.budget_results.trim())
  const hasFlights = Boolean(plan.flight_results.trim())
  const hasHotels = Boolean(plan.hotel_results.trim())
  const hasWeather = Boolean(plan.weather_results.trim())

  if (!hasBudget && !hasFlights && !hasHotels && !hasWeather) return null

  return (
    <section aria-labelledby="research-heading" className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/70 pb-3">
        <div>
          <h2 id="research-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
            Research &amp; cost breakdown
          </h2>
          <p className="text-sm text-muted-foreground">
            Supporting findings gathered by specialist agents to build this itinerary.
          </p>
        </div>
      </div>

      {hasBudget && <BudgetCard text={plan.budget_results} />}

      {(hasHotels || hasWeather) && (
        <div className={cn("grid items-start gap-5", hasHotels && hasWeather ? "md:grid-cols-2" : "grid-cols-1")}>
          <HotelsCard text={plan.hotel_results} />
          <WeatherCard text={plan.weather_results} />
        </div>
      )}

      {hasFlights && <FlightsCard text={plan.flight_results} />}
    </section>
  )
}

/** Compact context card for the right rail (keeps the rail slim with zero nested scrollbars). */
export function SidebarEvidence({ plan }: { plan: TripPlan }) {
  return (
    <>
      <h2 className="sr-only">How we read your request</h2>
      <UnderstoodCard plan={plan} />
    </>
  )
}

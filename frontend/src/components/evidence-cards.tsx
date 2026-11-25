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

function Card({
  icon,
  title,
  note,
  children,
}: {
  icon: ReactNode
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <section className="surface p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span aria-hidden className="text-primary">
          {icon}
        </span>
        {title}
      </h3>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** Long content is cut at a fixed height with a "Show more" button. No fade: plain and predictable. */
function Expandable({ children, collapsedHeight = 176 }: { children: ReactNode; collapsedHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const check = () => setOverflowing(element.scrollHeight > collapsedHeight + 12)
    check()

    const observer = new ResizeObserver(check)
    observer.observe(element)
    return () => observer.disconnect()
  }, [collapsedHeight, children])

  return (
    <div>
      <div
        ref={ref}
        className="overflow-hidden"
        style={open || !overflowing ? undefined : { maxHeight: collapsedHeight }}
      >
        {children}
      </div>
      {overflowing && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="mt-2 rounded-md text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

function Unavailable({ what }: { what: string }) {
  return (
    <p className="text-sm text-muted-foreground">
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
      note="Check this before you approve. If something is wrong, ask for changes."
    >
      {rows.length > 0 ? (
        <dl className="space-y-1.5 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing specific was picked out of your request.</p>
      )}

      {researched.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <p className="text-xs text-muted-foreground">Researched</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {researched.map((agent) => (
              <li
                key={agent}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              >
                <Check className="size-3" aria-hidden />
                {agentLabel(agent)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.supervisor_reasoning.trim() && (
        <details className="group mt-3 text-sm">
          <summary className="cursor-pointer rounded-md text-primary underline-offset-2 hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
            Why these steps?
          </summary>
          <p className="mt-2 leading-relaxed text-muted-foreground">{plan.supervisor_reasoning}</p>
        </details>
      )}
    </Card>
  )
}

// ------------------------------------------------------------ budget

export function BudgetCard({ text }: { text: string }) {
  if (!text.trim()) return null

  return (
    <Card icon={<Wallet className="size-4" />} title="Budget check" note="An estimate from the research, not a quote.">
      <Expandable collapsedHeight={200}>
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
      <Card icon={<CloudSun className="size-4" />} title="Weather">
        <Unavailable what="Live weather" />
      </Card>
    )
  }

  const weather = parseWeather(text)

  return (
    <Card icon={<CloudSun className="size-4" />} title="Weather" note="Live from OpenWeather. Forecast times are UTC.">
      {weather ? (
        <>
          <p className="text-sm text-muted-foreground">{weather.city}</p>
          <p className="text-4xl leading-tight font-light tabular-nums">{Math.round(weather.temperature)}°C</p>
          <p className="text-sm first-letter:uppercase">{weather.condition}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Feels like {Math.round(weather.feelsLike)}° · Humidity {weather.humidity}% · Wind {weather.wind} m/s
          </p>

          {weather.forecast.length > 0 && (
            <ul className="mt-3 divide-y border-t text-xs">
              {weather.forecast.map((entry) => (
                <li key={entry.time} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="text-muted-foreground tabular-nums">{formatForecastTime(entry.time)}</span>
                  <span className="first-letter:uppercase">{entry.weather}</span>
                  <span className="font-medium tabular-nums">{Math.round(entry.temperature)}°</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <Expandable>
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
      <Card icon={<Plane className="size-4" />} title="Flights">
        <Unavailable what="Flight information" />
      </Card>
    )
  }

  const live = parseFlights(text)

  return (
    <Card
      icon={<Plane className="size-4" />}
      title="Flights"
      note={live ? "Live flight status. Ticket prices are not included." : "Guidance only. Not live fares or availability."}
    >
      {live ? (
        <>
          {live.heading && <p className="mb-3 text-sm font-medium">{live.heading}</p>}
          <ul className="divide-y">
            {(showAll ? live.flights : live.flights.slice(0, FLIGHTS_SHOWN)).map((flight, index) => (
              <li key={`${flight.number}-${index}`} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{flight.number}</span>
                  <span className="text-xs text-muted-foreground capitalize">{flight.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">{flight.airline}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm tabular-nums">
                  <span className="font-medium">{flight.from}</span>
                  <span className="text-muted-foreground">{flight.departs}</span>
                  <ArrowRight className="size-3 text-muted-foreground" aria-hidden />
                  <span className="font-medium">{flight.to}</span>
                  <span className="text-muted-foreground">{flight.arrives}</span>
                </p>
              </li>
            ))}
          </ul>
          {live.flights.length > FLIGHTS_SHOWN && (
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="mt-2 rounded-md text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              {showAll ? "Show fewer" : `Show all ${live.flights.length}`}
            </button>
          )}
        </>
      ) : (
        <Expandable>
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
      <Card icon={<BedDouble className="size-4" />} title="Hotels">
        <Unavailable what="Live hotel search" />
      </Card>
    )
  }

  const hotels = parseHotels(text)

  return (
    <Card icon={<BedDouble className="size-4" />} title="Hotels" note="From a web search. Check rates on the hotel's site.">
      {hotels ? (
        <Expandable collapsedHeight={260}>
          <ul className="divide-y">
            {hotels.map((hotel) => (
              <li key={hotel.url} className="py-3 first:pt-0 last:pb-0">
                <a
                  href={hotel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-2 text-sm font-medium hover:underline"
                >
                  <span>{hotel.title}</span>
                  <ExternalLink
                    className="mt-0.5 size-3 shrink-0 text-muted-foreground group-hover:text-foreground"
                    aria-label="opens in a new tab"
                  />
                </a>
                <p className="text-xs text-muted-foreground">{hotel.site}</p>
                {hotel.snippet && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{hotel.snippet}</p>
                )}
              </li>
            ))}
          </ul>
        </Expandable>
      ) : (
        <Expandable>
          <Markdown variant="card">{text}</Markdown>
        </Expandable>
      )}
    </Card>
  )
}

// ------------------------------------------------------------ the group

/** Everything the agents found. A card appears only if its agent actually ran. */
export function ResearchCards({ plan }: { plan: TripPlan }) {
  return (
    <>
      <h2 className="sr-only">Research behind this plan</h2>
      <UnderstoodCard plan={plan} />
      <BudgetCard text={plan.budget_results} />
      <WeatherCard text={plan.weather_results} />
      <FlightsCard text={plan.flight_results} />
      <HotelsCard text={plan.hotel_results} />
    </>
  )
}

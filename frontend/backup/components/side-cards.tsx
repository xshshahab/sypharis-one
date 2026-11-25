import { useState, type ReactNode } from "react"
import { ArrowRight, BedDouble, CloudSun, ExternalLink, Plane } from "lucide-react"

import { Markdown } from "@/components/markdown"
import { Button } from "@/components/ui/button"
import {
  formatForecastTime,
  parseFlights,
  parseHotels,
  parseWeather,
} from "@/lib/parse"

function Card({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card">
      <h3 className="flex items-center gap-2 border-b px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {icon}
        {title}
      </h3>
      <div className="p-4">{children}</div>
    </section>
  )
}

// ---------------------------------------------------------------- flights

const FLIGHTS_SHOWN = 5

export function FlightsCard({ text }: { text: string }) {
  const [showAll, setShowAll] = useState(false)
  const parsed = parseFlights(text)

  return (
    <Card icon={<Plane className="size-3.5" />} title="Flights">
      {parsed ? (
        <>
          {parsed.heading && <p className="mb-3 text-sm font-medium">{parsed.heading}</p>}

          <ul className="divide-y">
            {(showAll ? parsed.flights : parsed.flights.slice(0, FLIGHTS_SHOWN)).map(
              (flight, index) => (
                <li key={`${flight.number}-${index}`} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{flight.number}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {flight.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{flight.airline}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm tabular-nums">
                    <span className="font-medium">{flight.from}</span>
                    <span className="text-muted-foreground">{flight.departs}</span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <span className="font-medium">{flight.to}</span>
                    <span className="text-muted-foreground">{flight.arrives}</span>
                  </p>
                </li>
              )
            )}
          </ul>

          {parsed.flights.length > FLIGHTS_SHOWN && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 -ml-2"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? "Show fewer" : `Show all ${parsed.flights.length}`}
            </Button>
          )}
        </>
      ) : text.trim() ? (
        <div className="text-sm">
          <Markdown>{text}</Markdown>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No flight information.</p>
      )}

      <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
        Live flight status only. Ticket prices are not included.
      </p>
    </Card>
  )
}

// ----------------------------------------------------------------- hotels

export function HotelsCard({ text }: { text: string }) {
  const hotels = parseHotels(text)

  return (
    <Card icon={<BedDouble className="size-3.5" />} title="Hotels">
      {hotels ? (
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
                <ExternalLink className="mt-0.5 size-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </a>
              <p className="text-xs text-muted-foreground">{hotel.site}</p>
              {hotel.snippet && (
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {hotel.snippet}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : text.trim() ? (
        <div className="text-sm">
          <Markdown>{text}</Markdown>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No hotel information.</p>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------- weather

export function WeatherCard({ text }: { text: string }) {
  if (!text.trim()) return null

  const weather = parseWeather(text)

  return (
    <Card icon={<CloudSun className="size-3.5" />} title="Weather">
      {weather ? (
        <>
          <p className="text-sm text-muted-foreground">{weather.city}</p>
          <p className="font-serif text-4xl leading-tight tabular-nums">
            {Math.round(weather.temperature)}°C
          </p>
          <p className="text-sm first-letter:uppercase">{weather.condition}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Feels like {Math.round(weather.feelsLike)}° · Humidity {weather.humidity}% · Wind{" "}
            {weather.wind} m/s
          </p>

          {weather.forecast.length > 0 && (
            <ul className="mt-3 divide-y border-t text-xs">
              {weather.forecast.map((entry) => (
                <li key={entry.time} className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground tabular-nums">
                    {formatForecastTime(entry.time)}
                  </span>
                  <span className="first-letter:uppercase">{entry.weather}</span>
                  <span className="font-medium tabular-nums">
                    {Math.round(entry.temperature)}°
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted-foreground">Forecast times are UTC.</p>
        </>
      ) : (
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{text.trim()}</p>
      )}
    </Card>
  )
}

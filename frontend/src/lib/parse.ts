// The backend returns plain text for flights, hotels and weather. These helpers
// turn that text into structured data so the UI can show it as clean cards.
// Each one returns null when the text is not in the expected shape, and the
// caller then falls back to showing the text as it is.

// ---------- hotels ----------
// Format: "1. **Title**\n   https://url\n   snippet"

export type Hotel = { title: string; url: string; site: string; snippet: string }

export function parseHotels(text: string): Hotel[] | null {
  const blocks = text.trim().split(/\n\s*\n(?=\d+\.\s)/)
  const hotels: Hotel[] = []

  for (const block of blocks) {
    const match = block.match(/^\d+\.\s+\*\*(.+?)\*\*\s*\n\s*(https?:\/\/\S+)\s*\n?([\s\S]*)$/)
    if (!match) return null

    const [, title, url, snippet] = match
    let site = url
    try {
      site = new URL(url).hostname.replace(/^www\./, "")
    } catch {
      // keep the raw url
    }

    hotels.push({ title: title.trim(), url, site, snippet: snippet.replace(/\s+/g, " ").trim() })
  }

  return hotels.length > 0 ? hotels : null
}

// ---------- flights ----------
// Format: blocks separated by "---", each with "Airline:", "Flight:", "Status:",
// then "Departure:" and "Arrival:" sections with "- Airport:", "- IATA:", "- Scheduled:".

export type Flight = {
  airline: string
  number: string
  status: string
  from: string
  to: string
  departs: string
  arrives: string
}

export type FlightList = { heading: string; flights: Flight[] }

function field(text: string, label: string): string {
  const match = text.match(new RegExp(`^[-\\s]*${label}:\\s*(.+)$`, "m"))
  return match ? match[1].trim() : ""
}

function clock(iso: string): string {
  // "2026-11-24T11:30:00+00:00" -> "11:30"
  const match = iso.match(/T(\d{2}:\d{2})/)
  return match ? match[1] : iso
}

export function parseFlights(text: string): FlightList | null {
  if (!/^Airline:/m.test(text)) return null

  const [headingBlock, ...rest] = text.split(/\n\s*\n---\s*\n\s*\n/)
  // The heading ("Live flights from DEL to NRT") sits above the first flight
  const firstSplit = headingBlock.split(/\n\s*\n/)
  const heading = firstSplit.length > 1 ? firstSplit[0].trim() : ""
  const firstFlight = firstSplit.length > 1 ? firstSplit.slice(1).join("\n\n") : headingBlock

  const flights: Flight[] = []

  for (const block of [firstFlight, ...rest]) {
    const departureAt = block.indexOf("Departure:")
    const arrivalAt = block.indexOf("Arrival:")
    if (departureAt === -1 || arrivalAt === -1) continue

    const departure = block.slice(departureAt, arrivalAt)
    const arrival = block.slice(arrivalAt)

    flights.push({
      airline: field(block, "Airline"),
      number: field(block, "Flight"),
      status: field(block, "Status"),
      from: field(departure, "IATA"),
      to: field(arrival, "IATA"),
      departs: clock(field(departure, "Scheduled")),
      arrives: clock(field(arrival, "Scheduled")),
    })
  }

  return flights.length > 0 ? { heading, flights } : null
}

// ---------- weather ----------
// Format: "Current Weather (Tokyo):\n{json}\n\nForecast:\n{json}"

export type Weather = {
  city: string
  temperature: number
  feelsLike: number
  humidity: number
  condition: string
  wind: number
  forecast: { time: string; temperature: number; weather: string }[]
}

export function parseWeather(text: string): Weather | null {
  const cityMatch = text.match(/Current Weather \((.+?)\):/)
  const [currentPart, forecastPart = ""] = text.split(/\n\s*Forecast:\s*\n/)

  try {
    const current = JSON.parse(currentPart.slice(currentPart.indexOf("{")))
    if (typeof current.temperature_c !== "number") return null

    let forecast: Weather["forecast"] = []
    try {
      const data = JSON.parse(forecastPart.slice(forecastPart.indexOf("{")))
      forecast = (data.forecast ?? []).map(
        (item: { datetime: string; temperature: number; weather: string }) => ({
          time: item.datetime,
          temperature: item.temperature,
          weather: item.weather,
        })
      )
    } catch {
      // forecast is optional
    }

    return {
      city: cityMatch?.[1] ?? current.city ?? "",
      temperature: current.temperature_c,
      feelsLike: current.feels_like_c,
      humidity: current.humidity,
      condition: current.condition,
      wind: current.wind_speed,
      forecast,
    }
  } catch {
    return null
  }
}

/** "2026-11-24 15:00:00" (UTC) -> "24 Nov, 15:00" */
export function formatForecastTime(value: string): string {
  const match = value.match(/^\d{4}-(\d{2})-(\d{2}) (\d{2}:\d{2})/)
  if (!match) return value

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${Number(match[2])} ${months[Number(match[1]) - 1]}, ${match[3]}`
}

// ---------- notes written for the AI ----------

/**
 * When a live service fails, the backend leaves a note meant for the AI ("... Provide general
 * guidance and label it as non-live"). That text should not be shown to travellers as it is.
 */
export function isUnavailableNote(text: string): boolean {
  return /temporarily unavailable|information unavailable/i.test(text)
}

/** "flight_agent" -> "Flights" */
const AGENT_LABELS: Record<string, string> = {
  flight_agent: "Flights",
  hotel_agent: "Hotels",
  weather_agent: "Weather",
  budget_agent: "Budget",
  itinerary_agent: "Itinerary",
}

export function agentLabel(name: string): string {
  return AGENT_LABELS[name] ?? name
}

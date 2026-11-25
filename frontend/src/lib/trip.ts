export type Pace = "Relaxed" | "Balanced" | "Packed"

export const PACES: Pace[] = ["Relaxed", "Balanced", "Packed"]

export type TripRequest = {
  from: string
  to: string
  /** yyyy-mm-dd from the date input, or "" when not chosen */
  startDate: string
  days: number
  travellers: number
  pace: Pace
  budget: string
  interests: string[]
  notes: string
}

export const EMPTY_TRIP: TripRequest = {
  from: "Delhi",
  to: "",
  startDate: "",
  days: 5,
  travellers: 2,
  pace: "Balanced",
  budget: "",
  interests: [],
  notes: "",
}

export const INTERESTS = [
  "Food",
  "Culture & history",
  "Adventure",
  "Beaches",
  "Nature",
  "Shopping",
  "Nightlife",
  "Relaxation",
  "Family friendly",
]

/** "2026-11-25" -> "25 November 2026" (no time zone surprises: the date is parsed as local) */
export function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return value

  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** Today as yyyy-mm-dd, for the date input's minimum. */
export function today(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function people(count: number): string {
  return count === 1 ? "1 traveller" : `${count} travellers`
}

/**
 * Turns the form into the sentence the backend understands. Keeping the
 * "from X to Y ... with hotels" shape keeps destination detection reliable.
 */
export function buildMessage(trip: TripRequest): string {
  const origin = trip.from.trim()

  const parts = [
    `Plan a ${trip.days} day trip ${origin ? `from ${origin} ` : ""}to ${trip.to.trim()} for ${people(trip.travellers)} with hotels.`,
  ]

  if (trip.startDate) parts.push(`Starting on ${formatDate(trip.startDate)}.`)
  if (trip.pace !== "Balanced") parts.push(`Pace: ${trip.pace.toLowerCase()}.`)
  if (trip.budget.trim()) parts.push(`Budget around ${trip.budget.trim()}.`)
  if (trip.interests.length > 0) parts.push(`Interests: ${trip.interests.join(", ").toLowerCase()}.`)
  if (trip.notes.trim()) parts.push(trip.notes.trim())

  return parts.join(" ")
}

/** Short facts under the trip title: ["25 Nov 2026", "4 days", "2 travellers", "₹1,50,000"]. */
export function tripFacts(trip: TripRequest): string[] {
  const facts: string[] = []

  if (trip.startDate) {
    const [year, month, day] = trip.startDate.split("-").map(Number)
    facts.push(
      new Date(year, month - 1, day).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    )
  }

  facts.push(`${trip.days} ${trip.days === 1 ? "day" : "days"}`)
  facts.push(people(trip.travellers))
  if (trip.budget.trim()) facts.push(trip.budget.trim())

  return facts
}

export const POPULAR_TRIPS: { city: string; note: string; tone: string; trip: TripRequest }[] = [
  {
    city: "Goa",
    note: "3 days · beaches and food",
    tone: "bg-teal-800",
    trip: { ...EMPTY_TRIP, to: "Goa", days: 3, interests: ["Beaches", "Food"] },
  },
  {
    city: "Dubai",
    note: "4 days · shopping and food",
    tone: "bg-amber-800",
    trip: { ...EMPTY_TRIP, to: "Dubai", days: 4, interests: ["Shopping", "Food"] },
  },
  {
    city: "Tokyo",
    note: "6 days · culture and food",
    tone: "bg-indigo-900",
    trip: { ...EMPTY_TRIP, to: "Tokyo", days: 6, interests: ["Culture & history", "Food"] },
  },
  {
    city: "Paris",
    note: "7 days · budget friendly",
    tone: "bg-rose-900",
    trip: { ...EMPTY_TRIP, from: "Mumbai", to: "Paris", days: 7, budget: "Budget friendly" },
  },
]

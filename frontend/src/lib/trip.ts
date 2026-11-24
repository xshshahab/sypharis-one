export type TripRequest = {
  from: string
  to: string
  days: number
  notes: string
}

export const EMPTY_TRIP: TripRequest = { from: "Delhi", to: "", days: 5, notes: "" }

/**
 * Turns the form into the sentence the backend understands.
 * Keeping the "from X to Y with hotels" shape makes the airport detection reliable.
 */
export function buildMessage({ from, to, days, notes }: TripRequest): string {
  const origin = from.trim()
  const destination = to.trim()

  let message = `Plan a ${days} day trip ${origin ? `from ${origin} ` : ""}to ${destination} with hotels`

  if (notes.trim()) {
    message += `. ${notes.trim()}`
  }

  return message
}

export const POPULAR_TRIPS: TripRequest[] = [
  { from: "Delhi", to: "Goa", days: 3, notes: "" },
  { from: "Delhi", to: "Dubai", days: 4, notes: "" },
  { from: "Delhi", to: "Tokyo", days: 5, notes: "" },
  { from: "Mumbai", to: "Paris", days: 7, notes: "Budget friendly" },
]

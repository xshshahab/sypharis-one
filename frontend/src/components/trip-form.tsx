import { useId, useState, type FormEvent } from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EMPTY_TRIP, POPULAR_TRIPS, type TripRequest } from "@/lib/trip"

const inputClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60"

type TripFormProps = {
  loading: boolean
  initial?: TripRequest
  showPopular?: boolean
  onSubmit: (trip: TripRequest) => void
}

/** Where are you going? A plain form instead of a chat box. */
export function TripForm({
  loading,
  initial = EMPTY_TRIP,
  showPopular = false,
  onSubmit,
}: TripFormProps) {
  const [trip, setTrip] = useState<TripRequest>(initial)
  const id = useId()

  const canSubmit = trip.to.trim().length > 0 && !loading

  function update<K extends keyof TripRequest>(key: K, value: TripRequest[K]) {
    setTrip((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (canSubmit) onSubmit(trip)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-xs sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_7rem]">
          <div className="space-y-1.5">
            <label htmlFor={`${id}-from`} className="text-xs font-medium">
              From
            </label>
            <input
              id={`${id}-from`}
              className={inputClass}
              value={trip.from}
              onChange={(event) => update("from", event.target.value)}
              placeholder="Delhi"
              disabled={loading}
              maxLength={60}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`${id}-to`} className="text-xs font-medium">
              To
            </label>
            <input
              id={`${id}-to`}
              className={inputClass}
              value={trip.to}
              onChange={(event) => update("to", event.target.value)}
              placeholder="Tokyo, Goa, Dubai…"
              disabled={loading}
              maxLength={60}
              autoComplete="off"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`${id}-days`} className="text-xs font-medium">
              Days
            </label>
            <select
              id={`${id}-days`}
              className={inputClass}
              value={trip.days}
              onChange={(event) => update("days", Number(event.target.value))}
              disabled={loading}
            >
              {Array.from({ length: 14 }, (_, index) => index + 1).map((day) => (
                <option key={day} value={day}>
                  {day} {day === 1 ? "day" : "days"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <label htmlFor={`${id}-notes`} className="text-xs font-medium">
            Anything else? <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id={`${id}-notes`}
            className={inputClass}
            value={trip.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Budget, interests, travelling with family…"
            disabled={loading}
            maxLength={200}
            autoComplete="off"
          />
        </div>

        <div className="mt-5 flex items-center justify-end">
          <Button type="submit" disabled={!canSubmit} className="h-10 px-5 text-sm">
            Plan trip
            <ArrowRight />
          </Button>
        </div>
      </div>

      {showPopular && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Popular:</span>
          {POPULAR_TRIPS.map((popular) => (
            <button
              key={`${popular.from}-${popular.to}`}
              type="button"
              onClick={() => setTrip(popular)}
              className="rounded-full border bg-card px-3 py-1 text-xs transition-colors hover:bg-muted"
            >
              {popular.from} to {popular.to} · {popular.days} days
            </button>
          ))}
        </div>
      )}
    </form>
  )
}

import { useState } from "react"
import { ShieldAlert, X } from "lucide-react"

import { POPULAR_TRIPS, type TripRequest } from "@/lib/trip"

type BlockedNoticeProps = {
  /** The guardrail's own explanation of why the request was blocked. */
  reason: string
  /** Picking an example replaces the form, so the blocked text is cleared too. */
  onPick: (trip: TripRequest) => void
}

/** A clear warning for a request the guardrail refused. Amber on purpose: this is a warning, not a crash. */
export function BlockedNotice({ reason, onPick }: BlockedNoticeProps) {
  const [open, setOpen] = useState(true)

  if (!open) return null

  return (
    <div
      role="alert"
      className="relative rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-[0_14px_40px_rgb(8_14_48/0.3)] sm:p-6 dark:border-amber-500/50 dark:bg-amber-950/90 dark:text-amber-50"
    >
      <div className="flex gap-4">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full bg-amber-500 text-white"
        >
          <ShieldAlert className="size-6" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wider text-amber-800 uppercase dark:text-amber-300">
            Request blocked
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">
            We can only help with travel planning
          </h2>

          <p className="mt-3 rounded-lg border border-amber-300/80 bg-white/70 px-3.5 py-2.5 text-sm leading-relaxed dark:border-amber-500/30 dark:bg-black/25">
            <span className="font-medium">Why: </span>
            {reason ||
              "That request does not look like a trip. Tell us where you want to go and for how long."}
          </p>

          <p className="mt-4 text-sm">
            Nothing was researched. Change your request below, or start from one of these:
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {POPULAR_TRIPS.map(({ city, trip }) => (
              <li key={city}>
                <button
                  type="button"
                  onClick={() => onPick(trip)}
                  className="rounded-full border border-amber-400 bg-white/80 px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-white focus-visible:ring-3 focus-visible:ring-amber-500/50 focus-visible:outline-none dark:border-amber-500/50 dark:bg-amber-900/60 dark:hover:bg-amber-900"
                >
                  {city}, {trip.days} days
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss this warning"
          className="grid size-8 shrink-0 place-items-center rounded-full text-amber-800 transition-colors hover:bg-amber-200/70 focus-visible:ring-3 focus-visible:ring-amber-500/50 focus-visible:outline-none dark:text-amber-200 dark:hover:bg-amber-800/60"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const STEPS = [
  "Checking live flights",
  "Finding hotels",
  "Building your itinerary",
  "Writing your trip plan",
]

const STEP_DURATION_MS = 4000

/**
 * Shows progress while the backend works. The API answers in one go, so the
 * steps advance on a timer to mirror the order the agents run in.
 */
export function LoadingSteps() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(
      () => setActive((step) => Math.min(step + 1, STEPS.length - 1)),
      STEP_DURATION_MS
    )
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border bg-card p-5 shadow-sm"
    >
      <p className="mb-4 text-sm font-medium">Planning your trip…</p>
      <ol className="space-y-3">
        {STEPS.map((label, index) => {
          const done = index < active
          const current = index === active

          return (
            <li
              key={label}
              className={cn(
                "flex items-center gap-3 text-sm",
                !done && !current && "text-muted-foreground/60"
              )}
            >
              <span className="flex size-5 items-center justify-center">
                {done ? (
                  <Check className="size-4 text-primary" />
                ) : current ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              {label}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

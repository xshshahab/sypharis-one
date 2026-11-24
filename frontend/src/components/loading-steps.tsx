import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const STEPS = ["Checking flights", "Finding hotels", "Putting your plan together"]

const STEP_DURATION_MS = 6000

/**
 * Shows that work is in progress. The API answers in one go, so the steps
 * advance on a timer: it is a hint, not live status.
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
    <div role="status" aria-live="polite" className="rounded-lg border bg-card p-5">
      <p className="font-serif text-lg">Planning your trip</p>
      <p className="mt-0.5 text-xs text-muted-foreground">This can take a minute.</p>

      <ol className="mt-4 space-y-2.5">
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
              <span className="flex size-4 items-center justify-center">
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

import { useEffect, useState, type ReactNode } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Seconds since this component appeared. */
export function useElapsed(): number {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  return seconds
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = String(seconds % 60).padStart(2, "0")
  return `${minutes}:${rest}`
}

/** The slow-down note appears after this many seconds. */
const SLOW_AFTER_SECONDS = 45

type WorkingCardProps = {
  title: string
  /** What is happening, in one sentence. */
  description: string
  /** What the backend does, listed honestly (the API gives no live progress, so nothing is ticked off). */
  steps?: string[]
  onCancel?: () => void
  children?: ReactNode
}

/**
 * A long wait. The API answers once, at the end, so there is no real progress to show.
 * Instead of faking a progress bar this shows the time spent and what is going on.
 */
export function WorkingCard({ title, description, steps, onCancel, children }: WorkingCardProps) {
  const elapsed = useElapsed()

  return (
    <div className="surface p-5 sm:p-6">
      <div role="status" className="flex items-start gap-3">
        <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-semibold tracking-tight">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {/* Hidden from screen readers: a ticking clock would be announced every second */}
        <p aria-hidden className="text-sm text-muted-foreground tabular-nums">
          {formatElapsed(elapsed)}
        </p>
      </div>

      {steps && (
        <ul className="mt-4 space-y-1.5 border-t pt-4 text-sm text-muted-foreground">
          {steps.map((step) => (
            <li key={step} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-current" />
              {step}
            </li>
          ))}
        </ul>
      )}

      {children}

      {elapsed >= SLOW_AFTER_SECONDS && (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Still working. The free AI plan limits how much text can be processed per minute, so this can take up to
          two minutes.
        </p>
      )}

      {onCancel && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="pill" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

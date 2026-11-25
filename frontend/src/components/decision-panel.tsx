import { useId, useState, type KeyboardEvent } from "react"
import { Check, Loader2, MessageSquareText, Sparkles } from "lucide-react"

import { ErrorNotice } from "@/components/notice"
import { useElapsed } from "@/components/working-card"
import { Button } from "@/components/ui/button"
import type { FriendlyError } from "@/lib/errors"

const MAX_FEEDBACK = 600

const QUICK_REVISIONS = [
  "Make it more budget-friendly",
  "Slower, more relaxed pace",
  "More local food & markets",
  "Stay in a more central area",
]

type DecisionPanelProps = {
  /** What the backend is doing right now, if anything. */
  busy: "approve" | "changes" | null
  /** A failed decision. The draft stays on screen and the buttons come back. */
  error: FriendlyError | null
  /** The backend's own wording for the question. */
  description: string
  onApprove: () => void
  onRequestChanges: (feedback: string) => void
  onCancel: () => void
}

function Busy({ action, onCancel }: { action: "approve" | "changes"; onCancel: () => void }) {
  const elapsed = useElapsed()
  const time = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`

  return (
    <div>
      <div role="status" className="flex items-start gap-3">
        <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {action === "approve" ? "Writing your final plan" : "Applying your changes"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {elapsed >= 30
              ? "Still working. The free AI plan limits text per minute, so this can take a minute."
              : "This usually takes under a minute."}
          </p>
        </div>
        <p aria-hidden className="text-sm text-muted-foreground tabular-nums">
          {time}
        </p>
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" size="pill" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

/**
 * The approval step. Elevated action card beside the draft on large screens, and a bar fixed to the
 * bottom of the screen on small ones, so the decision is always one tap away.
 */
export function DecisionPanel({
  busy,
  error,
  description,
  onApprove,
  onRequestChanges,
  onCancel,
}: DecisionPanelProps) {
  const [changing, setChanging] = useState(false)
  const [feedback, setFeedback] = useState("")
  const id = useId()

  const trimmed = feedback.trim()
  const canSend = trimmed.length > 0

  function send() {
    if (canSend) onRequestChanges(trimmed)
  }

  function addQuickChip(chip: string) {
    setFeedback((current) => {
      const clean = current.trim()
      if (!clean) return chip
      if (clean.toLowerCase().includes(chip.toLowerCase())) return current
      const next = `${clean}. ${chip}`
      return next.slice(0, MAX_FEEDBACK)
    })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      send()
    }
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="surface border-primary/25 p-5 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:max-h-[85svh] max-lg:overflow-y-auto max-lg:rounded-b-none max-lg:border-t max-lg:bg-card/95 max-lg:p-4 max-lg:shadow-2xl max-lg:backdrop-blur-md print:hidden"
    >
      <div className={busy ? "sr-only" : "flex items-center justify-between gap-2 max-lg:sr-only"}>
        <h2 id={`${id}-title`} className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <span>Your decision</span>
        </h2>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-300">
          Awaiting approval
        </span>
      </div>

      {busy ? (
        <Busy action={busy} onCancel={onCancel} />
      ) : (
        <div className="space-y-3.5 lg:mt-3">
          {error && <ErrorNotice error={error} className="shadow-none" />}

          {changing ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={`${id}-feedback`} className="block text-sm font-medium">
                    What should change?
                  </label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {feedback.length}/{MAX_FEEDBACK}
                  </span>
                </div>
                <textarea
                  id={`${id}-feedback`}
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={MAX_FEEDBACK}
                  rows={4}
                  autoFocus
                  placeholder="Make it cheaper, add a day trip, avoid early mornings…"
                  className="w-full resize-y rounded-xl border border-input bg-background/60 px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:text-sm"
                />

                <div className="flex flex-wrap gap-1.5" aria-label="Quick suggestions">
                  {QUICK_REVISIONS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => addQuickChip(chip)}
                      className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Press <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[11px]">Ctrl</kbd> or{" "}
                  <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[11px]">⌘</kbd> +{" "}
                  <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[11px]">Enter</kbd> to send.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="cta" onClick={send} disabled={!canSend} className="h-11 flex-1 px-5 text-sm">
                  Send changes
                </Button>
                <Button variant="outline" size="cta" onClick={() => setChanging(false)} className="h-11 px-5 text-sm">
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-muted-foreground max-lg:hidden">{description}</p>
              <div className="flex gap-2.5 lg:flex-col">
                <Button
                  size="cta"
                  onClick={onApprove}
                  className="h-11 min-w-0 flex-1 px-4 text-sm lg:h-11 lg:w-full lg:flex-none lg:px-6"
                >
                  <Check aria-hidden />
                  <span>
                    Approve<span className="max-lg:hidden"> &amp; create final plan</span>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="cta"
                  onClick={() => setChanging(true)}
                  className="h-11 min-w-0 flex-1 px-4 text-sm lg:h-11 lg:w-full lg:flex-none lg:px-6"
                >
                  <MessageSquareText aria-hidden />
                  <span>Request changes</span>
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

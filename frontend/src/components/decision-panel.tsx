import { useId, useState, type KeyboardEvent } from "react"
import { Loader2 } from "lucide-react"

import { ErrorNotice } from "@/components/notice"
import { useElapsed } from "@/components/working-card"
import { Button } from "@/components/ui/button"
import type { FriendlyError } from "@/lib/errors"

const MAX_FEEDBACK = 600

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
 * The approval step. Sticky card beside the draft on large screens, a bar fixed to the
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

  const canSend = feedback.trim().length > 0

  function send() {
    if (canSend) onRequestChanges(feedback.trim())
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
      className="surface p-5 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:max-h-[85svh] max-lg:overflow-y-auto max-lg:rounded-b-none max-lg:border-t max-lg:p-4 print:hidden"
    >
      <h2 id={`${id}-title`} className={busy ? "sr-only" : "text-base font-semibold max-lg:sr-only"}>
        Your decision
      </h2>

      {busy ? (
        <Busy action={busy} onCancel={onCancel} />
      ) : (
        <div className="space-y-3 lg:mt-2">
          {error && <ErrorNotice error={error} className="shadow-none" />}

          {changing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor={`${id}-feedback`} className="block text-sm font-medium">
                  What should change?
                </label>
                <textarea
                  id={`${id}-feedback`}
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={MAX_FEEDBACK}
                  rows={4}
                  autoFocus
                  placeholder="Make it cheaper, add a day trip, avoid early mornings…"
                  className="w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  You get the revised plan next. Ctrl or ⌘ + Enter to send.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="cta" onClick={send} disabled={!canSend} className="flex-1">
                  Send changes
                </Button>
                <Button variant="outline" size="cta" onClick={() => setChanging(false)}>
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground max-lg:hidden">{description}</p>
              <div className="flex gap-2 lg:flex-col">
                <Button size="cta" onClick={onApprove} className="min-w-0 flex-1 px-4 lg:flex-none lg:px-8">
                  Approve<span className="max-lg:hidden">&nbsp;and create final plan</span>
                </Button>
                <Button variant="outline" size="cta" onClick={() => setChanging(true)} className="min-w-0 flex-1 px-4 lg:flex-none lg:px-8">
                  Request changes
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

import { useState, type FormEvent, type KeyboardEvent } from "react"
import { ArrowUp, Loader2, Square } from "lucide-react"

import { Button } from "@/components/ui/button"

type TripComposerProps = {
  loading: boolean
  onSubmit: (message: string) => void
  onCancel: () => void
}

/** Text box where the user describes the trip they want. */
export function TripComposer({ loading, onSubmit, onCancel }: TripComposerProps) {
  const [value, setValue] = useState("")

  const canSend = value.trim().length > 0 && !loading

  function send() {
    if (!canSend) return
    onSubmit(value.trim())
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    send()
  }

  // Enter sends, Shift+Enter adds a new line
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/30"
    >
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        rows={2}
        maxLength={1000}
        placeholder="e.g. Plan a 5 day Japan trip from Delhi with hotels"
        aria-label="Describe your trip"
        className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
      />

      {loading ? (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="Stop"
          onClick={onCancel}
        >
          <Square />
        </Button>
      ) : (
        <Button type="submit" size="icon" aria-label="Plan trip" disabled={!canSend}>
          <ArrowUp />
        </Button>
      )}

      {loading && <Loader2 className="sr-only animate-spin" aria-hidden />}
    </form>
  )
}

import { useRef, useState } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"

import logo from "@/assets/SypharisOne.webp"
import { LoadingSteps } from "@/components/loading-steps"
import { ThemeToggle } from "@/components/theme-toggle"
import { TripComposer } from "@/components/trip-composer"
import { TripResult } from "@/components/trip-result"
import { Button } from "@/components/ui/button"
import { planTrip, type TripPlan } from "@/lib/api"

const SUGGESTIONS = [
  "Plan a 5 day Japan trip from Delhi with hotels",
  "Weekend in Goa from Mumbai",
  "Flights from Delhi to Dubai",
  "7 days in Europe from Delhi, budget friendly",
]

type Status = "idle" | "loading" | "done" | "error"

export function App() {
  const [status, setStatus] = useState<Status>("idle")
  const [query, setQuery] = useState("")
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [error, setError] = useState("")
  // Keeps follow-up requests in the same conversation on the backend
  const threadId = useRef<string | null>(null)
  const controller = useRef<AbortController | null>(null)

  async function handleSubmit(message: string) {
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current

    setQuery(message)
    setError("")
    setStatus("loading")

    try {
      const result = await planTrip(message, threadId.current, current.signal)
      threadId.current = result.thread_id || null
      setPlan(result)
      setStatus("done")
    } catch (err) {
      if (current.signal.aborted) return // user pressed stop or reset
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setStatus("error")
    }
  }

  function handleCancel() {
    controller.current?.abort()
    setStatus(plan ? "done" : "idle")
  }

  function handleReset() {
    controller.current?.abort()
    threadId.current = null
    setPlan(null)
    setQuery("")
    setError("")
    setStatus("idle")
  }

  const loading = status === "loading"
  const started = status !== "idle"

  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt=""
            className="h-8 w-auto mix-blend-multiply dark:invert dark:mix-blend-screen"
          />
          <span className="text-sm font-semibold tracking-tight">
            Sypharis One
          </span>
        </div>

        <div className="flex items-center gap-1">
          {started && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw />
              New trip
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main
        className={
          started
            ? "mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 pb-10"
            : "mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 pb-24"
        }
      >
        {!started && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Where to next?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Describe your trip. Sypharis One checks live flights, finds
              hotels and builds your itinerary.
            </p>
          </div>
        )}

        <TripComposer
          loading={loading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />

        {!started && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => handleSubmit(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {started && query && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">You asked:</span>{" "}
            {query}
          </p>
        )}

        {loading && <LoadingSteps />}

        {status === "error" && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-2">
              <p>{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSubmit(query)}
              >
                Try again
              </Button>
            </div>
          </div>
        )}

        {status === "done" && plan && <TripResult plan={plan} />}
      </main>
    </div>
  )
}

export default App

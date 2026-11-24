import { useRef, useState } from "react"
import { AlertCircle, ArrowRight, Pencil, RotateCcw } from "lucide-react"

import logo from "@/assets/SypharisOne.webp"
import { LoadingSteps } from "@/components/loading-steps"
import { ThemeToggle } from "@/components/theme-toggle"
import { TripForm } from "@/components/trip-form"
import { TripResult } from "@/components/trip-result"
import { Button } from "@/components/ui/button"
import { planTrip, type TripPlan } from "@/lib/api"
import { buildMessage, EMPTY_TRIP, type TripRequest } from "@/lib/trip"

type Status = "idle" | "loading" | "done" | "error"

export function App() {
  const [status, setStatus] = useState<Status>("idle")
  const [trip, setTrip] = useState<TripRequest>(EMPTY_TRIP)
  const [editing, setEditing] = useState(false)
  const [plan, setPlan] = useState<TripPlan | null>(null)
  const [error, setError] = useState("")
  const controller = useRef<AbortController | null>(null)

  async function handleSubmit(next: TripRequest) {
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current

    setTrip(next)
    setEditing(false)
    setError("")
    setPlan(null)
    setStatus("loading")

    try {
      // Every plan is a fresh request, so no thread id is sent
      const result = await planTrip(buildMessage(next), null, current.signal)
      setPlan(result)
      setStatus("done")
    } catch (err) {
      if (current.signal.aborted) return
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setStatus("error")
    }
  }

  function handleReset() {
    controller.current?.abort()
    setTrip(EMPTY_TRIP)
    setPlan(null)
    setError("")
    setEditing(false)
    setStatus("idle")
  }

  const loading = status === "loading"
  const showForm = status === "idle" || editing

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b print:hidden">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <button onClick={handleReset} className="flex items-center gap-2.5" aria-label="Sypharis One home">
            <img
              src={logo}
              alt=""
              className="h-7 w-auto mix-blend-multiply dark:invert dark:mix-blend-screen"
            />
            <span className="font-serif text-lg font-semibold tracking-tight">Sypharis One</span>
          </button>

          <div className="flex items-center gap-1">
            {status !== "idle" && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw />
                New trip
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-12">
        {status === "idle" && (
          <div className="mx-auto max-w-2xl">
            <h1 className="font-serif text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              Plan your trip
            </h1>
            <p className="mt-3 mb-8 max-w-prose text-muted-foreground">
              Tell us where you are going and for how long. You will get live flight information,
              hotel options and a day-by-day plan.
            </p>
            <TripForm loading={loading} initial={trip} showPopular onSubmit={handleSubmit} />
          </div>
        )}

        {status !== "idle" && (
          <div className="space-y-6">
            {showForm ? (
              <div className="mx-auto max-w-2xl">
                <TripForm loading={loading} initial={trip} onSubmit={handleSubmit} />
              </div>
            ) : (
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
                    {trip.from.trim() || "Delhi"}
                    <ArrowRight className="size-5 text-muted-foreground" />
                    {trip.to}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {trip.days} {trip.days === 1 ? "day" : "days"}
                    {trip.notes.trim() && ` · ${trip.notes.trim()}`}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="print:hidden"
                  disabled={loading}
                  onClick={() => setEditing(true)}
                >
                  <Pencil />
                  Edit trip
                </Button>
              </div>
            )}

            {loading && (
              <div className="mx-auto max-w-2xl">
                <LoadingSteps />
              </div>
            )}

            {status === "error" && (
              <div
                role="alert"
                className="mx-auto flex max-w-2xl items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="space-y-2">
                  <p>{error}</p>
                  <Button variant="outline" size="sm" onClick={() => handleSubmit(trip)}>
                    Try again
                  </Button>
                </div>
              </div>
            )}

            {status === "done" && plan && <TripResult plan={plan} />}
          </div>
        )}
      </main>
    </div>
  )
}

export default App

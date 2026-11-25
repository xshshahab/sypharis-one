import { useId, useState, type FormEvent, type ReactNode } from "react"
import {
  ArrowLeftRight,
  Calendar as CalendarIcon,
  CircleAlert,
  Minus,
  Plus,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EMPTY_TRIP, INTERESTS, PACES, type TripRequest } from "@/lib/trip"
import { cn } from "@/lib/utils"

// 16px on small screens: iOS zooms into inputs smaller than that
const bareInput =
  "w-full bg-transparent text-base font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground disabled:opacity-60"

const boxedInput =
  "h-11 w-full rounded-lg border border-input bg-card px-3 shadow-xs text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-60 sm:text-sm"

const DAY_ITEMS = Array.from({ length: 21 }, (_, index) => {
  const day = index + 1
  return { value: String(day), label: `${day} ${day === 1 ? "day" : "days"}` }
})

const TRAVELLER_ITEMS = Array.from({ length: 10 }, (_, index) => {
  const count = index + 1
  return {
    value: String(count),
    label: `${count} ${count === 1 ? "person" : "people"}`,
  }
})

function parseLocalDate(value: string): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function formatLocalIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatTriggerDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

/** One cell of the combined search bar: a small label above the value. */
function Cell({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "relative px-4 py-2.5 transition-colors focus-within:bg-muted/60 focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-inset",
        className
      )}
    >
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

type TripFormProps = {
  initial?: TripRequest
  disabled?: boolean
  submitLabel?: string
  onSubmit: (trip: TripRequest) => void
}

/** The search card: where are you going, when, for how long and with whom. */
export function TripForm({
  initial = EMPTY_TRIP,
  disabled = false,
  submitLabel = "Plan my trip",
  onSubmit,
}: TripFormProps) {
  const [trip, setTrip] = useState<TripRequest>(initial)
  // Open from the start when the trip already has extras (for example after "Edit")
  const [moreOpen, setMoreOpen] = useState(
    Boolean(initial.budget || initial.notes || initial.interests.length > 0)
  )
  const [dateOpen, setDateOpen] = useState(false)
  const [missingTo, setMissingTo] = useState(false)
  const id = useId()

  const hasDestination = trip.to.trim().length > 0
  const selectedDate = parseLocalDate(trip.startDate)

  function update<K extends keyof TripRequest>(key: K, value: TripRequest[K]) {
    setTrip((current) => ({ ...current, [key]: value }))
  }

  function toggleInterest(interest: string) {
    update(
      "interests",
      trip.interests.includes(interest)
        ? trip.interests.filter((item) => item !== interest)
        : [...trip.interests, interest]
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (disabled) return

    // The button always looks ready. If the destination is empty, say what is missing and go to it.
    if (!hasDestination) {
      setMissingTo(true)
      document.getElementById(`${id}-to`)?.focus()
      return
    }

    onSubmit(trip)
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Plan a trip"
      className="glass relative rounded-3xl p-5 sm:p-8"
    >
      <span aria-hidden className="border-beam" />
      {/* Pace: shapes how packed the days are */}
      <fieldset className="flex flex-wrap gap-x-7 gap-y-2" disabled={disabled}>
        <legend className="sr-only">Pace of the trip</legend>
        {PACES.map((pace) => (
          <label
            key={pace}
            className="inline-flex cursor-pointer items-center gap-2.5 text-base"
          >
            <input
              type="radio"
              name={`${id}-pace`}
              value={pace}
              checked={trip.pace === pace}
              onChange={() => update("pace", pace)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="grid size-5 place-items-center rounded-full border-2 border-muted-foreground/70 bg-card transition-colors peer-checked:border-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40 after:size-2 after:rounded-full after:bg-primary after:opacity-0 peer-checked:after:opacity-100"
            />
            {pace}
          </label>
        ))}
      </fieldset>

      {/* The combined bar */}
      <div className="mt-5 grid divide-y divide-input overflow-hidden rounded-xl border border-input bg-card shadow-sm lg:grid-cols-[minmax(0,2fr)_minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
        <div className="relative grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <Cell label="From" htmlFor={`${id}-from`}>
            <input
              id={`${id}-from`}
              className={bareInput}
              value={trip.from}
              onChange={(event) => update("from", event.target.value)}
              placeholder="City or airport"
              disabled={disabled}
              maxLength={60}
              autoComplete="off"
            />
          </Cell>

          <Cell label="To" htmlFor={`${id}-to`} className="lg:pl-8">
            <input
              id={`${id}-to`}
              className={bareInput}
              value={trip.to}
              onChange={(event) => {
                update("to", event.target.value)
                if (event.target.value.trim()) setMissingTo(false)
              }}
              placeholder="Tokyo, Goa, Dubai…"
              disabled={disabled}
              maxLength={60}
              autoComplete="off"
              autoFocus={!initial.to}
              required
              aria-invalid={missingTo || undefined}
              aria-describedby={missingTo ? `${id}-to-error` : undefined}
            />
          </Cell>

          <button
            type="button"
            aria-label="Swap origin and destination"
            disabled={disabled}
            onClick={() =>
              setTrip((current) => ({
                ...current,
                from: current.to,
                to: current.from,
              }))
            }
            className="absolute top-1/2 right-3 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none lg:right-auto lg:left-1/2 lg:-translate-x-1/2"
          >
            <ArrowLeftRight className="size-4 max-lg:rotate-90" aria-hidden />
          </button>
        </div>

        <Cell label="Departure" htmlFor={`${id}-date`}>
          <Popover open={dateOpen} onOpenChange={setDateOpen} modal={false}>
            <div className="flex items-center gap-1.5">
              <PopoverTrigger
                id={`${id}-date`}
                type="button"
                disabled={disabled}
                className={cn(
                  bareInput,
                  "flex items-center justify-between gap-2 text-left"
                )}
              >
                <span
                  className={cn(
                    "truncate",
                    !selectedDate && "font-normal text-muted-foreground"
                  )}
                >
                  {selectedDate ? formatTriggerDate(selectedDate) : "Pick a date"}
                </span>
                {!selectedDate && (
                  <CalendarIcon
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}
              </PopoverTrigger>

              {selectedDate && !disabled && (
                <button
                  type="button"
                  aria-label="Clear departure date"
                  onClick={() => update("startDate", "")}
                  className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              )}
            </div>

            <PopoverContent
              align="start"
              side="bottom"
              sideOffset={12}
              className="w-auto rounded-xl border border-border p-0 shadow-lg"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                defaultMonth={selectedDate ?? new Date()}
                disabled={{ before: startOfToday() }}
                className="p-3 [--cell-size:--spacing(9)]"
                onSelect={(day) => {
                  update("startDate", day ? formatLocalIso(day) : "")
                  setDateOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </Cell>

        <Cell label="Duration" htmlFor={`${id}-days`}>
          <Select
            modal={false}
            value={String(trip.days)}
            items={DAY_ITEMS}
            disabled={disabled}
            onValueChange={(value) => {
              if (value) update("days", Number(value))
            }}
          >
            <SelectTrigger
              id={`${id}-days`}
              className="h-auto w-full justify-between border-0 bg-transparent px-0 py-0 text-base font-medium shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent [&_svg]:size-4 [&_svg]:text-muted-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="start"
              side="bottom"
              sideOffset={12}
              alignItemWithTrigger={false}
              className="max-h-72 min-w-36 rounded-xl p-1 shadow-lg"
            >
              {DAY_ITEMS.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="min-h-8 rounded-lg px-2.5 py-1.5 text-sm"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Cell>

        <Cell label="Travellers" htmlFor={`${id}-people`}>
          <Select
            modal={false}
            value={String(trip.travellers)}
            items={TRAVELLER_ITEMS}
            disabled={disabled}
            onValueChange={(value) => {
              if (value) update("travellers", Number(value))
            }}
          >
            <SelectTrigger
              id={`${id}-people`}
              className="h-auto w-full justify-between border-0 bg-transparent px-0 py-0 text-base font-medium shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent [&_svg]:size-4 [&_svg]:text-muted-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="start"
              side="bottom"
              sideOffset={12}
              alignItemWithTrigger={false}
              className="max-h-72 min-w-36 rounded-xl p-1 shadow-lg"
            >
              {TRAVELLER_ITEMS.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  className="min-h-8 rounded-lg px-2.5 py-1.5 text-sm"
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Cell>
      </div>

      {missingTo && (
        <p
          id={`${id}-to-error`}
          role="alert"
          className="mt-2 flex items-center gap-2 text-sm font-medium text-destructive"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          Tell us where you are going to continue.
        </p>
      )}

      {/* Extras */}
      {moreOpen && (
        <div id={`${id}-more`} className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div className="space-y-1.5">
              <label
                htmlFor={`${id}-budget`}
                className="block text-sm font-medium"
              >
                Budget
              </label>
              <input
                id={`${id}-budget`}
                className={boxedInput}
                value={trip.budget}
                onChange={(event) => update("budget", event.target.value)}
                placeholder="₹1,50,000 in total"
                disabled={disabled}
                maxLength={40}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`${id}-notes`}
                className="block text-sm font-medium"
              >
                Anything else?
              </label>
              <input
                id={`${id}-notes`}
                className={boxedInput}
                value={trip.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Travelling with a toddler, vegetarian, prefer a slow pace…"
                disabled={disabled}
                maxLength={300}
                autoComplete="off"
              />
            </div>
          </div>

          <fieldset className="space-y-2" disabled={disabled}>
            <legend className="text-sm font-medium">Interests</legend>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const selected = trip.interests.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInterest(interest)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none disabled:opacity-60",
                      selected
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls={`${id}-more`}
          onClick={() => setMoreOpen((open) => !open)}
          className="inline-flex items-center gap-2 self-start rounded-md py-1 text-base font-medium focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          {moreOpen ? (
            <Minus className="size-4" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          {moreOpen
            ? "Hide budget, interests and notes"
            : "Add budget, interests and notes"}
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <p className="text-sm font-medium text-foreground/80 sm:max-w-52 sm:text-right">
            About a minute. You approve the draft first.
          </p>
          <Button
            type="submit"
            size="cta"
            disabled={disabled}
            className="sm:min-w-44"
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

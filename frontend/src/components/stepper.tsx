import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const STEPS = ["Plan", "Research", "Review", "Final plan"]

type StepperProps = {
  /** 0 = Plan, 1 = Research, 2 = Review, 3 = Final plan */
  current: number
}

/**
 * Where you are: Plan, Research, Review (your decision), Final plan.
 * Made for the dark trip band: it uses the band's text color throughout.
 */
export function Stepper({ current }: StepperProps) {
  return (
    <nav aria-label="Progress" className="print:hidden">
      {/* Small screens: one line and a bar, because four labels do not fit */}
      <div className="md:hidden">
        <p className="text-xs text-band-foreground/75">
          Step {current + 1} of {STEPS.length}:{" "}
          <span className="font-medium text-band-foreground">{STEPS[current]}</span>
        </p>
        <div className="mt-2 flex gap-1" aria-hidden>
          {STEPS.map((step, index) => (
            <span
              key={step}
              className={cn(
                "h-1 flex-1 rounded-full",
                index <= current ? "bg-band-foreground" : "bg-band-foreground/25"
              )}
            />
          ))}
        </div>
      </div>

      <ol className="hidden items-center md:flex">
        {STEPS.map((step, index) => {
          const done = index < current
          const active = index === current

          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={cn("flex items-center", index < STEPS.length - 1 && "flex-1")}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                    done && "border-band-foreground bg-band-foreground text-band",
                    active && "border-band-foreground ring-4 ring-band-foreground/20",
                    !done && !active && "border-band-foreground/40 text-band-foreground/70"
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-sm whitespace-nowrap",
                    active ? "font-medium" : "text-band-foreground/75"
                  )}
                >
                  {step}
                  {done && <span className="sr-only"> (done)</span>}
                </span>
              </span>

              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-4 h-px flex-1",
                    done ? "bg-band-foreground" : "bg-band-foreground/25"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

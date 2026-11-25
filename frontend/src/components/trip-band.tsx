import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"

import { Stepper } from "@/components/stepper"
import { cn } from "@/lib/utils"

type TripBandProps = {
  from: string
  to: string
  facts: string[]
  /** 0 = Plan, 1 = Research, 2 = Review, 3 = Final plan */
  step: number
  /** A small status pill next to the title, for example "Draft". */
  badge?: { label: string; tone: "draft" | "final" | "neutral" }
  actions?: ReactNode
}

const BADGE_TONE = {
  draft: "bg-amber-300 text-amber-950",
  final: "bg-emerald-300 text-emerald-950",
  neutral: "bg-band-foreground/20 text-band-foreground",
}

/** The dark header of a trip: route, facts, status and the stepper. Like a booking-flow header. */
export function TripBand({ from, to, facts, step, badge, actions }: TripBandProps) {
  return (
    <section className="bg-band text-band-foreground print:bg-white print:text-black">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1
                data-stage-heading
                tabIndex={-1}
                className="flex items-center gap-3 text-3xl font-light tracking-tight outline-none sm:text-4xl"
              >
                <span>{from.trim() || "Delhi"}</span>
                <ArrowRight className="size-6 shrink-0 text-band-foreground/70" aria-label="to" />
                <span>{to}</span>
              </h1>
              {badge && (
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase",
                    BADGE_TONE[badge.tone]
                  )}
                >
                  {badge.label}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-band-foreground/80 sm:text-base">{facts.join(" · ")}</p>
          </div>

          {actions && <div className="flex gap-2 print:hidden">{actions}</div>}
        </div>

        <div className="mt-6 border-t border-band-foreground/20 pt-5">
          <Stepper current={step} />
        </div>
      </div>
    </section>
  )
}

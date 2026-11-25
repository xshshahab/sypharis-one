import type { ReactNode } from "react"
import { BedDouble, CloudSun, Hand, Plane, Wallet } from "lucide-react"

import heroImage from "@/assets/hero.svg"

const HIGHLIGHTS = [
  { icon: Plane, label: "Flights" },
  { icon: BedDouble, label: "Hotels" },
  { icon: CloudSun, label: "Weather" },
  { icon: Wallet, label: "Budget check" },
  { icon: Hand, label: "You approve" },
]

/**
 * The big banner, with the search card inside it so the card is frosted glass over the artwork.
 * The artwork is src/assets/hero.svg: to use your own photo, drop an image into src/assets and
 * change the import above. The text sits on a dark navy base either way.
 */
export function Hero({ children }: { children?: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-band text-band-foreground print:hidden">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 -z-10 size-full object-cover object-[50%_70%]"
      />
      {/* A flat tint (not a gradient) keeps the headline readable on any artwork */}
      <div className="absolute inset-0 -z-10 bg-black/15" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 pt-16 pb-16 sm:pt-28 sm:pb-24">
        <h1
          data-stage-heading
          tabIndex={-1}
          className="max-w-3xl text-5xl font-light tracking-tight outline-none sm:text-7xl"
        >
          Plan your next trip
        </h1>
        <p className="mt-5 max-w-xl text-base text-band-foreground/85 sm:text-xl">
          Flights, hotels, weather and a budget, researched and drafted in about a minute. You approve the
          plan before it is final.
        </p>

        <ul className="mt-7 flex flex-wrap gap-2" aria-label="What you get">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-sm backdrop-blur-md"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        {children && <div className="mt-12 space-y-4 text-foreground sm:mt-16">{children}</div>}
      </div>
    </section>
  )
}

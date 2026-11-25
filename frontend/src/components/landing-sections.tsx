import type { ReactNode } from "react"
import { ArrowRight, BedDouble, CalendarDays, ChevronDown, CloudSun, Hand, Plane, ShieldCheck, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { POPULAR_TRIPS, type TripRequest } from "@/lib/trip"
import { cn } from "@/lib/utils"

function SectionHeading({ id, title, intro }: { id: string; title: string; intro?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 id={id} className="text-3xl font-light tracking-tight sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">{intro}</p>}
    </div>
  )
}

// ------------------------------------------------------------------- features

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <Plane className="size-6" />,
    title: "Flight guidance",
    text: "Likely airports, the airlines on the route, typical duration and booking advice. Guidance, not live fares.",
  },
  {
    icon: <BedDouble className="size-6" />,
    title: "Hotel options",
    text: "Places to stay found with a live web search, each with a link so you can read more.",
  },
  {
    icon: <CloudSun className="size-6" />,
    title: "Weather and forecast",
    text: "Current conditions and a short forecast for your destination, to help you pack.",
  },
  {
    icon: <Wallet className="size-6" />,
    title: "Budget check",
    text: "Whether the trip fits your budget, with estimated costs and where it could run over.",
  },
  {
    icon: <CalendarDays className="size-6" />,
    title: "Day-by-day itinerary",
    text: "A plan shaped by your pace, interests and who is travelling.",
  },
  {
    icon: <Hand className="size-6" />,
    title: "You approve first",
    text: "Read the draft, then approve it or ask for changes. Nothing is final until you decide.",
  },
]

export function Features() {
  return (
    <section aria-labelledby="features-heading" id="features" className="scroll-mt-24">
      <SectionHeading
        id="features-heading"
        title="Everything in one plan"
        intro="One request brings back the research and a draft itinerary, all in one place."
      />
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="surface p-6 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none">
            <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden>
              {feature.icon}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ------------------------------------------------------------------- how it works

const STEPS = [
  {
    title: "Tell us the trip",
    text: "Where you are going, when, for how long and with whom. Budget and interests are optional.",
  },
  {
    title: "We check and plan",
    text: "Your request is checked, and a supervisor picks only the research it needs.",
  },
  {
    title: "We research and draft",
    text: "Flights, hotels, weather and a budget check run, then an itinerary is drafted.",
  },
  {
    title: "You decide",
    text: "Read the draft with the research beside it. Approve it, or send notes and get a revised plan.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-24">
      <SectionHeading id="how-heading" title="How it works" intro="Four steps from an idea to a plan you have approved." />
      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="surface relative p-6">
            <span
              aria-hidden
              className="grid size-10 place-items-center rounded-full bg-primary text-base font-semibold text-primary-foreground"
            >
              {index + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ------------------------------------------------------------------- popular trips

export function PopularTrips({ onPick }: { onPick: (trip: TripRequest) => void }) {
  return (
    <section id="popular" aria-labelledby="popular-heading" className="scroll-mt-24">
      <SectionHeading
        id="popular-heading"
        title="Popular trips"
        intro="Pick one to fill in the form above, then change anything you like."
      />

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {POPULAR_TRIPS.map(({ city, note, tone, trip }) => (
          <li key={city}>
            <button
              type="button"
              onClick={() => onPick(trip)}
              className={cn(
                "group flex h-52 w-full flex-col justify-between rounded-2xl p-6 text-left text-white transition-transform hover:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                tone
              )}
            >
              <span>
                <span className="block text-3xl font-light tracking-tight">{city}</span>
                <span className="mt-1.5 block text-sm text-white/80">
                  {trip.from} · {note}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                Use this trip
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ------------------------------------------------------------------- safety

const CARE: { title: string; text: string }[] = [
  {
    title: "Only trips",
    text: "Requests that are not about travel, or that ask for something harmful, are stopped before anything runs.",
  },
  {
    title: "You stay in control",
    text: "The plan pauses for your approval. Check how your request was understood, then approve or ask for changes.",
  },
  {
    title: "Honest about gaps",
    text: "If a service is unavailable, the plan says so and uses general guidance. Fares are never invented.",
  },
]

export function Careful({ onArchitecture }: { onArchitecture: () => void }) {
  return (
    <section
      aria-labelledby="careful-heading"
      className="relative overflow-hidden rounded-3xl bg-band p-8 text-band-foreground sm:p-12"
    >
      <div className="flex max-w-2xl items-start gap-4">
        <ShieldCheck className="mt-1 size-8 shrink-0" aria-hidden />
        <div>
          <h2 id="careful-heading" className="text-3xl font-light tracking-tight sm:text-4xl">
            Built to be careful
          </h2>
          <p className="mt-3 text-base leading-relaxed text-band-foreground/80 sm:text-lg">
            A trip plan should be something you can trust and correct, so the planner is designed around checks.
          </p>
        </div>
      </div>

      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {CARE.map((item) => (
          <li key={item.title} className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-band-foreground/80">{item.text}</p>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onArchitecture}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        See how it works under the hood
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </section>
  )
}

// ------------------------------------------------------------------- faq

const FAQ: { q: string; a: string }[] = [
  {
    q: "Does Sypharis One book flights or hotels?",
    a: "No. It researches and plans. Flight information is guidance (airports, airlines, typical duration), not live fares, and hotel results link to other sites. Check prices and availability before you book.",
  },
  {
    q: "Why do I have to approve the plan?",
    a: "The first version is a draft. You can check how your request was understood and ask for changes before the final plan is written. Nothing is final until you decide.",
  },
  {
    q: "How long does it take?",
    a: "Usually one to two minutes in total. The AI service’s free plan limits how much text it can handle per minute, so busy moments take a little longer.",
  },
  {
    q: "What can I ask for?",
    a: "Anything about planning a trip: destinations, flights, hotels, weather, budgets and itineraries. Requests that are not about travel are blocked.",
  },
  {
    q: "Is the weather live?",
    a: "Yes. Current conditions and a short forecast come from OpenWeather. Forecast times are shown in UTC.",
  },
  {
    q: "What happens if a service is down?",
    a: "The plan tells you which parts are not live and uses general guidance for them.",
  },
]

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24">
      <SectionHeading id="faq-heading" title="Questions" intro="Short answers to what people ask first." />
      <div className="surface mt-10 divide-y">
        {FAQ.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-base font-medium focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown
                className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden
              />
            </summary>
            <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

// ------------------------------------------------------------------- closing call to action

export function ClosingCta({ onStart }: { onStart: () => void }) {
  return (
    <section
      aria-labelledby="cta-heading"
      className="surface flex flex-wrap items-center justify-between gap-6 p-8 sm:p-12"
    >
      <div className="max-w-xl">
        <h2 id="cta-heading" className="text-3xl font-light tracking-tight sm:text-4xl">
          Ready to plan your trip?
        </h2>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          It takes about a minute to get a draft you can read and approve.
        </p>
      </div>
      <Button size="cta" onClick={onStart}>
        Start planning
      </Button>
    </section>
  )
}

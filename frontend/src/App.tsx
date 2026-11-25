import { useEffect, useReducer, useRef } from "react"

import { ArchitecturePage } from "@/components/architecture-page"
import { BlockedNotice } from "@/components/blocked-notice"
import { DecisionPanel } from "@/components/decision-panel"
import { ResearchCards } from "@/components/evidence-cards"
import { Hero } from "@/components/hero"
import { Careful, ClosingCta, Faq, Features, HowItWorks, PopularTrips } from "@/components/landing-sections"
import { ErrorNotice, Notice } from "@/components/notice"
import { PlanView, type PlanTab } from "@/components/plan-view"
import { AnnouncementBar, SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TripBand } from "@/components/trip-band"
import { TripForm } from "@/components/trip-form"
import { Button } from "@/components/ui/button"
import { WorkingCard } from "@/components/working-card"
import { approveTrip, planTrip, type TripPlan } from "@/lib/api"
import { friendlyError, type FriendlyError } from "@/lib/errors"
import { goTo, scrollToId, useView, type View } from "@/lib/route"
import { loadSession, saveSession } from "@/lib/session"
import { buildMessage, EMPTY_TRIP, tripFacts, type TripRequest } from "@/lib/trip"

type Stage = "idle" | "planning" | "review" | "approving" | "final" | "blocked" | "error"

type State = {
  stage: Stage
  trip: TripRequest
  /** The first answer from the backend: the draft, waiting for a decision. */
  plan: TripPlan | null
  /** The answer after approving or asking for changes. */
  final: TripPlan | null
  error: FriendlyError | null
  pending: "approve" | "changes" | null
  /** Changing this remounts the form, so it picks up a new starting trip. */
  formKey: number
}

type Action =
  | { type: "submit"; trip: TripRequest }
  | { type: "planned"; plan: TripPlan }
  | { type: "plan-failed"; error: FriendlyError }
  | { type: "cancel-plan" }
  | { type: "decide"; pending: "approve" | "changes" }
  | { type: "decided"; final: TripPlan }
  | { type: "decide-failed"; error: FriendlyError }
  | { type: "cancel-decide" }
  | { type: "prefill"; trip: TripRequest }
  | { type: "reset" }

const BLANK: State = {
  stage: "idle",
  trip: EMPTY_TRIP,
  plan: null,
  final: null,
  error: null,
  pending: null,
  formKey: 0,
}

function initialState(): State {
  const saved = loadSession()
  if (!saved) return BLANK

  return {
    ...BLANK,
    stage: saved.stage,
    trip: { ...EMPTY_TRIP, ...saved.trip },
    plan: saved.plan,
    final: saved.final,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "submit":
      return { ...state, stage: "planning", trip: action.trip, plan: null, final: null, error: null, pending: null }

    case "planned": {
      const { plan } = action
      if (!plan.guardrail_allowed) return { ...state, stage: "blocked", plan, final: null, error: null }
      if (plan.requires_approval) return { ...state, stage: "review", plan, final: null, error: null }
      return { ...state, stage: "final", plan, final: plan, error: null }
    }

    case "plan-failed":
      return { ...state, stage: "error", error: action.error }

    case "cancel-plan":
      return { ...state, stage: "idle", formKey: state.formKey + 1 }

    case "decide":
      return { ...state, stage: "approving", pending: action.pending, error: null }

    case "decided":
      return { ...state, stage: "final", final: action.final, pending: null, error: null }

    case "decide-failed":
      return { ...state, stage: "review", pending: null, error: action.error }

    case "cancel-decide":
      return { ...state, stage: "review", pending: null }

    case "prefill":
      // Picking an example also clears a warning or error left over from the last try
      return {
        ...state,
        trip: action.trip,
        formKey: state.formKey + 1,
        stage: state.stage === "blocked" || state.stage === "error" ? "idle" : state.stage,
        error: null,
      }

    case "reset":
      return { ...BLANK, formKey: state.formKey + 1 }
  }
}

const DEFAULT_APPROVAL_TEXT =
  "Approve the draft to get the final plan, or ask for changes and you get a revised one."

function pageTitle(view: View, stage: Stage, to: string): string {
  const base = "Sypharis One"
  if (view === "architecture") return `How it works · ${base}`
  if (stage === "planning") return `Planning ${to} · ${base}`
  if (stage === "review" || stage === "approving") return `Review your ${to} plan · ${base}`
  if (stage === "final") return `${to} trip plan · ${base}`
  return `${base} · Trip planner`
}

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const view = useView()
  const controller = useRef<AbortController | null>(null)
  const firstRender = useRef(true)

  const { stage, trip, plan, final } = state
  const landing = stage === "idle" || stage === "blocked" || stage === "error"

  // Keep a draft you are reading across a refresh
  useEffect(() => {
    if (plan && (stage === "review" || stage === "approving" || stage === "final" || stage === "blocked")) {
      saveSession({
        stage: stage === "approving" ? "review" : stage,
        trip,
        plan,
        final: state.final,
      })
    } else {
      saveSession(null)
    }
  }, [stage, trip, plan, state.final])

  useEffect(() => {
    document.title = pageTitle(view, stage, trip.to)
  }, [view, stage, trip.to])

  // Switching between the planner and the Architecture page starts at the top of the page
  const viewChanged = useRef(false)
  useEffect(() => {
    if (!viewChanged.current) {
      viewChanged.current = true
      return
    }
    window.scrollTo({ top: 0 })
  }, [view])

  // Moving to a new screen: put focus on its heading so keyboard and screen reader users start there.
  // Review and "approving" are the same screen, so that change must not move focus.
  const screen = view === "architecture" ? "architecture" : stage === "approving" ? "review" : stage
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    document.querySelector<HTMLElement>("[data-stage-heading]")?.focus()
  }, [screen])

  async function handleSubmit(next: TripRequest) {
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current

    dispatch({ type: "submit", trip: next })

    try {
      dispatch({ type: "planned", plan: await planTrip(buildMessage(next), current.signal) })
    } catch (error) {
      if (current.signal.aborted) return
      dispatch({ type: "plan-failed", error: friendlyError(error) })
    }
  }

  async function handleDecision(approved: boolean, feedback: string) {
    if (!plan) return

    controller.current?.abort()
    const current = new AbortController()
    controller.current = current

    dispatch({ type: "decide", pending: approved ? "approve" : "changes" })

    try {
      const result = await approveTrip(plan.thread_id, approved, feedback, current.signal)
      dispatch({ type: "decided", final: result })
    } catch (error) {
      if (current.signal.aborted) return
      dispatch({ type: "decide-failed", error: friendlyError(error) })
    }
  }

  function cancelRequest() {
    controller.current?.abort()
    dispatch({ type: stage === "planning" ? "cancel-plan" : "cancel-decide" })
  }

  function startOver() {
    // A draft takes about a minute to make: do not throw one away by accident
    if (
      (stage === "review" || stage === "approving") &&
      !window.confirm("Discard this draft and start a new trip?")
    ) {
      return
    }
    controller.current?.abort()
    dispatch({ type: "reset" })
    window.scrollTo({ top: 0 })
  }

  function pickPopular(next: TripRequest) {
    dispatch({ type: "prefill", trip: next })
    // The form remounts on the next render, so wait for it before scrolling to it
    requestAnimationFrame(() => document.getElementById("plan")?.scrollIntoView({ block: "center" }))
  }

  // From the footer: go to the planner page if needed, then scroll to a section on it
  function goToSection(id: string) {
    if (view !== "planner") goTo("planner")
    setTimeout(() => {
      if (document.getElementById(id)) scrollToId(id)
      else window.scrollTo({ top: 0 })
    }, 60)
  }

  const facts = tripFacts(trip)

  let content
  if (landing) {
    content = (
      <>
        <Hero>
          <div id="plan" className="scroll-mt-24 space-y-4">
            {stage === "blocked" && plan && (
              <BlockedNotice reason={plan.guardrail_reason} onPick={pickPopular} />
            )}
            {stage === "error" && state.error && (
              <ErrorNotice
                error={state.error}
                actions={
                  <Button size="pill" onClick={() => handleSubmit(trip)}>
                    Try again
                  </Button>
                }
              />
            )}
            <TripForm key={state.formKey} initial={trip} onSubmit={handleSubmit} />
          </div>
        </Hero>

        <div className="mx-auto max-w-7xl space-y-24 px-4 py-20 sm:space-y-28 sm:py-28">
          <Features />
          <HowItWorks />
          <PopularTrips onPick={pickPopular} />
          <Careful onArchitecture={() => goTo("architecture")} />
          <Faq />
          <ClosingCta onStart={() => scrollToId("plan")} />
        </div>
      </>
    )
  } else if (stage === "planning") {
    content = (
      <>
        <TripBand
          from={trip.from}
          to={trip.to}
          facts={facts}
          step={1}
          badge={{ label: "Researching", tone: "neutral" }}
        />
        <div className="mx-auto max-w-2xl px-4 py-10">
          <WorkingCard
            title="Researching your trip"
            description="Your request is checked first, then the research runs and a draft is written."
            steps={[
              "The request is checked and the right research steps are chosen.",
              "Flights, hotels, weather and a budget check run, as needed.",
              "An itinerary draft is written for you to review.",
            ]}
            onCancel={cancelRequest}
          />
        </div>
      </>
    )
  } else if ((stage === "review" || stage === "approving") && plan) {
    content = (
      <>
        <TripBand
          from={trip.from}
          to={trip.to}
          facts={facts}
          step={2}
          badge={{ label: "Draft", tone: "draft" }}
        />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 pb-40 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:pb-12">
          <div className="min-w-0 space-y-4">
            <Notice tone="info" title="This is a draft">
              <p className="text-muted-foreground">
                Nothing is final until you approve it. Read it through, check how we read your request, then
                approve or ask for changes.
              </p>
            </Notice>
            <PlanView tabs={[{ id: "draft", label: "Draft itinerary", text: plan.answer }]} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] lg:overflow-y-auto lg:pr-1">
            <DecisionPanel
              busy={state.pending}
              error={state.error}
              description={plan.approval_request || DEFAULT_APPROVAL_TEXT}
              onApprove={() => handleDecision(true, "")}
              onRequestChanges={(feedback) => handleDecision(false, feedback)}
              onCancel={cancelRequest}
            />
            <ResearchCards plan={plan} />
          </aside>
        </div>
      </>
    )
  } else if (stage === "final" && final) {
    const tabs: PlanTab[] = [{ id: "final", label: "Final plan", text: final.answer }]
    const draft = final.itinerary || plan?.answer || ""
    if (final !== plan && draft.trim()) tabs.push({ id: "draft", label: "Draft", text: draft })

    content = (
      <>
        <TripBand
          from={trip.from}
          to={trip.to}
          facts={facts}
          step={3}
          badge={{ label: "Final plan", tone: "final" }}
        />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="min-w-0 space-y-4">
            {final.approved === false && final.human_feedback.trim() && (
              <Notice tone="info" title="Updated with your changes">
                <p className="text-muted-foreground">&ldquo;{final.human_feedback}&rdquo;</p>
              </Notice>
            )}
            <PlanView tabs={tabs} />
            <div className="print:hidden">
              <Button variant="outline" size="cta" onClick={startOver}>
                Plan another trip
              </Button>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:max-h-[calc(100svh-3rem)] lg:overflow-y-auto lg:pr-1">
            <ResearchCards plan={final} />
          </aside>
        </div>
      </>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <AnnouncementBar />
      <SiteHeader
        showLinks={view === "planner" && landing}
        showNewTrip={stage !== "idle"}
        view={view}
        onHome={view === "planner" ? startOver : () => goTo("planner")}
        onNewTrip={startOver}
        onNavigate={goTo}
      />
      <main className="flex-1">
        {view === "architecture" && <ArchitecturePage onStart={() => goTo("planner")} />}
        {/* Kept mounted but hidden on the Architecture page, so a half-filled form or a running plan is not lost */}
        <div hidden={view === "architecture"}>{content}</div>
      </main>
      <SiteFooter view={view} onNavigate={goTo} onGoToSection={goToSection} />
    </div>
  )
}

export default App

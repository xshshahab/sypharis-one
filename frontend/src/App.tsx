import { useEffect, useReducer, useRef } from "react"
import { ArrowRight, RotateCcw } from "lucide-react"
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router"

import { ArchitecturePage } from "@/components/architecture-page"
import { BlockedNotice } from "@/components/blocked-notice"
import { DecisionPanel } from "@/components/decision-panel"
import { ResearchSection, SidebarEvidence } from "@/components/evidence-cards"
import { Hero } from "@/components/hero"
import { Careful, ClosingCta, Faq, Features, HowItWorks, PopularTrips } from "@/components/landing-sections"
import { ErrorNotice, Notice } from "@/components/notice"
import { PlanView, type PlanTab } from "@/components/plan-view"
import { SiteFooter } from "@/components/site-footer"
import { AnnouncementBar, SiteHeader } from "@/components/site-header"
import { TripBand } from "@/components/trip-band"
import { TripForm } from "@/components/trip-form"
import { Button } from "@/components/ui/button"
import { WorkingCard } from "@/components/working-card"
import { approveTrip, planTrip, type TripPlan } from "@/lib/api"
import { friendlyError, type FriendlyError } from "@/lib/errors"
import { ROUTES, scrollToId } from "@/lib/route"
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
  "Review the generated draft itinerary. Approve it to create your final polished plan, or request changes with feedback."

function routeForStage(stage: Stage): string {
  if (stage === "planning") return ROUTES.planning
  if (stage === "review" || stage === "approving") return ROUTES.review
  if (stage === "final") return ROUTES.plan
  return ROUTES.home
}

function pageTitle(pathname: string, stage: Stage, to: string): string {
  const base = "Sypharis One"
  const dest = to.trim() || "your trip"
  if (pathname === ROUTES.architecture) return `How it works · ${base}`
  if (pathname === ROUTES.planning || stage === "planning") return `Planning ${dest} · ${base}`
  if (pathname === ROUTES.review) return `Review your ${dest} plan · ${base}`
  if (pathname === ROUTES.plan) return `${dest} trip plan · ${base}`
  return `${base} · Trip planner`
}

function quickLinksFor(plan: TripPlan) {
  const links = [{ id: "itinerary", label: "Itinerary" }]
  if (plan.budget_results.trim()) links.push({ id: "budget", label: "Budget" })
  if (plan.flight_results.trim()) links.push({ id: "flights", label: "Flights" })
  if (plan.hotel_results.trim()) links.push({ id: "hotels", label: "Hotels" })
  if (plan.weather_results.trim()) links.push({ id: "weather", label: "Weather" })
  return links
}

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const controller = useRef<AbortController | null>(null)
  const firstRender = useRef(true)
  const pendingScrollId = useRef<string | null>(null)

  const { stage, trip, plan, final } = state
  const plannerRoute = routeForStage(stage)

  // Keep a draft or final plan across page refreshes
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
    document.title = pageTitle(pathname, stage, trip.to)
  }, [pathname, stage, trip.to])

  // On route change: scroll to requested section or top of page, and move focus to the main heading
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }

    if (pendingScrollId.current) {
      const targetId = pendingScrollId.current
      pendingScrollId.current = null
      requestAnimationFrame(() => scrollToId(targetId))
    } else {
      window.scrollTo({ top: 0 })
    }

    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-stage-heading]")?.focus()
    })
  }, [pathname])

  async function handleSubmit(next: TripRequest) {
    controller.current?.abort()
    const current = new AbortController()
    controller.current = current

    dispatch({ type: "submit", trip: next })
    navigate(ROUTES.planning)

    try {
      const result = await planTrip(buildMessage(next), current.signal)
      dispatch({ type: "planned", plan: result })
      if (!result.guardrail_allowed) {
        pendingScrollId.current = "plan"
        navigate(ROUTES.home)
      } else if (result.requires_approval) {
        navigate(ROUTES.review)
      } else {
        navigate(ROUTES.plan)
      }
    } catch (error) {
      if (current.signal.aborted) return
      dispatch({ type: "plan-failed", error: friendlyError(error) })
      pendingScrollId.current = "plan"
      navigate(ROUTES.home)
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
      navigate(ROUTES.plan)
    } catch (error) {
      if (current.signal.aborted) return
      dispatch({ type: "decide-failed", error: friendlyError(error) })
    }
  }

  function cancelRequest() {
    controller.current?.abort()
    if (stage === "planning") {
      dispatch({ type: "cancel-plan" })
      navigate(ROUTES.home)
    } else {
      dispatch({ type: "cancel-decide" })
    }
  }

  function startOver() {
    if (
      (stage === "review" || stage === "approving") &&
      !window.confirm("Discard this draft and start a new trip?")
    ) {
      return
    }
    controller.current?.abort()
    dispatch({ type: "reset" })
    navigate(ROUTES.home)
    window.scrollTo({ top: 0 })
  }

  function pickPopular(next: TripRequest) {
    dispatch({ type: "prefill", trip: next })
    requestAnimationFrame(() => document.getElementById("plan")?.scrollIntoView({ block: "center" }))
  }

  function goToSection(id: string) {
    if (pathname !== ROUTES.home) {
      pendingScrollId.current = id
      navigate(ROUTES.home)
    } else if (document.getElementById(id)) {
      scrollToId(id)
    } else {
      window.scrollTo({ top: 0 })
    }
  }

  const facts = tripFacts(trip)

  const landingElement = (
    <>
      <Hero>
        <div id="plan" className="scroll-mt-24 space-y-4">
          {stage === "review" && plan && (
            <Notice
              tone="info"
              title={`You have a draft itinerary for ${trip.to || "your trip"}`}
              actions={
                <Link to={ROUTES.review}>
                  <Button size="pill" tabIndex={-1}>
                    Resume draft review
                    <ArrowRight aria-hidden />
                  </Button>
                </Link>
              }
            >
              <p className="text-muted-foreground">
                Return to your draft to approve it or request changes, or fill out the form below for a new trip.
              </p>
            </Notice>
          )}
          {stage === "final" && final && (
            <Notice
              tone="success"
              title={`Your ${trip.to || "trip"} plan is ready`}
              actions={
                <Link to={ROUTES.plan}>
                  <Button size="pill" tabIndex={-1}>
                    View final plan
                    <ArrowRight aria-hidden />
                  </Button>
                </Link>
              }
            >
              <p className="text-muted-foreground">
                Reopen your finalized itinerary and research breakdown anytime, or start a new search below.
              </p>
            </Notice>
          )}
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
        <Careful onArchitecture={() => navigate(ROUTES.architecture)} />
        <Faq />
        <ClosingCta onStart={() => scrollToId("plan")} />
      </div>
    </>
  )

  const planningElement =
    stage === "planning" ? (
      <>
        <TripBand
          from={trip.from}
          to={trip.to}
          facts={facts}
          step={1}
          badge={{ label: "Researching", tone: "neutral" }}
        />
        <div className="mx-auto max-w-2xl px-4 py-12">
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
    ) : (
      <Navigate to={plannerRoute} replace />
    )

  const reviewElement =
    (stage === "review" || stage === "approving") && plan ? (
      <>
        <TripBand
          from={trip.from}
          to={trip.to}
          facts={facts}
          step={2}
          badge={{ label: "Draft · Review", tone: "draft" }}
          quickLinks={quickLinksFor(plan)}
          onJump={scrollToId}
        />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 pb-36 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-8 lg:pb-14">
          <div className="min-w-0 space-y-6">
            <Notice tone="info" title="This is a draft — review before finalizing">
              <p className="text-muted-foreground">
                Nothing is final until you approve it. Check the day-by-day schedule, budget breakdown, and request
                summary, then approve or send revision notes.
              </p>
            </Notice>
            <PlanView tabs={[{ id: "draft", label: "Draft itinerary", text: plan.answer }]} badge="Draft" />
            <ResearchSection plan={plan} />
          </div>

          <aside className="space-y-5 lg:sticky lg:top-22">
            <DecisionPanel
              busy={state.pending}
              error={state.error}
              description={plan.approval_request || DEFAULT_APPROVAL_TEXT}
              onApprove={() => handleDecision(true, "")}
              onRequestChanges={(feedback) => handleDecision(false, feedback)}
              onCancel={cancelRequest}
            />
            <SidebarEvidence plan={plan} />
          </aside>
        </div>
      </>
    ) : (
      <Navigate to={stage === "final" ? ROUTES.plan : ROUTES.home} replace />
    )

  const finalElement = (() => {
    if (stage !== "final" || !final) {
      return <Navigate to={stage === "review" || stage === "approving" ? ROUTES.review : ROUTES.home} replace />
    }

    const tabs: PlanTab[] = [{ id: "final", label: "Final plan", text: final.answer }]
    const draft = final.itinerary || plan?.answer || ""
    if (final !== plan && draft.trim()) tabs.push({ id: "draft", label: "Original draft", text: draft })

    return (
      <>
        <TripBand
          from={trip.from}
          to={trip.to}
          facts={facts}
          step={3}
          badge={{ label: "Final plan", tone: "final" }}
          quickLinks={quickLinksFor(final)}
          onJump={scrollToId}
        />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 pb-14 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-8">
          <div className="min-w-0 space-y-6">
            {final.approved === false && final.human_feedback.trim() ? (
              <Notice tone="info" title="Updated with your changes">
                <p className="text-muted-foreground">&ldquo;{final.human_feedback}&rdquo;</p>
              </Notice>
            ) : (
              <Notice tone="success" title="Your final trip plan is ready">
                <p className="text-muted-foreground">
                  Approved and finalized. Copy or print your itinerary, and double-check live fares and availability
                  before booking.
                </p>
              </Notice>
            )}
            <PlanView tabs={tabs} />
            <ResearchSection plan={final} />
            <div className="print:hidden">
              <Button variant="outline" size="cta" onClick={startOver}>
                <RotateCcw aria-hidden />
                <span>Plan another trip</span>
              </Button>
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-22">
            <SidebarEvidence plan={final} />
          </aside>
        </div>
      </>
    )
  })()

  return (
    <div className="flex min-h-svh flex-col">
      <AnnouncementBar />
      <SiteHeader
        showNewTrip={stage !== "idle"}
        plannerRoute={plannerRoute}
        onNewTrip={startOver}
      />
      <main className="flex-1">
        <Routes>
          <Route path={ROUTES.home} element={landingElement} />
          <Route path={ROUTES.planning} element={planningElement} />
          <Route path={ROUTES.review} element={reviewElement} />
          <Route path={ROUTES.plan} element={finalElement} />
          <Route
            path={ROUTES.architecture}
            element={
              <ArchitecturePage
                onStart={() => {
                  pendingScrollId.current = "plan"
                  navigate(ROUTES.home)
                }}
              />
            }
          />
          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Routes>
      </main>
      <SiteFooter onGoToSection={goToSection} />
    </div>
  )
}

export default App

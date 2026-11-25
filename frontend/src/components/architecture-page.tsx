import type { ReactNode } from "react"
import {
  ArrowDown,
  ArrowRight,
  BedDouble,
  Bot,
  CloudSun,
  Cpu,
  Database,
  FileCheck2,
  FilePenLine,
  Gauge,
  GitBranch,
  Hand,
  Monitor,
  PauseCircle,
  Plane,
  Plug,
  Server,
  ShieldAlert,
  ShieldCheck,
  Wallet,
  Workflow,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { scrollToId } from "@/lib/route"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------- small building blocks

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <h2 id={`${id}-heading`} className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted-foreground">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Tag({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode
  tone?: "neutral" | "primary" | "amber" | "green" | "rose"
  className?: string
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    green: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    rose: "bg-rose-500/15 text-rose-800 dark:text-rose-200",
  }
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  )
}

function LayerLabel({ number, title, badge }: { number: string; title: string; badge: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          {number}
        </span>
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</span>
      </div>
      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{badge}</span>
    </div>
  )
}

function FlowConnector({ label, detail }: { label: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center py-2.5" aria-hidden>
      <div className="h-3 w-px bg-border" />
      <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs shadow-2xs">
        <ArrowDown className="size-3.5 text-primary" />
        <span className="font-medium text-foreground">{label}</span>
        {detail && <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">· {detail}</span>}
      </div>
      <div className="h-3 w-px bg-border" />
    </div>
  )
}

// ---------------------------------------------------------------- the system map

const SPECIALISTS = [
  { icon: Plane, label: "Flights", agent: "flight_agent", note: "Airports & routes" },
  { icon: BedDouble, label: "Hotels", agent: "hotel_agent", note: "Live web search" },
  { icon: CloudSun, label: "Weather", agent: "weather_agent", note: "Forecast & alerts" },
  { icon: Wallet, label: "Budget", agent: "budget_agent", note: "Cost feasibility" },
]

function SystemMap() {
  return (
    <figure className="surface overflow-hidden p-5 sm:p-8">
      {/* Diagram header & legend */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div>
          <p className="text-base font-semibold tracking-tight">End-to-End System Architecture</p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Follow a request from your browser, through the AI supervisor and specialist agents, to your final approval.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Diagram legend">
          <Tag tone="amber">Safety / Gate</Tag>
          <Tag tone="primary">AI Specialist</Tag>
          <Tag tone="neutral">Human Checkpoint</Tag>
          <Tag tone="green">Final Output</Tag>
        </div>
      </div>

      {/* LAYER 1: CLIENT */}
      <div className="rounded-2xl border border-border bg-muted/25 p-4 sm:p-5">
        <LayerLabel number="1" title="User Interface" badge="React 19 · TypeScript · React Router" />
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Monitor className="size-4 text-primary" aria-hidden />
              1. Trip Form
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Destination, dates, travellers, pace, and optional budget &amp; interests.
            </p>
          </div>

          <ArrowRight className="mx-auto hidden size-4 text-muted-foreground md:block" aria-hidden />

          <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <FilePenLine className="size-4 text-primary" aria-hidden />
              2. Draft Review
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Inspect the draft itinerary alongside live research, then approve or request changes.
            </p>
          </div>

          <ArrowRight className="mx-auto hidden size-4 text-muted-foreground md:block" aria-hidden />

          <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <FileCheck2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
              3. Final Plan
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Polished day-by-day plan with copy, print/PDF, and draft comparison.
            </p>
          </div>
        </div>
      </div>

      <FlowConnector label="HTTPS / JSON API" detail="POST /api/v1/travel · POST /api/v1/travel/approve" />

      {/* LAYER 2: API */}
      <div className="rounded-2xl border border-border bg-muted/25 p-4 sm:p-5">
        <LayerLabel number="2" title="API Gateway" badge="FastAPI · Port 8000" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Server className="size-4 text-primary" aria-hidden />
              Request Validation
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Validates incoming payloads with Pydantic and enforces strict CORS origins for the frontend.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Cpu className="size-4 text-primary" aria-hidden />
              Non-Blocking Workers
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Runs multi-agent research in worker threads so health checks and other requests stay responsive.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <GitBranch className="size-4 text-primary" aria-hidden />
              Session Threading
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Issues a unique <code className="rounded bg-muted px-1 font-mono">thread_id</code> so paused drafts can resume seamlessly.
            </p>
          </div>
        </div>
      </div>

      <FlowConnector label="Orchestration Entry" detail="run_travel_agent() · resume_travel_agent()" />

      {/* LAYER 3: LANGGRAPH WORKFLOW + POSTGRES */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.03] p-4 sm:p-6">
        <LayerLabel number="3" title="AI Agent Workflow & State Memory" badge="LangGraph · Shared TravelState" />

        <div className="space-y-4">
          {/* Step A: Supervisor + Guardrail Branch */}
          <div className="grid gap-3 lg:grid-cols-[1.35fr_auto_1fr] lg:items-center">
            <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="size-4 text-amber-600 dark:text-amber-300" aria-hidden />
                  Supervisor &amp; Safety Guardrail
                </p>
                <span className="rounded bg-background/70 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  supervisor
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                First verifies the request is genuinely about travel. Then extracts destination, budget, and style, and
                selects <strong className="font-medium text-foreground">only the specialists needed</strong>.
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="hidden size-4 lg:block" aria-hidden />
              <span className="rounded-full border border-rose-300/60 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                If not travel →
              </span>
            </div>

            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-rose-900 dark:text-rose-200">
                  <ShieldAlert className="size-4 text-rose-600 dark:text-rose-300" aria-hidden />
                  Blocked Early
                </p>
                <span className="rounded bg-background/70 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  guardrail_blocked
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Stops immediately and returns the reason to the user. Zero tools or specialist agents run.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <ArrowDown className="size-3.5" aria-hidden />
              If valid travel request: run selected specialists
            </span>
          </div>

          {/* Step B: Specialist Pipeline + Draft */}
          <div className="rounded-xl border border-dashed border-primary/35 bg-card/80 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
                <Bot className="size-4" aria-hidden />
                Dynamic Specialist Research Pipeline
              </p>
              <span className="text-xs text-muted-foreground">Skipped automatically if not needed</span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              {SPECIALISTS.map(({ icon: Icon, label, agent, note }) => (
                <div key={agent} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <Icon className="size-3.5 text-primary" aria-hidden />
                    {label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
                  <p className="mt-1.5 font-mono text-[10px] text-primary/80">{agent}</p>
                </div>
              ))}

              <div className="rounded-lg border border-border bg-muted/60 p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Workflow className="size-3.5 text-foreground" aria-hidden />
                  Draft Writer
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Combines all findings</p>
                <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">itinerary_agent</p>
              </div>
            </div>
          </div>

          {/* Step C: Human Pause <-> PostgreSQL -> Final Plan */}
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <div className="flex flex-col justify-between rounded-xl border-2 border-primary bg-primary p-4 text-primary-foreground shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <PauseCircle className="size-4" aria-hidden />
                    Human Review Checkpoint
                  </p>
                  <span className="rounded bg-primary-foreground/15 px-1.5 py-0.5 font-mono text-[11px]">
                    human_approval
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-primary-foreground/85">
                  The workflow <strong>pauses here</strong> via LangGraph <code className="rounded bg-primary-foreground/15 px-1">interrupt()</code> and sends the draft back to your screen. It resumes only when you approve or request changes.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 py-2 text-xs">
                <Database className="size-4 shrink-0" aria-hidden />
                <span>
                  Saved in <strong>PostgreSQL (Render)</strong> by <code className="font-mono">thread_id</code>
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
              <ArrowRight className="hidden size-4 text-primary lg:block" aria-hidden />
              <ArrowDown className="size-4 text-primary lg:hidden" aria-hidden />
              <span className="text-center font-medium text-foreground">Approve or Revise</span>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-emerald-400/50 bg-emerald-500/10 p-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    <FileCheck2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    Final Polish Agent
                  </p>
                  <span className="rounded bg-background/70 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    final_agent
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Applies your approval or revision notes, formats the complete 7-section itinerary, and stores the
                  finished plan in the checkpoint so reopening the thread never re-runs the AI.
                </p>
              </div>
              <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Returned to browser as the Final Plan
              </p>
            </div>
          </div>
        </div>
      </div>

      <FlowConnector label="Standardized Tool & Model Layer" detail="Model Context Protocol (MCP) · Groq Inference" />

      {/* LAYER 4: TOOLS & LLM */}
      <div className="rounded-2xl border border-border bg-muted/25 p-4 sm:p-5">
        <LayerLabel number="4" title="External Tools, LLM & Observability" badge="MCP Servers · Groq · LangSmith" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Plug className="size-4 text-primary" aria-hidden />
              AviationStack MCP
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Flight schedules, airports, and airline data. Launched locally via <code className="rounded bg-muted px-1">uvx</code>.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Plug className="size-4 text-primary" aria-hidden />
              Tavily MCP
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Live web search for hotels, stays, and neighborhood options over HTTP.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Plug className="size-4 text-primary" aria-hidden />
              Weather MCP
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Custom MCP server built for this project using live OpenWeather forecasts.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-3.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Gauge className="size-4 text-primary" aria-hidden />
              Groq (gpt-oss-120b)
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Powers reasoning and writing across every agent (<code className="rounded bg-muted px-1">temp = 0</code>, low effort).
            </p>
          </div>
        </div>
      </div>

      <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-4 text-xs text-muted-foreground">
        <span>
          Agents never call third-party APIs directly — all external tools go through the MCP client and read/write one
          shared state.
        </span>
        <span className="font-medium text-foreground">Traced end-to-end in LangSmith</span>
      </figcaption>
    </figure>
  )
}

// ---------------------------------------------------------------- content

const LIFECYCLE: { title: string; text: string }[] = [
  {
    title: "You submit the trip form",
    text: "The app turns it into one sentence, such as “Plan a 5 day trip from Delhi to Dubai for 2 travellers with hotels…”, and sends it to POST /api/v1/travel.",
  },
  {
    title: "The input guardrail checks it",
    text: "The first model call decides whether the request is about travel. If not, the run ends and the reason is shown to you. Nothing else runs.",
  },
  {
    title: "The supervisor plans the work",
    text: "A second model call picks the specialists the request needs and pulls out the trip details (destination, dates, budget, style). If its reply cannot be read, every specialist runs instead.",
  },
  {
    title: "The specialists research",
    text: "Flights, hotels, weather and a budget check run one after another, only the chosen ones. If a tool fails, the agent leaves a note and the plan uses general advice, instead of failing.",
  },
  {
    title: "A draft itinerary is written",
    text: "The itinerary step combines everything found so far into a draft.",
  },
  {
    title: "The run pauses for you",
    text: "The graph stops at human_approval. Its state is saved in PostgreSQL, and the API returns the draft with requires_approval set to true. You see the draft beside the research.",
  },
  {
    title: "You decide",
    text: "Approve, or ask for changes with notes (notes are required). The app calls POST /api/v1/travel/approve with the same thread_id.",
  },
  {
    title: "The final plan is written",
    text: "The final step applies your decision and feedback and returns the finished plan. The draft stays available beside it so you can compare.",
  },
]

const AGENTS: { name: string; does: string; uses: string; tone: "primary" | "amber" | "green" | "neutral" }[] = [
  {
    name: "supervisor",
    does: "Checks the request (input guardrail), chooses the specialists, extracts the trip details.",
    uses: "LLM, 2 calls",
    tone: "amber",
  },
  {
    name: "guardrail_blocked",
    does: "Ends the run with the reason when a request is blocked.",
    uses: "No tools",
    tone: "neutral",
  },
  {
    name: "flight_agent",
    does: "Gets airport and airline data, then asks the LLM for flight guidance.",
    uses: "AviationStack MCP + LLM",
    tone: "primary",
  },
  { name: "hotel_agent", does: "Searches the web for hotels matching the request.", uses: "Tavily MCP", tone: "primary" },
  {
    name: "weather_agent",
    does: "Current weather and a short forecast for the destination.",
    uses: "Weather MCP (ours)",
    tone: "primary",
  },
  {
    name: "budget_agent",
    does: "Checks whether the trip fits the budget, from the results so far.",
    uses: "LLM",
    tone: "primary",
  },
  { name: "itinerary_agent", does: "Writes the draft itinerary.", uses: "LLM", tone: "neutral" },
  {
    name: "human_approval",
    does: "Pauses the run until you approve or ask for changes.",
    uses: "LangGraph interrupt + PostgreSQL",
    tone: "amber",
  },
  { name: "final_agent", does: "Writes the final plan and applies your feedback.", uses: "LLM", tone: "green" },
]

const DECISIONS: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <Workflow className="size-5" />,
    title: "A supervisor instead of a fixed line",
    text: "Only the research a request needs runs. A flights-only question skips hotels, weather and budget, which saves time and model calls.",
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: "A guardrail on the way in",
    text: "Requests that are not about travel stop at the front door. It fails open: if the guardrail’s reply cannot be read, the request is allowed, so a formatting glitch never blocks real trips.",
  },
  {
    icon: <Hand className="size-5" />,
    title: "A human decides before it is final",
    text: "The pause is stored in the database, not in server memory. You can read the draft, check how your request was understood, and send notes.",
  },
  {
    icon: <Plug className="size-5" />,
    title: "Tools through MCP",
    text: "Flights, hotels and weather sit behind one standard interface. A tool can be replaced or reused without changing the agents.",
  },
  {
    icon: <Gauge className="size-5" />,
    title: "Built for a free-tier model",
    text: "The free Groq plan allows 8,000 tokens per minute, so results are trimmed before each prompt, reasoning effort is low, and the client waits out rate limits. A full plan takes about two minutes.",
  },
  {
    icon: <Server className="size-5" />,
    title: "Long jobs run off the main thread",
    text: "The plan and approve endpoints are plain functions that FastAPI runs in worker threads, so the health check keeps answering during a two-minute run.",
  },
]

const ENDPOINTS: { method: string; path: string; text: string }[] = [
  {
    method: "POST",
    path: "/api/v1/travel",
    text: "Start a plan. Returns the draft and the research, with requires_approval true, or a blocked result with the reason.",
  },
  {
    method: "POST",
    path: "/api/v1/travel/approve",
    text: "Send your decision (thread_id, approved, feedback). Returns the final plan. Rejecting needs feedback.",
  },
  { method: "GET", path: "/api/v1/health", text: "Returns status ok." },
]

const LIMITS: string[] = [
  "The flight agent asks AviationStack for airport and airline lists, which the current plan does not allow. When that happens the model is told so, but its flight guidance is general, not live data.",
  "The free model plan limits tokens per minute, so a plan takes about two minutes and a very long request can be rejected.",
  "The guardrail checks the request on the way in only. The model’s answers are not checked, and an unreadable guardrail reply lets the request through.",
  "The weather city comes from simple text matching, so a destination outside its built-in lists skips the weather step.",
  "There is no sign-in or rate limiting: anyone holding a thread_id can approve or resume that plan.",
]

const STACK: [string, string][] = [
  ["Agents", "LangGraph, LangChain"],
  ["Language model", "Groq, openai/gpt-oss-120b"],
  ["Tools", "MCP servers: AviationStack, Tavily, a weather server of our own"],
  ["API", "FastAPI, Uvicorn"],
  ["Storage", "PostgreSQL on Render (LangGraph checkpoints)"],
  ["Tracing", "LangSmith, to follow each run and its model calls"],
  ["Frontend", "React 19, TypeScript, React Router, Vite, Tailwind CSS 4"],
  ["Packaging", "Docker Compose, nginx"],
]

// ---------------------------------------------------------------- history

const COMPARE: { row: string; p1: string; p2: string; p3: string }[] = [
  { row: "Flow", p1: "Fixed line of 4 steps", p2: "Fixed line of 5 steps", p3: "Supervisor picks the steps" },
  { row: "Tools", p1: "Python functions", p2: "MCP servers", p3: "MCP servers" },
  { row: "Weather", p1: "No", p2: "Yes", p3: "Yes" },
  { row: "Budget check", p1: "No", p2: "No", p3: "Yes" },
  { row: "Input guardrail", p1: "No", p2: "No", p3: "Yes" },
  { row: "Human approval", p1: "No", p2: "No", p3: "Yes, the run pauses" },
  { row: "Model", p1: "gpt-oss-120b", p2: "llama-3.3-70b (no longer available on this key)", p3: "gpt-oss-120b" },
]

function PhaseCard({
  phase,
  title,
  points,
  where,
}: {
  phase: string
  title: string
  points: string[]
  where: string
}) {
  return (
    <article className="surface p-6">
      <Tag>{phase}</Tag>
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-current" />
            {point}
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{where}</p>
    </article>
  )
}

const SECTIONS = [
  { id: "system", label: "System map" },
  { id: "journey", label: "One request" },
  { id: "agents", label: "The steps" },
  { id: "decisions", label: "Design choices" },
  { id: "api", label: "API and stack" },
  { id: "limits", label: "Known limits" },
  { id: "history", label: "Earlier phases" },
]

// ---------------------------------------------------------------- the page

export function ArchitecturePage({ onStart }: { onStart: () => void }) {
  return (
    <>
      <section className="bg-band text-band-foreground print:bg-white print:text-black">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-8 sm:pt-14">
          <div className="flex flex-wrap items-center gap-3">
            <Tag className="bg-emerald-300 font-semibold text-emerald-950">Final version · Phase 3</Tag>
          </div>
          <h1
            data-stage-heading
            tabIndex={-1}
            className="mt-4 max-w-3xl text-4xl font-light tracking-tight outline-none sm:text-5xl"
          >
            How Sypharis One works
          </h1>
          <p className="mt-4 max-w-3xl text-base text-band-foreground/85 sm:text-lg">
            A supervisor checks your request and picks the research it needs. Specialist agents gather flights,
            hotels, weather and a budget check, an itinerary is drafted, and the run <strong>pauses for your approval</strong>{" "}
            before the final plan is written.
          </p>

          <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToId(section.id)}
                className="rounded-full border border-band-foreground/30 px-4 py-1.5 text-sm transition-colors hover:bg-band-foreground/10 focus-visible:ring-3 focus-visible:ring-band-foreground/50 focus-visible:outline-none"
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12">
        {/* at a glance */}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="At a glance">
          {[
            ["9", "steps in the graph, sharing one state"],
            ["3", "MCP servers: flights, hotels, weather"],
            ["1", "pause, where you approve or ask for changes"],
            ["6", "model calls for a full plan (measured)"],
          ].map(([value, label]) => (
            <li key={label} className="surface p-5">
              <p className="text-4xl font-light tabular-nums">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </li>
          ))}
        </ul>

        <Section
          id="system"
          title="System design"
          intro="Four clear layers from the browser to external tools and persistent memory — built so every decision is inspectable and human-approved."
        >
          <SystemMap />
        </Section>

        <Section
          id="journey"
          title="One request, start to finish"
          intro="Two API calls make up a plan. The first stops at your review, the second finishes it."
        >
          <ol className="grid gap-4 md:grid-cols-2">
            {LIFECYCLE.map((step, index) => (
              <li key={step.title} className="surface flex gap-4 p-5">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="agents"
          title="The steps"
          intro="Nine steps. Five call the language model, three use MCP tools (flights does both), and two make no outside calls."
        >
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <caption className="sr-only">Each step, what it does and what it uses</caption>
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase">
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Step
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    What it does
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Uses
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {AGENTS.map((agent) => (
                  <tr key={agent.name} className="transition-colors hover:bg-muted/30">
                    <th scope="row" className="px-5 py-3.5 align-top font-mono text-[0.8125rem] font-medium">
                      {agent.name}
                    </th>
                    <td className="px-5 py-3.5 align-top text-muted-foreground">{agent.does}</td>
                    <td className="px-5 py-3.5 align-top">
                      <Tag tone={agent.tone}>{agent.uses}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="decisions" title="Why it is built this way">
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DECISIONS.map((decision) => (
              <li key={decision.title} className="surface p-5">
                <span className="text-primary" aria-hidden>
                  {decision.icon}
                </span>
                <h3 className="mt-3 font-semibold">{decision.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{decision.text}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="api" title="API and stack">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface p-5 sm:p-6">
              <h3 className="font-semibold">Endpoints</h3>
              <ul className="mt-4 divide-y">
                {ENDPOINTS.map((endpoint) => (
                  <li key={endpoint.path} className="py-3 first:pt-0 last:pb-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <Tag tone={endpoint.method === "GET" ? "neutral" : "primary"}>{endpoint.method}</Tag>
                      <code className="font-mono text-sm">{endpoint.path}</code>
                    </p>
                    <p className="mt-1.5 text-sm text-muted-foreground">{endpoint.text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface p-5 sm:p-6">
              <h3 className="font-semibold">Stack</h3>
              <dl className="mt-4 divide-y text-sm">
                {STACK.map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2.5 first:pt-0 last:pb-0">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Section>

        <Section id="limits" title="Known limits" intro="What this version does not do yet, so nothing here surprises you.">
          <ul className="surface divide-y">
            {LIMITS.map((limit) => (
              <li key={limit} className="flex gap-3 px-5 py-4 text-sm leading-relaxed">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
                {limit}
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="history"
          title="How it got here"
          intro="The same app was built in three phases. The final version is above. The two earlier ones are kept for comparison."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <PhaseCard
              phase="Phase 2"
              title="Tools moved to MCP"
              points={[
                "The agents stopped calling Python functions and called MCP servers through one client.",
                "A weather agent was added with a weather server written for this project.",
                "The flow was still a fixed line: flight, hotel, weather, itinerary, final.",
                "No guardrail, no budget check and no approval step.",
              ]}
              where="Archived in backend/backup/agent_with_mcp.py and on the phase/withmcp branch."
            />
            <PhaseCard
              phase="Phase 1"
              title="Multi-agent planner, no MCP"
              points={[
                "Four agents in a fixed line: flight, hotel, itinerary, final.",
                "Tools were plain Python functions, with rule-based route parsing for flights.",
                "State was saved in PostgreSQL so a conversation could continue.",
                "No weather, no supervisor and no approval step.",
              ]}
              where="Archived in backend/backup/ and on the phase/withoutmcp branch."
            />
          </div>

          <div className="surface mt-6 overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <caption className="sr-only">Phase 1, Phase 2 and the final version compared</caption>
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase">
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    &nbsp;
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Phase 1
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium">
                    Phase 2
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-medium text-primary">
                    Final version
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {COMPARE.map((row) => (
                  <tr key={row.row} className="transition-colors hover:bg-muted/30">
                    <th scope="row" className="px-5 py-3.5 align-top font-medium">
                      {row.row}
                    </th>
                    <td className="px-5 py-3.5 align-top text-muted-foreground">{row.p1}</td>
                    <td className="px-5 py-3.5 align-top text-muted-foreground">{row.p2}</td>
                    <td className="px-5 py-3.5 align-top font-medium">{row.p3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <div className="surface flex flex-wrap items-center justify-between gap-4 p-6 print:hidden">
          <div>
            <p className="text-lg font-semibold">Ready to try it?</p>
            <p className="text-sm text-muted-foreground">Plan a trip and watch these steps run.</p>
          </div>
          <Button size="cta" onClick={onStart}>
            Plan a trip
          </Button>
        </div>
      </div>
    </>
  )
}

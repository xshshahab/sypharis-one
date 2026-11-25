import type { ReactNode } from "react"
import {
  ArrowDown,
  ArrowRight,
  Database,
  Gauge,
  Hand,
  Monitor,
  Plug,
  Server,
  ShieldCheck,
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
      <h2 id={`${id}-heading`} className="text-2xl font-light tracking-tight">
        {title}
      </h2>
      {intro && <p className="mt-2 max-w-3xl text-base leading-relaxed text-muted-foreground">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "primary" | "amber" | "green" }) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
    green: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
  }
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone])}>{children}</span>
}

function DownArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
      <ArrowDown className="size-4" aria-hidden />
      <span>{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------- the system map

type FlowStep = { name: string; note: string; kind: "guard" | "specialist" | "draft" | "pause" | "final" }

const FLOW: FlowStep[] = [
  { name: "supervisor", note: "guardrail + routing", kind: "guard" },
  { name: "flight_agent", note: "flights", kind: "specialist" },
  { name: "hotel_agent", note: "hotels", kind: "specialist" },
  { name: "weather_agent", note: "weather", kind: "specialist" },
  { name: "budget_agent", note: "budget check", kind: "specialist" },
  { name: "itinerary_agent", note: "draft plan", kind: "draft" },
  { name: "human_approval", note: "pauses for you", kind: "pause" },
  { name: "final_agent", note: "final plan", kind: "final" },
]

const FLOW_STYLE: Record<FlowStep["kind"], string> = {
  guard: "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10",
  specialist: "border-primary/25 bg-primary/5",
  draft: "border-border bg-muted",
  pause: "border-primary bg-primary text-primary-foreground",
  final: "border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10",
}

function Box({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary" aria-hidden>
          {icon}
        </span>
        {title}
      </p>
      <div className="mt-1.5 text-sm text-muted-foreground">{children}</div>
    </div>
  )
}

function SystemMap() {
  return (
    <figure className="surface p-5 sm:p-8">
      <Box icon={<Monitor className="size-4" />} title="Browser: the React app">
        Trip form, the draft review screen with your decision, and the final plan.
      </Box>

      <DownArrow label="POST /api/v1/travel  ·  POST /api/v1/travel/approve" />

      <Box icon={<Server className="size-4" />} title="FastAPI backend (port 8000)">
        Validates the request, runs the agent in a worker thread, answers with JSON. CORS allows only your frontend.
      </Box>

      <DownArrow label="run_travel_agent()  ·  resume_travel_agent()" />

      <div className="rounded-xl border-2 border-primary/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Workflow className="size-4 text-primary" aria-hidden />
            LangGraph: one shared state, nine steps
          </p>
          <Tag tone="primary">backend.py + agents/</Tag>
        </div>

        <ol className="mt-4 flex flex-wrap items-stretch gap-x-1 gap-y-2" aria-label="Order of the steps">
          {FLOW.map((step, index) => (
            <li key={step.name} className="flex items-center gap-1">
              <span className={cn("rounded-lg border px-3 py-2 text-sm leading-tight", FLOW_STYLE[step.kind])}>
                <span className="block font-medium">{step.name}</span>
                <span className={cn("block text-xs", step.kind === "pause" ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {step.note}
                </span>
              </span>
              {index < FLOW.length - 1 && <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
            </li>
          ))}
        </ol>

        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          <li>
            <strong className="font-medium text-foreground">Only the specialists the supervisor picked run.</strong> The
            itinerary step is always included.
          </li>
          <li>
            <strong className="font-medium text-foreground">If the guardrail blocks the request,</strong> the run goes to{" "}
            <code className="rounded bg-muted px-1 text-xs">guardrail_blocked</code> and ends there with the reason.
          </li>
          <li>
            <strong className="font-medium text-foreground">At human_approval the run stops</strong> and waits. It
            continues only when you approve or ask for changes.
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm">
          <Database className="size-4 shrink-0 text-primary" aria-hidden />
          <p className="min-w-0 flex-1">
            <strong className="font-medium">PostgreSQL (Render)</strong> stores the state after every step under a{" "}
            <code className="rounded bg-card px-1 text-xs">thread_id</code>. That is how the run can pause and later resume.
          </p>
        </div>
      </div>

      <DownArrow label="tools through MCP, and the language model" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Box icon={<Plug className="size-4" />} title="AviationStack MCP">
          Flights. Started with <code className="rounded bg-muted px-1 text-xs">uvx</code>.
        </Box>
        <Box icon={<Plug className="size-4" />} title="Tavily MCP">
          Hotel search. A remote server over HTTP.
        </Box>
        <Box icon={<Plug className="size-4" />} title="Weather MCP">
          Our own server, using OpenWeather.
        </Box>
        <Box icon={<Gauge className="size-4" />} title="Groq: gpt-oss-120b">
          Every LLM step. Low reasoning effort, temperature 0.
        </Box>
      </div>

      <figcaption className="mt-5 border-t pt-4 text-xs text-muted-foreground">
        Agents never call the APIs directly. Tools go through the MCP client, and every step reads and writes the same
        shared state. Runs are traced in LangSmith.
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
  ["Frontend", "React 19, TypeScript, Vite, Tailwind CSS 4"],
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
            <Tag tone="green">Final version · Phase 3</Tag>
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
          title="The system"
          intro="Four layers: the browser, the API, the agent graph, and the tools and model it uses. The database sits beside the graph and remembers where each plan is."
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

        <Section id="agents" title="The steps" intro="Nine steps. Five call the language model, three use MCP tools (flights does both), and two make no outside calls.">
          <div className="surface overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <caption className="sr-only">Each step, what it does and what it uses</caption>
              <thead>
                <tr className="border-b text-xs text-muted-foreground uppercase">
                  <th scope="col" className="px-5 py-3 font-medium">
                    Step
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    What it does
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Uses
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {AGENTS.map((agent) => (
                  <tr key={agent.name}>
                    <th scope="row" className="px-5 py-3 align-top font-mono text-[0.8125rem] font-medium">
                      {agent.name}
                    </th>
                    <td className="px-5 py-3 align-top text-muted-foreground">{agent.does}</td>
                    <td className="px-5 py-3 align-top">
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
                <tr className="border-b text-xs text-muted-foreground uppercase">
                  <th scope="col" className="px-5 py-3 font-medium">
                    &nbsp;
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Phase 1
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Phase 2
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium text-primary">
                    Final version
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {COMPARE.map((row) => (
                  <tr key={row.row}>
                    <th scope="row" className="px-5 py-3 align-top font-medium">
                      {row.row}
                    </th>
                    <td className="px-5 py-3 align-top text-muted-foreground">{row.p1}</td>
                    <td className="px-5 py-3 align-top text-muted-foreground">{row.p2}</td>
                    <td className="px-5 py-3 align-top font-medium">{row.p3}</td>
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

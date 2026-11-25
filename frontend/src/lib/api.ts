// Base URL of the FastAPI backend. Override with VITE_API_URL in frontend/.env
const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "")

const TRAVEL_URL = `${API_URL}/api/v1/travel`
const APPROVE_URL = `${TRAVEL_URL}/approve`

// The agents call several services and an LLM, and the free Groq plan limits tokens per
// minute, so one request can take a couple of minutes.
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000

/** What the supervisor understood from the request. Any field can be empty. */
export type TripConstraints = {
  destination?: string
  origin?: string
  duration?: string
  budget?: string
  travel_style?: string
  special_preferences?: string[]
}

/** The backend's answer to both "start a plan" and "approve / request changes". */
export type TripPlan = {
  thread_id: string
  /** The draft while requires_approval is true, the final plan afterwards. */
  answer: string
  requires_approval: boolean
  approval_request: string
  /** The draft itinerary (kept after approval so the two can be compared). */
  itinerary: string
  flight_results: string
  hotel_results: string
  weather_results: string
  budget_results: string
  selected_agents: string[]
  trip_constraints: TripConstraints
  supervisor_reasoning: string
  guardrail_allowed: boolean
  guardrail_reason: string
  approved: boolean | null
  human_feedback: string
  llm_calls: number
}

/** A failure we can explain to the user. `kind` tells network problems from server errors. */
export class ApiError extends Error {
  kind: "network" | "timeout" | "server"

  constructor(message: string, kind: ApiError["kind"] = "server") {
    super(message)
    this.kind = kind
  }
}

function toPlan(body: Partial<TripPlan>): TripPlan {
  return {
    thread_id: body.thread_id ?? "",
    answer: body.answer ?? "",
    requires_approval: body.requires_approval ?? false,
    approval_request: body.approval_request ?? "",
    itinerary: body.itinerary ?? "",
    flight_results: body.flight_results ?? "",
    hotel_results: body.hotel_results ?? "",
    weather_results: body.weather_results ?? "",
    budget_results: body.budget_results ?? "",
    selected_agents: body.selected_agents ?? [],
    trip_constraints: body.trip_constraints ?? {},
    supervisor_reasoning: body.supervisor_reasoning ?? "",
    guardrail_allowed: body.guardrail_allowed ?? true,
    guardrail_reason: body.guardrail_reason ?? "",
    approved: body.approved ?? null,
    human_feedback: body.human_feedback ?? "",
    llm_calls: body.llm_calls ?? 0,
  }
}

async function postJson(
  url: string,
  payload: unknown,
  signal?: AbortSignal
): Promise<TripPlan> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (error) {
    if (signal?.aborted) throw error // cancelled by the user
    if (timeout.aborted) {
      throw new ApiError("The request took too long. Please try again.", "timeout")
    }
    throw new ApiError(
      `Can't reach the server at ${API_URL}. Is the backend running?`,
      "network"
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new ApiError(`Unexpected response from the server (${response.status}).`)
  }

  const body = data as { success?: boolean; error?: unknown; detail?: unknown } & Partial<TripPlan>

  if (!response.ok || !body.success) {
    // FastAPI validation errors arrive as { detail: [...] }, ours as { error: "..." }
    const message =
      typeof body.error === "string"
        ? body.error
        : body.detail
          ? "The request was not valid."
          : `Request failed (${response.status}).`
    throw new ApiError(message)
  }

  return toPlan(body)
}

/** Starts a new plan. The backend pauses at the approval step and returns the draft. */
export function planTrip(message: string, signal?: AbortSignal): Promise<TripPlan> {
  return postJson(TRAVEL_URL, { message, thread_id: null }, signal)
}

/** Approves the draft (or asks for changes) and returns the final plan. */
export function approveTrip(
  threadId: string,
  approved: boolean,
  feedback: string,
  signal?: AbortSignal
): Promise<TripPlan> {
  return postJson(APPROVE_URL, { thread_id: threadId, approved, feedback }, signal)
}

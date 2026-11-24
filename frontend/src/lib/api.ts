// Base URL of the FastAPI backend. Override with VITE_API_URL in frontend/.env
const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "")

const TRAVEL_URL = `${API_URL}/api/v1/travel`

// The agent calls flights, search and an LLM, so a request can take a while.
const REQUEST_TIMEOUT_MS = 3 * 60 * 1000

export type TripPlan = {
  thread_id: string
  answer: string
  flight_results: string
  hotel_results: string
  itinerary: string
  llm_calls: number
}

export class ApiError extends Error {}

/** Sends a trip request to the backend and returns the full plan. */
export async function planTrip(
  message: string,
  threadId: string | null,
  signal?: AbortSignal
): Promise<TripPlan> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(TRAVEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, thread_id: threadId }),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (error) {
    if (signal?.aborted) throw error // cancelled by the user
    if (timeout.aborted) {
      throw new ApiError("The request took too long. Please try again.")
    }
    throw new ApiError(
      `Can't reach the server at ${API_URL}. Is the backend running?`
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new ApiError(`Unexpected response from the server (${response.status}).`)
  }

  const body = data as { success?: boolean; error?: string } & Partial<TripPlan>

  if (!response.ok || !body.success) {
    throw new ApiError(body.error ?? `Request failed (${response.status}).`)
  }

  return {
    thread_id: body.thread_id ?? "",
    answer: body.answer ?? "",
    flight_results: body.flight_results ?? "",
    hotel_results: body.hotel_results ?? "",
    itinerary: body.itinerary ?? "",
    llm_calls: body.llm_calls ?? 0,
  }
}

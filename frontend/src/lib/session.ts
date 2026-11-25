import type { TripPlan } from "@/lib/api"
import type { TripRequest } from "@/lib/trip"

// A plan waits in the database for approval, but the draft itself only lives in the page.
// Keeping it in sessionStorage means a refresh does not lose a draft you are still reading.
const KEY = "sypharis.session.v1"

export type SavedSession = {
  stage: "review" | "final" | "blocked"
  trip: TripRequest
  plan: TripPlan
  final: TripPlan | null
}

export function saveSession(session: SavedSession | null) {
  try {
    if (session) sessionStorage.setItem(KEY, JSON.stringify(session))
    else sessionStorage.removeItem(KEY)
  } catch {
    // storage can be unavailable (private mode, quota): the app still works without it
  }
}

export function loadSession(): SavedSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null

    const data = JSON.parse(raw) as SavedSession
    const validStage = data.stage === "review" || data.stage === "final" || data.stage === "blocked"

    if (!validStage || !data.trip || typeof data.plan?.thread_id !== "string") return null
    return data
  } catch {
    return null
  }
}

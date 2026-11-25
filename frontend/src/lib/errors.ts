import { ApiError } from "@/lib/api"

export type FriendlyError = {
  title: string
  hint: string
  /** The raw message, shown under "Technical details". */
  detail: string
}

/**
 * Turns what the backend or Groq says into something a traveller can act on.
 * The original text is always kept as `detail`.
 */
export function friendlyError(error: unknown): FriendlyError {
  const detail = error instanceof Error ? error.message : String(error)

  if (error instanceof ApiError && error.kind === "network") {
    return {
      title: "Can't reach the server",
      hint: "Check that the backend is running, then try again.",
      detail,
    }
  }

  if (error instanceof ApiError && error.kind === "timeout") {
    return {
      title: "This is taking too long",
      hint: "The AI service may be busy. Try again in a minute.",
      detail,
    }
  }

  if (/request too large|\b413\b/i.test(detail)) {
    return {
      title: "That request was too big for the AI model",
      hint: "Try again with fewer notes, or wait a minute.",
      detail,
    }
  }

  if (/rate.?limit|\b429\b|tokens per (minute|day)/i.test(detail)) {
    return {
      title: "The AI service is busy",
      hint: "The free plan limits how much text can be processed per minute. Wait a minute and try again.",
      detail,
    }
  }

  if (/model_not_found|does not exist or you do not have access/i.test(detail)) {
    return {
      title: "The AI model isn't available",
      hint: "The model set for the backend isn't enabled for your Groq key.",
      detail,
    }
  }

  if (/no saved travel plan/i.test(detail)) {
    return {
      title: "This plan is no longer saved",
      hint: "Start a new plan to continue.",
      detail,
    }
  }

  return {
    title: "Something went wrong",
    hint: "Try again. If it keeps happening, the details below may help.",
    detail,
  }
}

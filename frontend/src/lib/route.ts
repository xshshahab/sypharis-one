export const ROUTES = {
  home: "/",
  planning: "/planning",
  review: "/review",
  plan: "/plan",
  architecture: "/architecture",
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

/** Smooth scrolling, unless the user asked for less motion. */
export function scrollToId(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
}

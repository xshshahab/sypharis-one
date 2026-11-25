import { useEffect, useState } from "react"

// Two pages, no router library: the Architecture page lives at "#/architecture".
// Everything else (including the in-page anchors like "#plan") is the planner.
export type View = "planner" | "architecture"

const ARCHITECTURE_HASH = "#/architecture"

function currentView(): View {
  return window.location.hash === ARCHITECTURE_HASH ? "architecture" : "planner"
}

export function useView(): View {
  const [view, setView] = useState<View>(currentView)

  useEffect(() => {
    const update = () => setView(currentView())
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])

  return view
}

export function goTo(view: View) {
  // An empty hash leaves "#" in the address bar, which is fine and keeps back/forward working
  window.location.hash = view === "architecture" ? ARCHITECTURE_HASH : ""
}

/** Smooth scrolling, unless the user asked for less motion. */
export function scrollToId(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
}

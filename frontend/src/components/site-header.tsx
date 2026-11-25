import { useState } from "react"
import { Link, useLocation } from "react-router"
import { Info, Network, Plane, RotateCcw, X } from "lucide-react"

import logo from "@/assets/SypharisOne.webp"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { ROUTES, scrollToId } from "@/lib/route"

const NOTICE_KEY = "sypharis.notice.dismissed"

/** The thin notice bar above the nav. Dismissed for the rest of the browser session. */
export function AnnouncementBar() {
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(NOTICE_KEY) !== "1"
    } catch {
      return true
    }
  })

  if (!visible) return null

  function dismiss() {
    setVisible(false)
    try {
      sessionStorage.setItem(NOTICE_KEY, "1")
    } catch {
      // not worth failing over
    }
  }

  return (
    <div className="border-t-2 border-t-primary border-b bg-card print:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 text-sm">
        <Info className="size-4.5 shrink-0 fill-primary text-primary-foreground" aria-hidden />
        <p className="min-w-0 flex-1 text-xs sm:text-sm">
          Flight guidance is advice, not live fares. Confirm prices and availability before you book.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss this notice"
          className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

const NAV_LINKS = [
  { id: "plan", label: "Plan a trip" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "popular", label: "Popular trips" },
  { id: "faq", label: "FAQ" },
]

type SiteHeaderProps = {
  /** Whether a trip is active (planning, draft review, or final plan) so "New trip" should appear. */
  showNewTrip: boolean
  /** Route to return to when leaving /architecture for the planner. */
  plannerRoute: string
  onNewTrip: () => void
}

export function SiteHeader({ showNewTrip, plannerRoute, onNewTrip }: SiteHeaderProps) {
  const { pathname } = useLocation()
  const isHome = pathname === ROUTES.home
  const isArchitecture = pathname === ROUTES.architecture

  return (
    <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 md:gap-8">
        <Link
          to={isArchitecture ? plannerRoute : ROUTES.home}
          onClick={() => {
            if (isHome) window.scrollTo({ top: 0, behavior: "smooth" })
          }}
          aria-label="Sypharis One, home"
          className="flex items-center gap-3 rounded-md focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <img
            src={logo}
            alt=""
            className="h-11 w-auto sm:h-12 mix-blend-multiply dark:invert dark:mix-blend-screen"
          />
          <span className="text-lg font-semibold tracking-tight whitespace-nowrap sm:text-xl">Sypharis One</span>
        </Link>

        {isHome && (
          <nav aria-label="Page sections" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(event) => {
                  event.preventDefault()
                  scrollToId(link.id)
                }}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {!isArchitecture && showNewTrip && (
            <Button variant="outline" size="pill" onClick={onNewTrip}>
              <RotateCcw aria-hidden />
              <span className="max-sm:sr-only">New trip</span>
            </Button>
          )}

          {isArchitecture ? (
            <Link to={plannerRoute}>
              <Button variant="default" size="pill" tabIndex={-1}>
                <Plane aria-hidden />
                <span className="max-sm:sr-only">{plannerRoute === ROUTES.home ? "Plan a trip" : "Back to trip"}</span>
              </Button>
            </Link>
          ) : (
            <Link to={ROUTES.architecture}>
              <Button variant="default" size="pill" tabIndex={-1}>
                <Network aria-hidden />
                <span className="max-sm:sr-only">Architecture</span>
              </Button>
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

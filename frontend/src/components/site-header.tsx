import { useState } from "react"
import { Info, Network, Plane, RotateCcw, X } from "lucide-react"

import logo from "@/assets/SypharisOne.webp"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import type { View } from "@/lib/route"

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
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 text-sm">
        <Info className="size-5 shrink-0 fill-primary text-primary-foreground" aria-hidden />
        <p className="min-w-0 flex-1">
          Flight guidance is advice, not live fares. Confirm prices and availability before you book.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss this notice"
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}

const NAV_LINKS = [
  { href: "#plan", label: "Plan a trip" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#popular", label: "Popular trips" },
  { href: "#faq", label: "FAQ" },
]

type SiteHeaderProps = {
  /** The page links only make sense on the landing page, where those sections exist. */
  showLinks: boolean
  showNewTrip: boolean
  /** Which page is open: the header offers the other one. */
  view: View
  onHome: () => void
  onNewTrip: () => void
  onNavigate: (view: View) => void
}

export function SiteHeader({ showLinks, showNewTrip, view, onHome, onNewTrip, onNavigate }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:gap-8">
        <button
          type="button"
          onClick={onHome}
          aria-label="Sypharis One, home"
          className="flex items-center gap-2.5 rounded-md focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <img
            src={logo}
            alt=""
            className="h-8 w-auto mix-blend-multiply dark:invert dark:mix-blend-screen"
          />
          <span className="text-lg font-semibold tracking-tight whitespace-nowrap">Sypharis One</span>
        </button>

        {showLinks && (
          <nav aria-label="Page sections" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-base text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {view === "planner" && showNewTrip && (
            <Button variant="outline" size="pill" onClick={onNewTrip}>
              <RotateCcw aria-hidden />
              <span className="max-sm:sr-only">New trip</span>
            </Button>
          )}

          {view === "planner" ? (
            <Button variant="default" size="pill" onClick={() => onNavigate("architecture")}>
              <Network aria-hidden />
              <span className="max-sm:sr-only">Architecture</span>
            </Button>
          ) : (
            <Button variant="default" size="pill" onClick={() => onNavigate("planner")}>
              <Plane aria-hidden />
              <span className="max-sm:sr-only">Plan a trip</span>
            </Button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

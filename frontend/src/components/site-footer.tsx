import type { ReactNode } from "react"
import { Link, useLocation } from "react-router"
import { ArrowUpRight, GitBranch, Globe, Mail } from "lucide-react"

import logo from "@/assets/SypharisOne.webp"
import { LinkedInIcon, XIcon } from "@/components/social-icons"
import { ROUTES } from "@/lib/route"

const AUTHOR = "Md Shahabuddin"

const CONTACT: { label: string; hint: string; href: string; icon: ReactNode; external: boolean }[] = [
  {
    label: "LinkedIn",
    hint: "mdshahabuddin82",
    href: "https://www.linkedin.com/in/mdshahabuddin82/",
    icon: <LinkedInIcon className="size-5" />,
    external: true,
  },
  {
    label: "X (Twitter)",
    hint: "@imdshahab82",
    href: "https://x.com/imdshahab82",
    icon: <XIcon className="size-5" />,
    external: true,
  },
  {
    label: "GitHub",
    hint: "xshshahab",
    href: "https://github.com/xshshahab?tab=repositories",
    icon: <GitBranch className="size-5" aria-hidden />,
    external: true,
  },
  {
    label: "Website",
    hint: "shahabuddin.in",
    href: "https://shahabuddin.in/",
    icon: <Globe className="size-5" aria-hidden />,
    external: true,
  },
  {
    label: "Email",
    hint: "work.mdshahabuddin@gmail.com",
    href: "mailto:work.mdshahabuddin@gmail.com",
    icon: <Mail className="size-5" aria-hidden />,
    external: false,
  },
]

type SiteFooterProps = {
  /** Navigates to the planner page if needed and scrolls to a landing section. */
  onGoToSection: (id: string) => void
}

const linkClass =
  "rounded-sm text-band-foreground/75 transition-colors hover:text-band-foreground focus-visible:ring-3 focus-visible:ring-band-foreground/50 focus-visible:outline-none"

export function SiteFooter({ onGoToSection }: SiteFooterProps) {
  const { pathname } = useLocation()

  return (
    <footer className="bg-band text-band-foreground print:hidden">
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1.3fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-11 w-auto sm:h-12 invert mix-blend-screen" />
              <span className="text-lg font-semibold tracking-tight sm:text-xl">Sypharis One</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-band-foreground/75">
              An AI trip planner. A supervisor picks the research, specialist agents gather flights, hotels, weather
              and a budget, and you approve the plan before it is final.
            </p>
          </div>

          <nav aria-label="Explore">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Explore</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <button type="button" className={linkClass} onClick={() => onGoToSection("plan")}>
                  Plan a trip
                </button>
              </li>
              <li>
                <button type="button" className={linkClass} onClick={() => onGoToSection("features")}>
                  Features
                </button>
              </li>
              <li>
                <button type="button" className={linkClass} onClick={() => onGoToSection("faq")}>
                  FAQ
                </button>
              </li>
              <li>
                <Link
                  to={ROUTES.architecture}
                  className={linkClass}
                  aria-current={pathname === ROUTES.architecture ? "page" : undefined}
                >
                  Architecture
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold tracking-wide uppercase">Get in touch</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {CONTACT.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-center gap-3 rounded-lg py-0.5 focus-visible:ring-3 focus-visible:ring-band-foreground/50 focus-visible:outline-none"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/25 text-band-foreground/90 transition-colors group-hover:bg-white/10">
                      {item.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 font-medium">
                        {item.label}
                        {item.external && (
                          <>
                            <ArrowUpRight className="size-3.5 opacity-60" aria-hidden />
                            <span className="sr-only">(opens in a new tab)</span>
                          </>
                        )}
                      </span>
                      <span className="block truncate text-band-foreground/65">{item.hint}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/15 pt-6 text-sm text-band-foreground/65 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Sypharis One. Built by {AUTHOR}.
          </p>
          <p>Plans are written by AI from live searches. Check details before you book.</p>
        </div>
      </div>
    </footer>
  )
}

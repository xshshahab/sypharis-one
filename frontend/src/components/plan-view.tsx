import { useId, useState } from "react"
import { Check, Copy, FileText, Printer } from "lucide-react"

import { Markdown } from "@/components/markdown"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type PlanTab = { id: string; label: string; text: string }

/** The plan itself, as a readable document. With several tabs (final plan, draft) you can compare them. */
export function PlanView({ tabs, badge }: { tabs: PlanTab[]; badge?: string }) {
  const [activeId, setActiveId] = useState(tabs[0].id)
  const [copied, setCopied] = useState(false)
  const id = useId()

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  async function copyText() {
    try {
      await navigator.clipboard.writeText(active.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be refused (for example on plain http): nothing useful to show
    }
  }

  return (
    <section id="itinerary" aria-label="Itinerary document" className="min-w-0 scroll-mt-24">
      <div className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/35 px-5 py-3.5 sm:px-8 print:hidden">
          {tabs.length > 1 ? (
            <div role="tablist" aria-label="Plan versions" className="flex items-center gap-1.5">
              {tabs.map((tab) => {
                const selected = tab.id === active.id
                return (
                  <button
                    key={tab.id}
                    id={`${id}-tab-${tab.id}`}
                    role="tab"
                    type="button"
                    aria-selected={selected}
                    aria-controls={`${id}-panel`}
                    onClick={() => setActiveId(tab.id)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                      selected
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <FileText className="size-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold tracking-tight sm:text-base">{active.label}</h2>
              {badge && (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                  {badge}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="pill" onClick={copyText} className="h-8 px-3 text-xs">
              {copied ? <Check className="text-emerald-600 dark:text-emerald-400" aria-hidden /> : <Copy aria-hidden />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
            <Button variant="outline" size="pill" onClick={() => window.print()} className="h-8 px-3 text-xs">
              <Printer aria-hidden />
              <span>Print</span>
            </Button>
          </div>
        </div>

        <article
          id={`${id}-panel`}
          role={tabs.length > 1 ? "tabpanel" : undefined}
          aria-labelledby={tabs.length > 1 ? `${id}-tab-${active.id}` : undefined}
          className="p-6 sm:p-9 lg:p-10"
        >
          {active.text.trim() ? (
            <Markdown>{active.text}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to show here.</p>
          )}
        </article>
      </div>
    </section>
  )
}

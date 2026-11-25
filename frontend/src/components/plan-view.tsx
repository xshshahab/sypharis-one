import { useId, useState } from "react"
import { Check, Copy, Printer } from "lucide-react"

import { Markdown } from "@/components/markdown"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type PlanTab = { id: string; label: string; text: string }

/** The plan itself, as a readable document. With several tabs (final plan, draft) you can compare them. */
export function PlanView({ tabs }: { tabs: PlanTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0].id)
  const [copied, setCopied] = useState(false)
  const id = useId()

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0]

  async function copyText() {
    try {
      await navigator.clipboard.writeText(active.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard access can be refused (for example on plain http): nothing useful to show
    }
  }

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-end justify-between gap-3 print:hidden">
        {tabs.length > 1 ? (
          <div role="tablist" aria-label="Plan versions" className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`${id}-tab-${tab.id}`}
                role="tab"
                aria-selected={tab.id === active.id}
                aria-controls={`${id}-panel`}
                onClick={() => setActiveId(tab.id)}
                className={cn(
                  "-mb-px rounded-sm border-b-2 pb-2 text-base transition-colors focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                  tab.id === active.id
                    ? "border-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <h2 className="text-base font-semibold">{active.label}</h2>
        )}

        <div className="flex gap-1 pb-1">
          <Button variant="ghost" size="pill" onClick={copyText}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="pill" onClick={() => window.print()}>
            <Printer aria-hidden />
            Print
          </Button>
        </div>
      </div>

      <article
        id={`${id}-panel`}
        role={tabs.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={tabs.length > 1 ? `${id}-tab-${active.id}` : undefined}
        className="surface p-6 sm:p-9"
      >
        {active.text.trim() ? (
          <Markdown>{active.text}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing to show here.</p>
        )}
      </article>
    </section>
  )
}

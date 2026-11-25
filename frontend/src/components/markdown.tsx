import { Children, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

/**
 * The model likes emoji in headings ("1️⃣ Trip Summary", "✈️ Flights"). They look noisy next to
 * the rest of the page, so they are removed from headings only. "1️⃣" becomes "1.".
 */
function cleanHeadingText(text: string): string {
  return text
    .replace(/(\d)️?⃣/gu, "$1.")
    .replace(/[\p{Extended_Pictographic}️‍]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trimStart()
}

function cleanHeading(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" ? cleanHeadingText(child) : child
  )
}

type MarkdownProps = {
  children: string
  /** "card" is the compact style for side panels, "document" the roomy one for the plan. */
  variant?: "card" | "document"
}

/** Renders markdown from the agents (headings, lists, tables, links). */
export function Markdown({ children, variant = "document" }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose max-w-none dark:prose-invert",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-a:text-primary prose-a:underline-offset-2",
        "prose-hr:my-6 prose-th:text-left prose-td:align-top",
        variant === "document" ? "prose-base" : "prose-sm"
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children: c }) => <h1>{cleanHeading(c)}</h1>,
          h2: ({ children: c }) => <h2>{cleanHeading(c)}</h2>,
          h3: ({ children: c }) => <h3>{cleanHeading(c)}</h3>,
          h4: ({ children: c }) => <h4>{cleanHeading(c)}</h4>,
          // Wide tables scroll sideways instead of breaking the page layout
          table: ({ children: c }) => (
            <div className="my-4 overflow-x-auto rounded-md border">
              <table className="my-0">{c}</table>
            </div>
          ),
          // Open links in a new tab, safely
          a: ({ href, children: c }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {c}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

import { Children, Fragment, isValidElement, cloneElement, type ReactElement, type ReactNode } from "react"
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

/** Models often emit `<br>` inside Markdown table cells; convert them into real line breaks. */
function renderLineBreaks(children: ReactNode): ReactNode {
  return Children.map(children, (child, index) => {
    if (typeof child === "string") {
      if (!/<br\s*\/?>/i.test(child)) return child
      const parts = child.split(/<br\s*\/?>/gi)
      return (
        <Fragment key={index}>
          {parts.map((part, partIndex) => (
            <Fragment key={partIndex}>
              {partIndex > 0 && <br />}
              {part}
            </Fragment>
          ))}
        </Fragment>
      )
    }

    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children !== undefined) {
      return cloneElement(child as ReactElement<{ children?: ReactNode }>, {
        children: renderLineBreaks(child.props.children),
      })
    }

    return child
  })
}

type MarkdownProps = {
  children: string
  /** "card" is the compact style for side/research panels, "document" the roomy one for the plan. */
  variant?: "card" | "document"
}

/** Renders markdown from the agents (headings, lists, tables, links) with crisp editorial styling. */
export function Markdown({ children, variant = "document" }: MarkdownProps) {
  const isDoc = variant === "document"

  return (
    <div
      className={cn(
        "prose max-w-none dark:prose-invert",
        "prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-p:leading-relaxed prose-p:text-foreground/90",
        "prose-strong:font-semibold prose-strong:text-foreground",
        "prose-li:leading-relaxed prose-li:text-foreground/90 prose-li:marker:text-primary/70",
        "prose-a:font-medium prose-a:text-primary prose-a:underline-offset-3 hover:prose-a:underline",
        "prose-hr:my-7 prose-hr:border-border/80",
        "prose-blockquote:border-l-primary/50 prose-blockquote:bg-muted/40 prose-blockquote:py-1 prose-blockquote:pr-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic",
        isDoc
          ? "prose-base prose-h1:text-2xl prose-h1:font-semibold sm:prose-h1:text-[1.65rem] prose-h2:mt-8 prose-h2:border-b prose-h2:border-border/70 prose-h2:pb-2.5 prose-h2:text-lg prose-h2:tracking-normal prose-h3:mt-6 prose-h3:text-base"
          : "prose-sm prose-h1:text-base prose-h2:mt-5 prose-h2:text-sm prose-h3:mt-4 prose-h3:text-sm"
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children: c }) => <h1>{cleanHeading(c)}</h1>,
          h2: ({ children: c }) => <h2>{cleanHeading(c)}</h2>,
          h3: ({ children: c }) => <h3>{cleanHeading(c)}</h3>,
          h4: ({ children: c }) => <h4>{cleanHeading(c)}</h4>,
          p: ({ children: c }) => <p>{renderLineBreaks(c)}</p>,
          li: ({ children: c }) => <li>{renderLineBreaks(c)}</li>,
          // Clean fenced code blocks without inner highlight strips
          pre: ({ children: c }) => (
            <pre className="not-prose my-4 overflow-x-auto rounded-xl border border-border bg-muted/55 p-4 font-mono text-[13px] leading-relaxed text-foreground [&>code]:rounded-none [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">
              {c}
            </pre>
          ),
          // `not-prose` prevents @tailwindcss/typography from stripping left/right cell padding
          table: ({ children: c }) => (
            <div className="not-prose my-5 overflow-x-auto rounded-xl border border-border bg-muted/20">
              <table className="min-w-full border-collapse text-left text-sm">{c}</table>
            </div>
          ),
          thead: ({ children: c }) => (
            <thead className="border-b border-border bg-muted/65 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {c}
            </thead>
          ),
          tbody: ({ children: c }) => <tbody className="divide-y divide-border/70 bg-card/40">{c}</tbody>,
          tr: ({ children: c }) => <tr className="transition-colors hover:bg-muted/35">{c}</tr>,
          th: ({ children: c }) => (
            <th className="min-w-24 px-4 py-3 align-bottom font-semibold first:min-w-16">
              {renderLineBreaks(c)}
            </th>
          ),
          td: ({ children: c }) => (
            <td className="px-4 py-3.5 align-top leading-relaxed text-foreground/90 tabular-nums">
              {renderLineBreaks(c)}
            </td>
          ),
          code: ({ children: c, className }) => (
            <code
              className={cn(
                "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-foreground before:content-none after:content-none",
                className
              )}
            >
              {c}
            </code>
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

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/** Renders markdown from the agent (headings, lists, tables, links). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-headings:font-semibold prose-a:text-primary prose-table:text-xs">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Open links in a new tab, safely
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

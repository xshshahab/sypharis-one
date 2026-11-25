import type { ReactNode } from "react"
import { AlertCircle, Info, ShieldAlert } from "lucide-react"

import type { FriendlyError } from "@/lib/errors"
import { cn } from "@/lib/utils"

const TONES = {
  error: { border: "border-l-destructive", icon: AlertCircle, iconClass: "text-destructive", role: "alert" },
  warning: { border: "border-l-amber-500", icon: ShieldAlert, iconClass: "text-amber-600 dark:text-amber-400", role: "alert" },
  info: { border: "border-l-primary", icon: Info, iconClass: "text-primary", role: "status" },
} as const

type NoticeProps = {
  tone: keyof typeof TONES
  title: string
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

/** A message with a coloured edge: something went wrong, was blocked, or is worth knowing. */
export function Notice({ tone, title, children, actions, className }: NoticeProps) {
  const { border, icon: Icon, iconClass, role } = TONES[tone]

  return (
    <div role={role} className={cn("surface flex gap-3 border-l-4 p-4 sm:p-5", border, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconClass)} aria-hidden />
      <div className="min-w-0 flex-1 space-y-2 text-sm">
        <p className="text-base font-semibold">{title}</p>
        {children}
        {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
      </div>
    </div>
  )
}

/** A friendly error with the raw message tucked under "Technical details". */
export function ErrorNotice({
  error,
  actions,
  className,
}: {
  error: FriendlyError
  actions?: ReactNode
  className?: string
}) {
  return (
    <Notice tone="error" title={error.title} actions={actions} className={className}>
      <p className="text-muted-foreground">{error.hint}</p>
      {error.detail && (
        <details>
          <summary className="cursor-pointer rounded-md text-muted-foreground underline-offset-2 hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none">
            Technical details
          </summary>
          <p className="mt-2 rounded-md bg-muted p-2 font-mono text-xs break-words whitespace-pre-wrap">
            {error.detail}
          </p>
        </details>
      )}
    </Notice>
  )
}

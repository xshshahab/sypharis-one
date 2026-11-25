// Lucide has no brand icons, so these are small hand-drawn marks. They are simple shapes
// (not the official logos) and always sit next to a text label.

type IconProps = { className?: string }

export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
      <path d="M8 11v6M12 17v-6m0 2.2c0-1.5 1-2.4 2.3-2.4 1.4 0 2.2.9 2.2 2.5V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none">
      <path d="M4.5 4.5l15 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19.2 4.5L4.8 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

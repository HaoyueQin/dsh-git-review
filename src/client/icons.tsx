/**
 * Inline SVG icons for the review chrome (stroke inherits currentColor so
 * every icon tracks the theme): refresh, expand/collapse context, chevron
 * for the directory disclosure, and the filter magnifier.
 */
interface IconProps {
  size?: number
}

export function RefreshIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
      <path d="M13.7 1.8v2.7h-2.7" />
    </svg>
  )
}

export function ExpandIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="m4.5 3.5 3.5 3.5 3.5-3.5" />
      <path d="M3.5 12.5h9" />
    </svg>
  )
}

export function CollapseIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M3.5 3.5h9" />
      <path d="m4.5 12.5 3.5-3.5 3.5 3.5" />
    </svg>
  )
}

export function ChevronIcon({ size = 12, rotated = false }: IconProps & { rotated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"
      aria-hidden="true" style={{ transform: rotated ? 'rotate(-90deg)' : undefined, transition: 'transform 120ms ease' }}>
      <path d="m5.5 3.5 4.5 4.5-4.5 4.5" />
    </svg>
  )
}

export function SearchIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="7" cy="7" r="4.4" />
      <path d="m10.4 10.4 3.4 3.4" />
    </svg>
  )
}

export function BranchIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="4.5" cy="3.5" r="1.6" />
      <circle cx="4.5" cy="12.5" r="1.6" />
      <circle cx="11.5" cy="3.5" r="1.6" />
      <path d="M4.5 5.1v5.8" />
      <path d="M11.5 5.1v1.4a2 2 0 0 1-2 2h-5" />
    </svg>
  )
}

export function CommitIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="8" cy="8" r="2.6" />
      <path d="M1.5 8h3.9M10.6 8h3.9" />
    </svg>
  )
}

export function CommentIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M2.5 3.5h11v7h-6l-3 3v-3h-2z" strokeLinejoin="round" />
    </svg>
  )
}

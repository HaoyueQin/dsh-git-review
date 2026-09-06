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

/** Fold chevron: › collapsed, ∨ expanded (tree/section convention).
 *  @param props - size and whether the folded content is open. */
export function ChevronIcon({ size = 12, rotated = false }: IconProps & { rotated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"
      aria-hidden="true" style={{ transform: rotated ? 'rotate(90deg)' : undefined, transition: 'transform 120ms ease' }}>
      <path d="m5.5 3.5 4.5 4.5-4.5 4.5" />
    </svg>
  )
}

/** Popup chevron: ∨ closed, ∧ open (dropdown-button convention).
 *  @param props - size and whether the popup is open. */
export function PopupIcon({ size = 12, open = false }: IconProps & { open?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"
      aria-hidden="true" style={{ transform: open ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 120ms ease' }}>
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

export function GraphIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="4" cy="3.5" r="1.5" />
      <circle cx="4" cy="12.5" r="1.5" />
      <circle cx="11.5" cy="8" r="1.5" />
      <path d="M4 5v6" />
      <path d="M4 8h5.5" />
    </svg>
  )
}

export function TagIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M2.2 2.6v4.3l6.1 6.1 4.9-4.9-6.1-6.1H3.2z" strokeLinejoin="round" />
      <circle cx="4.9" cy="4.9" r="1" />
    </svg>
  )
}

export function FileIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M3.5 2.5h6l3 3v8h-9z" strokeLinejoin="round" />
      <path d="M9.5 2.5v3h3" />
    </svg>
  )
}

export function CopyIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5v-2a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h2" />
    </svg>
  )
}

export function TrashIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M2.5 4.5h11" />
      <path d="M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" />
      <path d="M3.5 4.5 4.4 13a1.5 1.5 0 0 0 1.5 1.4h4.2a1.5 1.5 0 0 0 1.5-1.4l.9-8.5" />
      <path d="M6.5 7.5v4M9.5 7.5v4" />
    </svg>
  )
}

export function PencilIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="m10.8 2.8 2.4 2.4-7.6 7.6-3 .6.6-3z" strokeLinejoin="round" />
      <path d="m9.6 4 2.4 2.4" />
    </svg>
  )
}

export function OpenIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M8 2.5H4a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 4 13.5h8a1.5 1.5 0 0 0 1.5-1.5V8" />
      <path d="M10.5 2.5h3v3" />
      <path d="M13.2 2.8 8.5 7.5" />
    </svg>
  )
}

export function FolderIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M1.8 4.5a1 1 0 0 1 1-1h3.4l1.6 1.7h5.4a1 1 0 0 1 1 1v6.3a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1z" strokeLinejoin="round" />
    </svg>
  )
}

export function CheckIcon({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="m3 8.5 3.2 3.2L13 4.5" />
    </svg>
  )
}

export function LineLeftIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="2" y="2.5" width="4.5" height="11" rx="1" />
      <rect x="9.5" y="2.5" width="4.5" height="11" rx="1" />
    </svg>
  )
}

export function LinesIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
    </svg>
  )
}

export function OptionsIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />
      <circle cx="6" cy="4.5" r="1.4" fill="var(--dsw-alias-bg-layer-1)" />
      <circle cx="10.5" cy="8" r="1.4" fill="var(--dsw-alias-bg-layer-1)" />
      <circle cx="5" cy="11.5" r="1.4" fill="var(--dsw-alias-bg-layer-1)" />
    </svg>
  )
}

export function SwapIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M4 5.5h8.5M10 3l2.7 2.5L10 8" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M12 10.5H3.5M6 13l-2.7-2.5L6 8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export function HistoryIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9" strokeLinecap="round" />
      <path d="M2.3 1.8v2.7h2.7" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M8 5v3.2l2.2 1.3" strokeLinecap="round" />
    </svg>
  )
}

export function PlusIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  )
}

export function MinusIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M3 8h10" strokeLinecap="round" />
    </svg>
  )
}

export function UndoIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M3 4v4h4" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M3.2 7.5a5.2 5.2 0 1 1-1 4.2" strokeLinecap="round" />
    </svg>
  )
}

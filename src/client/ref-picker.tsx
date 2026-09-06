/**
 * The ref picker: a themed dropdown replacing the native <select> that the
 * compare toolbar used to ship. The native select's popup is OS-rendered —
 * it ignored the harness theme entirely and offered no icons, no search and
 * no commits, so branch/tag/commit picks all had to live in ONE flat
 * confusing list. This picker groups entries the way vscode-git-graph and
 * the reference DSH git plugins do: local branches, remote branches, tags,
 * then recent commits — each with a type icon, an in-picker search filter
 * and the current selection marked.
 *
 * Value protocol: a ref name (branch/remote/tag) or a full 40-hex commit id;
 * null means "HEAD / current branch".
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { GitCommitSummary, GitRefEntry } from '../contract.ts'
import { BranchIcon, CheckIcon, CommitIcon, PopupIcon, TagIcon } from './icons.tsx'
import { fmtGraphDate } from './graph-view.tsx'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { NS } from './locales.ts'
import css from './review.module.css'

type T = PropsLocale<typeof NS>['t']

/** Short 'a1b2c3d' form of a full hash. */
function shortHash(hash: string): string {
  return hash.length > 7 ? hash.slice(0, 7) : hash
}

/** The icon + label of the current value (drives the trigger chip). */
function valueLabel(value: string | null, refs: GitRefEntry[] | null, commits: GitCommitSummary[] | null, headLabel: string | null): { icon: JSX.Element; text: string } {
  if (value === null) return { icon: <BranchIcon />, text: headLabel ?? 'HEAD' }
  if (/^[0-9a-f]{40}$/.test(value)) {
    const commit = commits?.find(item => item.hash === value) ?? null
    return {
      icon: <CommitIcon />,
      text: commit === null ? shortHash(value) : shortHash(value) + ' · ' + commit.subject,
    }
  }
  const entry = refs?.find(ref => ref.name === value)
  const icon = entry?.kind === 'tag' ? <TagIcon /> : <BranchIcon />
  return { icon, text: value }
}

/** One header row of a picker group. */
function GroupLabel({ children }: { children: string }) {
  return <div className={css.pickerGroupLabel}>{children}</div>
}

/** One selectable picker entry. */
function PickerItem({ selected, disabled, icon, name, meta, onPick, title }: {
  selected: boolean
  disabled?: boolean
  icon: JSX.Element
  name: string
  meta?: string
  onPick: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      className={css.pickerItem + (selected ? ' ' + css.pickerItemActive : '')}
      disabled={disabled === true}
      onClick={onPick}
      title={title}
    >
      <span className={css.pickerItemIcon}>{icon}</span>
      <span className={css.pickerItemName}>{name}</span>
      {meta !== undefined && <span className={css.pickerItemMeta}>{meta}</span>}
      {selected && <span className={css.pickerItemCheck}><CheckIcon /></span>}
    </button>
  )
}

export interface RefPickerProps {
  /** Selected value (ref name or 40-hex); null = HEAD. */
  value: string | null
  /** HEAD label (current branch name); null suppresses the HEAD entry. */
  headLabel: string | null
  refs: GitRefEntry[] | null
  commits: GitCommitSummary[] | null
  /** Ref names that must not be picked here (e.g. the other range end).
   *  undefined = nothing excluded; null = the other end is HEAD, so the
   *  HEAD entry is disabled too (the value protocol for HEAD is null). */
  exclude?: string | null
  /** Placeholder shown when the value is null and headLabel is too. */
  placeholder: string
  onPick: (value: string | null) => void
  /** Called when the popup opens (the owner lazily fetches the commit feed). */
  onOpen?: () => void
  t: T
}

/**
 * A selectable ref picker: chip trigger + themed popup with search-filtered
 * groups (HEAD, local branches, remote branches, tags, recent commits).
 */
export function RefPicker({ value, headLabel, refs, commits, exclude, placeholder, onPick, onOpen, t }: RefPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLSpanElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Close on outside click / Escape; focus the filter when the popup opens.
  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => { document.removeEventListener('mousedown', onDown) }
  }, [open])
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const q = query.trim().toLowerCase()
  const branches = useMemo(() => (refs ?? []).filter(ref => ref.kind === 'branch' && (q === '' || ref.name.toLowerCase().includes(q))), [refs, q])
  const remotes = useMemo(() => (refs ?? []).filter(ref => ref.kind === 'remote' && (q === '' || ref.name.toLowerCase().includes(q))), [refs, q])
  const tags = useMemo(() => (refs ?? []).filter(ref => ref.kind === 'tag' && (q === '' || ref.name.toLowerCase().includes(q))), [refs, q])
  const commitsMatch = useMemo(() => (commits ?? []).filter(commit => q === ''
    || commit.subject.toLowerCase().includes(q)
    || commit.hash.startsWith(q)
    || commit.authorName.toLowerCase().includes(q)), [commits, q])
  const showCommits = commits !== null && (q !== '' || commitsMatch.length > 0)
  const isCurrent = (name: string): boolean => value === name
  const pick = (next: string | null): void => {
    setOpen(false)
    setQuery('')
    onPick(next)
  }

  const { icon, text } = valueLabel(value, refs, commits, headLabel)
  const display = value !== null ? text : (headLabel !== null ? headLabel : placeholder)

  return (
    <span
      className={css.pickerWrap}
      ref={rootRef}
      onKeyDown={event => {
        if (event.key === 'Escape' && open) { setOpen(false); setQuery('') }
      }}
    >
      <button
        type="button"
        className={css.pickerBtn + (open ? ' ' + css.pickerBtnOpen : '')}
        title={t('compare.pickHint')}
        onClick={() => {
          setOpen(current => !current)
          if (!open) onOpen?.()
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {icon}
        <span className={css.pickerBtnText}>{display}</span>
        <PopupIcon open={open} />
      </button>
      {open && (
        <div className={css.pickerPop} role="listbox">
          <div className={css.pickerSearchWrap}>
            <input
              ref={inputRef}
              className={css.pickerSearch}
              value={query}
              onChange={event => { setQuery(event.target.value) }}
              onKeyDown={event => {
                if (event.key === 'Escape') { setOpen(false); setQuery('') }
              }}
              placeholder={t('picker.search')}
              spellCheck={false}
            />
          </div>
          <div className={css.pickerScroll}>
            {headLabel !== null && (
              <>
                <GroupLabel>{t('ref.current')}</GroupLabel>
                <PickerItem
                  selected={value === null}
                  disabled={exclude === null}
                  icon={<BranchIcon />}
                  name={headLabel}
                  meta="HEAD"
                  onPick={() => { pick(null) }}
                />
              </>
            )}
            {branches.length > 0 && (
              <>
                <GroupLabel>{t('ref.branches')}</GroupLabel>
                {branches.map(ref => (
                  <PickerItem
                    key={'b:' + ref.name}
                    selected={isCurrent(ref.name)}
                    disabled={exclude === ref.name}
                    icon={<BranchIcon />}
                    name={ref.name}
                    onPick={() => { pick(ref.name) }}
                  />
                ))}
              </>
            )}
            {remotes.length > 0 && (
              <>
                <GroupLabel>{t('ref.remotes')}</GroupLabel>
                {remotes.map(ref => (
                  <PickerItem
                    key={'r:' + ref.name}
                    selected={isCurrent(ref.name)}
                    disabled={exclude === ref.name}
                    icon={<BranchIcon />}
                    name={ref.name}
                    onPick={() => { pick(ref.name) }}
                  />
                ))}
              </>
            )}
            {tags.length > 0 && (
              <>
                <GroupLabel>{t('ref.tags')}</GroupLabel>
                {tags.map(ref => (
                  <PickerItem
                    key={'t:' + ref.name}
                    selected={isCurrent(ref.name)}
                    disabled={exclude === ref.name}
                    icon={<TagIcon />}
                    name={ref.name}
                    onPick={() => { pick(ref.name) }}
                  />
                ))}
              </>
            )}
            {showCommits && (
              <>
                <GroupLabel>{t('ref.commits')}</GroupLabel>
                {commitsMatch.slice(0, 80).map(commit => (
                  <PickerItem
                    key={'c:' + commit.hash}
                    selected={value === commit.hash}
                    disabled={exclude === commit.hash}
                    icon={<CommitIcon />}
                    name={commit.subject}
                    meta={fmtGraphDate(commit.timestamp)}
                    title={commit.hash + ' · ' + commit.subject}
                    onPick={() => { pick(commit.hash) }}
                  />
                ))}
                {q !== '' && commitsMatch.length === 0 && commits !== null && (
                  <div className={css.pickerEmpty}>{t('picker.empty')}</div>
                )}
              </>
            )}
            {commits === null && (
              <div className={css.pickerEmpty}>{t('picker.loadingCommits')}</div>
            )}
            {q !== '' && branches.length === 0 && remotes.length === 0 && tags.length === 0 && commitsMatch.length === 0 && (
              <div className={css.pickerEmpty}>{t('picker.empty')}</div>
            )}
          </div>
        </div>
      )}
    </span>
  )
}

/** Per-file +/− line counts shared by every single-file header.
 *
 * Renders nothing for files without line counts (binary files report 0/0,
 * unchanged rows in all-files mode are 0/0 too) so binary/unchanged headers
 * keep their existing copy. flex:none via `.totals`: long file names
 * truncate (ellipsis) while the counts stay visible at the row end.
 */
import type { ChangedFile } from '../contract.ts'
import css from './review.module.css'

export function FileCounts({ file }: { file: ChangedFile }) {
  if (!Number.isFinite(file.added) || !Number.isFinite(file.deleted)) return null
  if (file.added <= 0 && file.deleted <= 0) return null
  const added = '+' + Math.max(0, file.added).toLocaleString()
  const deleted = '\u2212' + Math.max(0, file.deleted).toLocaleString()
  return (
    <span className={css.totals} title={added + ' ' + deleted} aria-label={added + ' ' + deleted}>
      <span className={css.totalAdded}>{added}</span>
      <span className={css.totalDeleted}>{deleted}</span>
    </span>
  )
}

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
  if (file.added <= 0 && file.deleted <= 0) return null
  const added = '+' + file.added.toLocaleString('en-US')
  const deleted = '\u2212' + file.deleted.toLocaleString('en-US')
  return (
    <span className={css.totals} title={added + ' ' + deleted} aria-label={added + ' ' + deleted}>
      <span className={css.totalAdded}>{added}</span>
      <span className={css.totalDeleted}>{deleted}</span>
    </span>
  )
}

/**
 * File-type icons for the turn card's per-file rows: official single-path
 * logos inlined from Simple Icons v9 (CC0, see icon-paths.ts) for common
 * source types, tinted with each ecosystem's GitHub-language-bar accent;
 * anything unmapped keeps the neutral extension-tinted file silhouette.
 */
import { ICON_VIEWBOX, LOGO_PATHS } from './icon-paths.ts'

/** Accent color per icon key (GitHub language colors). */
const ICON_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f1e05a',
  python: '#3572a5',
  markdown: '#519aba',
  rust: '#dea584',
  html5: '#e34c26',
  css3: '#663399',
  go: '#00ADD8',
  php: '#4F5D95',
  ruby: '#701516',
  openjdk: '#b07219',
  kotlin: '#A97BFF',
  swift: '#F05138',
  yaml: '#cb171e',
  json: '#cbcb41',
  toml: '#9c4221',
  svelte: '#ff3e00',
  docker: '#2496ED',
}

/** Silhouette tint per extension (GitHub-language / product accents) for
 *  types without an inlined brand logo: logo-less code, docs & data,
 *  office files, images, archives and media. Anything unlisted keeps the
 *  neutral tertiary tint. */
const EXT_TINTS: Record<string, string> = {
  c: '#555555', h: '#555555', cpp: '#f34b7d', hpp: '#f34b7d', cc: '#f34b7d', cxx: '#f34b7d',
  cs: '#178600', vue: '#41b883', scss: '#c6538c', less: '#1d365d', sass: '#a53b70', styl: '#ff6347',
  sh: '#89e051', bash: '#89e051', zsh: '#89e051', ps1: '#5391fe', sql: '#e38c00',
  xml: '#0060ac', lua: '#000080', r: '#198ce7', scala: '#c22d40', dart: '#00b4ab',
  pl: '#0298c3', pm: '#0298c3', ex: '#6e4a7e', exs: '#6e4a7e', erl: '#b83998',
  hs: '#5e5086', elm: '#60b5cc', clj: '#db5855', groovy: '#4298b8', gradle: '#02303a',
  astro: '#ff5a03', ipynb: '#da5b0b', proto: '#8e44ad',
  txt: '#6e7781', log: '#6e7781', text: '#6e7781', csv: '#217346', tsv: '#217346',
  tex: '#3d6117', rtf: '#2b579a', pdf: '#d1242f',
  doc: '#2b579a', docx: '#2b579a', odt: '#2b579a', xls: '#217346', xlsx: '#217346',
  ods: '#217346', ppt: '#d24726', pptx: '#d24726', odp: '#d24726',
  png: '#8250df', jpg: '#8250df', jpeg: '#8250df', gif: '#8250df', webp: '#8250df',
  bmp: '#8250df', avif: '#8250df', svg: '#e34c26', tif: '#8250df', tiff: '#8250df',
  ico: '#8250df', heic: '#8250df', heif: '#8250df',
  zip: '#6e7781', tar: '#6e7781', gz: '#6e7781', tgz: '#6e7781', '7z': '#6e7781',
  rar: '#6e7781', jar: '#6e7781', exe: '#6e7781', dll: '#6e7781', so: '#6e7781',
  ttf: '#6e7781', otf: '#6e7781', woff: '#6e7781', woff2: '#6e7781',
  mp3: '#8250df', mp4: '#8250df', wav: '#8250df', mov: '#8250df',
  env: '#ecd53f', gitignore: '#f14e32', dockerignore: '#2496ed',
}

/** Extension -> icon key. */
const EXT_ICONS: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', mts: 'typescript', cts: 'typescript',
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  py: 'python', pyi: 'python', pyw: 'python',
  md: 'markdown', markdown: 'markdown', mdown: 'markdown',
  json5: 'json',
  rs: 'rust',
  html: 'html5', htm: 'html5', xhtml: 'html5',
  css: 'css3',
  go: 'go', php: 'php', rb: 'ruby',
  java: 'openjdk', kt: 'kotlin', kts: 'kotlin', swift: 'swift',
  yml: 'yaml', yaml: 'yaml',
  json: 'json', jsonc: 'json',
  toml: 'toml',
  svelte: 'svelte',
}

/** Lowercased extension of a path ('' when none); Dockerfile maps to its own key. */
function extOf(path: string): string {
  const base = path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1)
  if (/^dockerfile(\.\w+)?$/i.test(base)) return '@dockerfile'
  const dot = base.lastIndexOf('.')
  return dot === -1 ? '' : base.slice(dot + 1).toLowerCase()
}

/** The neutral extension-tinted file silhouette (unknown types). */
function FileSilhouette({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 1.5h5.2L12.5 4.8v9.7a1 1 0 0 1-1 1h-7.5a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" fill={color} />
      <path d="M9.2 1.5v3.3h3.3" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
    </svg>
  )
}

/** Full props of the file-type icon. */
export interface FileTypeIconProps {
  path: string
}

/**
 * The icon for one changed file: an inlined brand logo for known types, the
 * tinted silhouette otherwise.
 * @param props - the file path whose extension picks the glyph.
 */
export function FileTypeIcon({ path }: FileTypeIconProps) {
  const ext = extOf(path)
  const icon = ext === '@dockerfile' ? 'docker' : EXT_ICONS[ext]
  const d = icon === undefined ? undefined : LOGO_PATHS[icon]
  if (icon !== undefined && d !== undefined) {
    return (
      <svg width="14" height="14" viewBox={ICON_VIEWBOX} aria-hidden="true">
        <path d={d} fill={ICON_COLORS[icon] ?? 'var(--dsw-alias-label-tertiary)'} />
      </svg>
    )
  }
  return <FileSilhouette color={EXT_TINTS[ext] ?? 'var(--dsw-alias-label-tertiary)'} />
}
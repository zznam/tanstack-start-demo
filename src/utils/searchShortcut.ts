type KeyLike = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  defaultPrevented: boolean
  isComposing?: boolean
}
type TargetLike = { tagName?: string; isContentEditable?: boolean } | null

const EDITABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/** "/" focuses the catalog search unless the user is already typing somewhere. */
export function isSearchShortcut(event: KeyLike, target: TargetLike) {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return false
  if (event.defaultPrevented || event.isComposing) return false
  if (target?.isContentEditable) return false
  return !(target?.tagName && EDITABLE.has(target.tagName.toUpperCase()))
}

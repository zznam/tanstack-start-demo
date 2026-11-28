export type HighlightPart = { text: string; match: boolean }

/**
 * Splits `text` into matched and unmatched runs for the search words in `query`
 * (case-insensitive, same word splitting as the catalog filter). Overlapping or adjacent
 * matches merge into one run. Plain string scanning, so search input is never a regex.
 */
export function highlightParts(text: string, query: string): HighlightPart[] {
  const words = [...new Set(query.trim().toLowerCase().split(/\s+/).filter(Boolean))]
  if (!words.length || !text) return text ? [{ text, match: false }] : []
  const lower = text.toLowerCase()
  const marked = new Array<boolean>(text.length).fill(false)
  for (const word of words) {
    for (let at = lower.indexOf(word); at !== -1; at = lower.indexOf(word, at + 1)) {
      marked.fill(true, at, at + word.length)
    }
  }
  const parts: HighlightPart[] = []
  for (let i = 0; i < text.length; ) {
    let end = i
    while (end < text.length && marked[end] === marked[i]) end++
    parts.push({ text: text.slice(i, end), match: marked[i] })
    i = end
  }
  return parts
}

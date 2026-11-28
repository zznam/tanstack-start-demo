import { highlightParts } from '../utils/highlight'

/** Renders `text` with the search words from `query` wrapped in <mark>. */
export function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="search-mark">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  )
}

import { theme } from './theme.mjs'
import { countdown, headerDate, hhmm, truncate, wrap } from './format.mjs'

/**
 * Pure: picked events + now -> what the card shows (no pixels, no SVG).
 * state: 'next' | 'now' | 'done'
 */
export function buildCardModel({ current, next, later }, now) {
  const date = headerDate(now)
  const focus = next ?? current
  if (!focus) {
    return { state: 'done', date, accent: theme.color.done, headline: 'All done', subline: 'No more meetings today' }
  }

  const state = next ? 'next' : 'now'
  return {
    state,
    date,
    accent: next ? theme.color.next : theme.color.now,
    label: next ? 'NEXT' : 'NOW',
    when: next ? countdown(next.start - now) : `ends ${hhmm(current.end)}`,
    titleLines: wrap(focus.title, theme.title.maxChars, theme.title.maxLines),
    timeRange: `${hhmm(focus.start)} – ${hhmm(focus.end)}`,
    location: focus.location ? truncate(focus.location, theme.location.maxChars) : null,
    footer: footerFor({ current, next, later })
  }
}

/** Up to two lines, top to bottom: what is running now, then how many are left. */
function footerFor({ current, next, later }) {
  if (!next) return []
  const lines = []
  if (current) lines.push({ text: `Now: ${truncate(current.title, 22)}`, color: theme.color.now })
  if (later.length) lines.push({ text: `+${later.length} more today`, color: theme.color.muted })
  return lines
}

import { readFile } from 'node:fs/promises'
import ical from 'node-ical'

/**
 * Reads events starting within [dayStart, dayEnd] from a Google Calendar secret iCal URL
 * (Calendar settings > Integrate calendar > "Secret address in iCal format").
 * No Google Cloud project or OAuth needed. A local file path also works, for testing.
 * Recurring events are expanded; all-day, cancelled and (when selfEmail is given) declined events are skipped.
 */
export async function fetchEvents(icsSource, now = new Date(), selfEmail = null) {
  const raw = /^https?:\/\//.test(icsSource) ? await fetchText(icsSource) : await readFile(icsSource, 'utf8')
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const events = []

  for (const item of Object.values(ical.parseICS(raw))) {
    if (item.type !== 'VEVENT' || item.status === 'CANCELLED') continue
    const instances = item.rrule
      ? ical.expandRecurringEvent(item, { from: dayStart, to: dayEnd })
      : [{ start: item.start, end: item.end, summary: item.summary, location: item.location, isFullDay: item.datetype === 'date' }]
    for (const i of instances) {
      if (i.isFullDay || !i.start || i.start < dayStart || i.start >= dayEnd) continue
      // Per-occurrence changes (declined/cancelled) live on the override event, not the series.
      const source = i.event ?? item
      if (source.status === 'CANCELLED' || (selfEmail && isDeclined(source, selfEmail))) continue
      events.push({
        title: String(i.summary?.val ?? i.summary ?? '(No title)'),
        start: i.start,
        end: i.end ?? i.start,
        location: i.location ? String(i.location.val ?? i.location) : null
      })
    }
  }
  return events
}

/** True when the attendee matching selfEmail has PARTSTAT=DECLINED. */
function isDeclined(item, selfEmail) {
  const attendees = [item.attendee].flat().filter(Boolean)
  const me = selfEmail.toLowerCase()
  return attendees.some((a) => String(a.val ?? a).toLowerCase().replace(/^mailto:/, '') === me && a.params?.PARTSTAT === 'DECLINED')
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Calendar fetch failed: HTTP ${res.status}`)
  return res.text()
}

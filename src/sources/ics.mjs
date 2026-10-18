import { readFile } from 'node:fs/promises'
import ical from 'node-ical'

/**
 * Source: Google Calendar secret iCal URL (Calendar settings > Integrate calendar >
 * "Secret address in iCal format"). No Google Cloud project or OAuth needed.
 * A local file path also works, for testing.
 *
 * Returns every event starting on `now`'s day, unfiltered, as normalized Events:
 * { uid, title, start, end, location, allDay, status, myResponse }
 */
export function createIcsSource({ icsUrls, selfEmail }) {
  return {
    name: 'ics',
    async fetchToday(now) {
      // One calendar failing must not blank the display; fail only if all fail.
      // Warnings name the index, never the URL (it is a secret).
      const results = await Promise.allSettled(icsUrls.map((url) => loadOne(url, now, selfEmail)))
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.warn(`Calendar #${i + 1} skipped: ${r.reason.message}`)
      })
      const ok = results.filter((r) => r.status === 'fulfilled')
      if (!ok.length) throw new Error('All calendars failed to load')
      return dedupe(ok.flatMap((r) => r.value))
    }
  }
}

async function loadOne(url, now, selfEmail) {
  const raw = /^https?:\/\//.test(url) ? await fetchText(url) : await readFile(url, 'utf8')
  return parseToday(raw, now, selfEmail)
}

/** Same meeting on several calendars shares its UID; recurring occurrences share it too, so key on start as well. */
function dedupe(events) {
  const seen = new Set()
  return events.filter((e) => {
    if (!e.uid) return true
    const key = `${e.uid}|${e.start.getTime()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function parseToday(raw, now, selfEmail) {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const events = []

  for (const item of Object.values(ical.parseICS(raw))) {
    if (item.type !== 'VEVENT') continue
    for (const occurrence of occurrencesBetween(item, dayStart, dayEnd)) {
      if (!occurrence.start || occurrence.start < dayStart || occurrence.start >= dayEnd) continue
      // Per-occurrence changes (declined/cancelled) live on the override event, not the series.
      const detail = occurrence.event ?? item
      events.push({
        uid: item.uid ?? null,
        title: text(occurrence.summary) ?? '(No title)',
        start: occurrence.start,
        end: occurrence.end ?? occurrence.start,
        location: text(occurrence.location),
        allDay: Boolean(occurrence.isFullDay),
        status: detail.status ?? 'CONFIRMED',
        myResponse: responseOf(detail, selfEmail)
      })
    }
  }
  return events
}

function occurrencesBetween(item, from, to) {
  if (item.rrule) return ical.expandRecurringEvent(item, { from, to })
  return [{ start: item.start, end: item.end, summary: item.summary, location: item.location, isFullDay: item.datetype === 'date' }]
}

/** node-ical wraps some fields as { val, params }. */
const text = (field) => (field ? String(field.val ?? field) : null)

/** PARTSTAT of the attendee matching selfEmail (e.g. 'ACCEPTED', 'DECLINED'), else null. */
function responseOf(item, selfEmail) {
  if (!selfEmail) return null
  const me = selfEmail.toLowerCase()
  const attendee = [item.attendee].flat().filter(Boolean).find((a) => String(a.val ?? a).toLowerCase().replace(/^mailto:/, '') === me)
  return attendee?.params?.PARTSTAT ?? null
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`Calendar fetch failed: HTTP ${res.status}`)
  return res.text()
}

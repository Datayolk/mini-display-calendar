/** Pure. Returns { current, next, later } for the events of `now`'s day. */
export function pickEvents(events, now) {
  const sorted = [...events].sort((a, b) => a.start - b.start)
  const current = sorted.find((event) => event.start <= now && now < event.end) ?? null
  const upcoming = sorted.filter((event) => event.start > now)
  return { current, next: upcoming[0] ?? null, later: upcoming.slice(1) }
}

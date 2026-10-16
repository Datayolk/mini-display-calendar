/** Mock events for today, relative to `now` so the demo always has data. */
export function mockEvents(now = new Date()) {
  const at = (h, m) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
  return [
    { title: 'Daily Standup', start: at(9, 30), end: at(9, 45), location: 'Google Meet' },
    { title: 'Sprint Planning', start: at(11, 0), end: at(12, 0), location: 'Room Everest' },
    { title: 'Lunch with Gatuk', start: at(12, 30), end: at(13, 30), location: 'Terminal 21' },
    { title: 'Design Review: Jitta Mini App Onboarding Flow', start: at(15, 0), end: at(16, 0), location: 'Zoom' },
    { title: '1:1 with Manager', start: at(17, 0), end: at(17, 30), location: null }
  ]
}

/** Returns { current, next, later } for the events of `now`'s day. */
export function pickEvents(events, now = new Date()) {
  const sorted = [...events].sort((a, b) => a.start - b.start)
  const current = sorted.find((e) => e.start <= now && now < e.end) ?? null
  const upcoming = sorted.filter((e) => e.start > now)
  return { current, next: upcoming[0] ?? null, later: upcoming.slice(1) }
}

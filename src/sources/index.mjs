import { createIcsSource } from './ics.mjs'
import { createMockSource } from './mock.mjs'
import { applyFilters } from './filters.mjs'

/** Picks the source from config. `forceMock` overrides ICS_URL. Add new sources here. */
export function createSource(config, { forceMock = false } = {}) {
  if (forceMock || !config.icsUrl) return createMockSource()
  return createIcsSource(config)
}

/** Today's events from the source, with the default filters applied. */
export async function todaysEvents(source, now) {
  return applyFilters(await source.fetchToday(now))
}

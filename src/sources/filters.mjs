/**
 * Event filters: (event) -> boolean, true = keep. Pure and composable.
 * Add your own (e.g. skip "Focus time") and list it in DEFAULT_FILTERS.
 */
export const notAllDay = (event) => !event.allDay
export const notCancelled = (event) => event.status !== 'CANCELLED'
export const notDeclined = (event) => event.myResponse !== 'DECLINED'

export const DEFAULT_FILTERS = [notAllDay, notCancelled, notDeclined]

export const applyFilters = (events, filters = DEFAULT_FILTERS) => events.filter((event) => filters.every((keep) => keep(event)))

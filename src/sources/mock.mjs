/** Source: fake events for today, relative to `now`, so the demo always has data. */
export function createMockSource() {
  return {
    name: 'mock',
    async fetchToday(now) {
      const at = (h, m) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
      const event = (title, start, end, location) => ({ title, start, end, location, allDay: false, status: 'CONFIRMED', myResponse: null })
      return [
        event('Daily Standup', at(9, 30), at(9, 45), 'Google Meet'),
        event('Sprint Planning', at(11, 0), at(12, 0), 'Room Everest'),
        event('Lunch with Jane', at(12, 30), at(13, 30), 'Terminal 21'),
        event('Design Review: Onboarding Flow', at(15, 0), at(16, 0), 'Zoom'),
        event('1:1 with Manager', at(17, 0), at(17, 30), null)
      ]
    }
  }
}

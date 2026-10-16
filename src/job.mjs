import { mockEvents, pickEvents } from './events.mjs'
import { renderCard } from './render.mjs'
import { fetchEvents } from './gcal.mjs'
import { uploadToDevice } from './device.mjs'

/** Builds today's calendar card as JPEG. Uses real events when ICS_URL is set, else mock. */
export async function buildCard({ now = new Date(), mock = false } = {}) {
  const { ICS_URL, SELF_EMAIL } = process.env
  const useMock = mock || !ICS_URL
  const events = useMock ? mockEvents(now) : await fetchEvents(ICS_URL, now, SELF_EMAIL)
  return { jpeg: await renderCard(pickEvents(events, now), now), useMock }
}

export async function pushCard(jpeg) {
  const url = process.env.DEVICE_URL ?? 'http://10.255.221.161/photo/upload'
  const dir = process.env.UPLOAD_DIR ?? '/photo/'
  const status = await uploadToDevice(url, dir, jpeg)
  if (status < 200 || status >= 300) throw new Error(`Device responded ${status}`)
  return status
}

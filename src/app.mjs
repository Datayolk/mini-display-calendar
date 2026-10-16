import { rename, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { createSource, todaysEvents } from './sources/index.mjs'
import { pickEvents } from './domain/pick-events.mjs'
import { renderCard } from './render/index.mjs'
import { uploadToDevice } from './device.mjs'

/** Builds today's calendar card as JPEG. Real events when ICS_URL is set, else mock. */
export async function buildCard(config, { now = new Date(), mock = false } = {}) {
  const source = createSource(config, { forceMock: mock })
  const events = await todaysEvents(source, now)
  return { jpeg: await renderCard(pickEvents(events, now), now), sourceName: source.name }
}

/** Uploads a JPEG to the device. Returns the HTTP status. */
export async function pushCard(config, jpeg) {
  const status = await uploadToDevice(config.deviceUrl, config.uploadDir, jpeg)
  if (status < 200 || status >= 300) throw new Error(`Device responded ${status}`)
  return status
}

/**
 * Writes the exact image the device receives as a PNG, replacing the previous one,
 * so it can be inspected at any time. Returns the path, or null when disabled (PREVIEW_PATH='').
 */
export async function savePreview(config, jpeg, path = config.previewPath) {
  if (!path) return null
  const tmp = `${path}.tmp`
  await writeFile(tmp, await sharp(jpeg).png().toBuffer())
  await rename(tmp, path) // atomic: viewers never see a half-written file
  return path
}

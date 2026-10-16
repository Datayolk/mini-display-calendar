import { parseArgs } from 'node:util'
import { loadConfig } from './src/config.mjs'
import { buildCard, pushCard, savePreview } from './src/app.mjs'

const { values } = parseArgs({
  options: {
    at: { type: 'string' }, // fake "now", e.g. 14:20 or 2026-10-16T14:20
    preview: { type: 'string' }, // PNG output path (default PREVIEW_PATH); without --upload nothing is sent
    upload: { type: 'boolean', default: false },
    mock: { type: 'boolean', default: false } // force mock data even if ICS_URL is set
  }
})

function parseNow(arg) {
  if (!arg) return new Date()
  const hm = arg.match(/^(\d{1,2}):(\d{2})$/)
  if (hm) {
    const d = new Date()
    d.setHours(Number(hm[1]), Number(hm[2]), 0, 0)
    return d
  }
  const d = new Date(arg)
  if (Number.isNaN(d.getTime())) throw new Error(`Bad --at value: ${arg}`)
  return d
}

try {
  const config = loadConfig()
  const { jpeg, sourceName } = await buildCard(config, { now: parseNow(values.at), mock: values.mock })
  if (sourceName === 'mock') console.log('Using mock events (set ICS_URL in .env for real data)')
  const saved = await savePreview(config, jpeg, values.preview ?? config.previewPath)
  if (saved) console.log(`Preview written to ${saved}`)
  if (values.upload) {
    const status = await pushCard(config, jpeg)
    console.log(`Device responded ${status} — done`)
  }
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { buildCard, pushCard } from './src/job.mjs'

try {
  process.loadEnvFile()
} catch {
  // .env optional
}

const { values } = parseArgs({
  options: {
    at: { type: 'string' }, // fake "now", e.g. 14:20 or 2026-10-16T14:20
    preview: { type: 'string' }, // write JPEG here instead of uploading
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
  const { jpeg, useMock } = await buildCard({ now: parseNow(values.at), mock: values.mock })
  if (useMock) console.log('Using mock events (set ICS_URL in .env for real data)')
  const target = values.preview ?? (values.upload ? null : 'preview.jpg')
  if (target) {
    await writeFile(target, jpeg)
    console.log(`Preview written to ${target} (${(jpeg.length / 1024).toFixed(1)} KB)`)
  } else {
    const status = await pushCard(jpeg)
    console.log(`Device responded ${status} — done`)
  }
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

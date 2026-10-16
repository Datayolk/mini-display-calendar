import { parseArgs } from 'node:util'
import { buildCard, pushCard } from './src/job.mjs'

try {
  process.loadEnvFile()
} catch {
  // .env optional
}

const { values } = parseArgs({ options: { mock: { type: 'boolean', default: false } } })

const minutes = Number(process.env.INTERVAL_MINUTES ?? 5)
if (!Number.isFinite(minutes) || minutes <= 0) {
  console.error(`Bad INTERVAL_MINUTES: ${process.env.INTERVAL_MINUTES}`)
  process.exit(1)
}

const stamp = () => new Date().toLocaleTimeString('en-GB', { hour12: false })
let timer
let stopping = false

async function tick() {
  try {
    const { jpeg, useMock } = await buildCard({ mock: values.mock })
    const status = await pushCard(jpeg)
    console.log(`[${stamp()}] uploaded ${(jpeg.length / 1024).toFixed(1)} KB (${useMock ? 'mock' : 'calendar'}), device ${status}`)
  } catch (error) {
    // Keep running: Wi-Fi/device hiccups should not kill the loop.
    console.error(`[${stamp()}] failed: ${error.message}`)
  }
  // Schedule after finishing so slow runs never overlap.
  if (!stopping) timer = setTimeout(tick, minutes * 60_000)
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopping = true
    clearTimeout(timer)
    console.log(`\n[${stamp()}] stopped`)
    process.exit(0)
  })
}

console.log(`Updating every ${minutes} min. Ctrl+C to stop.`)
tick()

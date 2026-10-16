import sharp from 'sharp'

const SIZE = 240
const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif'

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])
const hhmm = (d) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

function wrap(text, maxChars, maxLines) {
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    lines.length = maxLines
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1).trimEnd() + '…'
  }
  return lines
}

function countdown(ms) {
  const min = Math.max(0, Math.round(ms / 60_000))
  if (min < 1) return 'now'
  if (min < 60) return `in ${min} min`
  const h = Math.floor(min / 60)
  return min % 60 ? `in ${h}h ${min % 60}m` : `in ${h}h`
}

const text = (x, y, size, fill, str, extra = '') =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" fill="${fill}" ${extra}>${esc(str)}</text>`

/** Builds the 240x240 SVG card. */
export function cardSvg({ current, next, later }, now = new Date()) {
  const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()
  const focus = next ?? current
  let body = ''
  let accent = '#4f8cff'

  if (!focus) {
    accent = '#34c98b'
    body += text(120, 128, 30, '#fff', 'All done', 'text-anchor="middle" font-weight="700"')
    body += text(120, 158, 16, '#8b93a7', 'No more meetings today', 'text-anchor="middle"')
  } else {
    const label = next ? 'NEXT' : 'NOW'
    if (!next) accent = '#ff9f43'
    const when = next ? countdown(next.start - now) : `ends ${hhmm(current.end)}`
    body += text(16, 56, 13, accent, label, 'font-weight="700" letter-spacing="2"')
    body += text(224, 56, 13, '#8b93a7', when, 'text-anchor="end"')
    const lines = wrap(focus.title, 15, 3)
    lines.forEach((l, i) => (body += text(16, 92 + i * 30, 26, '#fff', l, 'font-weight="700"')))
    const y = 92 + lines.length * 30 + 4
    body += text(16, y, 22, accent, `${hhmm(focus.start)} – ${hhmm(focus.end)}`, 'font-weight="600"')
    if (focus.location) body += text(16, y + 24, 15, '#8b93a7', wrap(focus.location, 26, 1)[0])
    const extra = next ? later.length : 0
    if (extra) body += text(16, 226, 13, '#8b93a7', `+${extra} more today`)
    else if (next && current) body += text(16, 226, 13, '#ff9f43', `Now: ${wrap(current.title, 22, 1)[0]}`)
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
<rect width="${SIZE}" height="${SIZE}" fill="#10131c"/>
<rect x="0" y="0" width="6" height="${SIZE}" fill="${accent}"/>
${text(16, 28, 14, '#c5cad6', date, 'font-weight="600" letter-spacing="1"')}
<line x1="16" y1="38" x2="224" y2="38" stroke="#262b3a" stroke-width="1"/>
${body}
</svg>`
}

export async function renderCard(picked, now = new Date()) {
  return sharp(Buffer.from(cardSvg(picked, now))).jpeg({ quality: 95 }).toBuffer()
}

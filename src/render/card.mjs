import { theme } from './theme.mjs'

const { size, font, color } = theme

const escapeXml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c])

const text = (x, y, fontSize, fill, content, attrs = '') =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${fontSize}" fill="${fill}" ${attrs}>${escapeXml(content)}</text>`

/** Card model -> 240x240 SVG string. Layout only; no decisions about what to show. */
export function cardSvg(model) {
  const body = model.state === 'done' ? doneBody(model) : meetingBody(model)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="${size}" height="${size}" fill="${color.background}"/>
<rect x="0" y="0" width="6" height="${size}" fill="${model.accent}"/>
${text(16, 28, 14, color.heading, model.date, 'font-weight="600" letter-spacing="1"')}
<line x1="16" y1="38" x2="224" y2="38" stroke="${color.divider}" stroke-width="1"/>
${body}
</svg>`
}

function doneBody(model) {
  return (
    text(120, 128, 30, color.title, model.headline, 'text-anchor="middle" font-weight="700"') +
    text(120, 158, 16, color.muted, model.subline, 'text-anchor="middle"')
  )
}

function meetingBody(model) {
  const { lineHeight } = theme.title
  let out = text(16, 56, 13, model.accent, model.label, 'font-weight="700" letter-spacing="2"')
  out += text(224, 56, 13, color.muted, model.when, 'text-anchor="end"')
  model.titleLines.forEach((line, i) => {
    out += text(16, 92 + i * lineHeight, 26, color.title, line, 'font-weight="700"')
  })
  const y = 92 + model.titleLines.length * lineHeight + 4
  out += text(16, y, 22, model.accent, model.timeRange, 'font-weight="600"')
  if (model.location) out += text(16, y + 24, 15, color.muted, model.location)
  const footerTop = 226 - (model.footer.length - 1) * 18
  model.footer.forEach((line, i) => {
    out += text(16, footerTop + i * 18, 13, line.color, line.text)
  })
  return out
}

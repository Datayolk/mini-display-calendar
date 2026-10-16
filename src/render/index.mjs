import sharp from 'sharp'
import { buildCardModel } from './card-model.mjs'
import { cardSvg } from './card.mjs'
import { theme } from './theme.mjs'

/** picked events + now -> JPEG buffer. */
export function renderCard(picked, now) {
  const svg = cardSvg(buildCardModel(picked, now))
  return sharp(Buffer.from(svg)).jpeg({ quality: theme.jpegQuality }).toBuffer()
}

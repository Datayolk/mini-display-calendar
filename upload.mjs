import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { uploadToDevice } from './src/device.mjs'

try {
  process.loadEnvFile()
} catch {
  // .env optional
}

const DEVICE_URL = process.env.DEVICE_URL ?? 'http://10.255.221.161/photo/upload'
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? '/photo/'
const imagePath = process.argv[2] ?? process.env.IMAGE_PATH ?? 'example.png'

try {
  const jpeg = await sharp(await readFile(imagePath))
    .resize(240, 240)
    .jpeg({ quality: 95 })
    .toBuffer()
  console.log(`Uploading ${imagePath} as 240x240 JPEG (${(jpeg.length / 1024).toFixed(1)} KB) to ${DEVICE_URL}?dir=${UPLOAD_DIR}`)
  const status = await uploadToDevice(DEVICE_URL, UPLOAD_DIR, jpeg)
  if (status < 200 || status >= 300) throw new Error(`Device responded ${status}`)
  console.log(`Device responded ${status} — done`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

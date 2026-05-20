import sharp from 'sharp'
import { logger } from '@/utils/logger'

const log = logger.child({ context: 'image-utils' })

const SUPPORTED_FORMATS = new Set(['image/png', 'image/jpeg', 'image/jpg'])

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
  if (!match) return null
  return { mimeType: match[1], base64: match[2] }
}

export async function ensurePngDataUrl(dataUrl: string): Promise<string> {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) return dataUrl

  if (SUPPORTED_FORMATS.has(parsed.mimeType)) return dataUrl

  log.info({ originalFormat: parsed.mimeType }, 'Converting unsupported image format to PNG')

  const inputBuffer = Buffer.from(parsed.base64, 'base64')
  const pngBuffer = await sharp(inputBuffer).png().toBuffer()
  return `data:image/png;base64,${pngBuffer.toString('base64')}`
}

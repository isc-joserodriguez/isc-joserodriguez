// Download a raster image and shrink it to a square PNG small enough to inline as a data URI.

import sharp from 'sharp'

export async function fetchImage(url, size) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  const input = Buffer.from(await res.arrayBuffer())
  return sharp(input)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer()
}

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ -1) >>> 0
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'binary')
  const crcBuf = Buffer.alloc(4)
  const checksum = crc32(Buffer.concat([typeBuf, data]))
  crcBuf.writeUInt32BE(checksum, 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function createPng(width, height) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr)

  const rawData = Buffer.alloc(height * (width * 4 + 1))
  const center = width / 2
  const radius = width * 0.38

  let offset = 0
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0 // filter type None
    for (let x = 0; x < width; x++) {
      const dx = x - center
      const dy = y - center
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Outer circle (orange brand color #f97316) or dark background (#09090b)
      let r = 9, g = 9, b = 11, a = 255 // #09090b background

      if (dist <= radius) {
        // Epoch orange circle with inner accent
        r = 249; g = 115; b = 22 // #f97316
        // Add subtle inner dot/pulse motif
        if (dist <= radius * 0.35) {
          r = 255; g = 255; b = 255 // crisp white center
        }
      }

      rawData[offset++] = r
      rawData[offset++] = g
      rawData[offset++] = b
      rawData[offset++] = a
    }
  }

  const compressedData = zlib.deflateSync(rawData)
  const idatChunk = makeChunk('IDAT', compressedData)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk])
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), createPng(192, 192))
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), createPng(512, 512))
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), createPng(180, 180))

console.log('Icons generated successfully in public/icons/')

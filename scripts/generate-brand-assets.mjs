import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import toIco from 'to-ico'

const ROOT = path.resolve(import.meta.dirname, '..')
const CONCEPT = path.join(ROOT, 'app-icon-concept.png')
const WORDMARK_SOURCE = path.join(ROOT, 'logo.png')

/** Clean standalone app icon crop from the official design board. */
const APP_ICON_CROP = { left: 85, top: 155, width: 320, height: 320 }

const ACCENT = '#6B8AFD'
const EXPORT_SIZES = [16, 32, 48, 64, 128, 256, 512]
const ICO_SIZES = [16, 32, 48]

const PATHS = {
  appIcon: path.join(ROOT, 'src', 'assets', 'app-icon.png'),
  appIconMaster: path.join(ROOT, 'public', 'icons', 'icon-512.png'),
  wordmark: path.join(ROOT, 'src', 'assets', 'logo.png'),
  publicIcons: path.join(ROOT, 'public', 'icons'),
  faviconPng: path.join(ROOT, 'public', 'favicon.png'),
  faviconIco: path.join(ROOT, 'public', 'favicon.ico'),
  teamsColor: path.join(ROOT, 'teams', 'color.png'),
  teamsOutline: path.join(ROOT, 'teams', 'outline.png'),
}

async function loadAppIcon() {
  return sharp(CONCEPT).extract(APP_ICON_CROP)
}

async function writeWordmark() {
  await sharp(WORDMARK_SOURCE)
    .resize({ width: 480, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(PATHS.wordmark)
}

async function writeAppIconSizes() {
  const source = await loadAppIcon()

  for (const size of EXPORT_SIZES) {
    if (size === 512) {
      continue
    }

    await source
      .clone()
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toFile(path.join(PATHS.publicIcons, `icon-${size}.png`))
  }

  await source
    .clone()
    .resize(128, 128, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(PATHS.appIcon)

  await source
    .clone()
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(PATHS.appIconMaster)
}

async function writeFaviconPng() {
  await (await loadAppIcon())
    .clone()
    .resize(64, 64)
    .png({ compressionLevel: 9 })
    .toFile(PATHS.faviconPng)
}

async function writeFaviconIco() {
  const buffers = await Promise.all(
    ICO_SIZES.map(async (size) =>
      (await loadAppIcon())
        .clone()
        .resize(size, size)
        .png()
        .toBuffer(),
    ),
  )

  const ico = await toIco(buffers)
  await fs.promises.writeFile(PATHS.faviconIco, ico)
}

async function writeTeamsColor() {
  const iconBuffer = await (await loadAppIcon())
    .clone()
    .resize(152, 152)
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: ACCENT,
    },
  })
    .composite([{ input: iconBuffer, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toFile(PATHS.teamsColor)
}

function removeDarkBackground(pixels) {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]

    if (a < 16 || (r < 32 && g < 32 && b < 40)) {
      pixels[i + 3] = 0
      continue
    }

    pixels[i] = 255
    pixels[i + 1] = 255
    pixels[i + 2] = 255
    pixels[i + 3] = 255
  }
}

async function writeTeamsOutline() {
  const { data, info } = await (await loadAppIcon())
    .clone()
    .resize(32, 32)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  removeDarkBackground(data)

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(PATHS.teamsOutline)
}

async function main() {
  if (!fs.existsSync(CONCEPT)) {
    throw new Error(`Missing design source: ${CONCEPT}`)
  }

  fs.mkdirSync(path.join(ROOT, 'src', 'assets'), { recursive: true })
  fs.mkdirSync(PATHS.publicIcons, { recursive: true })
  fs.mkdirSync(path.join(ROOT, 'teams'), { recursive: true })

  await writeWordmark()
  await writeAppIconSizes()
  await writeFaviconPng()
  await writeFaviconIco()
  await writeTeamsColor()
  await writeTeamsOutline()

  console.log('FocusFlow app icon assets generated.')
  console.log(`  App icon: ${PATHS.appIcon}`)
  console.log(`  Wordmark: ${PATHS.wordmark} (loader / docs only)`)
  console.log(`  Public: favicon.ico, favicon.png, icons/*`)
  console.log(`  Teams: color.png, outline.png`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

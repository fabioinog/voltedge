/**
 * Creates valid placeholder icon, splash, and adaptive-icon PNGs using pngjs.
 * Expo EAS build requires these files and valid PNG format (CRC checks pass).
 * Replace with real assets later.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const assetsDir = path.join(__dirname, '..', 'assets');
const size = 1024;
const color = { r: 0, g: 102, b: 204 };

function createSolidPng(width, height) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) << 2;
      png.data[i] = color.r;
      png.data[i + 1] = color.g;
      png.data[i + 2] = color.b;
      png.data[i + 3] = 255;
    }
  }
  return png;
}

function writePng(png, filePath) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(filePath);
    png.pack().pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const iconPng = createSolidPng(size, size);
  const splashPng = createSolidPng(size, Math.round(size * 1.5));
  const adaptivePng = createSolidPng(size, size);

  await Promise.all([
    writePng(iconPng, path.join(assetsDir, 'icon.png')),
    writePng(splashPng, path.join(assetsDir, 'splash.png')),
    writePng(adaptivePng, path.join(assetsDir, 'adaptive-icon.png')),
  ]);
  console.log('Created placeholder: icon.png, splash.png, adaptive-icon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

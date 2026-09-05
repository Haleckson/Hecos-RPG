import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Construct the high-visibility, 100% transparent D20 SVG matching the site logo perfectly
function getDefinitiveHecosSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Facet Edge Glow Gradient (Matches HecosLogoD20: Cyan -> Sky -> Purple -> Rose) -->
    <linearGradient id="d20LogoEdgeNeon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="30%" stop-color="#38bdf8" />
      <stop offset="65%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#fb7185" />
    </linearGradient>

    <!-- Letter H Gradient (Matches HecosLogoD20 Signature: Cyan -> Purple -> Rose) -->
    <linearGradient id="d20LogoHNeonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="35%" stop-color="#a855f7" />
      <stop offset="70%" stop-color="#e11d48" />
      <stop offset="100%" stop-color="#fb7185" />
    </linearGradient>

    <!-- Dark Obsidian Facet Shaders -->
    <linearGradient id="d20ShTopL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111a2b" />
      <stop offset="100%" stop-color="#080d16" />
    </linearGradient>
    <linearGradient id="d20ShTopR" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2a122e" />
      <stop offset="100%" stop-color="#0e0611" />
    </linearGradient>
    <linearGradient id="d20ShUpperL" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#0c2333" />
      <stop offset="100%" stop-color="#07131d" />
    </linearGradient>
    <linearGradient id="d20ShUpperR" x1="100%" y1="50%" x2="0%" y2="50%">
      <stop offset="0%" stop-color="#300f26" />
      <stop offset="100%" stop-color="#13040f" />
    </linearGradient>
    <linearGradient id="d20ShMidL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#091a29" />
      <stop offset="100%" stop-color="#050f19" />
    </linearGradient>
    <linearGradient id="d20ShMidR" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#300f27" />
      <stop offset="100%" stop-color="#130410" />
    </linearGradient>
    <linearGradient id="d20ShBotL" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10182c" />
      <stop offset="100%" stop-color="#070b14" />
    </linearGradient>
    <linearGradient id="d20ShBotR" x1="100%" y1="100%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2b1021" />
      <stop offset="100%" stop-color="#10040d" />
    </linearGradient>
    <linearGradient id="d20ShBotC" x1="50%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" stop-color="#1f0f2b" />
      <stop offset="100%" stop-color="#0c0411" />
    </linearGradient>
    <linearGradient id="d20ShCenter" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#1b122f" />
      <stop offset="100%" stop-color="#0f081e" />
    </linearGradient>
  </defs>

  <!-- Scaled to 1.16: fills the canvas edge-to-edge for maximum tab visibility with NO outer box -->
  <g transform="translate(256, 256) scale(1.16) translate(-256, -256)">
    <!-- Subtle Outer Atmosphere behind Die -->
    <circle cx="256" cy="256" r="210" fill="url(#d20LogoEdgeNeon)" opacity="0.16" />

    <!-- 10 Facets of the D20 Die -->
    <polygon points="256,46 74.1,151 256,142.6" fill="url(#d20ShTopL)" stroke="url(#d20LogoEdgeNeon)" stroke-width="6" stroke-linejoin="round" />
    <polygon points="256,46 437.9,151 256,142.6" fill="url(#d20ShTopR)" stroke="url(#d20LogoEdgeNeon)" stroke-width="6" stroke-linejoin="round" />
    <polygon points="74.1,151 256,142.6 162.5,315.4" fill="url(#d20ShUpperL)" stroke="url(#d20LogoEdgeNeon)" stroke-width="6" stroke-linejoin="round" />
    <polygon points="437.9,151 256,142.6 349.5,315.4" fill="url(#d20ShUpperR)" stroke="url(#d20LogoEdgeNeon)" stroke-width="6" stroke-linejoin="round" />
    <polygon points="74.1,151 74.1,361 162.5,315.4" fill="url(#d20ShMidL)" stroke="url(#d20LogoEdgeNeon)" stroke-width="6" stroke-linejoin="round" />
    <polygon points="437.9,151 437.9,361 349.5,315.4" fill="url(#d20ShMidR)" stroke="url(#d20LogoEdgeNeon)" stroke-width="6" stroke-linejoin="round" />
    <polygon points="74.1,361 256,466 162.5,315.4" fill="url(#d20ShBotL)" stroke="url(#d20LogoEdgeNeon)" stroke-width="6" stroke-linejoin="round" />
    <polygon points="437.9,361 256,466 349.5,315.4" fill="url(#d20ShBotR)" stroke="url(#d20LogoEdgeNeon)" stroke-width="6" stroke-linejoin="round" />
    <polygon points="162.5,315.4 349.5,315.4 256,466" fill="url(#d20ShBotC)" stroke="url(#d20LogoEdgeNeon)" stroke-width="6" stroke-linejoin="round" />
    <polygon points="256,142.6 349.5,315.4 162.5,315.4" fill="url(#d20ShCenter)" stroke="url(#d20LogoEdgeNeon)" stroke-width="8" stroke-linejoin="round" />

    <!-- Radiant Vertices -->
    <circle cx="256" cy="46" r="6" fill="#00f0ff" />
    <circle cx="437.9" cy="151" r="6" fill="#c084fc" />
    <circle cx="437.9" cy="361" r="6" fill="#fb7185" />
    <circle cx="256" cy="466" r="6" fill="#f43f5e" />
    <circle cx="74.1" cy="361" r="6" fill="#38bdf8" />
    <circle cx="74.1" cy="151" r="6" fill="#00f0ff" />
    <circle cx="256" cy="142.6" r="6.5" fill="#38bdf8" />
    <circle cx="349.5" cy="315.4" r="6.5" fill="#fb7185" />
    <circle cx="162.5" cy="315.4" r="6.5" fill="#c084fc" />

    <!-- The Iconic 'H' in the Center of the D20 Face - Crisp, Bold & High Contrast -->
    <path
      d="M 164 156
         L 226 156
         L 214 172
         L 214 236
         L 298 236
         L 298 172
         L 286 156
         L 348 156
         L 336 172
         L 336 340
         L 348 356
         L 286 356
         L 298 340
         L 298 276
         L 214 276
         L 214 340
         L 226 356
         L 164 356
         L 176 340
         L 176 172
         Z"
      fill="url(#d20LogoHNeonGrad)"
      stroke="#ffffff"
      stroke-width="5.5"
      stroke-opacity="0.95"
      stroke-linejoin="round"
    />

    <!-- Center Specular Gleam on the Crossbar -->
    <line
      x1="214"
      y1="256"
      x2="298"
      y2="256"
      stroke="#ffffff"
      stroke-width="6"
      stroke-opacity="0.95"
      stroke-linecap="round"
    />
  </g>
</svg>`;
}

// Function to construct a true Windows .ICO file with multiple PNG resolutions
function buildIcoFile(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(count, 4); // count

  let offset = 6 + 16 * count;
  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    offset += img.buffer.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...images.map((img) => img.buffer)]);
}

async function generateAllIcons() {
  const targets = [path.resolve('public')];
  if (fs.existsSync(path.resolve('dist'))) {
    targets.push(path.resolve('dist'));
  }

  // 100% transparent background for ALL icons - NO square borders or boxes
  const transparentSvg = getDefinitiveHecosSvg();
  const transparentBuf = Buffer.from(transparentSvg);

  console.log('Rendering high-contrast transparent PNG buffers...');
  const b16 = await sharp(transparentBuf).resize(16, 16).png().toBuffer();
  const b32 = await sharp(transparentBuf).resize(32, 32).png().toBuffer();
  const b48 = await sharp(transparentBuf).resize(48, 48).png().toBuffer();
  const b64 = await sharp(transparentBuf).resize(64, 64).png().toBuffer();
  const b180 = await sharp(transparentBuf).resize(180, 180).png().toBuffer();
  const b192 = await sharp(transparentBuf).resize(192, 192).png().toBuffer();
  const b512 = await sharp(transparentBuf).resize(512, 512).png().toBuffer();

  // Multi-resolution ICO file (16, 32, 48) - 100% transparent
  const icoFile = buildIcoFile([
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
  ]);

  for (const dir of targets) {
    console.log(`Writing icons to: ${dir}`);
    fs.writeFileSync(path.join(dir, 'favicon.svg'), transparentSvg);
    fs.writeFileSync(path.join(dir, 'icon.svg'), transparentSvg);

    fs.writeFileSync(path.join(dir, 'favicon-16x16.png'), b16);
    fs.writeFileSync(path.join(dir, 'favicon-32x32.png'), b32);
    fs.writeFileSync(path.join(dir, 'favicon-48x48.png'), b48);
    fs.writeFileSync(path.join(dir, 'favicon.png'), b64);
    fs.writeFileSync(path.join(dir, 'favicon.ico'), icoFile);

    // Completely transparent apple-touch-icon and PWA icons (no dark square background!)
    fs.writeFileSync(path.join(dir, 'apple-touch-icon.png'), b180);
    fs.writeFileSync(path.join(dir, 'pwa-192x192.png'), b192);
    fs.writeFileSync(path.join(dir, 'pwa-512x512.png'), b512);
    fs.writeFileSync(path.join(dir, 'icon.png'), b512);
    fs.writeFileSync(path.join(dir, 'hecos-d20-logo.png'), b512);
    fs.writeFileSync(path.join(dir, 'pwa-maskable-512x512.png'), b512);
  }

  console.log('Successfully generated all icons with 100% transparent background and ultra-crisp H!');
}

generateAllIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});


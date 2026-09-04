import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Exact identical SVG markup as the site logo (HecosLogoD20)
function getHecosLogoExactSvg(transparent = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Facet Edge Glow Gradient -->
    <linearGradient id="d20LogoEdgeNeon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="30%" stop-color="#38bdf8" />
      <stop offset="65%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#fb7185" />
    </linearGradient>

    <!-- Letter H Gradient (Signature Hecos: Cyan -> Purple -> Rose) -->
    <linearGradient id="d20LogoHNeonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#22d3ee" />
      <stop offset="35%" stop-color="#a855f7" />
      <stop offset="70%" stop-color="#e11d48" />
      <stop offset="100%" stop-color="#fb7185" />
    </linearGradient>

    <!-- Dark Obsidian Facet Shaders -->
    <linearGradient id="d20ShTopL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10192a" />
      <stop offset="100%" stop-color="#080d17" />
    </linearGradient>
    <linearGradient id="d20ShTopR" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#26102a" />
      <stop offset="100%" stop-color="#0e0612" />
    </linearGradient>
    <linearGradient id="d20ShUpperL" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#0c2030" />
      <stop offset="100%" stop-color="#07121c" />
    </linearGradient>
    <linearGradient id="d20ShUpperR" x1="100%" y1="50%" x2="0%" y2="50%">
      <stop offset="0%" stop-color="#2c0d22" />
      <stop offset="100%" stop-color="#12040e" />
    </linearGradient>
    <linearGradient id="d20ShMidL" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#081827" />
      <stop offset="100%" stop-color="#050e18" />
    </linearGradient>
    <linearGradient id="d20ShMidR" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2d0d24" />
      <stop offset="100%" stop-color="#130410" />
    </linearGradient>
    <linearGradient id="d20ShBotL" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f1628" />
      <stop offset="100%" stop-color="#070b16" />
    </linearGradient>
    <linearGradient id="d20ShBotR" x1="100%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#260f1e" />
      <stop offset="100%" stop-color="#0f040c" />
    </linearGradient>
    <linearGradient id="d20ShBotC" x1="50%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" stop-color="#1d0d29" />
      <stop offset="100%" stop-color="#0b0412" />
    </linearGradient>
    <linearGradient id="d20ShCenter" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#18112c" />
      <stop offset="100%" stop-color="#0f091f" />
    </linearGradient>

    <!-- Ambient Neon Edge Glow -->
    <filter id="d20NeonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- High-Legibility Glow on the 'H' -->
    <filter id="d20HDrop" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#a855f7" flood-opacity="0.9" />
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#00f0ff" flood-opacity="0.5" />
    </filter>
  </defs>

  ${transparent ? '' : `
  <!-- Dark Obsidian Atmosphere for Apple/Maskable Icons -->
  <rect width="512" height="512" rx="116" fill="#09080e" />
  <circle cx="160" cy="180" r="150" fill="#00f0ff" opacity="0.12" filter="blur(40px)" />
  <circle cx="350" cy="190" r="150" fill="#e11d48" opacity="0.12" filter="blur(40px)" />
  <circle cx="256" cy="330" r="160" fill="#a855f7" opacity="0.14" filter="blur(45px)" />
  `}

  <!-- Subtle Outer Atmosphere behind Die -->
  <circle cx="256" cy="256" r="210" fill="url(#d20LogoEdgeNeon)" opacity="0.10" />

  <!-- 10 Facets of the D20 Die -->
  <g filter="url(#d20NeonGlow)">
    <polygon points="256,46 74.1,151 256,142.6" fill="url(#d20ShTopL)" stroke="url(#d20LogoEdgeNeon)" stroke-width="5" stroke-linejoin="round" />
    <polygon points="256,46 437.9,151 256,142.6" fill="url(#d20ShTopR)" stroke="url(#d20LogoEdgeNeon)" stroke-width="5" stroke-linejoin="round" />
    <polygon points="74.1,151 256,142.6 162.5,315.4" fill="url(#d20ShUpperL)" stroke="url(#d20LogoEdgeNeon)" stroke-width="5" stroke-linejoin="round" />
    <polygon points="437.9,151 256,142.6 349.5,315.4" fill="url(#d20ShUpperR)" stroke="url(#d20LogoEdgeNeon)" stroke-width="5" stroke-linejoin="round" />
    <polygon points="74.1,151 74.1,361 162.5,315.4" fill="url(#d20ShMidL)" stroke="url(#d20LogoEdgeNeon)" stroke-width="5" stroke-linejoin="round" />
    <polygon points="437.9,151 437.9,361 349.5,315.4" fill="url(#d20ShMidR)" stroke="url(#d20LogoEdgeNeon)" stroke-width="5" stroke-linejoin="round" />
    <polygon points="74.1,361 256,466 162.5,315.4" fill="url(#d20ShBotL)" stroke="url(#d20LogoEdgeNeon)" stroke-width="5" stroke-linejoin="round" />
    <polygon points="437.9,361 256,466 349.5,315.4" fill="url(#d20ShBotR)" stroke="url(#d20LogoEdgeNeon)" stroke-width="5" stroke-linejoin="round" />
    <polygon points="162.5,315.4 349.5,315.4 256,466" fill="url(#d20ShBotC)" stroke="url(#d20LogoEdgeNeon)" stroke-width="5" stroke-linejoin="round" />
    <polygon points="256,142.6 349.5,315.4 162.5,315.4" fill="url(#d20ShCenter)" stroke="url(#d20LogoEdgeNeon)" stroke-width="6.5" stroke-linejoin="round" />
  </g>

  <!-- Radiant Vertices -->
  <circle cx="256" cy="46" r="4.5" fill="#00f0ff" />
  <circle cx="437.9" cy="151" r="4.5" fill="#c084fc" />
  <circle cx="437.9" cy="361" r="4.5" fill="#fb7185" />
  <circle cx="256" cy="466" r="4.5" fill="#f43f5e" />
  <circle cx="74.1" cy="361" r="4.5" fill="#38bdf8" />
  <circle cx="74.1" cy="151" r="4.5" fill="#00f0ff" />
  <circle cx="256" cy="142.6" r="5" fill="#38bdf8" />
  <circle cx="349.5" cy="315.4" r="5" fill="#fb7185" />
  <circle cx="162.5" cy="315.4" r="5" fill="#c084fc" />

  <!-- The Iconic 'H' in the Center of the D20 Face - Enlarged & Bold for High Legibility -->
  <g filter="url(#d20HDrop)">
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
      stroke-width="2.2"
      stroke-opacity="0.6"
    />
  </g>

  <!-- Center Specular Gleam on the Crossbar -->
  <line x1="220" y1="256" x2="292" y2="256" stroke="#ffffff" stroke-width="3" stroke-opacity="0.65" stroke-linecap="round" />
</svg>`;
}

async function generateIcons() {
  const publicDir = path.resolve('public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Pure transparent SVG matching the site logo exactly
  const transparentSvg = getHecosLogoExactSvg(true);
  const withBgSvg = getHecosLogoExactSvg(false);

  const transparentBuffer = Buffer.from(transparentSvg);
  const withBgBuffer = Buffer.from(withBgSvg);

  console.log('Writing transparent favicon.svg and icon.svg...');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), transparentSvg);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), transparentSvg);

  console.log('Generating crisp PNG icon assets from transparent vector SVG...');

  // 1. 16x16 favicon (transparent)
  await sharp(transparentBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  // 2. 32x32 favicon (transparent)
  await sharp(transparentBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  // 3. favicon.ico from 32x32 transparent
  await sharp(transparentBuffer)
    .resize(32, 32)
    .toFile(path.join(publicDir, 'favicon.ico'));

  // 4. 64x64 favicon (transparent)
  await sharp(transparentBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  // 5. 180x180 Apple Touch Icon (uses dark background with ambient glow so iOS renders it pristinely)
  await sharp(withBgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 6. PWA 192x192 (transparent)
  await sharp(transparentBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 7. PWA 512x512 (transparent)
  await sharp(transparentBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 8. Generic icon.png (transparent)
  await sharp(transparentBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon.png'));

  // 9. Transparent D20 logo (transparent)
  await sharp(transparentBuffer)
    .resize(256, 256)
    .png()
    .toFile(path.join(publicDir, 'hecos-d20-logo.png'));

  // 10. Maskable icon 512x512 with safe margin on #09080e background (for Android adaptive icons)
  const innerBuffer = await sharp(transparentBuffer)
    .resize(410, 410)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 9, g: 8, b: 14, alpha: 1 }, // #09080e
    },
  })
    .composite([{ input: innerBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Successfully generated all icon assets in /public with pure transparency matching the site logo!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

/**
 * The share card. Generated rather than hand-exported so it stays in step
 * with the palette and typography, and so there is no binary in the repo that
 * nobody can regenerate.
 */
const W = 1200, H = 630;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="#141416"/>
      <stop offset="55%" stop-color="#0B0B0C"/>
      <stop offset="100%" stop-color="#1B1014"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="0" width="${W}" height="4" fill="#D99A2B"/>

  <text x="80" y="150" fill="#948E83" font-family="Courier New, monospace"
        font-size="20" letter-spacing="8">LOS ANGELES</text>

  <text x="80" y="290" fill="#E9E3D7" font-family="Georgia, 'Times New Roman', serif"
        font-size="86" letter-spacing="6">MARROW &amp; HEARTH</text>

  <text x="80" y="370" fill="#E9E3D7" font-family="Georgia, serif" font-size="40">
    Three kitchens, one fire
  </text>

  <line x1="80" y1="430" x2="1120" y2="430" stroke="#2C2C31" stroke-width="1"/>

  <text x="80" y="490" fill="#D99A2B" font-family="Courier New, monospace"
        font-size="22" letter-spacing="5">NO ALCOHOL. NO COMPROMISE.</text>

  <text x="80" y="545" fill="#635E56" font-family="Courier New, monospace"
        font-size="18" letter-spacing="3">HALAL CERTIFIED  ·  ZERO-PROOF BAR PROGRAMME</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();
writeFileSync('public/og-default.png', png);
const meta = await sharp(png).metadata();
console.log(`og image: ${meta.width}x${meta.height}, ${(png.length / 1024).toFixed(0)}kb -> public/og-default.png`);

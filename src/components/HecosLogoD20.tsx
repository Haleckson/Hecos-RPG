import React from 'react';

interface HecosLogoD20Props {
  className?: string;
  size?: number | string;
  title?: string;
}

export const HecosLogoD20: React.FC<HecosLogoD20Props> = ({
  className = 'w-10 h-10',
  size,
  title = 'Hecos D20',
}) => {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        {/* Facet Edge Glow Gradient */}
        <linearGradient id="d20LogoEdgeNeon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="30%" stopColor="#38bdf8" />
          <stop offset="65%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>

        {/* Letter H Gradient (Signature Hecos: Cyan -> Purple -> Rose) */}
        <linearGradient id="d20LogoHNeonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="35%" stopColor="#a855f7" />
          <stop offset="70%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>

        {/* Dark Obsidian Facet Shaders */}
        <linearGradient id="d20ShTopL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10192a" />
          <stop offset="100%" stopColor="#080d17" />
        </linearGradient>
        <linearGradient id="d20ShTopR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#26102a" />
          <stop offset="100%" stopColor="#0e0612" />
        </linearGradient>
        <linearGradient id="d20ShUpperL" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#0c2030" />
          <stop offset="100%" stopColor="#07121c" />
        </linearGradient>
        <linearGradient id="d20ShUpperR" x1="100%" y1="50%" x2="0%" y2="50%">
          <stop offset="0%" stopColor="#2c0d22" />
          <stop offset="100%" stopColor="#12040e" />
        </linearGradient>
        <linearGradient id="d20ShMidL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#081827" />
          <stop offset="100%" stopColor="#050e18" />
        </linearGradient>
        <linearGradient id="d20ShMidR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2d0d24" />
          <stop offset="100%" stopColor="#130410" />
        </linearGradient>
        <linearGradient id="d20ShBotL" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0f1628" />
          <stop offset="100%" stopColor="#070b16" />
        </linearGradient>
        <linearGradient id="d20ShBotR" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#260f1e" />
          <stop offset="100%" stopColor="#0f040c" />
        </linearGradient>
        <linearGradient id="d20ShBotC" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#1d0d29" />
          <stop offset="100%" stopColor="#0b0412" />
        </linearGradient>
        <linearGradient id="d20ShCenter" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#18112c" />
          <stop offset="100%" stopColor="#0f091f" />
        </linearGradient>

        {/* Ambient Neon Edge Glow */}
        <filter id="d20NeonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* High-Legibility Glow on the 'H' */}
        <filter id="d20HDrop" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#a855f7" floodOpacity="0.9" />
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#00f0ff" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Subtle Outer Atmosphere behind Die */}
      <circle cx="256" cy="256" r="210" fill="url(#d20LogoEdgeNeon)" opacity="0.07" />

      {/* 10 Facets of the D20 Die */}
      <g filter="url(#d20NeonGlow)">
        {/* Top-Left Facet */}
        <polygon
          points="256,46 74.1,151 256,142.6"
          fill="url(#d20ShTopL)"
          stroke="url(#d20LogoEdgeNeon)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Top-Right Facet */}
        <polygon
          points="256,46 437.9,151 256,142.6"
          fill="url(#d20ShTopR)"
          stroke="url(#d20LogoEdgeNeon)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Upper-Left Facet */}
        <polygon
          points="74.1,151 256,142.6 162.5,315.4"
          fill="url(#d20ShUpperL)"
          stroke="url(#d20LogoEdgeNeon)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Upper-Right Facet */}
        <polygon
          points="437.9,151 256,142.6 349.5,315.4"
          fill="url(#d20ShUpperR)"
          stroke="url(#d20LogoEdgeNeon)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Mid-Left Facet */}
        <polygon
          points="74.1,151 74.1,361 162.5,315.4"
          fill="url(#d20ShMidL)"
          stroke="url(#d20LogoEdgeNeon)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Mid-Right Facet */}
        <polygon
          points="437.9,151 437.9,361 349.5,315.4"
          fill="url(#d20ShMidR)"
          stroke="url(#d20LogoEdgeNeon)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Bottom-Left Facet */}
        <polygon
          points="74.1,361 256,466 162.5,315.4"
          fill="url(#d20ShBotL)"
          stroke="url(#d20LogoEdgeNeon)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Bottom-Right Facet */}
        <polygon
          points="437.9,361 256,466 349.5,315.4"
          fill="url(#d20ShBotR)"
          stroke="url(#d20LogoEdgeNeon)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Bottom-Center Facet */}
        <polygon
          points="162.5,315.4 349.5,315.4 256,466"
          fill="url(#d20ShBotC)"
          stroke="url(#d20LogoEdgeNeon)"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Central Featured Facet (Triangular face pointing up) */}
        <polygon
          points="256,142.6 349.5,315.4 162.5,315.4"
          fill="url(#d20ShCenter)"
          stroke="url(#d20LogoEdgeNeon)"
          strokeWidth="6.5"
          strokeLinejoin="round"
        />
      </g>

      {/* Radiant Vertices */}
      <g>
        <circle cx="256" cy="46" r="4.5" fill="#00f0ff" />
        <circle cx="437.9" cy="151" r="4.5" fill="#c084fc" />
        <circle cx="437.9" cy="361" r="4.5" fill="#fb7185" />
        <circle cx="256" cy="466" r="4.5" fill="#f43f5e" />
        <circle cx="74.1" cy="361" r="4.5" fill="#38bdf8" />
        <circle cx="74.1" cy="151" r="4.5" fill="#00f0ff" />
        <circle cx="256" cy="142.6" r="5" fill="#38bdf8" />
        <circle cx="349.5" cy="315.4" r="5" fill="#fb7185" />
        <circle cx="162.5" cy="315.4" r="5" fill="#c084fc" />
      </g>

      {/* The Iconic 'H' in the Central D20 Face */}
      <g filter="url(#d20HDrop)">
        <path
          d="M 204 204
             L 242 204
             L 238 214
             L 234 214
             L 234 238
             L 278 238
             L 278 214
             L 274 214
             L 270 204
             L 308 204
             L 304 214
             L 300 214
             L 300 286
             L 304 286
             L 308 296
             L 270 296
             L 274 286
             L 278 286
             L 278 262
             L 234 262
             L 234 286
             L 238 286
             L 242 296
             L 204 296
             L 208 286
             L 212 286
             L 212 214
             L 208 214
             Z"
          fill="url(#d20LogoHNeonGrad)"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeOpacity="0.45"
        />
      </g>

      {/* Center Specular Gleam on the Crossbar */}
      <line
        x1="236"
        y1="250"
        x2="276"
        y2="250"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

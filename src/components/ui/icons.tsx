import type { ReactNode } from "react";
import type { Level } from "../../game/types";

/**
 * ¡Vamos! icon system — every icon is hand-drawn SVG in one visual language:
 * chunky flat fills + a dark under-layer offset downward (echoing the game's
 * signature 3D pressed-button look) + a small white gloss highlight.
 * No emojis: one identity across the whole app.
 */

interface IconProps {
  className?: string;
}

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className ?? "h-6 w-6"}
    >
      {children}
    </svg>
  );
}

/** Dark under-layer: same shape nudged down — works on any background. */
function Under({ d }: { d: string }) {
  return <path d={d} transform="translate(0 1.4)" fill="#000" opacity="0.22" />;
}

// ---------------------------------------------------------------- UI icons

const PLAY_D = "M8.2 5.9c0-1.5 1.63-2.44 2.93-1.68l9.13 5.35c1.28.75 1.28 2.6 0 3.35l-9.13 5.35c-1.3.76-2.93-.18-2.93-1.68V5.9Z";

export function IconPlay({ className }: IconProps) {
  return (
    <Svg className={className}>
      <Under d={PLAY_D} />
      <path d={PLAY_D} fill="currentColor" />
      <path
        d="M9.6 6.6c0-.5.54-.8.97-.55l7.6 4.45"
        stroke="#fff"
        strokeOpacity="0.5"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconSwords({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g transform="translate(0 1.2)" opacity="0.22">
        <SwordShapes solid="#000" />
      </g>
      <SwordShapes solid="currentColor" />
    </Svg>
  );
}

function SwordShapes({ solid }: { solid: string }) {
  return (
    <g>
      {/* blades — lighter than the hilts so the icon reads as swords, not an X */}
      <g fill={solid} opacity="0.45">
        <path d="M4 2.6c0-.3.3-.55.6-.5l2.5.4c.25.04.48.16.66.34l8.54 8.56-2.1 2.1L5.66 5c-.18-.18-.3-.41-.34-.66L4 2.6Z" />
        <path d="M20 2.6c0-.3-.3-.55-.6-.5l-2.5.4c-.25.04-.48.16-.66.34L7.7 11.4l2.1 2.1L14.34 9 18.34 5c.18-.18.3-.41.34-.66L20 2.6Z" />
      </g>
      <g fill={solid}>
        {/* cross-guards */}
        <rect x="12.3" y="12.05" width="7" height="2.5" rx="1.25" transform="rotate(45 15.8 13.3)" />
        <rect x="4.7" y="12.05" width="7" height="2.5" rx="1.25" transform="rotate(-45 8.2 13.3)" />
        {/* grips */}
        <rect x="4.85" y="15.7" width="4.4" height="2.4" rx="1.2" transform="rotate(-45 7.05 16.9)" />
        <rect x="14.75" y="15.7" width="4.4" height="2.4" rx="1.2" transform="rotate(45 16.95 16.9)" />
        {/* pommels */}
        <circle cx="4.9" cy="19.3" r="1.8" />
        <circle cx="19.1" cy="19.3" r="1.8" />
      </g>
    </g>
  );
}

export function IconCards({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g transform="translate(0 1.3)" opacity="0.22">
        <rect x="3.4" y="4.6" width="11" height="15" rx="2.4" fill="#000" transform="rotate(-8 8.9 12.1)" />
        <rect x="9.6" y="4.4" width="11" height="15" rx="2.4" fill="#000" transform="rotate(8 15.1 11.9)" />
      </g>
      <rect x="3.4" y="4.6" width="11" height="15" rx="2.4" fill="currentColor" opacity="0.55" transform="rotate(-8 8.9 12.1)" />
      <rect x="9.6" y="4.4" width="11" height="15" rx="2.4" fill="currentColor" transform="rotate(8 15.1 11.9)" />
      <text
        x="15.2"
        y="14.9"
        transform="rotate(8 15.1 11.9)"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="900"
        fill="#fff"
        style={{ fontFamily: "inherit" }}
      >
        ñ
      </text>
    </Svg>
  );
}

const HEART_D = "M12 20.4c-.4 0-.8-.14-1.12-.42C7.6 17.2 3.4 13.9 3.4 9.9c0-2.9 2.13-4.9 4.7-4.9 1.55 0 2.98.77 3.9 2 .92-1.23 2.35-2 3.9-2 2.57 0 4.7 2 4.7 4.9 0 4-4.2 7.3-7.48 10.08-.32.28-.72.42-1.12.42Z";

export function IconHeart({ className }: IconProps) {
  return (
    <Svg className={className}>
      <Under d={HEART_D} />
      <path d={HEART_D} fill="#FF4B4B" />
      <ellipse cx="8.3" cy="8.6" rx="1.9" ry="1.3" fill="#fff" opacity="0.45" transform="rotate(-28 8.3 8.6)" />
    </Svg>
  );
}

const FLAME_OUTER = "M12 21.5c-4.3 0-7.2-2.8-7.2-6.7 0-2.6 1.5-4.6 2.9-6.3 1.2-1.5 2.4-2.9 2.8-4.8.1-.65.8-1 1.36-.66 2.5 1.5 7.34 5.6 7.34 11.76 0 3.9-2.9 6.7-7.2 6.7Z";
const FLAME_INNER = "M12 21.5c-2.4 0-4-1.6-4-3.8 0-1.9 1.2-3.3 2.4-4.5.5-.5 1-1 1.35-1.55.2-.3.63-.32.85-.03 1 1.3 3.4 3.4 3.4 6.08 0 2.2-1.6 3.8-4 3.8Z";

export function IconFlame({ className }: IconProps) {
  return (
    <Svg className={className}>
      <Under d={FLAME_OUTER} />
      <path d={FLAME_OUTER} fill="#FF9600" />
      <path d={FLAME_INNER} fill="#FFC800" />
    </Svg>
  );
}

export function IconTarget({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="13.4" r="9" fill="#000" opacity="0.22" />
      <circle cx="12" cy="12" r="9" fill="#FF4B4B" />
      <circle cx="12" cy="12" r="6" fill="#FFF5F5" />
      <circle cx="12" cy="12" r="3.1" fill="#FF4B4B" />
      <circle cx="9.4" cy="9.2" r="1.5" fill="#fff" opacity="0.55" />
    </Svg>
  );
}

const BOLT_D = "M13.6 2.6c.5-.9-.4-1.4-1.1-.8L5.2 12.1c-.5.6-.1 1.5.7 1.5h4.1l-2.6 7.8c-.3.95.9 1.3 1.4.5l8-11.9c.45-.67 0-1.6-.8-1.6h-4.4l2-5.8Z";

export function IconBolt({ className }: IconProps) {
  return (
    <Svg className={className}>
      <Under d={BOLT_D} />
      <path d={BOLT_D} fill="#FFC800" />
      <path d="m12.9 3.1-4.3 6.4" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

const CROWN_D = "M4 8.2c-.7-.55.05-1.65.85-1.25l3.35 1.7 2.85-4.4c.44-.68 1.46-.68 1.9 0l2.85 4.4 3.35-1.7c.8-.4 1.55.7.85 1.25l-1.6 8.3H5.6L4 8.2Z";

export function IconCrown({ className }: IconProps) {
  return (
    <Svg className={className}>
      <Under d={CROWN_D} />
      <path d={CROWN_D} fill="#FFC800" />
      <rect x="5.6" y="16.5" width="12.8" height="2.9" rx="1.2" fill="#E6A800" />
      <circle cx="12" cy="11.4" r="1.5" fill="#fff" opacity="0.7" />
    </Svg>
  );
}

export function IconTrophy({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g transform="translate(0 1.3)" opacity="0.22">
        <TrophyShapes solid="#000" band="#000" />
      </g>
      <TrophyShapes solid="#FFC800" band="#E6A800" />
      <path d="M9.6 6.2c.2 2 .6 3.6 1.2 4.9" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function TrophyShapes({ solid, band }: { solid: string; band: string }) {
  return (
    <g>
      <path
        d="M7.2 3.4h9.6c0 4.9-1.6 9.3-4.8 9.3S7.2 8.3 7.2 3.4Z"
        fill={solid}
      />
      <path
        d="M7.5 5H4.9c-.2 2.9 1.3 5.2 3.6 5.7M16.5 5h2.6c.2 2.9-1.3 5.2-3.6 5.7"
        stroke={solid}
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M10.9 12.4h2.2l.5 3h-3.2l.5-3Z" fill={band} />
      <rect x="7.9" y="15.4" width="8.2" height="3" rx="1.2" fill={band} />
    </g>
  );
}

/** Checkered finish flag on a pole. */
export function IconFlag({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g transform="translate(0 1.3)" opacity="0.22">
        <rect x="5" y="2.6" width="2.2" height="18" rx="1.1" fill="#000" />
        <path d="M7.2 3.6h11.9v8.4H7.2z" fill="#000" />
      </g>
      <rect x="5" y="2.6" width="2.2" height="18" rx="1.1" fill="#B08968" />
      <path d="M7.2 3.6h11.9v8.4H7.2V3.6Z" fill="#fff" stroke="#172024" strokeWidth="0.6" />
      <g fill="#172024">
        <rect x="7.2" y="3.6" width="3" height="2.8" />
        <rect x="13.2" y="3.6" width="3" height="2.8" />
        <rect x="10.2" y="6.4" width="3" height="2.8" />
        <rect x="16.2" y="6.4" width="2.9" height="2.8" />
        <rect x="7.2" y="9.2" width="3" height="2.8" />
        <rect x="13.2" y="9.2" width="3" height="2.8" />
      </g>
    </Svg>
  );
}

export function IconMic({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g transform="translate(0 1.3)" opacity="0.22">
        <rect x="9" y="2.6" width="6" height="11" rx="3" fill="#000" />
      </g>
      <rect x="9" y="2.6" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M6.2 10.6a5.8 5.8 0 0 0 11.6 0M12 16.4v3.2M9.2 19.6h5.6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="10.2" y="4" width="1.4" height="5" rx="0.7" fill="#fff" opacity="0.45" />
    </Svg>
  );
}

export function IconChat({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g transform="translate(0 1.3)" opacity="0.22">
        <path d="M12 3.2c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-.9 0-1.9-.1-2.7-.35L5 20.4c-.7.4-1.5-.3-1.3-1l.9-3A7.3 7.3 0 0 1 3 10.9c0-4.3 4-7.7 9-7.7Z" fill="#000" />
      </g>
      <path d="M12 3.2c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-.9 0-1.9-.1-2.7-.35L5 20.4c-.7.4-1.5-.3-1.3-1l.9-3A7.3 7.3 0 0 1 3 10.9c0-4.3 4-7.7 9-7.7Z" fill="currentColor" />
      <g fill="#fff" opacity="0.9">
        <circle cx="8.2" cy="11" r="1.25" />
        <circle cx="12" cy="11" r="1.25" />
        <circle cx="15.8" cy="11" r="1.25" />
      </g>
    </Svg>
  );
}

export function IconRetry({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g transform="translate(0 1.2)" opacity="0.22">
        <RetryShape solid="#000" />
      </g>
      <RetryShape solid="currentColor" />
    </Svg>
  );
}

function RetryShape({ solid }: { solid: string }) {
  return (
    <g>
      <path
        d="M19.2 12a7.2 7.2 0 1 1-2.4-5.37"
        stroke={solid}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M17.6 2.4 18.3 7.3 13.4 6.6l4.2-4.2Z" fill={solid} />
    </g>
  );
}

/** Little celebratory sparkle pair (XP / magic). */
export function IconSparkle({ className }: IconProps) {
  return (
    <Svg className={className}>
      <Under d="M9.5 3.6c.3-.9 1.6-.9 1.9 0l1.2 3.7 3.7 1.2c.9.3.9 1.6 0 1.9l-3.7 1.2-1.2 3.7c-.3.9-1.6.9-1.9 0L8.3 11.6 4.6 10.4c-.9-.3-.9-1.6 0-1.9l3.7-1.2 1.2-3.7Z" />
      <path
        d="M9.5 3.6c.3-.9 1.6-.9 1.9 0l1.2 3.7 3.7 1.2c.9.3.9 1.6 0 1.9l-3.7 1.2-1.2 3.7c-.3.9-1.6.9-1.9 0L8.3 11.6 4.6 10.4c-.9-.3-.9-1.6 0-1.9l3.7-1.2 1.2-3.7Z"
        fill="#FFC800"
      />
      <path
        d="M17.2 13.4c.2-.6 1.1-.6 1.3 0l.7 2.1 2.1.7c.6.2.6 1.1 0 1.3l-2.1.7-.7 2.1c-.2.6-1.1.6-1.3 0l-.7-2.1-2.1-.7c-.6-.2-.6-1.1 0-1.3l2.1-.7.7-2.1Z"
        fill="#8B5CF6"
      />
    </Svg>
  );
}

const SPROUT_STEM = "M12 20.5v-6.2";
export function IconSprout({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d={SPROUT_STEM} stroke="#58A700" strokeWidth="2.2" strokeLinecap="round" transform="translate(0 1.2)" opacity="0.22" />
      <path
        d="M12 14.6C12 9.8 8.7 7.4 4.6 7.2c-.5 0-.9.4-.85.9.35 4.3 3.35 6.9 8.25 6.5Z"
        fill="#58CC02"
      />
      <path
        d="M12 12.4c0-3.9 2.7-5.9 6.05-6.05.5-.02.9.4.83.9-.5 3.5-2.98 5.6-6.88 5.15Z"
        fill="#8EE000"
      />
      <path d={SPROUT_STEM} stroke="#58A700" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

const STAR_D = "M12 2.9c.4 0 .77.23.94.6l2.3 4.9 5.14.66c.86.11 1.2 1.18.57 1.77l-3.8 3.5 1 5.15c.16.85-.74 1.5-1.5 1.08L12 18l-4.65 2.56c-.76.42-1.66-.23-1.5-1.08l1-5.15-3.8-3.5c-.63-.59-.29-1.66.57-1.77l5.14-.66 2.3-4.9c.17-.37.54-.6.94-.6Z";

export function IconStar({ className }: IconProps) {
  return (
    <Svg className={className}>
      <Under d={STAR_D} />
      <path d={STAR_D} fill="#FFC800" />
      <circle cx="9.6" cy="8.4" r="1.2" fill="#fff" opacity="0.6" />
    </Svg>
  );
}

export function IconHourglass({ className }: IconProps) {
  return (
    <Svg className={className}>
      <g transform="translate(0 1.3)" opacity="0.22">
        <path d="M6.5 3h11l-3.9 9 3.9 9h-11l3.9-9-3.9-9Z" fill="#000" />
      </g>
      <path d="M7 3.4h10c.8 0 1.2.9.7 1.5L14 9.6c-.9 1.1-.9 2.7 0 3.8l3.7 4.7c.5.6.06 1.5-.7 1.5H7c-.8 0-1.2-.9-.7-1.5l3.7-4.7c.9-1.1.9-2.7 0-3.8L6.3 4.9c-.5-.6-.06-1.5.7-1.5Z" fill="#1CB0F6" />
      <path d="M9.2 5.4h5.6L12.6 8.3a.75.75 0 0 1-1.2 0L9.2 5.4Z" fill="#fff" opacity="0.85" />
      <path d="M12 14.5c.3 0 .55.15.7.4l1.7 2.6H9.6l1.7-2.6c.15-.25.4-.4.7-.4Z" fill="#fff" opacity="0.85" />
    </Svg>
  );
}

// -------------------------------------------------------------- Level icons

export function LevelIcon({ level, className }: IconProps & { level: Level }) {
  switch (level) {
    case "easy":
      return <IconSprout className={className} />;
    case "medium":
      return <IconStar className={className} />;
    case "hard":
      return <IconFlame className={className} />;
    case "expert":
      return <IconCrown className={className} />;
  }
}

// ------------------------------------------------------------------ Avatars

/**
 * Avatar badges. Profiles store a short key (legacy: the old emoji) — every
 * known key maps to a designed badge: colored disc + white glyph + dark rim.
 * Unknown keys fall back to rendering the raw string, so nothing breaks.
 */

interface BadgeSpec {
  bg: string;
  rim: string;
  glyph: ReactNode;
}

const WHITE = "#FFFFFF";

const AVATAR_BADGES: Record<string, BadgeSpec> = {
  // hero — shield + star
  "🦸": {
    bg: "#58CC02",
    rim: "#47A302",
    glyph: (
      <g>
        <path d="M12 5.2 18 7.4v4.2c0 3.6-2.4 6.2-6 7.2-3.6-1-6-3.6-6-7.2V7.4l6-2.2Z" fill={WHITE} />
        <path d="m12 8.6.95 1.92 2.12.31-1.53 1.5.36 2.11L12 13.44l-1.9 1-.36-2.11-1.53-1.5 2.12-.3L12 8.6Z" fill="#58CC02" />
      </g>
    ),
  },
  // astronaut — helmet + visor
  "🧑‍🚀": {
    bg: "#1CB0F6",
    rim: "#1899D6",
    glyph: (
      <g>
        <circle cx="12" cy="11.4" r="6.4" fill={WHITE} />
        <path d="M7.6 10.4a4.9 4.9 0 0 1 8.8 0c.5 1-.2 2.2-1.3 2.2H8.9c-1.1 0-1.8-1.2-1.3-2.2Z" fill="#1899D6" />
        <rect x="9" y="17" width="6" height="2.2" rx="1.1" fill={WHITE} />
      </g>
    ),
  },
  // tiger — paw print
  "🐯": {
    bg: "#FF9600",
    rim: "#E07E00",
    glyph: (
      <g fill={WHITE}>
        <ellipse cx="12" cy="14.6" rx="3.6" ry="3.1" />
        <circle cx="7.6" cy="11.2" r="1.6" />
        <circle cx="10.6" cy="8.9" r="1.6" />
        <circle cx="13.4" cy="8.9" r="1.6" />
        <circle cx="16.4" cy="11.2" r="1.6" />
      </g>
    ),
  },
  // parrot — feather
  "🦜": {
    bg: "#FF4B4B",
    rim: "#E03B3B",
    glyph: (
      <g>
        <path
          d="M16.6 6.2c.5-.05.9.35.85.85-.3 3.4-1.5 6.1-3.6 8.2-1.6 1.6-3.5 2.4-5.3 2.9-.6.16-1.1-.44-.9-1 .7-2.1 1.6-4.3 3.2-6 1.6-1.7 3.6-4.6 5.75-4.95Z"
          fill={WHITE}
        />
        <path d="M7.4 18.4c2.2-2.9 4.6-5.8 7.7-8.5" stroke="#FF4B4B" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      </g>
    ),
  },
  // taco
  "🌮": {
    bg: "#FFC800",
    rim: "#E6A800",
    glyph: (
      <g>
        <path d="M4.8 16.6a7.2 7.2 0 0 1 14.4 0v.8H4.8v-.8Z" fill={WHITE} />
        <g fill="#FFC800">
          <circle cx="8.4" cy="11.8" r="1.05" />
          <circle cx="12" cy="10.6" r="1.05" />
          <circle cx="15.6" cy="11.8" r="1.05" />
        </g>
      </g>
    ),
  },
  // bolt
  "⚡": {
    bg: "#8B5CF6",
    rim: "#7C3AED",
    glyph: (
      <path
        d="M13.4 5.2c.4-.7-.35-1.1-.9-.6l-6 6.9c-.4.45-.1 1.15.5 1.15h3.3l-1.9 5.8c-.25.75.7 1.05 1.15.4l6.2-8.6c.35-.5 0-1.2-.6-1.2h-3.5l1.75-3.85Z"
        fill={WHITE}
      />
    ),
  },
  // flame
  "🔥": {
    bg: "#FF6B3D",
    rim: "#E5522A",
    glyph: (
      <path
        d="M12 18.6c-3 0-5-1.9-5-4.6 0-1.8 1-3.2 2-4.4.85-1 1.7-2 2-3.3.1-.45.6-.7 1-.45 1.75 1.05 5 3.9 5 8.15 0 2.7-2 4.6-5 4.6Z"
        fill={WHITE}
      />
    ),
  },
  // target
  "🎯": {
    bg: "#00CD9C",
    rim: "#00B389",
    glyph: (
      <g>
        <circle cx="12" cy="12" r="6.2" fill={WHITE} />
        <circle cx="12" cy="12" r="3.9" fill="#00CD9C" />
        <circle cx="12" cy="12" r="1.7" fill={WHITE} />
      </g>
    ),
  },
  // bot opponent
  "🤖": {
    bg: "#8896A0",
    rim: "#71808B",
    glyph: (
      <g>
        <rect x="6.4" y="8.6" width="11.2" height="8.4" rx="2.6" fill={WHITE} />
        <path d="M12 5.4v3.2" stroke={WHITE} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="4.9" r="1.3" fill={WHITE} />
        <circle cx="9.5" cy="12.2" r="1.35" fill="#8896A0" />
        <circle cx="14.5" cy="12.2" r="1.35" fill="#8896A0" />
        <rect x="9.4" y="14.6" width="5.2" height="1.15" rx="0.575" fill="#8896A0" />
      </g>
    ),
  },
  // unknown opponent
  "❓": {
    bg: "#C8D1D9",
    rim: "#AEB9C2",
    glyph: (
      <text
        x="12"
        y="16.4"
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fill={WHITE}
        style={{ fontFamily: "inherit" }}
      >
        ?
      </text>
    ),
  },
};

export function Avatar({ id, className }: IconProps & { id: string }) {
  const spec = AVATAR_BADGES[id];
  if (!spec) {
    // unrecognized key (old data / future avatars) — degrade gracefully
    return <span className={className}>{id}</span>;
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className ?? "h-9 w-9"}>
      <circle cx="12" cy="12.7" r="11" fill={spec.rim} />
      <circle cx="12" cy="11.6" r="11" fill={spec.bg} />
      <ellipse cx="8.2" cy="6.4" rx="3.4" ry="2" fill="#fff" opacity="0.28" transform="rotate(-24 8.2 6.4)" />
      {spec.glyph}
    </svg>
  );
}

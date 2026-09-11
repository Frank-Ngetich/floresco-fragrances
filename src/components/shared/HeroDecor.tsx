/* Shared visual treatment for every full-bleed page-header photo (Home,
   Story, Journal, Visit). Each page uses a different source photo — without
   a common grade they read as four unrelated shoots. This file is the one
   place that defines the "one site" look: a consistent warm color grade,
   scrim, bottom blend into the white page body, and a recurring watermark. */

// Pulls every photo toward the same warm, muted black-and-gold family
// regardless of its native colors (blue smoke, brown incense, candlelight...).
export const HERO_IMAGE_GRADE = 'saturate(0.72) sepia(0.16) contrast(1.06)';

export const HERO_RADIAL_SCRIM =
  'radial-gradient(ellipse at center, rgba(10,8,6,0.55) 0%, rgba(10,8,6,0.8) 100%)';

// A plain transparent→white 2-stop ramp reads as a visible band, not a
// dissolve — a straight alpha ramp doesn't match how the eye perceives
// opacity. These extra stops ease it in gradually, then hold near-white for
// the last stretch so it settles into the page body without a seam.
const FADE_CURVE = [
  'transparent 0%',
  'rgba(255,255,255,0.06) 35%',
  'rgba(255,255,255,0.22) 58%',
  'rgba(255,255,255,0.5) 76%',
  'rgba(255,255,255,0.82) 90%',
  '#fff 100%',
].join(', ');

export function HeroBottomFade({ height = '18vh' }: { height?: string }) {
  return (
    <div
      className="absolute inset-x-0 bottom-0 pointer-events-none"
      style={{ height, background: `linear-gradient(to bottom, ${FADE_CURVE})` }}
    />
  );
}

export function HeroWatermarkF({ side = 'right' }: { side?: 'left' | 'right' }) {
  return (
    <div
      className={`absolute ${side === 'right' ? 'right-[-1rem]' : 'left-[-1rem]'} top-[-1.5rem] font-display leading-none select-none pointer-events-none hidden lg:block`}
      style={{ fontSize: 'clamp(9rem, 14vw, 18rem)', color: 'rgba(255,255,255,0.05)' }}
    >
      F
    </div>
  );
}

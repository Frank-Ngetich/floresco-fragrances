'use client';
import React from 'react';

interface BottleSVGProps {
  color1: string;
  color2: string;
  id: string;
  className?: string;
  showLabel?: boolean;
  variant?: 'tall' | 'wide' | 'round';
}

export function BottleSVG({ color1, color2, id, className = '', showLabel = true, variant = 'tall' }: BottleSVGProps) {
  const gid = `grad-${id}`.replace(/[^a-zA-Z0-9-]/g, '-');
  const sid = `shine-${id}`.replace(/[^a-zA-Z0-9-]/g, '-');

  if (variant === 'round') {
    return (
      <svg viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color2} />
            <stop offset="100%" stopColor={color1} />
          </linearGradient>
          <linearGradient id={sid} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <rect x="48" y="6" width="24" height="22" rx="4" fill="#1a1a1a" />
        <rect x="46" y="26" width="28" height="4" rx="1" fill="#3a3a3a" />
        <rect x="52" y="30" width="16" height="10" fill={`url(#${gid})`} />
        <ellipse cx="60" cy="112" rx="36" ry="8" fill={`url(#${gid})`} opacity="0.3" />
        <path d="M28 40 Q28 38 30 38 L90 38 Q92 38 92 40 L95 130 Q95 145 60 145 Q25 145 25 130 Z" fill={`url(#${gid})`} />
        <path d="M32 44 Q32 42 34 42 L52 42 Q54 42 54 44 L56 130 Q56 138 52 140 L34 140 Q32 140 32 138 Z" fill={`url(#${sid})`} opacity="0.65" />
        {showLabel && (
          <>
            <rect x="36" y="78" width="48" height="32" fill="rgba(255,255,255,0.92)" />
            <text x="60" y="93" textAnchor="middle" fontFamily="var(--font-fraunces), Georgia" fontStyle="italic" fontSize="8" fill="#1a1a1a">Floresco</text>
            <text x="60" y="103" textAnchor="middle" fontFamily="var(--font-inter), Arial" fontSize="4" fill="#6B6660" letterSpacing="1.5">PARFUM</text>
          </>
        )}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color2} />
          <stop offset="60%" stopColor={color1} />
          <stop offset="100%" stopColor={color1} />
        </linearGradient>
        <linearGradient id={sid} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* Cap */}
      <rect x="44" y="7" width="32" height="30" rx="3" fill="#1a1a1a" />
      <rect x="42" y="35" width="36" height="5" rx="1" fill="#3a3a3a" />
      {/* Neck */}
      <rect x="51" y="40" width="18" height="12" fill={`url(#${gid})`} />
      {/* Body */}
      <path d="M 28 52 Q 28 50 30 50 L 90 50 Q 92 50 92 52 L 92 182 Q 92 192 80 192 L 40 192 Q 28 192 28 182 Z" fill={`url(#${gid})`} />
      {/* Shine */}
      <path d="M 32 57 Q 32 55 34 55 L 54 55 Q 56 55 56 57 L 56 178 Q 56 181 54 181 L 34 181 Q 32 181 32 178 Z" fill={`url(#${sid})`} opacity="0.65" />
      {/* Label */}
      {showLabel && (
        <>
          <rect x="36" y="102" width="48" height="34" fill="rgba(255,255,255,0.95)" />
          <text x="60" y="118" textAnchor="middle" fontFamily="var(--font-fraunces), Georgia" fontStyle="italic" fontSize="9" fill="#1a1a1a">Floresco</text>
          <text x="60" y="129" textAnchor="middle" fontFamily="var(--font-inter), Arial" fontSize="4" fill="#6B6660" letterSpacing="2">PARFUM DE LUXE</text>
        </>
      )}
    </svg>
  );
}

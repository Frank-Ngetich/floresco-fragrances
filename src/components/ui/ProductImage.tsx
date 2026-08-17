'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductImageProps {
  src?:         string | null;
  alt:          string;
  color1?:      string;
  color2?:      string;
  className?:   string;
  fill?:        boolean;
  width?:       number;
  height?:      number;
  priority?:    boolean;
  showLabel?:   boolean;
  brandName?:   string;
  sizes?:       string;
}

/* Elegant SVG bottle placeholder — used when no real image is uploaded */
function BottlePlaceholder({
  color1 = '#B02837',
  color2 = '#D24650',
  label,
  brand,
  className = '',
}: {
  color1?: string;
  color2?: string;
  label?: string;
  brand?: string;
  className?: string;
}) {
  const id = `bp-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <div className={cn('relative flex items-center justify-center w-full h-full', className)}>
      {/* Soft gradient bg */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 60% 30%, ${color2}18 0%, ${color1}10 50%, transparent 80%)`,
        }}
      />
      <svg
        viewBox="0 0 180 300"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 h-[70%] w-auto drop-shadow-xl"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${id}-body`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={color2} />
            <stop offset="45%"  stopColor={color1} />
            <stop offset="100%" stopColor={`${color1}88`} />
          </linearGradient>
          <linearGradient id={`${id}-shine`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
            <stop offset="40%"  stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#B5924C" />
            <stop offset="50%"  stopColor="#D9BB6A" />
            <stop offset="100%" stopColor="#B5924C" />
          </linearGradient>
          <linearGradient id={`${id}-label`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.97)" />
            <stop offset="100%" stopColor="rgba(245,240,234,0.94)" />
          </linearGradient>
          <filter id={`${id}-shadow`}>
            <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor={color1} floodOpacity="0.28"/>
          </filter>
        </defs>

        {/* Cap */}
        <rect x="67" y="6"  width="46" height="46" rx="4" fill="#0F0E0D" />
        <rect x="71" y="9"  width="13" height="40" rx="3" fill="rgba(255,255,255,0.06)" />
        <circle cx="90" cy="29" r="5"  fill={`${color1}66`} />
        <circle cx="90" cy="29" r="2.5" fill={`${color1}cc`} />

        {/* Gold collar */}
        <rect x="63" y="50" width="54" height="7" rx="1" fill={`url(#${id}-gold)`} />

        {/* Neck */}
        <path d="M72 57 L73 72 L107 72 L108 57 Z" fill={`url(#${id}-body)`} />
        <path d="M72 57 L73 72 L81 72 L80 57 Z" fill={`url(#${id}-shine)`} opacity="0.5" />

        {/* Body */}
        <path
          d="M 40 72 Q 38 72 38 74 L 38 268 Q 38 278 90 278 Q 142 278 142 268 L 142 74 Q 142 72 140 72 Z"
          fill={`url(#${id}-body)`}
          filter={`url(#${id}-shadow)`}
        />

        {/* Shine stripe */}
        <path
          d="M 44 76 Q 43 76 43 78 L 43 264 Q 43 272 56 274 L 68 274 L 69 76 Z"
          fill={`url(#${id}-shine)`}
          opacity="0.55"
        />

        {/* Right reflection */}
        <path d="M 120 88 L 123 88 L 123 252 L 120 252 Z" fill="rgba(255,255,255,0.08)" />

        {/* Top band */}
        <rect x="38" y="72" width="104" height="5" fill={`url(#${id}-gold)`} opacity="0.65" />

        {/* Label */}
        <rect x="50"  y="148" width="80" height="76" rx="1.5" fill={`url(#${id}-label)`} />
        <rect x="53"  y="151" width="74" height="70" rx="1" fill="none" stroke={`${color1}22`} strokeWidth="0.5" />
        <rect x="57"  y="155" width="66" height="62" rx="0.5" fill="none" stroke="rgba(181,146,76,0.25)" strokeWidth="0.5" />

        <text x="90" y="174" textAnchor="middle"
          fontFamily="Georgia,serif" fontStyle="italic" fontSize="13" fill="#0F0E0D" letterSpacing="0.5">
          Floresco
        </text>
        <line x1="60" y1="180" x2="120" y2="180" stroke={`${color1}28`} strokeWidth="0.5" />
        <text x="90" y="191" textAnchor="middle"
          fontFamily="Arial,sans-serif" fontSize="5" fill={color1} letterSpacing="2.5">
          PARFUM
        </text>
        <text x="90" y="202" textAnchor="middle"
          fontFamily="Arial,sans-serif" fontSize="3.8" fill="#9A8A5C" letterSpacing="1.8">
          ELDORET · KENYA
        </text>
        <line x1="60" y1="208" x2="120" y2="208" stroke={`${color1}15`} strokeWidth="0.5" />
        {label && (
          <text x="90" y="218" textAnchor="middle"
            fontFamily="Arial,sans-serif" fontSize="4" fill="#888" letterSpacing="0.8">
            {label.slice(0, 20)}
          </text>
        )}

        {/* Bottom band */}
        <rect x="38" y="270" width="104" height="4" rx="1" fill={`url(#${id}-gold)`} opacity="0.4" />
      </svg>

      {/* "Add image" hint overlay — only visible in admin context */}
      {/* This is controlled by the parent via data-admin attribute */}
    </div>
  );
}

/* Main component — renders real image OR placeholder */
export function ProductImage({
  src,
  alt,
  color1,
  color2,
  className,
  fill = false,
  width,
  height,
  priority = false,
  showLabel = false,
  brandName,
  sizes = '(max-width: 768px) 50vw, 33vw',
}: ProductImageProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = src && src.trim() !== '' && !imgError;

  if (hasImage) {
    return fill ? (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn('object-cover', className)}
        onError={() => setImgError(true)}
      />
    ) : (
      <Image
        src={src}
        alt={alt}
        width={width || 400}
        height={height || 500}
        priority={priority}
        className={cn('object-contain', className)}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <BottlePlaceholder
      color1={color1}
      color2={color2}
      label={showLabel ? alt : undefined}
      brand={brandName}
      className={className}
    />
  );
}

/* Convenience wrapper for product cards */
export function ProductCardImage({
  src,
  alt,
  color1,
  color2,
  className,
}: {
  src?: string | null;
  alt: string;
  color1?: string;
  color2?: string;
  className?: string;
}) {
  return (
    <ProductImage
      src={src}
      alt={alt}
      color1={color1}
      color2={color2}
      fill
      className={className}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
    />
  );
}

import React from 'react';

export default function DecorBlur({
  color = '20,36,72', // navy-ish (r,g,b)
  intensity = 0.14,
  inset = 'inset-0',
}: { color?: string; intensity?: number; inset?: string }) {
  const c = color;
  const alpha = intensity;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse 55% 60% at 50% 48%, rgba(${c},${alpha}) 0%, rgba(${c},${alpha / 2}) 45%, transparent 70%)`,
        zIndex: 2,
      }}
    />
  );
}

'use client';

import React from 'react';

interface ChipMindLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const ChipMindLogo: React.FC<ChipMindLogoProps> = ({
  size = 36,
  className = '',
  glow = true,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient RGB/Arcane Glow Halo */}
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/30 via-indigo-500/30 to-purple-500/30 blur-md -z-10 animate-pulse"
          style={{ animationDuration: '4s' }}
        />
      )}

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md select-none"
      >
        <defs>
          {/* Chassis Gradient */}
          <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>

          {/* Border Arcane Neon Gradient */}
          <linearGradient id="neonBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* CPU Die Core Gradient */}
          <linearGradient id="coreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="45%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Leyline / Circuit Glow Filter */}
          <filter id="circuitGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Outer Faceted Shield / PC Waterblock Chassis */}
        <polygon
          points="20,8 80,8 92,20 92,80 80,92 20,92 8,80 8,20"
          fill="url(#chassisGrad)"
          stroke="url(#neonBorder)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* 2. Motherboard Bus Pins (Top, Bottom, Left, Right) */}
        {/* Top Pins */}
        <line x1="35" y1="8" x2="35" y2="14" stroke="#00f0ff" strokeWidth="1.5" opacity="0.8" />
        <line x1="50" y1="8" x2="50" y2="16" stroke="#00f0ff" strokeWidth="2" opacity="0.9" />
        <line x1="65" y1="8" x2="65" y2="14" stroke="#00f0ff" strokeWidth="1.5" opacity="0.8" />

        {/* Bottom Pins */}
        <line x1="35" y1="86" x2="35" y2="92" stroke="#a855f7" strokeWidth="1.5" opacity="0.8" />
        <line x1="50" y1="84" x2="50" y2="92" stroke="#a855f7" strokeWidth="2" opacity="0.9" />
        <line x1="65" y1="86" x2="65" y2="92" stroke="#a855f7" strokeWidth="1.5" opacity="0.8" />

        {/* Left Pins */}
        <line x1="8" y1="35" x2="14" y2="35" stroke="#00f0ff" strokeWidth="1.5" opacity="0.8" />
        <line x1="8" y1="50" x2="16" y2="50" stroke="#00f0ff" strokeWidth="2" opacity="0.9" />
        <line x1="8" y1="65" x2="14" y2="65" stroke="#00f0ff" strokeWidth="1.5" opacity="0.8" />

        {/* Right Pins */}
        <line x1="86" y1="35" x2="92" y2="35" stroke="#a855f7" strokeWidth="1.5" opacity="0.8" />
        <line x1="84" y1="50" x2="92" y2="50" stroke="#a855f7" strokeWidth="2" opacity="0.9" />
        <line x1="86" y1="65" x2="92" y2="65" stroke="#a855f7" strokeWidth="1.5" opacity="0.8" />

        {/* 3. Arcane Circuit Traces / Leylines (Radiating outward) */}
        {/* Top-Left Trace */}
        <path
          d="M 32 32 L 24 24 L 16 24"
          stroke="#00f0ff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
          filter="url(#circuitGlow)"
        />
        <circle cx="16" cy="24" r="1.5" fill="#00f0ff" />

        {/* Top-Right Trace */}
        <path
          d="M 68 32 L 76 24 L 84 24"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
          filter="url(#circuitGlow)"
        />
        <circle cx="84" cy="24" r="1.5" fill="#38bdf8" />

        {/* Bottom-Left Trace */}
        <path
          d="M 32 68 L 24 76 L 16 76"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
          filter="url(#circuitGlow)"
        />
        <circle cx="16" cy="76" r="1.5" fill="#818cf8" />

        {/* Bottom-Right Trace */}
        <path
          d="M 68 68 L 76 76 L 84 76"
          stroke="#c084fc"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
          filter="url(#circuitGlow)"
        />
        <circle cx="84" cy="76" r="1.5" fill="#c084fc" />

        {/* 4. Center Silicon Heatspreader / Arcane Mana Die */}
        <rect
          x="30"
          y="30"
          width="40"
          height="40"
          rx="8"
          fill="url(#coreGrad)"
          stroke="#ffffff"
          strokeWidth="1"
          strokeOpacity="0.4"
          filter="url(#circuitGlow)"
        />

        {/* 5. Inner Core Processor Node / WoW Mana Core Rune */}
        {/* Diamond Core */}
        <polygon
          points="50,38 62,50 50,62 38,50"
          fill="#0f172a"
          stroke="#00f0ff"
          strokeWidth="1.5"
        />

        {/* Central Power Singularity / Leyline Spark */}
        <circle cx="50" cy="50" r="4.5" fill="#ffffff" filter="url(#circuitGlow)" />
        <circle cx="50" cy="50" r="2.5" fill="#00f0ff" />
      </svg>
    </div>
  );
};

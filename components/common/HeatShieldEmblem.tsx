import React from "react";

interface HeatShieldEmblemProps {
  className?: string;
  size?: number;
  isSatellite?: boolean;
}

export const HeatShieldEmblem: React.FC<HeatShieldEmblemProps> = ({
  className = "w-5 h-5",
  size = 20,
  isSatellite = false,
}) => {
  const color = isSatellite ? "#FFFFFF" : "#0F172A";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Top Canopy Arch Dome */}
      <path
        fill={color}
        d="M 72 312 
           C 88 200, 160 92, 256 84 
           C 352 92, 424 200, 440 312 
           C 400 236, 334 168, 256 164 
           C 178 168, 112 236, 72 312 Z"
      />

      {/* 2. Radiating Dashed Solar Lines */}
      <line
        x1="190" y1="220" x2="238" y2="314"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
        strokeDasharray="18 16"
      />
      <line
        x1="256" y1="208" x2="256" y2="230"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
      />
      <line
        x1="322" y1="220" x2="274" y2="314"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
        strokeDasharray="18 16"
      />

      {/* 3. Center Reflection Rays */}
      <line
        x1="256" y1="240" x2="256" y2="356"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
      />
      <line
        x1="138" y1="266" x2="256" y2="356"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
      />
      <line
        x1="256" y1="356" x2="354" y2="280"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path
        d="M 374 264 L 332 272 L 354 300 Z"
        fill={color}
      />

      {/* 4. Base Surface & Perspective Grid Cross */}
      <line
        x1="68" y1="370" x2="444" y2="370"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
      />
      <line
        x1="98" y1="410" x2="182" y2="344"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
      />
      <line
        x1="414" y1="410" x2="330" y2="344"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
      />
      <line
        x1="256" y1="370" x2="256" y2="410"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
      />
    </svg>
  );
};

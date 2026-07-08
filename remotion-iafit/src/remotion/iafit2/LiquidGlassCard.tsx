import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";

interface Props {
  children: React.ReactNode;
  style?: React.CSSProperties;
  shimmerStart?: number;
  shimmerPeriod?: number;
  glow?: boolean;
}

export const LiquidGlassCard: React.FC<Props> = ({
  children, style, shimmerStart = 0, shimmerPeriod = 90, glow = false,
}) => {
  const frame = useCurrentFrame();

  const shimX = interpolate(
    (frame - shimmerStart + shimmerPeriod * 10) % shimmerPeriod,
    [0, shimmerPeriod],
    [-120, 220],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const glowSize = glow
    ? interpolate(Math.sin((frame / 30) * Math.PI), [-1, 1], [20, 45])
    : 0;

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.13), rgba(255,255,255,0.04))",
      backdropFilter: "blur(30px)",
      border: `1px solid ${colors.borderGold}`,
      borderRadius: 28,
      boxShadow: `0 0 ${glow ? glowSize : 32}px rgba(212,175,55,${glow ? 0.28 : 0.10}), inset 0 1px 1px rgba(255,255,255,0.22)`,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {/* Top edge shine */}
      <div style={{
        position: "absolute", top: 0, left: "8%", right: "8%", height: 1,
        background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.55), transparent)",
      }} />

      {/* Shimmer sweep */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(108deg, transparent 28%, rgba(212,175,55,0.12) 50%, transparent 72%)",
        transform: `translateX(${shimX}%)`,
      }} />

      {children}
    </div>
  );
};

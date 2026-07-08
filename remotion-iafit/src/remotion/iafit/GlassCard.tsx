import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  shimmer?: boolean;
  shimmerDelay?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  shimmer = false,
  shimmerDelay = 0,
}) => {
  const frame = useCurrentFrame();

  const shimmerX = shimmer
    ? interpolate(
        (frame - shimmerDelay + 1000) % 90,
        [0, 90],
        [-100, 200],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      )
    : -200;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)`,
        border: `1px solid ${colors.borderGold}`,
        borderRadius: 20,
        backdropFilter: "blur(20px)",
        boxShadow: `0 8px 48px ${colors.shadowGold}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Shimmer sweep */}
      {shimmer && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(105deg, transparent 30%, rgba(212,175,55,0.18) 50%, transparent 70%)`,
            transform: `translateX(${shimmerX}%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Top edge highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background: `linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)`,
        }}
      />

      {children}
    </div>
  );
};

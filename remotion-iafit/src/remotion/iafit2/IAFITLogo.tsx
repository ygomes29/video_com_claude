import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";

interface Props {
  size?: "sm" | "md" | "lg";
  enterFrame?: number;
}

export const IAFITLogo: React.FC<Props> = ({ size = "md", enterFrame = 0 }) => {
  const frame = useCurrentFrame();

  const sizes = { sm: 0.6, md: 1, lg: 1.4 };
  const s = sizes[size];

  const op = interpolate(frame, [enterFrame, enterFrame + 22], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const sc = interpolate(frame, [enterFrame, enterFrame + 22], [0.7, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const glow = interpolate(Math.sin((frame / 30) * Math.PI), [-1, 1], [20, 40]);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14 * s,
      opacity: op, transform: `scale(${sc})`,
    }}>
      <div style={{
        width: 56 * s, height: 56 * s, borderRadius: 14 * s,
        background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 ${glow}px rgba(212,175,55,0.5)`,
        flexShrink: 0,
      }}>
        <svg width={30 * s} height={30 * s} viewBox="0 0 44 44" fill="none">
          <path d="M8 34L22 10L36 34" stroke="#050505" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 26H31" stroke="#050505" strokeWidth={3.5} strokeLinecap="round" />
          <circle cx={22} cy={8} r={3} fill="#050505" />
        </svg>
      </div>
      <span style={{
        fontSize: 46 * s, fontWeight: 800, letterSpacing: "-1.5px",
        fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1,
      }}>
        <span style={{ color: colors.white }}>IA</span>
        <span style={{
          background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>FIT</span>
      </span>
    </div>
  );
};

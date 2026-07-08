import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn, countUpF } from "./utils";
import { LiquidGlassCard } from "./LiquidGlassCard";

const DOT_COUNT = 60;
const dots = Array.from({ length: DOT_COUNT }, (_, i) => ({
  id: i,
  x: 6 + (i % 10) * 9,
  y: 12 + Math.floor(i / 10) * 16,
}));

export const Scene2Academy: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOp = fadeIn(frame, 5, 16);
  const cardOp = fadeIn(frame, 18, 22);
  const cardScale = scaleIn(frame, 18, 25, 0.85);
  const cardY = slideUp(frame, 18, 25, 40);

  const count = countUpF(frame, 25, 45, 500);

  const dotProgress = interpolate(frame, [30, 90], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const subOp = fadeIn(frame, 80, 18);
  const subY = slideUp(frame, 80, 20, 25);

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 120px",
    }}>
      {/* Eyebrow */}
      <div style={{
        opacity: labelOp, marginBottom: 36,
        fontSize: 13, color: colors.gold, fontWeight: 600,
        letterSpacing: "0.3em", textTransform: "uppercase",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        O Cenário
      </div>

      {/* Main card */}
      <div style={{ opacity: cardOp, transform: `translateY(${cardY}px) scale(${cardScale})`, width: 820 }}>
        <LiquidGlassCard shimmerStart={30} shimmerPeriod={100} glow style={{ padding: "56px 64px" }}>
          {/* Dot grid representing students */}
          <div style={{ position: "relative", height: 120, marginBottom: 40, overflow: "hidden" }}>
            <svg width="100%" height="120" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {dots.map((d, i) => {
                const visible = i / DOT_COUNT <= dotProgress;
                return (
                  <circle
                    key={d.id}
                    cx={`${d.x}%`} cy={`${d.y}%`}
                    r={2.5}
                    fill={colors.gold}
                    opacity={visible ? 0.7 : 0}
                  />
                );
              })}
            </svg>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent 60%, rgba(5,5,5,0.9) 100%)",
            }} />
          </div>

          {/* Number */}
          <div style={{
            fontSize: 120, fontWeight: 900, lineHeight: 1,
            letterSpacing: "-0.06em",
            background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: `0 0 40px rgba(212,175,55,0.35)`,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>
            {count}
          </div>

          <div style={{
            fontSize: 28, fontWeight: 600, color: colors.white,
            fontFamily: "system-ui, -apple-system, sans-serif",
            marginTop: 8, letterSpacing: "-0.3px",
          }}>
            alunos ativos
          </div>

          {/* Divider */}
          <div style={{
            width: 60, height: 2, marginTop: 28,
            background: `linear-gradient(90deg, ${colors.gold}, transparent)`,
            borderRadius: 99,
          }} />

          <div style={{
            opacity: subOp, transform: `translateY(${subY}px)`,
            fontSize: 17, color: colors.muted, marginTop: 18,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>
            Academia brasileira — base monitorada pela IAFIT
          </div>
        </LiquidGlassCard>
      </div>
    </div>
  );
};

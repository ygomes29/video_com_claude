import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn } from "./utils";
import { GlassCard } from "./GlassCard";

const STATS = [
  { value: "+340%", label: "Aumento em conversão", suffix: "" },
  { value: "87%", label: "Retenção de alunos", suffix: "" },
  { value: "24/7", label: "Atendimento automatizado", suffix: "" },
];

export const SceneNumbers: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = fadeIn(frame, 5, 18);
  const titleY = slideUp(frame, 5, 20, 30);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 120px",
      }}
    >
      <div
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: colors.gold,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontFamily: "system-ui, -apple-system, sans-serif",
            marginBottom: 16,
          }}
        >
          Resultados Reais
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 52,
            fontWeight: 800,
            color: colors.white,
            letterSpacing: "-1.5px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Números que transformam negócios
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 28,
          width: "100%",
          maxWidth: 1400,
        }}
      >
        {STATS.map((stat, i) => {
          const delay = 28 + i * 20;
          const op = fadeIn(frame, delay, 20);
          const scale = scaleIn(frame, delay, 22, 0.8);

          const glowSize = interpolate(
            Math.sin((frame / 30) * Math.PI + i),
            [-1, 1],
            [20, 35],
          );

          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `scale(${scale})`,
              }}
            >
              <GlassCard
                shimmer
                shimmerDelay={delay + 30}
                style={{
                  padding: "44px 36px",
                  textAlign: "center",
                  position: "relative",
                }}
              >
                {/* Glow dot */}
                <div
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: colors.gold,
                    boxShadow: `0 0 ${glowSize}px ${colors.gold}`,
                  }}
                />

                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    lineHeight: 1,
                    letterSpacing: "-2px",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    marginBottom: 16,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 17,
                    color: colors.muted,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontWeight: 400,
                  }}
                >
                  {stat.label}
                </div>
              </GlassCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};

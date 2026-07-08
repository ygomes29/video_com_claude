import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn } from "./utils";

export const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();

  const eyebrowOp = fadeIn(frame, 5, 15);
  const line1Op = fadeIn(frame, 20, 22);
  const line1Y = slideUp(frame, 20, 25, 40);
  const line2Op = fadeIn(frame, 42, 22);
  const line2Y = slideUp(frame, 42, 25, 40);
  const badgeOp = fadeIn(frame, 65, 20);
  const badgeScale = scaleIn(frame, 65, 22, 0.8);

  const glowPulse = interpolate(
    Math.sin((frame / 30) * Math.PI * 2),
    [-1, 1],
    [0.8, 1.2],
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 140px",
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          opacity: eyebrowOp,
          marginBottom: 32,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 50,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${colors.gold})`,
          }}
        />
        <span
          style={{
            fontSize: 13,
            color: colors.gold,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          A Solução
        </span>
        <div
          style={{
            width: 50,
            height: 1,
            background: `linear-gradient(90deg, ${colors.gold}, transparent)`,
          }}
        />
      </div>

      <h1
        style={{
          margin: 0,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginBottom: 50,
        }}
      >
        <div
          style={{
            opacity: line1Op,
            transform: `translateY(${line1Y}px)`,
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-2px",
          }}
        >
          <span style={{ color: colors.white }}>Apresentamos a </span>
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldLight} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            IAFIT
          </span>
        </div>
        <div
          style={{
            opacity: line2Op,
            transform: `translateY(${line2Y}px)`,
            fontSize: 36,
            fontWeight: 400,
            color: colors.muted,
            lineHeight: 1.4,
            letterSpacing: "-0.5px",
            marginTop: 16,
          }}
        >
          A plataforma completa que transforma academias
          <br />
          em máquinas de crescimento.
        </div>
      </h1>

      {/* Feature badges */}
      <div
        style={{
          opacity: badgeOp,
          transform: `scale(${badgeScale})`,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {["Venda mais", "Retenha mais", "Cresça com IA"].map((text, i) => (
          <div
            key={i}
            style={{
              padding: "12px 28px",
              borderRadius: 99,
              background:
                i === 1
                  ? `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`
                  : "rgba(255,255,255,0.06)",
              border: i !== 1 ? `1px solid ${colors.borderGold}` : "none",
              boxShadow:
                i === 1
                  ? `0 0 ${24 * glowPulse}px ${colors.shadowGold}`
                  : "none",
            }}
          >
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: i === 1 ? colors.bg : colors.white,
                fontFamily: "system-ui, -apple-system, sans-serif",
                letterSpacing: "0.02em",
              }}
            >
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

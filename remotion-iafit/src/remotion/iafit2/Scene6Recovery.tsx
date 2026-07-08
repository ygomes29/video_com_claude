import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn, countUpF } from "./utils";
import { LiquidGlassCard } from "./LiquidGlassCard";

export const Scene6Recovery: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = fadeIn(frame, 5, 18);
  const titleY = slideUp(frame, 5, 20, 30);

  // Circle progress
  const circleProgress = interpolate(frame, [25, 85], [0, 0.25], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const circleOp = fadeIn(frame, 18, 20);

  const pct = countUpF(frame, 25, 55, 25);
  const count20 = countUpF(frame, 70, 35, 20);

  const card2Op = fadeIn(frame, 70, 20);
  const card2Y = slideUp(frame, 70, 22, 30);
  const card2Scale = scaleIn(frame, 70, 22, 0.85);

  const RADIUS = 130;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC * (1 - circleProgress);

  const glowSize = interpolate(
    Math.sin((frame / 30) * Math.PI),
    [-1, 1],
    [20, 45],
  );

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 120px",
    }}>
      <div style={{
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center", marginBottom: 56,
      }}>
        <div style={{
          fontSize: 13, color: colors.gold, fontWeight: 600,
          letterSpacing: "0.3em", textTransform: "uppercase",
          fontFamily: "system-ui, -apple-system, sans-serif", marginBottom: 14,
        }}>
          Recuperação
        </div>
        <div style={{
          fontSize: 52, fontWeight: 800, color: colors.white,
          letterSpacing: "-1.5px", fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          Alunos em risco → Alunos ativos
        </div>
      </div>

      <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
        {/* Donut chart */}
        <div style={{ opacity: circleOp, position: "relative", width: 300, height: 300 }}>
          <svg width={300} height={300} viewBox="0 0 300 300">
            {/* Track */}
            <circle cx={150} cy={150} r={RADIUS}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={22} />
            {/* Progress */}
            <circle cx={150} cy={150} r={RADIUS}
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth={22}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 150 150)"
              style={{ filter: `drop-shadow(0 0 ${glowSize * 0.4}px rgba(212,175,55,0.7))` }}
            />
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors.gold} />
                <stop offset="100%" stopColor={colors.goldLight} />
              </linearGradient>
            </defs>
          </svg>
          {/* Center label */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              fontSize: 72, fontWeight: 900, lineHeight: 1,
              letterSpacing: "-0.05em",
              background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              {pct}%
            </div>
            <div style={{
              fontSize: 16, color: colors.muted, marginTop: 4,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              recuperados
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
          <div style={{ opacity: card2Op, transform: `translateY(${card2Y}px) scale(${card2Scale})` }}>
            <LiquidGlassCard glow shimmerStart={75} shimmerPeriod={90} style={{ padding: "36px 44px" }}>
              <div style={{
                fontSize: 100, fontWeight: 900, lineHeight: 1,
                letterSpacing: "-0.05em",
                background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}>
                {count20}
              </div>
              <div style={{
                fontSize: 22, fontWeight: 600, color: colors.white, marginTop: 8,
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}>
                alunos voltaram a treinar
              </div>
              <div style={{
                display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap",
              }}>
                {["Risco", "→", "Ativo", "→", "Receita"].map((t, i) => (
                  <span key={i} style={{
                    fontSize: 13, color: i % 2 === 1 ? colors.muted : colors.gold,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontWeight: i % 2 === 0 ? 600 : 400,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </LiquidGlassCard>
          </div>

          {/* Calc preview */}
          <div style={{
            opacity: fadeIn(frame, 105, 18),
            padding: "16px 24px", borderRadius: 14,
            background: "rgba(212,175,55,0.06)", border: `1px solid ${colors.borderGold}`,
          }}>
            <div style={{
              fontSize: 15, color: colors.muted,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              80 alunos × 25% = <strong style={{ color: colors.gold }}>20 recuperados</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

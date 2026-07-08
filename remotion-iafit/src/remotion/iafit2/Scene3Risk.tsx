import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn, countUpF } from "./utils";
import { LiquidGlassCard } from "./LiquidGlassCard";

const TOTAL = 60;
const AT_RISK = 12;

const dots = Array.from({ length: TOTAL }, (_, i) => ({
  id: i,
  x: 5 + (i % 10) * 10,
  y: 10 + Math.floor(i / 10) * 18,
  risk: i < AT_RISK,
}));

export const Scene3Risk: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOp = fadeIn(frame, 5, 16);
  const cardOp = fadeIn(frame, 15, 22);
  const cardScale = scaleIn(frame, 15, 25, 0.88);

  // dots appear in two waves: safe then risk highlighted
  const safeDotProgress = interpolate(frame, [20, 55], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const riskHighlight = interpolate(frame, [65, 90], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // scan line
  const scanX = interpolate(frame, [60, 100], [-5, 105], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const scanOp = interpolate(frame, [60, 70, 95, 100], [0, 0.8, 0.8, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const count80 = countUpF(frame, 78, 35, 80);

  const riskCardOp = fadeIn(frame, 88, 20);
  const riskCardY = slideUp(frame, 88, 22, 30);

  const pulseRisk = interpolate(Math.sin((frame / 30) * Math.PI * 2), [-1, 1], [0.5, 1.0]);

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 120px", gap: 36,
    }}>
      <div style={{
        opacity: labelOp,
        fontSize: 13, color: colors.gold, fontWeight: 600,
        letterSpacing: "0.3em", textTransform: "uppercase",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>
        Detecção de Risco
      </div>

      <div style={{
        opacity: cardOp, transform: `scale(${cardScale})`,
        width: 860, display: "flex", flexDirection: "column", gap: 28,
      }}>
        {/* Dot dashboard */}
        <LiquidGlassCard shimmerStart={50} shimmerPeriod={110} style={{ padding: "36px 48px" }}>
          <div style={{
            fontSize: 15, color: colors.muted, marginBottom: 20,
            fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "0.05em",
          }}>
            Frequência — últimos 14 dias
          </div>

          <div style={{ position: "relative", height: 110 }}>
            <svg width="100%" height="110" viewBox="0 0 100 80" preserveAspectRatio="none">
              {dots.map((d, i) => {
                const safeVisible = !d.risk && i / TOTAL <= safeDotProgress;
                const riskVisible = d.risk;
                const isHighlighted = d.risk && riskHighlight > 0.3;
                const color = isHighlighted ? colors.danger : colors.gold;
                const opacity = riskVisible
                  ? (isHighlighted ? pulseRisk : 0.3)
                  : safeVisible ? 0.55 : 0;
                return (
                  <circle
                    key={d.id}
                    cx={`${d.x}%`} cy={`${d.y + 10}%`}
                    r={isHighlighted ? 3.5 : 2.8}
                    fill={color}
                    opacity={opacity}
                  />
                );
              })}

              {/* Scan line */}
              <line
                x1={`${scanX}%`} y1="0%" x2={`${scanX}%`} y2="100%"
                stroke={colors.goldLight} strokeWidth={1.2} opacity={scanOp}
              />
            </svg>

            {/* Risk label overlay */}
            {riskHighlight > 0.5 && (
              <div style={{
                position: "absolute", top: 0, left: 0,
                background: "rgba(255,90,90,0.12)", border: "1px solid rgba(255,90,90,0.4)",
                borderRadius: 8, padding: "4px 10px",
                opacity: riskHighlight,
              }}>
                <span style={{
                  fontSize: 12, color: colors.danger, fontWeight: 600,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}>
                  +10 dias sem treinar
                </span>
              </div>
            )}
          </div>
        </LiquidGlassCard>

        {/* Risk metric */}
        <div style={{
          opacity: riskCardOp, transform: `translateY(${riskCardY}px)`,
          display: "flex", gap: 24,
        }}>
          <LiquidGlassCard style={{ flex: 1, padding: "36px 40px" }}>
            <div style={{
              fontSize: 90, fontWeight: 900, lineHeight: 1,
              color: colors.danger, letterSpacing: "-0.05em",
              fontFamily: "system-ui, -apple-system, sans-serif",
              textShadow: "0 0 30px rgba(255,90,90,0.4)",
            }}>
              {count80}
            </div>
            <div style={{
              fontSize: 20, fontWeight: 600, color: colors.white, marginTop: 6,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              alunos em risco
            </div>
            <div style={{
              fontSize: 14, color: colors.muted, marginTop: 4,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              Mais de 10 dias sem treinar
            </div>
          </LiquidGlassCard>

          <LiquidGlassCard style={{ flex: 1, padding: "36px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              fontSize: 15, color: colors.muted, marginBottom: 14,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              Para a operação comum:
            </div>
            <div style={{
              fontSize: 20, color: colors.muted, fontStyle: "italic",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              "Apenas ausência."
            </div>
            <div style={{
              width: 40, height: 1, background: colors.borderGold, margin: "14px 0",
            }} />
            <div style={{
              fontSize: 15, color: colors.gold, marginBottom: 10,
              fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 600,
            }}>
              Para a IAFIT:
            </div>
            <div style={{
              fontSize: 20, color: colors.white, fontWeight: 700,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              Sinal de risco iminente.
            </div>
          </LiquidGlassCard>
        </div>
      </div>
    </div>
  );
};

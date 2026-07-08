import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn } from "./utils";
import { LiquidGlassCard } from "./LiquidGlassCard";

function formatCurrency(v: number) {
  return "R$ " + Math.round(v).toLocaleString("pt-BR");
}

export const Scene7Revenue: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = fadeIn(frame, 5, 18);
  const titleY = slideUp(frame, 5, 20, 30);

  // Main number count
  const revenue = interpolate(frame, [20, 90], [0, 42000], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  });

  const bigCardOp = fadeIn(frame, 15, 22);
  const bigCardScale = scaleIn(frame, 15, 28, 0.82);

  // Calc breakdown steps
  const step1Op = fadeIn(frame, 98, 18);
  const step1Y = slideUp(frame, 98, 20, 25);
  const step2Op = fadeIn(frame, 120, 18);
  const step2Y = slideUp(frame, 120, 20, 25);
  const step3Op = fadeIn(frame, 142, 18);
  const step3Y = slideUp(frame, 142, 20, 25);

  const glowIntensity = interpolate(
    Math.sin((frame / 30) * Math.PI),
    [-1, 1],
    [40, 80],
  );
  const cardPulse = interpolate(
    Math.sin((frame / 30) * Math.PI * 1.5),
    [-1, 1],
    [0.99, 1.01],
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
        textAlign: "center", marginBottom: 44,
      }}>
        <div style={{
          fontSize: 13, color: colors.gold, fontWeight: 600,
          letterSpacing: "0.3em", textTransform: "uppercase",
          fontFamily: "system-ui, -apple-system, sans-serif", marginBottom: 14,
        }}>
          Receita Preservada
        </div>
        <div style={{
          fontSize: 44, fontWeight: 800, color: colors.white,
          letterSpacing: "-1.5px", fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          O impacto financeiro direto
        </div>
      </div>

      <div style={{ display: "flex", gap: 36, width: "100%", maxWidth: 1400, alignItems: "flex-start" }}>
        {/* Big revenue card */}
        <div style={{
          opacity: bigCardOp,
          transform: `scale(${bigCardScale * cardPulse})`,
          flex: 1.2,
        }}>
          <LiquidGlassCard
            glow
            shimmerStart={22}
            shimmerPeriod={80}
            style={{ padding: "56px 60px", textAlign: "center" }}
          >
            {/* Inner glow */}
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.07) 0%, transparent 70%)",
              borderRadius: 28, pointerEvents: "none",
            }} />

            <div style={{
              fontSize: 14, color: colors.muted, letterSpacing: "0.2em",
              textTransform: "uppercase", fontFamily: "system-ui, -apple-system, sans-serif",
              marginBottom: 16,
            }}>
              Estimativa de receita preservada
            </div>

            <div style={{
              fontSize: 96, fontWeight: 900, lineHeight: 1,
              letterSpacing: "-0.04em",
              background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldLight} 60%, ${colors.gold} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontFamily: "system-ui, -apple-system, sans-serif",
              filter: `drop-shadow(0 0 ${glowIntensity * 0.3}px rgba(212,175,55,0.5))`,
            }}>
              {formatCurrency(revenue)}
            </div>

            <div style={{
              width: 80, height: 2, margin: "24px auto",
              background: `linear-gradient(90deg, transparent, ${colors.gold}, transparent)`,
              borderRadius: 99,
            }} />

            <div style={{
              fontSize: 19, color: colors.muted,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              em 6 meses de permanência estimada
            </div>
          </LiquidGlassCard>
        </div>

        {/* Calculation breakdown */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Alunos em risco", value: "80", op: step1Op, y: step1Y, delay: 98 },
            { label: "Taxa de recuperação", value: "× 25%", op: step2Op, y: step2Y, delay: 120 },
            { label: "Alunos recuperados", value: "= 20", op: step3Op, y: step3Y, delay: 142 },
          ].map((item, i) => (
            <div key={i} style={{
              opacity: item.op, transform: `translateY(${item.y}px)`,
            }}>
              <LiquidGlassCard shimmerStart={item.delay + 20} shimmerPeriod={100} style={{ padding: "22px 28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 15, color: colors.muted,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontSize: 22, fontWeight: 800, color: colors.gold,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}>
                    {item.value}
                  </span>
                </div>
              </LiquidGlassCard>
            </div>
          ))}

          {/* Final calc */}
          <div style={{ opacity: fadeIn(frame, 165, 18) }}>
            <div style={{
              padding: "16px 28px", borderRadius: 16,
              background: "rgba(212,175,55,0.06)",
              border: `1px solid ${colors.borderGold}`,
            }}>
              <div style={{
                fontSize: 14, color: colors.muted,
                fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7,
              }}>
                R$ 350 × 20 alunos × 6 meses<br />
                <strong style={{ color: colors.gold, fontSize: 18 }}>= R$ 42.000</strong>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ opacity: fadeIn(frame, 185, 18) }}>
            <div style={{
              fontSize: 11, color: "rgba(166,166,166,0.5)", lineHeight: 1.5,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              * Exemplo ilustrativo baseado em média operacional de retenção.
              Resultados podem variar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

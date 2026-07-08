import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn } from "./utils";
import { LiquidGlassCard } from "./LiquidGlassCard";

const OBJECTIONS = [
  {
    icon: "⏱",
    label: "Falta de tempo",
    response: "Vamos ajustar seu horário para algo mais tranquilo?",
  },
  {
    icon: "😔",
    label: "Desânimo",
    response: "Que tal começar só com 20 minutos? O importante é voltar.",
  },
  {
    icon: "🔄",
    label: "Dificuldade de rotina",
    response: "Posso te ajudar a montar uma rotina mais simples de manter.",
  },
];

export const Scene5Objections: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = fadeIn(frame, 5, 18);
  const titleY = slideUp(frame, 5, 20, 30);

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 100px",
    }}>
      <div style={{
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        textAlign: "center", marginBottom: 52,
      }}>
        <div style={{
          fontSize: 13, color: colors.gold, fontWeight: 600,
          letterSpacing: "0.3em", textTransform: "uppercase",
          fontFamily: "system-ui, -apple-system, sans-serif", marginBottom: 14,
        }}>
          Entendimento da Objeção
        </div>
        <div style={{
          fontSize: 48, fontWeight: 800, color: colors.white,
          letterSpacing: "-1.5px", fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          O agente entende e incentiva a retomada
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, width: "100%", maxWidth: 1400 }}>
        {OBJECTIONS.map((obj, i) => {
          const delay = 28 + i * 22;
          const op = fadeIn(frame, delay, 20);
          const y = slideUp(frame, delay, 24, 40);
          const sc = scaleIn(frame, delay, 22, 0.85);
          const responseOp = fadeIn(frame, delay + 30, 18);
          const responseY = slideUp(frame, delay + 30, 20, 20);

          return (
            <div key={i} style={{
              flex: 1, opacity: op,
              transform: `translateY(${y}px) scale(${sc})`,
            }}>
              <LiquidGlassCard
                shimmerStart={delay + 25}
                shimmerPeriod={100}
                style={{ padding: "36px 32px", height: "100%" }}
              >
                {/* Objection */}
                <div style={{
                  fontSize: 36, marginBottom: 12,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}>
                  {obj.icon}
                </div>
                <div style={{
                  padding: "14px 18px", borderRadius: 12,
                  background: "rgba(255,90,90,0.08)",
                  border: "1px solid rgba(255,90,90,0.25)",
                  marginBottom: 24,
                }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700, color: colors.white,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}>
                    "{obj.label}"
                  </div>
                </div>

                {/* Arrow */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
                  opacity: responseOp,
                }}>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${colors.borderGold}, transparent)` }} />
                  <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                    <path d="M3 9h12M11 5l4 4-4 4" stroke={colors.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div style={{
                    fontSize: 11, color: colors.gold, letterSpacing: "0.12em",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}>
                    IAFIT
                  </div>
                </div>

                {/* Response */}
                <div style={{
                  opacity: responseOp, transform: `translateY(${responseY}px)`,
                  padding: "14px 18px", borderRadius: 12,
                  background: "rgba(212,175,55,0.08)",
                  border: "1px solid rgba(212,175,55,0.25)",
                }}>
                  <div style={{
                    fontSize: 15, color: colors.white, lineHeight: 1.55,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}>
                    "{obj.response}"
                  </div>
                </div>

                {/* Bottom badge */}
                <div style={{
                  marginTop: 20, display: "flex", alignItems: "center", gap: 6,
                  opacity: responseOp,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: colors.gold,
                  }} />
                  <span style={{
                    fontSize: 12, color: colors.gold,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}>
                    Personalizado pela IA
                  </span>
                </div>
              </LiquidGlassCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};

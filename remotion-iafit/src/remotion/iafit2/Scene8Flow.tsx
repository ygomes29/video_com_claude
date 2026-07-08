import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn } from "./utils";
import { LiquidGlassCard } from "./LiquidGlassCard";

const STEPS = [
  {
    num: "1",
    title: "A IA detecta",
    sub: "Baixa frequência identificada automaticamente",
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <circle cx={16} cy={16} r={10} stroke="#D4AF37" strokeWidth={2} />
        <circle cx={16} cy={16} r={4} fill="#D4AF37" />
        <path d="M16 2V6M16 26V30M2 16H6M26 16H30" stroke="#D4AF37" strokeWidth={1.8} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "2",
    title: "O agente conversa",
    sub: "Entende a objeção e incentiva a retomada via WhatsApp",
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <path d="M16 3C8.82 3 3 8.37 3 15c0 2.14.6 4.15 1.64 5.88L3 29l8.38-1.56A13.2 13.2 0 0016 28c7.18 0 13-5.37 13-12S23.18 3 16 3z" stroke="#D4AF37" strokeWidth={2} />
        <path d="M11 13h10M11 17h6" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "3",
    title: "O aluno retorna",
    sub: "Evita o cancelamento e preserva a receita da academia",
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <path d="M6 24L12 16L18 20L26 8" stroke="#D4AF37" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 8H26V14" stroke="#D4AF37" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={6} cy={24} r={2} fill="#D4AF37" />
      </svg>
    ),
  },
];

export const Scene8Flow: React.FC = () => {
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
        textAlign: "center", marginBottom: 56,
      }}>
        <div style={{
          fontSize: 13, color: colors.gold, fontWeight: 600,
          letterSpacing: "0.3em", textTransform: "uppercase",
          fontFamily: "system-ui, -apple-system, sans-serif", marginBottom: 14,
        }}>
          Como Funciona na Operação
        </div>
        <div style={{
          fontSize: 50, fontWeight: 800, color: colors.white,
          letterSpacing: "-1.5px", fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          Detecção → Conversa → Retenção
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "stretch", gap: 0, width: "100%", maxWidth: 1400,
      }}>
        {STEPS.map((step, i) => {
          const delay = 28 + i * 25;
          const op = fadeIn(frame, delay, 20);
          const y = slideUp(frame, delay, 24, 40);
          const sc = scaleIn(frame, delay, 22, 0.85);

          // Arrow between cards
          const arrowOp = i < STEPS.length - 1
            ? fadeIn(frame, delay + 20, 15)
            : 0;

          const arrowProgress = i < STEPS.length - 1
            ? interpolate(frame, [delay + 22, delay + 45], [0, 1], {
                extrapolateLeft: "clamp", extrapolateRight: "clamp",
              })
            : 0;

          return (
            <React.Fragment key={i}>
              <div style={{
                flex: 1, opacity: op,
                transform: `translateY(${y}px) scale(${sc})`,
              }}>
                <LiquidGlassCard
                  shimmerStart={delay + 22}
                  shimmerPeriod={100}
                  style={{ padding: "40px 36px", height: "100%" }}
                >
                  {/* Step number */}
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 24,
                    boxShadow: `0 0 20px rgba(212,175,55,0.35)`,
                  }}>
                    <span style={{
                      fontSize: 18, fontWeight: 900, color: colors.bg,
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    }}>
                      {step.num}
                    </span>
                  </div>

                  {/* Icon */}
                  <div style={{ marginBottom: 18 }}>{step.icon}</div>

                  <div style={{
                    fontSize: 22, fontWeight: 700, color: colors.white,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    marginBottom: 12, letterSpacing: "-0.3px",
                  }}>
                    {step.title}
                  </div>
                  <div style={{
                    fontSize: 15, color: colors.muted, lineHeight: 1.6,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}>
                    {step.sub}
                  </div>

                  {/* Step label bottom */}
                  {i === 2 && (
                    <div style={{
                      marginTop: 24, padding: "10px 16px", borderRadius: 10,
                      background: "rgba(212,175,55,0.08)",
                      border: `1px solid rgba(212,175,55,0.25)`,
                      opacity: fadeIn(frame, delay + 30, 18),
                    }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600, color: colors.gold,
                        fontFamily: "system-ui, -apple-system, sans-serif",
                      }}>
                        ✓ Receita preservada
                      </div>
                    </div>
                  )}
                </LiquidGlassCard>
              </div>

              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <div style={{
                  width: 56, display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: arrowOp, flexShrink: 0,
                }}>
                  <svg width={56} height={24} viewBox="0 0 56 24" fill="none">
                    <line
                      x1={0} y1={12}
                      x2={`${arrowProgress * 40}`} y2={12}
                      stroke={colors.gold} strokeWidth={1.5} strokeDasharray="5 3"
                    />
                    {arrowProgress > 0.8 && (
                      <path
                        d="M40 6L50 12L40 18"
                        stroke={colors.gold}
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity={(arrowProgress - 0.8) / 0.2}
                      />
                    )}
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div style={{
        opacity: fadeIn(frame, 115, 18),
        marginTop: 44, textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          padding: "12px 32px", borderRadius: 99,
          background: "rgba(212,175,55,0.07)",
          border: `1px solid ${colors.borderGold}`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: colors.gold, boxShadow: `0 0 12px ${colors.gold}`,
          }} />
          <span style={{
            fontSize: 16, color: colors.white, fontWeight: 600,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>
            100% automatizado · Zero esforço manual
          </span>
        </div>
      </div>
    </div>
  );
};

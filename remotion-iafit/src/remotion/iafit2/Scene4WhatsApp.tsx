import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn } from "./utils";
import { LiquidGlassCard } from "./LiquidGlassCard";

const AI_MSG =
  "Oi! Percebi que você ficou alguns dias sem treinar. Aconteceu alguma coisa? Posso te ajudar a retomar? 💪";
const STUDENT_MSG = "Oi... é que tô com a rotina bagunçada";

export const Scene4WhatsApp: React.FC = () => {
  const frame = useCurrentFrame();

  const labelOp = fadeIn(frame, 5, 16);
  const panelOp = fadeIn(frame, 15, 22);
  const panelScale = scaleIn(frame, 15, 25, 0.88);

  // AI message typewriter
  const aiMsgProgress = interpolate(frame, [30, 90], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const aiMsgChars = Math.floor(aiMsgProgress * AI_MSG.length);
  const aiMsgOp = fadeIn(frame, 28, 12);

  // typing indicator
  const typingOp = interpolate(frame, [90, 100, 110, 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  // Student reply
  const studentMsgOp = fadeIn(frame, 120, 15);
  const studentMsgY = slideUp(frame, 120, 18, 20);

  // Badge
  const badgeOp = fadeIn(frame, 140, 18);

  // Connection line
  const lineProgress = interpolate(frame, [20, 55], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const dotPulse = interpolate(Math.sin((frame / 30) * Math.PI * 2), [-1, 1], [0.6, 1.0]);

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 100px", gap: 48,
    }}>
      {/* Left: label + AI node */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: 260 }}>
        <div style={{ opacity: labelOp, textAlign: "center" }}>
          <div style={{
            fontSize: 13, color: colors.gold, fontWeight: 600,
            letterSpacing: "0.3em", textTransform: "uppercase",
            fontFamily: "system-ui, -apple-system, sans-serif", marginBottom: 28,
          }}>
            A IA em Ação
          </div>
          <div style={{
            width: 96, height: 96, borderRadius: "50%", margin: "0 auto",
            background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 ${30 * dotPulse}px rgba(212,175,55,0.55)`,
          }}>
            <svg width={44} height={44} viewBox="0 0 44 44" fill="none">
              <circle cx={22} cy={16} r={8} stroke="#050505" strokeWidth={2.5} />
              <path d="M8 38c0-7.7 6.3-14 14-14s14 6.3 14 14" stroke="#050505" strokeWidth={2.5} strokeLinecap="round" />
              <circle cx={22} cy={16} r={3} fill="#050505" />
            </svg>
          </div>
          <div style={{
            fontSize: 15, color: colors.white, fontWeight: 600, marginTop: 12,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>Agente IAFIT</div>
          <div style={{
            fontSize: 13, color: colors.gold, marginTop: 4,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>● Contato automático</div>
        </div>

        {/* Connection */}
        <svg width={200} height={4} style={{ opacity: fadeIn(frame, 22, 18) }}>
          <line x1={0} y1={2} x2={`${lineProgress * 100}%`} y2={2}
            stroke={colors.gold} strokeWidth={1.5} strokeDasharray="6 4" />
        </svg>
      </div>

      {/* Center: WhatsApp panel */}
      <div style={{
        opacity: panelOp, transform: `scale(${panelScale})`,
        flex: 1, maxWidth: 560,
      }}>
        <LiquidGlassCard shimmerStart={40} shimmerPeriod={95} style={{ overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${colors.borderGold}`,
            display: "flex", alignItems: "center", gap: 14,
            background: "rgba(212,175,55,0.04)",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(212,175,55,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.12-1.34A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" stroke={colors.gold} strokeWidth={1.8} />
                <path d="M9 10h.01M12 10h.01M15 10h.01" stroke={colors.gold} strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.white, fontFamily: "system-ui, -apple-system, sans-serif" }}>WhatsApp</div>
              <div style={{ fontSize: 12, color: colors.gold, fontFamily: "system-ui, -apple-system, sans-serif" }}>● Online agora</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ padding: "24px 24px 20px", minHeight: 220, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* AI bubble */}
            <div style={{ opacity: aiMsgOp, alignSelf: "flex-start", maxWidth: "88%" }}>
              <div style={{
                background: "rgba(212,175,55,0.1)", border: `1px solid rgba(212,175,55,0.25)`,
                borderRadius: "4px 18px 18px 18px", padding: "12px 16px",
              }}>
                <div style={{
                  fontSize: 10, color: colors.gold, marginBottom: 4, letterSpacing: "0.1em",
                  textTransform: "uppercase", fontFamily: "system-ui, -apple-system, sans-serif",
                }}>
                  Agente IAFIT
                </div>
                <div style={{
                  fontSize: 15, color: colors.white, lineHeight: 1.55,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}>
                  {AI_MSG.slice(0, aiMsgChars)}
                  {aiMsgChars < AI_MSG.length && (
                    <span style={{ opacity: 0.4 }}>|</span>
                  )}
                </div>
              </div>
            </div>

            {/* Typing indicator */}
            <div style={{ opacity: typingOp, alignSelf: "flex-end" }}>
              <div style={{
                background: "rgba(255,255,255,0.06)", borderRadius: "18px 4px 18px 18px",
                padding: "12px 20px", display: "flex", gap: 5, alignItems: "center",
              }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: colors.muted,
                    opacity: interpolate(Math.sin((frame / 30) * Math.PI * 3 + delay * Math.PI), [-1, 1], [0.2, 1]),
                  }} />
                ))}
              </div>
            </div>

            {/* Student reply */}
            <div style={{
              opacity: studentMsgOp, transform: `translateY(${studentMsgY}px)`,
              alignSelf: "flex-end", maxWidth: "80%",
            }}>
              <div style={{
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "18px 4px 18px 18px", padding: "12px 16px",
              }}>
                <div style={{
                  fontSize: 15, color: colors.white, lineHeight: 1.55,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}>
                  {STUDENT_MSG}
                </div>
              </div>
            </div>
          </div>
        </LiquidGlassCard>
      </div>

      {/* Right badge */}
      <div style={{ opacity: badgeOp, width: 200, textAlign: "center" }}>
        <div style={{
          padding: "14px 20px", borderRadius: 16,
          background: "rgba(212,175,55,0.08)", border: `1px solid ${colors.borderGold}`,
        }}>
          <div style={{
            fontSize: 28, fontWeight: 900, color: colors.gold,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>
            80
          </div>
          <div style={{
            fontSize: 13, color: colors.muted, marginTop: 4,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}>
            alunos contactados
          </div>
          <div style={{
            fontSize: 12, color: colors.gold, marginTop: 8,
            fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "0.05em",
          }}>
            ✓ Automaticamente
          </div>
        </div>
      </div>
    </div>
  );
};

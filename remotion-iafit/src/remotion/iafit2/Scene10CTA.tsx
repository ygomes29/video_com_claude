import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn } from "./utils";
import { IAFITLogo } from "./IAFITLogo";

export const Scene10CTA: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOp = fadeIn(frame, 8, 22);
  const headlineOp = fadeIn(frame, 32, 20);
  const headlineY = slideUp(frame, 32, 24, 35);
  const subOp = fadeIn(frame, 50, 20);
  const subY = slideUp(frame, 50, 24, 30);
  const cardOp = fadeIn(frame, 65, 22);
  const cardScale = scaleIn(frame, 65, 25, 0.88);
  const btnOp = fadeIn(frame, 85, 20);
  const btnScale = scaleIn(frame, 85, 24, 0.85);
  const disclaimerOp = fadeIn(frame, 110, 18);

  const btnGlow = interpolate(Math.sin((frame / 30) * Math.PI * 2), [-1, 1], [25, 55]);
  const btnPulse = interpolate(Math.sin((frame / 30) * Math.PI * 1.5), [-1, 1], [0.98, 1.02]);

  // Ring expand
  const ringScale = interpolate(frame, [85, 240], [0.6, 2.5], {
    extrapolateRight: "clamp",
  });
  const ringOp = interpolate(frame, [85, 115, 220, 240], [0, 0.4, 0.4, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 140px",
    }}>
      {/* Logo */}
      <div style={{ opacity: logoOp, marginBottom: 32 }}>
        <IAFITLogo size="md" enterFrame={8} />
      </div>

      {/* Headline */}
      <div style={{
        opacity: headlineOp, transform: `translateY(${headlineY}px)`,
        textAlign: "center", marginBottom: 10,
      }}>
        <div style={{
          fontSize: 56, fontWeight: 800, color: colors.white,
          letterSpacing: "-1.8px", lineHeight: 1.1,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          A IA que age antes do cancelamento.
        </div>
      </div>

      {/* Sub */}
      <div style={{
        opacity: subOp, transform: `translateY(${subY}px)`,
        textAlign: "center", marginBottom: 44,
      }}>
        <div style={{
          fontSize: 22, color: colors.muted,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          Agentes de IA para vender, atender, reter e recuperar alunos.
        </div>
      </div>

      {/* Feature pills */}
      <div style={{
        opacity: cardOp, transform: `scale(${cardScale})`,
        display: "flex", gap: 14, marginBottom: 44, flexWrap: "wrap", justifyContent: "center",
      }}>
        {["Detecção automática", "WhatsApp IA", "Retenção de alunos", "Receita preservada"].map((t, i) => (
          <div key={i} style={{
            padding: "10px 22px", borderRadius: 99,
            background: i === 0
              ? `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`
              : "rgba(255,255,255,0.05)",
            border: i !== 0 ? `1px solid ${colors.borderGold}` : "none",
          }}>
            <span style={{
              fontSize: 14, fontWeight: 600,
              color: i === 0 ? colors.bg : colors.white,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              {t}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: 99,
          border: `1px solid ${colors.gold}`,
          transform: `scale(${ringScale})`,
          opacity: ringOp,
        }} />
        <div style={{
          opacity: btnOp,
          transform: `scale(${btnScale * btnPulse})`,
        }}>
          <div style={{
            padding: "22px 80px", borderRadius: 99,
            background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldLight} 60%, ${colors.gold} 100%)`,
            boxShadow: `0 0 ${btnGlow}px rgba(212,175,55,0.55), 0 0 ${btnGlow * 2}px rgba(212,175,55,0.15)`,
            position: "relative", overflow: "hidden", cursor: "pointer",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "50%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)",
              borderRadius: "99px 99px 0 0",
            }} />
            <span style={{
              fontSize: 22, fontWeight: 900, color: colors.bg,
              letterSpacing: "0.04em", position: "relative",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
              CLIQUE EM SAIBA MAIS
            </span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        opacity: disclaimerOp, marginTop: 40, textAlign: "center", maxWidth: 700,
      }}>
        <div style={{
          fontSize: 11, color: "rgba(166,166,166,0.45)", lineHeight: 1.6,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          Exemplo ilustrativo baseado em média operacional de retenção.
          Os resultados podem variar conforme base, oferta, atendimento e operação da academia.
        </div>
      </div>
    </div>
  );
};

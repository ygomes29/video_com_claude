import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp } from "./utils";

export const Scene1Opening: React.FC = () => {
  const frame = useCurrentFrame();

  const badgeOp = fadeIn(frame, 8, 18);
  const badgeY = slideUp(frame, 8, 22, 25);

  const line1Op = fadeIn(frame, 28, 22);
  const line1Y = slideUp(frame, 28, 28, 45);
  const line2Op = fadeIn(frame, 48, 22);
  const line2Y = slideUp(frame, 48, 28, 45);

  const pulseRing = interpolate(frame, [0, 150], [0.4, 2.2], {
    extrapolateRight: "clamp",
  });
  const pulseOp = interpolate(frame, [0, 40, 120], [0, 0.35, 0], {
    extrapolateRight: "clamp",
  });

  const glowWord = interpolate(
    Math.sin((frame / 30) * Math.PI * 1.5),
    [-1, 1],
    [0.6, 1.0],
  );

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 140px",
    }}>
      {/* Pulse ring behind */}
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        border: `1px solid ${colors.gold}`,
        transform: `scale(${pulseRing})`, opacity: pulseOp,
      }} />

      {/* Badge */}
      <div style={{
        opacity: badgeOp, transform: `translateY(${badgeY}px)`,
        marginBottom: 36,
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 22px", borderRadius: 99,
        background: "rgba(212,175,55,0.08)",
        border: `1px solid rgba(212,175,55,0.35)`,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%",
          background: colors.gold, boxShadow: `0 0 10px ${colors.gold}`,
        }} />
        <span style={{
          fontSize: 13, fontWeight: 600, color: colors.gold,
          letterSpacing: "0.2em", textTransform: "uppercase",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          Agente de IA · Sucesso do Cliente
        </span>
      </div>

      {/* Main text */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          opacity: line1Op, transform: `translateY(${line1Y}px)`,
          fontSize: 70, fontWeight: 800, color: colors.white,
          lineHeight: 1.1, letterSpacing: "-2px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          Todo{" "}
          <span style={{
            background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 ${18 * glowWord}px rgba(212,175,55,0.5))`,
          }}>cancelamento</span>
        </div>
        <div style={{
          opacity: line2Op, transform: `translateY(${line2Y}px)`,
          fontSize: 70, fontWeight: 800, color: colors.muted,
          lineHeight: 1.1, letterSpacing: "-2px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginTop: 4,
        }}>
          começa antes do pedido de saída.
        </div>
      </div>

      {/* Golden rule */}
      <div style={{
        opacity: fadeIn(frame, 70, 18),
        display: "flex", alignItems: "center", gap: 18, marginTop: 44,
      }}>
        <div style={{ width: 70, height: 1, background: `linear-gradient(90deg, transparent, ${colors.gold})` }} />
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: colors.gold, boxShadow: `0 0 10px ${colors.gold}` }} />
        <div style={{ width: 70, height: 1, background: `linear-gradient(90deg, ${colors.gold}, transparent)` }} />
      </div>
    </div>
  );
};

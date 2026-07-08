import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn } from "./utils";

export const SceneOffer: React.FC = () => {
  const frame = useCurrentFrame();

  const eyebrowOp = fadeIn(frame, 5, 15);
  const headline1Op = fadeIn(frame, 20, 22);
  const headline1Y = slideUp(frame, 20, 25, 40);
  const headline2Op = fadeIn(frame, 40, 22);
  const headline2Y = slideUp(frame, 40, 25, 40);
  const cardOp = fadeIn(frame, 65, 20);
  const cardScale = scaleIn(frame, 65, 25, 0.85);
  const validOp = fadeIn(frame, 100, 18);
  const validY = slideUp(frame, 100, 20, 20);

  const pulseScale = interpolate(
    Math.sin((frame / 30) * Math.PI * 1.5),
    [-1, 1],
    [0.97, 1.03],
  );

  const glowIntensity = interpolate(
    Math.sin((frame / 30) * Math.PI),
    [-1, 1],
    [30, 60],
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
          marginBottom: 30,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 60,
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
          Oferta Especial
        </span>
        <div
          style={{
            width: 60,
            height: 1,
            background: `linear-gradient(90deg, ${colors.gold}, transparent)`,
          }}
        />
      </div>

      <h2
        style={{
          margin: 0,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginBottom: 50,
        }}
      >
        <div
          style={{
            opacity: headline1Op,
            transform: `translateY(${headline1Y}px)`,
            fontSize: 60,
            fontWeight: 800,
            color: colors.white,
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
          }}
        >
          Comece agora e experimente
        </div>
        <div
          style={{
            opacity: headline2Op,
            transform: `translateY(${headline2Y}px)`,
            fontSize: 60,
            fontWeight: 800,
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
          }}
        >
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            30 dias completamente grátis
          </span>
        </div>
      </h2>

      {/* Offer card */}
      <div
        style={{
          opacity: cardOp,
          transform: `scale(${cardScale * pulseScale})`,
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldLight} 60%, ${colors.gold} 100%)`,
            borderRadius: 24,
            padding: "40px 80px",
            textAlign: "center",
            boxShadow: `0 0 ${glowIntensity}px rgba(212,175,55,0.5), 0 0 ${glowIntensity * 2}px rgba(212,175,55,0.15)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Inner shine */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "50%",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)",
              borderRadius: "24px 24px 0 0",
            }}
          />

          <div
            style={{
              fontSize: 88,
              fontWeight: 900,
              color: colors.bg,
              lineHeight: 1,
              letterSpacing: "-3px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              position: "relative",
            }}
          >
            30
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: colors.bg,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "system-ui, -apple-system, sans-serif",
              position: "relative",
              opacity: 0.8,
            }}
          >
            dias grátis
          </div>
        </div>
      </div>

      {/* Valid until */}
      <div
        style={{
          opacity: validOp,
          transform: `translateY(${validY}px)`,
          marginTop: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 24px",
            borderRadius: 99,
            background: "rgba(255,255,255,0.05)",
            border: `1px solid rgba(212,175,55,0.3)`,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#FF5555",
              boxShadow: "0 0 10px #FF5555",
            }}
          />
          <span
            style={{
              fontSize: 15,
              color: colors.muted,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            Válido até{" "}
            <strong style={{ color: colors.white }}>29/06</strong> — Vagas
            limitadas
          </span>
        </div>
      </div>
    </div>
  );
};

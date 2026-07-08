import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn, easeOutExpo } from "./utils";

export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();

  const logoOp = fadeIn(frame, 5, 20);
  const logoScale = scaleIn(frame, 5, 22, 0.75);
  const headlineOp = fadeIn(frame, 30, 20);
  const headlineY = slideUp(frame, 30, 25, 35);
  const subOp = fadeIn(frame, 50, 20);
  const subY = slideUp(frame, 50, 25, 30);
  const btnOp = fadeIn(frame, 70, 20);
  const btnScale = scaleIn(frame, 70, 25, 0.85);
  const taglineOp = fadeIn(frame, 90, 18);

  const btnGlow = interpolate(
    Math.sin((frame / 30) * Math.PI * 2),
    [-1, 1],
    [30, 60],
  );

  const btnPulse = interpolate(
    Math.sin((frame / 30) * Math.PI * 1.5),
    [-1, 1],
    [0.98, 1.02],
  );

  const ringScale = interpolate(frame, [70, 200], [0.5, 2.5], {
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  const ringOp = interpolate(frame, [70, 130, 200], [0, 0.4, 0], {
    extrapolateRight: "clamp",
  });

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
      {/* Logo */}
      <div
        style={{
          opacity: logoOp,
          transform: `scale(${logoScale})`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 36,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 30px ${colors.shadowGold}`,
          }}
        >
          <svg width={30} height={30} viewBox="0 0 44 44" fill="none">
            <path d="M8 34L22 10L36 34" stroke="#050505" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 26H31" stroke="#050505" strokeWidth={3.5} strokeLinecap="round" />
            <circle cx={22} cy={8} r={3} fill="#050505" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 48,
            fontWeight: 800,
            letterSpacing: "-1.5px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <span style={{ color: colors.white }}>IA</span>
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FIT
          </span>
        </span>
      </div>

      {/* Headline */}
      <div
        style={{
          opacity: headlineOp,
          transform: `translateY(${headlineY}px)`,
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 52,
            fontWeight: 800,
            color: colors.white,
            letterSpacing: "-1.5px",
            lineHeight: 1.15,
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Transforme sua academia hoje
        </h2>
      </div>

      {/* Sub */}
      <div
        style={{
          opacity: subOp,
          transform: `translateY(${subY}px)`,
          textAlign: "center",
          marginBottom: 52,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 22,
            color: colors.muted,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 400,
          }}
        >
          Sem risco. Sem cartão. Só crescimento.
        </p>
      </div>

      {/* CTA Button + pulse rings */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Pulse ring */}
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 70,
            borderRadius: 99,
            border: `1px solid ${colors.gold}`,
            transform: `scale(${ringScale})`,
            opacity: ringOp,
          }}
        />

        <div
          style={{
            opacity: btnOp,
            transform: `scale(${btnScale * btnPulse})`,
          }}
        >
          <div
            style={{
              padding: "22px 72px",
              borderRadius: 99,
              background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldLight} 60%, ${colors.gold} 100%)`,
              boxShadow: `0 0 ${btnGlow}px rgba(212,175,55,0.6), 0 0 ${btnGlow * 2}px rgba(212,175,55,0.2)`,
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            {/* Shine */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "50%",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)",
              }}
            />
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: colors.bg,
                letterSpacing: "0.04em",
                fontFamily: "system-ui, -apple-system, sans-serif",
                position: "relative",
              }}
            >
              Clique em Saiba Mais
            </span>
          </div>
        </div>
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          opacity: taglineOp,
          marginTop: 36,
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: "rgba(166,166,166,0.6)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            letterSpacing: "0.08em",
          }}
        >
          IAFIT · Inteligência Artificial para Academias
        </p>
      </div>
    </div>
  );
};

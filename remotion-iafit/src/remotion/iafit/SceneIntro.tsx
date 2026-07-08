import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn, easeOutExpo } from "./utils";

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();

  const logoScale = scaleIn(frame, 10, 30, 0.7);
  const logoOpacity = fadeIn(frame, 10, 25);
  const taglineOpacity = fadeIn(frame, 45, 20);
  const taglineY = slideUp(frame, 45, 25, 30);
  const subtitleOpacity = fadeIn(frame, 65, 20);
  const subtitleY = slideUp(frame, 65, 25, 25);

  const ringScale1 = interpolate(frame, [0, 90], [0.6, 1.5], {
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  const ringOpacity1 = interpolate(frame, [0, 30, 90], [0, 0.5, 0], {
    extrapolateRight: "clamp",
  });

  const ringScale2 = interpolate(frame, [15, 110], [0.6, 1.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  const ringOpacity2 = interpolate(frame, [15, 45, 110], [0, 0.35, 0], {
    extrapolateLeft: "clamp",
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
      }}
    >
      {/* Pulse rings */}
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: `1.5px solid ${colors.gold}`,
          transform: `scale(${ringScale1})`,
          opacity: ringOpacity1,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: `1px solid ${colors.gold}`,
          transform: `scale(${ringScale2})`,
          opacity: ringOpacity2,
        }}
      />

      {/* Logo container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          marginBottom: 28,
        }}
      >
        {/* IA icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldLight} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 40px ${colors.shadowGold}, 0 0 80px rgba(212,175,55,0.15)`,
          }}
        >
          <svg width={44} height={44} viewBox="0 0 44 44" fill="none">
            <path
              d="M8 34L22 10L36 34"
              stroke="#050505"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 26H31"
              stroke="#050505"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
            <circle cx={22} cy={8} r={3} fill="#050505" />
          </svg>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: colors.white,
              letterSpacing: "-2px",
              lineHeight: 1,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            IA
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
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 26,
            color: colors.muted,
            fontWeight: 400,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: 0,
          }}
        >
          Inteligência Artificial para Academias
        </p>
      </div>

      {/* Golden divider */}
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginTop: 32,
        }}
      >
        <div
          style={{
            width: 80,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${colors.gold})`,
          }}
        />
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: colors.gold,
            boxShadow: `0 0 10px ${colors.gold}`,
          }}
        />
        <div
          style={{
            width: 80,
            height: 1,
            background: `linear-gradient(90deg, ${colors.gold}, transparent)`,
          }}
        />
      </div>
    </div>
  );
};

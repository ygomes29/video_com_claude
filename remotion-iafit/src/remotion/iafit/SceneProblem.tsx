import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, easeOutExpo } from "./utils";

const LINES = [
  "Sua academia está perdendo alunos",
  "para a concorrência todos os dias.",
];

export const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();

  const line1Opacity = fadeIn(frame, 5, 20);
  const line1Y = slideUp(frame, 5, 25, 40);
  const line2Opacity = fadeIn(frame, 28, 20);
  const line2Y = slideUp(frame, 28, 25, 40);
  const subOpacity = fadeIn(frame, 55, 20);
  const subY = slideUp(frame, 55, 25, 30);

  const barWidth = interpolate(frame, [55, 100], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
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
        padding: "0 160px",
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          opacity: fadeIn(frame, 0, 15),
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(212,175,55,0.6))`,
          }}
        />
        <span
          style={{
            fontSize: 13,
            color: colors.gold,
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          O Problema
        </span>
        <div
          style={{
            width: 40,
            height: 1,
            background: `linear-gradient(90deg, rgba(212,175,55,0.6), transparent)`,
          }}
        />
      </div>

      <h1
        style={{
          margin: 0,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
            fontSize: 62,
            fontWeight: 700,
            color: colors.white,
            lineHeight: 1.15,
            letterSpacing: "-1px",
          }}
        >
          {LINES[0]}
        </div>
        <div
          style={{
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
            fontSize: 62,
            fontWeight: 700,
            color: colors.muted,
            lineHeight: 1.15,
            letterSpacing: "-1px",
          }}
        >
          {LINES[1]}
        </div>
      </h1>

      {/* Progress bar */}
      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          marginTop: 48,
          width: 500,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: colors.muted,
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            Taxa de churn média em academias brasileiras
          </span>
          <span
            style={{
              fontSize: 13,
              color: colors.gold,
              fontWeight: 700,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            42%
          </span>
        </div>
        <div
          style={{
            height: 4,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${barWidth}%`,
              background: `linear-gradient(90deg, ${colors.gold}, ${colors.goldLight})`,
              borderRadius: 99,
              boxShadow: `0 0 12px ${colors.gold}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

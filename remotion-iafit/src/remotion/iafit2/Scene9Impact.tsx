import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp } from "./utils";

const WORDS_LINE1 = ["A", "IA", "age"];
const WORDS_LINE2 = ["antes", "do", "cancelamento"];
const WORDS_LINE3 = ["e", "transforma"];
const WORDS_LINE4 = ["risco", "em", "retenção."];

const HIGHLIGHT_WORDS = new Set(["antes", "cancelamento", "risco", "retenção."]);

export const Scene9Impact: React.FC = () => {
  const frame = useCurrentFrame();

  function wordOp(wordIndex: number) {
    const start = 8 + wordIndex * 8;
    return fadeIn(frame, start, 16);
  }
  function wordY(wordIndex: number) {
    const start = 8 + wordIndex * 8;
    return slideUp(frame, start, 20, 28);
  }

  let globalIdx = 0;

  function renderLine(words: string[]) {
    const startIdx = globalIdx;
    globalIdx += words.length;
    return (
      <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
        {words.map((w, i) => {
          const idx = startIdx + i;
          const isHighlight = HIGHLIGHT_WORDS.has(w);
          const glowSize = isHighlight
            ? interpolate(Math.sin((frame / 30) * Math.PI * 1.5), [-1, 1], [16, 32])
            : 0;
          return (
            <span
              key={i}
              style={{
                opacity: wordOp(idx),
                transform: `translateY(${wordY(idx)}px)`,
                display: "inline-block",
                fontSize: 74,
                fontWeight: 800,
                letterSpacing: "-2px",
                fontFamily: "system-ui, -apple-system, sans-serif",
                ...(isHighlight
                  ? {
                      background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldLight})`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: `drop-shadow(0 0 ${glowSize}px rgba(212,175,55,0.5))`,
                    }
                  : { color: colors.white }),
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    );
  }

  // reset before render
  globalIdx = 0;

  const shimmerX = interpolate(frame, [65, 120], [-150, 250], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const shimmerOp = interpolate(frame, [65, 80, 110, 120], [0, 0.6, 0.6, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 120px",
    }}>
      {/* Shimmer overlay on text area */}
      <div style={{
        position: "absolute",
        width: "60%", height: 280,
        background: `linear-gradient(105deg, transparent 30%, rgba(212,175,55,0.08) 50%, transparent 70%)`,
        transform: `translateX(${shimmerX}px)`,
        opacity: shimmerOp,
        pointerEvents: "none",
      }} />

      {/* Text */}
      <div style={{ textAlign: "center", lineHeight: 1.12, display: "flex", flexDirection: "column", gap: 4 }}>
        {renderLine(WORDS_LINE1)}
        {renderLine(WORDS_LINE2)}
        {renderLine(WORDS_LINE3)}
        {renderLine(WORDS_LINE4)}
      </div>

      {/* IAFIT badge bottom */}
      <div style={{
        opacity: fadeIn(frame, 115, 18),
        marginTop: 60, display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${colors.gold})` }} />
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 20px", borderRadius: 99,
          background: "rgba(212,175,55,0.07)",
          border: `1px solid rgba(212,175,55,0.3)`,
        }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: colors.gold,
            fontFamily: "system-ui, -apple-system, sans-serif", letterSpacing: "0.15em",
          }}>
            IAFIT
          </span>
        </div>
        <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, ${colors.gold}, transparent)` }} />
      </div>
    </div>
  );
};

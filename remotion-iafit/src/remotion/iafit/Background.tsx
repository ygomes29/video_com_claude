import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors } from "./colors";

const PARTICLE_COUNT = 40;

const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  speed: Math.random() * 0.015 + 0.005,
  phase: Math.random() * Math.PI * 2,
  opacity: Math.random() * 0.5 + 0.2,
}));

const GRID_COLS = 24;
const GRID_ROWS = 14;

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const time = frame / 30;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: colors.bg,
        overflow: "hidden",
      }}
    >
      {/* Radial gradient glow center */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 50%, rgba(212,175,55,0.06) 0%, transparent 70%)`,
        }}
      />

      {/* Top golden glow */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 400,
          background: `radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 70%)`,
        }}
      />

      {/* Bottom subtle glow */}
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 300,
          background: `radial-gradient(ellipse at 50% 100%, rgba(212,175,55,0.05) 0%, transparent 70%)`,
        }}
      />

      {/* Grid */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0, opacity: 0.07 }}
      >
        {Array.from({ length: GRID_COLS + 1 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={(i * width) / GRID_COLS}
            y1={0}
            x2={(i * width) / GRID_COLS}
            y2={height}
            stroke={colors.gold}
            strokeWidth={0.5}
          />
        ))}
        {Array.from({ length: GRID_ROWS + 1 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={(i * height) / GRID_ROWS}
            x2={width}
            y2={(i * height) / GRID_ROWS}
            stroke={colors.gold}
            strokeWidth={0.5}
          />
        ))}
      </svg>

      {/* Particles */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        {particles.map((p) => {
          const y =
            ((p.y + p.speed * time * 100) % 110) - 5;
          const wobble = Math.sin(time * 0.8 + p.phase) * 1.5;
          const opacity =
            p.opacity *
            interpolate(
              Math.sin(time * 0.5 + p.phase),
              [-1, 1],
              [0.3, 1],
            );
          return (
            <circle
              key={p.id}
              cx={`${p.x + wobble}%`}
              cy={`${y}%`}
              r={p.size}
              fill={colors.gold}
              opacity={opacity}
            />
          );
        })}
      </svg>

      {/* Noise vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
};

import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors } from "./colors";

const NODE_COUNT = 32;
const EDGE_PROB = 0.18;

const rng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff);
  };
};

const rand = rng(42);
const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
  id: i,
  x: rand() * 100,
  y: rand() * 100,
  r: rand() * 2.2 + 0.8,
  speed: rand() * 0.008 + 0.003,
  phase: rand() * Math.PI * 2,
  opacity: rand() * 0.5 + 0.3,
}));

const edges: [number, number][] = [];
const rand2 = rng(99);
for (let i = 0; i < NODE_COUNT; i++) {
  for (let j = i + 1; j < NODE_COUNT; j++) {
    if (rand2() < EDGE_PROB) edges.push([i, j]);
  }
}

export const NeuralBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / 30;

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: colors.bg, overflow: "hidden" }}>
      {/* Deep gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 60% at 50% 45%, rgba(212,175,55,0.055) 0%, transparent 70%)",
      }} />

      {/* Top glow */}
      <div style={{
        position: "absolute", top: -200, left: "50%",
        transform: "translateX(-50%)", width: 1000, height: 500,
        background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.10) 0%, transparent 70%)",
      }} />

      {/* Neural SVG */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {/* Edges */}
        {edges.map(([a, b], i) => {
          const na = nodes[a];
          const nb = nodes[b];
          const pulse = interpolate(Math.sin(t * 0.6 + i * 0.4), [-1, 1], [0.04, 0.14]);
          return (
            <line
              key={i}
              x1={`${na.x}%`} y1={`${na.y}%`}
              x2={`${nb.x}%`} y2={`${nb.y}%`}
              stroke={colors.gold}
              strokeWidth={0.7}
              opacity={pulse}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const wobX = Math.sin(t * n.speed * 60 + n.phase) * 1.2;
          const wobY = Math.cos(t * n.speed * 50 + n.phase) * 1.0;
          const glow = interpolate(Math.sin(t * 1.2 + n.phase), [-1, 1], [n.opacity * 0.5, n.opacity]);
          return (
            <g key={n.id}>
              <circle
                cx={`${n.x + wobX}%`} cy={`${n.y + wobY}%`}
                r={n.r * 3} fill={colors.gold} opacity={glow * 0.12}
              />
              <circle
                cx={`${n.x + wobX}%`} cy={`${n.y + wobY}%`}
                r={n.r} fill={colors.gold} opacity={glow}
              />
            </g>
          );
        })}
      </svg>

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.75) 100%)",
      }} />
    </div>
  );
};

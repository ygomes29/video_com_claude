import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C } from "./colors";

const seed = (n: number) => { let s = n; return () => { s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; }; };
const r1 = seed(7); const r2 = seed(13); const r3 = seed(31);

const NODES = Array.from({ length: 28 }, (_, i) => ({
  x: r1() * 100, y: r1() * 100, r: r2() * 2 + 0.8,
  sx: r3() * 0.007 + 0.003, sy: r3() * 0.006 + 0.002,
  ph: r1() * Math.PI * 2, op: r2() * 0.45 + 0.2,
}));

const EDGES: [number,number][] = [];
const re = seed(77);
for (let i=0;i<NODES.length;i++) for(let j=i+1;j<NODES.length;j++) if(re()<0.15) EDGES.push([i,j]);

export const NeuralBg: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / 30;

  return (
    <div style={{ position:"absolute", inset:0, background:C.bg, overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 85% 60% at 50% 45%,rgba(212,175,55,0.06) 0%,transparent 70%)" }} />
      <div style={{ position:"absolute", top:-220, left:"50%", transform:"translateX(-50%)", width:1100, height:500, background:"radial-gradient(ellipse at 50% 0%,rgba(212,175,55,0.10) 0%,transparent 70%)" }} />

      <svg width={width} height={height} style={{ position:"absolute", inset:0 }}>
        {EDGES.map(([a,b], i) => {
          const op = interpolate(Math.sin(t*0.7+i*0.35),[-1,1],[0.04,0.13]);
          return <line key={i} x1={`${NODES[a].x}%`} y1={`${NODES[a].y}%`} x2={`${NODES[b].x}%`} y2={`${NODES[b].y}%`} stroke={C.gold} strokeWidth={0.7} opacity={op} />;
        })}
        {NODES.map((n, i) => {
          const wx = Math.sin(t*n.sx*60+n.ph)*1.3;
          const wy = Math.cos(t*n.sy*55+n.ph)*1.1;
          const glow = interpolate(Math.sin(t*1.1+n.ph),[-1,1],[n.op*0.4,n.op]);
          return (
            <g key={i}>
              <circle cx={`${n.x+wx}%`} cy={`${n.y+wy}%`} r={n.r*3.5} fill={C.gold} opacity={glow*0.10} />
              <circle cx={`${n.x+wx}%`} cy={`${n.y+wy}%`} r={n.r} fill={C.gold} opacity={glow} />
            </g>
          );
        })}
      </svg>

      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 50%,transparent 30%,rgba(0,0,0,0.75) 100%)" }} />
    </div>
  );
};

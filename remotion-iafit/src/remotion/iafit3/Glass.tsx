import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C, glassStyle } from "./colors";

interface GlassProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  shimmer?: boolean;
  shimmerOffset?: number;
  glow?: boolean;
}

export const Glass: React.FC<GlassProps> = ({
  children, style, shimmer = true, shimmerOffset = 0, glow = false,
}) => {
  const frame = useCurrentFrame();
  const shimX = interpolate((frame + shimmerOffset) % 110, [0,110], [-130,230], {
    extrapolateLeft:"clamp", extrapolateRight:"clamp",
  });
  const glowSz = glow ? interpolate(Math.sin((frame/30)*Math.PI),[-1,1],[18,42]) : 0;

  return (
    <div style={{ ...glassStyle(style), boxShadow: `0 0 ${glow?glowSz:32}px rgba(212,175,55,${glow?0.3:0.1}),inset 0 1px 1px rgba(255,255,255,0.18)` }}>
      <div style={{ position:"absolute", top:0, left:"8%", right:"8%", height:1, background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.55),transparent)", borderRadius:99 }} />
      {shimmer && (
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"linear-gradient(108deg,transparent 28%,rgba(212,175,55,0.10) 50%,transparent 72%)", transform:`translateX(${shimX}%)` }} />
      )}
      {children}
    </div>
  );
};

export const Logo: React.FC<{ scale?: number; enterFrame?: number }> = ({ scale=1, enterFrame=0 }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame,[enterFrame,enterFrame+22],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const sc = interpolate(frame,[enterFrame,enterFrame+22],[0.7,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const g = interpolate(Math.sin((frame/30)*Math.PI),[-1,1],[18,38]);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12*scale, opacity:op, transform:`scale(${sc})` }}>
      <div style={{ width:52*scale, height:52*scale, borderRadius:13*scale, background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 ${g}px rgba(212,175,55,0.5)`, flexShrink:0 }}>
        <svg width={28*scale} height={28*scale} viewBox="0 0 44 44" fill="none">
          <path d="M8 34L22 10L36 34" stroke="#050505" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 26H31" stroke="#050505" strokeWidth={3.5} strokeLinecap="round"/>
          <circle cx={22} cy={8} r={3} fill="#050505"/>
        </svg>
      </div>
      <span style={{ fontSize:44*scale, fontWeight:800, letterSpacing:"-1.5px", fontFamily:"system-ui,sans-serif", lineHeight:1 }}>
        <span style={{ color:C.white }}>IA</span>
        <span style={{ background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>FIT</span>
      </span>
    </div>
  );
};

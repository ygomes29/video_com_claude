import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C } from "./colors";
import { fadeIn, up, sc, count, ramp } from "./utils";
import { Glass } from "./Glass";
import { useCrossFade } from "./transitions";

const SCENE_DUR = 172;

// 105 dots arranged in a 15×7 grid
const DOTS = Array.from({ length: 105 }, (_, i) => ({
  x: (i % 15) * 6.5 + 2,
  y: Math.floor(i / 15) * 14 + 8,
}));

export const S02Base: React.FC = () => {
  const frame = useCurrentFrame();
  const cfOp  = useCrossFade(frame, SCENE_DUR, 20, 18);

  const labelOp = fadeIn(frame, 8, 16);
  const cardOp  = fadeIn(frame, 20, 22);
  const cardSc  = sc(frame, 20, 26, 0.82);
  const cardY   = up(frame, 20, 26, 50);

  const dotProgress = ramp(frame, 28, 60, 0, 1);
  const n105 = count(frame, 32, 55, 105);

  const subOp = fadeIn(frame, 100, 18);
  const subY  = up(frame, 100, 20, 22);

  const glowN = interpolate(Math.sin((frame / 30) * Math.PI), [-1,1], [20,44]);

  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 130px", opacity:cfOp }}>
      <div style={{ opacity:labelOp, marginBottom:36, fontSize:13, color:C.gold, fontWeight:600, letterSpacing:"0.3em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif" }}>
        A Base de Reativação
      </div>

      <div style={{ opacity:cardOp, transform:`translateY(${cardY}px) scale(${cardSc})`, width:780 }}>
        <Glass glow shimmer shimmerOffset={30} style={{ padding:"52px 60px" }}>
          {/* Dot grid */}
          <div style={{ position:"relative", height:110, marginBottom:36, overflow:"hidden" }}>
            <svg width="100%" height="110" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              {DOTS.map((d, i) => {
                const visible = i / 105 <= dotProgress;
                return (
                  <circle key={i} cx={`${d.x}%`} cy={`${d.y}%`} r={2.2} fill={C.gold} opacity={visible ? 0.65 : 0} />
                );
              })}
            </svg>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,transparent 55%,rgba(5,5,5,0.9) 100%)" }} />
          </div>

          {/* Number */}
          <div style={{
            fontSize:128, fontWeight:900, lineHeight:1, letterSpacing:"-0.06em",
            background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            filter:`drop-shadow(0 0 ${glowN}px rgba(212,175,55,0.4))`,
            fontFamily:"system-ui,sans-serif",
          }}>
            {n105}
          </div>

          <div style={{ fontSize:28, fontWeight:600, color:C.white, fontFamily:"system-ui,sans-serif", marginTop:6, letterSpacing:"-0.3px" }}>
            ex-alunos mapeados
          </div>

          <div style={{ width:64, height:2, marginTop:26, background:`linear-gradient(90deg,${C.gold},transparent)`, borderRadius:99 }} />

          <div style={{ opacity:subOp, transform:`translateY(${subY}px)`, fontSize:17, color:C.muted, marginTop:16, fontFamily:"system-ui,sans-serif" }}>
            Base inativa identificada pela IAFIT
          </div>
        </Glass>
      </div>
    </div>
  );
};

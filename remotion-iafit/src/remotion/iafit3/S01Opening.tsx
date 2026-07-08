import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C } from "./colors";
import { fadeIn, up, ramp, E } from "./utils";
import { useCrossFade } from "./transitions";

const SCENE_DUR = 170;

export const S01Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const cfOp  = useCrossFade(frame, SCENE_DUR, 18, 18);

  const badgeOp = fadeIn(frame, 6, 16);
  const badgeY  = up(frame, 6, 20, 22);
  const titleOp = fadeIn(frame, 22, 20);
  const titleY  = up(frame, 22, 25, 40);
  const subOp   = fadeIn(frame, 42, 20);
  const subY    = up(frame, 42, 25, 35);

  // Line draw
  const lineW = ramp(frame, 58, 35, 0, 100, E.out);
  const lineOp = fadeIn(frame, 56, 14);

  // Pulse ring
  const ringS = ramp(frame, 0, 130, 0.4, 2.0);
  const ringOp = interpolate(frame, [0, 30, 110, 130], [0, 0.35, 0.35, 0], {
    extrapolateLeft:"clamp", extrapolateRight:"clamp",
  });

  const glowWord = interpolate(Math.sin((frame / 30) * Math.PI * 1.5), [-1,1], [0.5, 1.0]);

  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 150px", opacity: cfOp }}>
      {/* Ring */}
      <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", border:`1px solid ${C.gold}`, transform:`scale(${ringS})`, opacity:ringOp }} />

      {/* Badge */}
      <div style={{ opacity:badgeOp, transform:`translateY(${badgeY}px)`, marginBottom:32, display:"flex", alignItems:"center", gap:10, padding:"9px 24px", borderRadius:99, background:"rgba(212,175,55,0.08)", border:`1px solid rgba(212,175,55,0.32)` }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:C.gold, boxShadow:`0 0 10px ${C.gold}` }} />
        <span style={{ fontSize:13, fontWeight:600, color:C.gold, letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif" }}>
          Agente de IA · Reativação de Ex-Alunos
        </span>
      </div>

      {/* Mini label */}
      <div style={{ opacity:titleOp, transform:`translateY(${titleY}px)`, marginBottom:14, fontSize:15, color:C.muted, letterSpacing:"0.25em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif", fontWeight:600 }}>
        Mini estudo de caso
      </div>

      {/* Main headline */}
      <div style={{ textAlign:"center" }}>
        <div style={{ opacity:titleOp, transform:`translateY(${titleY}px)`, fontSize:66, fontWeight:800, color:C.white, lineHeight:1.1, letterSpacing:"-2px", fontFamily:"system-ui,sans-serif" }}>
          Como a IA pode{" "}
          <span style={{ background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", filter:`drop-shadow(0 0 ${18*glowWord}px rgba(212,175,55,0.55))` }}>
            reativar ex-alunos
          </span>
        </div>
        <div style={{ opacity:subOp, transform:`translateY(${subY}px)`, fontSize:66, fontWeight:800, color:C.muted, lineHeight:1.1, letterSpacing:"-2px", fontFamily:"system-ui,sans-serif" }}>
          e gerar nova receita
        </div>
      </div>

      {/* Gold rule */}
      <div style={{ opacity:lineOp, marginTop:44, position:"relative", width:500, height:2 }}>
        <div style={{ position:"absolute", left:0, top:0, height:2, width:`${lineW}%`, background:`linear-gradient(90deg,${C.gold},${C.goldLight},transparent)`, borderRadius:99 }} />
      </div>
    </div>
  );
};

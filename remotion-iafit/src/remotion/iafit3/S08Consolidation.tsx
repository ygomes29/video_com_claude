import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C } from "./colors";
import { fadeIn, up, sc } from "./utils";
import { Glass, Logo } from "./Glass";
import { useCrossFade } from "./transitions";

const SCENE_DUR = 232;

const METRICS = [
  { v:"105", label:"ex-alunos mapeados", sub:"base identificada" },
  { v:"18%", label:"taxa de reativação", sub:"ex-alunos retornam" },
  { v:"R$ 56.964", label:"receita gerada", sub:"faturamento novo" },
];

export const S08Consolidation: React.FC = () => {
  const frame = useCurrentFrame();
  const cfOp  = useCrossFade(frame, SCENE_DUR, 20, 18);

  const titleOp = fadeIn(frame, 6, 18);
  const titleY  = up(frame, 6, 22, 28);
  const logoOp  = fadeIn(frame, 100, 22);

  // Connecting lines from logo to cards
  const lineP = interpolate(frame, [108, 145], [0, 1], { extrapolateLeft:"clamp", extrapolateRight:"clamp" });

  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 110px", opacity:cfOp }}>
      <div style={{ opacity:titleOp, transform:`translateY(${titleY}px)`, textAlign:"center", marginBottom:52 }}>
        <div style={{ fontSize:13, color:C.gold, fontWeight:600, letterSpacing:"0.3em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif", marginBottom:14 }}>Resultado do Estudo de Caso</div>
        <div style={{ fontSize:50, fontWeight:800, color:C.white, letterSpacing:"-1.5px", fontFamily:"system-ui,sans-serif" }}>Três números que contam tudo</div>
      </div>

      {/* Cards */}
      <div style={{ display:"flex", gap:24, width:"100%", maxWidth:1400, marginBottom:48 }}>
        {METRICS.map((m, i) => {
          const delay = 28 + i * 22;
          const op  = fadeIn(frame, delay, 20);
          const y   = up(frame, delay, 24, 40);
          const css = sc(frame, delay, 22, 0.85);
          const glow = interpolate(Math.sin((frame / 30) * Math.PI + i), [-1,1], [18, 36]);
          const pulse = interpolate(Math.sin((frame / 30) * Math.PI * 1.5 + i), [-1,1], [0.98, 1.02]);

          return (
            <div key={i} style={{ flex:1, opacity:op, transform:`translateY(${y}px) scale(${css * (i===1?pulse:1)})` }}>
              <Glass glow={i===1} shimmer shimmerOffset={delay+20} style={{ padding:"40px 36px", textAlign:"center" }}>
                {/* Glow dot */}
                <div style={{ position:"absolute", top:18, right:18, width:8, height:8, borderRadius:"50%", background:C.gold, boxShadow:`0 0 ${glow}px ${C.gold}` }} />

                <div style={{
                  fontSize: i === 2 ? 46 : 76,
                  fontWeight:900, lineHeight:1, letterSpacing:"-0.04em",
                  background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  fontFamily:"system-ui,sans-serif", marginBottom:12,
                  filter:`drop-shadow(0 0 ${i===1?glow*0.3:0}px rgba(212,175,55,0.5))`,
                }}>{m.v}</div>

                <div style={{ fontSize:18, fontWeight:600, color:C.white, fontFamily:"system-ui,sans-serif", marginBottom:4 }}>{m.label}</div>
                <div style={{ fontSize:13, color:C.muted, fontFamily:"system-ui,sans-serif" }}>{m.sub}</div>
              </Glass>
            </div>
          );
        })}
      </div>

      {/* Logo centre + connection lines */}
      <div style={{ position:"relative", opacity:logoOp }}>
        {/* Connection lines to cards — drawn as absolute SVG overlay */}
        <svg style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", overflow:"visible", pointerEvents:"none" }} width={800} height={2}>
          <line x1={-400 * lineP} y1={0} x2={0} y2={0} stroke={C.gold} strokeWidth={1} opacity={0.4} strokeDasharray="6 3"/>
          <line x1={0} y1={0} x2={400 * lineP} y2={0} stroke={C.gold} strokeWidth={1} opacity={0.4} strokeDasharray="6 3"/>
        </svg>
        <Logo scale={0.85} enterFrame={100} />
      </div>
    </div>
  );
};

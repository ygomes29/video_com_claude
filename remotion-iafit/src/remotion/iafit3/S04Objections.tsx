import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "./colors";
import { fadeIn, up, sc } from "./utils";
import { Glass } from "./Glass";
import { useCrossFade } from "./transitions";

const SCENE_DUR = 242;

const PAIRS = [
  { icon:"⏰", obj:"Estou sem tempo", res:"Podemos facilitar seu retorno com um horário mais tranquilo." },
  { icon:"😔", obj:"Parei por falta de rotina", res:"Temos uma condição especial para quem quer recomeçar." },
  { icon:"💭", obj:"Agora não consigo voltar", res:"Posso te mostrar a melhor forma de recomeçar com calma." },
];

export const S04Objections: React.FC = () => {
  const frame = useCurrentFrame();
  const cfOp  = useCrossFade(frame, SCENE_DUR, 20, 18);

  const titleOp = fadeIn(frame, 6, 18);
  const titleY  = up(frame, 6, 22, 30);

  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 90px", opacity:cfOp }}>
      <div style={{ opacity:titleOp, transform:`translateY(${titleY}px)`, textAlign:"center", marginBottom:52 }}>
        <div style={{ fontSize:13, color:C.gold, fontWeight:600, letterSpacing:"0.3em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif", marginBottom:12 }}>Entendimento da Objeção</div>
        <div style={{ fontSize:50, fontWeight:800, color:C.white, letterSpacing:"-1.5px", fontFamily:"system-ui,sans-serif" }}>
          O agente responde e aquece o interesse
        </div>
      </div>

      <div style={{ display:"flex", gap:22, width:"100%", maxWidth:1440 }}>
        {PAIRS.map((p, i) => {
          const delay = 30 + i * 24;
          const op  = fadeIn(frame, delay, 20);
          const y   = up(frame, delay, 24, 40);
          const s   = sc(frame, delay, 22, 0.85);
          const resOp = fadeIn(frame, delay + 34, 18);
          const resY  = up(frame, delay + 34, 20, 20);

          return (
            <div key={i} style={{ flex:1, opacity:op, transform:`translateY(${y}px) scale(${s})` }}>
              <Glass shimmer shimmerOffset={delay+22} style={{ padding:"36px 32px" }}>
                <div style={{ fontSize:34, marginBottom:14, fontFamily:"system-ui,sans-serif" }}>{p.icon}</div>

                {/* Objection bubble */}
                <div style={{ padding:"13px 18px", borderRadius:12, background:"rgba(255,90,90,0.08)", border:"1px solid rgba(255,90,90,0.28)", marginBottom:24 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:C.white, fontFamily:"system-ui,sans-serif" }}>"{p.obj}"</div>
                </div>

                {/* Arrow */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18, opacity:resOp }}>
                  <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.borderGold},transparent)` }} />
                  <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                    <path d="M2 8h12M10 4l4 4-4 4" stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize:10, color:C.gold, letterSpacing:"0.12em", fontFamily:"system-ui,sans-serif" }}>IAFIT</span>
                </div>

                {/* Response bubble */}
                <div style={{ opacity:resOp, transform:`translateY(${resY}px)`, padding:"13px 18px", borderRadius:12, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.28)" }}>
                  <div style={{ fontSize:15, color:C.white, lineHeight:1.55, fontFamily:"system-ui,sans-serif" }}>"{p.res}"</div>
                </div>

                {/* Badge */}
                <div style={{ marginTop:18, display:"flex", alignItems:"center", gap:6, opacity:resOp }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:C.gold }} />
                  <span style={{ fontSize:11, color:C.gold, fontFamily:"system-ui,sans-serif" }}>Personalizado pela IA</span>
                </div>
              </Glass>
            </div>
          );
        })}
      </div>
    </div>
  );
};

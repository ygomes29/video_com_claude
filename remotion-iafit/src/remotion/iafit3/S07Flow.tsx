import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "./colors";
import { fadeIn, up, sc, ramp } from "./utils";
import { Glass } from "./Glass";
import { useCrossFade } from "./transitions";

const SCENE_DUR = 262;

const STEPS = [
  {
    n:"1", title:"Identifica", sub:"A IA mapeia a base inativa e inicia conversas automaticamente no WhatsApp",
    icon:<svg width={32} height={32} viewBox="0 0 32 32" fill="none"><circle cx={16} cy={16} r={10} stroke="#D4AF37" strokeWidth={2}/><circle cx={16} cy={16} r={4} fill="#D4AF37"/><path d="M16 2V6M16 26V30M2 16H6M26 16H30" stroke="#D4AF37" strokeWidth={1.8} strokeLinecap="round"/></svg>,
  },
  {
    n:"2", title:"Conversa", sub:"O agente responde objeções, apresenta condição de retorno e aquece o interesse",
    icon:<svg width={32} height={32} viewBox="0 0 32 32" fill="none"><path d="M16 3C8.82 3 3 8.37 3 15c0 2.14.6 4.15 1.64 5.88L3 29l8.38-1.56A13.2 13.2 0 0016 28c7.18 0 13-5.37 13-12S23.18 3 16 3z" stroke="#D4AF37" strokeWidth={2}/><path d="M11 13h10M11 17h6" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round"/></svg>,
  },
  {
    n:"3", title:"Reativa", sub:"Parte dos contatos volta a treinar e gera nova receita para a academia",
    icon:<svg width={32} height={32} viewBox="0 0 32 32" fill="none"><path d="M6 24L12 16L18 20L26 8" stroke="#D4AF37" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/><path d="M20 8H26V14" stroke="#D4AF37" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/><circle cx={6} cy={24} r={2} fill="#D4AF37"/></svg>,
  },
];

export const S07Flow: React.FC = () => {
  const frame = useCurrentFrame();
  const cfOp  = useCrossFade(frame, SCENE_DUR, 20, 18);

  const titleOp = fadeIn(frame, 6, 18);
  const titleY  = up(frame, 6, 22, 30);

  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 90px", opacity:cfOp }}>
      <div style={{ opacity:titleOp, transform:`translateY(${titleY}px)`, textAlign:"center", marginBottom:56 }}>
        <div style={{ fontSize:13, color:C.gold, fontWeight:600, letterSpacing:"0.3em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif", marginBottom:14 }}>Como Funciona</div>
        <div style={{ fontSize:52, fontWeight:800, color:C.white, letterSpacing:"-1.5px", fontFamily:"system-ui,sans-serif" }}>
          Identificação → Conversa → Reativação
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"stretch", width:"100%", maxWidth:1400 }}>
        {STEPS.map((s, i) => {
          const delay = 30 + i * 28;
          const op  = fadeIn(frame, delay, 20);
          const y   = up(frame, delay, 24, 40);
          const css = sc(frame, delay, 22, 0.85);

          const arrowProgress = i < 2 ? ramp(frame, delay + 24, 30, 0, 1) : 0;
          const arrowOp = i < 2 ? fadeIn(frame, delay + 22, 16) : 0;

          return (
            <React.Fragment key={i}>
              <div style={{ flex:1, opacity:op, transform:`translateY(${y}px) scale(${css})` }}>
                <Glass shimmer shimmerOffset={delay+20} style={{ padding:"40px 34px", height:"100%" }}>
                  {/* Step number */}
                  <div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:22, boxShadow:`0 0 18px rgba(212,175,55,0.4)` }}>
                    <span style={{ fontSize:18, fontWeight:900, color:C.bg, fontFamily:"system-ui,sans-serif" }}>{s.n}</span>
                  </div>
                  <div style={{ marginBottom:16 }}>{s.icon}</div>
                  <div style={{ fontSize:24, fontWeight:700, color:C.white, fontFamily:"system-ui,sans-serif", marginBottom:12, letterSpacing:"-0.3px" }}>{s.title}</div>
                  <div style={{ fontSize:15, color:C.muted, lineHeight:1.6, fontFamily:"system-ui,sans-serif" }}>{s.sub}</div>

                  {i === 2 && (
                    <div style={{ marginTop:24, padding:"10px 16px", borderRadius:10, background:"rgba(212,175,55,0.08)", border:`1px solid rgba(212,175,55,0.28)`, opacity:fadeIn(frame, delay+30, 18) }}>
                      <div style={{ fontSize:14, fontWeight:600, color:C.gold, fontFamily:"system-ui,sans-serif" }}>✓ Receita gerada</div>
                    </div>
                  )}
                </Glass>
              </div>

              {i < 2 && (
                <div style={{ width:52, display:"flex", alignItems:"center", justifyContent:"center", opacity:arrowOp, flexShrink:0 }}>
                  <svg width={52} height={24} viewBox="0 0 52 24" fill="none">
                    <line x1={0} y1={12} x2={`${arrowProgress * 38}`} y2={12} stroke={C.gold} strokeWidth={1.5} strokeDasharray="5 3"/>
                    {arrowProgress > 0.85 && (
                      <path d="M38 6L48 12L38 18" stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={(arrowProgress-0.85)/0.15}/>
                    )}
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ opacity:fadeIn(frame, 120, 18), marginTop:44, display:"inline-flex", alignItems:"center", gap:12, padding:"12px 32px", borderRadius:99, background:"rgba(212,175,55,0.07)", border:`1px solid ${C.borderGold}` }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:C.gold, boxShadow:`0 0 12px ${C.gold}` }} />
        <span style={{ fontSize:16, color:C.white, fontWeight:600, fontFamily:"system-ui,sans-serif" }}>100% automatizado · Zero esforço manual</span>
      </div>
    </div>
  );
};

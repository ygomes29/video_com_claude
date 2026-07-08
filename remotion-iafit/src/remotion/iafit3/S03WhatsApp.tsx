import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C } from "./colors";
import { fadeIn, up, sc, ramp } from "./utils";
import { Glass } from "./Glass";
import { useCrossFade } from "./transitions";

const SCENE_DUR = 202;
const MSG = "Oi, tudo bem? Vi que você treinou com a gente e queria entender se faz sentido você voltar. Posso te apresentar uma condição especial? 🎯";
const MSG2 = "Oi! É que fui sumindo mesmo... O que seria essa condição?";

export const S03WhatsApp: React.FC = () => {
  const frame = useCurrentFrame();
  const cfOp  = useCrossFade(frame, SCENE_DUR, 20, 18);

  const labelOp  = fadeIn(frame, 6, 16);
  const panelOp  = fadeIn(frame, 16, 22);
  const panelSc  = sc(frame, 16, 26, 0.88);

  const msgChars = Math.floor(ramp(frame, 28, 80, 0, MSG.length));
  const msgOp    = fadeIn(frame, 26, 14);

  const typingOp = interpolate(frame, [108,118,128,138],[0,1,1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const reply2Op = fadeIn(frame, 140, 16);
  const reply2Y  = up(frame, 140, 18, 20);

  const badgeOp  = fadeIn(frame, 155, 18);

  const agentGlow = interpolate(Math.sin((frame / 30) * Math.PI * 2), [-1,1], [18,36]);

  return (
    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 90px", gap:52, opacity:cfOp }}>
      {/* Left — Agent avatar */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:18, width:220 }}>
        <div style={{ opacity:labelOp, textAlign:"center" }}>
          <div style={{ fontSize:13, color:C.gold, fontWeight:600, letterSpacing:"0.3em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif", marginBottom:24 }}>
            A IA em Ação
          </div>
          <div style={{ width:90, height:90, borderRadius:"50%", margin:"0 auto", background:`linear-gradient(135deg,${C.gold},${C.goldLight})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 0 ${agentGlow}px rgba(212,175,55,0.55)` }}>
            <svg width={40} height={40} viewBox="0 0 44 44" fill="none">
              <circle cx={22} cy={16} r={8} stroke="#050505" strokeWidth={2.5}/>
              <path d="M8 38c0-7.7 6.3-14 14-14s14 6.3 14 14" stroke="#050505" strokeWidth={2.5} strokeLinecap="round"/>
              <circle cx={22} cy={16} r={3} fill="#050505"/>
            </svg>
          </div>
          <div style={{ fontSize:15, color:C.white, fontWeight:700, marginTop:10, fontFamily:"system-ui,sans-serif" }}>Agente IAFIT</div>
          <div style={{ fontSize:12, color:C.gold, marginTop:3, fontFamily:"system-ui,sans-serif" }}>● Automático · 24h</div>
        </div>

        {/* connection line */}
        <svg width={180} height={4} style={{ opacity:fadeIn(frame,22,18) }}>
          <line x1={0} y1={2} x2={`${ramp(frame,24,40,0,100)}%`} y2={2} stroke={C.gold} strokeWidth={1.5} strokeDasharray="5 3"/>
        </svg>
      </div>

      {/* Centre — WhatsApp panel */}
      <div style={{ opacity:panelOp, transform:`scale(${panelSc})`, flex:1, maxWidth:580 }}>
        <Glass shimmer shimmerOffset={28} style={{ overflow:"hidden" }}>
          {/* Header */}
          <div style={{ padding:"18px 24px", borderBottom:`1px solid ${C.borderGold}`, display:"flex", alignItems:"center", gap:14, background:"rgba(212,175,55,0.04)" }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(212,175,55,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.12-1.34A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" stroke={C.gold} strokeWidth={1.8}/>
                <path d="M9 10h.01M12 10h.01M15 10h.01" stroke={C.gold} strokeWidth={2} strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.white, fontFamily:"system-ui,sans-serif" }}>WhatsApp</div>
              <div style={{ fontSize:12, color:C.gold, fontFamily:"system-ui,sans-serif" }}>● Online agora</div>
            </div>
            <div style={{ marginLeft:"auto", fontSize:11, color:C.muted, fontFamily:"system-ui,sans-serif", background:"rgba(212,175,55,0.1)", padding:"4px 10px", borderRadius:99, border:`1px solid rgba(212,175,55,0.25)` }}>
              Contato automático
            </div>
          </div>

          {/* Messages */}
          <div style={{ padding:"22px 22px 20px", minHeight:240, display:"flex", flexDirection:"column", gap:14 }}>
            {/* AI msg */}
            <div style={{ opacity:msgOp, alignSelf:"flex-start", maxWidth:"90%" }}>
              <div style={{ background:"rgba(212,175,55,0.08)", border:`1px solid rgba(212,175,55,0.22)`, borderRadius:"4px 18px 18px 18px", padding:"12px 16px" }}>
                <div style={{ fontSize:10, color:C.gold, marginBottom:4, letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif" }}>Agente IAFIT</div>
                <div style={{ fontSize:15, color:C.white, lineHeight:1.55, fontFamily:"system-ui,sans-serif" }}>
                  {MSG.slice(0, msgChars)}{msgChars < MSG.length && <span style={{ opacity:0.4 }}>|</span>}
                </div>
              </div>
            </div>

            {/* typing */}
            <div style={{ opacity:typingOp, alignSelf:"flex-end" }}>
              <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"18px 4px 18px 18px", padding:"12px 20px", display:"flex", gap:5, alignItems:"center" }}>
                {[0,0.25,0.5].map((d,i) => (
                  <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:C.muted, opacity:interpolate(Math.sin((frame/30)*Math.PI*3+d*Math.PI),[-1,1],[0.15,1]) }} />
                ))}
              </div>
            </div>

            {/* reply */}
            <div style={{ opacity:reply2Op, transform:`translateY(${reply2Y}px)`, alignSelf:"flex-end", maxWidth:"80%" }}>
              <div style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:"18px 4px 18px 18px", padding:"12px 16px" }}>
                <div style={{ fontSize:15, color:C.white, lineHeight:1.55, fontFamily:"system-ui,sans-serif" }}>{MSG2}</div>
              </div>
            </div>
          </div>
        </Glass>
      </div>

      {/* Right stat */}
      <div style={{ opacity:badgeOp, width:190, textAlign:"center" }}>
        <div style={{ padding:"18px 22px", borderRadius:18, background:"rgba(212,175,55,0.07)", border:`1px solid ${C.borderGold}` }}>
          <div style={{ fontSize:36, fontWeight:900, color:C.gold, fontFamily:"system-ui,sans-serif" }}>105</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:4, fontFamily:"system-ui,sans-serif" }}>contatos alcançados</div>
          <div style={{ fontSize:12, color:C.gold, marginTop:8, fontFamily:"system-ui,sans-serif" }}>✓ Automaticamente</div>
        </div>
      </div>
    </div>
  );
};

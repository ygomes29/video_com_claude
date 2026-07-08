import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C } from "./colors";
import { fadeIn, up, sc, ramp } from "./utils";
import { Logo } from "./Glass";
export const S10CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const cfOp = fadeIn(frame, 0, 20);

  const headlineOp = fadeIn(frame, 22, 20);
  const headlineY  = up(frame, 22, 24, 32);
  const subOp      = fadeIn(frame, 36, 18);
  const subY       = up(frame, 36, 22, 28);
  const pillsOp    = fadeIn(frame, 46, 18);
  const btnOp      = fadeIn(frame, 58, 20);
  const btnSc      = sc(frame, 58, 24, 0.84);
  const discOp     = fadeIn(frame, 78, 16);

  const btnGlow  = interpolate(Math.sin((frame / 30) * Math.PI * 2), [-1,1], [24, 52]);
  const btnPulse = interpolate(Math.sin((frame / 30) * Math.PI * 1.5), [-1,1], [0.98, 1.02]);

  const ringS  = ramp(frame, 58, 100, 0.6, 2.4);
  const ringOp = interpolate(frame, [58, 75, 130, 155], [0, 0.38, 0.38, 0], { extrapolateLeft:"clamp", extrapolateRight:"clamp" });

  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 140px", opacity:cfOp }}>
      {/* Logo — scales up from S09's small badge (shared element feel) */}
      <div style={{ marginBottom:28 }}>
        <Logo scale={1} enterFrame={0} />
      </div>

      <div style={{ opacity:headlineOp, transform:`translateY(${headlineY}px)`, textAlign:"center", marginBottom:10 }}>
        <div style={{ fontSize:52, fontWeight:800, color:C.white, letterSpacing:"-1.8px", lineHeight:1.1, fontFamily:"system-ui,sans-serif" }}>
          Inteligência artificial para reativar alunos<br/>e gerar receita.
        </div>
      </div>

      <div style={{ opacity:subOp, transform:`translateY(${subY}px)`, textAlign:"center", marginBottom:40 }}>
        <div style={{ fontSize:21, color:C.muted, fontFamily:"system-ui,sans-serif" }}>
          Automatize a reativação. Preserve a receita.
        </div>
      </div>

      {/* Pills */}
      <div style={{ opacity:pillsOp, display:"flex", gap:14, marginBottom:44, flexWrap:"wrap", justifyContent:"center" }}>
        {["Reativação automática","WhatsApp IA","105 ex-alunos → receita","Sem esforço manual"].map((t, i) => (
          <div key={i} style={{ padding:"10px 22px", borderRadius:99, background:i===0?`linear-gradient(135deg,${C.gold},${C.goldLight})`:"rgba(255,255,255,0.05)", border:i!==0?`1px solid ${C.borderGold}`:"none" }}>
            <span style={{ fontSize:14, fontWeight:600, color:i===0?C.bg:C.white, fontFamily:"system-ui,sans-serif" }}>{t}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", inset:0, borderRadius:99, border:`1px solid ${C.gold}`, transform:`scale(${ringS})`, opacity:ringOp }} />
        <div style={{ opacity:btnOp, transform:`scale(${btnSc * btnPulse})` }}>
          <div style={{ padding:"22px 80px", borderRadius:99, background:`linear-gradient(135deg,${C.gold} 0%,${C.goldLight} 60%,${C.gold} 100%)`, boxShadow:`0 0 ${btnGlow}px rgba(212,175,55,0.55),0 0 ${btnGlow*2}px rgba(212,175,55,0.15)`, position:"relative", overflow:"hidden", cursor:"pointer" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:"50%", background:"linear-gradient(180deg,rgba(255,255,255,0.28) 0%,transparent 100%)", borderRadius:"99px 99px 0 0" }} />
            <span style={{ fontSize:22, fontWeight:900, color:C.bg, letterSpacing:"0.04em", position:"relative", fontFamily:"system-ui,sans-serif" }}>
              CLIQUE EM SAIBA MAIS
            </span>
          </div>
        </div>
      </div>

      <div style={{ opacity:discOp, marginTop:38, textAlign:"center", maxWidth:680 }}>
        <div style={{ fontSize:11, color:"rgba(166,166,166,0.4)", lineHeight:1.6, fontFamily:"system-ui,sans-serif" }}>
          Exemplo ilustrativo de reativação com base em média histórica de operação.
          Os resultados podem variar conforme base, oferta, atendimento e operação da academia.
        </div>
      </div>
    </div>
  );
};

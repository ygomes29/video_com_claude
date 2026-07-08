import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C } from "./colors";
import { fadeIn, up, sc, ramp, E } from "./utils";
import { Glass } from "./Glass";
import { useCrossFade } from "./transitions";

const SCENE_DUR = 242;

function fmt(v: number) {
  return "R$ " + Math.round(v).toLocaleString("pt-BR");
}

export const S06Revenue: React.FC = () => {
  const frame = useCurrentFrame();
  const cfOp  = useCrossFade(frame, SCENE_DUR, 20, 18);

  const titleOp = fadeIn(frame, 6, 18);
  const titleY  = up(frame, 6, 22, 30);

  // 18% slides LEFT as revenue slides IN — motion continuity from S05
  const pctSlideX = ramp(frame, 0, 28, 0, -120, E.inOut); // enters from left already slid
  const pctOp     = ramp(frame, 0, 28, 0.7, 0, E.inOut);

  const revenue = interpolate(frame, [18, 90], [0, 56964], {
    extrapolateLeft:"clamp", extrapolateRight:"clamp",
    easing: (t) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t,
  });

  const bigCardOp  = fadeIn(frame, 15, 24);
  const bigCardSc  = sc(frame, 15, 28, 0.80);

  const calcOp   = fadeIn(frame, 100, 18);
  const calcY    = up(frame, 100, 20, 25);

  const glowN = interpolate(Math.sin((frame / 30) * Math.PI), [-1,1], [40,80]);
  const pulse = interpolate(Math.sin((frame / 30) * Math.PI * 1.5), [-1,1], [0.99, 1.01]);

  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 120px", opacity:cfOp }}>
      {/* Continuity: 18% ghost slides off to the left */}
      <div style={{
        position:"absolute", left:120, top:"50%",
        transform:`translate(${pctSlideX}px,-50%)`,
        opacity:pctOp,
        fontSize:90, fontWeight:900, color:C.gold, fontFamily:"system-ui,sans-serif",
        letterSpacing:"-0.05em", pointerEvents:"none",
      }}>
        18%
      </div>

      <div style={{ opacity:titleOp, transform:`translateY(${titleY}px)`, textAlign:"center", marginBottom:44 }}>
        <div style={{ fontSize:13, color:C.gold, fontWeight:600, letterSpacing:"0.3em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif", marginBottom:14 }}>Receita Gerada</div>
        <div style={{ fontSize:46, fontWeight:800, color:C.white, letterSpacing:"-1.5px", fontFamily:"system-ui,sans-serif" }}>O impacto financeiro direto</div>
      </div>

      <div style={{ display:"flex", gap:36, width:"100%", maxWidth:1380, alignItems:"flex-start" }}>
        {/* Big card */}
        <div style={{ opacity:bigCardOp, transform:`scale(${bigCardSc * pulse})`, flex:1.3 }}>
          <Glass glow shimmer shimmerOffset={18} style={{ padding:"54px 60px", textAlign:"center" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 30%,rgba(212,175,55,0.07) 0%,transparent 70%)", borderRadius:28, pointerEvents:"none" }} />
            <div style={{ fontSize:14, color:C.muted, letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif", marginBottom:18 }}>Receita estimada gerada</div>
            <div style={{
              fontSize:92, fontWeight:900, lineHeight:1, letterSpacing:"-0.04em",
              background:`linear-gradient(135deg,${C.gold} 0%,${C.goldLight} 60%,${C.gold} 100%)`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              fontFamily:"system-ui,sans-serif",
              filter:`drop-shadow(0 0 ${glowN*0.25}px rgba(212,175,55,0.5))`,
            }}>{fmt(revenue)}</div>
            <div style={{ width:80, height:2, margin:"22px auto", background:`linear-gradient(90deg,transparent,${C.gold},transparent)`, borderRadius:99 }} />
            <div style={{ fontSize:19, color:C.muted, fontFamily:"system-ui,sans-serif" }}>em faturamento novo para a academia</div>
          </Glass>
        </div>

        {/* Calc breakdown */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:16 }}>
          {[
            { l:"Ex-alunos mapeados", v:"105", d:calcOp, y:calcY },
            { l:"Taxa de reativação", v:"× 18%", d:fadeIn(frame,120,18), y:up(frame,120,20,25) },
            { l:"Reativados", v:"≈ 19", d:fadeIn(frame,140,18), y:up(frame,140,20,25) },
            { l:"Ticket médio × 6 meses", v:"× R$ 252", d:fadeIn(frame,160,18), y:up(frame,160,20,25) },
          ].map((item,i) => (
            <div key={i} style={{ opacity:item.d, transform:`translateY(${item.y}px)` }}>
              <Glass shimmer shimmerOffset={100+i*20} style={{ padding:"20px 26px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:15, color:C.muted, fontFamily:"system-ui,sans-serif" }}>{item.l}</span>
                  <span style={{ fontSize:22, fontWeight:800, color:C.gold, fontFamily:"system-ui,sans-serif" }}>{item.v}</span>
                </div>
              </Glass>
            </div>
          ))}

          <div style={{ opacity:fadeIn(frame,182,18), padding:"16px 26px", borderRadius:18, background:"rgba(212,175,55,0.07)", border:`1px solid ${C.borderGold}` }}>
            <div style={{ fontSize:14, color:C.muted, fontFamily:"system-ui,sans-serif", lineHeight:1.6 }}>
              19 × R$ 252 × 12 meses ≈<br/>
              <strong style={{ color:C.gold, fontSize:20 }}>R$ 56.964</strong>
            </div>
          </div>

          <div style={{ opacity:fadeIn(frame,200,18), fontSize:11, color:"rgba(166,166,166,0.45)", fontFamily:"system-ui,sans-serif", lineHeight:1.5 }}>
            * Exemplo ilustrativo. Resultados podem variar.
          </div>
        </div>
      </div>
    </div>
  );
};

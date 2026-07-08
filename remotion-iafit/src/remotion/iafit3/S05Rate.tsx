import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C } from "./colors";
import { fadeIn, up, sc, count, ramp } from "./utils";
import { Glass } from "./Glass";
import { useCrossFade } from "./transitions";

const SCENE_DUR = 232;
const RADIUS = 130;
const CIRC   = 2 * Math.PI * RADIUS;

export const S05Rate: React.FC = () => {
  const frame = useCurrentFrame();
  const cfOp  = useCrossFade(frame, SCENE_DUR, 20, 18);

  const titleOp = fadeIn(frame, 6, 18);
  const titleY  = up(frame, 6, 22, 30);
  const chartOp = fadeIn(frame, 18, 22);
  const chartSc = sc(frame, 18, 26, 0.8);

  // Progress circle 0→18%
  const progress = ramp(frame, 26, 75, 0, 0.18);
  const dashOff  = CIRC * (1 - progress);
  const pct      = count(frame, 26, 70, 18);
  const n19      = count(frame, 80, 40, 19); // 105*18% ≈ 19

  const statOp = fadeIn(frame, 85, 20);
  const statY  = up(frame, 85, 22, 30);
  const statSc = sc(frame, 85, 22, 0.85);

  const glowR = interpolate(Math.sin((frame / 30) * Math.PI), [-1,1], [18,40]);

  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 120px", opacity:cfOp }}>
      <div style={{ opacity:titleOp, transform:`translateY(${titleY}px)`, textAlign:"center", marginBottom:56 }}>
        <div style={{ fontSize:13, color:C.gold, fontWeight:600, letterSpacing:"0.3em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif", marginBottom:14 }}>Reativação</div>
        <div style={{ fontSize:52, fontWeight:800, color:C.white, letterSpacing:"-1.5px", fontFamily:"system-ui,sans-serif" }}>Base parada → Alunos de volta</div>
      </div>

      <div style={{ display:"flex", gap:52, alignItems:"center" }}>
        {/* Ring chart */}
        <div style={{ opacity:chartOp, transform:`scale(${chartSc})`, position:"relative", width:300, height:300 }}>
          <svg width={300} height={300} viewBox="0 0 300 300">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={C.gold}/>
                <stop offset="100%" stopColor={C.goldLight}/>
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx={150} cy={150} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={24}/>
            {/* Progress */}
            <circle cx={150} cy={150} r={RADIUS} fill="none"
              stroke="url(#ringGrad)" strokeWidth={24} strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={dashOff}
              transform="rotate(-90 150 150)"
              style={{ filter:`drop-shadow(0 0 ${glowR*0.35}px rgba(212,175,55,0.7))` }}
            />
          </svg>
          {/* Centre */}
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{
              fontSize:76, fontWeight:900, lineHeight:1, letterSpacing:"-0.05em",
              background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              fontFamily:"system-ui,sans-serif",
            }}>{pct}%</div>
            <div style={{ fontSize:16, color:C.muted, marginTop:4, fontFamily:"system-ui,sans-serif" }}>reativados</div>
          </div>
        </div>

        {/* Right stats */}
        <div style={{ display:"flex", flexDirection:"column", gap:20, flex:1 }}>
          <div style={{ opacity:statOp, transform:`translateY(${statY}px) scale(${statSc})` }}>
            <Glass glow shimmer shimmerOffset={88} style={{ padding:"36px 44px" }}>
              <div style={{
                fontSize:104, fontWeight:900, lineHeight:1, letterSpacing:"-0.05em",
                background:`linear-gradient(135deg,${C.gold},${C.goldLight})`,
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                fontFamily:"system-ui,sans-serif",
              }}>{n19}</div>
              <div style={{ fontSize:22, fontWeight:600, color:C.white, marginTop:8, fontFamily:"system-ui,sans-serif" }}>
                ex-alunos reativados
              </div>
              <div style={{ display:"flex", gap:10, marginTop:18, alignItems:"center" }}>
                {["Ex-alunos","→","Ativos","→","Receita"].map((t,i)=>(
                  <span key={i} style={{ fontSize:14, color:i%2===1?C.muted:C.gold, fontFamily:"system-ui,sans-serif", fontWeight:i%2===0?600:400 }}>{t}</span>
                ))}
              </div>
            </Glass>
          </div>

          {/* calc */}
          <div style={{ opacity:fadeIn(frame, 118, 18), padding:"16px 24px", borderRadius:16, background:"rgba(212,175,55,0.06)", border:`1px solid ${C.borderGold}` }}>
            <div style={{ fontSize:16, color:C.muted, fontFamily:"system-ui,sans-serif" }}>
              105 ex-alunos × 18% = <strong style={{ color:C.gold }}>~19 reativados</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { C } from "./colors";
import { fadeIn, up, ramp } from "./utils";
import { useCrossFade } from "./transitions";

const SCENE_DUR = 172;

// "Reativação inteligente transforma base parada em faturamento."
const LINE1 = ["Reativação", "inteligente"];
const LINE2 = ["transforma", "base", "parada"];
const LINE3 = ["em", "faturamento."];

const GOLD_WORDS = new Set(["Reativação", "inteligente", "faturamento."]);

export const S09Impact: React.FC = () => {
  const frame = useCurrentFrame();
  const cfOp  = useCrossFade(frame, SCENE_DUR, 20, 18);

  // Metrics from S08 converge — ghost echoes slide in and shrink
  const echo1Op = ramp(frame, 0, 20, 0.4, 0);
  const echo2Op = ramp(frame, 0, 20, 0.4, 0);
  const echo3Op = ramp(frame, 0, 20, 0.4, 0);

  let idx = 0;
  function wordProps(word: string) {
    const i = idx++;
    const start = 12 + i * 8;
    const isGold = GOLD_WORDS.has(word);
    const glow = isGold ? interpolate(Math.sin((frame / 30) * Math.PI * 1.5), [-1,1], [16, 30]) : 0;
    return {
      opacity: fadeIn(frame, start, 16),
      transform: `translateY(${up(frame, start, 20, 28)}px)`,
      display: "inline-block",
      fontSize: 76,
      fontWeight: 800,
      letterSpacing: "-2px",
      fontFamily: "system-ui,sans-serif",
      ...(isGold
        ? {
            background: `linear-gradient(135deg,${C.gold},${C.goldLight})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 ${glow}px rgba(212,175,55,0.55))`,
          }
        : { color: C.white }),
    } as React.CSSProperties;
  }

  // Light shimmer travelling across the text
  const shimX = ramp(frame, 60, 45, -200, 250);
  const shimOp = interpolate(frame, [60, 74, 98, 110], [0, 0.6, 0.6, 0], { extrapolateLeft:"clamp", extrapolateRight:"clamp" });

  idx = 0; // reset before JSX

  return (
    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 120px", opacity:cfOp }}>
      {/* Ghost echoes from consolidation scene */}
      <div style={{ position:"absolute", top:"20%", left:"8%", fontSize:36, fontWeight:900, color:C.gold, opacity:echo1Op, fontFamily:"system-ui,sans-serif", letterSpacing:"-0.04em", pointerEvents:"none" }}>105</div>
      <div style={{ position:"absolute", top:"20%", right:"8%", fontSize:36, fontWeight:900, color:C.gold, opacity:echo2Op, fontFamily:"system-ui,sans-serif", letterSpacing:"-0.04em", pointerEvents:"none" }}>18%</div>
      <div style={{ position:"absolute", bottom:"22%", left:"50%", transform:"translateX(-50%)", fontSize:28, fontWeight:900, color:C.gold, opacity:echo3Op, fontFamily:"system-ui,sans-serif", letterSpacing:"-0.04em", pointerEvents:"none", whiteSpace:"nowrap" }}>R$ 56.964</div>

      {/* Shimmer sweep */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:`linear-gradient(108deg,transparent 30%,rgba(212,175,55,0.10) 50%,transparent 70%)`, transform:`translateX(${shimX}px)`, opacity:shimOp }} />

      {/* Main text */}
      <div style={{ textAlign:"center", lineHeight:1.1, display:"flex", flexDirection:"column", gap:2 }}>
        <div style={{ display:"flex", gap:20, justifyContent:"center" }}>
          {LINE1.map(w => <span key={w} style={wordProps(w)}>{w}</span>)}
        </div>
        <div style={{ display:"flex", gap:20, justifyContent:"center" }}>
          {LINE2.map(w => <span key={w} style={wordProps(w)}>{w}</span>)}
        </div>
        <div style={{ display:"flex", gap:20, justifyContent:"center" }}>
          {LINE3.map(w => <span key={w} style={wordProps(w)}>{w}</span>)}
        </div>
      </div>

      {/* IAFIT badge */}
      <div style={{ opacity:fadeIn(frame, 112, 18), marginTop:56, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ width:60, height:1, background:`linear-gradient(90deg,transparent,${C.gold})` }} />
        <div style={{ padding:"8px 22px", borderRadius:99, background:"rgba(212,175,55,0.07)", border:`1px solid rgba(212,175,55,0.3)` }}>
          <span style={{ fontSize:14, fontWeight:700, color:C.gold, fontFamily:"system-ui,sans-serif", letterSpacing:"0.15em" }}>IAFIT</span>
        </div>
        <div style={{ width:60, height:1, background:`linear-gradient(90deg,${C.gold},transparent)` }} />
      </div>
    </div>
  );
};

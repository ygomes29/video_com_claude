import React from "react";
import { useCurrentFrame } from "remotion";
import { colors } from "./colors";
import { fadeIn, slideUp, scaleIn } from "./utils";
import { GlassCard } from "./GlassCard";

const PILLARS = [
  {
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <circle cx={16} cy={16} r={6} stroke="#D4AF37" strokeWidth={2} />
        <path d="M16 4V8M16 24V28M4 16H8M24 16H28" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" />
        <path d="M7.5 7.5L10.5 10.5M21.5 21.5L24.5 24.5M7.5 24.5L10.5 21.5M21.5 10.5L24.5 7.5" stroke="#D4AF37" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    ),
    label: "Agentes de IA",
    desc: "Atendimento e vendas 24/7",
  },
  {
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <rect x={4} y={8} width={24} height={18} rx={3} stroke="#D4AF37" strokeWidth={2} />
        <path d="M10 8V6M16 8V6M22 8V6" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" />
        <path d="M9 16H15M9 20H23M17 16H23" stroke="#D4AF37" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    ),
    label: "Gestão de Eventos",
    desc: "Engajamento e comunidade",
  },
  {
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <path d="M6 24L12 16L18 20L26 10" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 10H26V16" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={6} cy={24} r={2} fill="#D4AF37" />
      </svg>
    ),
    label: "Estratégias de Marketing",
    desc: "Crescimento acelerado",
  },
  {
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <path d="M8 20C8 20 10 14 16 14C22 14 24 20 24 20" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" />
        <circle cx={8} cy={22} r={4} stroke="#D4AF37" strokeWidth={2} />
        <circle cx={24} cy={22} r={4} stroke="#D4AF37" strokeWidth={2} />
        <path d="M12 22H20" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" />
      </svg>
    ),
    label: "Parcerias Estratégicas",
    desc: "Rede de crescimento",
  },
  {
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <path d="M4 28L16 4L28 28" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 22H24" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" />
        <circle cx={16} cy={4} r={2.5} fill="#D4AF37" />
      </svg>
    ),
    label: "Gestão de Tráfego",
    desc: "Leads qualificados",
  },
  {
    icon: (
      <svg width={32} height={32} viewBox="0 0 32 32" fill="none">
        <rect x={4} y={6} width={18} height={14} rx={2} stroke="#D4AF37" strokeWidth={2} />
        <path d="M22 12L28 8V22L22 18" stroke="#D4AF37" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 22V26M14 22V26M20 22V26" stroke="#D4AF37" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    ),
    label: "Criativos que Convertem",
    desc: "Design de alta performance",
  },
];

export const ScenePillars: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOp = fadeIn(frame, 0, 18);
  const titleY = slideUp(frame, 0, 20, 30);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 80px 60px",
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: colors.gold,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontFamily: "system-ui, -apple-system, sans-serif",
            marginBottom: 12,
          }}
        >
          Os 6 Pilares
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 50,
            fontWeight: 800,
            color: colors.white,
            letterSpacing: "-1.5px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Tudo que sua academia precisa
        </h2>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          width: "100%",
          maxWidth: 1500,
        }}
      >
        {PILLARS.map((pillar, i) => {
          const delay = 25 + i * 18;
          const cardOp = fadeIn(frame, delay, 18);
          const cardY = slideUp(frame, delay, 22, 35);
          const cardScale = scaleIn(frame, delay, 20, 0.88);

          return (
            <div
              key={i}
              style={{
                opacity: cardOp,
                transform: `translateY(${cardY}px) scale(${cardScale})`,
              }}
            >
              <GlassCard
                shimmer
                shimmerDelay={delay + 20}
                style={{ padding: "28px 28px" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: "rgba(212,175,55,0.1)",
                      border: `1px solid rgba(212,175,55,0.25)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {pillar.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: colors.white,
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        marginBottom: 4,
                        letterSpacing: "-0.3px",
                      }}
                    >
                      {pillar.label}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: colors.muted,
                        fontFamily: "system-ui, -apple-system, sans-serif",
                      }}
                    >
                      {pillar.desc}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};

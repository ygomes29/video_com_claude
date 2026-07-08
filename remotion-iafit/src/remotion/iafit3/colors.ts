export const C = {
  bg: "#050505",
  bgSoft: "#0B0B0B",
  gold: "#D4AF37",
  goldLight: "#F6D76B",
  white: "#FFFFFF",
  muted: "#A6A6A6",
  glass: "rgba(255,255,255,0.07)",
  glassStrong: "rgba(255,255,255,0.12)",
  borderGold: "rgba(212,175,55,0.38)",
  shadowGold: "rgba(212,175,55,0.22)",
  danger: "#FF5A5A",
};

export const glassStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))",
  backdropFilter: "blur(28px)",
  border: `1px solid ${C.borderGold}`,
  borderRadius: 28,
  boxShadow: "0 0 45px rgba(212,175,55,0.12),inset 0 1px 1px rgba(255,255,255,0.18)",
  position: "relative",
  overflow: "hidden",
  ...extra,
});

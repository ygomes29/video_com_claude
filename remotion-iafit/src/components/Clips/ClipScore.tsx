"use client";

interface ClipScoreProps {
  score: number;
  label?: string;
}

/** Color band by viral score (0–100). */
function band(score: number): { className: string; text: string } {
  if (score >= 80)
    return { className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", text: "Alto" };
  if (score >= 60)
    return { className: "bg-amber-500/15 text-amber-400 border-amber-500/30", text: "Médio" };
  if (score >= 40)
    return { className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30", text: "Baixo" };
  return { className: "bg-red-500/15 text-red-400 border-red-500/30", text: "Baixo" };
}

/** Viral score badge. */
export function ClipScore({ score, label = "Viral" }: ClipScoreProps) {
  const b = band(score);
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border px-3 py-1.5 ${b.className}`}
      title={`${label} score: ${score}/100`}
    >
      <span className="text-lg font-bold leading-none">{score}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-80 mt-0.5">
        {label}
      </span>
    </div>
  );
}
"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { PROCESSING_SUBSTAGES } from "@/lib/clipping/polling";
import type { ClipStatus } from "@/lib/clipping/types";

interface ClipJobStatusProps {
  status: ClipStatus;
  /** Index of the active sub-stage while `processing` (representational). */
  activeSubstage: number;
  error?: string;
}

/**
 * Processing UI for a clipping job.
 *
 * NOTE: MuAPI does not expose real per-stage progress in V1, so the
 * sub-stages below are a REPRESENTATIONAL, indeterminate sequence —
 * not a technically precise signal.
 */
export function ClipJobStatus({ status, activeSubstage, error }: ClipJobStatusProps) {
  if (status === "failed") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <XCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-foreground">Falha no processamento.</p>
        {error && <p className="text-xs text-muted-foreground max-w-md">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-10 w-full max-w-md">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Processando seu vídeo…</span>
      </div>

      {/* Indeterminate progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full w-1/3 rounded-full bg-primary animate-indeterminate" />
      </div>

      <ul className="flex flex-col gap-2 w-full">
        {PROCESSING_SUBSTAGES.map((label, i) => {
          const done = status === "completed";
          const active = !done && i === activeSubstage;
          const passed = !done && i < activeSubstage;
          return (
            <li
              key={label}
              className={`flex items-center gap-2 text-sm ${
                active
                  ? "text-foreground"
                  : passed
                    ? "text-muted-foreground"
                    : "text-muted-foreground-dim"
              }`}
            >
              {done || passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : active ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-border-dim" />
              )}
              {label}
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-muted-foreground-dim text-center">
        Etapas representativas — o processamento acontece na MuAPI.
      </p>
    </div>
  );
}
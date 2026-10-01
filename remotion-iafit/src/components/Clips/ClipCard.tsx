"use client";

import type { AspectRatio, Clip } from "@/lib/clipping/types";
import { ClipActions } from "./ClipActions";
import { ClipPreview } from "./ClipPreview";
import { ClipScore } from "./ClipScore";

interface ClipCardProps {
  clip: Clip;
  index: number;
  aspectRatio: AspectRatio;
  onEdit: (clip: Clip) => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

/** A single clip result card. */
export function ClipCard({ clip, index, aspectRatio, onEdit }: ClipCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background-elevated p-4">
      <div className="flex items-start gap-3">
        <ClipScore score={clip.viralScore} />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground-dim">
            #{String(index + 1).padStart(2, "0")}
          </div>
          <h3 className="text-sm font-semibold text-foreground line-clamp-2">
            {clip.title}
          </h3>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-28 shrink-0">
          <ClipPreview
            clipUrl={clip.clipUrl}
            aspectRatio={aspectRatio}
            thumbnailUrl={clip.thumbnailUrl}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
          {clip.hook && (
            <p className="text-foreground italic line-clamp-2">
              &ldquo;{clip.hook}&rdquo;
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {formatTime(clip.startTime)} → {formatTime(clip.endTime)}
            </span>
            <span className="text-muted-foreground-dim">·</span>
            <span>{formatDuration(clip.duration)}</span>
          </div>
          {clip.viralityReason && (
            <p className="text-xs text-muted-foreground-dim line-clamp-3">
              <span className="text-muted-foreground">Motivo: </span>
              {clip.viralityReason}
            </p>
          )}
        </div>
      </div>

      <ClipActions clip={clip} onEdit={onEdit} />
    </div>
  );
}
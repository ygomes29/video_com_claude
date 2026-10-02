"use client";

import type { AspectRatio, Clip } from "@/lib/clipping/types";
import { ClipCard } from "./ClipCard";

interface ClipGridProps {
  clips: Clip[];
  aspectRatio: AspectRatio;
  onEdit: (clip: Clip) => void;
}

/** Results grid with a count header. */
export function ClipGrid({ clips, aspectRatio, onEdit }: ClipGridProps) {
  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-sm text-foreground">Nenhum corte encontrado.</p>
        <p className="text-xs text-muted-foreground-dim">
          Tente outro vídeo ou aumente a quantidade de cortes.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-lg font-semibold text-foreground">
        {clips.length} {clips.length === 1 ? "corte encontrado" : "cortes encontrados"}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clips.map((clip, i) => (
          <ClipCard
            key={clip.id}
            clip={clip}
            index={i}
            aspectRatio={aspectRatio}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
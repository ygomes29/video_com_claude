"use client";

import { Button } from "@/components/ui/button";
import { Download, Pencil } from "lucide-react";
import type { Clip } from "@/lib/clipping/types";

interface ClipActionsProps {
  clip: Clip;
  onEdit: (clip: Clip) => void;
}

/** BAIXAR + EDITAR NO STUDIO actions for a clip card. */
export function ClipActions({ clip, onEdit }: ClipActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={clip.clipUrl} download target="_blank" rel="noreferrer">
          <Download className="w-4 h-4" />
          Baixar
        </a>
      </Button>
      <Button size="sm" onClick={() => onEdit(clip)} disabled={!clip.clipUrl}>
        <Pencil className="w-4 h-4" />
        Editar no Studio
      </Button>
    </div>
  );
}
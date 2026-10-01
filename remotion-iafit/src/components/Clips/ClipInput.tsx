"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AspectRatio } from "@/lib/clipping/types";
import { Upload } from "lucide-react";
import { useState } from "react";

export interface ClipInputValues {
  videoUrl: string;
  numHighlights: number;
  aspectRatio: AspectRatio;
}

interface ClipInputProps {
  onAnalyze: (values: ClipInputValues) => void;
  isLoading: boolean;
}

/** URL + quantity + format input form for the Cortes module. */
export function ClipInput({ onAnalyze, isLoading }: ClipInputProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [numHighlights, setNumHighlights] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [touched, setTouched] = useState(false);

  const urlValid = /^https?:\/\/.+\..+/i.test(videoUrl.trim());
  const showError = touched && videoUrl.length > 0 && !urlValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!urlValid || isLoading) return;
    onAnalyze({ videoUrl: videoUrl.trim(), numHighlights, aspectRatio });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 w-full max-w-xl rounded-xl border border-border bg-background-elevated p-6"
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          URL do vídeo
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="https://youtube.com/... ou URL direta do vídeo"
          disabled={isLoading}
          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground-dim focus:outline-none focus:border-primary"
        />
        {showError && (
          <span className="text-xs text-destructive">
            Informe uma URL válida (http/https).
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Quantidade de cortes
          </label>
          <input
            type="number"
            min={1}
            max={15}
            value={numHighlights}
            onChange={(e) =>
              setNumHighlights(
                Math.max(1, Math.min(15, Number(e.target.value) || 5)),
              )
            }
            disabled={isLoading}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Formato</label>
          <Select
            value={aspectRatio}
            onValueChange={(v) => setAspectRatio(v as AspectRatio)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background-elevated border-border">
              <SelectItem value="9:16">9:16 — Vertical</SelectItem>
              <SelectItem value="1:1">1:1 — Quadrado</SelectItem>
              <SelectItem value="4:5">4:5 — Retrato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground-dim">
          <Upload className="w-3.5 h-3.5" />
          Upload — em breve
        </span>
        <Button type="submit" loading={isLoading} disabled={isLoading}>
          Analisar Vídeo
        </Button>
      </div>
    </form>
  );
}
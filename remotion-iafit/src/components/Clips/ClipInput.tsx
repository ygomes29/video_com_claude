"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipsApiError,
  requestUploadUrl,
  uploadFileToS3,
} from "@/lib/clipping/api-client";
import type { AspectRatio } from "@/lib/clipping/types";
import { CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

export interface ClipInputValues {
  videoUrl: string;
  numHighlights: number;
  aspectRatio: AspectRatio;
}

interface ClipInputProps {
  onAnalyze: (values: ClipInputValues) => void;
  isLoading: boolean;
}

/** Client mirror of the server default (CLIPS_UPLOAD_MAX_BYTES, 1 GiB). */
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["video/mp4", "video/quicktime"]);

type UploadState = "idle" | "uploading" | "done" | "error";

/** URL + quantity + format input form for the Cortes module. */
export function ClipInput({ onAnalyze, isLoading }: ClipInputProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [numHighlights, setNumHighlights] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [touched, setTouched] = useState(false);

  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = uploadState === "uploading";
  const urlValid = /^https?:\/\/.+\..+/i.test(videoUrl.trim());
  const showError = touched && videoUrl.length > 0 && !urlValid;
  const canAnalyze = urlValid && !isLoading && !isUploading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canAnalyze) return;
    onAnalyze({ videoUrl: videoUrl.trim(), numHighlights, aspectRatio });
  };

  const resetUpload = () => {
    setUploadState("idle");
    setUploadProgress(0);
    setUploadName(null);
    setUploadError(null);
    setVideoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    const type = file.type.trim().toLowerCase();
    if (!ACCEPTED_TYPES.has(type)) {
      setUploadState("error");
      setUploadError("Tipo não suportado. Use MP4 ou MOV.");
      setUploadName(file.name);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadState("error");
      setUploadError("Arquivo muito grande (máximo 1 GB).");
      setUploadName(file.name);
      return;
    }
    setVideoUrl("");
    setUploadName(file.name);
    setUploadError(null);
    setUploadState("uploading");
    setUploadProgress(0);
    try {
      const grant = await requestUploadUrl({ contentType: type, size: file.size });
      await uploadFileToS3(file, grant.uploadUrl, (f) => setUploadProgress(f));
      setVideoUrl(grant.videoUrl);
      setUploadState("done");
    } catch (err) {
      setUploadState("error");
      setUploadError(
        err instanceof ClipsApiError ? err.message : "Falha no upload.",
      );
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
  };

  // Typing a URL abandons any in-progress/done upload.
  const onUrlChange = (v: string) => {
    if (uploadState !== "idle") resetUpload();
    setVideoUrl(v);
  };

  const pct = Math.round(uploadProgress * 100);

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
          onChange={(e) => onUrlChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="https://exemplo.com/video.mp4"
          disabled={isLoading || isUploading}
          className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground-dim focus:outline-none focus:border-primary disabled:opacity-60"
        />
        <span className="text-xs text-muted-foreground-dim">
          Cole a URL direta de um arquivo de vídeo (ex.: <code>.mp4</code>),
          ou envie um arquivo local abaixo. Links do YouTube/Vimeo não
          funcionam — a MuAPI precisa baixar o arquivo de vídeo direto.
        </span>
        {showError && (
          <span className="text-xs text-destructive">
            Informe uma URL válida (http/https).
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground-dim">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-2">
        {uploadState === "idle" && (
          <label className="flex items-center gap-1.5 text-sm text-foreground cursor-pointer hover:text-primary transition-colors w-fit">
            <Upload className="w-4 h-4" />
            Enviar um arquivo local (.mp4 / .mov)
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,.mp4,.mov"
              className="hidden"
              onChange={onInputChange}
              disabled={isLoading || isUploading}
            />
          </label>
        )}

        {uploadState === "uploading" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Enviando {uploadName}… {pct}%
            </div>
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary transition-[width] duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {uploadState === "done" && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs text-foreground truncate">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span className="truncate">{uploadName}</span> — pronto para
              analisar
            </span>
            <button
              type="button"
              onClick={resetUpload}
              className="flex items-center gap-1 text-xs text-muted-foreground-dim hover:text-foreground shrink-0"
            >
              <X className="w-3 h-3" /> Remover
            </button>
          </div>
        )}

        {uploadState === "error" && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-destructive truncate">
              {uploadError}
            </span>
            <button
              type="button"
              onClick={resetUpload}
              className="flex items-center gap-1 text-xs text-muted-foreground-dim hover:text-foreground shrink-0"
            >
              <X className="w-3 h-3" /> Limpar
            </button>
          </div>
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

      <div className="flex items-center justify-end gap-3 pt-1">
        <Button type="submit" loading={isLoading} disabled={!canAnalyze}>
          Analisar Vídeo
        </Button>
      </div>
    </form>
  );
}
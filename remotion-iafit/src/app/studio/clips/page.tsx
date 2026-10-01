"use client";

import { ClipInput, type ClipInputValues } from "@/components/Clips/ClipInput";
import { ClipGrid } from "@/components/Clips/ClipGrid";
import { ClipJobStatus } from "@/components/Clips/ClipJobStatus";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  createClipJob,
  getClipResults,
  getClipStatus,
} from "@/lib/clipping/api-client";
import { buildClipEditorSeed } from "@/remotion/clips/clipTemplate";
import { storeClipForEdit } from "@/lib/clipping/clip-transfer";
import {
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  isTerminalStatus,
} from "@/lib/clipping/polling";
import type { AspectRatio, Clip, ClipStatus } from "@/lib/clipping/types";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "creating" | "processing" | "done" | "error";

export default function ClipsPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<ClipStatus | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeSubstage, setActiveSubstage] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineRef = useRef<number>(0);

  /* ---- substage cycling (representational, indeterminate) ---- */
  useEffect(() => {
    if (phase !== "processing") return;
    const id = setInterval(() => {
      setActiveSubstage((i) => (i + 1) % 3);
    }, 2500);
    return () => clearInterval(id);
  }, [phase]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /* ---- polling loop ---- */
  const pollOnce = useCallback(
    async (id: string) => {
      if (Date.now() > deadlineRef.current) {
        stopPolling();
        setError("Tempo limite excedido ao processar o vídeo. Tente novamente.");
        setPhase("error");
        return;
      }
      try {
        const res = await getClipStatus(id);
        setStatus(res.status);
        if (res.status === "failed" || res.status === "cancelled") {
          stopPolling();
          setError(res.message ?? "O processamento falhou.");
          setPhase("error");
          return;
        }
        if (res.status === "completed") {
          stopPolling();
          try {
            const results = await getClipResults(id);
            setClips(results.clips);
          } catch (e) {
            setError((e as Error).message);
            setPhase("error");
            return;
          }
          setPhase("done");
          return;
        }
        // still processing — schedule next poll
        pollTimerRef.current = setTimeout(() => pollOnce(id), POLL_INTERVAL_MS);
      } catch (e) {
        stopPolling();
        setError((e as Error).message);
        setPhase("error");
      }
    },
    [stopPolling],
  );

  useEffect(() => {
    if (phase !== "processing" || !jobId) return;
    deadlineRef.current = Date.now() + POLL_TIMEOUT_MS;
    setActiveSubstage(0);
    void pollOnce(jobId);
    return stopPolling;
  }, [phase, jobId, pollOnce, stopPolling]);

  /* ---- actions ---- */
  const handleAnalyze = useCallback(async (values: ClipInputValues) => {
    setAspectRatio(values.aspectRatio);
    setPhase("creating");
    setError(null);
    setClips([]);
    setStatus(null);
    try {
      const res = await createClipJob({
        videoUrl: values.videoUrl,
        numHighlights: values.numHighlights,
        aspectRatio: values.aspectRatio,
      });
      setJobId(res.jobId);
      setStatus(res.status);
      setPhase("processing");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }, []);

  const handleEdit = useCallback(
    (clip: Clip) => {
      const seed = buildClipEditorSeed(clip);
      storeClipForEdit(clip, seed);
      router.push("/studio/motion");
    },
    [router],
  );

  const handleReset = useCallback(() => {
    stopPolling();
    setPhase("idle");
    setJobId(null);
    setStatus(null);
    setClips([]);
    setError(null);
    setActiveSubstage(0);
  }, [stopPolling]);

  const isBusy = phase === "creating" || phase === "processing";

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
      <header className="flex items-center gap-6 py-8 px-12 shrink-0">
        <Header asLink />
        <div className="h-10 w-px bg-border" />
        <div className="flex flex-col gap-1">
          <h1 className="text-sm font-medium text-foreground">Cortes</h1>
          <Link
            href="/studio"
            className="flex items-center gap-1.5 text-xs text-muted-foreground-dim hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar ao Content Studio
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-12 pb-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8">
          <div className="self-start">
            <h2 className="text-2xl font-bold text-white">
              Transforme uma call em conteúdos
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Envie a URL de uma call, treinamento ou reunião e a IA encontra os melhores momentos.
            </p>
          </div>

          {phase === "idle" && (
            <ClipInput onAnalyze={handleAnalyze} isLoading={false} />
          )}

          {(phase === "creating" || phase === "processing") && (
            <div className="w-full max-w-md">
              <ClipJobStatus
                status={status ?? "processing"}
                activeSubstage={activeSubstage}
              />
            </div>
          )}

          {phase === "done" && (
            <div className="w-full flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <ClipGrid
                  clips={clips}
                  aspectRatio={aspectRatio}
                  onEdit={handleEdit}
                />
              </div>
              <div className="self-start">
                <Button variant="outline" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4" />
                  Analisar outro vídeo
                </Button>
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-3 py-10 text-center w-full max-w-md">
              <p className="text-sm text-destructive">
                {error ?? "Não foi possível processar o vídeo."}
              </p>
              <Button variant="outline" onClick={handleReset}>
                Tentar novamente
              </Button>
            </div>
          )}

          {isBusy && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
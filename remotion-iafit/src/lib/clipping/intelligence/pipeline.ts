/**
 * IAFIT Intelligence pipeline orchestrator.
 *
 * Local Intelligence Runner — V1 dogfooding only. Do not deploy as a
 * production async worker. Runs as a fire-and-forget background promise
 * inside the `next dev` process; state is held in the in-memory `jobs.ts`
 * store. See the plan's "Limitations" section for the production migration.
 *
 * Stages: transcrevendo → identificando → gerando → concluido.
 * The LLM only picks segment IDs; this module derives startSec/endSec/
 * transcript deterministically from the Deepgram transcript, filters
 * overlapping highlights, then renders each clip.
 */

import "server-only";

import { randomUUID } from "node:crypto";
import type { AspectRatio, Clip } from "../types";
import {
  requireDeepgramKey,
  resolveSegmentRange,
  transcribeVideo,
  type ResolvedSegmentRange,
} from "./deepgram-client";
import { requireOpenRouterKey, selectHighlights, type RawHighlight } from "./llm-select";
import { renderHighlightToClip } from "./render";
import { updateJob } from "./jobs";

export interface PipelineInput {
  videoUrl: string;
  numHighlights: number;
  aspectRatio: AspectRatio;
}

/** Throw a config error (→ 503) if any Intelligence key is missing. */
export function assertIntelligenceConfigured(): void {
  requireDeepgramKey();
  requireOpenRouterKey();
}

function buildClip(
  raw: RawHighlight,
  range: ResolvedSegmentRange,
  clipUrl: string,
): Clip {
  return {
    id: randomUUID(),
    title: raw.title,
    hook: raw.hook,
    startTime: range.startSec,
    endTime: range.endSec,
    duration: range.endSec - range.startSec,
    transcript: range.transcript,
    // Round here (not in the Zod schema) — `.transform()` cannot be represented
    // in the JSON Schema the AI SDK sends to the model.
    viralScore: Math.round(raw.viralScore),
    iafitScore: Math.round(raw.iafitScore),
    viralityReason: raw.viralityReason,
    iafitReason: raw.iafitReason,
    categories: raw.categories,
    clipUrl,
    status: "completed",
  };
}

/** Fraction of the SHORTER range that overlaps; 0 when disjoint. */
function overlapFraction(
  a: ResolvedSegmentRange,
  b: ResolvedSegmentRange,
): number {
  const start = Math.max(a.startSec, b.startSec);
  const end = Math.min(a.endSec, b.endSec);
  if (end <= start) return 0;
  const overlap = end - start;
  const shorter = Math.min(a.endSec - a.startSec, b.endSec - b.startSec);
  return shorter > 0 ? overlap / shorter : 0;
}

const OVERLAP_THRESHOLD = 0.5;

/**
 * Run the full Intelligence pipeline for a job, updating its stage/state
 * in the in-memory store as it progresses. Never throws — all failures are
 * captured into the job record as status="failed" with a message.
 */
export async function runPipeline(
  jobId: string,
  input: PipelineInput,
): Promise<void> {
  try {
    updateJob(jobId, { status: "processing", stage: "transcrevendo" });
    const transcript = await transcribeVideo(input.videoUrl);

    updateJob(jobId, { stage: "identificando" });
    const raws = await selectHighlights({
      transcript,
      numHighlights: input.numHighlights,
    });

    // Resolve segment IDs → real seconds + verbatim transcript. Discard any
    // highlight whose IDs are invalid/hallucinated or out of order.
    const accepted: Array<{ raw: RawHighlight; range: ResolvedSegmentRange }> = [];
    for (const raw of raws) {
      const range = resolveSegmentRange(
        transcript,
        raw.startSegmentId,
        raw.endSegmentId,
      );
      if (!range) {
        continue;
      }
      const overlaps = accepted.some(
        (a) => overlapFraction(a.range, range) > OVERLAP_THRESHOLD,
      );
      if (overlaps) {
        continue;
      }
      accepted.push({ raw, range });
    }

    if (accepted.length === 0) {
      updateJob(jobId, {
        status: "failed",
        stage: "identificando",
        message:
          "Nenhum highlight válido foi selecionado (IDs de segmento inválidos ou sobrepostos).",
      });
      return;
    }

    updateJob(jobId, { stage: "gerando", highlights: [] });
    const clips: Clip[] = [];
    for (const { raw, range } of accepted) {
      try {
        const clipUrl = await renderHighlightToClip({
          videoUrl: input.videoUrl,
          startSec: range.startSec,
          endSec: range.endSec,
          title: raw.title,
          hook: raw.hook,
          aspectRatio: input.aspectRatio,
        });
        clips.push(buildClip(raw, range, clipUrl));
        // Incremental update so partial results survive a later render failure.
        updateJob(jobId, { highlights: [...clips] });
      } catch (err) {
        updateJob(jobId, {
          status: "failed",
          stage: "gerando",
          message: `Render do clip falhou: ${(err as Error).message}`,
        });
        return;
      }
    }

    updateJob(jobId, {
      status: "completed",
      stage: "concluido",
      highlights: clips,
    });
  } catch (err) {
    updateJob(jobId, {
      status: "failed",
      message: (err as Error).message,
    });
  }
}
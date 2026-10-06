/**
 * IAFIT Content Intelligence — LLM moment selection via OpenRouter.
 *
 * SERVER-ONLY. Reads OPENROUTER_API_KEY from the environment and must never
 * reach the browser. Reuses the Vercel AI SDK (`ai` + `@ai-sdk/openai`)
 * already installed, pointing the OpenAI provider at OpenRouter's OpenAI-
 * compatible endpoint.
 *
 * CRITICAL CONTRACT: the model NEVER invents timestamps or transcript text.
 * It receives the Deepgram transcript as segments with stable IDs and
 * returns only `{startSegmentId, endSegmentId}` per highlight. The backend
 * derives startSec/endSec/transcript deterministically (see `deepgram-client`
 * `resolveSegmentRange`). The model also returns TWO independent scores
 * (viralScore + iafitScore), categories, and separate reasons.
 */

import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { ClipCategory } from "../types";
import { IntelligenceError } from "./errors";
import type { TranscriptSegment } from "./deepgram-client";

/**
 * Isolated model constant — the Intelligence layer is where we will likely
 * benchmark models later. Do NOT spread model ids across the codebase;
 * override via OPENROUTER_MODEL env.
 */
export const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o";

function resolveModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
}

/** Allowed category values — kept in sync with `ClipCategory` in types.ts. */
const CLIP_CATEGORIES: readonly ClipCategory[] = [
  "TREINAMENTO_COMERCIAL",
  "ESTRATEGIA_CRESCIMENTO",
  "OPERACAO_IAFIT",
  "DOR_DO_CLIENTE",
  "REACAO_CLIENTE",
  "OBJECAO",
  "CASE",
];

const ClipCategoryEnum = z.enum(CLIP_CATEGORIES as [ClipCategory, ...ClipCategory[]]);

/** Schema for a single LLM-selected highlight (NO timestamps / NO transcript).
 * Scores are plain numbers (some models return 85.5); the pipeline rounds
 * them to ints. No `.transform()` here — it cannot be represented in the JSON
 * Schema the AI SDK sends to the model. */
export const RawHighlightSchema = z.object({
  title: z.string().min(1),
  hook: z.string().min(1),
  startSegmentId: z.string().min(1),
  endSegmentId: z.string().min(1),
  viralScore: z.number().min(0).max(100),
  iafitScore: z.number().min(0).max(100),
  categories: z.array(ClipCategoryEnum).default([]),
  viralityReason: z.string().min(1),
  iafitReason: z.string().min(1),
});

export const RawHighlightsSchema = z.object({
  highlights: z.array(RawHighlightSchema),
});

export type RawHighlight = z.infer<typeof RawHighlightSchema>;

/** Throws a clear error if the OpenRouter key is not configured. */
export function requireOpenRouterKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new IntelligenceError(
      "config",
      "OPENROUTER_API_KEY is not configured. Add it to the server environment.",
    );
  }
  return key;
}

function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(2).padStart(5, "0");
  return `${String(m).padStart(2, "0")}:${s}`;
}

/** Render the transcript as an IDed, timestamped list the model can reference. */
export function formatTranscriptForPrompt(transcript: TranscriptSegment[]): string {
  return transcript
    .map(
      (s) =>
        `${s.id}  ${formatTimestamp(s.start)} → ${formatTimestamp(s.end)}${
          s.speaker ? ` (speaker ${s.speaker})` : ""
        }\n${s.text}`,
    )
    .join("\n\n");
}

const SYSTEM_PROMPT = `Você é a camada de IAFIT Content Intelligence da plataforma IAFIT (foco: academias / fitness). Sua tarefa é selecionar os melhores momentos de uma transcrição de vídeo para virarem cortes verticais curtos.

TESE IAFIT:
"Você não tem um problema de conhecimento. Você tem um problema de execução. IAFIT transforma estratégia comercial em execução sistemática."

REGRA ABSOLUTA — NÃO INVENTE TIMESTAMPS NEM TRANSCRIPT:
- A transcrição é fornecida como segmentos com IDs estáveis (segment_0001, segment_0002, ...).
- Para cada highlight, selecione APENAS um startSegmentId e um endSegmentId que existam na transcrição.
- NUNCA invente IDs, números de tempo, ou texto. O backend deriva startSec/endSec/transcript a partir dos segmentos escolhidos.
- O endSegmentId deve ser posterior (ou igual) ao startSegmentId.

CRITÉRIOS DE QUALIDADE DOS CORTES (ataca diretamente "cortes aleatórios e sem nexo"):
- Duração preferencial: 20 a 90 segundos. Para vídeos curtos, selecione o melhor trecho disponível mesmo que < 20s — NÃO retorne vazio só por duração.
- Se os segmentos forem longos (> 90s cada), selecione o melhor segmento único usando startSegmentId == endSegmentId. Duração > 90s é aceitável quando o segmento inteiro é o melhor momento.
- Uma ideia central única por corte.
- Começar em uma frase compreensível — nunca no meio de um raciocínio.
- Ter hook natural + desenvolvimento.
- Terminar após uma conclusão/payoff — nunca abruptamente.
- Fazer sentido sem depender excessivamente do trecho anterior.
- Evitar repetição entre cortes.
- NÃO escolher simplesmente os momentos de maior volume emocional; escolha momentos com substância.

DOIS SCORES INDEPENDENTES (0–100):
- viralScore: hook, clareza, quebra de crença, emoção, curiosidade, força da ideia, payoff, utilidade, compartilhamento, capacidade de funcionar fora do contexto.
- iafitScore: relevância para dono/gestor de academia — vendas, atendimento, follow-up, reativação, retenção, inadimplência, execução comercial, processos, crescimento, treinamento comercial, autoridade, objeções, cases, estratégia.

CATEGORIAS (apenas estas, pode ser []): TREINAMENTO_COMERCIAL, ESTRATEGIA_CRESCIMENTO, OPERACAO_IAFIT, DOR_DO_CLIENTE, REACAO_CLIENTE, OBJECAO, CASE. Não force categoria que não se aplica.

MOTIVOS: viralityReason explica o viralScore; iafitReason explica o iafitScore. Sejam específicos.

SELEÇÃO DE N CORTES:
- Os highlights devem ser distintos e sem sobreposição significativa de tempo.
- Ordene por qualidade semântica + viralScore + iafitScore.
- Se não houver N momentos realmente bons, retorne MENOS que o solicitado. Nunca force quantidade.
- REGRA DE NÃO-VAZIO: se a transcrição contém fala utilizável, retorne PELO MENOS 1 highlight. Retornar 0 highlights (array vazio) SÓ é aceitável se a transcrição for totalmente inutilizável (só ruído/música/sem fala inteligível). Para um vídeo curto, 1 bom trecho é melhor que 0.`;

/**
 * Ask the LLM to select the most valuable moments from the transcript.
 * Returns raw highlights (segment IDs + scores + reasons); the backend
 * resolves timestamps/transcript and dedups/overlaps afterwards.
 */
export async function selectHighlights(input: {
  transcript: TranscriptSegment[];
  numHighlights: number;
}): Promise<RawHighlight[]> {
  const { transcript, numHighlights } = input;
  if (transcript.length === 0) {
    throw new IntelligenceError("client", "Transcrição vazia — nada a selecionar.");
  }
  const apiKey = requireOpenRouterKey();
  const openai = createOpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const transcriptText = formatTranscriptForPrompt(transcript);
  const basePrompt = `Selecione até ${numHighlights} momentos da transcrição abaixo, seguindo os critérios do system prompt. Responda apenas com o JSON do schema.\n\nTRANSCRIÇÃO:\n\n${transcriptText}`;
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // On retries after an empty result, nudge the model to not return [].
    const nudge =
      attempt > 1
        ? `\n\nNOTA: sua resposta anterior estava vazia (0 highlights). A transcrição contém fala utilizável. Selecione PELO MENOS 1 highlight — se necessário, use startSegmentId == endSegmentId para um único segmento. NÃO retorne array vazio.`
        : "";
    try {
      const { object } = await generateObject({
        model: openai(resolveModel()),
        schema: RawHighlightsSchema,
        system: SYSTEM_PROMPT,
        prompt: basePrompt + nudge,
      });
      // Empty result with non-empty transcript → treat as a retryable failure.
      if (object.highlights.length === 0 && transcript.length > 0) {
        lastErr = new Error("modelo retornou 0 highlights");
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 1500 * attempt));
          continue;
        }
        break; // last attempt exhausted with empty result → throw after loop
      }
      return object.highlights;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
  }
  throw new IntelligenceError(
    "upstream",
    `OpenRouter falhou ao selecionar highlights após ${MAX_ATTEMPTS} tentativas: ${(lastErr as Error).message}`,
  );
}
/**
 * Deepgram speech-to-text client for the IAFIT Intelligence layer.
 *
 * SERVER-ONLY. Reads DEEPGRAM_API_KEY from the environment and must never
 * reach the browser. Accepts a presigned GET URL of the uploaded MP4 and
 * returns transcript segments with STABLE IDs (segment_0001...) so the LLM
 * can reference moments by ID instead of inventing timestamps.
 *
 * Reference: https://developers.deepgram.com/reference/pre-recorded-transcription
 *   POST https://api.deepgram.com/v1/listen  { url, smart_format, utterances, diarize, punctuate }
 *   Authorization: Token <DEEPGRAM_API_KEY>
 */

import "server-only";

import { IntelligenceError } from "./errors";

const DEEPGRAM_URL = "https://api.deepgram.com/v1/listen";
const DEEPGRAM_TIMEOUT_MS = 10 * 60 * 1000;

const MAX_TRANSIENT_RETRIES = 3;
const RETRY_BACKOFF_MS = 2000;

/** A single transcript segment with a stable ID for LLM reference. */
export interface TranscriptSegment {
  /** Stable ID, e.g. "segment_0001". Assigned by us from utterance order. */
  id: string;
  /** Start time in seconds. */
  start: number;
  /** End time in seconds. */
  end: number;
  /** Original transcript text from Deepgram (verbatim). */
  text: string;
  /** Deepgram speaker label, when diarization is on. */
  speaker?: string;
}

/** Resolved range derived deterministically from segment IDs. */
export interface ResolvedSegmentRange {
  startSec: number;
  endSec: number;
  /** Verbatim transcript = concatenation of original segment texts. */
  transcript: string;
}

/** Throws a clear error if the Deepgram key is not configured. */
export function requireDeepgramKey(): string {
  const key = process.env.DEEPGRAM_API_KEY?.trim();
  if (!key) {
    throw new IntelligenceError(
      "config",
      "DEEPGRAM_API_KEY is not configured. Add it to the server environment.",
    );
  }
  return key;
}

function isTransient(err: unknown): boolean {
  if (err instanceof IntelligenceError) return false;
  const msg = err instanceof Error ? err.message : String(err);
  return /timeout|abort|fetch failed|econnreset|enotfound|network/i.test(msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_TRANSIENT_RETRIES; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === MAX_TRANSIENT_RETRIES) throw err;
      await sleep(RETRY_BACKOFF_MS);
    }
  }
  throw lastErr;
}

interface DeepgramWord {
  word?: string;
  punctuated_word?: string;
  start?: number;
  end?: number;
}

interface DeepgramUtterance {
  start?: number;
  end?: number;
  transcript?: string;
  speaker?: number;
  words?: DeepgramWord[];
}

interface DeepgramResult {
  results?: {
    utterances?: DeepgramUtterance[];
  };
  errorMessage?: string;
  detail?: string;
  message?: string;
}

/** Build a stable segment id like "segment_0042". */
function segmentId(index: number): string {
  return `segment_${String(index + 1).padStart(4, "0")}`;
}

/**
 * Source language for transcription. Defaults to pt-BR (IAFIT is a Brazilian
 * product); override with DEEPGRAM_LANGUAGE=en (or any Deepgram-supported
 * locale) for non-PT uploads. Without this, Deepgram assumes en-US and
 * transcribes Portuguese audio as English gibberish.
 */
function resolveLanguage(): string {
  const lang = process.env.DEEPGRAM_LANGUAGE?.trim();
  return lang || "pt-BR";
}

/** Sentence-level segmentation caps (single segments the LLM can combine). */
const MAX_SENTENCE_SEC = 25;
const MAX_SENTENCE_WORDS = 40;

function isSentenceEnd(word: string): boolean {
  return /[.!?…]$/.test(word.trim());
}

/**
 * Transcribe a video/audio URL via Deepgram's pre-recorded API.
 * Returns FINE-GRAINED sentence-level segments with stable IDs, verbatim
 * text, and speaker labels — so the LLM can pick 20-90s ranges by combining
 * adjacent ~5-15s segments (instead of being stuck with coarse speaker-turn
 * utterances of 0.5s or 150s).
 */
export async function transcribeVideo(videoUrl: string): Promise<TranscriptSegment[]> {
  if (!videoUrl) {
    throw new IntelligenceError("client", "videoUrl é obrigatório para transcrição.");
  }
  const params = new URLSearchParams({
    smart_format: "true",
    utterances: "true",
    diarize: "true",
    punctuate: "true",
    language: resolveLanguage(),
  });
  const res = await fetchWithRetry(`${DEEPGRAM_URL}?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${requireDeepgramKey()}`,
    },
    body: JSON.stringify({ url: videoUrl }),
    signal: AbortSignal.timeout(DEEPGRAM_TIMEOUT_MS),
  });
  const body = (await res.json().catch(() => null)) as DeepgramResult | null;
  if (!res.ok) {
    const msg =
      body?.errorMessage ??
      body?.detail ??
      body?.message ??
      `Deepgram request failed with HTTP ${res.status}`;
    throw new IntelligenceError("upstream", msg, { status: res.status });
  }
  const utterances = body?.results?.utterances ?? [];
  if (utterances.length === 0) {
    throw new IntelligenceError(
      "upstream",
      "Deepgram returned no utterances (empty transcript).",
    );
  }
  return buildSegments(utterances);
}

/**
 * Build sentence-level TranscriptSegments from Deepgram utterances.
 *
 * When utterances carry word-level timings (the default with utterances=true),
 * flatten all words (preserving each word's utterance speaker) and group them
 * into sentence-sized segments: close a group at sentence-ending punctuation,
 * at MAX_SENTENCE_SEC, or at MAX_SENTENCE_WORDS. This yields many short,
 * semantically-coherent segments the LLM can combine into 20-90s clips.
 *
 * Fallback: when an utterance has no word timings, emit one segment per
 * utterance (coarse speaker-turn granularity) so the transcript is never lost.
 */
function buildSegments(utterances: DeepgramUtterance[]): TranscriptSegment[] {
  const hasWords = utterances.some((u) => (u.words?.length ?? 0) > 0);
  if (!hasWords) {
    return utterances.map((u, i) => ({
      id: segmentId(i),
      start: Number(u.start ?? 0),
      end: Number(u.end ?? 0),
      text: (u.transcript ?? "").trim(),
      speaker: u.speaker !== undefined ? String(u.speaker) : undefined,
    }));
  }

  // Flatten words across utterances, carrying the utterance speaker forward.
  const allWords: Array<{ word: string; start: number; end: number; speaker?: string }> = [];
  for (const u of utterances) {
    const speaker = u.speaker !== undefined ? String(u.speaker) : undefined;
    const ws = u.words ?? [];
    if (ws.length === 0) {
      const t = (u.transcript ?? "").trim();
      if (t) {
        allWords.push({
          word: t,
          start: Number(u.start ?? 0),
          end: Number(u.end ?? 0),
          speaker,
        });
      }
      continue;
    }
    for (const w of ws) {
      const word = (w.punctuated_word ?? w.word ?? "").trim();
      if (!word) continue;
      allWords.push({
        word,
        start: Number(w.start ?? 0),
        end: Number(w.end ?? 0),
        speaker,
      });
    }
  }

  const segments: TranscriptSegment[] = [];
  let cur: { words: string[]; start: number; end: number; speaker?: string } | null = null;
  const flush = () => {
    if (!cur || cur.words.length === 0) {
      cur = null;
      return;
    }
    segments.push({
      id: segmentId(segments.length),
      start: cur.start,
      end: cur.end,
      text: cur.words.join(" "),
      speaker: cur.speaker,
    });
    cur = null;
  };
  for (const w of allWords) {
    if (!cur) {
      cur = { words: [], start: w.start, end: w.end, speaker: w.speaker };
    }
    cur.words.push(w.word);
    cur.end = w.end;
    if (cur.speaker === undefined && w.speaker !== undefined) cur.speaker = w.speaker;
    if (
      isSentenceEnd(w.word) ||
      cur.end - cur.start >= MAX_SENTENCE_SEC ||
      cur.words.length >= MAX_SENTENCE_WORDS
    ) {
      flush();
    }
  }
  flush();
  return segments;
}

/**
 * Deterministically resolve a highlight's [startSegmentId, endSegmentId]
 * into real seconds + verbatim transcript. Validates existence + order.
 * Returns null when the IDs are invalid (caller discards the highlight).
 */
/**
 * Extract the numeric index from a segment id, tolerant to padding/format.
 * Accepts `segment_0008`, `segment_008`, `segment_8`, or just `8`. Returns -1
 * if no number is found. The LLM does not always reproduce the exact
 * zero-padded `segment_NNNN` format, so we match by integer index, not by
 * exact string.
 */
function segmentIndex(id: string): number {
  const match = id.match(/(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : -1;
}

function findSegmentByIndex(
  transcript: TranscriptSegment[],
  id: string,
): number {
  // Fast path: exact string match (the common, correct case).
  const exact = transcript.findIndex((s) => s.id === id);
  if (exact !== -1) return exact;
  // Fallback: match by 1-based numeric index (segment_8 → index 7).
  const n = segmentIndex(id);
  if (n < 1) return -1;
  return transcript.findIndex((s) => segmentIndex(s.id) === n);
}

export function resolveSegmentRange(
  transcript: TranscriptSegment[],
  startSegmentId: string,
  endSegmentId: string,
): ResolvedSegmentRange | null {
  const startIndex = findSegmentByIndex(transcript, startSegmentId);
  const endIndex = findSegmentByIndex(transcript, endSegmentId);
  if (startIndex === -1 || endIndex === -1) return null;
  if (endIndex < startIndex) return null;
  const startSec = transcript[startIndex].start;
  const endSec = transcript[endIndex].end;
  if (!(endSec > startSec)) return null;
  const transcriptText = transcript
    .slice(startIndex, endIndex + 1)
    .map((s) => s.text)
    .filter(Boolean)
    .join(" ");
  return { startSec, endSec, transcript: transcriptText };
}

/** Test-only: not needed today (no cached client), but keeps symmetry. */
export function __resetDeepgramForTest(): void {
  /* no-op */
}
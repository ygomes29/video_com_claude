/**
 * sessionStorage bridge for the "Editar no Studio" flow.
 *
 * The clips page stores the selected Clip + a prebuilt editor seed
 * (base composition code / duration / fps) under namespaced keys; the
 * motion editor consumes and clears them on mount. Nothing large goes
 * into the URL.
 */

import type { Clip } from "./types";

const SELECTED_CLIP_KEY = "iafit-content-studio:selected-clip";
const EDITOR_SEED_KEY = "iafit-content-studio:editor-seed";

export interface EditorSeed {
  code: string;
  durationInFrames: number;
  fps: number;
}

function safeRead(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Persist the selected clip + editor seed for the editor to pick up. */
export function storeClipForEdit(clip: Clip, seed: EditorSeed): void {
  try {
    sessionStorage.setItem(SELECTED_CLIP_KEY, JSON.stringify(clip));
    sessionStorage.setItem(EDITOR_SEED_KEY, JSON.stringify(seed));
  } catch {
    /* sessionStorage may be full / unavailable; ignore gracefully */
  }
}

/** Read & clear the selected clip (null if absent / invalid). */
export function consumeSelectedClip(): Clip | null {
  const raw = safeRead(SELECTED_CLIP_KEY);
  safeRemove(SELECTED_CLIP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Clip;
  } catch {
    return null;
  }
}

/** Read & clear the editor seed (null if absent / invalid). */
export function consumeEditorSeed(): EditorSeed | null {
  const raw = safeRead(EDITOR_SEED_KEY);
  safeRemove(EDITOR_SEED_KEY);
  if (!raw) return null;
  try {
    const seed = JSON.parse(raw) as EditorSeed;
    if (
      typeof seed.code === "string" &&
      typeof seed.durationInFrames === "number" &&
      typeof seed.fps === "number"
    ) {
      return seed;
    }
    return null;
  } catch {
    return null;
  }
}
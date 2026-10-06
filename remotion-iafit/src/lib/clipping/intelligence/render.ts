/**
 * Local Remotion renderer for the IAFIT Intelligence layer.
 *
 * Local Intelligence Runner — V1 dogfooding only. Do not deploy as a
 * production async worker. `renderMedia` runs CPU-bound INSIDE the `next dev`
 * process (~10-30s per clip, sequential) and blocks the server event loop
 * while rendering. Acceptable for single-user local dogfooding; production
 * should move to Remotion Lambda (see the plan's "Limitations" section).
 *
 * Renders each highlight as a vertical clip (trim via OffthreadVideo
 * startFrom + objectFit cover), writes the MP4 to /tmp, uploads it to the
 * private uploads bucket, and returns a presigned GET URL = `clipUrl`.
 * The /tmp file is ALWAYS removed (try/finally), including on every error
 * path (render failure, upload failure, presign failure).
 */

import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream, statSync } from "node:fs";
import { access, unlink, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
// `bundle` lives in @remotion/bundler (4.0.481) and returns the serveUrl
// string directly. `renderMedia` + `selectComposition` are the server-side
// render surface from @remotion/renderer. Mocked in tests via vi.mock.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { AspectRatio } from "../types";
import { IntelligenceError } from "./errors";
import { uploadClipOutput } from "../s3-upload";

const ENTRY_POINT = "src/remotion/index.ts";
const COMPOSITION_ID = "ClipComposition";
const DEFAULT_FPS = 30;

/** Cached bundle serveUrl (slow to build; reuse across renders in the same process). */
let bundleCache: string | null = null;

async function ensureBundle(): Promise<string> {
  if (bundleCache) return bundleCache;
  try {
    bundleCache = await bundle({ entryPoint: ENTRY_POINT });
    return bundleCache;
  } catch (err) {
    throw new IntelligenceError(
      "upstream",
      `Falha ao empacotar composições Remotion: ${(err as Error).message}`,
    );
  }
}

/**
 * Download a remote source video to /tmp ONCE per process and return an
 * http://127.0.0.1:<port>/... URL that Remotion's OffthreadVideo proxy can
 * fetch FAST. Remotion's headless Chrome cannot read a filesystem path or a
 * file:// URL through its bundle proxy (it 404s on absolute paths and Node
 * fetch does not support file://), so we serve the downloaded file from a
 * tiny localhost HTTP server. Cached by URL so multiple clips from the same
 * source share one download. Local file paths are passed through (served too).
 *
 * DISK PERSISTENCE: after a successful download we write a `<dest>.complete`
 * marker. Before downloading we check for an existing file + marker — if
 * present, we reuse it (and skip the network). This survives dev-server
 * restarts and repeated "Analisar" clicks on the same upload (the presigned
 * GET URL, hence the hash, is stable for the 6h validity window).
 *
 * RACE-SAFE: the in-flight download PROMISE is cached, not just the resolved
 * URL, so concurrent calls for the same URL all await the SAME download
 * instead of opening two write streams on the same file and corrupting it.
 */
const localSourceCache = new Map<string, string>();
const localSourceInFlight = new Map<string, Promise<string>>();

/**
 * Extract a stable cache key from a source URL. For S3 presigned GET URLs the
 * signature/query changes every time but the object KEY (pathname) is stable,
 * so hashing the key (not the full URL) lets repeated "Analisar" clicks and
 * fresh presigned URLs reuse a download already on disk. Falls back to the
 * raw input for non-URL / unparseable values.
 */
function extractCacheKey(videoUrl: string): string {
  try {
    const u = new URL(videoUrl);
    return decodeURIComponent(u.pathname.replace(/^\//, ""));
  } catch {
    return videoUrl;
  }
}

/** Deterministic /tmp path for a given source URL (hashed by S3 key). */
function sourceDestPath(videoUrl: string): string {
  const hash = createHash("sha1").update(extractCacheKey(videoUrl)).digest("hex").slice(0, 16);
  return join(tmpdir(), `iafit-source-${hash}.mp4`);
}

/** True if a fully-downloaded source file ( + .complete marker) exists on disk. */
async function isDownloadComplete(dest: string): Promise<boolean> {
  try {
    await access(dest);
    await access(`${dest}.complete`);
    return true;
  } catch {
    return false;
  }
}

/* ---- tiny localhost HTTP server that serves downloaded source files ---- */
let sourceServer: Server | null = null;
let sourceServerPort = 0;

function ensureSourceServer(): Promise<number> {
  if (sourceServer && sourceServerPort) return Promise.resolve(sourceServerPort);
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "", "http://127.0.0.1");
      const name = basename(url.pathname);
      // Only serve files we wrote, by basename, from the OS tmpdir. Refuse
      // anything else (no path traversal, no arbitrary file reads).
      if (!name.startsWith("iafit-source-") || !name.endsWith(".mp4")) {
        res.writeHead(403).end("forbidden");
        return;
      }
      const filePath = join(tmpdir(), name);
      try {
        const stat = statSync(filePath);
        res.writeHead(200, {
          "Content-Type": "video/mp4",
          "Content-Length": stat.size,
          "Accept-Ranges": "bytes",
        });
        createReadStream(filePath).pipe(res);
      } catch {
        res.writeHead(404).end("not found");
      }
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      sourceServer = server;
      const addr = server.address();
      sourceServerPort = typeof addr === "object" && addr ? addr.port : 0;
      if (!sourceServerPort) {
        reject(new Error("failed to bind source server"));
        return;
      }
      resolve(sourceServerPort);
    });
  });
}

async function ensureLocalSource(videoUrl: string): Promise<string> {
  // Already a local path — serve it too (normalize to an http URL the proxy
  // can fetch). Accept /abs, file:///abs, or the bare basename we issued.
  let dest: string;
  if (videoUrl.startsWith("file://")) {
    dest = decodeURIComponent(videoUrl.slice("file://".length).replace(/^\/+/, "/"));
  } else if (videoUrl.startsWith("/")) {
    dest = videoUrl;
  } else if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
    dest = sourceDestPath(videoUrl);
  } else {
    dest = videoUrl;
  }

  // Serve whatever file we resolve through the localhost server.
  const port = await ensureSourceServer();
  const servedUrl = `http://127.0.0.1:${port}/${basename(dest)}`;

  // Local-path inputs: no download, just serve.
  if (!videoUrl.startsWith("http://") && !videoUrl.startsWith("https://")) {
    return servedUrl;
  }

  // Remote URL: cache by URL.
  const cached = localSourceCache.get(videoUrl);
  if (cached) return cached;
  const inFlight = localSourceInFlight.get(videoUrl);
  if (inFlight) return inFlight;

  // Disk persistence: reuse a previously-completed download (survives restart).
  if (await isDownloadComplete(dest)) {
    localSourceCache.set(videoUrl, servedUrl);
    return servedUrl;
  }

  const promise = doDownloadSource(videoUrl, dest, servedUrl);
  localSourceInFlight.set(videoUrl, promise);
  try {
    const url = await promise;
    localSourceCache.set(videoUrl, url);
    return url;
  } finally {
    localSourceInFlight.delete(videoUrl);
  }
}

async function doDownloadSource(
  videoUrl: string,
  dest: string,
  servedUrl: string,
): Promise<string> {
  let res: Response;
  try {
    // No hard timeout: AbortSignal.timeout is a WALL-CLOCK deadline that fires
    // even while data is flowing steadily — for a large source (640 MB+) that
    // aborts a perfectly healthy download mid-way. Let it take as long as it
    // needs; the underlying socket idle timeouts handle a truly stalled link.
    res = await fetch(videoUrl);
  } catch (err) {
    throw new IntelligenceError(
      "upstream",
      `Falha ao baixar vídeo-fonte: ${(err as Error).message}`,
    );
  }
  if (!res.ok || !res.body) {
    throw new IntelligenceError(
      "upstream",
      `Falha ao baixar vídeo-fonte: HTTP ${res.status}`,
    );
  }
  try {
    // `res.body` is a web ReadableStream; convert to a Node Readable for
    // pipeline. Cast across the DOM/Node ReadableStream type split (lib: dom).
    await pipeline(
      Readable.fromWeb(res.body as unknown as import("node:stream/web").ReadableStream<Uint8Array>),
      createWriteStream(dest),
    );
  } catch (err) {
    await unlink(dest).catch(() => {});
    throw new IntelligenceError(
      "upstream",
      `Falha ao gravar vídeo-fonte em /tmp: ${(err as Error).message}`,
    );
  }
  // Mark the download complete so a restart / re-analyze reuses the file.
  await writeFile(`${dest}.complete`, "").catch(() => {
    /* best-effort marker; not fatal */
  });
  return servedUrl;
}

/** Test-only: drop caches so mocks take effect between cases. */
export function __resetRenderCacheForTest(): void {
  bundleCache = null;
  localSourceCache.clear();
  localSourceInFlight.clear();
  if (sourceServer) {
    // server.close() is callback-style (returns the Server, not a Promise).
    new Promise<void>((resolve) => {
      try {
        sourceServer!.close(() => resolve());
      } catch {
        resolve();
      }
    });
    sourceServer = null;
    sourceServerPort = 0;
  }
}

export interface RenderHighlightInput {
  videoUrl: string;
  startSec: number;
  endSec: number;
  title?: string;
  hook?: string;
  aspectRatio?: AspectRatio;
}

/**
 * Render a single highlight to a vertical MP4 and upload it.
 * Returns a presigned GET URL for the rendered clip.
 */
export async function renderHighlightToClip(
  input: RenderHighlightInput,
): Promise<string> {
  const { videoUrl, startSec, endSec, title, hook, aspectRatio } = input;
  if (!videoUrl) {
    throw new IntelligenceError("client", "videoUrl é obrigatório para render.");
  }
  if (!(endSec > startSec)) {
    throw new IntelligenceError(
      "client",
      `Range inválido para render: start=${startSec} end=${endSec}.`,
    );
  }
  const serveUrl = await ensureBundle();
  // Ensure the source is locally available + served via a localhost HTTP URL
  // that Remotion's OffthreadVideo proxy can fetch fast (see ensureLocalSource).
  const localSource = await ensureLocalSource(videoUrl);
  let composition;
  try {
    composition = await selectComposition({
      serveUrl,
      id: COMPOSITION_ID,
      inputProps: {
        videoUrl: localSource,
        startSec,
        endSec,
        title,
        hook,
        aspectRatio: aspectRatio ?? "9:16",
        fps: DEFAULT_FPS,
      },
    });
  } catch (err) {
    throw new IntelligenceError(
      "upstream",
      `Falha ao resolver composição do clip: ${(err as Error).message}`,
    );
  }

  const outPath = join(tmpdir(), `clip-${randomUUID()}.mp4`);
  try {
    try {
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        outputLocation: outPath,
        // Overall render timeout — large source videos may take a while to
        // fetch + encode, especially on the first run (Chrome headless download).
        timeoutInMilliseconds: 300000,
      });
    } catch (err) {
      throw new IntelligenceError(
        "upstream",
        `Falha ao renderizar clip: ${(err as Error).message}`,
      );
    }
    // uploadClipOutput throws UploadError (aws kind) → map to IntelligenceError.
    try {
      return await uploadClipOutput(outPath);
    } catch (err) {
      throw new IntelligenceError(
        "upstream",
        (err as Error).message,
      );
    }
  } finally {
    await unlink(outPath).catch(() => {
      /* best-effort: ignore */
    });
  }
}
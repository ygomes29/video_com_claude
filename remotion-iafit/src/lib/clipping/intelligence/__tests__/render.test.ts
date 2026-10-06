import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `bundle` is exported from @remotion/bundler (returns the serveUrl string);
// `renderMedia` + `selectComposition` come from @remotion/renderer. No browser,
// no bundling, no real render in tests.
vi.mock("@remotion/bundler", () => ({
  bundle: vi.fn(),
}));
vi.mock("@remotion/renderer", () => ({
  selectComposition: vi.fn(),
  renderMedia: vi.fn(),
}));
// Mock s3-upload so uploadClipOutput does not touch S3.
vi.mock("../../s3-upload", () => ({
  uploadClipOutput: vi.fn(),
}));
// Mock fs/promises so we can assert the /tmp file is cleaned up in finally.
vi.mock("node:fs/promises", () => ({
  unlink: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" })),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));
// Mock the source-download path: no real fetch, no real file write. The render
// module also imports createReadStream + statSync for the localhost source
// server, so stub them (the handler never runs under these mocks).
vi.mock("node:fs", () => ({
  createWriteStream: vi.fn().mockReturnValue({ dummy: true }),
  createReadStream: vi.fn().mockReturnValue({ pipe: vi.fn() }),
  statSync: vi.fn(),
}));
vi.mock("node:stream/promises", () => ({
  pipeline: vi.fn().mockResolvedValue(undefined),
}));
// Mock the localhost source server: no real socket. The fake server resolves
// listen() synchronously and reports a fixed port.
vi.mock("node:http", () => {
  const makeServer = () => {
    const server = {
      listen: vi.fn().mockImplementation((_p: unknown, _h: unknown, cb?: () => void) => {
        if (cb) cb();
        return server;
      }),
      address: vi.fn().mockReturnValue({ port: 53991 }),
      on: vi.fn().mockReturnThis(),
      close: vi.fn().mockResolvedValue(undefined),
    };
    return server;
  };
  return { createServer: vi.fn().mockImplementation(makeServer) };
});

import { unlink } from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { uploadClipOutput } from "../../s3-upload";
import {
  __resetRenderCacheForTest,
  renderHighlightToClip,
} from "../render";

const BUNDLE_SERVE_URL = "/fake/serve-url";

/** A fake Response with a streaming body for ensureLocalSource. */
function fakeFetchResponse(): Response {
  return new Response("x", { status: 200, headers: { "Content-Type": "video/mp4" } });
}

describe("intelligence render — renderHighlightToClip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetRenderCacheForTest();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeFetchResponse()));
    vi.mocked(bundle).mockResolvedValue(BUNDLE_SERVE_URL);
    vi.mocked(selectComposition).mockResolvedValue({ id: "ClipComposition" } as never);
    vi.mocked(renderMedia).mockResolvedValue(undefined);
    vi.mocked(uploadClipOutput).mockResolvedValue(
      "https://example.com/clip-presigned.mp4",
    );
    vi.mocked(unlink).mockResolvedValue(undefined);
  });
  afterEach(() => {
    __resetRenderCacheForTest();
    vi.unstubAllGlobals();
  });

  it("renders + uploads + returns the presigned GET url", async () => {
    const url = await renderHighlightToClip({
      videoUrl: "https://example.com/v.mp4",
      startSec: 5,
      endSec: 35,
      title: "T",
      hook: "H",
      aspectRatio: "9:16",
    });
    expect(url).toBe("https://example.com/clip-presigned.mp4");
    expect(bundle).toHaveBeenCalledTimes(1);
    expect(selectComposition).toHaveBeenCalledTimes(1);
    expect(renderMedia).toHaveBeenCalledTimes(1);
    expect(uploadClipOutput).toHaveBeenCalledTimes(1);
  });

  it("passes Intelligence inputProps to selectComposition", async () => {
    await renderHighlightToClip({
      videoUrl: "https://example.com/v.mp4",
      startSec: 5,
      endSec: 35,
      title: "T",
      hook: "H",
      aspectRatio: "1:1",
    });
    const args = vi.mocked(selectComposition).mock.calls[0][0] as {
      id: string;
      inputProps: Record<string, unknown>;
    };
    expect(args.id).toBe("ClipComposition");
    // The remote URL is downloaded to /tmp once and served via a localhost
    // HTTP server (Remotion's proxy cannot fetch an absolute path or file://
    // URL). The composition receives that http URL, not the remote URL.
    expect(args.inputProps.videoUrl).toMatch(
      /^http:\/\/127\.0\.0\.1:\d+\/iafit-source-.*\.mp4$/,
    );
    expect(args.inputProps.startSec).toBe(5);
    expect(args.inputProps.endSec).toBe(35);
    expect(args.inputProps.aspectRatio).toBe("1:1");
  });

  it("caches the bundle across multiple renders (bundle called once)", async () => {
    await renderHighlightToClip({
      videoUrl: "https://example.com/v.mp4",
      startSec: 0,
      endSec: 10,
    });
    await renderHighlightToClip({
      videoUrl: "https://example.com/v.mp4",
      startSec: 10,
      endSec: 20,
    });
    expect(bundle).toHaveBeenCalledTimes(1);
    expect(renderMedia).toHaveBeenCalledTimes(2);
  });

  it("throws IntelligenceError upstream when renderMedia fails", async () => {
    vi.mocked(renderMedia).mockRejectedValue(new Error("chrome crashed"));
    await expect(
      renderHighlightToClip({
        videoUrl: "https://example.com/v.mp4",
        startSec: 0,
        endSec: 10,
      }),
    ).rejects.toThrow(/Render|renderizar|chrome/i);
  });

  it("throws IntelligenceError upstream when upload fails", async () => {
    vi.mocked(uploadClipOutput).mockRejectedValue(new Error("S3 put failed"));
    await expect(
      renderHighlightToClip({
        videoUrl: "https://example.com/v.mp4",
        startSec: 0,
        endSec: 10,
      }),
    ).rejects.toThrow(/S3 put|enviar clip/i);
  });

  it("throws client error for an invalid range (end <= start)", async () => {
    await expect(
      renderHighlightToClip({
        videoUrl: "https://example.com/v.mp4",
        startSec: 30,
        endSec: 30,
      }),
    ).rejects.toThrow(/Range inválido/);
  });

  it("throws client error when videoUrl is empty", async () => {
    await expect(
      renderHighlightToClip({ videoUrl: "", startSec: 0, endSec: 10 }),
    ).rejects.toThrow(/videoUrl/);
  });

  it("removes the /tmp file in finally on success", async () => {
    await renderHighlightToClip({
      videoUrl: "https://example.com/v.mp4",
      startSec: 0,
      endSec: 10,
    });
    expect(unlink).toHaveBeenCalledTimes(1);
    const tmpPath = vi.mocked(unlink).mock.calls[0][0] as string;
    expect(tmpPath).toMatch(/clip-.*\.mp4$/);
  });

  it("removes the /tmp file in finally even when upload fails", async () => {
    vi.mocked(uploadClipOutput).mockRejectedValue(new Error("S3 put failed"));
    await expect(
      renderHighlightToClip({
        videoUrl: "https://example.com/v.mp4",
        startSec: 0,
        endSec: 10,
      }),
    ).rejects.toThrow();
    expect(unlink).toHaveBeenCalledTimes(1);
    expect(String(vi.mocked(unlink).mock.calls[0][0])).toMatch(/clip-.*\.mp4$/);
  });

  it("removes the /tmp file in finally when renderMedia fails", async () => {
    vi.mocked(renderMedia).mockRejectedValue(new Error("chrome crashed"));
    await expect(
      renderHighlightToClip({
        videoUrl: "https://example.com/v.mp4",
        startSec: 0,
        endSec: 10,
      }),
    ).rejects.toThrow();
    expect(unlink).toHaveBeenCalledTimes(1);
  });
});
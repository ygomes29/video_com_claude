import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClipsApiError, createClipJob, getClipResults, getClipStatus } from "../api-client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api-client envelope handling", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("unwraps a success envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ type: "success", data: { jobId: "rid", status: "queued" } }),
      ),
    );
    const res = await createClipJob({
      videoUrl: "https://youtu.be/x",
      numHighlights: 3,
      aspectRatio: "9:16",
    });
    expect(res).toEqual({ jobId: "rid", status: "queued" });
  });

  it("throws ClipsApiError on an error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ type: "error", message: "URL do vídeo inválida." }, 500),
      ),
    );
    await expect(
      createClipJob({ videoUrl: "nope", numHighlights: 1, aspectRatio: "9:16" }),
    ).rejects.toThrow(ClipsApiError);
  });

  it("throws on a non-JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("not json", { status: 502, headers: { "Content-Type": "text/plain" } }),
      ),
    );
    await expect(getClipStatus("rid")).rejects.toThrow(ClipsApiError);
  });

  it("getClipResults unwraps clips array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ type: "success", data: { jobId: "rid", status: "completed", clips: [] } }),
      ),
    );
    const res = await getClipResults("rid");
    expect(res.status).toBe("completed");
    expect(res.clips).toEqual([]);
  });
});
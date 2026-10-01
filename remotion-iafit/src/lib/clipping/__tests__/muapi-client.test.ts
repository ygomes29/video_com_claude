import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getJobResult,
  getJobStatus,
  MuApiError,
  requireApiKey,
  submitClipJob,
} from "../muapi-client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const VALID_PARAMS = {
  videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  numHighlights: 5,
  aspectRatio: "9:16" as const,
};

describe("muapi-client", () => {
  beforeEach(() => {
    process.env.MUAPI_API_KEY = "test-key";
    delete process.env.MUAPI_BASE_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.MUAPI_API_KEY;
  });

  // Case: MUAPI_API_KEY ausente.
  describe("requireApiKey", () => {
    it("throws MuApiError when the key is missing", () => {
      delete process.env.MUAPI_API_KEY;
      expect(() => requireApiKey()).toThrow(MuApiError);
      expect(() => requireApiKey()).toThrow(/MUAPI_API_KEY/);
    });

    it("throws when the key is only whitespace", () => {
      process.env.MUAPI_API_KEY = "   ";
      expect(() => requireApiKey()).toThrow(MuApiError);
    });

    it("returns the key when configured", () => {
      expect(requireApiKey()).toBe("test-key");
    });
  });

  describe("submitClipJob", () => {
    it("returns the submission on success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () =>
          jsonResponse({ request_id: "rid_abc", status: "queued", cost: 1 }),
        ),
      );
      const sub = await submitClipJob(VALID_PARAMS);
      expect(sub.request_id).toBe("rid_abc");
      expect(sub.status).toBe("queued");

      // Asserts the request was authenticated server-side.
      const init = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(init.headers["x-api-key"]).toBe("test-key");
      const payload = JSON.parse(init.body);
      expect(payload.video_url).toBe(VALID_PARAMS.videoUrl);
      expect(payload.num_highlights).toBe(5);
      expect(payload.aspect_ratio).toBe("9:16");
    });

    it("throws MuApiError when request_id is missing", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () => jsonResponse({})),
      );
      await expect(submitClipJob(VALID_PARAMS)).rejects.toThrow(MuApiError);
      await expect(submitClipJob(VALID_PARAMS)).rejects.toThrow(/request_id/);
    });

    // Case: MuAPI 4xx.
    it("throws MuApiError with status 400 on a 4xx response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () =>
          jsonResponse({ message: "bad video url" }, 400),
        ),
      );
      await expect(submitClipJob(VALID_PARAMS)).rejects.toMatchObject({
        name: "MuApiError",
        status: 400,
      });
    });

    // Case: MuAPI 5xx.
    it("throws MuApiError with status 500 on a 5xx response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () =>
          jsonResponse({ error: "boom" }, 502),
        ),
      );
      await expect(submitClipJob(VALID_PARAMS)).rejects.toMatchObject({
        name: "MuApiError",
        status: 502,
      });
    });

    // Case: JSON inesperado (non-JSON body).
    it("throws MuApiError when the body is not valid JSON", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () =>
          new Response("<html>gateway error</html>", {
            status: 200,
            headers: { "Content-Type": "text/html" },
          }),
        ),
      );
      await expect(submitClipJob(VALID_PARAMS)).rejects.toThrow(MuApiError);
      await expect(submitClipJob(VALID_PARAMS)).rejects.toThrow(/non-JSON/);
    });

    // Case: timeout (transient) → retried, then succeeds.
    it("retries on a transient timeout error and succeeds", async () => {
      vi.useFakeTimers();
      let calls = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () => {
          calls++;
          if (calls === 1) throw new TypeError("fetch failed: timeout");
          return jsonResponse({ request_id: "rid_ok", status: "queued" });
        }),
      );

      const pending = submitClipJob(VALID_PARAMS);
      // Flush the retry backoff sleep.
      await vi.advanceTimersByTimeAsync(3000);
      const sub = await pending;

      expect(sub.request_id).toBe("rid_ok");
      expect(calls).toBe(2);
    });

    it("does NOT retry on non-transient errors (throws immediately)", async () => {
      let calls = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () => {
          calls++;
          throw new Error("something totally unexpected");
        }),
      );
      await expect(submitClipJob(VALID_PARAMS)).rejects.toThrow("something totally unexpected");
      expect(calls).toBe(1);
    });
  });

  describe("getJobResult / getJobStatus", () => {
    // Case: status processing.
    it("reports processing while the job is still running", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () =>
          jsonResponse({ id: "rid_abc", status: "processing" }),
        ),
      );
      expect(await getJobStatus("rid_abc")).toBe("processing");
      const result = await getJobResult("rid_abc");
      expect(result.status).toBe("processing");
    });

    // Case: status success.
    it("reports completed when MuAPI says succeeded/completed", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () =>
          jsonResponse({ id: "rid_abc", status: "completed", shorts: [] }),
        ),
      );
      expect(await getJobStatus("rid_abc")).toBe("completed");
    });

    // Case: status failed.
    it("reports failed when MuAPI returns an error/failed status", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async () =>
          jsonResponse({ id: "rid_abc", status: "failed", error: "render" }),
        ),
      );
      expect(await getJobStatus("rid_abc")).toBe("failed");
    });

    it("throws when jobId is empty", async () => {
      await expect(getJobResult("")).rejects.toThrow(MuApiError);
    });
  });
});
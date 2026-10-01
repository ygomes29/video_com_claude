import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateClipSchema, POST } from "../create/route";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/clips/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readEnvelope(res: Response): Promise<{ type: string; data?: unknown; message?: string }> {
  return (await res.json()) as { type: string; data?: unknown; message?: string };
}

describe("POST /api/clips/create (schema validation)", () => {
  it("applies defaults for optional fields", () => {
    const parsed = CreateClipSchema.parse({ videoUrl: "https://youtu.be/x" });
    expect(parsed.numHighlights).toBe(5);
    expect(parsed.aspectRatio).toBe("9:16");
    expect(parsed.returnCoordinatesOnly).toBe(false);
  });

  // Case: URL inválida.
  it("rejects an invalid URL at the schema layer", () => {
    expect(() => CreateClipSchema.parse({ videoUrl: "not-a-url" })).toThrow();
    expect(() => CreateClipSchema.parse({ videoUrl: "ftp://x" })).toThrow();
  });
});

describe("POST /api/clips/create (route handler)", () => {
  beforeEach(() => {
    process.env.MUAPI_API_KEY = "test-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MUAPI_API_KEY;
  });

  // Case: URL inválida (end-to-end via executeApi → 500 error envelope).
  it("returns a 500 error envelope for an invalid URL", async () => {
    const res = await POST(postRequest({ videoUrl: "not-a-url" }));
    expect(res.status).toBe(500);
    const env = await readEnvelope(res);
    expect(env.type).toBe("error");
    expect(env.message).toMatch(/URL/i);
  });

  // Case: MUAPI_API_KEY ausente (end-to-end → 500 error envelope).
  it("returns a 500 error envelope when the API key is missing", async () => {
    delete process.env.MUAPI_API_KEY;
    const res = await POST(
      postRequest({ videoUrl: "https://youtu.be/x", numHighlights: 3, aspectRatio: "9:16" }),
    );
    expect(res.status).toBe(500);
    const env = await readEnvelope(res);
    expect(env.type).toBe("error");
    expect(env.message).toMatch(/MUAPI_API_KEY/);
  });

  it("returns jobId + status on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ request_id: "rid_ok", status: "queued" }),
      ),
    );
    const res = await POST(
      postRequest({ videoUrl: "https://youtu.be/x", numHighlights: 3, aspectRatio: "9:16" }),
    );
    expect(res.status).toBe(200);
    const env = await readEnvelope(res);
    expect(env.type).toBe("success");
    expect(env.data).toEqual({ jobId: "rid_ok", status: "queued" });
  });
});
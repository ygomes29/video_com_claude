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

async function readEnvelope(
  res: Response,
): Promise<{ type: string; data?: unknown; message?: string }> {
  return (await res.json()) as { type: string; data?: unknown; message?: string };
}

describe("POST /api/clips/create (schema validation)", () => {
  it("applies defaults for optional fields", () => {
    const parsed = CreateClipSchema.parse({ videoUrl: "https://youtu.be/x" });
    expect(parsed.numHighlights).toBe(5);
    expect(parsed.aspectRatio).toBe("9:16");
    expect(parsed.returnCoordinatesOnly).toBe(false);
  });

  // Case: URL inválida (schema layer).
  it("rejects an invalid URL at the schema layer", () => {
    expect(() => CreateClipSchema.parse({ videoUrl: "not-a-url" })).toThrow();
    expect(() => CreateClipSchema.parse({ videoUrl: "ftp://x" })).toThrow();
  });

  it("rejects numHighlights out of range", () => {
    expect(() =>
      CreateClipSchema.parse({ videoUrl: "https://youtu.be/x", numHighlights: 0 }),
    ).toThrow();
    expect(() =>
      CreateClipSchema.parse({ videoUrl: "https://youtu.be/x", numHighlights: 16 }),
    ).toThrow();
  });

  it("rejects an invalid aspectRatio", () => {
    expect(() =>
      CreateClipSchema.parse({ videoUrl: "https://youtu.be/x", aspectRatio: "16:9" }),
    ).toThrow();
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

  // Case: URL inválida → 400 (client error, NOT 500).
  it("returns 400 for an invalid URL", async () => {
    const res = await POST(postRequest({ videoUrl: "not-a-url" }));
    expect(res.status).toBe(400);
    const env = await readEnvelope(res);
    expect(env.type).toBe("error");
    expect(env.message).toMatch(/URL/i);
  });

  it("returns 400 for numHighlights out of range", async () => {
    const res = await POST(
      postRequest({ videoUrl: "https://youtu.be/x", numHighlights: 99 }),
    );
    expect(res.status).toBe(400);
    const env = await readEnvelope(res);
    expect(env.type).toBe("error");
  });

  it("returns 400 for an invalid aspectRatio", async () => {
    const res = await POST(
      postRequest({ videoUrl: "https://youtu.be/x", aspectRatio: "16:9" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/clips/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  // Case: MUAPI_API_KEY ausente → 503 (service unavailable, NOT 500).
  it("returns 503 when the API key is missing", async () => {
    delete process.env.MUAPI_API_KEY;
    const res = await POST(
      postRequest({
        videoUrl: "https://youtu.be/x",
        numHighlights: 3,
        aspectRatio: "9:16",
      }),
    );
    expect(res.status).toBe(503);
    const env = await readEnvelope(res);
    expect(env.type).toBe("error");
    expect(env.message).toMatch(/MUAPI_API_KEY/);
  });

  it("returns jobId + status on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        jsonResponse({ request_id: "rid_ok", status: "queued" }),
      ),
    );
    const res = await POST(
      postRequest({
        videoUrl: "https://youtu.be/x",
        numHighlights: 3,
        aspectRatio: "9:16",
      }),
    );
    expect(res.status).toBe(200);
    const env = await readEnvelope(res);
    expect(env.type).toBe("success");
    expect(env.data).toEqual({ jobId: "rid_ok", status: "queued" });
  });

  // Case: MuAPI 4xx upstream → 502 Bad Gateway.
  it("returns 502 when MuAPI responds 4xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () =>
        jsonResponse({ message: "bad video url" }, 400),
      ),
    );
    const res = await POST(
      postRequest({
        videoUrl: "https://youtu.be/x",
        numHighlights: 3,
        aspectRatio: "9:16",
      }),
    );
    expect(res.status).toBe(502);
  });

  // Case: MuAPI 5xx upstream → 502 Bad Gateway.
  it("returns 502 when MuAPI responds 5xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => jsonResponse({ error: "boom" }, 502)),
    );
    const res = await POST(
      postRequest({
        videoUrl: "https://youtu.be/x",
        numHighlights: 3,
        aspectRatio: "9:16",
      }),
    );
    expect(res.status).toBe(502);
  });
});
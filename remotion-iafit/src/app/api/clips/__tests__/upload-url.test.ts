import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Exercise the REAL s3-upload layer + route together, mocking only the
// presigner (no network). This validates the full error→HTTP mapping the
// route implements (client→400, config→503, aws→502) against the real
// UploadError class, so instanceof checks are genuine.
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  __resetUploadClientForTest,
  type UploadGrant,
} from "../../../../lib/clipping/s3-upload";
import { POST, UploadUrlSchema } from "../upload-url/route";

const mockedGetSignedUrl = vi.mocked(getSignedUrl);

const ENV = {
  REMOTION_AWS_ACCESS_KEY_ID: "AKIATEST",
  REMOTION_AWS_SECRET_ACCESS_KEY: "secrettest",
  CLIPS_UPLOAD_BUCKET: "iafit-clips-uploads",
};

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/clips/upload-url", {
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

describe("POST /api/clips/upload-url (schema validation)", () => {
  it("requires contentType + size", () => {
    expect(() => UploadUrlSchema.parse({ size: 10 })).toThrow();
    expect(() => UploadUrlSchema.parse({ contentType: "video/mp4" })).toThrow();
  });

  it("rejects a non-positive size", () => {
    expect(() =>
      UploadUrlSchema.parse({ contentType: "video/mp4", size: 0 }),
    ).toThrow();
    expect(() =>
      UploadUrlSchema.parse({ contentType: "video/mp4", size: -1 }),
    ).toThrow();
  });
});

describe("POST /api/clips/upload-url (route handler)", () => {
  beforeEach(() => {
    __resetUploadClientForTest();
    for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
    mockedGetSignedUrl.mockReset();
    mockedGetSignedUrl.mockImplementation(
      async (_c: unknown, cmd: { constructor: { name: string } }) =>
        cmd.constructor.name === "PutObjectCommand"
          ? "https://s3.test/put"
          : "https://s3.test/get",
    );
  });

  afterEach(() => {
    for (const k of Object.keys(ENV)) delete process.env[k];
    vi.unstubAllGlobals();
  });

  it("returns 400 for a non-JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/clips/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for a missing field", async () => {
    const res = await POST(postRequest({ contentType: "video/mp4" }));
    expect(res.status).toBe(400);
    const env = await readEnvelope(res);
    expect(env.type).toBe("error");
  });

  it("returns 400 for an unsupported content type", async () => {
    const res = await POST(postRequest({ contentType: "text/html", size: 100 }));
    expect(res.status).toBe(400);
    const env = await readEnvelope(res);
    expect(env.message).toMatch(/não suportado/i);
  });

  it("returns 400 when the file is too large", async () => {
    const res = await POST(
      postRequest({ contentType: "video/mp4", size: 10_000_000_000 }),
    );
    expect(res.status).toBe(400);
    const env = await readEnvelope(res);
    expect(env.message).toMatch(/grande/i);
  });

  it("returns 503 when AWS creds / bucket are not configured", async () => {
    delete process.env.REMOTION_AWS_ACCESS_KEY_ID;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.CLIPS_UPLOAD_BUCKET;
    const res = await POST(
      postRequest({ contentType: "video/mp4", size: 1000 }),
    );
    expect(res.status).toBe(503);
    const env = await readEnvelope(res);
    expect(env.message).toMatch(/CLIPS_UPLOAD_BUCKET|ausentes/i);
  });

  it("returns 502 when presigning fails", async () => {
    mockedGetSignedUrl.mockReset();
    mockedGetSignedUrl.mockRejectedValue(new Error("signing boom"));
    const res = await POST(
      postRequest({ contentType: "video/mp4", size: 1000 }),
    );
    expect(res.status).toBe(502);
  });

  it("returns the presigned grant on success", async () => {
    const res = await POST(
      postRequest({ contentType: "video/mp4", size: 5_000_000 }),
    );
    expect(res.status).toBe(200);
    const env = await readEnvelope(res);
    expect(env.type).toBe("success");
    const data = env.data as UploadGrant;
    expect(data.key).toMatch(/^uploads\/[0-9a-f-]{36}\.mp4$/);
    expect(data.uploadUrl).toBe("https://s3.test/put");
    expect(data.videoUrl).toBe("https://s3.test/get");
  });
});
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the presigner so no real signing/network happens. The client +
// command classes from @aws-sdk/client-s3 are real (they do no I/O on their
// own); only getSignedUrl is stubbed.
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  __resetUploadClientForTest,
  createUploadRequest,
  UploadError,
} from "../s3-upload";

const mockedGetSignedUrl = vi.mocked(getSignedUrl);

const ENV = {
  REMOTION_AWS_ACCESS_KEY_ID: "AKIATEST",
  REMOTION_AWS_SECRET_ACCESS_KEY: "secrettest",
  CLIPS_UPLOAD_BUCKET: "iafit-clips-uploads",
};

beforeEach(() => {
  __resetUploadClientForTest();
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
  mockedGetSignedUrl.mockReset();
  // Distinguish PUT vs GET by the command constructor name.
  mockedGetSignedUrl.mockImplementation(
    async (_client: unknown, cmd: { constructor: { name: string } }) =>
      cmd.constructor.name === "PutObjectCommand"
        ? "https://s3.test/put/KEY"
        : "https://s3.test/get/KEY",
  );
});

afterEach(() => {
  for (const k of Object.keys(ENV)) delete process.env[k];
  delete process.env.CLIPS_UPLOAD_MAX_BYTES;
  delete process.env.CLIPS_UPLOAD_GET_EXPIRY_SECONDS;
});

describe("createUploadRequest", () => {
  it("issues presigned PUT + GET with a uploads/<uuid>.ext key", async () => {
    const grant = await createUploadRequest({
      contentType: "video/mp4",
      size: 5_000_000,
    });
    expect(grant.key).toMatch(/^uploads\/[0-9a-f-]{36}\.mp4$/);
    expect(grant.uploadUrl).toBe("https://s3.test/put/KEY");
    expect(grant.videoUrl).toBe("https://s3.test/get/KEY");

    // First call = PUT (10 min), second = GET (6h default).
    expect(mockedGetSignedUrl).toHaveBeenCalledTimes(2);
    expect(mockedGetSignedUrl.mock.calls[0][2]).toEqual({ expiresIn: 600 });
    expect(mockedGetSignedUrl.mock.calls[1][2]).toEqual({ expiresIn: 21600 });
  });

  it("maps quicktime to a .mov extension", async () => {
    const grant = await createUploadRequest({
      contentType: "video/quicktime",
      size: 1_000,
    });
    expect(grant.key).toMatch(/^uploads\/[0-9a-f-]{36}\.mov$/);
  });

  it("rejects an unsupported content type (client error, before creds check)", async () => {
    delete process.env.REMOTION_AWS_ACCESS_KEY_ID;
    delete process.env.CLIPS_UPLOAD_BUCKET;
    await expect(
      createUploadRequest({ contentType: "text/html", size: 100 }),
    ).rejects.toMatchObject({ name: "UploadError", kind: "client" });
    expect(mockedGetSignedUrl).not.toHaveBeenCalled();
  });

  it("rejects a non-positive / invalid size", async () => {
    await expect(
      createUploadRequest({ contentType: "video/mp4", size: 0 }),
    ).rejects.toMatchObject({ kind: "client" });
    await expect(
      createUploadRequest({ contentType: "video/mp4", size: -5 }),
    ).rejects.toMatchObject({ kind: "client" });
    await expect(
      createUploadRequest({ contentType: "video/mp4", size: NaN }),
    ).rejects.toMatchObject({ kind: "client" });
  });

  it("rejects a size over CLIPS_UPLOAD_MAX_BYTES", async () => {
    process.env.CLIPS_UPLOAD_MAX_BYTES = "1000";
    await expect(
      createUploadRequest({ contentType: "video/mp4", size: 2000 }),
    ).rejects.toMatchObject({ kind: "client" });
  });

  it("throws a config error when AWS creds are missing", async () => {
    delete process.env.REMOTION_AWS_ACCESS_KEY_ID;
    delete process.env.AWS_ACCESS_KEY_ID;
    await expect(
      createUploadRequest({ contentType: "video/mp4", size: 1000 }),
    ).rejects.toMatchObject({ kind: "config" });
  });

  it("throws a config error when CLIPS_UPLOAD_BUCKET is missing", async () => {
    delete process.env.CLIPS_UPLOAD_BUCKET;
    await expect(
      createUploadRequest({ contentType: "video/mp4", size: 1000 }),
    ).rejects.toMatchObject({ kind: "config" });
  });

  it("falls back to AWS_* env vars when REMOTION_* are absent", async () => {
    delete process.env.REMOTION_AWS_ACCESS_KEY_ID;
    delete process.env.REMOTION_AWS_SECRET_ACCESS_KEY;
    process.env.AWS_ACCESS_KEY_ID = "AKIAFALLBACK";
    process.env.AWS_SECRET_ACCESS_KEY = "secretfallback";
    const grant = await createUploadRequest({
      contentType: "video/mp4",
      size: 1000,
    });
    expect(grant.key).toMatch(/^uploads\//);
  });

  it("wraps a presigner failure as an aws error", async () => {
    mockedGetSignedUrl.mockReset();
    mockedGetSignedUrl.mockRejectedValue(new Error("signing boom"));
    await expect(
      createUploadRequest({ contentType: "video/mp4", size: 1000 }),
    ).rejects.toMatchObject({ kind: "aws" });
  });

  it("honors a custom GET expiry env override", async () => {
    process.env.CLIPS_UPLOAD_GET_EXPIRY_SECONDS = "3600";
    await createUploadRequest({ contentType: "video/mp4", size: 1000 });
    expect(mockedGetSignedUrl.mock.calls[1][2]).toEqual({ expiresIn: 3600 });
  });
});

describe("UploadError", () => {
  it("carries its kind + name", () => {
    const e = new UploadError("config", "nope");
    expect(e.kind).toBe("config");
    expect(e.name).toBe("UploadError");
    expect(e.message).toBe("nope");
  });
});
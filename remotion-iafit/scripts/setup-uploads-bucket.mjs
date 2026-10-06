#!/usr/bin/env node
/**
 * One-time setup for the Cortes upload bucket (S3, private, presigned).
 *
 * Node equivalent of setup-uploads-bucket.sh — reuses the AWS creds already
 * in remotion-iafit/.env.local (REMOTION_AWS_ACCESS_KEY_ID /
 * REMOTION_AWS_SECRET_ACCESS_KEY) and the @aws-sdk/client-s3 already
 * installed, so no `aws` CLI is required.
 *
 * Run it yourself — Claude does NOT create AWS resources for you. No secrets
 * are printed. Then add to .env.local:
 *   CLIPS_UPLOAD_BUCKET=iafit-clips-uploads
 *
 * Usage:  node scripts/setup-uploads-bucket.mjs
 */
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketLifecycleConfigurationCommand,
  PutPublicAccessBlockCommand,
  S3ServiceException,
  S3Client,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { createInterface } from "node:readline/promises";

dotenv.config({ path: ".env.local" });

const BUCKET = process.env.CLIPS_UPLOAD_BUCKET || "iafit-clips-uploads";
const REGION =
  process.env.CLIPS_UPLOAD_REGION ||
  process.env.REMOTION_AWS_REGION ||
  process.env.AWS_REGION ||
  "us-east-1";
// Origins allowed to PUT to S3 from the browser. Add your prod origin here.
const ORIGINS = ["http://localhost:3001", "http://localhost:3000"];

const accessKeyId =
  process.env.REMOTION_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey =
  process.env.REMOTION_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  console.error(
    "ERROR: AWS creds not found. Set REMOTION_AWS_ACCESS_KEY_ID + REMOTION_AWS_SECRET_ACCESS_KEY in remotion-iafit/.env.local",
  );
  process.exit(1);
}

const s3 = new S3Client({
  region: REGION,
  credentials: { accessKeyId, secretAccessKey },
});

async function bucketExists() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    return true;
  } catch (e) {
    if (e instanceof S3ServiceException && e.$metadata?.httpStatusCode === 404)
      return false;
    if (e instanceof S3ServiceException && e.name === "NotFound") return false;
    throw e;
  }
}

async function main() {
  console.log(`==> Region: ${REGION}`);
  console.log(`==> Bucket: s3://${BUCKET}`);

  if (await bucketExists()) {
    console.log("    bucket already exists, skipping creation");
  } else {
    console.log("    creating private bucket...");
    const create =
      REGION === "us-east-1"
        ? new CreateBucketCommand({ Bucket: BUCKET })
        : new CreateBucketCommand({
            Bucket: BUCKET,
            CreateBucketConfiguration: { LocationConstraint: REGION },
          });
    await s3.send(create);
    console.log("    created");
  }

  console.log("==> Blocking all public access (bucket stays private)");
  await s3.send(
    new PutPublicAccessBlockCommand({
      Bucket: BUCKET,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true,
      },
    }),
  );

  console.log(`==> CORS policy (allows browser PUT from ${ORIGINS.join(", ")})`);
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ORIGINS,
            AllowedMethods: ["PUT"],
            AllowedHeaders: ["Content-Type", "Content-Length"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    }),
  );

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ans = await rl
    .question("Add a lifecycle rule to auto-delete uploads/ after 7 days? [y/N] ")
    .finally(() => rl.close());
  if (/^[yY]$/.test(ans.trim())) {
    await s3.send(
      new PutBucketLifecycleConfigurationCommand({
        Bucket: BUCKET,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: "expire-uploads",
              Status: "Enabled",
              Filter: { Prefix: "uploads/" },
              Expiration: { Days: 7 },
            },
          ],
        },
      }),
    );
    console.log("    lifecycle rule added (expire uploads/ after 7 days)");
  } else {
    console.log("    lifecycle skipped (you can add it later)");
  }

  console.log("\nDone. Add to remotion-iafit/.env.local:");
  console.log(`  CLIPS_UPLOAD_BUCKET=${BUCKET}`);
  console.log(
    "(AWS creds reused from REMOTION_AWS_ACCESS_KEY_ID / REMOTION_AWS_SECRET_ACCESS_KEY.)",
  );
}

main().catch((err) => {
  console.error("Setup failed:", err?.name, err?.message ?? err);
  process.exit(1);
});
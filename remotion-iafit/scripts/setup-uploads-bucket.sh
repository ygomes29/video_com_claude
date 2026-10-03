#!/usr/bin/env bash
#
# One-time setup for the Cortes upload bucket (S3, private, presigned).
#
# The Cortes module uploads local MP4s directly from the browser to a private
# S3 bucket via a presigned PUT URL, then hands a presigned GET URL to MuAPI.
# This script creates that bucket and applies the CORS + public-access-block
# (and optional lifecycle) policies the feature needs.
#
# Run it yourself — Claude does NOT create AWS resources for you. No secrets
# are written by this script; it only uses your configured `aws` CLI creds.
#
# Usage:
#   bash scripts/setup-uploads-bucket.sh
#
# Requirements: `aws` CLI v2 with credentials that can create buckets +
# set policies in us-east-1 (or set --region below). Then add to .env.local:
#   CLIPS_UPLOAD_BUCKET=iafit-clips-uploads
#
set -euo pipefail

BUCKET="${CLIPS_UPLOAD_BUCKET:-iafit-clips-uploads}"
REGION="${REMOTION_AWS_REGION:-us-east-1}"
# Origins allowed to PUT to S3 from the browser. Add your prod origin here.
ORIGINS=(
  "http://localhost:3001"
  "http://localhost:3000"
)

echo "==> Creating private bucket s3://${BUCKET} in ${REGION} (if needed)"
if ! aws s3api head-bucket --bucket "${BUCKET}" --region "${REGION}" 2>/dev/null; then
  if [ "${REGION}" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "${BUCKET}" --region "${REGION}"
  else
    aws s3api create-bucket \
      --bucket "${BUCKET}" \
      --region "${REGION}" \
      --create-bucket-configuration "LocationConstraint=${REGION}"
  fi
else
  echo "    bucket already exists, skipping creation"
fi

echo "==> Blocking all public access (bucket stays private)"
aws s3api put-public-access-block \
  --bucket "${BUCKET}" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --region "${REGION}"

echo "==> Applying CORS policy (allows browser PUT + Content-Type header)"
ORIGINS_JSON=$(printf '%s\n' "${ORIGINS[@]}" | jq -R . | jq -s .)
aws s3api put-bucket-cors \
  --bucket "${BUCKET}" \
  --cors-configuration "$(cat <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ${ORIGINS_JSON},
      "AllowedMethods": ["PUT"],
      "AllowedHeaders": ["Content-Type", "Content-Length"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
)" \
  --region "${REGION}"

echo "==> (optional) Lifecycle: expire uploads/ after 7 days"
read -r -p "Add a lifecycle rule to auto-delete uploads after 7 days? [y/N] " ans
if [[ "${ans}" =~ ^[Yy]$ ]]; then
  aws s3api put-bucket-lifecycle-configuration \
    --bucket "${BUCKET}" \
    --lifecycle-configuration "$(cat <<EOF
{
  "Rules": [
    {
      "ID": "expire-uploads",
      "Status": "Enabled",
      "Filter": { "Prefix": "uploads/" },
      "Expiration": { "Days": 7 }
    }
  ]
}
EOF
)" \
    --region "${REGION}"
  echo "    lifecycle rule added"
else
  echo "    skipped (you can add it later)"
fi

echo
echo "Done. Add to remotion-iafit/.env.local:"
echo "  CLIPS_UPLOAD_BUCKET=${BUCKET}"
echo "(AWS creds are reused from REMOTION_AWS_ACCESS_KEY_ID / REMOTION_AWS_SECRET_ACCESS_KEY.)"
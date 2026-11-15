import { createHash, createHmac } from "crypto";
import fs from "fs/promises";
import path from "path";

const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const hmac = (key, value, encoding) => createHmac("sha256", key).update(value).digest(encoding);

function s3Config() {
  const { AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
  if (!AWS_REGION || !S3_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error("S3 storage requires AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
  }
  return { region: AWS_REGION, bucket: S3_BUCKET, accessKey: AWS_ACCESS_KEY_ID, secretKey: AWS_SECRET_ACCESS_KEY };
}

async function s3Request(method, key, body) {
  const config = s3Config();
  const host = `${config.bucket}.s3.${config.region}.amazonaws.com`;
  const uri = `/${key.split("/").map(encodeURIComponent).join("/")}`;
  const url = `https://${host}${uri}`;
  const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const day = date.slice(0, 8);
  const payloadHash = sha256(body || Buffer.alloc(0));
  const headers = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": date,
  };
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${date}\n`;
  const canonicalRequest = [method, uri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${day}/${config.region}/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${date}\n${scope}\n${sha256(canonicalRequest)}`;
  const dateKey = hmac(`AWS4${config.secretKey}`, day);
  const regionKey = hmac(dateKey, config.region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  headers.authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${hmac(signingKey, stringToSign, "hex")}`;
  const response = await fetch(url, { method, headers, body: method === "PUT" ? body : undefined });
  if (!response.ok) throw new Error(`S3 ${method} failed with status ${response.status}`);
  return response;
}

const objectKey = (ownerId, storedName) => `${ownerId}/${storedName}`;

export async function storeEncryptedFile(ownerId, storedName, localPath) {
  if (driver !== "s3") return;
  await s3Request("PUT", objectKey(ownerId, storedName), await fs.readFile(localPath));
  await fs.unlink(localPath);
}

export async function sendEncryptedFile(ownerId, storedName, res) {
  if (driver === "s3") {
    const response = await s3Request("GET", objectKey(ownerId, storedName));
    res.set("Content-Type", "application/octet-stream");
    res.set("Cache-Control", "no-store");
    res.send(Buffer.from(await response.arrayBuffer()));
    return;
  }
  res.set("Content-Type", "application/octet-stream");
  res.set("Cache-Control", "no-store");
  res.sendFile(path.resolve("uploads", storedName));
}

export async function removeEncryptedFile(ownerId, storedName) {
  if (driver === "s3") {
    await s3Request("DELETE", objectKey(ownerId, storedName));
    return;
  }
  await fs.unlink(path.resolve("uploads", storedName)).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

export const storageDriver = driver;
